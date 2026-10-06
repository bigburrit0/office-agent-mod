// Actividades del patio: qué hace cada oficinista en su escritorio según su EQUIPO.
// Cada equipo tiene su actividad pensada a mano; un equipo que no está en ACTIVIDAD_EQUIPO
// usa la genérica (papeles y lapicera) y el panel avisa que hay que pensarle una.
// Funciones puras que devuelven fragmentos SVG en unidades de la celda del patio (22 × 27),
// para que arte-escritorios.ts los pinte encima del oficinista. Sin imports y solo sintaxis
// «borrable» (nada de enum, namespace ni parameter properties) para que Node 24 lo corra directo.
//
// Coordenadas que se respetan (las de la celda): cabeza en x 8 a 13 y filas 1 a 6, hombros en la
// fila 8, brazos que salen de x 3-4 (izquierdo) y x 17-18 (derecho), tablero del escritorio en la fila 18.
// Lo que va sobre el escritorio se apoya en la fila 17 (abajo) y no baja de ahí.

export type Actividad = {
  /** Qué se ve, en palabras (para el texto alternativo y la vista previa). */
  texto: string
  /** Duración de cada cuadro de la fase «juega», en segundos. */
  tiempos: number[]
  /** `true` si deja libre el rincón derecho del escritorio (x 18 a 20) para la taza, la planta o los papeles. */
  libre: boolean
}

export const ACTIVIDADES: Record<string, Actividad> = {
  papeles: { texto: 'escribe en papeles con una lapicera', tiempos: [0.4, 0.4, 0.4, 1.2], libre: true },
  cuaderno: { texto: 'anota en un cuaderno y mira con binoculares', tiempos: [0.5, 0.5, 1.2, 0.9, 0.9], libre: true },
  laptop: { texto: 'programa en una laptop', tiempos: [0.25, 0.25, 0.25, 0.25, 1.4], libre: true },
  tablas: { texto: 'arma tablas y gráficos en su monitor', tiempos: [1.0, 0.5, 0.5, 1.2], libre: true },
  libros: { texto: 'hojea libros y los apila', tiempos: [1.0, 0.4, 0.4, 1.0], libre: false },
  pizarra: { texto: 'dibuja flechas en una pizarra', tiempos: [0.5, 0.5, 0.5, 1.4], libre: true },
  camaras: { texto: 'vigila las cámaras y habla por el walkie', tiempos: [0.6, 0.6, 1.4], libre: false },
  foco: { texto: 'cambia el foco de la lámpara', tiempos: [0.4, 0.4, 1.4], libre: false },
  carrito: { texto: 'limpia el escritorio con su carrito', tiempos: [0.3, 0.3, 0.3, 1.0], libre: false },
  llaves: { texto: 'ordena el tablero de llaves y hace sonar el llavero', tiempos: [1.2, 0.3, 0.3], libre: true },
  escuadra: { texto: 'traza líneas con la escuadra', tiempos: [0.5, 0.5, 0.5, 1.2], libre: true },
}

/** Actividad pensada para cada equipo. Un equipo nuevo se agrega acá (y su prueba lo exige). */
export const ACTIVIDAD_EQUIPO: Record<string, string> = {
  base: 'papeles',
  direccion: 'pizarra',
  research: 'cuaderno',
  librarian: 'libros',
  datos: 'tablas',
  'dev-a1': 'laptop',
  'dev-tablero': 'laptop',
  seguridad: 'camaras',
  mantenimiento: 'foco',
  limpieza: 'carrito',
  facilities: 'llaves',
  arquitectura: 'escuadra',
}

export const ACTIVIDAD_GENERICA = 'papeles'

/** Actividad de un equipo; `pensada` es `false` si el equipo no tiene la suya y se usa la genérica. */
export function actividadDe(equipo: unknown): { actividad: string; pensada: boolean } {
  const clave = String(equipo ?? '')
  const propia = Object.prototype.hasOwnProperty.call(ACTIVIDAD_EQUIPO, clave) ? ACTIVIDAD_EQUIPO[clave] : undefined
  return propia ? { actividad: propia, pensada: true } : { actividad: ACTIVIDAD_GENERICA, pensada: false }
}

