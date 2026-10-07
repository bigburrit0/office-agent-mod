// Los subagentes de la skin «Piratas»: cada uno es un pez del color de su equipo que nada en su celda,
// con el objeto de su equipo (laptop, catalejo, mapa, anteojos…). Mismo contrato que arte-escritorios.ts
// (celdaPatioSvg, celdaMasSvg, pisoPatioSvg, doselPatioSvg y las medidas), así el panel solo cambia el import.
// Fases: entra (llega nadando), juega (nada en el lugar), sale (salta contento y se va) y explota (llega el
// tiburón y se lo come). Las celdas son transparentes: el agua la pone la escena (arte-barco.ts).
// Funciones puras que devuelven strings SVG. Sin imports y solo sintaxis «borrable». Solo SMIL.

export const PATIO_ANCHO = 22 // unidades de la celda
export const PATIO_ALTO = 18
export const PATIO_ENTRA_MS = 400
export const PATIO_SALE_MS = 1300
export const PATIO_EXPLOTA_MS = 2400

const NEGRO = '#140c1c'
const HUESO = '#fff6e0'
const AGUA = '#0c305c'
const ESPUMA = '#8fffea'

// El equipo se reconoce por el color que llega en `acento`; con él se elige el objeto que lleva el pez.
const OBJETO_POR_COLOR: Record<string, string> = {
  '#8a93a0': 'panuelo', // base
  '#b08d57': 'gorra', // direccion
  '#5aa9e6': 'catalejo', // research
  '#8a6fb0': 'anteojos', // librarian
  '#2cc6d0': 'mapa', // datos
  '#f08a24': 'laptop', // dev-a1
  '#2f4fbf': 'laptop', // dev-tablero
  '#d04a3c': 'tricornio', // seguridad
  '#e6bf2e': 'llave', // mantenimiento
  '#9ac83a': 'escoba', // limpieza
  '#e070a8': 'llavero', // facilities
  '#8b5e3c': 'escuadra', // arquitectura
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
function f3(n: number): string {
  return String(Math.round(n * 1000) / 1000)
}
function escalaEntera(e: number): number {
  const n = Number(e)
  return Math.max(1, Math.min(8, Math.round(Number.isFinite(n) ? n : 2)))
}
function mezcla(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const x = p(a)
  const y = p(b)
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
const valido = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)

// Pinta filas de caracteres como rectángulos horizontales por color, en la posición (x0, y0) en unidades.
function px(filas: string[], mapa: Record<string, string>, s: number, x0 = 0, y0 = 0): string {
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
      por[mapa[c]] = (por[mapa[c]] || '') + `M${(x0 + x) * s} ${(y0 + y) * s}h${w}v${s}h-${w}z`
      x = x2 + 1
    }
  })
  return Object.keys(por)
    .map(c => `<path fill="${c}" d="${por[c]}"/>`)
    .join('')
}

// ---- El pez (16 x 12, mirando a la derecha) ----
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
// La cola en el otro cuadro: se cierra un poco.
const PEZ_COLA = PEZ.map((f, j) => (j >= 2 && j <= 9 ? '.' + f.slice(0, 3).replace(/6/g, '5') + f.slice(4) : f))
const PEZ_FELIZ = PEZ.map((f, j) => (j === 4 ? f.slice(0, 11) + 'kk' + f.slice(13) : j === 5 ? f.slice(0, 11) + '22' + f.slice(13) : f))

function paletaPez(color: string, oscuro: string): Record<string, string> {
  return {
    o: NEGRO, w: HUESO, k: NEGRO,
    1: mezcla(color, '#ffffff', 0.35), 2: color, 3: oscuro, b: mezcla(color, HUESO, 0.55),
    5: mezcla(color, '#ffffff', 0.15), 6: oscuro,
  }
}

