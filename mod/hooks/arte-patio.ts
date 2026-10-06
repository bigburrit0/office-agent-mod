// Módulo del «patio» del Tablero de subagentes: cada subagente que trabaja es UNA celda SVG propia
// (su glifo con patitas sobre pasto y tierra). Entra con un poof, se mueve un poco, sale con otro poof
// y una tilde verde, o se infla, explota y deja una ✕ si falla.
// Todo son funciones puras que devuelven strings SVG. Sin imports y solo sintaxis «borrable»
// (nada de enum, namespace ni parameter properties) para que Node 24 lo corra directo.
// El glifo NO se importa: llega como parámetro (matriz 16×16 + paleta).
//
// Reglas que cumple cada SVG: texto externo escapado, sin scripts ni referencias externas,
// animaciones solo SMIL, y menos de 120000 caracteres.

// ---------------------------------------------------------------------------
// Medidas y tiempos (la app los usa para saber cuánto dejar visible una celda)
// ---------------------------------------------------------------------------

export const PATIO_ANCHO = 22 // unidades de la celda
export const PATIO_ALTO = 27
export const PATIO_ENTRA_MS = 400
export const PATIO_SALE_MS = 1300 // cuánto tiene que seguir visible la celda que sale
export const PATIO_EXPLOTA_MS = 2400 // ídem para la que explota

// ---------------------------------------------------------------------------
// Arte ya dibujado (efectos): paleta, humo de 4 cuadros y estallido
// ---------------------------------------------------------------------------

const PAL_FX: Record<string, string> = {"W":"#ffffff","g":"#b9c7bd","Y":"#ffd23a","R":"#e8402a","G":"#6f7f74"}
const POOF: string[][] = [["................","................","................","................","................",".......gg.......","......gWWg......","......gWWg......","....gggWWggg....","...ggWWWWWWgg...","...ggWgWWgWgg...","....gggggggg....","................","................","................","................"],["................","................","......gggg......",".....ggWWgg.....",".....gWWWWggg...","...gggWWWWgWgg..","..gWWWWWWWWWWgg.",".ggWWWWWWWWWWWg.",".ggWWWWWWWWWWgg.","..gWWWWWWWWWgg..","...ggWWWWWWgg...","....gWWWWWgg....","....gWWWWgg.....","....ggWWgg......",".....gggg.......","................"],["................","......gggg......","......gWWg......","......gWWg.ggg..","..ggg.ggggggWgg.",".gWWWg....gWWWg.",".gWWWg....ggWgg.","..ggg......ggg..","................","...g............",".ggggg.....ggg..",".gWWWg....gWWWg.",".gWWWg.gg.gWWWg.",".ggggggWWg.ggg..","...g..gWWg......",".......gg......."],["................",".......gg.......",".............gg.",".gg..........gg.",".gg..........gg.","................","................","................","................","................","................","................",".gg..........gg.",".gg..........gg.",".............gg.","................"]]
const ESTALLIDO: string[] = ["................",".......R........",".......R........","...R...R....R...","....R..Y...R....",".....Y.Y..Y.....","......WWWW......","......WWWW......",".RRRYYWWWW.YYRRR","......WWWW......",".....Y....Y.....","....R...Y..R....","...R....Y...R...","........R.......","........R.......","........R......."]

// Selva lejana (22x21) y dosel (44x9), de arte/8bit/marcos.json.
const PAL_SELVA: Record<string, string> = {"V":"#0a3418","v":"#12592b","H":"#2e8a3a","h":"#3fae4a","F":"#e8553f","f":"#ffd23a"}
const SILUETA: string[] = [
  '......................',
  '......................',
  '......................',
  '......................',
  '.............VVV......',
  '............VVVVV.....',
  '...........VVVVVVV....',
  '...VV......VVVV.......',
  '.VVVVV....VVVVVV......',
  'VVVVVV...VVVVVVVV....V',
  'VVVVVVV.VVVVVVVVV...VV',
  'VVVVVVVVVVVVVVVVVV.VVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
  'VVVVVVVVVVVVVVVVVVVVVV',
]
const DOSEL: string[] = [
  'HvvHvvHvvHvvHvvHvvHvvHvvHvvHvvHvvHvvHvvHvvHv',
  'vvvvHvvvvvHHvvvvvvvvvHvvvvvHvvvvHHvvvvvvvHvv',
  'HHvH.HvvHH.FfvHHvvvHH.HHvHH.HvvH..HFfHHvH.HH',
  '..h..HhH.....H..hvh.....h.Ff.Hh.....h..H....',
  '.....Hh..........H............H........H....',
  '.....H...........H............H........H....',
  '.....H...........H............Hh.......Hh...',
  '.....Hh..........Hh...........H........H....',
  '.....H...........H............H........H....',
]

