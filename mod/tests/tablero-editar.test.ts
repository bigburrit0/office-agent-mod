import { expect, mock, test } from 'claude-code/testing'

import { RAIZ_FALSA, fsFalso, archivoAgente, PANE, PROPS, rotulo, abrirAgente, PANES, montarAncho, todos, FIN_PROMPT, montarEquipos, textosDe, DOS_EQUIPOS, textos, altsSvg } from './ayuda-tablero'

for (const surface of ['terminal', 'desktop'] as const) {
  test(`Editar rol muestra descripción y prompt completos en ${surface}`, async ($, on) => {
    fsFalso(on)
    const clock = mock.clock(on, { now: 5_000 })
    mock.store(on, {})
    on('agent.list', () => ({ value: [] }))
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
    await ui.press({ key: 'tab-roles' })
    await abrirAgente(ui, 'implementador')
    await ui.press({ key: 'editar-implementador' })
    await ui.press({ key: 'rol-ver-prompt' })
    const textos = await ui.findAll({ type: 'Text' })
    const prompt = textos.filter(t => String(t.text ?? '').includes(FIN_PROMPT))
    expect(prompt.length > 0).toBe(true)
    expect(String(prompt[0].text).startsWith('Sos un subagente de la usuaria')).toBe(true)
    expect(prompt[0].props.wrap).toBe('wrap')
    expect(textos.filter(t => /^Sos un subagente|Implementa/.test(String(t.text ?? ''))).length > 0).toBe(true)
    expect((await ui.find({ type: 'Button', key: 'rol-guardar' })) !== undefined).toBe(true)
    const svgs = await ui.findAll({ type: 'Svg' })
    if (surface === 'desktop') {
      // G-1: la placa del equipo va solo en la escena, no se repite debajo.
      expect(svgs.filter(s => /^Bandera /.test(String(s.props.alt ?? ''))).length).toBe(0)
    } else {
      expect(svgs.length).toBe(0)
    }
  })
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`El prompt de Editar es un desplegable cerrado al entrar en ${surface}`, async ($, on) => {
    fsFalso(on)
    const clock = mock.clock(on, { now: 5_000 })
    mock.store(on, {})
    on('agent.list', () => ({ value: [] }))
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
    const promptVisible = async () =>
      (await ui.findAll({ type: 'Text' })).some(t => String(t.text ?? '').includes(FIN_PROMPT))
    const inputPrompt = async () => (await ui.find({ type: 'Button', key: 'rol-cambiar-seccion-0' })) !== undefined
    await ui.press({ key: 'tab-roles' })
    await abrirAgente(ui, 'implementador')
    await ui.press({ key: 'editar-implementador' })
    expect(await inputPrompt()).toBe(false)
    expect(await promptVisible()).toBe(false)
    expect((await ui.find({ type: 'Button', key: 'rol-guardar' })) !== undefined).toBe(true)
    await ui.press({ key: 'rol-ver-prompt' })
    expect(await inputPrompt()).toBe(true)
    expect(await promptVisible()).toBe(true)
    await ui.press({ key: 'rol-ver-prompt' })
    expect(await inputPrompt()).toBe(false)
    expect(await promptVisible()).toBe(false)
    await ui.press({ key: 'rol-ver-prompt' })
    await ui.press({ key: 'rol-cancelar' })
    await ui.press({ key: 'editar-implementador' })
    expect(await inputPrompt()).toBe(false)
    expect(await promptVisible()).toBe(false)
  })
}

test('Editar rol con panel de 40 columnas: los SVG respetan el ancho', async ($, on) => {
    fsFalso(on)
  const ui = await montarAncho($, on, 40)
  await ui.press({ key: 'tab-roles' })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  await ui.press({ key: 'rol-ver-prompt' })
  const svgs = await todos(ui, { type: 'Svg' })
  expect(svgs.filter(s => /^Bandera /.test(String(s.props.alt ?? ''))).length).toBe(0)
  for (const svg of svgs) {
    const width = svg.props.width
    if (typeof width === 'number') expect(width <= 40 * 8).toBe(true)
  }
  const prompt = (await todos(ui, { type: 'Text' })).filter(t => String(t.text ?? '').includes(FIN_PROMPT))
  expect(prompt.length > 0).toBe(true)
})

