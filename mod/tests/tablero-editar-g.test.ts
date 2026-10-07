import { expect, test } from 'claude-code/testing'

import { RAIZ_FALSA, archivoAgente, abrirAgente, montarEquipos, textosDe, agenteValido, altsSvg, descendientes } from './ayuda-tablero'
import { cambiosBorrador, partirSecciones, reemplazarSeccion, textoSeccion, tituloSeccion, unirSecciones } from '../hooks/tablero-nucleo'
import { CLARO, contrasteHex } from '../hooks/tema'

// Oleada G: vista «Editar agente» (docs/plan-editar-agente-2026-10-06.md).

const BETA = `${RAIZ_FALSA}\\dev-a1\\beta.md`
const SANO = `${RAIZ_FALSA}\\base\\sano.md`

const editar = async ($: any, on: any, archivos: Record<string, string>, nombre: string, grupo = 'base') => {
  const r = await montarEquipos($, on, archivos)
  await abrirAgente(r.ui, nombre, grupo)
  await r.ui.press({ key: `editar-${nombre}` })
  await r.ui.redraw()
  return r
}

// ---- Funciones puras ----

test('partirSecciones y unirSecciones devuelven el texto exacto', () => {
  const casos = [
    '',
    'Sin títulos.',
    'Preámbulo.\n\n## Rol\nUno.\n\n## Límites\nDos.\n',
    '## Rol\nSolo título al final\n## Entrega',
    'a\n## b\n\n\n## c\r\nx',
  ]
  for (const p of casos) expect(unirSecciones(partirSecciones(p))).toBe(p)
  const s = partirSecciones('Pre.\n\n## Rol\nUno.\n\n## Límites\nDos.')
  expect(s.map(x => tituloSeccion(x, false))).toEqual(['Preámbulo', 'Rol', 'Límites'])
  expect(tituloSeccion(partirSecciones('solo')[0], true)).toBe('Texto completo')
})

test('reemplazarSeccion cambia solo esa sección y conserva la separación', () => {
  const p = 'Pre.\n\n## Rol\nUno.\n\n## Límites\nDos.\n'
  expect(reemplazarSeccion(p, 1, 'Nuevo rol.')).toBe('Pre.\n\n## Rol\nNuevo rol.\n\n## Límites\nDos.\n')
  expect(reemplazarSeccion(p, 2, 'Otro.')).toBe('Pre.\n\n## Rol\nUno.\n\n## Límites\nOtro.\n')
  expect(reemplazarSeccion(p, 9, 'x')).toBe(p)
  // Mientras se tipea, el espacio del final no se pierde.
  const conEspacio = reemplazarSeccion(p, 1, 'Nuevo ')
  expect(textoSeccion(partirSecciones(conEspacio)[1])).toBe('Nuevo ')
  expect(conEspacio.includes('Nuevo \n\n## Límites')).toBe(true)
})

test('cambiosBorrador lista lo que cambia, en orden', () => {
  const a = { description: 'abc', prompt: 'p', model: 'sonnet', effort: 'medium', tools: ['Read', 'Glob', 'Grep', 'Skill'] }
  expect(cambiosBorrador(a, { ...a })).toEqual([])
  expect(cambiosBorrador(a, { ...a, model: 'haiku', description: 'abcdef', prompt: '' })).toEqual([
    'modelo sonnet → haiku',
    'descripción (+3 caracteres)',
    'instrucciones (−1 carácter)',
  ])
  expect(cambiosBorrador(a, { ...a, tools: null })).toEqual(['herramientas solo lectura → todas'])
})

// ---- G-1: encabezado sin repetir ----

test('G-1: el nombre se lee (contraste ≥ 4,5) y la placa no se repite debajo de la escena', async ($, on) => {
  const { ui } = await editar($, on, { [SANO]: agenteValido('sano', 'base') }, 'sano')
  expect((await altsSvg(ui)).filter(a => /^Bandera |^Ícono del rol/.test(a)).length).toBe(0)
  const nombres = (await ui.findAll({ type: 'Text' })).filter((t: any) => String(t.text ?? '') === 'sano' && t.props.bold)
  expect(nombres.length > 0).toBe(true)
  for (const t of nombres) expect(contrasteHex(String(t.props.color), CLARO.panel) >= 4.5).toBe(true)
  expect((await textosDe(ui)).some(t => t.startsWith('equipo base · '))).toBe(true)
})

