// Qué emoción muestra el robot de la terminal. Módulo puro, sin imports: recibe un estado simple
// (reacción vigente, agentes corriendo, ocio, hora y día...) y devuelve la emoción y su grupo.
// Así la decisión se prueba sola, sin la app, y register.tsx solo junta los datos.
//
// Prioridad (gana el primero que aplica):
//   1. una reacción vigente (eventos malos, buenos, sociales y memes; register.tsx ya eligió la más fuerte);
//   2. trabajo (agentes corriendo); fuera de hora es el «modo zombi»;
//   3. molesto (después de una falla, hasta que pasa otra cosa);
//   4. cambios sin guardar en Editar (Dos botones) y avisos del esquema (¿Esto es una paloma?);
//   5. uso de las 5 horas al 80 % o más (Hide the Pain Harold);
//   6. fuera de hora: antes de las 8, desde las 18 y sábados y domingos, apagado con cara de muerto;
//   7. huevos de pascua por hora (16:04, «404»; el día 1 a las 10, Rickroll);
//   8. hora del día (arranque, café, chivito, siesta, mate, «me voy»);
//   9. ocio (café, rotación cada 2 minutos y, a los 10 minutos, dormido).

/** Un agente que corre hace más que esto: sospecha. */
export const SOSPECHA_MS = 600000
/** Un solo agente que corre hace más que esto: concentrado (con auriculares). */
export const CONCENTRADO_MS = 180000
/** Cada cuánto cambia la emoción del ocio. */
export const OCIO_PASO_MS = 120000
/** Sin nada que hacer durante esto, se duerme. */
export const DORMIR_MS = 600000

/** Desde este % usado de las 5 horas el robot se preocupa. */
export const USO_PREOCUPA_PCT = 80

/** Emociones que se turnan en el ocio, después del café y antes de dormirse. */
export const ROTACION_OCIO = ['bostezo', 'estira', 'riega', 'diario', 'solitario', 'silba', 'guina', 'rollSafe']

/** Desde cuántos agentes a la vez: cerebro galáctico y Doge. */
export const MULTITAREA_DESDE = 4
export const DOGE_DESDE = 6

/** Horario de trabajo (minutos desde la medianoche): fuera de esto, apagado. Sábado y domingo, apagado todo el día. */
export const ENCIENDE = 8 * 60
export const APAGA = 18 * 60

/** Franjas del reloj (minutos desde la medianoche, hora local): desde, hasta (sin incluir) y emoción. */
export const FRANJAS_HORA: Array<{ desde: number; hasta: number; emocion: string; frase: string }> = [
  { desde: 8 * 60, hasta: 8 * 60 + 15, emocion: 'arranque', frase: 'Y recién arranco.' },
  { desde: 8 * 60 + 15, hasta: 10 * 60, emocion: 'manana', frase: 'Y recién arranca el día.' },
  { desde: 12 * 60 + 30, hasta: 13 * 60 + 30, emocion: 'hambre', frase: 'Y me está dando hambre.' },
  { desde: 14 * 60, hasta: 15 * 60, emocion: 'siesta', frase: 'Y me pesan los párpados.' },
  { desde: 16 * 60 + 30, hasta: 17 * 60 + 15, emocion: 'mate', frase: 'Y el mate se enfría.' },
  { desde: 17 * 60 + 30, hasta: 18 * 60, emocion: 'casa', frase: 'Y en un rato me voy.' },
]