test('Equipos: editar la descripción reescribe el archivo y conserva el resto', async ($, on) => {
  const ruta = `${RAIZ_FALSA}\\dev-a1\\beta.md`
  const { ui, disco } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', []),
    [ruta]: archivoAgente('beta', 'dev-a1', ['frontend']),
  })
  await abrirAgente(ui, 'beta', 'dev-a1')
  await ui.press({ key: 'editar-beta' })
  // Restaurar solo existe para los 4 roles de siempre.
  expect((await ui.find({ type: 'Button', key: 'rol-restaurar' })) === undefined).toBe(true)
  await ui.press({ key: 'rol-ver-desc' })
  await ui.input({ plugin: 'tablero-oficina', key: 'rol-description', text: 'Descripción nueva', kind: 'change' })
  await ui.press({ key: 'rol-guardar' })
  await ui.redraw()
  const escrito = disco.archivos.get(ruta)!
  expect(escrito.includes('description: Descripción nueva')).toBe(true)
  expect(escrito.includes('maxTurns: 5')).toBe(true)
  expect(escrito.includes('equipos: [dev-a1]')).toBe(true)
  expect(escrito.includes('etiquetas: [frontend]')).toBe(true)
  expect(escrito.includes('Prompt de beta.')).toBe(true)
  const textos = await textosDe(ui)
  // beta no cumple el esquema: se guarda igual y el aviso cuenta lo pendiente (G-3).
  expect(textos.some(t => t.startsWith(`Guardado en ${ruta} con `) && t.includes('avisos para revisar'))).toBe(true)
  expect(disco.fuera.length).toBe(0)
})

test('Equipos: con descripción vacía no se escribe nada', async ($, on) => {
  const ruta = `${RAIZ_FALSA}\\dev-a1\\beta.md`
  const original = archivoAgente('beta', 'dev-a1', [])
  const { ui, disco } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', []),
    [ruta]: original,
  })
  const antes = disco.escrituras.length
  await abrirAgente(ui, 'beta', 'dev-a1')
  await ui.press({ key: 'editar-beta' })
  await ui.press({ key: 'rol-ver-desc' })
  await ui.input({ plugin: 'tablero-oficina', key: 'rol-description', text: '   ', kind: 'change' })
  await ui.press({ key: 'rol-guardar' })
  await ui.redraw()
  expect(disco.escrituras.length).toBe(antes)
  expect(disco.archivos.get(ruta)).toBe(original)
  // El borrador sigue abierto.
  expect((await ui.find({ type: 'Button', key: 'rol-guardar' })) !== undefined).toBe(true)
})

test('Equipos: restaurar original solo en los 4 roles y escribe el valor por defecto', async ($, on) => {
  const ruta = `${RAIZ_FALSA}\\base\\implementador.md`
  const { ui, disco } = await montarEquipos($, on, {
    [ruta]: archivoAgente('implementador', 'base', ['mia'], 'Cambiada'),
  })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  // Cambio: restaurar ahora abre una confirmacion; el valor por defecto se escribe con rol-restaurar-si.
  await ui.press({ key: 'rol-restaurar' })
  await ui.press({ key: 'rol-restaurar-si' })
  await ui.redraw()
  const escrito = disco.archivos.get(ruta)!
  expect(escrito.includes('description: Escribe código según una tarjeta de trabajo')).toBe(true)
  expect(escrito.includes('etiquetas: [mia]')).toBe(true)
  expect(disco.fuera.length).toBe(0)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`Equipos: la descripción en Editar está plegada por defecto en ${surface}`, async ($, on) => {
    fsFalso(on, DOS_EQUIPOS)
    const clock = mock.clock(on, { now: 1_000_000 })
    mock.store(on, {})
    on('agent.list', () => ({ value: [] }))
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
    await ui.press({ key: 'tab-roles' })
    await abrirAgente(ui, 'alfa')
    await ui.press({ key: 'editar-alfa' })
    const inputDesc = async () => (await ui.find({ type: 'Input', key: 'rol-description' })) !== undefined
    expect(await inputDesc()).toBe(false)
    // Cambio: la descripcion se muestra en una caja y el Input aparece solo al pedir cambiarla.
    expect(await rotulo(ui, 'rol-ver-desc')).toBe('Cambiar descripción')
    await ui.press({ key: 'rol-ver-desc' })
    expect(await inputDesc()).toBe(true)
    expect(await rotulo(ui, 'rol-ver-desc')).toBe('Listo')
    await ui.press({ key: 'rol-cancelar' })
    await ui.press({ key: 'editar-alfa' })
    expect(await inputDesc()).toBe(false)
  })
}

