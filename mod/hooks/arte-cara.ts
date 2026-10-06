// Cara del jaguar en pixel art 8 bits, de frente, con una emoción por situación.
// Funciones puras que devuelven texto SVG (como pixel.ts). Sin dependencias, sin scripts,
// sin referencias externas: la animación es solo SMIL, en pasos discretos.
// El arte viene de arte/8bit/arte.json (matrices de caracteres: '.' es transparente).

export const EMOCIONES = ['aburrido', 'dormido', 'pensando', 'caceria', 'sospecha', 'ruge', 'molesto', 'bufido', 'contento']

export const EMOCION_ALT: Record<string, string> = {
  aburrido: 'aburrido',
  dormido: 'dormido',
  pensando: 'pensando',
  caceria: 'al acecho',
  sospecha: 'con sospecha',
  ruge: 'rugiendo',
  molesto: 'molesto',
  bufido: 'bufando',
  contento: 'contento',
}

const PAL_CARA: Record<string, string> = {"O":"#1c0f06","D":"#a8480c","F":"#e0801a","Y":"#f6bd3c","C":"#fbe7b4","K":"#3a1a06","N":"#5a2216","E":"#c6e636","W":"#ffffff","M":"#7a1414","T":"#e8607a","G":"#2b2b3a","B":"#9fe3ff","R":"#e8402a","Z":"#cfe0ff","Q":"#5fe0c8","S":"#ffe766","V":"#8a2a10","U":"#ff9aa8"}

const PAL_FX: Record<string, string> = {"Q":"#5fe0c8","Z":"#cfe0ff","S":"#ffe766","W":"#ffffff","R":"#ff5a3c","g":"#b9c7bd"}

