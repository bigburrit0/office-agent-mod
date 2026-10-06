// Cabeza de robot retro (caja beige de los 80, pantalla CRT) en pixel art, de frente, con una emoción por situación.
// Mismo contrato que arte-cara.ts: EMOCIONES, EMOCION_ALT y caraRobotSvg(emocion, escala, opts), mismo lienzo.
// Funciones puras que devuelven texto SVG. Sin imports, sin scripts, sin referencias externas:
// la animación es solo SMIL, en pasos discretos. Cada cuadro es una grilla de caracteres ('.' es transparente).

export const EMOCIONES = ['aburrido', 'dormido', 'pensando', 'caceria', 'sospecha', 'ruge', 'molesto', 'bufido', 'contento']

export const EMOCION_ALT: Record<string, string> = {
  aburrido: 'tomando café',
  dormido: 'en ahorro de energía',
  pensando: 'procesando',
  caceria: 'manos a la obra',
  sospecha: 'con una ceja levantada',
  ruge: 'en alarma',
  molesto: 'ofendido',
  bufido: 'resoplando',
  contento: 'feliz',
}

// Paleta común de tablero-oficina (PLAN.md).
const PAL: Record<string, string> = {
  o: '#2B2118', // contorno
  b: '#E8DCC0', // beige
  d: '#C2AE86', // beigeOscuro
  g: '#8F8A80', // gris
  l: '#C9C4B8', // grisClaro
  a: '#1F5FA8', // azul
  c: '#6FA8DC', // azulClaro
  n: '#F28C28', // naranja
  m: '#B85C12', // naranjaOscuro
  p: '#9FE3C8', // pantalla
  r: '#D9363E', // rojo
  v: '#3FAE6A', // verde
  f: '#FFF4DF', // crema
}

const ANCHO = 34
const ALTO = 26
const MARCO_ANCHO = 42
const MARCO_ALTO = 34
const MARCO_DESDE = 4

type Grilla = string[][]

function vacia(w: number, h: number): Grilla {
  const g: Grilla = []
  for (let y = 0; y < h; y++) {
    const fila: string[] = []
    for (let x = 0; x < w; x++) fila.push('.')
    g.push(fila)
  }
  return g
}

function px(g: Grilla, x: number, y: number, c: string): void {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c
}

function rect(g: Grilla, x: number, y: number, w: number, h: number, c: string): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c)
}

// Cabeza: antena, caja beige con tornillos, orejas-parlante y pantalla.
function armarBase(): Grilla {
  const g = vacia(ANCHO, ALTO)
  rect(g, 16, 2, 2, 2, 'g') // tallo de la antena
  rect(g, 16, 0, 2, 2, 'n') // bolita
  rect(g, 4, 4, 26, 20, 'o') // caja
  rect(g, 5, 5, 24, 18, 'b')
  rect(g, 5, 22, 24, 1, 'd')
  rect(g, 28, 5, 1, 18, 'd')
  rect(g, 6, 6, 22, 15, 'o') // marco de la pantalla
  rect(g, 7, 7, 20, 13, 'p') // pantalla
  px(g, 5, 5, 'g') // tornillos
  px(g, 28, 5, 'g')
  px(g, 5, 21, 'g')
  px(g, 28, 21, 'g')
  rect(g, 9, 22, 6, 1, 'g') // rejilla de abajo
  px(g, 21, 22, 'n') // botones
  px(g, 23, 22, 'c')
  rect(g, 1, 10, 3, 9, 'o') // orejas-parlante
  rect(g, 30, 10, 3, 9, 'o')
  rect(g, 2, 11, 1, 7, 'd')
  rect(g, 31, 11, 1, 7, 'd')
  for (let y = 12; y <= 16; y += 2) {
    px(g, 2, y, 'g')
    px(g, 31, y, 'g')
  }
  return g
}

const BASE = armarBase()

