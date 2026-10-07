// El robot de la skin «Terminal retro»: vive dentro de la pantalla de fósforo verde, de frente, simpático y gracioso.
// Se arma por piezas (cabeza con visor, ojos, boca, brazos, pecho con pantallita, orugas) y cada emoción
// es una lista de cuadros [grilla, segundos]. Lienzo de 44 × 36 píxeles (a escala 3: 132 × 108).
//
// Las emociones de la oficina (las 31 de emociones.ts) siguen, con su versión de terminal,
// y se suman las de la hora del día (arranque, café, chivito, siesta, mate, «me voy», apagado)
// y 20 reacciones de memes.

import { A, F, bayer, grilla, linea, pon, puntos, rect, sello, texto } from './pixel-terminal.mjs'

export const ANCHO = 44
export const ALTO = 36
const X0 = 6 // dónde empieza el robot (columna 0 de su espacio) dentro del lienzo
const Y0 = 3

const PAL = {
  k: F.visor, n: F.negro, 0: F.g0, 1: F.g1, 2: F.g2, 3: F.g3, 4: F.g4, 5: F.g5, 6: F.g6,
  r: A.rojo, R: A.rojoOsc, y: A.ambar, Y: A.ambarOsc, b: A.azul, B: A.azulOsc, w: A.blanco,
}
// Apagado: todo baja dos tonos (el fósforo casi sin carga).
const APAGA = { [F.g6]: F.g3, [F.g5]: F.g2, [F.g4]: F.g2, [F.g3]: F.g1, [F.g2]: F.g1, [F.g1]: F.g0 }

// ---- Ojos (4 × 4 o 5 × 5; o = fósforo, h = brillo, k = pupila, d = tenue) ----
const OJOS = {
  normal: ['.oo.', 'ohko', 'okko', '.oo.'],
  izq: ['.oo.', 'hkoo', 'kkoo', '.oo.'],
  der: ['.oo.', 'oohk', 'ookk', '.oo.'],
  arriba: ['.hk.', 'okko', 'oooo', '.oo.'],
  abajo: ['.oo.', 'oooo', 'ohko', '.kk.'],
  feliz: ['....', '.oo.', 'o..o', '....'],
  cerrado: ['....', '....', 'oooo', '....'],
  medio: ['....', 'dddd', 'okko', '.oo.'],
  muyMedio: ['....', '....', 'dddd', '.oo.'],
  muerto: ['o..o', '.oo.', '.oo.', 'o..o'],
  punto: ['....', '.hh.', '.hh.', '....'],
  grande: ['hhhh', 'h..h', 'h.kh', 'hhhh'],
  corazon: ['oo.oo', 'ohooo', '.ooo.', '..o..'],
  estrella: ['..h..', '.hhh.', 'hhhhh', '.hhh.', '.h.h.'],
  espiral: ['oooo', '...o', '.o.o', '.ooo'],
  enojadoI: ['o...', 'ook.', 'okko', '.oo.'],
  enojadoD: ['...o', '.koo', 'okko', '.oo.'],
  tristeI: ['...o', '.ooo', 'okko', '.oo.'],
  tristeD: ['o...', 'ooo.', 'okko', '.oo.'],
  plano: ['....', 'oooo', '....', '....'],
  signo: ['.oo.', '...o', '..o.', '..o.'],
  equis: ['o..o', '.oo.', '.oo.', 'o..o'],
  dolar: ['.oo.', 'oh..', '.oho', '.oo.'],
  boot: ['....', '....', 'o...', '....'],
}
const rot90 = filas => filas[0].split('').map((_, i) => filas.map(f => f[i]).reverse().join(''))
const espejo = filas => filas.map(f => [...f].reverse().join(''))

// ---- Bocas (6 × 3 centradas en las columnas 13 a 18, filas 13 a 15) ----
const BOCAS = {
  sonrisa: ['o....o', '.oooo.', '......'],
  grande: ['oooooo', 'o3333o', '.oooo.'],
  o: ['..oo..', '.o..o.', '..oo..'],
  grito: ['.oooo.', 'o.33.o', '.oooo.'],
  plana: ['......', '.oooo.', '......'],
  triste: ['......', '.oooo.', 'o....o'],
  ondulada: ['......', '.o.o.o', 'o.o.o.'],
  dientes: ['oooooo', 'hkhkhk', 'oooooo'],
  lengua: ['o....o', '.oooo.', '..hh..'],
  silba: ['......', '...oo.', '...oo.'],
  costado: ['......', '....oo', 'oooo..'],
  muerta: ['......', 'oooooo', '...hh.'],
  mastica1: ['......', '.oooo.', '......'],
  mastica2: ['......', '..oo..', '..oo..'],
  gato: ['......', 'o.oo.o', '.o..o.'],
  chica: ['......', '..oo..', '......'],
  nada: ['......', '......', '......'],
}

// ---- Utilería (verde: no tiene categoría; con acento: lo que se clasifica) ----
const TAZA = ['55555..', '4333444', '43334.4', '4333444', '.444...']
const MATE = ['.555.', '43334', '43334', '43334', '.444.']
const TERMO = ['.5.', '444', '464', '434', '434', '434', '434', '444']
const CHIVITO = ['.55555.', '6363636', '4444444', '.55555.']
const LAMPARITA = ['.666.', '66566', '66666', '.656.', '.444.', '.333.']
const CORAZON = ['5.5', '555', '.5.']
const NOTA = ['.55', '.5.', '.5.', '55.', '55.']
const GOTA = ['.6.', '666', '.6.']
const MARIPOSA = [
  ['55.55', '56565', '.555.', '5.5.5'],
  ['.5.5.', '.565.', '.555.', '.5.5.'],
]
const LLAMA = [
  ['..y..', '.yry.', 'yrwry', 'yrrry', '.yyy.'],
  ['.y...', '.yy..', 'yrry.', 'yrwry', '.yry.'],
  ['...y.', '..yy.', '.yrry', 'yrwry', '.yry.'],
]
const BONGO = ['555555', '433334', '.4334.', '.4334.']
const CACTUS = ['..4..', '4.4..', '444.4', '..444', '..4..', '.333.', '.333.']
const CORBATA = ['666', '.6.', '.6.', '666', '666', '.6.']
const LENTES = ['4444444444444', '1114....41114', '1611.....1611', '.11.......11.']

