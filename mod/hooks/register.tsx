import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { AgenteTablero, CatalogoEstado, RolBorrador, RolSpec, TableroFila } from '../types/index'

import {
  EQUIPOS_ESQUEMA,
  listarCatalogo,
  migrarRoles,
  nombreTarjeta,
  plantillaAgente,
  rolAAgente,
  rolesBaseEsquema,
  serializeAgente,
  validarAgente,
} from './catalogo'
import type { AgenteCatalogo, FsMin } from './catalogo'

import {
  DEFAULT_ROLES,
  EFFORTS,
  MODELS,
  errorText,
  ROLE_NAMES,
  mergeRoles,
  presetTools,
  savedRoles,
  toAgentSpec,
  toolsKind,
  toolsLabel,
} from './roles'
import { EMOCION_ALT, caraRobotSvg } from './arte-robot'
import {
  PATIO_ALTO,
  PATIO_ANCHO,
  PATIO_EXPLOTA_MS,
  PATIO_SALE_MS,
  celdaMasSvg,
  celdaPatioSvg,
  doselPatioSvg,
  pisoPatioSvg,
} from './arte-escritorios'
import { codiceSvg, frisoSvg, numeroMayaSvg, paredTallerSvg, temploSvg, tzolkin } from './arte-edificio'
import { DIOSES_EQUIPO, diosSvg } from './arte-iconos'
import { EQUIPO_ACENTO, TIPO_NOMBRE, glifoSvg, tipoDeAgente } from './arte-iconos'
import { actividadDe, actividadParaCelda } from './arte-actividades'
import { DORMIR_MS, OCIO_PASO_MS, SOSPECHA_MS, decidirEmocion, franjaHora } from './emociones'
import type { Grupo } from './emociones'
import type { FilaTiempo } from './pixel'
import {
  PALETTE,
  grecaBand,
  normalizeStatus,
  palabraEstadoSvg,
  roleColor,
  statusColor,
  timelineSvg,
} from './pixel'

const TAREA_EQUIPO: Record<string, string> = {
  base: 'roles genéricos para cualquier proyecto',
  direccion: 'brief, plan y tareas de cada idea nueva',
  'dev-a1': 'código de la app A1: web, worker y pruebas',
  'dev-tablero': 'código del mod /tablero: hooks, arte y pruebas',
  datos: 'métricas y gráficos de lo que ya funciona',
  research: 'investigan en paralelo, esfuerzo bajo',
  librarian: 'mantiene la wiki de la biblioteca',
}

const PANE = 'tablero-oficina'
const TITLE = 'Oficina'
const PERIOD_MS = 2000
const MAX_AGENTS = 100
const SEP = ' · '
const DASH = '—'

const STORE_ROLES = 'roles'

const agents = atom({ plugin: 'tablero-oficina', key: 'agents' } as const, [])
const nowAtom = atom({ plugin: 'tablero-oficina', key: 'now' } as const, 0)
const viewAtom = atom({ plugin: 'tablero-oficina', key: 'view' } as const, 'subagentes')
const rolesAtom = atom({ plugin: 'tablero-oficina', key: 'roles' } as const, {})
const draftAtom = atom({ plugin: 'tablero-oficina', key: 'draft' } as const, null)
const promptAtom = atom({ plugin: 'tablero-oficina', key: 'promptAbierto' } as const, false)
const abiertosAtom = atom({ plugin: 'tablero-oficina', key: 'abiertos' } as const, {})
const skillsEquipoAtom = atom({ plugin: 'tablero-oficina', key: 'skillsEquipo' } as const, {})
const nuevoAtom = atom({ plugin: 'tablero-oficina', key: 'nuevo' } as const, null)
const informesAtom = atom({ plugin: 'tablero-oficina', key: 'informes' } as const, {})
const noticeAtom = atom({ plugin: 'tablero-oficina', key: 'notice' } as const, '')
const catalogoAtom = atom(
  { plugin: 'tablero-oficina', key: 'catalogo' } as const,
  { agentes: [], errores: [], cargado: false, raiz: '' } as CatalogoEstado,
)
const filtroAtom = atom({ plugin: 'tablero-oficina', key: 'filtro' } as const, 'todas')
const flashAtom = atom({ plugin: 'tablero-oficina', key: 'flashHasta' } as const, 0)

const reaccionAtom = atom({ plugin: 'tablero-oficina', key: 'reaccion' } as const, null)
const usoAtom = atom({ plugin: 'tablero-oficina', key: 'uso' } as const, null)
const molestoAtom = atom({ plugin: 'tablero-oficina', key: 'molesto' } as const, '')
const patioAtom = atom({ plugin: 'tablero-oficina', key: 'patio' } as const, {})
const quietoAtom = atom({ plugin: 'tablero-oficina', key: 'quieto' } as const, false)

const INFORME_MAX = 4000
const MAX_INFORMES = 100
const fmtNum = (n: number): string => Math.round(Number.isFinite(n) ? n : 0).toLocaleString('es-UY')
const totalTokens = (t: Record<string, number>): number =>
  Object.values(t).reduce((sum, n) => sum + (typeof n === 'number' && Number.isFinite(n) ? n : 0), 0)

const DESIGN_WIDTH = 420
const NARROW_COLUMNS = 70
// Celdas que ocupan las columnas fijas de una fila de subagente (estado, tarjeta, modelo, rol).
const FIXED_COLUMNS = 37
const REACT_LONG_MS = 5000
const REACT_MEDIO_MS = 3000
const REACT_SHORT_MS = 2000
const REACT_BUFIDO_MS = 1500
const REACT_CHISPAZO_MS = 2500
const FLASH_MS = 5000
const SVG_MAX = 131072
const BUCKET_MS = 10000

// `role` es lo que se muestra (puede ser «equipo/agente»); `base` es el nombre del agente, para color y sprite.
type Parsed = { card: string; model: string; role: string; base: string; text: string }

