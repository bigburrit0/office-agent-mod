# tablero-oficina: puesta en marcha y especificaciones técnicas

**Fecha:** 06/10/2026. **Estado:** funcionando en la app de escritorio (pestaña Code). Nimai lo confirmó con tres capturas: Subagentes, Equipos y Editar de un agente (`docs/capturas/2026-10-06-*-pieza-unica.png`).

Este documento junta, en un solo lugar, cómo se hace funcionar el mod, los pasos que se siguieron y sus especificaciones técnicas. Lo **verificado** lleva el comando o el archivo; lo **supuesto** está marcado.

---

## 1. Qué es

`tablero-oficina` es un **mod de Claude Code**: un plugin de funciones (`hooks/register.tsx`) que dibuja un panel «Oficina» en 8 bits. Se abre con el comando `/oficina` y tiene tres vistas:

| Vista | Qué muestra |
|---|---|
| **Subagentes** | Escena de oficina con el robot colgado, un escritorio por subagente (color y actividad según su equipo), línea de tiempo, informe de cada uno y «Uso de la sesión» (tokens, contexto, costo, 5 horas y semana, compactar). |
| **Equipos** | Los equipos de agentes del catálogo, con su color, emblema y avisos del esquema (⚠). Filtro por etiqueta, «+ Nuevo agente». |
| **Editar** | Un agente: tarjetas «Cómo trabaja», «Cuándo usarlo» e «Instrucciones», avisos del esquema, qué cambia al guardar, edición por secciones, abrir en el editor, volver a la versión anterior. |

Más: modo **Quieto** (sin animaciones), tema claro, robot con 31 emociones, texto alternativo en el arte.

---

## 2. Qué se necesita

| Requisito | Valor | Verificado |
|---|---|---|
| Claude Code | **2.1.291 o más nuevo** (los plugins de funciones no existen en versiones viejas). Esta compu: 2.1.292. | `claude --version` |
| Dónde corre | Terminal **y** pestaña Code de la app de escritorio. | Verificado en la app |
| Node (solo para la vista previa y la maqueta) | 22.18 o más nuevo. Esta compu: 24.19.0. | `node --version` |
| Sistema | Windows, Linux o macOS. El enlace de instalación (junction) es de Windows. | — |
| Política de la organización | No debe bloquear plugins. Si lo hace, el mod no carga (**supuesto**: no se probó en una compu con esa política). | — |

---

## 3. Instalación paso a paso (Windows, PowerShell)

Esta es la forma con la que quedó funcionando. Tarda unos 5 minutos.

1. **Clonar el repo** (una sola vez):

   ```powershell
   git clone https://github.com/bigburrit0/office-agent-mod "C:\Users\ngomez\Desktop\Claude Code folder\office-agent-mod"
   ```

2. **Validar el mod** (no escribe nada). Desde la carpeta del repo:

   ```powershell
   claude plugin validate mod
   ```

   Tiene que terminar con `Validation passed` (con avisos es normal: «No author information»).

3. **Probar el mod:**

   ```powershell
   claude plugin test mod
   ```

   Tiene que dar 0 fail (ver la sección 8 sobre fallas por tiempo).