const CARAS: Record<string, string[]> = {
  medio: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYOOOOOYYYYYYYYOOOOOYFO',
    'OFYOEOEOYYYYYYYYOEOEOYFO',
    'OFFYOOOYYYYCCYYYYOOOYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCOOOOOOOOCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  parpadeo: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYOOOOOYYYYYYYYOOOOOYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCOOOOOOOOCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  bostezo: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYOYYYOYYYYYYYYOYYYOYFO',
    'OFYYOYOYYYYYYYYYYOYOYYFO',
    'OFYYYOYYYYYYYYYYYYOYYYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYOOOOOOYYYKYYFFO',
    'ODFYKYYOOMMMMMMOOYYKYFDO',
    'ODFFYYOWMMMMMMMMWOYYFFDO',
    '.ODFFYOMMMMMMMMMMOYFFDO.',
    '.ODFFCOWMMTTTTMMWOCFFDO.',
    '..ODFFCOMTTTTTTMOCFFDO..',
    '...ODDCCOOOOOOOOCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  dormido: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYOYYYOYYYYYYYYOYYYOYFO',
    'OFFYOOOYYYYCCYYYYOOOYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCCCOOOOCCCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  piensa: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYGGGGYYYYYYYYYYGGGGYFO',
    'OFGBOOOGGGGGGGGGGBOOYGFO',
    'OFGOEOEGYYYYYYYYGEOEOGFO',
    'OFGOEEEGYYYYYYYYGEEEOGFO',
    'OFFGGGGYYYYCCYYYYGGGGFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCCCOOOOCCCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  "piensa3": [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYGGGGYYYYYYYYYYGGGGYFO',
    'OFGBYYYGGGGGGGGGGBYYYGFO',
    'OFGYYYYGYYYYYYYYGYYYYGFO',
    'OFGOOOOGYYYYYYYYGOOOOGFO',
    'OFFGGGGYYYYCCYYYYGGGGFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCCCOOOOCCCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  lee_izq: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYGGGGYYYYYYYYYYGGGGYFO',
    'OFGBOOOGGGGGGGGGGBOOYGFO',
    'OFGOOEEGYYYYYYYYGOEEOGFO',
    'OFGOOEEGYYYYYYYYGOEEOGFO',
    'OFFGGGGYYYYCCYYYYGGGGFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCCCOOOOCCCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  lee_der: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYGGGGYYYYYYYYYYGGGGYFO',
    'OFGBOOOGGGGGGGGGGBOOYGFO',
    'OFGOEEOGYYYYYYYYGEEOOGFO',
    'OFGOEEOGYYYYYYYYGEEOOGFO',
    'OFFGGGGYYYYCCYYYYGGGGFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCCCOOOOCCCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  blep: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYGGGGYYYYYYYYYYGGGGYFO',
    'OFGBOOOGGGGGGGGGGBOOYGFO',
    'OFGOEOEGYYYYYYYYGEOEOGFO',
    'OFGOEOEGYYYYYYYYGEOEOGFO',
    'OFFGGGGYYYYCCYYYYGGGGFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCOOCOOCOOCCYFFDO.',
    '.ODFFCCCCOOCTOOCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  caceria: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYOOOYYYYYYYYYYOOOYFFO',
    'OFYOOOOOYYYYYYYYOOOOOYFO',
    'OFYOOWOOYYYYYYYYOOWOOYFO',
    'OFYOOOOOYYYYYYYYOOOOOYFO',
    'OFYYOOOYYYYYYYYYYOOOYYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCCCOOOOCCCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  sospecha: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYOOOOFFO',
    'OFYYYYYYYYYYYYYYOYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYDDDDDYYYYYYYYOOOOOYFO',
    'OFYOOOOOYYYYYYYYYYYYYYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCOOYYYFFDO',
    '.ODFFYCCOOOOOOOCCCYFFDO.',
    '.ODFFCCCCCCCCCCCCCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  ruge: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFOOYKYYYYYYYYYYYYKYOOFO',
    'OFYOOOYYYYYYYYYYYYOOOYFO',
    'OFYYOOOOYYYYYYYYOOOOYYFO',
    'OFYOEROYYYYYYYYYYOREOYFO',
    'OFYYOOOYYYYYYYYYYOOOYYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFUUYKYYYCCNNCCYYYKYUUFO',
    'ODFYKYYYCCCOOCCCYYYKYFDO',
    'ODFFYYYOOOOOOOOOOYYYFFDO',
    '.ODFFYOWMMMMMMMMWOYFFDO.',
    '.ODFFCOWMMMMMMMMWOCFFDO.',
    '..ODFFCOMMTTTTMMOCFFDO..',
    '...ODDCOWMTTTTMWOCDDO...',
    '....OODDOOOOOOOODDOO....',
    '......OOOOOOOOOOOO......',
  ],
  molesto: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFOOYKYYYYYYYYYYYYKYOOFO',
    'OFYOOOYYYYYYYYYYYYOOOYFO',
    'OFYYOOOOYYYYYYYYOOOOYYFO',
    'OFYOEROYYYYYYYYYYOREOYFO',
    'OFYYOOOYYYYYYYYYYOOOYYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFYCCOOOOOOOOCCYFFDO.',
    '.ODFFCCOCCCCCCCCOCCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  bufido: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFOOYKYYYYYYYYYYYYKYOOFO',
    'OFYOOYYYYYYYYYYYYYYOOYFO',
    'OFYYOEOYYYYYYYYYYOEOYYFO',
    'OFYYYOYYYYYYYYYYYYOYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYOOOOOOOOOOYYYFFDO',
    '.ODFFYOWMMMMMMMMWOYFFDO.',
    '.ODFFCCOWMMMMMMWOCCFFDO.',
    '..ODFFCCOOOOOOOOCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  feliz: [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYOOOYYYYYYYYYYOOOYYFO',
    'OFYOYYYOYYYYYYYYOYYYOYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCOOOOOOCCYYYFFDO',
    '.ODFFYOCOMMMMMMOCOYFFDO.',
    '.ODFFCCOOMTTTTMOOCCFFDO.',
    '..ODFFCCCOOOOOOCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  "feliz2": [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYOOOYYYYYYYYYYOOOYYFO',
    'OFYOYYYOYYYYYYYYOYYYOYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFOCCCCOOOOCCCCOFFDO.',
    '.ODFFCOOOOCCCCOOOOCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  "relame1": [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYOOOYYYYYYYYYYOOOYYFO',
    'OFYOYYYOYYYYYYYYOYYYOYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFOCCCTTOOOCCCCOFFDO.',
    '.ODFFCOOOOCCCCOOOOCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
  "relame2": [
    '..OOO..............OOO..',
    '.OFFFO............OFFFO.',
    '.OFCFOOOOOOOOOOOOOOFCFO.',
    '.OFCFFYYYYYYYYYYYYFFCFO.',
    'OFFFYYYKYYYKKYYYKYYYFFFO',
    'OFFYYKYYYYYYYYYYYYKYYFFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYYYYYYYYYYYYYYYYYYYFO',
    'OFYYOOOYYYYYYYYYYOOOYYFO',
    'OFYOYYYOYYYYYYYYOYYYOYFO',
    'OFFYYYYYYYYCCYYYYYYYYFFO',
    'OFFYYKYYYCCNNCCYYYKYYFFO',
    'ODFYKYYYCCCNNCCCYYYKYFDO',
    'ODFFYYYCCCCOOCCCCYYYFFDO',
    '.ODFFOCCCCOOOTTCCCOFFDO.',
    '.ODFFCOOOOCCCCOOOOCFFDO.',
    '..ODFFCCCCCCCCCCCCFFDO..',
    '...ODDCCCCCCCCCCCCDDO...',
    '....OODDCCCCCCCCDDOO....',
    '......OOOOOOOOOOOO......',
  ],
}

