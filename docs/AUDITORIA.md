# Auditoría del proyecto y plan de mejora

**Fecha:** 06/10/2026, sobre la rama `animaciones-oficina` (commit `7e0b427`).
**Alcance:** el mod `mod/` (hooks, arte, pruebas, vista previa) y el kit `kit/` en lo que toca al mod y a su instalación.
**Cómo se midió:** lectura completa del código, `plugin validate`, chequeo de tipos con `tsc`, las 200 pruebas, la vista previa, render de todo el arte a PNG y una instalación simulada en una compu nueva (sección 3).

## 1. Notas

| Área | Nota | En una línea |
|---|---|---|
| **Código** | **7/10** | Módulos de arte puros y probados, tipos limpios. Pero `register.tsx` es un solo archivo de 2.403 líneas con un render de ~1.300. |
| **Arte** | **8/10** | Paleta coherente, 31 emociones expresivas y actividades por equipo que se leen. A escala 2, algunos objetos del patio quedan chicos. |
| **Detalles considerados** | **7/10** | Hay modo quieto, texto alternativo, panel angosto, escapado de texto y burbujas con voseo. Pero quedaron textos y nombres del tema maya viejo y algunas instrucciones del kit están desactualizadas. |
| Pruebas | 7/10 | 200 pruebas con buen alcance. 52 solo pasan en Windows, por las rutas del disco falso, y no hay CI. |
| Integración en la compu nueva | 6/10 | Carga y funciona con el kit. Pero el primer arranque escribe agentes sin preguntar y dos agentes del kit no cumplen su propio esquema. |
| Rendimiento | 8/10 | Hay caché de SVG, se escribe poco en el estado y los dibujos están bajo el tope. El caché crece sin límite en sesiones largas. |
| Documentación | 7/10 | Los planes son claros y los comentarios están en castellano. El README tiene una aceptación vieja y el kit nombra un comando que ya no hace lo que dice. |

## 2. Hallazgos

### Código (7/10)

**Lo bueno**
- Los módulos de arte (`arte-*.ts`, `emociones.ts`, `pixel.ts`) son puros, sin imports y con escapado de todo texto de afuera. Se prueban solos.
- El contrato de estado (`types/index.d.ts`) está completo. `plugin validate` da 0 y `tsc` no tiene errores.
- Se cuida no escribir en el estado si nada cambió (el caché de SVG mantiene el mismo string y la animación no se reinicia).
- Todo lo que toca el disco o el motor está en `try/catch` con un aviso legible.

**A mejorar**

| # | Hallazgo | Dónde | Impacto |
|---|---|---|---|
| C1 | `register.tsx` tiene 2.403 líneas. El hook de render arma las tres vistas, la cabecera, el patio y el uso en una sola función de ~1.300 líneas. | `hooks/register.tsx` | Difícil de cambiar sin romper otra vista. Cada tarjeta nueva lo agranda. |
| C2 | Hay estado y código que ya no se ven: `flashHasta` se sigue escribiendo pero las «huellas» ya no se dibujan; `tituloArmado` está en el contrato y no se usa. `waveBarSvg`, `pixelTextSvg`, `textoArmadoSvg`, `emblemaSvg`, `glifoMatriz` y `glifoPaleta` solo los usa la vista previa. | `register.tsx`, `pixel.ts`, `arte-iconos.ts`, `types/index.d.ts` | Escrituras y redibujos de más; peso muerto. |
| C3 | El caché de SVG (`svgCache`) guarda una entrada por cada subagente que pasó por el patio y nunca la borra. | `register.tsx` (`cachedSvg`) | En una sesión con cientos de subagentes acumula megas. |
| C4 | El color de cada equipo vive en tres tablas que no coinciden: `EQUIPOS_ESQUEMA` (nombre de color para Claude Code: research es `purple`), `EQUIPO_ACENTO` (hex del panel: research es azul `#5aa9e6`) y `EQUIPOS_EMBLEMA`. | `catalogo.ts`, `arte-iconos.ts`, `pixel.ts` | El mismo equipo se ve de un color en Claude Code y de otro en el patio. |
| C5 | `TAREA_EQUIPO` (el subtítulo de cada equipo) solo tiene los equipos de casa. Seguridad, mantenimiento, limpieza, facilities y arquitectura no tienen subtítulo. | `register.tsx` | Detalle visible en la compu del trabajo. |
| C6 | Quedaron nombres del tema maya en identificadores y claves (`jaguar`, `temploSvg`, `diosSvg`, `tzolkin`, `PALETTE.selva`). | varios | Confunde al leer; no afecta al usuario salvo por C10. |

### Arte (8/10)

