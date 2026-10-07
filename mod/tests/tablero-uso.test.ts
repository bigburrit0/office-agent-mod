import { expect, mock, test } from 'claude-code/testing'

import { formatoTokens } from '../hooks/arte-uso'
import { datosUsoDe } from '../hooks/tablero-nucleo'
import { T0, PANES, PROPS, PANE, fsFalso, textosDe, turnoSub } from './ayuda-tablero'

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
  const clock = mock.clock(on, { now: T0 })
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

const alts = async (ui: any): Promise<string[]> =>
  (await ui.findAll({ type: 'Svg' })).map((s: any) => String(s.props.alt ?? ''))
const altTablero = async (ui: any): Promise<string> => (await alts(ui)).find(a => a.startsWith('Tokens de la sesión')) ?? ''

test('uso de la sesión: 5 horas y semanal con barra, porcentaje y renovación (terminal)', async ($, on) => {
  {
    const { ui, pedidos } = await montarUso($, on, USO, 'terminal')
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
  }
})

test('uso de la sesión: en el escritorio el uso está solo en el tablero dibujado, sin filas de texto (desktop)', async ($, on) => {
  const { ui, pedidos } = await montarUso($, on, USO, 'desktop')
  expect(pedidos()).toBe(1)
  const claves = (await ui.findAll({ type: 'Box' })).map((b: any) => String(b.key ?? ''))
  expect(claves.includes('uso-five_hour')).toBe(false)
  expect(claves.includes('uso-seven_day')).toBe(false)
  expect(claves.includes('uso-contexto')).toBe(false)
  expect(await linea(ui, /^5 horas/)).toBe('')
  const alt = await altTablero(ui)
  expect(alt.includes('queda 58 %')).toBe(true)
  expect(alt.includes('contexto 63 %')).toBe(true)
  expect((await alts(ui)).filter(a => a.startsWith('Tokens de la sesión')).length).toBe(1)
  // «Uso de la sesión» y «Compactar» van en una sola fila.
  const filas = (await ui.findAll({ type: 'Box' })).filter((b: any) => {
    const claves = (b.children ?? []).map((c: any) => String(c?.props?.key ?? ''))
    return claves.includes('abrir-uso') && claves.includes('compactar')
  })
  expect(filas.length > 0).toBe(true)
})

test('uso de la sesión: el desplegable arranca abierto y se cierra', async ($, on) => {
  const { ui } = await montarUso($, on, USO)
  expect(String((await ui.find({ type: 'Button', key: 'abrir-uso' })).props.label)).toBe('▾ Uso de la sesión')
  await ui.press({ key: 'abrir-uso' })
  expect(String((await ui.find({ type: 'Button', key: 'abrir-uso' })).props.label)).toBe('▸ Uso de la sesión')
  expect(await linea(ui, /^5 horas/)).toBe('')
  expect(await ui.find({ type: 'Button', key: 'compactar' })).toBe(undefined)
  expect(await altTablero(ui)).toBe('')
})

test('uso de la sesión: sin ventanas dice que aparecen después de la primera respuesta', async ($, on) => {
  const { ui } = await montarUso($, on, { startedAt: 0, context: { window: 200000 }, rateLimits: [] }, 'terminal')
  const textos = await textosDe(ui)
  expect(textos.some(t => /Las ventanas de 5 horas y semanal aparecen después de la primera respuesta\./.test(t))).toBe(true)
  expect(textos.some(t => /suscripción/.test(t))).toBe(false)
  expect(await linea(ui, /^Contexto/)).toBe('')
})