const FX: Record<string, string[]> = {
  "3": [
    'QQ.',
    '..Q',
    'QQ.',
    '..Q',
    'QQ.',
  ],
  "7": [
    'QQQ',
    '..Q',
    '.Q.',
    '.Q.',
  ],
  z: [
    'ZZZ',
    '.Z.',
    'ZZZ',
  ],
  Z: [
    'ZZZZ',
    '..Z.',
    '.Z..',
    'ZZZZ',
  ],
  "+": [
    '.Q.',
    'QQQ',
    '.Q.',
  ],
  x: [
    'Q.Q',
    '.Q.',
    'Q.Q',
  ],
  "=": [
    'QQQ',
    '...',
    'QQQ',
  ],
  pi: [
    'QQQQ',
    '.Q.Q',
    '.Q.Q',
  ],
  raiz: [
    '..QQQ',
    '..Q..',
    'Q.Q..',
    '.Q...',
  ],
  sigma: [
    'QQQ',
    'Q..',
    '.Q.',
    'Q..',
    'QQQ',
  ],
  chispa: [
    '.S.',
    'SWS',
    '.S.',
  ],
  ira: [
    'R.R',
    '.R.',
    'R.R',
  ],
  vapor: [
    'gg',
    'gg',
  ],
  pregunta: [
    'WWW',
    '..W',
    '.W.',
    '...',
    '.W.',
  ],
}

// Capa de pelos erizados del bufido: 28x24, va en la cara + (dx, dy).
const ERIZO = {
  dx: -2,
  dy: -2,
  filas: [
    '............................',
    '.....D.................O....',
    '.......D....................',
    '.........O..D..O..D.........',
    '..O.........................',
    '.........................O..',
    '............................',
    '..........................D.',
    '.D..........................',
    '............................',
    '..........................O.',
    '.O..........................',
    '............................',
    '..........................D.',
    '.D..........................',
    '............................',
    '..D.........................',
    '.........................D..',
    '...O....................D...',
    '.......................D....',
    '......................O.....',
    '............................',
    '............................',
    '............................',
  ],
}

