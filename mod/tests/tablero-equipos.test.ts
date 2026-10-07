import { expect, mock, test } from 'claude-code/testing'

import { plantillaAgente, serializeAgente } from '../hooks/catalogo'
import { EQUIPOS_EMBLEMA, emblemaSvg } from '../hooks/pixel'
import { HOME_FALSO, RAIZ_FALSA, fsFalso, archivoAgente, PANE, PROPS, AGENTS, rotulo, abrirAgente, abrirTodo, PANES, montarAncho, todos, disposicion, montarEquipos, textosDe, DOS_EQUIPOS, agenteValido, textos, altsSvg, descendientes } from './ayuda-tablero'

for (const surface of ['terminal', 'desktop'] as const) {
  test(`pestaña Roles y vuelta en ${surface}`, async ($, on) => {
    fsFalso(on)
    const clock = mock.clock(on, { now: 5_000 })
    mock.store(on, {})
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
    await clock.advance(2000)
    await ui.redraw()
    await ui.press({ key: 'tab-roles' })
    await abrirTodo(ui)
    expect((await ui.find({ type: 'Button', key: 'editar-implementador' })) !== undefined).toBe(true)
    const editar = (await ui.findAll({ type: 'Button' })).filter(b => String(b.key ?? '').startsWith('editar-'))
    expect(editar.length).toBe(4)
    expect(new Set(editar.map(b => String(b.key ?? ''))).size).toBe(4)
    for (const rol of ['implementador', 'corrector', 'investigador', 'revisor']) {
      expect(editar.filter(b => String(b.key ?? '') === `editar-${rol}`).length).toBe(1)
    }
    expect((await ui.find({ type: 'Text', text: /implementador/ })) !== undefined).toBe(true)

    await ui.press({ key: 'tab-subagentes' })
    expect((await ui.find({ type: 'Text', text: 'Sin subagentes todavía.' })) === undefined).toBe(true)
    expect((await ui.findAll({ type: 'Text', text: /corre/ })).length > 0).toBe(true)
  })

  test(`pestaña Roles sin avanzar el reloj en ${surface}`, async ($, on) => {
    fsFalso(on)
    mock.clock(on, { now: 5_000 })
    mock.store(on, {})
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
    await ui.press({ key: 'tab-roles' })
    await abrirTodo(ui)
    const editar = (await ui.findAll({ type: 'Button' })).filter(b => String(b.key ?? '').startsWith('editar-'))
    expect(editar.length).toBe(4)
    for (const rol of ['implementador', 'corrector', 'investigador', 'revisor']) {
      expect(editar.filter(b => String(b.key ?? '') === `editar-${rol}`).length).toBe(1)
    }
  })

  test(`pestaña Roles: arte según la superficie en ${surface}`, async ($, on) => {
    fsFalso(on)
    const clock = mock.clock(on, { now: 5_000 })
    mock.store(on, {})
    on('agent.list', () => ({ value: [] }))
    on('ui.panes', () => ({ value: [{ id: PANE.id, title: PANE.title, isShown: true, isFocused: true, isPlaced: true }] }))
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
    await abrirTodo(ui)
    const svgs = await ui.findAll({ type: 'Svg' })
    const editar = (await ui.findAll({ type: 'Button' })).filter(b => String(b.key ?? '').startsWith('editar-'))
    expect(editar.length).toBe(4)
    if (surface === 'desktop') {
      const iconos = svgs.filter(s => /^Ícono del rol /.test(String(s.props.alt ?? '')))
      expect(iconos.length).toBe(4)
      for (const svg of svgs) expect(String(svg.props.alt ?? '').length > 0).toBe(true)
    } else {
      expect(svgs.length).toBe(0)
    }
  })
}

for (const cols of [100, 50]) {
  test(`Roles con panel de ${cols} celdas: 4 botones y descripciones sin truncar`, async ($, on) => {
    fsFalso(on)
    const ui = await montarAncho($, on, cols)
    await ui.press({ key: 'tab-roles' })
    await abrirTodo(ui)
    const editar = (await todos(ui, { type: 'Button' })).filter(b => String(b.key ?? '').startsWith('editar-'))
    expect(editar.length).toBe(4)
    const textos = await todos(ui, { type: 'Text' })
    expect(textos.length > 0).toBe(true)
    for (const t of textos) expect(t.props.wrap === 'truncate').toBe(false)
  })
}