// ---- El robot ----
// o: { ojos: [izq, der] | nombre, boca, brazos: [poseIzq, poseDer], antena: 'on' | 'off' | 'caida' | 'brilla',
//      pecho: 'barra' | 'err' | 'ok' | 'texto' | 'snake' | 'nada', pechoTexto, progreso, dx, dy, apagado, mejillas,
//      cejas: 'enojado' | 'arriba' | 'triste' | 'sospecha', orugas: 0 | 1, extras: [(g, x, y) => void] }
export function robot(o = {}) {
  const g = grilla(ANCHO, ALTO)
  const X = X0 + (o.dx ?? 0)
  const Y = Y0 + (o.dy ?? 0)
  const p = (x, y, c) => pon(g, X + x, Y + y, c)
  const r = (x, y, w, h, c) => rect(g, X + x, Y + y, w, h, c)

  // Sombra en el piso (no se mueve con el robot).
  rect(g, X0 + 8, Y0 + 31, 16, 1, F.g1)
  rect(g, X0 + 10, Y0 + 32, 12, 1, F.g0)

  // Orugas.
  const fase = o.orugas ?? 0
  r(8, 29, 16, 2, F.g1)
  for (let i = 0; i < 16; i++) p(8 + i, 29, (i + fase) % 2 === 0 ? F.g3 : F.g2)
  p(8, 30, F.g0); p(23, 30, F.g0)
  r(9, 30, 14, 1, F.g2)

  // Cuerpo con la pantallita del pecho.
  r(9, 21, 14, 8, F.g2)
  r(9, 21, 14, 1, F.g4); r(9, 28, 14, 1, F.g3)
  r(9, 21, 1, 8, F.g4); r(22, 21, 1, 8, F.g3)
  r(10, 22, 12, 1, F.g3)
  r(11, 23, 10, 4, F.g1)
  r(12, 24, 8, 2, F.visor)
  pecho(g, X, Y, o)
  // Luces de estado bajo el pecho.
  p(12, 27, F.g5); p(14, 27, F.g3); p(16, 27, F.g4); p(19, 27, F.g1); p(20, 27, F.g1)

  // Cuello.
  r(13, 20, 6, 1, F.g1); r(14, 20, 4, 1, F.g3)

  // Antena.
  const antena = o.antena ?? 'on'
  if (antena === 'caida') {
    p(16, 3, F.g3); p(17, 2, F.g3); p(18, 2, F.g3); p(19, 3, F.g2); p(20, 3, F.g2)
  } else {
    r(15, 2, 2, 2, F.g3); p(15, 2, F.g4)
    const bola = antena === 'off' ? F.g2 : antena === 'brilla' ? F.g6 : F.g5
    r(15, 0, 2, 2, bola)
    if (antena === 'brilla') { p(14, 0, F.g4); p(17, 0, F.g4); p(15, -1, F.g4); p(16, -1, F.g4); p(14, 1, F.g3); p(17, 1, F.g3) }
    else if (antena === 'on') p(15, 0, F.g6)
  }

  // Cabeza: caja redondeada con luz de arriba a la izquierda.
  const fila = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) p(x, y, c) }
  fila(4, 7, 24, F.g4); fila(5, 6, 25, F.g2); fila(18, 6, 25, F.g2); fila(19, 7, 24, F.g3)
  for (let y = 6; y <= 17; y++) fila(y, 5, 26, F.g2)
  for (let y = 6; y <= 17; y++) { p(5, y, F.g4); p(26, y, F.g3) }
  p(6, 5, F.g4); p(25, 5, F.g4); p(6, 18, F.g3); p(25, 18, F.g3)
  fila(5, 8, 22, F.g3); for (let y = 6; y <= 15; y++) p(6, y, F.g3)
  fila(18, 8, 24, F.g1); for (let y = 7; y <= 17; y++) p(25, y, F.g1)
  // Tornillos.
  p(7, 6, F.g4); p(24, 6, F.g1); p(7, 17, F.g1); p(24, 17, F.g1)
  // Orejas (bulones).
  for (const x of [3, 27]) { r(x, 10, 2, 4, F.g3); p(x, 10, F.g4); p(x + 1, 13, F.g1); p(x + (x === 3 ? 0 : 1), 11, F.g5) }

  // Visor: una pantalla dentro de la pantalla.
  fila(7, 9, 22, F.g1); fila(16, 9, 22, F.g1)
  for (let y = 8; y <= 15; y++) { p(8, y, F.g1); p(23, y, F.g1); fila(y, 9, 22, F.visor) }
  p(22, 8, F.g1); p(22, 9, F.g1); p(21, 8, F.g0) // reflejo
  // Textura del plástico: un degradé tramado de la luz (arriba a la izquierda) a la sombra.
  for (let y = 6; y <= 17; y++) for (let x = 6; x <= 25; x++) {
    if (x >= 8 && x <= 23 && y >= 7 && y <= 16) continue
    const t = ((x - 6) / 19 + (y - 6) / 11) / 2
    if (g[Y + y]?.[X + x] === F.g2 && bayer(x, y) < 0.42 * (1 - t) - 0.05) p(x, y, F.g3)
    else if (g[Y + y]?.[X + x] === F.g2 && bayer(x, y) < 0.5 * t - 0.2) p(x, y, F.g1)
  }

  // Ojos y boca.
  const pal = { o: F.g5, h: F.g6, k: F.visor, d: F.g3, 3: F.g3 }
  const [oi, od] = Array.isArray(o.ojos) ? o.ojos : [o.ojos ?? 'normal', o.ojos ?? 'normal']
  const ojo = (nombre, lado) => {
    let filas = typeof nombre === 'string' ? OJOS[nombre] ?? OJOS.normal : nombre
    const ancho = filas[0].length
    if (lado === 'der' && (nombre === 'enojadoI' || nombre === 'tristeI')) filas = espejo(filas)
    const x = lado === 'izq' ? (ancho === 5 ? 9 : 10) : 18
    const y = filas.length === 5 ? 8 : 9
    sello(g, filas, pal, X + x, Y + y)
  }
  ojo(oi, 'izq'); ojo(od, 'der')
  sello(g, BOCAS[o.boca ?? 'sonrisa'] ?? BOCAS.sonrisa, pal, X + 13, Y + 13)
  if (o.mejillas) { p(10, 14, F.g3); p(11, 14, F.g3); p(20, 14, F.g3); p(21, 14, F.g3) }
  cejas(p, o.cejas)

  // Brazos.
  const [bi, bd] = o.brazos ?? ['abajo', 'abajo']
  brazo(g, X, Y, bi, 'izq')
  brazo(g, X, Y, bd, 'der')

  // Brillo del fósforo: lo que rodea a los ojos y la boca se enciende apenas.
  const brillan = new Set([F.g5, F.g6])
  const halo = []
  for (let y = 8; y <= 15; y++) for (let x = 9; x <= 22; x++) {
    if (g[Y + y]?.[X + x] !== F.visor) continue
    const vecino = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => brillan.has(g[Y + y + b]?.[X + x + a]))
    if (vecino) halo.push([x, y])
  }
  for (const [x, y] of halo) p(x, y, F.halo)
  // Líneas del visor: una fila tenue cada dos.
  for (let y = 9; y <= 15; y += 2) for (let x = 9; x <= 22; x++) if (g[Y + y]?.[X + x] === F.visor) p(x, y, F.g0)

  for (const extra of o.extras ?? []) extra(g, X, Y)
  if (o.apagado) for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) if (g[y][x] && APAGA[g[y][x]]) g[y][x] = APAGA[g[y][x]]
  return g
}

