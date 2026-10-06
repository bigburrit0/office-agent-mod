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
import * as actividades from '../hooks/arte-actividades.ts'
import * as emociones from '../hooks/emociones.ts'
import * as uso from '../hooks/arte-uso.ts'
import * as oficina from '../hooks/arte-oficina.ts'

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

// Grupos de emociones, para ordenar la vista previa (los mismos de emociones.ts).
const GRUPOS_CARA = [
  ['Ocio', ['aburrido', ...emociones.ROTACION_OCIO, 'dormido']],
  ['Hora del día', emociones.FRANJAS_HORA.map(f => f.emocion)],
  ['Trabajo', ['pensando', 'concentrado', 'tipea', 'multitarea', 'sospecha']],
  ['Eventos buenos', ['contento', 'festeja', 'aplaude', 'orgullo', 'alivio']],
  ['Eventos malos', ['molesto', 'bufido', 'ruge', 'panico', 'frustrado', 'chispazo']],
  ['Social', ['saluda', 'sorpresa', 'caceria']],
]

// Sección «Cara del robot»: las emociones por grupo, con marco, animadas y quietas.
function seccionCara() {
  let h = `<h2>Cara del robot (${cara.EMOCIONES.length} emociones)</h2>`
  const vistas = new Set()
  for (const [grupo, lista] of GRUPOS_CARA) {
    h += `<h3>${grupo}</h3><div class="fila">`
    for (const e of lista) {
      vistas.add(e)
      h += `<div><small>${e}: ${cara.EMOCION_ALT[e]}</small><br>${registrar('cara ' + e, cara.caraRobotSvg(e, 3, { fondo: '#0E4A22', marco: true }))}` +
        ` ${registrar('cara quieta ' + e, cara.caraRobotSvg(e, 3, { fondo: '#0E4A22', marco: true, quieto: true }))}</div>`
    }
    h += '</div>'
  }
  const sueltas = cara.EMOCIONES.filter(e => !vistas.has(e))
  if (sueltas.length) h += `<p><small>Sin grupo en la vista previa: ${sueltas.join(', ')}</small></p>`
  return h
}

// Sección «Patio»: por equipo, su actividad en las 4 fases (y quieta), más la genérica, el piso y el dosel.
function seccionPatio() {
  let h = '<h2>Patio de agentes: color y actividad por equipo</h2>'
  const equipos = [...Object.keys(actividades.ACTIVIDAD_EQUIPO), 'equipo-nuevo']
  for (const equipo of equipos) {
    const { actividad, pensada } = actividades.actividadDe(equipo)
    const acento = glifos.EQUIPO_ACENTO[equipo] ?? glifos.EQUIPO_ACENTO.base
    const datos = actividades.actividadParaCelda(actividad, 2, acento[0])
    h += `<h3>${equipo}: ${datos.texto}${pensada ? '' : ' (genérica: hay que pensarle una)'}</h3><div class="fila">`
    for (const fase of ['entra', 'juega', 'sale', 'explota']) {
      const svg = patio.celdaPatioSvg({ fase, acento, actividad: datos, semilla: 5, etiqueta: 'T-81', titulo: `T-81 · equipo ${equipo}` })
      h += `<div><small>${fase}</small><br>${registrar(`celda ${equipo} ${fase}`, svg)}</div>`
    }
    datos.cuadros.forEach((_c, i) => {
      const uno = { ...datos, cuadros: [datos.cuadros[i]], tiempos: [1] }
      const svg = patio.celdaPatioSvg({ fase: 'juega', acento, actividad: uno, semilla: 5, etiqueta: 'T-81', quieto: true })
      h += `<div><small>cuadro ${i + 1}</small><br>${registrar(`celda ${equipo} cuadro ${i + 1}`, svg)}</div>`
    })
    h += '</div>'
  }
  h += '<h3>Piso del patio</h3>' + registrar('piso patio', patio.pisoPatioSvg(360, 2, { fondo: '#0E4A22' }))
  h += '<h3>Dosel del patio</h3>' + registrar('dosel patio', patio.doselPatioSvg(360, 2))
  return h
}

