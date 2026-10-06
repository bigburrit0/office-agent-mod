// Arte de relleno de la oficina: escritorio libre (aviso de «sin subagentes»), estante de carpetas
// (barra de «+ Nuevo agente») y pasillo para la mitad de abajo del panel.
// Funciones puras que devuelven strings SVG. Sin imports. Tema claro (pared crema).
// Animaciones solo con SMIL discreto, y nunca con `quieto: true`.

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
  planta: '#3F8F3A',
  maceta: '#B5602F',
  pared: '#e6dfcb',
  zocalo: '#9a8f78',
  escritorio: '#d9c28f',
  frente: '#b8975f',
  crt: '#c9c3b0',
  pantalla: '#13251b',
  papel: '#F4F0E4',
}

export const OFICINA_VACIA_ALTO = 40 // unidades

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

// Acumula rectángulos (en unidades) y los emite como <path>. Respeta el orden de pintado:
// junta en un mismo <path> solo los rectángulos seguidos del mismo color.
function lienzo(s: number) {
  const capas: Array<[string, string]> = []
  return {
    r(x: number, y: number, w: number, h: number, color: string) {
      if (w <= 0 || h <= 0) return
      const d = `M${x * s} ${y * s}h${w * s}v${h * s}h${-w * s}z`
      const ult = capas[capas.length - 1]
      if (ult && ult[0] === color) ult[1] += d
      else capas.push([color, d])
    },
    svg(): string {
      return capas.map(([k, d]) => `<path fill="${k}" d="${d}"/>`).join('')
    },
  }
}

type Lienzo = ReturnType<typeof lienzo>

// Letras de 3x5 para el cartelito «LIBRE».
const LETRAS: string[][] = [
  ['100', '100', '100', '100', '111'], // L
  ['111', '010', '010', '010', '111'], // I
  ['110', '101', '110', '101', '110'], // B
  ['110', '101', '110', '101', '101'], // R
  ['111', '100', '110', '100', '111'], // E
]

// Planta en maceta de `alto` unidades de hojas, con la base en y = b.
function planta(l: Lienzo, x: number, b: number, alto: number) {
  l.r(x + 1, b - 5, 8, 5, C.contorno)
  l.r(x + 2, b - 4, 6, 4, C.maceta)
  l.r(x + 2, b - 4, 6, 1, C.beigeOscuro)
  l.r(x + 4, b - 5 - alto, 2, alto, C.planta)
  const y = b - 5 - alto
  l.r(x + 1, y + 1, 4, 3, C.planta)
  l.r(x + 5, y, 4, 3, C.planta)
  if (alto > 8) {
    l.r(x, y + 5, 4, 3, C.planta)
    l.r(x + 6, y + 6, 4, 3, C.planta)
  }
  l.r(x + 2, y + 1, 1, 1, C.contorno)
  l.r(x + 7, y, 1, 1, C.contorno)
}

