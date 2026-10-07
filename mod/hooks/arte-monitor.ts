// La escena de la skin «Terminal retro»: un monitor beige de los 90 con la pantalla de fósforo verde.
// Adentro: el prompt con el cursor (que parpadea «HOLA» en Morse), la hora, el robot, los subagentes como
// íconos del color de su equipo (o las carpetas de Equipos, o el archivo abierto en Editar) y la barra de estado.
// Afuera: el plástico, el post-it, el patito de goma, la marca, las perillas y la luz de encendido.
// Mismo papel que arte-escena.ts (escenaOficinaSvg, escenaAlto, ESCENA_FONDO). Viene de mod/preview/escena-terminal.mjs.

import { A, F, abrir, anchoTexto, barrido, cadaTanto, caminos, colorValido, cuadros, grilla, mezcla, pon, rect, sello, texto } from './arte-fosforo'
import type { Cuadro, Grilla } from './arte-fosforo'

export const S = 3 // cada unidad son 3 × 3 píxeles
export const ESCENA_FONDO = '#020803' // lo que rodea al monitor: el panel
export const CELDA_W = 22 // unidades
export const CELDA_H = 24
export const CARPETA_H = 17
const ROBOT_W = 44
const ROBOT_H = 36
const PESO_MAX = 120000

// ---- Íconos de los equipos (12 × 12). X = color del equipo, x = oscuro, L = claro, k = negro de pantalla ----
export const ICONO_NOMBRE: Record<string, string> = {
  base: 'caja de herramientas', direccion: 'brújula', research: 'lupa', librarian: 'libro', datos: 'barras',
  'dev-a1': 'ventana de código', 'dev-tablero': 'ventana de código', seguridad: 'escudo con candado',
  mantenimiento: 'engranaje', limpieza: 'escoba', facilities: 'llave', arquitectura: 'compás',
}
const ICONOS: Record<string, string[]> = {
  base: ['............', '....xxxx....', '...x....x...', '.XXXXXXXXXX.', 'XLLLLLLLLLLX', 'XLLLLLLLLLLX', 'XXXXXkkXXXXX', 'XxxxxkkxxxxX', 'XxxxxxxxxxxX', 'XxxxxxxxxxxX', 'XXXXXXXXXXXX'],
  direccion: ['.....XX.....', '.....LL.....', '....XLLX....', '....XLLX....', '.x..XLLX..x.', 'XXXXXLLXXXXX', 'XXXXXxxXXXXX', '.x..XxxX..x.', '....XxxX....', '....XxxX....', '.....xx.....', '.....XX.....'],
  research: ['..XXXX......', '.XLLLLX.....', 'XLkLLLLX....', 'XLLLLLLX....', 'XLLLLLLX....', '.XLLLLX.....', '..XXXXxx....', '......xxx...', '.......xxx..', '........xxx.', '.........xx.'],
  librarian: ['............', '.XXXX..XXXX.', 'XLLLLXXLLLLX', 'XLxxLXXLxxLX', 'XLLLLXXLLLLX', 'XLxxLXXLxxLX', 'XLLLLXXLLLLX', 'XLxLLXXLLxLX', 'XLLLLXXLLLLX', 'XXXXXXXXXXXX', '.....xx.....'],
  datos: ['..........LL', '..........XX', '......LL..XX', '......XX..XX', '..LL..XX..XX', '..XX..XX..XX', '..XX..XX..XX', '..XX..XX..XX', 'xxxxxxxxxxxx'],
  'dev-a1': ['XXXXXXXXXXXX', 'XLxLxxxxxxxX', 'XkkkkkkkkkkX', 'XkkLkkkkLkkX', 'XkLkkkkLkLkX', 'XLkkkkLkkkLX', 'XkLkkkLkkLkX', 'XkkLkkkkLkkX', 'XkkkkkkkkkkX', 'XXXXXXXXXXXX'],
  seguridad: ['XXXXXXXXXXXX', 'XLLLLLLLLLLX', 'XLLLLxxLLLLX', 'XLLLxLLxLLLX', 'XLLxxxxxxLLX', 'XLLxxkkxxLLX', '.XLxxkkxxLX.', '.XLxxxxxxLX.', '..XLLLLLLX..', '...XLLLLX...', '....XXXX....'],
  mantenimiento: ['.....XX.....', '..X.XXXX.X..', '...XXLLXX...', '..XXL..LXX..', '.XXL....LXX.', 'XXXL....LXXX', '.XXL....LXX.', '..XXL..LXX..', '...XXLLXX...', '..X.XXXX.X..', '.....XX.....'],
  limpieza: ['.........XX.', '........XX..', '.......XX...', '......XX....', '.....XX.....', '...xxxx.....', '..LLLLLL....', '.LLLLLLL....', 'LLLLLLL.....', 'L.L.L.L.....'],
  facilities: ['............', '.XXX........', 'XLLLX.......', 'XL.LXXXXXXXX', 'XLLLX..X.X.X', '.XXX...x.x..', '............'],
  arquitectura: ['.....XX.....', '.....LL.....', '....X..X....', '....X..X....', '...X....X...', '...X....X...', '..X......X..', '..X......X..', '.X........L.', '.X.........L', 'XX..........'],
}
ICONOS['dev-tablero'] = ICONOS['dev-a1']