// Marco de monitor beige de 42 x 34 con lucecita de encendido. El centro (34 x 26) queda libre.
function armarMarco(): Grilla {
  const g = vacia(MARCO_ANCHO, MARCO_ALTO)
  rect(g, 0, 0, MARCO_ANCHO, MARCO_ALTO, 'o')
  rect(g, 1, 1, MARCO_ANCHO - 2, MARCO_ALTO - 2, 'b')
  rect(g, 1, MARCO_ALTO - 2, MARCO_ANCHO - 2, 1, 'd')
  rect(g, MARCO_ANCHO - 2, 1, 1, MARCO_ALTO - 2, 'd')
  rect(g, MARCO_DESDE - 1, MARCO_DESDE - 1, ANCHO + 2, ALTO + 2, 'o')
  rect(g, MARCO_DESDE, MARCO_DESDE, ANCHO, ALTO, '.')
  px(g, 0, 0, '.')
  px(g, MARCO_ANCHO - 1, 0, '.')
  px(g, 0, MARCO_ALTO - 1, '.')
  px(g, MARCO_ANCHO - 1, MARCO_ALTO - 1, '.')
  rect(g, 36, 31, 2, 2, 'v') // luz de encendido
  rect(g, 6, 31, 8, 1, 'g') // rejilla
  px(g, 3, 31, 'g') // tornillos
  px(g, 3, 2, 'g')
  px(g, MARCO_ANCHO - 4, 2, 'g')
  return g
}

const MARCO = armarMarco()

function copia(): Grilla {
  return BASE.map((f) => f.slice())
}

// Pinta una grilla como rectángulos horizontales agrupados por color (un path por color).
function pathsDeGrilla(g: Grilla, s: number): string {
  const porColor: Record<string, string> = {}
  for (let y = 0; y < g.length; y++) {
    let x = 0
    while (x < g[y].length) {
      const c = g[y][x]
      if (c === '.' || !PAL[c]) {
        x++
        continue
      }
      let x2 = x
      while (x2 + 1 < g[y].length && g[y][x2 + 1] === c) x2++
      const w = (x2 - x + 1) * s
      porColor[c] = (porColor[c] || '') + `M${x * s} ${y * s}h${w}v${s}h-${w}z`
      x = x2 + 1
    }
  }
  let out = ''
  for (const c of Object.keys(porColor)) out += `<path fill="${PAL[c]}" d="${porColor[c]}"/>`
  return out
}

// ---- piezas de la cara ----

const OJO_I = 10
const OJO_D = 20

function pantalla(g: Grilla, c: string): void {
  rect(g, 7, 7, 20, 13, c)
}

function bola(g: Grilla, c: string): void {
  rect(g, 16, 0, 2, 2, c)
}

function ojoAbierto(g: Grilla, x: number, y: number): void {
  rect(g, x, y, 4, 4, 'o')
  px(g, x + 1, y, 'f')
}

function ojoGrande(g: Grilla, x: number): void {
  rect(g, x, 9, 4, 5, 'o')
  rect(g, x + 1, 9, 1, 2, 'f')
}

function ojoMedia(g: Grilla, x: number): void {
  rect(g, x - 1, 11, 6, 1, 'o') // párpado
  rect(g, x, 12, 4, 2, 'o')
}

function ojoRayita(g: Grilla, x: number, c: string): void {
  rect(g, x, 12, 4, 1, c)
}

function ojoFeliz(g: Grilla, x: number): void {
  px(g, x + 1, 10, 'o')
  px(g, x + 2, 10, 'o')
  px(g, x, 11, 'o')
  px(g, x + 3, 11, 'o')
}

function ojoEnBlanco(g: Grilla, x: number, dx: number): void {
  rect(g, x, 10, 4, 4, 'o')
  rect(g, x + 1, 11, 2, 2, 'f')
  px(g, x + 1 + dx, 11, 'o')
}

function cejaPlana(g: Grilla, x: number, y: number): void {
  rect(g, x, y, 4, 1, 'o')
}

function cejaArco(g: Grilla, x: number, y: number): void {
  px(g, x, y + 1, 'o')
  rect(g, x + 1, y, 2, 1, 'o')
  px(g, x + 3, y + 1, 'o')
}

// Ceja enojada: baja hacia el centro. lado -1 = ojo izquierdo, 1 = ojo derecho.
function cejaEnojada(g: Grilla, x: number, y: number, lado: number): void {
  if (lado < 0) {
    rect(g, x, y, 2, 1, 'o')
    rect(g, x + 2, y + 1, 2, 1, 'o')
  } else {
    rect(g, x, y + 1, 2, 1, 'o')
    rect(g, x + 2, y, 2, 1, 'o')
  }
}

function bocaSonrisa(g: Grilla): void {
  px(g, 13, 16, 'o')
  px(g, 20, 16, 'o')
  rect(g, 14, 17, 6, 1, 'o')
}

function bocaDecidida(g: Grilla): void {
  px(g, 12, 16, 'o')
  px(g, 21, 16, 'o')
  rect(g, 13, 17, 8, 1, 'o')
  rect(g, 14, 18, 6, 1, 'f')
}

