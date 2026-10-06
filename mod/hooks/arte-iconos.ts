// Iconos de oficina: 6 iconos de 16x16 por tipo de agente (marco con el color del equipo) y
// 12 placas de 24x24 por equipo o area del edificio (un objeto de oficina). Mismos exports que
// arte-glifos y arte-dioses. Modulo puro, sin imports: devuelve strings SVG estaticos.

export const TIPOS_GLIFO = ['escriba', 'vidente', 'guardian', 'curandero', 'pm', 'estratega']

export const TIPO_NOMBRE: Record<string, string> = {
  escriba: 'Redacción',
  vidente: 'Investigación',
  guardian: 'Control',
  curandero: 'Reparación',
  pm: 'Agenda',
  estratega: 'Estrategia',
}

// Acento y acento oscuro del marco o la placa, por equipo (12 tonos que se distinguen).
export const EQUIPO_ACENTO: Record<string, [string, string]> = {
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

export const DIOSES_EQUIPO: Record<string, { dios: string; lema: string }> = {
  base: { dios: 'Caja de herramientas', lema: 'hace el trabajo' },
  direccion: { dios: 'Maletín', lema: 'decide el rumbo' },
  research: { dios: 'Binoculares', lema: 'explora' },
  librarian: { dios: 'Archivero', lema: 'guarda lo que se sabe' },
  datos: { dios: 'Gráfico de barras', lema: 'mide' },
  seguridad: { dios: 'Casco y cámara', lema: 'cuida el edificio' },
  mantenimiento: { dios: 'Llave y engranaje', lema: 'arregla' },
  limpieza: { dios: 'Balde y trapeador', lema: 'deja todo impecable' },
  facilities: { dios: 'Llavero de puertas', lema: 'hace que todo funcione' },
  arquitectura: { dios: 'Plano y escuadra', lema: 'diseña los espacios' },
  'dev-a1': { dios: 'Computadora', lema: 'construye' },
  'dev-tablero': { dios: 'Computadora', lema: 'construye' },
}

const PAL_ICONO: Record<string, string> = {
  O: '#1c120a',
  S: '#efdcae',
  s: '#c9a66c',
  K: '#2a1a10',
  W: '#ffffff',
  G: '#8a9099',
  A: '#8a93a0',
  a: '#555d69',
}

const PAL_PLACA: Record<string, string> = {
  O: '#1c120a',
  W: '#ffffff',
  K: '#2a2f38',
  G: '#aab1bb',
  g: '#6d7480',
  Y: '#f2c230',
  y: '#a87818',
  R: '#c8322a',
  B: '#7fd0ff',
  C: '#f3e2b8',
  c: '#c9a66c',
  M: '#8a5a2b',
  A: '#8a93a0',
  a: '#555d69',
}

// Marco 16x16 (papel con borde del color del equipo).
const MARCO: string[] = [
  '..OOOOOOOOOOOO..',
  '.OAAAAAAAAAAAAO.',
  'OAaSSSSSSSSSSaAO',
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
  'OAasssssssssssaO',
  '.OaaaaaaaaaaaaO.',
  '..OOOOOOOOOOOO..',
]

// Motivos 10x10, se pegan en (3,3) del marco.
const MOTIVOS: Record<string, string[]> = {
  // maquina de escribir
  escriba: [
    '..KKKKKK..',
    '..KWWWWK..',
    '..KWKKWK..',
    'KKKKKKKKKK',
    'KGGGGGGGGK',
    'KGWGWGWGWK',
    'KGGGGGGGGK',
    'KAAAAAAAAK',
    'KaaaaaaaaK',
    '.KKKKKKKK.',
  ],
  // lupa sobre un papel
  vidente: [
    'KKKKKKK...',
    'KWWWWWK...',
    'KWsssWK...',
    'KsWKKKKKK.',
    'KWWKAWAAK.',
    'KKKKAAAAK.',
    '...KAAAAK.',
    '...KKKKKK.',
    '........KK',
    '.........K',
  ],
  // escudo con tilde
  guardian: [
    '.KKKKKKKK.',
    'KAAAAAAAAK',
    'KAAAAAAWAK',
    'KAWAAAWAAK',
    'KAAWAWAAaK',
    '.KAAWAAaK.',
    '.KAAAAaaK.',
    '..KAAaaK..',
    '...KaaK...',
    '....KK....',
  ],
  // llave inglesa con una curita
  curandero: [
    'KGGK..KGGK',
    'KGGKKKKGGK',
    '.KGGGGGGK.',
    '..KKGGKK..',
    'KKKKKKKKKK',
    'KAAKWWKAAK',
    'KKKKKKKKKK',
    '...KGGK...',
    '...KGGK...',
    '....KK....',
  ],
  // carpeta con calendario
  pm: [
    '.KKKK.....',
    'KsssKKKKKK',
    'KssssssssK',
    'KsKAAAAKsK',
    'KsKWWWWKsK',
    'KsKWAWAKsK',
    'KsKWWWWKsK',
    'KsKAWAWKsK',
    'KsKKKKKKsK',
    'KKKKKKKKKK',
  ],
  // pizarra con flecha que sube
  estratega: [
    'KKKKKKKKKK',
    'KWWWWWAAAK',
    'KWWWWWWAAK',
    'KWWWWWAWAK',
    'KWWWWAWWWK',
    'KWAWAWWWWK',
    'KWWAWWWWWK',
    'KKKKKKKKKK',
    '..K....K..',
    '.KK....KK.',
  ],
}

function entero(valor: unknown, porDefecto: number, min: number, max: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return porDefecto
  return Math.max(min, Math.min(max, Math.round(n)))
}

// Marco 16x16 con el motivo del tipo pegado en (3,3). Tipo desconocido: escriba.
export function glifoMatriz(tipo: string): string[] {
  const motivo = Object.prototype.hasOwnProperty.call(MOTIVOS, tipo) ? MOTIVOS[tipo] : MOTIVOS.escriba
  const filas = MARCO.map(f => f.split(''))
  for (let j = 0; j < motivo.length; j++) {
    for (let i = 0; i < motivo[j].length; i++) {
      if (motivo[j][i] !== '.') filas[3 + j][3 + i] = motivo[j][i]
    }
  }
  return filas.map(f => f.join(''))
}

function acentoDe(equipo: string): [string, string] {
  return Object.prototype.hasOwnProperty.call(EQUIPO_ACENTO, equipo) ? EQUIPO_ACENTO[equipo] : EQUIPO_ACENTO.base
}

// Paleta del icono con el acento del equipo. Equipo desconocido: base.
export function glifoPaleta(equipo: string): Record<string, string> {
  const [A, a] = acentoDe(equipo)
  return { ...PAL_ICONO, A, a }
}

// ---- Placas 24x24: se dibujan con rectangulos y se les agrega un contorno O automatico ----

type Rejilla = string[][]

function rect(g: Rejilla, ch: string, x: number, y: number, w: number, h: number): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (j >= 0 && j < 24 && i >= 0 && i < 24) g[j][i] = ch
    }
  }
}

