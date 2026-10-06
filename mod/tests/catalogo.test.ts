import { expect, test } from 'claude-code/testing'
import {
  JUEGOS_HERRAMIENTAS,
  listarCatalogo,
  migrarRoles,
  nombreTarjeta,
  parseAgente,
  plantillaAgente,
  rolAAgente,
  rolesBaseEsquema,
  serializeAgente,
  validarAgente,
  type AgenteCatalogo,
  type FsMin,
} from '../hooks/catalogo'
import { DEFAULT_ROLES, PREAMBLE } from '../hooks/roles'

const RAIZ = 'C:\\x\\agents'

function fsFalso(archivos: Record<string, string>): FsMin & { mapa: Map<string, string> } {
  const mapa = new Map(Object.entries(archivos))
  const hijos = (dir: string) => {
    const pref = `${dir}\\`
    const out = new Map<string, 'file' | 'dir'>()
    for (const ruta of mapa.keys()) {
      if (!ruta.startsWith(pref)) continue
      const resto = ruta.slice(pref.length)
      const i = resto.indexOf('\\')
      if (i < 0) out.set(resto, 'file')
      else out.set(resto.slice(0, i), 'dir')
    }

    return [...out].map(([name, kind]) => ({ name, kind }))
  }

  return {
    mapa,
    list: async p => hijos(p),
    read: async p => {
      const t = mapa.get(p)
      if (t === undefined) throw new Error('no existe')

      return t
    },
    write: async (p, t) => {
      mapa.set(p, t)
    },
    exists: async p => [...mapa.keys()].some(k => k === p || k.startsWith(`${p}\\`)),
  }
}

const COMPLETO =
  '---\r\n# comentario\r\nname: implementador\r\ndescription: "Escribe código: según una tarjeta"\r\n' +
  "model: sonnet\r\neffort: high\r\ntools: Read, Write, 'Edit'\r\ncolor: green\r\nmaxTurns: 20\r\n" +
  'equipos: [base, "web dev"]\r\netiquetas: [codigo]\r\nemblema: greca\r\n---\r\nLínea uno\r\nLínea dos\r\n'

test('parse de un archivo completo con CRLF, comillas y listas', async () => {
  const r = parseAgente(COMPLETO, `${RAIZ}\\base\\implementador.md`)
  expect(r.ok).toBe(true)
  if (!r.ok) return
  const a = r.agente
  expect(a.name).toBe('implementador')
  expect(a.description).toBe('Escribe código: según una tarjeta')
  expect(a.model).toBe('sonnet')
  expect(a.effort).toBe('high')
  expect(a.tools).toEqual(['Read', 'Write', 'Edit'])
  expect(a.color).toBe('green')
  expect(a.equipos).toEqual(['base', 'web dev'])
  expect(a.etiquetas).toEqual(['codigo'])
  expect(a.emblema).toBe('greca')
  expect(a.extra).toEqual({ maxTurns: '20' })
  expect(a.prompt).toBe('Línea uno\nLínea dos')
})

test('descripcion con dos puntos sin comillas', async () => {
  const r = parseAgente('---\nname: a\ndescription: Hace esto: y aquello\n---\ncuerpo\n', 'a.md')
  expect(r.ok && r.agente.description).toBe('Hace esto: y aquello')
})

test('error sin frontmatter', async () => {
  const r = parseAgente('solo texto', 'a.md')
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.error).toMatch(/frontmatter/)
})

test('error sin name', async () => {
  const r = parseAgente('---\ndescription: x\n---\ncuerpo', 'a.md')
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.error).toMatch(/name/)
})

test('error sin description', async () => {
  const r = parseAgente('---\nname: a\n---\ncuerpo', 'a.md')
  expect(r.ok).toBe(false)
  if (!r.ok) expect(r.error).toMatch(/description/)
})

test('defaults de model, effort, etiquetas y tools', async () => {
  const r = parseAgente('---\nname: a\ndescription: d\n---\nx', 'a.md')
  expect(r.ok).toBe(true)
  if (!r.ok) return
  expect(r.agente.model).toBe('inherit')
  expect(r.agente.effort).toBe('medium')
  expect(r.agente.etiquetas).toEqual([])
  expect(r.agente.equipos).toEqual([])
  expect(r.agente.tools).toBe(null)
})

test('equipo deducido de la carpeta cuando no hay equipos', async () => {
  const r = parseAgente('---\nname: a\ndescription: d\n---\nx', `${RAIZ}\\ops\\a.md`)
  expect(r.ok && r.agente.equipos).toEqual(['ops'])
  const r2 = parseAgente('---\nname: a\ndescription: d\n---\nx', `${RAIZ}\\a.md`)
  expect(r2.ok && r2.agente.equipos).toEqual([])
})

