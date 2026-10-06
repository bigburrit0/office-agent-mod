// Cabeza de robot retro (caja beige de los 80, pantalla CRT) en pixel art, de frente, con una emoción por situación.
// Mismo contrato que arte-cara.ts: EMOCIONES, EMOCION_ALT y caraRobotSvg(emocion, escala, opts), mismo lienzo.
// Funciones puras que devuelven texto SVG. Sin imports, sin scripts, sin referencias externas:
// la animación es solo SMIL, en pasos discretos. Cada cuadro es una grilla de caracteres ('.' es transparente).

// Las 9 de siempre primero (mismo orden) y después las 22 nuevas, por grupo (ver emociones.ts).
export const EMOCIONES = [
  'aburrido',
  'dormido',
  'pensando',
  'caceria',
  'sospecha',
  'ruge',
  'molesto',
  'bufido',
  'contento',
  // ocio
  'bostezo',
  'estira',
  'riega',
  'diario',
  'solitario',
  'silba',
  'guina',
  // hora del día
  'manana',
  'hambre',
  'casa',
  // trabajo
  'concentrado',
  'tipea',
  'multitarea',
  // eventos buenos
  'festeja',
  'aplaude',
  'orgullo',
  'alivio',
  // eventos malos
  'panico',
  'frustrado',
  'chispazo',
  // social
  'saluda',
  'sorpresa',
]

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
  bostezo: 'bostezando',
  estira: 'estirándose',
  riega: 'regando la planta',
  diario: 'leyendo el diario',
  solitario: 'jugando al solitario',
  silba: 'silbando',
  guina: 'guiñando un ojo',
  manana: 'con el café de la mañana',
  hambre: 'con hambre',
  casa: 'pensando en irse a casa',
  concentrado: 'concentrado con auriculares',
  tipea: 'tipeando rápido',
  multitarea: 'haciendo mil cosas a la vez',
  festeja: 'festejando',
  aplaude: 'aplaudiendo',
  orgullo: 'orgulloso',
  alivio: 'aliviado',
  panico: 'en pánico',
  frustrado: 'frustrado',
  chispazo: 'echando chispas',
  saluda: 'saludando',
  sorpresa: 'sorprendido',
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
  y: '#F2C230', // amarillo
  w: '#FFFFFF', // blanco
  e: '#2E7D4F', // verdeOscuro
  k: '#5A3416', // marrón
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
  // El vapor queda por debajo de la línea de los ojos (filas 11 a 13), para no tapar el derecho.
  vapor(a, 22, 15, 'f')
  vapor(a, 25, 14, 'f')
  const b = base()
  bocaPlana(b)
  taza(b, 21, 16)
  vapor(b, 23, 15, 'f')
  vapor(b, 26, 14, 'f')
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

// ---- piezas nuevas (emociones 10 a 31) ----

// Ojo cerrado y relajado: una «u» al revés.
function ojoCerrado(g: Grilla, x: number): void {
  px(g, x, 11, 'o')
  rect(g, x + 1, 12, 2, 1, 'o')
  px(g, x + 3, 11, 'o')
}

// Ojo chico mirando a un lado: pupila de 2 × 2 corrida `dx` (−1, 0 o 1).
function ojoChico(g: Grilla, x: number, y: number, dx: number): void {
  rect(g, x + 1 + dx, y, 2, 2, 'o')
}

// Ojo enorme y blanco con una pupila mínima (susto).
function ojoSusto(g: Grilla, x: number, dx: number): void {
  rect(g, x - 1, 8, 6, 6, 'o')
  rect(g, x, 9, 4, 4, 'w')
  px(g, x + 1 + dx, 10, 'o')
  px(g, x + 2 + dx, 10, 'o')
}

// Ojo en «X».
function ojoX(g: Grilla, x: number): void {
  for (let i = 0; i < 4; i++) {
    px(g, x + i, 9 + i, 'o')
    px(g, x + 3 - i, 9 + i, 'o')
  }
}

