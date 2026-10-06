---
name: equipo-datos
description: Equipo Datos (analista, dataviz) para medir un sistema que ya funciona. Invocala al pedir una métrica, armar o despachar tarjetas de análisis y gráficos, y para saber quién hace qué.
---
# Equipo Datos

Equipo de subagentes que entra cuando un sistema ya funciona: saca métricas de la base, analiza la tendencia y las dibuja. Los subagentes no se despachan entre sí: despacha siempre el orquestador (la sesión principal).

## Miembros

| Agente | Modelo | Para qué |
|---|---|---|
| `analista` | sonnet | SQL (solo SELECT) y scripts de Python locales para métricas y tendencias. Nunca escribe en bases. |
| `dataviz` | sonnet | Gráficos en SVG hecho a mano, sin dependencias, accesibles y en tema claro y oscuro. En mi-app sigue el estilo de `web/`. |

Arriba del equipo trabajan el Estratega y el PM (equipo `direccion`). En mi-app también leen `{{RAIZ}}\mi-app\AGENTS.md` completo antes de empezar.

## Flujo

1. **PM**: le pide al analista una métrica concreta (por ejemplo «ventas por día»), con período y base a consultar. La tarjeta la despacha el orquestador.
2. **`analista`**: escribe el SQL y, si hace falta, un script de Python local; entrega la consulta, el resultado resumido, la tendencia y qué tan confiable es.
3. **`dataviz`**: con ese resultado escribe el código del gráfico en SVG.
4. **PM**: compara los resultados con la meta del estratega, evalúa si se cumple y propone qué hacer.
5. **La usuaria aprueba** lo que el PM propone. Sin aprobación no se cambia nada.

## Reglas

- El método completo (planificar, verificación, reintentos, arreglos) está en `{{EQUIPOS}}\METODO.md`; las reglas de tarjeta, en `REGLAS-TARJETAS.md`.
- Máximo 3 subagentes en paralelo por oleada, y sin archivos compartidos dentro de una oleada. Dataviz depende del resultado del analista: van en oleadas distintas.
- Solo `SELECT`. Contra la base local o preview; producción solo en lectura, si la tarjeta lo pide y con el comando de solo lectura de AGENTS.md. Las escrituras en producción las hace la usuaria.
- Python sí, en scripts locales que no tocan producción ni la red, y sin instalar paquetes (Python 3.14.7 instalado).
- Gráficos en SVG a mano, sin librerías ni dependencias; colores por tokens del proyecto, título y texto alternativo, y animación solo si respeta `prefers-reduced-motion`.
- Sin datos personales de clientes en informes, ejemplos ni pruebas: solo conteos, sumas y promedios; en pruebas, datos sintéticos.
- Todo lo que use `wrangler dev`, `wrangler d1 ... --local`, `preparar-dev` o `npm run build` va con `node scripts/con-candado.mjs -- <comando>`, con el PATH de Node antepuesto (ver AGENTS.md). Al terminar, comprobar que no queden procesos wrangler ni workerd.
- Cada tarjeta toca como mucho 5 archivos. Sin push, sin deploy, sin instalar ni actualizar nada, sin borrar archivos, sin secretos.
- Si una tarjeta falla 2 veces, se para y se le pregunta a la usuaria.
- Los informes separan siempre lo **verificado** de lo **supuesto**.

## Tarjetas

Nombre al despachar: `T-70 · sonnet · datos/analista · descripción corta` (tarjeta, modelo, equipo/agente, descripción). Las correcciones llevan sufijo: `T-70b`.

Cada tarjeta lleva:
- **Modelo** y dependencias.
- **Archivos permitidos (5 como máximo)** y los prohibidos.
- **Pruebas existentes** que toca el cambio.
- **Especificación**: la tarjeta es la única información que recibe el subagente (la métrica, el período, la base y el formato de entrega).
- **Aceptación binaria** con comandos y resultado esperado. Por ejemplo, para el analista: el `.sql` solo contiene `SELECT` y corre contra la base local con el candado, devolviendo las columnas esperadas; para dataviz: el SVG tiene `<title>` y `<desc>`, no usa colores fijos y existe el caso sin datos.