function placa(dibujo: (g: Rejilla) => void): string[] {
  const g: Rejilla = []
  for (let j = 0; j < 24; j++) g.push('.'.repeat(24).split(''))
  dibujo(g)
  const sal = g.map(f => f.slice())
  for (let j = 0; j < 24; j++) {
    for (let i = 0; i < 24; i++) {
      if (g[j][i] !== '.') continue
      const vecinos = [g[j - 1]?.[i], g[j + 1]?.[i], g[j][i - 1], g[j][i + 1]]
      if (vecinos.some(v => v !== undefined && v !== '.' && v !== 'O')) sal[j][i] = 'O'
    }
  }
  return sal.map(f => f.join(''))
}

const PLACAS: Record<string, () => string[]> = {
  // caja de herramientas
  base: () =>
    placa(g => {
      rect(g, 'G', 8, 4, 8, 2)
      rect(g, '.', 10, 5, 4, 1)
      rect(g, 'G', 8, 6, 2, 2)
      rect(g, 'G', 14, 6, 2, 2)
      rect(g, 'A', 3, 8, 18, 12)
      rect(g, 'a', 3, 8, 18, 2)
      rect(g, 'a', 3, 18, 18, 2)
      rect(g, 'Y', 10, 10, 4, 3)
      rect(g, 'y', 10, 12, 4, 1)
      rect(g, 'W', 5, 14, 3, 1)
    }),
  // maletin
  direccion: () =>
    placa(g => {
      rect(g, 'M', 9, 5, 6, 1)
      rect(g, 'M', 9, 6, 1, 3)
      rect(g, 'M', 14, 6, 1, 3)
      rect(g, 'A', 2, 9, 20, 11)
      rect(g, 'a', 2, 14, 20, 1)
      rect(g, 'a', 2, 19, 20, 1)
      rect(g, 'Y', 2, 9, 2, 2)
      rect(g, 'Y', 20, 9, 2, 2)
      rect(g, 'Y', 10, 12, 4, 4)
      rect(g, 'y', 10, 15, 4, 1)
      rect(g, 'K', 11, 13, 2, 1)
    }),
  // binoculares
  research: () =>
    placa(g => {
      rect(g, 'G', 4, 3, 5, 2)
      rect(g, 'G', 15, 3, 5, 2)
      rect(g, 'A', 3, 5, 7, 11)
      rect(g, 'A', 14, 5, 7, 11)
      rect(g, 'a', 8, 5, 2, 11)
      rect(g, 'a', 19, 5, 2, 11)
      rect(g, 'W', 5, 7, 1, 6)
      rect(g, 'W', 16, 7, 1, 6)
      rect(g, 'g', 10, 9, 4, 3)
      rect(g, 'K', 2, 16, 9, 3)
      rect(g, 'K', 13, 16, 9, 3)
      rect(g, 'B', 4, 17, 5, 1)
      rect(g, 'B', 15, 17, 5, 1)
    }),
  // archivero
  librarian: () =>
    placa(g => {
      rect(g, 'G', 5, 2, 14, 20)
      rect(g, 'A', 5, 2, 14, 1)
      rect(g, 'g', 5, 8, 14, 1)
      rect(g, 'g', 5, 15, 14, 1)
      rect(g, 'W', 9, 4, 6, 2)
      rect(g, 'W', 9, 11, 6, 2)
      rect(g, 'W', 9, 18, 6, 2)
      rect(g, 'A', 11, 6, 2, 1)
      rect(g, 'A', 11, 13, 2, 1)
      rect(g, 'A', 11, 20, 2, 1)
    }),
  // grafico de barras
  datos: () =>
    placa(g => {
      rect(g, 'g', 3, 3, 1, 17)
      rect(g, 'g', 3, 19, 19, 1)
      rect(g, 'A', 6, 13, 3, 6)
      rect(g, 'A', 11, 8, 3, 11)
      rect(g, 'A', 16, 4, 3, 15)
      rect(g, 'a', 8, 13, 1, 6)
      rect(g, 'a', 13, 8, 1, 11)
      rect(g, 'a', 18, 4, 1, 15)
      rect(g, 'W', 6, 13, 1, 5)
      rect(g, 'W', 11, 8, 1, 10)
      rect(g, 'W', 16, 4, 1, 14)
    }),
  // casco y camara
  seguridad: () =>
    placa(g => {
      rect(g, 'Y', 4, 7, 6, 2)
      rect(g, 'Y', 2, 9, 10, 5)
      rect(g, 'y', 1, 14, 12, 2)
      rect(g, 'A', 6, 7, 2, 7)
      rect(g, 'G', 14, 8, 8, 6)
      rect(g, 'K', 17, 9, 3, 4)
      rect(g, 'B', 18, 10, 1, 2)
      rect(g, 'R', 15, 9, 1, 1)
      rect(g, 'g', 17, 14, 2, 3)
      rect(g, 'g', 15, 17, 6, 1)
    }),
  // llave y engranaje
  mantenimiento: () =>
    placa(g => {
      rect(g, 'G', 5, 5, 7, 7)
      rect(g, 'G', 7, 3, 3, 2)
      rect(g, 'G', 7, 12, 3, 2)
      rect(g, 'G', 3, 7, 2, 3)
      rect(g, 'G', 12, 7, 2, 3)
      rect(g, '.', 7, 7, 3, 3)
      for (let i = 0; i < 9; i++) rect(g, 'A', 10 + i, 19 - i, 2, 2)
      rect(g, 'A', 18, 4, 5, 5)
      rect(g, '.', 20, 4, 2, 3)
      rect(g, 'a', 12, 17, 2, 2)
    }),
  // balde y trapeador
  limpieza: () =>
    placa(g => {
      rect(g, 'g', 3, 7, 10, 1)
      rect(g, 'g', 3, 8, 1, 4)
      rect(g, 'g', 12, 8, 1, 4)
      for (let y = 12; y <= 21; y++) {
        const dentro = Math.floor((y - 12) / 3)
        rect(g, 'A', 2 + dentro, y, 12 - 2 * dentro, 1)
      }
      rect(g, 'B', 3, 12, 10, 1)
      rect(g, 'a', 5, 19, 6, 3)
      rect(g, 'M', 19, 2, 2, 14)
      rect(g, 'C', 16, 16, 7, 5)
      rect(g, 'c', 17, 19, 1, 2)
      rect(g, 'c', 20, 19, 1, 2)
    }),
  // llavero de puertas
  facilities: () =>
    placa(g => {
      rect(g, 'G', 5, 3, 14, 5)
      rect(g, '.', 7, 4, 10, 3)
      for (const [x, ch] of [[4, 'Y'], [10, 'A'], [16, 'Y']] as [number, string][]) {
        rect(g, ch, x, 8, 4, 4)
        rect(g, '.', x + 1, 9, 2, 2)
        rect(g, 'y', x + 1, 12, 2, 9)
        rect(g, 'y', x + 3, 17, 2, 1)
        rect(g, 'y', x + 3, 19, 2, 1)
      }
    }),
  // plano y escuadra
  arquitectura: () =>
    placa(g => {
      rect(g, 'B', 2, 3, 16, 17)
      rect(g, 'W', 4, 6, 12, 1)
      rect(g, 'W', 4, 10, 8, 1)
      rect(g, 'W', 4, 14, 6, 1)
      rect(g, 'W', 8, 4, 1, 15)
      for (let y = 10; y <= 21; y++) rect(g, 'A', 11, y, 1 + (y - 10), 1)
      for (let y = 15; y <= 20; y++) rect(g, '.', 13, y, y - 13, 1)
    }),
  // computadora con codigo
  'dev-a1': () =>
    placa(g => {
      rect(g, 'G', 3, 3, 18, 13)
      rect(g, 'K', 5, 5, 14, 9)
      rect(g, 'B', 6, 6, 6, 1)
      rect(g, 'A', 8, 8, 8, 1)
      rect(g, 'B', 6, 10, 5, 1)
      rect(g, 'Y', 13, 10, 3, 1)
      rect(g, 'g', 10, 16, 4, 3)
      rect(g, 'G', 7, 19, 10, 2)
    }),
  // computadora con tablero de barras
  'dev-tablero': () =>
    placa(g => {
      rect(g, 'G', 3, 3, 18, 13)
      rect(g, 'K', 5, 5, 14, 9)
      rect(g, 'B', 6, 6, 4, 1)
      rect(g, 'A', 7, 10, 2, 3)
      rect(g, 'A', 11, 8, 2, 5)
      rect(g, 'A', 15, 6, 2, 7)
      rect(g, 'W', 6, 13, 12, 1)
      rect(g, 'g', 10, 16, 4, 3)
      rect(g, 'G', 7, 19, 10, 2)
    }),
}