function bocaO(g: Grilla, x: number, y: number, w: number, h: number): void {
  rect(g, x, y, w, h, 'o')
  if (w > 2 && h > 2) rect(g, x + 1, y + 1, w - 2, h - 2, 'm')
}

function bocaGrande(g: Grilla): void {
  rect(g, 12, 15, 10, 1, 'o')
  rect(g, 13, 16, 8, 2, 'm')
  rect(g, 14, 18, 6, 1, 'o')
  px(g, 12, 16, 'o')
  px(g, 21, 16, 'o')
}

function dientes(g: Grilla): void {
  rect(g, 12, 15, 10, 4, 'o')
  rect(g, 13, 16, 8, 2, 'w')
  for (let x = 15; x < 21; x += 2) rect(g, x, 16, 1, 2, 'o')
}

function gota(g: Grilla, x: number, y: number): void {
  px(g, x, y, 'c')
  rect(g, x - 1, y + 1, 3, 2, 'c')
}

function nota(g: Grilla, x: number, y: number, c: string): void {
  rect(g, x, y + 2, 2, 2, c)
  rect(g, x + 1, y, 1, 2, c)
  px(g, x + 2, y, c)
}

// Mano chiquita de robot: 4 × 4 con contorno oscuro y la palma beige como la caja.
function mano(g: Grilla, x: number, y: number): void {
  rect(g, x, y, 4, 4, 'o')
  rect(g, x + 1, y + 1, 2, 2, 'b')
}

// Corre todo el dibujo `dx` columnas (el temblor del pánico). Lo que sale del lienzo se pierde.
function desplazar(g: Grilla, dx: number): Grilla {
  return g.map(fila => fila.map((_c, x) => (x - dx >= 0 && x - dx < fila.length ? fila[x - dx] : '.')))
}

// ---- cuadros de las emociones nuevas ----

function cuadrosBostezo(): Array<[Grilla, number]> {
  const base = (abre: number, lagrima: boolean): Grilla => {
    const g = copia()
    ojoCerrado(g, OJO_I)
    ojoCerrado(g, OJO_D)
    if (abre === 0) rect(g, 15, 16, 4, 1, 'o')
    else bocaO(g, 16 - abre, 17 - abre, 2 + abre * 2, 1 + abre * 2)
    if (lagrima) px(g, 9, 13, 'c')
    return g
  }
  return [[base(0, false), 0.8], [base(1, false), 0.4], [base(2, false), 0.5], [base(2, true), 0.9], [base(1, true), 0.4]]
}

function cuadrosEstira(): Array<[Grilla, number]> {
  const base = (alto: number): Grilla => {
    const g = copia()
    ojoFeliz(g, OJO_I)
    ojoFeliz(g, OJO_D)
    bocaO(g, 16, 16, 2, 2)
    // Bracitos que salen de las orejas y suben.
    const y = 12 - alto * 4
    rect(g, 1, y + 3, 1, 9 - y - 3 + 1, 'b')
    rect(g, 32, y + 3, 1, 9 - y - 3 + 1, 'b')
    mano(g, 0, y)
    mano(g, 31, y)
    return g
  }
  return [[base(0), 0.6], [base(1), 0.5], [base(2), 1.2], [base(1), 0.5]]
}

function cuadrosRiega(): Array<[Grilla, number]> {
  const base = (gotas: number, hoja: boolean): Grilla => {
    const g = copia()
    ojoChico(g, OJO_I, 12, 1)
    ojoChico(g, OJO_D, 12, 1)
    bocaSonrisa(g)
    // Maceta abajo a la derecha y la regadera arriba de ella.
    rect(g, 25, 20, 6, 5, 'k')
    rect(g, 24, 20, 8, 1, 'm')
    rect(g, 27, 16, 2, 4, 'v')
    px(g, 26, 17, 'v')
    px(g, 29, 16, 'v')
    if (hoja) {
      px(g, 25, 15, 'e')
      px(g, 30, 14, 'e')
    }
    rect(g, 20, 9, 6, 4, 'a')
    rect(g, 26, 10, 2, 1, 'a')
    px(g, 28, 11, 'a')
    for (let i = 0; i < gotas; i++) px(g, 28 + (i % 2), 13 + i, 'c')
    return g
  }
  return [[base(0, false), 0.5], [base(1, false), 0.3], [base(2, false), 0.3], [base(3, true), 0.9]]
}

