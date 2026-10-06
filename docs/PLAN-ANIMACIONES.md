# Plan: más vida en la oficina (patio por color, actividades por rol y robot con muchas emociones)

**Estado:** implementado P-1 a P-8 y P-10 (06/10/2026). Falta P-9: la mirada de la usuaria sobre la vista previa (`mod/preview/make-preview.mjs`).
**Fecha:** 06/10/2026.

## Qué se quiere

1. **Patio por color, sin logo.** Hoy cada oficinista tiene en el monitor el glifo de su tipo (escriba, vidente, guardián…). Se saca el glifo. El equipo se reconoce por **color**: camisa, silla y borde del escritorio.
2. **Actividades según el rol.** Cada agente hace algo que se relaciona con lo que hace:
   - research investiga con un cuaderno y mira con binoculares;
   - los equipos dev programan en una laptop;
   - datos tiene tablas y gráficos;
   - y así con cada equipo (tabla abajo).
3. **El robot con muchas más emociones.** Pasa de 9 a unas 30, con disparadores nuevos y variedad en el ocio para que no repita siempre lo mismo.

## Lo que hay hoy

Verificado en el código el 06/10/2026:

- **Patio:**
  - `mod/hooks/arte-escritorios.ts` dibuja la celda.
  - `celdaPatioSvg({ fase, matriz, paleta, semilla, escala, etiqueta, quieto, fondo, titulo })` tiene 4 fases: `entra`, `juega`, `sale` y `explota`.
  - El lienzo mide 22 × 27 unidades (`PATIO_ANCHO`, `PATIO_ALTO`).
  - El oficinista toma el pelo y la camisa por `semilla`, no por equipo.
  - El objeto del escritorio es taza, planta o papeles, también por `semilla`.
- **Glifo en el monitor:** `register.tsx:1756` le pasa a la celda `matriz: glifoMatriz(tipo)`. Ese es el logo que se ve en el monitor y que se va a sacar.
- **Colores por equipo:** ya existen. `arte-iconos.ts:17` define `EQUIPO_ACENTO` con 12 equipos, cada uno con un color y su tono oscuro: base, direccion, research, librarian, datos, dev-a1, dev-tablero, seguridad, mantenimiento, limpieza, facilities y arquitectura.
- **Robot:**
  - `mod/hooks/arte-robot.ts` define 9 emociones (`EMOCIONES`): aburrido, dormido, pensando, caceria, sospecha, ruge, molesto, bufido y contento.
  - El lienzo mide 34 × 26 y el marco del monitor, 42 × 34.
  - Cada emoción tiene entre 2 y 4 cuadros con animación SMIL.
- **Qué emoción toca:** la decide `emocionDe()` dentro de `register.tsx:979`, un archivo de 2052 líneas. Los disparadores de hoy son:
  - una reacción vigente: ruge, bufido, contento/festeja/guardado, caceria/salta;
  - agentes corriendo: pensando, o sospecha si alguno tarda mucho;
  - cambios sin guardar: molesto;
  - ocio: aburrido y, después de un rato, dormido.
- **Pruebas y vista previa:** `plugin test mod` da 193 pass. `make-preview.mjs` genera 170 SVG; el más pesado tiene 118.160 caracteres.

## Decisiones de diseño

### 1. Color en vez de logo
- La celda recibe `equipo` en lugar de `matriz` y `paleta`. Con `EQUIPO_ACENTO[equipo]` se pintan:
  - la camisa, con el color del equipo;
  - el respaldo de la silla, con el tono oscuro;
  - una franja de 1 unidad en el borde del escritorio.
- El pelo y la piel siguen saliendo de `semilla`, para que los agentes de un mismo equipo no sean clones.
- **Accesibilidad:** el color solo no alcanza para quien no distingue colores. Por eso se mantienen:
  - la etiqueta de la tarjeta (`T-81`);
  - el `titulo` con el nombre del equipo, que se lee al pasar el mouse y con lector de pantalla;
  - una leyenda opcional de colores debajo del patio.
- **Equipo desconocido:** usa el color de `base`, gris.

### 2. Actividad por equipo
La actividad se busca **solo por equipo** (respuesta 1). Un equipo sin actividad usa la genérica y se avisa. Cada actividad se anima solo en la fase `juega`, con 2 a 4 cuadros. Las fases `entra`, `sale` y `explota` siguen como están.

