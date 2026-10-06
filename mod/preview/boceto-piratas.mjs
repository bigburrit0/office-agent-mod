// Boceto 2 de la skin «Piratas» (docs/plan-skin-piratas.md): el arte antes de pasarlo al mod.
// Usa el motor de pixel-piratas.mjs, el loro de loro-piratas.mjs y la escena de escena-piratas.mjs.
// Uso: node mod/preview/boceto-piratas.mjs → mod/tests/salida/boceto-piratas.html

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrir, cuadros, grilla, mezcla, pon } from './pixel-piratas.mjs'
import { EMOCIONES, loro } from './loro-piratas.mjs'
import { EQUIPOS, escenaSvg, pezGrilla, tiburonGrilla } from './escena-piratas.mjs'

// ---- Banderas de equipo: tela que flamea, calavera y el emblema del equipo en su color ----
const EMBLEMAS = {
  base: { nombre: 'huesos cruzados', dibujo: ['B.......B', '.B.....B.', '..B...B..', '.B.....B.', 'B.......B'] },
  'dev-a1': { nombre: 'llaves de código', dibujo: ['.B.....B.', 'B.......B', '.B.....B.', '.........', '..BBBBB..'] },
  research: { nombre: 'catalejos cruzados', dibujo: ['G.......G', '.g.....g.', '..g...g..', '.g.....g.', 'Y.......Y'] },
  datos: { nombre: 'barras que suben', dibujo: ['.......B.', '.....B.B.', '...B.B.B.', '.B.B.B.B.', 'BBBBBBBBB'] },
  librarian: { nombre: 'libro abierto', dibujo: ['.........', '.BBB.BBB.', 'BbbBBbbBB', 'BBBBBBBBB', '....B....'] },
  seguridad: { nombre: 'espadas cruzadas', dibujo: ['s.......s', '.s.....s.', '..s...s..', '.gs...sg.', 'g.......g'] },
  facilities: { nombre: 'llaves cruzadas', dibujo: ['gg.....gg', 'gg.....gg', '..g...g..', '.g.....g.', 'g.......g'] },
}

function banderaGrilla(equipo, color, oscuro, f) {
  const plana = grilla(22, 16)
  // Tela con borde deshilachado y un agujero de bala.
  for (let y = 0; y < 14; y++) for (let x = 0; x < 20; x++) {
    if (x === 19 && (y % 4 === 1)) continue
    if (x === 18 && y === 9) continue
    pon(plana, x, y, y === 0 || y === 13 ? '#0b0714' : '#160f24')
  }
  // Calavera.
  const cal = ['.WWWWW.', 'WWWWWWW', 'WkkWkkW', 'WWWvWWW', '.WWWWW.', '.WkWkW.']
  cal.forEach((r, j) => [...r].forEach((c, i) => pon(plana, 6 + i, 1 + j, { W: '#fff6e0', k: '#160f24', v: '#b89e88' }[c])))
  const em = EMBLEMAS[equipo] ?? EMBLEMAS.base
  const col = { B: color, b: oscuro, G: '#b8771a', g: '#f2b632', Y: '#fff3a8', s: '#d8e0ee' }
  em.dibujo.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') pon(plana, 5 + i, 8 + j, col[c]) }))
  // Flamea: cada columna baja un poco según una onda, y los pliegues se aclaran.
  const g = grilla(26, 22)
  for (let y = 2; y < 22; y++) { pon(g, 1, y, '#74492a'); pon(g, 2, y, '#4b2e1b') }
  pon(g, 1, 1, '#f2b632'); pon(g, 2, 1, '#f2b632'); pon(g, 1, 0, '#fff3a8')
  for (let x = 0; x < 20; x++) {
    const fase = x / 3.2 + f * 1.7
    const off = Math.round(Math.sin(fase) * (x / 9))
    const luz = Math.cos(fase) > 0.55
    for (let y = 0; y < 16; y++) {
      const c = plana[y][x]
      if (!c) continue
      pon(g, 3 + x, 2 + y + off, luz && c === '#160f24' ? '#2b2142' : luz ? mezcla(c, '#ffffff', 0.12) : c)
    }
  }
  return g
}

function banderaSvg(equipo, color, oscuro, escala = 3) {
  return abrir(26 * escala, 22 * escala, cuadros([[banderaGrilla(equipo, color, oscuro, 0), 0.45], [banderaGrilla(equipo, color, oscuro, 1), 0.45]], escala), `Bandera del equipo ${equipo}`)
}

// ---- Página ----
const loroSvg = (emocion, escala) =>
  abrir(42 * escala, 34 * escala, cuadros(EMOCIONES[emocion].cuadros.map(([o, d]) => [loro(o), d]), escala), `Loro: ${EMOCIONES[emocion].alt}`)

const NOMBRES = {
  vigia: 'Vigía (parpadea, mira de reojo)', risa: 'Muerto de risa', panico: 'Pánico', dormido: 'Dormido',
  sospecha: 'Sospecha', grito: '¡Al abordaje!', hambre: 'Hambre (sueña con una galleta)', guino: 'Guiño (levanta el parche)',
}
const PECES = {
  'dev-a1': 'programa en su laptop', research: 'mira con el catalejo', datos: 'lleva el mapa de barras',
  librarian: 'lee con anteojos', seguridad: 'patrulla con tricornio', facilities: 'cuida las llaves',
}
const pezSvg = (eq, escala = 4) => {
  const [c, d, prop] = EQUIPOS[eq]
  return abrir(24 * escala, 16 * escala, cuadros([[pezGrilla(c, d, prop, 0), 0.32], [pezGrilla(c, d, prop, 1), 0.32]], escala), `Pez del equipo ${eq}`)
}
const tiburon = abrir(30 * 4, 13 * 4, cuadros([[tiburonGrilla(), 1]], 4), 'Tiburón')

