# Estado del proyecto (para el robot de `/oficina`)

El robot del panel `/oficina` dice cuánto va el proyecto y cuánto falta: «Proyecto ▕██████░░░░▏ 58 %: faltan 5 de 12 tarjetas. A este ritmo, ~1 h 10 min.» Lo saca de dos lugares, en este orden (gana el primero que tenga datos). **No inventa:** si no encuentra ninguno, dice que no ve tareas ni tarjetas.

Para que el número sea verdad, seguí estas reglas en todos los proyectos.

## 1. Las tareas de la sesión

- Todo trabajo de 3 pasos o más arranca con la lista de tareas (`TaskCreate`, o `TodoWrite` donde no exista): una tarea por tarjeta o por paso.
- Si hay tarjeta, el asunto empieza con su ID: `T-70 · panel de uso`.
- Al empezar una tarea, pasala a `in_progress`. Pasala a `completed` **solo cuando su aceptación pasó**.
- Una tarea que ya no va se borra (`deleted`); no la dejes pendiente para siempre.
- Nunca marques completada una tarea con pruebas que fallan.

El robot cuenta: % = completadas ÷ (todas menos las borradas).

## 2. Las tarjetas del proyecto

Si el proyecto usa tarjetas (como pide `METODO.md`), cada una va en un archivo `tarjetas/<ID>.md` en la carpeta donde se abre la sesión, con una línea `estado:` cerca del principio:

```markdown
---
id: T-70
titulo: Panel de uso
estado: en curso
---
```

- `estado:` es uno de: `propuesta`, `aprobada`, `en curso`, `hecha`, `frenada`.
- Con `frenada`, agregá una línea `motivo:`. El robot la nombra: «T-7 está frenada y espera por vos».
- Al cerrar una tarjeta, cambiá su línea a `estado: hecha` en el mismo commit.

El robot cuenta: % = hechas ÷ todas.

## 3. El ritmo

El robot estima cuánto falta con el tiempo entre las últimas tareas cerradas en la sesión. Con menos de 2 cerradas no estima. Por eso conviene cerrar cada tarea apenas pasa su aceptación, y no todas juntas al final.

## Cómo se importa

Este archivo se carga desde cualquier `CLAUDE.md` con una línea de import (Claude Code lee los `@ruta`):

```markdown
@{{EQUIPOS}}\ESTADO-PROYECTO.md
```

- En el `CLAUDE.md` global (`%USERPROFILE%\.claude\CLAUDE.md`) vale para todos los proyectos. El `CLAUDE-global.md` del kit ya trae la línea.
- En el `CLAUDE.md` de un proyecto vale solo para ese proyecto.
- Si el repo se clonó en otro lado, la ruta es la de este archivo en el clon: `<carpeta del repo>\kit\metodo\ESTADO-PROYECTO.md`.
