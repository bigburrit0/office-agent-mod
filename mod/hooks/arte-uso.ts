// Arte del tablero de uso de la sesión: contador de tokens, batería de 5 horas y almanaque semanal.
// Skin «Piratas»: tablero de madera oscura con letras hueso, contador en neón turquesa y un cofre, un reloj
// de arena y una bitácora junto a cada título. Funciones puras que devuelven strings SVG. Sin imports y solo
// sintaxis «borrable». Solo SMIL (sin scripts ni referencias externas). Pensado para el panel de noche (#120B1F).

export type DatosUso = {
  tokens?: { total: number; nuevos: number; cache: number }
  cincoHoras?: { pct: number; renueva: string }
  semana?: { pct: number; renueva: string; hoy: number }
  contexto?: number
  costo?: number
}

const C = {
  contorno: '#0b0614',
  beige: '#2b1d14', // madera del tablero
  beigeOscuro: '#4b2e1b', // vetas y separadores
  grisClaro: '#3f335f', // segmento vacío
  azul: '#5c8dff', // días usados
  naranja: '#ffc23c',
  naranjaOscuro: '#b5136a',
  crema: '#1a1230', // fondo de batería y días
  verde: '#5fe39a',
  rojo: '#ff6b7e',
  lcd: '#0a0617',
  lcdDigito: '#21e6c1',
  texto: '#fff6e0',
  hoy: '#ff2e88',
}

// Iconitos de 9 x 8 en píxeles de 2: cofre (tokens), reloj de arena (5 horas) y bitácora (semana).
const ICONOS: Record<string, string[]> = {
  cofre: ['.ooooooo.', 'o3333333o', 'ozYzgzYzo', 'oggggggGo', 'o44oo444o', 'o333g333o', 'o333o333o', 'ooooooooo'],
  reloj: ['ooooooooo', '.oBBBBBo.', '..oBYBo..', '...oYo...', '...oYo...', '..oBYBo..', '.oYYYYYo.', 'ooooooooo'],
  bitacora: ['ooooooooo', 'oWWWoWWWo', 'owwWoWwwo', 'oWWWoWWWo', 'owwWoWwwo', 'oWWWoWWWo', 'oVVVVVVVo', 'ooooooooo'],
}
const PAL_ICONO: Record<string, string> = {
  o: '#0b0614', '3': '#74492a', '4': '#4b2e1b', g: '#f2b632', G: '#b8771a', z: '#fff3a8', Y: '#ffdd55',
  B: '#7ab8ff', W: '#fff6e0', w: '#c9b8a0', V: '#a8173a',
}
function icono(nombre: string, x: number, y: number): string {
  const por: Record<string, string> = {}
  ICONOS[nombre].forEach((f, j) => {
    for (let i = 0; i < f.length; i++) {
      const c = PAL_ICONO[f[i]]
      if (c) por[c] = (por[c] || '') + `M${x + i * 2} ${y + j * 2}h2v2h-2z`
    }
  })
  return Object.keys(por).map(c => `<path fill="${c}" d="${por[c]}"/>`).join('')
}