const BANDERAS = { base: ['#8a93a0', '#555d69'], ...Object.fromEntries(Object.entries(EQUIPOS).map(([k, v]) => [k, [v[0], v[1]]])) }

const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boceto skin Piratas</title>
<style>
:root{--noche:#120b1f;--noche2:#1d1238;--borde:#463868;--turquesa:#21e6c1;--magenta:#ff2e88;--hueso:#fff6e0;--suave:#b9a98a}
*{box-sizing:border-box}
body{margin:0;background:var(--noche);color:var(--hueso);font:15px/1.5 system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:24px 16px 48px;display:grid;gap:22px}
h1{font:700 24px ui-monospace,monospace;color:var(--turquesa);margin:0}
.lead{color:var(--suave);margin:4px 0 0;max-width:64ch}
h2{font:700 13px ui-monospace,monospace;color:var(--magenta);margin:0 0 12px;text-transform:uppercase;letter-spacing:.08em}
section{background:var(--noche2);border:2px solid var(--borde);border-radius:4px;padding:16px}
.grilla{display:flex;flex-wrap:wrap;gap:18px 22px;align-items:end}
figure{margin:0;display:grid;gap:6px;justify-items:center;font-size:13px;color:var(--suave);text-align:center;max-width:180px}
svg{image-rendering:pixelated;max-width:100%;height:auto}
.panel{width:378px;max-width:100%;border:2px solid var(--turquesa);background:var(--noche)}
.panel svg{display:block}
.burbuja{margin:6px;padding:6px 10px;background:#2a2140;border:1px solid var(--magenta);border-radius:4px;color:var(--hueso)}
.botones{display:flex;gap:8px;padding:0 6px 8px}
.btn{padding:3px 10px;border:1px solid var(--turquesa);color:var(--turquesa);border-radius:3px;font-size:14px}
.btn.p{background:var(--magenta);border-color:var(--magenta);color:var(--noche);font-weight:700}
details{color:var(--suave)}
summary{cursor:pointer;color:var(--hueso)}
ul{margin:8px 0 0;padding-left:20px}
</style>
<main>
<header>
<h1>Skin «Piratas» · boceto 2</h1>
<p class="lead">Pixel art dibujado a mano, con luz de luna desde arriba a la izquierda y un borde neón de los faroles. Todo se mueve: abrilo en el navegador para ver las animaciones.</p>
</header>

<section>
<h2>El panel (378 px)</h2>
<div class="panel">${escenaSvg({ emocion: 'vigia' })}
<p class="burbuja">¡Arrr! 6 marineros nadando y un tiburón rondando el ancla. Nadie toca mi galleta.</p>
<div class="botones"><span class="btn p">Guardar</span><span class="btn">Cancelar</span></div></div>
</section>

<section>
<h2>El capitán (lienzo del robot, escala 4)</h2>
<div class="grilla">${Object.keys(EMOCIONES).map(k => `<figure>${loroSvg(k, 4)}<figcaption>${NOMBRES[k]}</figcaption></figure>`).join('')}</div>
</section>

<section>
<h2>La tripulación (un pez por equipo)</h2>
<div class="grilla">${Object.keys(EQUIPOS).map(eq => `<figure>${pezSvg(eq)}<figcaption><b>${eq}</b><br>${PECES[eq]}</figcaption></figure>`).join('')}
<figure>${tiburon}<figcaption><b>el tiburón</b><br>aparece cuando un subagente falla</figcaption></figure></div>
</section>

<section>
<h2>Banderas de equipo (en vez de las placas)</h2>
<div class="grilla">${Object.entries(BANDERAS).map(([eq, [c, d]]) => `<figure>${banderaSvg(eq, c, d)}<figcaption><b>${eq}</b><br>${(EMBLEMAS[eq] ?? EMBLEMAS.base).nombre}</figcaption></figure>`).join('')}</div>
</section>

<section>
<h2>Huevos de pascua</h2>
<details><summary>Spoiler: qué buscar en la escena</summary>
<ul>
<li>El loro levanta el parche para guiñar: el ojo de abajo está perfecto.</li>
<li>Un cangrejito en la punta de la percha saluda con la pinza.</li>
<li>El sombrero tiene un agujero de bala por donde se ve el cielo.</li>
<li>La luna tiene cara, y cada tanto guiña.</li>
<li>Hay una constelación con forma de ancla.</li>
<li>El gato del barco mira por el ojo de buey del medio y parpadea.</li>
<li>Un patito de goma flota en el agua.</li>
<li>El tiburón tiene un diente de oro.</li>
<li>Un pulpito con tricornio se asoma del cofre del tesoro.</li>
<li>Cada medio minuto, un tentáculo del kraken sale de la arena y vuelve a esconderse.</li>
<li>Hay una botella con un mensaje enterrada en la arena.</li>
<li>Pasa una estrella fugaz cada 19 segundos.</li>
<li>El barco se llama «La Galleta».</li>
</ul></details>
</section>
</main>`

const salida = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'salida')
mkdirSync(salida, { recursive: true })
writeFileSync(join(salida, 'boceto-piratas.html'), html, 'utf8')
console.log('OK', join(salida, 'boceto-piratas.html'), `${Math.round(html.length / 1024)} KB`)