**Lo bueno**
- Paleta común beige, azul y naranja en todo el panel.
- El robot tiene 31 emociones que se distinguen entre sí, con cuadros discretos y un modo quieto en todas.
- El patio se lee por color y cada equipo hace algo propio.
- Todos los SVG pasan el tope de peso (el más pesado: 118.160 caracteres).

**A mejorar**

| # | Hallazgo | Impacto |
|---|---|---|
| A1 | A escala 2 la celda mide 44 × 54 px: los binoculares, el llavero o la escuadra quedan de 2 a 4 píxeles. | En pantalla chica, algunas actividades no se entienden. |
| A2 | Hay actividades parecidas entre sí: tablas y pizarra (tablero blanco parado), y llaves y escuadra (plano azul sobre el escritorio). | Se confunden de un vistazo. |
| A3 | En la línea de tiempo, las marcas del eje se pisan a la derecha («7m30s10m00s»). | Se ve desprolijo con poco ancho. |
| A4 | En «aburrido», la taza tapa parte del ojo derecho del robot. | Detalle. |
| A5 | En la leyenda, dos tonos oscuros quedan bajo el contraste de 4,5:1 con la letra crema: mantenimiento `#9c7a10` (3,7:1) y limpieza `#5e7f18` (4,3:1). Los otros 10 lo pasan. | Legibilidad. |

### Detalles considerados (7/10)

**Lo bueno**
- Modo quieto, `alt` en cada SVG, panel angosto y prioridades de espacio (la lista nunca desaparece).
- Confirmación antes de restaurar o compactar, y avisos de error con el motivo.
- Hora local para el saludo, el hambre y la salida. Voseo en todas las frases.

**A mejorar**

| # | Hallazgo | Impacto |
|---|---|---|
| D1 | Quedan textos alternativos del tema maya en un panel que ya es una oficina: «Templo abandonado», «Friso de piedra tallada», «Dosel de la selva», «Franja de greca maya», «Hoy en el calendario maya», «Taller del escriba», «Dios …». | Un lector de pantalla describe otra cosa que lo que se ve. |
| D2 | Sin suscripción (una cuenta con clave de API, frecuente en empresas) el bloque de uso dice «sin datos», pero el motor sí da el costo de la sesión en dólares y no se muestra. | En la compu del trabajo puede ser la única cifra útil. |
| D3 | `README.md` pide «mismos pass que el mod original», un criterio de cuando se copió el mod. | Aceptación ambigua. |

## 3. Prueba de integración en «el nuevo espacio de trabajo»

Se tomó como «nuevo espacio de trabajo» la compu del trabajo donde se instala el kit (`kit/ADAPTAR.md`): Windows, app de escritorio, equipos del edificio. Se simuló en Linux con un HOME vacío:

| Paso | Resultado |
|---|---|
| Clon limpio del repo y enlace de `mod` en `~/.claude/skills/tablero-oficina`, como dice `kit/LEEME.md` | ✅ `plugin validate` da 0 y `claude plugin list` lo muestra **loaded** como `tablero-oficina@skills-dir`. |
| Copiar los 15 agentes del kit a `~/.claude/agents/<equipo>/`, con los marcadores `{{RAIZ}}` resueltos | ✅ El catálogo los lee: 15 agentes, 0 errores. |
| Validar esos agentes con el esquema del panel | ⚠️ 13 sin avisos. **arquitecto** y **disenador** tienen 1 aviso: sus herramientas (lectura y web, más Write y Edit) no son ningún juego de `JUEGOS_HERRAMIENTAS`. El kit no cumple su propio esquema. |
| Abrir `/oficina` con el kit ya instalado | ✅ No escribe nada en la carpeta de agentes. Muestra los 5 equipos con sus placas y ningún aviso de «equipo sin actividad». |
| Abrir `/oficina` (o arrancar una sesión) en una compu **sin** agentes | ❌ Escribe `implementador.md`, `corrector.md`, `investigador.md` y `revisor.md` en `~/.claude/agents/base/` **sin preguntar**. Choca con «Nunca instalar sin aprobación» de `ADAPTAR.md`. Además, esos 4 traen el prompt corto viejo y colores por rol (no el verde de base), así que el panel los marca con ⚠. Si después se instala el kit, sus 4 agentes de base chocan por nombre. |
| Crear un agente por cada equipo del edificio con «+ Nuevo agente» (seguridad, mantenimiento, limpieza, facilities, arquitectura) | ✅ Se crean los 5 archivos en la carpeta de su equipo. |
| Esos 5 agentes trabajando, con tarjetas `OPS-1` a `OPS-5` | ✅ 5 celdas en el patio, cada una con el color y la actividad de su equipo, y la leyenda con los 5 equipos. |
| Uso de la sesión sin suscripción | ✅ Dice que no hay datos de 5 horas ni semanal, sin romper nada. |

