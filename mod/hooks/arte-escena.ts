// Escena única de la oficina: cielorraso, pared, piso, el robot colgado y los agentes en un solo SVG.
// Puro y sin imports: el robot y las celdas llegan ya armados como strings SVG y se anidan como <svg>
// hijos con x/y; el escritorio libre se dibuja acá mismo sobre el piso de la escena.

export const ESCENA_FONDO = '#e6dfcb' // color de pared: el panel lo usa de fondo de las celdas y de la caja

export type CeldaEscena = { svg: string } // una celda ya armada (66 x 81 a escala 3)

const TECHO = 18
const PISO = 14
const ROBOT_X = 8
const ROBOT_ANCHO = 126
const ROBOT_ALTO = 102
const ROBOT_BLOQUE = ROBOT_ALTO + 16 // robot y su soporte
const CELDA_ANCHO = 66
const CELDA_ALTO = 81
const VACIA_ALTO = 80
const ZONA_X = ROBOT_X + ROBOT_ANCHO + 12
const MARGEN_DER = 8
const PESO_MAX = 120000

const PARED = ESCENA_FONDO
const SOMBRA = '#d3cbb4'
const ZOCALO = '#9a8f78'
const CIELO = '#d8d4c6'
const TUBO = '#fffbe0'
const CONTORNO = '#2B2118'
const BEIGE = '#E8DCC0'
const PLANTA = '#3F8F3A'
const MACETA = '#B5602F'
const AZUL = '#6FA8DC'

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function rect(x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`
}

function anchoValido(ancho: number): number {
  const n = Number(ancho)
  return Math.max(200, Math.min(1200, Math.round(Number.isFinite(n) ? n : 200)))
}

// Cuántas celdas entran en una fila (puede ser 0 si el ancho es muy chico).
function porFila(ancho: number): number {
  return Math.max(0, Math.floor((ancho - ZONA_X - MARGEN_DER) / CELDA_ANCHO))
}

function filasPara(ancho: number, celdas: number): number {
  const n = porFila(ancho)
  const c = Math.max(0, Math.floor(Number(celdas) || 0))
  if (n === 0 || c === 0) return 0
  return Math.min(2, Math.ceil(c / n))
}

export function escenaAlto(ancho: number, celdas: number, conVacia: boolean): number {
  const w = anchoValido(ancho)
  const c = Math.max(0, Math.floor(Number(celdas) || 0))
  const zona = c === 0 && conVacia ? VACIA_ALTO : filasPara(w, c) * CELDA_ALTO
  return TECHO + Math.max(ROBOT_BLOQUE, zona) + PISO
}

// ---------------------------------------------------------------------------
// Decoración propia (se apoya en el piso; `b` es la y del piso)
// ---------------------------------------------------------------------------

type Pieza = { ancho: number; piso: boolean; dibujar: (x: number, b: number) => string }

const ventana: Pieza = {
  ancho: 40,
  piso: false,
  dibujar: (x, b) => {
    const y = b - 70
    let c = rect(x, y, 40, 34, CONTORNO) + rect(x + 2, y + 2, 36, 30, AZUL) + rect(x - 2, y + 34, 44, 3, BEIGE) + rect(x - 2, y + 37, 44, 1, ZOCALO)
    for (let i = 0; i < 4; i++) c += rect(x + 2, y + 2 + i * 5, 36, 3, BEIGE)
    return c + rect(x + 19, y + 2, 2, 30, CONTORNO)
  },
}

const planta: Pieza = {
  ancho: 18,
  piso: true,
  dibujar: (x, b) => {
    let c = rect(x + 3, b - 12, 12, 12, CONTORNO) + rect(x + 4, b - 11, 10, 10, MACETA) + rect(x + 4, b - 11, 10, 2, '#d98a55')
    c += rect(x + 8, b - 34, 2, 22, CONTORNO)
    c += rect(x + 4, b - 40, 10, 10, PLANTA) + rect(x, b - 32, 8, 8, PLANTA) + rect(x + 10, b - 30, 8, 8, PLANTA)
    c += rect(x + 6, b - 44, 6, 6, PLANTA) + rect(x + 6, b - 38, 3, 3, '#5db356')
    return c
  },
}

const dispensador: Pieza = {
  ancho: 16,
  piso: true,
  dibujar: (x, b) => {
    return (
      rect(x, b - 34, 16, 34, CONTORNO) +
      rect(x + 1, b - 20, 14, 19, BEIGE) +
      rect(x + 3, b - 33, 10, 12, AZUL) +
      rect(x + 4, b - 32, 3, 8, '#a9cdee') +
      rect(x + 5, b - 14, 6, 3, CONTORNO) +
      rect(x + 6, b - 13, 4, 1, '#c0392b') +
      rect(x + 4, b - 8, 8, 4, '#cfc3a4')
    )
  },
}

const archivero: Pieza = {
  ancho: 20,
  piso: true,
  dibujar: (x, b) => {
    let c = rect(x, b - 38, 20, 38, CONTORNO) + rect(x + 1, b - 37, 18, 36, '#b9bfc4')
    for (let i = 0; i < 3; i++) {
      const y = b - 37 + i * 12
      c += rect(x + 2, y + 1, 16, 10, '#cfd4d8') + rect(x + 7, y + 4, 6, 2, CONTORNO) + rect(x + 2, y + 10, 16, 1, '#8f969b')
    }
    return c
  },
}

const cuadro: Pieza = {
  ancho: 22,
  piso: false,
  dibujar: (x, b) => {
    const y = b - 64
    return rect(x, y, 22, 18, CONTORNO) + rect(x + 2, y + 2, 18, 14, '#f4f0e4') + rect(x + 4, y + 10, 14, 4, PLANTA) + rect(x + 13, y + 4, 4, 4, '#e0b54a')
  },
}

const SECUENCIA: Pieza[] = [ventana, planta, dispensador, archivero, ventana, planta, cuadro, archivero]
const SOLO_PARED: Pieza[] = [ventana, cuadro]

// Llena [x0, x1] con piezas repartidas parejo: el hueco liso entre piezas nunca pasa de 60 px.
function rellenar(x0: number, x1: number, b: number, soloPared: boolean): string {
  const g = x1 - x0
  if (g < 14) return ''
  const lista = soloPared ? SOLO_PARED : SECUENCIA
  const elegidas: Pieza[] = []
  let suma = 0
  for (let i = 0; i < 64; i++) {
    const p = lista[i % lista.length]
    if (suma + p.ancho + (elegidas.length + 2) * 6 > g) break
    elegidas.push(p)
    suma += p.ancho
  }
  if (elegidas.length === 0) return ''
  const hueco = (g - suma) / (elegidas.length + 1)
  let c = ''
  let x = x0 + hueco
  for (const p of elegidas) {
    c += p.dibujar(Math.round(x), b)
    x += p.ancho + hueco
  }
  return c
}

// ---------------------------------------------------------------------------
// Armado
// ---------------------------------------------------------------------------

// Mete x/y en la etiqueta de apertura del primer <svg ...> para anidarlo.
function anidar(svg: string, x: number, y: number): string {
  return String(svg).replace(/^\s*<svg\b/, `<svg x="${x}" y="${y}"`)
}

function cielorraso(w: number, quieto: boolean): string {
  let c = rect(0, 0, w, TECHO, CIELO) + rect(0, 8, w, 1, '#b4af9c') + rect(0, 16, w, 2, '#8f8a78')
  let i = 0
  for (let x = 6; x + 28 <= w - 4; x += 40) {
    c += rect(x, 4, 28, 2, TUBO) + rect(x, 6, 28, 2, '#e6e0b4') + rect(x, 3, 28, 1, '#b4af9c')
    if (i === 1 && !quieto) {
      c += `<rect x="${x}" y="3" width="28" height="5" fill="${CIELO}" opacity="0"><animate attributeName="opacity" calcMode="discrete" values="0;1;0;1;0" keyTimes="0;0.9;0.93;0.96;0.98" dur="5s" repeatCount="indefinite"/></rect>`
    }
    i++
  }
  return c
}

function pisoYPared(w: number, h: number): string {
  const yPiso = h - PISO
  let c = rect(0, TECHO, w, yPiso - TECHO, PARED) + rect(0, TECHO, w, 2, SOMBRA)
  c += rect(0, yPiso, w, 4, ZOCALO) + rect(0, yPiso, w, 1, '#b3a88f')
  c += rect(0, yPiso + 4, w, 10, '#c9b78f')
  let d = ''
  for (let x = 0; x < w; x += 20) {
    d += `M${x} ${yPiso + 4}h10v10h-10z`
  }
  c += `<path d="${d}" fill="#bfab80"/>` + rect(0, yPiso + 9, w, 1, '#a99768')
  return c
}

function soporteRobot(): string {
  const cx = ROBOT_X + ROBOT_ANCHO / 2
  return (
    rect(cx - 3, TECHO, 6, 16, CONTORNO) +
    rect(cx - 2, TECHO, 4, 15, '#a9b0b6') +
    rect(cx - 20, TECHO + 12, 40, 4, CONTORNO) +
    rect(cx - 19, TECHO + 12, 38, 2, '#c4cacf') +
    rect(cx - 20, TECHO + 8, 4, 4, CONTORNO) +
    rect(cx + 16, TECHO + 8, 4, 4, CONTORNO)
  )
}

// Escritorio libre dibujado sobre el piso (escala 3; el pie de las patas queda en yPiso).
// Devuelve el SVG y el ancho que ocupa. Sin pared ni piso propios.
function escritorioLibre(libre: number, quieto: boolean, yPiso: number): { svg: string; ancho: number } {
  const S = 3
  const cx = 22
  const anchoDesk = (cx + 14) * S
  if (libre < anchoDesk) return { svg: '', ancho: 0 }
  const conPlanta = libre >= (cx + 31) * S
  const r = (x: number, y: number, w: number, h: number, f: string) => rect(x, y, w, h, f)
  let c = ''
  // Cartel naranja «LIBRE» colgado de la pared.
  const x0 = cx - 12
  const letras = [
    ['100', '100', '100', '100', '111'],
    ['111', '010', '010', '010', '111'],
    ['110', '101', '110', '101', '110'],
    ['110', '101', '110', '101', '101'],
    ['111', '100', '110', '100', '111'],
  ]
  c += r(x0 + 4, -33, 1, 2, '#8F8A80') + r(x0 + 19, -33, 1, 2, '#8F8A80')
  c += r(x0, -31, 24, 10, CONTORNO) + r(x0 + 1, -30, 22, 8, '#F28C28')
  letras.forEach((letra, i) => {
    letra.forEach((fila, fy) => {
      for (let fx = 0; fx < 3; fx++) if (fila[fx] === '1') c += r(x0 + 3 + i * 4 + fx, -29 + fy, 1, 1, CONTORNO)
    })
  })
  // Silla azul.
  c += r(cx - 22, -18, 4, 11, CONTORNO) + r(cx - 21, -17, 2, 9, '#1F5FA8')
  c += r(cx - 22, -8, 9, 3, CONTORNO) + r(cx - 21, -8, 7, 2, '#1F5FA8')
  c += r(cx - 18, -5, 2, 4, '#8F8A80') + r(cx - 22, -1, 9, 1, CONTORNO)
  // Escritorio.
  c += r(cx - 14, -11, 28, 2, CONTORNO) + r(cx - 13, -11, 26, 1, '#d9c28f')
  c += r(cx - 13, -9, 26, 6, CONTORNO) + r(cx - 12, -9, 24, 5, '#b8975f')
  c += r(cx + 3, -8, 8, 3, CONTORNO) + r(cx + 4, -7, 6, 1, '#C2AE86')
  c += r(cx - 13, -3, 2, 3, CONTORNO) + r(cx + 11, -3, 2, 3, CONTORNO)
  // Monitor CRT apagado.
  c += r(cx - 7, -21, 12, 10, CONTORNO) + r(cx - 6, -20, 10, 9, '#c9c3b0') + r(cx - 5, -19, 8, 6, '#13251b')
  c += r(cx - 5, -19, 2, 1, '#2f4a3a') + r(cx - 3, -14, 4, 3, '#c9c3b0') + r(cx - 5, -12, 8, 1, CONTORNO)
  if (!quieto) {
    c += `<rect x="${cx - 5}" y="-19" width="8" height="6" fill="#4f8f68" opacity="0"><animate attributeName="opacity" calcMode="discrete" values="0;1;0;1;0" keyTimes="0;0.9;0.93;0.96;0.98" dur="7s" repeatCount="indefinite"/></rect>`
  }
  // Taza.
  c += r(cx + 7, -15, 5, 4, CONTORNO) + r(cx + 8, -14, 3, 3, '#F4F0E4') + r(cx + 12, -14, 1, 2, CONTORNO)
  // Planta en maceta.
  if (conPlanta) {
    const x = cx + 20
    c += r(x + 1, -5, 8, 5, CONTORNO) + r(x + 2, -4, 6, 4, MACETA) + r(x + 2, -4, 6, 1, '#C2AE86')
    c += r(x + 4, -16, 2, 11, PLANTA) + r(x + 1, -15, 4, 3, PLANTA) + r(x + 5, -16, 4, 3, PLANTA)
    c += r(x, -11, 4, 3, PLANTA) + r(x + 6, -10, 4, 3, PLANTA)
  }
  const ancho = (conPlanta ? cx + 31 : cx + 14) * S
  return { svg: `<g transform="translate(${ZONA_X} ${yPiso}) scale(${S})">${c}</g>`, ancho }
}

// Medidas de un SVG ya armado (width/height de la etiqueta de apertura); null si no se pueden leer.
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

// Cuelga los cuadros en la pared de la zona de trabajo, de izquierda a derecha, centrados entre cielorraso y piso.
// Devuelve lo dibujado y la x donde termina el último (ZONA_X si no entró ninguno).
function colgarCuadros(cuadros: string[], w: number, yPiso: number): { svg: string; fin: number } {
  const GAP = 10
  const parteAlta = TECHO + 2 // debajo de la sombra del cielorraso
  const espacio = yPiso - parteAlta
  let c = ''
  let x = ZONA_X
  for (const q of cuadros) {
    const m = medidaSvg(q)
    if (!m || m.alto + 8 > espacio) continue
    if (x + m.ancho > w - MARGEN_DER) continue
    const y = Math.round(parteAlta + (espacio - m.alto) / 2)
    const cx = x + Math.floor(m.ancho / 2)
    c += rect(cx - 1, y - 7, 2, 2, CONTORNO) + rect(cx, y - 5, 1, 5, ZOCALO)
    c += anidar(q, x, y)
    x += m.ancho + GAP
  }
  return { svg: c, fin: x === ZONA_X ? ZONA_X : x - GAP }
}

function armar(
  w: number,
  h: number,
  cara: string,
  celdas: CeldaEscena[],
  vacia: boolean,
  quieto: boolean,
  alt: string,
  cuadros: string[] = [],
): string {
  const yPiso = h - PISO
  const n = porFila(w)
  let c = cielorraso(w, quieto) + pisoYPared(w, h) + soporteRobot()
  c += anidar(cara, ROBOT_X, TECHO + 16)
  if (celdas.length > 0) {
    const finAbajo = Math.min(celdas.length, n)
    for (let i = 0; i < celdas.length; i++) {
      const fila = Math.floor(i / n)
      const col = i % n
      c += anidar(celdas[i].svg, ZONA_X + col * CELDA_ANCHO, yPiso - CELDA_ALTO * (fila + 1))
    }
    c += rellenar(ZONA_X + finAbajo * CELDA_ANCHO, w - MARGEN_DER, yPiso, false)
    if (celdas.length > n) {
      const arriba = celdas.length - n
      c += rellenar(ZONA_X + arriba * CELDA_ANCHO, w - MARGEN_DER, yPiso - CELDA_ALTO, true)
    }
  } else if (cuadros.length > 0) {
    const col = colgarCuadros(cuadros, w, yPiso)
    c += col.svg
    c += rellenar(col.fin, w - MARGEN_DER, yPiso, false)
  } else if (vacia) {
    const libre = w - ZONA_X - MARGEN_DER
    const anchoV = escritorioLibre(libre, quieto, yPiso)
    c += anchoV.svg
    c += rellenar(ZONA_X + anchoV.ancho, w - MARGEN_DER, yPiso, false)
  } else {
    c += rellenar(ZONA_X, w - MARGEN_DER, yPiso, false)
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${esc(alt)}">` +
    c +
    `</svg>`
  )
}

