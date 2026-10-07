# Plan: skin «Terminal retro»

**Fecha:** 07/10/2026. **Rama:** `skin-nueva` (salió de `master` en `aa8b16d`).
**Fuente:** el formulario «Skin nueva» que completó Nimai (respuestas guardadas el 07/10/2026, 00:20) y su pedido en el chat: «Quiero algo con muchos detalles y animación. Easter eggs en lo posible. La mascota tiene que poder también en su texto decir el estado del proyecto, cuánto % falta para su finalización, etc.»
**Boceto:** https://claude.ai/artifact/XKVjFnBwTUCBwYjjeh44hw (privado; se abre con la cuenta de Nimai). También se arma local: `node mod/preview/boceto-terminal.mjs` → `mod/tests/salida/boceto-terminal.html`. Abrirlo en el navegador: todo se mueve.

**Estado: programada (07/10/2026).** Nimai aprobó el plan («agregá todas las recomendaciones»); las decisiones están en la sección 9 y el avance en la sección 11. Falta su prueba en la app.

## 1. Lo que pidió Nimai

| Tema | Respuesta |
|---|---|
| Nombre | Terminal retro |
| Mundo | Terminal verde de código retro. El marco es un monitor de los 80-90 y el robot vive dentro de la terminal |
| Dibujo | 16 bits |
| Colores | Negro y verde. Acentos de color solo para lo que se puede clasificar, cada cosa con su color |
| Fondo | Negro: es una terminal de código |
| Mascota | Un robot visto de frente, simpático y gracioso, con reacciones basadas en los 20 memes más conocidos |
| Agentes | Íconos |
| Animación | Mucha más durante el día: a la mañana toma café, etc. Después de las 18 queda apagado, con cara de muerto, porque a esa hora no se trabaja. Todo animado, con el límite de que es una terminal de consola |
| Vistas | Subagentes, Equipos y Editar |
| Convivencia | Reemplaza a la oficina (como «Piratas», vive en su rama) |
| Pedido del chat | Muchos detalles, animación, huevos de pascua y que la mascota diga el estado del proyecto: % hecho y cuánto falta |

No respondió: textos que cambian, referencias, qué evitar.

## 2. Cómo se hace

Igual que «Piratas»: el mod ya separa el dibujo de la lógica. Cada pieza es una función pura que devuelve un SVG (`hooks/arte-*.ts`, `hooks/pixel.ts`) y los colores salen de `hooks/tema.ts`. La skin reemplaza esas funciones **con el mismo contrato** (mismos nombres, parámetros y lienzo), así `register.tsx` cambia poco y las pruebas de lógica siguen sirviendo.

Lo que sí es nuevo:
- **El estado del proyecto** (sección 4): un módulo puro nuevo, un estado nuevo y un gancho a las herramientas de tareas.
- **El día del robot** (sección 5): más franjas en `emociones.ts` y el modo apagado, que gana a casi todo.
- **Los memes** (sección 6): 13 disparadores nuevos en `emociones.ts`, más el Rickroll por fecha.

**Límite de «terminal de consola»:** todo lo que pasa en la pantalla se ve como fósforo verde (rampas de 7 verdes, brillo alrededor de lo encendido, líneas de barrido). Los acentos (rojo de falla, ámbar de aviso, color de cada equipo) son lo único que no es verde. Afuera de la pantalla está el mundo físico: el plástico beige del monitor, el patito, el post-it, el escritorio.

**Peso** (el panel limita cada SVG a 131.072 caracteres, `SVG_MAX`). Medido en el boceto:
- Robot: el más pesado 21.001 (`casa`, 7 cuadros), el más liviano 4.172 (`apagado`). Los cuadros guardan solo lo que cambia.
- Monitor con 9 agentes y el robot en Hackerman: 95.498 animado, 40.987 quieto.
- Teclado 32.252 · `htop` 30.971 · escritorio 6.784.

## 3. Qué se convierte en qué

