// Genera preview.html con todo lo que dibujan hooks/pixel.ts y hooks/arte-*.ts, y verifica cada SVG.
// Uso: node make-preview.mjs   (Node 24 importa el .ts directamente)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as px from '../hooks/pixel.ts'
import * as cara from '../hooks/arte-robot.ts'
import * as patio from '../hooks/arte-escritorios.ts'
import * as glifos from '../hooks/arte-iconos.ts'
import * as dioses from '../hooks/arte-iconos.ts'
import * as templo from '../hooks/arte-edificio.ts'

const aca = dirname(fileURLToPath(import.meta.url))
const todos = [] // { nombre, svg } para la verificación final

function registrar(nombre, svg) {
  todos.push({ nombre, svg })
  return svg
}

// Datos de ejemplo: 6 filas con los 4 roles y los 4 estados.
const AHORA = 1_000_000_000
const filas = [
  { label: 'T-62a pixel.ts', role: 'implementador', status: 'completed', startMs: AHORA - 600000, endMs: AHORA - 360000 },
  { label: 'T-62b integrar panel', role: 'implementador', status: 'running', startMs: AHORA - 300000 },
  { label: 'T-61b arreglar <b>&"x"</b>', role: 'corrector', status: 'failed', startMs: AHORA - 540000, endMs: AHORA - 420000 },
  { label: 'Buscar paleta azteca', role: 'investigador', status: 'completed', startMs: AHORA - 580000, endMs: AHORA - 500000 },
  { label: 'Revisar roles.ts', role: 'revisor', status: 'killed', startMs: AHORA - 200000, endMs: AHORA - 150000 },
  { label: 'Revisión final', role: 'revisor', status: 'running', startMs: AHORA - 90000 },
]
const conteo = { running: 3, done: 5, failed: 1, stopped: 2, other: 1 }
const EQUIPOS = Object.keys(px.EQUIPOS_EMBLEMA)

function bloqueEscalas(nombre, fabrica) {
  return `<div class="fila"><div><small>${nombre} 1x</small><br>${registrar(nombre + ' 1x', fabrica(1))}</div>` +
    `<div><small>${nombre} 3x</small><br>${registrar(nombre + ' 3x', fabrica(3))}</div></div>`
}

// Sección «Cara del robot»: las 9 emociones, sin marco y con marco (si la opción ya existe).
function seccionCara() {
  let h = '<h2>Cara del robot (8 bits)</h2>'
  h += '<h3>9 emociones, escala 3, sobre fondo selva</h3><div class="fila">'
  for (const e of cara.EMOCIONES) {
    h += `<div><small>${e}</small><br>${registrar('cara ' + e, cara.caraRobotSvg(e, 3, { fondo: '#0E4A22' }))}</div>`
  }
  h += '</div>'
  h += '<h3>9 emociones con marco</h3><div class="fila">'
  let hayMarco = false
  for (const e of cara.EMOCIONES) {
    const svg = cara.caraRobotSvg(e, 3, { fondo: '#0E4A22', marco: true })
    if (svg !== cara.caraRobotSvg(e, 3, { fondo: '#0E4A22' })) hayMarco = true
    h += `<div><small>${e}</small><br>${registrar('cara marco ' + e, svg)}</div>`
  }
  h += '</div>'
  if (!hayMarco) h += '<p><small>(la opción marco todavía no existe: se ven iguales)</small></p>'
  return h
}

// Sección «Patio»: 4 fases de la celda para un glifo de cada tipo, el piso y el dosel (si existe).
function seccionPatio() {
  let h = '<h2>Patio de agentes</h2>'
  for (const tipo of glifos.TIPOS_GLIFO) {
    h += `<h3>Celda de ${tipo} (entra, juega, sale, explota)</h3><div class="fila">`
    for (const fase of ['entra', 'juega', 'sale', 'explota']) {
      const svg = patio.celdaPatioSvg({ fase, matriz: glifos.glifoMatriz(tipo), paleta: glifos.glifoPaleta(EQUIPOS[0]), etiqueta: 'T-81' })
      h += `<div><small>${fase}</small><br>${registrar(`celda ${tipo} ${fase}`, svg)}</div>`
    }
    h += '</div>'
  }
  h += '<h3>Piso del patio</h3>' + registrar('piso patio', patio.pisoPatioSvg(360, 2, { fondo: '#0E4A22' }))
  if (typeof patio.doselPatioSvg === 'function') {
    h += '<h3>Dosel del patio</h3>' + registrar('dosel patio', patio.doselPatioSvg(360, 2))
  }
  return h
}

