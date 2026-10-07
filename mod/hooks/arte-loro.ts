// El capitán de la skin «Piratas»: un guacamayo rojo de frente, con tricornio, parche y aro de oro,
// parado en una percha. Reemplaza al robot con el mismo contrato que arte-robot.ts: EMOCIONES (las 31,
// mismo orden), EMOCION_ALT y caraRobotSvg(emocion, escala, opts). El lienzo mide siempre 42 x 34
// (lo que el robot mide con su marco), así entra en el mismo lugar de la escena.
// Dibujado píxel por píxel: luz de luna desde arriba a la izquierda y borde rosa neón a la derecha.
// Funciones puras que devuelven texto SVG. Sin imports, sin scripts, sin referencias externas: la
// animación es solo SMIL en pasos discretos. Lo que no cambia entre cuadros se dibuja una sola vez.

export const EMOCIONES = [
  'aburrido',
  'dormido',
  'pensando',
  'caceria',
  'sospecha',
  'ruge',
  'molesto',
  'bufido',
  'contento',
  // ocio
  'bostezo',
  'estira',
  'riega',
  'diario',
  'solitario',
  'silba',
  'guina',
  // hora del día
  'manana',
  'hambre',
  'casa',
  // trabajo
  'concentrado',
  'tipea',
  'multitarea',
  // eventos buenos
  'festeja',
  'aplaude',
  'orgullo',
  'alivio',
  // eventos malos
  'panico',
  'frustrado',
  'chispazo',
  // social
  'saluda',
  'sorpresa',
]

export const EMOCION_ALT: Record<string, string> = {
  aburrido: 'mirando el horizonte',
  dormido: 'dormido bajo el sombrero',
  pensando: 'mirando por el catalejo',
  caceria: 'con el sable en alto',
  sospecha: 'con una ceja levantada',
  ruge: 'gritando ¡al abordaje!',
  molesto: 'ofendido',
  bufido: 'resoplando',
  contento: 'feliz',
  bostezo: 'bostezando',
  estira: 'estirando las alas',
  riega: 'puliendo el doblón',
  diario: 'leyendo el mapa del tesoro',
  solitario: 'jugando a los dados',
  silba: 'silbando una canción pirata',
  guina: 'guiñando con el ojo del parche',
  manana: 'con el café de la mañana',
  hambre: 'soñando con una galleta',
  casa: 'pensando en volver a puerto',
  concentrado: 'trazando el rumbo con la brújula',
  tipea: 'escribiendo en la bitácora',
  multitarea: 'haciendo mil cosas a la vez',
  festeja: 'festejando',
  aplaude: 'aplaudiendo con las alas',
  orgullo: 'orgulloso',
  alivio: 'aliviado',
  panico: 'en pánico',
  frustrado: 'frustrado',
  chispazo: 'echando chispas',
  saluda: 'saludando con el ala',
  sorpresa: 'sorprendido',
}

export const ANCHO = 42
export const ALTO = 34

// Paleta: un carácter por color.
export const PALETA: Record<string, string> = {
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
  C: '#ffc2de', c: '#ff5fa8', f: '#ff2e88', F: '#b5136a', X: '#6a0a40', // magenta
  a: '#ffd04a', A: '#d0871c', // amarillo del ala
  t: '#2fc07a', T: '#177a4a', // verde del ala
  x: '#7ab8ff', u: '#2f6fe0', U: '#1d3f96', Q: '#13245c', // azul del ala
  s: '#a99cb4', S: '#6d607e', // patas
  '1': '#c9935a', '2': '#9c6a3a', '3': '#74492a', '4': '#4b2e1b', '5': '#2a1910', // madera
  '6': '#e2d1a8', '7': '#a38c64', // soga
  '8': '#ff6a3d', '9': '#b8401f', '0': '#ffa070', // cangrejo
  '+': '#8fe9ff', // agua (sudor, lágrimas)
  '*': '#e0a95a', '%': '#a8702e', '&': '#7a4a1e', // galleta
  '#': '#f0e2c0', '=': '#c9a96a', '~': '#d0246e', '^': '#e8443a', ':': '#3fae6a', // mapa
  '!': '#e6ecf5', '?': '#8a93a0', // acero
  '$': '#9aa3b5', '@': '#5d6577', ';': '#5a3416', // jarro de café
  '"': '#d9d2e6', // humo y vapor
  '/': '#ffe94a', '|': '#2a2233', // rayo y hollín
}

type Grilla = string[][]
type Opciones = {
  ojo?: string
  pico?: string
  parche?: 'levantado'
  ojoParche?: string
  erizada?: boolean
  sombreroCaido?: boolean
  pluma?: number
  cangrejo?: number
  alaIzq?: 'arriba' | 'baja'
  alaDer?: 'arriba' | 'baja'
  extras?: Array<[string, number]>
}

const nueva = (): Grilla => Array.from({ length: ALTO }, () => Array(ANCHO).fill('.'))
function px(g: Grilla, x: number, y: number, c: string): void {
  if (y >= 0 && y < ALTO && x >= 0 && x < ANCHO) g[y][x] = c
}
// Corrida horizontal desde x0: '.' no pinta, '_' borra.
function run(g: Grilla, y: number, x0: number, s: string): void {
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '_') px(g, x0 + i, y, '.')
    else if (c !== '.') px(g, x0 + i, y, c)
  }
}
function bloque(g: Grilla, x0: number, y0: number, filas: string[]): void {
  filas.forEach((f, j) => run(g, y0 + j, x0, f))
}
const espejarFila = (f: string): string => f.split('').reverse().join('')