test('Roles: con panel ancho «Editar» va dentro del detalle abierto, bajo el agente', async ($, on) => {
    fsFalso(on)
  expect(await disposicion($, on, 100)).toBe('column')
})
test('Roles: con panel angosto «Editar» también va dentro del detalle, bajo el agente', async ($, on) => {
    fsFalso(on)
  expect(await disposicion($, on, 50)).toBe('column')
})

test('emblemaSvg: los 12 equipos y uno desconocido dan un SVG seguro', async () => {
  for (const equipo of [...Object.keys(EQUIPOS_EMBLEMA), 'desconocido']) {
    const svg = emblemaSvg(equipo, 4)
    expect(svg !== '').toBe(true)
    expect(svg.includes('<script')).toBe(false)
  }
  expect(Object.keys(EQUIPOS_EMBLEMA).length).toBe(12)
})

test('Equipos: compu de casa con roles guardados de la versión vieja: migra los 4 a base (con lo guardado)', async ($, on) => {
  const guardado = {
    implementador: {
      description: 'Descripción editada por la usuaria',
      prompt: 'Prompt editado.',
      tools: ['Read'],
      model: 'opus',
      effort: 'high',
    },
  }
  const { ui, disco, registros } = await montarEquipos($, on, {}, { roles: guardado }, { vacio: true })
  for (const nombre of ['implementador', 'corrector', 'investigador', 'revisor']) {
    expect(disco.archivos.has(`${RAIZ_FALSA}\\base\\${nombre}.md`)).toBe(true)
  }
  expect(disco.archivos.get(`${RAIZ_FALSA}\\base\\implementador.md`)!.includes('Descripción editada por la usuaria')).toBe(true)
  expect((await rotulo(ui, 'abrir-grupo-base'))).toBe('▸ base')
  await abrirTodo(ui)
  const editar = (await ui.findAll({ type: 'Button' })).filter((b: any) => String(b.key ?? '').startsWith('editar-'))
  expect(editar.length).toBe(4)
  expect((await rotulo(ui, 'abrir-grupo-base'))).toBe('▾ base')
  expect(registros()).toBe(0)
  expect(disco.fuera.length).toBe(0)
})

test('Equipos: dos equipos sembrados y el filtro por etiqueta', async ($, on) => {
  const { ui, disco } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', ['general']),
    [`${RAIZ_FALSA}\\dev-a1\\beta.md`]: archivoAgente('beta', 'dev-a1', ['frontend']),
  })
  expect((await rotulo(ui, 'abrir-grupo-base'))).toBe('▸ base')
  expect((await rotulo(ui, 'abrir-grupo-dev-a1'))).toBe('▸ dev-a1')
  await abrirTodo(ui)
  expect((await ui.find({ type: 'Button', key: 'editar-alfa' })) !== undefined).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'editar-beta' })) !== undefined).toBe(true)

  await ui.select({ plugin: 'tablero-oficina', key: 'filtro-etiqueta', value: 'frontend' })
  await ui.redraw()
  expect((await ui.find({ type: 'Button', key: 'editar-alfa' })) === undefined).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'editar-beta' })) !== undefined).toBe(true)
  expect((await rotulo(ui, 'abrir-grupo-dev-a1'))).toBe('▾ dev-a1')
  expect((await rotulo(ui, 'abrir-grupo-base')) === undefined).toBe(true)
  expect(disco.fuera.length).toBe(0)
})