// Sección «Glifos»: 5 tipos × 6 equipos.
function seccionGlifos() {
  let h = '<h2>Glifos mayas (5 tipos × 6 equipos)</h2>'
  for (const equipo of EQUIPOS) {
    h += `<h3>${equipo}</h3><div class="fila">`
    for (const tipo of glifos.TIPOS_GLIFO) {
      h += `<div><small>${tipo}</small><br>${registrar(`glifo ${tipo} ${equipo}`, glifos.glifoSvg(tipo, equipo, 4))}</div>`
    }
    h += '</div>'
  }
  return h
}

// Sección «Texto pixel»: todo a 2x y 4x.
function bloque2y4(nombre, fabrica) {
  return `<div class="fila">` +
    [2, 4].map(e => `<div><small>${nombre} ${e}x</small><br>${registrar(`${nombre} ${e}x`, fabrica(e))}</div>`).join('') +
    `</div>`
}

function seccionTextoPixel() {
  let h = '<h2>Texto pixel animado</h2>'
  h += '<h3>Título (texto estático)</h3>' + bloque2y4('pixelText TABLERO', e => px.pixelTextSvg('TABLERO', e))
  h += '<h3>Título que se arma (repite en bucle)</h3>' +
    bloque2y4('textoArmado TABLERO', e => px.textoArmadoSvg('TABLERO', e, { repetir: true }))
  h += '<h3>Texto con tildes, Ñ y signos</h3>' +
    bloque2y4('pixelText acentos', e => px.pixelTextSvg('Canción ñandú: 12 · ¿?…', e))
  h += '<h3>Palabras de estado</h3>'
  for (const estado of ['corre', 'lista', 'falló', 'frenada']) {
    h += bloque2y4('estado ' + estado, e => px.palabraEstadoSvg(estado, e))
  }
  return h
}

function seccionResto() {
  let h = '<h2>Resto de pixel.ts</h2>'
  h += '<h3>Colores de rol y estado</h3><div class="fila">'
  for (const [k, v] of Object.entries({ ...px.ROLE_COLORS, desconocido: px.ROLE_COLOR_DEFAULT, ...px.STATUS_COLORS })) {
    h += `<div class="muestra" style="background:${v}">${k}</div>`
  }
  h += '</div>'
  h += '<h3>Greca</h3>' + bloqueEscalas('greca', e => px.grecaBand(240 * e, 8 * e + 8))
  h += '<h3>Barra de oleada</h3>' + bloqueEscalas('oleada', e => px.waveBarSvg(conteo, 200 * e))
  h += '<h3>Oleada vacía</h3>' + registrar('oleada vacía', px.waveBarSvg({ running: 0, done: 0, failed: 0, stopped: 0, other: 0 }, 240))
  h += '<h3>Línea de tiempo</h3>' + bloqueEscalas('timeline', e => px.timelineSvg(filas, AHORA, 360 * e))
  h += '<h3>Línea de tiempo sin filas / un solo instante</h3>' +
    registrar('timeline vacía', px.timelineSvg([], AHORA, 300)) + ' ' +
    registrar('timeline instante', px.timelineSvg([{ label: 'x', role: 'zzz', status: 'running', startMs: AHORA, endMs: AHORA }], AHORA, 300))
  h += '<h3>Emblemas de equipo (escala 4)</h3><div class="fila">'
  for (const equipo of [...EQUIPOS, 'desconocido']) {
    h += `<div><small>${equipo}</small><br>${registrar('emblema ' + equipo, px.emblemaSvg(equipo, 4))}</div>`
  }
  h += '</div>'
  return h
}

function seccionDioses() {
  let h = '<h2>Dioses de equipo</h2><div class="fila">'
  for (const eq of Object.keys(dioses.DIOSES_EQUIPO)) {
    const svg = dioses.diosSvg(eq, 3, glifos.EQUIPO_ACENTO[eq] ?? ['#3fae6a', '#23703f'])
    h += `<div><small>${eq}: ${dioses.DIOSES_EQUIPO[eq].dios}</small><br>${registrar('dios ' + eq, svg)}</div>`
  }
  return h + '</div>'
}

