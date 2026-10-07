// La escena de la skin «Terminal retro»: un monitor de los 80-90 con la pantalla de fósforo verde.
// Adentro viven el robot (robot-terminal.mjs) y los subagentes como íconos del color de su equipo.
// Afuera: el plástico beige, el patito de goma, el post-it, la luz de encendido y la marca.
// Más abajo: el teclado (reemplaza a la greca), el escritorio con la PC (reemplaza al pasillo)
// y el uso de la sesión al estilo `htop` (reemplaza al tablero de uso).

import { A, F, abrir, barrido, cadaTanto, caminos, cuadros, grilla, linea, mezcla, pon, rect, sello, texto, anchoTexto } from './pixel-terminal.mjs'
import { ALTO as R_ALTO, ANCHO as R_ANCHO, cuadrosDe } from './robot-terminal.mjs'

export const S = 3 // escala: cada unidad son 3 × 3 píxeles

// ---- Equipos: color (el acento que se permite) e ícono ----
export const EQUIPOS = {
  base: ['#8a93a0', 'caja de herramientas'],
  direccion: ['#d6a85c', 'brújula'],
  research: ['#5aa9e6', 'lupa'],
  librarian: ['#a78bd4', 'libro'],
  datos: ['#2cc6d0', 'barras'],
  'dev-a1': ['#f08a24', 'ventana de código'],
  'dev-tablero': ['#6d86ff', 'ventana de código'],
  seguridad: ['#ff5a4a', 'escudo con candado'],
  mantenimiento: ['#e6bf2e', 'engranaje'],
  limpieza: ['#9ac83a', 'escoba'],
  facilities: ['#e070a8', 'llave'],
  arquitectura: ['#c58a5c', 'compás'],
}

// X = color del equipo, x = oscuro, L = claro, k = negro de pantalla.
const ICONOS = {
  base: ['............', '....xxxx....', '...x....x...', '.XXXXXXXXXX.', 'XLLLLLLLLLLX', 'XLLLLLLLLLLX', 'XXXXXkkXXXXX', 'XxxxxkkxxxxX', 'XxxxxxxxxxxX', 'XxxxxxxxxxxX', 'XXXXXXXXXXXX'],
  direccion: ['.....XX.....', '.....LL.....', '....XLLX....', '....XLLX....', '.x..XLLX..x.', 'XXXXXLLXXXXX', 'XXXXXxxXXXXX', '.x..XxxX..x.', '....XxxX....', '....XxxX....', '.....xx.....', '.....XX.....'],
  research: ['..XXXX......', '.XLLLLX.....', 'XLkLLLLX....', 'XLLLLLLX....', 'XLLLLLLX....', '.XLLLLX.....', '..XXXXxx....', '......xxx...', '.......xxx..', '........xxx.', '.........xx.'],
  librarian: ['............', '.XXXX..XXXX.', 'XLLLLXXLLLLX', 'XLxxLXXLxxLX', 'XLLLLXXLLLLX', 'XLxxLXXLxxLX', 'XLLLLXXLLLLX', 'XLxLLXXLLxLX', 'XLLLLXXLLLLX', 'XXXXXXXXXXXX', '.....xx.....'],
  datos: ['..........LL', '..........XX', '......LL..XX', '......XX..XX', '..LL..XX..XX', '..XX..XX..XX', '..XX..XX..XX', '..XX..XX..XX', 'xxxxxxxxxxxx'],
  'dev-a1': ['XXXXXXXXXXXX', 'XLxLxxxxxxxX', 'XkkkkkkkkkkX', 'XkkLkkkkLkkX', 'XkLkkkkLkLkX', 'XLkkkkLkkkLX', 'XkLkkkLkkLkX', 'XkkLkkkkLkkX', 'XkkkkkkkkkkX', 'XXXXXXXXXXXX'],
  seguridad: ['XXXXXXXXXXXX', 'XLLLLLLLLLLX', 'XLLLLxxLLLLX', 'XLLLxLLxLLLX', 'XLLxxxxxxLLX', 'XLLxxkkxxLLX', '.XLxxkkxxLX.', '.XLxxxxxxLX.', '..XLLLLLLX..', '...XLLLLX...', '....XXXX....'],
  mantenimiento: ['.....XX.....', '..X.XXXX.X..', '...XXLLXX...', '..XXL..LXX..', '.XXL....LXX.', 'XXXL....LXXX', '.XXL....LXX.', '..XXL..LXX..', '...XXLLXX...', '..X.XXXX.X..', '.....XX.....'],
  limpieza: ['.........XX.', '........XX..', '.......XX...', '......XX....', '.....XX.....', '...xxxx.....', '..LLLLLL....', '.LLLLLLL....', 'LLLLLLL.....', 'L.L.L.L.....'],
  facilities: ['............', '.XXX........', 'XLLLX.......', 'XL.LXXXXXXXX', 'XLLLX..X.X.X', '.XXX...x.x..', '............'],
  arquitectura: ['.....XX.....', '.....LL.....', '....X..X....', '....X..X....', '...X....X...', '...X....X...', '..X......X..', '..X......X..', '.X........L.', '.X.........L', 'XX..........'],
}
ICONOS['dev-tablero'] = ICONOS['dev-a1']