test('ida y vuelta para los 4 roles por defecto', async () => {
  for (const [nombre, spec] of Object.entries(DEFAULT_ROLES)) {
    const a = rolAAgente(nombre, spec, RAIZ)
    expect(a.ruta).toBe(`${RAIZ}\\base\\${nombre}.md`)
    const texto = serializeAgente(a)
    expect(texto.endsWith('\n')).toBe(true)
    const r = parseAgente(texto, a.ruta)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.agente).toEqual(a)
  }
})

test('ida y vuelta con valores que piden comillas y extra', async () => {
  const a = {
    name: 'x',
    description: '# raro: "con" comillas [y] corchetes',
    prompt: 'uno\n\ndos',
    tools: null,
    model: 'inherit',
    effort: 'low',
    equipos: ['a, b', 'c'],
    etiquetas: [],
    extra: { maxTurns: '5', skills: '[uno, dos]' },
    ruta: 'x.md',
  }
  const r = parseAgente(serializeAgente(a), 'x.md')
  expect(r.ok).toBe(true)
  if (r.ok) expect(r.agente).toEqual(a)
})

test('listarCatalogo: raiz inexistente da vacio', async () => {
  const r = await listarCatalogo(fsFalso({}), RAIZ)
  expect(r.agentes).toEqual([])
  expect(r.errores).toEqual([])
})

test('listarCatalogo: roto a errores, README ignorado, ordenado', async () => {
  const ok = (n: string) => `---\nname: ${n}\ndescription: d\n---\np\n`
  const fs = fsFalso({
    [`${RAIZ}\\README.md`]: 'hola',
    [`${RAIZ}\\suelto.md`]: ok('suelto'),
    [`${RAIZ}\\base\\roto.md`]: 'sin frontmatter',
    [`${RAIZ}\\base\\zeta.md`]: ok('zeta'),
    [`${RAIZ}\\base\\alfa.md`]: ok('alfa'),
    [`${RAIZ}\\base\\notas.txt`]: 'x',
    [`${RAIZ}\\ops\\README.md`]: 'x',
    [`${RAIZ}\\ops\\beta.md`]: ok('beta'),
  })
  const r = await listarCatalogo(fs, RAIZ)
  expect(r.agentes.map(a => a.name)).toEqual(['suelto', 'alfa', 'zeta', 'beta'])
  expect(r.errores.length).toBe(1)
  expect(r.errores[0].ruta).toBe(`${RAIZ}\\base\\roto.md`)
})

test('listarCatalogo: nombre repetido va a errores', async () => {
  const ok = `---\nname: igual\ndescription: d\n---\np\n`
  const fs = fsFalso({ [`${RAIZ}\\a\\igual.md`]: ok, [`${RAIZ}\\b\\igual.md`]: ok })
  const r = await listarCatalogo(fs, RAIZ)
  expect(r.agentes.length).toBe(1)
  expect(r.errores.length).toBe(1)
  expect(r.errores[0].error).toMatch(/nombre repetido/)
})

test('migrarRoles: escribe los 4 y la segunda vez nada', async () => {
  const fs = fsFalso({})
  const uno = await migrarRoles(fs, RAIZ, DEFAULT_ROLES)
  expect(uno.escritos.length).toBe(4)
  expect(fs.mapa.size).toBe(4)
  const dos = await migrarRoles(fs, RAIZ, DEFAULT_ROLES)
  expect(dos.escritos.length).toBe(0)
  expect(dos.existentes.length).toBe(4)
  expect(fs.mapa.size).toBe(4)
})

test('migrarRoles: no escribe un rol que ya existe en otra carpeta', async () => {
  const fs = fsFalso({ [`${RAIZ}\\otro\\mio.md`]: '---\nname: revisor\ndescription: d\n---\np\n' })
  const r = await migrarRoles(fs, RAIZ, DEFAULT_ROLES)
  expect(r.escritos.length).toBe(3)
  expect(r.existentes).toEqual(['revisor'])
  expect(fs.mapa.has(`${RAIZ}\\base\\revisor.md`)).toBe(false)
})

// ---------- esquema de agentes ----------

const AVISO_SKILL = 'No tiene la herramienta Skill: no puede cargar skills.'
const plantilla = () => plantillaAgente('mi-agente', 'dev-a1', RAIZ)
const rota = (cambios: Partial<AgenteCatalogo>): AgenteCatalogo => ({ ...plantilla(), ...cambios })

test('plantilla cumple el esquema', async () => {
  const a = plantilla()
  expect(validarAgente(a)).toEqual([])
  expect(a.ruta).toBe(`${RAIZ}\\dev-a1\\mi-agente.md`)
  expect(a.color).toBe('orange')
  expect(a.emblema).toBe('cruz')
  expect(a.prompt.startsWith(PREAMBLE)).toBe(true)
})

test('plantilla con equipo desconocido usa color y emblema de base', async () => {
  const a = plantillaAgente('x', 'nuevo', 'C:/x/agents')
  expect(a.color).toBe('green')
  expect(a.emblema).toBe('greca')
  expect(a.ruta).toBe('C:/x/agents/nuevo/x.md')
})

