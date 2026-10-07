// Franjas y pie de la skin «Piratas»: la soga trenzada (en vez de la greca), la bodega del barco (en vez del
// pasillo de la oficina), el lecho de arena que cierra el panel (en vez de la cornisa) y la repisa con
// botellas y mapas (en vez del estante con carpetas).
// En la bodega hay barriles, cajas, rollos de soga, balas de cañón, un cañón y faroles que titilan; con alto
// de sobra, una hamaca con un pirata que ronca. Huevos de pascua: una rata que cruza cada tanto y un
// fantasma pirata que se asoma por la pared.
// Funciones puras que devuelven strings SVG. Sin imports y solo sintaxis «borrable». Solo SMIL.

const C = {
  contorno: '#140c1c',
  tabla1: '#3a2416',
  tabla2: '#452b1a',
  junta: '#24150d',
  viga: '#2a1910',
  vigaLuz: '#5e3a22',
  piso: '#5e3a22',
  pisoLuz: '#74492a',
  madera: '#8a5a32',
  maderaOsc: '#5e3a22',
  maderaLuz: '#a8743f',
  caja: '#9c6a3a',
  hierro: '#4a4a58',
  hierroLuz: '#7a7a8a',
  soga: '#d9c7a0',
  sogaOsc: '#9c8763',
  oro: '#f2b632',
  oroLuz: '#fff3a8',
  arena: '#c9a35a',
  arenaLuz: '#e0bd73',
  arenaOsc: '#a8823f',
}

function escalaEntera(e: unknown): number {
  const n = Number(e)
  return Math.max(1, Math.min(8, Math.round(Number.isFinite(n) ? n : 2)))
}
function anchoEntero(a: unknown): number {
  const n = Math.floor(Number(a))
  return Math.max(8, Math.min(2000, Number.isFinite(n) ? n : 120))
}
function abrirSvg(w: number, h: number, cuerpo: string, alt: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${alt}">${cuerpo}</svg>`
}

// Lienzo por color: junta rectángulos en un path por color, en el orden en que aparece cada color.
function lienzo(s: number) {
  const por = new Map<string, string>()
  return {
    r(x: number, y: number, w: number, h: number, c: string) {
      if (w <= 0 || h <= 0) return
      por.set(c, (por.get(c) ?? '') + `M${x * s} ${y * s}h${w * s}v${h * s}h${-w * s}z`)
    },
    filas(x0: number, y0: number, filas: string[], mapa: Record<string, string>) {
      filas.forEach((f, j) => {
        let x = 0
        while (x < f.length) {
          const c = mapa[f[x]]
          if (!c) {
            x++
            continue
          }
          let x2 = x
          while (x2 + 1 < f.length && f[x2 + 1] === f[x]) x2++
          this.r(x0 + x, y0 + j, x2 - x + 1, 1, c)
          x = x2 + 1
        }
      })
    },
    svg(): string {
      return [...por.entries()].map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join('')
    },
  }
}

// ---- Soga trenzada (debajo de la burbuja) ----

export function sogaSvg(anchoPx: number, altoPx: number = 6): string {
  const w = anchoEntero(anchoPx)
  const h = Math.max(4, Math.min(16, Math.round(Number(altoPx) || 6)))
  let claro = ''
  let oscuro = ''
  for (let x = -h; x < w + h; x += 4) {
    claro += `M${x} ${h}l${h} ${-h}h2l${-h} ${h}z`
    oscuro += `M${x + 2} ${h}l${h} ${-h}h1l${-h} ${h}z`
  }
  const cuerpo = `<rect width="${w}" height="${h}" fill="${C.sogaOsc}"/><path fill="${C.soga}" d="${claro}"/><path fill="#6b5a3e" d="${oscuro}"/>` +
    `<rect width="${w}" height="1" fill="${C.junta}"/><rect y="${h - 1}" width="${w}" height="1" fill="${C.junta}"/>`
  return abrirSvg(w, h, cuerpo, 'soga trenzada')
}

// ---- Lecho de arena (cierra el panel) ----

