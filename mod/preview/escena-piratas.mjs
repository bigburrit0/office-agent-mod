// Escena de la skin «Piratas»: noche en el Caribe vista en corte. Arriba el cielo con luna, la isla del faro
// y la baranda del barco donde está el loro; abajo, bajo la línea de flotación, los subagentes nadan como peces.
// Grilla de 187 x 112 unidades (374 x 224 px a escala 2). Las partes animadas son capas chicas aparte.

import { abrir, bayer, caminos, cuadros, grilla, linea, mezcla, pon } from './pixel-piratas.mjs'
import { caraRobotSvg } from '../hooks/arte-loro.ts'

export const W = 187
export const H = 112
const HORIZONTE = 54
const FLOTACION = 62
const ARENA = 103

// Generador pseudoaleatorio con semilla (siempre la misma noche).
function azar(semilla) {
  let s = semilla >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

// Degradé vertical con trama entre bandas.
function degrade(g, y0, y1, colores, x0 = 0, x1 = W - 1) {
  const n = colores.length - 1
  for (let y = y0; y <= y1; y++) {
    const t = ((y - y0) / Math.max(1, y1 - y0)) * n
    const i = Math.min(n - 1, Math.floor(t)), f = t - i
    for (let x = x0; x <= x1; x++) pon(g, x, y, bayer(x, y) < f ? colores[i + 1] : colores[i])
  }
}

const mapa = (filas, colores) => filas.map(f => [...f].map(c => (c === '.' ? null : colores[c] ?? null)))
const estampar = (g, x0, y0, sprite) => sprite.forEach((f, j) => f.forEach((c, i) => { if (c) pon(g, x0 + i, y0 + j, c) }))

// Letras de 3 x 5 para el nombre del barco.
const LETRAS = {
  L: ['x..', 'x..', 'x..', 'x..', 'xxx'], A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'], G: ['.xx', 'x..', 'x.x', 'x.x', '.xx'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'], T: ['xxx', '.x.', '.x.', '.x.', '.x.'], ' ': ['...', '...', '...', '...', '...'],
}
function texto(g, x0, y0, t, color, sombra) {
  let x = x0
  for (const ch of t) {
    const l = LETRAS[ch] ?? LETRAS[' ']
    l.forEach((f, j) => [...f].forEach((c, i) => { if (c === 'x') { if (sombra) pon(g, x + i + 1, y0 + j + 1, sombra); pon(g, x + i, y0 + j, color) } }))
    x += ch === ' ' ? 2 : 4
  }
}

// ---- Cielo ----
function cielo(g) {
  degrade(g, 0, HORIZONTE, ['#0a0617', '#120b26', '#1b1036', '#2a1446', '#40175a', '#6a1d66', '#9a2a6e'])
  const r = azar(7)
  const fijas = []
  for (let k = 0; k < 70; k++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * 44)
    if (x > 140 && x < 172 && y < 30) continue // la luna
    fijas.push([x, y, r()])
  }
  for (const [x, y, b] of fijas) pon(g, x, y, b > 0.85 ? '#fff6e0' : b > 0.6 ? '#c9b8ff' : b > 0.4 ? '#8fe9ff' : '#6a5a8a')
  // Constelación con forma de ancla (huevo de pascua).
  for (const [x, y] of [[104, 5], [104, 8], [101, 8], [107, 8], [104, 12], [104, 16], [100, 15], [108, 15], [102, 18], [106, 18], [104, 19]]) {
    pon(g, x, y, '#fff3a8')
  }
}