function cejas(p, tipo) {
  if (!tipo) return
  const c = F.g4
  if (tipo === 'enojado') { p(10, 8, c); p(11, 8, c); p(20, 8, c); p(21, 8, c) }
  if (tipo === 'triste') { p(12, 8, c); p(13, 8, c); p(18, 8, c); p(19, 8, c) }
  if (tipo === 'arriba') { p(10, 8, c); p(11, 8, c); p(12, 8, c); p(13, 8, c); p(18, 8, c); p(19, 8, c); p(20, 8, c); p(21, 8, c) }
  if (tipo === 'sospecha') { p(18, 8, c); p(19, 8, c); p(20, 8, c); p(21, 8, c) }
}

// La pantallita del pecho: el avance del proyecto, un aviso o un jueguito.
function pecho(g, X, Y, o) {
  const tipo = o.pecho ?? 'barra'
  const p = (x, y, c) => pon(g, X + x, Y + y, c)
  if (tipo === 'barra') {
    const lleno = Math.round(Math.max(0, Math.min(100, o.progreso ?? 58)) / 100 * 8)
    for (let i = 0; i < 8; i++) { p(12 + i, 24, i < lleno ? F.g5 : F.g1); p(12 + i, 25, i < lleno ? F.g4 : F.g0) }
  } else if (tipo === 'err') {
    for (let i = 0; i < 8; i++) { p(12 + i, 24, A.rojo); p(12 + i, 25, A.rojoOsc) }
    p(15, 24, F.visor); p(16, 24, F.visor); p(15, 25, A.rojo); p(16, 25, A.rojo)
  } else if (tipo === 'ok') {
    p(13, 25, F.g5); p(14, 25, F.g5); p(15, 24, F.g5); p(16, 24, F.g5); p(17, 24, F.g5)
  } else if (tipo === 'pulso') {
    puntos(g, [[12, 25], [13, 25], [14, 24], [15, 25], [16, 24], [17, 25], [18, 25], [19, 25]], F.g5, X, Y)
  } else if (tipo === 'snake') {
    const f = o.snake ?? 0
    for (let i = 0; i < 4; i++) p(12 + ((f + i) % 8), 24 + (((f + i) >> 3) & 1), F.g5)
    p(12 + ((f + 6) % 8), 25, F.g6)
  } else if (tipo === 'carga') {
    const f = o.carga ?? 0
    for (let i = 0; i <= f && i < 8; i++) { p(12 + i, 24, F.g4); p(12 + i, 25, F.g4) }
  }
}

// ---- Brazos: una línea gruesa de hombro a mano y la mano al final ----
// Poses del lado izquierdo; el derecho es el espejo (x → 31 − x). Las que solo van de un lado lo dicen.
const POSES = {
  abajo: { tramo: [[8, 22], [6, 24], [6, 26]], mano: [6, 27] },
  arriba: { tramo: [[8, 22], [4, 19], [2, 14]], mano: [2, 12] },
  medio: { tramo: [[8, 22], [3, 21], [1, 17]], mano: [1, 15] },
  cintura: { tramo: [[8, 22], [5, 24], [8, 26]], mano: null },
  teclado: { tramo: [[8, 22], [6, 26], [9, 28]], mano: [10, 28] },
  tecladoArriba: { tramo: [[8, 22], [6, 25], [9, 26]], mano: [10, 26] },
  cabeza: { tramo: [[8, 22], [2, 18], [3, 9]], mano: [4, 7] },
  taza: { tramo: [[8, 22], [5, 25], [4, 25]], mano: [3, 24] },
  sorbo: { tramo: [[8, 22], [5, 22], [9, 17]], mano: [10, 15] },
  saluda1: { tramo: [[8, 22], [3, 19], [1, 13]], mano: [1, 11] },
  saluda2: { tramo: [[8, 22], [3, 19], [3, 13]], mano: [3, 11] },
  sien: { tramo: [[8, 22], [2, 19], [2, 12]], mano: [3, 10], dedo: [[4, 10], [5, 10]] },
  senala: { tramo: [[8, 22], [3, 21], [-3, 19]], mano: [-4, 19], dedo: [[-5, 19], [-6, 19]] },
  puno: { tramo: [[8, 22], [6, 26], [11, 25]], mano: [12, 24], puno: true },
  punoArriba: { tramo: [[8, 22], [4, 20], [4, 15]], mano: [4, 13], puno: true },
  cruzado: { tramo: [[8, 22], [10, 25], [19, 25]], mano: [20, 24] },
  pulgar: { tramo: [[8, 22], [4, 23], [3, 19]], mano: [3, 17], pulgar: true },
  termo: { tramo: [[8, 22], [6, 24], [5, 26]], mano: [4, 27] },
  bongo1: { tramo: [[8, 22], [5, 25], [7, 28]], mano: [7, 29] },
  bongo2: { tramo: [[8, 22], [4, 23], [5, 25]], mano: [5, 25] },
  alto: { tramo: [[8, 22], [3, 21], [0, 17]], mano: [0, 15], palma: true },
  baile1: { tramo: [[8, 22], [4, 21], [2, 17]], mano: [2, 16] },
  baile2: { tramo: [[8, 22], [5, 25], [3, 27]], mano: [3, 28] },
  nada: null,
}

