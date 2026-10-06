# Equipos de subagentes

Fuente de verdad de los agentes y equipos de la usuaria (historial con git).

- `agents\<equipo>\<agente>.md`: agentes nativos de Claude Code. `%USERPROFILE%\.claude\agents` es un junction a `agents\`.
- `skills\equipo-<nombre>\SKILL.md`: protocolo de cada equipo (se invoca con `/equipo-<nombre>`); cada carpeta se conecta con un junction en `%USERPROFILE%\.claude\skills\`.
- Campos extra en el frontmatter (`equipos`, `etiquetas`, `emblema`): Claude Code los ignora; los lee el panel `/tablero`.
- Plan y decisiones: `{{RAIZ}}\tablero-subagentes\ESTADO.md`.
