// Motor de pixel art de la skin «Terminal retro»: grillas de colores, figuras, texto de 3 × 5 y SVG con cuadros animados.
// Puro y sin dependencias. Sale del motor de la skin «Piratas» (pixel-piratas.mjs) con lo que pide una terminal:
// la paleta de fósforo verde, una fuente chica para escribir en la pantalla y las líneas de barrido del CRT.

// ---- Paleta ----
// Fósforo verde en 7 tonos (16 bits: rampas largas en vez de 2 o 3 colores) y los acentos de lo que se clasifica.
export const F = {
  negro: '#020803', // la pantalla apagada
  visor: '#000201', // el visor del robot, un poco más negro que la pantalla
  g0: '#061a0c',
  g1: '#0c3418',
  g2: '#145426',
  g3: '#1f7d38',
  g4: '#2fb34f',
  g5: '#5ef27f',
  g6: '#c8ffd4',
  halo: '#062612', // el brillo que rodea a lo encendido
}
// Acentos: solo para lo que tiene categoría (estado, equipo, aviso). Lo demás es verde.
export const A = {
  rojo: '#ff4f4f',
  rojoOsc: '#9e1f22',
  ambar: '#ffb43a',
  ambarOsc: '#a5640c',
  azul: '#4fb8ff',
  azulOsc: '#1d5f96',
  blanco: '#f4fff6',
}

// ---- Grillas ----
export const grilla = (w, h) => Array.from({ length: h }, () => Array(w).fill(null))
export const copiarGrilla = g => g.map(fila => [...fila])
export function pon(g, x, y, c) {
  x = Math.round(x)
  y = Math.round(y)
  if (c && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c
}
export function borra(g, x, y) {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = null
}
export function rect(g, x, y, w, h, c) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pon(g, x + i, y + j, c)
}
// Lista de puntos [[x, y], …] de un color.
export function puntos(g, lista, c, dx = 0, dy = 0) {
  for (const [x, y] of lista) pon(g, x + dx, y + dy, c)
}
// Dibujo con caracteres: cada letra es un color de `pal`, '.' o ' ' es transparente.
export function sello(g, filas, pal, dx = 0, dy = 0) {
  filas.forEach((fila, j) => [...fila].forEach((ch, i) => {
    if (ch !== '.' && ch !== ' ' && pal[ch]) pon(g, dx + i, dy + j, pal[ch])
  }))
}
// Pega una grilla sobre otra (lo transparente no tapa).
export function pegar(g, otra, dx = 0, dy = 0) {
  for (let y = 0; y < otra.length; y++) for (let x = 0; x < otra[y].length; x++) if (otra[y][x]) pon(g, x + dx, y + dy, otra[y][x])
}

// Bayer 4 × 4 para tramar degradés (el brillo del fósforo, el plástico del monitor).
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
export const bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16

