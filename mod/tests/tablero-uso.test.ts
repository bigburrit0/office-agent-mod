import { expect, mock, test } from 'claude-code/testing'

import { PANES, PROPS, PANE, fsFalso, textosDe } from './ayuda-tablero'

const USO = {
  startedAt: 0,
  context: { window: 200000, tokens: 126000, percent: 63 },
  rateLimits: [
    { kind: 'seven_day', percentUsed: 18, resetsAt: '2026-10-12T12:00:00Z' },
    { kind: 'five_hour', percentUsed: 42.5, resetsAt: '2026-10-06T18:30:00Z' },
  ],
}

async function montarUso($: any, on: any, uso: unknown, surface: 'terminal' | 'desktop' = 'desktop') {
  fsFalso(on)
  const clock = mock.clock(on, { now: 1_000_000 })
  on('agent.list', () => ({ value: [] }))
  on('ui.panes', () => ({ value: PANES }))
  let pedidos = 0
  on('session.usage', () => {
    pedidos += 1
    return { value: uso }
  })
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface,
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 60 },
  })
  await clock.advance(2000)
  await ui.redraw()
  return { ui, clock, pedidos: () => pedidos }
}

const linea = async (ui: any, patron: RegExp): Promise<string> => {
  // Cada fila del uso es un Box con varios Text; su `text` los junta.
  const filas = (await ui.findAll({ type: 'Box' })).filter((b: any) => /^uso-(?!sesion)/.test(String(b.key ?? '')))
  for (const f of filas) {
    const texto = String(f.text ?? '')
    if (patron.test(texto)) return texto
  }
  return ''
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`uso de la sesión: 5 horas y semanal con barra, porcentaje y renovación (${surface})`, async ($, on) => {
    const { ui, pedidos } = await montarUso($, on, USO, surface)
    expect(pedidos()).toBe(1)
    const cinco = await linea(ui, /^5 horas/)
    expect(cinco.includes('42,5 %')).toBe(true)
    expect(cinco.includes('█'.repeat(9))).toBe(true)
    expect(cinco.includes('se renueva')).toBe(true)
    const semanal = await linea(ui, /^Semanal/)
    expect(semanal.includes('18 %')).toBe(true)
    expect((await linea(ui, /^Contexto/)).includes('63 %')).toBe(true)
    // 5 horas va antes que la semanal aunque el motor las mande al revés.
    const claves = (await ui.findAll({ type: 'Box' })).map((b: any) => String(b.key ?? ''))
    expect(claves.indexOf('uso-five_hour') >= 0 && claves.indexOf('uso-five_hour') < claves.indexOf('uso-seven_day')).toBe(true)
  })
}

test('uso de la sesión: el desplegable arranca abierto y se cierra', async ($, on) => {
  const { ui } = await montarUso($, on, USO)
  expect(String((await ui.find({ type: 'Button', key: 'abrir-uso' })).props.label)).toBe('▾ Uso de la sesión')
  await ui.press({ key: 'abrir-uso' })
  expect(String((await ui.find({ type: 'Button', key: 'abrir-uso' })).props.label)).toBe('▸ Uso de la sesión')
  expect(await linea(ui, /^5 horas/)).toBe('')
  expect(await ui.find({ type: 'Button', key: 'compactar' })).toBe(undefined)
})

test('uso de la sesión: sin suscripción lo dice', async ($, on) => {
  const { ui } = await montarUso($, on, { startedAt: 0, context: { window: 200000 }, rateLimits: [] })
  expect((await textosDe(ui)).some(t => /Sin datos de las ventanas de 5 horas y semanal/.test(t))).toBe(true)
  expect(await linea(ui, /^Contexto/)).toBe('')
})

test('uso de la sesión: session.measure actualiza las barras', async ($, on) => {
  on('session.measure', (_$: any, e: any) => ({ changed: e.changed }))
  const { ui } = await montarUso($, on, USO)
  await $.session.measure({
    context: { window: 200000, percent: 80 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 91 }],
    changed: ['rateLimits', 'context'],
  } as never)
  await ui.redraw()
  expect((await linea(ui, /^5 horas/)).includes('91 %')).toBe(true)
  expect((await linea(ui, /^Contexto/)).includes('80 %')).toBe(true)
  expect(await linea(ui, /^Semanal/)).toBe('')
})

test('compactar: pide confirmación, «No» no hace nada y «Sí» compacta y avisa los tokens', async ($, on) => {
  let compactaciones = 0
  on('session.compact', () => {
    compactaciones += 1
    return { messages: [{ role: 'user', text: 'Resumen de lo hablado.', toolUses: [] }], tokensBefore: 150000, tokensAfter: 20000 }
  })
  const { ui } = await montarUso($, on, USO)
  expect(await ui.find({ type: 'Button', key: 'compactar-si' })).toBe(undefined)
  await ui.press({ key: 'compactar' })
  await ui.press({ key: 'compactar-no' })
  expect(compactaciones).toBe(0)
  expect(await ui.find({ type: 'Button', key: 'compactar-si' })).toBe(undefined)
  await ui.press({ key: 'compactar' })
  await ui.press({ key: 'compactar-si' })
  expect(compactaciones).toBe(1)
  expect((await textosDe(ui)).some(t => /Sesión compactada: de 150\.000 a 20\.000 tokens\./.test(t))).toBe(true)
  expect(await ui.find({ type: 'Button', key: 'compactar-si' })).toBe(undefined)
})

test('compactar: si el motor lo rechaza (un turno en curso) avisa y el robot echa chispas', async ($, on) => {
  on('session.compact', () => {
    throw new Error('a turn is running')
  })
  const { ui } = await montarUso($, on, USO)
  await ui.press({ key: 'compactar' })
  await ui.press({ key: 'compactar-si' })
  await ui.redraw()
  expect((await textosDe(ui)).some(t => /^No se pudo compactar: .*probá cuando termine el turno\./.test(t))).toBe(true)
  const cara = (await ui.findAll({ type: 'Svg' })).find((s: any) => /^Oficina, robot/.test(String(s.props.alt ?? '')))
  expect(String(cara?.props.alt)).toBe('Oficina, robot echando chispas')
})

test('compactar: si otro plugin lo frena, avisa el motivo', async ($, on) => {
  on('session.compact', () => ({ skip: 'apagado por política' }))
  const { ui } = await montarUso($, on, USO)
  await ui.press({ key: 'compactar' })
  await ui.press({ key: 'compactar-si' })
  expect((await textosDe(ui)).some(t => t === 'No se compactó: apagado por política.')).toBe(true)
})
