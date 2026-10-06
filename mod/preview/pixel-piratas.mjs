// Motor de pixel art de la skin «Piratas»: grillas de colores, tramas, líneas y SVG con cuadros animados.
// Puro y sin dependencias. Lo usan el boceto (boceto-piratas.mjs) y, más adelante, los arte-*.ts de la skin.

export const grilla = (w, h) => Array.from({ length: h }, () => Array(w).fill(null))
export function pon(g, x, y, c) {
  x = Math.round(x); y = Math.round(y)
  if (c && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c
}
// Bayer 4x4 para tramar degradés y brillos.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
export const bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16

// Línea de Bresenham; `color(i)` puede variar a lo largo.
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

const num = n => String(Math.round(n * 1000) / 1000)

// Cuadros en bucle con SMIL discreto: [[grilla, segundos], …]. Si `quieto`, solo el primero.
export function cuadros(lista, s, dx = 0, dy = 0, quieto = false) {
  if (quieto || lista.length < 2) return caminos(lista[0][0], s, dx, dy)
  const total = lista.reduce((a, c) => a + c[1], 0)
  let t = 0
  return lista.map(([g, d], i) => {
    const t0 = t / total, t1 = (t + d) / total
    t += d
    const tiempos = i === 0 ? [0, t1, 1] : i === lista.length - 1 ? [0, t0, 1] : [0, t0, t1, 1]
    const valores = i === 0 ? ['visible', 'hidden', 'hidden'] : i === lista.length - 1 ? ['hidden', 'visible', 'visible'] : ['hidden', 'visible', 'hidden', 'hidden']
    return `<g${i === 0 ? '' : ' visibility="hidden"'}>${caminos(g, s, dx, dy)}<animate attributeName="visibility" calcMode="discrete" values="${valores.join(';')}" keyTimes="${tiempos.map(num).join(';')}" dur="${num(total)}s" repeatCount="indefinite"/></g>`
  }).join('')
}

export const abrir = (w, h, cuerpo, alt = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"${alt ? ` role="img" aria-label="${alt}"` : ''}>${cuerpo}</svg>`
