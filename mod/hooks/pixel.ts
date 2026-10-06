// Módulo de dibujo pixel art del «Tablero de subagentes»: greca azteca, texto pixel, barra de oleadas,
// línea de tiempo y emblemas de equipo. (La cara del jaguar, el patio y los glifos viven en arte-*.ts.)
// Todo son funciones puras que devuelven strings SVG. Sin imports y solo sintaxis «borrable»
// (nada de enum, namespace ni parameter properties) para que Node 24 lo corra directo.
//
// Reglas que cumple cada SVG: texto externo escapado, sin scripts ni referencias externas,
// animaciones solo SMIL, y menos de MAX_SVG_CHARS caracteres.

// ---------------------------------------------------------------------------
// Paleta y colores de roles / estados
// ---------------------------------------------------------------------------

export const PALETTE = {
  negro: '#2B2118', // contorno
  oro: '#F28C28', // naranja: acento secundario
  oroPalido: '#E8DCC0', // beige: plástico de los 80
  crema: '#FFF4DF', // crema: texto claro
  ocre: '#B85C12', // naranja oscuro: sombra del naranja
  madera: '#C2AE86', // beige oscuro: sombras del beige
  maderaOscura: '#8F8A80', // gris: alfombra y metal
  turquesa: '#6FA8DC', // azul claro: brillos y pantallas
  jade: '#3FAE6A', // verde: terminado
  selva: '#1F5FA8', // azul: acento principal y fondos
  lima: '#9FE3C8', // pantalla: monitores
  rojo: '#D9363E', // rojo: error
  gris: '#8F8A80', // gris: alfombra y metal
}

// Color de acento por rol: legible sobre fondo oscuro y sobre fondo claro.
export const ROLE_COLORS: Record<string, string> = {
  implementador: '#2A93C9', // azul turquesa
  corrector: '#E07B12', // ocre / naranja
  investigador: '#A55BB0', // violeta / ciruela
  revisor: '#4CAF2F', // jade
}
export const ROLE_COLOR_DEFAULT = '#A08C6A'

// Color por estado (claves en español; ver normalizeStatus para los estados del motor).
export const STATUS_COLORS: Record<string, string> = {
  corre: '#2CA6A4', // turquesa
  lista: '#2E9E55', // jade
  falló: '#D9363E', // rojo
  frenada: '#8C8279', // gris cálido
  otro: '#B87300', // ocre
}

// Convierte un estado del motor (running, completed, failed, killed) o en español a la clave de STATUS_COLORS.
export function normalizeStatus(status: string): string {
  const s = String(status ?? '').toLowerCase()
  if (s === 'running' || s === 'corre') return 'corre'
  if (s === 'completed' || s === 'done' || s === 'lista') return 'lista'
  if (s === 'failed' || s === 'falló' || s === 'fallo') return 'falló'
  if (s === 'killed' || s === 'stopped' || s === 'frenada') return 'frenada'
  return 'otro'
}

export function roleColor(role: string): string {
  return ROLE_COLORS[String(role ?? '')] ?? ROLE_COLOR_DEFAULT
}

