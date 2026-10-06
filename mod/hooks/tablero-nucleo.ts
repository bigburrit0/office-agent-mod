// Núcleo del panel /oficina: constantes, caché de SVG y funciones puras (parseo de descripciones,
// árbol de subagentes, reacciones, patio, ocio, colores y uso de la sesión).
// Acá no entra nada que reciba `$` ni los átomos de estado: el motor solo deja pasar `$` a funciones
// declaradas en el mismo archivo que los hooks, y lee los átomos donde se declaran. Por eso las
// acciones, el estado y el dibujo viven en register.tsx.

import type { AgenteTablero, TableroFila } from '../types/index'
import type { DatosUso } from './arte-uso'
import { DEFAULT_ROLES, toolsLabel } from './roles'
import { PATIO_EXPLOTA_MS, PATIO_SALE_MS } from './arte-escritorios'
import { EQUIPO_ACENTO, tipoDeAgente } from './arte-iconos'
import { DORMIR_MS, franjaHora, OCIO_PASO_MS } from './emociones'
import { PALETTE } from './pixel'
import { CLARO } from './tema'

export const TAREA_EQUIPO: Record<string, string> = {
  base: 'roles genéricos para cualquier proyecto',
  direccion: 'brief, plan y tareas de cada idea nueva',
  'dev-a1': 'código de la app A1: web, worker y pruebas',
  'dev-tablero': 'código del mod /oficina: hooks, arte y pruebas',
  datos: 'métricas y gráficos de lo que ya funciona',
  research: 'investigan en paralelo, esfuerzo bajo',
  librarian: 'mantiene la wiki de la biblioteca',
  seguridad: 'cámaras, accesos y rondas del edificio',
  mantenimiento: 'arreglos y mantenimiento preventivo',
  limpieza: 'limpieza y su planificación',
  facilities: 'servicios del edificio: llaves, proveedores y espacios',
  arquitectura: 'planos y reformas de los espacios',
}

export const PANE = 'tablero-oficina'
export const TITLE = 'Oficina'
export const PERIOD_MS = 2000
export const MAX_AGENTS = 100
export const SEP = ' · '
export const DASH = '—'

export const STORE_ROLES = 'roles'
// Copia de cada archivo de agente antes del último Guardar desde el panel: ruta → texto.
export const STORE_ANTERIORES = 'anteriores'

export const INFORME_MAX = 4000
export const MAX_INFORMES = 100
export const fmtNum = (n: number): string => Math.round(Number.isFinite(n) ? n : 0).toLocaleString('es-UY')
export const totalTokens = (t: Record<string, number>): number =>
  Object.values(t).reduce((sum, n) => sum + (typeof n === 'number' && Number.isFinite(n) ? n : 0), 0)

export const DESIGN_WIDTH = 640
export const NARROW_COLUMNS = 70
// Celdas que ocupan las columnas fijas de una fila de subagente (estado, tarjeta, modelo, rol).
export const FIXED_COLUMNS = 37
export const REACT_LONG_MS = 5000
export const REACT_MEDIO_MS = 3000
export const REACT_SHORT_MS = 2000
export const REACT_BUFIDO_MS = 1500
export const REACT_CHISPAZO_MS = 2500
export const SVG_MAX = 131072
export const BUCKET_MS = 10000

// `role` es lo que se muestra (puede ser «equipo/agente»); `base` es el nombre del agente, para color y sprite.
export type Parsed = { card: string; model: string; role: string; base: string; text: string }