// Escritorio libre en una escena de 40 unidades de alto.
// Alto 40 x escala; el ancho se llena con pared, zócalo y piso.
export function oficinaVaciaSvg(anchoPx: number, escala: number = 2, opts?: { quieto?: boolean }): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  const cx = Math.floor(u / 2)
  // Pared, zócalo y piso de baldosas.
  l.r(0, 0, u, 30, C.pared)
  l.r(0, 30, u, 2, C.zocalo)
  l.r(0, 32, u, 8, C.beigeOscuro)
  for (let x = 0; x < u; x += 8) l.r(x, 32, 1, 8, C.beige)
  l.r(0, 36, u, 1, C.beige)
  // Cartelito naranja colgado de la pared, con «LIBRE» en pixeles.
  if (cx >= 14 && u - cx >= 14) {
    const x0 = cx - 12
    l.r(x0 + 4, 1, 1, 2, C.gris)
    l.r(x0 + 19, 1, 1, 2, C.gris)
    l.r(x0, 3, 24, 10, C.contorno)
    l.r(x0 + 1, 4, 22, 8, C.naranja)
    LETRAS.forEach((letra, i) => {
      letra.forEach((fila, fy) => {
        for (let fx = 0; fx < 3; fx++) if (fila[fx] === '1') l.r(x0 + 3 + i * 4 + fx, 5 + fy - 0, 1, 1, C.contorno)
      })
    })
  }
  // Silla a la izquierda del escritorio.
  if (cx >= 24) {
    l.r(cx - 22, 18, 4, 11, C.contorno)
    l.r(cx - 21, 19, 2, 9, C.azul)
    l.r(cx - 22, 28, 9, 3, C.contorno)
    l.r(cx - 21, 28, 7, 2, C.azul)
    l.r(cx - 18, 31, 2, 4, C.gris)
    l.r(cx - 22, 35, 9, 1, C.contorno)
  }
  // Escritorio: tablero, frente y patas.
  if (cx >= 14) {
    l.r(cx - 14, 25, 28, 2, C.contorno)
    l.r(cx - 13, 25, 26, 1, C.escritorio)
    l.r(cx - 13, 27, 26, 6, C.contorno)
    l.r(cx - 12, 27, 24, 5, C.frente)
    l.r(cx + 3, 28, 8, 3, C.contorno)
    l.r(cx + 4, 29, 6, 1, C.beigeOscuro)
    l.r(cx - 13, 33, 2, 3, C.contorno)
    l.r(cx + 11, 33, 2, 3, C.contorno)
    // Monitor CRT apagado.
    l.r(cx - 7, 15, 12, 10, C.contorno)
    l.r(cx - 6, 16, 10, 9, C.crt)
    l.r(cx - 5, 17, 8, 6, C.pantalla)
    l.r(cx - 5, 17, 2, 1, '#2f4a3a')
    l.r(cx - 3, 22, 4, 3, C.crt)
    l.r(cx - 5, 24, 8, 1, C.contorno)
    // Taza.
    l.r(cx + 7, 21, 5, 4, C.contorno)
    l.r(cx + 8, 22, 3, 3, C.papel)
    l.r(cx + 12, 22, 1, 2, C.contorno)
  }
  // Planta en maceta a un costado.
  if (u - cx >= 30) planta(l, cx + 20, 32, 11)
  let cuerpo = l.svg()
  if (!opts?.quieto && cx >= 14) {
    // Un brillo de la pantalla muy de vez en cuando.
    cuerpo += `<rect x="${(cx - 5) * s}" y="${17 * s}" width="${8 * s}" height="${6 * s}" fill="#4f8f68" opacity="0"><animate attributeName="opacity" calcMode="discrete" values="0;1;0;1;0" keyTimes="0;0.9;0.93;0.96;0.98" dur="7s" repeatCount="indefinite"/></rect>`
  }
  return abrirSvg(w, OFICINA_VACIA_ALTO * s, cuerpo, 'escritorio libre esperando a un agente')
}

// Estante de madera con carpetas y biblioratos. Alto 12 x escala.
export function estanteSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  const colores = [C.azul, C.naranja, C.beige, C.planta, C.azulClaro, C.beigeOscuro]
  // Anchos y alturas que se combinan con un paso coprimo, así el patrón no se nota repetido.
  const anchos = [2, 3, 2, 2, 3, 2, 3]
  const altos = [8, 9, 7, 8, 6, 9, 7, 8]
  let x = 1
  for (let i = 0; ; i++) {
    const ancho = anchos[(i * 3) % anchos.length]
    const alto = altos[(i * 5 + 2) % altos.length]
    if (x + ancho + 1 > u - 1) break
    const color = colores[(i * 5 + (i >> 2)) % colores.length]
    const y = 10 - alto
    l.r(x, y, ancho, alto, C.contorno)
    l.r(x, y + 1, ancho - 1, alto - 1, color)
    if (ancho === 3) l.r(x + 1, y + 2, 1, 2, C.papel)
    x += ancho
  }
  l.r(0, 10, u, 2, C.contorno)
  l.r(0, 10, u, 1, C.corcho)
  return abrirSvg(w, 12 * s, l.svg(), 'estante con carpetas')
}

