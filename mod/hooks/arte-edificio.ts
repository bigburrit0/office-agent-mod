// Arte estático de la oficina para el Tablero: fachada del edificio, cielorraso, pizarra de corcho,
// display LCD de 7 segmentos, pared de oficina y calendario de escritorio.
// Mismos nombres y misma forma que arte-templo.ts. Funciones puras que devuelven strings SVG.
// Sin imports y solo sintaxis «borrable». Solo SMIL (sin scripts ni referencias externas).
// Paleta común de PLAN.md (los azules y naranjas son aproximados).

const C = {
  contorno: '#2B2118',
  beige: '#E8DCC0',
  beigeOscuro: '#C2AE86',
  gris: '#8F8A80',
  grisClaro: '#C9C4B8',
  azul: '#1F5FA8',
  azulClaro: '#6FA8DC',
  naranja: '#F28C28',
  corcho: '#B98A55',
  corchoOscuro: '#8E6838',
  planta: '#3F8F3A',
  maceta: '#B5602F',
}

function escalaEntera(e: unknown): number {
  const n = Math.round(Number(e))
  if (!Number.isFinite(n)) return 2
  return Math.max(1, Math.min(4, n))
}

function anchoEntero(n: unknown): number {
  const v = Math.floor(Number(n))
  return Number.isFinite(v) && v >= 1 ? v : 1
}

function abrirSvg(w: number, h: number, cuerpo: string, alt: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${alt}">${cuerpo}</svg>`
}

// Acumula rectángulos (en unidades) por color y los emite como un <path> por color.
function lienzo(s: number) {
  const por: Record<string, string> = {}
  return {
    r(x: number, y: number, w: number, h: number, color: string) {
      if (w <= 0 || h <= 0) return
      por[color] = (por[color] || '') + `M${x * s} ${y * s}h${w * s}v${h * s}h${-w * s}z`
    },
    svg(): string {
      return Object.keys(por)
        .map((k) => `<path fill="${k}" d="${por[k]}"/>`)
        .join('')
    },
  }
}

// Fachada: cielo gris claro, torre beige de 30 unidades con ventanas azules (algunas encendidas) y puerta.
// Alto 36 x escala. Sin logo ni nombre.
export function temploSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  l.r(0, 0, u, 36, C.grisClaro)
  const x0 = Math.floor((u - 30) / 2)
  l.r(x0 - 1, 2, 32, 34, C.contorno)
  l.r(x0, 3, 30, 33, C.beige)
  l.r(x0, 3, 30, 1, C.beigeOscuro)
  l.r(x0 + 14, 0, 2, 2, C.contorno)
  const encendidas: Record<string, boolean> = { '0,1': true, '2,2': true, '3,0': true, '1,4': true, '2,5': true, '0,3': true }
  for (let fila = 0; fila < 6; fila++) {
    for (let col = 0; col < 4; col++) {
      const x = x0 + 3 + col * 7
      const y = 5 + fila * 4
      l.r(x, y, 4, 3, C.contorno)
      l.r(x + 1, y + 1, 2, 1, encendidas[`${col},${fila}`] ? C.naranja : C.azul)
      l.r(x + 1, y + 1, 1, 1, encendidas[`${col},${fila}`] ? C.naranja : C.azulClaro)
    }
  }
  l.r(x0 + 11, 30, 8, 6, C.contorno)
  l.r(x0 + 12, 31, 3, 5, C.azulClaro)
  l.r(x0 + 15, 31, 3, 5, C.azul)
  l.r(0, 34, u, 2, C.gris)
  l.r(x0 + 9, 34, 12, 2, C.beigeOscuro)
  return abrirSvg(w, 36 * s, l.svg(), 'fachada de un edificio de oficinas')
}

// Cielorraso con tubos fluorescentes, repetido cada 16 unidades. Alto 8 x escala.
export function frisoSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  l.r(0, 0, u, 8, C.beige)
  l.r(0, 7, u, 1, C.beigeOscuro)
  for (let x = 0; x < u; x += 16) {
    l.r(x, 0, 1, 7, C.beigeOscuro)
    l.r(x + 2, 2, 12, 3, C.gris)
    l.r(x + 3, 3, 10, 1, C.beige)
  }
  return abrirSvg(w, 8 * s, l.svg(), 'cielorraso con tubos fluorescentes')
}

// Pizarra de corcho con post-its azules y naranjas, en módulos de 12 unidades. Alto 22 x escala.
export function codiceSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  l.r(0, 0, u, 22, C.corcho)
  for (let x = 1; x < u; x += 5) l.r(x, 3 + ((x * 7) % 15), 1, 1, C.corchoOscuro)
  l.r(0, 0, u, 1, C.beigeOscuro)
  l.r(0, 21, u, 1, C.beigeOscuro)
  for (let x = 0, k = 0; x < u; x += 12, k++) {
    const a = k % 2 === 0 ? C.azulClaro : C.naranja
    const b = k % 2 === 0 ? C.naranja : C.azulClaro
    l.r(x + 1, 3, 5, 5, a)
    l.r(x + 2, 5, 3, 1, C.contorno)
    l.r(x + 3, 2, 1, 2, C.gris)
    l.r(x + 6, 11, 5, 5, b)
    l.r(x + 7, 13, 3, 1, C.contorno)
    l.r(x + 8, 10, 1, 2, C.gris)
    l.r(x + 2, 15, 3, 4, C.grisClaro)
  }
  return abrirSvg(w, 22 * s, l.svg(), 'pizarra de corcho con post-its')
}

