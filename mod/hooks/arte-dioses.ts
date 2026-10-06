// Dioses de equipo: una cabeza maya/azteca de 24x24 por equipo. A y a son el acento claro/oscuro
// del equipo (parámetro); el resto usa una paleta fija. Módulo puro, sin imports: SVG estático.

export const DIOSES_EQUIPO: Record<string, { dios: string; lema: string }> = {
  base: { dios: "Chaac", lema: "lluvia: el que trabaja la tierra" },
  direccion: { dios: "Kukulkán", lema: "serpiente emplumada: guía y decide" },
  'dev-a1': { dios: "K'awiil", lema: "rayo y hacha: construye" },
  'dev-tablero': { dios: "Balam", lema: "jaguar: vigila el tablero" },
  datos: { dios: "Tezcatlipoca", lema: "espejo humeante: mira y mide" },
  research: { dios: "Xólotl", lema: "perro guía: explora lo oscuro" },
  librarian: { dios: "Itzamná", lema: "escritura y códices: guarda" },
}

const PAL_DIOS: Record<string, string> = {
  O: '#1c120a',
  W: '#ffffff',
  K: '#140c08',
  R: '#c8322a',
  r: '#7a1414',
  Y: '#f2c230',
  y: '#a87818',
  B: '#7fd0ff',
  Z: '#b8b0a8',
  z: '#7d7670',
  C: '#f3e2b8',
  c: '#c9a66c',
  M: '#6b4423',
  F: '#2fa05a',
  f: '#1d6b3a',
  Q: '#3fc8c0',
  L: '#e8607a',
  T: '#24707c',
  G: '#8fb070',
  g: '#5c7a44',
  m: '#4a2c16',
  S: '#d9a066',
  s: '#a0683a',
}

const ACENTO_BASE: [string, string] = ['#3fae6a', '#23703f']

