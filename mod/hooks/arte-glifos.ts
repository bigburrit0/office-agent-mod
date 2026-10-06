// Glifos mayas de 16x16: bloque de piedra con marco. El dibujo de adentro dice el TIPO
// de trabajo del agente; el marco lleva el color de su EQUIPO. Módulo puro, sin imports:
// devuelve strings SVG estáticos (sin scripts ni referencias externas).

export const TIPOS_GLIFO = ['escriba', 'vidente', 'guardian', 'curandero', 'pm', 'estratega']

export const TIPO_NOMBRE: Record<string, string> = {
  escriba: 'Escriba',
  vidente: 'Vidente',
  guardian: 'Guardián',
  curandero: 'Curandero',
  pm: 'Calendario',
  estratega: 'Venus',
}

// Acento y acento oscuro del marco, por equipo: mismos colores que el esquema de equipos
// (campo color del archivo del agente).
export const EQUIPO_ACENTO: Record<string, [string, string]> = {
  base: ['#3fae6a', '#23703f'],
  direccion: ['#e6bf2e', '#9c7a10'],
  'dev-a1': ['#f08a24', '#9c4f0c'],
  datos: ['#2cc6d0', '#16777d'],
  research: ['#a06ad0', '#63388f'],
  librarian: ['#e070a8', '#93355f'],
  'dev-tablero': ['#3a7bd5', '#1f4c8a'],
}

// Paleta base del glifo (A y a se reemplazan con el color del equipo).
const PAL_GLIFO: Record<string, string> = {
  O: '#1c120a',
  S: '#efdcae',
  s: '#c9a66c',
  K: '#2a1a10',
  W: '#ffffff',
  A: '#3fae6a',
  a: '#23703f',
}

// Marco 16x16 (piedra con borde).
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
  escriba: [
    '........KK',
    '.......KsK',
    '......KsK.',
    '.....KsK..',
    '....KAK...',
    '...KAAK...',
    '..KAAK....',
    '.KAK......',
    'KK....K...',
    '....K...K.',
  ],
  vidente: [
    '..........',
    '...KKKK...',
    '.KK....KK.',
    'K..KKKK..K',
    'K.KAAWAK.K',
    'K.KAAAAK.K',
    '.KKKKKKKK.',
    '...K..K...',
    '....KK.K..',
    '.......K..',
  ],
  guardian: [
    '..KKKKKK..',
    '.KAA..AAK.',
    'KAA.KK.AAK',
    'KA.KWWK.AK',
    'K.KWKKWK.K',
    'K.KWKKWK.K',
    'KA.KWWK.AK',
    'KAA.KK.AAK',
    '.KAA..AAK.',
    '..KKKKKK..',
  ],
  curandero: [
    'K.........',
    '.K........',
    '..K.......',
    '...KKKKK..',
    '..KAWAWAK.',
    '..KAAAAAK.',
    '..KAWAWAK.',
    '...KKKKK..',
    '.......K..',
    '........KK',
  ],
  pm: [
    '...K..K...',
    '.KKKKKKKK.',
    '.K.K..K.K.',
    'KK......KK',
    '.K.AAAA.K.',
    '.K.KKKK.K.',
    'KK......KK',
    '.K.AAAA.K.',
    '.KKKKKKKK.',
    '...K..K...',
  ],
  estratega: [
    'K...KK...K',
    '....KK....',
    '...KAAK...',
    '...KAAK...',
    'KKKAWWAKKK',
    'KKKAWWAKKK',
    '...KAAK...',
    '...KAAK...',
    '....KK....',
    'K...KK...K',
  ],
}

function entero(valor: unknown, porDefecto: number, min: number, max: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return porDefecto
  return Math.max(min, Math.min(max, Math.round(n)))
}

// Marco 16x16 con el motivo del tipo pegado en (3,3). Tipo desconocido: escriba.
export function glifoMatriz(tipo: string): string[] {
  const motivo = MOTIVOS[tipo] ?? MOTIVOS.escriba
  const filas = MARCO.map(f => f.split(''))
  for (let j = 0; j < motivo.length; j++) {
    for (let i = 0; i < motivo[j].length; i++) {
      if (motivo[j][i] !== '.') filas[3 + j][3 + i] = motivo[j][i]
    }
  }
  return filas.map(f => f.join(''))
}

// Paleta del glifo con el acento del equipo. Equipo desconocido: base.
export function glifoPaleta(equipo: string): Record<string, string> {
  const [A, a] = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
  return { ...PAL_GLIFO, A, a }
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

// SVG del glifo, de 16*escala px. Escala entera acotada a 1..8 (no numérica: 1).
export function glifoSvg(tipo: string, equipo: string, escala: number): string {
  const e = entero(escala, 1, 1, 8)
  const t = MOTIVOS[tipo] ? tipo : 'escriba'
  const lado = 16 * e
  const cuerpo = pathsDeMatriz(glifoMatriz(t), glifoPaleta(equipo), e)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}" ` +
    `shape-rendering="crispEdges">${cuerpo}</svg>`
  )
}

// Tipo de glifo de un agente: emblema, nombre pm/estratega, o según sus herramientas.
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