function cuadrosDiario(): Array<[Grilla, number]> {
  const base = (dx: number, pagina: boolean): Grilla => {
    const g = copia()
    ojoChico(g, OJO_I, 10, dx)
    ojoChico(g, OJO_D, 10, dx)
    rect(g, 7, 13, 20, 11, 'f')
    rect(g, 7, 13, 20, 1, 'l')
    rect(g, 9, 15, 7, 2, 'o') // titular
    for (let y = 18; y < 23; y += 2) {
      rect(g, 9, y, 7, 1, 'l')
      rect(g, 18, y, 7, 1, 'l')
    }
    rect(g, 18, 15, 7, 2, 'c') // foto
    rect(g, 16, 13, 1, 11, 'd')
    if (pagina) rect(g, 17, 12, 4, 6, 'f')
    return g
  }
  return [[base(-1, false), 1.0], [base(0, false), 0.8], [base(1, false), 0.8], [base(1, true), 0.4]]
}

function cuadrosSolitario(): Array<[Grilla, number]> {
  const carta = (g: Grilla, x: number, y: number, palo: string): void => {
    rect(g, x, y, 5, 6, 'o')
    rect(g, x + 1, y + 1, 3, 4, 'w')
    px(g, x + 2, y + 2, palo)
    px(g, x + 2, y + 3, palo)
  }
  const base = (paso: number): Grilla => {
    const g = copia()
    ojoChico(g, OJO_I, 11, paso === 1 ? 1 : 0)
    ojoChico(g, OJO_D, 11, paso === 1 ? 1 : 0)
    rect(g, 15, 16, 4, 1, 'o')
    carta(g, 6, 18, 'r')
    carta(g, 12, 18, 'o')
    carta(g, 24, 18, 'r')
    // La carta del medio viaja a la pila de la derecha.
    if (paso === 0) carta(g, 18, 18, 'o')
    if (paso === 1) carta(g, 21, 15, 'o')
    if (paso === 2) carta(g, 25, 17, 'o')
    return g
  }
  return [[base(0), 1.0], [base(1), 0.4], [base(2), 1.0]]
}

function cuadrosSilba(): Array<[Grilla, number]> {
  const base = (sube: number): Grilla => {
    const g = copia()
    ojoCerrado(g, OJO_I)
    ojoCerrado(g, OJO_D)
    bocaO(g, 18, 16, 2, 2)
    nota(g, 22, 14 - sube * 2, 'o')
    if (sube > 0) nota(g, 25, 10 - sube * 2 + 2, 'a')
    return g
  }
  return [[base(0), 0.5], [base(1), 0.5], [base(2), 0.5]]
}

function cuadrosGuina(): Array<[Grilla, number]> {
  const base = (guina: boolean, brillo: boolean): Grilla => {
    const g = copia()
    ojoAbierto(g, OJO_I, 9)
    if (guina) ojoFeliz(g, OJO_D)
    else ojoAbierto(g, OJO_D, 9)
    bocaSonrisa(g)
    px(g, 20, 15, 'o')
    if (brillo) chispa(g, 26, 8, 'f')
    return g
  }
  return [[base(false, false), 1.0], [base(true, false), 0.25], [base(true, true), 0.6], [base(false, false), 0.4]]
}