test('Equipos: un archivo roto aparece como error y el resto se lista', async ($, on) => {
  const roto = `${RAIZ_FALSA}\\base\\roto.md`
  const { ui } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', []),
    [roto]: 'esto no tiene frontmatter',
  })
  expect((await rotulo(ui, 'abrir-errores'))).toBe('▸ 1 archivo(s) con error')
  expect((await textosDe(ui)).some(t => t.startsWith(roto))).toBe(false)
  await ui.press({ key: 'abrir-errores' })
  const errores = (await ui.findAll({ type: 'Text' })).filter((t: any) => String(t.text ?? '').startsWith(roto))
  expect(errores.length).toBe(1)
  expect(errores[0].props.color).toBe('red')
  expect(errores[0].props.wrap).toBe('wrap')
  await abrirTodo(ui)
  expect((await ui.find({ type: 'Button', key: 'editar-alfa' })) !== undefined).toBe(true)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`Equipos: grupos y agentes plegados por defecto, abrir y cerrar en ${surface}`, async ($, on) => {
    const disco = fsFalso(on, DOS_EQUIPOS)
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
    // Grupos cerrados: no se dibujan los agentes.
    const n = surface === 'desktop' ? '' : ' (5)'
    expect(await rotulo(ui, 'abrir-grupo-base')).toBe(`▸ base${n}`)
    expect((await ui.find({ type: 'Button', key: 'abrir-agente-alfa' })) === undefined).toBe(true)
    await ui.press({ key: 'abrir-grupo-base' })
    expect(await rotulo(ui, 'abrir-grupo-base')).toBe(`▾ base${n}`)
    expect(await rotulo(ui, 'abrir-agente-alfa')).toBe('▸')
    // Agente cerrado: sin descripción, sin ruta y sin Editar.
    const visible = async (re: RegExp) => (await textosDe(ui)).some(t => re.test(t))
    expect(await visible(/Descripción larga de alfa/)).toBe(false)
    expect(await visible(/alfa\.md/)).toBe(false)
    expect((await ui.find({ type: 'Button', key: 'editar-alfa' })) === undefined).toBe(true)
    await ui.press({ key: 'abrir-agente-alfa' })
    expect(await rotulo(ui, 'abrir-agente-alfa')).toBe('▾')
    expect(await visible(/Descripción larga de alfa/)).toBe(true)
    expect(await visible(/alfa\.md/)).toBe(true)
    expect((await ui.find({ type: 'Button', key: 'editar-alfa' })) !== undefined).toBe(true)
    await ui.press({ key: 'abrir-agente-alfa' })
    expect(await visible(/Descripción larga de alfa/)).toBe(false)
    await ui.press({ key: 'abrir-grupo-base' })
    expect((await ui.find({ type: 'Button', key: 'abrir-agente-alfa' })) === undefined).toBe(true)
    expect(disco.fuera.length).toBe(0)
  })
}

test('Equipos: un filtro que deja un solo grupo lo muestra abierto', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  expect((await ui.find({ type: 'Button', key: 'abrir-agente-beta' })) === undefined).toBe(true)
  await ui.select({ plugin: 'tablero-oficina', key: 'filtro-etiqueta', value: 'frontend' })
  await ui.redraw()
  expect(await rotulo(ui, 'abrir-grupo-dev-a1')).toBe('▾ dev-a1')
  expect((await ui.find({ type: 'Button', key: 'abrir-agente-beta' })) !== undefined).toBe(true)
})

test('Equipos: un agente que rompe el esquema muestra ⚠ y sus avisos; uno que cumple no', async ($, on) => {
  const { ui, disco } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\roto.md`]: archivoAgente('roto', 'base', ['general']),
  })
  // Los 4 roles migrados también traen avisos; el agente roto suma uno más.
  const contar = async () => (await textosDe(ui)).filter(x => /^ ⚠ \d+$/.test(x)).length
  await ui.press({ key: 'abrir-grupo-base' })
  expect(await contar()).toBe(5)
  await abrirAgente(ui, 'roto')
  const t = await textosDe(ui)
  expect(t.some(x => x.includes('⚠ La descripción no tiene «Usalo para».'))).toBe(true)
  expect(disco.fuera.length).toBe(0)
})

test('Equipos: un agente que cumple el esquema no muestra ⚠', async ($, on) => {
  const { ui } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\sano.md`]: agenteValido('sano', 'base'),
  })
  await abrirAgente(ui, 'sano')
  const t = await textosDe(ui)
  expect(t.some(x => x.includes('sano'))).toBe(true)
  // Solo los 4 roles migrados tienen aviso cerrado; el agente abierto no tiene ninguno.
  expect(t.filter(x => /^ ⚠ \d+$/.test(x)).length).toBe(4)
  expect(t.some(x => x.startsWith('⚠ '))).toBe(false)
})

