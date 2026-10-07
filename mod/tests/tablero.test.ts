import { expect, mock, test } from 'claude-code/testing'

import { STATUS_COLORS } from '../hooks/pixel'
import { CLARO, contrasteHex, legibleSobre } from '../hooks/tema'
import { T0, RAIZ_FALSA, fsFalso, archivoAgente, PANE, PROPS, AGENTS, rotulo, PANES, D, montar, montarAncho, todos, textosDe, montarSub, USO, turnoSub, textos, glifoAlts, burbuja, altsSvg } from './ayuda-tablero'

// Alias local: el ayudante compartido (ayuda-tablero.ts) todavía busca el texto viejo del robot.
const jaguarAlt = async (ui: any): Promise<string> => {
  const svgs: Array<{ props: Record<string, unknown> }> = await ui.findAll({ type: 'Svg' })
  const svg = svgs.find(s => /^Terminal, robot/.test(String(s.props.alt ?? '')))
  // La escena única suma los agentes al alt tras «Terminal, robot <emoción>»: acá va solo la emoción.
  return String(svg?.props.alt ?? '').split('. Agente ')[0].split('. Y ')[0]
}
// Agentes de la escena única (su alt: «Terminal, robot …. Agente T-9 trabajando. Y 6 agentes más»).
const agentesEscena = async (ui: any): Promise<string[]> => {
  const svgs: Array<{ props: Record<string, unknown> }> = await ui.findAll({ type: 'Svg' })
  const svg = svgs.find(s => /^Terminal, robot/.test(String(s.props.alt ?? '')))
  return String(svg?.props.alt ?? '').split('. ').slice(1)
}
const celdasEscena = async (ui: any): Promise<string[]> => (await agentesEscena(ui)).filter(a => /^Agente /.test(a))

for (const surface of ['terminal', 'desktop'] as const) {
  test(`con agentes en ${surface}`, async ($, on) => {
    fsFalso(on)
    const clock = mock.clock(on, { now: T0 })
    on('agent.list', () => ({ value: AGENTS }))
    on('ui.panes', () => ({ value: [{ id: PANE.id, title: PANE.title, isShown: true, isFocused: true, isPlaced: true }] }))

    const ui = await $.ui.mount({
      plugin: 'tablero-oficina',
      surface,
      component: 'Pane',
      props: PROPS as never,
      requestId: PANE.id,
      viewport: { columns: 100, rows: 40 },
    })
    // El temporizador del panel (cada 2 s) trae a los subagentes.
    await clock.advance(2000)
    await ui.redraw()

    const lista = await ui.findAll({ type: 'Text', text: /implementador/ })
    expect(lista.length > 0).toBe(true)
    expect((await ui.findAll({ type: 'Text', text: /corre/ })).length > 0).toBe(true)
    expect((await ui.findAll({ type: 'Text', text: /falló/ })).length > 0).toBe(true)
    // Fila del estado desconocido (a4, status 'weird'): estado literal, color «otro» y descripción limpia.
    const todosTextos = await ui.findAll({ type: 'Text' })
    const estadoWeird = todosTextos.filter(t => String(t.text ?? '').trim().startsWith('weird'))
    expect(estadoWeird.length).toBe(1)
    expect(/^(corre|lista|falló|frenada)/.test(String(estadoWeird[0].text ?? '').trim())).toBe(false)
    // El color «otro» pasa por legibleSobre contra los fondos claros de la fila.
    const fondosFila = [CLARO.filas[0], CLARO.filas[1], CLARO.filaHover]
    expect(estadoWeird[0].props.color).toBe(fondosFila.reduce((c, f) => legibleSobre(c, f), STATUS_COLORS.otro))
    for (const f of fondosFila) expect(contrasteHex(String(estadoWeird[0].props.color), f) >= 4.5).toBe(true)
    expect(todosTextos.some(t => String(t.text ?? '').includes('texto raro'))).toBe(true)

    const svgs = await ui.findAll({ type: 'Svg' })
    if (surface === 'desktop') {
      expect(svgs.length > 0).toBe(true)
      // Todo Svg lleva un alt descriptivo.
      for (const svg of svgs) expect(String(svg.props.alt ?? '').length > 0).toBe(true)
    } else {
      expect(svgs.length).toBe(0)
    }
  })

  test(`sin agentes en ${surface}`, async ($, on) => {
    fsFalso(on)
    mock.clock(on, { now: T0 })
    on('agent.list', () => ({ value: [] }))
    on('ui.panes', () => ({ value: [{ id: PANE.id, title: PANE.title, isShown: true, isFocused: true, isPlaced: true }] }))

    const ui = await $.ui.mount({
      plugin: 'tablero-oficina',
      surface,
      component: 'Pane',
      props: PROPS as never,
      requestId: PANE.id,
      viewport: { columns: 100, rows: 40 },
    })
    expect((await ui.find({ type: 'Text', text: 'Todavía no corrió ningún subagente.' })) !== undefined).toBe(true)
  })
}

