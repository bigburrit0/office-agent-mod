// Reacciones de memes: afinan la reacción que ya detectó tablero-nucleo.ts (detectReaction) con lo que se sabe
// de los agentes. Módulo puro, sin imports. El robot actúa el gesto (arte-robot-terminal.ts); nada se copia.
//
//   ruge (falla uno)            → pikachu       si llevaba menos de 30 s («¿Ya? Si recién arrancaba»)
//   panico (fallan varios)      → estoEstaBien  si otros siguen corriendo (This is fine)
//   caceria (llega uno)         → otraVez       si su tarjeta ya había fallado (Ah, otra vez)
//                               → distraido     si otro lleva más de 10 min (Novio distraído)
//   contento (termina uno)      → successKid    si tiene tarjeta y esa tarjeta nunca falló (Success Kid)

export type FilaMeme = { id: string; description: string; status: string; firstSeen: number; endedAt?: number }
export type Reaccion = { tipo: string; hasta: number; quien?: string }

export const PIKACHU_MS = 30000
export const DISTRAIDO_MS = 600000

/** El ID de tarjeta al principio de la descripción («T-9 · sonnet · …» → «T-9»); vacío si no hay. */
export function tarjetaDe(descripcion: unknown): string {
  const m = /^\s*([A-Za-z]{1,6}-\d+[a-z]?)\b/.exec(String(descripcion ?? ''))
  return m ? m[1].toUpperCase() : ''
}

export function afinarReaccion(r: Reaccion | null, prev: FilaMeme[], rows: FilaMeme[], now: number): Reaccion | null {
  if (r === null) return null
  const previos = new Map(prev.map(f => [f.id, f]))
  const cambio = (status: string) => rows.filter(f => f.status === status && previos.get(f.id)?.status !== status && previos.has(f.id))
  if (r.tipo === 'ruge') {
    const f = cambio('failed')[0]
    if (f && (f.endedAt ?? now) - f.firstSeen < PIKACHU_MS) return { ...r, tipo: 'pikachu' }
  }
  if (r.tipo === 'panico' && rows.some(f => f.status === 'running')) return { ...r, tipo: 'estoEstaBien' }
  if (r.tipo === 'caceria') {
    const nuevo = rows.find(f => f.status === 'running' && !previos.has(f.id))
    const tarjeta = nuevo ? tarjetaDe(nuevo.description) : ''
    if (tarjeta !== '' && prev.some(f => f.status === 'failed' && tarjetaDe(f.description) === tarjeta)) return { ...r, tipo: 'otraVez', quien: tarjeta }
    if (rows.some(f => f.status === 'running' && previos.has(f.id) && now - f.firstSeen > DISTRAIDO_MS)) return { ...r, tipo: 'distraido' }
  }
  if (r.tipo === 'contento') {
    const f = cambio('completed')[0]
    const tarjeta = f ? tarjetaDe(f.description) : ''
    if (tarjeta !== '' && !rows.some(x => x.status === 'failed' && tarjetaDe(x.description) === tarjeta)) return { ...r, tipo: 'successKid', quien: tarjeta }
  }
  return r
}
