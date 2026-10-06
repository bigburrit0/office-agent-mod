// Maqueta HTML del panel «oficina»: el mismo árbol que recibe la app, a 378 px.
//
// Uso (desde la raíz del repo):
//   1. claude plugin test mod          (la prueba mod/tests/maqueta.test.ts imprime los árboles)
//   2. node mod/preview/maqueta.mjs
//
// El paso 2 busca los árboles en este orden: archivos mod/tests/salida/maqueta-<nombre>.json,
// la salida guardada mod/tests/salida/prueba.txt, un archivo pasado como argumento, y si no hay
// nada corre `claude plugin test mod` él mismo (variable CLAUDE_BIN para indicar el ejecutable)
// y guarda esa salida en prueba.txt. Con --nueva ignora lo guardado y vuelve a correr la prueba.
// Resultado: mod/tests/salida/maqueta.html. Todo elemento más ancho que el marco sale con un
// contorno rojo; en consola se cuenta cuántos hay (estimado) y el HTML vuelve a medirlo en el
// navegador y muestra el total real arriba.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aca = dirname(fileURLToPath(import.meta.url))
const salida = join(aca, '..', 'tests', 'salida')
const MARCO = 378
const CELDA_X = 7.9
const CELDA_Y = 20
const CHAR = 7.2 // ancho medio de una letra a 13 px
const ESCENARIOS = [
  ['subagentes-uso', 'Subagentes · sin agentes, con uso'],
  ['subagentes-3', 'Subagentes · 3 corriendo'],
  ['equipos', 'Equipos · grupo base y agente abiertos'],
  ['editar', 'Editar un agente'],
]