test('Editar: aparece la pizarra del taller', async ($, on) => {
  fsFalso(on)
  const clock = mock.clock(on, { now: 5_000 })
  mock.store(on, {})
  on('agent.list', () => ({ value: [] }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 60 },
  })
  await clock.advance(2000)
  await ui.press({ key: 'tab-roles' })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  expect((await altsSvg(ui)).some(a => a.startsWith('Barco, loro ') && a.includes('Taller de implementador'))).toBe(true)
})


test('Editar: volver-equipos vuelve a la lista de Equipos sin escribir', async ($, on) => {
  const { ui, disco } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\implementador.md`]: archivoAgente('implementador', 'base', []),
  })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  const antes = disco.escrituras.length
  expect((await ui.find({ type: 'Button', key: 'volver-equipos' })) !== undefined).toBe(true)
  await ui.press({ key: 'volver-equipos' })
  await ui.redraw()
  expect((await ui.find({ type: 'Button', key: 'rol-guardar' })) === undefined).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'volver-equipos' })) === undefined).toBe(true)
  expect(disco.escrituras.length).toBe(antes)
})

test('Editar: rol-restaurar solo confirma y rol-restaurar-si escribe el valor por defecto', async ($, on) => {
  const ruta = `${RAIZ_FALSA}\\base\\implementador.md`
  const { ui, disco } = await montarEquipos($, on, {
    [ruta]: archivoAgente('implementador', 'base', [], 'Cambiada'),
  })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  const antes = disco.escrituras.length
  const contenido = disco.archivos.get(ruta)
  expect((await ui.find({ type: 'Button', key: 'rol-restaurar-si' })) === undefined).toBe(true)
  await ui.press({ key: 'rol-restaurar' })
  expect((await ui.find({ type: 'Button', key: 'rol-restaurar-si' })) !== undefined).toBe(true)
  expect((await textosDe(ui)).some(t => t.startsWith('¿Volver a los valores originales?'))).toBe(true)
  expect(disco.escrituras.length).toBe(antes)
  expect(disco.archivos.get(ruta)).toBe(contenido)
  await ui.press({ key: 'rol-restaurar-si' })
  await ui.redraw()
  expect(disco.escrituras.length > antes).toBe(true)
  expect(disco.archivos.get(ruta)!.includes('description: Escribe código según una tarjeta de trabajo')).toBe(true)
})

test('Editar: avisa de cambios sin guardar solo tras cambiar algo', async ($, on) => {
  const { ui } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\implementador.md`]: archivoAgente('implementador', 'base', []),
  })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  const aviso = async () => (await textosDe(ui)).some(t => t.includes('● Cambios sin guardar'))
  expect(await aviso()).toBe(false)
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'haiku' })
  expect(await aviso()).toBe(true)
})

test('Editar: con la descripcion sin abrir, su texto aparece en un solo Text', async ($, on) => {
  const { ui } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\dev-a1\\beta.md`]: archivoAgente('beta', 'dev-a1', [], 'Descripción única de prueba'),
  })
  await abrirAgente(ui, 'beta', 'dev-a1')
  await ui.press({ key: 'editar-beta' })
  const t = (await textosDe(ui)).filter(x => x.includes('Descripción única de prueba'))
  expect(t.length).toBe(1)
  expect((await ui.find({ type: 'Input', key: 'rol-description' })) === undefined).toBe(true)
})

test('Editar: tras cambiar el modelo la cara tiene sospecha (d)', async ($, on) => {
  const { ui } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\base\implementador.md`]: archivoAgente('implementador', 'base', []),
  })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  expect((await altsSvg(ui)).some(a => a.startsWith('Barco, loro con una ceja levantada'))).toBe(false)
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'haiku' })
  expect((await altsSvg(ui)).some(a => a.startsWith('Barco, loro con una ceja levantada'))).toBe(true)
})

test('Editar: tras guardar la burbuja dice «¡Guardado!» y a los 3,5 s ya no (e)', async ($, on) => {
  fsFalso(on, { [`${RAIZ_FALSA}\base\implementador.md`]: archivoAgente('implementador', 'base', []) })
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on, {})
  on('agent.list', () => ({ value: [] }))
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
  await ui.press({ key: 'tab-roles' })
  await abrirAgente(ui, 'implementador')
  await ui.press({ key: 'editar-implementador' })
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'haiku' })
  await ui.press({ key: 'rol-guardar' })
  await ui.redraw()
  expect((await textosDe(ui)).some(t => t.includes('¡Guardado! implementador estrena rol en la próxima sesión. De nada.'))).toBe(true)
  await clock.advance(3500)
  await ui.redraw()
  expect((await textosDe(ui)).some(t => t.includes('¡Guardado!'))).toBe(false)
})