export const iconoDe = (equipo: string): string[] => ICONOS[equipo] ?? ICONOS.base

export function paletaEquipo(color: string): Record<string, string> {
  const c = colorValido(color, '#8a93a0')
  return { X: c, x: mezcla(c, '#000000', 0.45), L: mezcla(c, '#ffffff', 0.4), k: F.visor, 5: F.g5, 6: F.g6 }
}

// Un detalle propio de cada equipo mientras trabaja (cuadro 0 o 1).
function detalle(g: Grilla, equipo: string, pal: Record<string, string>, f: number, ox: number, oy: number): void {
  if (equipo === 'datos') {
    rect(g, ox + 2, oy + 2 - f * 2, 2, 2 + f * 2, pal.X)
    rect(g, ox + 10, oy - f, 2, 1 + f, pal.L)
  } else if (equipo.startsWith('dev')) {
    if (f === 1) rect(g, ox + 9, oy + 8, 2, 1, F.g6)
  } else if (equipo === 'research') pon(g, ox + 2 + f * 2, oy + 2, F.g6)
  else if (equipo === 'seguridad') {
    if (f === 1) rect(g, ox + 5, oy + 5, 2, 1, A.rojo)
  } else if (equipo === 'mantenimiento') {
    if (f === 1) {
      pon(g, ox + 1, oy + 5, pal.L)
      pon(g, ox + 10, oy + 5, pal.L)
    }
  } else if (equipo === 'limpieza') {
    pon(g, ox + 8 + f, oy + 10, F.g4)
    pon(g, ox + 10 - f, oy + 9, F.g3)
  } else if (equipo === 'librarian') {
    if (f === 1) rect(g, ox + 6, oy + 1, 1, 9, pal.L)
  } else if (equipo === 'facilities') {
    if (f === 1) {
      pon(g, ox + 11, oy + 5, pal.X)
      pon(g, ox + 9, oy + 5, pal.X)
    }
  } else if (equipo === 'direccion') pon(g, ox + 5 + f, oy + 1, F.g6)
  else if (equipo === 'arquitectura') pon(g, ox + 10 + f, oy + 8 + f, F.g6)
  else pon(g, ox + 5 + f, oy + 7, F.g6)
}

function celdaBase(equipo: string, color: string, etiqueta: string): { g: Grilla; ox: number; oy: number; pal: Record<string, string> } {
  const g = grilla(CELDA_W, CELDA_H)
  const icono = iconoDe(equipo)
  const pal = paletaEquipo(color)
  const ox = Math.floor((CELDA_W - icono[0].length) / 2)
  const oy = 1 + Math.floor((12 - icono.length) / 2)
  sello(g, icono, pal, ox, oy)
  const et = String(etiqueta ?? '').toUpperCase().slice(0, 5)
  texto(g, Math.floor((CELDA_W - anchoTexto(et)) / 2), 14, et, F.g5)
  return { g, ox, oy, pal }
}

