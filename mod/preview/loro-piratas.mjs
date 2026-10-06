// El loro pirata de la skin «Piratas»: un guacamayo rojo de frente, con tricornio, parche y aro de oro.
// Dibujado píxel por píxel en un lienzo de 42 x 34 (el del robot con su marco), con luz de arriba a la izquierda
// (la luna) y un borde rosa neón a la derecha (los faroles). Cada emoción cambia ojo, pico, parche y extras.

import { abrir, cuadros } from './pixel-piratas.mjs'

export const ANCHO = 42
export const ALTO = 34

// Paleta: una letra por color.
export const P = {
  o: '#1a0f24', // contorno
  O: '#5e0f33', // contorno cálido (en el rojo iluminado)
  R: '#ff9a7a', r: '#ff5a55', e: '#e2283f', E: '#a8173a', V: '#7a1236', // rojos
  p: '#ff7ec0', // borde neón rosa
  W: '#fff6e0', w: '#e3cfb6', v: '#b89e88', l: '#ec8e8e', // piel blanca y rayitas
  M: '#fffdf4', m: '#f3e5c6', i: '#dcc59a', I: '#b0925f', D: '#735638', // pico marfil
  k: '#140c1c', K: '#3c2c4a', L: '#6a5680', // negro y cuero
  y: '#f2df8e', // iris
  B: '#5c4d88', H: '#3f335f', h: '#2b2142', j: '#1c1530', J: '#120c20', // sombrero
  n: '#21e6c1', N: '#118f7a', // neón turquesa
  z: '#fff3a8', Y: '#ffdd55', g: '#f2b632', G: '#b8771a', q: '#6e4210', // oro
  C: '#ffc2de', c: '#ff5fa8', f: '#ff2e88', F: '#b5136a', X: '#6a0a40', // pluma magenta
  a: '#ffd04a', A: '#d0871c', // amarillo del ala
  t: '#2fc07a', T: '#177a4a', // verde del ala
  x: '#7ab8ff', u: '#2f6fe0', U: '#1d3f96', Q: '#13245c', // azul del ala
  s: '#a99cb4', S: '#6d607e', // patas
  '1': '#c9935a', '2': '#9c6a3a', '3': '#74492a', '4': '#4b2e1b', '5': '#2a1910', // madera
  '6': '#e2d1a8', '7': '#a38c64', // soga
  '8': '#ff6a3d', '9': '#b8401f', '0': '#ffa070', // cangrejo
  '+': '#8fe9ff', // sudor
  '*': '#e0a95a', '%': '#a8702e', '&': '#7a4a1e', // galleta
}

const nueva = () => Array.from({ length: ALTO }, () => Array(ANCHO).fill('.'))
const px = (g, x, y, c) => { if (y >= 0 && y < ALTO && x >= 0 && x < ANCHO) g[y][x] = c }
// Corrida horizontal: run(g, y, x0, 'abc…') pinta los caracteres desde x0 ('.' no pinta, '_' borra).
const run = (g, y, x0, s) => [...s].forEach((c, i) => { if (c === '_') px(g, x0 + i, y, '.'); else if (c !== '.') px(g, x0 + i, y, c) })
// Varias filas seguidas desde (x0, y0).
const bloque = (g, x0, y0, filas) => filas.forEach((f, j) => run(g, y0 + j, x0, f))

// ---- Cuerpo ----

function percha(g) {
  for (let x = 0; x < ANCHO; x++) px(g, x, 29, 'o')
  for (let x = 1; x <= 40; x++) {
    px(g, x, 30, x % 5 === 0 || x % 7 === 3 ? '2' : '1')
    px(g, x, 31, x === 9 || x === 26 ? '4' : '3')
    px(g, x, 32, x === 10 || x === 27 ? '5' : '4')
    px(g, x, 33, 'o')
  }
  for (const y of [30, 31, 32]) { px(g, 0, y, 'o'); px(g, 41, y, 'o') }
  // Corte del tronco con anillos.
  bloque(g, 1, 30, ['12', '21', '12'])
  // Soga atada.
  bloque(g, 4, 29, ['767', '676', '767', '676', '7o7'])
}