function cuadrosManana(): Array<[Grilla, number]> {
  const base = (abre: boolean, rayos: boolean, humo: number): Grilla => {
    const g = copia()
    if (abre) {
      ojoAbierto(g, OJO_I, 9)
      ojoAbierto(g, OJO_D, 9)
    } else {
      ojoMedia(g, OJO_I)
      ojoMedia(g, OJO_D)
    }
    bocaSonrisa(g)
    // Sol arriba a la izquierda.
    rect(g, 0, 0, 4, 4, 'y')
    if (rayos) {
      px(g, 5, 1, 'y')
      px(g, 1, 5, 'y')
      px(g, 5, 4, 'y')
    }
    // Tazón grande de café.
    rect(g, 12, 18, 10, 6, 'n')
    rect(g, 13, 18, 8, 1, 'k')
    rect(g, 22, 19, 2, 1, 'n')
    rect(g, 23, 20, 1, 2, 'n')
    rect(g, 12, 23, 10, 1, 'm')
    vapor(g, 14 + humo, 16, 'f')
    vapor(g, 18 - humo, 15, 'f')
    return g
  }
  return [[base(false, false, 0), 1.0], [base(false, true, 1), 0.8], [base(true, true, 0), 1.2], [base(true, false, 1), 0.8]]
}

function cuadrosHambre(): Array<[Grilla, number]> {
  const base = (baba: number, ruido: boolean): Grilla => {
    const g = copia()
    // Mira para arriba, a la hamburguesa soñada.
    ojoChico(g, OJO_I, 9, 1)
    ojoChico(g, OJO_D, 9, 1)
    rect(g, 13, 16, 8, 1, 'o')
    px(g, 13, 15, 'o')
    for (let i = 0; i < baba; i++) px(g, 19, 17 + i, 'c')
    // Globo de pensamiento con una hamburguesa.
    px(g, 25, 6, 'f')
    rect(g, 26, 4, 2, 1, 'f')
    rect(g, 24, 0, 10, 4, 'f')
    rect(g, 26, 0, 6, 1, 'n')
    rect(g, 25, 1, 8, 1, 'v')
    rect(g, 25, 2, 8, 1, 'k')
    rect(g, 26, 3, 6, 1, 'n')
    if (ruido) {
      for (let i = 0; i < 10; i++) px(g, 12 + i, i % 2 === 0 ? 24 : 25, 'o')
    }
    return g
  }
  return [[base(0, false), 0.8], [base(1, false), 0.6], [base(2, true), 0.5], [base(2, false), 0.6]]
}

function cuadrosCasa(): Array<[Grilla, number]> {
  const base = (mira: number, luz: boolean): Grilla => {
    const g = copia()
    ojoChico(g, OJO_I, 10, mira)
    ojoChico(g, OJO_D, 10, mira)
    bocaSonrisa(g)
    // Reloj chico arriba a la izquierda.
    rect(g, 0, 0, 5, 5, 'o')
    rect(g, 1, 1, 3, 3, 'f')
    px(g, 2, 2, 'o')
    px(g, mira < 0 ? 3 : 2, mira < 0 ? 2 : 1, 'o')
    // Casita soñada arriba a la derecha.
    rect(g, 26, 2, 7, 4, 'f')
    for (let i = 0; i < 4; i++) rect(g, 25 + i, 2 - Math.min(i, 3) + (i > 0 ? 0 : 0), 9 - i * 2, 1, 'r')
    rect(g, 28, 4, 2, 2, 'k')
    px(g, 31, 3, luz ? 'y' : 'l')
    // Maletín listo, abajo.
    rect(g, 22, 20, 7, 5, 'k')
    rect(g, 24, 19, 3, 1, 'o')
    rect(g, 22, 22, 7, 1, 'm')
    return g
  }
  return [[base(1, false), 0.9], [base(-1, false), 0.7], [base(1, true), 0.9], [base(0, true), 0.6]]
}

