// Lo que rodea al monitor en la skin «Terminal retro»: el teclado (reemplaza a la greca), el escritorio con la PC
// (reemplaza al pasillo), el borde de la mesa (reemplaza a la cornisa) y la caja de disquetes de Equipos
// (reemplaza al estante). Funciones puras que devuelven SVG. Viene de mod/preview/escena-terminal.mjs.

import { A, F, abrir, caminos, cuadros, grilla, linea, pon, rect, sello, texto } from './arte-fosforo'
import type { Cuadro, Grilla } from './arte-fosforo'

const S = 3
const PL = { luz: '#e6dcc2', base: '#d2c6a6', medio: '#bcae8a', sombra: '#9a8c69', osc: '#6c6149', linea: '#2e281d' }
const MADERA = { base: '#3a2b1e', luz: '#57422d', osc: '#261b12' }

const ancho = (px: number): number => Math.max(40, Math.floor((Number.isFinite(px) ? Math.max(200, Math.min(1200, px)) : 378) / S))

function plastico(g: Grilla, x0: number, y0: number, w: number, h: number): void {
  rect(g, x0, y0, w, h, PL.base)
  rect(g, x0, y0, w, 1, PL.luz)
  rect(g, x0, y0, 1, h, PL.luz)
  rect(g, x0, y0 + h - 1, w, 1, PL.sombra)
  rect(g, x0 + w - 1, y0, 1, h, PL.sombra)
  for (const [x, y] of [[x0, y0], [x0 + w - 1, y0], [x0, y0 + h - 1], [x0 + w - 1, y0 + h - 1]]) g[y][x] = null
}

/** El teclado beige. Con `tipeando`, las teclas se hunden (hay agentes trabajando). */
export function tecladoSvg(anchoPx: number, opts?: { tipeando?: boolean; quieto?: boolean }): string {
  const W = ancho(anchoPx)
  const H = 12
  const base = grilla(W, H)
  plastico(base, 0, 0, W, H)
  const teclas: Array<[number, number]> = []
  for (let fila = 0; fila < 2; fila++) for (let x = fila === 0 ? 2 : 4; x + 6 <= W - 2; x += 7) teclas.push([x, 2 + fila * 5])
  const tecla = (g: Grilla, x: number, y: number, hundida: boolean) => {
    rect(g, x, y, 6, 4, hundida ? PL.sombra : PL.luz)
    rect(g, x, y + 3, 6, 1, PL.osc)
    rect(g, x + 5, y, 1, 4, PL.medio)
    if (!hundida) rect(g, x + 1, y + 1, 4, 2, PL.base)
  }
  teclas.forEach(([x, y], i) => {
    tecla(base, x, y, false)
    if (i % 3 === 0) pon(base, x + 2, y + 1, PL.osc)
  })
  if (opts?.quieto === true || opts?.tipeando !== true) return abrir(W * S, H * S, caminos(base, S), 'Teclado')
  const lista: Cuadro[] = [0, 1, 2, 3].map(f => {
    const g = base.map(r => [...r])
    teclas.forEach(([x, y], i) => {
      if ((i * 7 + f * 5) % 11 < 2) tecla(g, x, y, true)
    })
    return [g, 0.12]
  })
  return abrir(W * S, H * S, cuadros(lista, S, { vacio: PL.base }), 'Teclado: las teclas se hunden mientras los agentes tipean')
}