const EASE = '0.23 1 0.32 1' // curva de salida rápida
const NEGRO = '#1c120a'

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

function f3(v: number): string {
  return String(Math.round(v * 1000) / 1000)
}

// Escapa el texto que viene de afuera para meterlo en SVG.
function esc(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escalaEntera(e: unknown): number {
  const n = Math.round(Number(e))
  if (!Number.isFinite(n)) return 2
  return Math.max(1, Math.min(4, n))
}

function entero(n: unknown): number {
  const v = Math.floor(Number(n))
  return Number.isFinite(v) && v >= 0 ? v : 0
}

function abrirSvg(w: number, h: number, cuerpo: string, alt: string, fondo?: string, titulo?: string): string {
  const bg = typeof fondo === 'string' && /^#[0-9a-fA-F]{6}$/.test(fondo) ? `<rect width="${w}" height="${h}" fill="${fondo}"/>` : ''
  const tit = typeof titulo === 'string' && titulo !== '' ? `<title>${esc(titulo)}</title>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${esc(alt)}">${tit}${bg}${cuerpo}</svg>`
}

// Dibuja una matriz de caracteres: un <path> por color, con tiras horizontales.
function px(grid: string[], pal: Record<string, string>, s: number, x0 = 0, y0 = 0): string {
  const porColor: Record<string, string[]> = {}
  grid.forEach((fila, y) => {
    let x = 0
    while (x < fila.length) {
      const ch = fila[x]
      let f = x + 1
      while (f < fila.length && fila[f] === ch) f++
      if (ch !== '.' && pal[ch]) {
        if (!porColor[pal[ch]]) porColor[pal[ch]] = []
        porColor[pal[ch]].push(`M${x0 + x * s} ${y0 + y * s}h${(f - x) * s}v${s}h${-(f - x) * s}z`)
      }
      x = f
    }
  })
  return Object.keys(porColor)
    .map((c) => `<path fill="${c}" d="${porColor[c].join('')}"/>`)
    .join('')
}

// Repite una matriz cada su ancho desde x=0, cortada a `unidades` de ancho.
function repetida(grid: string[], pal: Record<string, string>, s: number, unidades: number): string {
  const ancho = grid[0].length
  let c = ''
  for (let x0 = 0; x0 < unidades; x0 += ancho) {
    const resto = unidades - x0
    const g = resto >= ancho ? grid : grid.map((r) => r.slice(0, resto))
    c += px(g, pal, s, x0 * s, 0)
  }
  return c
}

// Secuencia de cuadros: un grupo por cuadro distinto, opacidad discreta.
function secuencia(cuadros: Array<[number, number]>, dibujar: (n: number) => string, rep: boolean, begin: number): string {
  const lim = [0]
  cuadros.forEach((c) => lim.push(lim[lim.length - 1] + c[1]))
  const T = lim[lim.length - 1]
  const kts = lim.slice(0, -1).map((b) => f3(b / T)).join(';')
  const unicos = cuadros.map((c) => c[0]).filter((n, i, a) => a.indexOf(n) === i)
  return unicos
    .map((n) => {
      const vals = cuadros.map((c) => (c[0] === n ? 1 : 0))
      const fin = rep ? ' repeatCount="indefinite"' : ' fill="freeze"'
      return `<g opacity="${vals[0]}">${dibujar(n)}<animate attributeName="opacity" calcMode="discrete" values="${vals.join(';')}" keyTimes="${kts}" dur="${f3(T)}s" begin="${f3(begin)}s"${fin}/></g>`
    })
    .join('')
}

// ---------------------------------------------------------------------------
// Piso y partes de la celda
// ---------------------------------------------------------------------------

// Pasto y tierra en las filas 21 a 26, `ancho` unidades de ancho.
function piso(s: number, ancho: number): string {
  const verdes = ['#3fae4a', '#2e8a3a']
  let c = `<rect x="0" y="${22 * s}" width="${ancho * s}" height="${5 * s}" fill="#5a3416"/>`
  for (let x = 0; x < ancho; x++) {
    c += `<rect x="${x * s}" y="${22 * s}" width="${s}" height="${s}" fill="${verdes[x % 2]}"/>`
    if ((x * 7) % 5 === 0) c += `<rect x="${x * s}" y="${21 * s}" width="${s}" height="${s}" fill="#3fae4a"/>`
    if ((x * 11) % 9 === 0) c += `<rect x="${x * s}" y="${24 * s}" width="${2 * s}" height="${s}" fill="#7a4a22"/>`
  }
  return c
}

// Glifo en (3,4) con patitas 3×2 negras en x=6 y x=13; `pies` alterna las filas 19-20.
function cuerpoAgente(matriz: string[], paleta: Record<string, string>, s: number, pies: number): string {
  let c = px(matriz, paleta, s, 3 * s, 4 * s)
  const izq = pies === 0 ? 19 : 20
  const der = pies === 0 ? 20 : 19
  c += `<rect x="${6 * s}" y="${izq * s}" width="${3 * s}" height="${2 * s}" fill="${NEGRO}"/><rect x="${13 * s}" y="${der * s}" width="${3 * s}" height="${2 * s}" fill="${NEGRO}"/>`
  return c
}

// Silueta roja del glifo (para los destellos antes de explotar).
function siluetaRoja(matriz: string[], s: number): string {
  const g = matriz.map((r) => r.replace(/[^.]/g, 'R'))
  return px(g, { R: '#ff3b2a' }, s, 3 * s, 4 * s)
}

// Centro de la celda: para escalar alrededor de él.
function centro(s: number, cont: string): string {
  return `<g transform="translate(${11 * s} ${12 * s})">${cont}</g>`
}
function desc(s: number, cont: string): string {
  return `<g transform="translate(${-11 * s} ${-12 * s})">${cont}</g>`
}

// Humo de 4 cuadros, una sola vez, en (x,y) unidades.
function poof(s: number, x: number, y: number, begin: number, paso: number, pal: Record<string, string>): string {
  const cuadros: Array<[number, number]> = POOF.map((_g, i): [number, number] => [i, paso])
  cuadros.push([9, 0.01])
  return (
    `<g transform="translate(${x * s} ${y * s})">` +
    secuencia(cuadros, (n) => (n === 9 ? '' : px(POOF[n], pal, s)), false, begin).replace(/<g opacity="1">/, '<g opacity="0">') +
    '</g>'
  )
}

const TILDE = ['....J', '...JJ', 'J.JJ.', 'JJJ..', '.J...']
const CRUZ = ['R...R', '.R.R.', '..R..', '.R.R.', 'R...R']

// Texto centrado sobre la franja de tierra (máximo 6 caracteres, escapado).
function textoEtiqueta(etiqueta: string | undefined, s: number): string {
  const t = String(etiqueta ?? '').slice(0, 6)
  if (!t) return ''
  return `<text x="${f3(11 * s)}" y="${f3(25.5 * s)}" font-family="monospace" font-size="${f3(4.5 * s)}" text-anchor="middle" fill="#efdcae">${esc(t)}</text>`
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function celdaPatioSvg(o: {
  fase: string
  matriz: string[]
  paleta: Record<string, string>
  semilla?: number
  escala?: number
  etiqueta?: string
  quieto?: boolean
  fondo?: string
  titulo?: string
}): string {
  const s = escalaEntera(o.escala ?? 2)
  const semilla = entero(o.semilla ?? 0)
  const matriz = o.matriz
  const paleta = o.paleta
  const ret = (semilla % 7) * 0.13
  const retS = f3(ret)
  const etiqueta = textoEtiqueta(o.etiqueta, s)
  const fase = o.fase === 'entra' || o.fase === 'sale' || o.fase === 'explota' ? o.fase : 'juega'
  let c = px(SILUETA, PAL_SELVA, s) + piso(s, PATIO_ANCHO)

  if (o.quieto) {
    if (fase === 'entra' || fase === 'juega') c += cuerpoAgente(matriz, paleta, s, 0)
    else if (fase === 'explota') c += `<g transform="translate(${9 * s} ${15 * s})">${px(CRUZ, { R: '#ff5a3c' }, s)}</g>`
    return abrirSvg(PATIO_ANCHO * s, PATIO_ALTO * s, c + etiqueta, `agente ${fase}`, o.fondo, o.titulo)
  }

  const vivo = secuencia([[0, 0.5], [1, 0.5]], (n) => cuerpoAgente(matriz, paleta, s, n), true, ret)
  const salto = `<animateTransform attributeName="transform" type="translate" calcMode="discrete" values="0 0;0 ${-s};0 ${-2 * s};0 ${-s};0 0" keyTimes="0;0.86;0.9;0.94;0.98" dur="${4 + (semilla % 3)}s" begin="${retS}s" repeatCount="indefinite"/>`

  if (fase === 'juega') {
    c += `<g>${vivo}${salto}</g>`
  } else if (fase === 'entra') {
    // Entrada: el glifo crece de 0,85 a 1 (nunca desde 0) con curva de salida rápida, debajo del humo.
    c +=
      `<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.2s" begin="0.1s" fill="freeze"/>` +
      centro(
        s,
        `<g><animateTransform attributeName="transform" type="scale" values="0.85;1" keyTimes="0;1" calcMode="spline" keySplines="${EASE}" dur="0.3s" begin="0.1s" fill="freeze"/>${desc(s, `<g>${vivo}${salto}</g>`)}</g>`,
      ) +
      '</g>'
    c += poof(s, 3, 6, 0, 0.09, PAL_FX)
  } else if (fase === 'sale') {
    c +=
      `<g>` +
      centro(
        s,
        `<g><animateTransform attributeName="transform" type="scale" values="1;0.9" keyTimes="0;1" calcMode="spline" keySplines="${EASE}" dur="0.2s" fill="freeze"/>${desc(s, cuerpoAgente(matriz, paleta, s, 0))}</g>`,
      ) +
      `<animate attributeName="opacity" values="1;0" dur="0.2s" fill="freeze"/></g>` +
      poof(s, 3, 6, 0.02, 0.07, PAL_FX) +
      `<g transform="translate(${8 * s} ${2 * s})" opacity="0">${px(TILDE, { J: '#4fe08a' }, s)}` +
      `<animate attributeName="opacity" calcMode="discrete" values="0;1;0" keyTimes="0;0.15;0.8" dur="1.2s" fill="freeze"/>` +
      `<animateTransform attributeName="transform" type="translate" calcMode="discrete" values="0 0;0 ${-s};0 ${-2 * s}" dur="1.2s" fill="freeze"/></g>`
  } else {
    // Explota: se infla en pasos, destellos rojos, se esconde, estallido, humo gris y una ✕.
    const infla = `<animateTransform attributeName="transform" type="scale" calcMode="discrete" values="1;1.1;1.2;1.32;1.45" keyTimes="0;0.2;0.45;0.65;0.85" dur="0.9s" fill="freeze"/>`
    const rojo = `<g opacity="0">${siluetaRoja(matriz, s)}<animate attributeName="opacity" calcMode="discrete" values="0;0.55;0;0.55;0;0.75" keyTimes="0;0.2;0.35;0.5;0.62;0.75" dur="0.9s" fill="freeze"/></g>`
    c += `<g>` + centro(s, `<g>${infla}${desc(s, cuerpoAgente(matriz, paleta, s, 0) + rojo)}</g>`) + `<set attributeName="visibility" to="hidden" begin="0.9s" fill="freeze"/></g>`
    c += `<g transform="translate(${3 * s} ${4 * s})" opacity="0">${px(ESTALLIDO, PAL_FX, s)}<animate attributeName="opacity" calcMode="discrete" values="0;1;0" keyTimes="0;0.64;0.75" dur="1.4s" fill="freeze"/></g>`
    c += poof(s, 3, 6, 1.05, 0.08, { W: '#8a8f86', g: '#4d544c' })
    c += `<g transform="translate(${9 * s} ${15 * s})" opacity="0">${px(CRUZ, { R: '#ff5a3c' }, s)}<animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.55;0.62;1" dur="2.4s" fill="freeze"/></g>`
  }
  return abrirSvg(PATIO_ANCHO * s, PATIO_ALTO * s, c + etiqueta, `agente ${fase}`, o.fondo, o.titulo)
}

// Piso sin agente, `anchoPx` de ancho (múltiplo de la escala; si no, se redondea hacia abajo).
export function pisoPatioSvg(anchoPx: number, escala: number = 2, opts?: { fondo?: string }): string {
  const s = escalaEntera(escala)
  const pxs = Number(anchoPx)
  const unidades = Math.max(1, Math.floor((Number.isFinite(pxs) ? pxs : 0) / s))
  return abrirSvg(unidades * s, PATIO_ALTO * s, repetida(SILUETA, PAL_SELVA, s, unidades) + piso(s, unidades), 'patio vacío', opts?.fondo)
}

// Franja de copas de árboles (dosel), `anchoPx` de ancho exacto y 9 x escala de alto. Estática.
export function doselPatioSvg(anchoPx: number, escala: number = 2, opts?: { fondo?: string }): string {
  const s = escalaEntera(escala)
  const w = Math.max(1, Math.floor(Number.isFinite(Number(anchoPx)) ? Number(anchoPx) : 0))
  const unidades = Math.ceil(w / s)
  return abrirSvg(w, 9 * s, repetida(DOSEL, PAL_SELVA, s, unidades), 'dosel de la selva', opts?.fondo)
}

// Celda «+N» del mismo tamaño que las del patio: selva lejana, piso y el texto +N en el cielo. Estática.
export function celdaMasSvg(n: number, escala: number = 2, opts?: { fondo?: string }): string {
  const s = escalaEntera(escala)
  const texto = `<text x="${f3(11 * s)}" y="${f3(11 * s)}" font-family="monospace" font-size="${f3(8 * s)}" text-anchor="middle" fill="#efdcae">${esc('+' + n)}</text>`
  return abrirSvg(PATIO_ANCHO * s, PATIO_ALTO * s, px(SILUETA, PAL_SELVA, s) + piso(s, PATIO_ANCHO) + texto, 'más agentes', opts?.fondo)
}