function bocaPlana(g: Grilla): void {
  rect(g, 14, 17, 6, 1, 'o')
}

function bocaAlarma(g: Grilla): void {
  rect(g, 14, 15, 6, 4, 'o')
  rect(g, 15, 16, 4, 2, 'm')
}

function bocaZigzag(g: Grilla): void {
  for (let i = 0; i < 8; i++) px(g, 13 + i, i % 2 === 0 ? 17 : 16, 'o')
}

function taza(g: Grilla, x: number, y: number): void {
  rect(g, x, y, 5, 4, 'a')
  rect(g, x + 1, y, 3, 1, 'm') // café
  rect(g, x, y + 3, 5, 1, 'o')
  px(g, x + 5, y + 1, 'a')
  px(g, x + 5, y + 2, 'a')
}

function vapor(g: Grilla, x: number, y: number, c: string): void {
  px(g, x, y, c)
  px(g, x + 1, y - 1, c)
}

function chispa(g: Grilla, x: number, y: number, c: string): void {
  px(g, x, y, c)
  px(g, x - 1, y, c)
  px(g, x + 1, y, c)
  px(g, x, y - 1, c)
  px(g, x, y + 1, c)
}

function corazon(g: Grilla, x: number, y: number, grande: boolean): void {
  if (grande) {
    px(g, x + 1, y, 'r')
    px(g, x + 3, y, 'r')
    rect(g, x, y + 1, 5, 1, 'r')
    rect(g, x + 1, y + 2, 3, 1, 'r')
    px(g, x + 2, y + 3, 'r')
  } else {
    rect(g, x + 1, y + 1, 3, 1, 'r')
    rect(g, x + 1, y + 2, 3, 1, 'r')
    px(g, x + 2, y + 3, 'r')
  }
}

function zeta(g: Grilla, x: number, y: number): void {
  rect(g, x, y, 3, 1, 'p')
  px(g, x + 1, y + 1, 'p')
  rect(g, x, y + 2, 3, 1, 'p')
}

function nube(g: Grilla, x: number, y: number): void {
  rect(g, x, y, 2, 2, 'l')
}

// ---- cuadros de cada emoción ----

function cuadrosAburrido(): Array<[Grilla, number]> {
  const base = (): Grilla => {
    const g = copia()
    ojoMedia(g, OJO_I)
    ojoMedia(g, OJO_D)
    return g
  }
  const a = base()
  bocaPlana(a)
  taza(a, 21, 16)
  vapor(a, 22, 14, 'f')
  vapor(a, 24, 12, 'f')
  const b = base()
  bocaPlana(b)
  taza(b, 21, 16)
  vapor(b, 23, 14, 'f')
  vapor(b, 21, 12, 'f')
  const c = base()
  taza(c, 15, 15)
  vapor(c, 16, 12, 'f')
  vapor(c, 18, 10, 'f')
  return [[a, 1.2], [b, 1.2], [c, 1.1], [b, 1.2]]
}

function cuadrosDormido(): Array<[Grilla, number]> {
  const base = (): Grilla => {
    const g = copia()
    pantalla(g, 'o')
    ojoRayita(g, OJO_I, 'p')
    ojoRayita(g, OJO_D, 'p')
    rect(g, 15, 16, 4, 1, 'p')
    bola(g, 'm')
    return g
  }
  const a = base()
  zeta(a, 22, 14)
  const b = base()
  zeta(b, 22, 14)
  zeta(b, 23, 10)
  const c = base()
  zeta(c, 22, 14)
  zeta(c, 23, 10)
  zeta(c, 21, 7)
  const d = base()
  return [[a, 0.9], [b, 0.9], [c, 0.9], [d, 0.6]]
}

function cuadrosPensando(): Array<[Grilla, number]> {
  const base = (puntos: number, luz: string): Grilla => {
    const g = copia()
    ojoAbierto(g, OJO_I, 9)
    ojoAbierto(g, OJO_D, 9)
    cejaPlana(g, OJO_I, 8)
    cejaPlana(g, OJO_D, 8)
    for (let i = 0; i < puntos; i++) rect(g, 13 + i * 3, 16, 2, 2, 'o')
    bola(g, luz)
    return g
  }
  return [[base(1, 'n'), 0.5], [base(2, 'm'), 0.5], [base(3, 'n'), 0.5], [base(0, 'm'), 0.5]]
}