test('plantilla con nombre invalido lanza', async () => {
  expect(() => plantillaAgente('Mal Nombre', 'base', RAIZ)).toThrow(/minúsculas/)
  expect(() => plantillaAgente('', 'base', RAIZ)).toThrow()
  expect(() => plantillaAgente('a'.repeat(65), 'base', RAIZ)).toThrow()
})

test('validarAgente: una regla por vez', async () => {
  const casos: [Partial<AgenteCatalogo>, RegExp][] = [
    [{ description: `Hace. Usalo para x. No lo uses para y. ${'z'.repeat(200)}` }, /máximo es 200/],
    [{ description: 'Hace. No lo uses para y.' }, /Usalo para/],
    [{ description: 'Hace. Usalo para x.' }, /No lo uses para/],
    [{ name: 'otro' }, /nombre del archivo/],
    [{ equipos: [] }, /equipo principal/],
    [{ equipos: ['inventado'] }, /no está en la tabla/],
    [{ color: 'red' }, /color debería ser/],
    [{ emblema: 'x' }, /emblema debería ser/],
    [{ model: 'opus' }, /opus se pide en la llamada/],
    [{ tools: null }, /todas las herramientas/],
    [{ tools: ['Read', 'Bash', 'Skill'] }, /ningún juego/],
    [{ tools: ['Read', 'Glob', 'Grep'] }, /^No tiene la herramienta Skill: no puede cargar skills\.$/],
    [{ prompt: plantilla().prompt.replace(PREAMBLE, 'otro') }, /preámbulo/],
    [{ prompt: plantilla().prompt.replace('## Límites', '').replace('## Entrega', '') }, /Límites.*Entrega/],
  ]
  for (const [cambio, patron] of casos) {
    const avisos = validarAgente(rota(cambio))
    expect(avisos.length).toBe(1)
    expect(avisos[0]).toMatch(patron)
  }
})

test('validarAgente: herramientas como conjunto en otro orden', async () => {
  expect(validarAgente(rota({ tools: ['Skill', 'Grep', 'Read', 'Glob'] }))).toEqual([])
  expect(validarAgente(rota({ tools: ['PowerShell', 'Skill', 'Bash', 'Grep', 'Glob', 'Read'] }))).toEqual([])
  expect(validarAgente(rota({ tools: ['Grep', 'Read', 'Glob'] }))).toEqual([AVISO_SKILL])
  expect(validarAgente(rota({ tools: ['PowerShell', 'Bash', 'Grep', 'Glob', 'Read'] }))).toEqual([AVISO_SKILL])
})

test('validarAgente: los 4 juegos con Skill validan sin avisos', async () => {
  for (const juego of Object.values(JUEGOS_HERRAMIENTAS)) {
    expect(validarAgente(rota({ tools: [...juego, 'Skill'] }))).toEqual([])
  }
})

test('validarAgente: Skill solo no es un juego', async () => {
  const avisos = validarAgente(rota({ tools: ['Read', 'Bash', 'Skill'] }))
  expect(avisos.length).toBe(1)
  expect(avisos[0]).toMatch(/ningún juego/)
})

test('plantilla trae Skill', async () => {
  expect(plantilla().tools).toContain('Skill')
})

test('DEFAULT_ROLES: corrector e investigador ya no usan haiku', async () => {
  expect(DEFAULT_ROLES.corrector.model).toBe('sonnet')
  expect(DEFAULT_ROLES.corrector.effort).toBe('medium')
  expect(DEFAULT_ROLES.investigador.model).toBe('sonnet')
  expect(DEFAULT_ROLES.investigador.effort).toBe('low')
})

test('validarAgente: los roles base viejos dan avisos de secciones', async () => {
  const a = rolAAgente('revisor', DEFAULT_ROLES.revisor, RAIZ)
  expect(validarAgente(a).some(v => v.includes('Faltan secciones'))).toBe(true)
})

test('nombreTarjeta con y sin equipo', async () => {
  expect(nombreTarjeta(plantilla())).toBe('T-?? · sonnet · dev-a1/mi-agente · ')
  expect(nombreTarjeta(rota({ equipos: [] }))).toBe('mi-agente')
})

test('plantilla: serializar, parsear y validar sigue en vacio', async () => {
  const a = plantilla()
  const r = parseAgente(serializeAgente(a), a.ruta)
  expect(r.ok).toBe(true)
  if (r.ok) expect(validarAgente(r.agente)).toEqual([])
})

test('rolesBaseEsquema: los 4 roles base cumplen el esquema y van a base', async () => {
  const roles = rolesBaseEsquema(DEFAULT_ROLES, RAIZ)
  expect(roles.map(a => a.name).join(',')).toBe('implementador,corrector,investigador,revisor')
  for (const a of roles) {
    expect(validarAgente(a)).toEqual([])
    expect(a.ruta).toBe(`${RAIZ}\\base\\${a.name}.md`)
    const r = parseAgente(serializeAgente(a), a.ruta)
    expect(r.ok && validarAgente(r.agente).length).toBe(0)
  }
})
