import { expect, mock, test } from 'claude-code/testing'

import { CLARO } from '../hooks/tema'
import { T0, PANE, PROPS, PANES, AGENTS, fsFalso, abrirTodo, abrirAgente, descendientes } from './ayuda-tablero'

const OSCUROS = ['#141a12', '#2a2f24', '#20251b', '#1a1e16', '#10261a', '#0c1f15', '#0a2414', '#1F5FA8']
const FONDOS_CLAROS = [
  CLARO.panel, CLARO.escena, CLARO.barra, CLARO.burbuja, CLARO.tarjeta,
  CLARO.tarjetaAlt, CLARO.tarjetaHover, CLARO.filas[0], CLARO.filas[1], CLARO.filaHover,
]

async function montarDesktop($: any, on: any, agentes: unknown[]) {
  fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  mock.store(on, {})
  on('agent.list', () => ({ value: agentes }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 200, rows: 80 },
  })
  await clock.advance(2000)
  await ui.redraw()
  return ui
}

// Chequea las dos reglas del tema claro sobre lo que hay en pantalla.
async function chequearTema(ui: any): Promise<number> {
  const cajas: any[] = await ui.findAll({ type: 'Box' })
  const conFondo = cajas.filter(c => typeof c.props?.backgroundColor === 'string')
  expect(conFondo.length > 0).toBe(true)
  for (const caja of conFondo) {
    expect(OSCUROS.map(c => c.toLowerCase()).includes(String(caja.props.backgroundColor).toLowerCase())).toBe(false)
    const hover = caja.props.hover?.backgroundColor
    if (hover !== undefined) expect(OSCUROS.map(c => c.toLowerCase()).includes(String(hover).toLowerCase())).toBe(false)
  }
  let textos = 0
  for (const caja of conFondo.filter(c => FONDOS_CLAROS.includes(String(c.props.backgroundColor)))) {
    for (const t of descendientes(caja, n => n.type === 'Text')) {
      textos += 1
      expect(typeof t.props?.color).toBe('string')
    }
  }
  return textos
}

test('tema claro: vista Subagentes sin fondos oscuros y con letra explícita', async ($, on) => {
  const ui = await montarDesktop($, on, AGENTS)
  expect((await chequearTema(ui)) > 0).toBe(true)
})

test('tema claro: vista Equipos con grupos y un agente abiertos', async ($, on) => {
  const ui = await montarDesktop($, on, [])
  await ui.press({ key: 'tab-roles' })
  await abrirTodo(ui)
  expect((await chequearTema(ui)) > 0).toBe(true)
})

test('tema claro: vista Editar', async ($, on) => {
  const ui = await montarDesktop($, on, [])
  await ui.press({ key: 'tab-roles' })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  expect((await ui.find({ type: 'Button', key: 'rol-guardar' })) !== undefined).toBe(true)
  await chequearTema(ui)
})

test('barra superior: sin espacio suelto entre pestañas y botón Quieto', async ($, on) => {
  const ui = await montarDesktop($, on, AGENTS)
  const barra: any = (await ui.findAll({ type: 'Box' })).find(
    (c: any) => c.props?.backgroundColor === CLARO.barra,
  )
  expect(barra !== undefined).toBe(true)
  const sueltos = descendientes(barra, n => n.type === 'Text' && String(n.text ?? '') === ' ')
  expect(sueltos.length).toBe(0)
  const pestañas = descendientes(barra, n => n.type === 'Button' && /^tab-/.test(String(n.props?.key ?? '')))
  expect(pestañas.length).toBe(2)
  const quieto: any = await ui.find({ type: 'Button', key: 'quieto' })
  expect(quieto.props.label).toBe('Quieto')
  await ui.press({ key: 'quieto' })
  expect(String(((await ui.find({ type: 'Button', key: 'quieto' })) as any).props.label)).toBe('Animar')
})
