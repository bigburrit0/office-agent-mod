// La skin «Terminal retro» en la terminal (sin dibujos): el monitor hecho con caracteres.
// Arriba el patito, el marco beige con el prompt y la hora, el robot en ASCII con su utilería,
// a su lado los agentes (o las carpetas de Equipos, o el archivo de Editar) con el color de su equipo,
// la barra de estado en video inverso y, abajo, la marca, el post-it y la luz.
// Módulo puro: devuelve líneas de tramos de texto con color; register.tsx las dibuja con <Text>.

import { robotAscii } from './arte-robot-terminal'

export type Tramo = { t: string; c?: string; bg?: string; b?: boolean }
export type Linea = Tramo[]

export const VERDE = '#5EF27F'
export const VERDE_MEDIO = '#2FB34F'
export const VERDE_TENUE = '#1F7D38'
export const BEIGE = '#D2C6A6'
export const AMBAR = '#FFB43A'
export const ROJO = '#FF4F4F'
const NEGRO = '#020803'

// Ícono de cada equipo en 3 caracteres (todos de ancho simple).
export const ICONO_TEXTO: Record<string, string> = {
  base: '[_]', direccion: '<+>', research: '(o)', librarian: '[≡]', datos: '▂▄▆', 'dev-a1': '</>', 'dev-tablero': '</>',
  seguridad: '[#]', mantenimiento: '{*}', limpieza: '/~~', facilities: 'o-┬', arquitectura: '/\\.',
}
const GIRO = ['|', '/', '-', '\\']

// Utilería al lado del robot, según la emoción.
const UTILERIA: Record<string, Tramo> = {
  aburrido: { t: 'c[_]~', c: VERDE_MEDIO }, manana: { t: 'c[_]~', c: VERDE_MEDIO }, mate: { t: '(U)/ ~', c: VERDE_MEDIO },
  hambre: { t: '=#=', c: VERDE_MEDIO }, dormido: { t: 'z Z Z', c: VERDE_TENUE }, siesta: { t: 'z z', c: VERDE_TENUE },
  tipea: { t: '♪ [o][o]', c: VERDE }, festeja: { t: '\\o/ * *', c: VERDE }, aplaude: { t: '* clap *', c: VERDE },
  panico: { t: 'PANIK!!', c: ROJO, b: true }, ruge: { t: 'ERR!', c: ROJO, b: true }, chispazo: { t: '* * *', c: AMBAR },
  estoEstaBien: { t: '~^~^~ c[_]', c: AMBAR }, stonks: { t: '↗ STONKS', c: VERDE, b: true }, notStonks: { t: '↘ NOT STONKS', c: ROJO },
  doge: { t: 'wow. muy bot.', c: VERDE }, harold: { t: '^^; (gota)', c: VERDE_MEDIO }, rickroll: { t: '♪ ♫ ♪', c: VERDE },
  masDe9000: { t: '9001!', c: AMBAR, b: true }, paloma: { t: '¿bug?', c: VERDE }, dosBotones: { t: '[G] o [C]?', c: AMBAR },
  zombi: { t: 'horas extra…', c: VERDE_TENUE }, concentrado: { t: '01101 ▓▒░', c: VERDE_MEDIO }, multitarea: { t: '✶ brain ✶', c: VERDE },
  arranque: { t: 'BOOT… OK', c: VERDE_MEDIO }, casa: { t: '→ chau', c: VERDE_MEDIO }, alivio: { t: 'KALM', c: VERDE },
  sorpresa: { t: '!?', c: VERDE }, otraVez: { t: 'otra vez…', c: VERDE_MEDIO }, distraido: { t: '<3 nuevo', c: VERDE },
  successKid: { t: '✊ ok', c: VERDE }, drake: { t: '✗ no / ✓ sí', c: VERDE }, orgullo: { t: '(■_■)', c: VERDE },
  riega: { t: '(cactus) ·.·', c: VERDE_MEDIO }, diario: { t: '$ man', c: VERDE_MEDIO }, silba: { t: '♪ fiu', c: VERDE_MEDIO },
  rollSafe: { t: '(dedo en la sien)', c: VERDE_MEDIO }, frustrado: { t: 'T_T', c: VERDE_MEDIO }, molesto: { t: '>:(', c: VERDE_MEDIO },
}