function paletaEquipo(equipo) {
  const [c] = EQUIPOS[equipo] ?? EQUIPOS.base
  return { X: c, x: mezcla(c, '#000000', 0.45), L: mezcla(c, '#ffffff', 0.4), k: F.visor, 5: F.g5, 6: F.g6 }
}

// Un detalle propio de cada equipo mientras trabaja (cuadro 0 o 1).
function detalle(g, equipo, f, ox, oy) {
  const pal = paletaEquipo(equipo)
  if (equipo === 'datos') { rect(g, ox + 2, oy + 2 - f * 2, 2, 2 + f * 2, pal.X); rect(g, ox + 10, oy - f, 2, 1 + f, pal.L) }
  if (equipo.startsWith('dev')) { if (f === 1) rect(g, ox + 9, oy + 8, 2, 1, F.g6) }
  if (equipo === 'research') { pon(g, ox + 2 + f * 2, oy + 2, F.g6) }
  if (equipo === 'seguridad') { if (f === 1) { pon(g, ox + 5, oy + 5, A.rojo); pon(g, ox + 6, oy + 5, A.rojo) } }
  if (equipo === 'mantenimiento' && f === 1) { pon(g, ox + 2, oy + 1, null); rect(g, ox + 1, oy + 5, 1, 1, pal.L); pon(g, ox + 10, oy + 5, pal.L) }
  if (equipo === 'limpieza') { pon(g, ox + 8 + f, oy + 10, F.g4); pon(g, ox + 10 - f, oy + 9, F.g3) }
  if (equipo === 'librarian' && f === 1) rect(g, ox + 6, oy + 1, 1, 9, pal.L)
  if (equipo === 'facilities' && f === 1) { pon(g, ox + 11, oy + 5, pal.X); pon(g, ox + 9, oy + 5, pal.X) }
  if (equipo === 'direccion') { pon(g, ox + 5 + f, oy + 1, F.g6) }
  if (equipo === 'arquitectura') { pon(g, ox + 10 + f, oy + 8 + f, F.g6) }
}

// ---- Celda de un subagente: 22 × 24 unidades. Ícono arriba, etiqueta y estado abajo ----
export const CELDA_W = 22
export const CELDA_H = 24
const GIRO = ['|', '/', '-', '\\']

function celdaBase(equipo, etiqueta) {
  const g = grilla(CELDA_W, CELDA_H)
  const icono = ICONOS[equipo] ?? ICONOS.base
  const ox = Math.floor((CELDA_W - icono[0].length) / 2)
  const oy = 1 + Math.floor((12 - icono.length) / 2)
  sello(g, icono, paletaEquipo(equipo), ox, oy)
  const et = String(etiqueta).toUpperCase().slice(0, 5)
  texto(g, Math.floor((CELDA_W - anchoTexto(et)) / 2), 14, et, F.g5)
  return { g, ox, oy }
}

