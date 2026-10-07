import { expect, mock, test } from 'claude-code/testing'

import { HOME_FALSO, PANE, PANES, PROPS, D, altsSvg, burbuja, fsFalso, montar } from './ayuda-tablero'

const TARJETAS = `${HOME_FALSO}\\proyecto\\tarjetas`
const robotAlt = async (ui: any): Promise<string> =>
  ((await altsSvg(ui)).find(a => a.startsWith('Terminal, robot ')) ?? '').split('. Agente ')[0]

// Monta el panel a una hora dada (hora local).
async function montarALas($: any, on: any, ahora: number, getList: () => unknown[], surface: 'desktop' | 'terminal' = 'desktop') {
  fsFalso(on)
  const clock = mock.clock(on, { now: ahora })
  on('agent.list', () => ({ value: getList() }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface,
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 60 },
  })
  const paso = async (ms: number) => {
    await clock.advance(ms)
    await ui.redraw()
  }
  return { ui, paso }
}

test('sin tareas ni tarjetas el robot no inventa un número', async ($, on) => {
  const { ui, paso } = await montar($, on, () => [])
  await paso(2000)
  expect(await burbuja(ui, /No veo tareas ni tarjetas de este proyecto/)).toBe(true)
  expect(await burbuja(ui, /\d+ %:/)).toBe(false)
})

test('las tarjetas del proyecto (tarjetas/*.md) dan el % y lo que falta; una frenada se nombra', async ($, on) => {
  fsFalso(on, {
    [`${TARJETAS}\\T-1.md`]: '---\nid: T-1\nestado: hecha\n---\n',
    [`${TARJETAS}\\T-2.md`]: '---\nid: T-2\nestado: hecha\n---\n',
    [`${TARJETAS}\\T-3.md`]: '---\nid: T-3\nestado: frenada\nmotivo: falta la clave\n---\n',
    [`${TARJETAS}\\T-4.md`]: '---\nid: T-4\nestado: aprobada\n---\n',
    [`${TARJETAS}\\notas.txt`]: 'estado: hecha',
  })
  const { ui, paso } = await montar($, on, () => [])
  await paso(2000)
  expect(await burbuja(ui, /Proyecto proyecto ▕█████░░░░░▏ 50 %: faltan 2 de 4 tarjetas \(50 %\)\. T-3 está frenada y espera por vos\./)).toBe(true)
})

test('las tareas de la sesión (TaskCreate y TaskUpdate) mueven el %, y al subir el robot hace Stonks', async ($, on) => {
  on('tool.call', { tool: 'TaskCreate' }, (_$: any, e: any) => ({ result: { task: { id: e.subject.slice(0, 3), subject: e.subject } } }))
  on('tool.call', { tool: 'TaskUpdate' }, (_$: any, e: any) => ({ result: { success: true, taskId: e.taskId, updatedFields: ['status'] } }))
  const { ui, paso } = await montar($, on, () => [])
  await paso(2000)
  for (const t of ['T-1 · panel', 'T-2 · burbuja', 'T-3 · huevos', 'T-4 · htop']) {
    await $.tool.call({ tool: 'TaskCreate', subject: t, description: 'x' } as never)
  }
  await paso(1000)
  expect(await burbuja(ui, /0 %: faltan 4 de 4 tareas/)).toBe(true)
  await $.tool.call({ tool: 'TaskUpdate', taskId: 'T-1', status: 'completed' } as never)
  await paso(1000)
  expect(await robotAlt(ui)).toBe('Terminal, robot Stonks: corbata y flecha que sube')
  expect(await burbuja(ui, /Stonks: de 0 % a 25 %\./)).toBe(true)
  // Una tarea borrada no cuenta.
  await $.tool.call({ tool: 'TaskUpdate', taskId: 'T-4', status: 'deleted' } as never)
  await paso(6000)
  expect(await burbuja(ui, /33 %: faltan 2 de 3 tareas/)).toBe(true)
})

test('desde las 18 el robot queda apagado, con cara de muerto', async ($, on) => {
  const { ui, paso } = await montarALas($, on, new Date(2026, 9, 7, 19, 0).getTime(), () => [])
  await paso(2000)
  expect(await robotAlt(ui)).toBe('Terminal, robot apagado, con cara de muerto; cada tanto se le escapa el alma')
  expect(await burbuja(ui, /\[apagado\] Fuera de hora/)).toBe(true)
})

test('el sábado está apagado todo el día; con un agente corriendo, modo zombi', async ($, on) => {
  let list: unknown[] = []
  const { ui, paso } = await montarALas($, on, new Date(2026, 9, 10, 11, 0).getTime(), () => list)
  await paso(2000)
  expect((await robotAlt(ui)).startsWith('Terminal, robot apagado')).toBe(true)
  list = [D('r1', 'running')]
  await paso(6000)
  expect(await robotAlt(ui)).toBe('Terminal, robot en modo zombi: apagado, pero tipeando horas extra')
  expect(await burbuja(ui, /Horas extra…/)).toBe(true)
})

test('a las 16:04 el robot no está: 404', async ($, on) => {
  const { ui, paso } = await montarALas($, on, new Date(2026, 9, 7, 16, 4).getTime(), () => [])
  await paso(2000)
  expect(await robotAlt(ui)).toBe('Terminal, robot 404: no está')
})

test('en la terminal (sin dibujos) el robot aparece en ASCII con su frase', async ($, on) => {
  const { ui, paso } = await montarALas($, on, new Date(2026, 9, 7, 10, 30).getTime(), () => [], 'terminal')
  await paso(2000)
  expect((await ui.findAll({ type: 'Text', text: /╔════════╗/ })).length).toBe(1)
  expect(await burbuja(ui, /^robot> /)).toBe(true)
  expect((await altsSvg(ui)).length).toBe(0)
})