function brazo(g, X, Y, pose, lado) {
  const def = POSES[pose]
  if (!def) return
  const mx = x => (lado === 'izq' ? x : 31 - x)
  const pts = def.tramo.map(([x, y]) => [X + mx(x), Y + y])
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]]
    linea(g, a[0], a[1], b[0], b[1], F.g3)
    linea(g, a[0], a[1] + 1, b[0], b[1] + 1, F.g4)
  }
  pon(g, pts[0][0], pts[0][1], F.g4)
  if (!def.mano) return
  const [hx, hy] = [X + mx(def.mano[0]), Y + def.mano[1]]
  if (def.puno) {
    rect(g, hx - 1, hy - 1, 3, 3, F.g5)
    pon(g, hx, hy, F.g4); pon(g, hx + (lado === 'izq' ? -1 : 1), hy - 1, F.g6)
  } else if (def.palma) {
    rect(g, hx - 1, hy - 2, 3, 4, F.g5); pon(g, hx, hy - 2, F.g6)
  } else {
    pon(g, hx, hy, F.g5); pon(g, hx - 1, hy, F.g5); pon(g, hx + 1, hy, F.g5); pon(g, hx, hy - 1, F.g5); pon(g, hx, hy + 1, F.g4)
    pon(g, hx - 1, hy - 1, F.g6)
  }
  if (def.pulgar) { pon(g, hx, hy - 2, F.g5); pon(g, hx, hy - 3, F.g6) }
  if (def.dedo) for (const [x, y] of def.dedo) pon(g, X + mx(x), Y + y, F.g6)
}

// ---- Ayudas para las escenas ----
const sel = (filas, x, y) => (g, X, Y) => sello(g, filas, PAL, X + x, Y + y)
const txt = (s, x, y, c) => g => texto(g, x, y, s, c)
const vapor = f => (g, X, Y) => {
  const pts = f === 0 ? [[0, 0], [1, -1], [0, -2], [1, -3]] : f === 1 ? [[1, 0], [0, -1], [1, -2], [0, -3]] : [[0, -1], [1, -2], [1, -3], [0, -4]]
  for (const [x, y] of pts) pon(g, X + x, Y + y, y < -2 ? F.g3 : F.g4)
}
const vaporEn = (x, y, f) => (g, X, Y) => vapor(f)(g, X + x, Y + y)
const zetas = f => g => {
  const z = [[34, 8, F.g4], [38, 4, F.g5], [41, 0, F.g6]]
  z.slice(0, f + 1).forEach(([x, y, c]) => texto(g, x, y, 'Z', c))
}

// Cada emoción: [[opciones del robot, segundos], …]. Lo común va en `base`.
const C = (base, ...pasos) => pasos.map(([cambios, seg]) => [{ ...base, ...cambios, extras: [...(base.extras ?? []), ...(cambios.extras ?? [])] }, seg])

