import { expect, mock, test } from 'claude-code/testing'

import { T0, D, DOS_EQUIPOS, PANES, PROPS, PANE, altsSvg, descendientes, fsFalso, montar, montarEquipos, textosDe } from './ayuda-tablero'

const USO_90 = {
  startedAt: 0,
  context: { window: 200000, tokens: 126000, percent: 63 },
  rateLimits: [{ kind: 'five_hour', percentUsed: 90, resetsAt: '2026-10-06T18:30:00Z' }],
}

async function montarSubVacio($: any, on: any, surface: 'terminal' | 'desktop', uso: unknown = null) {
  fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  on('agent.list', () => ({ value: [] }))
  on('ui.panes', () => ({ value: PANES }))
  on('session.usage', () => ({ value: uso }))
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
  return ui
}

test('Subagentes sin agentes: el monitor y el escritorio antes del borde de la mesa', async ($, on) => {
  const ui = await montarSubVacio($, on, 'desktop')
  const alts = await altsSvg(ui)
  expect(alts.filter(a => a.startsWith('Terminal, robot')).length).toBe(1)
    expect(alts.filter(a => a === 'Escritorio con la PC').length).toBe(1)
  expect(alts.indexOf('Escritorio con la PC') < alts.indexOf('Borde del escritorio')).toBe(true)
  expect(alts[alts.length - 1]).toBe('Borde del escritorio')
})

test('Subagentes con 2 agentes corriendo: la escena única nombra a los dos en su alt', async ($, on) => {
  fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('r1', 'running'), D('r2', 'running')])
  await paso(2000)
  const escena = (await altsSvg(ui)).filter(a => a.startsWith('Terminal, robot'))
  expect(escena.length).toBe(1)
  expect((escena[0].match(/Agente /g) ?? []).length).toBe(2)
})

test('Equipos: caja de disquetes y escritorio, con el borde de la mesa al final', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  const alts = await altsSvg(ui)
  expect(alts.includes('Caja de disquetes, uno por equipo')).toBe(true)
  expect(alts.includes('Escritorio con la PC')).toBe(true)
  expect(alts[alts.length - 1]).toBe('Borde del escritorio')
})

test('uso al 90 % y sin agentes: la burbuja del robot avisa cuánto queda', async ($, on) => {
  const ui = await montarSubVacio($, on, 'desktop', USO_90)
  const burbuja = (await textosDe(ui)).find(t => t.startsWith('Ojo:'))
  expect(burbuja === undefined).toBe(false)
  expect(String(burbuja).includes('queda 10 %')).toBe(true)
})

test('en terminal no aparece el arte nuevo', async ($, on) => {
  const ui = await montarSubVacio($, on, 'terminal')
  const alts = await altsSvg(ui)
  for (const a of ['Escritorio con la PC', 'Borde del escritorio', 'Caja de disquetes, uno por equipo', 'Teclado']) {
    expect(alts.includes(a)).toBe(false)
  }
})

const cadena = (n: any): string =>
  typeof n === 'string' ? n : [n?.text, ...(n?.children ?? []).map(cadena), typeof n?.props?.children === 'string' ? n.props.children : ''].filter(Boolean).join('')

test('Subagentes escritorio: la burbuja del robot va antes del tablero de uso', async ($, on) => {
  const ui = await montarSubVacio($, on, 'desktop', USO_90)
  const raiz = (await ui.findAll({ type: 'Box' }))[0]
  const orden = descendientes(raiz, () => true)
  const iBurbuja = orden.findIndex(n => n.type === 'Text' && cadena(n).startsWith('Ojo:'))
  const iUso = orden.findIndex(n => n.type === 'Svg' && String(n.props?.alt ?? '').startsWith('Tokens de la sesión'))
  expect(iBurbuja >= 0).toBe(true)
  expect(iUso >= 0).toBe(true)
  expect(iBurbuja < iUso).toBe(true)
})

test('Subagentes sin agentes no hay botón abrir-resumen', async ($, on) => {
  const vacio = await montarSubVacio($, on, 'desktop')
  expect((await vacio.findAll({ type: 'Button', key: 'abrir-resumen' })).length).toBe(0)
})

test('Subagentes con un agente corriendo sí hay botón abrir-resumen', async ($, on) => {
  const { ui, paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  expect((await ui.findAll({ type: 'Button', key: 'abrir-resumen' })).length).toBe(1)
})