// Marco de piedra maya (42x34), de arte/8bit/marcos.json: va en (0,0) y la cara se corre (4,4).
const PAL_MARCO: Record<string, string> = {"O":"#1a1410","L":"#c9bfae","M":"#958a7c","D":"#5e564e","J":"#3fae6a","j":"#23703f","G":"#e2a72e","g":"#9c6a10","V":"#0a3418","v":"#12592b","H":"#2e8a3a","h":"#3fae4a","F":"#e8553f","f":"#ffd23a","T":"#5a3416"}
const MARCO: string[] = [
  'OOOOOOOOOOOOOOOOOOOOGGOOOOOOOOOOOOOOOOOOOO',
  'OJjLLLLLDLLLLLDLLLGGGGGGLLDLLLLLDLLLLLDJjO',
  'OjJMMDMMMMMDMMMMMDgGGGGgMMMMMDMMMMMDMMMjJO',
  'OLMOOOOOOOOOOOOOOOOOggOOOOOOOOOOOOOOOOOMMO',
  'OLDO..................................OMDO',
  'OLMO..................................OMMO',
  'OLMO..................................OMMO',
  'ODMO..................................ODMO',
  'OLMO..................................OMMO',
  'OLDO..................................OMDO',
  'OLMO..................................OMMO',
  'OLMO..................................OMMO',
  'ODMO..................................ODMO',
  'OLMO..................................OMMO',
  'OLDO..................................OMDO',
  'OLMO..................................OMMO',
  'OLMO..................................OMMO',
  'ODMO..................................ODMO',
  'OLMO..................................OMMO',
  'OLDO..................................OMDO',
  'OLMO..................................OMMO',
  'OLMO..................................OMMO',
  'ODMO..................................ODMO',
  'OLMO..................................OMMO',
  'OLDO..................................OMDO',
  'OLMO..................................OMMO',
  'OLMO..................................OMMO',
  'ODMO..................................ODMO',
  'OLMO..................................OMMO',
  'OLDO..................................OMDO',
  'OLMOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOMMO',
  'OJjMMMMMDMMMMMDMMMMMDMMMMMDMMMMMDMMMMMDJjO',
  'OjJMMDMMMMMDMMMMMDMMMMMDMMMMMDMMMMMDMMMjJO',
  'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
]
const MARCO_ANCHO = 42
const MARCO_ALTO = 34
const MARCO_DESDE = 4

const ANCHO = 34
const ALTO = 26
const CARA_X = 3
const CARA_Y = 5

const f3 = (v: number): string => String(Math.round(v * 1000) / 1000)

// Un <path> por color de la matriz (tramos horizontales, coordenadas enteras).
function pathsDeMatriz(filas: string[], pal: Record<string, string>, escala: number, x0: number, y0: number): string {
  const porColor: Record<string, string> = {}
  for (let y = 0; y < filas.length; y++) {
    const fila = filas[y]
    let x = 0
    while (x < fila.length) {
      const ch = fila[x]
      let fin = x + 1
      while (fin < fila.length && fila[fin] === ch) fin++
      if (ch !== '.' && pal[ch]) {
        porColor[ch] = (porColor[ch] ?? '') + `M${x0 + x * escala} ${y0 + y * escala}h${(fin - x) * escala}v${escala}h${-(fin - x) * escala}z`
      }
      x = fin
    }
  }
  return Object.keys(porColor)
    .map(ch => `<path fill="${pal[ch]}" d="${porColor[ch]}"/>`)
    .join('')
}

// Un cuadro de la cara, ya ubicado en el lienzo.
function cuadro(nombre: string, s: number): string {
  return pathsDeMatriz(CARAS[nombre], PAL_CARA, s, CARA_X * s, CARA_Y * s)
}

function efecto(nombre: string, s: number): string {
  return pathsDeMatriz(FX[nombre], PAL_FX, s, 0, 0)
}

// Secuencia de cuadros en bucle: un grupo por cuadro distinto, con opacidad discreta.
function secuencia(cuadros: Array<[string, number]>, s: number): string {
  const lim = [0]
  for (const c of cuadros) lim.push(lim[lim.length - 1] + c[1])
  const T = lim[lim.length - 1]
  const tiempos = lim.slice(0, -1).map(b => f3(b / T)).join(';')
  const unicos = Array.from(new Set(cuadros.map(c => c[0])))
  return unicos
    .map(n => {
      const vals = cuadros.map(c => (c[0] === n ? 1 : 0))
      return `<g opacity="${vals[0]}">${cuadro(n, s)}<animate attributeName="opacity" calcMode="discrete" values="${vals.join(';')}" keyTimes="${tiempos}" dur="${f3(T)}s" repeatCount="indefinite"/></g>`
    })
    .join('')
}

