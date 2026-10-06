// Arte estático del templo abandonado para el Tablero de subagentes: muro y fachada (encabezado de
// Equipos), friso de piedra tallada (separador), códice con pincel y tintero (encabezado de Editar)
// y numerales mayas en base 20 para los conteos.
// Todo son funciones puras que devuelven strings SVG. Sin imports y solo sintaxis «borrable»
// (nada de enum, namespace ni parameter properties) para que Node 24 lo corra directo.
// Los SVG son estáticos: sin scripts, sin animaciones y sin referencias externas.

// Paleta y matrices, copiadas de arte/8bit/templo.json ('.' es transparente).
const PAL: Record<string, string> = {"O":"#14120e","n":"#16241c","N":"#1d3326","P":"#6f7562","p":"#566048","q":"#3e4636","Q":"#8f957c","m":"#2f3a28","V":"#3f8f3a","v":"#2c6a2c","h":"#5fbf4a","D":"#0a0c08","C":"#efdcae","c":"#c9a66c","R":"#b8332a","K":"#2a1a10","W":"#5a3416","w":"#7a4a22","A":"#3d9be0","G":"#e2a72e"}
const MURO: string[] = [
  'nnnnnnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnnnnnnnnnn',
  'nnNNNnNNNnnNNnNnNnNNnnNN',
  'NNNNNnNNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNNNNNNNN',
  'NNNNNNNNNNNNNNNNNNNNNNNN',
  'VVVVVVVVVVVVVVVVVVVVVVVV',
  'qvvqmmvvqqmvvqqqvvqqqvvm',
  'qqqvmmqqqqvmqqqqmvqqqqmm',
  'mmmVmmmmmmVmmmmmmVmmmmmm',
  'ppmpppppmpppppmpppppOppp',
  'qmmqqqqmmqqqqmmqqqqOmqqq',
  'qmmqqqqmmqqqqmmqqqqOmqqq',
  'mmmmmmmmmmmmmmmmmmmmOmmm',
  'pppppmpppppmpppppmpOpppm',
  'qqqqmmqqqqmmqqqqmmqOqqmm',
  'qqqqOOmqqqmmqqqqmmqqOqmm',
  'mmmmOmOmmmmmmmmmmmmOmmmm',
  'ppmppmppmpppppmppppOmppp',
  'qmmqqqqmmqqqqmmqqqqmOqqq',
  'qmmqqqqmmqqqqmmqqqqmmqqq',
  'mmmmmmmmmmmmmmmmmmmmmmmm',
  'pppppmpppppmpppppmpppppm',
  'qqqqmmqqqqmmqqqqmmqqqqmm',
  'qqqqmmqqqqmmqqqqOOmqqqmm',
  'mmmmmmmmmmmmmmmmOmOmmmmm',
  'ppmpppppmpppppmppmppmppp',
  'qmmqqqqmmqqqqmmqqqqmmqqq',
  'qmmqqqqmmqqqqmmqqqqmmqqq',
  'mmmmmmmmmOOOmmmmmmmmmmmm',
  'pppppmpppmpOpppppmpppppm',
  'qqqqmmqqqqOmqqqqmmqqqqmm',
  'qqqqmmqqqqmmqqqqmmqqqqmm',
  'mmmmmmmmmmmmmmmmmmmmmmmm',
]
const FACHADA: string[] = [
  '..................O.O.O.O...................',
  '................OOOOOOOOOOOO................',
  '................OPGPPPPPPGPO................',
  '................OPPPDDDDPPPO................',
  '................OPPPDDDDPPPO................',
  '................OPPPDDDDPPPO................',
  '................OPPPDDDDPPPO................',
  '..............OOVVOVVqVVqVVOVv..............',
  '..............OPPPPQQQQQQPPPPv..............',
  '..............Ommmmqqqqqqmmmmvh.............',
  '..............OQQmQQQQQQQQQmQv..............',
  '..............OPPmPqqqqqqPPmPv..............',
  '..............OmmmmQQQQQQmmmmvh.............',
  '..............OQQQQqqqqqqQQQQv..............',
  '..........OVOVVvVVOVVQVVQVVOVvOVVO..........',
  '..........O.mPPvhmPqqqqqqPPmPvhPmO..........',
  '..........OmmmmvmmmQQQQQQmmmmvmmmO..........',
  '..........OQmQQvQmQqqqqqqQQmQQQQmO..........',
  '..........OPPPmvhPPQQQQQQPPPPmPPPO..........',
  '..........OmmmmvmmmqqqqqqmmmmmmmmO..........',
  '..........OQQQmQQQQQQQQQQQQQQmQQQO..........',
  '......OVVvhVOVVOVVOVVqVVqVVOVVOVVvhVOO......',
  '......O.PvPPmPPPPmPQQQQQQPPmPPPPmvPPPO......',
  '......Ommvmmmmmmmmmqqqqqqmmmmmmmmvmm.O......',
  '......OQQvhQQQmQQQQQQQQQQQQQQmQQQvhQQO......',
  '......OPPvPPPPmPPPPqqqqqqPPPPmPPPvmPPO......',
  '......OmmvmmmmmmmmmQQQQQQmmmmmmmmvmmmO......',
  '......OmQvhQmQQQQmQqqqqqqQQmQQQQmvhQQO......',
  '..OOVVOVVvVVvVVOVVOVVQVVQVVOVVOVVvVVOVVOVO..',
  '..O..PPmPvPPvPPPPmPqqqqqqPPmPPPPmPPPPmPPPO..',
  '..OmmmmmmmmmvhmmmmmQQQQQQmmmmmmmmmmmmmm..O..',
  '..OQmQQQQmQQvQmQQQQqqqqqqQQQQmQQQQmQQQQmQO..',
  '..OPmPPPPmPPvPmPPPPQQQQQQPPPPmPPPPmPPPPmPO..',
  '..OmmmmmmmmmvhmmmmmqqqqqqmmmmmmmmmmmmmmmmO..',
  '..OQQQQmQQQQmQQQQmQQQQQQQQQmQQQQmQQQQmQQQO..',
  '..OPPPPmPPPPmPPPPmPqqqqqqPPmPPPPmPPPPmPPPO..',
]
const FRISO: string[] = [
  'QvQQQQQQQQQQQQQQ',
  'PvPPPPPPPPPPPPPP',
  'PvhqqqqqqqqPPPPP',
  'PvPqpmmpmpqPPqPP',
  'hvPqppmmppqPPqqP',
  'PPPqqqqqqqqPPPPP',
  'pppppppppppppppp',
  'OOOOOOOOOOOOOOOO',
]
// Códice nuevo, copiado de arte/8bit/codice-nuevo.json (tapas de jade, mesa y 7 páginas de 16x22).
const PAL_CODICE: Record<string, string> = {...PAL, "J":"#2f8a5a","j":"#1d5a3a"}
const CODICE_TAPA_IZQ: string[] = [
  'wWWW',
  'WWWW',
  'WOOO',
  'WjJJ',
  'WjJJ',
  'WjJJ',
  'WjGJ',
  'wjJJ',
  'WjJJ',
  'WjJJ',
  'WjGJ',
  'WjJJ',
  'WjJJ',
  'WjJJ',
  'wjGJ',
  'WjJJ',
  'WjJJ',
  'WjJJ',
  'WjJJ',
  'WOOO',
  'WWWw',
  'wWWW',
]
const CODICE_TAPA_DER: string[] = [
  'wWWW',
  'WWWW',
  'OOOW',
  'JJjW',
  'JJjW',
  'JJjW',
  'JGjw',
  'JJjW',
  'JJjW',
  'JJjW',
  'JGjW',
  'JJjW',
  'JJjW',
  'JJjw',
  'JGjW',
  'JJjW',
  'JJjW',
  'JJjW',
  'JJjW',
  'OOOW',
  'WWWw',
  'wWWW',
]
const CODICE_MESA: string[] = [
  'wWWWWWW',
  'WWWWwWW',
  'WwWWWWW',
  'WWWWWwW',
  'WWwWWWW',
  'WWWWWWw',
  'WWWwWWW',
  'wWWWWWW',
  'WWWWwWW',
  'WwWWWWW',
  'WWWWWwW',
  'WWwWWWW',
  'WWWWWWw',
  'WWWwWWW',
  'wWWWWWW',
  'WWWWwWW',
  'WwWWWWW',
  'WWWWWwW',
  'WWwWWWW',
  'WWWWWWw',
  'WWWwWWW',
  'wWWWWWW',
]
const CODICE_PAGINAS: string[][] = [
  [
    'wWWWWWWwWWWWWWwW',
    'WWWWwWWWWWWwWWWW',
    'WwWWWWWWwWWWWWWw',
    'CCCCCCCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'CCCKKKCCCKCKCCCc',
    'CCKCCCKCCCCCCCCc',
    'CCKCKCKCKKKKKCCc',
    'CCKCCCKCCCCCCCCc',
    'CCCKKKKCCCCCCCCc',
    'CCCCCCCCCCCCCCCc',
    'CCRRRRRCCCCCCCCc',
    'CCRCKCRCCACCCCCc',
    'CCRCCCRCACACACCc',
    'CCRCKCRCCCCACCCc',
    'CCRRRRRCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'OOOOOOOOOOOOOOOO',
    'WWWwWWWWWWwWWWWW',
    'wWWWWWWwWWWWWWwW',
  ],
  [
    'wWWWWWWwWWWWWWwW',
    'WWWWwWWWWWWwWWWW',
    'WwWWWWWWwWWWWWWw',
    'CCCCCCCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'CCCGCGCCKKKKCCCc',
    'CCGKGKGCKCCKCCCc',
    'CCCGGGCCKCKKCCCc',
    'CCGKGKGCKCCCCCCc',
    'CCCGCGCCKKKKKCCc',
    'CCCCCCCCCCCCCCCc',
    'CCCCKCCCKCKCKCCc',
    'CCCCCCCCKCKCKCCc',
    'CCKKKKKCKKKKKCCc',
    'CCCCCCCCCKKKCCCc',
    'CCKKKKKCCCKCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'OOOOOOOOOOOOOOOO',
    'WWWwWWWWWWwWWWWW',
    'wWWWWWWwWWWWWWwW',
  ],
  [
    'wWWWWWWwWWWWWWwW',
    'WWWWwWWWWWWwWWWW',
    'WwWWWWWWwWWWWWWw',
    'CCCCCCCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'CCRRRRRCCCVCCCCc',
    'CCRCKCRCCVGVCCCc',
    'CCRCCCRCCVGVCCCc',
    'CCRCKCRCCVGVCCCc',
    'CCRRRRRCCCVCCCCc',
    'CCCCCCCCCCCCCCCc',
    'CCCKKKCCCCKCCCCc',
    'CCKCCCKCCCCCCCCc',
    'CCKCKCKCKKKKKCCc',
    'CCKCCCKCCCCCCCCc',
    'CCCKKKKCKKKKKCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'OOOOOOOOOOOOOOOO',
    'WWWwWWWWWWwWWWWW',
    'wWWWWWWwWWWWWWwW',
  ],
  [
    'wWWWWWWwWWWWWWwW',
    'WWWWwWWWWWWwWWWW',
    'WwWWWWWWwWWWWWWw',
    'CCCCCCCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'CCCCCCCCKCKCKCCc',
    'CCCACCCCKCKCKCCc',
    'CCACACACKKKKKCCc',
    'CCCCCACCCKKKCCCc',
    'CCCCCCCCCCKCCCCc',
    'CCCCCCCCCCCCCCCc',
    'CCCGCGCCCKCKCCCc',
    'CCGKGKGCCCCCCCCc',
    'CCCGGGCCKKKKKCCc',
    'CCGKGKGCCCCCCCCc',
    'CCCGCGCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'OOOOOOOOOOOOOOOO',
    'WWWwWWWWWWwWWWWW',
    'wWWWWWWwWWWWWWwW',
  ],
  [
    'wWWWWWWwWWWWWWwW',
    'WWWWwWWWWWWwWWWW',
    'WwWWWWWWwWWWWWWw',
    'CCCCCCCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'CCKKKKCCRRRRRCCc',
    'CCKCCKCCRCKCRCCc',
    'CCKCKKCCRCCCRCCc',
    'CCKCCCCCRCKCRCCc',
    'CCKKKKKCRRRRRCCc',
    'CCCCCCCCCCCCCCCc',
    'CCCCVCCCCKKKCCCc',
    'CCCVGVCCKCCCKCCc',
    'CCCVGVCCKCKCKCCc',
    'CCCVGVCCKCCCKCCc',
    'CCCCVCCCCKKKKCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'OOOOOOOOOOOOOOOO',
    'WWWwWWWWWWwWWWWW',
    'wWWWWWWwWWWWWWwW',
  ],
  [
    'wWWWWWWwWWWWWWwW',
    'WWWWwWWWWWWwWWWW',
    'WwWWWWWWwWWWWWWw',
    'CCCCCCCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'CCCCKCCCCGCGCCCc',
    'CCCCCCCCGKGKGCCc',
    'CCKKKKKCCGGGCCCc',
    'CCCCCCCCGKGKGCCc',
    'CCKKKKKCCGCGCCCc',
    'CCCCCCCCCCCCCCCc',
    'CCCCCCCCKKKKCCCc',
    'CCCACCCCKCCKCCCc',
    'CCACACACKCKKCCCc',
    'CCCCCACCKCCCCCCc',
    'CCCCCCCCKKKKKCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'OOOOOOOOOOOOOOOO',
    'WWWwWWWWWWwWWWWW',
    'wWWWWWWwWWWWWWwW',
  ],
  [
    'wWWWWWWwWWWWWWwW',
    'WWWWwWWWWWWwWWWW',
    'WwWWWWWWwWWWWWWw',
    'CCCCCCCCCCCCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'CCKCKCKCCKKKCCCc',
    'CCKCKCKCKCCCKCCc',
    'CCKKKKKCKCKCKCCc',
    'CCCKKKCCKCCCKCCc',
    'CCCCKCCCCKKKKCCc',
    'CCCCCCCCCCCCCCCc',
    'CCCKCKCCCCVCCCCc',
    'CCCCCCCCCVGVCCCc',
    'CCKKKKKCCVGVCCCc',
    'CCCCCCCCCVGVCCCc',
    'CCCCCCCCCCVCCCCc',
    'RRRRRRRRRRRRRRRc',
    'CCCCCCCCCCCCCCCc',
    'OOOOOOOOOOOOOOOO',
    'WWWwWWWWWWwWWWWW',
    'wWWWWWWwWWWWWWwW',
  ],
]
const PINCEL: string[] = [
  'wWWWWWWwWWWWWW',
  'WWWWwWWWWWWOGW',
  'WwWWWWWWwWOGWW',
  'WWWWWwWWWOGWwW',
  'WWwWWWWWOGWWWW',
  'WWWWWWwOGWWWWw',
  'WWWwWWOGWWwWWW',
  'wWWWWOcwWWWWWW',
  'WWWWOcWWWWWwWW',
  'WwWOKWWWwWWWWW',
  'WWWWWwWWWWWWwW',
  'WWwWWWWWWwWWWW',
  'WWWOOOOOOOOWWw',
  'WWWORRRRRROWWW',
  'wWWOKKKKKKOWWW',
  'WWWOKKKKKKOwWW',
  'WwWOKKKKKKOWWW',
  'WWWOKKKKKKOWwW',
  'WWwOOOOOOOOWWW',
  'WWWWWWwWWWWWWw',
  'WWWwWWWWWWwWWW',
  'wWWWWWWwWWWWWW',
]
const CONCHA: string[] = [
  '.OOOOOO.',
  'OCCcCCcO',
  'OcCCcCCO',
  'OCcCCcCO',
  '.OOOOOO.',
]
// Pared del taller, copiada de arte/8bit/taller.json (paños de 32x20; paleta propia: la D difiere de PAL).
const PAL_TALLER: Record<string, string> = {"O":"#14120e","P":"#6f7562","p":"#566048","q":"#3e4636","Q":"#8f957c","m":"#2f3a28","D":"#1a1d16","T":"#b5602f","t":"#7a3a1a","C":"#efdcae","c":"#c9a66c","R":"#b8332a","M":"#5a3416","Y":"#ffd23a","F":"#e8553f","L":"#8a8060","l":"#6e6a4c","J":"#2f8a5a","G":"#e2a72e","V":"#3f8f3a","v":"#2c6a2c"}
const TALLER_NICHO: string[] = [
  'pppppppmpppppppmpppppppmpppppppm',
  'PPPPPVVmPVPPPqqmPPPPPqVVPPVPPqqm',
  'PPPPPQQQQQQQQQQQQQQQQQQQQQQPPqqm',
  'mmmmmQQQQQQQQQQQQQQQQQQQQQQmmmmm',
  'pppmppvDDDDDDDDDDDDDDDDvDDpmpppp',
  'PqqmPPDDDDDDDDDDDDDDDDDvDDqmPPPP',
  'PqqmPPDDDDDDDDDDDDDDDDDDDDqmPPPP',
  'mmmmmmDDDDDDDDDDDDDDDDDDDDmmmmmm',
  'ppppppDDDDttttDDDDDDDDDDDDpppppm',
  'PPPPPqDDDTTTTTTDDDDDDDDDDDPPPqqm',
  'PPPPPqDDDTTTTTTDDCCCRCCCDDPPPqqm',
  'mmmmmmDDTTTTTTTTDcccRcccDDmmmmmm',
  'pppmppDDTCRCRCRTDDCCCRCCCDpmpppp',
  'PqqmPPDDTTTTTTTTDDcccRcccDqmPPPP',
  'PqqmPPDDDTTTTTTDDCCCRCCCDDqmPPPP',
  'mmmmmmDDDttttttDDcccRcccDDmmmmmm',
  'ppppQQQQQQQQQQQQQQQQQQQQQQQQpppm',
  'PPPPQQQQQQQQQQQQQQQQQQQQQQQQPqqm',
  'PPPPOOOOOOOOOOOOOOOOOOOOOOOOPqqm',
  'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
]
const TALLER_ANTORCHA1: string[] = [
  'pppppppmpLLLLLLmLLLLLLLmpppppppm',
  'PPPPPqqmLLLLLllFLLLLLllmPPPPPqqm',
  'PPPPPqqmLLLLLllmFLLLLllmPPPPPqqm',
  'mmmmmmmmmmmmmmFFFFmmmmmmmmmmmmmm',
  'pppmpppLLLLmLLFYYFLmLLLLLppmpppp',
  'PqqmPPPLLllmLLFYYFlmLLLLLqqmPPPP',
  'PqqmPPPLLllmLFFYYFFmLLLLLqqmPPPP',
  'mmmmmmmmmmmmmttttttmmmmmmmmmmmmm',
  'pppppppmLLLLLttttttLLLLmpppppppm',
  'PPPPPqqmLLLLLlttttLLLllmPPPPPqqm',
  'PPPPPqqmPLLLLllMMLLLLllmPPPPPqqm',
  'mmmmmmmmmmmmmmmMMmmmmmmmmmmmmmmm',
  'pppmppppppLmLLLMMLLmLLpppppmpppp',
  'PqqmPPPPPqqmOOOOOOOOPPPPPqqmPPPP',
  'PqqmPPPPPqqmOOOOOOOOPPPPPqqmPPPP',
  'mmmmmmmmmmmmmmmMMmmmmmmmmmmmmmmm',
  'pppppppmpppppppMMppppppmpppppppm',
  'PPPPPqqmPPPPPqqmPPPPPqqmPPPPPqqm',
  'PPPPPqqmPPPPPqqmPPPPPqqmPPPPPqqm',
  'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
]
const TALLER_ANTORCHA2: string[] = [
  'pppppppmpLLLLLLmLLLLLLLmpppppppm',
  'PPPPPqqmLLLLLllmFLLLLllmPPPPPqqm',
  'PPPPPqqmLLLLLllFLLLLLllmPPPPPqqm',
  'mmmmmmmmmmmmmmmFYFmmmmmmmmmmmmmm',
  'pppmpppLLLLmLLFYYFFmLLLLLppmpppp',
  'PqqmPPPLLllmLLFYYFlmLLLLLqqmPPPP',
  'PqqmPPPLLllmLFYYYYFmLLLLLqqmPPPP',
  'mmmmmmmmmmmmmttttttmmmmmmmmmmmmm',
  'pppppppmLLLLLttttttLLLLmpppppppm',
  'PPPPPqqmLLLLLlttttLLLllmPPPPPqqm',
  'PPPPPqqmPLLLLllMMLLLLllmPPPPPqqm',
  'mmmmmmmmmmmmmmmMMmmmmmmmmmmmmmmm',
  'pppmppppppLmLLLMMLLmLLpppppmpppp',
  'PqqmPPPPPqqmOOOOOOOOPPPPPqqmPPPP',
  'PqqmPPPPPqqmOOOOOOOOPPPPPqqmPPPP',
  'mmmmmmmmmmmmmmmMMmmmmmmmmmmmmmmm',
  'pppppppmpppppppMMppppppmpppppppm',
  'PPPPPqqmPPPPPqqmPPPPPqqmPPPPPqqm',
  'PPPPPqqmPPPPPqqmPPPPPqqmPPPPPqqm',
  'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
]
const TALLER_TAPIZ: string[] = [
  'pppppppmpppppppmpppppppmpppppppm',
  'PPPPPGMMMMMMMMMMMMMMMMMMMMGPPqqm',
  'PPPPPqqmRRRRRRRRRRRRRRRRPPPPPqqm',
  'mmmmmmmmRRRRRRRRRRRRRRRRmmmmmmmm',
  'pppmppppRRRRRRRRRRRRRRRRpppmpppp',
  'PqqmPPPPGGGGGGGGGGGGGGGGPqqmPPPP',
  'PqqmPPPPGGGGGGGGGGGGGGGGPqqmPPPP',
  'mmmmmmmmGGGGGGGGGGGGGGGGmmmmmmmm',
  'pppppppmJJJJJJJJJJJJJJJJpppppppm',
  'PPPPPqqmCCJJCCJJCCJJCCJJPPPPPqqm',
  'PPPPPqqmJJCCJJCCJJCCJJCCPPPPPqqm',
  'mmmmmmmmGGGGGGGGGGGGGGGGmmmmmmmm',
  'pppmppppGGGGGGGGGGGGGGGGpppmpppp',
  'PqqmPPPPGGGGGGGGGGGGGGGGPqqmPPPP',
  'PqqmPPPPRRRRRRRRRRRRRRRRPqqmPPPP',
  'mmmmmmmmRRRRRRRRRRRRRRRRmmmmmmmm',
  'pppppppmRRRRRRRRRRRRRRRRpppppppm',
  'PPPPPqqmcPcPcqcmcPcPcqcmPPPPPqqm',
  'PPPPPqqmcPcPcqcmcPcPcqcmPPPPPqqm',
  'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
]

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