export type ContenidoTerminal = {
  emocion: string
  progreso: number | null
  /** Ancho en columnas (se acota a 36..76). */
  ancho: number
  hora: string
  prompt: string
  estado: string
  apagado?: boolean
  /** Subagentes: equipo, color, etiqueta (tarjeta), fase y texto corto. */
  agentes?: Array<{ equipo: string; color: string; etiqueta: string; fase: string; texto?: string }>
  /** Equipos: una carpeta por equipo. */
  carpetas?: Array<{ nombre: string; color: string; cantidad?: number; aviso?: boolean }>
  /** Editar: el archivo en el editor. */
  lineas?: string[]
  /** Instante (ms): elige el cuadro del giro de los agentes. */
  ahora?: number
}

const largoDe = (l: Linea): number => l.reduce((n, s) => n + [...s.t].length, 0)
const recortar = (s: string, n: number): string => ([...s].length > n ? [...s].slice(0, Math.max(0, n - 1)).join('') + '…' : s)

function relleno(l: Linea, ancho: number): Linea {
  const falta = ancho - largoDe(l)
  return falta > 0 ? [...l, { t: ' '.repeat(falta) }] : l
}

// Lo que va a la derecha del robot, línea por línea.
function columnaDerecha(o: ContenidoTerminal, ancho: number, filas: number): Linea[] {
  const out: Linea[] = []
  if (o.apagado) return [[{ t: 'zzz… fuera de hora', c: VERDE_TENUE }]]
  if (o.lineas && o.lineas.length > 0) {
    o.lineas.slice(0, filas).forEach((l, i) => {
      const c = l.startsWith('#') ? '#C8FFD4' : l.startsWith('-') ? VERDE_TENUE : l.includes(':') ? VERDE : VERDE_MEDIO
      out.push([{ t: `${String(i + 1).padStart(2, ' ')} `, c: VERDE_TENUE }, { t: recortar(l, ancho - 3), c }])
    })
    return out
  }
  if (o.carpetas && o.carpetas.length > 0) {
    const lista = o.carpetas.slice(0, filas)
    for (const c of lista) {
      const linea: Linea = [{ t: '▰ ', c: c.color }, { t: recortar(`${c.nombre}/`, ancho - 8), c: c.color, b: true }]
      if (c.cantidad !== undefined) linea.push({ t: ` ${c.cantidad}`, c: VERDE_MEDIO })
      if (c.aviso) linea.push({ t: ' ⚠', c: AMBAR })
      out.push(linea)
    }
    if (o.carpetas.length > filas) out[filas - 1] = [{ t: `… y ${o.carpetas.length - filas + 1} más`, c: VERDE_MEDIO }]
    return out
  }
  const agentes = o.agentes ?? []
  if (agentes.length === 0) {
    const pct = o.progreso
    const largo = Math.max(4, Math.min(12, ancho - 12))
    const lleno = pct === null ? 0 : Math.round((pct / 100) * largo)
    return [
      [{ t: 'SIN PROCESOS.', c: VERDE_MEDIO }],
      [{ t: 'ESPERANDO...', c: VERDE_TENUE }],
      [],
      [
        { t: 'PROY ', c: VERDE_MEDIO },
        { t: '|'.repeat(lleno), c: VERDE },
        { t: '.'.repeat(largo - lleno), c: VERDE_TENUE },
        { t: pct === null ? ' --%' : ` ${pct}%`, c: VERDE },
      ],
    ]
  }
  const giro = GIRO[Math.floor((o.ahora ?? 0) / 2000) % GIRO.length]
  agentes.slice(0, filas).forEach((a, i) => {
    const icono = ICONO_TEXTO[a.equipo] ?? ICONO_TEXTO.base
    const estado: Tramo =
      a.fase === 'explota' ? { t: '[SEGV]', c: ROJO, b: true } : a.fase === 'sale' ? { t: '[OK]', c: '#C8FFD4', b: true } : { t: `[${giro}]`, c: VERDE_MEDIO }
    const base: Linea = [{ t: `${icono} `, c: a.color, b: true }, { t: recortar(a.etiqueta || 'agente', 7).padEnd(7, ' '), c: VERDE }, { t: ' ' }, estado]
    const resto = ancho - largoDe(base) - 1
    if (a.texto && resto > 3) base.push({ t: ` ${recortar(a.texto, resto)}`, c: VERDE_TENUE })
    if (i === filas - 1 && agentes.length > filas) out.push([{ t: `… y ${agentes.length - filas + 1} agentes más`, c: VERDE_MEDIO }])
    else out.push(base)
  })
  return out
}