// Segmentos encendidos por dígito: a arriba, b arriba-der, c abajo-der, d abajo, e abajo-izq, f arriba-izq, g medio.
const SEGMENTOS: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
}

// Display LCD de 7 segmentos con el número en decimal (0..7999, no numérico o negativo da 0).
// Cada dígito mide 3x5 unidades; 2 de margen. Ancho (4 por dígito + 3) y alto 9 por escala.
export function numeroMayaSvg(n: unknown, escala: number = 2, color?: string): string {
  const s = escalaEntera(escala)
  let v = Math.round(Number(n))
  if (!Number.isFinite(v) || v < 0) v = 0
  v = Math.min(7999, v)
  const col = typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : C.naranja
  const digitos = String(v)
  const w = digitos.length * 4 + 3
  const l = lienzo(s)
  l.r(0, 0, w, 9, C.contorno)
  const apagado = '#4A3C2C'
  for (let i = 0; i < digitos.length; i++) {
    const x = 2 + i * 4
    const on = SEGMENTOS[digitos[i]]
    const seg = (id: string, sx: number, sy: number, sw: number, sh: number) =>
      l.r(x + sx, 2 + sy, sw, sh, on.includes(id) ? col : apagado)
    seg('a', 0, 0, 3, 1)
    seg('b', 2, 0, 1, 3)
    seg('c', 2, 2, 1, 3)
    seg('d', 0, 4, 3, 1)
    seg('e', 0, 2, 1, 3)
    seg('f', 0, 0, 1, 3)
    seg('g', 0, 2, 3, 1)
  }
  return abrirSvg(w * s, 9 * s, l.svg(), `display LCD ${v}`)
}

// Pared de oficina: módulos de 48 unidades (ventana con persianas, reloj, planta y cafetera con vapor).
// Alto 20 x escala. Si no es quieto, la aguja del reloj gira y el vapor sube.
export function paredTallerSvg(anchoPx: number, escala: number = 2, opts?: { quieto?: boolean }): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const quieto = !!(opts && opts.quieto)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  l.r(0, 0, u, 20, C.beige)
  l.r(0, 18, u, 2, C.gris)
  l.r(0, 17, u, 1, C.beigeOscuro)
  let anim = ''
  for (let x = 0; x < u; x += 48) {
    // Ventana con persianas.
    l.r(x + 3, 2, 14, 13, C.contorno)
    l.r(x + 4, 3, 12, 11, C.azulClaro)
    for (let y = 3; y < 11; y += 2) l.r(x + 4, y, 12, 1, C.grisClaro)
    l.r(x + 3, 15, 14, 1, C.beigeOscuro)
    // Reloj.
    l.r(x + 24, 3, 9, 9, C.contorno)
    l.r(x + 25, 4, 7, 7, C.grisClaro)
    l.r(x + 28, 4, 1, 1, C.contorno)
    l.r(x + 28, 10, 1, 1, C.contorno)
    l.r(x + 25, 7, 1, 1, C.contorno)
    l.r(x + 31, 7, 1, 1, C.contorno)
    l.r(x + 28, 7, 1, 1, C.contorno)
    // Agujas: la de las horas queda fija y la de los minutos gira.
    l.r(x + 29, 7, 2, 1, C.contorno)
    const cx = (x + 28.5) * s
    const cy = 7.5 * s
    const aguja = `<rect x="${(x + 28) * s}" y="${5 * s}" width="${s}" height="${3 * s}" fill="${C.naranja}">${
      quieto ? '' : `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="60s" repeatCount="indefinite"/>`
    }</rect>`
    anim += aguja
    // Planta en maceta.
    l.r(x + 36, 10, 1, 3, C.planta)
    l.r(x + 35, 8, 3, 3, C.planta)
    l.r(x + 34, 10, 1, 2, C.planta)
    l.r(x + 38, 10, 1, 2, C.planta)
    l.r(x + 35, 13, 3, 4, C.maceta)
    l.r(x + 34, 13, 5, 1, C.maceta)
    // Cafetera sobre la mesada.
    l.r(x + 42, 10, 4, 7, C.contorno)
    l.r(x + 43, 11, 2, 2, C.azulClaro)
    l.r(x + 43, 14, 2, 3, C.gris)
    if (!quieto) {
      const vapor = (dx: number, retraso: string) =>
        `<rect x="${(x + 43 + dx) * s}" y="${7 * s}" width="${s}" height="${2 * s}" fill="${C.grisClaro}" opacity="0.2"><animate attributeName="opacity" values="0;0.9;0" dur="2s" begin="${retraso}" repeatCount="indefinite"/></rect>`
      anim += vapor(0, '0s') + vapor(1, '1s')
    } else {
      anim += `<rect x="${(x + 43) * s}" y="${7 * s}" width="${s}" height="${2 * s}" fill="${C.grisClaro}"/>`
    }
  }
  return abrirSvg(w, 20 * s, l.svg() + anim, 'pared de oficina con reloj, ventana, planta y cafetera')
}

// Calendario de escritorio para la fecha local de ms: numero = día del mes, nombre = día de la semana.
export const TZOLKIN_NOMBRES: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function tzolkin(ms: number): { numero: number; nombre: string; texto: string } {
  let t = Number(ms)
  if (!Number.isFinite(t)) t = 0
  const f = new Date(t)
  const numero = f.getDate()
  const nombre = TZOLKIN_NOMBRES[f.getDay()]
  return { numero, nombre, texto: `${nombre} ${numero}` }
}