// Limpia saltos de línea y espacios repetidos; nunca lanza.
export function clean(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Agente según el tipo del motor: lo que sigue al último «:»; vacío si es genérico.
export function baseDeTipo(type: unknown): string {
  const raw = String(type ?? '').trim()
  const tail = raw.slice(raw.lastIndexOf(':') + 1).trim()

  return tail.toLowerCase() === 'general-purpose' ? '' : tail
}

// «tarjeta · modelo · rol · descripción». Si no tiene ese formato, se muestra
// la descripción tal cual (ya limpia); si empieza con un código de tarjeta («T-81 ...»,
// «A1-96 ...», «TAB-104 ...»; prefijo de 1 a 4 caracteres)
// ese código es la tarjeta. Lo que falte queda vacío (la fila lo omite).
// Un rol que no esté en `roleNames` (la lista viva) se muestra igual, tal cual vino.
export function parse(description: unknown, roleNames: string[], type?: unknown): Parsed {
  const text = clean(description)
  const parts = text.split(SEP).map(part => part.trim())
  if (parts.length >= 4 && parts[0] && parts[1] && parts[2]) {
    const raw = parts[2]
    const slash = raw.lastIndexOf('/')
    const tail = slash >= 0 ? raw.slice(slash + 1) : raw
    const base = roleNames.includes(tail.toLowerCase()) ? tail.toLowerCase() : tail

    return {
      card: parts[0],
      model: parts[1],
      role: slash >= 0 ? raw : base,
      base: base || raw,
      text: parts.slice(3).join(SEP),
    }
  }

  const base = baseDeTipo(type)
  const code = /^([A-Z][A-Z0-9]{0,3}-\d+[a-z0-9]*)\s+(.+)$/i.exec(text)
  if (code) return { card: code[1], model: '', role: '', base, text: code[2] }

  return { card: '', model: '', role: '', base, text }
}

// Nombre corto de una fila para la burbuja: su tarjeta o, si no tiene, su id.
export function quienDe(row: TableroFila): string {
  return parse(row.description, [], row.type).card || String(row.id)
}

// Solo estos tres estados cuentan como terminados.
export function isTerminal(status: string): boolean {
  return status === 'completed' || status === 'failed' || status === 'killed'
}

export function isKnown(status: string): boolean {
  return status === 'running' || isTerminal(status)
}

export function statusWord(status: string): string {
  if (status === 'running') return 'corre'
  if (status === 'completed') return 'lista'
  if (status === 'failed') return 'falló'
  if (status === 'killed') return 'frenada'

  return status
}

// Corriendo primero, después fallaron/frenados (y estados raros), después listos.
export function group(status: string): number {
  if (status === 'running') return 0
  if (status === 'completed') return 2

  return 1
}

export function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Corta a `width - 1` si no entra, así las columnas nunca quedan pegadas.
export function pad(text: string, width: number): string {
  const safe = String(text ?? '')
  const cut = safe.length >= width ? safe.slice(0, Math.max(0, width - 1)) : safe

  return cut + ' '.repeat(width - cut.length)
}

export type Ordered = { row: TableroFila; depth: number }

// Árbol: raíces por grupo de estado y luego `firstSeen`; cada hijo justo debajo
// de su padre, por `firstSeen`. Un hijo cuyo padre no está en la lista es raíz.
export function orderTree(rows: TableroFila[]): Ordered[] {
  const byId = new Map(rows.map(row => [row.id, row]))
  const children = new Map<string, TableroFila[]>()
  const roots: TableroFila[] = []
  for (const row of rows) {
    const parent = row.parentId
    if (parent && parent !== row.id && byId.has(parent)) {
      const list = children.get(parent) ?? []
      list.push(row)
      children.set(parent, list)
    } else {
      roots.push(row)
    }
  }
  const byTime = (a: TableroFila, b: TableroFila) => (a.firstSeen ?? 0) - (b.firstSeen ?? 0)
  roots.sort(
    (a, b) => group(String(a.status ?? '')) - group(String(b.status ?? '')) || byTime(a, b),
  )

  const out: Ordered[] = []
  const seen = new Set<string>()
  const walk = (row: TableroFila, depth: number): void => {
    if (seen.has(row.id)) return
    seen.add(row.id)
    out.push({ row, depth })
    for (const child of (children.get(row.id) ?? []).sort(byTime)) walk(child, depth + 1)
  }
  for (const root of roots) walk(root, 0)
  // Ciclos de padres (no debería pasar): lo que quedó afuera va como raíz.
  for (const row of [...rows].sort(byTime)) walk(row, 0)

  return out
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

// ---- Dibujo pixel art -----------------------------------------------------

// Último string por SVG: mientras no cambien las entradas (`sig`) se devuelve
// exactamente el mismo, para que el marco no se recargue y la animación siga.
// Si el dibujo falla o es demasiado grande, devuelve '' y el panel lo omite.
export const svgCache = new Map<string, { sig: string; svg: string }>()

// Borra del caché las celdas del patio de subagentes que ya no están en la lista (sin esto,
// una sesión larga con cientos de subagentes acumula una entrada por cada uno).
export function podarCeldas(ids: Set<string>): void {
  for (const nombre of [...svgCache.keys()]) {
    if (nombre.startsWith('celda-') && !nombre.startsWith('celda-mas-') && !ids.has(nombre.slice(6))) svgCache.delete(nombre)
  }
}

export function cachedSvg(name: string, sig: string, build: () => string): string {
  const hit = svgCache.get(name)
  if (hit && hit.sig === sig) return hit.svg
  let svg = ''
  try {
    svg = build()
    if (typeof svg !== 'string' || svg.length > SVG_MAX) svg = ''
  } catch {
    svg = ''
  }
  svgCache.set(name, { sig, svg })

  return svg
}

// Alto en píxeles que declara el SVG (0 si no se puede leer).
export function svgHeight(svg: string): number {
  const found = /<svg[^>]*\sheight="(\d+(?:\.\d+)?)"/.exec(svg)

  return found ? Number(found[1]) : 0
}

// Líneas de texto que ocupa un alto en píxeles (unos 20 px por línea).
export function linesOf(svg: string): number {
  return svg ? Math.ceil(svgHeight(svg) / 20) : 0
}

// Tipo de glifo y equipo de un agente: del catálogo; si no está, de los roles por defecto;
// el equipo cae a la parte de `equipo/agente` del rol y, si no, a `base`.
export function glifoDe(base: string, role: string, agentes: AgenteTablero[]): { tipo: string; equipo: string } {
  const name = String(base ?? '').toLowerCase()
  const found = agentes.find(a => a.name.toLowerCase() === name)
  let tipo: string
  if (found) tipo = tipoDeAgente({ name: found.name, tools: found.tools, emblema: found.emblema })
  else if (DEFAULT_ROLES[name]) tipo = tipoDeAgente({ name, tools: DEFAULT_ROLES[name].tools })
  else tipo = tipoDeAgente({ name, tools: undefined })
  let equipo = found?.equipos[0] ?? ''
  if (!equipo) {
    const slash = String(role ?? '').indexOf('/')
    equipo = slash > 0 ? String(role).slice(0, slash) : 'base'
  }

  return { tipo, equipo }
}

// Luminancia relativa de un color #rrggbb (WCAG); 0 si no se entiende.
export function luminancia(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return 0
  const [r, g, b] = [m[1], m[2], m[3]].map(c => {
    const v = parseInt(c, 16) / 255

    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contraste(a: string, b: string): number {
  const la = luminancia(a)
  const lb = luminancia(b)

  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Colores del chip de un equipo en la leyenda: el tono oscuro con letra crema si contrasta 4,5:1
// o más; si no, el tono claro con letra oscura (mantenimiento y limpieza).
export function chipEquipo(equipo: string): { fondo: string; letra: string } {
  const [claro, oscuro] = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
  if (contraste(oscuro, PALETTE.crema) >= 4.5) return { fondo: oscuro, letra: PALETTE.crema }

  return { fondo: claro, letra: PALETTE.negro }
}

// Entero estable sacado de un texto (suma de códigos de caracteres).
export function semillaDe(id: string): number {
  let n = 0
  for (const ch of String(id)) n += ch.charCodeAt(0)

  return n
}

// Alto del encabezado: cara con marco de 102 px y el patio de 54 px por fila (más 18 px de dosel).
export const CARA_ALTO = 102
export const CARA_ANCHO = 126
export const DOSEL_ALTO = 18
export const FONDO_BURBUJA = CLARO.burbuja
export const FONDOS_FILA = [...CLARO.filas]
export const FONDO_HOVER = CLARO.filaHover
// Instante fijo (variable de módulo) desde el que se cuenta el ocio si no hay ningún fin registrado.
let ocioModulo = 0

// Desde cuándo no hay nada que hacer: el último fin registrado o, si no hay ninguno, el instante del módulo.
export function ocioDesdeDe(rows: TableroFila[], ahora: number): number {
  const lastEnded = rows.reduce((max, row) => Math.max(max, row.endedAt ?? 0), 0)
  if (lastEnded > 0) return lastEnded
  if (ocioModulo === 0 || ocioModulo > ahora) ocioModulo = ahora

  return ocioModulo
}

// Minutos desde la medianoche, en la hora local de la computadora.
export function minutosDelDia(ms: number): number {
  const d = new Date(ms)

  return d.getHours() * 60 + d.getMinutes()
}

// Lo que hace cambiar la cara sin que cambie nada más: el paso del ocio y la franja de la hora.
// Si cambia entre dos instantes (con el mismo inicio del ocio), hay que redibujar.
export function ritmoRobot(rows: TableroFila[], ocioDesde: number, ms: number): string {
  if (rows.some(row => row.status === 'running')) return 'trabajo'
  const ocio = Math.max(0, ms - ocioDesde)
  const paso = Math.min(Math.floor(ocio / OCIO_PASO_MS), Math.ceil(DORMIR_MS / OCIO_PASO_MS))

  return `${paso}|${franjaHora(minutosDelDia(ms))?.emocion ?? ''}`
}

// Mezcla la lista del motor con lo ya guardado, conservando el instante de
// primera vez. Pura: si nada cambió devuelve filas iguales a las de antes.
export function mergeAgents(
  prev: TableroFila[],
  list: Array<Record<string, any>>,
  now: number,
): { rows: TableroFila[]; finished: boolean } {
  let finished = false
  const prevById = new Map(prev.map(row => [row.id, row]))
  const fresh: TableroFila[] = list.map(info => {
    const old = prevById.get(info.id)
    const status = String(info.status ?? '')
    if (old && old.status === 'running' && status === 'completed') finished = true
    const row: TableroFila = {
      id: info.id,
      description: clean(info.description) || clean(info.name) || clean(info.type),
      type: String(info.type ?? ''),
      status,
      firstSeen: old ? old.firstSeen : now,
    }
    if (info.parentId !== undefined) row.parentId = info.parentId
    if (isTerminal(status)) {
      row.endedAt = old?.endedAt ?? now
      // Si ya estaba terminado cuando lo vimos, no sabemos cuánto duró.
      if (old ? old.durationUnknown : true) row.durationUnknown = true
    }

    return row
  })
  const freshIds = new Set(fresh.map(row => row.id))
  const room = Math.max(0, MAX_AGENTS - fresh.length)
  const kept = prev
    .filter(row => !freshIds.has(row.id))
    .sort((a, b) => b.firstSeen - a.firstSeen)
    .slice(0, room)

  return { rows: [...kept, ...fresh].sort((a, b) => a.firstSeen - b.firstSeen), finished }
}

export type ReaccionTipo =
  | 'caceria'
  | 'ruge'
  | 'contento'
  | 'bufido'
  | 'guardado'
  | 'panico'
  | 'frustrado'
  | 'chispazo'
  | 'festeja'
  | 'aplaude'
  | 'orgullo'
  | 'alivio'
  | 'saluda'
  | 'sorpresa'

// Compara la lista anterior con la nueva y elige UNA reacción, la más fuerte:
// fallas (pánico si son varias, frustrado si ya estaba molesto, ruge) > frenado (bufido) >
// terminados (alivio si estaba molesto, festeja si terminaron todos, aplaude si varios, contento si uno) >
// nuevos (sorpresa si llegan 3 o más juntos, caceria si no).
// Un subagente visto por primera vez ya terminado no dispara nada.
export function detectReaction(
  prev: TableroFila[],
  rows: TableroFila[],
  now: number,
  molesto0 = '',
): { tipo: ReaccionTipo; hasta: number; quien?: string } | null {
  const prevById = new Map(prev.map(row => [row.id, row]))
  const paso = (status: string) =>
    rows.filter(row => {
      const old = prevById.get(row.id)

      return row.status === status && old !== undefined && old.status !== status
    })
  const fallaron = paso('failed')
  if (fallaron.length >= 2) {
    return { tipo: 'panico', hasta: now + REACT_LONG_MS, quien: fallaron.map(quienDe).slice(0, 3).join(', ') }
  }
  if (fallaron.length === 1) {
    return { tipo: molesto0 !== '' ? 'frustrado' : 'ruge', hasta: now + REACT_LONG_MS, quien: quienDe(fallaron[0]) }
  }
  const frenados = paso('killed')
  if (frenados.length > 0) return { tipo: 'bufido', hasta: now + REACT_BUFIDO_MS, quien: quienDe(frenados[0]) }
  const terminaron = paso('completed')
  const isRunning = rows.some(row => row.status === 'running')
  if (terminaron.length > 0) {
    const quien = quienDe(terminaron[0])
    if (molesto0 !== '') return { tipo: 'alivio', hasta: now + REACT_MEDIO_MS, quien }
    if (!isRunning) return { tipo: 'festeja', hasta: now + REACT_LONG_MS, quien }
    if (terminaron.length >= 2) return { tipo: 'aplaude', hasta: now + REACT_MEDIO_MS, quien: `${terminaron.length} agentes` }

    return { tipo: 'contento', hasta: now + REACT_MEDIO_MS, quien }
  }
  const nuevos = rows.filter(row => row.status === 'running' && !prevById.has(row.id))
  if (nuevos.length >= 3) return { tipo: 'sorpresa', hasta: now + REACT_SHORT_MS, quien: `${nuevos.length} agentes` }
  if (nuevos.length > 0) return { tipo: 'caceria', hasta: now + REACT_SHORT_MS, quien: quienDe(nuevos[0]) }

  return null
}

export type PatioEntrada = { fase: 'sale' | 'explota'; hasta: number }

// Patio: lo que estaba corriendo y terminó sale (o explota si falló); lo vencido se borra.
export function nextPatio(
  prev: TableroFila[],
  rows: TableroFila[],
  actual: Record<string, PatioEntrada>,
  now: number,
): Record<string, PatioEntrada> {
  const prevById = new Map(prev.map(row => [row.id, row]))
  const out: Record<string, PatioEntrada> = {}
  for (const id of Object.keys(actual)) {
    if (actual[id] && actual[id].hasta > now) out[id] = actual[id]
  }
  for (const row of rows) {
    const old = prevById.get(row.id)
    if (!old || old.status !== 'running') continue
    if (row.status === 'completed' || row.status === 'killed') out[row.id] = { fase: 'sale', hasta: now + PATIO_SALE_MS }
    else if (row.status === 'failed') out[row.id] = { fase: 'explota', hasta: now + PATIO_EXPLOTA_MS }
  }

  return out
}

export function bucketOf(ms: number): number {
  return Math.floor(ms / BUCKET_MS)
}

// Mide un SVG por su viewBox (0 x 0 si no se puede leer).
export function svgSize(svg: string): { width: number; height: number } {
  const found = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/.exec(svg)
  const width = found ? Number(found[1]) : 0
  const height = found ? Number(found[2]) : 0

  return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : { width: 0, height: 0 }
}

// `width` y `height` de un Svg, iguales a su viewBox (nada de espacio blanco de sobra).
export function sizeProps(svg: string): { width?: number; height?: number } {
  const { width, height } = svgSize(svg)

  return width > 0 && height > 0 ? { width, height } : {}
}

// ---- Uso de la sesión: ventanas de 5 horas y semanal, contexto y costo ----------

export type UsoSesion = {
  limites: Array<{ kind: string; percentUsed: number; resetsAt?: string }>
  contexto?: number
  /** Costo de la sesión en dólares, como lo suma /cost; ausente si el motor no lleva la cuenta. */
  costo?: number
  medido: number
}

// Lo que el panel guarda de `$.session.usage()` o de `session.measure`: solo números y textos simples.
export function normalizarUso(datos: unknown, medido: number): UsoSesion {
  const d = (datos ?? {}) as { rateLimits?: unknown; context?: { percent?: unknown }; cost?: { usd?: unknown } }
  const limites: UsoSesion['limites'] = []
  for (const l of Array.isArray(d.rateLimits) ? d.rateLimits : []) {
    const kind = String((l as { kind?: unknown })?.kind ?? '')
    const percentUsed = Number((l as { percentUsed?: unknown })?.percentUsed)
    if (kind === '' || !Number.isFinite(percentUsed)) continue
    const resetsAt = (l as { resetsAt?: unknown }).resetsAt
    limites.push(typeof resetsAt === 'string' && resetsAt !== '' ? { kind, percentUsed, resetsAt } : { kind, percentUsed })
  }
  const pct = Number(d.context?.percent)
  const out: UsoSesion = { limites, medido }
  if (d.context?.percent !== undefined && Number.isFinite(pct)) out.contexto = pct
  const usd = Number(d.cost?.usd)
  if (d.cost?.usd !== undefined && Number.isFinite(usd)) out.costo = Math.round(usd * 100) / 100

  return out
}

export const NOMBRE_LIMITE: Record<string, string> = { five_hour: '5 horas', seven_day: 'Semanal', spend_limit: 'Gasto' }
export const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// «hoy 15:30» o «lun 09:00», en la hora local; vacío si la fecha no se entiende.
export function cuandoRenueva(iso: string | undefined, ahora: number): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const d = new Date(t)
  const hoy = new Date(ahora)
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const mismoDia =
    d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate()

  return `${mismoDia ? 'hoy' : DIAS[d.getDay()]} ${hhmm}`
}

// Barra de texto de `ancho` celdas: llenas y vacías según el porcentaje (acotado a 0..100).
export function barraUso(pct: number, ancho: number): { llena: string; vacia: string } {
  const n = Math.round((Math.max(0, Math.min(100, pct)) / 100) * ancho)

  return { llena: '█'.repeat(n), vacia: '░'.repeat(ancho - n) }
}

export function colorUso(pct: number): string {
  if (pct >= 80) return '#e8402a'
  if (pct >= 50) return PALETTE.oro

  return '#4fe08a'
}

// Cuerpo de un SKILL.md sin el frontmatter.
export function cuerpoSkill(texto: string): string {
  const t = texto.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!t.startsWith('---\n')) return t.trim()
  const fin = t.indexOf('\n---', 4)
  if (fin < 0) return t.trim()
  const resto = t.slice(fin + 4)
  const salto = resto.indexOf('\n')

  return resto.slice(salto < 0 ? resto.length : salto + 1).trim()
}

// ---- Tokens de la sesión y datos del tablero de uso -------------------------------

export type TokensSesion = { input: number; output: number; cacheLectura: number; cacheEscritura: number; turnos: number }

// Une los tokens de la sesión y las ventanas del motor en lo que dibuja `tableroUsoSvg`.
export function datosUsoDe(uso: UsoSesion | null, tokens: TokensSesion, ahora: number): DatosUso {
  const d: DatosUso = {}
  if (tokens.turnos > 0) {
    d.tokens = {
      total: tokens.input + tokens.output + tokens.cacheLectura + tokens.cacheEscritura,
      nuevos: tokens.input + tokens.output + tokens.cacheEscritura,
      cache: tokens.cacheLectura,
    }
  }
  const cinco = uso?.limites.find(l => l.kind === 'five_hour')
  if (cinco) d.cincoHoras = { pct: cinco.percentUsed, renueva: cuandoRenueva(cinco.resetsAt, ahora) }
  const sem = uso?.limites.find(l => l.kind === 'seven_day')
  if (sem) d.semana = { pct: sem.percentUsed, renueva: cuandoRenueva(sem.resetsAt, ahora), hoy: new Date(ahora).getDay() }
  if (uso?.contexto !== undefined) d.contexto = uso.contexto
  if (uso?.costo !== undefined) d.costo = uso.costo

  return d
}

// ---- Vista Editar: qué cambia al guardar y el prompt por secciones ----

/** Los campos que el borrador puede cambiar. */
export type CamposEditables = { description: string; prompt: string; model: string; effort: string; tools: string[] | null }

const diferenciaLargo = (antes: string, despues: string): string => {
  const d = despues.length - antes.length
  if (d === 0) return 'mismo largo'

  return `${d > 0 ? '+' : '−'}${plural(Math.abs(d), 'carácter', 'caracteres')}`
}

// Lista corta de lo que cambia entre el archivo y el borrador, en el orden del formulario; vacía si nada cambió.
export function cambiosBorrador(original: CamposEditables, borrador: CamposEditables): string[] {
  const out: string[] = []
  if (original.model !== borrador.model) out.push(`modelo ${original.model} → ${borrador.model}`)
  if (original.effort !== borrador.effort) out.push(`esfuerzo ${original.effort} → ${borrador.effort}`)
  if (JSON.stringify(original.tools) !== JSON.stringify(borrador.tools)) {
    out.push(`herramientas ${toolsLabel(original.tools)} → ${toolsLabel(borrador.tools)}`)
  }
  if (original.description !== borrador.description) {
    out.push(`descripción (${diferenciaLargo(original.description, borrador.description)})`)
  }
  if (original.prompt !== borrador.prompt) out.push(`instrucciones (${diferenciaLargo(original.prompt, borrador.prompt)})`)

  return out
}

/** Un trozo del prompt: la línea del título `## …` (con su salto, vacía antes del primer título) y el texto que le sigue. */
export type SeccionPrompt = { encabezado: string; cuerpo: string }

// Parte el prompt en sus títulos `## `. Unir las secciones devuelve el texto exacto.
export function partirSecciones(prompt: string): SeccionPrompt[] {
  const inicios: number[] = []
  const re = /^## /gm
  let m: RegExpExecArray | null
  while ((m = re.exec(prompt)) !== null) inicios.push(m.index)
  if (inicios[0] !== 0) inicios.unshift(0)
  const out: SeccionPrompt[] = []
  for (let i = 0; i < inicios.length; i++) {
    const trozo = prompt.slice(inicios[i], inicios[i + 1] ?? prompt.length)
    if (!trozo.startsWith('## ')) {
      out.push({ encabezado: '', cuerpo: trozo })
      continue
    }
    const salto = trozo.indexOf('\n')
    out.push(salto < 0 ? { encabezado: trozo, cuerpo: '' } : { encabezado: trozo.slice(0, salto + 1), cuerpo: trozo.slice(salto + 1) })
  }

  return out
}

export function unirSecciones(secciones: SeccionPrompt[]): string {
  return secciones.map(s => s.encabezado + s.cuerpo).join('')
}

// Texto editable de una sección: su cuerpo sin los saltos finales (los espacios que se tipean se respetan).
export function textoSeccion(s: SeccionPrompt): string {
  return s.cuerpo.replace(/\n\s*$/, '')
}

// Cambia el texto de una sección y conserva los saltos que la separaban de la siguiente.
export function reemplazarSeccion(prompt: string, indice: number, texto: string): string {
  const secciones = partirSecciones(prompt)
  const s = secciones[indice]
  if (!s) return prompt
  const cola = /\n\s*$/.exec(s.cuerpo)?.[0] ?? (indice < secciones.length - 1 ? '\n\n' : '')
  secciones[indice] = { ...s, cuerpo: texto.replace(/\n\s*$/, '') + cola }

  return unirSecciones(secciones)
}

// Título visible de una sección: el `## …` sin los numerales, o «Preámbulo» para el texto antes del primer título.
export function tituloSeccion(s: SeccionPrompt, unica: boolean): string {
  if (s.encabezado === '') return unica ? 'Texto completo' : 'Preámbulo'

  return s.encabezado.replace(/^##\s*/, '').trim()
}
