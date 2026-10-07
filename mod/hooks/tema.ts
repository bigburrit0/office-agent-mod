// Paleta del panel «oficina» en la skin «Piratas»: noche en el Caribe, con neón turquesa y magenta.
// Modulo puro, sin imports. Conserva el nombre CLARO (es el tema del escritorio) para que la rama
// se pueda mezclar con master sin tocar cada uso; los valores son los de la noche.

export const CLARO = {
  panel: '#120B1F', // fondo general: noche
  escena: '#1D1238', // detras del loro y del patio
  barra: '#1A1230', // barra de pestanas
  burbuja: '#2A2140',
  burbujaBorde: '#FF2E88', // magenta neon
  tarjeta: '#1D1238',
  tarjetaAlt: '#241845',
  tarjetaHover: '#2E2156',
  filas: ['#160F26', '#1D1238'] as const,
  filaHover: '#2A1F4A',
  texto: '#FFF6E0', // blanco hueso
  textoSuave: '#C3B4DA',
  borde: '#463868',
  acento: '#21E6C1', // turquesa neon
  chip: { fondo: '#21E6C1', letra: '#120B1F' }, // chip del modelo
}

// Todos los fondos sobre los que va texto.
export const FONDOS_CLARO: string[] = [
  CLARO.panel, CLARO.escena, CLARO.barra, CLARO.burbuja, CLARO.tarjeta,
  CLARO.tarjetaAlt, CLARO.tarjetaHover, CLARO.filas[0], CLARO.filas[1], CLARO.filaHover,
]

const HEX = /^#[0-9a-fA-F]{6}$/

const canales = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

// Luminancia relativa segun WCAG 2.
const luminancia = (hex: string): number => {
  const [r, g, b] = canales(hex).map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Razon de contraste WCAG 2 entre dos #rrggbb; con un color invalido devuelve 1.
export function contrasteHex(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 1
  const la = luminancia(a)
  const lb = luminancia(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Si el color no llega al minimo contra el fondo, lo corre de a 5 % hacia blanco (fondo oscuro)
// o hacia negro (fondo claro) hasta cumplir.
export function legibleSobre(color: string, fondo: string, minimo = 4.5): string {
  if (!HEX.test(color) || !HEX.test(fondo)) return CLARO.texto
  if (contrasteHex(color, fondo) >= minimo) return color
  const [r, g, b] = canales(color)
  const haciaBlanco = luminancia(fondo) < 0.18
  for (let paso = 1; paso <= 20; paso++) {
    const k = paso * 0.05
    const h = [r, g, b]
      .map(v => Math.round(haciaBlanco ? v + (255 - v) * k : v * (1 - k)).toString(16).padStart(2, '0'))
      .join('')
    if (contrasteHex('#' + h, fondo) >= minimo) return '#' + h.toLowerCase()
  }
  return haciaBlanco ? '#ffffff' : '#000000'
}

// Pastillas de estado sobre la noche: fondo oscuro teñido, letra clara del mismo tono.
export const PASTILLAS_CLARO: Record<'corre' | 'lista' | 'fallo' | 'frenada', { fondo: string; color: string }> = {
  corre: { fondo: '#0E3A4A', color: '#8FFFEA' },
  lista: { fondo: '#123D2A', color: '#8FF0B0' },
  fallo: { fondo: '#4A1024', color: '#FFB3C8' },
  frenada: { fondo: '#2A2440', color: '#D8CCE8' },
}

// Color del uso: verde < 50, ambar 50 a 79, rojo desde 80 (claros, para leerse sobre la noche).
export function colorUsoClaro(pct: number): string {
  if (pct >= 80) return '#FF6B7E'
  if (pct >= 50) return '#FFC23C'
  return '#5FE39A'
}
