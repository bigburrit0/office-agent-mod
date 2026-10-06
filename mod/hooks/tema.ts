// Paleta del tema claro del panel «oficina». Modulo puro, sin imports.
// El panel usa siempre tema claro; aca viven los colores y los chequeos de contraste.

export const CLARO = {
  panel: '#FBF6EA', // fondo general
  escena: '#D9E7F2', // celeste palido detras del robot y del patio
  barra: '#EFE6D2', // barra de pestanas
  burbuja: '#FFF4DF',
  burbujaBorde: '#F28C28',
  tarjeta: '#F6EEDC',
  tarjetaAlt: '#EFE5CF',
  tarjetaHover: '#E8DCC0',
  filas: ['#FFFDF7', '#F6EEDC'] as const,
  filaHover: '#EADFC6',
  texto: '#2B2118',
  textoSuave: '#6B5B45',
  borde: '#C2AE86',
  acento: '#A04E0C',
  chip: { fondo: '#2B2118', letra: '#FFF4DF' }, // chip del modelo
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

// Si el color no llega al minimo contra el fondo, lo oscurece de a 5 % hasta cumplir.
export function legibleSobre(color: string, fondo: string, minimo = 4.5): string {
  if (!HEX.test(color) || !HEX.test(fondo)) return CLARO.texto
  if (contrasteHex(color, fondo) >= minimo) return color
  const [r, g, b] = canales(color)
  for (let paso = 1; paso <= 20; paso++) {
    const k = 1 - paso * 0.05
    const h = [r, g, b].map(v => Math.round(v * k).toString(16).padStart(2, '0')).join('')
    if (contrasteHex('#' + h, fondo) >= minimo) return '#' + h.toLowerCase()
  }
  return '#000000'
}

// Pastillas de estado claras, letra oscura del mismo tono.
export const PASTILLAS_CLARO: Record<'corre' | 'lista' | 'fallo' | 'frenada', { fondo: string; color: string }> = {
  corre: { fondo: '#D6E6F7', color: '#0B3A6B' },
  lista: { fondo: '#D5EDDA', color: '#14532D' },
  fallo: { fondo: '#F8D7D3', color: '#8B1A10' },
  frenada: { fondo: '#E3E0D8', color: '#3F3A33' },
}

// Color del uso: verde < 50, naranja 50 a 79, rojo desde 80.
export function colorUsoClaro(pct: number): string {
  if (pct >= 80) return '#A81D12'
  if (pct >= 50) return '#9A4A00'
  return '#1B6B32'
}