| Hoy (oficina) | Terminal retro | Archivo |
|---|---|---|
| Robot beige de los 80 colgado del techo | **Robot de fósforo** dentro de la pantalla: cabeza con visor (una pantalla en la pantalla), antena que titila, orejas de bulón, pecho con una pantallita que muestra el % del proyecto, orugas. Las 31 emociones siguen, más 4 del día (arranque, siesta, mate, apagado) y 14 de memes | `arte-robot.ts` → `arte-robot-terminal.ts` |
| Cielorraso, pared y piso | **Monitor de los 90:** plástico beige con rejilla, bisel hundido, pantalla con esquinas curvas, reflejo del vidrio, barrido y parpadeo del CRT, marca «TERMINAL 9000», perillas, luz de encendido (verde; ámbar de noche), post-it y patito de goma. Arriba de la pantalla, el prompt `$ ./OFICINA` con el cursor y la hora; abajo, una barra de estado como la de tmux | `arte-escena.ts`, `arte-edificio.ts` |
| Oficinistas en escritorios | **Íconos** del color del equipo: entran dibujándose línea por línea, trabajan con un detalle propio y un giro `[|/-]`, terminan con `[OK]` y se apagan como un tubo de rayos catódicos; si fallan se rompen en rojo y queda la calavera de `SEGV` | `arte-escritorios.ts`, `arte-actividades.ts` |
| 6 íconos de rol y 12 placas de equipo | Íconos de 12 × 12 (caja de herramientas, brújula, lupa, libro, barras, ventana de código, escudo con candado, engranaje, escoba, llave, compás). En Equipos, **carpetas** del color de cada equipo, como un `ls` con colores, con un triángulo ámbar si el esquema avisa algo | `arte-iconos.ts` |
| Taller del rol (Editar) | El archivo del agente **abierto en el editor**, con números de línea y colores por tipo de línea | `arte-escena.ts` |
| Contador LCD, batería de 5 h, almanaque | **`htop`:** barras de contexto, 5 horas y semana (verde, ámbar desde 50 %, rojo desde 80 %), tokens, costo, uptime y load | `arte-uso.ts` |
| Greca | **Teclado** beige: las teclas se hunden cuando hay agentes tipeando | `pixel.ts` |
| Pasillo y cornisa | **Escritorio** de madera: la PC con dos disqueteras, el botón TURBO (prendido = con animación) y la luz del disco que titila; disquetes «BACKUP», mate con termo, taza, mouse con cable y un cubo mágico armado | `arte-oficina.ts` |
| Tarjetas crema | Tarjetas negras con borde del color del equipo, letra verde | `tema.ts`, `register.tsx` |
| Burbuja crema | **Línea de terminal:** fondo negro, borde verde, `robot>` adelante. Agrega el estado del proyecto | `register.tsx`, `emociones.ts` |

## 4. El estado del proyecto

Lo que dice la burbuja, por ejemplo:

> robot> Laburando con 3 agentes: T-9, R-2, M-3. Proyecto ▕██████░░░░▏ 58 %: faltan 5 de 12 tarjetas (42 %). A este ritmo, ~1 h 10 min.

La misma barra va en la pantallita del pecho del robot y en la barra de estado (`[3 AG] [58%] T-9`).

**De dónde sale el número**, en este orden (el primero que tenga datos gana):

1. **Las tareas de la sesión.** Un gancho `tool.call` sobre `TaskCreate`, `TaskUpdate` y `TodoWrite` deja pasar la llamada (`next(e)`) y anota el resultado: id, título y estado. % = completadas ÷ total (las borradas no cuentan).
2. **Las tarjetas del proyecto.** `tarjetas/*.md` en la carpeta de la sesión (`$.session.cwd()`), con su línea `estado:` (propuesta, aprobada, en curso, hecha, frenada), como dice `kit/metodo/ESQUEMA-SISTEMA.md`. Se relee al abrir el panel y cada 30 segundos como mucho. % = hechas ÷ total; las frenadas se nombran aparte («T-7 está frenada y espera por vos»).
3. **Sin datos, sin número.** El robot dice que no ve tareas ni tarjetas; nunca inventa un %.

**El ritmo:** el promedio entre las últimas 5 tareas cerradas en esta sesión, por las que faltan. Con menos de 2 cerradas no hay estimación. Se redondea a 5 minutos y se dice con «~».

**Archivos:** un módulo puro nuevo `hooks/proyecto.ts` (`leerTarjeta(texto)`, `progresoDeTareas(lista)`, `progresoDeTarjetas(lista)`, `ritmo(cierres, faltan)`, `fraseProyecto(progreso)`), un estado nuevo `proyecto` en `types/index.d.ts` y el gancho en `register.tsx`. El mod **no escribe** tarjetas ni tareas: solo lee.

## 5. El día del robot

Reemplaza a `FRANJAS_HORA` en `emociones.ts`. Hora local. Gana sobre el ocio; el trabajo y las reacciones ganan sobre la hora, salvo el apagado.

