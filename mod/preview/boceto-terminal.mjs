// Boceto de la skin «Terminal retro» (docs/plan-skin-terminal.md): el arte antes de pasarlo al mod.
// Usa el motor de pixel-terminal.mjs, el robot de robot-terminal.mjs y la escena de escena-terminal.mjs.
// Uso: node mod/preview/boceto-terminal.mjs → mod/tests/salida/boceto-terminal.html (abrirlo en el navegador: todo se mueve).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abrir, cuadros } from './pixel-terminal.mjs'
import { ALT, ALTO, ANCHO, cuadrosDe } from './robot-terminal.mjs'
import { EQUIPOS, S, celdaSvg, escritorioSvg, monitorSvg, tecladoSvg, usoSvg } from './escena-terminal.mjs'

const robotSvg = (emocion, escala = 3, progreso = 58) =>
  abrir(ANCHO * escala, ALTO * escala, cuadros(cuadrosDe(emocion, progreso), escala, { vacio: '#020803' }), `Robot ${ALT[emocion] ?? emocion}`)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const barra = (pct, n = 10) => '▕' + '█'.repeat(Math.round(pct / 100 * n)) + '░'.repeat(n - Math.round(pct / 100 * n)) + '▏'

const TRABAJANDO = [
  { equipo: 'dev-a1', fase: 'juega', etiqueta: 'T-9' },
  { equipo: 'research', fase: 'juega', etiqueta: 'R-2' },
  { equipo: 'mantenimiento', fase: 'juega', etiqueta: 'M-3' },
]

// ---- El día del robot (la barra de la hora cambia el monitor y la burbuja) ----
const DIA = [
  { hora: '07:58', emocion: 'arranque', titulo: 'Arranque', frase: 'Cargando… RAM OK. ¡Buen día! Ayer el proyecto quedó en 58 %: faltan 5 tarjetas.' },
  { hora: '08:40', emocion: 'manana', titulo: 'Café', frase: 'Primero el café, después los agentes. Hoy toca T-10. Proyecto ' + barra(58) + ' 58 %.' },
  { hora: '10:15', emocion: 'tipea', titulo: 'A full', celdas: TRABAJANDO, frase: `Laburando con 3 agentes: T-9, R-2, M-3. Proyecto ${barra(58)} 58 %: faltan 5 de 12 tarjetas (42 %). A este ritmo, ~1 h 10 min.` },
  { hora: '12:50', emocion: 'hambre', titulo: 'Chivito', frase: 'Pausa para el chivito. El proyecto no avanza solo: sigue en 58 %.' },
  { hora: '14:20', emocion: 'siesta', titulo: 'Siesta', frase: 'Cabeceo… ¿alguien lanzó un agente? No. Sigo en 58 %, sin culpa.' },
  { hora: '16:30', emocion: 'mate', titulo: 'Mate', frase: 'Mate y bizcochos. Van 7 de 12 tarjetas. ¿Metemos una más antes de las seis?' },
  { hora: '17:45', emocion: 'casa', titulo: 'Bueno, me voy', frase: 'Bueno, me voy. Hoy cerramos 2 tarjetas: de 42 % a 58 %. Mañana, T-10.' },
  { hora: '18:00', emocion: 'apagado', titulo: 'Apagado', apagado: true, frase: '[apagado] Fin del turno. Quedó en 58 %. El robot vuelve mañana a las 8.' },
]