const MATRICES: Record<string, string[]> = {
  base: [
    '..........OAAO..........',
    '...OOOOOOOAAAAOOOOOOO...',
    '..OAAAAAAAAAAAAAAAAAAO..',
    '..OAAaAAAaAAAAaAAAaAAO..',
    '..OAAaAAAaAAAAaAAAaAAO..',
    '..OAAAAAAAAAAAAAAAAAAO..',
    '...OQQQQQQQQQQQQQQQQO...',
    '...OQQQQQQQQQQQQQQQQO...',
    '.OOOQQWWQQQTTQQWWQQQOOO.',
    'OYYYQWKKWQOTTOWKKWQQYYYO',
    'OYyYQWKKWQQTTQWKKWQQYyYO',
    'OYYYQQWWQQQTTQQWWQQQYYYO',
    '.OOOQQQQQQOTTOQQQQQQOOO.',
    '...OQQQQQQOTTOQQQQQQO...',
    '.O.OQQQQQQOTTOQQQQQQO.O.',
    'OBOOQrrrWQOTTOQWrrrQOOBO',
    'OBOOQrrrWQOTTOQWrrrQOOBO',
    '.O.OQQWQQQOTTOQQQWQQO.O.',
    '..OOQQQQQQOTTOQQQQQQOO..',
    '.OBOOQQQQTTTTQQQQQQOOBO.',
    '..O..OOOOTOOTOOOOOO..O..',
    '.........OTTO...........',
    '..........OO............',
    '........................',
  ],
  direccion: [
    '..OO.OfFO.OO............',
    '.OfAOOFFOOfAO...........',
    '.OAAOOFFOOAAO.OO........',
    'OOOAAOOFFOAAOOfQO.......',
    'fFOOAAOFFOAAOOQQO.......',
    'OFFOAAOFFOAAOQQO........',
    'OFFOAAOFFOAAOQQO........',
    '.OFFOAAOFFAAOQQO........',
    '..OffffffffffQOOOOOOOO..',
    '..OfFFFFFFFFOOOFFFFFFFO.',
    '...OFFFFFFFFFWWFfFfFFFO.',
    '...OFFfFFFFFFWKFFFFFFO.O',
    '...OFFFFFfFFFFFRRRRRWROL',
    '...OFfFFFFFFFFFRRWRRRRLO',
    '...OFFFfFFfFFFFRRRRFOOOL',
    '...OFFFFFFFFFFFFFFFFO..O',
    '...OFfFFfFOOOOOOOOOO....',
    '...OFFAFFFOOOOOOO.......',
    '...OFFFFFFFFFFAAAO......',
    '....OOOFFAFFAFAAAO......',
    '......OFFFFFFFAAAO......',
    '.......OOOOOOOAAAO......',
    '..............OOO.......',
    '........................',
  ],
  'dev-a1': [
    '......OZOOYOYOOZO.......',
    '.....OZOOYRYOOZO........',
    '......OZOOYROOO.........',
    '.......O.OMMZZZO........',
    '.........OMMZzzO........',
    '.........OMMZZZO......O.',
    '.........OMMOOZO.....OGO',
    '....OOOOOOMMOOOOO...OGO.',
    '...OAAAaAYYaAAAAGOOOOGO.',
    '.O.OAAAAAYYAAAAAGGGGGO..',
    'OBOOGGGGGGGGGGGGGGGGGO..',
    '.OBOGgGGGGGWWWWGGGGGO...',
    'OBOOGGYYYGGWWWWGGGGGO...',
    '.OBOGGYyYGGWWKKGGOOOO...',
    'OBOOGGYYYGGWWKKGGGGGGO..',
    '.O.OGGGGGGGGGGrrrrrWrO..',
    '...OGGgGGGGGGGrrWrrrrO..',
    '...OGGGGGGgGGGGGGOOOO...',
    '....OGGGGGGGGGGOO.......',
    '....OGGGGGGGGGGO........',
    '.....OOOOOOOOOO.........',
    '........................',
    '........................',
    '........................',
  ],
  'dev-tablero': [
    '..OOO..............OOO..',
    '.OYYYO............OYYYO.',
    '.OYMYO............OYMYO.',
    '..OOOOOOOOOOOOOOOOOOOO..',
    '..OAAAAAAAAAAAAAAAAAAO..',
    '..OAAaAAAaAAAAaAAAaAAO..',
    '..OAAAAAAAAAAAAAAAAAAO..',
    '...OOOOOOOOOOOOOOOOOO...',
    '..OYYKYYYYYYYYYYKYYYYO..',
    '..OYYYYYKYYYYYYYYYYYYO..',
    '..OYYWWWYYYYYYWWWYYYYO..',
    '.OYYYWKKWYYYYWKKWYYYYYO.',
    '.OYKYWKKWYYYYWKKWYKYYYO.',
    '.OYYYWWWYYYYYYWWWYYYYYO.',
    '.OYYYYYYYYKKKKYYYYYYKYO.',
    '..OYKYYYYYYKKYYYYYYYYO..',
    '..OYYYYCCCCLLCCCCYYYYO..',
    '..OYYYYCCCOOOOCCCYKYYO..',
    '...OYYYCCCOWWOCCCYYYO...',
    '...OYYYCCCCWWCCCCYYYO...',
    '....OYyYCCCOOCCCYyYO....',
    '.....OYyYyYYYYyYyYO.....',
    '......OOYyyyyyyYOO......',
    '........OOOOOOOO........',
  ],
  datos: [
    '.OZO....OAAO.OOOAAO.....',
    'OZO..O..OAAOOAAOAAO.....',
    'ZO..OZOOOAAOOAAOAAOO....',
    'OZOOZAAAAAAAAAAAAAAAO...',
    '.OOOOAAaAAAaAAAaAAaAO...',
    '.OKWKAAAAAAAAAAAAAAAO...',
    'OKWKKKYYYYYYYYYYYYYYO...',
    'OKKKKKYYYYYYYYYYYYYYO...',
    'OKKKzKKKKKKKKKKKKKKKO...',
    '.OKKKKKWWWWKKKWWWWKKO...',
    '..OOOKKWKKWKKKWKKWKKOO..',
    '....OKKKKKKKyKKKKKKAAAO.',
    '....OYYYYYYYyYYYYYYAaAO.',
    '....OYYYYYYyyyYYYYYAAAO.',
    '....OYYYYYYYYYYYYYYYOO..',
    '....OYKKKKKKKKKKKKKYO...',
    '....OYKKKWrWrWrWKKKYO...',
    '....OYKKKKKKKKKKKKKYO...',
    '.....OYYYYYYYYYYYYYO....',
    '.....OYYYYYYYYYYYYYO....',
    '......OOYYYYYYYYYOO.....',
    '........OOOOOOOOO.......',
    '........................',
    '........................',
  ],
  research: [
    '....O..............O....',
    '...OMOO..........OOMO...',
    '...OMMMO........OMMMMO..',
    '..OMMMMO........OMMMOO..',
    '.OMMLLMO........OMLLMMO.',
    '..OMLLMOOOOOOOOOOMLLMO..',
    '..OMLLMMMMMMMMMMMMLLMO..',
    '..OMMMMMMMMMMMMMMMMMMO..',
    '..OMMmMMMMMMMMMMMMMMMO..',
    '...OMMMWWWMMMMWWWMMMO...',
    '...OMMMWKWMMMMWKWMMMO...',
    '...OMMMWWKMMMMKWWMMMO...',
    '...OMMMMMMMMMMMMMMMMO...',
    '...OMMMMCCCKKCCCMMMMO...',
    '...OMMMMCCCKKCCCMMMMO...',
    '...OMMmMCCCOOCCCMMmMO...',
    '...OMMMMCCOCCOCCMMMMO...',
    '...OMMMMCCCCLLCCMMMMO...',
    '....OOOOOOOOLLOOOOOO....',
    '....OAAAaAAaAAaAAaAO....',
    '....OAAAAAAAAAAAAAAO....',
    '.....OZOOZOOOOOZOOZO....',
    '......O..O.....O..O.....',
    '........................',
  ],
  librarian: [
    '..........OYYYO.........',
    '.........OYYYYYO........',
    '.........OYYRYYO........',
    '....OOOOOOYYYYYOOOOO....',
    '...OAAAAAAAYYYAAAAAAO...',
    '...OAAAaAAAAAAAAaAAAO...',
    '...OAAAAAAAAAAAAAAAAO...',
    '....OSSSSSSSSSSSSSSO....',
    '....OSWWWWWSSWWWWWSO....',
    '..OOOSWKKKWssWKKKWSOOO..',
    '.OYYYSWWKKWssWWKKWSYYYO.',
    '.OYYYSWWWWWssWWWWWSYYYO.',
    '.OYYYSSSSSSssSSSSSSYYYO.',
    '..OOOSsSSSssssSSSsSOOO..',
    '....OSSsSSSSSSSSsSSO....',
    '....OSSSSrrWrrrSSSSO....',
    '....OSSSSrrrrrrSSSSO....',
    '...OOSSSSSSSSSSSSSSOO...',
    '..OCCCCCCCCccCCCCCCCCO..',
    '..OCCKKKKCCccCRRRRRCCO..',
    '..OCCCCCCCCccCCCCCCCCO..',
    '..OCCKKKKCCccCRRRRRCCO..',
    '..OAAAAAAAAAAAAAAAAAAO..',
    '...OOOOOOOOOOOOOOOOOO...',
  ],
}

