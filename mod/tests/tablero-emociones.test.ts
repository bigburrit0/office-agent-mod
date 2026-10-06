import { expect, mock, test } from 'claude-code/testing'

import { D, PANES, PROPS, PANE, burbuja, celdasAlt, fsFalso, montar } from './ayuda-tablero'

const caraAlt = async (ui: any): Promise<string> => {
  const svgs: Array<{ props: Record<string, unknown> }> = await ui.findAll({ type: 'Svg' })
  const svg = svgs.find(s => /^Oficina, robot/.test(String(s.props.alt ?? '')))
  return String(svg?.props.alt ?? '')
}

// Una fila de otro equipo: el rol «equipo/agente» da el equipo.
const DE = (id: string, status: string, rol: string) => ({
  id,
  description: `T-${id.slice(1)} · haiku · ${rol} · algo`,
  type: 'general-purpose',
  status,
})

// Monta el panel con el reloj en un instante dado (hora local) en vez del de siempre.
async function montarALas($: any, on: any, ahora: number, getList: () => unknown[]) {
  fsFalso(on)
  const clock = mock.clock(on, { now: ahora })
  on('agent.list', () => ({ value: getList() }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
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

test('pánico si fallan dos a la vez', async ($, on) => {
  let list: unknown[] = [D('r1', 'running'), D('r2', 'running'), D('r3', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'failed'), D('r2', 'failed'), D('r3', 'running')]
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot en pánico')
  expect(await burbuja(ui, /Fallaron varios a la vez/)).toBe(true)
})

test('frustrado si falla otro mientras seguía molesto; alivio cuando uno termina bien', async ($, on) => {
  let list: unknown[] = [D('r1', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'failed')]
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot en alarma')
  await paso(6000)
  expect(await caraAlt(ui)).toBe('Oficina, robot ofendido')
  list = [D('r1', 'failed'), D('r2', 'running')]
  await paso(2000)
  list = [D('r1', 'failed'), D('r2', 'failed')]
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot frustrado')
  list = [D('r1', 'failed'), D('r2', 'failed'), D('r3', 'running')]
  await paso(6000)
  list = [D('r1', 'failed'), D('r2', 'failed'), D('r3', 'completed')]
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot aliviado')
  expect(await burbuja(ui, /ya se me pasó el enojo/)).toBe(true)
  // Se le pasó el enojo: después del alivio vuelve al ocio, no a molesto.
  await paso(4000)
  expect(await caraAlt(ui)).toBe('Oficina, robot tomando café')
})

test('contento si termina uno y siguen otros; aplaude si terminan varios juntos', async ($, on) => {
  let list: unknown[] = [D('r1', 'running'), D('r2', 'running'), D('r3', 'running'), D('r4', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'completed'), D('r2', 'running'), D('r3', 'running'), D('r4', 'running')]
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot feliz')
  await paso(4000)
  list = [D('r1', 'completed'), D('r2', 'completed'), D('r3', 'completed'), D('r4', 'running')]
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot aplaudiendo')
})

test('sorpresa si entran tres o más juntos; multitarea con cuatro corriendo', async ($, on) => {
  let list: unknown[] = []
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'running'), D('r2', 'running'), D('r3', 'running'), D('r4', 'running')]
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot sorprendido')
  expect(await burbuja(ui, /Llegaron 4 agentes de golpe/)).toBe(true)
  await paso(4000)
  expect(await caraAlt(ui)).toBe('Oficina, robot haciendo mil cosas a la vez')
})

test('concentrado con un solo agente que corre hace más de 3 minutos', async ($, on) => {
  const { ui, paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  await paso(4000)
  expect(await caraAlt(ui)).toBe('Oficina, robot procesando')
  for (let i = 0; i < 19; i++) await paso(10000)
  expect(await caraAlt(ui)).toBe('Oficina, robot concentrado con auriculares')
})

test('hora del día: al mediodía, sin agentes, le da hambre', async ($, on) => {
  const { ui, paso } = await montarALas($, on, new Date(2026, 9, 6, 12, 30).getTime(), () => [D('c1', 'completed')])
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot con hambre')
  expect(await burbuja(ui, /Me está dando hambre/)).toBe(true)
})

test('hora del día: desde las 17:30 dice que dentro de poco se va a casa', async ($, on) => {
  const { ui, paso } = await montarALas($, on, new Date(2026, 9, 6, 17, 25).getTime(), () => [D('c1', 'completed')])
  await paso(2000)
  expect(await caraAlt(ui)).toBe('Oficina, robot tomando café')
  for (let i = 0; i < 30; i++) await paso(10000)
  expect(await caraAlt(ui)).toBe('Oficina, robot pensando en irse a casa')
  expect(await burbuja(ui, /dentro de poco me voy a casa/)).toBe(true)
})

test('hora del día trabajando: la cara es de trabajo y la burbuja suma la frase de la hora', async ($, on) => {
  const { ui, paso } = await montarALas($, on, new Date(2026, 9, 6, 17, 45).getTime(), () => [D('r1', 'running')])
  await paso(2000)
  await paso(4000)
  expect(await caraAlt(ui)).toBe('Oficina, robot procesando')
  expect(await burbuja(ui, /Laburando con 1 agente.*Y en un rato me voy a casa\./)).toBe(true)
})

test('patio por color: la celda lleva el equipo en el título y la leyenda lo nombra', async ($, on) => {
  const { ui, paso } = await montar($, on, () => [DE('r1', 'running', 'research/explorador'), DE('r2', 'running', 'datos/analista')])
  await paso(2000)
  expect((await celdasAlt(ui)).length).toBe(2)
  const fuentes = (await ui.findAll({ type: 'Svg' }))
    .filter((s: any) => /^Agente /.test(String(s.props.alt ?? '')))
    .map((s: any) => String(s.props.source))
  expect(fuentes.some(f => f.includes('equipo research'))).toBe(true)
  expect(fuentes.some(f => f.includes('equipo datos'))).toBe(true)
  // Color de research en la camisa (#5aa9e6) y de datos (#2cc6d0).
  expect(fuentes.some(f => f.includes('#5aa9e6'))).toBe(true)
  expect(fuentes.some(f => f.includes('#2cc6d0'))).toBe(true)
  expect((await ui.findAll({ type: 'Text', text: /■ research/ })).length).toBe(1)
  expect((await ui.findAll({ type: 'Text', text: /■ datos/ })).length).toBe(1)
})