function cuadrosCaceria(): Array<[Grilla, number]> {
  const base = (): Grilla => {
    const g = copia()
    ojoGrande(g, OJO_I)
    ojoGrande(g, OJO_D)
    cejaEnojada(g, OJO_I, 7, -1)
    cejaEnojada(g, OJO_D, 7, 1)
    bocaDecidida(g)
    return g
  }
  const a = base()
  const b = base()
  px(b, 15, 0, 'f')
  px(b, 18, 0, 'f')
  px(b, 14, 1, 'f')
  px(b, 19, 1, 'f')
  rect(b, OJO_I + 2, 12, 1, 1, 'f')
  rect(b, OJO_D + 2, 12, 1, 1, 'f')
  return [[a, 0.6], [b, 0.4], [a, 0.6], [b, 0.4]]
}

function cuadrosSospecha(): Array<[Grilla, number]> {
  const base = (alta: number): Grilla => {
    const g = copia()
    ojoMedia(g, OJO_I)
    ojoAbierto(g, OJO_D, 10)
    cejaPlana(g, OJO_I, 10)
    cejaArco(g, OJO_D, 8 - alta)
    rect(g, 14, 17, 5, 1, 'o')
    px(g, 19, 16, 'o')
    return g
  }
  return [[base(0), 1.3], [base(1), 1.0], [base(0), 0.8]]
}

function cuadrosRuge(): Array<[Grilla, number]> {
  const base = (luz: string, fondo: string): Grilla => {
    const g = copia()
    pantalla(g, fondo)
    ojoGrande(g, OJO_I)
    ojoGrande(g, OJO_D)
    cejaEnojada(g, OJO_I, 7, -1)
    cejaEnojada(g, OJO_D, 7, 1)
    rect(g, 16, 8, 2, 4, 'f') // «!»
    rect(g, 16, 13, 2, 1, 'f')
    bocaAlarma(g)
    bola(g, luz)
    return g
  }
  return [[base('r', 'r'), 0.3], [base('o', 'm'), 0.3], [base('r', 'r'), 0.3], [base('o', 'm'), 0.3]]
}

function cuadrosMolesto(): Array<[Grilla, number]> {
  const base = (dx: number): Grilla => {
    const g = copia()
    ojoEnBlanco(g, OJO_I, dx)
    ojoEnBlanco(g, OJO_D, dx)
    cejaEnojada(g, OJO_I, 8, -1)
    cejaEnojada(g, OJO_D, 8, 1)
    bocaPlana(g)
    return g
  }
  return [[base(0), 1.0], [base(1), 0.5], [base(0), 0.8]]
}

function cuadrosBufido(): Array<[Grilla, number]> {
  const base = (nivel: number): Grilla => {
    const g = copia()
    ojoMedia(g, OJO_I)
    ojoMedia(g, OJO_D)
    cejaEnojada(g, OJO_I, 9, -1)
    cejaEnojada(g, OJO_D, 9, 1)
    rect(g, 8, 15, 2, 2, 'n') // mejillas
    rect(g, 24, 15, 2, 2, 'n')
    bocaZigzag(g)
    nube(g, 0, 8 - nivel * 2)
    nube(g, 31, 8 - nivel * 2)
    if (nivel > 0) {
      nube(g, 1, 10 - nivel * 2 - 1)
      nube(g, 30, 10 - nivel * 2 - 1)
    }
    return g
  }
  return [[base(0), 0.35], [base(1), 0.35], [base(2), 0.35]]
}

function cuadrosContento(): Array<[Grilla, number]> {
  const base = (grande: boolean, lado: number): Grilla => {
    const g = copia()
    ojoFeliz(g, OJO_I)
    ojoFeliz(g, OJO_D)
    px(g, 13, 15, 'o')
    px(g, 20, 15, 'o')
    rect(g, 14, 16, 6, 1, 'o')
    corazon(g, 15, 8, grande)
    if (lado === 0) {
      chispa(g, 9, 9, 'f')
      chispa(g, 24, 17, 'c')
    } else {
      chispa(g, 24, 9, 'f')
      chispa(g, 9, 17, 'c')
    }
    return g
  }
  return [[base(true, 0), 0.4], [base(false, 1), 0.4], [base(true, 1), 0.4], [base(false, 0), 0.4]]
}