/** Reacción guardada → emoción que muestra. `guardado` y `salta` son nombres viejos que siguen valiendo. */
export const EMOCION_DE_REACCION: Record<string, { emocion: string; grupo: Grupo }> = {
  ruge: { emocion: 'ruge', grupo: 'malo' },
  panico: { emocion: 'panico', grupo: 'malo' },
  frustrado: { emocion: 'frustrado', grupo: 'malo' },
  bufido: { emocion: 'bufido', grupo: 'malo' },
  chispazo: { emocion: 'chispazo', grupo: 'malo' },
  festeja: { emocion: 'festeja', grupo: 'bueno' },
  contento: { emocion: 'contento', grupo: 'bueno' },
  aplaude: { emocion: 'aplaude', grupo: 'bueno' },
  orgullo: { emocion: 'orgullo', grupo: 'bueno' },
  guardado: { emocion: 'orgullo', grupo: 'bueno' },
  alivio: { emocion: 'alivio', grupo: 'bueno' },
  saluda: { emocion: 'saluda', grupo: 'social' },
  sorpresa: { emocion: 'sorpresa', grupo: 'social' },
  caceria: { emocion: 'caceria', grupo: 'social' },
  salta: { emocion: 'caceria', grupo: 'social' },
  // Memes (memes.ts los elige; register.tsx los guarda como cualquier reacción).
  pikachu: { emocion: 'sorpresa', grupo: 'malo' },
  estoEstaBien: { emocion: 'estoEstaBien', grupo: 'malo' },
  otraVez: { emocion: 'otraVez', grupo: 'social' },
  distraido: { emocion: 'distraido', grupo: 'social' },
  successKid: { emocion: 'successKid', grupo: 'bueno' },
  stonks: { emocion: 'stonks', grupo: 'bueno' },
  notStonks: { emocion: 'notStonks', grupo: 'malo' },
  drake: { emocion: 'drake', grupo: 'bueno' },
  masDe9000: { emocion: 'masDe9000', grupo: 'social' },
}

export type Grupo = 'malo' | 'bueno' | 'social' | 'trabajo' | 'molesto' | 'cambios' | 'esquema' | 'uso' | 'apagado' | 'huevo' | 'hora' | 'ocio'

export type EstadoRobot = {
  /** Tipo de la reacción vigente (ya vencidas no cuentan); vacío si no hay. */
  reaccion?: string
  /** Cuántos agentes corren. */
  corriendo?: number
  /** Hace cuánto corre el agente más viejo (ms); 0 si no corre ninguno. */
  masLargoMs?: number
  /** `true` si sigue ofendido por una falla. */
  molesto?: boolean
  /** `true` si hay cambios sin guardar en Editar. */
  cambiosSinGuardar?: boolean
  /** % usado de la ventana de 5 horas; desde 80 el robot se preocupa. */
  usoCincoHoras?: number
  /** Hace cuánto no hay nada que hacer (ms). */
  ocioMs?: number
  /** Minutos desde la medianoche, hora local; ausente si no se sabe (sin emociones de la hora). */
  minutosDelDia?: number
  /** Entero estable del período de ocio, para que la rotación no sea siempre igual. */
  semilla?: number
  /** Día de la semana, hora local (0 domingo … 6 sábado); ausente si no se sabe. */
  diaSemana?: number
  /** Día del mes (1 a 31), hora local; para el Rickroll del día 1. */
  diaMes?: number
  /** `true` si el agente que se edita tiene avisos del esquema. */
  avisosEsquema?: boolean
}