/** El escritorio: la PC con el botón TURBO y la luz del disco, disquetes, mate con termo, taza, mouse y un cubo mágico. */
export function escritorioSvg(anchoPx: number, altoPx: number, opts?: { quieto?: boolean; activo?: boolean }): string {
  const W = ancho(anchoPx)
  const H = Math.max(24, Math.min(60, Math.round((Number.isFinite(altoPx) ? altoPx : 96) / S)))
  const mesa = H - 10
  const g = grilla(W, H)
  rect(g, 0, mesa, W, H - mesa, MADERA.base)
  rect(g, 0, mesa, W, 1, MADERA.luz)
  rect(g, 0, mesa + 3, W, 1, MADERA.osc)
  for (let x = 3; x < W; x += 11) {
    pon(g, x, mesa + 6, MADERA.osc)
    pon(g, x + 4, mesa + 8, MADERA.osc)
  }
  // La PC.
  const pcH = Math.min(22, mesa)
  const px = W - 38
  const py = mesa - pcH
  plastico(g, px, py, 34, pcH)
  for (const y of [3, 8]) {
    if (py + y + 3 > mesa) continue
    rect(g, px + 3, py + y, 20, 3, PL.medio)
    rect(g, px + 4, py + y + 1, 18, 1, PL.linea)
    rect(g, px + 19, py + y + 2, 3, 1, PL.sombra)
  }
  rect(g, px + 26, py + 3, 5, 3, '#2c2a26')
  if (pcH >= 20) {
    texto(g, px + 3, py + 14, 'TURBO', PL.osc)
    rect(g, px + 25, py + 14, 6, 5, PL.sombra)
    rect(g, px + 26, py + 15, 4, 3, PL.medio)
  }
  rect(g, px + 27, py + 4, 2, 1, opts?.quieto === true ? F.g2 : F.g5) // TURBO: prendido con animación
  // Disquetes apilados.
  ;[['#26262e', '#f4f0e0'], ['#5a2a2a', '#f4f0e0'], ['#2a3a5a', '#f4f0e0']].forEach(([c, e], i) => {
    rect(g, 3 + i, mesa - 3 - i * 3, 16, 3, c)
    rect(g, 6 + i, mesa - 2 - i * 3, 8, 1, e)
  })
  if (mesa >= 16) texto(g, 4, mesa - 15, 'BACKUP', '#a8a08a')
  // Mate con bombilla y el termo.
  sello(g, ['.ccc.', 'aaaaa', 'abbba', 'abbba', 'abbba', '.aaa.'], { a: '#8a5a32', b: '#b07a48', c: '#5aa03a' }, 26, mesa - 6)
  linea(g, 29, mesa - 10, 28, mesa - 6, '#d8d8d8')
  sello(g, ['.d.', 'ddd', 'dDd', 'dDd', 'dDd', 'dDd', 'dDd', 'dDd', 'ddd'], { d: '#c9c9c9', D: '#8f8f8f' }, 33, mesa - 9)
  // Taza.
  sello(g, ['eeeeee.', 'effffee', 'effffe.e', 'effffee', '.eeee..'], { e: '#e8e4d8', f: '#f6f3ea' }, 40, mesa - 5)
  // Mouse con el cable hasta la PC.
  sello(g, ['.ddd.', 'ddddd', 'dnddd', 'ddddd', '.ddd.'], { d: PL.base, n: PL.sombra }, 54, mesa - 5)
  linea(g, 56, mesa - 5, 60, mesa - 9, '#4a4a4a')
  linea(g, 60, mesa - 9, px - 1, mesa - 9, '#4a4a4a')
  // Cubo mágico: armado, siempre armado.
  sello(g, ['rrgg', 'rrgg', 'bbyy', 'bbyy'], { r: '#d04a3c', g: '#3aa04a', b: '#3a6ad0', y: '#e6bf2e' }, 66, mesa - 4)
  let cuerpo = caminos(g, S)
  const hdd = grilla(W, H)
  if (pcH >= 20) rect(hdd, px + 27, py + 16, 2, 1, A.ambar)
  const titila = opts?.quieto !== true && opts?.activo === true
  cuerpo += titila ? `<g>${caminos(hdd, S)}<animate attributeName="opacity" calcMode="discrete" values="1;0;1;1;0;0;1;0" dur="1.7s" repeatCount="indefinite"/></g>` : caminos(hdd, S)
  return abrir(W * S, H * S, cuerpo, 'Escritorio con la PC, disquetes, un mate con termo, la taza y el mouse')
}

/** El borde de la mesa: cierra el panel abajo. */
export function bordeMesaSvg(anchoPx: number): string {
  const W = ancho(anchoPx)
  const g = grilla(W, 4)
  rect(g, 0, 0, W, 4, MADERA.osc)
  rect(g, 0, 0, W, 1, MADERA.luz)
  for (let x = 5; x < W; x += 17) pon(g, x, 2, MADERA.base)
  return abrir(W * S, 4 * S, caminos(g, S), 'Borde del escritorio')
}

/** Caja de disquetes de Equipos: uno por equipo, con la etiqueta del color del equipo. */
export function disquetesSvg(anchoPx: number, colores: string[]): string {
  const W = ancho(anchoPx)
  const H = 16
  const g = grilla(W, H)
  rect(g, 0, H - 3, W, 3, MADERA.base)
  rect(g, 0, H - 3, W, 1, MADERA.luz)
  const caja = Math.min(W - 4, 6 + colores.length * 6)
  rect(g, 2, 3, caja, H - 6, '#2a2a2a')
  rect(g, 2, 3, caja, 1, '#4a4a4a')
  colores.slice(0, Math.floor((caja - 4) / 6)).forEach((c, i) => {
    const x = 5 + i * 6
    rect(g, x, 1, 5, 9, '#1e1e24')
    rect(g, x + 1, 1, 3, 3, /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#8a93a0')
  })
  texto(g, caja + 6, 5, 'DISQUETES', F.g4)
  return abrir(W * S, H * S, caminos(g, S), 'Caja de disquetes, uno por equipo')
}