function cuadrosConcentrado(): Array<[Grilla, number]> {
  const base = (pestanea: boolean, nota1: boolean): Grilla => {
    const g = copia()
    if (pestanea) {
      ojoRayita(g, OJO_I, 'o')
      ojoRayita(g, OJO_D, 'o')
    } else {
      ojoMedia(g, OJO_I)
      ojoMedia(g, OJO_D)
    }
    cejaPlana(g, OJO_I, 9)
    cejaPlana(g, OJO_D, 9)
    bocaPlana(g)
    // Auriculares: vincha por arriba y almohadillas sobre las orejas.
    rect(g, 6, 3, 22, 1, 'a')
    rect(g, 4, 3, 2, 7, 'a')
    rect(g, 28, 3, 2, 7, 'a')
    rect(g, 0, 9, 5, 11, 'a')
    rect(g, 29, 9, 5, 11, 'a')
    rect(g, 1, 10, 3, 9, 'c')
    rect(g, 30, 10, 3, 9, 'c')
    if (nota1) nota(g, 30, 2, 'o')
    return g
  }
  return [[base(false, false), 1.4], [base(false, true), 0.8], [base(true, true), 0.2], [base(false, false), 0.8]]
}

function cuadrosTipea(): Array<[Grilla, number]> {
  const base = (lado: number): Grilla => {
    const g = copia()
    ojoChico(g, OJO_I, 12, 0)
    ojoChico(g, OJO_D, 12, 0)
    cejaEnojada(g, OJO_I, 9, -1)
    cejaEnojada(g, OJO_D, 9, 1)
    rect(g, 15, 16, 4, 1, 'o')
    // Teclado abajo y dos manitos que se turnan.
    rect(g, 5, 21, 24, 4, 'l')
    rect(g, 5, 24, 24, 1, 'g')
    for (let x = 6; x < 28; x += 2) {
      px(g, x, 22, 'g')
      px(g, x + 1, 23, 'g')
    }
    mano(g, 9, lado === 0 ? 19 : 18)
    mano(g, 22, lado === 0 ? 18 : 19)
    if (lado === 0) chispa(g, 10, 17, 'f')
    else chispa(g, 23, 17, 'f')
    return g
  }
  return [[base(0), 0.15], [base(1), 0.15]]
}

function cuadrosMultitarea(): Array<[Grilla, number]> {
  const base = (cambia: boolean): Grilla => {
    const g = copia()
    ojoEnBlanco(g, OJO_I, cambia ? 1 : 0)
    ojoEnBlanco(g, OJO_D, cambia ? 0 : 1)
    bocaZigzag(g)
    // Cuatro bracitos con cuatro cosas: hoja, taza, teléfono y lápiz.
    const arriba = cambia ? 1 : 0
    rect(g, 0, 4 + arriba, 3, 5, 'f')
    rect(g, 3, 8 + arriba, 1, 2, 'b')
    rect(g, 0, 20 - arriba, 4, 3, 'a')
    rect(g, 3, 19 - arriba, 1, 2, 'b')
    rect(g, 31, 3 + arriba, 3, 5, 'r')
    px(g, 32, 4 + arriba, 'w')
    rect(g, 30, 8 + arriba, 1, 2, 'b')
    rect(g, 31, 19 - arriba, 1, 5, 'y')
    px(g, 31, 24 - arriba, 'o')
    rect(g, 30, 19 - arriba, 1, 2, 'b')
    return g
  }
  return [[base(false), 0.3], [base(true), 0.3]]
}

function cuadrosFesteja(): Array<[Grilla, number]> {
  const colores = ['r', 'y', 'c', 'v', 'n', 'a']
  const base = (paso: number): Grilla => {
    const g = copia()
    ojoFeliz(g, OJO_I)
    ojoFeliz(g, OJO_D)
    bocaGrande(g)
    // Gorrito de fiesta en la antena.
    rect(g, 16, 0, 2, 1, 'y')
    rect(g, 15, 1, 4, 1, 'r')
    rect(g, 14, 2, 6, 2, 'y')
    // Confeti que cae.
    for (let i = 0; i < 14; i++) {
      const x = (i * 7 + 3) % 34
      const y = (i * 5 + paso * 3) % 26
      px(g, x, y, colores[(i + paso) % colores.length])
    }
    return g
  }
  return [[base(0), 0.25], [base(1), 0.25], [base(2), 0.25], [base(3), 0.25]]
}