**Lo que no se pudo verificar desde acá** (hay que mirarlo en la compu del trabajo):
- El enlace de Windows (`mklink /J`): acá se probó con un enlace simbólico de Linux.
- Que Claude Code tome agentes guardados en **subcarpetas** de `~/.claude/agents` (para eso hace falta una sesión real con cuenta).
  - `kit/ADAPTAR.md` (paso 7) dice que se verifique con `claude agents`. En esta versión de Claude Code ese comando lista **sesiones en segundo plano**, no agentes: devuelve `[]` aunque haya agentes. Hay que verificar con `/agents` dentro de una sesión.
- Si la empresa permite plugins desde `~/.claude/skills` (una política de organización puede apagarlos).
- Si la cuenta del trabajo reporta las ventanas de 5 horas y semanal.

## 4. Plan de mejora

**Estado al 06/10/2026, tarde:** hecho todo lo que se podía desde acá, salvo M8 (no se puede) y la oleada 3 (es en la compu del trabajo). Detalle en la sección 5.

Ordenado por urgencia. Cada ítem dice qué archivos toca, para armar tarjetas de a 3 en paralelo sin pisarse.

### Oleada 0: antes de instalar en el trabajo

| # | Qué | Archivos | Por qué |
|---|---|---|---|
| M1 | Que el mod no escriba agentes solo. Migrar los 4 roles únicamente si hay roles guardados de la versión vieja (casa). Si no, mostrar en Equipos un botón «Crear los 4 roles base» con confirmación. | `hooks/register.tsx`, `tests/tablero-equipos.test.ts` | Hallazgo ❌ de la sección 3. |
| M2 | Arreglar arquitecto y disenador: o se agrega un juego «diseño» (lectura y web, más Write y Edit) al esquema y al panel, o se les da un juego existente. | `kit/metodo/ESQUEMA-AGENTES.md`, `hooks/catalogo.ts`, `kit/agentes/direccion/*.md` | El kit tiene que cumplir su propio esquema. |
| M3 | Corregir el kit: verificar con `/agents` en una sesión (no `claude agents`), y en `LEEME.md` instalar los agentes antes de enlazar el mod. | `kit/ADAPTAR.md`, `kit/LEEME.md`, `kit/CAMBIOS.md` | El comando de hoy da un falso «no hay agentes». |
| M4 | Disco falso de las pruebas que sirva en Windows y en Linux: que tome el separador de `HOME_FALSO`. | `tests/ayuda-tablero.ts`, `tests/tablero-equipos.test.ts` | Las 200 pruebas tienen que pasar en cualquier compu. Es lo que permite tener CI. |

### Oleada 1: código

| # | Qué | Archivos |
|---|---|---|
| M5 | Partir `register.tsx` por vista: `vista-subagentes.tsx`, `vista-equipos.tsx`, `vista-editar.tsx`, `cabecera.tsx` y `uso.tsx`. `register.tsx` queda con los hooks y el estado. | `hooks/*` (una tarjeta por vista, en serie) |
| M6 | Sacar el estado y el código muertos: `flashHasta`, `tituloArmado`, y las funciones que solo usa la vista previa (o moverlas a ella). | `register.tsx`, `types/index.d.ts`, `pixel.ts`, `preview/make-preview.mjs` |
| M7 | Limpiar el caché de SVG: en cada refresco, borrar las entradas `celda-<id>` de subagentes que ya no están en la lista. | `register.tsx` |
| M8 | Una sola fuente de color por equipo: el esquema guarda el hex del panel y el nombre de color de Claude Code se elige como el más cercano. Una prueba exige que coincidan. | `catalogo.ts`, `arte-iconos.ts`, `pixel.ts`, sus pruebas |
| M9 | Subtítulo de los equipos del edificio (o leerlo de la skill del equipo, si existe). | `register.tsx` |

### Oleada 2: detalles y arte