// ---- Cuerpo ----

function percha(g: Grilla): void {
  for (let x = 0; x < ANCHO; x++) px(g, x, 29, 'o')
  for (let x = 1; x <= 40; x++) {
    px(g, x, 30, x % 5 === 0 || x % 7 === 3 ? '2' : '1')
    px(g, x, 31, x === 9 || x === 26 ? '4' : '3')
    px(g, x, 32, x === 10 || x === 27 ? '5' : '4')
    px(g, x, 33, 'o')
  }
  for (const y of [30, 31, 32]) {
    px(g, 0, y, 'o')
    px(g, 41, y, 'o')
  }
  bloque(g, 1, 30, ['12', '21', '12']) // corte del tronco con anillos
  bloque(g, 4, 29, ['767', '676', '767', '676', '7o7']) // soga atada
}

// Ala plegada izquierda (x 4..11, filas 19..31); la derecha es su espejo con un tono más de sombra.
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
// Ala levantada izquierda (x 1..8): las plumas azules arriba, el hombro rojo pegado al cuerpo.
const ALA_ARRIBA = [
  '..ooo...',
  '.oxxuo..',
  'oxxuuUo.',
  'oxuuUUo.',
  'oxuuUo..',
  'otTtTo..',
  'otTTTo..',
  '.oaaAo..',
  '.oaaAAo.',
  '..oRreo.',
  '..oreEo.',
  '...oeEEo',
  '....oEEo',
]
// Flanco del cuerpo que queda a la vista cuando el ala está levantada (x 8..11, filas 21..29).
const FLANCO = ['..oe', '.ore', '.ore', '.ore', '.ore', '.ore', '.oEe', '..oE', '...o']
const OSCURECER: Record<string, string> = { R: 'r', r: 'e', e: 'E', E: 'V', a: 'A', Y: 'a', A: 'G', t: 'T', x: 'u', u: 'U', U: 'Q' }

function espejar(g: Grilla, x0: number, y0: number, filas: string[], oscurecer: boolean): void {
  filas.forEach((f, j) => {
    for (let i = 0; i < f.length; i++) {
      const c = f[i]
      if (c !== '.') px(g, 41 - (x0 + i), y0 + j, oscurecer ? OSCURECER[c] ?? c : c)
    }
  })
}

function alaPlegada(g: Grilla, der: boolean): void {
  if (der) espejar(g, 4, 19, ALA, true)
  else bloque(g, 4, 19, ALA)
}

function alaLevantada(g: Grilla, der: boolean, baja: boolean): void {
  const y0 = baja ? 11 : 9
  if (der) espejar(g, 1, y0, ALA_ARRIBA, true)
  else bloque(g, 1, y0, ALA_ARRIBA)
}

function flanco(g: Grilla, der: boolean): void {
  if (der) espejar(g, 8, 21, FLANCO, true)
  else bloque(g, 8, 21, FLANCO)
}

function pecho(g: Grilla): void {
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
  run(g, 24, 13, 'gGg')
  run(g, 24, 26, 'gGg')
  run(g, 25, 16, 'GgG')
  run(g, 25, 23, 'GgG')
  bloque(g, 18, 25, ['Gqqqq.', 'qzYggq', 'qYgGgq', 'qgGgGq', '.qqqq.'])
  px(g, 23, 25, 'G')
}

function patas(g: Grilla): void {
  for (const x0 of [14, 22]) bloque(g, x0, 29, ['.SssS.', 'osSsSo', 'k.k.k.'])
}

function cangrejo(g: Grilla, f: number): void {
  // Huevo de pascua: un cangrejito en la punta de la percha, saluda con la pinza.
  bloque(g, 37, 24, [f ? '8...8' : '.....', f ? '98.89' : '8...8', f ? '.k.k.' : '98k89', '.808.', '89898'])
  if (!f) {
    px(g, 40, 26, 'k')
    px(g, 38, 26, 'k')
  }
}

// ---- Cabeza ----

function cabeza(g: Grilla, erizada: boolean): void {
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
    // Plumas paradas del susto.
    for (const [x, y, c] of [
      [7, 12, 'r'], [6, 11, 'o'], [7, 15, 'e'], [6, 15, 'o'], [7, 18, 'e'], [6, 18, 'o'],
      [34, 12, 'E'], [35, 11, 'o'], [34, 15, 'E'], [35, 15, 'o'], [34, 18, 'E'], [35, 18, 'o'],
    ] as Array<[number, number, string]>) px(g, x, y, c)
  } else {
    px(g, 7, 19, 'o')
    px(g, 8, 19, 'e')
    px(g, 34, 19, 'o')
    px(g, 33, 19, 'E')
  }
}

// Piel blanca alrededor de los ojos, con las rayitas rojas del guacamayo (x 24..31, filas 13..21).
const PIEL = ['..WwwwW.', '.WWWWWWw', '.WWWWWWw', '.WWWWWWw', '.WWWWWWw', 'WlWlWWww', 'WWWWlWw.', '.lWlWw..', '..WWw...']
function piel(g: Grilla): void {
  bloque(g, 24, 13, PIEL)
  PIEL.forEach((f, j) => {
    for (let i = 0; i < f.length; i++) if (f[i] !== '.') px(g, 41 - (24 + i), 13 + j, f[i] === 'w' ? 'W' : f[i])
  })
}