function luna(g, guino) {
  const cx = 157, cy = 15, rr = 9
  for (let y = cy - rr - 3; y <= cy + rr + 3; y++) for (let x = cx - rr - 3; x <= cx + rr + 3; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
    if (d <= rr) {
      const u = (x + 0.5 - cx) / rr, v = (y + 0.5 - cy) / rr
      const i = -0.5 * u - 0.4 * v
      pon(g, x, y, i > 0.35 ? '#fffbe6' : i > -0.1 ? '#fff0b8' : i > -0.45 ? '#ead68e' : '#c9b06a')
    } else if (d <= rr + 1.6 && bayer(x, y) < 0.5) pon(g, x, y, '#4a2f6a')
    else if (d <= rr + 3 && bayer(x, y) < 0.18) pon(g, x, y, '#3a2458')
  }
  // Cráteres que, si mirás bien, son una cara (y cada tanto guiña).
  const crater = '#cdb877'
  pon(g, 153, 12, crater); pon(g, 154, 12, crater)
  if (guino) { pon(g, 159, 13, crater); pon(g, 160, 13, crater) } else { pon(g, 159, 12, crater); pon(g, 160, 12, crater) }
  for (const x of [154, 155, 156, 157, 158]) pon(g, x, x === 154 || x === 158 ? 17 : 18, crater)
  pon(g, 151, 16, '#e0c983'); pon(g, 162, 18, '#e0c983'); pon(g, 157, 9, '#e0c983')
}

function isla(g) {
  const sil = '#1a0f2e', sil2 = '#24143c'
  for (let x = 112; x <= 186; x++) {
    const h = Math.round(3 + 2.5 * Math.sin((x - 112) / 9) + (x > 160 ? 2 : 0))
    for (let y = HORIZONTE - h; y <= HORIZONTE; y++) pon(g, x, y, y === HORIZONTE - h ? sil2 : sil)
  }
  // Palmeras.
  for (const [bx, alto, lado] of [[126, 14, 1], [134, 11, -1], [146, 12, 1]]) {
    for (let k = 0; k < alto; k++) pon(g, bx + Math.round(lado * k * k / 60), HORIZONTE - 4 - k, sil)
    const tx = bx + Math.round(lado * alto * alto / 60), ty = HORIZONTE - 4 - alto
    for (const [dx, dy] of [[-5, 2], [-4, 1], [-3, 0], [-2, 0], [-1, -1], [0, -1], [1, -1], [2, 0], [3, 0], [4, 1], [5, 2], [-6, 3], [6, 3], [-1, 1], [1, 1]]) pon(g, tx + dx, ty + dy, sil)
  }
  // Faro.
  for (let y = HORIZONTE - 17; y <= HORIZONTE - 5; y++) for (let x = 173; x <= 176; x++) pon(g, x, y, (y >> 1) % 2 ? '#e8e0f0' : '#d23a5a')
  for (let x = 172; x <= 177; x++) pon(g, x, HORIZONTE - 18, sil)
  pon(g, 174, HORIZONTE - 20, '#fff3a8'); pon(g, 175, HORIZONTE - 20, '#fff3a8'); pon(g, 174, HORIZONTE - 19, '#ffdd55'); pon(g, 175, HORIZONTE - 19, '#ffdd55')
  for (let x = 173; x <= 176; x++) pon(g, x, HORIZONTE - 21, sil)
}

// ---- Mar ----
function mar(g) {
  degrade(g, HORIZONTE + 1, FLOTACION - 1, ['#1a1550', '#16205a', '#132a64'])
  degrade(g, FLOTACION, ARENA, ['#145082', '#103f70', '#0c305c', '#0a2448', '#081a36', '#061229'])
  // Rayos de luna bajo el agua (diagonales tramadas).
  for (const [x0, ancho] of [[150, 7], [128, 5], [168, 4]]) {
    for (let y = FLOTACION; y < ARENA - 4; y++) {
      const xs = x0 - Math.round((y - FLOTACION) * 0.45)
      const fuerza = 1 - (y - FLOTACION) / (ARENA - FLOTACION)
      for (let x = xs; x < xs + ancho; x++) {
        const c = g[y]?.[x]
        if (c && bayer(x, y) < 0.42 * fuerza) pon(g, x, y, mezcla(c, '#7fd8ff', 0.22))
      }
    }
  }
  // Reflejo de la luna en el agua lejana: rayas horizontales que se abren hacia abajo.
  for (let y = HORIZONTE + 1; y < FLOTACION; y++) {
    const k = y - HORIZONTE
    if (k % 2 === 0) continue
    const ancho = 2 + Math.round(k * 0.7)
    for (let x = 157 - ancho; x <= 157 + ancho; x++) {
      if ((x + k * 3) % 5 < 3) pon(g, x, y, Math.abs(x - 157) < 2 ? '#fff0b8' : '#b8a46a')
    }
  }
}