export function escenaOficinaSvg(o: {
  ancho: number // px, acotado a 200..1200; el SVG mide exactamente esto
  cara: string // SVG del robot (126 x 102)
  celdas: CeldaEscena[] // agentes a dibujar (quien llama ya limitó la cantidad)
  vacia?: boolean // dibuja el escritorio libre cuando no hay celdas (un string se trata como true)
  quieto?: boolean
  alt?: string // aria-label; por defecto «Oficina de agentes»
  cuadros?: string[] // SVGs que cuelgan de la pared de la zona de trabajo (sin celdas); no dibuja el escritorio libre
}): string {
  const w = anchoValido(o.ancho)
  const lista = Array.isArray(o.celdas) ? o.celdas.filter((x) => x && typeof x.svg === 'string') : []
  const conVacia = o.vacia === true || (typeof o.vacia === 'string' && o.vacia !== '')
  const h = escenaAlto(w, lista.length, conVacia)
  const n = porFila(w)
  let visibles = lista.slice(0, n * 2)
  const alt = typeof o.alt === 'string' && o.alt !== '' ? o.alt : 'Oficina de agentes'
  const quieto = o.quieto === true
  const cara = String(o.cara ?? '')
  const cuadros = Array.isArray(o.cuadros) ? o.cuadros.filter((x) => typeof x === 'string' && x !== '') : []
  let out = armar(w, h, cara, visibles, conVacia, quieto, alt, cuadros)
  // Si se pasa del peso, se dibujan menos celdas (de a una desde el final).
  while (out.length >= PESO_MAX && visibles.length > 0) {
    visibles = visibles.slice(0, -1)
    out = armar(w, h, cara, visibles, conVacia, quieto, alt, cuadros)
  }
  return out
}