function cuadrosDe(emocion: string): Array<[Grilla, number]> {
  switch (emocion) {
    case 'dormido':
      return cuadrosDormido()
    case 'pensando':
      return cuadrosPensando()
    case 'caceria':
      return cuadrosCaceria()
    case 'sospecha':
      return cuadrosSospecha()
    case 'ruge':
      return cuadrosRuge()
    case 'molesto':
      return cuadrosMolesto()
    case 'bufido':
      return cuadrosBufido()
    case 'contento':
      return cuadrosContento()
    default:
      return cuadrosAburrido()
  }
}

function num(n: number): string {
  return String(Math.round(n * 1000) / 1000)
}

// Cuerpo SVG de una emoción: quieto = solo el primer cuadro; si no, los cuadros en bucle (SMIL discreto).
function cuerpoEmocion(emocion: string, s: number, quieto: boolean): string {
  const cuadros = cuadrosDe(emocion)
  if (quieto || cuadros.length < 2) return pathsDeGrilla(cuadros[0][0], s)
  let total = 0
  for (const c of cuadros) total += c[1]
  const limites: number[] = [0]
  let acum = 0
  for (const c of cuadros) {
    acum += c[1]
    limites.push(acum / total)
  }
  let out = ''
  for (let i = 0; i < cuadros.length; i++) {
    const t0 = limites[i]
    const t1 = limites[i + 1]
    let tiempos: number[]
    let valores: string[]
    if (i === 0) {
      tiempos = [0, t1, 1]
      valores = ['visible', 'hidden', 'hidden']
    } else if (i === cuadros.length - 1) {
      tiempos = [0, t0, 1]
      valores = ['hidden', 'visible', 'visible']
    } else {
      tiempos = [0, t0, t1, 1]
      valores = ['hidden', 'visible', 'hidden', 'hidden']
    }
    out +=
      `<g${i === 0 ? '' : ' visibility="hidden"'}>${pathsDeGrilla(cuadros[i][0], s)}` +
      `<animate attributeName="visibility" calcMode="discrete" values="${valores.join(';')}" keyTimes="${tiempos.map(num).join(';')}" dur="${num(total)}s" repeatCount="indefinite"/></g>`
  }
  return out
}

function abrirSvg(s: number, cuerpo: string, fondo?: string, marco?: boolean): string {
  const w = (marco ? MARCO_ANCHO : ANCHO) * s
  const h = (marco ? MARCO_ALTO : ALTO) * s
  const bg = typeof fondo === 'string' && /^#[0-9a-fA-F]{6}$/.test(fondo) ? `<rect width="${w}" height="${h}" fill="${fondo}"/>` : ''
  const dentro = marco ? `<g transform="translate(${MARCO_DESDE * s} ${MARCO_DESDE * s})">${cuerpo}</g>${pathsDeGrilla(MARCO, s)}` : cuerpo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${bg}${dentro}</svg>`
}

// Devuelve el SVG del robot para una emoción. Lienzo de 34 x 26 unidades por `escala` px.
// opts.dormirEn: segundos hasta que el robot aburrido entra en ahorro de energía (solo para 'aburrido').
// opts.quieto: solo el primer cuadro, sin animaciones ni efectos.
// opts.marco: lienzo de 42 x 34 con borde de monitor; el robot se corre (4,4).
export function caraRobotSvg(emocion: string, escala: number, opts?: { dormirEn?: number; quieto?: boolean; fondo?: string; marco?: boolean }): string {
  const n = typeof escala === 'number' && Number.isFinite(escala) ? Math.round(escala) : 3
  const s = Math.max(1, Math.min(8, n))
  const e = EMOCIONES.includes(emocion) ? emocion : 'aburrido'
  const quieto = opts?.quieto === true
  const dormirEn = opts?.dormirEn
  if (e === 'aburrido' && typeof dormirEn === 'number' && Number.isFinite(dormirEn)) {
    const x = Math.round(dormirEn)
    if (x <= 0) return caraRobotSvg('dormido', s, { quieto, fondo: opts?.fondo, marco: opts?.marco })
    if (!quieto) {
      // El robot aburrido se esconde y el dormido aparece solo.
      const cuerpo =
        `<g>${cuerpoEmocion('aburrido', s, false)}<set attributeName="visibility" to="hidden" begin="${x}s" fill="freeze"/></g>` +
        `<g visibility="hidden">${cuerpoEmocion('dormido', s, false)}<set attributeName="visibility" to="visible" begin="${x}s" fill="freeze"/></g>`
      return abrirSvg(s, cuerpo, opts?.fondo, opts?.marco)
    }
  }
  return abrirSvg(s, cuerpoEmocion(e, s, quieto), opts?.fondo, opts?.marco)
}