function cola(g) {
  run(g, 33, 19, 'uxuU')
}

// Ala izquierda (x 4..11, filas 19..31): coberteras rojas en escamas, banda amarilla y verde,
// y las plumas de vuelo azules que terminan en punta. La derecha es su espejo con un tono más de sombra.
const ALA = [
  '..ooo...',
  '.oRreo..',
  'oRreeE..',
  'oreEeE..',
  'oreeEE..',
  'oaaaAA..',
  'oaYaAAo.',
  'otTtTTo.',
  'oxxuuUo.',
  'oxuuuUo.',
  'oxuUuUo.',
  '.oxuUUo.',
  '..oxUo..',
]
const OSCURECER = { R: 'r', r: 'e', e: 'E', E: 'V', a: 'A', Y: 'a', A: 'G', t: 'T', x: 'u', u: 'U', U: 'Q' }

function alas(g) {
  bloque(g, 4, 19, ALA)
  ALA.forEach((f, j) => [...f].forEach((c, i) => { if (c !== '.') px(g, 41 - (4 + i), 19 + j, OSCURECER[c] ?? c) }))
}

function pecho(g) {
  bloque(g, 11, 21, [
    '.eeeeeeeeeeeeeeeeeE.',
    'oreeeeeeeeeeeeeeeEEo',
    'oreeEeeeeEeeeeEeeEEo',
    'oreeeeeeeeeeeeeeeEEo',
    'oreEeeeEeeeeEeeeEEEo',
    '.oreeeeeeeeeeeeeEEo.',
    '.oreeEeeeEeeEeeeEEo.',
    '..oEeEeEeEeEeEeEEo..',
    '...oEoEoEoEoEoEoo...',
  ])
  // Collar de oro con un doblón.
  run(g, 24, 13, 'gGg'); run(g, 24, 26, 'gGg')
  run(g, 25, 16, 'GgG'); run(g, 25, 23, 'GgG')
  bloque(g, 18, 25, [
    'Gqqqq.',
    'qzYggq',
    'qYgGgq',
    'qgGgGq',
    '.qqqq.',
  ])
  px(g, 23, 25, 'G')
}

function patas(g) {
  for (const x0 of [14, 22]) bloque(g, x0, 29, ['.SssS.', 'osSsSo', 'k.k.k.'])
}

function cangrejo(g, f) {
  // Huevo de pascua: un cangrejito en la punta de la percha, saluda con la pinza.
  bloque(g, 37, 24, [
    f ? '8...8' : '.....',
    f ? '98.89' : '8...8',
    f ? '.k.k.' : '98k89',
    '.808.',
    '89898',
  ])
  if (!f) { px(g, 38, 26, '.'); px(g, 40, 26, 'k'); px(g, 38, 26, 'k') }
}

// ---- Cabeza ----