| Desde | Hasta | Emoción | Qué hace |
|---|---|---|---|
| 08:00 | 08:15 | `arranque` | Arranca: «BOOT», «RAM OK», carga la barra y abre los ojos |
| 08:15 | 10:00 | `manana` | Toma café de la taza; sale vapor |
| 12:30 | 13:30 | `hambre` | Come un chivito; caen migas |
| 14:00 | 15:00 | `siesta` | Cabecea, se le cierran los ojos, se despierta de golpe |
| 16:30 | 17:15 | `mate` | Toma mate con el termo bajo el brazo |
| 17:30 | 18:00 | `casa` | «Bueno, me voy»: saluda y se va de la pantalla |
| 18:00 | 08:00 | `apagado` | Cara de muerto (ojos en X, lengua afuera, antena caída), el fósforo baja dos tonos, la luz del monitor pasa a ámbar. Cada tanto se le escapa el alma |

Sábados y domingos: apagado todo el día (pregunta 2).

## 6. Las 20 reacciones de memes

El robot actúa el gesto; no se copia ninguna imagen ni personaje. Panik y Kalm son un solo meme con dos caras. Ocho ya existían como emoción y cambian de dibujo; trece son nuevas.

| Meme | Cuándo | Emoción | ¿Nueva? |
|---|---|---|---|
| This is fine | Fallan 2 o más y otros siguen corriendo | `estoEstaBien` | sí |
| Pikachu sorprendido | Falla un agente que llevaba menos de 30 s | `sorpresa` | dibujo |
| Novio distraído | Llega uno nuevo mientras otro lleva más de 10 min | `distraido` | sí |
| Drake (no / sí) | Cancelar y después Guardar en Editar | `drake` | sí |
| Success Kid | Una tarea se cierra al primer intento (sin falla antes con la misma tarjeta) | `successKid` | sí |
| Stonks | Sube el % del proyecto | `stonks` | sí |
| Not stonks | Baja el % (se reabre una tarea) | `notStonks` | sí |
| Galaxy brain | 4 o 5 agentes a la vez | `multitarea` | dibujo |
| Doge | 6 o más agentes a la vez | `doge` | sí |
| Hide the Pain Harold | Las 5 horas pasan el 80 % | `harold` | sí |
| Dos botones | Cambios sin guardar en Editar | `dosBotones` | sí |
| ¿Esto es una paloma? | El esquema avisa algo del agente que se edita | `paloma` | sí |
| Roll Safe | Entra en la rotación del ocio | `rollSafe` | sí |
| Panik | Fallan varios a la vez | `panico` | dibujo |
| Kalm | Después de una falla, algo sale bien | `alivio` | dibujo |
| Bongo Cat | 2 o 3 agentes | `tipea` | dibujo |
| Hackerman | Un solo agente lleva más de 3 min | `concentrado` | dibujo |
| Bueno, me voy | 17:30 | `casa` | dibujo |
| Ah, otra vez | Se relanza una tarjeta que había fallado, o lunes antes de las 10 | `otraVez` | sí |
| ¡Más de 9000! | Un agente pasa los 9000 tokens de salida | `masDe9000` | sí |
| Deal with it | Guardás un agente, o el proyecto llega al 100 % | `orgullo` | dibujo |

Más un baile de Rickroll como huevo de pascua (sección 7).

## 7. Huevos de pascua

- El cursor del prompt parpadea en Morse: «HOLA».
- Un bichito (un bug) cruza la pantalla cada 37 s.
- El conejo blanco salta por la barra de estado cada 89 s.
- Lluvia de ceros y unos, 1,6 s cada 61 s.
- El patito de goma arriba del monitor dice «CUAC» cada 23 s y cuando algo falla.
- Post-it «CLAVE: 1234» en el bisel.
- Pantalla quemada: un «READY.» fantasma.
- El monitor se llama «TERMINAL 9000».
- El botón TURBO de la PC está prendido con animación; «Quieto» lo apaga.
- La luz del disco titila con la actividad.
- Apagado, al robot se le escapa el alma por la antena.
- A las 13:37 la barra dice «H4CK3R M0D3».
- A las 16:04, «404: robot no encontrado» durante un minuto.
- Viernes desde las 16: bola de disco en la pantalla.
- Proyecto al 100 %: el robot deja un arcoíris al estilo Nyan Cat.
- El primer día de cada mes a las 10:00, el robot baila un Rickroll.
- 31/10 cabeza de calabaza; diciembre gorro navideño; 25/8 sol de mayo; día 256 del año (Día del Programador) festeja con «256».
- En el escritorio: cubo mágico armado, mate con termo, disquetes «BACKUP».

