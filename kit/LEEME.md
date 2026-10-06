# Kit de la Oficina

Es el método de trabajo con agentes (CLAUDE.md global, reglas de tarjetas, equipos de agentes, skills, plantillas y la Oficina) empaquetado para instalarlo en otra compu, con tu Claude Code de la app de escritorio.

## Cómo se clona

```powershell
git clone <URL-del-repo> <carpeta-elegida>
```

## Cómo arrancar

Abrí Claude Code en la carpeta clonada y escribí:

> Leé kit/ADAPTAR.md y seguilo

Claude revisa lo que ya tenés, compara y te propone todo antes de escribir. Nada se instala sin tu aprobación.

## Cargar el mod `/oficina`

El mod es el tablero en vivo de los subagentes. Se carga con un enlace (junction de Windows) desde `~\.claude\skills` a la carpeta `mod` del repo clonado. Un plugin con `.claude-plugin\plugin.json` dentro de `~\.claude\skills\` se carga en el lugar, sin copiarse, en cada sesión. Funciona en la terminal y en la pestaña Code de la app de escritorio.

```powershell
$m = "<carpeta-del-repo-clonado>\mod"
& "$env:USERPROFILE\.local\bin\claude.exe" plugin validate $m
cmd /c mklink /J "%USERPROFILE%\.claude\skills\tablero-oficina" $m
```

- Verificar: `claude plugin list` debe mostrar `tablero-oficina` con estado `loaded`.
- Se aplica al iniciar una sesión nueva o con `/reload-plugins`.
- Deshacer (quita solo el enlace): `cmd /c rmdir "%USERPROFILE%\.claude\skills\tablero-oficina"`
- Apagarlo sin quitar nada: `claude plugin disable tablero-oficina@skills-dir`.

## Actualizar

El kit se regenera desde casa y no se edita a mano. Para actualizar, hacé `git pull`; Claude lee `CAMBIOS.md` y repite solo los pasos que correspondan.
