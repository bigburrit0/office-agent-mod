// Módulo del «open space» del Tablero de subagentes: cada subagente que trabaja es UNA celda SVG propia
// (un escritorio beige visto de frente y un oficinista detrás, haciendo la actividad de su equipo).
// El equipo se reconoce por COLOR: camisa (acento), respaldo de la silla (acento oscuro) y una franja
// en el borde del escritorio. No hay logo en el monitor.
// Funciones puras que devuelven strings SVG. Sin imports y solo sintaxis «borrable»
// (nada de enum, namespace ni parameter properties) para que Node 24 lo corra directo.
// El color y la actividad NO se importan: llegan como parámetro (acento y cuadros ya dibujados,
// ver arte-actividades.ts). Sin actividad se dibuja el monitor CRT de siempre, con la pantalla vacía.
//
// Reglas que cumple cada SVG: texto externo escapado, sin scripts ni referencias externas,
// animaciones solo SMIL, y menos de 120000 caracteres.

// ---------------------------------------------------------------------------
// Medidas y tiempos (iguales a los de arte-patio.ts)
// ---------------------------------------------------------------------------

export const PATIO_ANCHO = 22 // unidades de la celda
export const PATIO_ALTO = 27
export const PATIO_ENTRA_MS = 400
export const PATIO_SALE_MS = 1300
export const PATIO_EXPLOTA_MS = 2400

// ---------------------------------------------------------------------------
// Colores y arte ya dibujado
// ---------------------------------------------------------------------------

const NEGRO = '#1c120a'
const PARED = '#e6dfcb'
const PARED_SOMBRA = '#d3cbb4'
const ZOCALO = '#9a8f78'
const PIEL = '#f0c49a'
const PELOS = ['#1c120a', '#6b3e1a', '#d9a441', '#8a8a8a']
const CAMISAS = ['#3d6fd1', '#e8803a']
const ESCRITORIO = '#d9c28f'
const FRENTE = '#b8975f'
const CAJON = '#a58552'
const ALFOMBRA = ['#8d9296', '#cdbf9c']
const CRT = '#c9c3b0'
const CRT_SOMBRA = '#8f897a'
const PANTALLA = '#13251b'

const PAL_FX: Record<string, string> = { W: '#ffffff', g: '#b9c7bd', Y: '#ffd23a', R: '#e8402a', G: '#6f7f74' }
const POOF: string[][] = [
  ['................', '................', '................', '................', '................', '.......gg.......', '......gWWg......', '......gWWg......', '....gggWWggg....', '...ggWWWWWWgg...', '...ggWgWWgWgg...', '....gggggggg....', '................', '................', '................', '................'],
  ['................', '................', '......gggg......', '.....ggWWgg.....', '.....gWWWWggg...', '...gggWWWWgWgg..', '..gWWWWWWWWWWgg.', '.ggWWWWWWWWWWWg.', '.ggWWWWWWWWWWgg.', '..gWWWWWWWWWgg..', '...ggWWWWWWgg...', '....gWWWWWgg....', '....gWWWWgg.....', '....ggWWgg......', '.....gggg.......', '................'],
  ['................', '......gggg......', '......gWWg......', '......gWWg.ggg..', '..ggg.ggggggWgg.', '.gWWWg....gWWWg.', '.gWWWg....ggWgg.', '..ggg......ggg..', '................', '...g............', '.ggggg.....ggg..', '.gWWWg....gWWWg.', '.gWWWg.gg.gWWWg.', '.ggggggWWg.ggg..', '...g..gWWg......', '.......gg.......'],
  ['................', '.......gg.......', '.............gg.', '.gg..........gg.', '.gg..........gg.', '................', '................', '................', '................', '................', '................', '................', '.gg..........gg.', '.gg..........gg.', '.............gg.', '................'],
]
const TILDE = ['....J', '...JJ', 'J.JJ.', 'JJJ..', '.J...']
const CRUZ = ['R...R', '.R.R.', '..R..', '.R.R.', 'R...R']
const CHISPAS = ['Y.....R', '..R.Y..', '.......', 'R..Y..Y', '.......', '..Y.R..', 'R.....Y']