## 8. Oleadas (tarjetas TR)

Como en las oleadas anteriores: cada tarjeta con agente, ≤ 5 archivos y aceptación binaria. Al cerrar cada una: `claude plugin test mod` en 0 fail, maqueta revisada a 378 px y merge de `master` en la rama.

| # | Qué | Archivos | Depende de |
|---|---|---|---|
| TR-0 | **Paleta y panel negro:** `tema.ts` con negro y fósforo, contraste ≥ 4,5 en todos los fondos; burbuja como línea de terminal | `tema.ts`, `tema.test.ts`, `register.tsx` | — |
| TR-1 | **El robot:** `arte-robot-terminal.ts` con el contrato de `caraRobotSvg`, las 31 emociones, las 7 del día y las 13 de memes; la pantallita del pecho recibe el % | `arte-robot-terminal.ts`, `register.tsx`, pruebas | TR-0 |
| TR-2 | **Estado del proyecto:** `proyecto.ts`, el estado `proyecto`, el gancho `tool.call` y la lectura de `tarjetas/*.md` | `proyecto.ts`, `types/index.d.ts`, `register.tsx`, pruebas | TR-0 |
| TR-3 | **El día y los memes:** franjas nuevas, apagado y los 13 disparadores en `emociones.ts`; frases de la burbuja con el proyecto | `emociones.ts`, `register.tsx`, pruebas | TR-1, TR-2 |
| TR-4 | **El monitor:** escena con prompt, hora, barra de estado, post-it, patito y huevos de la pantalla; Equipos con carpetas y Editar con el editor | `arte-escena.ts`, `arte-edificio.ts`, pruebas | TR-1 |
| TR-5 | **Íconos de agentes** en las 4 fases, uno por equipo | `arte-escritorios.ts`, `arte-actividades.ts`, `arte-iconos.ts`, pruebas | TR-4 |
| TR-6 | **`htop`** en vez del tablero de uso | `arte-uso.ts`, pruebas | TR-0 |
| TR-7 | **Teclado y escritorio** en vez de la greca y el pasillo | `pixel.ts`, `arte-oficina.ts`, pruebas | TR-0 |
| TR-8 | **Huevos de pascua por fecha y hora** (13:37, 16:04, viernes, 100 %, Rickroll, fechas) | `emociones.ts`, `arte-escena.ts`, `register.tsx`, pruebas | TR-3, TR-4 |

Orden: TR-0, TR-1 y TR-2 primero (lo que más se ve y lo nuevo), después TR-3 a TR-5, y al final TR-6 a TR-8. Las que tocan `register.tsx` van en serie.

## 9. Decisiones de Nimai (07/10/2026)

Aceptó todas las propuestas:

1. **Después de las 18 con agentes corriendo: modo zombi.** Cara de muerto, pero tipea; la burbuja dice «Horas extra…».
2. **Sábados y domingos:** apagado todo el día (con agentes corriendo, modo zombi).
3. **Las horas** de la sección 5, como están.
4. **El % del proyecto:** tareas de la sesión y, si no hay, tarjetas. Sin datos, sin número. Además, **instrucciones para el `CLAUDE.md`** de donde se instale: `kit/metodo/ESTADO-PROYECTO.md` (reglas para que Claude lleve la lista de tareas y las tarjetas al día) y la línea `@{{EQUIPOS}}\ESTADO-PROYECTO.md` en `kit/metodo/CLAUDE-global.md`. Paso 7c en `kit/ADAPTAR.md`.
5. **En la terminal:** el robot aparece en ASCII, en verde.
6. **El monitor:** beige de los 90.

## 10. Archivos del boceto

Todos en `mod/preview/`; el mod todavía no los usa.

| Archivo | Qué tiene |
|---|---|
| `pixel-terminal.mjs` | Motor: paleta de fósforo, grillas, fuente de 3 × 5, cuadros animados que guardan solo lo que cambia, barrido del CRT |
| `robot-terminal.mjs` | El robot por piezas: 35 emociones (las 31 de la oficina y 4 del día) y 14 de memes (con el Rickroll) |
| `escena-terminal.mjs` | El monitor, los íconos de los 12 equipos en 4 fases, carpetas de Equipos, editor de Editar, teclado, escritorio y `htop` |
| `boceto-terminal.mjs` | La página del boceto |