// Objetos de cada equipo, en unidades relativas al pez (que empieza en x 3, y 2).
const OBJ: Record<string, { filas: string[]; x: number; y: number }> = {
  laptop: { filas: ['...ooooo', '...onNno', '...oNnNo', '..oooooo', '..oqqqqo'], x: 13, y: 7 },
  catalejo: { filas: ['oGgYgzo'], x: 15, y: 5 },
  mapa: { filas: ['oooooo', 'opcpcpo', 'occpcco', 'oooooo'], x: 6, y: 12 },
  anteojos: { filas: ['ooo.ooo', 'o.ooo.o', 'ooo.ooo'], x: 11, y: 5 },
  tricornio: { filas: ['...oo...', '.ohhhho.', 'oYYYYYYo', '.oooooo.'], x: 6, y: -1 },
  gorra: { filas: ['..oooo..', '.ohhhho.', 'oggggggo', '.oooooo.'], x: 6, y: -1 },
  panuelo: { filas: ['.oooooo.', 'offffffo', '..offo..', '...oo...'], x: 6, y: 1 },
  llave: { filas: ['o.o', 'ooo', '.s.', '.s.', '.s.'], x: 17, y: 7 },
  escoba: { filas: ['....g', '...g.', '..g..', 'YYY..', 'YYY..'], x: 1, y: 8 },
  llavero: { filas: ['.oo', 'o.o', '.oo', '.g.', '.gg', '.g.'], x: 17, y: 8 },
  escuadra: { filas: ['g....', 'gg...', 'g.g..', 'g..g.', 'ggggg'], x: 15, y: 9 },
}
const MAPA_OBJ: Record<string, string> = {
  o: NEGRO, n: '#21e6c1', N: ESPUMA, q: '#3f335f', G: '#b8771a', g: '#f2b632', Y: '#ffdd55', z: HUESO,
  p: '#f0e2c0', c: '#ff2e88', h: '#2b2142', f: '#d23a3a', s: '#c9d2e0',
}

function pez(s: string | number, color: string, oscuro: string, objeto: string, cuadro: 'normal' | 'cola' | 'feliz'): string {
  const e = Number(s)
  const filas = cuadro === 'cola' ? PEZ_COLA : cuadro === 'feliz' ? PEZ_FELIZ : PEZ
  let c = px(filas, paletaPez(color, oscuro), e, 3, 2)
  const o = OBJ[objeto]
  if (o) c += px(o.filas, MAPA_OBJ, e, 3 + o.x, 2 + o.y)
  return c
}

// Tiburón: la cabeza, con la boca abierta y un diente de oro (entra por la derecha en «explota»).
const TIBURON = [
  '.......oo.........',
  '......o12o........',
  '..ooooo1223ooooo..',
  '.o1111112222223oo.',
  'o1k111122222223333',
  'o1bbbbbb222223333.',
  'okwgwwwkbbbb33333.',
  'o.........bb3333..',
  'okwwwwwkbbbb3333..',
  '.obbbbbbbb3333oo..',
  '..ooooooooooo.....',
]
const PAL_TIBURON: Record<string, string> = { o: NEGRO, 1: '#c7d3e0', 2: '#8a9bb0', 3: '#5d6e86', b: '#eef2f7', k: NEGRO, w: HUESO, g: '#f2b632' }

function burbuja(x: number, y: number, s: number, begin: number, quieto: boolean): string {
  if (quieto) return ''
  return (
    `<rect x="${f3(x * s)}" y="${f3(y * s)}" width="${s}" height="${s}" fill="${ESPUMA}" opacity="0">` +
    `<animate attributeName="y" values="${f3(y * s)};${f3((y - 9) * s)}" dur="2.4s" begin="${f3(begin)}s" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values="0;0.9;0" dur="2.4s" begin="${f3(begin)}s" repeatCount="indefinite"/></rect>`
  )
}

function cartel(etiqueta: string | undefined, s: number): string {
  const t = String(etiqueta ?? '').slice(0, 6)
  if (!t) return ''
  // Tablita de madera colgando debajo del pez.
  return (
    `<rect x="${f3(5 * s)}" y="${f3(14.5 * s)}" width="${f3(12 * s)}" height="${f3(3.5 * s)}" fill="#c9935a"/>` +
    `<rect x="${f3(5 * s)}" y="${f3(17.5 * s)}" width="${f3(12 * s)}" height="${f3(0.5 * s)}" fill="#74492a"/>` +
    `<text x="${f3(11 * s)}" y="${f3(17.2 * s)}" font-family="monospace" font-size="${f3(3.6 * s)}" text-anchor="middle" fill="${NEGRO}">${esc(t)}</text>`
  )
}

function abrirSvg(w: number, h: number, cuerpo: string, alt: string, fondo?: string, titulo?: string): string {
  const bg = valido(fondo) ? `<rect width="${w}" height="${h}" fill="${fondo}"/>` : ''
  const t = titulo ? `<title>${esc(titulo)}</title>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${esc(alt)}">${t}${bg}${cuerpo}</svg>`
}

