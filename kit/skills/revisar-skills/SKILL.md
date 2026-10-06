---
name: revisar-skills
description: Cruza los skills instalados con los skills de oficio de cada agente y propone a quién le sirve cada skill sin asignar. Invocala al agregar un skill nuevo y en la retro semanal.
---

# Revisar skills

## Pasos

1. Corré `python -X utf8 {{EQUIPOS}}/skills/revisar-skills/revisar_skills.py`. Con `--agents <carpeta>` cambia la carpeta de agentes.
2. Leé la tabla skill -> agentes y la sección `SIN ASIGNAR:`. La última línea es `TOTAL skills=N asignados=M sin_asignar=K`.
3. Por cada skill sin asignar, proponé uno o más agentes con una razón de una línea.
4. Entregá la propuesta a la usuaria, o como tarjeta SIS en estado propuesta.

## Límite

No edites los archivos de los agentes. Solo proponé.
