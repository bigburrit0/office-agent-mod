import type { RolSpec } from '../types/index'
import { PREAMBLE } from './roles'

// Catálogo de agentes nativos de Claude Code: archivos .md con frontmatter simple.
// Todo puro o con un fs inyectado; sin llamadas al motor.

export type AgenteCatalogo = {
  name: string
  description: string
  prompt: string
  tools: string[] | null
  model: string
  effort: string
  color?: string
  equipos: string[]
  etiquetas: string[]
  emblema?: string
  /** Líneas de frontmatter desconocidas (maxTurns, skills...), valor crudo, para reescribirlas tal cual. */
  extra: Record<string, string>
  ruta: string
}

export type FsMin = {
  list(path: string): Promise<{ name: string; kind: 'file' | 'dir' | 'other' }[]>
  read(path: string): Promise<string>
  write(path: string, text: string): Promise<void>
  exists(path: string): Promise<boolean>
}

export const COLOR_POR_ROL: Record<string, string> = {
  implementador: 'blue',
  corrector: 'orange',
  investigador: 'purple',
  revisor: 'green',
}

const CONOCIDAS = ['name', 'description', 'model', 'effort', 'tools', 'color', 'equipos', 'etiquetas', 'emblema']

function unquote(raw: string): string {
  const v = raw.trim()
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\(["\\])/g, '$1')
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/''/g, "'")
  }

  return v
}

// Parte por comas respetando comillas.
function splitComas(raw: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote = ''
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (quote) {
      cur += c
      if (c === '\\' && quote === '"' && i + 1 < raw.length) {
        cur += raw[++i]
      } else if (c === quote) {
        quote = ''
      }
    } else if (c === '"' || c === "'") {
      quote = c
      cur += c
    } else if (c === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)

  return out.map(s => unquote(s)).filter(s => s !== '')
}

function parseLista(raw: string): string[] {
  const v = raw.trim()
  if (v.startsWith('[') && v.endsWith(']')) return splitComas(v.slice(1, -1))

  return splitComas(v)
}

export function parseAgente(
  texto: string,
  ruta: string,
): { ok: true; agente: AgenteCatalogo } | { ok: false; error: string } {
  const lineas = texto.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  let i = 0
  while (i < lineas.length && lineas[i].trim() === '') i++
  if (i >= lineas.length || lineas[i].trim() !== '---') {
    return { ok: false, error: 'Falta el frontmatter (el archivo debe empezar con una línea ---)' }
  }
  let fin = -1
  for (let j = i + 1; j < lineas.length; j++) {
    if (lineas[j].trim() === '---') {
      fin = j
      break
    }
  }
  if (fin < 0) return { ok: false, error: 'Falta el cierre del frontmatter (otra línea ---)' }

  const campos: Record<string, string> = {}
  const extra: Record<string, string> = {}
  for (const linea of lineas.slice(i + 1, fin)) {
    const t = linea.trim()
    if (t === '' || t.startsWith('#')) continue
    const corte = linea.indexOf(': ')
    let clave: string
    let valor: string
    if (corte >= 0) {
      clave = linea.slice(0, corte).trim()
      valor = linea.slice(corte + 2).trim()
    } else if (t.endsWith(':')) {
      clave = t.slice(0, -1).trim()
      valor = ''
    } else {
      continue
    }
    if (!clave) continue
    if (CONOCIDAS.includes(clave)) campos[clave] = valor
    else extra[clave] = valor
  }

  const name = unquote(campos.name ?? '')
  if (!name) return { ok: false, error: 'Falta el campo name' }
  const description = unquote(campos.description ?? '')
  if (!description) return { ok: false, error: 'Falta el campo description' }

  const prompt = lineas.slice(fin + 1).join('\n').replace(/^\n+/, '').replace(/\s+$/, '')

  let tools: string[] | null = null
  if (campos.tools !== undefined) {
    const lista = parseLista(campos.tools)
    tools = lista.length > 0 ? lista : null
  }

  let equipos = campos.equipos !== undefined ? parseLista(campos.equipos) : []
  if (equipos.length === 0) {
    const partes = ruta.split(/[\\/]/).filter(p => p !== '')
    const padre = partes.length >= 2 ? partes[partes.length - 2] : ''
    if (padre && padre !== 'agents') equipos = [padre]
  }

  const agente: AgenteCatalogo = {
    name,
    description,
    prompt,
    tools,
    model: unquote(campos.model ?? '') || 'inherit',
    effort: unquote(campos.effort ?? '') || 'medium',
    equipos,
    etiquetas: campos.etiquetas !== undefined ? parseLista(campos.etiquetas) : [],
    extra,
    ruta,
  }
  const color = unquote(campos.color ?? '')
  if (color) agente.color = color
  const emblema = unquote(campos.emblema ?? '')
  if (emblema) agente.emblema = emblema

  return { ok: true, agente }
}