## 11. Avance (07/10/2026)

Todas las oleadas quedaron hechas en una sola tanda, en la rama `skin-nueva`. Verificación: `claude plugin test mod` → **327 pass, 0 fail** (eran 295; se sumaron 32 pruebas nuevas); `claude plugin validate mod` → OK; tipos sin errores (`tsc` con la configuración del motor); maqueta a 378 px con 0 elementos fuera del marco medidos en el navegador.

| # | Estado | Qué quedó |
|---|---|---|
| TR-0 | Hecha | `tema.ts`: pantalla negra y fósforo (conserva el nombre `CLARO`); `legibleSobre` aclara sobre fondos oscuros; fondo negro en la raíz de cada vista; todos los textos con color explícito; la burbuja es una línea de terminal con `robot>`. |
| TR-1 | Hecha | `hooks/arte-robot-terminal.ts` (motor en `hooks/arte-fosforo.ts`): 51 emociones con el contrato de `caraRobotSvg`, la pantallita del pecho con el % (late si no hay datos), accesorios por fecha y `robotAscii` para la terminal. El más pesado: ~21.000 caracteres. |
| TR-2 | Hecha | `hooks/proyecto.ts` (puro), estado `proyecto` en `types/index.d.ts`, ganchos `tool.call` de `TaskCreate`, `TaskUpdate` y `TodoWrite` (solo leen el resultado) y lectura de `tarjetas/*.md` cada 30 s como mucho, sin escribir estado si nada cambió. Reglas para Claude en `kit/metodo/ESTADO-PROYECTO.md`. |
| TR-3 | Hecha | `emociones.ts`: el día nuevo, apagado (antes de las 8, desde las 18 y el fin de semana), modo zombi, «404», Rickroll, Doge, Harold, Dos botones y la paloma. `hooks/memes.ts` (puro) afina las reacciones: Pikachu, This is fine, Ah otra vez, Novio distraído y Success Kid. Stonks, Not stonks, Drake y ¡Más de 9000! salen de `register.tsx`. |
| TR-4/5 | Hecha | `hooks/arte-monitor.ts`: el monitor con prompt (cursor en Morse), hora, barra de estado, post-it, patito, marca y luz; los agentes como íconos del color de su equipo en 4 fases; carpetas en Equipos y el archivo en el editor en Editar. `hooks/arte-insignias-terminal.ts`: tipos de agente, placas, contador y fecha. |
| TR-6/7/8 | Hecha | `arte-uso.ts` en verde de fósforo, al estilo `htop` (mismas pruebas); `hooks/arte-escritorio.ts`: teclado que se hunde con agentes, escritorio con la PC y el TURBO, borde de la mesa y caja de disquetes; huevos de pascua por hora y fecha. |

**Versión de terminal (07/10/2026).** En la terminal (sin dibujos) el panel muestra el monitor hecho con caracteres (`hooks/terminal-texto.ts`, puro): el patito, el marco beige con el prompt y la hora, el robot en ASCII con su utilería según la emoción (taza, mate, chivito, zzz, PANIK!!, STONKS…), a su lado los agentes con el ícono y el color de su equipo y su estado (`[|]`, `[OK]`, `[SEGV]`), o las carpetas de Equipos, o el archivo de Editar; la barra de estado en video inverso; y abajo la marca, el post-it y la luz (ámbar fuera de hora). La lista de agentes descuenta esas líneas. Pruebas: 331 pass, 0 fail.

**Para probarlo en la compu** (el enlace del mod apunta al repo): `git fetch` y `git checkout skin-nueva` en la carpeta del repo, sesión nueva y `/oficina`. Para volver a la oficina: `git checkout master`.

**Lo que no se pudo verificar acá:** cómo se ve en la app de escritorio de verdad (solo la maqueta en el navegador) y si la app manda los `tool.call` de las tareas tal como los simula la prueba.

**Quedan sin usar en la rama** (para que la mezcla con master sea simple): `arte-robot.ts`, `arte-escena.ts`, `arte-oficina.ts`, `arte-edificio.ts` en lo que es dibujo, `arte-escritorios.ts` en el escritorio (sigue para la terminal sin dibujos) y los dibujos de `arte-iconos.ts`.