// Dos cuadros en bucle (cola abierta y cerrada).
function nadando(a: string, b: string, dur: number, ret: number): string {
  return (
    `<g>${a}<animate attributeName="visibility" calcMode="discrete" values="visible;hidden" keyTimes="0;0.5" dur="${f3(dur)}s" begin="${f3(ret)}s" repeatCount="indefinite"/></g>` +
    `<g visibility="hidden">${b}<animate attributeName="visibility" calcMode="discrete" values="hidden;visible" keyTimes="0;0.5" dur="${f3(dur)}s" begin="${f3(ret)}s" repeatCount="indefinite"/></g>`
  )
}

// ---------------------------------------------------------------------------
// API (la misma que arte-escritorios.ts)
// ---------------------------------------------------------------------------

export function celdaPatioSvg(o: {
  fase: string
  /** Color del equipo y su tono oscuro: el cuerpo del pez. Con el color se elige el objeto del equipo. */
  acento?: [string, string]
  /** Se acepta por compatibilidad con la oficina; los peces no la usan. */
  actividad?: unknown
  semilla?: number
  escala?: number
  etiqueta?: string
  quieto?: boolean
  /** Se ignora: la celda es transparente y el agua la pone la escena. */
  fondo?: string
  titulo?: string
}): string {
  const s = escalaEntera(o.escala ?? 2)
  const semilla = Math.abs(Math.floor(Number(o.semilla) || 0))
  const acento = Array.isArray(o.acento) && valido(o.acento[0]) && valido(o.acento[1]) ? o.acento : null
  const COLORES: Array<[string, string]> = [['#ff8a3d', '#a8461a'], ['#ffd04a', '#a8821a'], ['#7ab8ff', '#2f5aa0']]
  const [color, oscuro] = acento ?? COLORES[semilla % COLORES.length]
  const objeto = acento ? OBJETO_POR_COLOR[acento[0].toLowerCase()] ?? '' : ''
  const fase = o.fase === 'entra' || o.fase === 'sale' || o.fase === 'explota' ? o.fase : 'juega'
  const ret = (semilla % 7) * 0.13
  const etiqueta = cartel(o.etiqueta, s)
  const W = PATIO_ANCHO * s
  const H = PATIO_ALTO * s
  const cierre = (c: string): string => abrirSvg(W, H, c + etiqueta, `agente ${fase}`, undefined, o.titulo)
  const normal = pez(s, color, oscuro, objeto, 'normal')
  const tilde = px(['......J', '.....JJ', 'J...JJ.', 'JJ.JJ..', '.JJJ...', '..J....'], { J: '#4fe08a' }, s, 14, 0)
  const cruz = px(['R...R', '.R.R.', '..R..', '.R.R.', 'R...R'], { R: '#ff5a3c' }, s, 9, 6)

  if (o.quieto) {
    if (fase === 'sale') return cierre(pez(s, color, oscuro, objeto, 'feliz') + tilde)
    if (fase === 'explota') return cierre(px(TIBURON, PAL_TIBURON, s, 4, 3) + cruz)
    return cierre(normal)
  }

  const nada = nadando(normal, pez(s, color, oscuro, objeto, 'cola'), 0.6, ret)
  const vaiven = `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${-s};0 0;0 ${s};0 0" dur="${f3(2.2 + (semilla % 5) * 0.2)}s" begin="${f3(ret)}s" repeatCount="indefinite"/>`
  const burbujas = burbuja(19, 8, s, ret, false) + burbuja(20, 10, s, ret + 1.2, false)

  if (fase === 'juega') return cierre(`<g>${nada}${vaiven}</g>${burbujas}`)
  if (fase === 'entra') {
    // Llega nadando desde la izquierda y queda nadando en su lugar.
    return cierre(
      `<g><animateTransform attributeName="transform" type="translate" values="${-W} 0;0 0" dur="0.4s" fill="freeze"/><g>${nada}${vaiven}</g></g>${burbujas}`,
    )
  }
  if (fase === 'sale') {
    // Salta contento, aparece un tilde verde y se va nadando por la derecha.
    return cierre(
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 ${-3 * s};0 0;${W} 0" keyTimes="0;0.25;0.5;1" dur="1.3s" fill="freeze"/>${pez(s, color, oscuro, objeto, 'feliz')}</g>` +
        `<g opacity="0">${tilde}<animate attributeName="opacity" calcMode="discrete" values="0;1;0" keyTimes="0;0.15;0.85" dur="1.2s" fill="freeze"/></g>`,
    )
  }
  // Explota: el tiburón entra por la derecha, se come al pez y se va; queda una ✕ roja entre burbujas.
  const comido = `<g>${normal}<set attributeName="visibility" to="hidden" begin="0.8s" fill="freeze"/></g>`
  const tiburon =
    `<g transform="translate(${W} 0)">${px(TIBURON, PAL_TIBURON, s, 0, 3)}` +
    `<animateTransform attributeName="transform" type="translate" values="${W} 0;${2 * s} 0;${2 * s} 0;${-W} 0" keyTimes="0;0.3;0.45;1" dur="2.4s" fill="freeze"/></g>`
  const xroja = `<g opacity="0">${cruz}<animate attributeName="opacity" values="0;1" dur="0.01s" begin="1.6s" fill="freeze"/></g>`
  const espuma = burbuja(8, 12, s, 0.8, false) + burbuja(11, 13, s, 0.9, false) + burbuja(14, 11, s, 1, false)
  return cierre(comido + tiburon + xroja + espuma)
}