// Las 24 filas de la placa del equipo. Equipo desconocido: base.
export function diosMatriz(equipo: string): string[] {
  return Object.prototype.hasOwnProperty.call(PLACAS, equipo) ? PLACAS[equipo]() : PLACAS.base()
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
      if (paleta[ch]) {
        porColor[ch] = (porColor[ch] ?? '') + `M${x * escala} ${y * escala}h${(fin - x) * escala}v${escala}h${-(fin - x) * escala}z`
      }
      x = fin
    }
  }
  return Object.keys(porColor)
    .map(ch => `<path d="${porColor[ch]}" fill="${paleta[ch]}"/>`)
    .join('')
}

// SVG del icono, de 16*escala px. Escala entera acotada a 1..8 (no numerica: 1).
export function glifoSvg(tipo: string, equipo: string, escala: number): string {
  const e = entero(escala, 1, 1, 8)
  const t = Object.prototype.hasOwnProperty.call(MOTIVOS, tipo) ? tipo : 'escriba'
  const lado = 16 * e
  const cuerpo = pathsDeMatriz(glifoMatriz(t), glifoPaleta(equipo), e)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}" ` +
    `shape-rendering="crispEdges">${cuerpo}</svg>`
  )
}

function acentoValido(a: unknown): a is [string, string] {
  return Array.isArray(a) && a.length >= 2 && a.slice(0, 2).every(c => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c))
}