const estado = (g: Grilla, s: string, c: string) => texto(g, Math.floor((CELDA_W - anchoTexto(s)) / 2), 19, s, c)

/** Los cuadros de una celda: entra (se dibuja línea por línea), juega (detalle y giro), sale ([OK] y se apaga como un tubo), explota (se rompe en rojo y queda SEGV). */
export function celdaCuadros(equipo: string, color: string, fase: string, etiqueta: string): Cuadro[] {
  const { g: base, ox, oy, pal } = celdaBase(equipo, color, etiqueta)
  const copia = () => base.map(f => [...f])
  if (fase === 'sale') {
    const ok = copia()
    estado(ok, '[OK]', F.g6)
    const linea1 = grilla(CELDA_W, CELDA_H)
    rect(linea1, 2, 6, 18, 1, F.g6)
    rect(linea1, 4, 5, 14, 1, F.g4)
    rect(linea1, 4, 7, 14, 1, F.g4)
    const linea2 = grilla(CELDA_W, CELDA_H)
    rect(linea2, 7, 6, 8, 1, F.g6)
    const punto = grilla(CELDA_W, CELDA_H)
    rect(punto, 10, 6, 2, 1, F.g6)
    return [[ok, 0.6], [linea1, 0.12], [linea2, 0.12], [punto, 0.25], [grilla(CELDA_W, CELDA_H), 0.3]]
  }
  if (fase === 'explota') {
    const lista: Cuadro[] = []
    for (let k = 0; k < 4; k++) {
      const g = grilla(CELDA_W, CELDA_H)
      for (let y = 0; y < 13; y++) {
        const corre = ((y * 7 + k * 5) % 5) - 2
        for (let x = 0; x < CELDA_W; x++) {
          const c = base[y][x]
          if (c) pon(g, x + corre * (k + 1), y, (y + k) % 3 === 0 ? A.rojo : c)
        }
      }
      texto(g, 4, 14, 'ERR!', A.rojo)
      lista.push([g, 0.12])
    }
    const calavera = grilla(CELDA_W, CELDA_H)
    sello(calavera, ['..rrrrrr..', '.rrrrrrrr.', 'rr..rr..rr', 'rr..rr..rr', 'rrrrrrrrrr', '.rrr..rrr.', '..rrrrrr..', '..r.r.r...'], { r: A.rojo }, 6, 2)
    texto(calavera, 3, 14, 'SEGV', A.rojo)
    lista.push([calavera, 1.4])
    return lista
  }
  if (fase === 'entra') {
    const lista: Cuadro[] = [3, 6, 9, 12].map(h => {
      const g = grilla(CELDA_W, CELDA_H)
      for (let y = 0; y < h; y++) g[y] = [...base[y]]
      rect(g, 1, h, CELDA_W - 2, 1, F.g6)
      return [g, 0.1] as Cuadro
    })
    return [...lista, ...celdaCuadros(equipo, color, 'juega', etiqueta)]
  }
  // juega
  const giro = ['|', '/', '-', '\\']
  return giro.map((ch, i) => {
    const g = copia()
    detalle(g, equipo, pal, i % 2, ox, oy)
    estado(g, `[${ch}]`, F.g4)
    return [g, 0.15] as Cuadro
  })
}

/** Celda de un subagente: 66 × 72 px (22 × 24 unidades a escala 3). Transparente: va sobre la pantalla. */
export function celdaTerminalSvg(o: { equipo: string; color?: string; fase: string; etiqueta?: string; quieto?: boolean; alt?: string }): string {
  const fase = ['entra', 'juega', 'sale', 'explota'].includes(o.fase) ? o.fase : 'juega'
  const lista = celdaCuadros(String(o.equipo ?? 'base'), o.color ?? '#8a93a0', fase, String(o.etiqueta ?? ''))
  // «entra» se dibuja una sola vez (0,4 s) y queda trabajando; las demás fases van en bucle.
  // Se alterna con `display` y no con `visibility`: un hijo con visibility="visible" se vería igual.
  const juega = fase === 'entra' ? lista.slice(4) : lista
  const cuerpo =
    fase === 'entra' && o.quieto !== true
      ? `<g>${cuadros(lista.slice(0, 4), S, { unaVez: true })}<set attributeName="display" to="none" begin="0.4s" fill="freeze"/></g>` +
        `<g display="none">${cuadros(juega, S)}<set attributeName="display" to="inline" begin="0.4s" fill="freeze"/></g>`
      : cuadros(juega, S, { quieto: o.quieto === true })
  return abrir(CELDA_W * S, CELDA_H * S, cuerpo, o.alt ?? '')
}