function arena(g) {
  for (let y = ARENA; y < H; y++) for (let x = 0; x < W; x++) {
    const ondita = Math.round(Math.sin(x / 7) * 1.2)
    if (y < ARENA + ondita) continue
    const prof = y - ARENA - ondita
    pon(g, x, y, prof === 0 ? '#e0bd73' : bayer(x, y) < 0.3 ? '#8a6a35' : prof < 3 ? '#c9a35a' : '#a8823f')
  }
  // Caracoles, estrella de mar y una botella con mensaje (huevo de pascua).
  for (const [x, y] of [[96, 107], [118, 109], [183, 106]]) { pon(g, x, y, '#fff0e0'); pon(g, x + 1, y, '#ffb3c8'); pon(g, x, y - 1, '#ffb3c8') }
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 1], [2, 1], [0, 1]]) pon(g, 108 + dx, 106 + dy, dx === 0 && dy === 0 ? '#ffd0a0' : '#ff7a4a')
  estampar(g, 84, 104, mapa(['.oo.....', 'oggoooo.', 'ogwpppgo', 'ogggggo.', '.ooooo..'], { o: '#0d2a24', g: '#2f8a6a', w: '#c8fff0', p: '#f0e2c0' }))
}

function algas(g, f) {
  const capa = grilla(W, H)
  for (const [bx, alto] of [[90, 16], [93, 11], [139, 18], [142, 13], [180, 15]]) {
    for (let k = 0; k < alto; k++) {
      const x = bx + Math.round(Math.sin(k / 3 + f * 1.4) * 1.5)
      pon(capa, x, ARENA - k, k % 3 === 0 ? '#3fe0a0' : '#1f9a6e')
      if (k % 4 === 2) pon(capa, x + (f ? 1 : -1), ARENA - k, '#167a56')
    }
  }
  return capa
}

function coral(g) {
  const c1 = '#ff2e88', c2 = '#b5136a', c3 = '#ff8cc3'
  const rama = (x, y, dx, n) => { for (let k = 0; k < n; k++) { pon(g, x + Math.round(dx * k), y - k, k === n - 1 ? c3 : k % 2 ? c1 : c2) } }
  for (const [x, n] of [[118, 9], [121, 12], [124, 8]]) { rama(x, ARENA + 1, 0, n); rama(x, ARENA - 3, -0.6, 5); rama(x, ARENA - 5, 0.6, 5) }
  // Anémona turquesa.
  for (let k = -3; k <= 3; k++) for (let j = 0; j < 4 - Math.abs(k) / 2; j++) pon(g, 131 + k, ARENA - j, j === 3 ? '#8ffff0' : '#21e6c1')
}

function cofre(g, brillo) {
  // Cofre del tesoro medio enterrado, tapa entreabierta.
  const x0 = 152, y0 = 92
  estampar(g, x0, y0, mapa([
    '..oooooooooooooo..',
    '.o3333333333333o..',
    'o322222g22222223o.',
    'o3333333g3333333o.',
    'ozzYzzYzzYzzYzzzo.',
    'oYgggggggggggggGo.',
    'o4444444oo4444444o',
    'o3333333og3333333o',
    'o3333333oo3333333o',
    'o3gg333333333gg33o',
    'oooooooooooooooooo',
  ], { o: '#1a0f12', '2': '#9c6a3a', '3': '#74492a', '4': '#4b2e1b', g: '#f2b632', G: '#b8771a', z: '#fff3a8', Y: '#ffdd55' }))
  if (brillo) for (const [x, y] of [[155, 94], [160, 93], [165, 94], [158, 91], [163, 90]]) pon(g, x, y, '#fff3a8')
}