function numero(n: unknown): number {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

/** Franja de la hora del día que aplica, o `null`. */
export function franjaHora(minutosDelDia: unknown, diaSemana?: unknown): { emocion: string; frase: string } | null {
  if (minutosDelDia === undefined || minutosDelDia === null) return null
  const m = Math.floor(numero(minutosDelDia))
  const f = FRANJAS_HORA.find(x => m >= x.desde && m < x.hasta)
  if (!f) return null
  // Lunes a la mañana: «Ah, otra vez».
  if (f.emocion === 'manana' && numero(diaSemana) === 1 && diaSemana !== undefined) return { emocion: 'otraVez', frase: 'Y es lunes.' }
  return { emocion: f.emocion, frase: f.frase }
}

/** `true` fuera del horario: antes de las 8, desde las 18, y sábados y domingos. Sin hora conocida, `false`. */
export function fueraDeHora(minutosDelDia: unknown, diaSemana?: unknown): boolean {
  if (minutosDelDia === undefined || minutosDelDia === null) return false
  if (diaSemana !== undefined && diaSemana !== null) {
    const d = Math.floor(numero(diaSemana))
    if (d === 0 || d === 6) return true
  }
  const m = Math.floor(numero(minutosDelDia))
  return m < ENCIENDE || m >= APAGA
}

/** Huevos de pascua por hora: 16:04 «404» y el día 1 de cada mes de 10:00 a 10:05, Rickroll. */
export function huevoDeHora(minutosDelDia: unknown, diaMes?: unknown): string | null {
  if (minutosDelDia === undefined || minutosDelDia === null) return null
  const m = Math.floor(numero(minutosDelDia))
  if (m === 16 * 60 + 4) return 'noEncontrado'
  if (numero(diaMes) === 1 && m >= 10 * 60 && m < 10 * 60 + 5) return 'rickroll'
  return null
}

/** Emoción de ocio a los `ocioMs` de estar sin nada que hacer: café, rotación cada 2 minutos y dormido. */
export function emocionOcio(ocioMs: unknown, semilla: unknown): string {
  const ms = Math.max(0, numero(ocioMs))
  if (ms >= DORMIR_MS) return 'dormido'
  const paso = Math.floor(ms / OCIO_PASO_MS)
  if (paso === 0) return 'aburrido'
  // Paso 3 con 8 emociones: dos pasos seguidos nunca dan la misma.
  const base = Math.abs(Math.floor(numero(semilla)))
  return ROTACION_OCIO[(base + paso * 3) % ROTACION_OCIO.length]
}

/** Decide la emoción del robot. Nunca lanza: un estado vacío es el café del ocio. */
export function decidirEmocion(estado: EstadoRobot): { emocion: string; grupo: Grupo } {
  const e = estado ?? {}
  const reaccion = String(e.reaccion ?? '')
  if (reaccion !== '' && Object.prototype.hasOwnProperty.call(EMOCION_DE_REACCION, reaccion)) {
    return { ...EMOCION_DE_REACCION[reaccion] }
  }
  const corriendo = Math.max(0, Math.floor(numero(e.corriendo)))
  const masLargo = numero(e.masLargoMs)
  const fuera = fueraDeHora(e.minutosDelDia, e.diaSemana)
  if (corriendo > 0) {
    if (fuera) return { emocion: 'zombi', grupo: 'trabajo' }
    if (masLargo > SOSPECHA_MS || e.cambiosSinGuardar === true) return { emocion: 'sospecha', grupo: 'trabajo' }
    if (corriendo >= DOGE_DESDE) return { emocion: 'doge', grupo: 'trabajo' }
    if (corriendo >= MULTITAREA_DESDE) return { emocion: 'multitarea', grupo: 'trabajo' }
    if (corriendo >= 2) return { emocion: 'tipea', grupo: 'trabajo' }
    if (masLargo > CONCENTRADO_MS) return { emocion: 'concentrado', grupo: 'trabajo' }
    return { emocion: 'pensando', grupo: 'trabajo' }
  }
  if (e.molesto === true) return { emocion: 'molesto', grupo: 'molesto' }
  if (e.cambiosSinGuardar === true) return { emocion: 'dosBotones', grupo: 'cambios' }
  if (e.avisosEsquema === true) return { emocion: 'paloma', grupo: 'esquema' }
  if (numero(e.usoCincoHoras) >= USO_PREOCUPA_PCT) return { emocion: 'harold', grupo: 'uso' }
  if (fuera) return { emocion: 'apagado', grupo: 'apagado' }
  const huevo = huevoDeHora(e.minutosDelDia, e.diaMes)
  if (huevo) return { emocion: huevo, grupo: 'huevo' }
  const franja = franjaHora(e.minutosDelDia, e.diaSemana)
  if (franja) return { emocion: franja.emocion, grupo: 'hora' }
  return { emocion: emocionOcio(e.ocioMs, e.semilla), grupo: 'ocio' }
}

/** Accesorio del robot por fecha y hora (huevos de pascua); vacío si no hay. `pct` es el % del proyecto o `null`. */
export function accesorioDelDia(o: { mes?: number; diaMes?: number; diaDelAnio?: number; diaSemana?: number; minutosDelDia?: number; pct?: number | null }): string {
  if (o.pct === 100) return 'arcoiris'
  const mes = numero(o.mes)
  const dia = numero(o.diaMes)
  if (mes === 10 && dia === 31) return 'calabaza'
  if (mes === 12) return 'gorro'
  if (mes === 8 && dia === 25) return 'sol'
  if (numero(o.diaDelAnio) === 256) return 'dia256'
  if (numero(o.diaSemana) === 5 && o.diaSemana !== undefined && numero(o.minutosDelDia) >= 16 * 60) return 'disco'
  return ''
}

/** Cuándo (ms desde el inicio del ocio) vuelve a cambiar la emoción del ocio; `null` si ya duerme. */
export function proximoCambioOcio(ocioMs: unknown): number | null {
  const ms = Math.max(0, numero(ocioMs))
  if (ms >= DORMIR_MS) return null
  return Math.min(DORMIR_MS, (Math.floor(ms / OCIO_PASO_MS) + 1) * OCIO_PASO_MS)
}