/** El monitor en texto: líneas de tramos con color, de ancho fijo. */
export function pantallaTerminal(o: ContenidoTerminal): Linea[] {
  const ancho = Math.max(36, Math.min(76, Math.floor(Number(o.ancho) || 60)))
  const adentro = ancho - 4 // «│ » + contenido + « │»
  const lineas: Linea[] = []
  const borde = (t: string): Tramo => ({ t, c: BEIGE })
  // El patito arriba del monitor.
  lineas.push([{ t: ' '.repeat(Math.max(0, ancho - 8)) }, { t: '__(o>', c: '#FFD84A' }])
  lineas.push([borde(`┌${'─'.repeat(ancho - 2)}┐`)])
  const fila = (contenido: Linea, bg?: string): Linea => {
    const c = relleno(contenido, adentro).map(s => (bg ? { ...s, bg } : s))
    return [borde('│ '), ...c, borde(' │')]
  }
  // Prompt con cursor y hora.
  const hora = o.apagado ? '' : o.hora
  const prompt = recortar(o.prompt, adentro - [...hora].length - 3)
  const cab: Linea = o.apagado
    ? [{ t: '', c: VERDE_TENUE }]
    : [{ t: prompt, c: VERDE }, { t: '█', c: VERDE }]
  lineas.push(fila([...cab, { t: ' '.repeat(Math.max(1, adentro - largoDe(cab) - [...hora].length)) }, { t: hora, c: VERDE_MEDIO }]))
  // Robot a la izquierda (más su utilería) y la columna de la derecha.
  const robot = robotAscii(o.emocion, o.progreso)
  const colorRobot = o.apagado ? VERDE_TENUE : VERDE
  const util = UTILERIA[o.emocion]
  const izquierda: Linea[] = robot.map(l => [{ t: l, c: colorRobot }])
  izquierda.push(util ? [{ ...util, t: ` ${util.t}` }] : [])
  const anchoIzq = 14
  const derecha = columnaDerecha(o, adentro - anchoIzq - 1, izquierda.length)
  for (let i = 0; i < izquierda.length; i++) {
    const iz = izquierda[i].map(s => ({ ...s, t: recortar(s.t, anchoIzq) }))
    lineas.push(fila([...relleno(iz, anchoIzq), { t: ' ' }, ...(derecha[i] ?? [])]))
  }
  // Barra de estado en video inverso (como tmux).
  if (!o.apagado) lineas.push(fila([{ t: recortar(o.estado, adentro), c: NEGRO }], VERDE_TENUE))
  else lineas.push(fila([{ t: 'FIN DEL TURNO', c: VERDE_TENUE }]))
  lineas.push([borde(`└${'─'.repeat(ancho - 2)}┘`)])
  // Marca, post-it y luz.
  const luz: Tramo = { t: '●', c: o.apagado ? AMBAR : VERDE }
  const marca: Linea = [{ t: ' TERMINAL 9000 ', c: '#D8D2C0', bg: '#2C2A26', b: true }, { t: '  ' }, { t: ' CLAVE: 1234 ', c: '#35408A', bg: '#F6E05E' }]
  lineas.push([...relleno(marca, ancho - 2), luz])
  return lineas
}

/** Texto plano de una línea (para pruebas y lectores de pantalla). */
export const textoDe = (l: Linea): string => l.map(s => s.t).join('')