test('Equipos: copiar nombre de tarjeta llama a ui.copy con el texto', async ($, on) => {
  const copias: string[] = []
  on('ui.copy', (_$: any, e: any) => {
    copias.push(String(e.text))
    return { value: { ok: true } }
  })
  const { ui } = await montarEquipos($, on, { [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', ['general']) })
  await abrirAgente(ui, 'alfa')
  await ui.press({ key: 'copiar-alfa' })
  await ui.redraw()
  expect(copias).toEqual(['T-?? · sonnet · base/alfa · '])
  expect((await textosDe(ui)).some(x => x.includes('Copiado: T-?? · sonnet · base/alfa · '))).toBe(true)
})

test('Equipos: la skill del equipo sale del disco falso y avisa si falta', async ($, on) => {
  const { ui, disco } = await montarEquipos($, on, {
    [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', ['general']),
    [`${RAIZ_FALSA}\\datos\\beta.md`]: archivoAgente('beta', 'datos', ['general']),
    [`${HOME_FALSO}\\.claude\\skills\\equipo-base\\SKILL.md`]: '---\nname: equipo-base\n---\n# Equipo base\nTrabajan juntos.\n',
  })
  await ui.press({ key: 'abrir-grupo-base' })
  await ui.press({ key: 'abrir-skill-base' })
  await ui.redraw()
  expect((await rotulo(ui, 'abrir-skill-base'))?.startsWith('▾')).toBe(true)
  const t = await textosDe(ui)
  expect(t.some(x => x.includes('Trabajan juntos.'))).toBe(true)
  expect(t.some(x => x.includes('name: equipo-base'))).toBe(false)
  await ui.press({ key: 'abrir-grupo-datos' })
  await ui.press({ key: 'abrir-skill-datos' })
  await ui.redraw()
  expect((await textosDe(ui)).some(x => x.includes('Este equipo no tiene skill todavía.'))).toBe(true)
  expect(disco.fuera.length).toBe(0)
})

test('Equipos: nuevo agente crea el archivo con la plantilla, rechaza inválidos y repetidos sin escribir', async ($, on) => {
  const { ui, disco } = await montarEquipos($, on, { [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', ['general']) })
  const escrituras = disco.escrituras.length
  await ui.press({ key: 'nuevo-agente' })
  await ui.redraw()
  const poner = async (nombre: string, equipo?: string) => {
    await ui.input({ plugin: 'tablero-oficina', key: 'nuevo-nombre', text: nombre, kind: 'change' })
    if (equipo) await ui.select({ plugin: 'tablero-oficina', key: 'nuevo-equipo', value: equipo })
    await ui.press({ key: 'nuevo-crear' })
    await ui.redraw()
  }
  await poner('Nombre Malo')
  expect((await textosDe(ui)).some(x => x.startsWith('No se pudo crear'))).toBe(true)
  await poner('alfa')
  expect((await textosDe(ui)).some(x => x.includes('ya existe un agente llamado alfa'))).toBe(true)
  expect(disco.escrituras.length).toBe(escrituras)

  await poner('nuevo-uno', 'datos')
  const ruta = `${RAIZ_FALSA}\\datos\\nuevo-uno.md`
  expect(disco.archivos.get(ruta)).toBe(serializeAgente(plantillaAgente('nuevo-uno', 'datos', RAIZ_FALSA)))
  expect((await textosDe(ui)).some(x => x.includes(`Creado ${ruta}.`))).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'editar-nuevo-uno' })) !== undefined).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'nuevo-crear' })) === undefined).toBe(true)

  // El archivo ya existe (aunque el catálogo no lo vea por nombre): no se sobrescribe.
  disco.archivos.set(`${RAIZ_FALSA}\\base\\oculto.md`, 'no es un agente válido')
  const antes = disco.escrituras.length
  await ui.press({ key: 'nuevo-agente' })
  await ui.redraw()
  await poner('oculto', 'base')
  expect(disco.escrituras.length).toBe(antes)
  expect(disco.archivos.get(`${RAIZ_FALSA}\\base\\oculto.md`)).toBe('no es un agente válido')
  expect(disco.fuera.length).toBe(0)
})