function escalaEntera(e: unknown): number {
  const n = Math.round(Number(e))
  if (!Number.isFinite(n)) return 2
  return Math.max(1, Math.min(4, n))
}

function anchoEntero(n: unknown): number {
  const v = Math.floor(Number(n))
  return Number.isFinite(v) && v >= 1 ? v : 1
}

function abrirSvg(w: number, h: number, cuerpo: string, alt: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${alt}">${cuerpo}</svg>`
}

// Dibuja una matriz de caracteres: un <path> por color, con tiras horizontales.
function px(grid: string[], pal: Record<string, string>, s: number, x0 = 0, y0 = 0): string {
  const porColor: Record<string, string[]> = {}
  grid.forEach((fila, y) => {
    let x = 0
    while (x < fila.length) {
      const ch = fila[x]
      let f = x + 1
      while (f < fila.length && fila[f] === ch) f++
      if (ch !== '.' && pal[ch]) {
        if (!porColor[pal[ch]]) porColor[pal[ch]] = []
        porColor[pal[ch]].push(`M${x0 + x * s} ${y0 + y * s}h${(f - x) * s}v${s}h${-(f - x) * s}z`)
      }
      x = f
    }
  })
  return Object.keys(porColor)
    .map((c) => `<path fill="${c}" d="${porColor[c].join('')}"/>`)
    .join('')
}