// ---------------------------------------------------------------------------
// Colores
// ---------------------------------------------------------------------------

const NEGRO = '#1c120a'
const PIEL = '#f0c49a'
const PAPEL = '#f4f0e4'
const PAPEL_SOMBRA = '#d9d3c0'
const RENGLON = '#9db3c9'
const TINTA = '#2b3a67'
const GRIS = '#6d7480'
const GRIS_CLARO = '#aab1bb'
const GRIS_OSCURO = '#2a2f38'
const PANTALLA = '#13251b'
const VERDE = '#4fe08a'
const AMARILLO = '#f2c230'
const AMARILLO_OSCURO = '#a87818'
const ROJO = '#e8402a'
const AZUL = '#3d6fd1'
const CELESTE = '#7fd0ff'
const PLANO = '#2f5f9e'
const PLANO_LINEA = '#cfe6ff'
const MADERA = '#8a5a2b'
const BLANCO = '#ffffff'

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

function f3(v: number): string {
  return String(Math.round(v * 1000) / 1000)
}

function r(s: number, x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${f3(x * s)}" y="${f3(y * s)}" width="${f3(w * s)}" height="${f3(h * s)}" fill="${fill}"/>`
}

function escalaEntera(e: unknown): number {
  const n = Math.round(Number(e))
  if (!Number.isFinite(n)) return 2
  return Math.max(1, Math.min(4, n))
}

function colorValido(c: unknown, porDefecto: string): string {
  return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : porDefecto
}

// Brazo desde el hombro (izquierdo: columna x 3-4; derecho: x 17-18) hasta la mano en (x, y).
// Sube o baja por el costado y después va en horizontal hasta la mano (1 × 1, color piel).
function brazo(s: number, lado: number, x: number, y: number, camisa: string): string {
  if (camisa === '') return ''
  const hx = lado < 0 ? 3 : 17
  const arriba = Math.min(y, 9)
  const abajo = Math.max(y, 9)
  let c = r(s, hx, arriba, 2, abajo - arriba + 1, camisa)
  if (lado < 0 && x > hx + 2) c += r(s, hx + 2, y, x - hx - 2, 1, camisa)
  if (lado < 0 && x < hx) c += r(s, x + 1, y, hx - x - 1, 1, camisa)
  if (lado > 0 && x < hx - 1) c += r(s, x + 1, y, hx - x - 1, 1, camisa)
  if (lado > 0 && x > hx + 2) c += r(s, hx + 2, y, x - hx - 2, 1, camisa)
  return c + r(s, x, y, 1, 1, PIEL)
}

// ---------------------------------------------------------------------------
// Cuadros de cada actividad
// ---------------------------------------------------------------------------

function papeles(s: number, n: number, camisa: string): string {
  // Hoja sobre el escritorio (x 6 a 15), renglones que se van llenando.
  let c = r(s, 6, 15, 10, 3, PAPEL) + r(s, 6, 17, 10, 1, PAPEL_SOMBRA)
  const escritos = n === 3 ? 0 : n + 1
  for (let i = 0; i < 3; i++) c += r(s, 7, 15 + i, i < escritos ? 3 + i * 2 : 1, 1, i < escritos ? TINTA : RENGLON)
  if (n === 3) {
    // Da vuelta la hoja: una hoja levantada en la mano izquierda.
    c += r(s, 7, 10, 5, 6, PAPEL) + r(s, 7, 10, 5, 1, PAPEL_SOMBRA) + r(s, 8, 12, 3, 1, RENGLON) + r(s, 8, 14, 3, 1, RENGLON)
    c += brazo(s, -1, 7, 13, camisa) + brazo(s, 1, 14, 16, camisa)
    return c
  }
  const mx = 11 + n
  c += brazo(s, -1, 6, 16, camisa) + brazo(s, 1, mx, 16, camisa)
  c += r(s, mx - 1, 14, 1, 2, NEGRO) + r(s, mx - 2, 13, 1, 1, AZUL) // lapicera
  return c
}

