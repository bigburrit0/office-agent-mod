// Boceto de la skin «Piratas» (docs/plan-skin-piratas.md): el estilo antes de redibujar todo el mod.
// Mismo sistema que arte-robot.ts: grillas de caracteres pintadas como rectángulos, sin scripts.
// Uso: node mod/preview/boceto-piratas.mjs → mod/tests/salida/boceto-piratas.html

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---- Paleta Caribe de noche, neón (respuestas de Nimai: fondo #120b1f, principal #21e6c1, acento #ff2e88) ----
const PAL = {
  o: '#0b0614', // contorno
  n: '#120b1f', // noche
  N: '#1d1238', // noche clara
  m: '#14204a', // mar profundo
  M: '#1f3b73', // mar
  t: '#21e6c1', // turquesa neón (espuma, bioluminiscencia)
  T: '#118f7a', // turquesa oscuro
  p: '#ff2e88', // magenta neón
  P: '#a3125a', // magenta oscuro
  g: '#f9d342', // oro
  G: '#b8860b', // oro oscuro
  w: '#fff6e0', // blanco hueso
  k: '#120b1f', // negro
  h: '#2a2140', // sombrero
  H: '#463868', // sombrero brillo
  r: '#e8344a', // loro rojo
  R: '#9e1b30', // loro rojo oscuro
  b: '#2b6fd6', // ala azul
  v: '#2fbf71', // ala verde
  y: '#ffc93c', // pico
  Y: '#a86a12', // pico oscuro
  f: '#ffe9d6', // cara clara del guacamayo
  c: '#6b4a2b', // madera
  C: '#4a321c', // madera oscura
  s: '#e9dfc6', // vela
  S: '#b9ad8f', // vela sombra
  l: '#fff3a8', // luna / farol
  z: '#8a93a0', // tiburón
  Z: '#555d69', // tiburón oscuro
}

const vacia = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'))
const px = (g, x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c }
const rect = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c) }
const copia = g => g.map(f => f.slice())

function svgDe(g, s, pal = PAL, extra = '') {
  const porColor = {}
  for (let y = 0; y < g.length; y++) {
    let x = 0
    while (x < g[y].length) {
      const c = g[y][x]
      if (c === '.' || !pal[c]) { x++; continue }
      let x2 = x
      while (x2 + 1 < g[y].length && g[y][x2 + 1] === c) x2++
      const w = (x2 - x + 1) * s
      porColor[c] = (porColor[c] || '') + `M${x * s} ${y * s}h${w}v${s}h-${w}z`
      x = x2 + 1
    }
  }
  const W = g[0].length * s, H = g.length * s
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">` +
    Object.entries(porColor).map(([c, d]) => `<path fill="${pal[c]}" d="${d}"/>`).join('') + extra + '</svg>'
}

// ---- El loro (mismo lienzo que el robot: 34 x 26) ----
function loroBase() {
  const g = vacia(34, 26)
  // Cabeza roja redondeada.
  rect(g, 8, 9, 18, 16, 'o')
  rect(g, 9, 8, 16, 1, 'o')
  rect(g, 9, 10, 16, 14, 'r')
  rect(g, 10, 9, 14, 1, 'r')
  rect(g, 9, 22, 16, 2, 'R')
  rect(g, 24, 11, 1, 12, 'R')
  // Plumas de la nuca (verde y azul), asoman a la izquierda.
  rect(g, 5, 14, 4, 2, 'v'); rect(g, 4, 16, 5, 2, 'b'); rect(g, 6, 18, 3, 2, 'v')
  px(g, 4, 14, 'o'); px(g, 3, 16, 'o'); px(g, 5, 18, 'o')
  // Tricornio con calavera y ribete de oro.
  rect(g, 4, 7, 26, 3, 'o')
  rect(g, 5, 8, 24, 1, 'h')
  rect(g, 4, 9, 26, 1, 'g')
  rect(g, 9, 1, 16, 6, 'o')
  rect(g, 10, 2, 14, 5, 'h')
  rect(g, 10, 2, 14, 1, 'H')
  rect(g, 6, 5, 4, 2, 'o'); rect(g, 24, 5, 4, 2, 'o')
  rect(g, 7, 5, 3, 1, 'h'); rect(g, 24, 5, 3, 1, 'h')
  // Calavera.
  rect(g, 15, 3, 4, 3, 'w'); px(g, 15, 4, 'k'); px(g, 18, 4, 'k'); px(g, 16, 5, 'k'); px(g, 17, 5, 'k')
  px(g, 14, 6, 'w'); px(g, 19, 6, 'w'); px(g, 14, 2, 'w'); px(g, 19, 2, 'w')
  // Parche: tira y ojo tapado (izquierda).
  for (let x = 9; x <= 24; x++) px(g, x, 11 + Math.round((x - 9) / 8), 'k')
  rect(g, 11, 12, 4, 4, 'k'); px(g, 12, 13, 'N')
  // Cara clara del guacamayo y ojo (derecha).
  rect(g, 17, 12, 6, 6, 'f')
  rect(g, 19, 13, 3, 3, 'w'); rect(g, 20, 14, 1, 1, 'k')
  // Pico ganchudo.
  rect(g, 21, 16, 8, 4, 'o')
  rect(g, 22, 17, 6, 2, 'y')
  rect(g, 27, 19, 3, 4, 'o'); px(g, 28, 20, 'y'); px(g, 28, 21, 'y')
  rect(g, 22, 20, 5, 2, 'Y'); rect(g, 22, 22, 4, 1, 'o')
  return g
}
const BASE = loroBase()

