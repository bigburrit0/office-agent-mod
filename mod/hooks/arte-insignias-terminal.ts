// Íconos chicos de la skin «Terminal retro»: el tipo de cada agente (marco del color de su equipo), la placa de
// cada equipo (su ícono en una ventanita de terminal), el contador de agentes y la fecha de la barra de arriba.
// Mismos nombres que arte-iconos.ts (glifoSvg, diosSvg, DIOSES_EQUIPO) para que register.tsx casi no cambie.

import { F, abrir, anchoTexto, caminos, grilla, rect, sello, texto } from './arte-fosforo'
import { ICONO_NOMBRE, iconoDe, paletaEquipo } from './arte-monitor'
import { EQUIPO_ACENTO } from './arte-iconos'

// Lo que muestra cada equipo (el nombre del ícono) y su lema.
export const DIOSES_EQUIPO: Record<string, { dios: string; lema: string }> = {
  base: { dios: 'Caja de herramientas', lema: 'hace el trabajo' },
  direccion: { dios: 'Brújula', lema: 'decide el rumbo' },
  research: { dios: 'Lupa', lema: 'explora' },
  librarian: { dios: 'Libro', lema: 'guarda lo que se sabe' },
  datos: { dios: 'Barras', lema: 'mide' },
  seguridad: { dios: 'Escudo con candado', lema: 'cuida el edificio' },
  mantenimiento: { dios: 'Engranaje', lema: 'arregla' },
  limpieza: { dios: 'Escoba', lema: 'deja todo impecable' },
  facilities: { dios: 'Llave', lema: 'hace que todo funcione' },
  arquitectura: { dios: 'Compás', lema: 'diseña los espacios' },
  'dev-a1': { dios: 'Ventana de código', lema: 'construye' },
  'dev-tablero': { dios: 'Ventana de código', lema: 'construye' },
}
void ICONO_NOMBRE

// Tipo de agente (12 × 12, fósforo): o = brillo, d = tenue.
const GLIFOS: Record<string, string[]> = {
  escriba: ['dddddddd....', 'd......d....', 'd.oooo.d....', 'd......d....', 'd.ooo..d....', 'd......d....', 'd.oo...d.oo.', 'd......d.oo.', 'dddddddd.oo.', '.........oo.', '..........o.', '............'],
  vidente: ['..oooo......', '.o....o.....', 'o..dd..o....', 'o.d....o....', 'o......o....', '.o....o.....', '..oooodd....', '......ddd...', '.......ddd..', '........ddd.', '.........dd.', '............'],
  guardian: ['oooooooooo..', 'o........o..', 'o..dddd..o..', 'o..d..d..o..', 'o.dddddd.o..', 'o.dd..dd.o..', '.o.dddd.o...', '.o......o...', '..o....o....', '...o..o.....', '....oo......', '............'],
  curandero: ['.oo.....oo..', 'o..o...o..o.', 'o...ooo...o.', '.o.......o..', '..o..d..o...', '...o.d.o....', '...o.d.o....', '...o.d.o....', '...o...o....', '...ooooo....', '............', '............'],
  pm: ['oooooooooo..', 'o........o..', 'o.o.dddd.o..', 'o........o..', 'o.o.dddd.o..', 'o........o..', 'o.d.dddd.o..', 'o........o..', 'o.d.dddd.o..', 'oooooooooo..', '............', '............'],
  estratega: ['....oo......', '....oo......', '...o..o.....', '..o.dd.o....', 'oo.dddd.oo..', 'oo.dddd.oo..', '..o.dd.o....', '...o..o.....', '....oo......', '....oo......', '............', '............'],
}

/** Ícono del tipo de agente con el marco del color del equipo: 16 × 16 unidades. */
export function glifoSvg(tipo: string, equipo: string, escala: number): string {
  const s = Math.max(1, Math.min(6, Math.round(Number(escala) || 2)))
  const color = (EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base)[0]
  const g = grilla(16, 16)
  const pal = paletaEquipo(color)
  rect(g, 0, 0, 16, 16, pal.X)
  rect(g, 1, 1, 14, 14, F.negro)
  rect(g, 1, 1, 14, 1, pal.x)
  sello(g, GLIFOS[tipo] ?? GLIFOS.escriba, { o: F.g5, d: F.g3 }, 3, 3)
  return abrir(16 * s, 16 * s, caminos(g, s), `Ícono ${tipo}`)
}

/** Placa del equipo: su ícono en una ventanita de terminal, 24 × 24 unidades. */
export function diosSvg(equipo: string, escala: number, acento: [string, string]): string {
  const s = Math.max(1, Math.min(6, Math.round(Number(escala) || 2)))
  const color = Array.isArray(acento) ? acento[0] : '#8a93a0'
  const pal = paletaEquipo(color)
  const g = grilla(24, 24)
  rect(g, 0, 0, 24, 24, pal.X)
  rect(g, 1, 1, 22, 3, pal.x)
  rect(g, 2, 2, 1, 1, F.g6)
  rect(g, 4, 2, 1, 1, pal.L)
  rect(g, 1, 4, 22, 19, F.negro)
  const icono = iconoDe(equipo)
  sello(g, icono, pal, Math.floor((24 - icono[0].length) / 2), 5 + Math.floor((12 - icono.length) / 2))
  rect(g, 4, 19, 3, 1, F.g5)
  return abrir(24 * s, 24 * s, caminos(g, s), `Placa del equipo ${equipo}`)
}

/** Contador de agentes en dígitos de terminal. */
export function contadorSvg(n: number, escala: number, color = F.g5): string {
  const s = Math.max(1, Math.min(6, Math.round(Number(escala) || 2)))
  const t = String(Math.max(0, Math.floor(Number(n) || 0))).slice(0, 4)
  const w = anchoTexto(t) + 2
  const g = grilla(w, 7)
  rect(g, 0, 0, w, 7, F.negro)
  texto(g, 1, 1, t, /^#[0-9a-fA-F]{6}$/.test(color) ? color : F.g5)
  return abrir(w * s, 7 * s, caminos(g, s), `${t} en el contador`)
}

/** La fecha de la barra de arriba: «07/10» en verde, como un reloj de terminal. */
export function fechaSvg(dia: number, mes: number, escala = 2): string {
  const s = Math.max(1, Math.min(6, Math.round(Number(escala) || 2)))
  const t = `${String(Math.max(1, Math.min(31, Math.floor(dia) || 1))).padStart(2, '0')}/${String(Math.max(1, Math.min(12, Math.floor(mes) || 1))).padStart(2, '0')}`
  const w = anchoTexto(t) + 4
  const g = grilla(w, 9)
  rect(g, 0, 0, w, 9, F.g1)
  rect(g, 1, 1, w - 2, 7, F.negro)
  texto(g, 2, 2, t, F.g5)
  return abrir(w * s, 9 * s, caminos(g, s), `Fecha ${t}`)
}
