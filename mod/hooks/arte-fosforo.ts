// Motor de pixel art de la skin «Terminal retro»: paleta de fósforo verde, grillas de colores, figuras,
// fuente de 3 × 5 y SVG con cuadros animados (SMIL discreto). Módulo puro, sin imports: lo usan los
// arte-*-terminal.ts. Viene de mod/preview/pixel-terminal.mjs (el boceto).

export type Grilla = (string | null)[][]

// Fósforo verde en 7 tonos y el brillo que rodea a lo encendido.
export const F = {
  negro: '#020803', // la pantalla
  visor: '#000201', // el visor del robot, un poco más negro que la pantalla
  g0: '#061a0c',
  g1: '#0c3418',
  g2: '#145426',
  g3: '#1f7d38',
  g4: '#2fb34f',
  g5: '#5ef27f',
  g6: '#c8ffd4',
  halo: '#062612',
}
// Acentos: solo para lo que tiene categoría (falla, aviso, equipo).
export const A = {
  rojo: '#ff4f4f',
  rojoOsc: '#9e1f22',
  ambar: '#ffb43a',
  ambarOsc: '#a5640c',
  azul: '#4fb8ff',
  azulOsc: '#1d5f96',
  blanco: '#f4fff6',
}

export const grilla = (w: number, h: number): Grilla => Array.from({ length: h }, () => Array(w).fill(null))
export const copiar = (g: Grilla): Grilla => g.map(fila => [...fila])