// Pasillo de la oficina: pared clara, zócalo y piso de baldosas abajo; a lo largo, objetos espaciados.
// Alto exacto `altoPx` (24..480): con poco alto, solo zócalo, piso y objetos bajos.
export function pieOficinaSvg(anchoPx: number, altoPx: number, escala: number = 2, opts?: { quieto?: boolean }): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const nAlto = Math.floor(Number(altoPx))
  const h = Math.max(24, Math.min(480, Number.isFinite(nAlto) ? nAlto : 24))
  const u = Math.ceil(w / s)
  const hu = Math.ceil(h / s)
  const dy = h - hu * s // el dibujo se ancla abajo; lo que sobra arriba queda recortado
  const l = lienzo(s)
  const piso = 6
  const sueloY = hu - piso // donde arranca el piso
  const pared = sueloY - 2 // alto de la pared sobre el zócalo
  l.r(0, 0, u, sueloY - 2, C.pared)
  l.r(0, sueloY - 2, u, 2, C.zocalo)
  l.r(0, sueloY, u, piso, C.beigeOscuro)
  for (let y = 0; y < piso; y += 3) {
    for (let x = (y / 3) % 2 === 0 ? 0 : 4; x < u; x += 8) l.r(x, sueloY + y, 1, 3, C.beige)
    l.r(0, sueloY + y + 2, u, 1, C.beige)
  }
  const b = sueloY + 3 // base de los objetos, parados sobre el piso
  const orden = ['archivero', 'dispensador', 'planta', 'archivero', 'planta', 'dispensador']
  const slot = 34
  const n = Math.floor(u / slot)
  const x0 = Math.floor((u - n * slot) / 2)
  const burbujas: Array<[number, number]> = []
  for (let k = 0; k < n; k++) {
    const sx = x0 + k * slot
    const cx = sx + 17
    const tipo = orden[k % orden.length]
    if (tipo === 'archivero' && pared >= 10) {
      l.r(cx - 5, b - 14, 10, 14, C.contorno)
      l.r(cx - 4, b - 13, 8, 12, C.grisClaro)
      for (let i = 0; i < 3; i++) {
        const yy = b - 13 + i * 4
        l.r(cx - 4, yy + 3, 8, 1, C.gris)
        l.r(cx - 1, yy + 1, 2, 1, C.contorno)
      }
    } else if (tipo === 'planta' && pared >= 12) {
      planta(l, cx - 5, b, 14)
    } else if (tipo === 'dispensador' && pared >= 18) {
      l.r(cx - 4, b - 18, 8, 10, C.contorno)
      l.r(cx - 3, b - 17, 6, 9, C.azulClaro)
      l.r(cx - 3, b - 17, 1, 8, '#dff0fb')
      l.r(cx - 5, b - 9, 10, 9, C.contorno)
      l.r(cx - 4, b - 8, 8, 8, C.grisClaro)
      l.r(cx - 2, b - 6, 1, 2, C.azul)
      l.r(cx + 1, b - 6, 1, 2, C.naranja)
      l.r(cx - 3, b - 3, 6, 1, C.gris)
      burbujas.push([cx, b])
    }
    // Objetos de pared, solo si hay lugar de sobra arriba.
    if (k % 3 === 1 && pared >= 32) {
      const wy = sueloY - 28
      l.r(cx - 9, wy, 18, 18, C.contorno)
      l.r(cx - 8, wy + 1, 16, 16, C.azulClaro)
      l.r(cx - 8, wy + 1, 16, 7, C.azul)
      for (let i = 0; i < 4; i++) l.r(cx - 8, wy + 1 + i * 2, 16, 1, C.beige)
      l.r(cx - 1, wy + 1, 2, 16, C.contorno)
      l.r(cx - 10, wy + 18, 20, 2, C.beigeOscuro)
    }
    if (k % 3 === 2 && pared >= 38) {
      const ry = sueloY - 34
      l.r(cx - 4, ry, 9, 9, C.contorno)
      l.r(cx - 3, ry + 1, 7, 7, C.papel)
      l.r(cx, ry + 2, 1, 3, C.contorno)
      l.r(cx, ry + 4, 3, 1, C.naranja)
    }
  }
  let cuerpo = l.svg()
  if (!opts?.quieto) {
    for (const [cx, base] of burbujas) {
      const ys = [base - 10, base - 12, base - 14, base - 16].map((v) => v * s).join(';')
      cuerpo += `<rect x="${(cx - 1) * s}" y="${(base - 10) * s}" width="${s}" height="${s}" fill="#ffffff"><animate attributeName="y" calcMode="discrete" values="${ys}" dur="2s" repeatCount="indefinite"/></rect>`
    }
  }
  const envuelto = dy === 0 ? cuerpo : `<g transform="translate(0 ${dy})">${cuerpo}</g>`
  return abrirSvg(w, h, envuelto, 'pasillo de la oficina')
}