function cabeza(g, erizada) {
  bloque(g, 8, 10, [
    '.ORRRrreeeeeeeeeeeeeeeEEo.',
    'ORRrrreeeeeeeeeeeeeeeeEEpo',
    'ORrreeeeeeeeeeeeeeeeeeEEpo',
    'Orreeeeeeeeeeeeeeeeeeeeepo',
    'oreeeeeeeeeeeeeeeeeeeeEEpo',
    'oreeeeeeeeeeeeeeeeeeeeEEpo',
    'oreeeeeeeeeeeeeeeeeeeeEEpo',
    'oreeeeeeeeeeeeeeeeeeeeEEpo',
    'oreeeeeeeeeeeeeeeeeeeeEEpo',
    'oeeeeeeeeeeeeeeeeeeeeeEEEo',
    '.oeeeeeeeeeeeeeeeeeeeEEEo.',
    '..oEeeeeeeeeeeeeeeeeEEEo..',
    '...EEeeeeeeeeeeeeeeeEEE...',
    '....EEEeeeeeeeeeeeEEEE....',
  ])
  if (erizada) {
    for (const [x, y, c] of [[7, 12, 'r'], [6, 11, 'o'], [7, 15, 'e'], [6, 15, 'o'], [7, 18, 'e'], [6, 18, 'o'],
      [34, 12, 'E'], [35, 11, 'o'], [34, 15, 'E'], [35, 15, 'o'], [34, 18, 'E'], [35, 18, 'o']]) px(g, x, y, c)
  } else {
    px(g, 7, 19, 'o'); px(g, 8, 19, 'e'); px(g, 34, 19, 'o'); px(g, 33, 19, 'E')
  }
}

// Piel blanca alrededor de los ojos, con las rayitas rojas del guacamayo (x 24..31, filas 13..21).
const PIEL = [
  '..WwwwW.',
  '.WWWWWWw',
  '.WWWWWWw',
  '.WWWWWWw',
  '.WWWWWWw',
  'WlWlWWww',
  'WWWWlWw.',
  '.lWlWw..',
  '..WWw...',
]
function piel(g) {
  bloque(g, 24, 13, PIEL)
  PIEL.forEach((f, j) => [...f].forEach((c, i) => { if (c !== '.') px(g, 41 - (24 + i), 13 + j, c === 'w' ? 'W' : c) }))
}

// Ojo sano, 5 x 4 desde (26, 14).
const OJOS = {
  abierto: ['.ooo.', 'oMkyo', 'vykyv', '.vvv.'],
  mira: ['.ooo.', 'oMyyo', 'vkyyv', '.vvv.'],
  arriba: ['.oMo.', 'oykko', 'vyyyv', '.vvv.'],
  cerrado: ['.....', '.....', 'o...o', '.ooo.'],
  feliz: ['.....', '.ooo.', 'o...o', '.....'],
  grande: ['.ooo.', 'oyyyo', 'oyMyo', 'oykyo', '.ooo.'],
  entrecerrado: ['.....', 'ooooo', 'oyMko', '.ooo.'],
  enojado: ['o....', '.oo..', 'oyMko', '.ooo.'],
}
function ojo(g, x0, y0, tipo, espejar) {
  const filas = OJOS[tipo].map(f => (espejar ? [...f].reverse().join('') : f))
  bloque(g, x0, y0 - (tipo === 'grande' ? 1 : 0), filas)
}

function parche(g, levantado) {
  if (!levantado) {
    px(g, 16, 13, 'k'); px(g, 10, 13, 'k'); px(g, 9, 12, 'k')
    bloque(g, 10, 13, [
      '.kkkkk.',
      'kLKkkkk',
      'kKGkGkk',
      'kkkGkkk',
      'kkGkGkk',
      '.kkkkk.',
    ])
  } else {
    // Levantado sobre la frente: el ojo de abajo está perfecto.
    bloque(g, 10, 10, [
      '.kkkkk.',
      'kLKGkGk',
      '.kkkGkk',
    ])
    px(g, 9, 11, 'k'); px(g, 17, 11, 'k')
  }
}

const PICOS = {
  cerrado: [
    '..wWWWWw..',
    '.oWkWWkwo.',
    '.oMmmmiIo.',
    'omMmmiiiIo',
    'ommiiiiIIo',
    'omiiiiiIDo',
    'oKmiiiiDko',
    'okomiiIoko',
    '.okomIoko.',
    '..oomIoo..',
    '....oo....',
  ],
  abierto: [
    '..wWWWWw..',
    '.oWkWWkwo.',
    '.oMmmmiIo.',
    'omMmmiiiIo',
    '.omiiiiIo.',
    'kkomiiIokk',
    'kVVomIoVVk',
    'kVcVooVcVk',
    '.kVccccVk.',
    '..kVVVVk..',
    '...kkkk...',
  ],
  grito: [
    '..wWWWWw..',
    '.oWkWWkwo.',
    '.oMmmiIIo.',
    '.omiiiIDo.',
    'kkomiIDokk',
    'kVVVooVVVk',
    'kVcccccVVk',
    'kVcCCCcVVk',
    'kVccccccVk',
    '.kKVVVVKk.',
    '..kkkkkk..',
  ],
}
function pico(g, tipo) {
  bloque(g, 16, 14, PICOS[tipo])
}

