---
name: equipo-research
description: Equipo Research (explorador, escéptico, práctico), investigadores de esfuerzo bajo. Invocala al pedir una investigación, despachar investigadores en paralelo y saber quién hace qué.
---
# Equipo Research

Investigadores con personalidad y esfuerzo bajo. El orquestador lanza 2 o 3 en paralelo con la misma pregunta; cada uno la mira desde su ángulo. No escriben en la biblioteca: entregan hallazgos en el informe y los ingiere el librarian. Los subagentes no se despachan entre sí: despacha siempre el orquestador.

## Miembros

| Agente | Modelo | Para qué |
|---|---|---|
| `explorador` | sonnet | Abre el abanico: muchas fuentes y enfoques, rápido. Da el panorama. |
| `esceptico` | sonnet | Verifica en fuentes primarias, busca contraejemplos y marca lo que no se sostiene. |
| `practico` | sonnet | Ejemplos reales, código que funciona, costos, límites y trampas de uso. |

Todos usan el juego lectura-web más `Skill` (`Read, Glob, Grep, WebFetch, WebSearch, Skill`), `effort: low` y `maxTurns: 15`. Desde el 05/10/2026 no se usa haiku.

## Flujo

1. **Pregunta** de la usuaria. Primero se consulta `{{BIBLIOTECA}}\index.md`: si ya está investigada, se responde desde la wiki.
2. **2 o 3 investigadores en paralelo** según el tema: panorama nuevo, explorador; dato que importa y hay que confiar, escéptico; algo para usar o comprar, práctico.
3. **El orquestador junta** los informes y marca coincidencias y contradicciones.
4. **El librarian ingiere** los hallazgos en la wiki (equipo `librarian`).
5. **La usuaria consulta la wiki** en `{{BIBLIOTECA}}`.

## Reglas
- El método completo (planificar, verificación, reintentos, arreglos) está en `{{EQUIPOS}}\METODO.md`; las reglas de tarjeta, en `REGLAS-TARJETAS.md`.

- Esfuerzo bajo: unas 8 búsquedas por investigador, informe de ~600 palabras como máximo.
- No repetir una investigación que ya está en `{{BIBLIOTECA}}\index.md`: primero se consulta la wiki.
- No inventar fuentes. Cada hallazgo lleva fuente (URL o archivo), fecha y VERIFICADO o SUPUESTO.
- Los investigadores no escriben archivos ni tocan la biblioteca.
- Máximo 3 subagentes en paralelo. Sin push, deploy, instalaciones, borrados ni secretos.
- Si una tarjeta falla 2 veces, se para y se le pregunta a la usuaria.

## Tarjetas

Nombre al despachar: `T-70 · sonnet · research/explorador · pregunta` (tarjeta, modelo, equipo/agente, pregunta). Las correcciones llevan sufijo: `T-70b`.

Cada tarjeta lleva:
- La **pregunta** exacta y, si hace falta, el alcance y qué fuentes priorizar.
- Si hay que mirar `index.md` antes de buscar.
- **Formato de entrega**: título, hallazgos (afirmación, fuente, fecha, VERIFICADO o SUPUESTO), contradicciones y preguntas abiertas.
- **Aceptación binaria**: el informe tiene las cuatro partes, cada hallazgo trae fuente y fecha, y no supera ~600 palabras.