// Fondo de mar sin peces, `anchoPx` de ancho (para la vista sin escena única).
export function pisoPatioSvg(anchoPx: number, escala: number = 2, opts?: { fondo?: string }): string {
  const s = escalaEntera(escala)
  const pxs = Number(anchoPx)
  const u = Math.max(1, Math.floor((Number.isFinite(pxs) ? pxs : 0) / s))
  const arena = `<rect x="0" y="${(PATIO_ALTO - 3) * s}" width="${u * s}" height="${3 * s}" fill="#c9a35a"/><rect x="0" y="${(PATIO_ALTO - 3) * s}" width="${u * s}" height="${s}" fill="#e0bd73"/>`
  return abrirSvg(u * s, PATIO_ALTO * s, `<rect width="${u * s}" height="${PATIO_ALTO * s}" fill="${AGUA}"/>` + arena, 'mar vacío', opts?.fondo)
}

// Superficie del mar con espuma, `anchoPx` de ancho exacto y 9 x escala de alto. La espuma corre salvo con `quieto`.
export function doselPatioSvg(anchoPx: number, escala: number = 2, opts?: { fondo?: string; quieto?: boolean }): string {
  const s = escalaEntera(escala)
  const w = Math.max(1, Math.floor(Number.isFinite(Number(anchoPx)) ? Number(anchoPx) : 0))
  const u = Math.ceil(w / s)
  let espuma = ''
  for (let x = 0; x < u; x += 6) espuma += `M${x * s} ${6 * s}h${3 * s}v${s}h-${3 * s}z`
  const mueve = opts?.quieto ? '' : `<animateTransform attributeName="transform" type="translate" values="0 0;${3 * s} 0" dur="1.2s" calcMode="discrete" repeatCount="indefinite"/>`
  const c = `<rect width="${w}" height="${6 * s}" fill="#1b1036"/><rect y="${6 * s}" width="${w}" height="${3 * s}" fill="${AGUA}"/><g><path fill="#21e6c1" d="${espuma}"/>${mueve}</g>`
  return abrirSvg(w, 9 * s, c, 'superficie del mar', opts?.fondo)
}

// Celda «+N»: una botella con un mensaje que dice cuántos más hay. Estática.
export function celdaMasSvg(n: number, escala: number = 2, opts?: { fondo?: string }): string {
  const s = escalaEntera(escala)
  const botella = px(
    ['..oo........', '.ogNo.......', 'ogNNoooooooo', 'oNNNNNNNNNNo', 'oNNNNNNNNNNo', 'ogNNoooooooo', '.ogNo.......', '..oo........'],
    { o: NEGRO, g: '#2f8a6a', N: '#5fd6a8' },
    s,
    5,
    5,
  )
  const papel = `<rect x="${f3(8 * s)}" y="${f3(8 * s)}" width="${f3(7 * s)}" height="${f3(2 * s)}" fill="#f0e2c0"/>`
  const texto = `<text x="${f3(11 * s)}" y="${f3(17 * s)}" font-family="monospace" font-size="${f3(4.5 * s)}" text-anchor="middle" fill="${HUESO}">${esc('+' + n)}</text>`
  return abrirSvg(PATIO_ANCHO * s, PATIO_ALTO * s, botella + papel + texto, 'más agentes', opts?.fondo)
}