const FUENTE = 'Verdana, DejaVu Sans, sans-serif'
const INICIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function num(n: unknown): number {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

function esc(t: unknown): string {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function corto(t: unknown): string {
  const s = String(t == null ? '' : t)
  return s.length > 40 ? s.slice(0, 39) + '…' : s
}

export function formatoTokens(n: number): string {
  const v = Math.round(num(n))
  if (v <= 0) return '0'
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function abreviarTokens(n: number): string {
  const v = Math.max(0, Math.round(num(n)))
  if (v < 1000) return String(v)
  const miles = Math.round(v / 1000)
  if (miles < 1000) return `${miles} mil`
  return `${(v / 1e6).toFixed(1).replace('.', ',')} M`
}

export function quedaPct(pctUsado: number): number {
  return Math.round(100 - Math.max(0, Math.min(100, num(pctUsado))))
}

function contextoPct(d: DatosUso): number | null {
  if (d.contexto == null || !Number.isFinite(Number(d.contexto))) return null
  return Math.round(Math.max(0, Math.min(100, Number(d.contexto))))
}

function costoUs(d: DatosUso): string | null {
  if (d.costo == null || !Number.isFinite(Number(d.costo)) || Number(d.costo) < 0) return null
  return `US$ ${Number(d.costo).toFixed(2).replace('.', ',')}`
}

export function altUso(d: DatosUso): string {
  const p: string[] = []
  if (d.tokens) {
    p.push(
      `Tokens de la sesión: ${formatoTokens(d.tokens.total)} (nuevos ${abreviarTokens(d.tokens.nuevos)}, caché ${abreviarTokens(d.tokens.cache)}).`,
    )
  } else {
    p.push('Tokens de la sesión: sin datos todavía.')
  }
  if (d.cincoHoras) {
    p.push(`Ventana de 5 horas: queda ${quedaPct(d.cincoHoras.pct)} %, se renueva ${corto(d.cincoHoras.renueva)}.`)
  } else {
    p.push('Ventana de 5 horas: esperando la primera respuesta.')
  }
  if (d.semana) {
    p.push(`Semana: queda ${quedaPct(d.semana.pct)} %, se renueva ${corto(d.semana.renueva)}.`)
  } else {
    p.push('Semana: esperando la primera respuesta.')
  }
  const cx = contextoPct(d)
  if (cx != null) p.push(`Ventana de contexto: contexto ${cx} % usado.`)
  const co = costoUs(d)
  if (co) p.push(`Gasto: costo ${co}.`)
  return p.join(' ')
}

// Tamaño de letra que entra en el ancho dado (aprox. 0,62 em por caracter), nunca menor a 8.
function ajustar(texto: string, maxPx: number, base: number): number {
  const f = Math.floor((maxPx / Math.max(1, texto.length * 0.62)) * 2) / 2
  return Math.max(8, Math.min(base, f))
}

export function tableroUsoSvg(d: DatosUso, anchoPx: number, opts?: { quieto?: boolean; escala?: number }): string {
  const w = Math.max(200, Math.min(1200, Math.floor(num(anchoPx)) || 200))
  const quieto = !!(opts && opts.quieto)
  const e = Math.round(num(opts && opts.escala))
  const b = e >= 1 ? Math.min(4, e) : 2
  const pad = 8
  const apilado = w < 320
  const pw = apilado ? w : Math.floor(w / 2)
  const altoPanel = 84
  const cxPct = contextoPct(d)
  const costoTxt = costoUs(d)
  const hayExtra = cxPct != null || costoTxt != null
  const cxTxt = cxPct != null ? `contexto ${cxPct} %` : ''
  const subTxt = d.tokens ? `nuevos ${abreviarTokens(d.tokens.nuevos)} · caché ${abreviarTokens(d.tokens.cache)}` : ''
  const barW = 49
  const derW = Math.ceil((cxTxt.length + (costoTxt ? costoTxt.length : 0)) * 10 * 0.62) + (cxPct != null ? barW + 8 : 0) + (cxTxt && costoTxt ? 10 : 0)
  const izqW = Math.ceil(subTxt.length * 10 * 0.62)
  const dosLineas = hayExtra && (w < 360 || izqW + derW + 12 > w - 2 * pad)
  const y0 = dosLineas ? 90 : 76
  const H = apilado ? y0 + altoPanel * 2 + 6 : y0 + altoPanel + 6

  const rect = (x: number, y: number, ww: number, hh: number, fill: string, extra = '') =>
    `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${fill}"${extra}/>`
  const texto = (x: number, y: number, t: string, size: number, fill: string, extra = '') =>
    `<text x="${x}" y="${y}" font-family="${extra.indexOf('monospace') >= 0 ? 'monospace' : FUENTE}" font-size="${size}" fill="${fill}"${extra.replace('monospace', '')}>${esc(t)}</text>`
  const marco = (x: number, y: number, ww: number, hh: number, relleno: string) =>
    rect(x, y, ww, hh, C.contorno) + rect(x + b, y + b, ww - 2 * b, hh - 2 * b, relleno)

  let s = ''
  // Repisa
  s += marco(0, 0, w, H, C.beige)
  s += rect(b, b, w - 2 * b, 2, C.beigeOscuro)

  // Contador LCD
  const hayTokens = !!d.tokens
  s += texto(pad, 18, hayTokens ? 'TOKENS DE LA SESIÓN' : 'sin datos todavía', 10.5, C.texto, ' font-weight="bold"')
  s += icono('cofre', w - pad - 18, 5)
  const lcdW = w - 2 * pad
  s += marco(pad, 24, lcdW, 28, C.lcd)
  const digitos = hayTokens ? formatoTokens(d.tokens!.total) : '-----'
  const fs = ajustar(digitos, lcdW - 16, 22)
  s += texto(Math.round(w / 2), 24 + 14 + Math.round(fs * 0.35), digitos, fs, C.lcdDigito, ' text-anchor="middle" monospace')
  if (hayTokens) {
    const sub = `nuevos ${abreviarTokens(d.tokens!.nuevos)} · caché ${abreviarTokens(d.tokens!.cache)}`
    const compacto = hayExtra && !dosLineas
    s += texto(pad, 66, sub, compacto ? 10 : ajustar(sub, lcdW, 11), C.texto)
  }
  if (hayExtra) {
    const yl = dosLineas ? 80 : 66
    let xd = w - pad
    if (costoTxt) {
      s += texto(xd, yl, costoTxt, 10, C.texto, ' text-anchor="end" font-weight="bold"')
      xd -= Math.ceil(costoTxt.length * 10 * 0.62) + 10
    }
    if (cxPct != null) {
      const colorCx = cxPct >= 90 ? C.rojo : cxPct >= 70 ? C.naranja : C.verde
      const llenosCx = Math.round(cxPct / 10)
      const xb = dosLineas ? pad + Math.ceil(cxTxt.length * 10 * 0.62) + 8 : xd - barW
      for (let i = 0; i < 10; i++) {
        const llena = i < llenosCx
        s += `<rect data-ctx="${llena ? 'llena' : 'vacia'}" x="${xb + i * 5}" y="${yl - 8}" width="4" height="9" fill="${llena ? colorCx : C.grisClaro}"/>`
      }
      s += texto(dosLineas ? pad : xb - 8, yl, cxTxt, 10, C.texto, dosLineas ? '' : ' text-anchor="end"')
    }
  }
  s += rect(b, y0 - 2, w - 2 * b, 2, C.beigeOscuro)
  if (!apilado) s += rect(pw, y0, 2, altoPanel, C.beigeOscuro)
  else s += rect(b, y0 + altoPanel - 1, w - 2 * b, 2, C.beigeOscuro)

  const maxTxt = pw - 2 * pad

  // Batería de 5 horas
  {
    const x = pad
    const y = y0
    s += texto(x, y + 14, '5 HORAS', 10.5, C.texto, ' font-weight="bold"')
    s += icono('reloj', x + pw - 2 * pad - 18, y + 4)
    const cb = d.cincoHoras
    const queda = cb ? quedaPct(cb.pct) : 0
    const llenos = cb ? Math.round(queda / 10) : 0
    const color = queda > 50 ? C.verde : queda >= 20 ? C.naranja : C.rojo
    const bw = pw - 2 * pad - 6
    const bh = 22
    s += marco(x, y + 22, bw, bh, C.crema)
    s += rect(x + bw, y + 22 + 6, 5, 10, '#6a5680')
    const interior = bw - 2 * b - 4
    const sw = Math.max(2, Math.floor((interior - 18) / 10))
    const x1 = x + b + 2 + Math.floor((interior - (sw * 10 + 18)) / 2)
    for (let i = 0; i < 10; i++) {
      const llena = i < llenos
      const anim =
        llena && i === llenos - 1 && queda < 20 && !quieto
          ? `><animate attributeName="opacity" values="1;0.25" keyTimes="0;0.5" dur="1s" calcMode="discrete" repeatCount="indefinite"/></rect`
          : '/'
      s += `<rect data-seg="${llena ? 'llena' : 'vacia'}" x="${x1 + i * (sw + 2)}" y="${y + 22 + b + 2}" width="${sw}" height="${bh - 2 * b - 4}" fill="${llena ? color : C.grisClaro}"${anim}>`
    }
    if (cb) {
      const t = `quedan ${queda} %`
      s += texto(x, y + 62, t, ajustar(t, maxTxt, 15), C.texto, ' font-weight="bold"')
      const r = `se renueva ${corto(cb.renueva)}`
      s += texto(x, y + 77, r, ajustar(r, maxTxt, 10.5), C.texto)
    } else {
      const t = 'esperando la primera respuesta'
      s += texto(x, y + 66, t, ajustar(t, maxTxt, 11), C.texto)
    }
  }

  // Almanaque semanal
  {
    const x = apilado ? pad : pw + pad
    const y = apilado ? y0 + altoPanel : y0
    s += texto(x, y + 14, 'SEMANA', 10.5, C.texto, ' font-weight="bold"')
    s += icono('bitacora', x + pw - 2 * pad - 18, y + 4)
    const sm = d.semana
    const llenos = sm ? Math.round((Math.max(0, Math.min(100, num(sm.pct))) / 100) * 7) : 0
    const hoy = sm && Number.isInteger(sm.hoy) && sm.hoy >= 0 && sm.hoy <= 6 ? sm.hoy : -1
    const gap = 3
    const c = Math.max(8, Math.min(18, Math.floor((pw - 2 * pad - 6 * gap) / 7)))
    for (let i = 0; i < 7; i++) {
      const cx = x + i * (c + gap)
      s += texto(cx + Math.round(c / 2), y + 25, INICIALES[i], 10, C.texto, ' text-anchor="middle"')
      const borde = i === hoy ? C.hoy : '#6a5680'
      const g = i === hoy ? Math.max(2, b) : 1
      s += rect(cx, y + 29, c, c, borde)
      s += rect(cx + g, y + 29 + g, c - 2 * g, c - 2 * g, i < llenos ? C.azul : C.crema)
      if (i === hoy) {
        const m = Math.round(cx + c / 2)
        s += `<path d="M${m - 2} ${y + 29 + c + 2}h4l-2 -2z" fill="${C.naranjaOscuro}"/>`
      }
    }
    if (sm) {
      const t = `quedan ${quedaPct(sm.pct)} %`
      s += texto(x, y + 67, t, ajustar(t, maxTxt, 15), C.texto, ' font-weight="bold"')
      const r = `se renueva ${corto(sm.renueva)}`
      s += texto(x, y + 80, r, ajustar(r, maxTxt, 10.5), C.texto)
    } else {
      const t = 'esperando la primera respuesta'
      s += texto(x, y + 66, t, ajustar(t, maxTxt, 11), C.texto)
    }
  }

  const alt = esc(altUso(d))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" shape-rendering="crispEdges" role="img" aria-label="${alt}"><title>${alt}</title>${s}</svg>`
}