// ---- Los 20 memes: qué los dispara y qué dice ----
const MEMES = [
  ['estoEstaBien', 'This is fine', 'Fallan 2 o más agentes y los demás siguen corriendo', 'Todo bien. Todo perfecto. (Fallaron T-4 y T-6.)'],
  ['sorpresa', 'Pikachu sorprendido', 'Falla un agente que llevaba menos de 30 segundos', '¿Falló T-9? ¿Ya? Si recién arrancaba.'],
  ['distraido', 'Novio distraído', 'Llega un agente nuevo mientras otro lleva más de 10 minutos', 'Perdón T-2, llegó T-11 y tiene cosas nuevas.'],
  ['drake', 'Drake: no / sí', 'Cancelás los cambios y después guardás', 'Cancelar: no. Guardar: sí. Así me gusta.'],
  ['successKid', 'Success Kid', 'Una tarjeta pasa la aceptación al primer intento', 'T-9 pasó la aceptación al primer intento. Proyecto: 66 %.'],
  ['stonks', 'Stonks', 'Sube el % del proyecto', 'Stonks: de 58 % a 66 %. Faltan 4 tarjetas.'],
  ['notStonks', 'Not stonks', 'Baja el % (se reabre una tarea)', 'Not stonks: se reabrió T-5. Volvemos a 50 %.'],
  ['multitarea', 'Galaxy brain', '4 o 5 agentes a la vez', 'Cuatro agentes a la vez. Mi cerebro brilla.'],
  ['doge', 'Doge', '6 o más agentes a la vez', 'Wow. Muy agentes. Tan paralelo.'],
  ['harold', 'Hide the Pain Harold', 'Las 5 horas pasan el 80 %', 'Todo bárbaro: queda 14 % de las 5 horas. (Sonrío.)'],
  ['dosBotones', 'Dos botones', 'Hay cambios sin guardar en Editar', 'Guardar (G) o Cancelar (C). No me hagas elegir.'],
  ['paloma', '¿Esto es una paloma?', 'El esquema marca un aviso ⚠ en el agente', '¿Esto es un bug? No: es un aviso del esquema (2).'],
  ['rollSafe', 'Roll Safe', 'Ocio: un rato sin agentes', 'Ningún agente puede fallar si no lanzás ninguno.'],
  ['panico', 'Panik', 'Fallan varios a la vez', '¡PANIK! Fallaron T-4, T-6 y T-7.'],
  ['alivio', 'Kalm', 'Después de una falla, algo sale bien', 'Kalm. T-7 salió bien. Respiro.'],
  ['tipea', 'Bongo Cat', '2 o 3 agentes tipeando', 'Tecleo con los bongós: 2 agentes en marcha.'],
  ['concentrado', 'Hackerman', 'Un solo agente lleva más de 3 minutos', 'T-9 lleva 6 min. Modo Hackerman: no me hablen.'],
  ['casa', 'Bueno, me voy', 'Son las 17:30', 'Bueno, me voy. (Sí, en serio.)'],
  ['otraVez', 'Ah, otra vez', 'Se relanza una tarjeta que había fallado, o es lunes a la mañana', 'Ah, otra vez T-4. Vamos.'],
  ['masDe9000', '¡Más de 9000!', 'Un agente pasa los 9000 tokens de salida', '¡T-9 escribió más de 9000 tokens!'],
  ['orgullo', 'Deal with it', 'Guardás un agente, o el proyecto llega al 100 %', 'Guardado. Lentes puestos.'],
  ['rickroll', 'Rickroll', 'Huevo de pascua: el primer día de cada mes, a las 10:00', 'Te iba a decir el % del proyecto, pero bailemos.'],
]

const BASE = ['saluda', 'aburrido', 'pensando', 'caceria', 'sospecha', 'contento', 'festeja', 'aplaude', 'frustrado', 'ruge', 'chispazo', 'molesto', 'bufido', 'dormido', 'bostezo', 'estira', 'riega', 'diario', 'solitario', 'silba', 'guina']

const HUEVOS = [
  ['El cursor parpadea en Morse', 'Dice «HOLA» (.... --- .-.. .-), en loop.'],
  ['Un bichito cruza la pantalla', 'Cada 37 s. Es literalmente un bug.'],
  ['El conejo blanco', 'Cada 89 s salta por la barra de estado. Seguilo.'],
  ['Lluvia de código', 'Cada 61 s, un segundo y medio de ceros y unos.'],
  ['El patito de goma', 'Arriba del monitor, para debuguear hablando. Dice «CUAC» cada 23 s, y cuando algo falla.'],
  ['El post-it', 'CLAVE: 1234. Clásico.'],
  ['Pantalla quemada', 'Un «READY.» fantasma, de tanto usarla.'],
  ['TERMINAL 9000', 'La marca del monitor.'],
  ['El botón TURBO', 'Prendido cuando hay animación; «Quieto» lo apaga.'],
  ['La luz del disco', 'Titila con la actividad de los agentes.'],
  ['El alma del robot', 'Apagado, cada tanto se le escapa el alma por la antena.'],
  ['13:37', 'Modo leet: la barra dice «H4CK3R M0D3».'],
  ['16:04', '«404: robot no encontrado». La pantalla queda vacía un minuto.'],
  ['Viernes desde las 16', 'Una bola de disco en la pantalla.'],
  ['100 %', 'El robot deja un arcoíris al estilo Nyan Cat.'],
  ['Fechas', '31/10 cabeza de calabaza, diciembre gorro navideño, 25/8 sol de mayo, día 256 del año (Día del Programador) festeja con «256».'],
  ['El cubo mágico', 'En el escritorio, armado. Siempre armado.'],
  ['El mate y el chivito', 'El mate está en el escritorio y a las 16:30 en la mano del robot. El almuerzo es un chivito, obvio.'],
]