const EASE = '0.23 1 0.32 1' // curva de salida rápida

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

// Rectángulo en unidades de la celda.
function r(s: number, x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${f3(x * s)}" y="${f3(y * s)}" width="${f3(w * s)}" height="${f3(h * s)}" fill="${fill}"/>`
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
        porColor[pal[ch]].push(`M${f3(x0 + x * s)} ${f3(y0 + y * s)}h${f3((f - x) * s)}v${s}h${f3(-(f - x) * s)}z`)
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
    const g = resto >= ancho ? grid : grid.map((fila) => fila.slice(0, resto))
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

// ---------------------------------------------------------------------------
// Partes de la celda (todo en unidades de 22 × 27)
// ---------------------------------------------------------------------------

// Pared con zócalo en las filas 0 a 20 y alfombra de baldosas en las filas 21 a 26, `ancho` unidades.
function fondoOficina(s: number, ancho: number): string {
  let c = r(s, 0, 0, ancho, 21, PARED) + r(s, 0, 14, ancho, 1, PARED_SOMBRA) + r(s, 0, 20, ancho, 1, ZOCALO)
  for (let y = 21; y < 27; y += 2) {
    for (let x = 0; x < ancho; x += 2) {
      const tono = ALFOMBRA[((x >> 1) + ((y - 21) >> 1)) % 2]
      c += r(s, x, y, Math.min(2, ancho - x), Math.min(2, 27 - y), tono)
    }
  }
  return c
}

// Escritorio beige de frente: tablero en la fila 18, frente con dos cajones.
function escritorio(s: number): string {
  return (
    r(s, 1, 18, 20, 2, ESCRITORIO) +
    r(s, 2, 20, 18, 7, FRENTE) +
    r(s, 3, 21, 5, 5, CAJON) +
    r(s, 14, 21, 5, 5, CAJON) +
    r(s, 5, 22, 1, 1, '#6b4f28') +
    r(s, 16, 22, 1, 1, '#6b4f28')
  )
}

// Objeto de decorado sobre el escritorio, en el rincón derecho (x 19 a 21, apoyado en la fila 18).
function objeto(s: number, tipo: number): string {
  if (tipo === 0) return r(s, 19, 15, 3, 3, '#f4f0e4') + r(s, 19, 15, 3, 1, '#5a3416') // taza
  if (tipo === 1) return r(s, 19, 16, 3, 2, '#b5522e') + r(s, 19, 14, 3, 2, '#3fae4a') + r(s, 20, 13, 1, 1, '#2e8a3a') + r(s, 21, 15, 1, 1, '#2e8a3a') // planta
  return r(s, 19, 16, 3, 2, '#fbfbf5') + r(s, 19, 15, 3, 1, '#d9d9cf') + r(s, 19, 14, 3, 1, '#fbfbf5') // pila de papeles
}

// Respaldo de la silla (acento oscuro del equipo): asoma a los costados de la cabeza.
function silla(s: number, oscuro: string): string {
  return r(s, 5, 2, 12, 7, oscuro) + r(s, 6, 1, 10, 1, oscuro)
}

// Franja de 1 unidad con el color del equipo en el borde del tablero del escritorio.
function franja(s: number, color: string): string {
  return r(s, 1, 19, 20, 1, color)
}

// Oficinista visto de frente, de la cabeza a la cintura. Con `angosto` el torso deja lugar a los brazos
// de la actividad (x 6 a 15); sin él, los hombros van de punta a punta (el monitor lo tapa en el medio).
function oficinista(s: number, semilla: number, camisa: string, angosto: boolean): string {
  const pelo = PELOS[semilla % PELOS.length]
  const cuerpo = angosto ? r(s, 6, 8, 10, 10, camisa) + r(s, 10, 8, 2, 1, '#fbfbf5') : r(s, 2, 8, 18, 10, camisa)
  return (
    cuerpo +
    r(s, 10, 7, 2, 1, PIEL) +
    r(s, 8, 1, 6, 6, PIEL) +
    r(s, 8, 1, 6, 2, pelo) +
    r(s, 8, 3, 1, 1, pelo) +
    r(s, 13, 3, 1, 1, pelo) +
    r(s, 9, 4, 1, 1, NEGRO) +
    r(s, 12, 4, 1, 1, NEGRO)
  )
}

// Brazos en alto (el estiramiento de la fase «sale»).
function brazosArriba(s: number, camisa: string): string {
  return r(s, 1, 4, 2, 6, camisa) + r(s, 1, 3, 2, 1, PIEL) + r(s, 19, 4, 2, 6, camisa) + r(s, 19, 3, 2, 1, PIEL)
}

// Monitor CRT con la pantalla vacía (un cursor del color del equipo). `extra` va dentro del grupo de la pantalla.
function monitor(s: number, color: string, extra: string): string {
  const cuerpo = r(s, 5, 8, 12, 10, CRT) + r(s, 5, 17, 12, 1, CRT_SOMBRA) + r(s, 6, 9, 10, 8, PANTALLA)
  return cuerpo + `<g>${r(s, 7, 10, 2, 1, color)}${extra}</g>`
}

// Globo con un tilde verde arriba a la derecha (la tarea terminó).
function globoTilde(s: number): string {
  return r(s, 15, 0, 7, 7, '#fbfbf5') + r(s, 16, 7, 1, 1, '#fbfbf5') + `<g transform="translate(${16 * s} ${1 * s})">${px(TILDE, { J: '#2e9a4a' }, s)}</g>`
}

// Manos de 1 píxel sobre el tablero, una arriba y la otra abajo según el cuadro.
function manos(s: number, n: number): string {
  return r(s, 8, n === 0 ? 17 : 18, 1, 1, PIEL) + r(s, 13, n === 0 ? 18 : 17, 1, 1, PIEL)
}

// Placa de nombre sobre el frente del escritorio (máximo 6 caracteres, escapado), en el lugar del texto del patio.
function textoEtiqueta(etiqueta: string | undefined, s: number): string {
  const t = String(etiqueta ?? '').slice(0, 6)
  if (!t) return ''
  return (
    r(s, 4, 22.5, 14, 3.5, '#efdcae') +
    `<text x="${f3(11 * s)}" y="${f3(25.5 * s)}" font-family="monospace" font-size="${f3(4.5 * s)}" text-anchor="middle" fill="${NEGRO}">${esc(t)}</text>`
  )
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function celdaPatioSvg(o: {
  fase: string
  /** Color del equipo y su tono oscuro (camisa y franja; silla). Sin él, la camisa sale de la semilla. */
  acento?: [string, string]
  /** Cuadros de la actividad del equipo (arte-actividades.ts `actividadParaCelda`). Sin ella, monitor CRT. */
  actividad?: { cuadros: string[]; tiempos: number[]; sinBrazos: string; libre: boolean }
  semilla?: number
  escala?: number
  etiqueta?: string
  quieto?: boolean
  fondo?: string
  titulo?: string
}): string {
  const s = escalaEntera(o.escala ?? 2)
  const semilla = entero(o.semilla ?? 0)
  const valido = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)
  const acento = Array.isArray(o.acento) && valido(o.acento[0]) && valido(o.acento[1]) ? o.acento : null
  const camisa = acento ? acento[0] : CAMISAS[Math.floor(semilla / 4) % CAMISAS.length]
  const oscuro = acento ? acento[1] : '#555d69'
  const act =
    o.actividad && Array.isArray(o.actividad.cuadros) && o.actividad.cuadros.length > 0 && Array.isArray(o.actividad.tiempos)
      ? o.actividad
      : null
  const retS = f3((semilla % 7) * 0.13)
  const etiqueta = textoEtiqueta(o.etiqueta, s)
  const fase = o.fase === 'entra' || o.fase === 'sale' || o.fase === 'explota' ? o.fase : 'juega'
  const base = fondoOficina(s, PATIO_ANCHO) + silla(s, oscuro) + escritorio(s) + (acento ? franja(s, camisa) : '')
  const obj = !act || act.libre ? objeto(s, semilla % 3) : ''
  const alt = `agente ${fase}`
  const persona = oficinista(s, semilla, camisa, act !== null)
  const tilde = `<g transform="translate(${10 * s} ${10 * s})">${px(TILDE, { J: '#4fe08a' }, s)}</g>`
  const cruz = `<g transform="translate(${9.5 * s} ${10.5 * s})">${px(CRUZ, { R: '#ff5a3c' }, s)}</g>`
  const cierre = (c: string): string => abrirSvg(PATIO_ANCHO * s, PATIO_ALTO * s, c + obj + etiqueta, alt, o.fondo, o.titulo)

  if (o.quieto) {
    let c = base + persona
    if (act) {
      if (fase === 'sale') c += brazosArriba(s, camisa) + act.sinBrazos + globoTilde(s)
      else if (fase === 'explota') c += act.sinBrazos + cruz
      else c += act.cuadros[0]
    } else {
      if (fase === 'sale') c += brazosArriba(s, camisa) + monitor(s, camisa, tilde)
      else if (fase === 'explota') c += monitor(s, PANTALLA, cruz)
      else c += monitor(s, camisa, '') + manos(s, 0)
    }
    return cierre(c)
  }

  // Lo que se hace en el escritorio mientras se trabaja: la actividad en bucle, o el monitor y las manos que tipean.
  const trabajo = act
    ? secuencia(
        act.cuadros.map((_c, i): [number, number] => [i, Number(act.tiempos[i]) > 0 ? Number(act.tiempos[i]) : 0.5]),
        (n) => act.cuadros[n],
        true,
        Number(retS),
      )
    : monitor(s, camisa, '') +
      `<rect x="${6 * s}" y="${9 * s}" width="${10 * s}" height="${8 * s}" fill="#ffffff" opacity="0"><animate attributeName="opacity" calcMode="discrete" values="0;0.18;0;0.1;0" keyTimes="0;0.1;0.2;0.6;0.7" dur="2s" begin="${retS}s" repeatCount="indefinite"/></rect>` +
      secuencia([[0, 0.25], [1, 0.25]], (n) => manos(s, n), true, Number(retS))
  let c = base

  if (fase === 'juega') {
    c += persona + trabajo
  } else if (fase === 'entra') {
    // Entrada: poof de polvo y el oficinista aparece sentado (sin escalar desde 0), luego trabaja.
    const aparece =
      `<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.2s" begin="0.1s" fill="freeze"/>` +
      `<g><animateTransform attributeName="transform" type="translate" values="0 ${2 * s};0 0" keyTimes="0;1" calcMode="spline" keySplines="${EASE}" dur="0.3s" begin="0.1s" fill="freeze"/>${persona}</g></g>`
    c += aparece + trabajo + poof(s, 3, 0, 0, 0.09, PAL_FX)
  } else if (fase === 'sale') {
    // Salida: el oficinista se estira (brazos arriba, cabeza un píxel más alto) y aparece un tilde verde.
    const estira =
      `<g><animateTransform attributeName="transform" type="translate" calcMode="discrete" values="0 0;0 ${-s}" keyTimes="0;1" dur="0.4s" begin="0.2s" fill="freeze"/>${persona}</g>` +
      `<g opacity="0">${brazosArriba(s, camisa)}<animate attributeName="opacity" calcMode="discrete" values="0;1" keyTimes="0;1" dur="0.4s" begin="0.2s" fill="freeze"/></g>`
    const marca = `<g opacity="0">${act ? globoTilde(s) : tilde}<animate attributeName="opacity" calcMode="discrete" values="0;1;0" keyTimes="0;0.15;0.85" dur="1.2s" fill="freeze"/></g>`
    c += estira + (act ? act.sinBrazos : monitor(s, camisa, '')) + marca
  } else {
    // Explota: lo del escritorio echa humo gris, chispa naranja y queda una ✕ roja.
    const oculta = `<set attributeName="visibility" to="hidden" begin="0.5s" fill="freeze"/>`
    const chispas =
      `<g transform="translate(${7 * s} ${5 * s})" opacity="0">${px(CHISPAS, { Y: '#ff9a2a', R: '#ff5a3c' }, s)}` +
      `<animate attributeName="opacity" calcMode="discrete" values="0;1;0;1;0" keyTimes="0;0.2;0.4;0.6;0.8" dur="1.4s" begin="0.3s" fill="freeze"/></g>`
    const xroja = `<g opacity="0">${cruz}<animate attributeName="opacity" values="0;1" dur="0.01s" begin="0.5s" fill="freeze"/></g>`
    const objetos = act ? `<g>${act.sinBrazos}${oculta}</g>` : monitor(s, camisa, oculta)
    c += persona + objetos + xroja + chispas + poof(s, 3, 0, 0.3, 0.12, { W: '#8a8f86', g: '#4d544c' })
  }
  return cierre(c)
}

// Alfombra de oficina (paredes y baldosas) sin escritorio, `anchoPx` de ancho (múltiplo de la escala; si no, se redondea hacia abajo).
export function pisoPatioSvg(anchoPx: number, escala: number = 2, opts?: { fondo?: string }): string {
  const s = escalaEntera(escala)
  const pxs = Number(anchoPx)
  const unidades = Math.max(1, Math.floor((Number.isFinite(pxs) ? pxs : 0) / s))
  return abrirSvg(unidades * s, PATIO_ALTO * s, fondoOficina(s, unidades), 'oficina vacía', opts?.fondo)
}

// Cielorraso con paneles y tubos fluorescentes, `anchoPx` de ancho exacto y 9 x escala de alto.
// Un tubo titila de vez en cuando, salvo con `quieto`.
export function doselPatioSvg(anchoPx: number, escala: number = 2, opts?: { fondo?: string; quieto?: boolean }): string {
  const s = escalaEntera(escala)
  const w = Math.max(1, Math.floor(Number.isFinite(Number(anchoPx)) ? Number(anchoPx) : 0))
  const unidades = Math.ceil(w / s)
  let c = r(s, 0, 0, unidades, 9, '#d8d4c6')
  for (let x = 0; x < unidades; x += 11) c += r(s, x, 0, 1, 9, '#b4af9c')
  c += r(s, 0, 4, unidades, 1, '#b4af9c') + r(s, 0, 8, unidades, 1, '#8f8a78')
  let i = 0
  for (let x = 2; x + 7 <= unidades; x += 11) {
    c += r(s, x, 2, 7, 1, '#fffbe0')
    c += r(s, x, 3, 7, 1, '#e6e0b4')
    if (i === 1 && !opts?.quieto) {
      c += `<rect x="${x * s}" y="${2 * s}" width="${7 * s}" height="${2 * s}" fill="#d8d4c6" opacity="0"><animate attributeName="opacity" calcMode="discrete" values="0;1;0;1;0" keyTimes="0;0.9;0.93;0.96;0.98" dur="5s" repeatCount="indefinite"/></rect>`
    }
    i++
  }
  return abrirSvg(w, 9 * s, c, 'cielorraso de la oficina', opts?.fondo)
}

// Celda «+N» del mismo tamaño que las del open space: un escritorio vacío con un cartel «+n». Estática.
export function celdaMasSvg(n: number, escala: number = 2, opts?: { fondo?: string }): string {
  const s = escalaEntera(escala)
  const texto = `<text x="${f3(11 * s)}" y="${f3(11 * s)}" font-family="monospace" font-size="${f3(8 * s)}" text-anchor="middle" fill="#3b2a14">${esc('+' + n)}</text>`
  const cartel = r(s, 3, 3, 16, 11, '#f4f0e4') + r(s, 3, 3, 16, 1, '#b8975f') + r(s, 3, 13, 16, 1, '#b8975f')
  return abrirSvg(PATIO_ANCHO * s, PATIO_ALTO * s, fondoOficina(s, PATIO_ANCHO) + escritorio(s) + cartel + texto, 'más agentes', opts?.fondo)
}
