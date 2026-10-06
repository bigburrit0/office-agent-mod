# Plan: completar la vista «Editar agente»

**Fecha:** 06/10/2026. **Pedido de Nimai** (con las capturas de la versión «pieza única»): «Quedó casi perfecto, me gusta mucho el resultado. Solo falta completar la sección de "editar" agente. Pero quiero que solo creemos las instrucciones».

Nimai respondió las preguntas de la sección 4 el 06/10/2026 (ver «Decisiones de Nimai») y pidió seguir: **la oleada G está implementada** (ver sección 6). Falta la captura de Nimai en la app para cerrarla.

**Evidencia:** `docs/capturas/2026-10-06-editar-pieza-unica.png` (Editar `apps-script`), con `docs/capturas/2026-10-06-subagentes-pieza-unica.png` y `docs/capturas/2026-10-06-equipos-pieza-unica.png` como referencia del estilo que ya le gusta a Nimai. Código: `mod/hooks/register.tsx` (vista `roles` con `draft`, ~líneas 1060-1290), `mod/hooks/catalogo.ts` (`AgenteCatalogo`, `validarAgente`), `mod/types/index.d.ts` (`RolBorrador`).

## 1. Cómo está hoy (verificado en la captura y el código)

De arriba abajo:
1. Escena de la oficina con el robot colgado, el ícono del rol y la placa del equipo.
2. Burbuja: «Editando apps-script. Lo que guardes vale en una sesión nueva.».
3. Fila «← Equipos / base / apps-script».
4. **Otra vez** el ícono del rol y la placa del equipo, con el nombre y «equipo base · Caja de herramientas».
5. Tres selectores sueltos sobre el fondo del panel: Modelo, Esfuerzo, Herramientas.
6. Descripción en un recuadro, con el botón «Cambiar descripción (D)».
7. «▸ Prompt (3679 caracteres) (P)». Desplegado, muestra el texto y un campo de **una sola línea** para reemplazarlo entero.
8. Guardar (G) y Cancelar (C). «Restaurar original…» aparece solo en los 4 roles de siempre.
9. Pasillo de la oficina y cornisa.

Lo que el borrador permite cambiar (`RolBorrador`): modelo, esfuerzo, herramientas, descripción y prompt. El agente tiene además equipo, etiquetas, color, emblema y líneas extra del frontmatter (`maxTurns`, `skills`…), que no se ven ni se editan.

## 2. Problemas

| # | Qué pasa | Por qué importa |
|---|---|---|
| P1 | El ícono y la placa del equipo aparecen dos veces (escena y encabezado), igual que pasaba con el uso. | Información repetida; Nimai ya pidió unificar en Subagentes. |
| P2 | El nombre del rol se ve en un marrón claro de poco contraste. | Es lo más importante de la vista y es lo que menos se lee. |
| P3 | Los campos flotan sobre el fondo del panel, sin tarjeta ni arte. | Rompe la «pieza única»: Equipos usa tarjetas con borde del color del equipo. |
| P4 | El prompt (miles de caracteres) solo se cambia con un campo de una línea que lo reemplaza entero. | En la práctica no se puede editar desde el panel. |
| P5 | Los avisos del esquema (`validarAgente`: «La descripción no tiene "Usalo para"», «Faltan secciones en el prompt»…) se ven en la lista de Equipos (⚠ 4), pero no en el editor. | Se edita sin saber qué hay que arreglar, y no se ve cuándo quedó bien. |
| P6 | Equipo, etiquetas y extras (`maxTurns`, `skills`) no se ven. | Para entender un agente hay que abrir el archivo. |
| P7 | Antes de guardar solo dice «● Cambios sin guardar», sin decir qué cambió. | Guardar reescribe el archivo del agente: conviene ver qué va a cambiar. |
| P8 | «Restaurar original» existe solo para implementador, corrector, investigador y revisor. | Los 15 agentes del kit no tienen cómo volver atrás desde el panel. |

## 3. Propuesta (tarjetas G)

Mismo método que las oleadas anteriores: cada tarjeta nombra su agente, archivos permitidos (≤ 5) y aceptación binaria. Al final, `claude plugin test mod` en 0 fail, la maqueta (`node mod/preview/maqueta.mjs --nueva`) revisada en el navegador y **una captura de Nimai** antes de dar la oleada por cerrada.