const PREGUNTAS = [
  ['Después de las 18, si hay agentes corriendo', 'Propuesta: «modo zombi». Sigue con cara de muerto pero tipea, y la burbuja dice «Horas extra…». ¿O preferís que se despierte normal?'],
  ['Sábados y domingos', 'Propuesta: apagado todo el día, igual que después de las 18. ¿Sí?'],
  ['Las horas', 'Propuesta: arranque 8:00, café hasta las 10, chivito 12:30, siesta 14:00, mate 16:30, «me voy» 17:30, apagado 18:00. ¿Las ajustamos?'],
  ['De dónde sale el % del proyecto', 'Propuesta, en este orden: 1) las tareas de la sesión (las que va tachando Claude), 2) las tarjetas de la carpeta del proyecto (tarjetas/*.md, con su «estado:»). Si no hay ninguna de las dos, el robot no inventa un número. ¿Agregamos otra fuente?'],
  ['En la terminal (sin dibujos)', 'Hoy en la terminal el panel es solo texto. ¿Querés que ahí el robot aparezca en ASCII, en verde?'],
  ['El monitor', '¿Beige de los 90 (como el boceto) o gris oscuro de los 80?'],
]

// ---- Página ----
const panelSubagentes = (o = {}) => `
<div class="panel">
  <div class="tabs"><span class="tab on">Subagentes</span><span class="tab">Equipos</span><span class="tab">Quieto</span></div>
  ${monitorSvg({ emocion: o.emocion ?? 'tipea', celdas: o.celdas ?? TRABAJANDO, hora: o.hora ?? '10:15', apagado: o.apagado, estado: o.apagado ? '' : '[3 AG] [58%] T-9', progreso: 58 })}
  <p class="burbuja"><span class="pr">robot&gt;</span> <span data-frase>${esc(o.frase ?? DIA[2].frase)}</span></p>
  ${tecladoSvg(378, { tipeando: true })}
  ${usoSvg(378, { contexto: 34, cincoHoras: 62, semana: 85, tokens: '1.2M', costo: '3.40', uptime: '2H 14M', carga: '3.00' })}
  ${escritorioSvg(378)}
</div>`

const tarjetaRobot = (emocion, titulo, sub, frase) => `
<figure class="ficha">
  <div class="lienzo">${robotSvg(emocion)}</div>
  <figcaption><b>${esc(titulo)}</b>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}${frase ? `<span class="frase">«${esc(frase)}»</span>` : ''}</figcaption>
</figure>`

const monitoresDia = DIA.map(d => monitorSvg({ emocion: d.emocion, celdas: d.celdas ?? [], hora: d.hora, apagado: d.apagado, estado: d.celdas ? '[3 AG] [58%] T-9' : '[0 AG] [58%] T-10', progreso: 58 }))