function cuaderno(s: number, n: number, camisa: string): string {
  // Cuaderno abierto (dos páginas con espiral) apoyado sobre el escritorio.
  let c = r(s, 6, 15, 4, 3, PAPEL) + r(s, 11, 15, 4, 3, PAPEL) + r(s, 10, 15, 1, 3, GRIS)
  c += r(s, 7, 16, 2, 1, RENGLON) + r(s, 12, 16, 2, 1, RENGLON)
  if (n <= 1) {
    if (n === 1) c += r(s, 12, 15, 2, 1, TINTA)
    c += brazo(s, -1, 6, 16, camisa) + brazo(s, 1, 13 + n, 16, camisa) + r(s, 12 + n, 14, 1, 2, AMARILLO_OSCURO)
    return c
  }
  // Binoculares a la altura de los ojos; en los cuadros 3 y 4 mira a un costado y al otro.
  const dx = n === 3 ? -1 : n === 4 ? 1 : 0
  c += r(s, 8 + dx, 3, 2, 3, NEGRO) + r(s, 12 + dx, 3, 2, 3, NEGRO) + r(s, 10 + dx, 4, 2, 1, GRIS)
  c += r(s, 8 + dx, 3, 2, 1, CELESTE) + r(s, 12 + dx, 3, 2, 1, CELESTE)
  c += brazo(s, -1, 7 + dx, 5, camisa) + brazo(s, 1, 14 + dx, 5, camisa)
  return c
}

function laptop(s: number, n: number, camisa: string): string {
  // Laptop abierta mirando hacia afuera (como el monitor de siempre): pantalla con código.
  let c = r(s, 5, 9, 12, 8, GRIS_OSCURO) + r(s, 6, 10, 10, 6, PANTALLA) + r(s, 4, 17, 14, 1, GRIS_CLARO)
  const colores = [VERDE, CELESTE, AMARILLO, VERDE, ROJO, CELESTE]
  const largos = [6, 4, 7, 3, 5, 6]
  const desde = n < 4 ? n : 0
  for (let i = 0; i < 3; i++) {
    const k = (desde + i) % largos.length
    c += r(s, 7 + (k % 2), 11 + i * 2, largos[k], 1, colores[k])
  }
  if (n === 4) {
    // Un sorbo de café: la taza frente a la boca.
    c += r(s, 10, 5, 3, 3, PAPEL) + r(s, 13, 6, 1, 1, PAPEL) + r(s, 10, 5, 3, 1, MADERA)
    c += brazo(s, -1, 6, 17, camisa) + brazo(s, 1, 13, 7, camisa)
    return c
  }
  c += brazo(s, -1, 7 + (n % 2), 17, camisa) + brazo(s, 1, 14 - (n % 2), 17, camisa)
  return c
}

function tablas(s: number, n: number, camisa: string): string {
  // Monitor ancho de pantalla oscura: a la izquierda una tabla con celdas, a la derecha barras que crecen.
  let c = r(s, 4, 9, 14, 8, GRIS_OSCURO) + r(s, 5, 10, 12, 6, PANTALLA) + r(s, 9, 17, 4, 1, GRIS)
  for (let y = 11; y <= 15; y += 2) c += r(s, 6, y, 4, 1, CELESTE)
  c += r(s, 8, 10, 1, 6, GRIS)
  const alturas = n === 0 ? [1, 2, 1] : n === 1 ? [2, 3, 2] : [3, 5, 4]
  const colores = [VERDE, AMARILLO, CELESTE]
  for (let i = 0; i < 3; i++) c += r(s, 11 + i * 2, 16 - alturas[i], 1, alturas[i], colores[i])
  if (n === 3) {
    // Señala un dato: la mano derecha apunta a la barra más alta, que se marca en rojo.
    c += r(s, 13, 10, 1, 1, ROJO)
    c += brazo(s, -1, 4, 16, camisa) + brazo(s, 1, 14, 10, camisa)
    return c
  }
  c += brazo(s, -1, 4, 16, camisa) + brazo(s, 1, 17, 16, camisa)
  return c
}