| Equipo | Actividad | Cuadros de `juega` |
|---|---|---|
| research | cuaderno y binoculares | 1: escribe en el cuaderno · 2: levanta los binoculares · 3: mira a los costados |
| dev-a1, dev-tablero | laptop programando | 1: tipea · 2: líneas de código que suben en la pantalla · 3: toma un sorbo de café |
| datos | tablas y gráficos | 1: hoja con celdas · 2: un gráfico de barras que crece · 3: señala un dato |
| librarian | libros | 1: pila de libros · 2: hojea uno · 3: lo acomoda en la pila |
| direccion | pizarra con flechas | 1: dibuja una flecha · 2: encierra algo en un círculo |
| base | papeles y lapicera | 1: escribe · 2: da vuelta la hoja |
| seguridad | cámara y walkie | 1: mira el monitor de cámaras · 2: habla por el walkie |
| mantenimiento | escalera y foco | 1: cambia un foco · 2: se prende |
| limpieza | carrito | 1: pasa el trapo · 2: brilla |
| facilities | plano y llaves | 1: revisa el plano · 2: hace sonar el llavero |
| arquitectura | escuadra y plano | 1: traza una línea · 2: mide |
| (sin actividad) | genérica: papeles y lapicera | igual que base, con aviso en Equipos |

- Todo vive en un módulo puro nuevo, `arte-actividades.ts`, sin imports. Exporta `ACTIVIDADES` (la tabla de arriba como datos), `ACTIVIDAD_EQUIPO`, `actividadDe(equipo)` y `actividadSvg(nombre, cuadro, escala)`.
- El objeto que hoy elige `semilla` (taza, planta, papeles) pasa a ser decorado: solo se dibuja si la actividad deja lugar libre.

### 3. Robot con muchas emociones
Para no seguir agrandando `register.tsx`, la decisión de qué emoción toca sale a un módulo puro, `emociones.ts`. Exporta `decidirEmocion(estado)`, que recibe un objeto simple: reacción, cantidad de agentes corriendo, si alguno tarda, si alguno falló, cambios sin guardar, tiempo de ocio, hora y semilla. Esa función se prueba sola, sin la app.

Catálogo propuesto, unas 30 emociones (las 9 de hoy siguen):

| Grupo | Emociones | Disparador |
|---|---|---|
| Ocio | aburrido, dormido, bostezo, se estira, riega la planta, lee el diario, juega al solitario, silba | sin agentes. Rota cada 2 a 3 minutos con `semilla`; dormido sigue después de `DORMIR_MS` |
| Hora del día | café de la mañana, almuerzo, bostezo de la noche | el reloj de la pared (TOF-6) |
| Trabajo | pensando, tipeando rápido, multitarea (varios brazos), concentrado con auriculares, sospecha | 1 agente: pensando · 2 o más: tipeando · 4 o más: multitarea · uno que tarda: sospecha |
| Eventos buenos | contento, festeja con confeti, aplaude, orgullo, alivio | termina un agente: contento · terminan todos: festeja · se guarda: orgullo · una corrección pasa: alivio |
| Eventos malos | molesto, bufido, ruge (alarma), pánico, frustrado, chispazo | cambios sin guardar: molesto · falla un agente (`explota`): pánico · segunda falla: frustrado · error del sistema: chispazo |
| Social | saluda, guiña, sorpresa | se abre el panel: saluda · un agente nuevo entra: sorpresa · clic en el robot: guiña |

**Reglas:**
- **Prioridad:** si hay varias emociones posibles, gana el primer grupo que aplique, en este orden:
  1. eventos malos;
  2. eventos buenos;
  3. social;
  4. trabajo;
  5. hora del día;
  6. ocio.
- **Duración:** cada evento dura lo que dura su reacción, como hoy (`reaccion.hasta`).
- **Variedad sin parpadeo:** el ocio cambia como mucho cada 2 minutos, y nunca repite dos veces seguidas la misma emoción.
- **Lienzo:** se mantiene en 34 × 26, porque las pruebas lo fijan. Las emociones que necesitan más lugar, como los brazos cruzados de «molesto» o los varios brazos de «multitarea», se resuelven con el cuerpo asomando por los costados del marco. No se agranda el lienzo.
- **Texto alternativo:** cada emoción nueva lleva su texto en `EMOCION_ALT`, para lectores de pantalla.
- **Modo quieto:** `quieto` deja un solo cuadro sin animación en todas las emociones nuevas.

### Topes técnicos (para todas las tarjetas)
- Módulos de arte puros, sin imports y con la misma forma de exports que los de hoy.
- SVG con SMIL y sin JavaScript.
- Ningún SVG pasa de 150.000 caracteres. `make-preview.mjs` ya avisa cuál es el más pesado; se le agrega el tope.
- Las pruebas fijan medidas con números escritos a mano, sin importar otros módulos de arte.
- Cada tarjeta deja `plugin validate mod` en código 0, `plugin test mod` en 0 fail y la vista previa en OK.