const html = `<title>Terminal retro</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=VT323&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>
/* Una sola pantalla de fósforo: fondo negro, texto verde, acentos solo para lo que tiene categoría. */
:root{--fondo:#020803;--fondo2:#061a0c;--linea:#0f3a1c;--texto:#b9f5c4;--suave:#6fb882;--fosforo:#5ef27f;--brillo:#c8ffd4;--ambar:#ffb43a;--rojo:#ff4f4f;
--display:"VT323",ui-monospace,monospace;--mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--texto);font:14px/1.55 var(--mono)}
main{max-width:1000px;margin:0 auto;padding-inline:16px;padding-block:28px 64px;display:grid;gap:40px}
h1,h2{font-family:var(--display);font-weight:400;color:var(--fosforo);margin:0;text-wrap:balance;text-shadow:0 0 8px rgba(94,242,127,.45)}
h1{font-size:56px;line-height:1}
h2{font-size:34px;line-height:1.1}
h2::before{content:"> ";color:var(--suave)}
p{margin:0;max-width:68ch}
.lead{color:var(--suave)}
.eti{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--suave)}
section{display:grid;gap:16px}
.hero{display:grid;grid-template-columns:378px minmax(0,1fr);gap:28px;align-items:start}
@media (max-width:760px){.hero{grid-template-columns:minmax(0,1fr)}}
.panel{width:378px;max-width:100%;display:grid;gap:0;background:#000}
.panel svg{display:block;max-width:100%;height:auto}
.tabs{display:flex;gap:2px;padding:4px;background:#000;border-bottom:1px solid var(--linea)}
.tab{font:12px var(--mono);color:var(--suave);padding:2px 8px;border:1px solid var(--linea)}
.tab.on{color:#000;background:var(--fosforo);border-color:var(--fosforo)}
.burbuja{margin:6px 4px;background:#000;border:2px solid #2fb34f;border-radius:6px;padding:6px 10px;color:var(--texto);font:13px/1.45 var(--mono);max-width:none}
.pr{color:var(--fosforo);font-weight:600}
.pedido{display:grid;gap:10px}
.pedido dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:4px 14px;margin:0}
.pedido dt{color:var(--suave)}
.pedido dd{margin:0}
.reloj{display:grid;gap:12px;grid-template-columns:378px minmax(0,1fr);align-items:start}
@media (max-width:760px){.reloj{grid-template-columns:minmax(0,1fr)}}
.reloj input{width:100%;accent-color:var(--fosforo)}
.horas{display:flex;justify-content:space-between;font-size:12px;color:var(--suave);font-variant-numeric:tabular-nums}
.horas button{all:unset;cursor:pointer;padding:2px 4px}
.horas button[aria-pressed=true]{color:#000;background:var(--fosforo)}
.horas button:focus-visible{outline:2px solid var(--brillo)}
.pantallas>div[hidden]{display:none}
.pantallas svg{display:block;max-width:100%;height:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.ficha{margin:0;display:grid;gap:6px;align-content:start;background:var(--fondo2);border:1px solid var(--linea);padding:8px}
.ficha .lienzo{background:#020803;display:grid;place-items:center}
.ficha svg{max-width:100%;height:auto}
.ficha figcaption{display:grid;gap:2px;font-size:12.5px}
.ficha b{color:var(--brillo);font-weight:600}
.sub{color:var(--suave)}
.frase{color:var(--texto);font-style:italic}
.equipos{display:grid;gap:4px;overflow-x:auto}
.equipos table{border-collapse:collapse;font-size:12px}
.equipos th{font-weight:400;color:var(--suave);text-align:left;padding:4px 8px;white-space:nowrap}
.equipos td{padding:2px 4px;background:#020803;border:1px solid var(--linea)}
.equipos td svg{display:block}
.chip{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:middle}
.estado{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))}
.caso{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center;background:var(--fondo2);border:1px solid var(--linea);padding:8px}
.caso p{font-size:12.5px}
.caso .burbuja{margin:0}
ol.fuentes{margin:0;padding-left:22px;display:grid;gap:6px;max-width:72ch}
code{font-family:var(--mono);color:var(--brillo);background:#0a2412;padding:0 4px}
.huevos{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px 18px;margin:0;padding:0;list-style:none}
.huevos li{display:grid;gap:2px;align-content:start;border-left:2px solid var(--linea);padding-left:10px}
.huevos b{color:var(--brillo);font-weight:600}
.preguntas{display:grid;gap:10px;margin:0;padding-left:22px;max-width:76ch}
.preguntas b{color:var(--ambar);font-weight:600}
.otros{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.otros figure{margin:0;display:grid;gap:6px}
.otros svg{display:block;max-width:100%;height:auto}
.otros figcaption{font-size:12.5px;color:var(--suave)}
@media (prefers-reduced-motion:reduce){.nota-mov{display:block}}
.nota-mov{display:none;color:var(--ambar);font-size:12px}
</style>
<main>
<header class="pedido">
  <span class="eti">Boceto · skin nueva · rama skin-nueva</span>
  <h1>Terminal retro</h1>
  <p class="lead">El panel /oficina pasa a ser un monitor de los 90 con la pantalla de fósforo verde. Adentro vive el robot, de frente, y los subagentes son íconos del color de su equipo. Todo se mueve; el botón «Quieto» lo frena.</p>
  <p class="nota-mov">Tu sistema pide menos movimiento: en el mod, «Quieto» deja todo fijo.</p>
</header>

<section class="hero">
  ${panelSubagentes()}
  <div class="pedido">
    <h2>Lo que pediste</h2>
    <dl>
      <dt>Nombre</dt><dd>Terminal retro</dd>
      <dt>Mundo</dt><dd>Terminal verde de código. El marco es un monitor de los 80-90 y el robot vive adentro.</dd>
      <dt>Dibujo</dt><dd>16 bits: rampas de 7 verdes, brillo de fósforo alrededor de lo encendido, líneas de barrido y textura tramada.</dd>
      <dt>Colores</dt><dd>Negro y verde. Color solo para lo que se clasifica: equipos, fallas (rojo) y avisos (ámbar).</dd>
      <dt>Mascota</dt><dd>Robot de frente, simpático y gracioso, con 20 reacciones de memes.</dd>
      <dt>El día</dt><dd>Café a la mañana, chivito, siesta, mate, «me voy» y, desde las 18, apagado con cara de muerto.</dd>
      <dt>Agentes</dt><dd>Íconos, uno por equipo.</dd>
      <dt>Vistas</dt><dd>Subagentes, Equipos y Editar. Reemplaza a la oficina.</dd>
      <dt>Lo nuevo</dt><dd>La burbuja dice el estado del proyecto: % hecho, cuánto falta y a qué ritmo. La pantallita del pecho del robot muestra la misma barra.</dd>
    </dl>
  </div>
</section>

<section>
  <h2>El día del robot</h2>
  <p class="lead">Mové la hora. Cambian el robot, la luz del monitor y lo que dice.</p>
  <div class="reloj">
    <div class="pantallas">${monitoresDia.map((m, i) => `<div data-i="${i}"${i === 2 ? '' : ' hidden'}>${m}</div>`).join('')}
      <p class="burbuja"><span class="pr">robot&gt;</span> <span id="frase-dia">${esc(DIA[2].frase)}</span></p>
    </div>
    <div>
      <label for="hora" class="eti">Hora</label>
      <input id="hora" type="range" min="0" max="${DIA.length - 1}" value="2" step="1">
      <div class="horas" role="group" aria-label="Momentos del día">${DIA.map((d, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 2}">${d.hora}</button>`).join('')}</div>
      <p id="titulo-dia" style="margin-top:12px;font-family:var(--display);font-size:30px;color:var(--fosforo)">${DIA[2].titulo}</p>
      <p class="lead">Desde las 18 no se trabaja: el fósforo se apaga, la luz del monitor pasa a ámbar y el robot queda con cara de muerto (ojos en X, lengua afuera, antena caída). Cada tanto se le escapa el alma.</p>
    </div>
  </div>