// Tricornio de frente: copa con calavera, ribete de oro en V que baja de las puntas de los costados
// a la punta del frente, y el fieltro levantado debajo del ribete. Mitad izquierda por fórmula, la derecha es espejo.
function sombrero(g, caido) {
  const d = caido ? 1 : 0
  const med = x => (x <= 20 ? x : 41 - x)
  const oro = x => Math.round(4 + (med(x) - 1) * 7 / 19) // fila del ribete
  const fondo = x => Math.round(8 + (med(x) - 1) * 3 / 19) // fila del doblez del fieltro
  const copa = x => {
    const dx = Math.abs(x + 0.5 - 20.5)
    return dx < 5 ? 0 : dx < 7 ? 1 : dx < 8.5 ? 2 : dx < 9.5 ? 3 : dx < 10.5 ? 5 : 99
  }
  const H = 15
  const m = Array.from({ length: H }, () => Array(ANCHO).fill(''))
  for (let x = 1; x <= 40; x++) {
    const o = oro(x), f = fondo(x), izq = x <= 20
    for (let y = copa(x); y < o && y < H; y++) {
      // Copa: luz a la izquierda, sombra y borde neón a la derecha.
      const dx = x + 0.5 - 20.5
      m[y][x] = dx > 9 ? 'n' : dx > 5 ? 'j' : dx < -7 ? (y < 4 && (x + y) % 2 ? 'B' : 'H') : dx < -3 ? 'H' : 'h'
    }
    m[o][x] = izq ? (x % 3 === 0 ? 'z' : 'Y') : x % 3 === 0 ? 'g' : 'g'
    if (o + 1 < H) m[o + 1][x] = izq ? 'g' : 'G'
    for (let y = o + 2; y <= f && y < H; y++) {
      // Fieltro levantado: claro a la izquierda, oscuro con borde neón a la derecha.
      m[y][x] = izq ? (y === o + 2 && med(x) < 7 ? 'B' : 'H') : med(x) < 5 && y === o + 2 ? 'n' : 'j'
    }
  }
  // Pliegue de la copa al centro y sombra bajo el ribete.
  for (let y = 9; y <= 11; y++) { if (m[y][20]) m[y][20] = 'j'; if (m[y][21]) m[y][21] = 'J' }
  // Contorno.
  const dentro = (x, y) => y >= 0 && y < H && x >= 0 && x < ANCHO && m[y][x] !== ''
  for (let y = 0; y < H; y++) for (let x = 0; x < ANCHO; x++) {
    if (m[y][x]) px(g, x, y + d, m[y][x])
    else if (dentro(x - 1, y) || dentro(x + 1, y) || dentro(x, y - 1) || dentro(x, y + 1)) px(g, x, y + d, 'o')
  }
  // Calavera y huesos cruzados.
  bloque(g, 16, 3 + d, [
    'W........W',
    '.W.WWWW.W.',
    '..WkWWkW..',
    '..WWvvWW..',
    '...WWWW...',
    '.W.wkwk.W.',
    'W........W',
  ])
  // Agujero de bala en la copa: se ve el cielo.
  g[3 + d][13] = '.'; g[3 + d][14] = '.'
  px(g, 13, 2 + d, 'B'); px(g, 15, 3 + d, 'J'); px(g, 14, 4 + d, 'J')
}