// Ojo sano, 5 x 4 desde (26, 14).
const OJOS: Record<string, string[]> = {
  abierto: ['.ooo.', 'oMkyo', 'vykyv', '.vvv.'],
  mira: ['.ooo.', 'oMyyo', 'vkyyv', '.vvv.'],
  arriba: ['.oMo.', 'oykko', 'vyyyv', '.vvv.'],
  abajo: ['.ooo.', 'oyyyo', 'vMkyv', '.vvv.'],
  cerrado: ['.....', '.....', 'o...o', '.ooo.'],
  feliz: ['.....', '.ooo.', 'o...o', '.....'],
  grande: ['.ooo.', 'oyyyo', 'oyMyo', 'oykyo', '.ooo.'],
  entrecerrado: ['.....', 'ooooo', 'oyMko', '.ooo.'],
  enojado: ['o....', '.oo..', 'oyMko', '.ooo.'],
}
function ojo(g: Grilla, x0: number, y0: number, tipo: string, espejado: boolean): void {
  const filas = (OJOS[tipo] ?? OJOS.abierto).map(f => (espejado ? espejarFila(f) : f))
  bloque(g, x0, y0 - (tipo === 'grande' ? 1 : 0), filas)
}

function parche(g: Grilla, levantado: boolean): void {
  if (!levantado) {
    // Parche con una cruz bordada en oro; la tira se mete debajo del sombrero.
    px(g, 16, 13, 'k')
    px(g, 10, 13, 'k')
    px(g, 9, 12, 'k')
    bloque(g, 10, 13, ['.kkkkk.', 'kLKkkkk', 'kKGkGkk', 'kkkGkkk', 'kkGkGkk', '.kkkkk.'])
  } else {
    // Levantado sobre la frente: el ojo de abajo está perfecto.
    bloque(g, 10, 10, ['.kkkkk.', 'kLKGkGk', '.kkkGkk'])
    px(g, 9, 11, 'k')
    px(g, 17, 11, 'k')
  }
}

const PICOS: Record<string, string[]> = {
  cerrado: [
    '..wWWWWw..', '.oWkWWkwo.', '.oMmmmiIo.', 'omMmmiiiIo', 'ommiiiiIIo', 'omiiiiiIDo',
    'oKmiiiiDko', 'okomiiIoko', '.okomIoko.', '..oomIoo..', '....oo....',
  ],
  abierto: [
    '..wWWWWw..', '.oWkWWkwo.', '.oMmmmiIo.', 'omMmmiiiIo', '.omiiiiIo.', 'kkomiiIokk',
    'kVVomIoVVk', 'kVcVooVcVk', '.kVccccVk.', '..kVVVVk..', '...kkkk...',
  ],
  grito: [
    '..wWWWWw..', '.oWkWWkwo.', '.oMmmiIIo.', '.omiiiIDo.', 'kkomiIDokk', 'kVVVooVVVk',
    'kVcccccVVk', 'kVcCCCcVVk', 'kVccccccVk', '.kKVVVVKk.', '..kkkkkk..',
  ],
  silba: [
    '..wWWWWw..', '.oWkWWkwo.', '.oMmmmiIo.', 'omMmmiiiIo', 'ommiiiiIIo', 'omiiiiiIDo',
    'oKmiiiiDko', 'okomiiIoko', '.okoIDoko.', '..okVVko..', '...okko...',
  ],
}
function pico(g: Grilla, tipo: string): void {
  bloque(g, 16, 14, PICOS[tipo] ?? PICOS.cerrado)
}

// Tricornio de frente: copa con calavera, ribete de oro en V que baja de las puntas de los costados a la
// punta del frente, y el fieltro levantado debajo del ribete. Mitad izquierda por fórmula, la derecha espejo.
function sombrero(g: Grilla, caido: boolean): void {
  const d = caido ? 1 : 0
  const med = (x: number): number => (x <= 20 ? x : 41 - x)
  const oro = (x: number): number => Math.round(4 + ((med(x) - 1) * 7) / 19)
  const fondo = (x: number): number => Math.round(8 + ((med(x) - 1) * 3) / 19)
  const copa = (x: number): number => {
    const dx = Math.abs(x + 0.5 - 20.5)
    return dx < 5 ? 0 : dx < 7 ? 1 : dx < 8.5 ? 2 : dx < 9.5 ? 3 : dx < 10.5 ? 5 : 99
  }
  const H = 15
  const m: string[][] = Array.from({ length: H }, () => Array(ANCHO).fill(''))
  for (let x = 1; x <= 40; x++) {
    const o = oro(x)
    const f = fondo(x)
    const izq = x <= 20
    const dx = x + 0.5 - 20.5
    for (let y = copa(x); y < o && y < H; y++) {
      m[y][x] = dx > 9 ? 'n' : dx > 5 ? 'j' : dx < -7 ? (y < 4 && (x + y) % 2 ? 'B' : 'H') : dx < -3 ? 'H' : 'h'
    }
    m[o][x] = izq ? (x % 3 === 0 ? 'z' : 'Y') : 'g'
    if (o + 1 < H) m[o + 1][x] = izq ? 'g' : 'G'
    for (let y = o + 2; y <= f && y < H; y++) m[y][x] = izq ? (y === o + 2 && med(x) < 7 ? 'B' : 'H') : med(x) < 5 && y === o + 2 ? 'n' : 'j'
  }
  for (let y = 9; y <= 11; y++) {
    if (m[y][20]) m[y][20] = 'j'
    if (m[y][21]) m[y][21] = 'J'
  }
  const dentro = (x: number, y: number): boolean => y >= 0 && y < H && x >= 0 && x < ANCHO && m[y][x] !== ''
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < ANCHO; x++) {
      if (m[y][x]) px(g, x, y + d, m[y][x])
      else if (dentro(x - 1, y) || dentro(x + 1, y) || dentro(x, y - 1) || dentro(x, y + 1)) px(g, x, y + d, 'o')
    }
  }
  bloque(g, 16, 3 + d, ['W........W', '.W.WWWW.W.', '..WkWWkW..', '..WWvvWW..', '...WWWW...', '.W.wkwk.W.', 'W........W'])
  // Agujero de bala en la copa: se ve lo que hay detrás.
  g[3 + d][13] = '.'
  g[3 + d][14] = '.'
  px(g, 13, 2 + d, 'B')
  px(g, 15, 3 + d, 'J')
  px(g, 14, 4 + d, 'J')
}