const EMOCIONES = {
  vigia: { alt: 'loro vigía', grilla: () => copia(BASE) },
  contento: {
    alt: 'loro muerto de risa',
    grilla: () => {
      const g = copia(BASE)
      rect(g, 19, 13, 3, 3, 'f'); px(g, 19, 14, 'k'); px(g, 20, 13, 'k'); px(g, 21, 14, 'k') // ojo ^
      rect(g, 22, 20, 5, 3, 'p'); rect(g, 22, 23, 5, 1, 'o') // pico abierto, lengua
      px(g, 31, 10, 'g'); px(g, 32, 9, 'g'); px(g, 30, 8, 'g') // chispas
      return g
    },
  },
  panico: {
    alt: 'loro en pánico',
    grilla: () => {
      const g = copia(BASE)
      rect(g, 18, 12, 5, 5, 'w'); rect(g, 20, 14, 1, 1, 'k') // ojo enorme
      rect(g, 22, 20, 5, 3, 'k') // grito
      px(g, 26, 13, 't'); px(g, 26, 14, 't'); px(g, 27, 15, 't') // gota
      rect(g, 2, 11, 2, 1, 'v'); rect(g, 1, 13, 3, 1, 'b'); rect(g, 30, 12, 2, 1, 'r') // plumas al aire
      return g
    },
  },
  dormido: {
    alt: 'loro dormido',
    grilla: () => {
      const g = copia(BASE)
      rect(g, 19, 13, 3, 3, 'f'); rect(g, 19, 15, 3, 1, 'k') // ojo cerrado
      // z z z
      rect(g, 28, 3, 3, 1, 'l'); px(g, 29, 4, 'l'); rect(g, 28, 5, 3, 1, 'l')
      rect(g, 31, 0, 2, 1, 'l'); px(g, 31, 1, 'l'); rect(g, 31, 1, 2, 1, 'l')
      return g
    },
  },
}

// ---- Escena: cubierta de noche con el loro en la cofa (374 px, escala 2 → 187 unidades) ----
function escena(emocion, peces) {
  const W = 187, H = 82
  const g = vacia(W, H)
  rect(g, 0, 0, W, H, 'n')
  rect(g, 0, 0, W, 12, 'N')
  // Estrellas y luna.
  for (const [x, y] of [[8, 3], [30, 9], [52, 4], [77, 14], [120, 6], [140, 12], [168, 3], [180, 16], [96, 2]]) px(g, x, y, 'w')
  rect(g, 150, 4, 8, 8, 'l'); rect(g, 149, 5, 1, 6, 'l'); rect(g, 158, 5, 1, 6, 'l'); rect(g, 153, 5, 3, 3, 'g')
  // Mástil, verga y vela.
  rect(g, 30, 0, 3, 56, 'C'); rect(g, 31, 0, 1, 56, 'c')
  rect(g, 14, 10, 36, 2, 'C')
  for (let y = 12; y < 40; y++) { const a = 14 + Math.floor((y - 12) / 6); rect(g, a, y, 50 - a * 2 + 14, 1, y % 7 === 0 ? 'S' : 's') }
  rect(g, 18, 22, 6, 6, 'k'); px(g, 19, 23, 'w'); px(g, 22, 23, 'w') // calavera pintada en la vela
  // Cofa donde se para el loro.
  rect(g, 66, 40, 50, 3, 'C'); rect(g, 66, 39, 50, 1, 'c')
  // Cuerdas.
  for (let i = 0; i < 40; i++) { px(g, 33 + i, 2 + Math.floor(i * 0.9), 'c') }
  // Barandilla y cubierta.
  rect(g, 0, 56, W, 3, 'C'); for (let x = 2; x < W; x += 9) rect(g, x, 50, 2, 6, 'c')
  rect(g, 0, 50, W, 1, 'c')
  // Faroles magenta.
  for (const x of [52, 130]) { rect(g, x, 46, 4, 4, 'p'); rect(g, x + 1, 45, 2, 1, 'g') }
  // Mar con espuma neón.
  rect(g, 0, 59, W, 23, 'm')
  rect(g, 0, 59, W, 2, 'M')
  for (let x = 0; x < W; x += 6) { px(g, x, 59, 't'); px(g, x + 1, 59, 't'); px(g, x + 3, 61, 'T') }
  // Peces nadando bajo la línea de flotación.
  let x = 8
  for (const pez of peces) { dibujarPez(g, x, 65, pez); x += 30 }
  const loro = svgDe(EMOCIONES[emocion].grilla(), 3)
  const fondo = svgDe(g, 2)
  // El loro (102 x 78 px) parado sobre la cofa (y = 80 px).
  return fondo.replace('</svg>', `<g transform="translate(150 4)">${loro.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`)
}