// ---- Barco ----
function barco(g) {
  // Mástil detrás del loro y bandera pirata arriba.
  for (let y = 0; y <= 46; y++) { pon(g, 73, y, '#9c6a3a'); pon(g, 74, y, '#74492a'); pon(g, 75, y, '#2a1910') }
  for (let x = 64; x <= 84; x++) pon(g, x, 9, x === 64 || x === 84 ? '#2a1910' : '#4b2e1b') // verga
  // Casco: de la baranda (y 48) hasta abajo del agua, con la proa a la derecha.
  const proa = y => (y < 56 ? 92 + Math.round((y - 48) * 0.8) : 98 - Math.round((y - 56) * 2.4))
  for (let y = 48; y <= 80; y++) {
    const xd = proa(y)
    for (let x = 0; x <= xd; x++) {
      const tabla = (y - 48) % 4 === 3
      let c = tabla ? '#2a1910' : (x * 7 + y * 13) % 23 === 0 ? '#4b2e1b' : '#5e3a22'
      if (x === xd || x === xd - 1) c = '#1a0f12'
      if (y >= FLOTACION) c = tabla ? '#0a1820' : (x * 13 + y * 7) % 37 === 0 || (x * 5 + y * 11) % 43 === 0 ? '#1d4a3a' : '#16272f' // bajo el agua, con algas
      if (y >= FLOTACION && y < FLOTACION + 6 && (x * 5 + y * 3) % 41 === 0) c = '#8a8070' // percebes
      if (x >= xd - 1) c = '#06121a'
      pon(g, x, y, c)
    }
  }
  // Ribete dorado y línea de flotación.
  for (let x = 0; x <= proa(52); x++) { pon(g, x, 52, '#f2b632'); pon(g, x, 53, '#b8771a') }
  for (let x = 0; x <= proa(FLOTACION - 1); x++) pon(g, x, FLOTACION - 1, '#d23a5a')
  // Ojos de buey con luz cálida.
  for (const x of [14, 30, 46]) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const d = Math.hypot(dx, dy)
      if (d <= 2.6) pon(g, x + dx, 57 + dy, d > 1.8 ? '#b8771a' : '#ffdd55')
    }
    pon(g, x - 1, 56, '#fff3a8')
  }
  // Nombre en la proa.
  texto(g, 55, 54, 'LA GALLETA', '#fff3a8', '#6e4210')
  // Mascarón de proa: una sirena-loro tallada (cabeza y ala).
  estampar(g, 95, 44, mapa(['.oo..', 'ogYo.', 'oggGo', '.oGGo', '..oo.'], { o: '#1a0f12', g: '#f2b632', Y: '#fff3a8', G: '#b8771a' }))
  // Bauprés.
  linea(g, 92, 47, 124, 33, '#74492a'); linea(g, 92, 48, 124, 34, '#4b2e1b')
  linea(g, 75, 3, 124, 33, '#9c8763')
  linea(g, 75, 12, 92, 46, '#6b5a3e')
  // Ancla colgando con su cadena hasta la arena.
  for (let y = 50; y <= 96; y++) pon(g, 99 + Math.round(Math.sin(y / 5)), y, y % 2 ? '#8a93a0' : '#555d69')
  estampar(g, 95, 95, mapa(['...oo...', '..oggo..', '...gg...', 'g..gg..g', 'gg.gg.gg', '.gggggg.', '..g..g..'], { o: '#2a2233', g: '#7a8494' }))
}