function pluma(g: Grilla, f: number): void {
  // Pluma magenta con cañón claro y barbas, sale por detrás de la copa; se mece en dos cuadros.
  const filas = f
    ? ['..........ooo', '........oocCo', '.......ocCCfo', '......ocCfFFo', '.....ocCfFFo.', '....ocCfFXo..', '...ocfFFXo...', '..ocfFXo.....', '.ocfFXo......']
    : ['.........ooo.', '.......oocCo.', '......ocCCfo.', '.....ocCfFFo.', '....ocCfFFo..', '....ocfFXo...', '...ocfFXo....', '..ocfFXo.....', '.ocfFXo......']
  bloque(g, 29, 0, filas)
  px(g, 30, 8, 'z') // broche de oro
  px(g, 31, 8, 'g')
}

function aro(g: Grilla): void {
  bloque(g, 33, 16, ['.g', 'g.', 'Gz', '.G'])
}

// El rojo que toca el pico, el parche o la piel blanca se oscurece un tono: da volumen.
function sombraDeContacto(g: Grilla): void {
  const cerca = new Set(['o', 'k', 'W', 'w', 'l'])
  const cambios: Array<[number, number]> = []
  for (let y = 10; y <= 24; y++) {
    for (let x = 9; x <= 32; x++) {
      if (g[y][x] !== 'e') continue
      const vecinos = [g[y][x + 1], g[y][x - 1], g[y - 1]?.[x]]
      if (vecinos.some(v => cerca.has(v)) && (x + y) % 2 === 0) cambios.push([x, y])
    }
  }
  for (const [x, y] of cambios) g[y][x] = 'E'
  for (const [x, y] of [[10, 12], [11, 12], [9, 13], [9, 14], [9, 15]]) if (g[y][x] === 'e' || g[y][x] === 'r') g[y][x] = 'R'
}