const DEF = {
  // ---- Hora del día ----
  arranque: C({ pecho: 'carga', antena: 'off', ojos: 'boot', boca: 'nada' },
    [{ carga: 0, extras: [txt('BOOT', 2, 0, F.g4)] }, 0.35], [{ carga: 2, extras: [txt('BOOT', 2, 0, F.g4)] }, 0.35],
    [{ carga: 4, extras: [txt('RAM OK', 0, 0, F.g4)] }, 0.35], [{ carga: 6, extras: [txt('RAM OK', 0, 0, F.g4)] }, 0.35],
    [{ carga: 8, ojos: 'cerrado', antena: 'on', extras: [txt('OK', 2, 0, F.g5)] }, 0.5],
    [{ pecho: 'barra', ojos: 'normal', boca: 'sonrisa', antena: 'brilla' }, 1.6]),
  manana: C({ brazos: ['abajo', 'taza'], boca: 'sonrisa', ojos: 'medio', extras: [sel(TAZA, 25, 21)] },
    [{ extras: [vaporEn(27, 19, 0)] }, 0.5], [{ extras: [vaporEn(27, 19, 1)] }, 0.5], [{ extras: [vaporEn(27, 19, 2)] }, 0.5],
    [{ brazos: ['abajo', 'sorbo'], ojos: 'feliz', boca: 'nada', extras: [] }, 0.01],
    [{ brazos: ['abajo', 'sorbo'], ojos: 'feliz', boca: 'nada', extras: [] }, 1.2]),
  hambre: C({ brazos: ['abajo', 'sorbo'], ojos: 'feliz', extras: [sel(CHIVITO, 15, 15)] },
    [{ boca: 'mastica1' }, 0.25], [{ boca: 'mastica2' }, 0.25], [{ boca: 'mastica1' }, 0.25], [{ boca: 'mastica2', extras: [(g, X, Y) => { pon(g, X + 14, Y + 20, F.g5); pon(g, X + 19, Y + 22, F.g4) }] }, 0.25],
    [{ boca: 'lengua', brazos: ['abajo', 'abajo'], extras: [] }, 0.9]),
  siesta: C({ boca: 'chica' },
    [{ ojos: 'medio' }, 0.9], [{ ojos: 'muyMedio', dy: 1 }, 0.7], [{ ojos: 'cerrado', dy: 2, boca: 'o', extras: [zetas(0)] }, 0.9],
    [{ ojos: 'grande', dy: 0, boca: 'o', cejas: 'arriba' }, 0.25], [{ ojos: 'normal', boca: 'plana' }, 0.8]),
  mate: C({ brazos: ['termo', 'sorbo'], ojos: 'feliz', boca: 'nada', extras: [sel(TERMO, 0, 24), sel(MATE, 17, 15), (g, X, Y) => linea(g, X + 19, Y + 15, X + 17, Y + 13, F.g6)] },
    [{}, 0.9], [{ extras: [vaporEn(20, 13, 0)] }, 0.4], [{ extras: [vaporEn(20, 13, 1)] }, 0.4],
    [{ brazos: ['termo', 'abajo'], ojos: 'normal', boca: 'sonrisa', extras: [] }, 1.2]),
  casa: C({ boca: 'costado', ojos: ['normal', 'feliz'] },
    [{ brazos: ['abajo', 'saluda1'] }, 0.4], [{ brazos: ['abajo', 'saluda2'] }, 0.4], [{ brazos: ['abajo', 'saluda1'] }, 0.4],
    [{ dx: 3, orugas: 1, brazos: ['abajo', 'abajo'] }, 0.3], [{ dx: 7, orugas: 0 }, 0.3], [{ dx: 12, orugas: 1 }, 0.3], [{ dx: 30 }, 1.2]),
  apagado: C({ ojos: 'muerto', boca: 'muerta', antena: 'caida', pecho: 'nada', apagado: true, brazos: ['abajo', 'abajo'], dy: 1 },
    [{}, 2.6],
    [{ extras: [(g, X, Y) => sello(g, ['.444.', '44444', '4n4n4', '44444', '4.4.4'], PAL, X + 22, Y - 1)] }, 0.6],
    [{ extras: [(g, X, Y) => sello(g, ['.333.', '33333', '3n3n3', '33333', '.3.3.'], PAL, X + 25, Y - 3)] }, 0.6]),
  // ---- Ocio ----
  aburrido: C({ brazos: ['abajo', 'taza'], ojos: 'medio', boca: 'plana', extras: [sel(TAZA, 25, 21)] },
    [{ extras: [vaporEn(27, 19, 0)] }, 0.6], [{ extras: [vaporEn(27, 19, 1)] }, 0.6], [{ brazos: ['abajo', 'sorbo'], boca: 'nada', extras: [] }, 1]),
  dormido: C({ ojos: 'cerrado', boca: 'chica', antena: 'off', pecho: 'pulso' },
    [{ extras: [zetas(0)] }, 0.7], [{ dy: 1, extras: [zetas(1)] }, 0.7], [{ extras: [zetas(2)] }, 0.7], [{ dy: 1, boca: 'o' }, 0.7]),
  bostezo: C({}, [{ ojos: 'medio', boca: 'plana' }, 0.6], [{ ojos: 'cerrado', boca: 'grito', brazos: ['medio', 'medio'] }, 1.2], [{ ojos: 'medio', boca: 'chica' }, 0.8]),
  estira: C({}, [{ brazos: ['arriba', 'arriba'], ojos: 'cerrado', boca: 'o', dy: -1 }, 0.9], [{ brazos: ['abajo', 'abajo'], ojos: 'feliz', boca: 'sonrisa' }, 0.9]),
  riega: C({ brazos: ['abajo', 'pulgar'], ojos: 'feliz', boca: 'sonrisa', extras: [sel(CACTUS, 33, 22)] },
    [{}, 0.8], [{ extras: [(g, X, Y) => sello(g, ['.6.', '6.6'], PAL, X + 34, Y + 17)] }, 0.5], [{ extras: [(g, X, Y) => sello(g, ['.5.', '5.5', '.5.'], PAL, X + 33, Y + 16)] }, 0.5]),
  diario: C({ brazos: ['teclado', 'teclado'], ojos: 'abajo', boca: 'plana', extras: [(g, X, Y) => { rect(g, X + 9, Y + 25, 14, 6, F.g4); rect(g, X + 10, Y + 26, 12, 4, F.g2); texto(g, X + 11, Y + 26, 'MAN', F.g5) }] },
    [{}, 1.2], [{ ojos: 'izq' }, 0.6], [{ ojos: 'der' }, 0.6]),
  solitario: C({ ojos: 'abajo', boca: 'lengua', pecho: 'snake', brazos: ['teclado', 'teclado'] },
    ...Array.from({ length: 8 }, (_, i) => [{ snake: i * 2 }, 0.22])),
  silba: C({ boca: 'silba', ojos: 'arriba', brazos: ['cintura', 'cintura'] },
    [{ extras: [sel(NOTA, 31, 6)] }, 0.6], [{ extras: [sel(NOTA, 33, 3)] }, 0.6], [{ extras: [sel(NOTA, 35, 0)] }, 0.6]),
  guina: C({}, [{ ojos: ['normal', 'feliz'], boca: 'costado', brazos: ['abajo', 'pulgar'] }, 1.4], [{ ojos: 'normal', boca: 'sonrisa' }, 1.4]),
  // ---- Trabajo ----
  pensando: C({ boca: 'plana', cejas: 'arriba' },
    [{ ojos: 'arriba', brazos: ['abajo', 'sien'] }, 0.9], [{ ojos: 'izq', brazos: ['abajo', 'sien'] }, 0.6],
    [{ ojos: 'arriba', boca: 'o', extras: [sel(LAMPARITA, 30, 0)], antena: 'brilla' }, 0.8]),
  concentrado: C({ ojos: 'abajo', boca: 'plana', brazos: ['teclado', 'teclado'], extras: [sel(LENTES, 9, 9), teclado] }, // Hackerman
    [{ extras: [lluvia(0)] }, 0.2], [{ brazos: ['tecladoArriba', 'teclado'], extras: [lluvia(1)] }, 0.2],
    [{ extras: [lluvia(2)] }, 0.2], [{ brazos: ['teclado', 'tecladoArriba'], extras: [lluvia(3)] }, 0.2]),
  tipea: C({ ojos: 'feliz', boca: 'gato', extras: [sel(BONGO, 5, 27), sel(BONGO, 21, 27)] }, // Bongo Cat
    [{ brazos: ['bongo1', 'bongo2'], extras: [sel(NOTA, 0, 8)] }, 0.18], [{ brazos: ['bongo2', 'bongo1'] }, 0.18]),
  multitarea: C({ boca: 'grande' }, // Galaxy brain
    [{ ojos: 'normal', antena: 'on' }, 0.5], [{ ojos: 'grande', antena: 'brilla', extras: [aura(1)] }, 0.5],
    [{ ojos: 'estrella', antena: 'brilla', extras: [aura(2)] }, 0.5], [{ ojos: 'estrella', antena: 'brilla', boca: 'grito', extras: [aura(3)] }, 0.9]),
  caceria: C({ ojos: 'enojadoI', boca: 'costado', brazos: ['punoArriba', 'abajo'] }, [{}, 0.5], [{ dy: -1 }, 0.3], [{ brazos: ['abajo', 'punoArriba'] }, 0.5]),
  sospecha: C({ ojos: ['medio', 'normal'], boca: 'costado', cejas: 'sospecha' }, [{}, 1.1], [{ ojos: ['medio', 'izq'] }, 0.9]),
  // ---- Eventos buenos ----
  contento: C({ ojos: 'feliz', boca: 'grande', mejillas: true }, [{ brazos: ['abajo', 'pulgar'] }, 0.8], [{ dy: -1 }, 0.3]),
  festeja: C({ ojos: 'estrella', boca: 'grande', mejillas: true, pecho: 'ok' },
    [{ brazos: ['arriba', 'arriba'], dy: -1, extras: [chispas(0)] }, 0.3], [{ brazos: ['medio', 'medio'], dy: 0, extras: [chispas(1)] }, 0.3]),
  aplaude: C({ ojos: 'feliz', boca: 'grande' }, [{ brazos: ['puno', 'puno'] }, 0.18], [{ brazos: ['abajo', 'abajo'] }, 0.18]),
  orgullo: C({ boca: 'costado', brazos: ['cintura', 'cintura'], pecho: 'ok' }, // Deal with it
    [{ ojos: 'normal', extras: [sel(LENTES, 9, 0)] }, 0.4], [{ ojos: 'normal', extras: [sel(LENTES, 9, 4)] }, 0.4],
    [{ ojos: 'normal', extras: [sel(LENTES, 9, 9)] }, 1.6]),
  alivio: C({}, // Panik → Kalm
    [{ ojos: 'cerrado', boca: 'sonrisa', brazos: ['abajo', 'abajo'], extras: [txt('KALM', 28, 1, F.g5)] }, 1.4],
    [{ ojos: 'cerrado', boca: 'chica', extras: [txt('KALM', 28, 1, F.g5), (g, X, Y) => sello(g, ['.4', '4.', '.4'], PAL, X + 20, Y + 15)] }, 0.8]),
  // ---- Eventos malos ----
  panico: C({ ojos: 'espiral', boca: 'grito', brazos: ['cabeza', 'cabeza'], pecho: 'err' },
    [{ extras: [txt('PANIK', 0, 0, A.rojo)] }, 0.2], [{ ojos: [rot90(OJOS.espiral), rot90(OJOS.espiral)], dx: 1, extras: [txt('PANIK', 0, 0, A.rojo)] }, 0.2],
    [{ ojos: [rot90(rot90(OJOS.espiral)), rot90(rot90(OJOS.espiral))], dx: -1 }, 0.2], [{ ojos: [rot90(rot90(rot90(OJOS.espiral))), rot90(rot90(rot90(OJOS.espiral)))] }, 0.2]),
  frustrado: C({ ojos: ['tristeI', 'tristeI'], boca: 'triste', cejas: 'triste' }, // Crying
    [{ extras: [lagrimas(0)] }, 0.3], [{ extras: [lagrimas(1)] }, 0.3], [{ extras: [lagrimas(2)] }, 0.3]),
  ruge: C({ ojos: ['enojadoI', 'enojadoI'], boca: 'grito', cejas: 'enojado', pecho: 'err', antena: 'brilla' },
    [{ brazos: ['arriba', 'arriba'], extras: [txt('ERR', 32, 2, A.rojo)] }, 0.25], [{ brazos: ['medio', 'medio'], dx: 1 }, 0.25]),
  chispazo: C({ ojos: 'equis', boca: 'ondulada', pecho: 'err', antena: 'brilla' },
    [{ extras: [chispas(0, A.ambar)] }, 0.15], [{ dx: 1, extras: [chispas(1, A.ambar)] }, 0.15], [{ dx: -1, ojos: 'muerto' }, 0.15]),
  molesto: C({ ojos: ['enojadoI', 'enojadoI'], boca: 'plana', brazos: ['cruzado', 'cruzado'], cejas: 'enojado' }, [{}, 1.2], [{ ojos: ['izq', 'izq'] }, 0.8]),
  bufido: C({ ojos: 'cerrado', boca: 'plana', brazos: ['cintura', 'cintura'] },
    [{ extras: [(g, X, Y) => sello(g, ['4.4', '.4.'], PAL, X + 9, Y + 18)] }, 0.4], [{ extras: [(g, X, Y) => sello(g, ['3..3', '.33.'], PAL, X + 6, Y + 19)] }, 0.4], [{}, 0.6]),
  // ---- Social ----
  saluda: C({ ojos: 'feliz', boca: 'grande', mejillas: true },
    [{ brazos: ['abajo', 'saluda1'] }, 0.3], [{ brazos: ['abajo', 'saluda2'] }, 0.3], [{ brazos: ['abajo', 'saluda1'] }, 0.3], [{ brazos: ['abajo', 'abajo'], ojos: ['normal', 'feliz'] }, 0.9]),
  sorpresa: C({}, // Pikachu sorprendido
    [{ ojos: 'normal', boca: 'sonrisa' }, 0.8], [{ ojos: 'punto', boca: 'o', cejas: 'arriba' }, 1.6]),
}