function bandera(f) {
  const capa = grilla(W, H)
  const X0 = 76
  const off = x => Math.round(Math.sin((x - X0) / 3 + f * 1.6) * (x - X0) / 8)
  for (let x = X0; x <= X0 + 16; x++) {
    for (let y = 1; y <= 11; y++) {
      if (x === X0 + 16 && (y === 3 || y === 8)) continue
      const pl = Math.sin((x - X0) / 3 + f * 1.6) > 0.4
      pon(capa, x, y + off(x), pl ? '#2b2142' : '#160f24')
    }
  }
  for (const [dx, y] of [[6, 4], [7, 4], [8, 4], [5, 5], [6, 5], [8, 5], [9, 5], [6, 6], [7, 6], [8, 6], [6, 7], [8, 7], [7, 5]]) pon(capa, X0 + dx, y + off(X0 + dx), '#fff6e0')
  for (const [dx, y] of [[3, 8], [4, 9], [10, 9], [11, 8], [3, 2], [11, 2]]) pon(capa, X0 + dx, y + off(X0 + dx), '#ff2e88')
  pon(capa, 74, 0, '#f2b632')
  return capa
}

function faroles(f) {
  const capa = grilla(W, H)
  for (const x of [70, 86]) {
    pon(capa, x, 41, '#2a1910'); pon(capa, x + 1, 41, '#2a1910')
    for (let y = 42; y <= 45; y++) { pon(capa, x - 1, y, '#1a0f12'); pon(capa, x + 2, y, '#1a0f12') }
    for (let y = 42; y <= 45; y++) for (let k = 0; k < 2; k++) pon(capa, x + k, y, f ? '#ff5fa8' : '#ff2e88')
    pon(capa, x, 43, f ? '#ffd0e6' : '#ffb3d6')
    if (f) { pon(capa, x - 2, 43, '#6a1d66'); pon(capa, x + 3, 43, '#6a1d66') }
  }
  return capa
}

function baranda(g) {
  for (let x = 66; x <= 93; x++) { pon(g, x, 46, '#9c6a3a'); pon(g, x, 47, '#4b2e1b') }
  for (let x = 68; x <= 92; x += 4) for (let y = 40; y <= 45; y++) pon(g, x, y, y === 40 ? '#c9935a' : '#74492a')
  for (let x = 66; x <= 93; x++) pon(g, x, 39, '#c9935a')
  // Luz de los faroles sobre la madera.
  for (const x of [69, 70, 72, 73, 85, 86, 88, 89]) pon(g, x, 46, '#d9739a')
}

// ---- Capas animadas ----
function olas(f) {
  const capa = grilla(W, H)
  for (let x = 0; x < W; x++) {
    const fase = (x + f * 3) % 12
    if (fase < 4) pon(capa, x, FLOTACION, '#21e6c1')
    else if (fase < 6) pon(capa, x, FLOTACION, '#118f7a')
    if (fase === 2) pon(capa, x, FLOTACION - 1, '#8fffea')
    if ((x + f * 2) % 17 === 0) pon(capa, x, HORIZONTE + 2, '#2a5aa0')
  }
  return capa
}

function plancton(f) {
  const capa = grilla(W, H)
  const r = azar(11 + f)
  for (let k = 0; k < 26; k++) pon(capa, 100 + Math.floor(r() * 86), FLOTACION + 3 + Math.floor(r() * 38), r() > 0.5 ? '#21e6c1' : '#8fffea')
  return capa
}

function faro(f) {
  const capa = grilla(W, H)
  const y = HORIZONTE - 20
  for (let k = 1; k < 26; k++) {
    const x = f ? 174 - k : 176 + k
    if (x < 0 || x >= W) continue
    const spread = Math.floor(k / 6)
    for (let s = -spread; s <= spread; s++) if (bayer(x, y + s) < 0.6 - k / 50) pon(capa, x, y + s, '#fff3a8')
  }
  return capa
}