// Mueve un contenido en pasos discretos (cada paso es [dx, dy] en unidades).
function mueve(contenido: string, pasos: Array<[number, number]>, dur: number, s: number): string {
  const vals = pasos.map(p => `${p[0] * s} ${p[1] * s}`).join(';')
  return `<g>${contenido}<animateTransform attributeName="transform" type="translate" calcMode="discrete" values="${vals}" dur="${f3(dur)}s" repeatCount="indefinite"/></g>`
}

// Un efecto que sube en pasos y se desvanece.
function flota(nombre: string, s: number, x: number, y: number, pasos: number, dur: number, begin: number, dx = 0): string {
  const vals: string[] = []
  for (let i = 0; i <= pasos; i++) vals.push(`${Math.round((dx * i) / pasos) * s} ${-i * s}`)
  return (
    `<g transform="translate(${x * s} ${y * s})"><g opacity="0">${efecto(nombre, s)}` +
    `<animate attributeName="opacity" calcMode="discrete" values="0;1;1;0" keyTimes="0;0.05;0.75;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>` +
    `<animateTransform attributeName="transform" type="translate" calcMode="discrete" values="${vals.join(';')}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g></g>`
  )
}

// Un efecto que titila (aparece y desaparece en el lugar).
function titila(nombre: string, s: number, x: number, y: number, dur: number, begin: number): string {
  return (
    `<g transform="translate(${x * s} ${y * s})" opacity="0">${efecto(nombre, s)}` +
    `<animate attributeName="opacity" calcMode="discrete" values="0;1;0" keyTimes="0;0.4;0.7" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></g>`
  )
}

// Sacudida corta: 0, +1, 0, -1 unidad en 0.32 s.
const SACUDIDA: Array<[number, number]> = [[0, 0], [1, 0], [0, 0], [-1, 0]]

// Cuerpo de cada emoción. Con `quieto` solo el primer cuadro, sin animación ni efectos.
function cuerpoEmocion(e: string, s: number, quieto: boolean): string {
  switch (e) {
    case 'dormido':
      if (quieto) return cuadro('dormido', s)
      return (
        mueve(cuadro('dormido', s), [[0, 0], [0, 1]], 3.2, s) +
        flota('z', s, 26, 8, 4, 3, 0, 2) +
        flota('Z', s, 27, 9, 5, 3, 1.5, 3)
      )
    case 'pensando': {
      if (quieto) return cuadro('piensa', s)
      const cara = secuencia(
        [['piensa', 1.4], ['lee_izq', 0.7], ['lee_der', 0.7], ['piensa', 1.0], ['piensa3', 0.15], ['piensa', 0.8], ['blep', 1.0], ['piensa', 0.6]],
        s,
      )
      const simbolos: Array<[string, number, number, number]> = [
        ['+', 27, 12, 0], ['7', 30, 14, 0.6], ['x', 26, 9, 1.2], ['pi', 29, 11, 1.8],
        ['=', 0, 12, 0.9], ['raiz', 0, 16, 2.1], ['sigma', 30, 8, 2.6], ['3', 1, 9, 3.0],
      ]
      return cara + simbolos.map(([n, x, y, b]) => flota(n, s, x, y, 5, 2.4, b)).join('')
    }
    case 'caceria':
      if (quieto) return cuadro('caceria', s)
      // Agazapado: toda la cara una unidad más abajo, con un temblor horizontal.
      return `<g transform="translate(0 ${s})">` + mueve(cuadro('caceria', s), [[0, 0], [1, 0], [-1, 0], [1, 0], [-1, 0], [0, 0]], 0.5, s) + '</g>'
    case 'sospecha':
      if (quieto) return cuadro('sospecha', s)
      return cuadro('sospecha', s) + titila('pregunta', s, 29, 3, 2, 0)
    case 'ruge':
      if (quieto) return cuadro('ruge', s)
      return mueve(cuadro('ruge', s), SACUDIDA, 0.32, s) + titila('ira', s, 27, 4, 0.6, 0) + titila('ira', s, 1, 6, 0.6, 0.3)
    case 'molesto':
      if (quieto) return cuadro('molesto', s)
      return cuadro('molesto', s) + flota('vapor', s, 4, 5, 4, 2.2, 0, -1) + flota('vapor', s, 27, 5, 4, 2.2, 1.1, 1)
    case 'bufido': {
      if (quieto) return cuadro('bufido', s)
      const erizo =
        `<g opacity="0">${pathsDeMatriz(ERIZO.filas, PAL_CARA, s, (CARA_X + ERIZO.dx) * s, (CARA_Y + ERIZO.dy) * s)}` +
        `<animate attributeName="opacity" calcMode="discrete" values="0;1;0;0" keyTimes="0;0.1;0.35;1" dur="1.5s" repeatCount="indefinite"/></g>`
      return mueve(cuadro('bufido', s) + erizo, SACUDIDA, 0.32, s)
    }
    case 'contento': {
      if (quieto) return cuadro('feliz', s)
      const cara = secuencia(
        [['feliz', 0.45], ['feliz2', 0.45], ['feliz', 0.45], ['feliz2', 0.45], ['relame1', 0.2], ['relame2', 0.2], ['relame1', 0.2], ['feliz2', 0.6]],
        s,
      )
      return (
        mueve(cara, [[0, 0], [0, -1]], 0.45, s) +
        titila('chispa', s, 1, 4, 1.1, 0) +
        titila('chispa', s, 29, 6, 1.1, 0.5) +
        titila('chispa', s, 28, 15, 1.1, 0.25) +
        titila('chispa', s, 0, 15, 1.1, 0.8)
      )
    }
    default:
      // aburrido (y cualquier emoción desconocida)
      if (quieto) return cuadro('medio', s)
      return secuencia([['medio', 2.6], ['parpadeo', 0.15], ['medio', 2.2], ['bostezo', 1.3], ['medio', 1.6]], s)
  }
}

