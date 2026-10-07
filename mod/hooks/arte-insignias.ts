// Insignias de la skin «Piratas»: los íconos de rol (16 x 16) y las banderas de los equipos (24 x 24),
// en vez de los íconos y las placas de oficina de arte-iconos.ts. Mismos nombres que allá para lo que es
// dibujo (glifoSvg, diosSvg, glifoMatriz, diosMatriz, DIOSES_EQUIPO); los colores de los equipos, los tipos
// y tipoDeAgente siguen en arte-iconos.ts (la copia de EQUIPO_ACENTO de acá se prueba igual a la de allá).
// Modulo puro, sin imports: devuelve strings SVG estaticos.

const EQUIPO_ACENTO: Record<string, [string, string]> = {
  base: ['#8a93a0', '#555d69'],
  direccion: ['#b08d57', '#6f5530'],
  research: ['#5aa9e6', '#2f6ea3'],
  librarian: ['#8a6fb0', '#533f75'],
  datos: ['#2cc6d0', '#16777d'],
  'dev-a1': ['#f08a24', '#9c4f0c'],
  'dev-tablero': ['#2f4fbf', '#1c2f78'],
  seguridad: ['#d04a3c', '#8a2a20'],
  mantenimiento: ['#e6bf2e', '#9c7a10'],
  limpieza: ['#9ac83a', '#5e7f18'],
  facilities: ['#e070a8', '#93355f'],
  arquitectura: ['#8b5e3c', '#523520'],
}
export const ACENTO_INSIGNIAS = EQUIPO_ACENTO

// Nombre de la bandera de cada equipo y lo que hace (el panel muestra «equipo x · bandera · tarea»).
export const DIOSES_EQUIPO: Record<string, { dios: string; lema: string }> = {
  base: { dios: 'Calavera y huesos', lema: 'hace el trabajo' },
  direccion: { dios: 'Sombrero de capitán', lema: 'decide el rumbo' },
  research: { dios: 'Catalejos cruzados', lema: 'explora' },
  librarian: { dios: 'Libro abierto', lema: 'guarda lo que se sabe' },
  datos: { dios: 'Barras que suben', lema: 'mide' },
  seguridad: { dios: 'Sables cruzados', lema: 'cuida el barco' },
  mantenimiento: { dios: 'Llaves cruzadas', lema: 'arregla' },
  limpieza: { dios: 'Escobas cruzadas', lema: 'deja la cubierta impecable' },
  facilities: { dios: 'Llaves de bodega', lema: 'hace que todo funcione' },
  arquitectura: { dios: 'Compás y escuadra', lema: 'diseña los espacios' },
  'dev-a1': { dios: 'Llaves de código', lema: 'construye' },
  'dev-tablero': { dios: 'Código del loro', lema: 'construye' },
}

const PAL: Record<string, string> = {
  O: '#140c1c', // contorno
  S: '#241845', // placa de noche
  s: '#1a1230',
  W: '#fff6e0', // hueso
  w: '#d9cbb5',
  K: '#140c1c',
  G: '#f2b632', // oro
  g: '#b8771a',
  Y: '#fff3a8',
  M: '#9c6a3a', // madera
  m: '#5e3a22',
  R: '#e8443a', // rojo
  B: '#7ab8ff', // vidrio
  P: '#f0e2c0', // pergamino
  p: '#c9a96a',
  t: '#3fae6a', // isla
  F: '#ff2e88', // magenta
  C: '#d8e0ee', // acero
  c: '#7a8494',
  N: '#21e6c1', // neón
}

// Marco 16x16: placa de noche con borde del color del equipo y remaches de oro.
const MARCO: string[] = [
  '..OOOOOOOOOOOO..',
  '.OGAAAAAAAAAAGO.',
  'OGaSSSSSSSSSSaGO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OASSSSSSSSSSSSaO',
  'OGassssssssssaGO',
  '.OGaaaaaaaaaaGO.',
  '..OOOOOOOOOOOO..',
]

