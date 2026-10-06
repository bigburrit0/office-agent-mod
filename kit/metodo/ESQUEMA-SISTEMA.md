# Esquema del sistema multiagente (borrador v1 · 04/10/2026)

> **Estado: plan APROBADO por la usuaria el 04/10/2026** (cuestionario en https://claude.ai/artifact/7TCKtSYesdzEgt4PEyQNmi, base `respuestas/usuaria`). Lo marcado «propuesto» quedó decidido así: Oficina separada; el PM puede llamar a estratega, Research y librarian; turnos en sonnet y opus para lo delicado; turnos con botón; prefijo por proyecto; presupuesto 60/25/15; especialistas dev-tablero, Comercial (proyecto aparte) y hooks de seguridad. Skills: la usuaria ve la lista antes de archivar. Alcance sumado: SIS-12 y SIS-13 (sección 9). Pendiente: propuesta para ordenar `{{RAIZ}}`.

Este archivo describe cómo trabaja el sistema entero: quién habla con quién, dónde se guarda el estado, qué puertas frenan el trabajo y cómo se cuida el gasto de tokens. El esquema para crear un agente sigue en `ESQUEMA-AGENTES.md`.

## 1. Capas

| Capa | Quién | Modelo | Qué hace | Qué no hace |
|---|---|---|---|---|
| Dueña | La usuaria | — | Decide alcance, aprueba planes, corre producción, paga | — |
| Oficina del PM (propuesto) | Sesión principal en `{{OFICINA}}` | sonnet | Conversa con la usuaria, lleva el portafolio y el backlog, prioriza, escribe tarjetas, llama a Dirección y Research | No escribe código ni despacha equipos de código |
| Sesión de idea (05/10/2026) | Una sesión por idea en `{{OFICINA}}\ideas\<idea>\` (instrucciones en `ideas\CLAUDE.md`) | sonnet; opus por llamada para lo grande | Lleva la idea por 6 pasos (PRD, TRD, flujo, diseño, backend, plan) con páginas interactivas y puertas A, B y C | No da el parte de la Oficina ni escribe código |
| Turno de ejecución (propuesto) | Sesión de orquestador, una por turno y por proyecto, en la carpeta del proyecto | sonnet por defecto, opus para lo delicado (propuesto) | Toma tarjetas **aprobadas**, despacha, verifica la aceptación, commitea, escribe el parte | No cambia alcance ni inventa tarjetas |
| Equipos | Subagentes de `agents\<equipo>\` | sonnet: esfuerzo bajo para lo mecánico, medio para criterio (sin haiku desde el 05/10/2026) | Lo que dice su tarjeta, solo en sus archivos permitidos; cargan skills con `Skill` | No se despachan entre sí (no tienen la herramienta `Agent`) |
| Memoria | Archivos | — | Portafolio, tableros, tarjetas, partes, biblioteca | — |

Equivalencia con CrewAI: agente = `agents\*.md` (rol, meta y personalidad); task = tarjeta (con aceptación binaria en vez de «resultado esperado»); crew = equipo + skill `equipo-*`; proceso jerárquico = PM + orquestador como «manager», con puertas humanas.

## 2. Archivos de estado (la memoria del sistema)

| Archivo | Lo escribe | Lo lee | Tope |
|---|---|---|---|
| `{{OFICINA}}\PORTAFOLIO.md` | PM | PM al empezar | 1 línea por proyecto: estado, próximo hito, «pendiente de vos» |
| `<proyecto>\TABLERO.md` (o el `ESTADO.md` actual con una sección «Ahora» arriba) | PM y turno | PM, turno | ~2 KB: ahora, pendiente de la usuaria, tarjetas aprobadas, últimas 10 hechas. El historial va a `HISTORIAL.md` |
| `{{OFICINA}}\ideas\<idea>\ESTADO.md` | sesión de idea | PM, sesión de idea | Paso actual (N de 6), puerta pendiente, links a las páginas. El portafolio muestra «idea: paso N de 6» |
| `<proyecto>\tarjetas\<ID>.md` | PM | turno y subagente | Una tarjeta por archivo, con `estado:` propuesta / aprobada / en curso / hecha / frenada |
| `{{OFICINA}}\partes\AAAA-MM-DD-<proyecto>.md` | turno | PM | Qué se hizo, evidencia, consumo (inicio y fin), qué quedó frenado |
| `{{BIBLIOTECA}}\` | librarian | todos | Toda investigación se ingiere para no pagarla dos veces |

Numeración de tarjetas (propuesto): prefijo por proyecto para no chocar (`APP-96`, `TAB-86`, `SIS-1`). Hoy `T-60` y `T-70` existen en mi-app y en el tablero a la vez (verificado 04/10/2026).

## 3. Flujo

1. La usuaria abre la **Oficina**. El PM lee `PORTAFOLIO.md` y los partes nuevos, y da el parte: qué se hizo, qué espera de ella, qué propone.
2. Idea nueva: el PM la baja a tierra y abre una **sesión de idea** (`oficina\ideas\<idea>\`, skill `/idea-nueva`). Pasar a proyecto es puerta: se copian los documentos a `<proyecto>\docs\producto\`. Si es grande, llama al `estratega` (brief) y la usuaria lo valida. Si falta información, primero `biblioteca\index.md`, después Research (2 investigadores, 3 solo si importa) y el librarian ingiere.
3. El PM arma el plan en oleadas y escribe las tarjetas como archivos con `estado: propuesta`.
4. **Puerta 1:** la usuaria aprueba el plan entero o una oleada (una sola aprobación por oleada, no por tarjeta). El PM pasa esas tarjetas a `aprobada`.
5. **Turno de ejecución** (lo arranca la usuaria con un botón, o a horario si lo elige): mide el consumo, toma hasta 3 tarjetas aprobadas sin archivos compartidos, despacha con un mensaje corto que apunta al archivo de la tarjeta, corre él mismo cada aceptación, commitea y escribe el parte.
6. **Puerta 2:** producción, plata, alcance nuevo o una tarjeta que falló 2 veces: el turno frena esa tarjeta, la deja en `frenada` con el motivo y sigue con las demás. El PM se lo muestra a la usuaria en «pendiente de vos».
7. Fin del plan: el turno corre la suite completa una vez; si algo falla, se aplica la regla de reintentos del método.

## 4. Puertas (siempre frenan)

Deploy, push, migraciones remotas, secretos, compras o cualquier cosa que cueste plata, crear cuentas o proyectos, instalar o actualizar software, borrar archivos, cambiar reglas del negocio o del cálculo, alcance nuevo, una tarjeta con 2 fallas.

## 5. Especialistas y skills

- Un especialista nuevo se crea cuando el mismo tipo de tarea le tocó 3 veces a un agente genérico («regla de 3»). Sigue `ESQUEMA-AGENTES.md`.
- **Skill de oficio** (propuesto): cada especialista precarga una skill corta (≤ 3 KB) hecha para su stack, en vez de una skill genérica grande. La skill genérica queda como referencia. Motivo: lo que va en `skills:` se inyecta entero en cada despacho (documentación oficial).
- Los trabajadores llevan `omitClaudeMd: true` (propuesto): no necesitan las reglas del orquestador del `CLAUDE.md` global y el preámbulo ya trae sus límites. Leen el núcleo del proyecto que la tarjeta indique.

## 6. Tokens

### Reglas fijas
1. Sesiones cortas: una sesión por turno o por tema. El contexto se reenvía en cada mensaje; una sesión larga cuesta más por mensaje.
2. Cada turno mide el consumo al empezar y al terminar (`get_usage`) y lo anota en el parte.
3. El turno no arranca si el límite de 5 horas pasa del 80 % o si la semana ya gastó su parte (ver presupuesto).
4. Lecturas cortas: núcleo del proyecto ≤ 8 KB; anexos solo si la tarjeta los nombra; tableros ≤ 2 KB.
5. Tarjetas en archivo: las escribe el PM (sonnet) una vez; el orquestador despacha con una línea («Tu tarjeta: <ruta>»).
6. Informes de subagentes ≤ 150 palabras más la salida filtrada de la aceptación.
7. Research: primero la biblioteca; `maxTurns: 15`; 2 investigadores por defecto.
8. Antes de despachar se valida la tarjeta (esquema del panel) para no pagar despachos que el subagente rechaza.

### Presupuesto semanal (propuesto)
60 % turnos de ejecución, 25 % Oficina y planificación, 15 % research. Se ajusta con la retro semanal del PM.

### Medición
Línea base con una tarea real de punta a punta (T-70 pendiente) antes de cambiar nada, y la misma medición al final. Métricas: % semanal por tarjeta, tokens por subagente (los muestra `/tablero`), despachos perdidos.

## 7. Límites reales (verificado 04/10/2026)

- Plan Pro: límite de 5 horas y límite semanal; esta semana iba 52 % usado, con reinicio el 08/10 (`get_usage`).
- Las tareas programadas de la app corren con la app abierta; si estaba cerrada, corren al abrirla. Cada corrida empieza sin memoria.
- Las rutinas en la nube necesitan el repositorio en GitHub: hoy no hay remoto y el push está prohibido.
- Un subagente puede lanzar subagentes si tiene la herramienta `Agent` (hasta 3 niveles). Los nuestros no la tienen: eso es lo que garantiza que solo despache la sesión principal.
- `memory: user` agrega Read, Write y Edit al agente aunque su `tools` no los nombre.
- `claude --agent <nombre>` o `"agent"` en `settings.json` convierten la sesión principal en ese agente: su prompt reemplaza el de Claude Code y hereda sus herramientas y su modelo.

## 8. Supuesto (sin probar)

- Que la app de escritorio respete `"agent"` en el `settings.json` de una carpeta.
- Cuánto pesa cada tipo de token (con caché o sin caché, opus o sonnet) contra los límites del plan: Anthropic no lo publica en detalle; se mide.
- Que los subagentes reciban los `CLAUDE.md` por defecto (lo sugiere que exista `omitClaudeMd`).

## 9. Se arregla solo y mejora solo (aprobado 04/10/2026)

- **SIS-12 · se arregla solo:** si la aceptación de una tarjeta falla dentro de un turno, el turno escribe la tarjeta de corrección (`<ID>b`) y la despacha al `corrector` sin esperar a la usuaria. Con 2 fallas en la misma tarjeta, se frena y queda en «pendiente de vos». Nunca toca alcance, reglas del cálculo ni producción.
- **SIS-13 · mejora solo:** retro semanal del PM. Lee los partes y el consumo, detecta patrones (tarjetas que fallan, agentes que gastan de más, despachos perdidos) y **propone** cambios a agentes, skills o reglas como tarjetas `propuesta`. La usuaria aprueba y los aplica un turno. Nada se modifica sin aprobación.