// ---- Accesorios y efectos de cada emoción ----
const EXTRAS: Record<string, (g: Grilla, f: number) => void> = {
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
      px(g, x, y, 'z')
      px(g, x - 1, y, 'g')
      px(g, x + 1, y, 'g')
      px(g, x, y - 1, 'g')
      px(g, x, y + 1, 'g')
    }
  },
  grito: (g, f) => {
    for (const [x, y, dx] of [[12, 23, -1], [29, 23, 1], [11, 26, -1], [30, 26, 1]]) {
      for (let k = 0; k < 3; k++) px(g, x + dx * (k + f), y + (y < 25 ? -1 : 1) * Math.floor(k / 2), 'z')
    }
  },
  galleta: (g, f) => {
    bloque(g, 33, 8 + f, ['..oooo..', '.oWWWWo.', 'oW*%**Wo', 'oW*&*%Wo', 'oW%**&Wo', '.oWWWWo.', '..oooo..'])
  },
  // Catalejo de bronce apoyado en el ojo, apuntando a la derecha.
  catalejo: (g, f) => {
    bloque(g, 27, 13 - f, ['........ooooooo', 'oooooooqGgYzggo', 'oGgYzgqqGgggGGo', 'oooooooqGGGGGGo', '........ooooooo'])
  },
  // Sable en alto en el ala izquierda, cruzando por delante del ala del sombrero; un brillo corre por la hoja.
  sable: (g, f) => {
    bloque(g, 2, 0, ['.....o', '....!o', '....!?', '...!?.', '...!?.', '..!?..', '..!?..', '.!?...', 'gzG...', '.q....'])
    const brillo = [[6, 1], [5, 3], [4, 5]][f % 3]
    px(g, brillo[0], brillo[1], 'M')
  },
  ceja: g => {
    for (const [x, y] of [[25, 13], [26, 12], [27, 12], [28, 11], [29, 11]]) px(g, x, y, 'o')
  },
  enojo: (g, f) => {
    // La venita de enojo de las historietas, en magenta.
    bloque(g, 34 + f, 9, ['f.f', '.f.', 'f.f'])
  },
  humo: (g, f) => {
    for (const [x, y] of f ? [[13, 17], [12, 18], [11, 18], [28, 17], [29, 18], [30, 18]] : [[14, 17], [13, 17], [27, 17], [28, 17]]) px(g, x, y, '"')
  },
  vapor: (g, f) => {
    bloque(g, 6 - f, 0, ['."".', '"""" ', '.""'])
    bloque(g, 35 + f, 1, ['.""', '"""', '.".'])
  },
  lagrima: g => {
    bloque(g, 31, 17, ['+', '+'])
  },
  brillo: (g, f) => {
    const [x, y] = [[19, 26], [21, 27], [22, 26]][f % 3]
    px(g, x, y, 'M')
    px(g, x - 1, y, 'z')
    px(g, x + 1, y, 'z')
    px(g, x, y - 1, 'z')
    px(g, x, y + 1, 'z')
  },
  mapa: (g, f) => {
    bloque(g, 12, 22, [
      'oooooooooooooooooo',
      'o=##############=o',
      'o=#~~#####::####=o',
      'o=###~###::::###=o',
      'o=####~~~~~~' + (f ? '#' : '^') + '###=o',
      'o=##############=o',
      'oooooooooooooooooo',
    ])
  },
  dados: (g, f) => {
    const dado = (x: number, y: number, cara: number): void => {
      bloque(g, x, y, ['ooooo', 'oWWWo', 'oWWWo', 'oWWWo', 'ooooo'])
      const pips: Array<[number, number]> = cara === 1 ? [[2, 2]] : cara === 2 ? [[1, 1], [3, 3]] : cara === 3 ? [[1, 1], [2, 2], [3, 3]] : [[1, 1], [3, 1], [1, 3], [3, 3]]
      for (const [dx, dy] of pips) px(g, x + dx, y + dy, 'k')
    }
    if (f === 0) { dado(1, 10, 3); dado(4, 14, 4) }
    if (f === 1) { dado(2, 12, 2); dado(3, 9, 1) }
    if (f === 2) { dado(0, 13, 3); dado(3, 13, 3) }
  },
  notas: (g, f) => {
    const nota = (x: number, y: number, c: string): void => bloque(g, x, y, ['.' + c + c, '.' + c + '.', c + c + '.', c + c + '.'])
    if (f === 0) { nota(4, 15, 'z'); nota(1, 11, 'n') }
    if (f === 1) { nota(3, 13, 'n'); nota(0, 10, 'z') }
    if (f === 2) { nota(4, 11, 'z'); nota(1, 15, 'n') }
  },
  taza: (g, f) => {
    bloque(g, 8, 19, ['oooooo..', 'o;;;;o..', 'o$$$@ooo', 'o$$$@o.o', 'o$$$@ooo', 'oooooo..'])
    bloque(g, 9 + f, 16, ['.".', '"..', '.".'])
  },
  casa: (g, f) => {
    bloque(g, 33, 9 + f, [
      '..ooooo..',
      '.oWWWWWo.',
      'oWWWtWWWo',
      'oWWtTtWWo',
      'oWWW3WWWo',
      'oW::3::Wo',
      'o+++++++o',
      '.ooooooo.',
    ])
  },
  brujula: (g, f) => {
    bloque(g, 17, 22, ['.oooooo.', 'oGggggGo', 'ogWWWWgo', 'ogWWWWgo', 'ogWWWWgo', 'oGggggGo', '.oooooo.'])
    const agujas: Array<Array<[number, number, string]>> = [
      [[20, 24, '^'], [21, 25, 'k'], [20, 25, '^'], [21, 26, 'k']],
      [[19, 24, '^'], [20, 25, '^'], [21, 25, 'k'], [22, 26, 'k']],
      [[22, 24, '^'], [21, 25, '^'], [20, 25, 'k'], [19, 26, 'k']],
    ]
    for (const [x, y, c] of agujas[f % 3]) px(g, x, y, c)
  },
  bitacora: (g, f) => {
    bloque(g, 13, 23, ['oooooooooooooooo', 'oWWWWWWooWWWWWWo', 'oWwwwwWooWwwwWWo', 'oWWWWWWooWWWWWWo', 'oWwwwWWooWwww' + (f ? 'w' : 'W') + 'Wo', 'oVVVVVVVVVVVVVVo'])
    // Pluma de escribir en el ala derecha.
    bloque(g, 27 - f, 18 + f, ['...WW', '..WwW', '.Ww..', 'ok...'])
  },
  confeti: (g, f) => {
    const r = f ? [[3, 2, 'f'], [9, 6, 'n'], [36, 3, 'z'], [33, 8, 't'], [6, 11, 'z'], [38, 12, 'f'], [12, 1, 'n']] : [[4, 5, 'n'], [8, 1, 'z'], [37, 6, 'f'], [34, 1, 'n'], [5, 9, 'f'], [39, 9, 't'], [31, 4, 'z']]
    for (const [x, y, c] of r as Array<[number, number, string]>) {
      px(g, x, y, c)
      px(g, x + 1, y, c)
    }
  },
  estrellas: (g, f) => {
    for (const [x, y] of f ? [[10, 22], [31, 24], [36, 15]] : [[11, 26], [30, 22], [5, 15]]) {
      px(g, x, y, 'z')
      px(g, x - 1, y, 'Y')
      px(g, x + 1, y, 'Y')
      px(g, x, y - 1, 'Y')
      px(g, x, y + 1, 'Y')
    }
  },
  soplido: (g, f) => {
    for (const [x, y] of f ? [[25, 24], [27, 24], [28, 25]] : [[25, 23], [26, 24]]) px(g, x, y, '"')
    if (!f) bloque(g, 13, 11, ['+', '+'])
  },
  exclamacion: (g, f) => {
    bloque(g, 3, 10 + f, ['ooo', 'ozo', 'ozo', 'ozo', 'ooo', 'ozo', 'ooo'])
  },
  rayos: (g, f) => {
    const bolts = f === 0 ? [[3, 10], [36, 13]] : f === 1 ? [[5, 13], [35, 9]] : [[4, 8], [37, 16]]
    for (const [x, y] of bolts) bloque(g, x, y, ['/.', '//', './/', '..', '//'])
    // Hollín en el sombrero y la cara.
    for (const [x, y] of [[12, 12], [25, 12], [9, 16], [30, 20], [18, 6]]) px(g, x, y, '|')
  },
}