function libros(s: number, n: number, camisa: string): string {
  // Pila de libros en el rincón derecho (x 16 a 20); en el cuadro 4 suma uno arriba.
  const lomos = [ROJO, AZUL, VERDE, AMARILLO]
  const alto = n === 3 ? 4 : 3
  let c = ''
  for (let i = 0; i < alto; i++) c += r(s, 16, 17 - i * 2, 5, 2, lomos[i]) + r(s, 16, 17 - i * 2, 5, 1, PAPEL_SOMBRA)
  if (n === 3) return c + brazo(s, -1, 6, 16, camisa) + brazo(s, 1, 16, 10, camisa)
  // Libro abierto en las manos; en los cuadros 2 y 3 una página se da vuelta.
  c += r(s, 6, 12, 4, 5, PAPEL) + r(s, 11, 12, 4, 5, PAPEL) + r(s, 10, 12, 1, 5, MADERA)
  c += r(s, 7, 13, 2, 1, RENGLON) + r(s, 12, 13, 2, 1, RENGLON) + r(s, 7, 15, 2, 1, RENGLON)
  if (n === 1) c += r(s, 11, 10, 2, 3, PAPEL_SOMBRA)
  if (n === 2) c += r(s, 9, 10, 2, 3, PAPEL_SOMBRA)
  return c + brazo(s, -1, 6, 16, camisa) + brazo(s, 1, 14, 16, camisa)
}

function pizarra(s: number, n: number, camisa: string): string {
  // Pizarra blanca con marco gris, parada sobre el escritorio. Una flecha que crece y un círculo.
  let c = r(s, 4, 9, 13, 9, GRIS) + r(s, 5, 10, 11, 7, BLANCO)
  c += r(s, 6, 12, 2, 2, AZUL) + r(s, 13, 14, 2, 2, AZUL)
  const largo = n === 0 ? 2 : 4
  c += r(s, 8, 13, largo, 1, ROJO)
  if (n >= 1) c += r(s, 11, 12, 1, 1, ROJO) + r(s, 11, 14, 1, 1, ROJO) + r(s, 12, 13, 1, 1, ROJO)
  if (n >= 2) {
    // Encierra el cuadrado de la derecha en un círculo.
    c += r(s, 13, 13, 2, 1, VERDE) + r(s, 12, 14, 1, 2, VERDE) + r(s, 15, 14, 1, 2, VERDE) + r(s, 13, 16, 2, 1, VERDE)
  }
  const mano = n === 0 ? [10, 13] : n === 1 ? [12, 12] : n === 2 ? [15, 13] : [17, 15]
  c += r(s, mano[0], mano[1] - 2, 1, 2, ROJO) // marcador
  return c + brazo(s, -1, 4, 17, camisa) + brazo(s, 1, mano[0], mano[1], camisa)
}

function camaras(s: number, n: number, camisa: string): string {
  // Monitor de cámaras con cuatro cuadros; uno titila. A la derecha, el walkie.
  let c = r(s, 4, 10, 10, 8, GRIS_OSCURO) + r(s, 5, 11, 4, 3, PANTALLA) + r(s, 9, 11, 4, 3, PANTALLA)
  c += r(s, 5, 14, 4, 3, PANTALLA) + r(s, 9, 14, 4, 3, PANTALLA)
  c += r(s, 6, 12, 1, 2, VERDE) + r(s, 11, 15, 1, 2, VERDE)
  c += r(s, 10 + n % 2, 12, 1, 1, n === 1 ? ROJO : VERDE)
  if (n === 2) {
    // Walkie a la boca, con ondas.
    c += r(s, 13, 3, 2, 5, NEGRO) + r(s, 14, 1, 1, 2, GRIS) + r(s, 13, 4, 2, 1, ROJO)
    c += r(s, 16, 3, 1, 1, CELESTE) + r(s, 17, 2, 1, 1, CELESTE) + r(s, 17, 4, 1, 1, CELESTE)
    return c + brazo(s, -1, 5, 17, camisa) + brazo(s, 1, 14, 7, camisa)
  }
  c += r(s, 16, 13, 2, 5, NEGRO) + r(s, 17, 11, 1, 2, GRIS) + r(s, 16, 14, 2, 1, ROJO)
  return c + brazo(s, -1, 5, 17, camisa) + brazo(s, 1, 15, 16, camisa)
}