// ---- Las 20 reacciones de memes (el robot las actúa; nada se copia, son el gesto) ----
const MEMES = {
  estoEstaBien: C({ brazos: ['abajo', 'sorbo'], ojos: 'feliz', boca: 'nada', pecho: 'err', extras: [] }, // This is fine
    ...[0, 1, 2].map(f => [{ extras: [llamas(f)] }, 0.22])),
  distraido: C({ boca: 'lengua', cejas: 'arriba' }, // Novio distraído
    [{ ojos: 'der', extras: [nuevo(0)] }, 0.6], [{ ojos: ['corazon', 'corazon'], extras: [nuevo(1)] }, 1.0]),
  drake: C({},
    [{ ojos: 'cerrado', boca: 'triste', brazos: ['alto', 'abajo'], extras: [txt('X', 38, 4, A.rojo)] }, 1.2],
    [{ ojos: 'feliz', boca: 'costado', brazos: ['abajo', 'senala'], extras: [txt('OK', 0, 4, F.g6)] }, 1.2]),
  successKid: C({ ojos: ['enojadoI', 'enojadoI'], boca: 'costado', pecho: 'ok' }, [{ brazos: ['abajo', 'puno'] }, 1.4], [{ brazos: ['abajo', 'puno'], dy: -1 }, 0.3]),
  stonks: C({ ojos: 'dolar', boca: 'costado', extras: [sel(CORBATA, 15, 21)] }, ...[0, 1, 2, 3].map(f => [{ extras: [flecha(f, true)] }, 0.35])),
  notStonks: C({ ojos: ['tristeI', 'tristeI'], boca: 'triste', extras: [sel(CORBATA, 15, 21)] }, ...[0, 1, 2, 3].map(f => [{ extras: [flecha(f, false)] }, 0.35])),
  galaxyBrain: null, // = multitarea
  doge: C({ ojos: ['medio', 'medio'], boca: 'costado' },
    [{ extras: [txt('WOW', 0, 2, F.g6)] }, 0.6], [{ extras: [txt('WOW', 0, 2, F.g6), txt('MUY', 33, 4, F.g4)] }, 0.6],
    [{ extras: [txt('WOW', 0, 2, F.g6), txt('MUY', 33, 4, F.g4), txt('BOT', 0, 20, F.g5)] }, 1.2]),
  harold: C({ ojos: 'normal', boca: 'dientes', cejas: 'triste' }, [{ extras: [sel(GOTA, 27, 6)] }, 0.8], [{ extras: [sel(GOTA, 27, 8)] }, 0.4], [{ extras: [sel(GOTA, 27, 10)] }, 0.4]),
  dosBotones: C({ ojos: ['izq', 'der'], boca: 'ondulada', cejas: 'triste' },
    [{ brazos: ['abajo', 'cabeza'], extras: [botones, sel(GOTA, 27, 8)] }, 0.5], [{ ojos: ['der', 'der'], brazos: ['abajo', 'cabeza'], extras: [botones, sel(GOTA, 27, 10)] }, 0.5]),
  paloma: C({ ojos: 'der', boca: 'o', brazos: ['abajo', 'senala'] }, // ¿Esto es una paloma?
    [{ extras: [sel(MARIPOSA[0], 38, 15), txt('BUG?', 28, 0, F.g6)] }, 0.3], [{ extras: [sel(MARIPOSA[1], 38, 14), txt('BUG?', 28, 0, F.g6)] }, 0.3]),
  rollSafe: C({ ojos: ['medio', 'normal'], boca: 'costado', brazos: ['abajo', 'sien'] }, [{}, 1.6], [{ ojos: ['feliz', 'normal'] }, 0.3]),
  panik: null, // = panico
  kalm: null, // = alivio
  bongoCat: null, // = tipea
  hackerman: null, // = concentrado
  meVoy: null, // = casa
  otraVez: C({ ojos: ['muyMedio', 'muyMedio'], boca: 'plana' }, [{ extras: [txt('OTRA', 1, 2, F.g4)] }, 0.9], [{ extras: [txt('OTRA', 1, 2, F.g4), txt('VEZ', 33, 2, F.g4)] }, 1.4]),
  masDe9000: C({ ojos: ['normal', 'grande'], boca: 'grito', extras: [scouter] },
    [{ extras: [txt('8999', 0, 0, A.ambar)] }, 0.5], [{ extras: [txt('9001', 0, 0, A.ambar)] }, 0.35], [{ extras: [txt('9001', 0, 0, A.rojo), chispas(0, A.ambar)] }, 0.6]),
  dealWithIt: null, // = orgullo
  rickroll: C({ ojos: 'feliz', boca: 'sonrisa', mejillas: true },
    [{ brazos: ['baile1', 'baile2'], dx: -1, extras: [sel(NOTA, 0, 4)] }, 0.3], [{ brazos: ['baile2', 'baile1'], dx: 1, extras: [sel(NOTA, 38, 2)] }, 0.3]),
}
export const MEME_DE = { galaxyBrain: 'multitarea', panik: 'panico', kalm: 'alivio', bongoCat: 'tipea', hackerman: 'concentrado', meVoy: 'casa', dealWithIt: 'orgullo' }