// ---- Armado ----
function loroLetras(o: Opciones): Grilla {
  const g = nueva()
  percha(g)
  run(g, 33, 19, 'uxuU') // puntas de la cola, debajo de la percha
  if (!o.alaIzq) alaPlegada(g, false)
  if (!o.alaDer) alaPlegada(g, true)
  pecho(g)
  if (o.alaIzq) flanco(g, false)
  if (o.alaDer) flanco(g, true)
  cabeza(g, o.erizada === true)
  piel(g)
  ojo(g, 26, 14, o.ojo ?? 'abierto', false)
  if (o.parche === 'levantado') ojo(g, 11, 14, o.ojoParche ?? 'abierto', true)
  pico(g, o.pico ?? 'cerrado')
  sombraDeContacto(g)
  patas(g)
  cangrejo(g, o.cangrejo ?? 0)
  aro(g)
  if (o.alaIzq) alaLevantada(g, false, o.alaIzq === 'baja')
  if (o.alaDer) alaLevantada(g, true, o.alaDer === 'baja')
  sombrero(g, o.sombreroCaido === true)
  pluma(g, o.pluma ?? 0)
  parche(g, o.parche === 'levantado')
  for (const [nombre, f] of o.extras ?? []) EXTRAS[nombre]?.(g, f)
  return g
}

type Cuadro = [Opciones, number]