export function celdaCuadros(equipo, fase, etiqueta) {
  const { g: base, ox, oy } = celdaBase(equipo, etiqueta)
  const estado = (g, s, c) => texto(g, Math.floor((CELDA_W - anchoTexto(s)) / 2), 20, s, c)
  if (fase === 'juega') {
    return GIRO.map((ch, i) => {
      const g = base.map(f => [...f])
      detalle(g, equipo, i % 2, ox, oy)
      estado(g, `[${ch === '\\' ? '/' : ch}]`, F.g4)
      if (ch === '\\') { pon(g, 9, 20, null); pon(g, 9, 21, F.g4) }
      return [g, 0.15]
    })
  }
  if (fase === 'entra') {
    const lista = [3, 6, 9, 12, 24].map(h => {
      const g = grilla(CELDA_W, CELDA_H)
      for (let y = 0; y < Math.min(h, CELDA_H); y++) g[y] = [...base[y]]
      if (h < 14) rect(g, 1, h, CELDA_W - 2, 1, F.g6)
      return [g, 0.12]
    })
    lista[lista.length - 1][1] = 2
    return lista
  }
  if (fase === 'sale') {
    const ok = base.map(f => [...f]); estado(ok, '[OK]', F.g6)
    const linea1 = grilla(CELDA_W, CELDA_H); rect(linea1, 2, 6, 18, 1, F.g6); rect(linea1, 4, 5, 14, 1, F.g4); rect(linea1, 4, 7, 14, 1, F.g4)
    const linea2 = grilla(CELDA_W, CELDA_H); rect(linea2, 7, 6, 8, 1, F.g6)
    const punto = grilla(CELDA_W, CELDA_H); pon(punto, 10, 6, F.g6); pon(punto, 11, 6, F.g6)
    return [[ok, 0.8], [linea1, 0.12], [linea2, 0.12], [punto, 0.3], [grilla(CELDA_W, CELDA_H), 1.5]]
  }
  if (fase === 'explota') {
    const lista = []
    for (let k = 0; k < 4; k++) {
      const g = grilla(CELDA_W, CELDA_H)
      for (let y = 0; y < 13; y++) {
        const corre = ((y * 7 + k * 5) % 5) - 2
        for (let x = 0; x < CELDA_W; x++) if (base[y][x]) pon(g, x + corre * (k + 1), y, (y + k) % 3 === 0 ? A.rojo : base[y][x])
      }
      texto(g, 4, 14, 'ERR!', A.rojo)
      lista.push([g, 0.12])
    }
    const calavera = grilla(CELDA_W, CELDA_H)
    sello(calavera, ['..rrrrrr..', '.rrrrrrrr.', 'rr..rr..rr', 'rr..rr..rr', 'rrrrrrrrrr', '.rrr..rrr.', '..rrrrrr..', '..r.r.r...'], { r: A.rojo }, 6, 2)
    texto(calavera, 1, 14, 'SEGV', A.rojo)
    lista.push([calavera, 1.4])
    return lista
  }
  return [[base, 1]]
}

export function celdaSvg(equipo, fase, etiqueta, quieto = false) {
  return cuadros(celdaCuadros(equipo, fase, etiqueta), S, { quieto })
}

// Carpeta de un equipo (pantalla de Equipos): 22 × 17 unidades.
export function carpetaSvg(equipo, nombre, aviso = false) {
  const g = grilla(CELDA_W, 17)
  const pal = paletaEquipo(equipo)
  sello(g, ['XXXXX...........', 'XLLLLXXXXXXXXXXX', 'XLLLLLLLLLLLLLLX', 'XxxxxxxxxxxxxxxX', 'XLLLLLLLLLLLLLLX', 'XLLLLLLLLLLLLLLX', 'XLLLLLLLLLLLLLLX', 'XXXXXXXXXXXXXXXX'], pal, 3, 1)
  const icono = ICONOS[equipo] ?? ICONOS.base
  void icono
  if (aviso) sello(g, ['.y.', 'yyy', 'yYy'.replace('Y', 'k')], { y: A.ambar, k: F.visor }, 16, 0)
  const et = String(nombre).toUpperCase().slice(0, 5)
  texto(g, Math.floor((CELDA_W - anchoTexto(et)) / 2), 11, et, F.g5)
  return caminos(g, S)
}

// ---- El monitor ----
const PL = { luz: '#e6dcc2', base: '#d2c6a6', medio: '#bcae8a', sombra: '#9a8c69', osc: '#6c6149', linea: '#2e281d' }
const PATO = { y: '#ffd84a', Y: '#e0a92a', o: '#ff8a2a', k: '#1a1a1a', w: '#fff6c8' }
const POSTIT = { p: '#f6e05e', P: '#d9be3a', t: '#35408a' }