// Motivos 10x10, se pegan en (3,3) del marco.
const MOTIVOS: Record<string, string[]> = {
  // pluma de escribir sobre un pergamino
  escriba: ['.......FF.', '......FWFF', '.....FWFF.', '....FWFF..', 'ppp.WFF...', 'pPPKWPPPp.', 'pPKPPPPPp.', 'pPPPwwPPp.', 'pPwwwPPPp.', '.ppppppp..'],
  // catalejo de bronce
  vidente: ['.......ggg', '......gYBg', '.....gYGBg', '....gYGgg.', '...gYGg...', '..ggGg....', '.gYGg.....', 'gYGg......', 'gGg.......', '.g........'],
  // ancla
  guardian: ['...cCCc...', '...C..C...', '...cCCc...', '.cCCCCCCc.', '....CC....', '....CC....', 'C...CC...C', 'Cc..CC..cC', '.CCcCCcCC.', '..CCCCCC..'],
  // botiquín de a bordo
  curandero: ['...mmmm...', '...m..m...', 'mmmmmmmmmm', 'mMMMRRMMMm', 'mMMMRRMMMm', 'mMRRRRRRMm', 'mMRRRRRRMm', 'mMMMRRMMMm', 'mMMMRRMMMm', 'mmmmmmmmmm'],
  // reloj de arena
  pm: ['MMMMMMMMMM', '.GBBBBBBG.', '..GBYYBG..', '...GYYG...', '....GG....', '....GG....', '...GBYG...', '..GBYYYG..', '.GYYYYYYG.', 'MMMMMMMMMM'],
  // mapa del tesoro con su cruz
  estratega: ['pPPPPPPPPp', 'PttPPPPPPP', 'PtttPFPPPP', 'PPtPFPPPPP', 'PPPFPPPPPP', 'PPPPFFPPPP', 'PPPPPPFRPR', 'PPPPPPPPRP', 'PPPPPPPRPR', 'pPPPPPPPPp'],
}

function entero(valor: unknown, porDefecto: number, min: number, max: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return porDefecto
  return Math.max(min, Math.min(max, Math.round(n)))
}

function acentoDe(equipo: string): [string, string] {
  return Object.prototype.hasOwnProperty.call(EQUIPO_ACENTO, equipo) ? EQUIPO_ACENTO[equipo] : EQUIPO_ACENTO.base
}

// Marco 16x16 con el motivo del tipo pegado en (3,3). Tipo desconocido: escriba.
export function glifoMatriz(tipo: string): string[] {
  const motivo = Object.prototype.hasOwnProperty.call(MOTIVOS, tipo) ? MOTIVOS[tipo] : MOTIVOS.escriba
  const filas = MARCO.map(f => f.split(''))
  for (let j = 0; j < motivo.length; j++) {
    for (let i = 0; i < motivo[j].length; i++) if (motivo[j][i] !== '.') filas[3 + j][3 + i] = motivo[j][i]
  }
  return filas.map(f => f.join(''))
}

// ---- Banderas 24x24 ----

type Rejilla = string[][]

function pon(g: Rejilla, x: number, y: number, c: string): void {
  if (y >= 0 && y < 24 && x >= 0 && x < 24) g[y][x] = c
}
function linea(g: Rejilla, x0: number, y0: number, x1: number, y1: number, c: string): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let k = 0; k <= n; k++) pon(g, Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c)
}
function sello(g: Rejilla, x0: number, y0: number, filas: string[]): void {
  filas.forEach((f, j) => {
    for (let i = 0; i < f.length; i++) if (f[i] !== '.') pon(g, x0 + i, y0 + j, f[i])
  })
}