// Repite una matriz cada su ancho desde x=0, cortada a `unidades` de ancho.
function repetida(grid: string[], pal: Record<string, string>, s: number, unidades: number): string {
  const ancho = grid[0].length
  let c = ''
  for (let x0 = 0; x0 < unidades; x0 += ancho) {
    const resto = unidades - x0
    const g = resto >= ancho ? grid : grid.map((r) => r.slice(0, resto))
    c += px(g, pal, s, x0 * s, 0)
  }
  return c
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

// Templo: muro repetido y, si caben 44 unidades, la fachada centrada encima. Alto 36 x escala.
export function temploSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  let c = repetida(MURO, PAL, s, Math.ceil(w / s))
  const caben = Math.floor(w / s)
  if (caben >= 44) c += px(FACHADA, PAL, s, Math.floor((caben - 44) / 2) * s, 0)
  return abrirSvg(w, 36 * s, c, 'templo abandonado')
}

// Friso de piedra tallada, repetido cada 16 unidades. Alto 8 x escala.
export function frisoSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  return abrirSvg(w, 8 * s, repetida(FRISO, PAL, s, Math.ceil(w / s)), 'friso de piedra tallada')
}

// Códice desplegado: tapa izquierda, páginas rotando (cada 16 unidades), tapa derecha, mesa y, si caben
// 38 unidades, el pincel en las últimas 14. Sin 38 unidades: solo páginas cortadas. Alto 22 x escala.
export function codiceSvg(anchoPx: number, escala: number = 2): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const unidades = Math.ceil(w / s)
  let c = `<rect width="${w}" height="${22 * s}" fill="${PAL.W}"/>`
  if (Math.floor(w / s) >= 38) {
    c += px(CODICE_TAPA_IZQ, PAL_CODICE, s, 0, 0)
    const n = Math.max(1, Math.floor((unidades - 4 - 4 - 14) / 16))
    for (let k = 0; k < n; k++) c += px(CODICE_PAGINAS[k % CODICE_PAGINAS.length], PAL_CODICE, s, (4 + k * 16) * s, 0)
    const finPaginas = 4 + n * 16
    c += px(CODICE_TAPA_DER, PAL_CODICE, s, finPaginas * s, 0)
    const inicioMesa = finPaginas + 4
    for (let x0 = inicioMesa; x0 < unidades - 14; x0 += 7) {
      const resto = Math.min(7, unidades - 14 - x0)
      c += px(CODICE_MESA.map((r) => r.slice(0, resto)), PAL_CODICE, s, x0 * s, 0)
    }
    c += px(PINCEL, PAL_CODICE, s, (unidades - 14) * s, 0)
  } else {
    for (let x0 = 0, k = 0; x0 < unidades; x0 += 16, k++) {
      const resto = unidades - x0
      const g = CODICE_PAGINAS[k % CODICE_PAGINAS.length]
      c += px(resto >= 16 ? g : g.map((r) => r.slice(0, resto)), PAL_CODICE, s, x0 * s, 0)
    }
  }
  return abrirSvg(w, 22 * s, c, 'códice con pincel')
}