export function statusColor(status: string): string {
  return STATUS_COLORS[normalizeStatus(status)]
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

// Límite de seguridad por SVG (el motor acepta hasta 131072).
const MAX_SVG_CHARS = 120000
const SIN_DATOS = 'Sin subagentes todavía.'
const XMLNS = 'xmlns="http://www.w3.org/2000/svg"'

// Escapa el texto que viene de afuera para meterlo en SVG (contenido o atributo).
function esc(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Número finito y entero positivo mínimo (para tamaños), con valor por defecto.
function entero(valor: unknown, porDefecto: number, minimo: number, maximo: number): number {
  const n = Math.round(Number(valor))
  if (!Number.isFinite(n)) return porDefecto
  return Math.min(maximo, Math.max(minimo, n))
}

function numeroSeguro(valor: unknown, porDefecto: number): number {
  const n = Number(valor)
  return Number.isFinite(n) ? n : porDefecto
}

function abrirSvg(ancho: number, alto: number, cuerpo: string): string {
  return (
    `<svg ${XMLNS} width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" ` +
    `shape-rendering="crispEdges">${cuerpo}</svg>`
  )
}

type TemaLinea = 'oscuro' | 'claro'

// Colores del tema claro de la línea de tiempo (mismos valores que CLARO en tema.ts; locales para no crear ciclos).
const LINEA_CLARO = { fondo: '#FFFDF7', etiqueta: '#2B2118', eje: '#6B5B45', guia: '#C2AE86' }

function luminancia(hex: string): number {
  const c = [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

function contraste(a: string, b: string): number {
  const la = luminancia(a)
  const lb = luminancia(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Oscurece un color hasta que contraste al menos 3:1 contra el fondo claro.
function contrasteSobreClaro(hex: string): string {
  let actual = hex
  for (let k = 1; k <= 20 && contraste(actual, LINEA_CLARO.fondo) < 3; k++) {
    const f = 1 - k * 0.05
    actual =
      '#' +
      [1, 3, 5]
        .map(i =>
          Math.round(parseInt(hex.slice(i, i + 2), 16) * f)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
        .toUpperCase()
  }
  return actual
}

function svgVacio(mensaje: string, ancho: number, tema: TemaLinea = 'oscuro'): string {
  const w = Math.max(ancho, 120)
  const claro = tema === 'claro'
  return abrirSvg(
    w,
    20,
    `<rect width="${w}" height="20" fill="${claro ? LINEA_CLARO.fondo : PALETTE.selva}"/>` +
      `<text x="6" y="14" font-family="monospace" font-size="11" fill="${claro ? LINEA_CLARO.etiqueta : PALETTE.crema}">${esc(mensaje)}</text>`,
  )
}

// ---------------------------------------------------------------------------
// Greca azteca (xicalcoliuhqui, espiral escalonada)
// ---------------------------------------------------------------------------

// Baldosa de 8x8 de una tecla de teclado: G = borde (contorno), T = centro de la tecla, '.' = beige.
// El centro es beige en 2 de cada 3 teclas, y azul o naranja en la tercera (ver grecaElementos).
const GRECA_BALDOSA: string[] = [
  'GGGGGGG.',
  'G.....G.',
  'G.TTT.G.',
  'G.TTT.G.',
  'G.TTT.G.',
  'G.....G.',
  'GGGGGGG.',
  '........',
]

// Elementos de la banda (sin la etiqueta <svg>) en la posición dada. Usa un <path> por color.
function grecaElementos(ancho: number, alto: number, x0: number, y0: number): string {
  const u = Math.max(1, Math.floor(alto / 8)) // tamaño de pixel
  const columnas = Math.ceil(ancho / u)
  const yBase = y0 + Math.floor((alto - 8 * u) / 2)
  // Un trazo por clase: G contorno, A tecla azul, N tecla naranja (la tecla beige es el fondo).
  const trazos: Record<string, string> = { G: '', A: '', N: '' }
  const clase = (fila: string, c: number): string => {
    const ch = fila[c % 8]
    if (ch !== 'T') return ch
    const tecla = Math.floor(c / 8) % 3
    return tecla === 1 ? 'A' : tecla === 2 ? 'N' : '.'
  }
  for (let f = 0; f < 8; f++) {
    const fila = GRECA_BALDOSA[f]
    let c = 0
    while (c < columnas) {
      const ch = clase(fila, c)
      let fin = c + 1
      while (fin < columnas && clase(fila, fin) === ch) fin++
      if (ch in trazos) {
        const x = c * u
        const w = Math.min(fin * u, ancho) - x
        if (w > 0) trazos[ch] += `M${x0 + x} ${yBase + f * u}h${w}v${u}h${-w}z`
      }
      c = fin
    }
  }
  return (
    `<rect x="${x0}" y="${y0}" width="${ancho}" height="${alto}" fill="${PALETTE.oroPalido}"/>` +
    `<path d="${trazos.G}" fill="${PALETTE.negro}"/>` +
    `<path d="${trazos.A}" fill="${PALETTE.selva}"/>` +
    `<path d="${trazos.N}" fill="${PALETTE.oro}"/>`
  )
}

// Banda decorativa horizontal con la greca, repetible a lo ancho.
export function grecaBand(width: number, height?: number): string {
  const w = entero(width, 120, 8, 2000)
  const h = entero(height, 16, 8, 64)
  return abrirSvg(w, h, grecaElementos(w, h, 0, 0))
}

// ---------------------------------------------------------------------------
// Barra de la oleada
// ---------------------------------------------------------------------------

export type OleadaCounts = {
  running: number
  done: number
  failed: number
  stopped: number
  other: number
}

// Un bloque por subagente, con el color de su estado; los que corren pulsan.
export function waveBarSvg(counts: OleadaCounts, width: number): string {
  const w = entero(width, 240, 40, 2000)
  const orden: Array<[string, string, number]> = [
    ['lista', 'done', 0],
    ['corre', 'running', 0],
    ['falló', 'failed', 0],
    ['frenada', 'stopped', 0],
    ['otro', 'other', 0],
  ]
  const c: Record<string, number> = (counts ?? {}) as Record<string, number>
  for (const item of orden) item[2] = entero(c[item[1]], 0, 0, 100000)
  let total = orden.reduce((suma, item) => suma + item[2], 0)
  if (total === 0) return svgVacio(SIN_DATOS, w)

  // Si hay demasiados, se reduce proporcionalmente (mínimo 1 por estado presente) para acotar el peso.
  const TOPE = 300
  if (total > TOPE) {
    const factor = TOPE / total
    for (const item of orden) if (item[2] > 0) item[2] = Math.max(1, Math.floor(item[2] * factor))
    total = orden.reduce((suma, item) => suma + item[2], 0)
  }

  const paso = Math.max(3, Math.min(14, Math.floor((w - 4) / total)))
  const lado = paso > 4 ? paso - 2 : paso - 1
  const alto = lado + 6
  let cuerpo = `<rect width="${w}" height="${alto}" fill="${PALETTE.selva}"/>`
  let x = 3
  for (const [estado, , cantidad] of orden) {
    const color = STATUS_COLORS[estado]
    for (let i = 0; i < cantidad; i++) {
      const rect = `<rect x="${x}" y="3" width="${lado}" height="${lado}" fill="${color}"`
      if (estado === 'corre') {
        cuerpo +=
          `${rect}><animate attributeName="opacity" values="1;0.35;1" dur="1.2s" ` +
          `begin="${((i % 5) * 0.15).toFixed(2)}s" repeatCount="indefinite"/></rect>`
      } else {
        cuerpo += `${rect}/>`
      }
      x += paso
    }
  }
  return abrirSvg(w, alto, cuerpo)
}

// ---------------------------------------------------------------------------
// Línea de tiempo tipo Gantt
// ---------------------------------------------------------------------------

export type FilaTiempo = {
  label: string
  role: string
  status: string
  startMs: number
  endMs?: number
}

// Duración corta legible: 12s, 3m05s, 1h05m.
function duracionCorta(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${String(s % 60).padStart(2, '0')}s`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`
}

function recortarEtiqueta(texto: string, max: number): string {
  const limpio = String(texto ?? '').replace(/\s+/g, ' ').trim()
  return limpio.length > max ? `${limpio.slice(0, max - 1)}…` : limpio
}

// Gantt: una fila por subagente, ordenadas por inicio; barras hechas de bloques escalonados.
export function timelineSvg(
  rows: FilaTiempo[],
  nowMs: number,
  width: number,
  opts?: { tema?: 'oscuro' | 'claro' },
): string {
  const w = entero(width, 480, 200, 2000)
  const claro = opts?.tema === 'claro'
  const tema: TemaLinea = claro ? 'claro' : 'oscuro'
  const lista = Array.isArray(rows) ? rows : []
  if (lista.length === 0) return svgVacio(SIN_DATOS, w, tema)

  const ahora = numeroSeguro(nowMs, 0)
  const ALTO_FILA = 16
  const LADO = 10 // lado del bloque
  const PASO = LADO + 1
  const ANCHO_ETIQUETA = 160
  const MARGEN = 8
  const ARRIBA = 16 // espacio para los ticks del eje
  const xBarra = ANCHO_ETIQUETA + MARGEN
  const anchoBarra = Math.max(40, w - xBarra - MARGEN - LADO)
  const maxChars = Math.floor((ANCHO_ETIQUETA - 14) / 6.6)

  // Normaliza y ordena por inicio; se queda con las últimas filas si son demasiadas.
  type Norm = { label: string; role: string; status: string; ini: number; fin: number; corre: boolean }
  let normales: Norm[] = lista.map(fila => {
    const ini = numeroSeguro(fila && fila.startMs, ahora)
    const corre = normalizeStatus(fila && fila.status) === 'corre'
    const finBruto = fila && fila.endMs != null ? numeroSeguro(fila.endMs, ini) : corre ? ahora : ini
    return {
      label: String(fila && fila.label),
      role: String(fila && fila.role),
      status: String(fila && fila.status),
      ini,
      fin: Math.max(ini, finBruto),
      corre,
    }
  })
  normales.sort((a, b) => a.ini - b.ini)
  if (normales.length > 60) normales = normales.slice(-60)

  // Intenta dibujar; si pesa demasiado, descarta las filas más viejas y repite.
  while (true) {
    const svg = dibujarTimeline(normales)
    if (svg.length < MAX_SVG_CHARS || normales.length <= 1) return svg
    normales = normales.slice(Math.ceil(normales.length / 4))
  }

  function dibujarTimeline(filas: Norm[]): string {
    const minimo = Math.min(...filas.map(f => f.ini))
    const maximo = Math.max(...filas.map(f => f.fin), minimo + 1)
    const span = Math.max(1, maximo - minimo)
    const escala = anchoBarra / span
    const alto = ARRIBA + filas.length * ALTO_FILA + 6

    let cuerpo = `<rect width="${w}" height="${alto}" fill="${claro ? LINEA_CLARO.fondo : PALETTE.selva}"/>`

    // Eje: 4 divisiones con el tiempo transcurrido desde el primer inicio. Una marca que se
    // pisaría con otra (poco ancho) no se escribe; la línea de la división sí.
    // Ancho estimado de un carácter monospace de 9 px: 5,5 px.
    // Acotada al ancho: con un panel muy angosto la barra mínima (40 px) se pasaría del dibujo.
    const xMarca = (i: number): number => Math.min(w - 2, Math.round(xBarra + (anchoBarra * i) / 4))
    const marcas = [0, 1, 2, 3, 4].map(i => duracionCorta((span * i) / 4))
    // La última (el total) siempre se ve; las otras, de izquierda a derecha, si no pisan nada.
    const inicioUltima = xMarca(4) - marcas[4].length * 5.5
    let finAnterior = -Infinity
    for (let i = 0; i <= 4; i++) {
      cuerpo += `<rect x="${xMarca(i)}" y="${ARRIBA - 2}" width="1" height="${alto - ARRIBA + 2}" fill="${claro ? LINEA_CLARO.guia : PALETTE.turquesa}" opacity="0.35"/>`
      if (i === 4) continue
      const fin = xMarca(i) + marcas[i].length * 5.5
      if (xMarca(i) < finAnterior + 4 || fin + 4 > inicioUltima) marcas[i] = ''
      else finAnterior = fin
    }
    marcas.forEach((texto, i) => {
      if (texto === '') return
      const x = xMarca(i)
      const ancla = i === 4 ? 'end' : 'start'
      cuerpo += `<text x="${x}" y="10" text-anchor="${ancla}" font-family="monospace" font-size="9" fill="${claro ? LINEA_CLARO.eje : PALETTE.oroPalido}">${esc(texto)}</text>`
    })

    filas.forEach((f, idx) => {
      const y = ARRIBA + idx * ALTO_FILA
      const yBloque = y + Math.floor((ALTO_FILA - LADO) / 2)
      // Marca de estado + etiqueta.
      cuerpo += `<rect x="4" y="${yBloque + 2}" width="6" height="6" fill="${claro ? contrasteSobreClaro(statusColor(f.status)) : statusColor(f.status)}"/>`
      cuerpo += `<text x="14" y="${y + 12}" font-family="monospace" font-size="11" fill="${claro ? LINEA_CLARO.etiqueta : PALETTE.crema}">${esc(recortarEtiqueta(f.label, maxChars))}</text>`

      // Barra: bloques como cubos de una pirámide escalonada.
      const x0 = xBarra + (f.ini - minimo) * escala
      const largo = Math.max(LADO, (f.fin - f.ini) * escala)
      const cantidad = Math.max(1, Math.min(120, Math.ceil(largo / PASO)))
      const color = claro ? contrasteSobreClaro(roleColor(f.role)) : roleColor(f.role)
      let bloques = ''
      for (let i = 0; i < cantidad; i++) {
        const x = Math.min(Math.round(x0 + i * PASO), w - MARGEN - LADO)
        const esPunta = i === cantidad - 1
        const rect = `<rect x="${x}" y="${yBloque}" width="${LADO}" height="${LADO}"`
        if (esPunta && f.corre) {
          bloques += `${rect}><animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite"/></rect>`
        } else {
          bloques += `${rect}/>`
        }
      }
      cuerpo += `<g fill="${color}">${bloques}</g>`
    })
    return abrirSvg(w, alto, cuerpo)
  }
}

// ---------------------------------------------------------------------------
// Fuente pixel 5x7 (el '#' es un cuadradito, el '.' es vacío)
// ---------------------------------------------------------------------------

// Marcas de acento: ocupan 2 filas encima de la letra (las letras con marca miden 9 filas).
const ACENTO_AGUDO = ['...#.', '..#..']
const ACENTO_TILDE = ['.##.#', '#.##.']
const ACENTO_DIERESIS = ['.#.#.', '.....']

const FONT_BASE: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['#...#', '#...#', '#...#', '#####', '....#', '....#', '....#'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
  '·': ['...', '...', '...', '.#.', '...', '...', '...'],
  ':': ['.', '.', '#', '.', '#', '.', '.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '…': ['.....', '.....', '.....', '.....', '.....', '.....', '#.#.#'],
}

// Fuente completa: las vocales con tilde, la Ñ y la Ü llevan 2 filas de marca arriba (9 filas).
export const FONT: Record<string, string[]> = {
  ...FONT_BASE,
  Á: [...ACENTO_AGUDO, ...FONT_BASE.A],
  É: [...ACENTO_AGUDO, ...FONT_BASE.E],
  Í: [...ACENTO_AGUDO, ...FONT_BASE.I],
  Ó: [...ACENTO_AGUDO, ...FONT_BASE.O],
  Ú: [...ACENTO_AGUDO, ...FONT_BASE.U],
  Ñ: [...ACENTO_TILDE, ...FONT_BASE.N],
  Ü: [...ACENTO_DIERESIS, ...FONT_BASE.U],
}

// Carácter desconocido: cuadrado hueco.
const FONT_DESCONOCIDO = ['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####']

type LetraPos = { x: number; y: number; filas: string[] } // x e y en celdas
type Disposicion = { letras: LetraPos[]; cols: number; filasAlto: number }

// Acomoda las letras en una línea (todo en mayúsculas). La altura es 7 filas, o 9 si alguna lleva marca.
function disponer(texto: unknown, max: number): Disposicion {
  const chars = Array.from(String(texto ?? '').toUpperCase()).slice(0, max)
  const glifos = chars.map(ch => FONT[ch] ?? FONT_DESCONOCIDO)
  const filasAlto = glifos.some(g => g.length > 7) ? 9 : 7
  const letras: LetraPos[] = []
  let x = 0
  for (const g of glifos) {
    letras.push({ x, y: filasAlto - g.length, filas: g })
    x += g[0].length + 1
  }
  return { letras, cols: Math.max(0, x - 1), filasAlto }
}

type Tramo = { col: number; fila: number; largo: number }

// Tramos horizontales de cuadraditos de una letra (celdas relativas al texto).
function tramosDeLetra(l: LetraPos): Tramo[] {
  const salida: Tramo[] = []
  for (let r = 0; r < l.filas.length; r++) {
    const fila = l.filas[r]
    let c = 0
    while (c < fila.length) {
      if (fila[c] !== '#') {
        c++
        continue
      }
      let fin = c + 1
      while (fin < fila.length && fila[fin] === '#') fin++
      salida.push({ col: l.x + c, fila: l.y + r, largo: fin - c })
      c = fin
    }
  }
  return salida
}

// Trazo de path de una letra, con desplazamiento en píxeles.
function trazoLetra(l: LetraPos, e: number, ox: number, oy: number): string {
  let d = ''
  for (const t of tramosDeLetra(l)) d += `M${ox + t.col * e} ${oy + t.fila * e}h${t.largo * e}v${e}h${-t.largo * e}z`
  return d
}

// Acepta solo colores #rgb / #rrggbb(aa) para no meter texto de afuera en un atributo.
function colorSeguro(color: unknown, porDefecto: string): string {
  return typeof color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : porDefecto
}

// fondo: color #rgb/#rrggbb de un rectángulo de fondo con 2 píxeles de margen; vacío = sin fondo.
export type OpcionesTexto = { color?: string; sombra?: boolean; repetir?: boolean; fondo?: string }

// Texto estático hecho de cuadraditos (tramos fusionados). opts.color (oro), opts.sombra (true).
export function pixelTextSvg(texto: string, escala: number, opts?: OpcionesTexto): string {
  const e = entero(escala, 3, 1, 32)
  const color = colorSeguro(opts && opts.color, PALETTE.oro)
  const sombra = !(opts && opts.sombra === false)
  const fondo = colorSeguro(opts && opts.fondo, '')
  const m = fondo ? 2 * e : 0
  const d = disponer(texto, 64)
  const extra = sombra ? e : 0
  const ancho = Math.max(1, d.cols * e + extra) + 2 * m
  const alto = d.filasAlto * e + extra + 2 * m
  let principal = ''
  for (const l of d.letras) principal += trazoLetra(l, e, m, m)
  let cuerpo = fondo ? `<rect width="${ancho}" height="${alto}" fill="${fondo}"/>` : ''
  if (sombra && principal) cuerpo += `<g transform="translate(${e} ${e})"><path d="${principal}" fill="${PALETTE.negro}"/></g>`
  if (principal) cuerpo += `<path d="${principal}" fill="${color}"/>`
  return abrirSvg(ancho, alto, cuerpo)
}

// Texto que se arma: cada tramo de cuadraditos arranca disperso (en los bordes) y vuela a su lugar,
// letra por letra (≈1,2 s en total). opts.repetir: se deshace y se rearma en bucle. Máximo 24 caracteres.
export function textoArmadoSvg(texto: string, escala: number, opts?: OpcionesTexto): string {
  const e = entero(escala, 3, 1, 32)
  const color = colorSeguro(opts && opts.color, PALETTE.oro)
  const sombra = !(opts && opts.sombra === false)
  const repetir = !!(opts && opts.repetir)
  const d = disponer(texto, 24)
  const estatico = () => pixelTextSvg(Array.from(String(texto ?? '')).slice(0, 24).join(''), e, opts)
  if (d.cols === 0) return estatico()

  const fondo = colorSeguro(opts && opts.fondo, '')
  const m = fondo ? 2 * e : 0
  const extra = sombra ? e : 0
  const W = d.cols * e + extra
  const H = d.filasAlto * e + extra
  const n = d.letras.length
  const DUR = 0.6 // vuelo de cada letra
  const CICLO = 5 // duración del bucle con repetir
  const f = (v: number) => v.toFixed(3)
  let cuerpo = ''
  let k = 0
  d.letras.forEach((l, i) => {
    const retardo = n > 1 ? (i * DUR) / (n - 1) : 0
    let tramos = ''
    for (const t of tramosDeLetra(l)) {
      const x = t.col * e
      const y = t.fila * e
      const w = t.largo * e
      // Posición inicial determinística sobre un borde (sin azar): fórmula del índice k.
      const fx = (k * 0.6180339887) % 1
      const fy = (k * 0.7548776662 + 0.3) % 1
      const lado = k % 4
      const sx = lado === 0 ? Math.round(fx * W) : lado === 1 ? Math.round(fy * W) : lado === 2 ? -2 * e : W + e
      const sy = lado === 2 || lado === 3 ? Math.round(fy * H) : lado === 0 ? -2 * e : H + e
      k++
      const dest = `${x} ${y}`
      const origen = `${sx} ${sy}`
      let anim: string
      if (repetir) {
        const a = retardo / CICLO
        const b = (retardo + DUR) / CICLO
        const c = (3.2 + retardo) / CICLO
        const dd = (3.8 + retardo) / CICLO
        anim =
          `<animateTransform attributeName="transform" type="translate" ` +
          `values="${origen};${origen};${dest};${dest};${origen};${origen}" ` +
          `keyTimes="0;${f(a)};${f(b)};${f(c)};${f(dd)};1" dur="${CICLO}s" repeatCount="indefinite"/>`
      } else {
        anim =
          `<animateTransform attributeName="transform" type="translate" from="${origen}" to="${dest}" ` +
          `begin="${f(retardo)}s" dur="${DUR}s" fill="freeze" calcMode="spline" keyTimes="0;1" ` +
          `keySplines="0.2 0.8 0.2 1"/>`
      }
      const sombraRect = sombra ? `<rect x="${e}" y="${e}" width="${w}" height="${e}" fill="${PALETTE.negro}"/>` : ''
      tramos += `<g transform="translate(${origen})">${sombraRect}<rect width="${w}" height="${e}"/>${anim}</g>`
    }
    cuerpo += `<g fill="${color}">${tramos}</g>`
  })
  // El campo de dispersión nunca sale del marco: los tramos arrancan a lo sumo 2 píxeles
  // fuera del texto, y el marco no crece más que el texto más su margen.
  if (fondo) cuerpo = `<rect width="${W + 2 * m}" height="${H + 2 * m}" fill="${fondo}"/><g transform="translate(${m} ${m})">${cuerpo}</g>`
  const svg = abrirSvg(W + 2 * m, H + 2 * m, cuerpo)
  return svg.length >= MAX_SVG_CHARS ? estatico() : svg
}

// Palabra de un estado con animación propia (SMIL). `estado` se normaliza igual que normalizeStatus.
// opts.fondo: color de fondo con margen de 2 píxeles; con fondo no lleva sombra negra.
export function palabraEstadoSvg(estado: string, escala: number, opts?: { fondo?: string }): string {
  const e = entero(escala, 3, 1, 32)
  const fondo = colorSeguro(opts && opts.fondo, '')
  const clave = normalizeStatus(estado)
  if (clave === 'frenada') return pixelTextSvg('FRENADA', e, { color: STATUS_COLORS.frenada, fondo, sombra: !fondo })
  if (clave === 'otro') {
    const t = Array.from(String(estado ?? '').trim()).slice(0, 24).join('')
    return pixelTextSvg(t || 'OTRO', e, { color: STATUS_COLORS.otro, fondo, sombra: !fondo })
  }

  const texto = clave === 'corre' ? 'CORRE' : clave === 'lista' ? 'LISTA' : 'FALLÓ'
  const color = STATUS_COLORS[clave]
  const d = disponer(texto, 24)
  // Con fondo: margen de 2 píxeles que absorbe el temblor y la onda; sin fondo, los márgenes de siempre.
  const m = fondo ? 2 * e : 0
  const padX = fondo ? m : e // margen lateral para el temblor
  const padArriba = fondo ? m : clave === 'corre' ? 2 * e : 0 // margen para la onda
  const extra = fondo ? 0 : e // espacio de la sombra
  const W = d.cols * e + extra + 2 * padX
  const H = d.filasAlto * e + extra + padArriba + (fondo ? m : 0)
  const f = (v: number) => v.toFixed(2)

  let letras = ''
  d.letras.forEach((l, i) => {
    const trazo = trazoLetra(l, e, padX, padArriba)
    const sombra = fondo ? '' : `<path d="${trazo}" transform="translate(${e} ${e})" fill="${PALETTE.negro}"/>`
    let principal: string
    let abrir = '<g>'
    let cerrar = '</g>'
    if (clave === 'corre') {
      principal =
        `<path d="${trazo}" fill="${color}"><animate attributeName="fill" values="${color};#A6EDEB;${color}" ` +
        `dur="1.2s" begin="${f(i * 0.12)}s" repeatCount="indefinite"/></path>`
      cerrar =
        `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${-2 * e};0 0" ` +
        `dur="1.2s" begin="${f(i * 0.12)}s" repeatCount="indefinite"/></g>`
    } else if (clave === 'lista') {
      principal =
        `<path d="${trazo}" fill="${color}"><animate attributeName="fill" values="${color};${PALETTE.crema};${color}" ` +
        `dur="0.45s" begin="${f(i * 0.15)}s" repeatCount="1"/></path>`
    } else {
      principal = `<path d="${trazo}" fill="${color}"/>`
    }
    letras += `${abrir}${sombra}${principal}${cerrar}`
  })

  let cuerpo = letras
  if (clave === 'falló') {
    // Temblor horizontal corto y rápido al principio de cada ciclo; después, pausa.
    cuerpo =
      `<g>${letras}<animateTransform attributeName="transform" type="translate" ` +
      `values="0 0;${-e} 0;${e} 0;${-e} 0;${e} 0;0 0;0 0" keyTimes="0;0.04;0.08;0.12;0.16;0.2;1" ` +
      `dur="2.4s" repeatCount="indefinite"/></g>`
  }
  if (fondo) cuerpo = `<rect width="${W}" height="${H}" fill="${fondo}"/>${cuerpo}`
  return abrirSvg(W, H, cuerpo)
}

// ---------------------------------------------------------------------------
// Emblemas de equipo (glifos 8x8 estáticos: X = color del equipo, K = contorno negro)
// ---------------------------------------------------------------------------

export const EQUIPOS_EMBLEMA: Record<string, { emblema: string; color: string }> = {
  base: { emblema: 'greca', color: '#8a93a0' },
  direccion: { emblema: 'piramide', color: '#b08d57' },
  'dev-a1': { emblema: 'cruz', color: '#f08a24' },
  'dev-tablero': { emblema: 'jaguar', color: '#2f4fbf' },
  datos: { emblema: 'barras', color: '#2cc6d0' },
  research: { emblema: 'puntos', color: '#5aa9e6' },
  librarian: { emblema: 'libros', color: '#8a6fb0' },
  seguridad: { emblema: 'casco', color: '#d04a3c' },
  mantenimiento: { emblema: 'llave', color: '#e6bf2e' },
  limpieza: { emblema: 'balde', color: '#9ac83a' },
  facilities: { emblema: 'llavero', color: '#e070a8' },
  arquitectura: { emblema: 'escuadra', color: '#8b5e3c' },
}

const EMBLEMA_MATRICES: Record<string, string[]> = {
  greca: [
    'KKKKKKKK',
    'KXXXXXXK',
    'KXKKKKXK',
    'KXKXXXXK',
    'KXKXKKKK',
    'KXKXXXXK',
    'KXKKKKXK',
    'KKKKKKKK',
  ],
  piramide: [
    '...KK...',
    '..KXXK..',
    '..KKKK..',
    '.KXXXXK.',
    '.KKKKKK.',
    'KXXXXXXK',
    'KKKKKKKK',
    '........',
  ],
  cruz: [
    '..KKKK..',
    '..KXXK..',
    'KKKXXKKK',
    'KXXXXXXK',
    'KXXXXXXK',
    'KKKXXKKK',
    '..KXXK..',
    '..KKKK..',
  ],
  jaguar: [
    'K.KKKK.K',
    'KKXXXXKK',
    'KXKXXKXK',
    'KXXXXXXK',
    'KXKKKKXK',
    'KXXKKXXK',
    '.KXXXXK.',
    '..KKKK..',
  ],
  barras: [
    '........',
    '.....KK.',
    '.KK..KXK',
    '.KXK.KXK',
    '.KXKKKXK',
    '.KXKKXXK',
    '.KXKKXXK',
    'KKKKKKKK',
  ],
  puntos: [
    '.KK..KK.',
    'KXXK.KXK',
    'KXXK.KKK',
    '.KK.KK..',
    '..KKXXK.',
    'KK.KXXK.',
    'KXKK.KK.',
    'KKK.....',
  ],
  libros: [
    '........',
    'KKKKKKK.',
    'KXXXXXK.',
    'KKKKKKKK',
    '.KXXXXXK',
    '.KKKKKKK',
    'KKKKKKK.',
    'KXXXXXK.',
  ],
  casco: [
    '..KKKK..',
    '.KXXXXK.',
    'KXXXXXXK',
    'KXXKKXXK',
    'KXXKKXXK',
    'KKKKKKKK',
    'KXXXXXXK',
    'KKKKKKKK',
  ],
  llave: [
    '.KKK....',
    'KXXXK...',
    'KXKXK...',
    'KXXXKK..',
    '.KKXXXK.',
    '...KXXXK',
    '....KXXK',
    '.....KK.',
  ],
  balde: [
    '.KKKKKK.',
    'K......K',
    'KKKKKKKK',
    'KXXXXXXK',
    '.KXXXXK.',
    '.KXXXXK.',
    '.KXXXXK.',
    '..KKKK..',
  ],
  llavero: [
    '..KKKK..',
    '.K....K.',
    '.K....K.',
    '..KKKK..',
    '..KXXK..',
    '.KXXXXK.',
    '.KXKKXK.',
    '..KKKK..',
  ],
  escuadra: [
    'KKKKKKKK',
    'KXXXXXXK',
    'KXKKKKKK',
    'KXKXXXK.',
    'KXKXXK..',
    'KXKXK...',
    'KXKK....',
    'KKK.....',
  ],
}

// SVG del emblema del equipo (equipo desconocido: el de base).
export function emblemaSvg(equipo: string, escala: number): string {
  const info = EQUIPOS_EMBLEMA[String(equipo ?? '')] ?? EQUIPOS_EMBLEMA.base
  const filas = EMBLEMA_MATRICES[info.emblema] ?? EMBLEMA_MATRICES.greca
  const s = entero(escala, 4, 1, 32)
  let cuerpo = ''
  for (let y = 0; y < filas.length; y++) {
    const fila = filas[y]
    let x = 0
    while (x < fila.length) {
      const ch = fila[x]
      let fin = x + 1
      while (fin < fila.length && fila[fin] === ch) fin++
      if (ch === 'X' || ch === 'K') {
        cuerpo +=
          `<rect x="${x * s}" y="${y * s}" width="${(fin - x) * s}" height="${s}" ` +
          `fill="${ch === 'X' ? info.color : PALETTE.negro}"/>`
      }
      x = fin
    }
  }
  return abrirSvg(filas[0].length * s, filas.length * s, cuerpo)
}
