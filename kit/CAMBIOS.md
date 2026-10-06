# Cambios

## 06/10/2026: preparación para la compu del trabajo

Cambios hechos directamente en el repo. **Desde el 06/10/2026 el repo es la fuente de verdad del kit**: las fuentes de casa ya no existen, así que el kit se edita acá (la columna «Fuente» queda como referencia de dónde venía cada archivo). `MANIFIESTO.md` es el de la primera exportación y no se regenera.

| Archivo del kit | Fuente en casa | Qué cambió |
|---|---|---|
| `LEEME.md` | `{{EQUIPOS}}\kit\LEEME.md` | Instrucciones paso a paso para la sesión de Claude del trabajo: entorno, método, mod, prueba e informe. |
| `ADAPTAR.md` | `{{EQUIPOS}}\kit\ADAPTAR.md` | Paso 7: verificar agentes con `/agents` en una sesión nueva (`claude agents` lista sesiones en segundo plano). Paso 7b: cargar el mod después de los agentes. |
| `agentes/librarian/librarian.md` | `{{EQUIPOS}}\agents\librarian\librarian.md` | La descripción ya no lleva la ruta `{{BIBLIOTECA}}`: con una ruta de Windows pasaba el máximo de 200 caracteres del esquema. La ruta sigue en el cuerpo. |
| `metodo/ESQUEMA-AGENTES.md` | `{{EQUIPOS}}\ESQUEMA-AGENTES.md` | Juego de herramientas nuevo **documentos** (arquitecto y disenador ya lo usan). Filas de los 5 equipos del edificio. El panel se llama `/oficina`. |

Para la sesión del trabajo: en una instalación nueva no hay nada que repetir por estos cambios; en una ya instalada, repetí el paso 7 de `ADAPTAR.md` y la sección 3 de `LEEME.md`.

## 06/10/2026: primera exportación (no había MANIFIESTO.md)

## Nuevos

- ADAPTAR.md
- LEEME.md
- agentes/base/corrector.md
- agentes/base/implementador.md
- agentes/base/investigador.md
- agentes/base/mecanico.md
- agentes/base/revisor.md
- agentes/datos/analista.md
- agentes/datos/dataviz.md
- agentes/direccion/arquitecto.md
- agentes/direccion/disenador.md
- agentes/direccion/estratega.md
- agentes/direccion/pm.md
- agentes/librarian/librarian.md
- agentes/research/esceptico.md
- agentes/research/explorador.md
- agentes/research/practico.md
- metodo/CLAUDE-global.md
- metodo/ESQUEMA-AGENTES.md
- metodo/ESQUEMA-SISTEMA.md
- metodo/METODO.md
- metodo/README.md
- metodo/REGLAS-TARJETAS.md
- oficina/CLAUDE.md
- oficina/ideas-CLAUDE.md
- plantillas/BACKEND.md
- plantillas/DISENO.md
- plantillas/FLUJO.md
- plantillas/PRD.md
- plantillas/TRD.md
- plantillas/pagina-idea.html
- plantillas/pagina-idea.md
- skills/equipo-base/SKILL.md
- skills/equipo-datos/SKILL.md
- skills/equipo-direccion/SKILL.md
- skills/equipo-librarian/SKILL.md
- skills/equipo-research/SKILL.md
- skills/idea-nueva/SKILL.md
- skills/revisar-skills/SKILL.md
- skills/revisar-skills/revisar_skills.py
- skills/turno/SKILL.md

## Cambiados

(ninguno)

## Quitados

(ninguno)