// SVG de la placa, de 24*escala px. Escala entera acotada a 1..8 (no numerica: 1).
export function diosSvg(equipo: string, escala: number, acento: [string, string]): string {
  const e = entero(escala, 1, 1, 8)
  const [A, a] = acentoValido(acento) ? acento : EQUIPO_ACENTO.base
  const lado = 24 * e
  const cuerpo = pathsDeMatriz(diosMatriz(equipo), { ...PAL_PLACA, A, a }, e)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}" ` +
    `shape-rendering="crispEdges">${cuerpo}</svg>`
  )
}

// Tipo de icono de un agente: emblema, nombre pm/estratega, o segun sus herramientas.
export function tipoDeAgente(a: { name?: string; tools?: string[] | null; emblema?: string }): string {
  if (a.emblema && TIPOS_GLIFO.includes(a.emblema)) return a.emblema
  const nombre = String(a.name ?? '').toLowerCase()
  const corto = nombre.slice(nombre.lastIndexOf(':') + 1)
  if (corto === 'pm' || corto === 'estratega') return corto
  if (corto === 'corrector') return 'curandero'
  const t = a.tools
  if (t === null || t === undefined) return 'escriba'
  if (t.includes('Write') || t.includes('Edit') || t.includes('NotebookEdit')) return 'escriba'
  if (t.includes('WebFetch') || t.includes('WebSearch')) return 'vidente'
  return 'guardian'
}
