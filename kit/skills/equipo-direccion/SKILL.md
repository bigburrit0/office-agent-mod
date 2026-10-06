---
name: equipo-direccion
description: Equipo Dirección (estratega, arquitecto, disenador, pm). Invocala cuando llega una idea o meta nueva, para armar el brief y el plan de tareas, o para un seguimiento de métricas contra la meta.
---
# Equipo Dirección

Equipo que trabaja ANTES del orquestador (la sesión principal de Claude Code): convierte una idea en un brief y el brief en un plan con tareas listas para despachar. Ninguno de los dos despacha subagentes ni escribe código.

## Miembros

| Agente | Modelo | Para qué |
|---|---|---|
| `estratega` | sonnet | Define las características clave del producto y entrega un brief: meta, para quién, imprescindibles / después, fuera de alcance, qué reusar, verificado vs. supuesto, preguntas. |
| `arquitecto` | sonnet | De un PRD aprobado escribe `TRD.md` (requisito → cómo se prueba) y `BACKEND.md` (ERD en Mermaid y endpoints) en `{{OFICINA}}\ideas\<idea>\`. Solo documentos. |
| `disenador` | sonnet | Escribe `FLUJO.md` (pantallas en Mermaid) y `DISENO.md` (paletas, tipografías, componentes) en la carpeta de la idea. Solo documentos. |
| `pm` | sonnet | Del brief arma el plan en oleadas y un JSON de tareas asignadas a agentes de los equipos; escribe las tarjetas de corrección; en seguimiento compara métricas con la meta y propone iteraciones. |

Para ideas grandes o complejas, el orquestador los llama con `model: opus` en la llamada; el archivo queda en sonnet.

## Flujo

1. La usuaria le da una meta o idea al **Estratega** (vía el orquestador).
2. El **Estratega** devuelve el brief.
3. **La usuaria valida el brief.** Sin validación no pasa al PM.
4. El **PM** toma el brief, lee el estado de los proyectos y los agentes disponibles, y devuelve el plan con oleadas y el JSON `tareas`.
5. **La usuaria aprueba el plan.** Sin aprobación no se despacha nada.
6. El **orquestador** guarda el plan, despacha las tarjetas por oleadas y verifica cada aceptación.
7. Si el tester reporta una falla, el **PM** escribe la tarjeta de corrección (`T-XXb`) y el orquestador la despacha.
8. **Seguimiento:** cuando hay métricas o dashboards, el PM evalúa si cumplen la meta del Estratega y **propone** iteraciones. **La usuaria aprueba** cada cambio de alcance antes de que se haga nada.

## Flujo de una idea nueva (carpeta `{{OFICINA}}\ideas\<idea>\`)

1. **Estratega** → `PRD.md`. **Puerta A:** la usuaria aprueba qué entra y qué queda afuera.
2. **Arquitecto** → `TRD.md`.
3. **Diseñador** → `FLUJO.md` y `DISENO.md`.
4. **Arquitecto** → `BACKEND.md`. **Puerta B:** la usuaria aprueba técnica, flujo, diseño y datos.
5. **PM** → `PLAN.md` y tareas en JSON. **Puerta C:** la usuaria aprueba las oleadas; recién ahí se copian los documentos a `<proyecto>\docs\producto\` y crear el proyecto se pregunta.

## Reglas

- El método completo (planificar, verificación, reintentos, arreglos) está en `{{EQUIPOS}}\METODO.md`; las reglas de tarjeta, en `REGLAS-TARJETAS.md`.
- `opus` solo en la llamada, para lo grande o complejo; nunca fijado en el archivo.
- Nadie despacha salvo el orquestador.
- Los cambios de alcance, de reglas del negocio o del cálculo siempre se le preguntan a la usuaria.
- El PM nunca lanza iteraciones por su cuenta: las propone.
- Plan en oleadas de máximo 3 tareas en paralelo y sin archivos compartidos dentro de una oleada.
- Cada tarea tiene como máximo 5 archivos permitidos y una aceptación binaria; la suite completa la corre el orquestador una sola vez al final.
- Si una tarjeta falla 2 veces, se frena y se le pregunta a la usuaria.
- Las escrituras en producción, el deploy, el push, las instalaciones y los secretos son de la usuaria.
- Los informes separan siempre lo **verificado** de lo **supuesto**.

## Tarjetas

Nombre al despachar: `T-70 · sonnet · dev-app/backend-app · descripción corta` (tarjeta, modelo, equipo/agente, descripción). Las correcciones llevan sufijo: `T-70b`.

El PM entrega las tareas en un bloque JSON `tareas`. Cada tarea lleva: `id`, `titulo`, `equipo`, `agente`, `modelo`, `depende_de`, `archivos_permitidos` (máximo 5), `pruebas_existentes`, `especificacion` y `aceptacion` con `comando` y `esperado`. Ejemplo corto:

```json
{
  "tareas": [
    {
      "id": "T-70",
      "titulo": "Ruta GET /api/ejemplo",
      "equipo": "dev-app",
      "agente": "backend-app",
      "modelo": "sonnet",
      "depende_de": [],
      "archivos_permitidos": ["worker/rutas/ejemplo.js"],
      "pruebas_existentes": ["tests/api/ejemplo.spec.js (debe seguir pasando)"],
      "especificacion": "Agregar la ruta y devolver la lista en JSON.",
      "aceptacion": { "comando": "npx playwright test --project=api ejemplo", "esperado": "0 fallan" }
    }
  ]
}
```