// ---- Extras dibujados ----
function teclado(g, X, Y) {
  rect(g, X + 7, Y + 29, 18, 3, F.g3)
  rect(g, X + 7, Y + 29, 18, 1, F.g4)
  for (let i = 0; i < 8; i++) pon(g, X + 8 + i * 2, Y + 30, F.g1)
}
function lluvia(f) {
  return g => {
    const cols = [1, 3, 36, 39, 42]
    cols.forEach((x, i) => {
      for (let k = 0; k < 4; k++) {
        const y = ((f * 3 + i * 7 + k * 9) % 34)
        pon(g, x, y, k === 0 ? F.g6 : k === 1 ? F.g5 : F.g3)
      }
    })
  }
}
function aura(n) {
  return (g, X, Y) => {
    const rayos = [[15, -2, 15, -3], [16, -2, 16, -3], [3, 4, 1, 2], [28, 4, 30, 2], [1, 11, -1, 11], [30, 11, 32, 11]]
    rayos.slice(0, n * 2).forEach(([a, b, c, d]) => linea(g, X + a, Y + b, X + c, Y + d, F.g6))
    if (n >= 3) { for (let x = 4; x <= 27; x += 3) pon(g, X + x, Y + 3, F.g6) }
  }
}
function chispas(f, color = F.g6) {
  return (g, X, Y) => {
    const a = [[0, 6], [31, 4], [2, 18], [29, 16], [33, 10]]
    const b = [[1, 2], [30, 8], [-1, 14], [32, 19], [4, 0]]
    for (const [x, y] of f === 0 ? a : b) { pon(g, X + x, Y + y, color); pon(g, X + x + 1, Y + y, color === F.g6 ? F.g4 : color); pon(g, X + x, Y + y + 1, color === F.g6 ? F.g4 : color) }
  }
}
function lagrimas(f) {
  return (g, X, Y) => {
    for (const x of [10, 21]) for (let k = 0; k < 3; k++) {
      const y = 13 + ((k * 2 + f) % 6)
      pon(g, X + x, Y + y, F.g6)
    }
  }
}
function llamas(f) {
  return g => {
    const pos = [[0, 26], [5, 28], [34, 27], [38, 25], [27, 29], [10, 30]]
    pos.forEach(([x, y], i) => sello(g, LLAMA[(f + i) % 3], PAL, x, y))
  }
}
function nuevo(f) {
  return g => {
    // El agente nuevo (a la derecha) brilla; el viejo (a la izquierda) mira enojado.
    sello(g, ['.666.', '66666', '66666', '.666.'], PAL, 38, 12 - f)
    sello(g, ['3333', '3k3k'.replace(/k/g, '1'), '3333', '3113'], PAL, 0, 13)
  }
}
function flecha(f, sube) {
  return g => {
    const pts = sube ? [[0, 30], [8, 22], [13, 26], [24, 12], [30, 16], [41, 2]] : [[0, 4], [9, 12], [14, 8], [26, 22], [31, 18], [41, 31]]
    const c = sube ? F.g6 : A.rojo
    const hasta = Math.min(pts.length - 1, f + 2)
    for (let i = 0; i < hasta; i++) linea(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c)
    const [hx, hy] = pts[hasta]
    if (sube) { pon(g, hx - 1, hy, c); pon(g, hx, hy + 1, c); pon(g, hx - 2, hy, c); pon(g, hx, hy + 2, c) }
    else { pon(g, hx - 1, hy, c); pon(g, hx, hy - 1, c); pon(g, hx - 2, hy, c); pon(g, hx, hy - 2, c) }
  }
}
function botones(g) {
  sello(g, ['rrrr', 'RrrR', '.RR.'], PAL, 1, 1)
  sello(g, ['5555', '3553', '.33.'], PAL, 38, 1)
}
function scouter(g, X, Y) {
  sello(g, ['yyyyy', 'y...y', 'y...y', 'yyyyy'], PAL, X + 17, Y + 8)
  linea(g, X + 22, Y + 9, X + 27, Y + 10, A.ambarOsc)
}