// Línea de Bresenham.
export function linea(g, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx + dy, i = 0
  for (;;) {
    pon(g, x0, y0, typeof color === 'function' ? color(i++) : color)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
}

// Mezcla de dos #rrggbb (t = 0 → a, 1 → b).
export function mezcla(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

// ---- Fuente de 3 × 5 (mayúsculas, números y signos): lo que escribe la terminal ----
const FUENTE = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], Ñ: ['###', '...', '##.', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
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
  '░': ['#.#', '...', '#.#', '...', '#.#'],
}
const SIN_TILDE = { Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U' }
export const anchoTexto = texto => [...String(texto)].length * 4 - 1
// Escribe `texto` en la grilla (x, y arriba a la izquierda). Devuelve el ancho usado.
export function texto(g, x, y, str, color) {
  let cx = x
  for (const crudo of String(str).toUpperCase()) {
    const ch = SIN_TILDE[crudo] ?? crudo
    const filas = FUENTE[ch] ?? FUENTE['?']
    filas.forEach((fila, j) => [...fila].forEach((p, i) => { if (p === '#') pon(g, cx + i, y + j, color) }))
    if (SIN_TILDE[crudo]) pon(g, cx + 1, y - 2, color)
    cx += 4
  }
  return cx - x - 1
}

// ---- SVG ----
export function caminos(g, s, dx = 0, dy = 0) {
  const por = {}
  for (let y = 0; y < g.length; y++) {
    let x = 0
    while (x < g[y].length) {
      const c = g[y][x]
      if (!c) { x++; continue }
      let x2 = x
      while (x2 + 1 < g[y].length && g[y][x2 + 1] === c) x2++
      const w = (x2 - x + 1) * s
      por[c] = (por[c] || '') + `M${(x + dx) * s} ${(y + dy) * s}h${w}v${s}h-${w}z`
      x = x2 + 1
    }
  }
  return Object.entries(por).map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join('')
}

// Solo lo que cambia entre `base` y `g` (las celdas que `g` vacía se pintan con `vacio`).
export function diferencia(base, g, vacio) {
  const d = grilla(g[0].length, g.length)
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) {
    if (g[y][x] !== base[y][x]) d[y][x] = g[y][x] ?? vacio
  }
  return d
}

const num = n => String(Math.round(n * 1000) / 1000)

// Cuadros en bucle con SMIL discreto: [[grilla, segundos], …]. Si `quieto`, solo el primero.
// Con `vacio`, el primer cuadro va entero y los demás solo con lo que cambia (pesan mucho menos).
export function cuadros(lista, s, opts = {}) {
  const { dx = 0, dy = 0, quieto = false, vacio } = opts
  if (quieto || lista.length < 2) return caminos(lista[0][0], s, dx, dy)
  const total = lista.reduce((a, c) => a + c[1], 0)
  const base = lista[0][0]
  let t = 0
  const capas = lista.map(([g, d], i) => {
    const t0 = t / total, t1 = (t + d) / total
    t += d
    if (i === 0 && vacio) return ''
    const tiempos = i === 0 ? [0, t1, 1] : i === lista.length - 1 ? [0, t0, 1] : [0, t0, t1, 1]
    const valores = i === 0 ? ['visible', 'hidden', 'hidden'] : i === lista.length - 1 ? ['hidden', 'visible', 'visible'] : ['hidden', 'visible', 'hidden', 'hidden']
    const dibujo = vacio ? caminos(diferencia(base, g, vacio), s, dx, dy) : caminos(g, s, dx, dy)
    return `<g${i === 0 ? '' : ' visibility="hidden"'}>${dibujo}<animate attributeName="visibility" calcMode="discrete" values="${valores.join(';')}" keyTimes="${tiempos.map(num).join(';')}" dur="${num(total)}s" repeatCount="indefinite"/></g>`
  })
  return vacio ? caminos(base, s, dx, dy) + capas.join('') : capas.join('')
}

// Algo que aparece un rato cada `cada` segundos (huevos de pascua: el bicho, el conejo, la estrella).
export function cadaTanto(cuerpo, cada, visible, desfase = 0) {
  const a = num(desfase / cada), b = num(Math.min(1, (desfase + visible) / cada))
  // Con opacidad y no con visibilidad: un hijo con visibility="visible" se vería aunque el grupo esté oculto.
  return `<g opacity="0">${cuerpo}<animate attributeName="opacity" calcMode="discrete" values="0;1;0;0" keyTimes="0;${a};${b};1" dur="${num(cada)}s" repeatCount="indefinite"/></g>`
}

export const abrir = (w, h, cuerpo, alt = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"${alt ? ` role="img" aria-label="${alt.replace(/"/g, '&quot;')}"` : ''}>${cuerpo}</svg>`

// Líneas de barrido del CRT: una fila oscura cada `paso` píxeles, y una banda clara que baja despacio.
export function barrido(w, h, opts = {}) {
  const { paso = 3, quieto = false } = opts
  let d = ''
  for (let y = paso - 1; y < h; y += paso) d += `M0 ${y}h${w}v1h-${w}z`
  const lineas = `<path fill="#000" fill-opacity="0.32" d="${d}"/>`
  if (quieto) return lineas
  const banda = `<rect x="0" y="-24" width="${w}" height="24" fill="${F.g5}" fill-opacity="0.05"><animate attributeName="y" values="-24;${h}" dur="7s" repeatCount="indefinite"/></rect>`
  return lineas + banda
}