test('con poco espacio la lista nunca desaparece (desktop)', async ($, on) => {
    fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  on('agent.list', () => ({ value: AGENTS }))
  on('ui.panes', () => ({ value: [{ id: PANE.id, title: PANE.title, isShown: true, isFocused: true, isPlaced: true }] }))

  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 8 },
  })
  await clock.advance(2000)
  await ui.redraw()
  expect((await ui.findAll({ type: 'Text', text: /implementador/ })).length > 0).toBe(true)
})

test('al terminar un subagente ya no se dibujan huellas (desktop)', async ($, on) => {
    fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  let status = 'running'
  on('agent.list', () => ({
    value: [{ id: 'b1', description: 'T-1 · haiku · corrector · algo', type: 'general-purpose', status }],
  }))
  on('ui.panes', () => ({ value: [{ id: PANE.id, title: PANE.title, isShown: true, isFocused: true, isPlaced: true }] }))

  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 60 },
  })
  await clock.advance(2000)
  await ui.redraw()
  const has = async (alt: RegExp) =>
    (await ui.findAll({ type: 'Svg' })).some(svg => alt.test(String(svg.props.alt ?? '')))
  expect(await has(/Huellas/)).toBe(false)

  status = 'completed'
  await clock.advance(2000)
  await ui.redraw()
  expect(await has(/Huellas/)).toBe(false)
})

test('sin subagentes corriendo y sin cambios no hay escrituras de estado (desktop)', async ($, on) => {
    fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  on('agent.list', () => ({
    value: [{ id: 'c1', description: 'T-2 · haiku · corrector · listo', type: 'general-purpose', status: 'completed' }],
  }))
  on('ui.panes', () => ({ value: PANES }))
  // Cuenta las escrituras de estado (cada una redibuja a quien la lee) y las deja pasar.
  const writes: string[] = []
  on('state.set', async ($, e, next) => {
    writes.push(String((e as { key?: string }).key))
    return next(e)
  })

  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 60 },
  })
  await clock.advance(2000)
  await ui.redraw()
  // Deja pasar el destello de huellas y el armado del título: después, quietud total.
  await clock.advance(10000)
  await ui.redraw()

  const before = writes.length
  expect(before > 0).toBe(true) // el contador sí ve las escrituras de antes
  await clock.advance(30000)
  await ui.redraw()
  expect(writes.slice(before).join(',')).toBe('')
})

test('estado base del jaguar: pensando si algo corre', async ($, on) => {
    fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  await paso(8000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot pensando con el dedo en la sien, hasta que se le prende la lamparita')
})

test('estado base del jaguar: aburrido si nada corre', async ($, on) => {
    fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('c1', 'completed')])
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot tomando café')
})

