# Auditoría visual del panel y plan: tema claro, arte en todo el panel y uso de la sesión

**Fecha:** 06/10/2026. **Pedido de Nimai:** «hay que arreglar varias cosas, está todo visualmente que no funciona […] genera una versión para light theme, quiero que todo el panel tenga arte en todas las vistas y todos los paneles. […] la info más importante en sesión es cuántos tokens se han consumido y cuánto queda de la sesión de 5 horas en % y en la semanal».

**Evidencia:** `docs/capturas/2026-10-06-subagentes-tema-claro.png` y `docs/capturas/2026-10-06-equipos-tema-claro.png` (app de escritorio, tema claro, panel de ~470 px), más lectura de `mod/hooks/register.tsx`, `tablero-nucleo.ts`, `pixel.ts` y los tipos del motor 2.1.286.

## 1. Hallazgos

### Verificado (con captura, código o comando, 06/10/2026)

| # | Qué se ve | Dónde | Causa |
|---|---|---|---|
| V1 | Las pestañas se pisan: «Subagentes» tapa a «Equipos»; «Frenar animaciones» pisa la fecha y se corta en el borde. | Captura 1 y 2, barra de arriba | Entre botones hay un separador de 1 celda (`<Text> </Text>`). En el escritorio el botón es nativo y más ancho que su etiqueta medida en celdas. |
| V2 | Botones que pisan la línea de al lado: «Compactar sesión…» sobre el texto de arriba; «▸ base» sobre «6 agentes». | Captura 1 (uso) y 2 (tarjetas) | El botón nativo es más alto que una fila de texto y se apila sin aire arriba ni abajo. |
| V3 | Tarjetas de equipo casi ilegibles: «6 agentes», el subtítulo y el nombre en gris oscuro sobre verde oscuro. | Captura 2 | Fondo fijo oscuro (`#2a2f24`, filas `#20251b`) con la letra **del tema** de la app, que en el tema claro es oscura. Pasa en toda la vista Equipos y en el editor. |
| V4 | El subtítulo del equipo y el contador se superponen y se cortan. | Captura 2 | Mismo problema de altura (V2) más `dimColor` sobre fondo oscuro. |
| V5 | El bloque de uso dice «Sin datos de las ventanas de 5 horas y semanal: aparecen con una suscripción». | Captura 1 | La cuenta **sí** tiene ventanas (plan Team; `get_usage` a las ~14:00: 5 horas 75 %, semanal 39 %). El panel se abrió antes de la primera respuesta, cuando el motor todavía no tenía lecturas, y la frase culpa a la suscripción. |
| V6 | «Costo US$ 0,00» y ningún dato de tokens de la sesión. | Captura 1 | El panel solo suma tokens de **subagentes** (`turn.complete` con `agentId`). Los del hilo principal no se cuentan en ningún lado. |
| V7 | El bloque de uso, el aviso de «Todavía no corrió ningún subagente», la barra de filtros y el pie no tienen arte. | Captura 1 y 2 | Solo la cabecera y las filas llevan SVG. |
| V8 | El arte no llega al borde derecho y la mitad de abajo del panel queda en blanco. | Captura 1 | El ancho del arte tiene tope de 420 px (`DESIGN_WIDTH`) y no hay nada que ocupe el alto sobrante. |
| V9 | Bloques oscuros (azul, verde casi negro) pegados al fondo blanco de la app. No hay versión clara. | Captura 1 y 2 | Unos 170 colores fijos en el arte y 15 en el panel; no existe la idea de «tema». |
| V10 | «+ Nuevo agente» y «Etiqueta: todas» pegados. | Captura 2 | Igual que V1. |

### Supuesto (a confirmar al probar)

- **S1.** El motor del escritorio sí entrega las ventanas de 5 horas y semanal después de la primera respuesta (`session.measure`). Lo indica el tipo `SessionUsage`, pero en la captura todavía no había respuesta. Se confirma abriendo `/oficina` en una sesión nueva después de un mensaje.
- **S2.** El motor no le dice al plugin si la app está en tema claro u oscuro (no hay campo de tema en `ui.render`). El ajuste `theme` de Claude Code (`$.config.list()`) puede no coincidir con el de la app de escritorio. Por eso el plan pone un botón para elegir.
- **S3.** Los tokens de la sesión se pueden contar desde que el mod se carga (cada `turn.complete` trae los tokens de ese turno). En una sesión **reanudada** el conteo arranca de cero: el motor no da el total histórico.

## 2. Plan

Cada ítem dice qué archivos toca, para armar tarjetas de hasta 3 en paralelo sin pisarse.

