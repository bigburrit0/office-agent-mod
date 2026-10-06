---
name: equipo-librarian
description: Equipo Librarian, que mantiene la wiki de {{BIBLIOTECA}}. Invocala para ingerir un informe o fuente (INGEST), preguntarle a la biblioteca (QUERY) o revisarla (LINT).
---
# Equipo Librarian

Un solo agente que mantiene la biblioteca `{{BIBLIOTECA}}` (capas `raw/`, `wiki/` y el esquema `CLAUDE.md`). Los subagentes no se despachan entre sí: despacha siempre el orquestador.

## Miembros

| Agente | Modelo | Para qué |
|---|---|---|
| `librarian` | sonnet | INGEST de fuentes e informes, QUERY con citas y LINT de la wiki. Escribe solo en `wiki/`, `index.md` y `log.md`. |

## Flujo

1. **Research entrega** un informe (hallazgos con fuente, fecha y VERIFICADO/SUPUESTO).
2. **El orquestador** le pasa el informe al librarian con la palabra «INGEST» (y la ruta en `raw/` si la usuaria lo guardó ahí).
3. **La usuaria pregunta** y el orquestador despacha «QUERY» con la pregunta; el librarian responde con citas y archiva lo valioso.
4. **«LINT» cada tanto** (por ejemplo después de varias ingestas) para detectar contradicciones, páginas huérfanas y huecos.

## Reglas
- El método completo (planificar, verificación, reintentos, arreglos) está en `{{EQUIPOS}}\METODO.md`; las reglas de tarjeta, en `REGLAS-TARJETAS.md`.

- `raw/` es inmutable: nadie lo modifica. Nunca se borran páginas.
- El librarian escribe solo dentro de `{{BIBLIOTECA}}\wiki`, `index.md` y `log.md`.
- La wiki conserva la marca VERIFICADO/SUPUESTO, la fuente y la fecha de cada hallazgo.
- Las contradicciones se marcan, no se pisan.
- Cada tarjeta toca como mucho 5 archivos. Sin push, sin deploy, sin instalar, sin borrar, sin secretos.
- Si una tarjeta falla 2 veces, se para y se le pregunta a la usuaria.

## Tarjetas

Nombre al despachar: `T-70 · sonnet · librarian/librarian · INGEST tema` (tarjeta, modelo, equipo/agente, operación y tema). Las correcciones llevan sufijo: `T-70b`.

Cada tarjeta lleva la operación (INGEST, QUERY o LINT), la fuente o pregunta, los archivos permitidos y una aceptación binaria. Por ejemplo, para INGEST: existe la página `fuente-*` en `wiki/`, `index.md` la lista, `log.md` tiene la entrada nueva al final y `raw/` quedó idéntico.