function plastico(g, x0, y0, w, h) {
  // Caja beige con luz arriba a la izquierda y esquinas redondeadas.
  rect(g, x0, y0, w, h, PL.base)
  rect(g, x0, y0, w, 1, PL.luz); rect(g, x0, y0, 1, h, PL.luz)
  rect(g, x0, y0 + h - 1, w, 1, PL.sombra); rect(g, x0 + w - 1, y0, 1, h, PL.sombra)
  for (const [x, y] of [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]]) pon(g, x, y, null)
}

// Texto que parpadea en Morse: el cursor dice «HOLA» (.... --- .-.. .-).
function cursorMorse(x, y, quieto) {
  const r = `<rect x="${x * S}" y="${y * S}" width="${3 * S}" height="${5 * S}" fill="${F.g5}"`
  if (quieto) return `${r}/>`
  const morse = ['....', '---', '.-..', '.-']
  const pasos = [] // [encendido, segundos]
  morse.forEach((letra, i) => {
    ;[...letra].forEach((s, j) => { pasos.push([1, s === '.' ? 0.18 : 0.54]); if (j < letra.length - 1) pasos.push([0, 0.18]) })
    pasos.push([0, i < morse.length - 1 ? 0.54 : 2.2])
  })
  const total = pasos.reduce((a, p) => a + p[1], 0)
  let t = 0
  const tiempos = [], valores = []
  for (const [on, d] of pasos) { tiempos.push((t / total).toFixed(4)); valores.push(on ? 1 : 0); t += d }
  return `${r} opacity="1"><animate attributeName="opacity" calcMode="discrete" values="${valores.join(';')}" keyTimes="${tiempos.join(';')}" dur="${total.toFixed(2)}s" repeatCount="indefinite"/></rect>`
}

// Huevos de pascua que cruzan la pantalla.
function bicho(ancho, y) {
  const g = grilla(5, 3)
  sello(g, ['4.4.4', '.555.', '4.4.4'], { 4: F.g4, 5: F.g5 }, 0, 0)
  return `<g>${caminos(g, S)}<animateTransform attributeName="transform" type="translate" from="${-6 * S} ${y * S}" to="${ancho * S} ${y * S}" dur="9s" repeatCount="indefinite"/></g>`
}
function conejo(ancho, y) {
  const a = grilla(7, 6), b = grilla(7, 6)
  sello(a, ['.w.w...', '.w.w...', '.www...', 'wwwww..', '.wwwwww', '.w...w.'], { w: A.blanco }, 0, 0)
  sello(b, ['..w.w..', '..w.w..', '.www...', 'wwwwww.', 'wwwwwww', '.......'], { w: A.blanco }, 0, 0)
  const saltos = `<animateTransform attributeName="transform" type="translate" values="${Array.from({ length: 9 }, (_, i) => `${(-8 + i * (ancho + 8) / 8) * S} ${(y - (i % 2) * 3) * S}`).join(';')}" dur="5s" repeatCount="indefinite"/>`
  return `<g>${cuadros([[a, 0.3], [b, 0.3]], S)}${saltos}</g>`
}
function lluviaMatrix(w, h) {
  const g = grilla(w, h)
  for (let x = 2; x < w; x += 4) {
    const largo = 6 + ((x * 13) % 14), y0 = (x * 7) % h
    for (let k = 0; k < largo; k++) {
      const y = (y0 + k * 2) % h
      texto(g, x - 1, y, '01'[(x + k) % 2], k === largo - 1 ? F.g6 : k > largo - 4 ? F.g5 : F.g2)
    }
  }
  return caminos(g, S)
}