function cuadrosAplaude(): Array<[Grilla, number]> {
  const base = (juntas: boolean): Grilla => {
    const g = copia()
    ojoFeliz(g, OJO_I)
    ojoFeliz(g, OJO_D)
    bocaSonrisa(g)
    if (juntas) {
      mano(g, 13, 19)
      mano(g, 17, 19)
      px(g, 13, 17, 'f')
      px(g, 20, 17, 'f')
      px(g, 16, 17, 'f')
      px(g, 12, 19, 'f')
      px(g, 21, 19, 'f')
    } else {
      mano(g, 9, 19)
      mano(g, 21, 19)
    }
    return g
  }
  return [[base(false), 0.2], [base(true), 0.2]]
}

function cuadrosOrgullo(): Array<[Grilla, number]> {
  const base = (guina: boolean): Grilla => {
    const g = copia()
    if (guina) {
      ojoAbierto(g, OJO_I, 10)
      ojoFeliz(g, OJO_D)
      chispa(g, 26, 8, 'f')
    } else {
      ojoCerrado(g, OJO_I)
      ojoCerrado(g, OJO_D)
    }
    bocaSonrisa(g)
    px(g, 20, 15, 'o')
    // Medalla en el pecho.
    rect(g, 15, 20, 1, 2, 'a')
    rect(g, 18, 20, 1, 2, 'a')
    rect(g, 15, 22, 4, 3, 'y')
    px(g, 16, 23, 'w')
    return g
  }
  return [[base(false), 0.9], [base(true), 0.7], [base(false), 0.6]]
}

function cuadrosAlivio(): Array<[Grilla, number]> {
  const base = (paso: number): Grilla => {
    const g = copia()
    ojoCerrado(g, OJO_I)
    ojoCerrado(g, OJO_D)
    rect(g, 15, 17, 4, 1, 'o')
    px(g, 14, 16, 'o')
    px(g, 19, 16, 'o')
    // Gota de sudor que se va y bocanada de «uf».
    gota(g, 26, 6 + paso * 2)
    if (paso > 0) nube(g, 21, 16 - paso)
    if (paso > 1) nube(g, 24, 14 - paso)
    return g
  }
  return [[base(0), 0.6], [base(1), 0.5], [base(2), 0.9]]
}

function cuadrosPanico(): Array<[Grilla, number]> {
  const base = (paso: number): Grilla => {
    const g = copia()
    pantalla(g, paso % 2 === 0 ? 'r' : 'p')
    ojoSusto(g, OJO_I, paso % 2 === 0 ? -1 : 1)
    ojoSusto(g, OJO_D, paso % 2 === 0 ? -1 : 1)
    bocaZigzag(g)
    rect(g, 13, 17, 8, 1, 'o')
    bola(g, 'r')
    gota(g, 2, 3 + (paso % 2))
    gota(g, 31, 4 - (paso % 2))
    return desplazar(g, paso % 2 === 0 ? -1 : 1)
  }
  return [[base(0), 0.12], [base(1), 0.12], [base(2), 0.12], [base(3), 0.12]]
}

function cuadrosFrustrado(): Array<[Grilla, number]> {
  const base = (paso: number): Grilla => {
    const g = copia()
    ojoMedia(g, OJO_I)
    ojoMedia(g, OJO_D)
    cejaEnojada(g, OJO_I, 8, -1)
    cejaEnojada(g, OJO_D, 8, 1)
    dientes(g)
    // Venita en la frente y una nube con garabatos.
    const v = paso === 1 ? 'r' : 'm'
    px(g, 24, 8, v)
    px(g, 26, 8, v)
    px(g, 25, 7, v)
    px(g, 25, 9, v)
    rect(g, 22, 0, 12, 4, 'l')
    for (let i = 0; i < 5; i++) px(g, 23 + i * 2, (i + paso) % 2 === 0 ? 1 : 2, i % 2 === 0 ? 'r' : 'o')
    nube(g, 0, 7 - paso)
    nube(g, 32, 7 - paso)
    return g
  }
  return [[base(0), 0.4], [base(1), 0.4], [base(2), 0.4]]
}