// Limpia saltos de línea y espacios repetidos; nunca lanza.
function clean(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Agente según el tipo del motor: lo que sigue al último «:»; vacío si es genérico.
function baseDeTipo(type: unknown): string {
  const raw = String(type ?? '').trim()
  const tail = raw.slice(raw.lastIndexOf(':') + 1).trim()

  return tail.toLowerCase() === 'general-purpose' ? '' : tail
}

// «tarjeta · modelo · rol · descripción». Si no tiene ese formato, se muestra
// la descripción tal cual (ya limpia); si empieza con un código de tarjeta («T-81 ...»,
// «A1-96 ...», «TAB-104 ...»; prefijo de 1 a 4 caracteres)
// ese código es la tarjeta. Lo que falte queda vacío (la fila lo omite).
// Un rol que no esté en `roleNames` (la lista viva) se muestra igual, tal cual vino.
function parse(description: unknown, roleNames: string[], type?: unknown): Parsed {
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
function quienDe(row: TableroFila): string {
  return parse(row.description, [], row.type).card || String(row.id)
}

// Solo estos tres estados cuentan como terminados.
function isTerminal(status: string): boolean {
  return status === 'completed' || status === 'failed' || status === 'killed'
}

function isKnown(status: string): boolean {
  return status === 'running' || isTerminal(status)
}

function statusWord(status: string): string {
  if (status === 'running') return 'corre'
  if (status === 'completed') return 'lista'
  if (status === 'failed') return 'falló'
  if (status === 'killed') return 'frenada'

  return status
}

// Corriendo primero, después fallaron/frenados (y estados raros), después listos.
function group(status: string): number {
  if (status === 'running') return 0
  if (status === 'completed') return 2

  return 1
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Corta a `width - 1` si no entra, así las columnas nunca quedan pegadas.
function pad(text: string, width: number): string {
  const safe = String(text ?? '')
  const cut = safe.length >= width ? safe.slice(0, Math.max(0, width - 1)) : safe

  return cut + ' '.repeat(width - cut.length)
}

type Ordered = { row: TableroFila; depth: number }

// Árbol: raíces por grupo de estado y luego `firstSeen`; cada hijo justo debajo
// de su padre, por `firstSeen`. Un hijo cuyo padre no está en la lista es raíz.
function orderTree(rows: TableroFila[]): Ordered[] {
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

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

// ---- Dibujo pixel art -----------------------------------------------------

// Último string por SVG: mientras no cambien las entradas (`sig`) se devuelve
// exactamente el mismo, para que el marco no se recargue y la animación siga.
// Si el dibujo falla o es demasiado grande, devuelve '' y el panel lo omite.
const svgCache = new Map<string, { sig: string; svg: string }>()

function cachedSvg(name: string, sig: string, build: () => string): string {
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
function svgHeight(svg: string): number {
  const found = /<svg[^>]*\sheight="(\d+(?:\.\d+)?)"/.exec(svg)

  return found ? Number(found[1]) : 0
}

// Líneas de texto que ocupa un alto en píxeles (unos 20 px por línea).
function linesOf(svg: string): number {
  return svg ? Math.ceil(svgHeight(svg) / 20) : 0
}

// Tipo de glifo y equipo de un agente: del catálogo; si no está, de los roles por defecto;
// el equipo cae a la parte de `equipo/agente` del rol y, si no, a `base`.
function glifoDe(base: string, role: string, agentes: AgenteTablero[]): { tipo: string; equipo: string } {
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

// Entero estable sacado de un texto (suma de códigos de caracteres).
function semillaDe(id: string): number {
  let n = 0
  for (const ch of String(id)) n += ch.charCodeAt(0)

  return n
}

// Alto del encabezado: cara con marco de 102 px y el patio de 54 px por fila (más 18 px de dosel).
const CARA_ALTO = 102
const CARA_ANCHO = 126
const DOSEL_ALTO = 18
const FONDO_BURBUJA = '#0a2414'
const FONDOS_FILA = ['#10261a', '#0c1f15']
const FONDO_HOVER = '#1f4a30'
const PATIO_FILA_ALTO = PATIO_ALTO * 2
// Instante fijo (variable de módulo) desde el que se cuenta el ocio si no hay ningún fin registrado.
let ocioModulo = 0

// Desde cuándo no hay nada que hacer: el último fin registrado o, si no hay ninguno, el instante del módulo.
function ocioDesdeDe(rows: TableroFila[], ahora: number): number {
  const lastEnded = rows.reduce((max, row) => Math.max(max, row.endedAt ?? 0), 0)
  if (lastEnded > 0) return lastEnded
  if (ocioModulo === 0 || ocioModulo > ahora) ocioModulo = ahora

  return ocioModulo
}

// Minutos desde la medianoche, en la hora local de la computadora.
function minutosDelDia(ms: number): number {
  const d = new Date(ms)

  return d.getHours() * 60 + d.getMinutes()
}

// Lo que hace cambiar la cara sin que cambie nada más: el paso del ocio y la franja de la hora.
// Si cambia entre dos instantes (con el mismo inicio del ocio), hay que redibujar.
function ritmoRobot(rows: TableroFila[], ocioDesde: number, ms: number): string {
  if (rows.some(row => row.status === 'running')) return 'trabajo'
  const ocio = Math.max(0, ms - ocioDesde)
  const paso = Math.min(Math.floor(ocio / OCIO_PASO_MS), Math.ceil(DORMIR_MS / OCIO_PASO_MS))

  return `${paso}|${franjaHora(minutosDelDia(ms))?.emocion ?? ''}`
}

// El timer vive en el módulo: una recarga en caliente lo cancela junto con
// el entorno viejo, y el render lo vuelve a armar si el panel sigue abierto.
let timer: Timer | undefined

function stopTimer(): void {
  timer?.cancel()
  timer = undefined
}

// Mezcla la lista del motor con lo ya guardado, conservando el instante de
// primera vez. Pura: si nada cambió devuelve filas iguales a las de antes.
function mergeAgents(
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

type ReaccionTipo =
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
function detectReaction(
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

type PatioEntrada = { fase: 'sale' | 'explota'; hasta: number }

// Patio: lo que estaba corriendo y terminó sale (o explota si falló); lo vencido se borra.
function nextPatio(
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

function bucketOf(ms: number): number {
  return Math.floor(ms / BUCKET_MS)
}

// Lee `$.agent.list()` y mezcla con lo ya guardado. Escribir en `$.state`
// redibuja el panel (y la app recarga cada marco Svg), así que solo se escribe
// si cambia algo visible: la lista, el destello de huellas, o el balde de 10 s
// de `now` mientras algo corre. Sin cambios, no hay escrituras.
async function refresh($: EngineInterface): Promise<void> {
  // Con un borrador abierto no se toca el estado: el redibujado pisaría lo tipeado.
  if ((await read($, draftAtom)) !== null) return
  // Solo los últimos MAX_AGENTS del motor: lo más viejo no vuelve a entrar.
  const list = (await $.agent.list()).slice(-MAX_AGENTS)
  const now = await $.clock.now()
  const prev = await read($, agents)
  const merged = mergeAgents(prev, list, now)
  const changed = JSON.stringify(merged.rows) !== JSON.stringify(prev)
  const storedNow = await read($, nowAtom)
  const flash0 = await read($, flashAtom)
  const flash = merged.finished ? now + FLASH_MS : flash0
  const anyRunning = merged.rows.some(row => row.status === 'running')
  const bucketChanged = anyRunning && bucketOf(now) !== bucketOf(storedNow)
  // Lo que el panel muestra (huellas) depende de `flash > now`: se reescribe `now` si cambia.
  const flashVisibleChanged = flash > storedNow !== flash > now
  // Reacción del robot: una nueva reemplaza a la anterior; al vencer se borra (una sola escritura).
  const react0 = await read($, reaccionAtom)
  // Molesto: se enoja con una falla y se le pasa cuando otro subagente termina bien (alivio).
  // Guarda la tarjeta del que falló (vacío = no molesto; un `true` viejo cuenta como molesto sin nombre).
  const molestoRaw: unknown = await read($, molestoAtom)
  const molesto0 = molestoRaw === true ? '?' : typeof molestoRaw === 'string' ? molestoRaw : ''
  const reaction = detectReaction(prev, merged.rows, now, molesto0)
  const expired = reaction === null && react0 !== null && react0.hasta <= now
  const falla = reaction !== null && (reaction.tipo === 'ruge' || reaction.tipo === 'panico' || reaction.tipo === 'frustrado')
  const molesto = falla
    ? (reaction?.quien ?? '')
    : reaction !== null && reaction.tipo === 'alivio'
      ? ''
      : (molestoRaw as string)
  // Patio de agentes que salen o explotan.
  const patio0 = await read($, patioAtom)
  const patio = nextPatio(prev, merged.rows, patio0 as Record<string, PatioEntrada>, now)
  const patioChanged = JSON.stringify(patio) !== JSON.stringify(patio0)
  if (changed) await update($, agents, () => merged.rows)
  if (flash !== flash0) await update($, flashAtom, () => flash)
  if (reaction !== null) await update($, reaccionAtom, () => reaction)
  else if (expired) await update($, reaccionAtom, () => null)
  if (molesto !== molestoRaw) await update($, molestoAtom, () => molesto)
  if (patioChanged) await update($, patioAtom, () => patio)
  // Sin nada corriendo, la cara cambia sola con el paso del ocio y con la hora del día.
  const ocioDesde = ocioDesdeDe(merged.rows, now)
  const ritmoChanged = ritmoRobot(merged.rows, ocioDesde, storedNow) !== ritmoRobot(merged.rows, ocioDesde, now)
  if (
    changed ||
    bucketChanged ||
    flashVisibleChanged ||
    flash !== flash0 ||
    reaction !== null ||
    expired ||
    patioChanged ||
    ritmoChanged
  ) {
    await update($, nowAtom, () => now)
  }
}

// Mide un SVG por su viewBox (0 x 0 si no se puede leer).
function svgSize(svg: string): { width: number; height: number } {
  const found = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/.exec(svg)
  const width = found ? Number(found[1]) : 0
  const height = found ? Number(found[2]) : 0

  return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : { width: 0, height: 0 }
}

// `width` y `height` de un Svg, iguales a su viewBox (nada de espacio blanco de sobra).
function sizeProps(svg: string): { width?: number; height?: number } {
  const { width, height } = svgSize(svg)

  return width > 0 && height > 0 ? { width, height } : {}
}

async function isPaneOpen($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(pane => pane.id === PANE)
}

async function tick($: EngineInterface): Promise<void> {
  try {
    if (!(await isPaneOpen($))) {
      stopTimer()

      return
    }
    if (!usoPedido) {
      usoPedido = true
      await pedirUso($)
    }
    await refresh($)
  } catch {
    // Un tick fallido no debe tirar el panel: el próximo reintenta.
  }
}

function startTimer($: EngineInterface): void {
  if (timer) return
  timer = $.clock.every(PERIOD_MS, () => {
    void tick($)
  })
}

async function refreshQuietly($: EngineInterface): Promise<void> {
  try {
    await refresh($)
  } catch {
    // Sin drama: el siguiente tick o evento lo vuelve a intentar.
  }
}

// ---- Uso de la sesión: ventanas de 5 horas y semanal, contexto y compactar ----

type UsoSesion = {
  limites: Array<{ kind: string; percentUsed: number; resetsAt?: string }>
  contexto?: number
  medido: number
}

// Se pide `$.session.usage()` una vez por carga del módulo; después llegan los `session.measure`.
let usoPedido = false

// Lo que el panel guarda de `$.session.usage()` o de `session.measure`: solo números y textos simples.
function normalizarUso(datos: unknown, medido: number): UsoSesion {
  const d = (datos ?? {}) as { rateLimits?: unknown; context?: { percent?: unknown } }
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

  return out
}

// Guarda el uso solo si cambió algo visible (no el instante de la medición). Nunca lanza.
async function guardarUso($: EngineInterface, datos: unknown): Promise<void> {
  try {
    const ahora = await $.clock.now()
    const nuevo = normalizarUso(datos, ahora)
    const previo = (await read($, usoAtom)) as UsoSesion | null
    const igual =
      previo !== null &&
      JSON.stringify(previo.limites) === JSON.stringify(nuevo.limites) &&
      previo.contexto === nuevo.contexto
    if (!igual) await update($, usoAtom, () => nuevo)
  } catch {
    // El uso es accesorio: sin datos, el panel lo dice.
  }
}

async function pedirUso($: EngineInterface): Promise<void> {
  try {
    await guardarUso($, await $.session.usage())
  } catch {
    // Sin datos de uso: el próximo `session.measure` los trae.
  }
}

// Compacta la conversación, lo mismo que `/compact`. El motor lo rechaza mientras Claude está en un turno.
async function compactarSesion($: EngineInterface): Promise<void> {
  await update($, abiertosAtom, v => ({ ...v, 'confirmar-compactar': false }))
  await setNotice($, 'Compactando la sesión…')
  try {
    const resultado = await $.session.compact()
    if (resultado.messages === undefined) {
      await setNotice($, `No se compactó: ${clean(resultado.skip) || 'otro plugin lo frenó'}.`)

      return
    }
    const antes = resultado.tokensBefore
    const despues = resultado.tokensAfter
    const cifras =
      typeof antes === 'number' && typeof despues === 'number' ? `: de ${fmtNum(antes)} a ${fmtNum(despues)} tokens` : ''
    await setNotice($, `Sesión compactada${cifras}.`)
    await pedirUso($)
  } catch (error) {
    await setNotice(
      $,
      `No se pudo compactar: ${errorText(error)}. Si Claude está respondiendo, probá cuando termine el turno.`,
    )
  }
}

const NOMBRE_LIMITE: Record<string, string> = { five_hour: '5 horas', seven_day: 'Semanal', spend_limit: 'Gasto' }
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// «hoy 15:30» o «lun 09:00», en la hora local; vacío si la fecha no se entiende.
function cuandoRenueva(iso: string | undefined, ahora: number): string {
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
function barraUso(pct: number, ancho: number): { llena: string; vacia: string } {
  const n = Math.round((Math.max(0, Math.min(100, pct)) / 100) * ancho)

  return { llena: '█'.repeat(n), vacia: '░'.repeat(ancho - n) }
}

function colorUso(pct: number): string {
  if (pct >= 80) return '#e8402a'
  if (pct >= 50) return PALETTE.oro

  return '#4fe08a'
}

// ---- Roles: estado, store y registro -------------------------------------

async function setNotice($: EngineInterface, text: string): Promise<void> {
  try {
    await update($, noticeAtom, () => text)
    // Un aviso de error hace saltar chispas al robot.
    if (text.startsWith('No se pudo')) {
      const ahora = await $.clock.now()
      await update($, reaccionAtom, () => ({ tipo: 'chispazo' as const, hasta: ahora + REACT_CHISPAZO_MS }))
      await update($, nowAtom, () => ahora)
    }
  } catch {
    // Un aviso que no se puede guardar no debe romper nada.
  }
}

// Respaldo (comportamiento viejo): lee el store, deja los roles guardados en el
// estado y registra los cuatro (lo guardado manda sobre los valores por defecto).
// Nunca lanza.
async function syncRoles($: EngineInterface): Promise<void> {
  let saved: Record<string, RolSpec> = {}
  try {
    saved = savedRoles(await $.store.get(STORE_ROLES))
  } catch (error) {
    await setNotice($, `No se pudo leer lo guardado: ${errorText(error)}`)
  }
  try {
    await update($, rolesAtom, () => saved)
  } catch {
    // El estado se rearma en la próxima sincronización.
  }
  const live = mergeRoles(saved)
  for (const name of Object.keys(live)) {
    try {
      await $.agent.register(toAgentSpec(name, live[name]))
    } catch (error) {
      await setNotice($, `No se pudo registrar el rol ${name}: ${errorText(error)}`)
    }
  }
}

// Adaptador del fs del motor a lo mínimo que usa el catálogo.
function fsAdapter($: EngineInterface): FsMin {
  return {
    list: async path => (await $.fs.list(path)).map(entry => ({ name: entry.name, kind: entry.kind })),
    read: path => $.fs.read(path),
    write: (path, text) => $.fs.write(path, text),
    exists: path => $.fs.exists(path),
  }
}

// Carpeta de los agentes nativos: <USERPROFILE o HOME>\.claude\agents.
async function raizCatalogo($: EngineInterface): Promise<string> {
  const home = (await $.env.get('USERPROFILE')) || (await $.env.get('HOME'))
  if (!home) throw new Error('no se encontró la carpeta del usuario (USERPROFILE/HOME)')
  const sep = home.includes('/') && !home.includes('\\') ? '/' : '\\'

  return `${home.replace(/[\\/]+$/, '')}${sep}.claude${sep}agents`
}

// Migra lo guardado (sin sobrescribir), lee el catálogo y lo deja en el estado.
// Si algo falla avisa y usa el comportamiento viejo (registrar los cuatro roles).
// Nunca lanza.
async function cargarCatalogo($: EngineInterface): Promise<void> {
  let ok = false
  try {
    const raiz = await raizCatalogo($)
    let saved: Record<string, RolSpec> = {}
    try {
      saved = savedRoles(await $.store.get(STORE_ROLES))
    } catch {
      // Sin lo guardado se migran los valores por defecto.
    }
    await update($, rolesAtom, () => saved)
    const fs = fsAdapter($)
    // Solo se migra si hay roles guardados por la versión vieja del panel (la compu de casa).
    // En una compu nueva no se escribe nada en la carpeta de agentes sin que la usuaria lo pida.
    if (Object.keys(saved).length > 0) await migrarRoles(fs, raiz, mergeRoles(saved))
    const { agentes, errores } = await listarCatalogo(fs, raiz)
    await update($, catalogoAtom, () => ({ agentes, errores, cargado: true, raiz }))
    ok = agentes.length > 0
  } catch (error) {
    await setNotice($, `No se pudo leer el catálogo de agentes: ${errorText(error)}. Se usan los roles de siempre.`)
  }
  if (!ok) await syncRoles($)
}

// Botón «Crear los 4 roles base»: los escribe en <agentes>\base, en la versión que cumple el esquema.
// Nunca pisa un archivo ni un nombre que ya exista. Nunca lanza.
async function crearRolesBase($: EngineInterface): Promise<void> {
  try {
    await update($, abiertosAtom, v => ({ ...v, 'confirmar-roles-base': false }))
    const catalogo = await read($, catalogoAtom)
    if (!catalogo.raiz) throw new Error('no se sabe dónde está la carpeta de agentes')
    const existentes = new Set(catalogo.agentes.map(a => a.name))
    const creados: string[] = []
    for (const agente of rolesBaseEsquema(DEFAULT_ROLES, catalogo.raiz)) {
      if (existentes.has(agente.name) || (await $.fs.exists(agente.ruta))) continue
      await $.fs.write(agente.ruta, serializeAgente(agente))
      creados.push(agente.name)
    }
    await cargarCatalogo($)
    await update($, abiertosAtom, v => ({ ...v, 'grupo:base': true }))
    await setNotice(
      $,
      creados.length > 0
        ? `Creados ${creados.join(', ')} en ${catalogo.raiz}. Claude Code los toma en unos segundos.`
        : 'Los 4 roles base ya existían: no se escribió nada.',
    )
  } catch (error) {
    await setNotice($, `No se pudo crear los roles base (${errorText(error)}).`)
  }
}

// Abre o cierra un desplegable. Ausente = cerrado, salvo `porDefecto` (el resumen arranca abierto).
async function alternar($: EngineInterface, clave: string, porDefecto = false): Promise<void> {
  await update($, abiertosAtom, v => ({ ...v, [clave]: !(clave in v ? v[clave] : porDefecto) }))
}

// Cuerpo de un SKILL.md sin el frontmatter.
function cuerpoSkill(texto: string): string {
  const t = texto.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!t.startsWith('---\n')) return t.trim()
  const fin = t.indexOf('\n---', 4)
  if (fin < 0) return t.trim()
  const resto = t.slice(fin + 4)
  const salto = resto.indexOf('\n')

  return resto.slice(salto < 0 ? resto.length : salto + 1).trim()
}

// Abre o cierra la skill del equipo; la lee del disco solo al abrir.
async function alternarSkill($: EngineInterface, equipo: string): Promise<void> {
  const clave = `skill:${equipo}`
  const abierto = (await read($, abiertosAtom))[clave] === true
  await alternar($, clave)
  if (abierto) return
  let texto = 'Este equipo no tiene skill todavía.'
  try {
    const raiz = (await read($, catalogoAtom)).raiz
    if (raiz) {
      const sep = raiz.includes('/') && !raiz.includes('\\') ? '/' : '\\'
      const base = raiz.replace(/[\\/]+$/, '').replace(/[\\/]agents$/, '')
      const ruta = `${base}${sep}skills${sep}equipo-${equipo}${sep}SKILL.md`
      if (await $.fs.exists(ruta)) texto = cuerpoSkill(String(await $.fs.read(ruta))) || texto
    }
  } catch {
    // Sin skill legible se muestra el mensaje de siempre.
  }
  await update($, skillsEquipoAtom, v => ({ ...v, [equipo]: texto }))
}

async function copiarTarjeta($: EngineInterface, agente: AgenteCatalogo, surface: any): Promise<void> {
  const texto = nombreTarjeta(agente)
  try {
    const res: any = await $.ui.copy({ text: texto, surface })
    if (res && res.ok === false) throw new Error(String(res.error ?? 'la superficie no lo aceptó'))
    await setNotice($, `Copiado: ${texto}`)
  } catch (error) {
    await setNotice($, `No se pudo copiar: ${errorText(error)}. Texto para copiar a mano: ${texto}`)
  }
}

async function crearAgente($: EngineInterface): Promise<void> {
  try {
    const nuevo = await read($, nuevoAtom)
    if (!nuevo) return
    const catalogo = await read($, catalogoAtom)
    const nombre = nuevo.nombre.trim()
    const equipo = nuevo.equipo || 'base'
    let agente: AgenteCatalogo
    try {
      agente = plantillaAgente(nombre, equipo, catalogo.raiz)
    } catch (error) {
      await setNotice($, `No se pudo crear: ${errorText(error)}`)

      return
    }
    if (catalogo.agentes.some(a => a.name === nombre)) {
      await setNotice($, `No se pudo crear: ya existe un agente llamado ${nombre}.`)

      return
    }
    if (await $.fs.exists(agente.ruta)) {
      await setNotice($, `No se pudo crear: ya existe el archivo ${agente.ruta}.`)

      return
    }
    await $.fs.write(agente.ruta, serializeAgente(agente))
    await update($, nuevoAtom, () => null)
    await cargarCatalogo($)
    await update($, abiertosAtom, v => ({ ...v, [`grupo:${equipo}`]: true, [`agente:${nombre}`]: true }))
    await setNotice($, `Creado ${agente.ruta}. Completalo en Editar; Claude Code lo toma en unos segundos.`)
  } catch (error) {
    await setNotice($, `No se pudo crear: ${errorText(error)}`)
  }
}

// Deja cerrado lo de Equipos: grupos, agentes, skills y errores. No toca el resto.
async function cerrarEquipos($: EngineInterface): Promise<void> {
  await update($, abiertosAtom, v => {
    const out: Record<string, boolean> = {}
    for (const [clave, valor] of Object.entries(v)) {
      if (clave.startsWith('grupo:') || clave.startsWith('agente:') || clave.startsWith('skill:') || clave === 'errores') continue
      out[clave] = valor as boolean
    }

    return out
  })
}

async function cerrarDesc($: EngineInterface): Promise<void> {
  await update($, abiertosAtom, v => ({ ...v, desc: false, 'confirmar-restaurar': false }))
}

async function showView($: EngineInterface, view: 'subagentes' | 'roles'): Promise<void> {
  // Tocar la pestaña activa no debe descartar el borrador.
  if ((await read($, viewAtom)) === view) return
  await update($, draftAtom, () => null)
  await update($, noticeAtom, () => '')
  await update($, viewAtom, () => view)
  // Al entrar en Equipos se relee la carpeta: toma lo que se editó por fuera.
  if (view === 'roles') {
    await cerrarEquipos($)
    await cargarCatalogo($)
  }
}

async function startEdit($: EngineInterface, name: string): Promise<void> {
  const agente = (await read($, catalogoAtom)).agentes.find(a => a.name === name)
  if (!agente) return
  await update($, noticeAtom, () => '')
  await update($, promptAtom, () => false)
  await cerrarDesc($)
  await update($, draftAtom, () => ({
    name: agente.name,
    description: agente.description,
    prompt: agente.prompt,
    tools: agente.tools === null ? null : [...agente.tools],
    model: agente.model,
    effort: agente.effort,
    ruta: agente.ruta,
  }))
}

async function cancelEdit($: EngineInterface): Promise<void> {
  await update($, draftAtom, () => null)
  await update($, promptAtom, () => false)
  await cerrarDesc($)
  await update($, noticeAtom, () => '')
  await refreshQuietly($)
}

async function patchDraft($: EngineInterface, patch: Partial<RolBorrador>): Promise<void> {
  await update($, draftAtom, draft => (draft ? { ...draft, ...patch } : draft))
}

async function pickTools($: EngineInterface, kind: string): Promise<void> {
  const tools = presetTools(kind)
  // «personalizado» no es un preset: se conservan las herramientas actuales.
  if (tools === undefined) return
  await patchDraft($, { tools })
}

// Escribe el agente en su archivo; si falla, avisa y el borrador queda abierto.
async function escribirAgente(
  $: EngineInterface,
  agente: AgenteCatalogo,
): Promise<boolean> {
  try {
    await $.fs.write(agente.ruta, serializeAgente(agente))
  } catch (error) {
    await setNotice($, `No se pudo guardar: ${errorText(error)}`)

    return false
  }
  await update($, draftAtom, () => null)
  await update($, promptAtom, () => false)
  await cerrarDesc($)
  await cargarCatalogo($)
  await setNotice($, `Guardado en ${agente.ruta}. Claude Code lo toma en unos segundos.`)
  await refreshQuietly($)

  return true
}

async function saveDraft($: EngineInterface): Promise<void> {
  try {
    const draft = await read($, draftAtom)
    if (!draft) return
    const description = draft.description.trim()
    const prompt = draft.prompt.trim()
    if (!description || !prompt) {
      await setNotice($, 'No se pudo guardar: la descripción y el prompt no pueden quedar vacíos.')

      return
    }
    const original = (await read($, catalogoAtom)).agentes.find(a => a.ruta === draft.ruta)
    if (!original) {
      await setNotice($, 'No se pudo guardar: el agente ya no está en el catálogo.')

      return
    }
    const ok = await escribirAgente(
      $,
      {
        ...original,
        description,
        prompt,
        tools: draft.tools === null ? null : [...draft.tools],
        model: draft.model,
        effort: draft.effort,
      },
    )
    if (ok) {
      const ahora = await $.clock.now()
      await update($, reaccionAtom, () => ({ tipo: 'orgullo' as const, hasta: ahora + REACT_MEDIO_MS, quien: draft.name }))
      await update($, nowAtom, () => ahora)
    }
  } catch (error) {
    await setNotice($, `No se pudo guardar: ${errorText(error)}`)
  }
}

async function restoreDraft($: EngineInterface): Promise<void> {
  try {
    const draft = await read($, draftAtom)
    if (!draft) return
    const defecto = DEFAULT_ROLES[draft.name]
    const original = (await read($, catalogoAtom)).agentes.find(a => a.ruta === draft.ruta)
    if (!defecto || !original) return
    const base = rolAAgente(draft.name, defecto, original.ruta)
    await escribirAgente(
      $,
      { ...base, ruta: original.ruta, equipos: original.equipos, etiquetas: original.etiquetas, extra: original.extra },
    )
  } catch (error) {
    await setNotice($, `No se pudo guardar: ${errorText(error)}`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'oficina',
      description: 'Abre la oficina de subagentes',
    })
    // El catálogo se migra y lee desde el arranque, con el panel cerrado.
    await cargarCatalogo($)

    return next(e)
  })

  on('command.run', { command: 'oficina' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })
    await cerrarEquipos($)
    // Relee el catálogo (y, solo si falla, vuelve a registrar los roles de siempre).
    await cargarCatalogo($)
    await refresh($)
    // Al abrir el panel el robot saluda (y guiña al final), salvo que ya esté reaccionando a algo.
    try {
      const ahora = await $.clock.now()
      const vigente = await read($, reaccionAtom)
      if (vigente === null || vigente.hasta <= ahora) {
        await update($, reaccionAtom, () => ({ tipo: 'saluda' as const, hasta: ahora + REACT_MEDIO_MS }))
        await update($, nowAtom, () => ahora)
      }
    } catch {
      // El saludo es accesorio.
    }
    await pedirUso($)
    startTimer($)

    return { text: 'Tablero de subagentes abierto.' }
  })

  // Al lanzarse un subagente ya existe: se refresca sin esperar el tick (y
  // aunque el panel esté cerrado, para anotar cuándo lo vimos por primera vez).
  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    void refreshQuietly($)

    return result
  })

  // Cuando termina un subagente se refresca, para fijar su hora de fin aunque
  // el panel esté cerrado. Un instante después se repite por si el estado del
  // motor todavía figuraba como «corriendo».
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) {
      try {
        const id = String(e.agentId)
        const bruto = typeof e.answer === 'string' && e.answer !== '' ? e.answer : String(result?.text ?? '')
        const texto = bruto.length > INFORME_MAX ? `${bruto.slice(0, INFORME_MAX)}…` : bruto
        const uso: unknown = e.usage ?? result?.usage
        const suma: Record<string, number> = {}
        if (uso && typeof uso === 'object') {
          for (const [k, v] of Object.entries(uso as Record<string, unknown>)) {
            if (typeof v === 'number' && Number.isFinite(v)) suma[k] = v
          }
        }
        await update($, informesAtom, previo => {
          const antes = previo[id]
          const tokens: Record<string, number> = { ...(antes?.tokens ?? {}) }
          for (const [k, v] of Object.entries(suma)) tokens[k] = (tokens[k] ?? 0) + v
          const nuevo = { texto: texto !== '' ? texto : (antes?.texto ?? ''), tokens, turnos: (antes?.turnos ?? 0) + 1 }
          const resto = { ...previo }
          delete resto[id]
          const claves = Object.keys(resto)
          while (claves.length >= MAX_INFORMES) delete resto[claves.shift() as string]

          return { ...resto, [id]: nuevo }
        })
      } catch {
        // El informe es accesorio: nunca debe romper el turno.
      }
      void refreshQuietly($)
      $.clock.after(300, () => {
        void refreshQuietly($)
      })
    }

    return result
  })

  // El motor avisa cuando cambia el uso (tras cada turno o cuando una ventana se mueve un punto).
  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    await guardarUso($, e)

    return result
  })

  // Cuando el panel se cierra, se frena el timer.
  on('ui.close', async ($, e, next) => {
    const result = await next(e)
    if (e.id === PANE && !(await isPaneOpen($))) stopTimer()

    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const resolved = $.ui.resolve(e)
    const { Box, Text, Button } = resolved
    // `Svg` no existe en la terminal: ahí el panel sigue siendo solo texto.
    const Svg = (resolved as unknown as Record<string, any>).Svg
    startTimer($)

    const view = await read($, viewAtom)
    const notice = await read($, noticeAtom)
    const catalogo = await read($, catalogoAtom)
    const roleNames = [...new Set([...ROLE_NAMES, ...catalogo.agentes.map(a => a.name.toLowerCase())])]

    const termRows = e.viewport?.rows ?? 24
    const hasSvg = Svg !== undefined && Svg !== null
    // Ancho útil del panel en celdas (`bodyColumns`); si no viene, el de toda la pantalla.
    const bodyRaw = (e as unknown as { props?: { bodyColumns?: unknown } }).props?.bodyColumns
    const bodyColumns =
      typeof bodyRaw === 'number' && Number.isFinite(bodyRaw) && bodyRaw > 0 ? bodyRaw : undefined
    const viewColumns = e.viewport?.columns
    const columns =
      bodyColumns ??
      (typeof viewColumns === 'number' && Number.isFinite(viewColumns) && viewColumns > 0
        ? viewColumns
        : undefined)
    const W =
      columns !== undefined
        ? Math.min(DESIGN_WIDTH, Math.max(200, Math.round(columns * 8)))
        : DESIGN_WIDTH
    // Panel angosto: menos de 70 celdas útiles. Si no se sabe el ancho, se asume ancho.
    const narrow = bodyColumns !== undefined && bodyColumns < NARROW_COLUMNS
    const textCols = Math.max(10, (bodyColumns ?? 100) - 2)
    const titleScale = W >= 260 ? 3 : 2

    const noticeLine = notice ? (
      <Text wrap="wrap" color={notice.startsWith('No se pudo') ? 'red' : undefined} bold>
        {notice}
      </Text>
    ) : null

    const quieto = (await read($, quietoAtom)) === true
    // Estado del robot, común a las tres vistas.
    const rows = (await read($, agents)).filter(row => row && typeof row.id === 'string')
    const now = await read($, nowAtom)
    const molestoRaw: unknown = await read($, molestoAtom)
    const molestoQuien = typeof molestoRaw === 'string' ? molestoRaw : ''
    const molesto = molestoRaw === true || molestoQuien !== ''
    const fondo = PALETTE.selva
    const running = rows.filter(row => row.status === 'running').length
    const reaccion = await read($, reaccionAtom)
    const draftComun = view === 'roles' ? await read($, draftAtom) : null
    const editadoComun = draftComun ? catalogo.agentes.find(a => a.ruta === draftComun.ruta) : undefined
    const hayCambios =
      draftComun !== null &&
      editadoComun !== undefined &&
      (draftComun.description !== editadoComun.description ||
        draftComun.prompt !== editadoComun.prompt ||
        draftComun.model !== editadoComun.model ||
        draftComun.effort !== editadoComun.effort ||
        JSON.stringify(draftComun.tools) !== JSON.stringify(editadoComun.tools))
    // Emoción del robot: la decide emociones.ts con lo que pasa ahora (ver sus prioridades).
    const nowReal = await $.clock.now()
    const reaccionVigente = reaccion && reaccion.hasta > now ? String(reaccion.tipo) : ''
    const corriendoRows = rows.filter(row => row.status === 'running')
    const masLargoMs = corriendoRows.reduce((max, row) => Math.max(max, now - row.firstSeen), 0)
    const ocioDesde = ocioDesdeDe(rows, nowReal)
    const minutosHoy = minutosDelDia(nowReal)
    const franja = franjaHora(minutosHoy)
    const estado: { emocion: string; grupo: Grupo } = decidirEmocion({
      reaccion: reaccionVigente,
      corriendo: running,
      masLargoMs,
      molesto,
      cambiosSinGuardar: hayCambios,
      ocioMs: nowReal - ocioDesde,
      minutosDelDia: minutosHoy,
      semilla: ocioDesde,
    })
    // Ocio, hora del día o cambios sin guardar: cada vista pone su propia frase en la burbuja.
    const tranquilo = estado.grupo === 'ocio' || estado.grupo === 'hora'
    const orgulloVigente =
      reaccion !== null && (reaccion.tipo === 'orgullo' || reaccion.tipo === 'guardado') && reaccion.hasta > nowReal

    let caraSvg = ''
    let caraAlt = ''
    let doselSvg = ''
    let grecaSvg = ''
    let frisoArte = ''
    let disponible = PATIO_ANCHO * 2
    if (hasSvg) {
      caraAlt = `Oficina, robot ${EMOCION_ALT[estado.emocion] ?? estado.emocion}`
      // La firma no lleva `now`: el string queda idéntico entre redibujos y la animación no reinicia.
      caraSvg = cachedSvg('cara', `${estado.emocion}|${quieto}`, () =>
        caraRobotSvg(estado.emocion, 3, { quieto, fondo, marco: true }),
      )
      const anchoCara = svgSize(caraSvg).width || CARA_ANCHO
      disponible = Math.max(PATIO_ANCHO * 2, W - anchoCara)
      doselSvg = cachedSvg(`dosel-${disponible}`, `${disponible}`, () => doselPatioSvg(disponible, 2, { fondo }))
      grecaSvg = cachedSvg(`greca-${W}`, `${W}`, () => grecaBand(W, 6))
      frisoArte = cachedSvg(`friso-${W}`, `${W}`, () => frisoSvg(W, 2))
    }
    // Burbuja del robot: una frase que explica lo que pasa (con la tarjeta cuando se sabe).
    const burbujaEstado = (): string => {
      const con = (nombre: string, antes: string, despues: string): string =>
        nombre !== '' ? `${antes}${nombre}${despues}` : ''
      const quienReaccion = reaccion && typeof reaccion.quien === 'string' ? reaccion.quien : ''
      const minutos = (ms: number): number => Math.max(0, Math.floor(ms / 60000))
      // Trabajando en una franja de la hora del día, la burbuja lo comenta al final.
      const conHora = (texto: string): string => (franja ? `${texto} ${franja.frase}` : texto)
      const laburando = (extra: string): string => {
        const tarjetas = corriendoRows.map(row => parse(row.description, roleNames, row.type).card).filter(c => c !== '')
        const lista =
          tarjetas.length > 0 ? `: ${tarjetas.slice(0, 4).join(', ')}${tarjetas.length > 4 ? '…' : ''}.` : '.'

        return conHora(`Laburando con ${plural(corriendoRows.length, 'agente', 'agentes')}${lista} ${extra}`)
      }
      if (orgulloVigente) return `¡Guardado! ${quienReaccion} estrena rol en la próxima sesión. De nada.`
      switch (estado.emocion) {
        case 'dormido':
          return `Modo ahorro de energía hace ${minutos(nowReal - ocioDesde - DORMIR_MS)} min. Despertame si pasa algo interesante.`
        case 'pensando':
          return laburando('No me distraigas.')
        case 'tipea':
          return laburando('Tecleo a dos manos.')
        case 'multitarea':
          return laburando('¡Mil cosas a la vez!')
        case 'concentrado': {
          const largo = [...corriendoRows].sort((a, b) => a.firstSeen - b.firstSeen)[0]
          const nombre = largo ? parse(largo.description, roleNames, largo.type).card : ''

          return conHora(
            `${nombre !== '' ? nombre : 'El agente'} lleva ${minutos(masLargoMs)} min. Auriculares puestos: no me hablen.`,
          )
        }
        case 'sospecha': {
          if (estado.grupo === 'cambios' || (hayCambios && masLargoMs <= SOSPECHA_MS)) {
            return 'Hay cambios sin guardar: Guardar (G) o Cancelar (C).'
          }
          const largo = [...corriendoRows].sort((a, b) => a.firstSeen - b.firstSeen)[0]
          const nombre = largo ? parse(largo.description, roleNames, largo.type).card : ''

          return `${nombre !== '' ? nombre : 'Un agente'} lleva ${minutos(masLargoMs)} min… ¿se fue a almorzar?`
        }
        case 'caceria':
          return `¡Llegó${con(quienReaccion, ' ', '')}! A trabajar, que el café no se paga solo.`
        case 'sorpresa':
          return `¡Uy! Llegaron ${quienReaccion || 'varios'} de golpe. ¿Quién organizó esta fiesta?`
        case 'saluda':
          return '¡Hola! Pasá, que la oficina está abierta.'
        case 'ruge':
          return `¡ERROR! Falló${con(quienReaccion, ' ', '')}. A mí no me mires.`
        case 'panico':
          return `¡Fallaron varios a la vez${con(quienReaccion, ' (', ')')}! ¡No es un simulacro!`
        case 'frustrado':
          return `¿Otra falla?${con(quienReaccion, ' ', '.')} Esto ya es personal.`
        case 'chispazo':
          return 'Chispazo: algo no salió. El aviso de arriba dice qué.'
        case 'molesto':
          return `Falló${con(molestoQuien, ' ', '')}. Estoy ofendido hasta que algo salga bien.`
        case 'bufido':
          return `¿Frenaron${con(quienReaccion, ' ', '')}? Ok. Ok. Respiro.`
        case 'contento':
          return `¡Terminó${con(quienReaccion, ' ', '')}! Siguen los demás.`
        case 'aplaude':
          return `¡Terminaron ${quienReaccion || 'varios'} juntos! Aplausos.`
        case 'festeja':
          return '¡Listo! Oleada terminada sin fallas. Obvio.'
        case 'alivio':
          return `${quienReaccion !== '' ? quienReaccion : 'Eso'} salió bien. Uf, ya se me pasó el enojo.`
        case 'manana':
          return 'Buen día. Primero el café, después los agentes.'
        case 'hambre':
          return '¿Ya es mediodía? Me está dando hambre.'
        case 'casa':
          return 'Ya son más de las cinco y media: dentro de poco me voy a casa.'
        case 'bostezo':
          return 'Aaaah… ¿Nadie tiene trabajo para mí?'
        case 'estira':
          return 'Estirando los circuitos. Sin agentes no hay vida.'
        case 'riega':
          return 'Riego la planta mientras nadie labura.'
        case 'diario':
          return 'Leyendo el diario. Ninguna noticia de agentes.'
        case 'solitario':
          return 'Solitario: voy ganando. Nadie me necesita.'
        case 'silba':
          return 'Fiu, fiu… la oficina está tranquila.'
        case 'guina':
          return 'Todo en orden por acá. Guiño, guiño.'
        default:
          return 'Tomando café. Avisame cuando alguien trabaje.'
      }
    }

    const frisoCierre =
      frisoArte !== '' ? (
        <Svg key="svg-friso-cierre" source={frisoArte} alt="Friso de piedra tallada" {...sizeProps(frisoArte)} />
      ) : null

    // Cabecera común: cara grande a la izquierda, escena de la vista a la derecha, burbuja y greca debajo.
    const cabecera = (escena: any, burbuja: string) => {
      if (!hasSvg || caraSvg === '') return null

      return (
        <Box flexDirection="column">
          <Box flexDirection="row" alignItems="flex-end" backgroundColor={PALETTE.selva}>
            <Svg key="svg-pista" source={caraSvg} {...sizeProps(caraSvg)} alt={caraAlt} isInteractive />
            <Box flexDirection="column" flexGrow={1} flexShrink={1} minWidth={0} backgroundColor={PALETTE.selva}>
              {doselSvg !== '' && (
                <Svg key="svg-dosel" source={doselSvg} alt="Dosel de la selva" {...sizeProps(doselSvg)} />
              )}
              {escena}
            </Box>
          </Box>
          {burbuja !== '' && (
            <Box backgroundColor={FONDO_BURBUJA} paddingX={1}>
              <Text color={PALETTE.crema} wrap="wrap">
                {burbuja}
              </Text>
            </Box>
          )}
          {grecaSvg !== '' && (
            <Svg key="svg-greca" source={grecaSvg} alt="Franja de greca maya" {...sizeProps(grecaSvg)} />
          )}
        </Box>
      )
    }

    // Día del calendario maya (hora local), con su numeral.
    const local = nowReal - new Date(nowReal).getTimezoneOffset() * 60000
    const diaMaya = tzolkin(local)
    const barraSuperior = () => {
      const numMaya = hasSvg
        ? cachedSvg(`dia-maya-${diaMaya.numero}`, `${diaMaya.numero}`, () =>
            numeroMayaSvg(diaMaya.numero, 1, PALETTE.oro),
          )
        : ''

      return (
        <Box flexDirection="row" alignItems="center" flexWrap="wrap" backgroundColor="#141a12" paddingX={1}>
          <Button
            key="tab-subagentes"
            label="Subagentes"
            variant={view === 'subagentes' ? 'primary' : 'secondary'}
            onPress={() => showView($, 'subagentes')}
          />
          <Text> </Text>
          <Button
            key="tab-roles"
            label="Equipos"
            variant={view === 'roles' ? 'primary' : 'secondary'}
            onPress={() => showView($, 'roles')}
          />
          <Box flexGrow={1} />
          {numMaya !== '' ? (
            <Svg
              key="svg-dia-maya"
              source={numMaya}
              alt={`Hoy en el calendario maya: ${diaMaya.texto}`}
              {...sizeProps(numMaya)}
            />
          ) : null}
          {numMaya !== '' ? (
            <Text color={PALETTE.oro}>{` ${diaMaya.texto} `}</Text>
          ) : (
            <Text dimColor>{`${diaMaya.texto} `}</Text>
          )}
          {hasSvg && e.surface !== 'terminal' && (
            <Button
              key="quieto"
              label={quieto ? 'Animar' : 'Frenar animaciones'}
              onPress={() => update($, quietoAtom, v => !v)}
            />
          )}
        </Box>
      )
    }
    if (view === 'roles') {
      if (e.surface === 'mobile') {
        return (
          <Box flexDirection="column">
            {barraSuperior()}
            <Text dimColor>El editor de roles necesita campos de texto: abrilo en escritorio.</Text>
          </Box>
        )
      }
      const { Input, Select } = $.ui.resolve(e)
      const draft = await read($, draftAtom)
      const promptAbierto = await read($, promptAtom)
      const abiertos = await read($, abiertosAtom)

      if (draft) {
        const kind = toolsKind(draft.tools)
        const toolOptions = [
          { value: 'lectura', label: 'solo lectura' },
          { value: 'lectura-web', label: 'lectura y web' },
          { value: 'escritura', label: 'lectura y escritura' },
          { value: 'todas', label: 'todas' },
        ]
        if (kind === 'personalizado') {
          toolOptions.push({ value: 'personalizado', label: toolsLabel(draft.tools) })
        }

        const editado = catalogo.agentes.find(a => a.ruta === draft.ruta)
        const equipo = editado?.equipos[0] ?? 'base'
        const acento = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
        const dios = DIOSES_EQUIPO[equipo]?.dios ?? ''
        const confirmando = abiertos['confirmar-restaurar'] === true
        const etiqueta = (texto: string) => (
          <Box width={14}>
            <Text>{texto}</Text>
          </Box>
        )
        let editHeader: any
        let escenaEditar: any = null
        if (hasSvg) {
          const paredArte = cachedSvg(`pared-${disponible}`, `${disponible}|${quieto}`, () =>
            paredTallerSvg(disponible, 2, { quieto }),
          )
          const codiceArte = cachedSvg(`codice-${disponible}`, `${disponible}`, () => codiceSvg(disponible, 2))
          escenaEditar = (
            <Box flexDirection="column">
              {paredArte !== '' && (
                <Svg key="svg-pared-taller" source={paredArte} alt="Taller del escriba" {...sizeProps(paredArte)} />
              )}
              {codiceArte !== '' && (
                <Svg key="svg-codice" source={codiceArte} alt="Pizarra del escriba" {...sizeProps(codiceArte)} />
              )}
            </Box>
          )
          const diosArte = cachedSvg(`dios2-${equipo}`, equipo, () => diosSvg(equipo, 2, acento))
          const editGlifo = glifoDe(draft.name, '', editado ? [editado] : catalogo.agentes)
          const roleIcon = cachedSvg(`glifo3-${editGlifo.tipo}-${equipo}`, equipo, () =>
            glifoSvg(editGlifo.tipo, equipo, 3),
          )
          editHeader = (
            <Box flexDirection="row" alignItems="center" flexWrap="wrap">
              {roleIcon !== '' && (
                <Svg
                  key="svg-icono-editar"
                  source={roleIcon}
                  alt={`Ícono del rol ${draft.name}`}
                  {...sizeProps(roleIcon)}
                />
              )}
              {diosArte !== '' && (
                <Svg
                  key="svg-dios-equipo"
                  source={diosArte}
                  alt={`Dios ${dios} del equipo ${equipo}`}
                  {...sizeProps(diosArte)}
                />
              )}
              <Box paddingX={1} flexDirection="column">
                <Text color={roleColor(draft.name)} bold wrap="wrap">
                  {draft.name}
                </Text>
                <Text color={acento[0]} wrap="wrap">{`equipo ${equipo} · ${dios}`}</Text>
              </Box>
            </Box>
          )
        } else {
          editHeader = <Text bold>{`Editando el rol «${draft.name}» (equipo ${equipo})`}</Text>
        }
        const burbujaEditar =
          orgulloVigente || !(tranquilo || estado.grupo === 'cambios')
            ? burbujaEstado()
            : hayCambios
              ? 'Hay cambios sin guardar: Guardar (G) o Cancelar (C).'
              : `Editando ${draft.name}. Lo que guardes vale en una sesión nueva.`

        return (
          <Box flexDirection="column">
            {barraSuperior()}
            {noticeLine}
            {cabecera(escenaEditar, burbujaEditar)}
            <Box flexDirection="column">
              <Box flexDirection="row">
                <Button key="volver-equipos" label="← Equipos" onPress={() => cancelEdit($)} />
                <Text dimColor>{` / ${equipo} / `}</Text>
                <Text bold>{draft.name}</Text>
              </Box>
              {editHeader}
              <Box flexDirection="row">
                {etiqueta('Modelo')}
                <Select
                  key="rol-model"
                  options={MODELS.map(value => ({ value }))}
                  value={draft.model}
                  onSelect={value => patchDraft($, { model: value })}
                />
              </Box>
              <Box flexDirection="row">
                {etiqueta('Esfuerzo')}
                <Select
                  key="rol-effort"
                  options={EFFORTS.map(value => ({ value }))}
                  value={draft.effort}
                  onSelect={value => patchDraft($, { effort: value })}
                />
              </Box>
              <Box flexDirection="row">
                {etiqueta('Herramientas')}
                <Select
                  key="rol-tools"
                  options={toolOptions}
                  value={kind}
                  onSelect={value => pickTools($, value)}
                />
              </Box>
              <Text bold>Descripción</Text>
              {abiertos.desc === true ? (
                <Input
                  key="rol-description"
                  placeholder="Cuándo delegar a este rol"
                  value={draft.description}
                  onInput={value => patchDraft($, { description: value })}
                  onSubmit={value => patchDraft($, { description: value })}
                />
              ) : (
                <Box borderStyle="round" paddingX={1} flexDirection="column">
                  <Text wrap="wrap">{draft.description}</Text>
                </Box>
              )}
              <Button
                key="rol-ver-desc"
                label={abiertos.desc === true ? 'Listo' : 'Cambiar descripción'}
                hotkey="d"
                onPress={() => alternar($, 'desc')}
              />
              <Button
                key="rol-ver-prompt"
                label={promptAbierto ? '▾ Ocultar prompt' : `▸ Prompt (${draft.prompt.length} caracteres)`}
                hotkey="p"
                onPress={() => update($, promptAtom, v => !v)}
              />
              {promptAbierto && (
                <Box flexDirection="column">
                  <Box borderStyle="round" paddingX={1} flexDirection="column">
                    <Text wrap="wrap">{draft.prompt}</Text>
                  </Box>
                  <Input
                    key="rol-prompt"
                    label="Cambiar prompt: "
                    placeholder="System prompt completo del rol"
                    value={draft.prompt}
                    onInput={value => patchDraft($, { prompt: value })}
                    onSubmit={value => patchDraft($, { prompt: value })}
                  />
                  <Text dimColor wrap="wrap">
                    Arriba ves el texto completo. Para cambiar un prompt largo, pronto vas a poder editar el archivo del agente.
                  </Text>
                </Box>
              )}
              {hayCambios && <Text color={PALETTE.oro}>● Cambios sin guardar</Text>}
              <Box flexDirection="row">
                <Button
                  key="rol-guardar"
                  label="Guardar"
                  hotkey="g"
                  variant="primary"
                  onPress={() => saveDraft($)}
                />
                <Text> </Text>
                <Button key="rol-cancelar" label="Cancelar" hotkey="c" onPress={() => cancelEdit($)} />
                <Box flexGrow={1} />
                {DEFAULT_ROLES[draft.name] !== undefined && (
                  <Button
                    key="rol-restaurar"
                    label="Restaurar original…"
                    hotkey="r"
                    onPress={() => alternar($, 'confirmar-restaurar')}
                  />
                )}
              </Box>
              {confirmando && DEFAULT_ROLES[draft.name] !== undefined && (
                <Box flexDirection="column">
                  <Text wrap="wrap">¿Volver a los valores originales? Se pierde lo que cambiaste.</Text>
                  <Box flexDirection="row">
                    <Button
                      key="rol-restaurar-si"
                      label="Sí, restaurar"
                      onPress={async () => {
                        await update($, abiertosAtom, v => ({ ...v, 'confirmar-restaurar': false }))
                        await restoreDraft($)
                      }}
                    />
                    <Text> </Text>
                    <Button
                      key="rol-restaurar-no"
                      label="No"
                      onPress={() => update($, abiertosAtom, v => ({ ...v, 'confirmar-restaurar': false }))}
                    />
                  </Box>
                </Box>
              )}
            </Box>
            {frisoCierre}
          </Box>
        )
      }

      const temploArte = hasSvg ? cachedSvg(`templo-${disponible}`, `${disponible}`, () => temploSvg(disponible, 2)) : ''

      const skills = await read($, skillsEquipoAtom)
      const nuevo = await read($, nuevoAtom)
      const formNuevo =
        nuevo === null ? (
          <Button
            key="nuevo-agente"
            label="+ Nuevo agente"
            onPress={() => update($, nuevoAtom, () => ({ nombre: '', equipo: 'base' }))}
          />
        ) : (
          <Box flexDirection="column">
            <Input
              key="nuevo-nombre"
              label="Nombre: "
              placeholder="minúsculas-y-guiones"
              value={nuevo.nombre}
              onInput={value => update($, nuevoAtom, v => (v ? { ...v, nombre: value } : v))}
              onSubmit={value => update($, nuevoAtom, v => (v ? { ...v, nombre: value } : v))}
            />
            <Select
              key="nuevo-equipo"
              label="Equipo: "
              options={Object.keys(EQUIPOS_ESQUEMA).map(value => ({ value }))}
              value={nuevo.equipo}
              onSelect={value => update($, nuevoAtom, v => (v ? { ...v, equipo: value } : v))}
            />
            <Box flexDirection="row">
              <Button key="nuevo-crear" label="Crear" onPress={() => crearAgente($)} />
              <Text> </Text>
              <Button key="nuevo-cancelar" label="Cancelar" onPress={() => update($, nuevoAtom, () => null)} />
            </Box>
          </Box>
        )
      const filtro = await read($, filtroAtom)
      const opcionesFiltro = [
        ...new Set(['todas', ...catalogo.agentes.flatMap(a => [...a.equipos, ...a.etiquetas])]),
      ]
      const filtroActual = opcionesFiltro.includes(filtro) ? filtro : 'todas'
      const visibles = catalogo.agentes.filter(
        a => filtroActual === 'todas' || a.equipos.includes(filtroActual) || a.etiquetas.includes(filtroActual),
      )
      const grupos = new Map<string, AgenteCatalogo[]>()
      for (const agente of visibles) {
        const equipo = agente.equipos[0] ?? 'sin equipo'
        grupos.set(equipo, [...(grupos.get(equipo) ?? []), agente])
      }
      const tarjeta = (agente: AgenteCatalogo, pos: number) => {
        const name = agente.name
        const abierto = abiertos[`agente:${name}`] === true
        const etiquetas = agente.etiquetas.length > 0 ? `etiquetas: ${agente.etiquetas.join(', ')}` : ''
        const tipoAg = tipoDeAgente({ name: agente.name, tools: agente.tools, emblema: agente.emblema })
        const equipoAg = agente.equipos[0] ?? 'base'
        const iconSvg = hasSvg
          ? cachedSvg(`glifo2-${tipoAg}-${equipoAg}`, `${tipoAg}|${equipoAg}`, () =>
              glifoSvg(tipoAg, equipoAg, 2),
            )
          : ''
        const avisos = validarAgente(agente)
        const avisoCerrado =
          avisos.length > 0 ? (
            <Text key={`aviso-${name}`} color={PALETTE.oro}>{` ⚠ ${avisos.length}`}</Text>
          ) : null
        const listaAvisos = abierto
          ? avisos.map((a, i) => (
              <Text key={`aviso-${name}-${i}`} color={PALETTE.oro} wrap="wrap">{`⚠ ${a}`}</Text>
            ))
          : []
        const copiar = abierto ? (
          <Button
            key={`copiar-${name}`}
            label="Copiar nombre de tarjeta"
            onPress={() => copiarTarjeta($, agente, e.surface)}
          />
        ) : null
        const toggle = (
          <Button
            key={`abrir-agente-${name}`}
            label={abierto ? '▾' : '▸'}
            onPress={() => alternar($, `agente:${name}`)}
          />
        )
        const edit: any = abierto ? (
          <Button key={`editar-${name}`} label="Editar" onPress={() => startEdit($, name)} />
        ) : null
        if (!hasSvg) {
          return (
            <Box key={`rol-${name}`} flexDirection="column">
              <Box flexDirection="row">
                {toggle}
                <Text>{'  '}</Text>
                <Text color={roleColor(name)} bold>
                  {pad(name, 14)}
                </Text>
                <Text wrap="truncate">{agente.model}</Text>
                {avisoCerrado}
              </Box>
              {abierto && (
                <Box flexDirection="column" paddingX={2}>
                  <Text dimColor wrap="wrap">{agente.description}</Text>
                  <Text wrap="wrap">{`${agente.effort} · ${toolsLabel(agente.tools)}`}</Text>
                  {etiquetas !== '' && <Text dimColor wrap="wrap">{etiquetas}</Text>}
                  <Text dimColor wrap="wrap">{agente.ruta}</Text>
                  {listaAvisos}
                  <Box flexDirection="row">
                    {edit}
                    {copiar !== null && <Text> </Text>}
                    {copiar}
                  </Box>
                </Box>
              )}
            </Box>
          )
        }

        const colorEquipo = EQUIPO_ACENTO[equipoAg]?.[0] ?? EQUIPO_ACENTO.base[0]
        const fondoTarjeta = {
          backgroundColor: pos % 2 === 0 ? '#20251b' : '#1a1e16',
          hover: { backgroundColor: '#2c3424' },
        }
        const icon =
          iconSvg !== '' ? (
            <Svg
              key={`icono-rol-${name}`}
              source={iconSvg}
              alt={`Ícono del rol ${name}`}
              {...sizeProps(iconSvg)}
            />
          ) : null
        const fila = (
          <Box
            flexDirection="row"
            alignItems="center"
            paddingLeft={2}
            {...(narrow ? { flexWrap: 'wrap' as const } : {})}
            {...fondoTarjeta}
          >
            {icon}
            <Box paddingX={1}>
              <Text color={roleColor(name)} bold>
                {name}
              </Text>
            </Box>
            <Text backgroundColor={PALETTE.negro} color={PALETTE.crema}>{` ${agente.model} `}</Text>
            {avisoCerrado}
            <Box flexGrow={1} />
            {toggle}
          </Box>
        )

        return (
          <Box key={`rol-${name}`} flexDirection="column">
            {fila}
            {abierto && (
              <Box flexDirection="column" borderStyle="round" borderColor={colorEquipo} paddingX={1} marginLeft={2}>
                <Text dimColor wrap="wrap">
                  {agente.description}
                </Text>
                <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
                  <Text backgroundColor={PALETTE.negro} color={PALETTE.crema}>{` ${agente.effort} `}</Text>
                  <Text backgroundColor={PALETTE.negro} color={PALETTE.crema} wrap="wrap">
                    {` ${toolsLabel(agente.tools)} `}
                  </Text>
                </Box>
                {etiquetas !== '' && (
                  <Text color={PALETTE.oro} wrap="wrap">
                    {etiquetas}
                  </Text>
                )}
                {listaAvisos}
                <Box flexDirection="row" flexWrap="wrap">
                  {edit}
                  {copiar !== null && <Text> </Text>}
                  {copiar}
                </Box>
                <Text dimColor wrap="wrap">
                  {agente.ruta}
                </Text>
              </Box>
            )}
          </Box>
        )
      }

      const cantEquipos = new Set(catalogo.agentes.map(a => a.equipos[0] ?? 'sin equipo')).size
      const burbujaEquipos = !tranquilo
          ? burbujaEstado()
          : catalogo.agentes.length === 0
            ? 'No encuentro agentes. Creá uno con + Nuevo agente.'
            : `${plural(cantEquipos, 'equipo', 'equipos')} y ${plural(catalogo.agentes.length, 'agente', 'agentes')}. Abrí un equipo para ver quién hace qué.`

      // Un equipo sin actividad en el patio se marca: hay que pensarle una (arte-actividades.ts).
      const sinActividad = (equipo: string) =>
        equipo !== 'sin equipo' && !actividadDe(equipo).pensada ? (
          <Text key={`sin-actividad-${equipo}`} color={PALETTE.oro} wrap="wrap">
            {`⚠ El equipo ${equipo} no tiene actividad en el patio: hay que pensarla.`}
          </Text>
        ) : null

      const skillGrupo = (equipo: string, abierto: boolean) =>
        abierto ? (
          <Box key={`skill-${equipo}`} flexDirection="column">
            <Button
              key={`abrir-skill-${equipo}`}
              label={`${abiertos[`skill:${equipo}`] === true ? '▾' : '▸'} Cómo trabaja el equipo`}
              dimColor
              onPress={() => alternarSkill($, equipo)}
            />
            {abiertos[`skill:${equipo}`] === true && (
              <Text wrap="wrap">{skills[equipo] ?? 'Este equipo no tiene skill todavía.'}</Text>
            )}
          </Box>
        ) : null

      const encabezadoGrupo = (equipo: string, cantidad: number, abierto: boolean) => {
        if (!hasSvg || e.surface === 'terminal') {
          return (
            <Box key={`grupo-${equipo}`} flexDirection="column">
              <Box flexDirection="row" alignItems="center" flexWrap="wrap">
                <Box paddingX={1}>
                  <Button
                    key={`abrir-grupo-${equipo}`}
                    label={`${abierto ? '▾' : '▸'} ${equipo} (${cantidad})`}
                    onPress={() => alternar($, `grupo:${equipo}`)}
                  />
                </Box>
              </Box>
              {sinActividad(equipo)}
              {skillGrupo(equipo, abierto)}
            </Box>
          )
        }
        const acento = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
        const dios = DIOSES_EQUIPO[equipo]?.dios ?? ''
        const tarea = TAREA_EQUIPO[equipo]
        const diosArte = cachedSvg(`dios2-${equipo}`, equipo, () => diosSvg(equipo, 2, acento))
        const numArte = cachedSvg(`maya2-${cantidad}-${acento[0]}`, `${cantidad}|${acento[0]}`, () =>
          numeroMayaSvg(cantidad, 2, acento[0]),
        )
        const subtitulo = dios !== '' && tarea !== undefined ? `${dios} · ${tarea}` : dios

        return (
          <Box
            key={`grupo-${equipo}`}
            flexDirection="row"
            alignItems="center"
            borderStyle="round"
            borderColor={acento[0]}
            paddingX={1}
            backgroundColor="#2a2f24"
            hover={{ backgroundColor: '#3a4232' }}
          >
            <Svg
              key={`svg-grupo-${equipo}`}
              source={diosArte}
              alt={dios !== '' ? `Dios ${dios} del equipo ${equipo}` : `Dios del equipo ${equipo}`}
              {...sizeProps(diosArte)}
            />
            <Box flexDirection="column" flexGrow={1} minWidth={0} paddingX={1}>
              <Button
                key={`abrir-grupo-${equipo}`}
                label={`${abierto ? '▾' : '▸'} ${equipo}`}
                onPress={() => alternar($, `grupo:${equipo}`)}
              />
              <Box flexDirection="row" alignItems="center">
                <Svg
                  key={`svg-maya-${equipo}`}
                  source={numArte}
                  alt={`${cantidad} en numeral maya`}
                  {...sizeProps(numArte)}
                />
                <Text>{cantidad === 1 ? ' 1 agente' : ` ${cantidad} agentes`}</Text>
              </Box>
              {subtitulo !== '' && (
                <Text dimColor wrap="wrap">
                  {subtitulo}
                </Text>
              )}
              {sinActividad(equipo)}
              {skillGrupo(equipo, abierto)}
            </Box>
          </Box>
        )
      }

      return (
        <Box flexDirection="column">
          {barraSuperior()}
          {noticeLine}
          {cabecera(
            temploArte !== '' ? (
              <Svg key="svg-templo" source={temploArte} alt="Templo abandonado" {...sizeProps(temploArte)} />
            ) : null,
            burbujaEquipos,
          )}
          <Box flexDirection="column">
          <Box flexDirection="row" flexWrap="wrap" alignItems="center">
            {formNuevo}
            <Select
              key="filtro-etiqueta"
              label="Etiqueta: "
              options={opcionesFiltro.map(value => ({ value }))}
              value={filtroActual}
              onSelect={value => update($, filtroAtom, () => value)}
            />
          </Box>
          {catalogo.errores.length > 0 && (
            <Box flexDirection="row">
              <Text color="red">⚠ </Text>
              <Button
                key="abrir-errores"
                label={`${abiertos.errores === true ? '▾' : '▸'} ${catalogo.errores.length} archivo(s) con error`}
                onPress={() => alternar($, 'errores')}
              />
            </Box>
          )}
          {abiertos.errores === true &&
            catalogo.errores.map(item => (
              <Text key={`error-${item.ruta}`} color="red" wrap="wrap">
                {`${item.ruta}: ${item.error}`}
              </Text>
            ))}
          {catalogo.cargado && catalogo.agentes.length === 0 && (
            <Box flexDirection="column">
              <Text dimColor wrap="wrap">
                {`No hay agentes en ${catalogo.raiz}. Lo mejor es instalar los del kit (kit/agentes). Si no, podés crear los 4 roles base o uno nuevo con + Nuevo agente.`}
              </Text>
              <Box flexDirection="row">
                <Button
                  key="roles-base"
                  label="Crear los 4 roles base…"
                  onPress={() => alternar($, 'confirmar-roles-base')}
                />
              </Box>
              {abiertos['confirmar-roles-base'] === true && (
                <Box flexDirection="column">
                  <Text wrap="wrap">
                    {`¿Crear implementador, corrector, investigador y revisor en ${catalogo.raiz}${catalogo.raiz.includes('/') ? '/' : '\\'}base? No se pisa ningún archivo.`}
                  </Text>
                  <Box flexDirection="row">
                    <Button key="roles-base-si" label="Sí, crearlos" onPress={() => crearRolesBase($)} />
                    <Text> </Text>
                    <Button
                      key="roles-base-no"
                      label="No"
                      onPress={() => update($, abiertosAtom, v => ({ ...v, 'confirmar-roles-base': false }))}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {[...grupos.entries()].map(([equipo, lista]) => {
            // Con un filtro que deja un solo grupo, ese grupo se muestra abierto.
            const grupoAbierto =
              abiertos[`grupo:${equipo}`] === true || (filtroActual !== 'todas' && grupos.size === 1)

            return (
              <Box key={`equipo-${equipo}`} flexDirection="column">
                {encabezadoGrupo(equipo, lista.length, grupoAbierto)}
                {grupoAbierto && lista.map((agente, pos) => tarjeta(agente, pos))}
              </Box>
            )
          })}
          <Text dimColor>Los cambios se guardan en el archivo del agente; valen en una sesión nueva o a los pocos segundos.</Text>
          </Box>
          {frisoCierre}
        </Box>
      )
    }

    const abiertosSub = await read($, abiertosAtom)
    const informes = await read($, informesAtom)
    const resumenAbierto = abiertosSub.resumen !== false

    // Uso de la sesión: ventanas de 5 h y semanal, contexto y el botón de compactar. Arranca abierto.
    const uso = (await read($, usoAtom)) as UsoSesion | null
    const usoAbierto = abiertosSub.uso !== false
    const confirmandoCompactar = abiertosSub['confirmar-compactar'] === true
    const anchoBarra = narrow ? 10 : 20
    const filaUso = (clave: string, nombre: string, pct: number, renueva: string) => {
      const barra = barraUso(pct, anchoBarra)

      return (
        <Box key={`uso-${clave}`} flexDirection="row" flexWrap="wrap">
          <Text>{pad(nombre, 10)}</Text>
          <Text color={colorUso(pct)}>{barra.llena}</Text>
          <Text dimColor>{barra.vacia}</Text>
          <Text bold>{` ${pct.toLocaleString('es-UY', { maximumFractionDigits: 1 })} %`}</Text>
          {renueva !== '' && <Text dimColor>{` · se renueva ${renueva}`}</Text>}
        </Box>
      )
    }
    const limitesUso = (uso?.limites ?? []).slice().sort(
      (a, b) =>
        (a.kind === 'five_hour' ? 0 : a.kind === 'seven_day' ? 1 : 2) -
        (b.kind === 'five_hour' ? 0 : b.kind === 'seven_day' ? 1 : 2),
    )
    const panelUso = (
      <Box key="uso-sesion" flexDirection="column">
        <Button
          key="abrir-uso"
          label={`${usoAbierto ? '▾' : '▸'} Uso de la sesión`}
          onPress={() => alternar($, 'uso', true)}
        />
        {usoAbierto && (
          <Box flexDirection="column" paddingLeft={2}>
            {limitesUso.map(l =>
              filaUso(l.kind, NOMBRE_LIMITE[l.kind] ?? l.kind, l.percentUsed, cuandoRenueva(l.resetsAt, nowReal)),
            )}
            {limitesUso.length === 0 && (
              <Text dimColor wrap="wrap">
                Sin datos de las ventanas de 5 horas y semanal: aparecen con una suscripción, después de la primera respuesta.
              </Text>
            )}
            {uso?.contexto !== undefined && filaUso('contexto', 'Contexto', uso.contexto, '')}
            <Box flexDirection="row">
              <Button
                key="compactar"
                label="Compactar sesión…"
                onPress={() => alternar($, 'confirmar-compactar')}
              />
            </Box>
            {confirmandoCompactar && (
              <Box flexDirection="column">
                <Text wrap="wrap">
                  ¿Compactar la conversación ahora? Claude resume lo hablado y libera contexto, igual que /compact.
                </Text>
                <Box flexDirection="row">
                  <Button key="compactar-si" label="Sí, compactar" onPress={() => compactarSesion($)} />
                  <Text> </Text>
                  <Button
                    key="compactar-no"
                    label="No"
                    onPress={() => update($, abiertosAtom, v => ({ ...v, 'confirmar-compactar': false }))}
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
    // Líneas que ocupa el bloque de uso (para no tapar la lista con poco espacio).
    const lineasUso = usoAbierto
      ? 2 + Math.max(1, limitesUso.length) + (uso?.contexto !== undefined ? 1 : 0) + (confirmandoCompactar ? 3 : 0)
      : 1
    const sorted = orderTree(rows)

    const count = (status: string) => rows.filter(row => row.status === status).length
    const done = count('completed')
    const failed = count('failed')
    const stopped = count('killed')
    const others = rows.filter(row => !isKnown(String(row.status ?? ''))).length
    const summary = [
      `${running} corriendo`,
      plural(done, 'lista', 'listas'),
      `${failed} ${failed === 1 ? 'falló' : 'fallaron'}`,
    ]
    if (stopped > 0) summary.push(plural(stopped, 'frenada', 'frenadas'))
    if (others > 0) summary.push(plural(others, 'otro', 'otros'))
    const tokensVistos = rows.reduce((sum, row) => sum + totalTokens(informes[row.id]?.tokens ?? {}), 0)
    if (tokensVistos > 0) summary.push(`${fmtNum(tokensVistos)} tokens`)

    const nowBucket = Math.floor(now / BUCKET_MS) * BUCKET_MS
    const patioEstado = (await read($, patioAtom)) as Record<string, PatioEntrada>

    // Palabra grande: corre > falló > lista; sin subagentes, ninguna.
    const bigWord = running > 0 ? 'corre' : failed > 0 ? 'falló' : done > 0 ? 'lista' : ''

    // Cada SVG se arma aparte: si uno falla, se omite y el resto sigue.
    let pisoSvg = ''
    type Celda = { id: string; fase: string; svg: string; alt: string; titulo: string }
    const celdas: Celda[] = []
    // Equipos que hay en el patio, en orden de aparición: la leyenda de colores.
    const equiposPatio: string[] = []
    let celdasPorFila = 1
    let filasPatio = 1
    let wordSvg = ''
    let lineSvg = ''
    if (hasSvg) {
      celdasPorFila = Math.max(1, Math.floor(disponible / (PATIO_ANCHO * 2)))
      for (const row of [...rows].sort((x, y) => (x.firstSeen ?? 0) - (y.firstSeen ?? 0))) {
        const entrada = patioEstado[row.id]
        const fase = row.status === 'running' ? 'entra' : entrada && entrada.hasta > now ? entrada.fase : ''
        if (fase === '') continue
        const info = parse(row.description, roleNames, row.type)
        const { equipo } = glifoDe(info.base, info.role, catalogo.agentes)
        const acento = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
        const etiqueta = info.card
        const titulo = [info.card, info.model, info.role, info.text, `equipo ${equipo}`].filter(part => part !== '').join(SEP)
        const svg = cachedSvg(`celda-${row.id}`, `${fase}|${equipo}|${etiqueta}|${quieto}|${titulo}`, () =>
          celdaPatioSvg({
            fase,
            acento,
            actividad: actividadParaCelda(actividadDe(equipo).actividad, 2, acento[0]),
            semilla: semillaDe(row.id),
            escala: 2,
            etiqueta,
            quieto,
            fondo,
            titulo,
          }),
        )
        if (svg !== '' && !equiposPatio.includes(equipo)) equiposPatio.push(equipo)
        if (svg === '') continue
        const accion = fase === 'explota' ? 'explotando' : fase === 'sale' ? 'saliendo' : 'trabajando'
        celdas.push({ id: row.id, fase, svg, alt: `Agente ${etiqueta} ${accion}`, titulo })
      }
      // Tope de dos filas: salen/explotan primero, luego las que corren de la más nueva a la más vieja.
      const maxCeldas = celdasPorFila * 2
      if (celdas.length > maxCeldas) {
        const orden = new Map(rows.map((row, i) => [row.id, i]))
        const saliendo = celdas.filter(c => c.fase === 'sale' || c.fase === 'explota')
        const corriendo = celdas
          .filter(c => !(c.fase === 'sale' || c.fase === 'explota'))
          .sort((x, y) => (rows[orden.get(y.id) ?? 0]?.firstSeen ?? 0) - (rows[orden.get(x.id) ?? 0]?.firstSeen ?? 0))
        const elegidas = [...saliendo, ...corriendo].slice(0, maxCeldas - 1)
        const resto = celdas.length - elegidas.length
        const masSvg = cachedSvg(`celda-mas-${resto}`, `${resto}`, () => celdaMasSvg(resto, 2, { fondo }))
        celdas.length = 0
        celdas.push(...elegidas)
        if (masSvg !== '') celdas.push({ id: 'mas', fase: '', svg: masSvg, alt: `Y ${resto} agentes más`, titulo: '' })
      }
      filasPatio = Math.max(1, Math.ceil(celdas.length / celdasPorFila))
      if (celdas.length < celdasPorFila) {
        const resto = disponible - celdas.length * PATIO_ANCHO * 2
        if (resto > 0) pisoSvg = cachedSvg(`piso-${resto}`, `${resto}`, () => pisoPatioSvg(resto, 2, { fondo }))
      }
      wordSvg = bigWord ? cachedSvg('palabra', bigWord, () => palabraEstadoSvg(bigWord, 3, { fondo })) : ''
      const lineRows: FilaTiempo[] = [...rows]
        .sort((a, b) => (a.firstSeen ?? 0) - (b.firstSeen ?? 0))
        .slice(-12)
        .map(row => {
          const info = parse(row.description, roleNames, row.type)
          const label = info.card !== '' ? `${info.card} ${info.text}`.trim() : info.text
          const out: FilaTiempo = {
            label: label || clean(row.type) || DASH,
            role: info.base,
            status: normalizeStatus(String(row.status ?? '')),
            startMs: row.firstSeen,
          }
          if (row.endedAt !== undefined) out.endMs = row.endedAt

          return out
        })
      // Sin subagentes corriendo el tiempo «ahora» no se ve: se usa el último fin,
      // así el string es idéntico y el marco no se recarga cada 10 s.
      const lastEnd = rows.reduce((max, row) => Math.max(max, row.endedAt ?? 0), 0)
      const lineNow = running > 0 ? nowBucket : lastEnd
      lineSvg =
        rows.length > 0
          ? cachedSvg('linea', `${W}|${lineNow}|${JSON.stringify(lineRows)}`, () =>
              timelineSvg(lineRows, lineNow, W),
            )
          : ''
    }

    // Prioridad con poco espacio: lista > resumen > línea de tiempo > encabezado.
    // Sin Svg el cálculo es el de siempre. Una línea de texto son unos 20 px.
    // Líneas que ocupa una fila de la lista (con wrap puede ser más de una).
    // Cerrada ocupa una línea (dos si el panel es angosto); abierta suma las del texto completo.
    const rowLines = ({ row, depth }: Ordered): number => {
      const info = parse(row.description, roleNames, row.type)
      const full = info.text || clean(row.type) || DASH
      const base = narrow ? 2 : 1
      if (abiertosSub[`fila:${row.id}`] !== true) return base

      return base + Math.max(1, Math.ceil((full.length + 2 + depth * 2) / Math.max(10, textCols - 2)))
    }
    let budget = Math.max(1, termRows - 8 - lineasUso)
    let showSummarySvg = false
    let showLine = false
    let showHeader = false
    if (hasSvg) {
      // Se reservan pestañas, aviso, texto del resumen y la línea de «y N más».
      const reserved = sorted.slice(0, 5).reduce((sum, item) => sum + rowLines(item), 0)
      // Se suma la línea del botón «Resumen visual».
      let spare = termRows - 6 - lineasUso - Math.max(1, reserved) - (narrow ? 1 : 0)
      const summaryCost = linesOf(wordSvg)
      if (summaryCost > 0 && spare >= summaryCost) {
        showSummarySvg = true
        spare -= summaryCost
      }
      const lineCost = resumenAbierto ? linesOf(lineSvg) : 0
      if (lineCost > 0 && spare >= lineCost) {
        showLine = true
        spare -= lineCost
      }
      const headerPx = Math.max(CARA_ALTO, DOSEL_ALTO + PATIO_FILA_ALTO * filasPatio)
      // Se suman la franja de greca y la línea de la burbuja del robot.
      // También la línea de la leyenda de colores del patio.
      const headerCost =
        resumenAbierto && caraSvg !== '' ? Math.ceil(headerPx / 20) + 2 + (equiposPatio.length > 0 ? 1 : 0) : 0
      if (headerCost > 0 && spare >= headerCost) {
        showHeader = true
        spare -= headerCost
      }
      const used =
        (showSummarySvg ? summaryCost : 0) + (showLine ? lineCost : 0) + (showHeader ? headerCost : 0)
      budget = Math.max(1, termRows - 6 - lineasUso - used)
    }
    // Cuántas filas entran en `budget` líneas; como mínimo una, así la lista nunca desaparece.
    let room = 0
    let usedLines = 0
    for (const item of sorted) {
      const need = rowLines(item)
      if (room > 0 && usedLines + need > budget) break
      usedLines += need
      room += 1
    }

    const escenaPatio = (
      <Box flexDirection="row" flexWrap="wrap" backgroundColor={PALETTE.selva}>
        {celdas.map(celda => (
          <Svg
            key={`celda-${celda.id}`}
            source={celda.svg}
            alt={celda.alt}
            {...sizeProps(celda.svg)}
            isInteractive
          />
        ))}
        {pisoSvg !== '' && (
          <Svg key="piso-patio" source={pisoSvg} alt="Patio de agentes vacío" {...sizeProps(pisoSvg)} isInteractive />
        )}
        {equiposPatio.length > 0 && (
          <Box key="leyenda-patio" flexDirection="row" flexWrap="wrap" width="100%" columnGap={1}>
            {equiposPatio.map(equipo => (
              <Text
                key={`leyenda-${equipo}`}
                backgroundColor={(EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base)[1]}
                color={PALETTE.crema}
              >{` ■ ${equipo} `}</Text>
            ))}
          </Box>
        )}
      </Box>
    )

    const summaryText = (
      <Text bold wrap="wrap">
        {summary.join(SEP)}
      </Text>
    )
    const pastillas: Array<{ texto: string; fondo: string; color: string }> = []
    if (running > 0) pastillas.push({ texto: ` ${running} corriendo `, fondo: '#1e4a6b', color: '#bfe3ff' })
    if (done > 0) pastillas.push({ texto: ` ${plural(done, 'lista', 'listas')} `, fondo: '#1f4a2b', color: '#bff0c8' })
    if (failed > 0) {
      pastillas.push({ texto: ` ${failed} ${failed === 1 ? 'falló' : 'fallaron'} `, fondo: '#5a1f17', color: '#ffc9bd' })
    }
    if (stopped > 0) pastillas.push({ texto: ` ${plural(stopped, 'frenada', 'frenadas')} `, fondo: '#3a3a3a', color: '#dddddd' })
    const bigStatus = bigWord === 'corre' ? 'running' : bigWord === 'lista' ? 'completed' : 'failed'

    return (
      <Box flexDirection="column">
        {barraSuperior()}
        {noticeLine}
        {showHeader && resumenAbierto && caraSvg !== '' && cabecera(escenaPatio, burbujaEstado())}
        <Box flexDirection="column">
        {hasSvg && e.surface !== 'terminal' ? (
          <Box flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={1}>
            {showSummarySvg && wordSvg !== '' && (
              <Svg
                key="svg-palabra"
                source={wordSvg}
                alt={`Estado general: ${statusWord(bigStatus)}`}
                {...sizeProps(wordSvg)}
                isInteractive
              />
            )}
            {pastillas.map(item => (
              <Text key={`pastilla-${item.texto}`} backgroundColor={item.fondo} color={item.color}>
                {item.texto}
              </Text>
            ))}
            {tokensVistos > 0 && <Text dimColor>{`${fmtNum(tokensVistos)} tokens`}</Text>}
            <Box flexGrow={1} />
            <Button
              key="abrir-resumen"
              label={resumenAbierto ? '▾ Resumen visual' : '▸ Resumen visual'}
              onPress={() => alternar($, 'resumen', true)}
            />
          </Box>
        ) : (
          summaryText
        )}
        {showLine && resumenAbierto && lineSvg !== '' && (
          <Svg
            key="svg-linea"
            source={lineSvg}
            {...sizeProps(lineSvg)}
            alt={`Línea de tiempo de ${plural(Math.min(rows.length, 12), 'subagente', 'subagentes')}`}
            isInteractive={running > 0}
          />
        )}
        </Box>
        {panelUso}
        {sorted.length === 0 &&
          (hasSvg && e.surface !== 'terminal' ? (
            <Box borderStyle="round" borderColor="#3a453a" paddingX={1} flexDirection="column">
              <Text bold>Todavía no corrió ningún subagente.</Text>
              <Text dimColor wrap="wrap">
                Cuando el orquestador despache una tarjeta, el agente aparece en el patio con un poof.
              </Text>
              <Button key="ir-equipos" label="Ver equipos" onPress={() => showView($, 'roles')} />
            </Box>
          ) : (
            <Text bold>Todavía no corrió ningún subagente.</Text>
          ))}
        {sorted.slice(0, room).map(({ row, depth }, index) => {
          const status = String(row.status ?? '')
          const info = parse(row.description, roleNames, row.type)
          const text = info.text || clean(row.type) || DASH
          const end = isTerminal(status) ? (row.endedAt ?? now) : now
          const elapsed = end - row.firstSeen
          const duration =
            row.durationUnknown || !Number.isFinite(elapsed) ? DASH : mmss(elapsed)
          const indent = '  '.repeat(Math.min(depth, 8))
          const isFailed = status === 'failed'
          const isDone = status === 'completed'
          const filaAbierta = abiertosSub[`fila:${row.id}`] === true
          const filaToggle = (
            <Button
              key={`abrir-fila-${row.id}`}
              label={filaAbierta ? '▾' : '▸'}
              onPress={() => alternar($, `fila:${row.id}`)}
            />
          )
          const nombreRol = info.role.slice(info.role.lastIndexOf('/') + 1)
          const glifoFila = glifoDe(info.base, info.role, catalogo.agentes)
          const iconSvg = hasSvg
            ? cachedSvg(`glifo1-${glifoFila.tipo}-${glifoFila.equipo}`, `${glifoFila.tipo}|${glifoFila.equipo}`, () =>
                glifoSvg(glifoFila.tipo, glifoFila.equipo, 1),
              )
            : ''

          return (
            <Box
              key={row.id}
              flexDirection="column"
              backgroundColor={FONDOS_FILA[index % 2]}
              hover={{ backgroundColor: FONDO_HOVER }}
            >
            <Box flexDirection={narrow ? 'column' : 'row'}>
              <Box flexDirection="row" flexShrink={0}>
                {iconSvg !== '' && (
                  <Svg
                    key={`icono-${row.id}`}
                    source={iconSvg}
                    alt={`Glifo ${TIPO_NOMBRE[glifoFila.tipo] ?? info.base} del equipo ${glifoFila.equipo}`}
                    {...sizeProps(iconSvg)}
                  />
                )}
                <Text color={statusColor(normalizeStatus(status))} bold={isFailed} dimColor={isDone}>
                  {`${indent}${pad(statusWord(status), 8)}`}
                </Text>
                {(info.card !== '' || info.model !== '') && (
                  <Text dimColor={isDone}>
                    {`${info.card !== '' ? pad(info.card, 7) : ''}${info.model !== '' ? pad(info.model, 8) : ''}`}
                  </Text>
                )}
                {info.role !== '' && (
                  <Text color={roleColor(info.base)} dimColor={isDone}>
                    {pad(nombreRol, Math.max(14, nombreRol.length + 1))}
                  </Text>
                )}
              </Box>
              <Box flexDirection="row" flexGrow={1} flexShrink={1} minWidth={0}>
                <Box flexGrow={1} flexShrink={1} minWidth={0}>
                  <Text wrap="truncate" bold={isFailed} dimColor={isDone}>
                    {`${narrow ? '  ' : ''}${text}  ${duration}`}
                  </Text>
                </Box>
                <Box flexShrink={0}>{filaToggle}</Box>
              </Box>
            </Box>
            {filaAbierta && (
              <Text wrap="wrap" bold={isFailed} dimColor={isDone}>
                {`  ${text}`}
              </Text>
            )}
            {filaAbierta && (
              <Text wrap="wrap" dimColor={isDone}>
                {`  Informe: ${informes[row.id] ? informes[row.id].texto || '(sin texto)' : 'todavía no llegó'}`}
              </Text>
            )}
            {filaAbierta && informes[row.id] && (
              <Text wrap="wrap" dimColor>
                {`  Tokens: entrada ${fmtNum(informes[row.id].tokens.input_tokens ?? 0)} · salida ${fmtNum(informes[row.id].tokens.output_tokens ?? 0)} · total ${fmtNum(totalTokens(informes[row.id].tokens))}`}
              </Text>
            )}
            </Box>
          )
        })}
        {sorted.length > room && (
          <Text dimColor>… y {sorted.length - room} más (agrandá la ventana).</Text>
        )}
        {frisoCierre}
      </Box>
    )
  })
}