function gato(f) {
  // Huevo de pascua: el gato del barco mira por el ojo de buey del medio (y parpadea).
  const capa = grilla(W, H)
  estampar(capa, 28, 55, mapa(f ? ['o.o.o', 'ooooo', 'kkokk', 'ooPoo'] : ['o.o.o', 'ooooo', 'gkogk', 'ooPoo'], { o: '#2a2233', k: '#2a2233', g: '#9fff6a', P: '#ff8cc3' }))
  return capa
}

function pulpo(f) {
  // Huevo de pascua: un pulpito con tricornio se asoma del cofre.
  const capa = grilla(W, H)
  if (f) estampar(capa, 157, 85, mapa(['..hhhh..', '.hhzhhh.', 'hhhhhhhh', '..pppp..', '.pwppwp.', '.pkppkp.', '.pppppp.'], { h: '#2b2142', z: '#fff6e0', p: '#c46aff', w: '#fff6e0', k: '#140c1c' }))
  return capa
}

function tentaculo(f) {
  // Huevo de pascua: cada tanto un tentáculo del kraken sale de la arena, saluda y se vuelve.
  const capa = grilla(W, H)
  const alto = [0, 8, 18, 26][f]
  for (let k = 0; k < alto; k++) {
    const x = 176 + Math.round(Math.sin(k / 4) * 2) + (k > alto - 5 ? Math.round((k - alto + 5) * 0.8) : 0)
    const ancho = Math.max(1, 4 - Math.floor(k / 8))
    for (let d = 0; d < ancho; d++) pon(capa, x + d, ARENA - k, d === 0 ? '#5a1a7a' : '#8a2aa8')
    if (k % 3 === 1 && ancho > 1) pon(capa, x + ancho - 1, ARENA - k, '#f0a0ff')
  }
  return capa
}

// ---- Peces (los subagentes) ----
const PEZ = [
  '.....oooo.......',
  '....o5566o......',
  'oo..oo11122oo...',
  'o6o.o1112222oo..',
  'o66o1112222wk3o.',
  'o666o112222kk23o',
  '.o66o112222222ko',
  'o666obbb2222333o',
  'o66o.bbbbb3333o.',
  'o6o..obbbb333o..',
  'oo....oo66oooo..',
  '........oo......',
]
const PEZ_COLA = PEZ.map((f, j) => (j >= 3 && j <= 9 ? '.' + f.slice(0, 3).replace(/6/g, '5') + f.slice(4) : f))
const PROPS = {
  laptop: ['...ooooo', '...onNno', '...oNnNo', '..oooooo', '..oqqqqo'],
  catalejo: ['oGgYgzo'],
  mapa: ['oooooo', 'opppppo', 'opcpcpo', 'occpcco', 'oooooo'],
  anteojos: ['.ooo.ooo', 'o...o...o', '.ooo.ooo'],
  sombrero: ['....oo....', '..oohhoo..', '.ohhzhhho.', 'oYYYYYYYYo', '.oooooooo.'],
  llaves: ['.oo', 'o.o', '.oo', '.g.', '.gg', '.g.', '.gg'],
}
const MAPA_PROPS = { o: '#140c1c', n: '#21e6c1', N: '#8fffea', q: '#3f335f', G: '#b8771a', g: '#f2b632', Y: '#ffdd55', z: '#fff6e0', p: '#f0e2c0', c: '#ff2e88', h: '#2b2142' }