function pluma(g, f) {
  // Pluma magenta con cañón claro y barbas, sale por detrás de la copa; se mece en dos cuadros.
  const filas = f
    ? ['..........ooo', '........oocCo', '.......ocCCfo', '......ocCfFFo', '.....ocCfFFo.', '....ocCfFXo..', '...ocfFFXo...', '..ocfFXo.....', '.ocfFXo......']
    : ['.........ooo.', '.......oocCo.', '......ocCCfo.', '.....ocCfFFo.', '....ocCfFFo..', '....ocfFXo...', '...ocfFXo....', '..ocfFXo.....', '.ocfFXo......']
  bloque(g, 29, 0, filas)
  px(g, 30, 8, 'z'); px(g, 31, 8, 'g') // broche de oro
}

function aro(g) {
  bloque(g, 33, 16, ['.g', 'g.', 'Gz', '.G'])
}

// El rojo que toca el pico, el parche o la piel blanca se oscurece un tono: da volumen.
function sombraDeContacto(g) {
  const cerca = new Set(['o', 'k', 'W', 'w', 'l'])
  const cambios = []
  for (let y = 10; y <= 24; y++) for (let x = 9; x <= 32; x++) {
    if (g[y][x] !== 'e') continue
    const vecinos = [[x + 1, y], [x - 1, y], [x, y - 1]].map(([a, b]) => g[b]?.[a])
    if (vecinos.some(v => cerca.has(v)) && (x + y) % 2 === 0) cambios.push([x, y])
  }
  for (const [x, y] of cambios) g[y][x] = 'E'
  // Brillo en la frente y el cachete izquierdo.
  for (const [x, y] of [[10, 12], [11, 12], [9, 13], [9, 14], [9, 15]]) if (g[y][x] === 'e' || g[y][x] === 'r') g[y][x] = 'R'
}

// ---- Extras ----
const extras = {
  zetas: (g, f) => {
    bloque(g, 35, 10 - f, ['zzz', '.z.', 'zzz'])
    if (f) bloque(g, 38, 6, ['zz', 'zz'])
  },
  gotas: (g, f) => {
    bloque(g, 35, 13 + f, ['.+', '++', '++'])
    bloque(g, 5, 12 - f, ['+', '+'])
  },
  chispas: (g, f) => {
    for (const [x, y] of f ? [[36, 12], [5, 11], [37, 19]] : [[36, 16], [4, 14], [38, 10]]) {
      px(g, x, y, 'z'); px(g, x - 1, y, 'g'); px(g, x + 1, y, 'g'); px(g, x, y - 1, 'g'); px(g, x, y + 1, 'g')
    }
  },
  grito: (g, f) => {
    for (const [x, y, dx] of [[12, 23, -1], [29, 23, 1], [11, 26, -1], [30, 26, 1]]) {
      for (let k = 0; k < 3; k++) px(g, x + dx * (k + f), y + (y < 25 ? -1 : 1) * Math.floor(k / 2), 'z')
    }
  },
  galleta: (g, f) => {
    bloque(g, 33, 8 + f, [
      '..oooo..',
      '.oWWWWo.',
      'oW*%**Wo',
      'oW*&*%Wo',
      'oW%**&Wo',
      '.oWWWWo.',
      '..oooo..',
    ])
  },
}

// ---- Armado ----
// o: { ojo, pico, parche: 'levantado', ojoParche, erizada, sombreroCaido, pluma: 0|1, cangrejo: 0|1, extras: [[nombre, cuadro]] }
export function loroLetras(o = {}) {
  const g = nueva()
  percha(g)
  cola(g)
  alas(g)
  pecho(g)
  cabeza(g, o.erizada)
  piel(g)
  ojo(g, 26, 14, o.ojo ?? 'abierto')
  if (o.parche === 'levantado') ojo(g, 11, 14, o.ojoParche ?? 'abierto', true)
  pico(g, o.pico ?? 'cerrado')
  sombraDeContacto(g)
  patas(g)
  cangrejo(g, o.cangrejo ?? 0)
  aro(g)
  sombrero(g, o.sombreroCaido)
  pluma(g, o.pluma ?? 0)
  parche(g, o.parche === 'levantado')
  for (const [nombre, f] of o.extras ?? []) extras[nombre](g, f)
  return g
}

