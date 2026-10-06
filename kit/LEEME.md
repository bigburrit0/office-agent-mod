# Kit de la Oficina

Es el método de trabajo con agentes empaquetado para instalarlo en otra compu con Claude Code de la app de escritorio: el CLAUDE.md global, las reglas de tarjetas, los equipos de agentes, las skills, las plantillas y la Oficina.

## Para la usuaria

1. Cloná el repo en la carpeta que quieras:

   ```powershell
   git clone <URL-del-repo> <carpeta-elegida>
   ```

2. Abrí Claude Code en esa carpeta y escribí:

   > Leé kit/LEEME.md completo, sección «Instrucciones para Claude», y seguila paso a paso.

Claude revisa lo que ya tenés, compara y te propone todo antes de escribir. Nada se instala sin tu aprobación.

## Instrucciones para Claude (la sesión de la compu del trabajo)

Sos el Claude Code de la compu del trabajo de la usuaria. Este repo trae dos cosas: el kit del método (`kit/`) y el mod `/oficina` (`mod/`), que es un panel en vivo de los subagentes. Seguí estas secciones en orden y no pases a la siguiente sin cumplir el «Listo cuando» de la anterior.

### Reglas que valen para todo

- Las reglas de la empresa que ya estén en la compu **siempre ganan** sobre el kit.
- No escribas, copies ni enlaces nada sin aprobación explícita de la usuaria, parte por parte.
- Antes de pisar un archivo, guardá una copia `.bak` con fecha (por ejemplo `CLAUDE.md.2026-10-06.bak`).
- No subas nada a remotos (`git push`), no copies secretos, PIN ni contraseñas, y no instales programas.
- Si un paso falla, pará, mostrá el error tal cual y proponé qué hacer. No improvises un arreglo.

### 1. Revisar el entorno (solo lectura)

Corré y anotá la salida:

```powershell
claude --version
claude plugin list
echo $env:USERPROFILE
Test-Path "$env:USERPROFILE\.claude\agents"
Test-Path "$env:USERPROFILE\.claude\skills"
```

- El mod se probó con Claude Code **2.1.291**. Si la versión es más vieja, avisá: los plugins de funciones (`hooks/register.tsx`) pueden no existir.
- Anotá qué agentes y skills ya hay en `~\.claude\agents` y `~\.claude\skills`: hacen falta en la sección 2.

Listo cuando tenés la versión, la ruta del usuario y la lista de lo que ya existe.

### 2. Instalar el método

Leé `kit/ADAPTAR.md` y seguí sus pasos **1 a 7**: inventario, comparar, elegir la raíz, fusionar el CLAUDE.md global, instalar por partes, adaptar al dominio y verificar.

- Los agentes se instalan **antes** que el mod. Si el mod se carga sin agentes, el panel ofrece crear 4 roles base: con el kit no hacen falta.
- La verificación de agentes es con `/agents` **dentro de una sesión nueva**. `claude agents` en la terminal no sirve: lista sesiones en segundo plano.

Listo cuando el paso 7 de `ADAPTAR.md` está cumplido y la usuaria vio el resumen de lo instalado.

### 3. Cargar el mod `/oficina`

El mod se carga con un enlace (junction de Windows) desde `~\.claude\skills` a la carpeta `mod` del repo clonado. Un plugin con `.claude-plugin\plugin.json` dentro de `~\.claude\skills\` se carga en el lugar, sin copiarse, en cada sesión nueva. Funciona en la terminal y en la pestaña Code de la app de escritorio.

1. Validar (no escribe nada):

   ```powershell
   $m = "<carpeta-del-repo-clonado>\mod"
   claude plugin validate $m
   ```

   Tiene que terminar con `Validation passed` (el aviso «No author information» es normal).

2. Probar en esta compu (no escribe nada fuera de `mod`):

   ```powershell
   claude plugin test $m
   ```

   Tiene que dar **0 fail**. Si algo falla, pará y mostrá la salida.

3. Con la aprobación de la usuaria, crear el enlace. Si ya existe `~\.claude\skills\tablero-oficina`, **no lo pises**: avisá.

   ```powershell
   cmd /c mklink /J "%USERPROFILE%\.claude\skills\tablero-oficina" "$m"
   ```

4. Verificar: `claude plugin list` muestra `tablero-oficina@skills-dir` con estado `loaded`.
   - Si no figura o figura apagado, puede ser una política de la organización que bloquea plugins: avisale a la usuaria, no lo fuerces.

Listo cuando `claude plugin list` muestra el mod `loaded`.

### 4. Probarlo en una sesión nueva

Pedile a la usuaria que abra una sesión nueva (o que use `/reload-plugins`) y revisá con ella:

| Qué | Cómo | Qué tiene que pasar |
|---|---|---|
| El panel abre | `/oficina` | Se abre «Oficina» y el robot saluda. |
| Los equipos | Pestaña **Equipos** | Están los equipos instalados en la sección 2. Los agentes con ⚠ no cumplen el esquema: abrilos y leé el aviso. |
| Equipos del edificio | Pestaña **Equipos** | Seguridad, mantenimiento, limpieza, facilities y arquitectura ya tienen color y actividad. Sus agentes se crean con **+ Nuevo agente** solo cuando haga falta (regla de 3). |
| Subagentes | Lanzar cualquier subagente | Aparece en el patio con el color de su equipo, haciendo su actividad. |
| Uso de la sesión | Vista **Subagentes**, «Uso de la sesión» | Con suscripción: barras de 5 horas y semanal. Con clave de API: el costo de la sesión. |
| Compactar | «Compactar sesión…» | Pide confirmación. Si Claude está respondiendo, avisa que se pruebe al terminar. |

Listo cuando la usuaria vio cada fila y anotaste lo que no funcionó.

### 5. Informe final

Escribile a la usuaria, corto:

- Qué se instaló y dónde, y qué quedó con `.bak`.
- La salida de `claude plugin list` y de `claude plugin test`.
- Lo que no funcionó en la sección 4, con el error tal cual.
- Lo que quedó para después, por ejemplo agentes de los equipos del edificio.

## Cómo se deshace

- Quitar solo el enlace del mod: `cmd /c rmdir "%USERPROFILE%\.claude\skills\tablero-oficina"`.
- Apagar el mod sin quitar nada: `claude plugin disable tablero-oficina@skills-dir`.
- Lo instalado del método se vuelve atrás con las copias `.bak`.

## Actualizar

El kit se regenera desde casa y no se edita a mano. Para actualizar, hacé `git pull`; Claude lee `CAMBIOS.md` y repite solo los pasos que correspondan. El mod se actualiza solo con el `git pull`, porque el enlace apunta al repo: alcanza con abrir una sesión nueva.