export function pezGrilla(colorEquipo, oscuro, prop, cola = 0) {
  const pal = {
    o: '#140c1c', w: '#fff6e0', k: '#140c1c',
    1: mezcla(colorEquipo, '#ffffff', 0.35), 2: colorEquipo, 3: oscuro, b: mezcla(colorEquipo, '#fff6e0', 0.55),
    5: mezcla(colorEquipo, '#ffffff', 0.15), 6: oscuro,
  }
  const g = grilla(24, 16)
  estampar(g, 2, 3, mapa(cola ? PEZ_COLA : PEZ, pal))
  if (prop === 'laptop') estampar(g, 14, 8, mapa(PROPS.laptop, MAPA_PROPS))
  if (prop === 'catalejo') estampar(g, 15, 6, mapa(PROPS.catalejo, MAPA_PROPS))
  if (prop === 'mapa') estampar(g, 5, 11, mapa(PROPS.mapa, MAPA_PROPS))
  if (prop === 'anteojos') estampar(g, 11, 6, mapa(PROPS.anteojos, MAPA_PROPS))
  if (prop === 'sombrero') estampar(g, 6, 0, mapa(PROPS.sombrero, MAPA_PROPS))
  if (prop === 'llaves') estampar(g, 17, 9, mapa(PROPS.llaves, MAPA_PROPS))
  return g
}

const TIBURON = [
  '..............oo..............',
  '.............o12o.............',
  '............o1123o............',
  '.......ooooo11223ooooo....ooo.',
  '.....oo11111122222223oo..o33o.',
  '...oo11ko111222222223333oo333o',
  '..o1111111122222222223333333o.',
  '.o1bbbbbbbb2222222222233333o..',
  'o1owgwwwwwobbbbbbb2223333o....',
  '.oobbbbbbbbbbbbbbbb33ooo......',
  '...oobbbbbbbbbbb333o..........',
  '.....oooo33ooooooo............',
  '........o3o...................',
]
export function tiburonGrilla() {
  const pal = { o: '#140c1c', 1: '#c7d3e0', 2: '#8a9bb0', 3: '#5d6e86', b: '#eef2f7', k: '#140c1c', w: '#fff6e0', g: '#f2b632' }
  return mapa(TIBURON, pal)
}

export const EQUIPOS = {
  'dev-a1': ['#f08a24', '#9c4f0c', 'laptop'],
  research: ['#5aa9e6', '#2f6ea3', 'catalejo'],
  datos: ['#2cc6d0', '#16777d', 'mapa'],
  librarian: ['#8a6fb0', '#533f75', 'anteojos'],
  seguridad: ['#d04a3c', '#8a2a20', 'sombrero'],
  facilities: ['#e070a8', '#93355f', 'llaves'],
}