// o: { ancho, emocion, progreso, celdas: [{ equipo, fase, etiqueta }], prompt, hora, estado, quieto, apagado, huevos, extraPantalla }
export function monitorSvg(o) {
  const W = Math.floor((o.ancho ?? 378) / S)
  const quieto = !!o.quieto
  const celdas = o.celdas ?? []
  const pantallaX = 5
  const pantallaW = W - 10
  const zonaX = R_ANCHO + 3
  const porFila = Math.max(1, Math.floor((pantallaW - zonaX - 1) / CELDA_W))
  const filas = Math.max(1, Math.ceil((o.carpetas ? o.carpetas.length : celdas.length) / porFila))
  const alturaZona = o.lineas ? Math.max(R_ALTO, o.lineas.length * 7 + 2) : Math.max(R_ALTO, filas * (o.carpetas ? 17 : CELDA_H))
  const pantallaH = 9 + alturaZona + 2 + 8
  const pantallaY = 15
  const cajaY = 8
  const cajaH = 7 + pantallaH + 15
  const H = cajaY + cajaH + 6
  const g = grilla(W, H)

  // Caja, bisel interior hundido y pantalla con las esquinas curvas del tubo.
  plastico(g, 0, cajaY, W, cajaH)
  rect(g, 1, cajaY + 1, W - 2, 2, PL.luz)
  rect(g, pantallaX - 2, pantallaY - 2, pantallaW + 4, pantallaH + 4, PL.sombra)
  rect(g, pantallaX - 1, pantallaY - 1, pantallaW + 2, pantallaH + 2, PL.osc)
  rect(g, pantallaX - 2, pantallaY + pantallaH + 1, pantallaW + 4, 1, PL.luz)
  rect(g, pantallaX, pantallaY, pantallaW, pantallaH, o.apagado ? '#010402' : F.negro)
  for (const [cx, cy, sx, sy] of [[pantallaX, pantallaY, 1, 1], [pantallaX + pantallaW - 1, pantallaY, -1, 1], [pantallaX, pantallaY + pantallaH - 1, 1, -1], [pantallaX + pantallaW - 1, pantallaY + pantallaH - 1, -1, -1]]) {
    pon(g, cx, cy, PL.osc); pon(g, cx + sx, cy, PL.osc); pon(g, cx, cy + sy, PL.osc)
  }
  // Reflejo del vidrio (arriba a la izquierda).
  if (!o.apagado) for (let i = 0; i < 14; i++) { pon(g, pantallaX + 3 + i, pantallaY + 16 - i, F.g0); pon(g, pantallaX + 4 + i, pantallaY + 16 - i, F.g0) }
  // Ventilación arriba.
  for (let x = 30; x < W - 30; x += 3) pon(g, x, cajaY + 4, PL.sombra)

  // Marca, luz y perillas en el bisel de abajo.
  const by = pantallaY + pantallaH + 4
  rect(g, 8, by, 55, 9, '#2c2a26'); rect(g, 8, by, 55, 1, '#4a4740')
  texto(g, 10, by + 2, 'TERMINAL 9000', '#d8d2c0')
  rect(g, W - 30, by + 2, 6, 6, PL.sombra); rect(g, W - 29, by + 3, 4, 4, PL.medio); pon(g, W - 28, by + 3, PL.luz)
  rect(g, W - 21, by + 2, 6, 6, PL.sombra); rect(g, W - 20, by + 3, 4, 4, PL.medio); pon(g, W - 19, by + 3, PL.luz)
  rect(g, W - 12, by + 3, 4, 3, '#1a1a1a')
  const luz = o.apagado ? A.ambar : F.g5
  rect(g, W - 11, by + 4, 2, 1, luz)
  // Pie del monitor.
  rect(g, Math.floor(W / 2) - 14, cajaY + cajaH, 28, 3, PL.medio)
  rect(g, Math.floor(W / 2) - 14, cajaY + cajaH, 28, 1, PL.sombra)
  plastico(g, Math.floor(W / 2) - 24, cajaY + cajaH + 3, 48, 3)

  // Post-it pegado en el bisel de abajo, con la clave de siempre.
  const px = 66, py = by - 2
  rect(g, px, py, 22, 13, POSTIT.p); rect(g, px, py + 12, 22, 1, POSTIT.P); rect(g, px + 20, py, 2, 1, POSTIT.P); pon(g, px + 21, py, null)
  texto(g, px + 2, py + 1, 'CLAVE', POSTIT.t); texto(g, px + 4, py + 7, '1234', POSTIT.t)

  // Patito de goma arriba del monitor (para el rubber duck debugging).
  sello(g, ['...yyy....', '..yyyyy...', '..ykyyyoo.', '..yyyyyo..', 'Yyyyyyyy..', 'yyyyyyyyy.', '.YyyyyyyY.', '..YYYYYY..'], PATO, W - 22, 0)

  // ---- Lo que está en la pantalla ----
  const capa = grilla(W, H)
  const sx = pantallaX + 3, sy = pantallaY + 2
  if (!o.apagado) {
    texto(capa, sx, sy, o.prompt ?? '$ ./OFICINA', F.g5)
    texto(capa, pantallaX + pantallaW - 3 - anchoTexto(o.hora ?? '14:32'), sy, o.hora ?? '14:32', F.g4)
    // Barra de estado (como tmux): fondo verde y letras negras.
    const ey = pantallaY + pantallaH - 8
    rect(capa, pantallaX + 1, ey, pantallaW - 2, 7, F.g3)
    texto(capa, pantallaX + 3, ey + 1, o.estado ?? '[3 AG] [58%] T-9', F.visor)
    // Fantasma de pantalla quemada.
    texto(capa, pantallaX + pantallaW - 26, pantallaY + 12, 'READY.', '#031009')
  } else {
    const ey = pantallaY + pantallaH - 8
    texto(capa, sx, ey, '18:00 FIN DEL TURNO', F.g1)
  }

  let cuerpo = caminos(g, S) + caminos(capa, S)
  // El robot.
  const robot = cuadros(cuadrosDe(o.emocion ?? 'aburrido', o.progreso ?? 58), S, { quieto, vacio: F.negro })
  cuerpo += `<g transform="translate(${(pantallaX + 1) * S} ${(pantallaY + 8) * S})">${robot}</g>`
  // Los subagentes.
  celdas.forEach((c, i) => {
    const cx = pantallaX + zonaX + (i % porFila) * CELDA_W
    const cy = pantallaY + 9 + Math.floor(i / porFila) * CELDA_H
    cuerpo += `<g transform="translate(${cx * S} ${cy * S})">${celdaSvg(c.equipo, c.fase, c.etiqueta, quieto)}</g>`
  })
  // Equipos: una carpeta por equipo, del color del equipo (como un `ls` con colores).
  ;(o.carpetas ?? []).forEach((eq, i) => {
    const cx = pantallaX + zonaX + (i % porFila) * CELDA_W
    const cy = pantallaY + 9 + Math.floor(i / porFila) * 17
    cuerpo += `<g transform="translate(${cx * S} ${cy * S})">${carpetaSvg(eq.equipo, eq.nombre, eq.aviso)}</g>`
  })
  // Editar: el archivo del agente abierto en el editor, con números de línea.
  if (o.lineas) {
    const ed = grilla(pantallaW - zonaX - 2, o.lineas.length * 7 + 2)
    o.lineas.forEach((l, i) => {
      texto(ed, 0, i * 7, String(i + 1).padStart(2, ' '), F.g2)
      const color = l.startsWith('#') ? F.g6 : l.startsWith('-') ? F.g3 : l.includes(':') ? F.g5 : F.g4
      texto(ed, 10, i * 7, l.slice(0, 13), color)
    })
    cuerpo += `<g transform="translate(${(pantallaX + zonaX) * S} ${(pantallaY + 9) * S})">${caminos(ed, S)}</g>`
  }
  if (!o.apagado && celdas.length === 0 && !o.carpetas && !o.lineas) {
    const cx = pantallaX + zonaX + 2, cy = pantallaY + 18
    const libre = grilla(60, 14)
    texto(libre, 0, 0, 'SIN PROCESOS.', F.g4)
    texto(libre, 0, 8, 'ESPERANDO...', F.g3)
    cuerpo += `<g transform="translate(${cx * S} ${cy * S})">${caminos(libre, S)}</g>`
  }
  if (!o.apagado) cuerpo += cursorMorse(sx + anchoTexto(o.prompt ?? '$ ./OFICINA') + 2, sy, quieto)

  // Huevos de pascua (solo con animación).
  if (!quieto && o.huevos !== false && !o.apagado) {
    const enPantalla = s => `<svg x="${pantallaX * S}" y="${pantallaY * S}" width="${pantallaW * S}" height="${pantallaH * S}" overflow="hidden">${s}</svg>`
    cuerpo += enPantalla(cadaTanto(bicho(pantallaW, pantallaH - 13), 37, 9, 4))
    cuerpo += enPantalla(cadaTanto(conejo(pantallaW, pantallaH - 15), 89, 5, 20))
    cuerpo += enPantalla(cadaTanto(lluviaMatrix(pantallaW, pantallaH - 9), 61, 1.6, 30))
    // El patito dice «CUAC» cada tanto.
    const cuac = grilla(22, 7)
    rect(cuac, 0, 0, 22, 7, '#fffbe6'); texto(cuac, 2, 1, 'CUAC', '#1a1a1a')
    cuerpo += cadaTanto(`<g transform="translate(${(W - 46) * S} 0)">${caminos(cuac, S)}</g>`, 23, 1.2, 11)
  }
  // Barrido del CRT y un parpadeo leve.
  const vidrio = barrido(pantallaW * S, pantallaH * S, { quieto })
  cuerpo += `<svg x="${pantallaX * S}" y="${pantallaY * S}" width="${pantallaW * S}" height="${pantallaH * S}">${vidrio}${quieto ? '' : `<rect width="100%" height="100%" fill="${F.g5}" opacity="0"><animate attributeName="opacity" values="0;0.035;0;0;0.02;0" keyTimes="0;0.02;0.04;0.7;0.71;1" dur="5.3s" repeatCount="indefinite"/></rect>`}</svg>`
  return abrir(W * S, H * S, cuerpo, o.alt ?? 'Monitor de terminal verde con el robot')
}