export function lechoSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  l.r(0, 0, u, 8, C.arena)
  for (let x = 0; x < u; x++) {
    const onda = Math.round(Math.sin(x / 6) * 1.2)
    if (onda > 0) l.r(x, 0, 1, onda, '#0c305c')
    l.r(x, Math.max(0, onda), 1, 1, C.arenaLuz)
  }
  l.r(0, 6, u, 2, C.arenaOsc)
  // Caracoles y piedritas cada tanto.
  for (let x = 7; x < u - 2; x += 23) {
    l.r(x, 4, 2, 1, '#fff0e0')
    l.r(x, 3, 1, 1, '#ffb3c8')
    l.r(x + 11, 5, 1, 1, '#6a5a4a')
  }
  return abrirSvg(w, 8 * s, l.svg(), 'lecho de arena')
}

// ---- Repisa con botellas y mapas (en Equipos) ----

export function repisaSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const l = lienzo(s)
  const botellas = ['#2f8a6a', '#7a4a1e', '#2f5aa0', '#8a2a20']
  let x = 1
  for (let i = 0; x < u - 6; i++) {
    const tipo = (i * 5 + (i >> 2)) % 4
    if (tipo === 0 || tipo === 2) {
      // Botella: cuello y corcho.
      const alto = 6 + (i % 3)
      const color = botellas[(i * 3) % botellas.length]
      l.r(x, 10 - alto, 3, alto, C.contorno)
      l.r(x, 10 - alto + 2, 2, alto - 2, color)
      l.r(x, 10 - alto + 3, 1, 2, '#ffffff')
      l.r(x + 1, 10 - alto - 1, 1, 2, '#c9935a')
      x += 4
    } else if (tipo === 1) {
      // Mapa enrollado, acostado.
      l.r(x, 7, 6, 3, C.contorno)
      l.r(x, 7, 5, 2, '#f0e2c0')
      l.r(x + 4, 7, 1, 2, '#c9a96a')
      l.r(x + 2, 8, 1, 1, '#d23a3a')
      x += 7
    } else {
      // Vela encendida (titila con la luz de la escena).
      l.r(x, 5, 2, 5, '#f0e2c0')
      l.r(x, 3, 1, 2, C.oro)
      l.r(x, 2, 1, 1, C.oroLuz)
      x += 3
    }
  }
  l.r(0, 10, u, 2, C.contorno)
  l.r(0, 10, u, 1, C.maderaLuz)
  return abrirSvg(w, 12 * s, l.svg(), 'repisa con botellas y mapas')
}

// ---- Bodega del barco ----

const BARRIL = ['..oooooo..', '.o3LL443o.', 'o33LL4433o', 'oiiiiiiiio', 'o34L44443o', 'o34L44443o', 'o34L44443o', 'oiiiiiiiio', 'o33LL4433o', '.o3L4443o.', '..oooooo..']
const CAJA = ['oooooooooooo', 'o5555555555o', 'o5o555555o5o', 'o55o5555o55o', 'o555o55o555o', 'o5555oo5555o', 'o555o55o555o', 'o55o5555o55o', 'o5o555555o5o', 'oooooooooooo']
const ROLLO = ['..oooooo..', '.o676767o.', 'o67676767o', 'o76767676o', '.oooooooo.']
const BALAS = ['...ooo....', '..oKkko...', '..okkko...', '.oooooooo.', 'oKkkooKkko', 'okkkookkko', '.oooo.ooo.']
const CANON = ['..oooooooooooo..', '.oKKKKKKKKKKKKoo', 'okkkkkkkkkkkkkko', '.oKKKKKKKKKKKKo.', '..oo4oooo4oooo..', '..o444o..o444o..', '..oo4o....o4oo..']
const MAPA_BODEGA: Record<string, string> = {
  o: C.contorno, '3': C.maderaOsc, '4': C.madera, L: C.maderaLuz, i: C.hierro, '5': C.caja,
  '6': C.soga, '7': C.sogaOsc, K: C.hierroLuz, k: '#2a2233',
}