function cuadrosChispazo(): Array<[Grilla, number]> {
  const base = (paso: number): Grilla => {
    const g = copia()
    ojoX(g, OJO_I)
    ojoX(g, OJO_D)
    bocaZigzag(g)
    // Rayas de interferencia en la pantalla.
    rect(g, 7, 8 + paso * 3, 20, 1, 'l')
    rect(g, 7 + paso, 15 - paso, 20 - paso, 1, 'g')
    bola(g, 'y')
    // Chispas que saltan de la antena y de las orejas.
    chispa(g, paso === 0 ? 13 : 20, 1, 'y')
    chispa(g, 1, paso === 1 ? 7 : 20, 'y')
    chispa(g, 32, paso === 1 ? 20 : 7, 'n')
    return g
  }
  return [[base(0), 0.1], [base(1), 0.1], [base(2), 0.15]]
}

function cuadrosSaluda(): Array<[Grilla, number]> {
  const base = (lado: number, guina: boolean): Grilla => {
    const g = copia()
    ojoAbierto(g, OJO_I, 9)
    if (guina) ojoFeliz(g, OJO_D)
    else ojoAbierto(g, OJO_D, 9)
    bocaSonrisa(g)
    // Manito que saluda desde la derecha, de un lado al otro.
    const x = lado === 0 ? 29 : 31
    rect(g, 31, 9, 1, 2, 'b')
    rect(g, x, 3, 3, 4, 'b')
    rect(g, x, 2, 1, 1, 'b')
    rect(g, x + 2, 2, 1, 1, 'b')
    px(g, x + 1, 4, 'd')
    rect(g, x + 1, 7, 1, 2, 'b')
    return g
  }
  return [[base(0, false), 0.3], [base(1, false), 0.3], [base(0, false), 0.3], [base(1, true), 0.6]]
}

function cuadrosSorpresa(): Array<[Grilla, number]> {
  const base = (salta: boolean): Grilla => {
    const g = copia()
    const y = salta ? 8 : 9
    rect(g, OJO_I, y, 4, 4, 'o')
    rect(g, OJO_D, y, 4, 4, 'o')
    px(g, OJO_I + 1, y + 1, 'f')
    px(g, OJO_D + 1, y + 1, 'f')
    cejaArco(g, OJO_I, y - 3)
    cejaArco(g, OJO_D, y - 3)
    bocaO(g, 15, 15, 4, 4)
    if (salta) {
      rect(g, 31, 0, 2, 5, 'n')
      rect(g, 31, 6, 2, 1, 'n')
    }
    return g
  }
  return [[base(true), 0.3], [base(false), 0.5], [base(true), 0.3], [base(false), 0.9]]
}

const CUADROS_NUEVOS: Record<string, () => Array<[Grilla, number]>> = {
  bostezo: cuadrosBostezo,
  estira: cuadrosEstira,
  riega: cuadrosRiega,
  diario: cuadrosDiario,
  solitario: cuadrosSolitario,
  silba: cuadrosSilba,
  guina: cuadrosGuina,
  manana: cuadrosManana,
  hambre: cuadrosHambre,
  casa: cuadrosCasa,
  concentrado: cuadrosConcentrado,
  tipea: cuadrosTipea,
  multitarea: cuadrosMultitarea,
  festeja: cuadrosFesteja,
  aplaude: cuadrosAplaude,
  orgullo: cuadrosOrgullo,
  alivio: cuadrosAlivio,
  panico: cuadrosPanico,
  frustrado: cuadrosFrustrado,
  chispazo: cuadrosChispazo,
  saluda: cuadrosSaluda,
  sorpresa: cuadrosSorpresa,
}

function cuadrosDe(emocion: string): Array<[Grilla, number]> {
  if (Object.prototype.hasOwnProperty.call(CUADROS_NUEVOS, emocion)) return CUADROS_NUEVOS[emocion]()
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