// ---- Teclado: la franja que reemplaza a la greca. Las teclas se hunden cuando hay agentes tipeando ----
export function tecladoSvg(ancho, opts = {}) {
  const W = Math.floor(ancho / S), H = 12
  const base = grilla(W, H)
  plastico(base, 0, 0, W, H)
  const teclas = []
  for (let fila = 0; fila < 2; fila++) {
    const off = fila === 0 ? 2 : 4
    for (let x = off; x + 6 <= W - 2; x += 7) teclas.push([x, 2 + fila * 5])
  }
  const tecla = (g, x, y, hundida) => {
    rect(g, x, y, 6, 4, hundida ? PL.sombra : PL.luz)
    rect(g, x, y + 3, 6, 1, PL.osc); rect(g, x + 5, y, 1, 4, PL.medio)
    if (!hundida) rect(g, x + 1, y + 1, 4, 2, PL.base)
  }
  teclas.forEach(([x, y]) => tecla(base, x, y, false))
  // Letras en algunas teclas.
  const letras = 'QWERTYUIOPASDFGHJKL'
  teclas.forEach(([x, y], i) => pon(base, x + 2, y + 1, i % 3 === 0 ? PL.osc : null))
  void letras
  if (opts.quieto || !opts.tipeando) return abrir(W * S, H * S, caminos(base, S), 'Teclado')
  const lista = [0, 1, 2, 3].map(f => {
    const g = base.map(r => [...r])
    teclas.forEach(([x, y], i) => { if ((i * 7 + f * 5) % 11 < 2) tecla(g, x, y, true) })
    return [g, 0.12]
  })
  return abrir(W * S, H * S, cuadros(lista, S, { vacio: null }), 'Teclado: las teclas se hunden mientras los agentes tipean')
}