function foco(s: number, n: number, camisa: string): string {
  // Escalerita apoyada a la izquierda y lámpara de escritorio a la derecha.
  let c = ''
  for (let y = 9; y < 18; y += 3) c += r(s, 1, y, 3, 1, MADERA)
  c += r(s, 1, 8, 1, 10, MADERA) + r(s, 3, 8, 1, 10, MADERA)
  c += r(s, 14, 16, 5, 2, GRIS) + r(s, 16, 11, 1, 5, GRIS) + r(s, 13, 9, 6, 2, GRIS_OSCURO)
  const prendido = n === 2
  c += r(s, 15, 11, 3, 2, prendido ? AMARILLO : GRIS_CLARO)
  if (prendido) {
    c += r(s, 12, 13, 1, 1, AMARILLO) + r(s, 19, 13, 1, 1, AMARILLO) + r(s, 16, 14, 1, 1, AMARILLO)
    c += r(s, 11, 11, 1, 1, AMARILLO) + r(s, 20, 11, 1, 1, AMARILLO)
    return c + brazo(s, -1, 6, 17, camisa) + brazo(s, 1, 12, 17, camisa)
  }
  // Enrosca el foco: la mano gira (sube y baja) sobre la lámpara.
  return c + brazo(s, -1, 6, 17, camisa) + brazo(s, 1, 15 + n, 12, camisa)
}

function carrito(s: number, n: number, camisa: string): string {
  // Carrito de limpieza a la derecha: balde, rociador y ruedas.
  let c = r(s, 16, 12, 5, 6, AZUL) + r(s, 16, 12, 5, 1, CELESTE) + r(s, 18, 9, 2, 3, AMARILLO) + r(s, 19, 8, 1, 1, ROJO)
  c += r(s, 15, 10, 1, 8, GRIS)
  if (n === 3) {
    // Brilla: chispitas sobre el escritorio limpio.
    c += r(s, 6, 16, 1, 1, BLANCO) + r(s, 5, 17, 3, 1, BLANCO) + r(s, 11, 15, 1, 1, BLANCO) + r(s, 10, 16, 3, 1, BLANCO)
    return c + brazo(s, -1, 5, 16, camisa) + brazo(s, 1, 14, 16, camisa)
  }
  // Pasa el trapo de un lado al otro.
  const tx = 6 + n * 2
  c += r(s, tx, 17, 3, 1, CELESTE)
  return c + brazo(s, -1, 5, 16, camisa) + brazo(s, 1, tx + 1, 16, camisa)
}

function llaves(s: number, n: number, camisa: string): string {
  // Tablero de llaves de madera parado sobre el escritorio: tres ganchos con llaves de colores.
  let c = r(s, 4, 10, 9, 8, MADERA) + r(s, 5, 11, 7, 6, '#a8743f')
  const colores = [AMARILLO, ROJO, CELESTE]
  for (let i = 0; i < 3; i++) {
    c += r(s, 6 + i * 2, 12, 1, 1, GRIS_CLARO)
    // En el primer cuadro la llave del medio está en la mano (falta del gancho).
    if (!(n === 0 && i === 1)) c += r(s, 6 + i * 2, 13, 1, 2, colores[i]) + r(s, 6 + i * 2, 15, 1, 1, AMARILLO_OSCURO)
  }
  // Llavero grande en la mano derecha; en los cuadros 2 y 3 se balancea y suena.
  const lado = n === 0 ? 0 : n === 1 ? -1 : 1
  const kx = 16 + lado
  c += r(s, 15, 9, 3, 3, GRIS_CLARO) + r(s, 16, 10, 1, 1, PIEL)
  c += r(s, kx - 1, 12, 1, 3, AMARILLO) + r(s, kx + 1, 12, 1, 4, ROJO) + r(s, kx, 12, 1, 2, GRIS_CLARO) + r(s, kx + 1, 16, 1, 1, AMARILLO_OSCURO)
  if (n > 0) c += r(s, kx + 3, 11, 1, 1, AMARILLO) + r(s, kx - 3, 13, 1, 1, AMARILLO)
  return c + brazo(s, -1, 8, 14, camisa) + brazo(s, 1, 16, 10, camisa)
}