// Las 31 emociones: cada una es una lista de cuadros (opciones, segundos). El primero de cada una es distinto
// de los primeros de las demás, así el arte quieto también se distingue.
const CUADROS: Record<string, Cuadro[]> = {
  aburrido: [
    [{}, 2.6], [{ pluma: 1 }, 0.5], [{ ojo: 'cerrado', pluma: 1 }, 0.14], [{ pluma: 1 }, 1.2],
    [{ ojo: 'mira' }, 1.2], [{ cangrejo: 1 }, 0.4], [{}, 0.4], [{ cangrejo: 1 }, 0.4],
  ],
  dormido: [
    [{ ojo: 'cerrado', sombreroCaido: true, extras: [['zetas', 0]] }, 1.2],
    [{ ojo: 'cerrado', sombreroCaido: true, pluma: 1, extras: [['zetas', 1]] }, 1.2],
  ],
  pensando: [
    [{ ojo: 'cerrado', alaDer: 'arriba', extras: [['catalejo', 0]] }, 1.4],
    [{ ojo: 'cerrado', alaDer: 'arriba', extras: [['catalejo', 1]] }, 1.4],
    [{ ojo: 'cerrado', alaDer: 'arriba', pluma: 1, extras: [['catalejo', 0]] }, 1],
  ],
  caceria: [
    [{ ojo: 'enojado', alaIzq: 'arriba', extras: [['sable', 0]] }, 0.4],
    [{ ojo: 'enojado', alaIzq: 'arriba', extras: [['sable', 1]] }, 0.4],
    [{ ojo: 'enojado', alaIzq: 'arriba', pluma: 1, extras: [['sable', 2]] }, 0.4],
  ],
  sospecha: [
    [{ ojo: 'entrecerrado', extras: [['ceja', 0]] }, 2],
    [{ ojo: 'entrecerrado', pluma: 1, extras: [['ceja', 0]] }, 0.6],
    [{ ojo: 'mira' }, 0.8],
  ],
  ruge: [
    [{ ojo: 'enojado', pico: 'grito', extras: [['grito', 0]] }, 0.16],
    [{ ojo: 'enojado', pico: 'grito', pluma: 1, extras: [['grito', 1]] }, 0.16],
  ],
  molesto: [[{ ojo: 'enojado', extras: [['enojo', 0]] }, 0.6], [{ ojo: 'enojado', extras: [['enojo', 1]] }, 0.6]],
  bufido: [
    [{ ojo: 'enojado', extras: [['humo', 0]] }, 0.4], [{ ojo: 'enojado', pluma: 1, extras: [['humo', 1]] }, 0.4], [{ ojo: 'enojado' }, 0.6],
  ],
  contento: [[{ ojo: 'feliz', pico: 'abierto' }, 0.6], [{ ojo: 'feliz', pluma: 1 }, 0.5]],
  bostezo: [
    [{ ojo: 'cerrado', pico: 'grito', extras: [['lagrima', 0]] }, 1.2], [{ ojo: 'cerrado', pico: 'abierto' }, 0.4], [{ ojo: 'entrecerrado' }, 1],
  ],
  estira: [
    [{ ojo: 'cerrado', alaIzq: 'arriba', alaDer: 'arriba' }, 0.9],
    [{ ojo: 'cerrado', alaIzq: 'arriba', alaDer: 'arriba', pico: 'abierto' }, 0.6],
    [{ ojo: 'entrecerrado' }, 0.8],
  ],
  riega: [
    [{ ojo: 'abajo', extras: [['brillo', 0]] }, 0.4], [{ ojo: 'abajo', extras: [['brillo', 1]] }, 0.4], [{ ojo: 'abajo', pluma: 1, extras: [['brillo', 2]] }, 0.4],
  ],
  diario: [[{ ojo: 'abajo', extras: [['mapa', 0]] }, 1.6], [{ ojo: 'abajo', pluma: 1, extras: [['mapa', 1]] }, 1.2]],
  solitario: [
    [{ ojo: 'arriba', alaDer: 'arriba', extras: [['dados', 0]] }, 0.35],
    [{ ojo: 'arriba', alaDer: 'baja', extras: [['dados', 1]] }, 0.35],
    [{ ojo: 'abajo', alaDer: 'arriba', extras: [['dados', 2]] }, 1.2],
  ],
  silba: [
    [{ ojo: 'entrecerrado', pico: 'silba', extras: [['notas', 0]] }, 0.5],
    [{ ojo: 'entrecerrado', pico: 'silba', pluma: 1, extras: [['notas', 1]] }, 0.5],
    [{ ojo: 'entrecerrado', pico: 'silba', extras: [['notas', 2]] }, 0.5],
  ],
  guina: [
    [{ parche: 'levantado', ojoParche: 'abierto' }, 0.7], [{ parche: 'levantado', ojoParche: 'feliz', pico: 'abierto' }, 0.5],
    [{ parche: 'levantado', ojoParche: 'abierto' }, 0.3], [{}, 1.4],
  ],
  manana: [
    [{ ojo: 'entrecerrado', alaIzq: 'arriba', extras: [['taza', 0]] }, 0.8],
    [{ ojo: 'entrecerrado', alaIzq: 'arriba', extras: [['taza', 1]] }, 0.8],
  ],
  hambre: [[{ ojo: 'arriba', extras: [['galleta', 0]] }, 0.9], [{ ojo: 'arriba', pluma: 1, extras: [['galleta', 1]] }, 0.9]],
  casa: [[{ ojo: 'arriba', extras: [['casa', 0]] }, 1], [{ ojo: 'arriba', pluma: 1, extras: [['casa', 1]] }, 1]],
  concentrado: [
    [{ ojo: 'abajo', extras: [['brujula', 0]] }, 0.5], [{ ojo: 'abajo', extras: [['brujula', 1]] }, 0.5], [{ ojo: 'abajo', extras: [['brujula', 2]] }, 0.5],
  ],
  tipea: [
    [{ ojo: 'abajo', alaDer: 'arriba', extras: [['bitacora', 0]] }, 0.25], [{ ojo: 'abajo', alaDer: 'arriba', extras: [['bitacora', 1]] }, 0.25],
  ],
  multitarea: [
    [{ ojo: 'grande', alaDer: 'arriba', extras: [['catalejo', 0]] }, 0.3],
    [{ ojo: 'grande', extras: [['mapa', 0]] }, 0.3],
    [{ ojo: 'grande', alaIzq: 'arriba', extras: [['taza', 0]] }, 0.3],
    [{ ojo: 'grande', extras: [['brujula', 1]] }, 0.3],
  ],
  festeja: [
    [{ ojo: 'feliz', pico: 'abierto', alaIzq: 'arriba', alaDer: 'arriba', extras: [['confeti', 0]] }, 0.3],
    [{ ojo: 'feliz', pico: 'abierto', alaIzq: 'baja', alaDer: 'baja', pluma: 1, extras: [['confeti', 1]] }, 0.3],
  ],
  aplaude: [
    [{ ojo: 'feliz', alaIzq: 'arriba', alaDer: 'arriba', extras: [['chispas', 0]] }, 0.18],
    [{ ojo: 'feliz', alaIzq: 'baja', alaDer: 'baja', extras: [['chispas', 1]] }, 0.18],
  ],
  orgullo: [
    [{ ojo: 'feliz', extras: [['estrellas', 0], ['brillo', 0]] }, 0.8],
    [{ ojo: 'feliz', pluma: 1, extras: [['estrellas', 1], ['brillo', 1]] }, 0.8],
    [{ parche: 'levantado', ojoParche: 'feliz' }, 0.4],
  ],
  alivio: [[{ ojo: 'cerrado', extras: [['soplido', 0]] }, 0.8], [{ ojo: 'cerrado', extras: [['soplido', 1]] }, 0.8], [{ ojo: 'feliz' }, 1]],
  panico: [
    [{ ojo: 'grande', pico: 'grito', erizada: true, extras: [['gotas', 0]] }, 0.18],
    [{ ojo: 'grande', pico: 'abierto', erizada: true, pluma: 1, extras: [['gotas', 1]] }, 0.18],
  ],
  frustrado: [
    [{ ojo: 'enojado', extras: [['vapor', 0]] }, 0.5], [{ ojo: 'enojado', erizada: true, extras: [['vapor', 1]] }, 0.5],
  ],
  chispazo: [
    [{ ojo: 'grande', erizada: true, extras: [['rayos', 0]] }, 0.12],
    [{ ojo: 'grande', erizada: true, extras: [['rayos', 1]] }, 0.12],
    [{ ojo: 'cerrado', erizada: true, extras: [['rayos', 2]] }, 0.3],
  ],
  saluda: [
    [{ ojo: 'feliz', alaDer: 'arriba' }, 0.3], [{ ojo: 'feliz', alaDer: 'baja' }, 0.3], [{ ojo: 'feliz', alaDer: 'arriba' }, 0.3],
    [{ parche: 'levantado', ojoParche: 'feliz', alaDer: 'baja' }, 0.5],
  ],
  sorpresa: [
    [{ ojo: 'grande', pico: 'abierto', extras: [['exclamacion', 0]] }, 0.4],
    [{ ojo: 'grande', pico: 'abierto', extras: [['exclamacion', 1]] }, 0.4],
  ],
}

