// Genera kit-agentes.ts: los agentes de kit/agentes tal como quedan instalados en la compu del trabajo
// (marcadores {{…}} resueltos), para la prueba integracion-kit.test.ts.
// Correrlo cada vez que cambie un agente del kit:  node mod/tests/generar-kit-agentes.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aca = dirname(fileURLToPath(import.meta.url))
const kit = join(aca, '..', '..', 'kit', 'agentes')
const MARCADORES = { '{{RAIZ}}': 'C:\\trabajo', '{{EQUIPOS}}': 'C:\\trabajo\\equipos', '{{OFICINA}}': 'C:\\trabajo\\oficina', '{{BIBLIOTECA}}': 'C:\\trabajo\\biblioteca' }
const salida = {}
for (const equipo of readdirSync(kit).sort()) {
  for (const archivo of readdirSync(join(kit, equipo)).sort()) {
    if (!archivo.endsWith('.md')) continue
    let texto = readFileSync(join(kit, equipo, archivo), 'utf8')
    for (const [m, v] of Object.entries(MARCADORES)) texto = texto.split(m).join(v)
    salida[`C:\\home-falso\\.claude\\agents\\${equipo}\\${archivo}`] = texto
  }
}
const cuerpo =
  '// Generado por generar-kit-agentes.mjs a partir de kit/agentes. No editar a mano.\n' +
  `export const KIT: Record<string, string> = ${JSON.stringify(salida, null, 2)}\n`
writeFileSync(join(aca, 'kit-agentes.ts'), cuerpo, 'utf8')
console.log(`kit-agentes.ts: ${Object.keys(salida).length} agentes`)