function escuadra(s: number, n: number, camisa: string): string {
  // Tablero de dibujo con plano blanco y una escuadra amarilla.
  let c = r(s, 4, 13, 13, 5, PLANO_LINEA) + r(s, 4, 13, 13, 1, PLANO) + r(s, 4, 17, 13, 1, PLANO)
  c += r(s, 5, 14, 1, 3, AMARILLO) + r(s, 5, 16, 4, 1, AMARILLO) + r(s, 6, 15, 1, 1, AMARILLO)
  if (n === 3) {
    // Mide: una cinta métrica estirada con marcas.
    c += r(s, 8, 12, 9, 1, AMARILLO)
    for (let x = 9; x < 17; x += 2) c += r(s, x, 12, 1, 1, NEGRO)
    return c + brazo(s, -1, 8, 12, camisa) + brazo(s, 1, 17, 12, camisa)
  }
  // Traza una línea que se alarga cuadro a cuadro.
  const largo = 2 + n * 3
  c += r(s, 7, 15, largo, 1, TINTA)
  const mx = 7 + largo
  c += r(s, mx, 13, 1, 2, NEGRO)
  return c + brazo(s, -1, 6, 15, camisa) + brazo(s, 1, mx, 14, camisa)
}

const DIBUJOS: Record<string, (s: number, n: number, camisa: string) => string> = {
  papeles,
  cuaderno,
  laptop,
  tablas,
  libros,
  pizarra,
  camaras,
  foco,
  carrito,
  llaves,
  escuadra,
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Fragmento SVG (sin `<svg>`) de un cuadro de una actividad, en unidades de la celda por `escala`.
 * Una actividad desconocida se dibuja como la genérica; el cuadro se toma módulo la cantidad de cuadros.
 * `camisa` pinta los brazos (el color del equipo).
 */
export function actividadSvg(nombre: string, cuadro: number, escala: number = 2, camisa?: string): string {
  const clave = Object.prototype.hasOwnProperty.call(DIBUJOS, nombre) ? nombre : ACTIVIDAD_GENERICA
  const total = ACTIVIDADES[clave].tiempos.length
  const n = Math.floor(Number(cuadro))
  const k = Number.isFinite(n) ? ((n % total) + total) % total : 0
  return DIBUJOS[clave](escalaEntera(escala), k, colorValido(camisa, '#8a93a0'))
}

/** Lo que la celda necesita para animar una actividad (ver `actividadParaCelda`). */
export type ActividadCelda = {
  nombre: string
  /** Un fragmento SVG por cuadro, con los brazos. */
  cuadros: string[]
  tiempos: number[]
  /** El primer cuadro sin brazos: los objetos solos, para cuando el oficinista se estira o explota. */
  sinBrazos: string
  libre: boolean
  texto: string
}

/** Todo lo que la celda necesita para animar una actividad: sus cuadros ya dibujados, sus tiempos y si deja libre el rincón. */
export function actividadParaCelda(nombre: string, escala: number = 2, camisa?: string): ActividadCelda {
  const clave = Object.prototype.hasOwnProperty.call(DIBUJOS, nombre) ? nombre : ACTIVIDAD_GENERICA
  const a = ACTIVIDADES[clave]
  const s = escalaEntera(escala)
  return {
    nombre: clave,
    cuadros: a.tiempos.map((_t, i) => actividadSvg(clave, i, s, camisa)),
    tiempos: a.tiempos.slice(),
    sinBrazos: DIBUJOS[clave](s, 0, ''),
    libre: a.libre,
    texto: a.texto,
  }
}