function necesitaComillas(v: string): boolean {
  return (
    v === '' ||
    v !== v.trim() ||
    /^[\[{"'#]/.test(v) ||
    v.includes(': ') ||
    v.includes(' #') ||
    v.endsWith(':')
  )
}

function esc(valor: string): string {
  const v = valor.replace(/\s*\n\s*/g, ' ')
  if (!necesitaComillas(v)) return v

  return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function escItem(valor: string): string {
  const v = valor.replace(/\s*\n\s*/g, ' ')
  if (!necesitaComillas(v) && !/[,\[\]]/.test(v)) return v

  return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function serializeAgente(a: AgenteCatalogo): string {
  const l: string[] = ['---']
  l.push(`name: ${esc(a.name)}`)
  l.push(`description: ${esc(a.description)}`)
  l.push(`model: ${esc(a.model)}`)
  l.push(`effort: ${esc(a.effort)}`)
  if (a.tools !== null) l.push(`tools: ${a.tools.map(escItem).join(', ')}`)
  if (a.color) l.push(`color: ${esc(a.color)}`)
  for (const [k, v] of Object.entries(a.extra)) l.push(`${k}: ${v}`)
  l.push(`equipos: [${a.equipos.map(escItem).join(', ')}]`)
  l.push(`etiquetas: [${a.etiquetas.map(escItem).join(', ')}]`)
  if (a.emblema) l.push(`emblema: ${esc(a.emblema)}`)
  l.push('---')

  return `${l.join('\n')}\n${a.prompt}\n`
}

function separador(raiz: string): string {
  return raiz.includes('\\') || !raiz.includes('/') ? '\\' : '/'
}

function unir(raiz: string, ...partes: string[]): string {
  const sep = separador(raiz)

  return [raiz.replace(/[\\/]+$/, ''), ...partes].join(sep)
}

export function rolAAgente(nombre: string, spec: RolSpec, raiz: string): AgenteCatalogo {
  const agente: AgenteCatalogo = {
    name: nombre,
    description: spec.description,
    prompt: spec.prompt,
    tools: spec.tools === null ? null : [...spec.tools],
    model: spec.model,
    effort: spec.effort,
    equipos: ['base'],
    etiquetas: [],
    emblema: 'greca',
    extra: {},
    ruta: unir(raiz, 'base', `${nombre}.md`),
  }
  const color = COLOR_POR_ROL[nombre]
  if (color) agente.color = color

  return agente
}

function esAgenteMd(name: string): boolean {
  return name.toLowerCase().endsWith('.md') && name.toLowerCase() !== 'readme.md'
}

export async function listarCatalogo(
  fs: FsMin,
  raiz: string,
): Promise<{ agentes: AgenteCatalogo[]; errores: { ruta: string; error: string }[] }> {
  const agentes: AgenteCatalogo[] = []
  const errores: { ruta: string; error: string }[] = []
  if (!(await fs.exists(raiz))) return { agentes, errores }

  const vistos = new Set<string>()
  const leer = async (ruta: string) => {
    let texto: string
    try {
      texto = await fs.read(ruta)
    } catch (e) {
      errores.push({ ruta, error: `No se pudo leer: ${e instanceof Error ? e.message : String(e)}` })

      return
    }
    const r = parseAgente(texto, ruta)
    if (!r.ok) {
      errores.push({ ruta, error: r.error })
    } else if (vistos.has(r.agente.name)) {
      errores.push({ ruta, error: `nombre repetido: ${r.agente.name}` })
    } else {
      vistos.add(r.agente.name)
      agentes.push(r.agente)
    }
  }

  let entradas: { name: string; kind: 'file' | 'dir' | 'other' }[]
  try {
    entradas = await fs.list(raiz)
  } catch {
    return { agentes, errores }
  }
  entradas = [...entradas].sort((a, b) => a.name.localeCompare(b.name))

  for (const e of entradas) {
    if (e.kind === 'file') {
      if (esAgenteMd(e.name)) await leer(unir(raiz, e.name))
    }
  }
  for (const e of entradas) {
    if (e.kind === 'file') continue
    const carpeta = unir(raiz, e.name)
    let hijos: { name: string; kind: 'file' | 'dir' | 'other' }[]
    try {
      hijos = await fs.list(carpeta)
    } catch {
      continue
    }
    for (const h of [...hijos].sort((a, b) => a.name.localeCompare(b.name))) {
      if (h.kind === 'file' && esAgenteMd(h.name)) await leer(unir(carpeta, h.name))
    }
  }

  agentes.sort((a, b) => {
    const ea = a.equipos[0] ?? ''
    const eb = b.equipos[0] ?? ''

    return ea.localeCompare(eb) || a.name.localeCompare(b.name)
  })

  return { agentes, errores }
}

export async function migrarRoles(
  fs: FsMin,
  raiz: string,
  roles: Record<string, RolSpec>,
): Promise<{ escritos: string[]; existentes: string[] }> {
  const { agentes } = await listarCatalogo(fs, raiz)
  const nombres = new Set(agentes.map(a => a.name))
  const escritos: string[] = []
  const existentes: string[] = []
  for (const [nombre, spec] of Object.entries(roles)) {
    if (nombres.has(nombre)) {
      existentes.push(nombre)
      continue
    }
    const agente = rolAAgente(nombre, spec, raiz)
    await fs.write(agente.ruta, serializeAgente(agente))
    escritos.push(agente.ruta)
  }

  return { escritos, existentes }
}

// ---------- Esquema de agentes (ESQUEMA-AGENTES.md del kit) ----------

export const EQUIPOS_ESQUEMA: Record<string, { color: string; emblema: string }> = {
  base: { color: 'green', emblema: 'greca' },
  direccion: { color: 'yellow', emblema: 'piramide' },
  'dev-a1': { color: 'orange', emblema: 'cruz' },
  'dev-tablero': { color: 'blue', emblema: 'jaguar' },
  datos: { color: 'cyan', emblema: 'barras' },
  research: { color: 'purple', emblema: 'puntos' },
  librarian: { color: 'pink', emblema: 'libros' },
  seguridad: { color: 'red', emblema: 'casco' },
  mantenimiento: { color: 'yellow', emblema: 'llave' },
  limpieza: { color: 'green', emblema: 'balde' },
  facilities: { color: 'pink', emblema: 'llavero' },
  arquitectura: { color: 'gray', emblema: 'escuadra' },
}

export const JUEGOS_HERRAMIENTAS: Record<string, string[]> = {
  lectura: ['Read', 'Glob', 'Grep'],
  'lectura-web': ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'],
  pruebas: ['Read', 'Glob', 'Grep', 'Bash', 'PowerShell'],
  documentos: ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Write', 'Edit'],
  escritura: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'PowerShell'],
}

export const SECCIONES_OBLIGATORIAS = [
  '## Rol',
  '## Antes de empezar',
  '## Cómo trabajás',
  '## Límites',
  '## Entrega',
]

function mismoConjunto(a: string[], b: string[]): boolean {
  const sa = new Set(a.filter(x => x !== 'Skill'))
  const sb = new Set(b.filter(x => x !== 'Skill'))
  if (sa.size !== sb.size) return false

  return [...sa].every(x => sb.has(x))
}

function nombreDeArchivo(ruta: string): string {
  const base = ruta.split(/[\\/]/).filter(p => p !== '').pop() ?? ''

  return base.replace(/\.md$/i, '')
}

export function validarAgente(a: AgenteCatalogo): string[] {
  const avisos: string[] = []
  if (a.description.length > 200) {
    avisos.push(`La descripción tiene ${a.description.length} caracteres; el máximo es 200.`)
  }
  if (!a.description.includes('Usalo para')) avisos.push('La descripción no tiene «Usalo para».')
  if (!a.description.includes('No lo uses para')) avisos.push('La descripción no tiene «No lo uses para».')
  if (a.name !== nombreDeArchivo(a.ruta)) {
    avisos.push(`El name «${a.name}» no es igual al nombre del archivo «${nombreDeArchivo(a.ruta)}».`)
  }
  const principal = a.equipos[0]
  if (!principal) {
    avisos.push('No tiene equipos: falta el equipo principal.')
  } else {
    const eq = EQUIPOS_ESQUEMA[principal]
    if (!eq) {
      avisos.push(`El equipo principal «${principal}» no está en la tabla de equipos del esquema.`)
    } else {
      if (a.color !== eq.color) {
        avisos.push(`El color debería ser «${eq.color}» (el de su equipo ${principal}).`)
      }
      if (a.emblema !== eq.emblema) {
        avisos.push(`El emblema debería ser «${eq.emblema}» (el de su equipo ${principal}).`)
      }
    }
  }
  if (a.model === 'opus') avisos.push('El model no puede fijarse en opus: opus se pide en la llamada.')
  if (a.tools === null) {
    avisos.push('Tiene todas las herramientas: elegí un juego (lectura, lectura-web, pruebas, documentos o escritura).')
  } else if (!Object.values(JUEGOS_HERRAMIENTAS).some(j => mismoConjunto(a.tools as string[], j))) {
    avisos.push('Las herramientas no coinciden con ningún juego (lectura, lectura-web, pruebas, documentos o escritura).')
  }
  if (a.tools !== null && !a.tools.includes('Skill')) {
    avisos.push('No tiene la herramienta Skill: no puede cargar skills.')
  }
  if (!a.prompt.includes(PREAMBLE)) avisos.push('El prompt no contiene el preámbulo común.')
  const faltan = SECCIONES_OBLIGATORIAS.filter(s => !a.prompt.includes(s))
  if (faltan.length > 0) avisos.push(`Faltan secciones en el prompt: ${faltan.join(', ')}.`)

  return avisos
}

export function plantillaAgente(nombre: string, equipo: string, raiz: string): AgenteCatalogo {
  if (!/^[a-z0-9-]{1,64}$/.test(nombre)) {
    throw new Error('El nombre debe tener solo minúsculas, dígitos y guiones, de 1 a 64 caracteres.')
  }
  const eq = EQUIPOS_ESQUEMA[equipo] ?? EQUIPOS_ESQUEMA.base
  const secciones = SECCIONES_OBLIGATORIAS.map(s => `${s}\n…`).join('\n\n')

  return {
    name: nombre,
    description: '<Qué hace>. Usalo para <…>. No lo uses para <…>.',
    prompt: `${PREAMBLE}\n\n${secciones}`,
    tools: [...JUEGOS_HERRAMIENTAS.lectura, 'Skill'],
    model: 'sonnet',
    effort: 'medium',
    color: eq.color,
    equipos: [equipo],
    etiquetas: [],
    emblema: eq.emblema,
    extra: {},
    ruta: unir(raiz, equipo, `${nombre}.md`),
  }
}

// Los 4 roles base en versión que cumple el esquema (descripción con «Usalo para» y «No lo uses para»,
// las 5 secciones, color y emblema de base). Es lo que crea el botón «Crear los 4 roles base» en una
// compu sin agentes; la versión completa de cada uno es la del kit (kit/agentes/base).
const ROLES_BASE_TEXTO: Record<string, { usalo: string; noLoUses: string; rol: string; como: string; limites: string }> = {
  implementador: {
    usalo: 'tarjetas de código cuando el proyecto no tiene especialista',
    noLoUses: 'investigar ni revisar',
    rol: 'Sos el implementador: escribís código según la tarjeta, sin salirte de lo que pide.',
    como: '1. La tarjeta es tu única especificación.\n2. Tocá solo los archivos permitidos.\n3. Seguí el estilo del código existente.\n4. Corré solo la aceptación de la tarjeta.',
    limites: '- No tocás archivos que la tarjeta no permita.\n- No hacés push, deploy ni instalaciones.',
  },
  corrector: {
    usalo: 'tarjetas de corrección',
    noLoUses: 'funciones nuevas ni refactors',
    rol: 'Sos el corrector: arreglás solo lo que la tarjeta de corrección describe.',
    como: '1. Reproducí la falla antes de tocar nada.\n2. Hacé el cambio mínimo que la arregla.\n3. Corré la aceptación de la tarjeta.',
    limites: '- No ampliás el alcance.\n- No hacés push, deploy ni instalaciones.',
  },
  investigador: {
    usalo: 'buscar y leer, en solo lectura',
    noLoUses: 'editar ni crear archivos',
    rol: 'Sos el investigador: buscás y leés, sin editar.',
    como: '1. Buscá en los archivos y fuentes que nombra la tarjeta.\n2. Separá lo verificado (con archivo, comando o fuente) de lo supuesto.',
    limites: '- Solo lectura: no editás ni creás archivos.',
  },
  revisor: {
    usalo: 'revisar código en solo lectura y reportar hallazgos reales',
    noLoUses: 'arreglar lo que encuentra',
    rol: 'Sos el revisor: revisás en solo lectura y reportás hallazgos reales.',
    como: '1. Leé el cambio y su contexto.\n2. Reportá cada hallazgo con línea, qué pasa y cómo se arregla.\n3. Si no hay ninguno, decilo.',
    limites: '- Solo lectura: no editás archivos.',
  },
}

export function rolesBaseEsquema(roles: Record<string, RolSpec>, raiz: string): AgenteCatalogo[] {
  const eq = EQUIPOS_ESQUEMA.base
  return Object.entries(ROLES_BASE_TEXTO)
    .filter(([nombre]) => roles[nombre] !== undefined)
    .map(([nombre, t]) => {
      const spec = roles[nombre]
      const base = spec.description.replace(/\.\s*$/, '')
      return {
        ...rolAAgente(nombre, spec, raiz),
        description: `${base}. Usalo para ${t.usalo}. No lo uses para ${t.noLoUses}.`,
        prompt:
          `${PREAMBLE}\n\n## Rol\n${t.rol}\n\n## Antes de empezar\nLeé la tarjeta completa y los archivos que nombra.\n\n` +
          `## Cómo trabajás\n${t.como}\n\n## Límites\n${t.limites}\n\n## Entrega\nInforme corto: qué hiciste, la salida filtrada de la aceptación y qué no pudiste verificar.`,
        color: eq.color,
        emblema: eq.emblema,
      }
    })
}

export function nombreTarjeta(a: AgenteCatalogo): string {
  const principal = a.equipos[0]
  if (!principal) return a.name

  return `T-?? · ${a.model} · ${principal}/${a.name} · `
}
