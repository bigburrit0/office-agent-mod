import { expect, mock, test } from 'claude-code/testing'

import { T0, PANES, PANE, PROPS, RAIZ_FALSA, abrirAgente, agenteValido, fsFalso, turnoSub } from './ayuda-tablero'

// Maqueta: monta el panel a 48 columnas y emite el árbol de cada escenario. Un módulo de hooks no puede importar node:fs, así que el
// JSON sale por consola entre marcadores <<<MAQUETA nombre>>> … <<<FIN>>> y
// `node mod/preview/maqueta.mjs` lo lee de la salida de `claude plugin test`
// (o de mod/tests/salida/maqueta-<nombre>.json si existe).

const USO = {
  startedAt: 0,
  context: { window: 200000, tokens: 16000, percent: 8 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 23, resetsAt: '2026-10-06T18:30:00Z' },
    { kind: 'seven_day', percentUsed: 47, resetsAt: '2026-10-12T12:00:00Z' },
  ],
  cost: { usd: 0.47 },
}

const AGENTES = [
  { id: 'a1', description: 'M-1 · sonnet · implementador · maqueta del panel', type: 'general-purpose', status: 'running' },
  { id: 'a2', description: 'M-2 · haiku · corrector · arreglo de pruebas', type: 'general-purpose', status: 'running' },
  { id: 'a3', description: 'M-3 · sonnet · investigador · busca algo', type: 'general-purpose', status: 'running' },
]

// Árbol sin funciones: { type, key, props, text, children }.
function serializar(nodo: any): unknown {
  if (nodo === null || nodo === undefined) return null
  if (typeof nodo !== 'object') return nodo
  const props: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(nodo.props ?? {})) {
    if (typeof v === 'function' || k === 'children') continue
    props[k] = v
  }
  return {
    type: nodo.type,
    key: nodo.key ?? nodo.props?.key,
    props,
    text: typeof nodo.text === 'string' ? nodo.text : undefined,
    children: (nodo.children ?? []).map(serializar),
  }
}

function guardar(nombre: string, arbol: unknown): void {
  console.log(`<<<MAQUETA ${nombre}>>>${JSON.stringify(arbol)}<<<FIN>>>`)
}

async function raiz(ui: any): Promise<any> {
  if (ui.tree) return typeof ui.tree === 'function' ? await ui.tree() : ui.tree
  if (ui.root) return typeof ui.root === 'function' ? await ui.root() : ui.root
  const cajas = await ui.findAll({ type: 'Box' })
  return cajas[0]
}

async function montarMaqueta($: any, on: any, agentes: unknown[], uso?: unknown, archivos: Record<string, string> = {}) {
  fsFalso(on, archivos)
  const clock = mock.clock(on, { now: T0 })
  mock.store(on, {})
  on('agent.list', () => ({ value: agentes }))
  on('ui.panes', () => ({ value: PANES }))
  if (uso) on('session.usage', () => ({ value: uso }))
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer, usage: e.usage }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: { ...PROPS, bodyColumns: 48 } as never,
    requestId: PANE.id,
    viewport: { columns: 48, rows: 60 },
  })
  await clock.advance(2000)
  await ui.redraw()
  return ui
}

test('maqueta: subagentes sin agentes con uso de la sesión', async ($, on) => {
  const ui = await montarMaqueta($, on, [], USO)
  const u = { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 5000, cache_creation_input_tokens: 300, model: 'm' }
  await turnoSub($, undefined, 'a', u)
  await turnoSub($, undefined, 'b', u)
  await ui.redraw()
  const r = await raiz(ui)
  guardar('subagentes-uso', serializar(r))
  expect((await ui.findAll({ type: 'Svg' })).length > 0).toBe(true)
})

test('maqueta: subagentes con 3 agentes corriendo', async ($, on) => {
  const ui = await montarMaqueta($, on, AGENTES)
  guardar('subagentes-3', serializar(await raiz(ui)))
  expect((await ui.findAll({ type: 'Svg' })).length > 0).toBe(true)
})

test('maqueta: equipos con grupo base y un agente abiertos', async ($, on) => {
  const ui = await montarMaqueta($, on, [])
  await ui.press({ key: 'tab-roles' })
  await ui.redraw()
  await abrirAgente(ui, 'implementador')
  await ui.redraw()
  guardar('equipos', serializar(await raiz(ui)))
  expect((await ui.find({ type: 'Button', key: 'editar-implementador' })) !== undefined).toBe(true)
})

test('maqueta: editar un agente', async ($, on) => {
  const ui = await montarMaqueta($, on, [])
  await ui.press({ key: 'tab-roles' })
  await ui.redraw()
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  await ui.redraw()
  guardar('editar', serializar(await raiz(ui)))
  expect((await ui.find({ type: 'Button', key: 'rol-guardar' })) !== undefined).toBe(true)
})

test('maqueta: editar por secciones, con cambios', async ($, on) => {
  const ui = await montarMaqueta($, on, [], undefined, { [`${RAIZ_FALSA}\\base\\revisor-web.md`]: agenteValido('revisor-web', 'base') })
  await ui.press({ key: 'tab-roles' })
  await ui.redraw()
  await abrirAgente(ui, 'revisor-web')
  await ui.press({ key: 'editar-revisor-web' })
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'haiku' })
  await ui.press({ key: 'rol-ver-prompt' })
  await ui.press({ key: 'rol-ver-seccion-1' })
  await ui.press({ key: 'rol-cambiar-seccion-1' })
  await ui.redraw()
  guardar('editar-secciones', serializar(await raiz(ui)))
  expect((await ui.find({ type: 'Input', key: 'rol-seccion-input-1' })) !== undefined).toBe(true)
})