## Oleadas propuestas

Máximo 3 tarjetas en paralelo y sin archivos compartidos. Las tarjetas se escriben como archivo recién cuando la usuaria aprueba el plan.

| Oleada | Tarjeta | Qué | Archivos (máx. 5) | Agente |
|---|---|---|---|---|
| A | P-1 | Celda por color: `celdaPatioSvg` recibe `equipo`; camisa, silla y franja | `hooks/arte-escritorios.ts`, `tests/arte-escritorios.test.ts` | dev-tablero |
| A | P-2 | `arte-actividades.ts` con las 14 actividades y sus cuadros | `hooks/arte-actividades.ts`, `tests/arte-actividades.test.ts` | dev-tablero |
| A | P-3 | `emociones.ts`: `decidirEmocion` con prioridades y rotación del ocio | `hooks/emociones.ts`, `tests/emociones.test.ts` | dev-tablero |
| B | P-4 | Robot, parte 1: las 12 emociones de ocio y hora del día | `hooks/arte-robot.ts`, `tests/arte-robot.test.ts` | dev-tablero |
| B | P-5 | Celda con actividad: la fase `juega` dibuja `actividadSvg` (necesita P-1 y P-2) | `hooks/arte-escritorios.ts`, `tests/arte-escritorios.test.ts` | dev-tablero |
| C | P-6 | Robot, parte 2: las 9 emociones de trabajo, eventos y social | `hooks/arte-robot.ts`, `tests/arte-robot.test.ts` | dev-tablero |
| D | P-7 | Integración: `register.tsx` usa `decidirEmocion` y pasa `equipo` a la celda; disparadores nuevos (falla, terminan todos, panel abierto, clic) | `hooks/register.tsx`, `tests/tablero.test.ts`, `tests/tablero-equipos.test.ts` | dev-tablero |
| D | P-8 | Vista previa: secciones por actividad y por emoción, leyenda de colores y tope de peso | `preview/make-preview.mjs` | dev-tablero |
| E | P-9 | Mirada de la usuaria sobre la vista previa y lista de ajustes | — | usuaria |

P-4 y P-6 tocan el mismo archivo, por eso van en oleadas distintas. Lo mismo pasa con P-1 y P-5.

## Riesgos y cómo se cubren

- **`register.tsx` es grande (2052 líneas):** toda la lógica nueva va en módulos puros (P-2 y P-3). P-7 solo conecta piezas.
- **Disparadores que hoy no existen**, como «falla un agente», «terminan todos» o el clic en el robot: P-7 tiene que confirmar leyendo el código qué eventos da la API de hooks. El que no exista queda afuera y se anota, sin inventarlo.
- **Peso de los SVG con muchas emociones:** se cubre con el tope de 150.000 caracteres y con el caché por emoción que ya existe (`register.tsx:1016`).
- **12 colores que hay que distinguir en tema oscuro:** P-8 genera la leyenda para revisarla a ojo en P-9.

## Respuestas de la usuaria (06/10/2026)

1. **La actividad del patio va por equipo**, no por tipo de agente. Cada equipo nuevo tiene que tener su actividad pensada: no hay actividad automática por tipo.
   - Los 12 equipos de hoy tienen la suya (tabla de abajo).
   - Un equipo que no está en la tabla usa la actividad genérica (papeles y lapicera) y la pestaña Equipos avisa: «El equipo X no tiene actividad en el patio: hay que pensarla».
   - Una prueba exige que cada equipo de `EQUIPOS_ESQUEMA` tenga actividad. Si se agrega un equipo sin actividad, la prueba falla.
   - `kit/metodo/ESQUEMA-AGENTES.md` suma el paso «pensar su actividad en el patio» a la receta de equipo nuevo.
2. **Sí a las emociones por hora del día**, con el reloj de la computadora:
   - 08:00 a 09:59: café de la mañana.
   - 12:00 a 13:59: **le da hambre**.
   - 17:30 a 18:59: **empieza a decir que dentro de poco se va a casa**.
   - Con nada corriendo, la emoción es la de la hora. Con agentes corriendo, la emoción es la de trabajo, pero la burbuja agrega la frase de la hora («…y me está dando hambre», «…y en un rato me voy a casa»).
   - Fuera de esas franjas no hay emoción de la hora (no hay «noche»).
3. **Sin guiño en el clic.** El clic en el robot queda afuera. El guiño aparece en otras cosas:
   - en la rotación del ocio, como una emoción más (`guina`);
   - al guardar un rol («orgullo»: termina guiñando, con «De nada.»);
   - al saludar cuando se abre el panel (último cuadro del saludo).