// ---- Armado ----
// o: { emocion, peces: [equipo…], tiburon: bool, quieto }
export function escenaSvg(o = {}) {
  const s = 2
  const quieto = o.quieto === true
  const g = grilla(W, H)
  cielo(g)
  luna(g, false)
  isla(g)
  mar(g)
  arena(g)
  coral(g)
  barco(g)
  baranda(g)
  cofre(g, false)

  const capa = (frames, dur) => cuadros(frames.map((fr, i) => [fr, Array.isArray(dur) ? dur[i] : dur]), s, 0, 0, quieto)
  let anim = ''
  anim += capa([bandera(0), bandera(1)], 0.5)
  anim += capa([olas(0), olas(1), olas(2), olas(3)], 0.35)
  anim += capa([algas(g, 0), algas(g, 1)], 0.9)
  anim += capa([plancton(0), plancton(1), plancton(2)], 0.7)
  anim += capa([faro(0), faro(1)], 1.4)
  anim += capa([faroles(0), faroles(1), faroles(0), faroles(1)], [0.9, 0.08, 0.2, 0.06])
  anim += capa([gato(0), gato(1), gato(0), grilla(W, H)], [3.5, 0.15, 2, 6])
  anim += capa([pulpo(0), pulpo(1)], [9, 2.4])
  anim += capa([tentaculo(0), tentaculo(1), tentaculo(2), tentaculo(3), tentaculo(2), tentaculo(1)], [31, 0.25, 0.25, 2.6, 0.25, 0.25])
  // Luna que guiña cada tanto.
  const lunaGuino = grilla(W, H); luna(lunaGuino, true)
  const recorte = gr => gr.map((f, y) => f.map((c, x) => (x >= 150 && x <= 164 && y >= 11 && y <= 14 ? c : null)))
  anim += capa([grilla(W, H), recorte(lunaGuino)], [27, 0.5])
  // Brillo del cofre.
  const brillo = grilla(W, H); cofre(brillo, true)
  anim += capa([grilla(W, H), brillo.map((f, y) => f.map((c, x) => (y < 95 && c === '#fff3a8' ? c : null)))], [0.8, 0.8])

  // Peces nadando en su lugar (suben y bajan un píxel y mueven la cola).
  let peces = ''
  const lugares = [[108, 66], [140, 64], [166, 72], [112, 84], [136, 80], [160, 88]]
  ;(o.peces ?? Object.keys(EQUIPOS)).slice(0, 6).forEach((eq, i) => {
    const [c, d, prop] = EQUIPOS[eq]
    const [x, y] = lugares[i]
    const espejo = i % 2 === 1
    const f0 = pezGrilla(c, d, prop, 0), f1 = pezGrilla(c, d, prop, 1)
    const fl = espejo ? [f0, f1].map(gr => gr.map(r => r.slice().reverse())) : [f0, f1]
    const cuerpo = cuadros([[fl[0], 0.3 + i * 0.03], [fl[1], 0.3 + i * 0.03]], s, x, y, quieto)
    const mueve = quieto ? '' : `<animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0;0 2;0 0" dur="${2.2 + i * 0.3}s" repeatCount="indefinite"/>`
    peces += `<g>${cuerpo}${mueve}</g>`
    // Burbujas que suben.
    if (!quieto) {
      const bx = (x + (espejo ? 2 : 18)) * s, by = (y + 6) * s
      peces += `<rect x="${bx}" y="${by}" width="2" height="2" fill="#8fffea" opacity="0"><animate attributeName="y" values="${by};${by - 26}" dur="2.6s" begin="${i * 0.7}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="2.6s" begin="${i * 0.7}s" repeatCount="indefinite"/></rect>`
    }
  })
  if (o.tiburon !== false) {
    const t = cuadros([[tiburonGrilla(), 1]], s, 74, 88, true)
    peces += `<g>${t}${quieto ? '' : '<animateTransform attributeName="transform" type="translate" values="0 0;-14 2;0 0" dur="11s" repeatCount="indefinite"/>'}</g>`
  }

  // Patito de goma flotando (huevo de pascua).
  const pato = mapa(['..yy..', '.yyko.', 'yyyyoo', '.yyyy.'], { y: '#ffd84a', k: '#140c1c', o: '#ff8a3d' })
  const pg = grilla(W, H); estampar(pg, 118, FLOTACION - 4, pato)
  const patito = `<g>${caminos(pg, s)}${quieto ? '' : '<animateTransform attributeName="transform" type="translate" values="0 0;0 1;0 0;0 -1;0 0" dur="1.8s" repeatCount="indefinite"/>'}</g>`

  // Estrella fugaz (cada 19 s).
  const fugaz = quieto ? '' : `<g opacity="0"><rect x="60" y="14" width="2" height="2" fill="#fff6e0"/><rect x="56" y="12" width="4" height="2" fill="#c9b8ff"/><rect x="50" y="10" width="6" height="2" fill="#6a5a8a"/>` +
    `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.9;0.91;0.95;1" dur="19s" repeatCount="indefinite"/>` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 0;60 24;60 24" keyTimes="0;0.9;0.91;0.95;1" dur="19s" repeatCount="indefinite"/></g>`

  // El loro, parado en la baranda (su percha es la baranda).
  // El loro del mod (hooks/arte-loro.ts), anidado como SVG aparte igual que en el panel.
  const loroSvg = caraRobotSvg(o.emocion ?? 'aburrido', 3, { quieto })
  const loroG = `<g transform="translate(4 2)">${loroSvg}</g>`

  return abrir(W * s, H * s, caminos(g, s) + anim + patito + peces + fugaz + loroG, 'Noche en el Caribe: el loro en la baranda y los subagentes nadando bajo el barco')
}
