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

## 4. Qué se hizo (06/10/2026)

Rama `tema-claro-uso`, un commit local por tarjeta aceptada. Sin push.

| Tarjeta | Estado | Cómo quedó |
|---|---|---|
| T-1 | ✅ | `hooks/tema.ts`: paleta clara; todo texto contrasta 4,5:1 o más (medido). |
| T-2 | ✅ | `hooks/arte-uso.ts`: contador de tokens, batería de 5 horas y almanaque semanal, con «quedan N %» y cuándo se renueva. Revisado en el navegador. |
| T-3, T-3b | ✅ | `hooks/arte-oficina.ts`: escritorio libre, estante y pasillo que llena la pared por pisos. Revisado en el navegador: a 300 px parece algo «catálogo» (objetos repetidos en grilla); a mejorar si a Nimai no le gusta. |
| T-4 | ✅ | Línea de tiempo en claro. |
| T-5, T-5b | ✅ | Panel en tema claro, botones con aire (`columnGap`, `marginTop`), encabezado de equipo reorganizado, arte a todo el ancho. |
| T-6 | ✅ | Tokens de toda la sesión (hilo principal y subagentes) y tablero de uso arriba en Subagentes. Sin ventanas dice «aparecen después de la primera respuesta». |
| T-7 | ✅ | Arte nuevo en las tres vistas; el robot se preocupa con el 80 % de las 5 horas. |
| T-8 | ✅ | Vista previa con sección «Tema claro (el panel)». |
| T2 (botón de tema) | ➖ | Fuera por decisión de Nimai («siempre claro»). |

**Verificación final (orquestador):** `plugin validate mod` OK; `plugin test mod` 255 pruebas, 254 pass y 1 fail por «timed out after 5000 ms» en «compu del trabajo con el kit». Esa prueba también falla por tiempo en la versión anterior (commit `8c67bcb`) con la misma carga de la máquina (CPU ~60 % por otras apps): **sensible a la carga**, no un error. En otras corridas pasaron las 250.

**Lo que falta verificar (solo en la app):** cómo se ve el panel real en el escritorio. Supuestos S1 (llegan las ventanas) y S3 (los tokens cuentan desde que se carga el mod; en una sesión reanudada arrancan de cero).

## 5. Cómo lo prueba Nimai

Necesita: la app de Claude abierta. Tarda unos 5 minutos.

1. En la app, abrí una **sesión nueva** del Code tab (el mod se carga al empezar una sesión; esta sesión tiene la versión vieja).
2. Mandá cualquier mensaje corto (por ejemplo «hola») y esperá la respuesta: las ventanas de 5 horas y semanal llegan con la primera respuesta.
3. Escribí `/oficina`. Vas a ver el panel en claro con el robot, el tablero de uso (tokens, batería de 5 horas y almanaque) y el pasillo abajo.
4. Sacá una captura de **Subagentes**, otra de **Equipos** (con un equipo abierto) y otra de **Editar** (abrí un agente → Editar).
5. Pasale las 3 capturas a Claude.

Si falla: si el panel se ve igual que antes (oscuro), la sesión no tomó el mod nuevo; cerrá la app del todo y volvé a abrirla. Si aparece un aviso con «tablero-oficina» en gris en la conversación, copiáselo a Claude.

Después: Claude ajusta lo que se vea mal y, **con tu permiso**, sube la rama a GitHub (`bigburrit0/office-agent-mod`).

## 6. Segunda revisión (captura de Nimai, 06/10/2026 tarde)

Evidencia: `docs/capturas/2026-10-06-subagentes-claro-v1.png` (Subagentes en la app, tema claro).

**Push:** `master` local quedó adelantado con todo (commit `983ecbe`), pero GitHub rechazó el push: la cuenta conectada en esta compu (`nimodaboss`) no tiene permiso de escritura en `bigburrit0/office-agent-mod` (error 403). Lo sube Nimai con su cuenta (pasos en el chat).