</section>

<section>
  <h2>Estado del proyecto</h2>
  <p class="lead">La mascota dice cuánto va y cuánto falta. El número sale de algo que existe; si no hay de dónde sacarlo, no lo inventa.</p>
  <div class="estado">
    <div class="caso">${robotSvg('stonks', 2, 66)}<p class="burbuja"><span class="pr">robot&gt;</span> Stonks: de 58 % a 66 %. ${barra(66)} Faltan 4 de 12 tarjetas (34 %). A este ritmo, ~55 min.</p></div>
    <div class="caso">${robotSvg('sospecha', 2, 58)}<p class="burbuja"><span class="pr">robot&gt;</span> 58 %, pero T-7 está frenada y espera por vos. Faltan 5.</p></div>
    <div class="caso">${robotSvg('orgullo', 2, 100)}<p class="burbuja"><span class="pr">robot&gt;</span> ¡100 %! 12 de 12. Lentes puestos.</p></div>
    <div class="caso">${robotSvg('pensando', 2, 0)}<p class="burbuja"><span class="pr">robot&gt;</span> No veo tareas ni tarjetas de este proyecto. Cuando haya, te digo cuánto falta.</p></div>
  </div>
  <p>De dónde sale el número, en este orden:</p>
  <ol class="fuentes">
    <li><b>Las tareas de la sesión</b>: la lista que Claude va tachando (TaskCreate, TaskUpdate y TodoWrite). % = hechas ÷ total.</li>
    <li><b>Las tarjetas del proyecto</b>: <code>tarjetas/*.md</code> en la carpeta de la sesión, con su línea <code>estado:</code> (propuesta, aprobada, en curso, hecha o frenada), como dice el método del kit.</li>
    <li><b>El ritmo</b>: cuánto tardaron en cerrarse las últimas tareas de esta sesión. Con menos de 2 cerradas no hay estimación.</li>
  </ol>
</section>

<section>
  <h2>20 memes, actuados por el robot</h2>
  <p class="lead">No se copia ninguna imagen: el robot hace el gesto y la burbuja lo explica. Cada uno tiene su momento.</p>
  <div class="grid">${MEMES.map(([e, nombre, cuando, frase]) => tarjetaRobot(e, nombre, cuando, frase)).join('')}</div>
</section>

<section>
  <h2>Los agentes son íconos</h2>
  <p class="lead">Uno por equipo, en su color. Entran dibujándose línea por línea, trabajan con un detalle propio y un giro [|/-], al terminar dicen [OK] y se apagan como un tubo de rayos catódicos. Si fallan, se rompen en rojo y queda la calavera de SEGV.</p>
  <div class="equipos"><table>
    <thead><tr><th>Equipo</th><th>Entra</th><th>Trabaja</th><th>Termina</th><th>Falla</th></tr></thead>
    <tbody>${Object.entries(EQUIPOS).map(([eq, [color, icono]]) => `<tr><th><span class="chip" style="background:${color}"></span>${eq}<br><span class="sub">${icono}</span></th>${['entra', 'juega', 'sale', 'explota'].map(f => `<td>${abrir(22 * S, 24 * S, celdaSvg(eq, f, 'T-' + (eq.length + 3)))}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>
</section>

<section>
  <h2>Equipos y Editar</h2>
  <div class="otros">
    <figure>${monitorSvg({ emocion: 'guina', hora: '11:02', estado: '[12 EQUIPOS] [2 AVISOS]', carpetas: Object.keys(EQUIPOS).map((eq, i) => ({ equipo: eq, nombre: eq.replace('dev-', 'D-'), aviso: i === 3 || i === 7 })) })}
      <figcaption>Equipos: el robot al lado de un «ls» con una carpeta por equipo, del color del equipo. El triángulo ámbar marca avisos del esquema.</figcaption></figure>
    <figure>${monitorSvg({ emocion: 'dosBotones', hora: '11:20', estado: '-- INSERTAR -- SIN GUARDAR', prompt: '$ VI IMPLEM.MD', lineas: ['---', 'NAME: IMPLEM', 'MODEL: SONNET', 'EFFORT: MEDIUM', '---', '## ROL', 'ESCRIBE CODIGO', 'CON CRITERIO', '## LIMITES', 'SOLO SUS ARCH'] })}
      <figcaption>Editar: el archivo del agente abierto en el editor. Con cambios sin guardar, el robot hace «Dos botones».</figcaption></figure>
  </div>
</section>

<section>
  <h2>Las emociones de siempre</h2>
  <p class="lead">Las 31 de la oficina siguen, con su versión de terminal. Algunas ya son memes (Bongo Cat, Hackerman, Panik, Kalm, Deal with it).</p>
  <div class="grid">${BASE.map(e => tarjetaRobot(e, e, ALT[e])).join('')}</div>
</section>

<section>
  <h2>Huevos de pascua</h2>
  <ul class="huevos">${HUEVOS.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>
</section>

<section>
  <h2>Antes de programar</h2>
  <p class="lead">Seis decisiones. Cada una trae una propuesta; si te sirve, no hace falta cambiar nada.</p>
  <ol class="preguntas">${PREGUNTAS.map(([t, d]) => `<li><b>${esc(t)}.</b> ${esc(d)}</li>`).join('')}</ol>
</section>
</main>
<script>
(() => {
  const frases = ${JSON.stringify(DIA.map(d => d.frase))};
  const titulos = ${JSON.stringify(DIA.map(d => d.titulo))};
  const rango = document.getElementById('hora');
  const botones = [...document.querySelectorAll('.horas button')];
  const pantallas = [...document.querySelectorAll('.pantallas > div[data-i]')];
  const mostrar = i => {
    pantallas.forEach(p => { p.hidden = Number(p.dataset.i) !== i });
    botones.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)));
    document.getElementById('frase-dia').textContent = frases[i];
    document.getElementById('titulo-dia').textContent = titulos[i];
    rango.value = String(i);
  };
  rango.addEventListener('input', () => mostrar(Number(rango.value)));
  botones.forEach(b => b.addEventListener('click', () => mostrar(Number(b.dataset.i))));
})();
</script>
`

const salida = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'salida', 'boceto-terminal.html')
mkdirSync(dirname(salida), { recursive: true })
writeFileSync(salida, html)
console.log(`OK ${salida} (${Math.round(html.length / 1024)} KB)`)
