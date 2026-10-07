// Estado del proyecto: cuánto va y cuánto falta, para que el robot lo diga. Módulo puro, sin imports.
//
// Fuentes, en orden (gana la primera que tenga datos):
//   1. las tareas de la sesión (TaskCreate, TaskUpdate y TodoWrite; register.tsx las anota);
//   2. las tarjetas del proyecto: tarjetas/*.md en la carpeta de la sesión, con su línea `estado:`.
// Sin datos no hay número: el robot nunca inventa un %.
// Las reglas para que Claude lleve esto al día están en kit/metodo/ESTADO-PROYECTO.md.

export type EstadoTarea = 'pending' | 'in_progress' | 'completed'

/** Una tarea de la lista de la sesión. `cerrada` es el instante (ms) en que pasó a completada. */
export type TareaSesion = { id: string; titulo: string; estado: EstadoTarea; cerrada?: number }

export type EstadoTarjeta = 'propuesta' | 'aprobada' | 'en curso' | 'hecha' | 'frenada'

/** Una tarjeta de tarjetas/<ID>.md. */
export type TarjetaProyecto = { id: string; titulo: string; estado: EstadoTarjeta; motivo?: string }

export type Progreso = {
  fuente: 'tareas' | 'tarjetas'
  total: number
  hechas: number
  /** % hecho, entero de 0 a 100. */
  pct: number
  faltan: number
  /** Lo que está en curso (ids o títulos cortos). */
  enCurso: string[]
  /** Tarjetas frenadas (solo con tarjetas). */
  frenadas: string[]
  /** Lo próximo que falta (la primera pendiente). */
  siguiente: string
  /** Estimación de lo que falta (ms), o ausente si no hay ritmo. */
  etaMs?: number
}

const TAREAS_MAX = 200