4. **Nuevo: uso de la sesión en el panel.** Se agrega la opción de ver:
   - la ventana de **5 horas** y la **semanal** (porcentaje usado, barra y hora en que se renueva);
   - el contexto de la conversación (porcentaje lleno), para saber cuándo compactar.
   - Va en la vista Subagentes, en un desplegable «Uso de la sesión» que arranca abierto.
   - Los datos salen del motor: `$.session.usage()` al abrir el panel y el evento `session.measure` después (llega solo tras cada turno o cuando una ventana se mueve un punto). Sin suscripción no hay ventanas y se avisa.
5. **Nuevo: botón para compactar la sesión** desde el panel.
   - «Compactar sesión…» pide confirmación («Sí, compactar» / «No»), como «Restaurar original…».
   - Llama a `$.session.compact()`, lo mismo que `/compact`.
   - Si Claude está en medio de un turno, el motor lo rechaza y el aviso dice que se pruebe al terminar.
   - Al terminar avisa «Sesión compactada» con los tokens antes y después, si el motor los da.

### Cambios al catálogo de emociones por las respuestas

| Grupo | Emociones | Disparador |
|---|---|---|
| Ocio | aburrido, bostezo, estira, riega, diario, solitario, silba, guina, dormido | sin agentes. Los primeros 2 minutos, aburrido (café). Después rota cada 2 minutos sin repetir la anterior. A los 10 minutos (`DORMIR_MS`), dormido |
| Hora del día | manana, hambre, casa | 08:00–09:59, 12:00–13:59, 17:30–18:59 (le gana al ocio, también a dormido) |
| Trabajo | pensando, concentrado, tipea, multitarea, sospecha | 1 agente: pensando · uno corriendo hace más de 3 min: concentrado · 2 o 3: tipea · 4 o más: multitarea · uno hace más de 10 min: sospecha |
| Eventos buenos | contento, festeja, aplaude, orgullo, alivio | termina uno y siguen otros: contento · 2 o más terminan juntos y siguen otros: aplaude · terminan todos: festeja · se guarda un rol: orgullo (con guiño) · termina uno mientras estaba molesto por una falla: alivio |
| Eventos malos | molesto, bufido, ruge, panico, frustrado, chispazo | falla uno: ruge · fallan 2 o más juntos: panico · falla otro mientras seguía molesto: frustrado · frenan uno: bufido · un aviso de error del panel («No se pudo…»): chispazo · después de una falla: molesto |
| Social | saluda, sorpresa | se abre el panel: saluda (termina con guiño) · entran 3 o más agentes juntos: sorpresa · entra uno: caceria (como hoy) |

Son 31 emociones. Prioridad: eventos malos > eventos buenos > social > trabajo > molesto > hora del día > ocio.

### Oleada extra

| Oleada | Tarjeta | Qué | Archivos |
|---|---|---|---|
| D | P-10 | Uso de la sesión (5 h, semanal, contexto) y botón de compactar | `hooks/register.tsx`, `types/index.d.ts`, `tests/tablero-uso.test.ts` |

## Cómo quedó (06/10/2026)

- **Módulos nuevos, puros y sin imports:** `hooks/arte-actividades.ts` (11 actividades, una por equipo, y la genérica) y `hooks/emociones.ts` (`decidirEmocion`, franjas de la hora y rotación del ocio).
- **Celda del patio:** recibe `acento` (color del equipo) y `actividad` (cuadros ya dibujados) en lugar de `matriz` y `paleta`. Sin actividad dibuja el monitor CRT con la pantalla vacía. El título de la celda nombra el equipo y debajo del patio hay una leyenda de colores con los equipos presentes.
- **Robot:** 31 emociones. La cara se redibuja sola cuando cambia el paso del ocio o la franja de la hora (sin escrituras de más: una cada 2 minutos como mucho).
- **Molesto:** ahora dura hasta que otro agente termina bien (alivio), no hasta que entra uno nuevo; si no, el alivio no podía pasar nunca.
- **Uso de la sesión y compactar:** en la vista Subagentes, desplegable «Uso de la sesión».
- **Pruebas:** `plugin validate mod` en 0. `plugin test mod`: en Linux 148 pass y los mismos 50 fail de antes, todos por las rutas de Windows del disco falso (`C:\home-falso`); con esas rutas pasadas a Linux en una copia, 200 pass y 0 fail. En Windows se esperan 200 pass.
- **Vista previa:** 294 SVG, el más pesado 118.160 caracteres (tope 120.000).