test('uso de la sesión: session.measure actualiza las barras', async ($, on) => {
  on('session.measure', (_$: any, e: any) => ({ changed: e.changed }))
  const { ui } = await montarUso($, on, USO, 'terminal')
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

test('uso de la sesión: session.measure actualiza el tablero (desktop)', async ($, on) => {
  on('session.measure', (_$: any, e: any) => ({ changed: e.changed }))
  const { ui } = await montarUso($, on, USO)
  await $.session.measure({
    context: { window: 200000, percent: 80 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 91 }],
    changed: ['rateLimits', 'context'],
  } as never)
  await ui.redraw()
  const alt = await altTablero(ui)
  expect(alt.includes('queda 9 %')).toBe(true)
  expect(alt.includes('contexto 80 %')).toBe(true)
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
  const cara = (await ui.findAll({ type: 'Svg' })).find((s: any) => /^Terminal, robot/.test(String(s.props.alt ?? '')))
  expect(String(cara?.props.alt)).toBe('Terminal, robot echando chispas')
})

test('compactar: si otro plugin lo frena, avisa el motivo', async ($, on) => {
  on('session.compact', () => ({ skip: 'apagado por política' }))
  const { ui } = await montarUso($, on, USO)
  await ui.press({ key: 'compactar' })
  await ui.press({ key: 'compactar-si' })
  expect((await textosDe(ui)).some(t => t === 'No se compactó: apagado por política.')).toBe(true)
})

test('uso de la sesión: con clave de API (sin ventanas) muestra el costo de la sesión', async ($, on) => {
  const { ui } = await montarUso($, on, { startedAt: 0, context: { window: 200000, percent: 12 }, rateLimits: [], cost: { usd: 3.456 } }, 'terminal')
  expect((await linea(ui, /^Costo/)).includes('US$ 3,46 en esta sesión')).toBe(true)
  expect((await linea(ui, /^Contexto/)).includes('12 %')).toBe(true)
})

test('uso de la sesión: con clave de API el tablero dibujado lleva el costo y el contexto (desktop)', async ($, on) => {
  const { ui } = await montarUso($, on, { startedAt: 0, context: { window: 200000, percent: 12 }, rateLimits: [], cost: { usd: 3.456 } })
  const alt = await altTablero(ui)
  expect(alt.includes('costo US$ 3,46')).toBe(true)
  expect(alt.includes('contexto 12 %')).toBe(true)
})

test('uso de la sesión: con suscripción no se muestra el costo', async ($, on) => {
  const { ui } = await montarUso($, on, { ...USO, cost: { usd: 3.456 } }, 'terminal')
  expect(await linea(ui, /^Costo/)).toBe('')
})

test('tokens de la sesión: suma el hilo principal y los subagentes y el Svg muestra el total', async ($, on) => {
  let guardado: any = null
  on('state.set', async ($$: any, e: any, next: any) => {
    if (String(e.key) === 'tokensSesion') guardado = e.value
    return next(e)
  })
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer, usage: e.usage }))
  const { ui } = await montarUso($, on, USO)
  const u = { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 5000, cache_creation_input_tokens: 300, model: 'm' }
  await turnoSub($, undefined, 'a', u)
  await turnoSub($, undefined, 'b', u)
  await turnoSub($, 'sub-1', 'c', u)
  await ui.redraw()
  expect(guardado).toEqual({ input: 3000, output: 600, cacheLectura: 15000, cacheEscritura: 900, turnos: 3 })
  const total = formatoTokens(3000 + 600 + 15000 + 900)
  expect((await alts(ui)).some(a => a.startsWith('Tokens de la sesión') && a.includes(total))).toBe(true)
})

test('tablero de uso: el Svg dice cuánto queda de 5 horas y de la semana', async ($, on) => {
  const { ui } = await montarUso($, on, USO)
  const alt = (await alts(ui)).find(a => a.startsWith('Tokens de la sesión')) ?? ''
  expect(alt.includes('Ventana de 5 horas: queda 58 %')).toBe(true)
  expect(alt.includes('Semana: queda 82 %')).toBe(true)
})

test('tablero de uso: en la terminal las filas de texto dicen cuánto queda', async ($, on) => {
  const { ui } = await montarUso($, on, USO, 'terminal')
  expect((await linea(ui, /^5 horas/)).includes('quedan 58 %')).toBe(true)
  expect((await linea(ui, /^Semanal/)).includes('quedan 82 %')).toBe(true)
})

test('tablero de uso: un turno del hilo principal vuelve a pedir session.usage', async ($, on) => {
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer, usage: e.usage }))
  const { ui, pedidos } = await montarUso($, on, USO)
  expect(pedidos()).toBe(1)
  await turnoSub($, undefined, 'listo', { input_tokens: 1, output_tokens: 1 })
  await ui.redraw()
  expect(pedidos()).toBe(2)
  await turnoSub($, 'sub-1', 'listo', { input_tokens: 1, output_tokens: 1 })
  expect(pedidos()).toBe(2)
})

test('datosUsoDe: sin uso ni turnos no hay tokens ni ventanas', () => {
  const d = datosUsoDe(null, { input: 0, output: 0, cacheLectura: 0, cacheEscritura: 0, turnos: 0 }, 0)
  expect(d.tokens).toBe(undefined)
  expect(d.cincoHoras).toBe(undefined)
  expect(d.semana).toBe(undefined)
})