function texto(v: unknown, max = 120): string {
  return String(v ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function estadoTarea(v: unknown): EstadoTarea | 'deleted' | null {
  const s = String(v ?? '')
  if (s === 'pending' || s === 'in_progress' || s === 'completed' || s === 'deleted') return s
  return null
}

/** TaskCreate respondió: suma la tarea (pendiente). */
export function tareaCreada(lista: TareaSesion[], id: unknown, titulo: unknown): TareaSesion[] {
  const clave = texto(id, 60)
  if (clave === '') return lista
  const sin = lista.filter(t => t.id !== clave)
  return [...sin, { id: clave, titulo: texto(titulo) || clave, estado: 'pending' as EstadoTarea }].slice(-TAREAS_MAX)
}

/** TaskUpdate: cambia el estado (y el título, si viene). `deleted` la saca de la lista. */
export function tareaActualizada(
  lista: TareaSesion[],
  id: unknown,
  cambios: { estado?: unknown; titulo?: unknown },
  ahora: number,
): TareaSesion[] {
  const clave = texto(id, 60)
  if (clave === '') return lista
  const estado = estadoTarea(cambios.estado)
  if (estado === 'deleted') return lista.filter(t => t.id !== clave)
  const existe = lista.some(t => t.id === clave)
  const base: TareaSesion[] = existe ? lista : [...lista, { id: clave, titulo: texto(cambios.titulo) || clave, estado: 'pending' }]
  return base.map(t => {
    if (t.id !== clave) return t
    const nuevo: TareaSesion = { ...t }
    if (texto(cambios.titulo) !== '') nuevo.titulo = texto(cambios.titulo)
    if (estado !== null) {
      if (estado === 'completed' && t.estado !== 'completed') nuevo.cerrada = ahora
      if (estado !== 'completed') delete nuevo.cerrada
      nuevo.estado = estado
    }
    return nuevo
  })
}

/** TodoWrite: la lista entera se reemplaza; las que ya estaban completas conservan su cierre. */
export function listaTodo(previa: TareaSesion[], todos: unknown, ahora: number): TareaSesion[] {
  if (!Array.isArray(todos)) return previa
  const cierres = new Map(previa.filter(t => t.cerrada !== undefined).map(t => [t.titulo, t.cerrada as number]))
  const out: TareaSesion[] = []
  todos.slice(0, TAREAS_MAX).forEach((t, i) => {
    if (!t || typeof t !== 'object') return
    const o = t as Record<string, unknown>
    const estado = estadoTarea(o.status)
    if (estado === null || estado === 'deleted') return
    const titulo = texto(o.content) || `Tarea ${i + 1}`
    const tarea: TareaSesion = { id: `todo-${i + 1}`, titulo, estado }
    if (estado === 'completed') tarea.cerrada = cierres.get(titulo) ?? ahora
    out.push(tarea)
  })
  return out
}

// ---- Tarjetas ----
const SIN_TILDES = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

function normalizarEstado(v: string): EstadoTarjeta | null {
  const s = SIN_TILDES(v.toLowerCase()).replace(/[`*"'_]/g, ' ').replace(/\s+/g, ' ').trim()
  if (/^hech[ao]s?\b|^done\b|^terminad[ao]/.test(s)) return 'hecha'
  if (/^en curso\b|^encurso\b|^en progreso\b|^in progress\b|^en-curso\b/.test(s)) return 'en curso'
  if (/^frenad[ao]\b|^bloquead[ao]\b|^blocked\b/.test(s)) return 'frenada'
  if (/^aprobad[ao]\b|^approved\b/.test(s)) return 'aprobada'
  if (/^propuest[ao]\b|^proposed\b|^borrador\b/.test(s)) return 'propuesta'
  return null
}

/** Lee una tarjeta: la línea `estado:` (y `id:`, `titulo:`, `motivo:`) en las primeras 40 líneas. Sin estado, `null`. */
export function leerTarjeta(contenido: unknown, archivo: unknown): TarjetaProyecto | null {
  const lineas = String(contenido ?? '').split(/\r?\n/).slice(0, 40)
  const campo = (nombre: RegExp): string => {
    for (const l of lineas) {
      const m = nombre.exec(l)
      if (m) return texto(m[1])
    }
    return ''
  }
  const estadoCrudo = campo(/^\s*[-*]?\s*\**estado\**\s*:\s*(.+)$/i)
  const estado = estadoCrudo !== '' ? normalizarEstado(estadoCrudo) : null
  if (estado === null) return null
  const nombre = texto(archivo, 80).replace(/^.*[\\/]/, '').replace(/\.md$/i, '')
  const id = campo(/^\s*\**id\**\s*:\s*(.+)$/i) || nombre
  const titulo = campo(/^\s*\**t[ií]tulo\**\s*:\s*(.+)$/i) || campo(/^#\s+(.+)$/) || id
  const tarjeta: TarjetaProyecto = { id: id.slice(0, 30), titulo, estado }
  const motivo = campo(/^\s*\**motivo\**\s*:\s*(.+)$/i)
  if (motivo !== '') tarjeta.motivo = motivo
  return tarjeta
}

// ---- El número ----
const pctDe = (hechas: number, total: number): number => (total > 0 ? Math.round((hechas / total) * 100) : 0)
const corto = (s: string): string => {
  const id = /^\s*([A-Z]{1,6}-\d+[a-z]?)\b/.exec(s)
  return id ? id[1] : s.length > 24 ? `${s.slice(0, 23)}…` : s
}

/** El ritmo: promedio entre los últimos 5 cierres, por las que faltan. Con menos de 2 cierres, sin estimación. */
export function estimar(cierres: number[], faltan: number): number | undefined {
  const orden = cierres.filter(n => Number.isFinite(n)).sort((a, b) => a - b).slice(-5)
  if (orden.length < 2 || faltan <= 0) return undefined
  const paso = (orden[orden.length - 1] - orden[0]) / (orden.length - 1)
  if (!(paso > 0)) return undefined
  return paso * faltan
}

export function progresoDeTareas(tareas: TareaSesion[]): Progreso | null {
  if (tareas.length === 0) return null
  const hechas = tareas.filter(t => t.estado === 'completed').length
  const total = tareas.length
  const faltan = total - hechas
  const p: Progreso = {
    fuente: 'tareas',
    total,
    hechas,
    pct: pctDe(hechas, total),
    faltan,
    enCurso: tareas.filter(t => t.estado === 'in_progress').map(t => corto(t.titulo)),
    frenadas: [],
    siguiente: corto(tareas.find(t => t.estado === 'pending')?.titulo ?? ''),
  }
  const eta = estimar(tareas.map(t => t.cerrada ?? NaN), faltan)
  if (eta !== undefined) p.etaMs = eta
  return p
}

export function progresoDeTarjetas(tarjetas: TarjetaProyecto[]): Progreso | null {
  if (tarjetas.length === 0) return null
  const hechas = tarjetas.filter(t => t.estado === 'hecha').length
  const total = tarjetas.length
  return {
    fuente: 'tarjetas',
    total,
    hechas,
    pct: pctDe(hechas, total),
    faltan: total - hechas,
    enCurso: tarjetas.filter(t => t.estado === 'en curso').map(t => t.id),
    frenadas: tarjetas.filter(t => t.estado === 'frenada').map(t => t.id),
    siguiente: tarjetas.find(t => t.estado === 'aprobada')?.id ?? '',
  }
}

/** El progreso que vale: tareas de la sesión si hay; si no, tarjetas; si no, `null`. */
export function progresoProyecto(tareas: TareaSesion[], tarjetas: TarjetaProyecto[]): Progreso | null {
  return progresoDeTareas(tareas) ?? progresoDeTarjetas(tarjetas)
}

/** Barra de 10 bloques: ▕██████░░░░▏ */
export function barraProyecto(pct: number, largo = 10): string {
  const lleno = Math.max(0, Math.min(largo, Math.round((Math.max(0, Math.min(100, pct)) / 100) * largo)))
  return `▕${'█'.repeat(lleno)}${'░'.repeat(largo - lleno)}▏`
}

/** «~1 h 10 min», redondeado a 5 minutos (mínimo 5). */
export function duracionAproximada(ms: number): string {
  const min = Math.max(5, Math.round(ms / 60000 / 5) * 5)
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `~${m} min`
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`
}

/** Lo que dice el robot del proyecto. Sin datos, lo dice (sin número). */
export function fraseProyecto(p: Progreso | null, nombre = ''): string {
  if (p === null) return 'No veo tareas ni tarjetas de este proyecto: cuando haya, te digo cuánto falta.'
  const que = p.fuente === 'tareas' ? ['tarea', 'tareas'] : ['tarjeta', 'tarjetas']
  const cosa = (n: number) => `${n} ${n === 1 ? que[0] : que[1]}`
  const titulo = nombre !== '' ? `Proyecto ${nombre}` : 'Proyecto'
  if (p.faltan === 0) return `¡${titulo} al 100 %! ${p.hechas} de ${cosa(p.total)}. Lentes puestos.`
  const partes = [`${titulo} ${barraProyecto(p.pct)} ${p.pct} %: faltan ${p.faltan} de ${cosa(p.total)} (${100 - p.pct} %).`]
  if (p.frenadas.length > 0) partes.push(`${p.frenadas.slice(0, 2).join(', ')} ${p.frenadas.length === 1 ? 'está frenada' : 'están frenadas'} y ${p.frenadas.length === 1 ? 'espera' : 'esperan'} por vos.`)
  else if (p.etaMs !== undefined) partes.push(`A este ritmo, ${duracionAproximada(p.etaMs)}.`)
  else if (p.enCurso.length === 0 && p.siguiente !== '') partes.push(`Sigue ${p.siguiente}.`)
  return partes.join(' ')
}

/** Texto corto para la barra de estado del monitor: «[58%]», o «[--%]» sin datos. */
export function etiquetaProyecto(p: Progreso | null): string {
  return p === null ? '[--%]' : `[${p.pct}%]`
}

/** Nombre corto del proyecto: la última carpeta de la ruta de la sesión. */
export function nombreProyecto(carpeta: unknown): string {
  const partes = String(carpeta ?? '').split(/[\\/]+/).filter(x => x !== '')
  return texto(partes[partes.length - 1] ?? '', 30)
}
