# tablero-oficina

Mod de Claude Code: panel de subagentes estilo oficina 8 bits (comando `/oficina`).

- `mod/`: el mod (fuente de verdad). Hooks en `mod/hooks`, pruebas en `mod/tests`, vista previa del arte en `mod/preview`.
- `kit/`: el método de trabajo con agentes, para instalar en otra compu. Empezá por `kit/LEEME.md`.
- `docs/`: planes y auditorías.

## Aceptación (desde esta carpeta)

- `claude plugin validate mod` → código 0 (el aviso «No author information» es normal).
- `claude plugin test mod` → 0 fail, en Windows, Linux o macOS.
- `node mod/preview/make-preview.mjs` → `OK` (Node 22.18 o más nuevo; genera `mod/preview/preview.html`).
- Buscar `command: 'tablero'` en `mod/hooks/register.tsx` → sin resultados (el comando es `/oficina`).
