# Plan: más vida en la oficina (patio por color, actividades por rol y robot con muchas emociones)

**Estado:** propuesta. No se implementa hasta que la usuaria apruebe las oleadas.
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

### 2. Actividad por rol
Primero se busca la actividad por **equipo**. Si el equipo no tiene una, se usa la del **tipo** de agente (`tipoDeAgente`). Cada actividad se anima solo en la fase `juega`, con 2 a 4 cuadros. Las fases `entra`, `sale` y `explota` siguen como están.

| Equipo o tipo | Actividad | Cuadros de `juega` |
|---|---|---|
| research / vidente | cuaderno y binoculares | 1: escribe en el cuaderno · 2: levanta los binoculares · 3: mira a los costados |
| dev-* | laptop programando | 1: tipea · 2: líneas de código que suben en la pantalla · 3: toma un sorbo de café |
| datos | tablas y gráficos | 1: hoja con celdas · 2: un gráfico de barras que crece · 3: señala un dato |
| librarian | libros | 1: pila de libros · 2: hojea uno · 3: lo acomoda en el estante |
| direccion / estratega | pizarra con flechas | 1: dibuja una flecha · 2: encierra algo en un círculo |
| pm | agenda | 1: tilda un ítem · 2: mueve una tarjeta en el tablero |
| guardian (revisión) | lupa y checklist | 1: mira con la lupa · 2: tilda · 3: frunce el ceño |
| curandero (corrector) | caja de herramientas | 1: ajusta con una llave · 2: salta una chispa |
| escriba (base) | papeles y lapicera | 1: escribe · 2: da vuelta la hoja |
| seguridad | cámara y walkie | 1: mira el monitor de cámaras · 2: habla por el walkie |
| mantenimiento | escalera y foco | 1: cambia un foco · 2: se prende |
| limpieza | carrito | 1: pasa el trapo · 2: brilla |
| facilities | plano y llaves | 1: revisa el plano · 2: hace sonar el llavero |
| arquitectura | escuadra y plano | 1: traza una línea · 2: mide |

- Todo vive en un módulo puro nuevo, `arte-actividades.ts`, sin imports. Exporta `ACTIVIDADES` (la tabla de arriba como datos), `actividadDe({ equipo, tipo })` y `actividadSvg(nombre, cuadro, escala)`.
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

## Preguntas abiertas para la usuaria

1. ¿La actividad va por **equipo**, como en la tabla, o por **tipo** de agente? La propuesta: primero equipo y, si no hay, tipo.
2. ¿Querés las emociones de «hora del día»? Dependen del reloj de la computadora.
3. ¿El clic en el robot para que guiñe es un extra o va en esta tanda?
