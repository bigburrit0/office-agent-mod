// Escena única de la skin «Piratas»: noche en el Caribe vista en corte. Arriba, la baranda del barco
// «La Galleta» con el loro capitán, el cielo con luna, la isla del faro y el mar lejano; abajo, bajo la línea
// de flotación, los subagentes nadan como peces. Mismo contrato que arte-escena.ts (escenaOficinaSvg,
// escenaAlto, ESCENA_FONDO), más porFilaEscena para que el panel sepa cuántos peces entran por fila.
// Puro y sin imports: el loro y las celdas llegan armados como SVG y se anidan con x/y.
// Pixel art en píxeles de 2 (el loro y los peces vienen a escala 3). Solo SMIL, sin scripts.

export const ESCENA_FONDO = '#1d1238' // noche: el panel lo usa de fondo alrededor de la escena

export type CeldaEscena = { svg: string } // una celda ya armada (66 x 54 a escala 3)

const LORO_X = 8
const LORO_Y = 34
const LORO_ANCHO = 126
const CUBIERTA = 152 // cielo, loro y casco hasta la línea de flotación
const MARGEN_AGUA = 8 // agua sobre la primera fila de peces
const CELDA_ANCHO = 66
const CELDA_ALTO = 54
const LECHO = 14 // arena del fondo
const VACIA_ALTO = 46 // mar sin peces (cofre y boya «LIBRE»)
const SIN_AGUA = 14 // franja de agua cuando la escena solo cuelga cuadros
const MARGEN = 8
const ZONA_X = LORO_X + LORO_ANCHO + 12 // donde se cuelgan los cuadros (a la derecha del loro)
const PESO_MAX = 120000