// ---- Escritorio con la PC (reemplaza al pasillo) ----
export function escritorioSvg(ancho, opts = {}) {
  const W = Math.floor(ancho / S), H = 32, mesa = 22
  const g = grilla(W, H)
  const madera = '#3a2b1e', maderaLuz = '#57422d', maderaOsc = '#261b12'
  rect(g, 0, mesa, W, H - mesa, madera)
  rect(g, 0, mesa, W, 1, maderaLuz); rect(g, 0, mesa + 3, W, 1, maderaOsc)
  for (let x = 3; x < W; x += 11) { pon(g, x, mesa + 6, maderaOsc); pon(g, x + 4, mesa + 8, maderaOsc) }
  // La PC: gabinete beige con dos disqueteras, botón TURBO y luz del disco.
  const px = W - 38
  plastico(g, px, 0, 34, mesa)
  for (const y of [3, 8]) { rect(g, px + 3, y, 20, 3, PL.medio); rect(g, px + 4, y + 1, 18, 1, PL.linea); rect(g, px + 19, y + 2, 3, 1, PL.sombra) }
  rect(g, px + 26, 3, 5, 3, '#2c2a26')
  texto(g, px + 3, 14, 'TURBO', PL.osc)
  rect(g, px + 25, 14, 6, 5, PL.sombra); rect(g, px + 26, 15, 4, 3, PL.medio)
  const luces = grilla(W, H)
  rect(luces, px + 27, 4, 2, 1, opts.quieto ? F.g2 : F.g5) // TURBO prendido = con animación
  // Disquetes apilados.
  ;[['#26262e', '#f4f0e0'], ['#5a2a2a', '#f4f0e0'], ['#2a3a5a', '#f4f0e0']].forEach(([c, e], i) => {
    rect(g, 3 + i, mesa - 3 - i * 3, 16, 3, c); rect(g, 6 + i, mesa - 2 - i * 3, 8, 1, e)
  })
  texto(g, 4, mesa - 15, 'BACKUP', '#a8a08a')
  // Mate con bombilla y el termo.
  sello(g, ['.ccc.', 'aaaaa', 'abbba', 'abbba', 'abbba', '.aaa.'], { a: '#8a5a32', b: '#b07a48', c: '#5aa03a' }, 26, mesa - 6)
  linea(g, 29, mesa - 10, 28, mesa - 6, '#d8d8d8')
  sello(g, ['.d.', 'ddd', 'dDd', 'dDd', 'dDd', 'dDd', 'dDd', 'dDd', 'ddd'], { d: '#c9c9c9', D: '#8f8f8f' }, 33, mesa - 9)
  // Taza con «C:>».
  sello(g, ['eeeeee.', 'effffee', 'effffe.e', 'effffee', '.eeee..'], { e: '#e8e4d8', f: '#f6f3ea' }, 40, mesa - 5)
  pon(g, 42, mesa - 3, '#2a2a2a'); pon(g, 43, mesa - 3, '#2a2a2a')
  // Mouse con cable hasta la PC.
  sello(g, ['.ddd.', 'ddddd', 'dnddd', 'ddddd', '.ddd.'], { d: PL.base, n: PL.sombra }, 54, mesa - 5)
  linea(g, 56, mesa - 5, 60, mesa - 9, '#4a4a4a'); linea(g, 60, mesa - 9, px - 1, mesa - 9, '#4a4a4a')
  // Cubo mágico (huevo de pascua: armado).
  sello(g, ['rrgg', 'rrgg', 'bbyy', 'bbyy'], { r: '#d04a3c', g: '#3aa04a', b: '#3a6ad0', y: '#e6bf2e' }, 66, mesa - 4)
  let cuerpo = caminos(g, S) + caminos(luces, S)
  const hdd = grilla(W, H); rect(hdd, px + 27, 16, 2, 1, A.ambar)
  cuerpo += opts.quieto ? caminos(hdd, S) : `<g>${caminos(hdd, S)}<animate attributeName="opacity" calcMode="discrete" values="1;0;1;1;0;0;1;0" dur="1.7s" repeatCount="indefinite"/></g>`
  return abrir(W * S, H * S, cuerpo, 'Escritorio: la PC con el botón TURBO, disquetes, un mate con termo, la taza y el mouse')
}