4. **Crear el enlace** desde `~\.claude\skills` hacia la carpeta `mod`. Un plugin con `.claude-plugin\plugin.json` dentro de `~\.claude\skills\` se carga en el lugar, sin copiarse, en cada sesión nueva. Si ya existe `tablero-oficina` ahí, **no lo pises**.

   ```powershell
   cmd /c mklink /J "%USERPROFILE%\.claude\skills\tablero-oficina" "C:\Users\ngomez\Desktop\Claude Code folder\office-agent-mod\mod"
   ```

5. **Verificar que cargó:**

   ```powershell
   claude plugin list
   ```

   Tiene que aparecer `tablero-oficina@skills-dir`, `Version: 0.1.0`, `Status: ✔ loaded`. (Verificado en esta compu el 06/10/2026; el enlace apunta a `office-agent-mod\mod`.)

6. **Abrir una sesión nueva** (o `/reload-plugins`) y escribir `/oficina`. Se abre el panel «Oficina» y el robot saluda.

### Los agentes tienen que estar antes que el mod

El mod lee los agentes de `~\.claude\agents\<equipo>\<nombre>.md`. Si no hay ninguno, el panel ofrece crear 4 roles base. Con el kit del método (`kit/ADAPTAR.md`) ya están los 15 agentes y no hace falta. El mod **no escribe agentes sin permiso**.

### Si falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `/oficina` no existe | El mod no cargó. | `claude plugin list`; si no figura, revisar el enlace del paso 4. Si figura apagado: `claude plugin enable tablero-oficina@skills-dir`. |
| `mklink` dice que ya existe | Ya estaba instalado. | No lo pises: verificá con `claude plugin list`. |
| Validación falla | Versión vieja de Claude Code o archivo dañado. | `claude --version`; `git status`. |
| Pantalla vacía en Equipos | No hay agentes en `~\.claude\agents`. | Instalar el kit o usar «+ Nuevo agente». |
| Claude Code se cierra con el código `3221226505` (`0xC0000409`) | Falla interna del proceso con la compu corta de memoria (**supuesto**, ver sección 8). | Cerrar apps y reabrir; no es culpa del mod (**sin evidencia** de que lo cause). |

### Cómo se deshace

- Quitar solo el enlace: `cmd /c rmdir "%USERPROFILE%\.claude\skills\tablero-oficina"` (**sin `/s`**: no se borra la carpeta real).
- Apagar sin quitar: `claude plugin disable tablero-oficina@skills-dir`.

### Cómo se actualiza

El enlace apunta al repo, así que alcanza con:

```powershell
git pull
```

y abrir una sesión nueva. No hay nada que copiar. (El 06/10/2026 se bajó así la «Oleada G».)

---

## 4. Especificaciones técnicas

### 4.1 Plugin

| Dato | Valor | Archivo |
|---|---|---|
| Nombre | `tablero-oficina` | `mod/.claude-plugin/plugin.json` |
| Versión | `0.1.0` | ídem |
| Tipos | `./types/index.d.ts` | ídem |
| Módulos de funciones | `./register.tsx` | `mod/hooks/hooks.json` |
| Comando | `/oficina` (no `/tablero`) | `register.tsx`, `command.run` |
| Panel (`PANE`) | `tablero-oficina` | `mod/hooks/tablero-nucleo.ts` |

### 4.2 Eventos del motor que usa (`mod/hooks/register.tsx`)

| Evento | Para qué |
|---|---|
| `session.start` | Cargar el catálogo y los roles guardados. |
| `command.run` (`oficina`) | Abrir el panel y arrancar el reloj. |
| `agent.spawn` | Registrar el subagente nuevo en el patio. |
| `turn.complete` | Sumar tokens e informe de cada subagente. |
| `session.measure` | Leer el uso de la sesión (5 horas, semana, contexto, costo). |
| `ui.render` (`Pane`, `tablero-oficina`) | Devolver el árbol del panel. |
| `ui.close` | Parar el reloj cuando el panel se cierra. |
| `tool.call` (`TaskCreate`, `TaskUpdate`, `TodoWrite`) | Skin «Terminal retro»: anotar la lista de tareas de la sesión para el % del proyecto. Deja pasar la llamada sin cambios y solo lee el resultado. |

APIs del motor usadas: `$.agent.list/register`, `$.fs.list/read/write/exists`, `$.store.get/set`, `$.session.usage`, y átomos de `$.state`.

### 4.3 Estado (`$.state['tablero-oficina']`)

Contrato completo en `mod/types/index.d.ts`. Lo principal:

| Clave | Qué guarda |
|---|---|
| `agents` | Los últimos **100** subagentes vistos (`MAX_AGENTS`). |
| `catalogo` | Agentes leídos de disco, errores de lectura y la carpeta raíz. |
| `view` | `subagentes` o `roles` (Equipos/Editar). |
| `draft` | Borrador del agente que se edita (`RolBorrador`); `null` si no se edita. |
| `abiertos` | Desplegables abiertos (`grupo:`, `agente:`, `seccion:<n>`, `uso`, `confirmar-*`…). |
| `informes` | Último texto final, tokens y turnos de cada subagente (máx. 100). |
| `tokensSesion` | Tokens de la sesión entera. |
| `uso` | Ventanas `five_hour` y `seven_day`, contexto en % y costo. |
| `reaccion`, `molesto`, `patio` | Emociones del robot y animaciones de entrada y salida del patio. |
| `quieto` | Arte sin animaciones. |
| `proyecto` | Skin «Terminal retro»: tareas de la sesión, tarjetas leídas de `tarjetas/*.md` y la carpeta de la sesión. |

El estado **persistente** (`$.store`) tiene dos claves: `roles` (roles guardados por la usuaria) y `anteriores` (ruta del archivo → texto previo, para «Volver a la versión anterior»).

### 4.4 Archivos (`mod/hooks/`)

| Archivo | Líneas | Qué hace |
|---|---|---|
| `register.tsx` | 2.548 | Registro de eventos y árbol de las tres vistas. |
| `tablero-nucleo.ts` | 647 | Lógica pura: barras de uso, `cambiosBorrador`, `partirSecciones` / `unirSecciones` / `reemplazarSeccion`. |
| `catalogo.ts` | 502 | Lee y valida los agentes (`validarAgente`), `EQUIPOS_ESQUEMA`, `serializeAgente`. |
| `roles.ts` | 199 | Roles base, modelos, esfuerzos, herramientas. |
| `pixel.ts` | 837 | Paleta, pastillas de estado, línea de tiempo. |
| `emociones.ts` | 131 | Decide la emoción del robot (31 emociones). |
| `arte-*.ts` (8 archivos) | ~3.600 | Arte SVG puro: robot, escena, escritorios, oficina, edificio, íconos, actividades, uso. |
| `tema.ts` | 79 | Tema claro y colores legibles (`legibleSobre`, contraste ≥ 4,5). |
| `arte-fosforo.ts`, `arte-robot-terminal.ts`, `arte-monitor.ts`, `arte-escritorio.ts`, `arte-insignias-terminal.ts` | — | Skin «Terminal retro» (rama `skin-nueva`): motor de fósforo, robot, monitor, teclado y escritorio, íconos. Plan: `docs/plan-skin-terminal.md`. |
| `proyecto.ts`, `memes.ts` | — | Skin «Terminal retro»: estado del proyecto y reacciones de memes (puros). |

Los módulos de arte son **puros** (sin imports, todo texto externo escapado) y se prueban solos.

### 4.5 Vista Editar (Oleada G)

| Tarjeta | Qué hace |
|---|---|
| G-1 | Encabezado sin repetir: ruta «← Equipos / equipo / agente» y nombre legible. |
| G-2 | Tarjetas con borde del color del equipo; contador `n/200` de la descripción (naranja si pasa). |
| G-3 | «Para revisar (N)» con los avisos de `validarAgente` sobre el borrador, o «✓ Cumple el esquema». Guardar con avisos guarda igual y lo dice. |
| G-4 | «Vas a cambiar: modelo sonnet → haiku · descripción (+12 caracteres)…». |
| G-5a | «Abrir en el editor»: corre `code <ruta>` (y `cmd /c code <ruta>`). Si no hay VS Code, copia la ruta. «Releer archivo» rearma el borrador. |
| G-5b | Edición por secciones del prompt (`## Rol`, `## Antes de empezar`, `## Cómo trabajás`, `## Límites`, `## Entrega`). |
| G-6 | Etiquetas y extras (`maxTurns`, `skills`) en solo lectura. El equipo no se cambia desde el panel. |
| G-7 | Copia del archivo antes de cada Guardar o Restaurar; «Volver a la versión anterior» con confirmación, para cualquier agente. |

**Límites conocidos** (verificados en el plan):
- El motor **no tiene** función para abrir un archivo en el editor: por eso G-5a usa `code`.
- El motor **no tiene** campo de texto multilínea: cada sección se cambia en un campo de una línea. Para textos largos conviene «Abrir en el editor».
- Mientras se edita, el panel no relee el archivo solo: usar «Releer archivo».

### 4.6 Rendimiento y límites

- Caché de SVG (`cachedSvg`): mantiene el mismo texto para que la animación no se reinicie. **Crece sin límite** en sesiones con cientos de subagentes (hallazgo C3 de `docs/AUDITORIA.md`).
- El reloj (`startTimer`) corre solo con el panel abierto; `ui.close` lo para.
- El panel está pensado para **378 px de ancho**.

---

## 5. Cómo se verifica (aceptación)

Desde la raíz del repo:

| Comando | Qué tiene que pasar |
|---|---|
| `claude plugin validate mod` | Código 0 (aviso «No author information» normal). |
| `claude plugin test mod` | 295 pruebas en 23 archivos, 0 fail (ver sección 8). |
| `node mod/preview/make-preview.mjs` | `OK`; genera `mod/preview/preview.html`. |
| `node mod/preview/maqueta.mjs --nueva` | Escribe `mod/tests/salida/maqueta.html`: el panel a 378 px (Subagentes, Equipos, Editar y Editar por secciones). Marca en rojo lo que se sale del marco. |
| Buscar `command: 'tablero'` en `mod/hooks/register.tsx` | Sin resultados. |

Y una **captura de Nimai en la app**: sesión nueva → `/oficina` → Equipos → abrir un agente → Editar.

---

## 6. Los pasos que se siguieron (historia resumida)

Detalle en `git log` y en `docs/`. De más viejo a más nuevo:

1. **Panel base y animaciones:** patio por color y actividad, robot con 31 emociones, uso de la sesión y compactar.
2. **Kit y auditoría** (`docs/AUDITORIA.md`): el repo pasa a ser la fuente de verdad; el mod no escribe agentes sin permiso; pruebas que corren en cualquier sistema; prueba de integración con el kit.
3. **Auditoría visual** (`docs/auditoria-visual-2026-10-06.md`): paleta del tema claro, arte nuevo en las tres vistas.
4. **Pieza única (E-1 a E-4, F-1):** escena única con el robot colgado, uso en un solo lugar, sin franjas blancas, placas de equipos y taller del rol.
5. **Maqueta (M-1):** `mod/preview/maqueta.mjs` dibuja el panel en el navegador sin la app.
6. **Oleada G** (`docs/plan-editar-agente-2026-10-06.md`): vista Editar completa, con las decisiones de Nimai (editor y secciones, ficha en solo lectura, volver atrás, avisos que no bloquean).
7. **06/10/2026:** `git pull` de `master`, Claude Code reiniciado, el mod cargó con el enlace existente, y Nimai confirmó con las tres capturas que **todo funciona**.

---

## 7. Método de trabajo del proyecto

- Tarjetas con agente del catálogo, archivos permitidos ≤ 5 y aceptación binaria; las que tocan `register.tsx` van **en serie**.
- El orquestador corre la aceptación; la suite completa se corre una vez al final.
- Decisiones de alcance y de reglas del negocio las toma Nimai (puertas: push, deploy, borrar, instalar).
- Reglas completas: `CLAUDE.md` global y `kit/`.

---

## 8. Estado de las pruebas y un problema conocido

Corrida del 06/10/2026 en esta compu (`claude plugin test mod`):

| Corrida | Resultado | Fallas |
|---|---|---|
| 1 | 294 pass, 1 fail | `compu del trabajo con el kit: /oficina no escribe nada…` |
| 2 | 293 pass, 2 fail | `maqueta: subagentes sin agentes con uso de la sesión` y `G-2: tres tarjetas con el borde del equipo…` |

Las tres fallas dicen **`timed out after 5000 ms`**, y cada corrida falló en pruebas distintas. El plan de la Oleada G había registrado 295 pass, 0 fail. **Conclusión (supuesto):** son tiempos de espera de 5 s superados por una compu lenta o con poca memoria (el mismo día Claude Code se cerró con `0xC0000409` y el log mostraba estancamientos y mucha paginación de memoria), no errores de lógica. **No está confirmado** hasta repetir la corrida con la compu descargada.

Para confirmarlo: cerrar apps, correr `claude plugin test mod` y ver si da 0 fail. Si las pruebas siguen fallando por tiempo, la salida es subir el tiempo de espera de esas pruebas o sacar el chequeo del arte pesado del camino; es una decisión a tomar aparte.

Pendientes anotados en `docs/AUDITORIA.md`: dividir `register.tsx` (C1), borrar estado sin uso (C2), acotar el caché de SVG (C3), unificar los colores de equipo (C4), subtítulos de los equipos del edificio (C5) y nombres del tema maya viejos (C6). Falta también probar en la compu de Nimai que «Abrir en el editor» abre VS Code.