/** Celda «+N» del mismo tamaño. */
export function celdaMasTerminalSvg(n: number): string {
  const g = grilla(CELDA_W, CELDA_H)
  rect(g, 2, 2, 18, 11, F.g1)
  rect(g, 3, 3, 16, 9, F.negro)
  const t = `+${Math.max(0, Math.floor(Number(n) || 0))}`
  texto(g, Math.floor((CELDA_W - anchoTexto(t)) / 2), 5, t, F.g5)
  texto(g, 3, 15, 'MAS', F.g4)
  return abrir(CELDA_W * S, CELDA_H * S, caminos(g, S), `y ${n} más`)
}

/** Carpeta de un equipo (pantalla de Equipos): 22 × 17 unidades. Con `aviso`, el triángulo ámbar. */
export function carpetaGrilla(equipo: string, color: string, nombre: string, aviso = false): Grilla {
  const g = grilla(CELDA_W, CARPETA_H)
  sello(g, ['XXXXX...........', 'XLLLLXXXXXXXXXXX', 'XLLLLLLLLLLLLLLX', 'XxxxxxxxxxxxxxxX', 'XLLLLLLLLLLLLLLX', 'XLLLLLLLLLLLLLLX', 'XLLLLLLLLLLLLLLX', 'XXXXXXXXXXXXXXXX'], paletaEquipo(color), 3, 1)
  if (aviso) sello(g, ['.y.', 'yyy', 'yky'], { y: A.ambar, k: F.visor }, 16, 0)
  const et = String(nombre ?? '').toUpperCase().slice(0, 5)
  texto(g, Math.floor((CELDA_W - anchoTexto(et)) / 2), 11, et, F.g5)
  void equipo
  return g
}

// ---- El monitor ----
const PL = { luz: '#e6dcc2', base: '#d2c6a6', medio: '#bcae8a', sombra: '#9a8c69', osc: '#6c6149', linea: '#2e281d' }
const PATO: Record<string, string> = { y: '#ffd84a', Y: '#e0a92a', o: '#ff8a2a', k: '#1a1a1a' }
const POSTIT = { p: '#f6e05e', P: '#d9be3a', t: '#35408a' }

function plastico(g: Grilla, x0: number, y0: number, w: number, h: number): void {
  rect(g, x0, y0, w, h, PL.base)
  rect(g, x0, y0, w, 1, PL.luz)
  rect(g, x0, y0, 1, h, PL.luz)
  rect(g, x0, y0 + h - 1, w, 1, PL.sombra)
  rect(g, x0 + w - 1, y0, 1, h, PL.sombra)
  for (const [x, y] of [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]]) g[y][x] = null
}

// El cursor parpadea en Morse: «HOLA» (.... --- .-.. .-).
function cursorMorse(x: number, y: number, quieto: boolean): string {
  const r = `<rect x="${x * S}" y="${y * S}" width="${3 * S}" height="${5 * S}" fill="${F.g5}"`
  if (quieto) return `${r}/>`
  const morse = ['....', '---', '.-..', '.-']
  const pasos: Array<[number, number]> = []
  morse.forEach((letra, i) => {
    ;[...letra].forEach((s, j) => {
      pasos.push([1, s === '.' ? 0.18 : 0.54])
      if (j < letra.length - 1) pasos.push([0, 0.18])
    })
    pasos.push([0, i < morse.length - 1 ? 0.54 : 2.2])
  })
  const total = pasos.reduce((a, p) => a + p[1], 0)
  let t = 0
  const tiempos: string[] = []
  const valores: number[] = []
  for (const [on, d] of pasos) {
    tiempos.push((t / total).toFixed(4))
    valores.push(on)
    t += d
  }
  return `${r}><animate attributeName="opacity" calcMode="discrete" values="${valores.join(';')}" keyTimes="${tiempos.join(';')}" dur="${total.toFixed(2)}s" repeatCount="indefinite"/></rect>`
}