function entero(valor: unknown, porDefecto: number, min: number, max: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return porDefecto
  return Math.max(min, Math.min(max, Math.round(n)))
}

// Las 24 filas del dios del equipo. Equipo desconocido: base.
export function diosMatriz(equipo: string): string[] {
  return (Object.prototype.hasOwnProperty.call(MATRICES, equipo) ? MATRICES[equipo] : MATRICES.base).slice()
}

// Un <path> por color, con tramos horizontales de coordenadas enteras.
function pathsDeMatriz(filas: string[], paleta: Record<string, string>, escala: number): string {
  const porColor: Record<string, string> = {}
  for (let y = 0; y < filas.length; y++) {
    const fila = filas[y]
    let x = 0
    while (x < fila.length) {
      const ch = fila[x]
      let fin = x + 1
      while (fin < fila.length && fila[fin] === ch) fin++
      if (paleta[ch]) {
        porColor[ch] = (porColor[ch] ?? '') + `M${x * escala} ${y * escala}h${(fin - x) * escala}v${escala}h${-(fin - x) * escala}z`
      }
      x = fin
    }
  }
  return Object.keys(porColor)
    .map(ch => `<path d="${porColor[ch]}" fill="${paleta[ch]}"/>`)
    .join('')
}

function acentoValido(a: unknown): a is [string, string] {
  return Array.isArray(a) && a.length >= 2 && a.slice(0, 2).every(c => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c))
}

// SVG del dios, de 24*escala px. Escala entera acotada a 1..8 (no numérica: 1).
export function diosSvg(equipo: string, escala: number, acento: [string, string]): string {
  const e = entero(escala, 1, 1, 8)
  const [A, a] = acentoValido(acento) ? acento : ACENTO_BASE
  const lado = 24 * e
  const cuerpo = pathsDeMatriz(diosMatriz(equipo), { ...PAL_DIOS, A, a }, e)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}" ` +
    `shape-rendering="crispEdges">${cuerpo}</svg>`
  )
}