// ---- G-2: tarjetas ----

test('G-2: tres tarjetas con el borde del equipo y contador de la descripción', async ($, on) => {
  const { ui } = await editar($, on, { [BETA]: archivoAgente('beta', 'dev-a1', []) }, 'beta', 'dev-a1')
  const claves = ['rol-tarjeta-trabaja', 'rol-tarjeta-cuando', 'rol-tarjeta-instrucciones']
  const tarjetas = await Promise.all(claves.map(key => ui.find({ type: 'Box', key })))
  for (const t of tarjetas) {
    expect(t !== undefined).toBe(true)
    expect(t.props.borderStyle).toBe('round')
  }
  expect(new Set(tarjetas.map((t: any) => t.props.borderColor)).size).toBe(1)
  // Los selectores viven dentro de «Cómo trabaja».
  expect(descendientes(tarjetas[0], n => n.type === 'Select').length).toBe(3)
  expect((await textosDe(ui)).includes(`${'Descripción de beta'.length}/200`)).toBe(true)
})

// ---- G-3: avisos del esquema ----

test('G-3: «Para revisar» con los avisos del borrador y «✓ Cumple el esquema» cuando no quedan', async ($, on) => {
  const { ui } = await editar($, on, { [SANO]: agenteValido('sano', 'base') }, 'sano')
  expect((await textosDe(ui)).includes('✓ Cumple el esquema')).toBe(true)
  await ui.press({ key: 'rol-ver-desc' })
  await ui.input({ plugin: 'tablero-oficina', key: 'rol-description', text: 'Hace algo.', kind: 'change' })
  await ui.redraw()
  const t = await textosDe(ui)
  expect(t.includes('✓ Cumple el esquema')).toBe(false)
  expect(t.some(x => x.startsWith('Para revisar (2)'))).toBe(true)
  expect(t.some(x => x === '⚠ La descripción no tiene «Usalo para».')).toBe(true)
})

test('G-3: guardar con avisos no bloquea y lo dice', async ($, on) => {
  const { ui, disco } = await editar($, on, { [SANO]: agenteValido('sano', 'base') }, 'sano')
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'opus' })
  await ui.press({ key: 'rol-guardar' })
  await ui.redraw()
  expect(disco.archivos.get(SANO)!.includes('model: opus')).toBe(true)
  expect((await textosDe(ui)).some(x => x.startsWith(`Guardado en ${SANO} con 1 aviso para revisar.`))).toBe(true)
})

// ---- G-4: qué cambia al guardar ----

test('G-4: «Vas a cambiar» aparece solo con cambios', async ($, on) => {
  const { ui } = await editar($, on, { [SANO]: agenteValido('sano', 'base') }, 'sano')
  const linea = async () => (await textosDe(ui)).find(t => t.startsWith('Vas a cambiar: '))
  expect(await linea()).toBe(undefined)
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'haiku' })
  expect(await linea()).toBe('Vas a cambiar: modelo sonnet → haiku')
})

// ---- G-5a: abrir en el editor y releer ----

