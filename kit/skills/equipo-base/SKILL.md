---
name: equipo-base
description: Equipo Base (mecanico, implementador, corrector, investigador, revisor), roles genéricos. Invocala al armar o despachar tarjetas en proyectos sin especialista, tarjetas mecánicas o correcciones.
---
# Equipo Base

Roles genéricos de subagentes. **Se usan cuando el proyecto no tiene especialista** (si lo tiene, va el especialista: R1 de `{{EQUIPOS}}\REGLAS-TARJETAS.md`). Las excepciones son `mecanico` y `corrector`, que sirven en cualquier proyecto. Los subagentes no se despachan entre sí: despacha siempre el orquestador (la sesión principal). Nunca se despacha a `general-purpose`.

## Miembros

| Agente | Modelo · esfuerzo | Para qué |
|---|---|---|
| `mecanico` | sonnet · bajo | Hace los cambios mecánicos que la tarjeta deja escritos. Primer intento de toda tarjeta mecánica. |
| `implementador` | sonnet · medio | Escribe código de criterio según la tarjeta, cuando no hay especialista. |
| `corrector` | sonnet · medio | Arregla solo lo que describe una tarjeta de corrección (`<ID>b`). Es el escalón después de una falla. |
| `investigador` | sonnet · bajo | Busca y lee (archivos y web), solo lectura; separa lo verificado de lo supuesto, con fuente y fecha. |
| `revisor` | sonnet · medio | Revisa código en solo lectura y reporta hallazgos reales con línea, qué pasa y cómo se arregla. |

Todos tienen la herramienta `Skill` y nombran en su prompt los skills de su oficio.

## Flujo

1. **Investigador** (antes, si falta información): junta lo que hace falta saber y lo devuelve con fuentes.
2. **Orquestador**: con esa información arma la tarjeta y la despacha al `implementador`.
3. **Implementador**: escribe el código y corre solo la aceptación de la tarjeta.
4. **Orquestador**: corre él mismo la aceptación y despacha al `revisor`.
5. **Revisor**: reporta hallazgos reales, o dice que no hay.
6. **Corrector**: si hay hallazgos, el orquestador arma una tarjeta de corrección (`T-XXb`) y se la despacha al `corrector`, que hace el cambio mínimo.

## Reglas

- El método completo (planificar, verificación, reintentos, arreglos) está en `{{EQUIPOS}}\METODO.md`; las reglas de tarjeta, en `REGLAS-TARJETAS.md`.
- Máximo 3 subagentes en paralelo por oleada, y sin archivos compartidos dentro de una oleada.
- Cada tarjeta toca como mucho 5 archivos; los subagentes escriben solo esos.
- Los subagentes corren solo la aceptación de su tarjeta; la suite completa la corre el orquestador una sola vez, al final.
- Si una tarjeta falla 2 veces, se para y se le pregunta a la usuaria.
- Sin push, sin deploy, sin instalar ni actualizar nada, sin borrar archivos y sin secretos.
- Los informes separan siempre lo **verificado** de lo **supuesto**.

## Tarjetas

Nombre al despachar: `T-70 · sonnet · base/implementador · descripción corta` (tarjeta, modelo, equipo/agente, descripción). Las correcciones llevan sufijo: `T-70b`.

Cada tarjeta sigue `{{EQUIPOS}}\REGLAS-TARJETAS.md` y lleva:
- **Tipo** (mecánica o de criterio), modelo y dependencias.
- **Archivos permitidos (5 como máximo)** y los prohibidos.
- **Pruebas existentes** que toca el cambio, buscadas con grep.
- **Especificación**: la tarjeta es la única información que recibe el subagente.
- **Aceptación binaria**: comandos y resultado esperado.