function abrirSvg(s: number, cuerpo: string, fondo?: string, marco?: boolean): string {
  const w = (marco ? MARCO_ANCHO : ANCHO) * s
  const h = (marco ? MARCO_ALTO : ALTO) * s
  const bg = typeof fondo === 'string' && /^#[0-9a-fA-F]{6}$/.test(fondo) ? `<rect width="${w}" height="${h}" fill="${fondo}"/>` : ''
  const dentro = marco ? `<g transform="translate(${MARCO_DESDE * s} ${MARCO_DESDE * s})">${cuerpo}</g>${pathsDeMatriz(MARCO, PAL_MARCO, s, 0, 0)}` : cuerpo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${bg}${dentro}</svg>`
}

// Devuelve el SVG de la cara para una emoción. Lienzo de 34 x 26 unidades por `escala` px.
// opts.dormirEn: segundos hasta que la cara aburrida se duerme (solo para 'aburrido').
// opts.quieto: solo el primer cuadro, sin animaciones ni efectos.
// opts.marco: lienzo de 42 x 34 con el marco de piedra; la cara y sus efectos se corren (4,4).
export function caraJaguarSvg(emocion: string, escala: number, opts?: { dormirEn?: number; quieto?: boolean; fondo?: string; marco?: boolean }): string {
  const n = typeof escala === 'number' && Number.isFinite(escala) ? Math.round(escala) : 3
  const s = Math.max(1, Math.min(8, n))
  const e = EMOCIONES.includes(emocion) ? emocion : 'aburrido'
  const quieto = opts?.quieto === true
  const dormirEn = opts?.dormirEn
  if (e === 'aburrido' && typeof dormirEn === 'number' && Number.isFinite(dormirEn)) {
    const x = Math.round(dormirEn)
    if (x <= 0) return caraJaguarSvg('dormido', s, { quieto, fondo: opts?.fondo, marco: opts?.marco })
    if (!quieto) {
      // La cara aburrida se esconde y la dormida aparece sola.
      const cuerpo =
        `<g>${cuerpoEmocion('aburrido', s, false)}<set attributeName="visibility" to="hidden" begin="${x}s" fill="freeze"/></g>` +
        `<g visibility="hidden">${cuerpoEmocion('dormido', s, false)}<set attributeName="visibility" to="visible" begin="${x}s" fill="freeze"/></g>`
      return abrirSvg(s, cuerpo, opts?.fondo, opts?.marco)
    }
  }
  return abrirSvg(s, cuerpoEmocion(e, s, quieto), opts?.fondo, opts?.marco)
}