function medidasBodega(altoPx: unknown, escala: unknown) {
  const s = escalaEntera(escala)
  const nAlto = Math.floor(Number(altoPx))
  const h = Math.max(24, Math.min(480, Number.isFinite(nAlto) ? nAlto : 24))
  return { s, h, hu: Math.ceil(h / s) }
}

// Bodega de alto exacto `altoPx` (24..480), anclada abajo: piso de tablas, objetos parados encima, pared de
// tablones con vigas; con alto de sobra, faroles colgados de una viga y una hamaca con un pirata dormido.
export function bodegaSvg(anchoPx: number, altoPx: number, escala: number = 2, opts?: { quieto?: boolean }): string {
  const { s, h, hu } = medidasBodega(altoPx, escala)
  const quieto = opts?.quieto === true
  const w = anchoEntero(anchoPx)
  const u = Math.ceil(w / s)
  const dy = h - hu * s
  const l = lienzo(s)
  const piso = 5
  const suelo = hu - piso
  // Pared de tablones y juntas.
  for (let y = 0; y < suelo; y += 4) {
    l.r(0, y, u, 4, (y / 4) % 2 ? C.tabla2 : C.tabla1)
    l.r(0, y + 3, u, 1, C.junta)
  }
  // Vigas verticales cada 40 unidades.
  for (let x = 18; x < u; x += 40) {
    l.r(x, 0, 3, suelo, C.viga)
    l.r(x, 0, 1, suelo, C.vigaLuz)
  }
  // Ojos de buey entre vigas (con pared de sobra): el mar de noche del otro lado.
  const ojos: Array<[number, number]> = []
  if (suelo >= 40) {
    for (let x = 38; x + 4 < u; x += 80) ojos.push([x, Math.round(suelo * 0.45)])
    for (const [cx, cy] of ojos) {
      l.filas(cx - 4, cy - 4, ['..ggggg..', '.gnnnnng.', 'gnmmmmmng', 'gnmmmmmng', 'gnmmmmmng', 'gnmmmmmng', 'gnmmmmmng', '.gnnnnng.', '..ggggg..'], {
        g: C.oro, n: '#14204a', m: '#1f3b73',
      })
      l.r(cx - 2, cy - 2, 1, 1, '#fff0b8')
    }
  }
  // Viga del techo (si hay alto) y piso.
  const conTecho = suelo >= 26
  if (conTecho) l.r(0, 0, u, 3, C.viga)
  l.r(0, suelo, u, piso, C.piso)
  for (let x = 0; x < u; x += 9) l.r(x, suelo + 1, 1, piso - 1, C.junta)
  l.r(0, suelo, u, 1, C.pisoLuz)
  // Objetos parados en el piso, repartidos parejo.
  const slot = 30
  const n = Math.max(1, Math.floor(u / slot))
  const x0 = Math.floor((u - n * slot) / 2)
  const faroles: Array<[number, number]> = []
  for (let k = 0; k < n; k++) {
    const cx = x0 + k * slot + 15
    const tipo = k % 5
    if (tipo === 0 && suelo >= 11) l.filas(cx - 5, suelo - 11, BARRIL, MAPA_BODEGA)
    else if (tipo === 1 && suelo >= 10) {
      l.filas(cx - 6, suelo - 10, CAJA, MAPA_BODEGA)
      if (suelo >= 15) l.filas(cx - 4, suelo - 15, ROLLO, MAPA_BODEGA)
    } else if (tipo === 2 && suelo >= 7) l.filas(cx - 5, suelo - 7, BALAS, MAPA_BODEGA)
    else if (tipo === 3 && suelo >= 11) {
      l.filas(cx - 9, suelo - 11, BARRIL, MAPA_BODEGA)
      l.filas(cx + 1, suelo - 10, CAJA, MAPA_BODEGA)
    } else if (tipo === 4 && suelo >= 7) l.filas(cx - 8, suelo - 7, CANON, MAPA_BODEGA)
    if (conTecho && k % 2 === 1) faroles.push([cx, 3])
  }
  // Faroles colgados de la viga.
  for (const [cx, y] of faroles) {
    l.r(cx, y, 1, 3, C.contorno)
    l.filas(cx - 2, y + 3, ['.ooo.', 'oYzYo', 'oYYYo', '.ooo.'], { o: C.contorno, Y: '#ffdd55', z: C.oroLuz })
  }
  // Hamaca con un pirata que ronca (si hay pared de sobra).
  let ronquido = ''
  if (suelo >= 34 && u >= 70) {
    const hx = x0 + 6
    const hy = suelo - 30
    for (let x = 0; x <= 28; x++) l.r(hx + x, hy + Math.round(5 * Math.sin((Math.PI * x) / 28)), 1, 1, C.soga)
    l.r(hx, hy - 4, 1, 4, C.hierro)
    l.r(hx + 28, hy - 4, 1, 4, C.hierro)
    l.filas(hx + 6, hy, ['..rr..........', '.rWWo.wrwrwrw.', 'okWWokrwrwrwro', '.oooooooooooo.'], {
      o: C.contorno, r: '#d23a3a', W: '#f0c49a', k: C.contorno, w: '#fff6e0',
    })
    if (!quieto) {
      const zx = (hx + 9) * s
      const zy = (hy - 3) * s
      ronquido = `<text x="${zx}" y="${zy}" font-family="monospace" font-size="${5 * s}" fill="#fff3a8" opacity="0">z<animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite"/><animate attributeName="y" values="${zy};${zy - 4 * s}" dur="2.4s" repeatCount="indefinite"/></text>`
    }
  }
  let cuerpo = l.svg() + ronquido
  if (!quieto) {
    // Faroles que titilan.
    for (const [cx, y] of faroles) {
      cuerpo += `<rect x="${(cx - 1) * s}" y="${(y + 4) * s}" width="${3 * s}" height="${2 * s}" fill="#ff8a3d" opacity="0"><animate attributeName="opacity" calcMode="discrete" values="0;0.8;0;0.6;0" keyTimes="0;0.3;0.35;0.7;0.75" dur="1.7s" repeatCount="indefinite"/></rect>`
    }
    // Rata que cruza el piso cada 23 s.
    const rata = `<g><path fill="#6d607e" d="M0 0h${4 * s}v${2 * s}h-${4 * s}z"/><path fill="#140c1c" d="M${3 * s} 0h${s}v${s}h-${s}z"/><path fill="#c9a0a0" d="M-${2 * s} ${s}h${2 * s}v${s / 2}h-${2 * s}z"/>` +
      `<animateTransform attributeName="transform" type="translate" values="${-6 * s} ${(suelo - 2) * s};${-6 * s} ${(suelo - 2) * s};${(u + 6) * s} ${(suelo - 2) * s}" keyTimes="0;0.85;1" dur="23s" repeatCount="indefinite"/></g>`
    cuerpo += rata
    // Fantasma pirata que se asoma por la pared cada 41 s.
    if (suelo >= 20) {
      const fx = (Math.min(u - 14, x0 + slot + 20)) * s
      const fy = (suelo - 18) * s
      const fantasma = `<g opacity="0" transform="translate(${fx} ${fy}) scale(${s})">` +
        `<path fill="#bfe9ff" d="M2 2h8v10h-2v-2h-2v2h-2v-2h-2zM1 4h1v6h-1zM10 4h1v6h-1z"/>` +
        `<path fill="#140c1c" d="M4 5h1v1h-1zM7 5h1v1h-1zM5 8h2v1h-2z"/><path fill="#2b2142" d="M1 1h10v1h-10zM3 0h6v1h-6z"/>` +
        `<animate attributeName="opacity" values="0;0;0.55;0.55;0" keyTimes="0;0.9;0.93;0.98;1" dur="41s" repeatCount="indefinite"/></g>`
      cuerpo += fantasma
    }
  }
  const envuelto = dy === 0 ? cuerpo : `<g transform="translate(0 ${dy})">${cuerpo}</g>`
  return abrirSvg(w, h, envuelto, 'bodega del barco')
}