const NOCHE = ['#0a0617', '#120b26', '#1b1036', '#2a1446', '#40175a', '#6a1d66']
const MAR_LEJOS = '#16205a'
const AGUA = ['#145082', '#103f70', '#0c305c', '#0a2448', '#081a36']
const ARENA = '#c9a35a'
const CONTORNO = '#1a0f12'

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
function rect(x: number, y: number, w: number, h: number, fill: string, extra = ''): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`
}
function anchoValido(ancho: number): number {
  const n = Number(ancho)
  return Math.max(200, Math.min(1200, Math.round(Number.isFinite(n) ? n : 200)))
}
// Pseudoazar con semilla: la misma noche siempre.
function azar(semilla: number): () => number {
  let s = semilla >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
// Filas de caracteres a rectángulos por color (píxel de `s`), en (x0, y0) en px.
function px(filas: string[], mapa: Record<string, string>, s: number, x0: number, y0: number): string {
  const por: Record<string, string> = {}
  filas.forEach((f, y) => {
    let x = 0
    while (x < f.length) {
      const c = f[x]
      if (c === '.' || !mapa[c]) {
        x++
        continue
      }
      let x2 = x
      while (x2 + 1 < f.length && f[x2 + 1] === c) x2++
      const w = (x2 - x + 1) * s
      por[mapa[c]] = (por[mapa[c]] || '') + `M${x0 + x * s} ${y0 + y * s}h${w}v${s}h-${w}z`
      x = x2 + 1
    }
  })
  return Object.keys(por)
    .map(c => `<path fill="${c}" d="${por[c]}"/>`)
    .join('')
}
// Cuadros en bucle (SMIL discreto).
function ciclo(cuadros: string[], tiempos: number[], quieto: boolean): string {
  if (quieto || cuadros.length < 2) return cuadros[0] ?? ''
  const total = tiempos.reduce((a, b) => a + b, 0)
  let t = 0
  return cuadros
    .map((c, i) => {
      const t0 = t / total
      t += tiempos[i]
      const t1 = t / total
      const k = i === 0 ? [0, t1, 1] : i === cuadros.length - 1 ? [0, t0, 1] : [0, t0, t1, 1]
      const v = i === 0 ? 'visible;hidden;hidden' : i === cuadros.length - 1 ? 'hidden;visible;visible' : 'hidden;visible;hidden;hidden'
      return `<g${i === 0 ? '' : ' visibility="hidden"'}>${c}<animate attributeName="visibility" calcMode="discrete" values="${v}" keyTimes="${k.map(n => Math.round(n * 1000) / 1000).join(';')}" dur="${Math.round(total * 1000) / 1000}s" repeatCount="indefinite"/></g>`
    })
    .join('')
}

// Cuántos peces entran en una fila (usan todo el ancho, debajo del barco).
export function porFilaEscena(ancho: number): number {
  return Math.max(0, Math.floor((anchoValido(ancho) - 2 * MARGEN) / CELDA_ANCHO))
}

function filasPara(ancho: number, celdas: number): number {
  const n = porFilaEscena(ancho)
  const c = Math.max(0, Math.floor(Number(celdas) || 0))
  if (n === 0 || c === 0) return 0
  return Math.min(2, Math.ceil(c / n))
}

export function escenaAlto(ancho: number, celdas: number, conVacia: boolean): number {
  const w = anchoValido(ancho)
  const c = Math.max(0, Math.floor(Number(celdas) || 0))
  const filas = filasPara(w, c)
  if (filas > 0) return CUBIERTA + MARGEN_AGUA + filas * CELDA_ALTO + LECHO
  return CUBIERTA + (conVacia ? VACIA_ALTO : SIN_AGUA)
}

// ---------------------------------------------------------------------------
// Cielo, luna, isla y mar lejano (arriba, detrás del loro)
// ---------------------------------------------------------------------------

function cielo(w: number, quieto: boolean): string {
  const alto = CUBIERTA - 14
  const banda = Math.ceil(alto / NOCHE.length)
  let c = ''
  NOCHE.forEach((col, i) => {
    c += rect(0, i * banda, w, banda + 2, col)
    // Borde punteado entre bandas: trama de 2 px.
    if (i > 0) {
      let d = ''
      for (let x = (i % 2) * 2; x < w; x += 4) d += `M${x} ${i * banda - 2}h2v2h-2z`
      c += `<path fill="${col}" d="${d}"/>`
    }
  })
  // Estrellas: unas fijas y unas pocas que titilan.
  const r = azar(7)
  let fijas = ''
  let titilan = ''
  const n = Math.round(w / 9)
  for (let k = 0; k < n; k++) {
    const x = Math.floor(r() * (w / 2)) * 2
    const y = Math.floor(r() * (alto * 0.7 / 2)) * 2
    const b = r()
    const col = b > 0.82 ? '#fff6e0' : b > 0.55 ? '#c9b8ff' : b > 0.35 ? '#8fe9ff' : '#6a5a8a'
    if (k % 7 === 0 && !quieto) {
      titilan += `<rect x="${x}" y="${y}" width="2" height="2" fill="${col}"><animate attributeName="opacity" values="1;0.2;1" dur="${(1.6 + (k % 5) * 0.4).toFixed(1)}s" repeatCount="indefinite"/></rect>`
    } else fijas += `M${x} ${y}h2v2h-2z`
  }
  c += `<path fill="#c9b8ff" d="${fijas}"/>` + titilan
  // Constelación con forma de ancla (huevo de pascua), en el centro del cielo.
  const ax = Math.round(w * 0.55 / 2) * 2
  let ancla = ''
  for (const [dx, dy] of [[0, 4], [0, 10], [-6, 10], [6, 10], [0, 18], [0, 26], [-8, 24], [8, 24], [-4, 30], [4, 30], [0, 32]]) {
    ancla += `M${ax + dx} ${dy}h2v2h-2z`
  }
  c += `<path fill="#fff3a8" d="${ancla}"/>`
  return c
}

function luna(w: number, quieto: boolean): string {
  const cx = w - 52
  const cy = 26
  // Luna de 14 x 14 píxeles de 2, con halo, cráteres y una cara que guiña cada tanto.
  const filas = [
    '....oooooo....',
    '..ooMMMMMMoo..',
    '.oMMMMMMMMMMo.',
    '.oMMMMMMMMMmo.',
    'oMMMcMMMMcMMmo',
    'oMMMMMMMMMMmmo',
    'oMMMMMMMMMMmmo',
    'oMMMMMMMMMmmmo',
    'oMMcMMMMMcmmmo',
    'oMMMcccccmmmmo',
    '.oMMMMMMmmmmo.',
    '.oMMMMMmmmmmo.',
    '..oommmmmmoo..',
    '....oooooo....',
  ]
  const mapa = { o: '#4a2f6a', M: '#fff0b8', m: '#e3cd85', c: '#cdb877' }
  let c = rect(cx - 18, cy - 18, 36, 36, '#2a1446', ' opacity="0.5"')
  c += px(filas, mapa, 2, cx - 14, cy - 14)
  if (!quieto) {
    // Guiño: el «ojo» derecho de la luna se cierra medio segundo cada 27 s.
    c += `<g opacity="0">${rect(cx + 4, cy - 6, 2, 2, '#fff0b8')}${rect(cx + 2, cy - 4, 6, 2, '#cdb877')}<animate attributeName="opacity" calcMode="discrete" values="0;1;0" keyTimes="0;0.98;1" dur="27s" repeatCount="indefinite"/></g>`
  }
  return c
}

function isla(w: number, quieto: boolean): string {
  const base = CUBIERTA - 14
  const x0 = Math.max(ZONA_X + 40, w - 150)
  let d = ''
  for (let x = x0; x < w; x += 2) {
    const h = Math.round(4 + 3 * Math.sin((x - x0) / 18) + (x > w - 50 ? 4 : 0)) * 2
    d += `M${x} ${base - h}h2v${h}h-2z`
  }
  let c = `<path fill="#1a0f2e" d="${d}"/>`
  // Palmeras.
  for (const [bx, alto, lado] of [[x0 + 24, 26, 1], [x0 + 40, 20, -1], [x0 + 70, 22, 1]]) {
    let p = ''
    for (let k = 0; k < alto; k += 2) p += `M${bx + Math.round((lado * k * k) / 120) * 2} ${base - 8 - k}h2v2h-2z`
    const tx = bx + Math.round((lado * alto * alto) / 120) * 2
    const ty = base - 8 - alto
    for (const [dx, dy] of [[-10, 4], [-8, 2], [-6, 0], [-4, 0], [-2, -2], [0, -2], [2, -2], [4, 0], [6, 0], [8, 2], [10, 4], [-12, 6], [12, 6]]) {
      p += `M${tx + dx} ${ty + dy}h2v2h-2z`
    }
    c += `<path fill="#1a0f2e" d="${p}"/>`
  }
  // Faro rayado con su luz que gira.
  const fx = w - 30
  for (let y = base - 34; y < base - 8; y += 4) c += rect(fx, y, 8, 2, '#e8e0f0') + rect(fx, y + 2, 8, 2, '#d23a5a')
  c += rect(fx - 2, base - 36, 12, 2, '#1a0f2e') + rect(fx + 2, base - 40, 4, 4, '#fff3a8') + rect(fx, base - 42, 8, 2, '#1a0f2e')
  const haz = (lado: number): string => {
    let h = ''
    for (let k = 1; k < 18; k++) {
      const x = lado > 0 ? fx + 6 + k * 2 : fx - k * 2
      const ab = Math.floor(k / 5)
      for (let s = -ab; s <= ab; s++) if ((k + s) % 3 !== 0) h += `M${x} ${base - 38 + s * 2}h2v2h-2z`
    }
    return `<path fill="#fff3a8" opacity="0.7" d="${h}"/>`
  }
  c += ciclo([haz(-1), haz(1)], [1.4, 1.4], quieto)
  return c
}

function marLejano(w: number): string {
  const y0 = CUBIERTA - 14
  let c = rect(0, y0, w, 14, MAR_LEJOS)
  // Reflejo de la luna: rayitas que se abren hacia abajo.
  const cx = w - 52
  let d = ''
  for (let k = 0; k < 7; k += 2) {
    const ancho = 4 + k * 3
    for (let x = cx - ancho; x <= cx + ancho; x += 6) d += `M${x} ${y0 + k * 2}h4v2h-4z`
  }
  c += `<path fill="#fff0b8" opacity="0.8" d="${d}"/>`
  return c
}

// ---------------------------------------------------------------------------
// El barco: mástil con bandera, casco con nombre y ojos de buey, bauprés
// ---------------------------------------------------------------------------

function barco(w: number, quieto: boolean): string {
  let c = ''
  // Mástil detrás del loro, con la bandera pirata flameando arriba.
  const mx = LORO_X + LORO_ANCHO + 2
  c += rect(mx, 0, 4, CUBIERTA - 18, '#74492a') + rect(mx, 0, 1, CUBIERTA - 18, '#9c6a3a') + rect(mx + 3, 0, 1, CUBIERTA - 18, '#2a1910')
  const bandera = (f: number): string => {
    let b = ''
    for (let i = 0; i < 12; i++) {
      const off = Math.round(Math.sin(i / 2.5 + f * 1.6) * (i / 6)) * 2
      const col = Math.sin(i / 2.5 + f * 1.6) > 0.4 ? '#2b2142' : '#160f24'
      b += rect(mx + 4 + i * 2, 4 + off, 2, 18, col)
    }
    const skull = px(['.WWW.', 'WkWkW', '.WWW.', '.k.k.'], { W: '#fff6e0', k: '#160f24' }, 2, mx + 10, 7 + f * 2)
    return b + skull + rect(mx + 6, 20, 2, 2, '#ff2e88') + rect(mx + 22, 20, 2, 2, '#ff2e88')
  }
  c += ciclo([bandera(0), bandera(1)], [0.5, 0.5], quieto)
  // Casco a la izquierda, debajo de la percha del loro (la percha es la baranda).
  const top = LORO_Y + 99
  const proa = Math.min(w - 40, LORO_X + LORO_ANCHO + 30)
  let tablas = ''
  for (let y = top; y < CUBIERTA; y += 2) {
    const xd = y < CUBIERTA - 6 ? proa - Math.round((CUBIERTA - y) * 0.3) * 2 : proa - (y - (CUBIERTA - 6)) * 2
    tablas += `M0 ${y}h${xd}v2h-${xd}z`
  }
  c += `<path fill="#5e3a22" d="${tablas}"/>`
  for (let y = top + 4; y < CUBIERTA - 2; y += 6) c += rect(0, y, proa - 20, 1, '#2a1910')
  c += rect(0, top, proa - 4, 3, '#f2b632') + rect(0, top + 3, proa - 4, 1, '#b8771a')
  c += rect(0, CUBIERTA - 3, proa - 8, 2, '#d23a5a')
  // Ojos de buey con luz cálida; en uno mira el gato del barco (huevo de pascua) y parpadea.
  const ojoBuey = (x: number): string => px(['.oo.', 'oYYo', 'oYzo', '.oo.'], { o: '#b8771a', Y: '#ffdd55', z: '#fff3a8' }, 2, x, top + 6)
  c += ojoBuey(16) + ojoBuey(36)
  const gato = (abiertos: boolean): string =>
    px(abiertos ? ['k.k', 'kkk', 'gkg'] : ['k.k', 'kkk', 'kkk'], { k: '#2a2233', g: '#9fff6a' }, 2, 37, top + 7)
  c += ciclo([gato(true), gato(false), gato(true), ''], [3.5, 0.15, 2, 6], quieto)
  // Nombre en la proa: «LA GALLETA».
  c += nombre(58, top + 7)
  // Bauprés y cuerdas.
  if (w > proa + 30) {
    let b = ''
    for (let k = 0; k < 18; k++) b += `M${proa - 6 + k * 3} ${top - 2 - k * 2}h4v2h-4z`
    c += `<path fill="#74492a" d="${b}"/>`
  }
  return c
}

const LETRAS: Record<string, string[]> = {
  L: ['x..', 'x..', 'x..', 'x..', 'xxx'], A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'], G: ['.xx', 'x..', 'x.x', 'x.x', '.xx'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'], T: ['xxx', '.x.', '.x.', '.x.', '.x.'],
}
function nombre(x0: number, y0: number): string {
  let d = ''
  let x = x0
  for (const ch of 'LA GALLETA') {
    if (ch === ' ') {
      x += 4
      continue
    }
    LETRAS[ch].forEach((f, j) => {
      for (let i = 0; i < 3; i++) if (f[i] === 'x') d += `M${x + i * 2} ${y0 + j * 2}h2v2h-2z`
    })
    x += 8
  }
  return `<path fill="#fff3a8" d="${d}"/>`
}

// ---------------------------------------------------------------------------
// El mar en corte (abajo)
// ---------------------------------------------------------------------------

function aguaYLecho(w: number, y0: number, h: number, quieto: boolean): string {
  const alto = h - y0
  const banda = Math.ceil((alto - LECHO) / AGUA.length)
  let c = ''
  AGUA.forEach((col, i) => (c += rect(0, y0 + i * banda, w, banda + 2, col)))
  // Rayos de luna bajo el agua, diagonales y suaves.
  for (const [x0, ancho] of [[w - 70, 18], [w - 140, 10], [w * 0.4, 12]]) {
    c += `<polygon points="${x0},${y0} ${x0 + ancho},${y0} ${x0 + ancho - alto * 0.5},${h - LECHO} ${x0 - alto * 0.5},${h - LECHO}" fill="#7fd8ff" opacity="0.07"/>`
  }
  // Casco bajo el agua, poco profundo, con algas.
  c += `<polygon points="0,${y0} ${LORO_X + LORO_ANCHO + 14},${y0} ${LORO_X + LORO_ANCHO - 30},${y0 + 6} 0,${y0 + 6}" fill="#16272f"/>`
  // Espuma de la línea de flotación: corre en tres cuadros.
  const espuma = (f: number): string => {
    let d = ''
    for (let x = (f * 4) % 12; x < w; x += 12) d += `M${x} ${y0}h6v2h-6z`
    return `<path fill="#21e6c1" d="${d}"/>`
  }
  c += ciclo([espuma(0), espuma(1), espuma(2)], [0.35, 0.35, 0.35], quieto)
  // Plancton que brilla.
  const r = azar(11)
  let p = ''
  for (let k = 0; k < Math.round(w / 25); k++) p += `M${Math.floor(r() * (w / 2)) * 2} ${y0 + 6 + Math.floor(r() * ((alto - LECHO - 10) / 2)) * 2}h2v2h-2z`
  c += `<path fill="#8fffea" d="${p}">${quieto ? '' : '<animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite"/>'}</path>`
  // Arena con ondas.
  const ya = h - LECHO
  let a = ''
  for (let x = 0; x < w; x += 2) {
    const onda = Math.round(Math.sin(x / 14) * 1.2) * 2
    a += `M${x} ${ya + onda}h2v${LECHO - onda}h-2z`
  }
  c += `<path fill="${ARENA}" d="${a}"/>` + rect(0, h - 4, w, 4, '#a8823f')
  return c
}

// Decoración del fondo del mar para el espacio libre [x0, x1].
function decorarFondo(x0: number, x1: number, h: number, quieto: boolean): string {
  const ya = h - LECHO
  let c = ''
  let x = x0 + 6
  const piezas: Array<{ ancho: number; dibujar: (x: number) => string }> = [
    { ancho: 18, dibujar: x => algas(x, ya, quieto) },
    { ancho: 26, dibujar: x => coral(x, ya) },
    { ancho: 40, dibujar: x => cofre(x, ya, quieto) },
    { ancho: 14, dibujar: x => algas(x, ya, quieto) },
    { ancho: 22, dibujar: x => ancla(x, ya) },
    { ancho: 18, dibujar: x => botella(x, ya) },
  ]
  for (const p of piezas) {
    if (x + p.ancho > x1) break
    c += p.dibujar(x)
    x += p.ancho + 6
  }
  return c
}

function algas(x: number, ya: number, quieto: boolean): string {
  const tallo = (f: number): string => {
    let d = ''
    for (let k = 0; k < 14; k++) d += `M${x + 4 + Math.round(Math.sin(k / 3 + f * 1.4) * 1.5) * 2} ${ya - k * 2}h2v2h-2z`
    for (let k = 0; k < 9; k++) d += `M${x + 10 + Math.round(Math.sin(k / 3 + f * 1.4 + 1) * 1.5) * 2} ${ya - k * 2}h2v2h-2z`
    return `<path fill="#2fc07a" d="${d}"/>`
  }
  return ciclo([tallo(0), tallo(1)], [0.9, 0.9], quieto)
}

function coral(x: number, ya: number): string {
  return px(
    ['.c...c....', '.f..cf..c.', 'cf..f..cf.', '.ff.f.ff..', '..fffff...', '...fff....', '...FFF....'],
    { c: '#ff8cc3', f: '#ff2e88', F: '#b5136a' },
    2,
    x,
    ya - 14,
  )
}

function cofre(x: number, ya: number, quieto: boolean): string {
  const caja = px(
    ['..oooooooooooooo..', '.o33333333333333o.', 'o3222222g2222222o.', 'ozzYzzYzzYzzYzzzo.', 'oYgggggggggggggGo.', 'o4444444oo4444444o', 'o3333333og3333333o', 'o3333333oo3333333o', 'oooooooooooooooooo'],
    { o: CONTORNO, '2': '#9c6a3a', '3': '#74492a', '4': '#4b2e1b', g: '#f2b632', G: '#b8771a', z: '#fff3a8', Y: '#ffdd55' },
    2,
    x,
    ya - 16,
  )
  // Un pulpito con tricornio se asoma cada tanto (huevo de pascua).
  const pulpo = px(
    ['..hhhh..', '.hhzhhh.', 'hhhhhhhh', '..pppp..', '.pwppwp.', '.pkppkp.'],
    { h: '#2b2142', z: '#fff6e0', p: '#c46aff', w: '#fff6e0', k: '#140c1c' },
    2,
    x + 10,
    ya - 28,
  )
  const brillo = rect(x + 8, ya - 18, 2, 2, '#fff3a8') + rect(x + 20, ya - 20, 2, 2, '#fff3a8')
  return caja + ciclo(['', pulpo], [9, 2.4], quieto) + ciclo([brillo, ''], [0.8, 0.8], quieto)
}

function ancla(x: number, ya: number): string {
  return px(['...oo...', '..oggo..', '...gg...', 'g..gg..g', 'gg.gg.gg', '.gggggg.', '..g..g..'], { o: '#2a2233', g: '#7a8494' }, 2, x, ya - 12)
}

function botella(x: number, ya: number): string {
  // Botella con un mensaje, medio enterrada (huevo de pascua).
  return px(['.oo.....', 'oggoooo.', 'ogwpppgo', 'ogggggo.', '.ooooo..'], { o: '#0d2a24', g: '#2f8a6a', w: '#c8fff0', p: '#f0e2c0' }, 2, x, ya - 8)
}

// Tentáculo del kraken: sale de la arena a la derecha cada medio minuto (huevo de pascua).
function kraken(w: number, h: number, quieto: boolean): string {
  if (quieto) return ''
  const ya = h - LECHO
  const tent = (alto: number): string => {
    let d = ''
    let v = ''
    for (let k = 0; k < alto; k++) {
      const x = w - 22 + Math.round(Math.sin(k / 4) * 2) * 2
      const ancho = Math.max(1, 3 - Math.floor(k / 8))
      d += `M${x} ${ya - k * 2}h${ancho * 2}v2h-${ancho * 2}z`
      if (k % 3 === 1 && ancho > 1) v += `M${x + ancho * 2 - 2} ${ya - k * 2}h2v2h-2z`
    }
    return `<path fill="#8a2aa8" d="${d}"/><path fill="#f0a0ff" d="${v}"/>`
  }
  return ciclo(['', tent(4), tent(9), tent(13), tent(9), tent(4)], [31, 0.25, 0.25, 2.6, 0.25, 0.25], false)
}

// Patito de goma flotando en el mar lejano (huevo de pascua).
function patito(w: number, quieto: boolean): string {
  const p = px(['..yy..', '.yyko.', 'yyyyoo', '.yyyy.'], { y: '#ffd84a', k: '#140c1c', o: '#ff8a3d' }, 2, Math.round(w * 0.62 / 2) * 2, CUBIERTA - 10)
  return `<g>${p}${quieto ? '' : '<animateTransform attributeName="transform" type="translate" values="0 0;0 1;0 0;0 -1;0 0" dur="1.8s" repeatCount="indefinite"/>'}</g>`
}

// Estrella fugaz cada 19 s.
function fugaz(w: number, quieto: boolean): string {
  if (quieto) return ''
  const x = Math.round(w * 0.3)
  return (
    `<g opacity="0">${rect(x, 14, 2, 2, '#fff6e0')}${rect(x - 4, 12, 4, 2, '#c9b8ff')}${rect(x - 10, 10, 6, 2, '#6a5a8a')}` +
    `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.9;0.91;0.95;1" dur="19s" repeatCount="indefinite"/>` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 0;60 24;60 24" keyTimes="0;0.9;0.91;0.95;1" dur="19s" repeatCount="indefinite"/></g>`
  )
}

// Boya «LIBRE» flotando cuando no hay tripulación nadando.
function boyaLibre(x: number, y: number, quieto: boolean): string {
  const letras: Record<string, string[]> = {
    L: ['x..', 'x..', 'x..', 'x..', 'xxx'], I: ['xxx', '.x.', '.x.', '.x.', 'xxx'], B: ['xx.', 'x.x', 'xx.', 'x.x', 'xx.'],
    R: ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'], E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
  }
  let t = ''
  'LIBRE'.split('').forEach((ch, i) => letras[ch].forEach((f, j) => {
    for (let k = 0; k < 3; k++) if (f[k] === 'x') t += `M${x + 4 + i * 8 + k * 2} ${y + 4 + j * 2}h2v2h-2z`
  }))
  const cartel = rect(x, y, 46, 18, CONTORNO) + rect(x + 2, y + 2, 42, 14, '#F28C28') + `<path fill="${CONTORNO}" d="${t}"/>`
  const palo = rect(x + 21, y + 18, 4, 10, '#74492a')
  const flotador = px(['.oooooo.', 'orrwwrro', 'orrwwrro', '.oooooo.'], { o: CONTORNO, r: '#d23a3a', w: '#fff6e0' }, 2, x + 15, y + 26)
  const todo = cartel + palo + flotador
  return `<g>${todo}${quieto ? '' : '<animateTransform attributeName="transform" type="translate" values="0 0;0 2;0 0" dur="2.4s" repeatCount="indefinite"/>'}</g>`
}

// ---------------------------------------------------------------------------
// Armado
// ---------------------------------------------------------------------------

function anidar(svg: string, x: number, y: number): string {
  return String(svg).replace(/^\s*<svg\b/, `<svg x="${x}" y="${y}"`)
}

function medidaSvg(svg: string): { ancho: number; alto: number } | null {
  const m = /^\s*<svg[\s>][^>]*>/.exec(String(svg))
  if (!m) return null
  const a = /\swidth="(\d+(?:\.\d+)?)"/.exec(m[0])
  const h = /\sheight="(\d+(?:\.\d+)?)"/.exec(m[0])
  if (!a || !h) return null
  const ancho = Math.ceil(Number(a[1]))
  const alto = Math.ceil(Number(h[1]))
  return ancho > 0 && alto > 0 ? { ancho, alto } : null
}

// Cuelga los cuadros (placas, íconos) de la driza que va del mástil a la derecha, en el cielo.
function colgarCuadros(cuadros: string[], w: number): string {
  const GAP = 10
  const arriba = 52 // la driza pasa por debajo de la luna
  const abajo = CUBIERTA - 16
  let c = rect(ZONA_X, arriba - 6, w - ZONA_X - MARGEN, 2, '#9c8763')
  let x = ZONA_X + 8
  for (const q of cuadros) {
    const m = medidaSvg(q)
    if (!m || m.alto > abajo - arriba) continue
    if (x + m.ancho > w - MARGEN) continue
    const y = arriba + Math.max(0, Math.round((abajo - arriba - m.alto) / 3))
    const cx = x + Math.floor(m.ancho / 2)
    c += rect(cx, arriba - 4, 2, y - arriba + 4, '#9c8763')
    c += anidar(q, x, y)
    x += m.ancho + GAP
  }
  return c
}

function armar(w: number, h: number, cara: string, celdas: CeldaEscena[], vacia: boolean, quieto: boolean, alt: string, cuadros: string[]): string {
  let c = cielo(w, quieto) + luna(w, quieto) + isla(w, quieto) + marLejano(w) + patito(w, quieto) + fugaz(w, quieto)
  c += barco(w, quieto)
  if (celdas.length === 0 && cuadros.length > 0) c += colgarCuadros(cuadros, w)
  // El loro en la baranda (su percha es la baranda del barco).
  c += anidar(cara, LORO_X, LORO_Y)
  c += aguaYLecho(w, CUBIERTA, h, quieto)
  const n = porFilaEscena(w)
  if (celdas.length > 0 && n > 0) {
    const yLecho = h - LECHO
    for (let i = 0; i < celdas.length; i++) {
      const fila = Math.floor(i / n)
      const col = i % n
      c += anidar(celdas[i].svg, MARGEN + col * CELDA_ANCHO, yLecho - CELDA_ALTO * (fila + 1))
    }
    c += decorarFondo(MARGEN + Math.min(celdas.length, n) * CELDA_ANCHO, w - MARGEN - 30, h, quieto)
  } else if (vacia) {
    // Sin tripulación: el fondo decorado y la boya «LIBRE» flotando a la derecha de la proa.
    c += decorarFondo(MARGEN, w - MARGEN - 30, h, quieto)
    c += boyaLibre(Math.min(w - 60, LORO_X + LORO_ANCHO + 44), CUBIERTA - 22, quieto)
  }
  c += kraken(w, h, quieto)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${esc(alt)}">` +
    c +
    `</svg>`
  )
}

