// Paleta del panel «oficina» en la skin «Terminal retro»: pantalla negra y fosforo verde.
// Modulo puro, sin imports. Conserva el nombre CLARO (es el tema del escritorio) para que la rama
// se pueda mezclar con master sin tocar cada uso; los valores son los de la terminal.

export const CLARO = {
  panel: '#020803', // fondo general: la pantalla apagada
  escena: '#020803', // detras del monitor
  barra: '#061A0C', // barra de pestanas
  burbuja: '#000201', // la linea de la terminal donde habla el robot
  burbujaBorde: '#2FB34F',
  tarjeta: '#06160B',
  tarjetaAlt: '#0A1F10',
  tarjetaHover: '#0F2C17',
  filas: ['#030B05', '#071509'] as const,
  filaHover: '#0F2C17',
  texto: '#B9F5C4', // fosforo claro
  textoSuave: '#6FB882',
  borde: '#1F7D38',
  acento: '#FFB43A', // ambar: avisos
  chip: { fondo: '#5EF27F', letra: '#020803' }, // chip del modelo: video inverso
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

// Pastillas de estado sobre la pantalla: fondo oscuro tenido, letra clara del mismo tono.
export const PASTILLAS_CLARO: Record<'corre' | 'lista' | 'fallo' | 'frenada', { fondo: string; color: string }> = {
  corre: { fondo: '#0C3418', color: '#8FFFA8' },
  lista: { fondo: '#123D2A', color: '#C8FFD4' },
  fallo: { fondo: '#4A1012', color: '#FFB3B3' },
  frenada: { fondo: '#2A2A1A', color: '#FFD98A' },
}

// Color del uso: verde < 50, ambar 50 a 79, rojo desde 80 (claros, para leerse sobre la pantalla).
export function colorUsoClaro(pct: number): string {
  if (pct >= 80) return '#FF6B6B'
  if (pct >= 50) return '#FFB43A'
  return '#5EF27F'
}