export function pon(g: Grilla, x: number, y: number, c: string | null | undefined): void {
  x = Math.round(x)
  y = Math.round(y)
  if (c && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c
}
export function borra(g: Grilla, x: number, y: number): void {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = null
}
export function rect(g: Grilla, x: number, y: number, w: number, h: number, c: string): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pon(g, x + i, y + j, c)
}
export function puntos(g: Grilla, lista: Array<[number, number]>, c: string, dx = 0, dy = 0): void {
  for (const [x, y] of lista) pon(g, x + dx, y + dy, c)
}
// Dibujo con caracteres: cada letra es un color de `pal`; '.' y ' ' son transparentes.
export function sello(g: Grilla, filas: string[], pal: Record<string, string>, dx = 0, dy = 0): void {
  filas.forEach((fila, j) =>
    [...fila].forEach((ch, i) => {
      if (ch !== '.' && ch !== ' ' && pal[ch]) pon(g, dx + i, dy + j, pal[ch])
    }),
  )
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
export const bayer = (x: number, y: number): number => (BAYER[y & 3][x & 3] + 0.5) / 16

export function linea(g: Grilla, x0: number, y0: number, x1: number, y1: number, color: string): void {
  x0 = Math.round(x0)
  y0 = Math.round(y0)
  x1 = Math.round(x1)
  y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (let guardia = 0; guardia < 4000; guardia++) {
    pon(g, x0, y0, color)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/
export function mezcla(a: string, b: string, t: number): string {
  if (!HEX.test(a) || !HEX.test(b)) return a
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
export const colorValido = (c: unknown, porDefecto: string): string => (typeof c === 'string' && HEX.test(c) ? c : porDefecto)

// ---- Fuente de 3 × 5: lo que escribe la terminal ----
const FUENTE: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], Ñ: ['###', '...', '##.', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'], '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'], '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  ' ': ['...', '...', '...', '...', '...'], '.': ['...', '...', '...', '...', '.#.'], ',': ['...', '...', '...', '.#.', '#..'],
  ':': ['...', '.#.', '...', '.#.', '...'], '!': ['.#.', '.#.', '.#.', '...', '.#.'], '¡': ['.#.', '...', '.#.', '.#.', '.#.'],
  '?': ['##.', '..#', '.#.', '...', '.#.'], '¿': ['.#.', '...', '.#.', '#..', '.##'], '-': ['...', '...', '###', '...', '...'],
  _: ['...', '...', '...', '...', '###'], '>': ['#..', '.#.', '..#', '.#.', '#..'], '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '/': ['..#', '..#', '.#.', '#..', '#..'], '%': ['#.#', '..#', '.#.', '#..', '#.#'], $: ['.##', '##.', '.#.', '.##', '##.'],
  '#': ['#.#', '###', '#.#', '###', '#.#'], '+': ['...', '.#.', '###', '.#.', '...'], '=': ['...', '###', '...', '###', '...'],
  '(': ['.#.', '#..', '#..', '#..', '.#.'], ')': ['.#.', '..#', '..#', '..#', '.#.'], '[': ['##.', '#..', '#..', '#..', '##.'],
  ']': ['.##', '..#', '..#', '..#', '.##'], "'": ['.#.', '.#.', '...', '...', '...'], '*': ['...', '#.#', '.#.', '#.#', '...'],
  '@': ['###', '#.#', '#.#', '#..', '.##'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'], '^': ['.#.', '#.#', '...', '...', '...'],
  '~': ['...', '.#.', '#.#', '...', '...'], '|': ['.#.', '.#.', '.#.', '.#.', '.#.'], '█': ['###', '###', '###', '###', '###'],
  '░': ['#.#', '...', '#.#', '...', '#.#'], '\\': ['#..', '#..', '.#.', '..#', '..#'],
}
const SIN_TILDE: Record<string, string> = { Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U' }
export const anchoTexto = (s: unknown): number => Math.max(0, [...String(s ?? '')].length * 4 - 1)

// Escribe `str` (en mayúsculas) con la esquina de arriba a la izquierda en (x, y). Devuelve el ancho.
export function texto(g: Grilla, x: number, y: number, str: unknown, color: string): number {
  let cx = x
  for (const crudo of String(str ?? '').toUpperCase()) {
    const ch = SIN_TILDE[crudo] ?? crudo
    const filas = FUENTE[ch] ?? FUENTE['?']
    filas.forEach((fila, j) =>
      [...fila].forEach((p, i) => {
        if (p === '#') pon(g, cx + i, y + j, color)
      }),
    )
    if (SIN_TILDE[crudo]) pon(g, cx + 1, y - 2, color)
    cx += 4
  }
  return cx - x - 1
}

// ---- SVG ----
export function caminos(g: Grilla, s: number, dx = 0, dy = 0): string {
  const por: Record<string, string> = {}
  for (let y = 0; y < g.length; y++) {
    let x = 0
    while (x < g[y].length) {
      const c = g[y][x]
      if (!c) {
        x++
        continue
      }
      let x2 = x
      while (x2 + 1 < g[y].length && g[y][x2 + 1] === c) x2++
      const w = (x2 - x + 1) * s
      por[c] = (por[c] || '') + `M${(x + dx) * s} ${(y + dy) * s}h${w}v${s}h-${w}z`
      x = x2 + 1
    }
  }
  return Object.entries(por)
    .map(([c, d]) => `<path fill="${c}" d="${d}"/>`)
    .join('')
}

// Solo lo que cambia entre `base` y `g` (lo que `g` vacía se pinta con `vacio`).
export function diferencia(base: Grilla, g: Grilla, vacio: string): Grilla {
  const d = grilla(g[0].length, g.length)
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[y].length; x++) {
      if (g[y][x] !== base[y][x]) d[y][x] = g[y][x] ?? vacio
    }
  return d
}

const num = (n: number): string => String(Math.round(n * 1000) / 1000)

export type Cuadro = [Grilla, number]

// Cuadros en bucle con SMIL discreto. Con `quieto`, solo el primero. Con `vacio`, el primer cuadro
// va entero y los demás solo con lo que cambia. Con `unaVez`, se queda en el último cuadro.
export function cuadros(lista: Cuadro[], s: number, opts: { dx?: number; dy?: number; quieto?: boolean; vacio?: string; unaVez?: boolean } = {}): string {
  const { dx = 0, dy = 0, quieto = false, vacio, unaVez = false } = opts
  if (lista.length === 0) return ''
  if (quieto || lista.length < 2) return caminos(quieto && unaVez ? lista[lista.length - 1][0] : lista[0][0], s, dx, dy)
  const total = lista.reduce((a, c) => a + c[1], 0)
  const base = lista[0][0]
  const repetir = unaVez ? 'fill="freeze"' : 'repeatCount="indefinite"'
  let t = 0
  const capas = lista.map(([g, d], i) => {
    const t0 = t / total
    const t1 = (t + d) / total
    t += d
    if (i === 0 && vacio) return ''
    const ultimo = i === lista.length - 1
    const tiempos = i === 0 ? [0, t1, 1] : ultimo ? [0, t0, 1] : [0, t0, t1, 1]
    const valores = i === 0 ? ['visible', 'hidden', 'hidden'] : ultimo ? ['hidden', 'visible', 'visible'] : ['hidden', 'visible', 'hidden', 'hidden']
    const dibujo = vacio ? caminos(diferencia(base, g, vacio), s, dx, dy) : caminos(g, s, dx, dy)
    return `<g${i === 0 ? '' : ' visibility="hidden"'}>${dibujo}<animate attributeName="visibility" calcMode="discrete" values="${valores.join(';')}" keyTimes="${tiempos.map(num).join(';')}" dur="${num(total)}s" ${repetir}/></g>`
  })
  return vacio ? caminos(base, s, dx, dy) + capas.join('') : capas.join('')
}

// Algo que aparece un rato cada `cada` segundos. Con opacidad: un hijo visible se vería aunque el grupo esté oculto.
export function cadaTanto(cuerpo: string, cada: number, visible: number, desfase = 0): string {
  const a = num(desfase / cada)
  const b = num(Math.min(1, (desfase + visible) / cada))
  return `<g opacity="0">${cuerpo}<animate attributeName="opacity" calcMode="discrete" values="0;1;0;0" keyTimes="0;${a};${b};1" dur="${num(cada)}s" repeatCount="indefinite"/></g>`
}

export function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const abrir = (w: number, h: number, cuerpo: string, alt = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"${alt ? ` role="img" aria-label="${esc(alt)}"` : ''}>${cuerpo}</svg>`

// Líneas de barrido del CRT y una banda clara que baja despacio.
export function barrido(w: number, h: number, opts: { paso?: number; quieto?: boolean } = {}): string {
  const { paso = 3, quieto = false } = opts
  let d = ''
  for (let y = paso - 1; y < h; y += paso) d += `M0 ${y}h${w}v1h-${w}z`
  const lineas = `<path fill="#000" fill-opacity="0.32" d="${d}"/>`
  if (quieto) return lineas
  return `${lineas}<rect x="0" y="-24" width="${w}" height="24" fill="${F.g5}" fill-opacity="0.05"><animate attributeName="y" values="-24;${h}" dur="7s" repeatCount="indefinite"/></rect>`
}
