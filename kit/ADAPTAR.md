# Adaptar el kit a esta compu

Sos el Claude Code del trabajo. La usuaria opera un edificio (seguridad, mantenimiento, limpieza, facilities, arquitectura, datos), usa la app de escritorio en Windows, con Opus y Sonnet, todo en español rioplatense con voseo. Ya tiene CLAUDE.md global, CLAUDE.md de proyectos y skills propias. Las reglas de la empresa que haya en lo de ella **siempre ganan** sobre el kit.

Estructura del kit: `metodo/` (CLAUDE-global, METODO, REGLAS-TARJETAS, ESQUEMA-AGENTES, ESQUEMA-SISTEMA), `agentes/<equipo>/`, `skills/<nombre>/`, `plantillas/`, `oficina/` (CLAUDE.md del PM e ideas-CLAUDE.md). Las rutas vienen como marcadores: `{{RAIZ}}`, `{{EQUIPOS}}`, `{{OFICINA}}`, `{{BIBLIOTECA}}` y `%USERPROFILE%`.

Seguí los pasos en orden. Terminá cada uno antes de pasar al siguiente.

## 1. Inventario (solo lectura)
Leé el CLAUDE.md global de acá, los CLAUDE.md de los proyectos que la usuaria indique, `~/.claude/agents` y `~/.claude/skills`. Lo que está fuera de eso se lee solo si ella lo autoriza.
Listo cuando tenés un resumen de cada fuente.

## 2. Comparar con el kit
Armá una tabla por tema: comunicación, planificación, orquestador y subagentes, verificación, puertas, tokens. Columnas: «lo que hay allá», «lo que trae el kit», «conflicto», «propuesta». En cada conflicto gana lo de la empresa.
Listo cuando los seis temas tienen tabla y cada conflicto tiene propuesta.

## 3. Elegir la raíz
Preguntá dónde va la carpeta de equipos y dónde la de la Oficina en esta compu. Al instalar, reemplazá `{{RAIZ}}`, `{{EQUIPOS}}`, `{{OFICINA}}` y `{{BIBLIOTECA}}` por esas rutas.
Listo cuando la usuaria confirmó las rutas y no queda ningún marcador sin resolver en lo instalado.

## 4. Propuesta de fusión
Mostrá el CLAUDE.md global fusionado como diff. Esperá la aprobación de la usuaria antes de escribir. Con la aprobación, guardá primero una copia `.bak` con fecha del original (por ejemplo `CLAUDE.md.2026-10-05.bak`) y recién después escribí.
Listo cuando el archivo fusionado está escrito y el `.bak` existe.

## 5. Instalar por partes
Pedí aprobación en cada parte:
- Agentes en `~/.claude/agents/<equipo>/`. Avisá si un nombre choca con uno existente.
- Skills en `~/.claude/skills/`. Si hay choque con una skill propia, proponé otro nombre.
- Plantillas y la Oficina en la raíz elegida.

Listo cuando cada parte aprobada está copiada y cada archivo pisado tiene su `.bak`.

## 6. Adaptar al dominio
Proponé, sin crear nada, si conviene un especialista por área del edificio. Aplicá la «regla de 3» de `ESQUEMA-SISTEMA.md`: un especialista nuevo se crea cuando el mismo tipo de tarea le tocó 3 veces a un agente genérico.
Listo cuando hay una propuesta por área, con su justificación.

## 7. Verificar
Comprobá que Claude Code ve los agentes y skills nuevos:
- Agentes: con `/agents` **dentro de una sesión nueva** (los agentes en subcarpetas se ven recién en una sesión nueva). Ojo: `claude agents` en la terminal **no** sirve para esto: lista sesiones en segundo plano y da vacío aunque haya agentes.
- Skills y el mod: `claude plugin list` (el mod tiene que figurar `loaded`).

Escribí un resumen de lo instalado: qué, dónde, qué quedó con `.bak`.
Listo cuando cada agente y skill instalado aparece en la lista o está marcado como no visible.

## 7b. Cargar el mod `/oficina`
Recién con los agentes instalados (paso 5) y verificados (paso 7), seguí «Instrucciones para Claude» de `LEEME.md`, sección 3. Si el mod se carga antes, el panel muestra «No hay agentes» y ofrece crear 4 roles base: **no los crees** si vas a instalar los del kit.
Listo cuando `/oficina` abre y la pestaña Equipos muestra los equipos instalados.

## 8. Actualizaciones
Cuando llegue un kit nuevo, leé `CAMBIOS.md` y repetí solo los pasos 2, 4 y 5 para los archivos que cambiaron.

## Nunca
- Pisar un archivo sin `.bak` previo.
- Instalar sin aprobación.
- Copiar secretos, PIN o contraseñas.
- Subir nada a remotos.