// Cada color de equipo usa dos dígitos libres de la paleta (1-2, 3-4, …) para que varios peces convivan en una grilla.
let libre = 0
function colorEnPaleta(color, oscuro) {
  const a = String.fromCharCode(49 + libre * 2), b = String.fromCharCode(50 + libre * 2)
  libre += 1
  PAL[a] = color; PAL[b] = oscuro
  return [a, b]
}

// ---- Peces y tiburón (en vez de oficinistas). El color del cuerpo es el del equipo. ----
function dibujarPez(g, x, y, { tipo, color, oscuro }) {
  const P = { ...PAL }
  if (tipo === 'tiburon') {
    rect(g, x, y + 4, 20, 6, 'o'); rect(g, x + 1, y + 5, 18, 4, 'z'); rect(g, x + 1, y + 8, 16, 1, 'w')
    rect(g, x + 8, y, 4, 4, 'o'); rect(g, x + 9, y + 1, 2, 3, 'z') // aleta
    rect(g, x + 20, y + 2, 3, 10, 'o'); px(g, x + 21, y + 4, 'Z'); px(g, x + 21, y + 9, 'Z') // cola
    px(g, x + 3, y + 6, 'k'); rect(g, x + 2, y + 8, 4, 1, 'k'); px(g, x + 3, y + 8, 'w'); px(g, x + 5, y + 8, 'w') // ojo y dientes
    return
  }
  // pez: el color del equipo va en dos caracteres propios de este pez
  const [c1, c2] = colorEnPaleta(color, oscuro)
  rect(g, x + 3, y + 3, 12, 7, 'o'); rect(g, x + 4, y + 4, 10, 5, c1); rect(g, x + 4, y + 8, 10, 1, c2)
  rect(g, x + 2, y + 5, 1, 3, 'o')
  rect(g, x + 15, y + 2, 4, 9, 'o'); rect(g, x + 16, y + 3, 2, 3, c2); rect(g, x + 16, y + 7, 2, 3, c2) // cola
  rect(g, x + 6, y + 1, 5, 2, 'o'); rect(g, x + 7, y + 2, 3, 1, c2) // aleta
  rect(g, x + 4, y + 5, 2, 2, 'w'); px(g, x + 4, y + 5, 'k') // ojo
  px(g, x + 1, y + 2, 't'); px(g, x, y, 't') // burbujas
  if (tipo === 'laptop') { rect(g, x + 7, y + 10, 6, 3, 'o'); rect(g, x + 8, y + 10, 4, 2, 't') } // dev programa
  if (tipo === 'catalejo') { rect(g, x - 3, y + 5, 4, 2, 'g'); px(g, x - 4, y + 5, 'G') } // research
  if (tipo === 'mapa') { rect(g, x + 6, y + 10, 6, 4, 's'); px(g, x + 9, y + 12, 'p') } // datos / dirección
}