// Un par cruzado debajo de la calavera: `cuerpo` es el color del palo y `punta` dibuja cada extremo.
function cruzados(g: Rejilla, cuerpo: string, punta: (x: number, y: number, arriba: boolean, izq: boolean) => void): void {
  linea(g, 7, 9, 16, 15, cuerpo)
  linea(g, 16, 9, 7, 15, cuerpo)
  punta(7, 9, true, true)
  punta(16, 9, true, false)
  punta(7, 15, false, true)
  punta(16, 15, false, false)
}

const EMBLEMAS: Record<string, (g: Rejilla) => void> = {
  base: g => cruzados(g, 'W', (x, y) => sello(g, x - 1, y - 1, ['W.W', '.W.', 'W.W'])),
  seguridad: g =>
    cruzados(g, 'C', (x, y, arriba) => {
      if (!arriba) sello(g, x - 1, y - 1, ['GGG', '.g.', '.g.'])
    }),
  research: g =>
    cruzados(g, 'G', (x, y, arriba) => {
      pon(g, x, y, arriba ? 'B' : 'g')
      pon(g, x + (arriba ? 0 : 0), y + (arriba ? -1 : 1), 'Y')
    }),
  mantenimiento: g =>
    cruzados(g, 'c', (x, y, arriba) => {
      if (arriba) sello(g, x - 1, y - 1, ['C.C', 'CCC', '.C.'])
    }),
  limpieza: g =>
    cruzados(g, 'M', (x, y, arriba) => {
      if (!arriba) sello(g, x - 1, y - 1, ['YYY', 'YYY', 'Y.Y'])
    }),
  facilities: g =>
    cruzados(g, 'G', (x, y, arriba) => {
      if (arriba) sello(g, x - 1, y - 1, ['GGG', 'G.G', 'GGG'])
      else sello(g, x - 1, y, ['GG.'])
    }),
  arquitectura: g => {
    // Compás abierto y una escuadra.
    linea(g, 11, 9, 8, 15, 'C')
    linea(g, 12, 9, 15, 15, 'C')
    sello(g, 10, 8, ['GGGG'])
    sello(g, 15, 10, ['G...', 'G...', 'G...', 'GGGG'])
  },
  direccion: g => {
    // Sombrero de capitán sobre la calavera y huesos de oro.
    sello(g, 7, 0, ['...GGG....', '..GmmmG...', 'GGGGGGGGGG'])
    cruzados(g, 'G', (x, y) => sello(g, x - 1, y - 1, ['G.G', '.G.', 'G.G']))
  },
  librarian: g => sello(g, 6, 9, ['.WWWW.WWWW.', 'WwwWWAWWwwW', 'WWWWWAWWWWW', 'WwwwWAWwwwW', 'WWWWWAWWWWW', 'AAAAAAAAAAA']),
  datos: g => sello(g, 7, 9, ['........A.', '......A.A.', '....A.A.A.', '..A.A.A.A.', 'A.A.A.A.A.', 'AAAAAAAAAA']),
  'dev-a1': g => {
    sello(g, 4, 3, ['.A', 'A.', 'A.', '.A'])
    sello(g, 18, 3, ['A.', '.A', '.A', 'A.'])
    cruzados(g, 'A', () => undefined)
  },
  'dev-tablero': g => sello(g, 6, 10, ['..A.....A..', '.A...A...A.', 'A...A.....A', '.A.A.....A.', '..A.....A..']),
}

const CALAVERA = ['.WWWWW.', 'WWWWWWW', 'WKKWKKW', 'WWWvWWW', '.WWWWW.', '.WKWKW.']