// Numeral maya vertical en base 20 (0..7999), 11 unidades de ancho. El nivel mayor va arriba.
// Un dígito: cero = concha; si no, fila de puntos (2x2) y debajo barras (11x2), separados por 1 unidad.
export function numeroMayaSvg(n: unknown, escala: number = 2, color?: string): string {
  const s = escalaEntera(escala)
  let v = Math.round(Number(n))
  if (!Number.isFinite(v) || v < 0) v = 0
  v = Math.min(7999, v)
  const col = typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#efdcae'
  const digitos: number[] = []
  if (v >= 400) digitos.push(Math.floor(v / 400))
  if (v >= 20) digitos.push(Math.floor(v / 20) % 20)
  digitos.push(v % 20)
  let y = 0
  let rects = ''
  let conchas = ''
  digitos.forEach((d, i) => {
    if (i > 0) y += 2
    if (d === 0) {
      conchas += px(CONCHA, PAL, s, 1 * s, y * s)
      y += 5
      return
    }
    const puntos = d % 5
    const barras = Math.floor(d / 5)
    if (puntos > 0) {
      // Puntos de 2x2 separados por 1 unidad, centrados en 11 unidades (4 puntos = 11).
      const total = puntos * 3 - 1
      const x0 = Math.floor((11 - total) / 2)
      for (let k = 0; k < puntos; k++) rects += `M${(x0 + k * 3) * s} ${y * s}h${2 * s}v${2 * s}h${-2 * s}z`
      y += 2
      if (barras > 0) y += 1
    }
    for (let b = 0; b < barras; b++) {
      if (b > 0) y += 1
      rects += `M0 ${y * s}h${11 * s}v${2 * s}h${-11 * s}z`
      y += 2
    }
  })
  const cuerpo = (rects ? `<path fill="${col}" d="${rects}"/>` : '') + conchas
  return abrirSvg(11 * s, y * s, cuerpo, `numeral maya ${v}`)
}