test('ruge al fallar un subagente y vuelve a pensando a los ~5 s', async ($, on) => {
    fsFalso(on)
  let list: unknown[] = [D('r1', 'running'), D('r2', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  // Corre más de 30 s: si fallara antes sería Pikachu (ver la prueba de abajo).
  await paso(30000)
  list = [D('r1', 'running'), D('r2', 'failed')]
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot en alarma, con ERR en el pecho')
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot en alarma, con ERR en el pecho')
  await paso(4000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot pensando con el dedo en la sien, hasta que se le prende la lamparita')
})

test('Pikachu sorprendido si un agente falla antes de los 30 s', async ($, on) => {
  fsFalso(on)
  let list: unknown[] = [D('r1', 'running'), D('r2', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'running'), D('r2', 'failed')]
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot sorprendido como Pikachu')
  expect(await burbuja(ui, /¿Falló T-9\? ¿Ya\? Si recién arrancaba\./)).toBe(true)
})

test('festeja cuando terminan todos sin fallos y luego aburrido', async ($, on) => {
    fsFalso(on)
  let list: unknown[] = [D('r1', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'completed')]
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot festejando con ojos de estrella')
  await paso(6000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot tomando café')
})

test('al acecho con un subagente nuevo corriendo y luego pensando', async ($, on) => {
    fsFalso(on)
  let list: unknown[] = [D('r1', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'running'), D('r2', 'running')]
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot manos a la obra')
  await paso(4000)
  // Con dos corriendo, tipea rápido.
  expect(await jaguarAlt(ui)).toBe('Terminal, robot tocando los bongós como Bongo Cat')
})

test('un subagente visto por primera vez ya terminado no dispara reacción (queda aburrido)', async ($, on) => {
    fsFalso(on)
  let list: unknown[] = []
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('x1', 'failed'), D('x2', 'completed')]
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot tomando café')
})

test('bufa cuando un subagente es frenado y a los ~2 s vuelve a aburrido', async ($, on) => {
    fsFalso(on)
  let list: unknown[] = [D('r1', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  list = [D('r1', 'killed')]
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot resoplando')
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot tomando café')
})

test('con sospecha si algo corre hace más de 10 minutos', async ($, on) => {
    fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot pensando con el dedo en la sien, hasta que se le prende la lamparita')
  for (let i = 0; i < 61; i++) await paso(10000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot con una ceja levantada')
})

test('molesto después de rugir, hasta que aparece uno nuevo corriendo', async ($, on) => {
    fsFalso(on)
  let list: unknown[] = [D('r1', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(32000)
  list = [D('r1', 'failed')]
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot en alarma, con ERR en el pecho')
  await paso(6000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot ofendido, de brazos cruzados')
  list = [D('r1', 'failed'), D('r2', 'running')]
  await paso(2000)
  // Llega otro con la misma tarjeta que falló: «Ah, otra vez».
  expect(await jaguarAlt(ui)).toBe('Terminal, robot Ah, otra vez')
  expect(await burbuja(ui, /Ah, otra vez T-9\. Vamos\./)).toBe(true)
  await paso(4000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot pensando con el dedo en la sien, hasta que se le prende la lamparita')
})

test('ocio: café, a los 2 minutos otra cosa (sin parpadeo) y dormido tras 10 minutos', async ($, on) => {
    fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('c1', 'completed')])
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot tomando café')
  await paso(118000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot tomando café')
  await paso(4000)
  const segundo = await jaguarAlt(ui)
  expect(segundo === 'Terminal, robot tomando café' || segundo === 'Terminal, robot en ahorro de energía').toBe(false)
  await paso(2000)
  expect(await jaguarAlt(ui)).toBe(segundo)
  for (let i = 0; i < 50; i++) await paso(10000)
  expect(await jaguarAlt(ui)).toBe('Terminal, robot en ahorro de energía')
})

test('patio: una celda por subagente, sale al completarse y explota al fallar', async ($, on) => {
    fsFalso(on)
  let list: unknown[] = [D('r1', 'running'), D('r2', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(2000)
  let alts = await celdasEscena(ui)
  expect(alts.length).toBe(2)
  for (const a of alts) expect(/trabajando$/.test(a)).toBe(true)
  list = [D('r1', 'completed'), D('r2', 'running')]
  await paso(2000)
  alts = await celdasEscena(ui)
  expect(alts.filter(a => /saliendo$/.test(a)).length).toBe(1)
  await paso(2000)
  alts = await celdasEscena(ui)
  expect(alts.length).toBe(1)
  list = [D('r1', 'completed'), D('r2', 'failed')]
  await paso(2000)
  alts = await celdasEscena(ui)
  expect(alts.filter(a => /explotando$/.test(a)).length).toBe(1)
})

test('quieto: el botón apaga las animaciones de la cara', async ($, on) => {
    fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  const fuente = async () =>
    String((await ui.findAll({ type: 'Svg' })).find((s: any) => /^Terminal, robot/.test(String(s.props.alt ?? ''))).props.source)
  expect((await fuente()).includes('<animate')).toBe(true)
  await ui.press({ key: 'quieto' })
  expect((await fuente()).includes('<animate')).toBe(false)
  await ui.press({ key: 'quieto' })
  expect((await fuente()).includes('<animate')).toBe(true)
})

test('la cara no cambia entre dos redibujos seguidos sin cambios (caché estable)', async ($, on) => {
    fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('c1', 'completed')])
  await paso(2000)
  const fuente = async () =>
    String((await ui.findAll({ type: 'Svg' })).find((s: any) => /^Terminal, robot/.test(String(s.props.alt ?? ''))).props.source)
  const a = await fuente()
  await ui.redraw()
  await paso(2000)
  expect(await fuente()).toBe(a)
})

test('con algo corriendo y sin reacciones vigentes solo cambia el balde de now', async ($, on) => {
    fsFalso(on)
  const writes: string[] = []
  on('state.set', async ($, e, next) => {
    writes.push(String((e as { key?: string }).key))
    return next(e)
  })
  const { paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  await paso(12000)
  const before = writes.length
  expect(before > 0).toBe(true)
  await paso(2000)
  await paso(2000)
  expect(writes.slice(before).filter(k => k !== 'now').join(',')).toBe('')
})

// ---- Ajuste de línea según el ancho del panel (pruebas estructurales) -----

for (const cols of [100, 50]) {
  test(`Subagentes con panel de ${cols} celdas: filas en una línea y abiertas con wrap`, async ($, on) => {
    fsFalso(on)
    const ui = await montarAncho($, on, cols)
    const textos = await todos(ui, { type: 'Text' })
    const desc = textos.filter(t => /panel con jaguar|arreglo de pruebas/.test(String(t.text ?? '')))
    expect(desc.length > 0).toBe(true)
    for (const t of desc) expect(t.props.wrap).toBe('truncate')
    await ui.press({ key: 'abrir-fila-a1' })
    const abiertas = (await todos(ui, { type: 'Text' })).filter(t => /panel con jaguar/.test(String(t.text ?? '')))
    expect(abiertas.some(t => t.props.wrap === 'wrap')).toBe(true)
  })
}

test('con panel angosto los SVG no pasan del ancho disponible', async ($, on) => {
    fsFalso(on)
  const ui = await montarAncho($, on, 50)
  const svgs = await todos(ui, { type: 'Svg' })
  expect(svgs.length > 0).toBe(true)
  for (const svg of svgs) {
    const width = svg.props.width
    if (typeof width === 'number') expect(width <= 50 * 8).toBe(true)
  }
})

test('panel angosto con filas largas: la lista no desaparece (poco espacio)', async ($, on) => {
    fsFalso(on)
  const largo = {
    id: 'l1',
    description: `T-70 · sonnet · implementador · ${'texto muy largo '.repeat(12)}`,
    type: 'general-purpose',
    status: 'running',
  }
  const ui = await montarAncho($, on, 50, [largo, ...AGENTS], 8)
  expect((await todos(ui, { type: 'Text', text: /implementador/ })).length > 0).toBe(true)
})

// ---- Editor de roles legible y decorado ----

test('Equipos: command.run carga el catálogo sin registrar agentes', async ($, on) => {
  const disco = fsFalso(on, { [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', []) })
  mock.clock(on, { now: T0 })
  mock.store(on, {})
  on('agent.list', () => ({ value: [] }))
  on('ui.panes', () => ({ value: PANES }))
  let registros = 0
  on('agent.register', () => {
    registros += 1
    return { value: undefined }
  })
  on('ui.open', () => ({ value: undefined }))
  await $.command.run({ command: 'oficina' } as never)
  expect(registros).toBe(0)
  expect(disco.archivos.has(`${RAIZ_FALSA}\\base\\implementador.md`)).toBe(true)
  expect(disco.fuera.length).toBe(0)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`Subagentes: fila con texto largo, cerrada en una línea y abierta completa en ${surface}`, async ($, on) => {
    fsFalso(on)
    const clock = mock.clock(on, { now: T0 })
    mock.store(on, {})
    const largo = `${'texto muy largo '.repeat(10)}FINAL`
    on('agent.list', () => ({
      value: [{ id: 'l1', description: `T-70 · sonnet · implementador · ${largo}`, type: 'general-purpose', status: 'running' }],
    }))
    on('ui.panes', () => ({ value: PANES }))
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
    const conTexto = async () => (await ui.findAll({ type: 'Text' })).filter((t: any) => String(t.text ?? '').includes('FINAL'))
    let filas = await conTexto()
    expect(filas.length).toBe(1)
    expect(filas[0].props.wrap).toBe('truncate')
    expect(await rotulo(ui, 'abrir-fila-l1')).toBe('▸')
    await ui.press({ key: 'abrir-fila-l1' })
    expect(await rotulo(ui, 'abrir-fila-l1')).toBe('▾')
    filas = await conTexto()
    expect(filas.some((t: any) => t.props.wrap === 'wrap' && String(t.text).includes(largo.trim()))).toBe(true)
  })
}

// La oleada se sacó del panel (T-98): la información ya está en las pastillas y en la línea de tiempo.
test('Subagentes: «Resumen visual» esconde el arte pero deja la palabra grande (desktop)', async ($, on) => {
  const { ui } = await montarSub($, on)
  const alts = async () => (await ui.findAll({ type: 'Svg' })).map((s: any) => String(s.props.alt ?? ''))
  expect(await rotulo(ui, 'abrir-resumen')).toBe('▾ Resumen visual')
  let a = await alts()
  expect(a.some(x => /Línea de tiempo/.test(x))).toBe(true)
  await ui.press({ key: 'abrir-resumen' })
  expect(await rotulo(ui, 'abrir-resumen')).toBe('▸ Resumen visual')
  a = await alts()
  expect(a.some(x => /Estado general/.test(x))).toBe(true)
  expect(a.some(x => /Tablero de subagentes|Terminal, robot|Línea de tiempo/.test(x))).toBe(false)
  await ui.press({ key: 'abrir-resumen' })
  expect((await alts()).some(x => /Línea de tiempo/.test(x))).toBe(true)
})

test('Subagentes: no hay Svg de oleada (g)', async ($, on) => {
  const { ui } = await montarSub($, on)
  expect((await altsSvg(ui)).some(x => /^Oleada/.test(x))).toBe(false)
})

test('Subagentes: sin corriendo no existe la pastilla « 0 corriendo » (f)', async ($, on) => {
  const { ui, paso } = await montar($, on, () => [D('c1', 'completed'), D('c2', 'completed')])
  await paso(2000)
  const t = await textosDe(ui)
  expect(t.some(x => x === ' 2 listas ')).toBe(true)
  expect(t.some(x => x.includes(' 0 corriendo '))).toBe(false)
  expect(t.some(x => x.includes('0 fallaron'))).toBe(false)
})

test('Subagentes: la fila muestra el nombre del agente completo, sin prefijo de equipo (h)', async ($, on) => {
  const desc = 'T-9 · sonnet · base/implementador · algo'
  const { ui, paso } = await montar($, on, () => [{ id: 'x1', description: desc, type: 'general-purpose', status: 'running' }])
  await paso(2000)
  const t = await textosDe(ui)
  expect(t.some(x => x === 'implementador ')).toBe(true)
  expect(t.some(x => x.includes('base/implemen'))).toBe(false)
})

test('Subagentes: en la terminal no hay botón de resumen', async ($, on) => {
  fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  mock.store(on, {})
  on('agent.list', () => ({ value: AGENTS }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'terminal',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 40 },
  })
  await clock.advance(2000)
  await ui.redraw()
  expect((await ui.find({ type: 'Button', key: 'abrir-resumen' })) === undefined).toBe(true)
})

// ---- Informe final y tokens por subagente ----
test('Informe: la fila abierta muestra el texto y los tokens; dos turnos suman', async ($, on) => {
  fsFalso(on)
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer, usage: e.usage }))
  const ui = await montarAncho($, on, 100)
  await turnoSub($, 'a1', 'primero', USO(1000, 200))
  await turnoSub($, 'a1', 'informe final', USO(11345, 100))
  await ui.press({ key: 'abrir-fila-a1' })
  await ui.redraw()
  const t = await textosDe(ui)
  expect(t.some(x => x.includes('Informe: informe final'))).toBe(true)
  expect(t.some(x => x.includes('entrada 12.345 · salida 300 · total 12.645'))).toBe(true)
  expect(t.some(x => x.includes('12.645 tokens'))).toBe(true)
})

test('Informe: sin turno todavía no llegó; el loop principal no guarda nada', async ($, on) => {
  fsFalso(on)
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer, usage: e.usage }))
  const ui = await montarAncho($, on, 100)
  await turnoSub($, undefined, 'principal', USO(5, 5))
  await ui.press({ key: 'abrir-fila-a1' })
  await ui.redraw()
  const t = await textosDe(ui)
  expect(t.some(x => x.includes('Informe: todavía no llegó'))).toBe(true)
  expect(t.some(x => x.includes('tokens'))).toBe(false)
})

test('Informe: un texto de 5000 caracteres queda recortado', async ($, on) => {
  fsFalso(on)
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer, usage: e.usage }))
  const ui = await montarAncho($, on, 100)
  await turnoSub($, 'a1', 'x'.repeat(5000), USO(1, 1))
  await ui.press({ key: 'abrir-fila-a1' })
  await ui.redraw()
  const linea = (await textosDe(ui)).find(x => x.includes('Informe: ')) ?? ''
  expect(linea.includes('x'.repeat(4000) + '…')).toBe(true)
  expect(linea.includes('x'.repeat(4001))).toBe(false)
})

for (const [tipo, glifo] of [['implementador', 'Redacción'], ['revisor', 'Control']] as const) {
  test(`descripción «T-81 ...» sin formato (${tipo}): tarjeta y glifo`, async ($, on) => {
    fsFalso(on)
    const lista = [{ id: 's1', description: 'T-81 cara del jaguar', type: tipo, status: 'running' }]
    const { ui, paso } = await montar($, on, () => lista)
    await paso(2000)
    expect((await ui.findAll({ type: 'Text', text: /T-81/ })).length > 0).toBe(true)
    expect((await ui.findAll({ type: 'Text', text: /—\s+—/ })).length).toBe(0)
    expect((await glifoAlts(ui)).includes(`Ícono ${glifo} del equipo base`)).toBe(true)
  })
}

for (const [desc, tarjeta] of [['A1-96 arreglar total', 'A1-96'], ['TAB-104 prefijo', 'TAB-104'], ['SIS-9b algo', 'SIS-9b']] as const) {
  test(`descripción «${desc}» sin formato: el panel muestra la tarjeta ${tarjeta}`, async ($, on) => {
    fsFalso(on)
    const lista = [{ id: 's1', description: desc, type: 'implementador', status: 'running' }]
    const { ui, paso } = await montar($, on, () => lista)
    await paso(2000)
    expect((await ui.findAll({ type: 'Text', text: new RegExp(tarjeta) })).length > 0).toBe(true)
  })
}

test('descripción «Holas-1 mundo» (prefijo de 5 letras) no se toma como tarjeta', async ($, on) => {
  fsFalso(on)
  const lista = [{ id: 's1', description: 'Holas-1 mundo', type: 'implementador', status: 'running' }]
  const { ui, paso } = await montar($, on, () => lista)
  await paso(2000)
  // Sin tarjeta, la fila muestra la descripción entera; con tarjeta, «Hola-1» iría aparte de «mundo».
  expect((await ui.findAll({ type: 'Text', text: /Holas-1 mundo/ })).length > 0).toBe(true)
  expect((await ui.findAll({ type: 'Text', text: /^Holas-1\s*$/ })).length).toBe(0)
})

test('burbuja: «Tomando café» sin agentes', async ($, on) => {
  fsFalso(on)
  const { ui, paso } = await montar($, on, () => [])
  await paso(2000)
  expect(await burbuja(ui, /Tomando café\. Avisame cuando alguien trabaje\./)).toBe(true)
})

test('burbuja: «Laburando con 1 agente» con uno corriendo', async ($, on) => {
  fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  await paso(8000)
  expect(await burbuja(ui, /Laburando con 1 agente: T-9\. No me distraigas\./)).toBe(true)
})

test('burbuja: «ERROR: falló T-9.» cuando falla uno que corría hace rato', async ($, on) => {
  fsFalso(on)
  let list: unknown[] = [D('r1', 'running')]
  const { ui, paso } = await montar($, on, () => list)
  await paso(32000)
  list = [D('r1', 'failed')]
  await paso(2000)
  expect(await burbuja(ui, /ERROR: falló T-9\. A mí no me mires\./)).toBe(true)
})

test('encabezado: el monitor mide el ancho del panel y lleva al robot de 132 de ancho', async ($, on) => {
  fsFalso(on)
  const { ui, paso } = await montar($, on, () => [D('r1', 'running')])
  await paso(2000)
  const svgs: any[] = await ui.findAll({ type: 'Svg' })
  const escena = svgs.filter(s => /^Terminal, robot/.test(String(s.props.alt ?? '')))
  expect(escena.length).toBe(1)
  // 100 columnas: ancho de diseño 640; el robot (132 de ancho) va anidado dentro del monitor.
  expect(Number(escena[0].props.width)).toBe(640)
  expect(/width="132"/.test(String(escena[0].props.source))).toBe(true)
  expect(escena[0].props.isInteractive).toBe(true)
})

test('patio: con más agentes que el máximo se muestra «Y N agentes más»', async ($, on) => {
  const lista = Array.from({ length: 25 }, (_, i) => D(`m${i}`, 'running'))
  const { ui, paso } = await montar($, on, () => lista)
  await paso(2000)
  const alts = await agentesEscena(ui)
  // 100 columnas (monitor de 640 px): 7 íconos por fila, máximo 8: se muestran 7 y la celda «+N».
  expect(alts.includes('Y 18 agentes más')).toBe(true)
  expect(alts.filter(a => /^Agente /.test(a)).length).toBe(7)
})

test('barra común: el primer botón es la pestaña Subagentes y sin hotkey (desktop)', async ($, on) => {
  const { ui } = await montar($, on, () => [D('r1', 'running')])
  const botones: any[] = await ui.findAll({ type: 'Button' })
  expect(String(botones[0].props.label)).toBe('Subagentes')
  expect(botones[0].props.hotkey).toBe(undefined)
  const tab = await ui.find({ type: 'Button', key: 'tab-subagentes' })
  expect(tab !== undefined).toBe(true)
  expect((tab as any).props.hotkey).toBe(undefined)
})

test('sin agentes: «Ver equipos» lleva a Equipos', async ($, on) => {
  const { ui } = await montar($, on, () => [])
  expect((await ui.find({ type: 'Button', key: 'ir-equipos' })) !== undefined).toBe(true)
  await ui.press({ key: 'ir-equipos' })
  expect((await ui.find({ type: 'Select', key: 'filtro-etiqueta' })) !== undefined).toBe(true)
})

test('el resumen aparece una sola vez: «2 corriendo» en un solo Text', async ($, on) => {
  const { ui, paso } = await montar($, on, () => [D('r1', 'running'), D('r2', 'running'), D('c1', 'completed')])
  await paso(2000)
  const aparece = (await textosDe(ui)).filter(t => t.includes('2 corriendo'))
  expect(aparece.length).toBe(1)
})