// Sección «Leyenda de colores»: los 12 equipos como los muestra el panel. Misma regla que
// chipEquipo en register.tsx: tono oscuro con letra crema si contrasta 4,5:1; si no, tono claro con letra oscura.
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contraste = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
function seccionLeyenda() {
  let h = '<h2>Leyenda de colores del patio</h2><div class="fila">'
  for (const [equipo, [claro, oscuro]] of Object.entries(glifos.EQUIPO_ACENTO)) {
    const usaOscuro = contraste(oscuro, '#FFF4DF') >= 4.5
    const [fondo, letra] = usaOscuro ? [oscuro, '#FFF4DF'] : [claro, '#2B2118']
    h += `<div class="muestra" style="background:${fondo};color:${letra};text-shadow:none">■ ${equipo} (${contraste(fondo, letra).toFixed(1)}:1)</div>`
  }
  return h + '</div>'
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

const cuerpo = seccionCara() + seccionPatio() + seccionLeyenda() + seccionGlifos() + seccionDioses() + seccionTaller() + seccionTextoPixel() + seccionResto()
// Sección «Tema claro (el panel)»: el arte nuevo sobre fondo claro, una sola vez.
function seccionTemaClaro() {
  const d = { tokens: { total: 1284560, nuevos: 212000, cache: 1072560 }, cincoHoras: { pct: 75, renueva: 'hoy 14:00' }, semana: { pct: 39, renueva: 'vie 22:00', hoy: 2 } }
  const d92 = { ...d, cincoHoras: { pct: 92, renueva: 'hoy 14:00' } }
  const items = [
    ['tablero uso 420', uso.tableroUsoSvg(d, 420)],
    ['tablero uso 300', uso.tableroUsoSvg(d, 300)],
    ['tablero uso 92%', uso.tableroUsoSvg(d92, 420)],
    ['tablero uso vacío', uso.tableroUsoSvg({}, 420)],
    ['oficinaVacia 420', oficina.oficinaVaciaSvg(420)],
    ['estante 420', oficina.estanteSvg(420)],
    ['pieOficina 420x120', oficina.pieOficinaSvg(420, 120)],
    ['pieOficina 420x300', oficina.pieOficinaSvg(420, 300)],
    ['timeline claro 420', px.timelineSvg(filas, AHORA, 420, { tema: 'claro' })],
    ['cara aburrido azul', cara.caraRobotSvg('aburrido', 3, { fondo: '#D9E7F2', marco: true })],
    ['cara sospecha azul', cara.caraRobotSvg('sospecha', 3, { fondo: '#D9E7F2', marco: true })],
  ]
  let h = '<section style="background:#FBF6EA;color:#2B2118;padding:12px"><h2>Tema claro (el panel)</h2><div class="fila">'
  for (const [nombre, svg] of items) h += `<div><small>${nombre}</small><br>${registrar('claro ' + nombre, svg)}</div>`
  return h + '</div></section>'
}
const temaClaro = seccionTemaClaro()
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
${temaClaro}
</body></html>`

const salida = join(aca, 'preview.html')
writeFileSync(salida, html, 'utf8')

// Verificación de cada SVG. Tope de peso por SVG (más estricto que los 150.000 del plan).
const TOPE = 120000
const prohibidos = ['<script', '<foreignObject', 'onload', 'href', 'javascript:']
const fallas = []
for (const { nombre, svg } of todos) {
  if (svg.length >= TOPE) fallas.push(`${nombre}: pesa ${svg.length}`)
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
  if (svg.length >= TOPE) fallas.push(`${nombre}: pesa ${svg.length}`)
  if (!svg.startsWith('<svg') || svg.includes('<script') || svg.includes('href') || svg.includes('javascript:')) fallas.push(`${nombre}: contenido prohibido`)
}

if (fallas.length) {
  console.error(fallas.join('\n'))
  process.exit(1)
}
const mayor = todos.reduce((a, b) => (b.svg.length > a.svg.length ? b : a))
console.log(`SVGs verificados: ${todos.length}, el más pesado: ${mayor.nombre} con ${mayor.svg.length} caracteres (tope ${TOPE})`)
console.log('OK')