test('Equipos: barra y escena con las placas antes de los dioses; un solo friso (el de cierre)', async ($, on) => {
  const { ui } = await montarEquipos($, on, {})
  const alts = await altsSvg(ui)
  expect(alts.some(a => a.startsWith('Barco, loro ') && a.includes('Placas de los equipos'))).toBe(true)
  expect(alts.includes('Edificio de la oficina')).toBe(false)
  expect(alts.filter(a => a === 'Cornisa del edificio').length).toBe(1)
  // Cambio T-97: la cara chica «pensando» ya no existe; la cara grande de la cabecera común sigue a la emoción (aburrido sin agentes).
  const cara = alts.findIndex(a => /^Barco, loro /.test(a))
  const primerDios = alts.findIndex(a => /^Placa /.test(a))
  expect(cara >= 0).toBe(true)
  expect(primerDios > cara).toBe(true)
  expect(alts.some(a => /^Emblema del equipo/.test(a))).toBe(false)
})

test('Equipos: placa y contador por equipo', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  const alts = await altsSvg(ui)
  expect(alts.includes('Placa Caja de herramientas del equipo base')).toBe(true)
  // base tiene alfa y los 4 roles migrados; dev-a1 tiene 1.
  expect(alts.includes('5 en el contador')).toBe(true)
  expect(alts.includes('1 en el contador')).toBe(true)
})

test('Equipos: el encabezado de base lleva el color del equipo', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  const cajas = await ui.findAll({ type: 'Box', key: 'grupo-base' })
  expect(cajas.length).toBe(1)
  expect(cajas[0].props.borderColor).toBe('#8a93a0')
})

test('Equipos: agente cerrado sin borde, abierto con borde del equipo', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  await ui.press({ key: 'abrir-grupo-base' })
  const tarjeta = async () => (await ui.find({ type: 'Box', key: 'rol-alfa' })) as any
  const conBorde = (n: any): any[] => descendientes(n, x => x.type === 'Box' && x.props?.borderStyle !== undefined)
  const cerrada = await tarjeta()
  expect(cerrada.props.borderStyle).toBe(undefined)
  expect(conBorde(cerrada).length).toBe(0)
  await ui.press({ key: 'abrir-agente-alfa' })
  const abierta = await tarjeta()
  expect(abierta.props.borderStyle).toBe(undefined)
  const cajas = conBorde(abierta)
  expect(cajas.length).toBe(1)
  expect(cajas[0].props.borderColor).toBe('#8a93a0')
})

test('Equipos: ningún botón Editar tiene hotkey', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  await abrirTodo(ui)
  const editar = (await ui.findAll({ type: 'Button' })).filter((b: any) => String(b.key ?? '').startsWith('editar-'))
  expect(editar.length > 1).toBe(true)
  for (const b of editar) expect(b.props.hotkey).toBe(undefined)
})

// ---- T-97: cabecera común en las tres vistas ----
const enVista = async (ui: any, vista: 'subagentes' | 'equipos' | 'editar') => {
  if (vista === 'subagentes') await ui.press({ key: 'tab-subagentes' })
  else {
    await ui.press({ key: 'tab-roles' })
    if (vista === 'editar') {
      await abrirAgente(ui, 'alfa')
      await ui.press({ key: 'editar-alfa' })
    }
  }
  await ui.redraw()
}

for (const vista of ['subagentes', 'equipos', 'editar'] as const) {
  test(`cabecera común (${vista}): barra con pestañas y día maya, un solo jaguar, friso y sin fondos viejos`, async ($, on) => {
    const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
    await enVista(ui, vista)
    // (a) el primer Box hijo de la raíz es la barra.
    const raiz: any = (await ui.findAll({ type: 'Box' }))[0]
    const primero: any = (raiz.children ?? []).find((c: any) => typeof c === 'object' && c.type === 'Box')
    const clavesBarra = descendientes(primero, n => n.type === 'Button').map((n: any) => String(n.props?.key ?? n.key ?? ''))
    expect(clavesBarra.includes('tab-subagentes')).toBe(true)
    expect(clavesBarra.includes('tab-roles')).toBe(true)
    const altsBarra = descendientes(primero, n => n.type === 'Svg').map((n: any) => String(n.props?.alt ?? ''))
    expect(altsBarra.some(a => a.startsWith('Fecha de hoy: '))).toBe(true)
    // (b) exactamente un jaguar.
    const alts = await altsSvg(ui)
    expect(alts.filter(a => a.startsWith('Barco, loro ')).length).toBe(1)
    // (c) friso de cierre y escena propia.
    // El motor de pruebas no expone la key de un Svg: el friso de cierre se reconoce por su alt y por ir al final.
    expect(alts.filter(a => a === 'Cornisa del edificio').length).toBe(1)
    expect(alts[alts.length - 1]).toBe('Cornisa del edificio')
    const alt = alts.find(a => a.startsWith('Barco, loro ')) ?? ''
    expect(alt.includes('Placas de los equipos')).toBe(vista === 'equipos')
    expect(alt.includes('Taller de ')).toBe(vista === 'editar')
    expect(alts.includes('Edificio de la oficina')).toBe(false)
    expect(alts.includes('Pared del taller')).toBe(false)
    expect(alts.includes('Pizarra del taller')).toBe(false)
    // (f) ninguna caja de fondo de color cortada.
    for (const caja of await ui.findAll({ type: 'Box' })) {
      expect(['#1a1d16', '#1f1610', '#0f2418'].includes(String((caja as any).props.backgroundColor))).toBe(false)
    }
  })
}