// ---- SVG ----

// Pinta una grilla como rectángulos horizontales agrupados por color (un path por color).
function caminos(g: Grilla, s: number): string {
  const porColor: Record<string, string> = {}
  for (let y = 0; y < g.length; y++) {
    let x = 0
    while (x < g[y].length) {
      const c = g[y][x]
      if (c === '.' || !PALETA[c]) {
        x++
        continue
      }
      let x2 = x
      while (x2 + 1 < g[y].length && g[y][x2 + 1] === c) x2++
      const w = (x2 - x + 1) * s
      porColor[c] = (porColor[c] || '') + `M${x * s} ${y * s}h${w}v${s}h-${w}z`
      x = x2 + 1
    }
  }
  return Object.keys(porColor)
    .map(c => `<path fill="${PALETA[c]}" d="${porColor[c]}"/>`)
    .join('')
}

function num(n: number): string {
  return String(Math.round(n * 1000) / 1000)
}

// Cuerpo de una emoción: lo que no cambia va una vez; cada cuadro agrega solo sus píxeles propios.
function cuerpoEmocion(emocion: string, s: number, quieto: boolean): string {
  const lista = (CUADROS[emocion] ?? CUADROS.aburrido).map(([o, d]) => [loroLetras(o), d] as [Grilla, number])
  if (quieto || lista.length < 2) return caminos(lista[0][0], s)
  const fijo = nueva()
  for (let y = 0; y < ALTO; y++) {
    for (let x = 0; x < ANCHO; x++) {
      const c = lista[0][0][y][x]
      if (c !== '.' && lista.every(([g]) => g[y][x] === c)) fijo[y][x] = c
    }
  }
  const total = lista.reduce((a, c) => a + c[1], 0)
  let t = 0
  let out = caminos(fijo, s)
  lista.forEach(([g, d], i) => {
    const propio = g.map((f, y) => f.map((c, x) => (fijo[y][x] === '.' ? c : '.')))
    const t0 = t / total
    const t1 = (t + d) / total
    t += d
    let tiempos: number[]
    let valores: string[]
    if (i === 0) {
      tiempos = [0, t1, 1]
      valores = ['visible', 'hidden', 'hidden']
    } else if (i === lista.length - 1) {
      tiempos = [0, t0, 1]
      valores = ['hidden', 'visible', 'visible']
    } else {
      tiempos = [0, t0, t1, 1]
      valores = ['hidden', 'visible', 'hidden', 'hidden']
    }
    out +=
      `<g${i === 0 ? '' : ' visibility="hidden"'}>${caminos(propio, s)}` +
      `<animate attributeName="visibility" calcMode="discrete" values="${valores.join(';')}" keyTimes="${tiempos.map(num).join(';')}" dur="${num(total)}s" repeatCount="indefinite"/></g>`
  })
  return out
}

function abrirSvg(s: number, cuerpo: string, fondo?: string): string {
  const w = ANCHO * s
  const h = ALTO * s
  const bg = typeof fondo === 'string' && /^#[0-9a-fA-F]{6}$/.test(fondo) ? `<rect width="${w}" height="${h}" fill="${fondo}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${bg}${cuerpo}</svg>`
}

// Devuelve el SVG del loro para una emoción. Lienzo de 42 x 34 unidades por `escala` px (con o sin `marco`).
// opts.dormirEn: segundos hasta que el loro que mira el horizonte se duerme (solo para 'aburrido').
// opts.quieto: solo el primer cuadro, sin animaciones.
export function caraRobotSvg(emocion: string, escala: number, opts?: { dormirEn?: number; quieto?: boolean; fondo?: string; marco?: boolean }): string {
  const n = typeof escala === 'number' && Number.isFinite(escala) ? Math.round(escala) : 3
  const s = Math.max(1, Math.min(8, n))
  const e = EMOCIONES.includes(emocion) ? emocion : 'aburrido'
  const quieto = opts?.quieto === true
  const dormirEn = opts?.dormirEn
  if (e === 'aburrido' && typeof dormirEn === 'number' && Number.isFinite(dormirEn)) {
    const x = Math.round(dormirEn)
    if (x <= 0) return caraRobotSvg('dormido', s, { quieto, fondo: opts?.fondo })
    if (!quieto) {
      const cuerpo =
        `<g>${cuerpoEmocion('aburrido', s, false)}<set attributeName="visibility" to="hidden" begin="${x}s" fill="freeze"/></g>` +
        `<g visibility="hidden">${cuerpoEmocion('dormido', s, false)}<set attributeName="visibility" to="visible" begin="${x}s" fill="freeze"/></g>`
      return abrirSvg(s, cuerpo, opts?.fondo)
    }
  }
  return abrirSvg(s, cuerpoEmocion(e, s, quieto), opts?.fondo)
}

// Para el boceto y la vista previa: la grilla de colores de un cuadro y los cuadros de cada emoción.
export function loroColores(o: Opciones): Array<Array<string | null>> {
  return loroLetras(o).map(f => f.map(c => (c === '.' ? null : PALETA[c] ?? null)))
}
export function cuadrosDe(emocion: string): Cuadro[] {
  return CUADROS[emocion] ?? CUADROS.aburrido
}
