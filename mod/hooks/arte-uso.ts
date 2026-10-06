// Arte del tablero de uso de la sesión: contador LCD de tokens, batería de 5 horas y almanaque semanal.
// Funciones puras que devuelven strings SVG. Sin imports y solo sintaxis «borrable».
// Solo SMIL (sin scripts ni referencias externas). Pensado para el panel de tema claro (#FBF6EA).

export type DatosUso = {
  tokens?: { total: number; nuevos: number; cache: number }
  cincoHoras?: { pct: number; renueva: string }
  semana?: { pct: number; renueva: string; hoy: number }
}

const C = {
  contorno: '#2B2118',
  beige: '#E8DCC0',
  beigeOscuro: '#C2AE86',
  grisClaro: '#C9C4B8',
  azul: '#1F5FA8',
  naranja: '#F28C28',
  naranjaOscuro: '#B85C12',
  crema: '#FFF4DF',
  verde: '#3FAE6A',
  rojo: '#D9363E',
  lcd: '#13251b',
  lcdDigito: '#9FE3C8',
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
  const y0 = 76
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
  s += texto(pad, 18, hayTokens ? 'TOKENS DE LA SESIÓN' : 'sin datos todavía', 10.5, C.contorno, ' font-weight="bold"')
  const lcdW = w - 2 * pad
  s += marco(pad, 24, lcdW, 28, C.lcd)
  const digitos = hayTokens ? formatoTokens(d.tokens!.total) : '-----'
  const fs = ajustar(digitos, lcdW - 16, 22)
  s += texto(Math.round(w / 2), 24 + 14 + Math.round(fs * 0.35), digitos, fs, C.lcdDigito, ' text-anchor="middle" monospace')
  if (hayTokens) {
    const sub = `nuevos ${abreviarTokens(d.tokens!.nuevos)} · caché ${abreviarTokens(d.tokens!.cache)}`
    s += texto(pad, 66, sub, ajustar(sub, lcdW, 11), C.contorno)
  }
  s += rect(b, 74, w - 2 * b, 2, C.beigeOscuro)
  if (!apilado) s += rect(pw, y0, 2, altoPanel, C.beigeOscuro)
  else s += rect(b, y0 + altoPanel - 1, w - 2 * b, 2, C.beigeOscuro)

  const maxTxt = pw - 2 * pad

  // Batería de 5 horas
  {
    const x = pad
    const y = y0
    s += texto(x, y + 14, '5 HORAS', 10.5, C.contorno, ' font-weight="bold"')
    const cb = d.cincoHoras
    const queda = cb ? quedaPct(cb.pct) : 0
    const llenos = cb ? Math.round(queda / 10) : 0
    const color = queda > 50 ? C.verde : queda >= 20 ? C.naranja : C.rojo
    const bw = pw - 2 * pad - 6
    const bh = 22
    s += marco(x, y + 22, bw, bh, C.crema)
    s += rect(x + bw, y + 22 + 6, 5, 10, C.contorno)
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
      s += texto(x, y + 62, t, ajustar(t, maxTxt, 15), C.contorno, ' font-weight="bold"')
      const r = `se renueva ${corto(cb.renueva)}`
      s += texto(x, y + 77, r, ajustar(r, maxTxt, 10.5), C.contorno)
    } else {
      const t = 'esperando la primera respuesta'
      s += texto(x, y + 66, t, ajustar(t, maxTxt, 11), C.contorno)
    }
  }

  // Almanaque semanal
  {
    const x = apilado ? pad : pw + pad
    const y = apilado ? y0 + altoPanel : y0
    s += texto(x, y + 14, 'SEMANA', 10.5, C.contorno, ' font-weight="bold"')
    const sm = d.semana
    const llenos = sm ? Math.round((Math.max(0, Math.min(100, num(sm.pct))) / 100) * 7) : 0
    const hoy = sm && Number.isInteger(sm.hoy) && sm.hoy >= 0 && sm.hoy <= 6 ? sm.hoy : -1
    const gap = 3
    const c = Math.max(8, Math.min(18, Math.floor((pw - 2 * pad - 6 * gap) / 7)))
    for (let i = 0; i < 7; i++) {
      const cx = x + i * (c + gap)
      s += texto(cx + Math.round(c / 2), y + 25, INICIALES[i], 10, C.contorno, ' text-anchor="middle"')
      const borde = i === hoy ? C.naranja : C.contorno
      const g = i === hoy ? Math.max(2, b) : 1
      s += rect(cx, y + 29, c, c, borde)
      s += rect(cx + g, y + 29 + g, c - 2 * g, c - 2 * g, i < llenos ? C.azul : C.crema)
      if (i === hoy) {
        const m = Math.round(cx + c / 2)
        s += `<path d="M${m - 3} ${y + 29 + c + 4}h6l-3 -4z" fill="${C.naranjaOscuro}"/>`
      }
    }
    if (sm) {
      const t = `quedan ${quedaPct(sm.pct)} %`
      s += texto(x, y + 62, t, ajustar(t, maxTxt, 15), C.contorno, ' font-weight="bold"')
      const r = `se renueva ${corto(sm.renueva)}`
      s += texto(x, y + 77, r, ajustar(r, maxTxt, 10.5), C.contorno)
    } else {
      const t = 'esperando la primera respuesta'
      s += texto(x, y + 66, t, ajustar(t, maxTxt, 11), C.contorno)
    }
  }

  const alt = esc(altUso(d))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" shape-rendering="crispEdges" role="img" aria-label="${alt}"><title>${alt}</title>${s}</svg>`
}