test('cabecera común: la burbuja de Equipos con el jaguar aburrido cuenta equipos y agentes', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  expect((await altsSvg(ui)).some(a => a.startsWith('Barco, loro mirando el horizonte'))).toBe(true)
  expect((await textosDe(ui)).some(t => t.includes('equipos y'))).toBe(true)
})

test('cabecera común: en Editar, tras cambiar el modelo, la burbuja avisa de cambios sin guardar', async ($, on) => {
  const { ui } = await montarEquipos($, on, DOS_EQUIPOS)
  await abrirAgente(ui, 'alfa')
  await ui.press({ key: 'editar-alfa' })
  expect((await textosDe(ui)).some(t => t.includes('Editando alfa.'))).toBe(true)
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'haiku' })
  await ui.redraw()
  expect((await textosDe(ui)).some(t => t.includes('Hay cambios sin guardar'))).toBe(true)
})

const hayAbiertos = async (ui: any): Promise<boolean> =>
  (await ui.findAll({ type: 'Button' })).some((b: any) => /^(editar|abrir-skill)-/.test(String(b.key ?? '')))

test('Equipos: lo abierto se cierra al ir a Subagentes y volver (a)', async ($, on) => {
  const { ui } = await montarEquipos($, on, { [`${RAIZ_FALSA}\base\alfa.md`]: archivoAgente('alfa', 'base', ['general']) })
  await abrirAgente(ui, 'alfa')
  expect(await hayAbiertos(ui)).toBe(true)
  await ui.press({ key: 'tab-subagentes' })
  await ui.press({ key: 'tab-roles' })
  await ui.redraw()
  expect(await hayAbiertos(ui)).toBe(false)
  expect((await rotulo(ui, 'abrir-grupo-base'))?.startsWith('▸')).toBe(true)
})

test('Equipos: cerrar y volver a abrir el panel deja todo cerrado (b)', async ($, on) => {
  on('ui.open', () => ({ value: undefined }))
  const { ui } = await montarEquipos($, on, { [`${RAIZ_FALSA}\base\alfa.md`]: archivoAgente('alfa', 'base', ['general']) })
  await abrirAgente(ui, 'alfa')
  expect(await hayAbiertos(ui)).toBe(true)
  await $.command.run({ command: 'oficina' } as never)
  await ui.redraw()
  expect(await hayAbiertos(ui)).toBe(false)
})

test('Equipos: «Cómo trabaja el equipo» va dentro de la tarjeta del equipo (c)', async ($, on) => {
  const { ui } = await montarEquipos($, on, { [`${RAIZ_FALSA}\base\alfa.md`]: archivoAgente('alfa', 'base', ['general']) })
  await ui.press({ key: 'abrir-grupo-base' })
  await ui.redraw()
  const dios: any = await ui.find({ type: 'Svg', alt: 'Placa Caja de herramientas del equipo base' })
  expect(dios !== undefined).toBe(true)
  const tarjetas = (await ui.findAll({ type: 'Box' })).filter((b: any) => b.props?.borderStyle === 'round')
  const duena = tarjetas.find(
    (b: any) =>
      descendientes(b, n => n.type === 'Svg' && n.props?.alt === 'Placa Caja de herramientas del equipo base').length > 0 &&
      descendientes(b, n => n.type === 'Button' && n.props?.key === 'abrir-skill-base').length > 0,
  )
  expect(duena !== undefined).toBe(true)
})