| # | Qué | Archivos |
|---|---|---|
| M10 | Textos alternativos con el tema oficina: «Edificio», «Cornisa», «Cielorraso», «Fecha del día», «Placa del equipo». Opcional: renombrar los identificadores mayas. | `register.tsx` |
| M11 | Mostrar el costo de la sesión en dólares cuando no hay ventanas de 5 horas ni semanal. | `register.tsx`, `tests/tablero-uso.test.ts` |
| M12 | Eje de la línea de tiempo sin marcas pisadas: saltear las que no entran. | `pixel.ts`, su prueba |
| M13 | Patio a escala 3 cuando el panel es ancho (66 × 81 px por celda). | `register.tsx` |
| M14 | Diferenciar tablas de pizarra (pantalla con gráfico en vez de tablero) y llaves de escuadra (llavero grande en la mano y puerta al costado). | `arte-actividades.ts`, su prueba |
| M15 | Taza de «aburrido» corrida para no tapar el ojo. Tonos de la leyenda con contraste de 4,5:1 o más con la letra crema. | `arte-robot.ts`, `register.tsx` |
| M16 | `README.md` con la aceptación actual: validate en 0, 200 pass y la vista previa en OK. | `README.md` |

### Oleada 3: verificación en la compu del trabajo (la usuaria)

1. Enlazar el mod con `mklink /J` y ver `tablero-oficina` como **loaded** en `claude plugin list`.
2. En una sesión, `/agents` muestra los agentes instalados en subcarpetas.
3. `/oficina`: los equipos del edificio aparecen con su actividad y el bloque de uso muestra las ventanas o el aviso de «sin datos».
4. `claude plugin test mod` da 200 pass.

**Prioridad sugerida:** M1 a M4 antes de instalar (son chicos y evitan problemas reales); M5 es la mejora más grande para seguir creciendo; el resto se puede hacer de a poco.

## 5. Qué se hizo (06/10/2026, tarde)

| # | Estado | Cómo quedó |
|---|---|---|
| M1 | ✅ | La migración de los 4 roles solo corre si hay roles guardados de la versión vieja (la compu de casa). En una compu sin agentes, Equipos ofrece «Crear los 4 roles base…» con confirmación; se crean cumpliendo el esquema y sin pisar ningún archivo. |
| M2 | ✅ | Juego de herramientas nuevo **documentos** en el esquema, en el panel y en el editor (que también reconoce **pruebas**). Los 15 agentes del kit pasan sin avisos. |
| M3 | ✅ | `kit/LEEME.md` con instrucciones paso a paso para la sesión de Claude del trabajo. `kit/ADAPTAR.md` verifica con `/agents` y carga el mod después de los agentes. `kit/CAMBIOS.md` lista lo que hay que llevar a las fuentes de casa. |
| M4 | ✅ | El disco falso de las pruebas sirve en Windows, Linux y macOS. |
| M5 | ✅ parcial | Lo puro pasó a `hooks/tablero-nucleo.ts` (`register.tsx` bajó de 2.524 a 2.046 líneas). **No se puede ir más allá:** el motor solo deja pasar `$` a funciones del mismo archivo que los hooks, y lee los átomos de estado donde se declaran. Las acciones, el estado y las vistas (que llaman a `$` desde sus botones) tienen que quedar en `register.tsx`. |
| M6 | ✅ | Fuera `flashHasta` y `tituloArmado`. Las funciones que solo usa la vista previa quedan en `pixel.ts` (son de la vista previa y de sus pruebas). |
| M7 | ✅ | El caché borra las celdas de subagentes que ya no están en la lista. |
| M8 | ➖ | No se puede unificar: Claude Code tiene 8 colores de agente y hay 12 equipos, así que el color de Claude Code y el del patio no pueden coincidir uno a uno. En su lugar, una prueba exige que las 5 tablas por equipo (esquema, color, emblema, placa y actividad) tengan siempre los mismos equipos. |
| M9 | ✅ | Subtítulos de los 5 equipos del edificio. |
| M10 | ✅ | Textos alternativos con el tema oficina. Los identificadores mayas quedan (no los ve nadie). |
| M11 | ✅ | Sin ventanas de 5 horas y semanal, el bloque de uso muestra el costo de la sesión. |
| M12 | ✅ | Las marcas del eje no se pisan, el total siempre se ve y nada se sale del dibujo en paneles de 200 px. |
| M13 | ✅ | Si los agentes del patio entran en una fila a escala 3, se dibujan a 66 × 81 px. |
| M14 | ✅ | Datos trabaja en un monitor oscuro y facilities ordena un tablero de llaves. |
| M15 | ✅ | El vapor del café ya no tapa el ojo. Todos los chips de la leyenda tienen contraste de 4,5:1 o más. |
| M16 | ✅ | `README.md` con la aceptación actual. |
| Extra | ✅ | Prueba de integración permanente con los agentes del kit (`mod/tests/integracion-kit.test.ts`). Encontró que la descripción de `librarian` pasaba los 200 caracteres al resolver `{{BIBLIOTECA}}` con una ruta de Windows: corregida. |

La oleada 3 (verificación en la compu del trabajo) queda para la usuaria, guiada por `kit/LEEME.md`.
