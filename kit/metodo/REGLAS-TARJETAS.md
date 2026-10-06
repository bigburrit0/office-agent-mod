# Reglas de tarjeta (v1 · 05/10/2026)

Aprobadas por la usuaria el 05/10/2026 (cuestionario https://claude.ai/artifact/RBoUe2MvAR3SRpReSK3re1). Salen de la revisión del turno de ese día: TAB-101 (haiku) agotó 40 turnos sin informe y APP-96 traía una contradicción con el código.

## Para quien escribe y despacha la tarjeta (PM y orquestador)

- **R1 · Agente real.** La tarjeta nombra un agente que existe en `{{EQUIPOS}}\agents\`. Si el proyecto tiene especialista, va el especialista; los de equipo base, solo si no hay. Nunca `general-purpose`.
- **R2 · Mecánica o de criterio.** Toda tarjeta lo dice en su encabezado.
  - Mecánica (el cambio está escrito en la tarjeta): `mecanico` (sonnet, esfuerzo bajo).
  - Criterio: el especialista del proyecto o `implementador` (sonnet, esfuerzo medio).
  - Opus se pide en la llamada, solo para lo grande. Haiku no se usa.
- **R3 · Escalado.** Una falla: tarjeta `<ID>b` al `corrector` (sonnet, esfuerzo medio). Dos fallas en la misma tarjeta: se frena y se le pregunta a la usuaria.
- **R4 · Qué tiene que fallar.** Una tarjeta de pruebas dice qué aserción debe fallar si la función se rompe. «Reforzar» se hace con una prueba nueva aparte, sin tocar la existente.
- **R5 · Tope de corridas.** La tarjeta dice cuántas veces se puede correr la aceptación (3 por defecto). Si la aceptación es la suite entera, lo dice.
- **R7 · Chequeada contra el código.** Antes de despachar, el orquestador comprueba con grep las rutas, archivo y línea, y los modos o estados de la pantalla que la afectan (por ejemplo, una sección que se oculta en otro modo), y pega lo que encontró en la tarjeta.
- **R8 · Skills.** La tarjeta nombra los skills que hacen falta. Los pesados (por ejemplo `apple-design`), solo para algo nuevo: pantalla, componente o movimiento.
- **R10 · Foto previa.** Antes de despachar, el orquestador anota `git status` del repo. Lo ajeno no entra en el commit de la tarjeta; si entra, se avisa en el parte.
- **R11 · Orquestador en Opus.** El turno verifica al empezar el modelo (Opus, esfuerzo alto) y el consumo (`get_usage`).

## Para el agente que la ejecuta

- **R4 · No debilitar pruebas.** No borres un `expect` sin poner otro más fuerte en su lugar. Si una prueba falla por una razón real, no la cambies para que pase: reportalo.
- **R5 · Tope de corridas.** Corré la aceptación como máximo las veces que dice la tarjeta (3 si no dice). Antes de cada corrida, entendé por qué falló la anterior: leé el código, no pruebes a ciegas.
- **R6 · Reserva para el informe.** Si gastaste el 75 % de tus turnos sin aceptación verde, pará y reportá lo que tenés.
- **R8 · Skills.** Si la tarjeta nombra skills, cargalos con la herramienta `Skill` antes de escribir. Si un skill que pide la tarjeta no carga, decilo en el informe.
- **R9 · Informe siempre**, aunque falle o se corte, con lo que hiciste, la salida filtrada de la aceptación y lo que no pudiste verificar.
- **Ambigüedad.** Si la tarjeta es ambigua o se contradice con el código, elegí la lectura más literal y anotala en «Desvíos y dudas»; si no hay lectura literal posible, pará.
