import { expect, mock, test } from 'claude-code/testing'

import { DOS_EQUIPOS, PANES, PROPS, PANE, altsSvg, fsFalso, montarEquipos, textosDe } from './ayuda-tablero'

const USO_90 = {
  startedAt: 0,
  context: { window: 200000, tokens: 126000, percent: 63 },
  rateLimits: [{ kind: 'five_hour', percentUsed: 90, resetsAt: '2026-10-06T18:30:00Z' }],
}

async function montarSubVacio($: any, on: any, surface: 'terminal' | 'desktop', uso: unknown = null) {
  fsFalso(on)
  const clock = mock.clock(on, { now: 1_000_000 })
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

test('Subagentes sin agentes: escritorio libre y pasillo antes de la cornisa', async ($, on) => {
  const ui = await montarSubVacio($, on, 'desktop')
  const alts = await altsSvg(ui)
  expect(alts.includes('Escritorio libre esperando a un agente')).toBe(true)
  expect(alts.filter(a => a === 'Pasillo de la oficina').length).toBe(1)
  expect(alts.indexOf('Pasillo de la oficina') < alts.indexOf('Cornisa del edificio')).toBe(true)
  expect(alts[alts.length - 1]).toBe('Cornisa del edificio')
})

test('Equipos: estante con carpetas y pasillo, con la cornisa al final', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  const alts = await altsSvg(ui)
  expect(alts.includes('Estante con carpetas')).toBe(true)
  expect(alts.includes('Pasillo de la oficina')).toBe(true)
  expect(alts[alts.length - 1]).toBe('Cornisa del edificio')
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
  for (const a of ['Escritorio libre esperando a un agente', 'Pasillo de la oficina', 'Estante con carpetas']) {
    expect(alts.includes(a)).toBe(false)
  }
})