### Por qué pasaron los errores

| # | Qué se ve | Por qué pasó (causa raíz) |
|---|---|---|
| R1 | El uso aparece dos veces: el tablero dibujado y debajo las filas de texto de 5 horas y semanal. | Error del orquestador en la tarjeta T-6: pidió mantener las filas de texto también en el escritorio «porque las pruebas las usan». Se cuidó la prueba en vez del resultado. |
| R2 | Franjas en blanco a la derecha de la cabecera y del tablero de uso. | Supuesto no verificado del orquestador en T-5: estimó 6 px por celda midiendo letras de ancho variable. La captura muestra ~7,9 px por celda (el panel mide ~378 px con 48 celdas): el `× 8` original estaba bien. El arte quedó un 25 % más angosto que el panel. |
| R3 | La oficina de los agentes se ve chica y suelta. | El patio es una tira de 54 px (escala 2) al lado del robot, con fondo celeste, y el escritorio libre es una tarjeta aparte con borde, más abajo. Cada pieza se diseñó en una tarjeta distinta, sin una vista de conjunto. |
| R4 | El pasillo de abajo parece un catálogo. | T-3b pidió «que no quede pared lisa» y el resultado repite objetos en grilla. |

### Plan de mejora (tarjetas E)

| # | Qué | Archivos |
|---|---|---|
| E-1 | **Escena única** de oficina en un solo SVG a todo el ancho: cielorraso con luces, pared, el robot como monitor colgado a la izquierda y el piso con los escritorios de los agentes a escala 3 (o el escritorio libre si no hay nadie), más plantas y ventana para que no sobre pared. | `hooks/arte-escena.ts` (nuevo), su prueba |
| E-3 | El tablero de uso suma el contexto y el costo, para que sea **el único lugar** con el uso. | `hooks/arte-uso.ts`, su prueba |
| E-2 | Panel: la escena reemplaza cabecera + patio + tarjeta de escritorio libre en Subagentes; en el escritorio, el uso se ve solo en el tablero (las filas de texto quedan para la terminal), con «Uso de la sesión» y «Compactar» en una sola fila; ancho del arte con `× 7,8`; pasillo de hasta 140 px (una sola fila de objetos). | `hooks/register.tsx`, `hooks/tablero-nucleo.ts`, pruebas del tablero |

**Lección para próximas tarjetas:** una tarjeta de interfaz no termina con las pruebas en verde; el orquestador pide una captura del panel real antes de dar la oleada por cerrada, y las medidas de pantalla se sacan de una captura, no se estiman.

### Qué se hizo (06/10/2026, tarde)

| Tarjeta | Estado | Cómo quedó |
|---|---|---|
| E-1, E-1b | ✅ | `hooks/arte-escena.ts`: un solo SVG a todo el ancho con cielorraso, pared, robot colgado, agentes a escala 3 (hasta 2 filas) y escritorio libre sobre el mismo piso. Revisado en el navegador con 0, 2, 3 y 6 agentes. |
| E-3 | ✅ | El tablero de uso suma contexto (mini barra) y costo. |
| E-2, E-2b | ✅ | Subagentes: la escena reemplaza cabecera, patio y tarjeta de escritorio libre; el uso está **solo** en el tablero (las filas de texto quedan para la terminal); «Uso de la sesión» y «Compactar» en una fila; ancho `× 7,8`; caja con fondo de pared para que no queden franjas blancas; pasillo de hasta 140 px. Pruebas adaptadas a la escena sin debilitarlas. |

**Verificación final (orquestador):** `plugin test mod` 270 pass, 0 fail; `plugin validate mod` OK; vista previa OK. Falta: captura de Nimai del panel real.

**Error del orquestador en E-2:** la tarjeta no listó `tablero-emociones.test.ts` ni `integracion-kit.test.ts`, que también dependían de los dibujos sueltos (regla R7: buscar con grep todas las pruebas que tocan lo que cambia). Se corrigió con E-2b.