// ---- Uso de la sesión al estilo htop ----
export function usoSvg(ancho, d, opts = {}) {
  const W = Math.floor(ancho / S)
  const filas = [
    ['CTX', d.contexto],
    ['5H', d.cincoHoras],
    ['SEM', d.semana],
  ]
  const H = 8 + filas.length * 7 + 22
  const g = grilla(W, H)
  rect(g, 0, 0, W, H, F.negro)
  texto(g, 2, 2, 'HTOP  USO DE LA SESION', F.g5)
  filas.forEach(([et, pct], i) => {
    const y = 9 + i * 7
    texto(g, 2, y, et, F.g4)
    const bx = 16, bw = W - bx - 22
    texto(g, bx, y, '[', F.g3); texto(g, bx + bw, y, ']', F.g3)
    const color = pct >= 80 ? A.rojo : pct >= 50 ? A.ambar : F.g5
    const lleno = Math.round((bw - 5) * pct / 100)
    for (let x = 0; x < bw - 5; x += 2) rect(g, bx + 4 + x, y, 1, 5, x < lleno ? color : F.g1)
    texto(g, W - 18, y, `${pct}%`.padStart(4, ' '), color)
  })
  const y2 = 9 + filas.length * 7 + 1
  texto(g, 2, y2, `TOK ${d.tokens}`, F.g5)
  texto(g, 50, y2, `$ ${d.costo}`, F.g5)
  texto(g, 2, y2 + 7, `UPTIME ${d.uptime}   LOAD ${d.carga}`, F.g3)
  return abrir(W * S, H * S, caminos(g, S) + barrido(W * S, H * S, { quieto: true }), 'Uso de la sesión: contexto, 5 horas y semana, como en htop')
}