test('G-5a: «Abrir en el editor» corre code con la ruta y «Releer archivo» toma lo de afuera', async ($, on) => {
  const llamadas: string[][] = []
  on('process.run', (_$: any, e: any) => {
    llamadas.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const { ui, disco } = await editar($, on, { [SANO]: agenteValido('sano', 'base') }, 'sano')
  await ui.press({ key: 'rol-abrir-editor' })
  await ui.redraw()
  expect(llamadas).toEqual([['code', SANO]])
  expect((await textosDe(ui)).some(t => t.startsWith(`Abierto en el editor: ${SANO}.`))).toBe(true)
  // Se edita por fuera y se relee.
  disco.archivos.set(SANO, disco.archivos.get(SANO)!.replace('Hace algo.', 'Hace otra cosa.'))
  await ui.press({ key: 'rol-releer' })
  await ui.redraw()
  expect((await textosDe(ui)).some(t => t.startsWith('Hace otra cosa.'))).toBe(true)
  expect((await textosDe(ui)).some(t => t.startsWith('Vas a cambiar'))).toBe(false)
})

test('G-5a: sin editor se copia la ruta', async ($, on) => {
  on('process.run', () => {
    throw new Error('ENOENT')
  })
  const copias: string[] = []
  on('ui.copy', (_$: any, e: any) => {
    copias.push(String(e.text))
    return { value: { ok: true } }
  })
  const { ui } = await editar($, on, { [SANO]: agenteValido('sano', 'base') }, 'sano')
  await ui.press({ key: 'rol-abrir-editor' })
  await ui.redraw()
  expect(copias).toEqual([SANO])
  expect((await textosDe(ui)).some(t => t.includes('No encontré el editor') && t.includes(SANO))).toBe(true)
})

// ---- G-5b: editar por secciones ----

test('G-5b: cambiar una sección reescribe solo esa al guardar', async ($, on) => {
  const { ui, disco } = await editar($, on, { [SANO]: agenteValido('sano', 'base') }, 'sano')
  await ui.press({ key: 'rol-ver-prompt' })
  const titulos = (await ui.findAll({ type: 'Button' }))
    .filter((b: any) => /^rol-ver-seccion-/.test(String(b.key ?? '')))
    .map((b: any) => String(b.props.label))
  expect(titulos.map((t: string) => t.replace(/ \(.*$/, ''))).toEqual([
    '▸ Preámbulo',
    '▸ Rol',
    '▸ Antes de empezar',
    '▸ Cómo trabajás',
    '▸ Límites',
    '▸ Entrega',
  ])
  await ui.press({ key: 'rol-ver-seccion-4' })
  await ui.press({ key: 'rol-cambiar-seccion-4' })
  await ui.input({ plugin: 'tablero-oficina', key: 'rol-seccion-input-4', text: 'Nunca borres archivos.', kind: 'change' })
  await ui.press({ key: 'rol-guardar' })
  await ui.redraw()
  const escrito = disco.archivos.get(SANO)!
  expect(escrito.includes('## Límites\nNunca borres archivos.\n\n## Entrega\n…')).toBe(true)
  expect(escrito.includes('## Cómo trabajás\n…\n\n## Límites')).toBe(true)
})

// ---- G-6: ficha en solo lectura ----

test('G-6: equipo, etiquetas y extras se ven en «Cómo trabaja»', async ($, on) => {
  const { ui } = await editar($, on, { [BETA]: archivoAgente('beta', 'dev-a1', ['frontend']) }, 'beta', 'dev-a1')
  const t = await textosDe(ui)
  expect(t.filter(x => x === 'etiquetas: frontend · maxTurns: 5').length).toBe(1)
})

// ---- G-7: volver a la versión anterior ----

test('G-7: tras guardar se puede volver a la versión anterior (y deshacerlo)', async ($, on) => {
  const original = archivoAgente('beta', 'dev-a1', [])
  const { ui, disco } = await editar($, on, { [BETA]: original }, 'beta', 'dev-a1')
  expect((await ui.find({ type: 'Button', key: 'rol-anterior' })) === undefined).toBe(true)
  await ui.select({ plugin: 'tablero-oficina', key: 'rol-model', value: 'haiku' })
  await ui.press({ key: 'rol-guardar' })
  await ui.redraw()
  const guardado = disco.archivos.get(BETA)!
  expect(guardado.includes('model: haiku')).toBe(true)
  await abrirAgente(ui, 'beta', 'dev-a1')
  await ui.press({ key: 'editar-beta' })
  await ui.press({ key: 'rol-anterior' })
  const escriturasAntes = disco.escrituras.length
  expect((await ui.find({ type: 'Button', key: 'rol-anterior-si' })) !== undefined).toBe(true)
  expect(disco.escrituras.length).toBe(escriturasAntes)
  await ui.press({ key: 'rol-anterior-si' })
  await ui.redraw()
  expect(disco.archivos.get(BETA)).toBe(original)
  // Lo que estaba quedó como copia: se puede deshacer.
  await abrirAgente(ui, 'beta', 'dev-a1')
  await ui.press({ key: 'editar-beta' })
  await ui.press({ key: 'rol-anterior' })
  await ui.press({ key: 'rol-anterior-si' })
  await ui.redraw()
  expect(disco.archivos.get(BETA)).toBe(guardado)
})