// Las 24 filas de la bandera del equipo (flameando). Equipo desconocido: base.
export function diosMatriz(equipo: string): string[] {
  const eq = Object.prototype.hasOwnProperty.call(EMBLEMAS, equipo) ? equipo : 'base'
  // Tela plana de 19 x 16, con borde deshilachado y un agujero de bala.
  const tela: Rejilla = Array.from({ length: 24 }, () => Array(24).fill('.'))
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 19; x++) {
      if (x === 18 && y % 4 === 1) continue
      if (x === 17 && y === 12) continue
      tela[y][x] = y === 0 || y === 15 ? 'O' : 'S'
    }
  }
  const lienzo: Rejilla = Array.from({ length: 24 }, () => Array(24).fill('.'))
  // La calavera y el emblema se dibujan sobre la tela plana (corrida 2 a la izquierda) y después flamea.
  const plana: Rejilla = tela.map(f => f.slice())
  const dibujo: Rejilla = Array.from({ length: 24 }, () => Array(24).fill('.'))
  sello(dibujo, 9, 2, CALAVERA)
  EMBLEMAS[eq](dibujo)
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 19; x++) {
      const d = dibujo[y][x + 2]
      if (d !== '.' && plana[y][x] === 'S') plana[y][x] = d
    }
  }
  // Mástil con remate de oro.
  for (let y = 2; y < 24; y++) {
    pon(lienzo, 1, y, 'M')
    pon(lienzo, 2, y, 'm')
  }
  pon(lienzo, 1, 1, 'G')
  pon(lienzo, 2, 1, 'G')
  pon(lienzo, 1, 0, 'Y')
  for (let x = 0; x < 19; x++) {
    // Flamea solo la punta (x >= 15): la calavera y el emblema quedan enteros.
    const fase = x / 3.2
    const off = x >= 15 ? Math.round(Math.sin(fase + 1) * ((x - 13) / 4)) : 0
    const luz = Math.cos(fase) > 0.75
    for (let y = 0; y < 16; y++) {
      const c = plana[y][x]
      if (c === '.') continue
      pon(lienzo, 3 + x, 3 + y + off, c === 'S' && luz ? 's' : c)
    }
  }
  return lienzo.map(f => f.join(''))
}

// Un <path> por color, con tramos horizontales de coordenadas enteras.
function pathsDeMatriz(filas: string[], paleta: Record<string, string>, escala: number): string {
  const porColor: Record<string, string> = {}
  for (let y = 0; y < filas.length; y++) {
    const fila = filas[y]
    let x = 0
    while (x < fila.length) {
      const ch = fila[x]
      let fin = x + 1
      while (fin < fila.length && fila[fin] === ch) fin++
      if (paleta[ch]) porColor[ch] = (porColor[ch] ?? '') + `M${x * escala} ${y * escala}h${(fin - x) * escala}v${escala}h${-(fin - x) * escala}z`
      x = fin
    }
  }
  return Object.keys(porColor)
    .map(ch => `<path d="${porColor[ch]}" fill="${paleta[ch]}"/>`)
    .join('')
}

// SVG del ícono de rol, de 16*escala px. Escala entera acotada a 1..8 (no numérica: 1).
export function glifoSvg(tipo: string, equipo: string, escala: number): string {
  const e = entero(escala, 1, 1, 8)
  const t = Object.prototype.hasOwnProperty.call(MOTIVOS, tipo) ? tipo : 'escriba'
  const [A, a] = acentoDe(equipo)
  const lado = 16 * e
  const cuerpo = pathsDeMatriz(glifoMatriz(t), { ...PAL, A, a }, e)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges">${cuerpo}</svg>`
}

function acentoValido(a: unknown): a is [string, string] {
  return Array.isArray(a) && a.length >= 2 && a.slice(0, 2).every(c => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c))
}

// SVG de la bandera del equipo, de 24*escala px. Escala entera acotada a 1..8 (no numérica: 1).
export function diosSvg(equipo: string, escala: number, acento: [string, string]): string {
  const e = entero(escala, 1, 1, 8)
  const [A, b] = acentoValido(acento) ? acento : EQUIPO_ACENTO.base
  const lado = 24 * e
  const cuerpo = pathsDeMatriz(diosMatriz(equipo), { ...PAL, A, b }, e)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges">${cuerpo}</svg>`
}