// ---- Leer los árboles ----
function deSalida(texto) {
  const out = {}
  for (const m of texto.matchAll(/<<<MAQUETA ([\w-]+)>>>(.*?)<<<FIN>>>/gs)) out[m[1]] = JSON.parse(m[2])
  return out
}
function claudeBin() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN
  const base = join(process.env.APPDATA ?? '', 'Claude', 'claude-code')
  if (existsSync(base)) {
    const cand = []
    for (const v of readdirSync(base)) {
      const d = join(base, v)
      try {
        for (const h of readdirSync(d)) if (existsSync(join(d, h, 'claude.exe'))) cand.push(join(d, h, 'claude.exe'))
      } catch {}
    }
    if (cand.length) return cand.sort().at(-1)
  }
  return 'claude'
}
function cargar() {
  const forzar = process.argv.includes('--nueva')
  const arg = process.argv.slice(2).find(a => !a.startsWith('--'))
  let arboles = {}
  if (!forzar) {
    for (const [n] of ESCENARIOS) {
      const f = join(salida, `maqueta-${n}.json`)
      if (existsSync(f)) arboles[n] = JSON.parse(readFileSync(f, 'utf8'))
    }
    const guardada = arg ?? join(salida, 'prueba.txt')
    if (Object.keys(arboles).length < ESCENARIOS.length && existsSync(guardada)) {
      arboles = { ...deSalida(readFileSync(guardada, 'utf8')), ...arboles }
    }
  }
  if (Object.keys(arboles).length < ESCENARIOS.length) {
    console.log('Corriendo claude plugin test mod (tarda un rato)…')
    const r = spawnSync(claudeBin(), ['plugin', 'test', 'mod'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    const texto = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
    mkdirSync(salida, { recursive: true })
    writeFileSync(join(salida, 'prueba.txt'), texto, 'utf8')
    arboles = deSalida(texto)
  }
  return arboles
}

// ---- Traducción a HTML ----
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const px = v => `${Math.round(v * 100) / 100}px`
const num = v => typeof v === 'number'
let excedidos = 0

// Ancho estimado en px (sin navegador): sirve para contar desbordes en consola.
function ancho(n, disponible) {
  if (typeof n === 'string') return n.length * CHAR
  if (!n || typeof n !== 'object') return 0
  const p = n.props ?? {}
  let w
  if (n.type === 'Svg') return num(p.width) ? p.width : disponible
  if (n.type === 'Button') return String(p.label ?? '').length * CHAR + 24
  if (n.type === 'Input' || n.type === 'Select') return Math.min(disponible, 180)
  if (num(p.width)) return p.width * CELDA_X
  if (typeof p.width === 'string' && p.width.endsWith('%')) return (disponible * parseFloat(p.width)) / 100
  const pad = (p.paddingX ?? 0) * 2 * CELDA_X + (p.borderStyle ? 2 : 0) + (p.marginLeft ?? 0) * CELDA_X
  const hijos = (n.children ?? []).map(c => ancho(c, disponible - pad))
  if (n.type === 'Text') {
    const largo = hijos.reduce((a, b) => a + b, 0)
    return p.wrap === 'wrap' ? Math.min(largo, disponible) : largo
  }
  const fila = (p.flexDirection ?? 'row').startsWith('row')
  if (fila && p.flexWrap !== 'wrap') {
    w = hijos.reduce((a, b) => a + b, 0) + Math.max(0, hijos.length - 1) * (p.columnGap ?? 0) * CELDA_X
  } else if (fila) {
    w = Math.min(hijos.reduce((a, b) => a + b, 0), Math.max(...hijos, 0))
    w = Math.max(...hijos, 0)
  } else {
    w = Math.max(...hijos, 0)
  }
  return w + pad
}

function estiloBox(p) {
  const s = ['display:flex', `flex-direction:${p.flexDirection ?? 'row'}`, 'box-sizing:border-box', 'min-width:0']
  if (p.flexWrap) s.push(`flex-wrap:${p.flexWrap}`)
  if (p.alignItems) s.push(`align-items:${p.alignItems === 'flex-start' ? 'flex-start' : p.alignItems === 'flex-end' ? 'flex-end' : p.alignItems}`)
  if (p.justifyContent) s.push(`justify-content:${p.justifyContent}`)
  if (p.flexGrow !== undefined) s.push(`flex-grow:${p.flexGrow}`)
  if (p.flexShrink !== undefined) s.push(`flex-shrink:${p.flexShrink}`)
  if (p.columnGap !== undefined) s.push(`column-gap:${px(p.columnGap * CELDA_X)}`)
  if (p.rowGap !== undefined) s.push(`row-gap:${px(p.rowGap * CELDA_Y)}`)
  if (p.width !== undefined) s.push(`width:${num(p.width) ? px(p.width * CELDA_X) : p.width}`)
  if (p.height !== undefined && num(p.height)) s.push(`height:${px(p.height * CELDA_Y)}`)
  if (p.backgroundColor) s.push(`background:${p.backgroundColor}`)
  if (p.borderStyle) s.push(`border:1px solid ${p.borderColor ?? '#888'}`, 'border-radius:6px')
  const px_ = p.paddingX ?? p.padding ?? 0
  const py_ = p.paddingY ?? p.padding ?? 0
  if (px_ || py_) s.push(`padding:${px(py_ * CELDA_Y)} ${px(px_ * CELDA_X)}`)
  if (p.marginTop) s.push(`margin-top:${px(p.marginTop * CELDA_Y)}`)
  if (p.marginBottom) s.push(`margin-bottom:${px(p.marginBottom * CELDA_Y)}`)
  if (p.marginLeft) s.push(`margin-left:${px(p.marginLeft * CELDA_X)}`)
  if (p.marginX) s.push(`margin-left:${px(p.marginX * CELDA_X)}`, `margin-right:${px(p.marginX * CELDA_X)}`)
  return s.join(';')
}

function html(n, disponible = MARCO) {
  if (n === null || n === undefined) return ''
  if (typeof n !== 'object') return esc(n)
  const p = n.props ?? {}
  const w = ancho(n, disponible)
  const pasa = w > MARCO + 0.5
  if (pasa) excedidos += 1
  const marca = pasa ? ' data-pasa="1"' : ''
  const clave = n.key ? ` data-key="${esc(n.key)}"` : ''
  const hijos = (n.children ?? []).map(c => html(c, num(p.width) ? p.width * CELDA_X : disponible)).join('')
  switch (n.type) {
    case 'Box':
      return `<div${clave}${marca} style="${estiloBox(p)}">${hijos}</div>`
    case 'Text': {
      const s = ['white-space:' + (p.wrap === 'wrap' ? 'normal' : 'pre')]
      if (p.color) s.push(`color:${p.color}`)
      if (p.backgroundColor) s.push(`background:${p.backgroundColor}`)
      if (p.bold) s.push('font-weight:700')
      if (p.italic) s.push('font-style:italic')
      if (p.underline) s.push('text-decoration:underline')
      if (p.dimColor) s.push('opacity:.6')
      const texto = hijos || esc(n.text ?? p.children ?? '')
      return `<span${clave}${marca} style="${s.join(';')}">${texto}</span>`
    }
    case 'Button': {
      const primario = p.variant === 'primary'
      const s = primario
        ? 'background:#F28C28;color:#fff;border:1px solid #C26A10;font-weight:700'
        : 'background:#fff;color:#2B2118;border:1px solid #B9A98A'
      return `<button${clave}${marca} style="${s};font:inherit;padding:2px 8px;border-radius:5px">${esc(p.label ?? n.text ?? '')}</button>`
    }
    case 'Svg': {
      const dim = `${num(p.width) ? `width:${p.width}px;` : ''}${num(p.height) ? `height:${p.height}px;` : ''}`
      return `<div${clave}${marca} title="${esc(p.alt ?? '')}" style="${dim}line-height:0;flex-shrink:0">${p.source ?? ''}</div>`
    }
    case 'Input':
      return `<input${clave}${marca} value="${esc(p.value ?? '')}" placeholder="${esc(p.placeholder ?? '')}" style="font:inherit;min-width:0">`
    case 'Select': {
      const op = (p.options ?? []).map(o => {
        const v = typeof o === 'object' ? (o.value ?? o.label) : o
        const l = typeof o === 'object' ? (o.label ?? o.value) : o
        return `<option${String(v) === String(p.value) ? ' selected' : ''}>${esc(l)}</option>`
      })
      return `<select${clave}${marca} style="font:inherit">${op.join('') || `<option>${esc(p.value ?? '')}</option>`}</select>`
    }
    default:
      return `<div${clave}${marca} style="outline:1px dashed #909">${esc(n.type)}${hijos}</div>`
  }
}

// ---- Armar la página ----
const arboles = cargar()
const faltan = ESCENARIOS.filter(([n]) => !arboles[n]).map(([n]) => n)
if (faltan.length) {
  console.error(`Faltan escenarios: ${faltan.join(', ')}. Corré primero: claude plugin test mod`)
  process.exit(1)
}
const cuentas = []
const marcos = ESCENARIOS.map(([n, titulo]) => {
  excedidos = 0
  const cuerpo = html(arboles[n])
  cuentas.push([n, excedidos])
  return `<section><h2>${esc(titulo)} <small>(${excedidos} pasan del marco, estimado)</small></h2><div class="marco">${cuerpo}</div></section>`
})
const pagina = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Maqueta del panel</title>
<style>
body{margin:16px;background:#ddd;font:13px system-ui,-apple-system,"Segoe UI",sans-serif;color:#2B2118}
main{display:flex;gap:24px;align-items:flex-start;overflow-x:auto}
section{flex:none}
h2{font-size:13px;margin:0 0 6px}h2 small{font-weight:400;color:#666}
.marco{width:${MARCO}px;background:#FBF6EA;font:13px system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 0 0 1px #999}
[data-pasa],[data-pasa-real]{outline:2px solid rgba(255,0,0,.55);outline-offset:-2px;background-image:linear-gradient(rgba(255,0,0,.12),rgba(255,0,0,.12))}
#total{font-weight:700;margin-bottom:8px}
</style>
<div id="total"></div>
<main>${marcos.join('')}</main>
<script>
// Medición real en el navegador: marca lo que se sale del marco de ${MARCO} px.
let real = 0
for (const m of document.querySelectorAll('.marco')) {
  const r0 = m.getBoundingClientRect()
  for (const e of m.querySelectorAll('*')) {
    if (e.closest('svg')) continue
    const r = e.getBoundingClientRect()
    if (r.width > ${MARCO} + 0.5 || r.right > r0.left + ${MARCO} + 0.5) { e.setAttribute('data-pasa-real', '1'); real++ }
  }
}
document.getElementById('total').textContent = real + ' elementos se pasan del marco de ${MARCO} px (medido en el navegador)'
</script></html>`
mkdirSync(salida, { recursive: true })
writeFileSync(join(salida, 'maqueta.html'), pagina, 'utf8')
const total = cuentas.reduce((a, [, c]) => a + c, 0)
console.log(`maqueta.html escrita en ${join(salida, 'maqueta.html')}`)
for (const [n, c] of cuentas) console.log(`  ${n}: ${c} elementos se pasan del marco de ${MARCO} px (estimado)`)
console.log(`Total estimado: ${total}`)