| # | Qué | Archivos | Agente |
|---|---|---|---|
| G-1 | **Encabezado sin repetir:** la escena ya muestra ícono y placa, así que debajo queda solo la ruta «← Equipos / base / apps-script» y una línea con el nombre en negrita y color legible (`legibleSobre`, contraste ≥ 4,5), equipo y tarea. Arregla P1 y P2. | `hooks/register.tsx`, `tests/tablero-editar.test.ts` | implementador |
| G-2 | **Tarjetas como en Equipos:** tres tarjetas con borde del color del equipo: «Cómo trabaja» (modelo, esfuerzo, herramientas), «Cuándo usarlo» (descripción, con contador de caracteres sobre 200) y «Instrucciones» (prompt). Arregla P3. | `hooks/register.tsx`, `tests/tablero-editar.test.ts` | implementador |
| G-3 | **Avisos del esquema en el editor:** arriba de las tarjetas, una caja «Para revisar» con los avisos de `validarAgente` **del borrador** (se recalculan al cambiar algo); cuando no queda ninguno, «✓ Cumple el esquema». Al tocar Guardar con avisos pendientes, se guarda igual y el aviso dice «Guardado con N avisos para revisar» (no bloquea). Arregla P5. | `hooks/register.tsx`, `tests/tablero-editar.test.ts` | implementador |
| G-4 | **Qué cambia al guardar:** con cambios, una lista corta «Vas a cambiar: modelo sonnet → haiku · descripción (+12 caracteres)…» arriba de Guardar. Arregla P7. | `hooks/tablero-nucleo.ts` (función pura), `hooks/register.tsx`, pruebas | implementador |
| G-5a | **Abrir en el editor:** botón «Abrir en el editor» que abre el archivo del agente; al volver, el panel lo relee. Primero verificar en los tipos del motor que se pueda abrir un archivo desde el panel; si no se puede, mostrar la ruta con un botón «Copiar ruta» y avisarle a Nimai. Arregla P4. | `hooks/register.tsx`, pruebas | implementador |
| G-5b | **Editar por secciones:** el prompt se parte por sus títulos (`## Rol`, `## Antes de empezar`, `## Cómo trabajás`, `## Límites`, `## Entrega`); cada sección se despliega y se cambia por separado; al guardar se vuelve a armar en el mismo orden (función pura en `tablero-nucleo.ts`, probada ida y vuelta sin perder texto). Arregla P4. | `hooks/tablero-nucleo.ts`, `hooks/register.tsx`, pruebas | implementador |
| G-6 | **Ficha completa en solo lectura (equipo y etiquetas no se editan):** equipo, etiquetas y extras (`maxTurns`, `skills`) en una línea chica al pie de «Cómo trabaja». Arregla P6. | `hooks/register.tsx`, pruebas | implementador |
| G-7 | **Volver a la versión anterior, para cualquier agente:** guardar una copia del archivo antes de cada Guardar y ofrecer «Volver a la versión anterior». Arregla P8. | `hooks/register.tsx`, `hooks/catalogo.ts`, pruebas | implementador |

Orden sugerido: G-1 y G-3 primero (son chicas y se ven enseguida), después G-2 y G-4, y al final G-5a, G-5b, G-6 y G-7. Todas tocan `register.tsx`, así que van **en serie**, una por vez.

## 4. Preguntas para Nimai (antes de implementar)

1. **Prompt largo (G-5).** ¿Cómo querés editarlo?
   - **a) Abrir el archivo del agente en el editor** (VS Code o el que use la app) con un botón «Abrir en el editor», y el panel vuelve a leerlo al guardar. Es lo más cómodo para textos largos. Hay que verificar que el motor permita abrir un archivo desde el panel.
   - **b) Editar por secciones** dentro del panel: el prompt se parte por sus títulos (`## Rol`, `## Antes de empezar`, `## Cómo trabajás`, `## Límites`, `## Entrega`) y cada sección se cambia por separado.
   - **c) Las dos.**