// Huevos de pascua que cruzan la pantalla.
function bicho(ancho: number, y: number): string {
  const g = grilla(5, 3)
  sello(g, ['4.4.4', '.555.', '4.4.4'], { 4: F.g4, 5: F.g5 })
  return `<g>${caminos(g, S)}<animateTransform attributeName="transform" type="translate" from="${-6 * S} ${y * S}" to="${ancho * S} ${y * S}" dur="9s" repeatCount="indefinite"/></g>`
}
function conejo(ancho: number, y: number): string {
  const a = grilla(7, 6)
  const b = grilla(7, 6)
  sello(a, ['.w.w...', '.w.w...', '.www...', 'wwwww..', '.wwwwww', '.w...w.'], { w: A.blanco })
  sello(b, ['..w.w..', '..w.w..', '.www...', 'wwwwww.', 'wwwwwww', '.......'], { w: A.blanco })
  const pasos = Array.from({ length: 9 }, (_, i) => `${(-8 + (i * (ancho + 8)) / 8) * S} ${(y - (i % 2) * 3) * S}`).join(';')
  return `<g>${cuadros([[a, 0.3], [b, 0.3]], S)}<animateTransform attributeName="transform" type="translate" values="${pasos}" dur="5s" repeatCount="indefinite"/></g>`
}
function lluviaMatrix(w: number, h: number): string {
  const g = grilla(w, h)
  for (let x = 2; x < w; x += 4) {
    const largo = 6 + ((x * 13) % 14)
    const y0 = (x * 7) % h
    for (let k = 0; k < largo; k++) texto(g, x - 1, (y0 + k * 2) % h, '01'[(x + k) % 2], k === largo - 1 ? F.g6 : k > largo - 4 ? F.g5 : F.g2)
  }
  return caminos(g, S)
}

/** Cuántas celdas de agentes entran por fila en la pantalla del monitor de `ancho` px. */
export function porFilaMonitor(ancho: number): number {
  const W = Math.floor(anchoValido(ancho) / S)
  return Math.max(1, Math.floor((W - 10 - (ROBOT_W + 3) - 1) / CELDA_W))
}

function anchoValido(ancho: number): number {
  const n = Number(ancho)
  return Number.isFinite(n) ? Math.max(200, Math.min(1200, Math.round(n))) : 378
}

type Medidas = { W: number; pantallaX: number; pantallaW: number; pantallaY: number; pantallaH: number; cajaY: number; cajaH: number; H: number; zonaX: number; porFila: number }

function medir(ancho: number, celdas: number, carpetas: number, lineas: number): Medidas {
  const W = Math.floor(anchoValido(ancho) / S)
  const pantallaX = 5
  const pantallaW = W - 10
  const zonaX = ROBOT_W + 3
  const porFila = Math.max(1, Math.floor((pantallaW - zonaX - 1) / CELDA_W))
  let zona = ROBOT_H
  if (lineas > 0) zona = Math.max(ROBOT_H, lineas * 7 + 2)
  else if (carpetas > 0) zona = Math.max(ROBOT_H, Math.ceil(carpetas / porFila) * CARPETA_H)
  else if (celdas > 0) zona = Math.max(ROBOT_H, Math.min(2, Math.ceil(celdas / porFila)) * CELDA_H)
  const pantallaH = 9 + zona + 2 + 8
  const pantallaY = 15
  const cajaY = 8
  const cajaH = 7 + pantallaH + 15
  return { W, pantallaX, pantallaW, pantallaY, pantallaH, cajaY, cajaH, H: cajaY + cajaH + 6, zonaX, porFila }
}

/** Alto (px) de la escena del monitor con `celdas` agentes (máximo 2 filas). */
export function escenaAlto(ancho: number, celdas: number, _conVacia = false): number {
  return medir(ancho, Math.max(0, Math.floor(Number(celdas) || 0)), 0, 0).H * S
}