export const loro = o => loroLetras(o).map(f => f.map(c => (c === '.' ? null : P[c] ?? null)))

// Emociones del boceto: cada una es una lista de cuadros [opciones, segundos].
export const EMOCIONES = {
  vigia: {
    alt: 'loro vigía: parpadea, mira de reojo y se le mueve la pluma',
    cuadros: [
      [{}, 2.6], [{ pluma: 1 }, 0.5], [{ ojo: 'cerrado', pluma: 1 }, 0.14], [{ pluma: 1 }, 1.2],
      [{ ojo: 'mira' }, 1.2], [{ cangrejo: 1 }, 0.4], [{}, 0.4], [{ cangrejo: 1 }, 0.4],
    ],
  },
  risa: {
    alt: 'loro muerto de risa',
    cuadros: [
      [{ ojo: 'feliz', pico: 'abierto', extras: [['chispas', 0]] }, 0.25],
      [{ ojo: 'feliz', pico: 'cerrado', pluma: 1, extras: [['chispas', 1]] }, 0.2],
    ],
  },
  panico: {
    alt: 'loro en pánico, con las plumas paradas',
    cuadros: [
      [{ ojo: 'grande', pico: 'grito', erizada: true, extras: [['gotas', 0]] }, 0.18],
      [{ ojo: 'grande', pico: 'abierto', erizada: true, pluma: 1, extras: [['gotas', 1]] }, 0.18],
    ],
  },
  dormido: {
    alt: 'loro dormido, con el sombrero caído',
    cuadros: [
      [{ ojo: 'cerrado', sombreroCaido: true, extras: [['zetas', 0]] }, 1.2],
      [{ ojo: 'cerrado', sombreroCaido: true, pluma: 1, extras: [['zetas', 1]] }, 1.2],
    ],
  },
  sospecha: {
    alt: 'loro sospechando',
    cuadros: [[{ ojo: 'entrecerrado' }, 2], [{ ojo: 'entrecerrado', pluma: 1 }, 0.6], [{ ojo: 'mira' }, 0.8]],
  },
  grito: {
    alt: 'loro gritando ¡al abordaje!',
    cuadros: [
      [{ ojo: 'enojado', pico: 'grito', extras: [['grito', 0]] }, 0.16],
      [{ ojo: 'enojado', pico: 'grito', pluma: 1, extras: [['grito', 1]] }, 0.16],
    ],
  },
  hambre: {
    alt: 'loro soñando con una galleta',
    cuadros: [[{ ojo: 'arriba', extras: [['galleta', 0]] }, 0.9], [{ ojo: 'arriba', pluma: 1, extras: [['galleta', 1]] }, 0.9]],
  },
  guino: {
    alt: 'loro que levanta el parche y guiña: el ojo está sano',
    cuadros: [
      [{}, 1.4], [{ parche: 'levantado', ojoParche: 'abierto' }, 0.7],
      [{ parche: 'levantado', ojoParche: 'feliz', pico: 'abierto' }, 0.5], [{ parche: 'levantado', ojoParche: 'abierto' }, 0.3],
    ],
  },
}

export function loroSvg(emocion, escala = 3, quieto = false) {
  const e = EMOCIONES[emocion] ?? EMOCIONES.vigia
  const lista = e.cuadros.map(([o, d]) => [loro(o), d])
  return abrir(ANCHO * escala, ALTO * escala, cuadros(lista, escala, 0, 0, quieto), `Loro: ${e.alt}`)
}