test('Equipos: un equipo sin actividad en el patio avisa que hay que pensarla; uno con actividad no', async ($, on) => {
  const { ui } = await montarEquipos($, on, {
    ...DOS_EQUIPOS,
    [`${RAIZ_FALSA}\\marketing\\gama.md`]: archivoAgente('gama', 'marketing', []),
  })
  const t = await textosDe(ui)
  expect(t.some(x => x === '⚠ El equipo marketing no tiene actividad en el patio: hay que pensarla.')).toBe(true)
  expect(t.some(x => /El equipo (base|dev-a1) no tiene actividad/.test(x))).toBe(false)
})

test('Equipos: /oficina abre el panel con el robot saludando', async ($, on) => {
  fsFalso(on, { [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', []) })
  mock.clock(on, { now: 1_000_000 })
  mock.store(on, {})
  on('agent.list', () => ({ value: [] }))
  on('ui.panes', () => ({ value: PANES }))
  on('ui.open', () => ({ value: undefined }))
  await $.command.run({ command: 'oficina' } as never)
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 60 },
  })
  expect((await altsSvg(ui)).includes('Barco, loro saludando con el ala')).toBe(true)
  expect((await textosDe(ui)).some(x => /¡Hola!/.test(x))).toBe(true)
})

test('compu nueva: abrir /oficina y Equipos no escribe nada en la carpeta de agentes', async ($, on) => {
  const disco = fsFalso(on, {}, { vacio: true })
  mock.clock(on, { now: 1_000_000 })
  mock.store(on, {})
  on('agent.list', () => ({ value: [] }))
  on('ui.panes', () => ({ value: PANES }))
  on('ui.open', () => ({ value: undefined }))
  on('agent.register', () => ({ value: undefined }))
  await $.command.run({ command: 'oficina' } as never)
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 200, rows: 80 },
  })
  await ui.press({ key: 'tab-roles' })
  expect(disco.escrituras).toEqual([])
  expect((await textosDe(ui)).some(x => /^No hay agentes en .*Lo mejor es instalar los del kit/.test(x))).toBe(true)
  expect((await ui.find({ type: 'Button', key: 'roles-base' })) !== undefined).toBe(true)
})

test('compu nueva: «Crear los 4 roles base» pide confirmación y los crea cumpliendo el esquema', async ($, on) => {
  const { ui, disco } = await montarEquipos($, on, {}, {}, { vacio: true })
  await ui.press({ key: 'roles-base' })
  await ui.press({ key: 'roles-base-no' })
  expect(disco.escrituras).toEqual([])
  await ui.press({ key: 'roles-base' })
  await ui.press({ key: 'roles-base-si' })
  for (const nombre of ['implementador', 'corrector', 'investigador', 'revisor']) {
    expect(disco.archivos.has(`${RAIZ_FALSA}\\base\\${nombre}.md`)).toBe(true)
  }
  expect(disco.escrituras.length).toBe(4)
  // Cumplen el esquema: ningún ⚠ en la lista.
  await ui.press({ key: 'abrir-grupo-base' })
  expect((await textosDe(ui)).filter(x => /^ ⚠ \d+$/.test(x)).length).toBe(0)
  expect((await textosDe(ui)).some(x => /^Creados implementador, corrector, investigador, revisor en /.test(x))).toBe(true)
  expect(disco.fuera.length).toBe(0)
})

test('crear los roles base no pisa un archivo que ya existe, aunque el catálogo no lo lea', async ($, on) => {
  const roto = 'sin frontmatter: lo escribió otra persona'
  const { ui, disco } = await montarEquipos($, on, { [`${RAIZ_FALSA}\\base\\revisor.md`]: roto }, {}, { vacio: true })
  await ui.press({ key: 'roles-base' })
  await ui.press({ key: 'roles-base-si' })
  expect(disco.archivos.get(`${RAIZ_FALSA}\\base\\revisor.md`)).toBe(roto)
  expect(disco.escrituras.length).toBe(3)
  expect((await textosDe(ui)).some(x => /^Creados implementador, corrector, investigador en /.test(x))).toBe(true)
})
