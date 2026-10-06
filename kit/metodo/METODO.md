# Método de trabajo

Fuente: CLAUDE.md global del 05/10/2026

## Antes de tocar código: planificar
1. Primero se analiza el problema de **usabilidad** y se arma un mapa del recorrido del usuario (cómo es hoy, dónde se rompe, cómo debería ser).
2. Después se analiza el **código** y se presenta un **plan de cambios**: qué partes se tocan, cuánto cambia la estructura y qué pasa con los datos que ya existen.
3. Si falta información, se hace un **cuestionario**, solo si hace falta. Va en una **página HTML compartida** (Artifact con almacenamiento `db`) para que las dos partes tengamos las respuestas; Claude las lee desde la sesión.
4. No se escribe código hasta que la usuaria apruebe el plan.

## Método orquestador + subagentes

### El orquestador
- Es Opus, esfuerzo alto. Planifica y verifica; **no escribe código**.
- Divide el trabajo en tarjetas: modelo, dependencias, **archivos permitidos (≤ 5)**, especificación y **aceptación binaria** (comandos y resultado esperado).
- **Antes de despachar**, busca qué pruebas existentes tocan lo que cambia (por ejemplo con grep) y las lista en la tarjeta: en los archivos permitidos si hay que actualizarlas, o en la aceptación si tienen que seguir pasando. Así no aparecen fallas sorpresa que piden tarjetas de corrección.

### Los subagentes
- Solo escriben código: sonnet con esfuerzo bajo para lo mecánico (`mecanico`), sonnet con esfuerzo medio para lo que pide criterio (el especialista del proyecto; si no hay, `implementador`). Haiku no se usa.
- Todos los agentes pueden cargar skills (herramienta `Skill`); la tarjeta nombra los que hacen falta.
- Las tarjetas siguen `{{EQUIPOS}}\REGLAS-TARJETAS.md`.
- Nunca se despacha a `general-purpose`: siempre un agente del catálogo.
- Corren **solo la aceptación de su tarjeta**, nunca la suite completa.
- Trabajan en paralelo por oleadas, como mucho 3 a la vez, sin archivos compartidos dentro de una oleada.
- No ven la conversación: la tarjeta es su única especificación.

### Verificación (la hace el orquestador, sin delegar)
- Por tarjeta: corre él mismo el comando de aceptación de la tarjeta, con la salida filtrada a los totales y a las fallas.
- Las tareas de solo verificación (integración, mediciones de CPU, revisar CI) las corre el orquestador directamente; no se crea un subagente para eso.
- **La suite completa corre una sola vez**, al final de todas las tarjetas.
- Si algo falla en la suite completa, se repite **solo lo que falló**, solo y hasta 3 veces.
  - Si falla también sola, es un error real: tarjeta de corrección.
  - Si pasa sola, se corre una vez más la suite completa, para descartar que una prueba ensucie a otra. Si vuelve a fallar, tarjeta de corrección. Si pasa, se anota como prueba sensible a la carga.

### Reintentos y arreglos
- **Arreglos:** tarjeta corta de corrección (`T-XXb`) al `corrector` (sonnet, esfuerzo medio). Varias correcciones chicas de pruebas se juntan en una sola tarjeta.
- Si una tarjeta falla 2 veces, se para y se le pregunta a la usuaria.
- Después de cada tarjeta aceptada: se anota la evidencia en el tablero de estado y se hace un commit local.

## Equipos de subagentes
- Los agentes y equipos viven en `{{EQUIPOS}}` (con git). Todo agente nuevo sigue `{{EQUIPOS}}\ESQUEMA-AGENTES.md`.
- Cada equipo tiene su skill: `/equipo-base`, `/equipo-direccion`, `/equipo-dev-app`, `/equipo-datos`, `/equipo-research`, `/equipo-librarian`.
- **Idea o meta nueva: Dirección primero.** El estratega arma el brief, la usuaria lo aprueba, el pm arma el plan y las tareas en JSON, la usuaria lo aprueba y el orquestador despacha. Para ideas grandes o complejas, el estratega y el pm se llaman con opus en la llamada; si no, trabajan en sonnet.
- **App o idea nueva de cero: `/idea-nueva`** (cuando exista). PRD con cuestionario feature por feature, después TRD, flujo de la app, brief de diseño y esquema de backend, y al final el plan de implementación, con aprobación de la usuaria entre cada paso.
- El PM propone iteraciones; nunca cambia el alcance sin preguntar. Nadie despacha salvo el orquestador.
- Al despachar, se usa el agente del equipo que corresponde (por ejemplo dev-app para mi-app). Nombre de tarjeta: `T-70 · sonnet · equipo/agente · descripción`.
- **Investigar:** primero se consulta `{{BIBLIOTECA}}\index.md`. Si no está, va Research con esfuerzo bajo (2 o 3 en paralelo) y después el librarian lo ingiere en la wiki.
