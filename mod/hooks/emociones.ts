// Qué emoción muestra el robot de la oficina. Módulo puro, sin imports: recibe un estado simple
// (reacción vigente, agentes corriendo, ocio, hora del día...) y devuelve la emoción y su grupo.
// Así la decisión se prueba sola, sin la app, y register.tsx solo junta los datos.
//
// Prioridad (gana el primero que aplica):
//   1. una reacción vigente (eventos malos, buenos y sociales; register.tsx ya eligió la más fuerte);
//   2. trabajo (agentes corriendo);
//   3. molesto (después de una falla, hasta que pasa otra cosa);
//   4. cambios sin guardar en Editar (sospecha);
//   5. uso de las 5 horas al 80 % o más (sospecha);
//   6. hora del día (mañana, mediodía, casi la hora de irse);
//   7. ocio (café, rotación cada 2 minutos y, a los 10 minutos, dormido).

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
export const ROTACION_OCIO = ['bostezo', 'estira', 'riega', 'diario', 'solitario', 'silba', 'guina']

/** Franjas del reloj (minutos desde la medianoche, hora local): desde, hasta (sin incluir) y emoción. */
export const FRANJAS_HORA: Array<{ desde: number; hasta: number; emocion: string; frase: string }> = [
  { desde: 8 * 60, hasta: 10 * 60, emocion: 'manana', frase: 'Y recién arranca el día.' },
  { desde: 12 * 60, hasta: 14 * 60, emocion: 'hambre', frase: 'Y me está dando hambre de galleta.' },
  { desde: 17 * 60 + 30, hasta: 19 * 60, emocion: 'casa', frase: 'Y en un rato volvemos a puerto.' },
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
}

export type Grupo = 'malo' | 'bueno' | 'social' | 'trabajo' | 'molesto' | 'cambios' | 'uso' | 'hora' | 'ocio'

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
}

function numero(n: unknown): number {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

/** Franja de la hora del día que aplica, o `null`. */
export function franjaHora(minutosDelDia: unknown): { emocion: string; frase: string } | null {
  if (minutosDelDia === undefined || minutosDelDia === null) return null
  const m = Math.floor(numero(minutosDelDia))
  const f = FRANJAS_HORA.find(x => m >= x.desde && m < x.hasta)
  return f ? { emocion: f.emocion, frase: f.frase } : null
}

/** Emoción de ocio a los `ocioMs` de estar sin nada que hacer: café, rotación cada 2 minutos y dormido. */
export function emocionOcio(ocioMs: unknown, semilla: unknown): string {
  const ms = Math.max(0, numero(ocioMs))
  if (ms >= DORMIR_MS) return 'dormido'
  const paso = Math.floor(ms / OCIO_PASO_MS)
  if (paso === 0) return 'aburrido'
  // Paso 3 con 7 emociones: dos pasos seguidos nunca dan la misma.
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
  if (corriendo > 0) {
    if (masLargo > SOSPECHA_MS || e.cambiosSinGuardar === true) return { emocion: 'sospecha', grupo: 'trabajo' }
    if (corriendo >= 4) return { emocion: 'multitarea', grupo: 'trabajo' }
    if (corriendo >= 2) return { emocion: 'tipea', grupo: 'trabajo' }
    if (masLargo > CONCENTRADO_MS) return { emocion: 'concentrado', grupo: 'trabajo' }
    return { emocion: 'pensando', grupo: 'trabajo' }
  }
  if (e.molesto === true) return { emocion: 'molesto', grupo: 'molesto' }
  if (e.cambiosSinGuardar === true) return { emocion: 'sospecha', grupo: 'cambios' }
  if (numero(e.usoCincoHoras) >= USO_PREOCUPA_PCT) return { emocion: 'sospecha', grupo: 'uso' }
  const franja = franjaHora(e.minutosDelDia)
  if (franja) return { emocion: franja.emocion, grupo: 'hora' }
  return { emocion: emocionOcio(e.ocioMs, e.semilla), grupo: 'ocio' }
}

/** Cuándo (ms desde el inicio del ocio) vuelve a cambiar la emoción del ocio; `null` si ya duerme. */
export function proximoCambioOcio(ocioMs: unknown): number | null {
  const ms = Math.max(0, numero(ocioMs))
  if (ms >= DORMIR_MS) return null
  return Math.min(DORMIR_MS, (Math.floor(ms / OCIO_PASO_MS) + 1) * OCIO_PASO_MS)
}