// Pared del taller: paños de 32 unidades (nicho, antorcha, tapiz, antorcha), cortados al ancho. Alto 20 x escala.
// Si no es quieto, cada antorcha lleva sus dos cuadros de llama alternando con visibility.
export function paredTallerSvg(anchoPx: number, escala: number = 2, opts?: { quieto?: boolean }): string {
  const s = escalaEntera(escala)
  const w = anchoEntero(anchoPx)
  const quieto = !!(opts && opts.quieto)
  const unidades = Math.ceil(w / s)
  let c = ''
  for (let x0 = 0, k = 0; x0 < unidades; x0 += 32, k++) {
    const resto = unidades - x0
    const corta = (g: string[]) => (resto >= 32 ? g : g.map((r) => r.slice(0, resto)))
    const dibujar = (g: string[]) => px(corta(g), PAL_TALLER, s, x0 * s, 0)
    const pos = k % 4
    if (pos === 0) c += dibujar(TALLER_NICHO)
    else if (pos === 2) c += dibujar(TALLER_TAPIZ)
    else if (quieto) c += dibujar(TALLER_ANTORCHA1)
    else {
      c += `<g>${dibujar(TALLER_ANTORCHA1)}<animate attributeName="visibility" values="visible;hidden" dur="0.8s" repeatCount="indefinite" calcMode="discrete"/></g>`
      c += `<g>${dibujar(TALLER_ANTORCHA2)}<animate attributeName="visibility" values="hidden;visible" dur="0.8s" repeatCount="indefinite" calcMode="discrete"/></g>`
    }
  }
  return abrirSvg(w, 20 * s, c, 'pared del taller del escriba')
}

// Calendario sagrado maya (tzolk'in) para la fecha UTC de ms, correlación GMT 584283.
export const TZOLKIN_NOMBRES: string[] = ['Imix', "Ik'", "Ak'b'al", "K'an", 'Chikchan', 'Kimi', "Manik'", 'Lamat', 'Muluk', 'Ok', 'Chuwen', "Eb'", "B'en", 'Ix', 'Men', "Kib'", "Kab'an", "Etz'nab'", 'Kawak', 'Ajaw']

export function tzolkin(ms: number): { numero: number; nombre: string; texto: string } {
  let t = Number(ms)
  if (!Number.isFinite(t)) t = 0
  const d = Math.floor(t / 86400000) + 2440588 - 584283
  const numero = (((d % 13) + 13 + 3) % 13) + 1
  const nombre = TZOLKIN_NOMBRES[((d % 20) + 20 + 19) % 20]
  return { numero, nombre, texto: `${numero} ${nombre}` }
}