export type OpcionesMonitor = {
  ancho: number
  /** SVG del robot (caraRobotSvg, 132 × 108 a escala 3). */
  cara: string
  /** Celdas de agentes ya armadas (celdaTerminalSvg); como mucho 2 filas. */
  celdas?: Array<{ svg: string }>
  /** Equipos: una carpeta por equipo. */
  carpetas?: Array<{ equipo: string; color: string; nombre: string; aviso?: boolean }>
  /** Editar: las líneas del archivo abierto en el editor. */
  lineas?: string[]
  prompt?: string
  hora?: string
  /** Texto de la barra de estado (como tmux). */
  estado?: string
  /** Barra del proyecto en la pantalla cuando no hay agentes (0 a 100) o `null` sin datos. */
  progreso?: number | null
  /** Fuera de hora: la pantalla casi apagada y la luz en ámbar. */
  apagado?: boolean
  /** Algo falló: el patito dice «CUAC». */
  cuac?: boolean
  quieto?: boolean
  alt?: string
}

function armar(o: OpcionesMonitor, celdas: Array<{ svg: string }>): string {
  const carpetas = Array.isArray(o.carpetas) ? o.carpetas : []
  const lineas = Array.isArray(o.lineas) ? o.lineas.map(l => String(l)) : []
  const m = medir(o.ancho, celdas.length, carpetas.length, lineas.length)
  const { W, H, pantallaX, pantallaW, pantallaY, pantallaH, cajaY, cajaH, zonaX, porFila } = m
  const quieto = o.quieto === true
  const apagado = o.apagado === true
  const g = grilla(W, H)

  // Caja, bisel hundido y pantalla con las esquinas curvas del tubo.
  plastico(g, 0, cajaY, W, cajaH)
  rect(g, 1, cajaY + 1, W - 2, 2, PL.luz)
  rect(g, pantallaX - 2, pantallaY - 2, pantallaW + 4, pantallaH + 4, PL.sombra)
  rect(g, pantallaX - 1, pantallaY - 1, pantallaW + 2, pantallaH + 2, PL.osc)
  rect(g, pantallaX - 2, pantallaY + pantallaH + 1, pantallaW + 4, 1, PL.luz)
  rect(g, pantallaX, pantallaY, pantallaW, pantallaH, apagado ? '#010402' : F.negro)
  for (const [cx, cy, sx, sy] of [[pantallaX, pantallaY, 1, 1], [pantallaX + pantallaW - 1, pantallaY, -1, 1], [pantallaX, pantallaY + pantallaH - 1, 1, -1], [pantallaX + pantallaW - 1, pantallaY + pantallaH - 1, -1, -1]]) {
    pon(g, cx, cy, PL.osc)
    pon(g, cx + sx, cy, PL.osc)
    pon(g, cx, cy + sy, PL.osc)
  }
  if (!apagado) for (let i = 0; i < 14; i++) {
    pon(g, pantallaX + 3 + i, pantallaY + 16 - i, F.g0)
    pon(g, pantallaX + 4 + i, pantallaY + 16 - i, F.g0)
  }
  for (let x = 30; x < W - 30; x += 3) pon(g, x, cajaY + 4, PL.sombra)

  // Marca, post-it, perillas y luz en el bisel de abajo.
  const by = pantallaY + pantallaH + 4
  rect(g, 8, by, 55, 9, '#2c2a26')
  rect(g, 8, by, 55, 1, '#4a4740')
  texto(g, 10, by + 2, 'TERMINAL 9000', '#d8d2c0')
  const px = 66
  rect(g, px, by - 2, 22, 13, POSTIT.p)
  rect(g, px, by + 10, 22, 1, POSTIT.P)
  rect(g, px + 20, by - 2, 2, 1, POSTIT.P)
  texto(g, px + 2, by - 1, 'CLAVE', POSTIT.t)
  texto(g, px + 4, by + 5, '1234', POSTIT.t)
  for (const kx of [W - 30, W - 21]) {
    rect(g, kx, by + 2, 6, 6, PL.sombra)
    rect(g, kx + 1, by + 3, 4, 4, PL.medio)
    pon(g, kx + 2, by + 3, PL.luz)
  }
  rect(g, W - 12, by + 3, 4, 3, '#1a1a1a')
  rect(g, W - 11, by + 4, 2, 1, apagado ? A.ambar : F.g5)
  // Pie del monitor.
  rect(g, Math.floor(W / 2) - 14, cajaY + cajaH, 28, 3, PL.medio)
  rect(g, Math.floor(W / 2) - 14, cajaY + cajaH, 28, 1, PL.sombra)
  plastico(g, Math.floor(W / 2) - 24, cajaY + cajaH + 3, 48, 3)
  // Patito de goma arriba del monitor (rubber duck debugging).
  sello(g, ['...yyy....', '..yyyyy...', '..ykyyyoo.', '..yyyyyo..', 'Yyyyyyyy..', 'yyyyyyyyy.', '.YyyyyyyY.', '..YYYYYY..'], PATO, W - 22, 0)

  // Lo que está en la pantalla.
  const capa = grilla(W, H)
  const sx = pantallaX + 3
  const sy = pantallaY + 2
  const hora = String(o.hora ?? '').slice(0, 5)
  // El prompt no pisa la hora: se corta donde empieza.
  const lugar = Math.floor((pantallaW - 6 - (hora !== '' ? anchoTexto(hora) + 4 : 0) - 5) / 4)
  const prompt = String(o.prompt ?? '$ ./OFICINA').slice(0, Math.max(4, lugar))
  const ey = pantallaY + pantallaH - 8
  if (!apagado) {
    texto(capa, sx, sy, prompt, F.g5)
    if (hora !== '') texto(capa, pantallaX + pantallaW - 3 - anchoTexto(hora), sy, hora, F.g4)
    rect(capa, pantallaX + 1, ey, pantallaW - 2, 7, F.g3)
    texto(capa, pantallaX + 3, ey + 1, String(o.estado ?? '').slice(0, Math.floor((pantallaW - 6) / 4)), F.visor)
    texto(capa, pantallaX + pantallaW - 26, pantallaY + 12, 'READY.', '#031009') // pantalla quemada
  } else {
    texto(capa, sx, ey, `${hora !== '' ? hora + ' ' : ''}FIN DEL TURNO`.slice(0, Math.floor((pantallaW - 6) / 4)), F.g1)
  }
  // Editar: el archivo del agente.
  lineas.forEach((l, i) => {
    texto(capa, pantallaX + zonaX, pantallaY + 9 + i * 7, String(i + 1).padStart(2, ' '), F.g2)
    const color = l.startsWith('#') ? F.g6 : l.startsWith('-') ? F.g3 : l.includes(':') ? F.g5 : F.g4
    texto(capa, pantallaX + zonaX + 10, pantallaY + 9 + i * 7, l.slice(0, Math.floor((pantallaW - zonaX - 12) / 4)), color)
  })
  // Equipos: las carpetas.
  carpetas.forEach((c, i) => {
    const cg = carpetaGrilla(c.equipo, c.color, c.nombre, c.aviso === true)
    const cx = pantallaX + zonaX + (i % porFila) * CELDA_W
    const cy = pantallaY + 9 + Math.floor(i / porFila) * CARPETA_H
    for (let y = 0; y < cg.length; y++) for (let x = 0; x < cg[y].length; x++) if (cg[y][x]) pon(capa, cx + x, cy + y, cg[y][x])
  })
  // Sin agentes: espera, con la barra del proyecto.
  if (!apagado && celdas.length === 0 && carpetas.length === 0 && lineas.length === 0) {
    const cx = pantallaX + zonaX + 2
    texto(capa, cx, pantallaY + 12, 'SIN PROCESOS.', F.g4)
    texto(capa, cx, pantallaY + 20, 'ESPERANDO...', F.g3)
    // PROY + la barra + «100%» entran en lo que queda de pantalla.
    const largo = Math.max(4, Math.floor((pantallaW - zonaX - 2 - 17 - 18) / 2))
    const pct = typeof o.progreso === 'number' && Number.isFinite(o.progreso) ? Math.max(0, Math.min(100, o.progreso)) : null
    texto(capa, cx, pantallaY + 30, 'PROY', F.g4)
    for (let i = 0; i < largo; i++) rect(capa, cx + 17 + i * 2, pantallaY + 30, 1, 5, pct !== null && i < Math.round((pct / 100) * largo) ? F.g5 : F.g1)
    texto(capa, cx + 17 + largo * 2 + 1, pantallaY + 30, pct === null ? '--%' : `${Math.round(pct)}%`, F.g5)
  }

  // El robot y las celdas van anidados como <svg x y> (cada uno con su tamaño).
  const anidar = (svg: string, x: number, y: number): string => (svg.startsWith('<svg ') ? `<svg x="${x * S}" y="${y * S}" ${svg.slice(5)}` : '')
  const pantalla = `<clipPath id="pantalla"><rect x="${pantallaX * S}" y="${pantallaY * S}" width="${pantallaW * S}" height="${pantallaH * S}"/></clipPath>`
  let cuerpo = pantalla + caminos(g, S) + caminos(capa, S)
  const cara = String(o.cara ?? '')
  if (cara !== '') cuerpo += anidar(cara, pantallaX + 1, pantallaY + 8)
  celdas.forEach((c, i) => {
    const cx = pantallaX + zonaX + (i % porFila) * CELDA_W
    const cy = pantallaY + 9 + Math.floor(i / porFila) * CELDA_H
    cuerpo += anidar(c.svg, cx, cy)
  })
  if (!apagado) cuerpo += cursorMorse(sx + anchoTexto(prompt) + 2, sy, quieto)

  if (!quieto && !apagado) {
    const enPantalla = (s: string) => `<g clip-path="url(#pantalla)"><g transform="translate(${pantallaX * S} ${pantallaY * S})">${s}</g></g>`
    cuerpo += enPantalla(cadaTanto(bicho(pantallaW, pantallaH - 13), 37, 9, 4))
    cuerpo += enPantalla(cadaTanto(conejo(pantallaW, pantallaH - 15), 89, 5, 20))
    cuerpo += enPantalla(cadaTanto(lluviaMatrix(pantallaW, pantallaH - 9), 61, 1.6, 30))
  }
  if (!quieto) {
    const cuac = grilla(22, 7)
    rect(cuac, 0, 0, 22, 7, '#fffbe6')
    texto(cuac, 2, 1, 'CUAC', '#1a1a1a')
    const globo = `<g transform="translate(${(W - 46) * S} 0)">${caminos(cuac, S)}</g>`
    cuerpo += o.cuac === true ? globo : cadaTanto(globo, 23, 1.2, 11)
  }
  const vidrio = barrido(pantallaW * S, pantallaH * S, { quieto })
  const parpadeo = quieto ? '' : `<rect width="100%" height="100%" fill="${F.g5}" opacity="0"><animate attributeName="opacity" values="0;0.035;0;0;0.02;0" keyTimes="0;0.02;0.04;0.7;0.71;1" dur="5.3s" repeatCount="indefinite"/></rect>`
  cuerpo += `<g clip-path="url(#pantalla)"><g transform="translate(${pantallaX * S} ${pantallaY * S})">${vidrio}${parpadeo.replace('width="100%" height="100%"', `width="${pantallaW * S}" height="${pantallaH * S}"`)}</g></g>`
  // El SVG mide exactamente el ancho pedido (lo que sobra de dividir por la escala queda transparente).
  return abrir(anchoValido(o.ancho), H * S, cuerpo, o.alt ?? 'Monitor de terminal verde con el robot')
}

/** El monitor entero. Mismo papel que escenaOficinaSvg: si se pasa del peso, dibuja menos celdas. */
export function escenaOficinaSvg(o: OpcionesMonitor): string {
  const W = Math.floor(anchoValido(o.ancho) / S)
  const porFila = Math.max(1, Math.floor((W - 10 - (ROBOT_W + 3) - 1) / CELDA_W))
  let celdas = (Array.isArray(o.celdas) ? o.celdas.filter(c => c && typeof c.svg === 'string') : []).slice(0, porFila * 2)
  let out = armar(o, celdas)
  while (out.length >= PESO_MAX && celdas.length > 0) {
    celdas = celdas.slice(0, -1)
    out = armar(o, celdas)
  }
  return out
}