### Oleada 1: tema claro y oscuro (base de todo lo demás)

| # | Qué | Archivos |
|---|---|---|
| T1 | `hooks/tema.ts`: dos paletas con los mismos nombres (fondo del panel, tarjeta, tarjeta alterna, hover, texto, texto suave, borde, burbuja, barra superior, acentos). Funciones puras, probadas. | `hooks/tema.ts`, `tests/tema.test.ts` |
| T2 | Elegir el tema: botón ☀/☾ en la barra de arriba; lo elegido se guarda (vale para todas las sesiones). Por defecto, «automático»: claro si el ajuste `theme` de Claude Code es claro. | `hooks/register.tsx`, `types/index.d.ts` |
| T3 | Todo texto que va sobre un fondo fijo lleva su color explícito (nunca el del tema de la app). Arregla V3 y V4 también en oscuro. | `hooks/register.tsx` |
| T4 | Arte con versión clara: cielorraso, pared, piso, edificio, taller, patio, celdas, cornisa y franja reciben el tema (paredes crema, piso beige claro, cielo celeste; contornos y robot igual). | `hooks/arte-*.ts`, `hooks/pixel.ts` (una tarjeta por archivo de arte) |

### Oleada 2: que nada se pise y arte en todas partes

| # | Qué | Archivos |
|---|---|---|
| L1 | Botones con aire: grupos con separación de 2 celdas entre botones y una fila libre entre un botón y el texto de arriba o abajo. Arregla V1, V2 y V10. | `hooks/register.tsx` |
| L2 | El arte ocupa todo el ancho del panel (sin tope de 420 px) y la cornisa y la franja de cierre llegan al borde. | `hooks/tablero-nucleo.ts`, `hooks/register.tsx` |
| L3 | Arte nuevo donde falta: cartel de «oficina vacía» (escritorio con el robot esperando) en Subagentes; mostrador con cajonera en la barra de «+ Nuevo agente»; placas de equipo legibles en las tarjetas; pie con zócalo y plantas que rellena el alto sobrante en las tres vistas. | `hooks/arte-oficina.ts` (nuevo), `hooks/register.tsx` |

### Oleada 3: uso de la sesión (lo más importante para Nimai)

| # | Qué | Archivos |
|---|---|---|
| U1 | Contar los tokens de la sesión: cada `turn.complete` (hilo principal y subagentes) suma entrada, salida y caché en el estado. | `hooks/register.tsx`, `types/index.d.ts`, `tests/tablero-uso.test.ts` |
| U2 | Arte del uso, según la opción que elija Nimai (sección 3): tokens consumidos, % que queda de las 5 horas y % que queda de la semana, con la hora en que se renueva cada una. | `hooks/arte-uso.ts` (nuevo), `tests/arte-uso.test.ts` |
| U3 | El bloque de uso va arriba de todo en Subagentes, pide el uso de nuevo en cada turno y, sin lecturas todavía, dice «Las ventanas aparecen después de la primera respuesta» (no culpa a la suscripción). | `hooks/register.tsx`, `hooks/tablero-nucleo.ts` |
| U4 | El robot reacciona al uso: preocupado a partir del 80 % de las 5 horas, y una frase en la burbuja con lo que queda. | `hooks/emociones.ts`, su prueba |

### Oleada 4: verificación y entrega

1. `claude plugin validate mod` en 0, `claude plugin test mod` sin fallas, `node mod/preview/make-preview.mjs` en OK.
2. La vista previa (`mod/preview/preview.html`) muestra cada dibujo en claro y en oscuro; se revisa en el navegador con la skill `verificacion-antes-de-entregar`.
3. Nimai abre `/oficina` en una sesión nueva, en tema claro y oscuro, y manda capturas de las tres vistas (Claude no puede ver el panel de la app).
4. Commit en una rama y, **con permiso de Nimai**, push a GitHub (`bigburrit0/office-agent-mod`).

## 3. Decisiones de Nimai

Se registran acá cuando responda.

**Respondió Nimai, 06/10/2026 (en el chat):**

- **Uso:** «Tablero de oficina»: contador LCD con los tokens de la sesión, batería para las 5 horas y almanaque de 7 días para la semana; cada uno con el % que queda y cuándo se renueva.
- **Tema:** «Siempre claro». El panel usa solo la versión clara; el arte guarda la oscura como opción (por defecto en sus funciones, para no romper las pruebas), pero el panel no la elige. Con esto T2 (botón y detección) queda fuera.
- **Plan:** aprobado, las 4 oleadas. Push a GitHub con permiso aparte.