function seccionTaller() {
  return '<h2>Pared del taller</h2>' + registrar('pared taller', templo.paredTallerSvg(300, 2))
}

const cuerpo = seccionCara() + seccionPatio() + seccionGlifos() + seccionDioses() + seccionTaller() + seccionTextoPixel() + seccionResto()
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Preview pixel</title>
<style>
body{margin:0;font-family:monospace}
.oscuro{background:#16110a;color:#FFF4BF;padding:16px}
.claro{background:#f4efe6;color:#1A1208;padding:16px}
.fila{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end;margin-bottom:8px}
.muestra{padding:6px 10px;color:#fff;text-shadow:0 0 2px #000}
h3{margin:14px 0 6px}
</style></head><body>
<div class="oscuro"><h2>Fondo oscuro</h2>${cuerpo}</div>
<div class="claro"><h2>Fondo claro</h2>${cuerpo}</div>
</body></html>`

const salida = join(aca, 'preview.html')
writeFileSync(salida, html, 'utf8')

// Verificación de cada SVG.
const prohibidos = ['<script', '<foreignObject', 'onload', 'href', 'javascript:']
const fallas = []
for (const { nombre, svg } of todos) {
  if (svg.length >= 120000) fallas.push(`${nombre}: pesa ${svg.length}`)
  if (!svg.startsWith('<svg')) fallas.push(`${nombre}: no empieza con <svg`)
  for (const p of prohibidos) if (svg.includes(p)) fallas.push(`${nombre}: contiene ${p}`)
  if (/\son[a-z]+=/i.test(svg)) fallas.push(`${nombre}: atributo on…=`)
  if (svg.includes('url(http')) fallas.push(`${nombre}: url(http`)
}
// El texto de afuera debe salir escapado.
const sospechoso = px.timelineSvg(filas, AHORA, 400)
if (sospechoso.includes('<b>')) fallas.push('timeline: etiqueta sin escapar')

const hay = (cond, msg) => { if (!cond) fallas.push(msg) }
// Fuente: filas de igual ancho en cada letra, alto 7 o 9.
for (const [ch, g] of Object.entries(px.FONT)) {
  hay(g.length === 7 || g.length === 9, `FONT ${ch}: alto ${g.length}`)
  hay(g.every(f => f.length === g[0].length && /^[#.]+$/.test(f)), `FONT ${ch}: filas desparejas`)
}
for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ·:.-…ÁÉÍÓÚÑ') hay(!!px.FONT[ch], `FONT: falta ${ch}`)
// Reproducible (sin azar ni fecha) y con el texto de afuera inofensivo.
hay(px.textoArmadoSvg('TABLERO', 3, { repetir: true }) === px.textoArmadoSvg('TABLERO', 3, { repetir: true }), 'textoArmado no es reproducible')
hay(px.palabraEstadoSvg('running', 3) === px.palabraEstadoSvg('corre', 3), 'palabraEstado: running != corre')
// Peor caso: 24 caracteres anchos a escala grande, y más de 24 (se recorta).
for (const [nombre, svg] of [
  ['armado 24 chars', px.textoArmadoSvg('MMMMMMMMMMMMMMMMMMMMMMMM', 6, { repetir: true })],
  ['armado 40 chars', px.textoArmadoSvg('WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', 3)],
  ['armado hostil', px.textoArmadoSvg('<script>alert(1)</script>&"\'', 3)],
  ['armado vacío', px.textoArmadoSvg('', 3)],
  ['estado hostil', px.palabraEstadoSvg('<script>x</script>', 3)],
]) {
  registrar(nombre, svg)
  if (svg.length >= 120000) fallas.push(`${nombre}: pesa ${svg.length}`)
  if (!svg.startsWith('<svg') || svg.includes('<script') || svg.includes('href') || svg.includes('javascript:')) fallas.push(`${nombre}: contenido prohibido`)
}

if (fallas.length) {
  console.error(fallas.join('\n'))
  process.exit(1)
}
const mayor = Math.max(...todos.map(t => t.svg.length))
console.log(`SVGs verificados: ${todos.length}, el más pesado: ${mayor} caracteres`)
console.log('OK')