export function escenaOficinaSvg(o: {
  ancho: number // px, acotado a 200..1200; el SVG mide exactamente esto
  cara: string // SVG del loro (126 x 102)
  celdas: CeldaEscena[] // agentes a dibujar (quien llama ya limitó la cantidad)
  vacia?: boolean // sin celdas: el mar vacío con la boya «LIBRE» (un string se trata como true)
  quieto?: boolean
  alt?: string // aria-label; por defecto «Barco de agentes»
  cuadros?: string[] // SVGs que cuelgan de la driza (sin celdas)
}): string {
  const w = anchoValido(o.ancho)
  const lista = Array.isArray(o.celdas) ? o.celdas.filter(x => x && typeof x.svg === 'string') : []
  const conVacia = o.vacia === true || (typeof o.vacia === 'string' && o.vacia !== '')
  const n = porFilaEscena(w)
  let visibles = lista.slice(0, n * 2)
  const cuadros = Array.isArray(o.cuadros) ? o.cuadros.filter(x => typeof x === 'string' && x !== '') : []
  const alt = typeof o.alt === 'string' && o.alt !== '' ? o.alt : 'Barco de agentes'
  const quieto = o.quieto === true
  const cara = String(o.cara ?? '')
  const vacia = conVacia && cuadros.length === 0
  // El alto sale de la lista pedida (el panel lo calcula igual); si hay que sacar peces por peso, no cambia.
  const h = escenaAlto(w, visibles.length, vacia)
  let out = armar(w, h, cara, visibles, vacia, quieto, alt, cuadros)
  // Si se pasa del peso, se dibujan menos peces (de a uno desde el final).
  while (out.length >= PESO_MAX && visibles.length > 0) {
    visibles = visibles.slice(0, -1)
    out = armar(w, h, cara, visibles, vacia, quieto, alt, cuadros)
  }
  return out
}