// ---- API ----
export const EMOCIONES = [...Object.keys(DEF)]
export const MEMES_LISTA = Object.keys(MEMES)

export function cuadrosDe(nombre, progreso = 58) {
  const clave = MEME_DE[nombre] ?? nombre
  const pasos = DEF[clave] ?? MEMES[clave] ?? DEF.aburrido
  return pasos.map(([o, seg]) => [robot({ progreso, ...o }), seg])
}

export const ALT = {
  arranque: 'arrancando: carga la memoria y abre los ojos',
  manana: 'con el café de la mañana',
  hambre: 'comiendo un chivito',
  siesta: 'cabeceando después de almorzar',
  mate: 'tomando mate con el termo bajo el brazo',
  casa: 'saludando y yéndose (Bueno, me voy)',
  apagado: 'apagado, con cara de muerto; cada tanto se le escapa el alma',
  aburrido: 'tomando café',
  dormido: 'en ahorro de energía',
  bostezo: 'bostezando',
  estira: 'estirándose',
  riega: 'regando el cactus',
  diario: 'leyendo el manual (man)',
  solitario: 'jugando a la viborita en la pantalla del pecho',
  silba: 'silbando',
  guina: 'guiñando un ojo',
  pensando: 'pensando con el dedo en la sien, hasta que se le prende la lamparita',
  concentrado: 'en modo Hackerman: lentes negros y lluvia de código',
  tipea: 'tocando los bongós como Bongo Cat',
  multitarea: 'con el cerebro galáctico: brilla cada vez más',
  caceria: 'manos a la obra',
  sospecha: 'con una ceja levantada',
  contento: 'feliz, pulgar arriba',
  festeja: 'festejando con ojos de estrella',
  aplaude: 'aplaudiendo',
  orgullo: 'Deal with it: le bajan los lentes',
  alivio: 'KALM: respira tranquilo',
  panico: 'PANIK: ojos en espiral y manos en la cabeza',
  frustrado: 'llorando a mares',
  ruge: 'en alarma, con ERR en el pecho',
  chispazo: 'echando chispas',
  molesto: 'ofendido, de brazos cruzados',
  bufido: 'resoplando',
  saluda: 'saludando',
  sorpresa: 'sorprendido como Pikachu',
  estoEstaBien: 'This is fine: toma café entre las llamas',
  distraido: 'Novio distraído: se enamora del agente nuevo',
  drake: 'Drake: no a una cosa, sí a la otra',
  successKid: 'Success Kid: puño cerrado',
  stonks: 'Stonks: corbata y flecha que sube',
  notStonks: 'Not stonks: la flecha baja',
  doge: 'Doge: WOW, MUY AGENT',
  harold: 'Hide the Pain Harold: sonrisa forzada y una gota',
  dosBotones: 'Dos botones: no sabe cuál apretar',
  paloma: '¿Esto es un bug? Señala una mariposa',
  rollSafe: 'Roll Safe: dedo en la sien',
  otraVez: 'Ah, otra vez',
  masDe9000: '¡Más de 9000!: el rastreador explota',
  rickroll: 'bailando un Rickroll',
}