// ---- Banderas de equipo (24 x 24): calavera con huesos del color del equipo ----
function bandera(color, oscuro) {
  PAL['1'] = color; PAL['2'] = oscuro
  const g = vacia(24, 24)
  rect(g, 1, 0, 2, 24, 'C')
  rect(g, 3, 2, 20, 15, 'o'); rect(g, 4, 3, 18, 13, 'n')
  for (let i = 0; i < 12; i++) { px(g, 7 + i, 5 + Math.floor(i * 0.8), '1'); px(g, 18 - i, 5 + Math.floor(i * 0.8), '1') }
  rect(g, 10, 5, 6, 5, 'w'); rect(g, 11, 10, 4, 2, 'w')
  rect(g, 11, 7, 1, 1, 'k'); rect(g, 14, 7, 1, 1, 'k'); px(g, 12, 11, 'k'); px(g, 13, 11, 'k')
  rect(g, 4, 15, 18, 1, '2')
  return svgDe(g, 3)
}

// ---- Página ----
const EQUIPOS = {
  'dev-a1': ['#f08a24', '#9c4f0c'],
  research: ['#5aa9e6', '#2f6ea3'],
  datos: ['#2cc6d0', '#16777d'],
  facilities: ['#e070a8', '#93355f'],
}
const peces = [
  { tipo: 'laptop', color: EQUIPOS['dev-a1'][0], oscuro: EQUIPOS['dev-a1'][1] },
  { tipo: 'catalejo', color: EQUIPOS.research[0], oscuro: EQUIPOS.research[1] },
  { tipo: 'mapa', color: EQUIPOS.datos[0], oscuro: EQUIPOS.datos[1] },
  { tipo: 'tiburon' },
]

const tarjeta = (titulo, cuerpo) => `<section><h2>${titulo}</h2>${cuerpo}</section>`
const html = `<!doctype html><meta charset="utf-8"><title>Boceto skin Piratas</title>
<style>
body{margin:0;background:#120b1f;color:#f3ead8;font:15px/1.5 system-ui,sans-serif}
main{max-width:780px;margin:0 auto;padding:24px 16px;display:grid;gap:20px}
h1{font:700 22px monospace;color:#21e6c1;margin:0}
h2{font:700 14px monospace;color:#ff2e88;margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em}
section{background:#1d1238;border:2px solid #463868;border-radius:4px;padding:14px}
.fila{display:flex;flex-wrap:wrap;gap:16px;align-items:end}
figure{margin:0;display:grid;gap:4px;justify-items:center;font-size:13px;color:#b9a98a}
.panel{width:378px;border:2px solid #21e6c1;background:#120b1f}
.burbuja{margin:0 0 0;padding:4px 8px;background:#2a2140;border:1px solid #ff2e88;color:#fff6e0}
.btn{display:inline-block;padding:2px 8px;border:1px solid #21e6c1;color:#21e6c1;border-radius:3px;margin:6px 4px 6px 0}
.btn.p{background:#ff2e88;border-color:#ff2e88;color:#120b1f;font-weight:700}
.sw{display:flex;gap:6px;flex-wrap:wrap}.sw span{display:grid;gap:2px;font-size:12px}.sw i{display:block;width:56px;height:28px;border:1px solid #fff6e0}
</style>
<main>
<h1>Skin «Piratas» · boceto 1</h1>
${tarjeta('Escena del panel (378 px)', `<div class="panel">${escena('vigia', peces)}<p class="burbuja">¡Arrr! 3 marineros nadando y un tiburón al acecho. Nadie toca mi galleta.</p><div style="padding:0 6px"><span class="btn p">Guardar</span><span class="btn">Cancelar</span></div></div>`)}
${tarjeta('El loro (lienzo del robot, escala 3)', `<div class="fila">${Object.entries(EMOCIONES).map(([k, e]) => `<figure>${svgDe(e.grilla(), 3)}<figcaption>${e.alt}</figcaption></figure>`).join('')}</div>`)}
${tarjeta('Banderas de equipo (en vez de placas de dioses)', `<div class="fila">${Object.entries(EQUIPOS).map(([eq, [c, d]]) => `<figure>${bandera(c, d)}<figcaption>${eq}</figcaption></figure>`).join('')}</div>`)}
${tarjeta('Paleta', `<div class="sw">${[['noche', '#120b1f'], ['noche clara', '#1d1238'], ['mar', '#1f3b73'], ['turquesa', '#21e6c1'], ['magenta', '#ff2e88'], ['oro', '#f9d342'], ['hueso', '#fff6e0'], ['madera', '#6b4a2b']].map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div>`)}
</main>`

const salida = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'salida')
mkdirSync(salida, { recursive: true })
writeFileSync(join(salida, 'boceto-piratas.html'), html, 'utf8')
console.log('OK', join(salida, 'boceto-piratas.html'))