2. **Equipo y etiquetas (G-6).** ¿Solo mostrarlos, o también poder cambiarlos? Cambiar el equipo mueve el archivo a otra carpeta y cambia color y emblema: es un cambio de reglas del esquema.
3. **Volver atrás (G-7).** ¿Querés «Volver a la versión anterior» para todos los agentes, guardando una copia antes de cada Guardar?
4. **Avisos (G-3).** ¿Además de mostrarlos, querés que el botón Guardar avise (sin bloquear) si quedan avisos?

### Decisiones de Nimai (06/10/2026, en el chat)

1. Prompt largo: **c) las dos** → G-5a (abrir en el editor) y G-5b (editar por secciones).
2. Equipo y etiquetas: **solo mostrarlos** → G-6 en solo lectura; el equipo no se cambia desde el panel.
3. Volver a la versión anterior para todos los agentes: **sí** → G-7.
4. Guardar avisa si quedan avisos, sin bloquear: **sí** → incluido en G-3.

## 5. Cómo se verifica

- Pruebas: `claude plugin test mod` → 0 fail; `claude plugin validate mod` → OK.
- Maqueta: `node mod/preview/maqueta.mjs --nueva`, mirar el escenario «Editar un agente» en `mod/tests/salida/maqueta.html` a 378 px.
- Captura de Nimai de la vista Editar en la app (sesión nueva → `/oficina` → Equipos → abrir un agente → Editar).

## 6. Qué se hizo (06/10/2026)

Todas las tarjetas, en serie, sobre `hooks/register.tsx`. Pruebas nuevas en `tests/tablero-editar-g.test.ts`.

| # | Estado | Notas |
|---|---|---|
| G-1 | Hecha | La placa y el ícono quedan solo en la escena. El nombre va en la ruta, en negrita y con `legibleSobre` (≥ 4,5); debajo, «equipo · dios · tarea». |
| G-2 | Hecha | Tarjetas «Cómo trabaja», «Cuándo usarlo» (contador `n/200`, en naranja si pasa) e «Instrucciones», con borde del color del equipo. |
| G-3 | Hecha | Caja «Para revisar (N)» con los avisos de `validarAgente` sobre el borrador, o «✓ Cumple el esquema». Guardar con avisos guarda igual y dice «Guardado en … con N avisos para revisar». |
| G-4 | Hecha | `cambiosBorrador` (en `tablero-nucleo.ts`): «Vas a cambiar: modelo sonnet → haiku · descripción (+12 caracteres)…». |
| G-5a | Hecha, **con un límite** | El motor **no tiene** una función para abrir un archivo en el editor. «Abrir en el editor» corre `code <ruta>` (y `cmd /c code <ruta>`, porque en Windows `code` es un .cmd). Si no encuentra VS Code, copia la ruta y lo avisa. Al volver, el botón «Releer archivo» relee la carpeta y rearma el borrador (el panel no lo relee solo mientras se edita). |
| G-5b | Hecha | `partirSecciones` / `unirSecciones` / `reemplazarSeccion` (probadas ida y vuelta). Cada sección se despliega y tiene «Cambiar esta sección». El campo es de una línea (el motor no tiene campo multilínea): para textos con varios párrafos conviene «Abrir en el editor». Un prompt sin títulos `##` se ve entero como «Texto completo». |
| G-6 | Hecha | Etiquetas y extras (`maxTurns`, `skills`…) en una línea chica al pie de «Cómo trabaja», solo lectura. El equipo ya se ve en el encabezado. |
| G-7 | Hecha | Antes de cada Guardar (y de Restaurar) se guarda una copia del archivo en el store del mod (`anteriores`, ruta → texto), no en la carpeta de agentes. «Volver a la versión anterior…» pide confirmación; lo que había queda como copia, así que se puede deshacer. |

Extra: el texto al pie de Equipos («Los cambios se guardan…») ahora hace salto de línea; era uno de los 5 elementos de Equipos que se salían del marco en la maqueta (quedan 4, ya existían antes de esta oleada).

Verificación: `claude plugin test mod` → 295 pass, 0 fail; `claude plugin validate mod` → OK; `node mod/preview/make-preview.mjs` → OK; maqueta con un escenario nuevo, «Editar · por secciones, con cambios», con 0 elementos fuera del marco en las dos vistas de Editar.

**Falta:** la captura de Nimai en la app (sesión nueva → `/oficina` → Equipos → abrir un agente → Editar), y probar en su compu que «Abrir en el editor» abre VS Code.
