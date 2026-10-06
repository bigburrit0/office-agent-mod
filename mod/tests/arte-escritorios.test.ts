import { expect, test } from 'claude-code/testing'

import {
  PATIO_ALTO,
  PATIO_ANCHO,
  PATIO_ENTRA_MS,
  PATIO_EXPLOTA_MS,
  PATIO_SALE_MS,
  celdaMasSvg,
  celdaPatioSvg,
  doselPatioSvg,
  pisoPatioSvg,
} from '../hooks/arte-escritorios'

// Colores del equipo y una actividad de dos cuadros, escritos a mano (sin importar otros módulos de arte).
const acento: [string, string] = ['#3fae6a', '#23703f']
const actividad = {
  cuadros: ['<rect x="8" y="30" width="4" height="4" fill="#abcdef"/>', '<rect x="10" y="30" width="4" height="4" fill="#abcdef"/>'],
  tiempos: [0.5, 0.5],
  sinBrazos: '<rect x="9" y="31" width="2" height="2" fill="#fedcba"/>',
  libre: true,
}
const FASES = ['entra', 'juega', 'sale', 'explota']

test('las medidas y tiempos valen lo mismo que en el patio (números fijos)', () => {
  expect(PATIO_ANCHO).toBe(22)
  expect(PATIO_ALTO).toBe(27)
  expect(PATIO_ENTRA_MS).toBe(400)
  expect(PATIO_SALE_MS).toBe(1300)
  expect(PATIO_EXPLOTA_MS).toBe(2400)
})

test('las 4 fases dan SVG distintos, seguros y animados', () => {
  const todos: string[] = []
  for (const fase of FASES) {
    const s = celdaPatioSvg({ fase, acento, semilla: 3 })
    expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(s.length < 120000).toBe(true)
    expect(/<script|href=|on\w+=/i.test(s)).toBe(false)
    expect(s.includes('<animate')).toBe(true)
    todos.push(s)
  }
  expect(new Set(todos).size).toBe(4)
})

test('una fase desconocida da lo mismo que juega', () => {
  const a = celdaPatioSvg({ fase: 'xyz', acento, semilla: 5 })
  expect(a).toBe(celdaPatioSvg({ fase: 'juega', acento, semilla: 5 }))
})

test('con quieto no hay animaciones, y las fases siguen siendo distintas', () => {
  const todos: string[] = []
  for (const fase of FASES) {
    const s = celdaPatioSvg({ fase, acento, quieto: true })
    expect(/<animate|<set/.test(s)).toBe(false)
    todos.push(s)
  }
  expect(new Set(todos).size >= 3).toBe(true)
})

test('la etiqueta se recorta a 6 caracteres y se escapa', () => {
  const s = celdaPatioSvg({ fase: 'juega', acento, etiqueta: 'T-81<b>&"' })
  expect(s.includes('<b>')).toBe(false)
  expect(s.includes('T-81&lt;b')).toBe(true)
  expect(s.includes('&amp;')).toBe(false)
})

test('el titulo se escapa y sin titulo no hay <title>', () => {
  const s = celdaPatioSvg({ fase: 'juega', acento, titulo: 'T-81 <cara> & "x"' })
  expect(s.includes('<title>T-81 &lt;cara&gt; &amp; &quot;x&quot;</title>')).toBe(true)
  expect(celdaPatioSvg({ fase: 'juega', acento }).includes('<title>')).toBe(false)
})

test('sin acento, la semilla cambia pelo, camisa y objeto', () => {
  const a = celdaPatioSvg({ fase: 'juega', semilla: 0 })
  expect(a).not.toBe(celdaPatioSvg({ fase: 'juega', semilla: 1 }))
  expect(a).not.toBe(celdaPatioSvg({ fase: 'juega', semilla: 4 }))
  expect(a).not.toBe(celdaPatioSvg({ fase: 'juega', semilla: 3 }))
})

test('con acento, dos agentes del mismo equipo no son clones: la semilla cambia el pelo', () => {
  const a = celdaPatioSvg({ fase: 'juega', acento, actividad, semilla: 0, quieto: true })
  expect(a).not.toBe(celdaPatioSvg({ fase: 'juega', acento, actividad, semilla: 1, quieto: true }))
})

test('la celda mide 22x27 por la escala y el equipo se ve por color (camisa, silla y franja)', () => {
  const s = celdaPatioSvg({ fase: 'juega', acento, escala: 2, quieto: true })
  expect(s.includes('width="44"') && s.includes('height="54"')).toBe(true)
  // Franja de 20 × 1 unidades en el borde del escritorio (fila 19), con el color del equipo.
  expect(s.includes('<rect x="2" y="38" width="40" height="2" fill="#3fae6a"/>')).toBe(true)
  // Respaldo de la silla con el tono oscuro.
  expect(s.includes('<rect x="10" y="4" width="24" height="14" fill="#23703f"/>')).toBe(true)
  // Sin acento no hay franja y la camisa sale de la semilla.
  expect(celdaPatioSvg({ fase: 'juega', escala: 2, quieto: true }).includes('#3fae6a')).toBe(false)
})

test('sin logo: la celda ya no recibe ni dibuja una matriz de ícono', () => {
  const con = celdaPatioSvg({ fase: 'juega', acento, quieto: true, matriz: ['OOOO'], paleta: { O: '#123456' } } as never)
  expect(con.includes('#123456')).toBe(false)
  expect(con).toBe(celdaPatioSvg({ fase: 'juega', acento, quieto: true }))
})

test('con actividad, juega y entra la animan cuadro a cuadro; quieto deja el primer cuadro', () => {
  const j = celdaPatioSvg({ fase: 'juega', acento, actividad, semilla: 0 })
  expect(j.includes('x="8" y="30"') && j.includes('x="10" y="30"')).toBe(true)
  expect(j.includes('dur="1s"')).toBe(true)
  const e = celdaPatioSvg({ fase: 'entra', acento, actividad, semilla: 0 })
  expect(e.includes('x="8" y="30"') && e.includes('x="10" y="30"')).toBe(true)
  const q = celdaPatioSvg({ fase: 'juega', acento, actividad, quieto: true })
  expect(q.includes('x="8" y="30"')).toBe(true)
  expect(q.includes('x="10" y="30"')).toBe(false)
  expect(/<animate|<set/.test(q)).toBe(false)
})

test('con actividad, sale y explota usan los objetos sin brazos y no dibujan el monitor', () => {
  for (const fase of ['sale', 'explota']) {
    const s = celdaPatioSvg({ fase, acento, actividad, semilla: 0 })
    expect(s.includes('fill="#fedcba"')).toBe(true)
    expect(s.includes('x="8" y="30"')).toBe(false)
    expect(s.includes('#c9c3b0')).toBe(false) // carcasa del CRT
  }
})

test('el decorado (taza, planta o papeles) solo va si la actividad deja libre el rincón', () => {
  const taza = '<rect x="38" y="30" width="6" height="2" fill="#5a3416"/>'
  expect(celdaPatioSvg({ fase: 'juega', acento, actividad, semilla: 0, quieto: true }).includes(taza)).toBe(true)
  expect(celdaPatioSvg({ fase: 'juega', acento, actividad: { ...actividad, libre: false }, semilla: 0, quieto: true }).includes(taza)).toBe(false)
})

test('el piso es estático y respeta el ancho pedido', () => {
  const p = pisoPatioSvg(100, 2)
  expect(p.includes('width="100"')).toBe(true)
  expect(p.includes('height="54"')).toBe(true)
  expect(p.includes('<animate')).toBe(false)
})

test('el cielorraso respeta el ancho, titila y con quieto no se anima', () => {
  const d = doselPatioSvg(100, 2)
  expect(d.includes('width="100"') && d.includes('height="18"')).toBe(true)
  expect(d.includes('<animate')).toBe(true)
  expect(doselPatioSvg(100, 2, { quieto: true }).includes('<animate')).toBe(false)
  expect(doselPatioSvg(100, 2, { fondo: '#0e4a22' }).includes('#0e4a22')).toBe(true)
})

test('la celda +N mide como las demás, escapa el texto y es estática', () => {
  const c = celdaMasSvg(7, 2, { fondo: '#0e4a22' })
  expect(c.includes('width="44"') && c.includes('height="54"')).toBe(true)
  expect(c.includes('+7') && c.includes('#0e4a22')).toBe(true)
  expect(c.includes('<animate')).toBe(false)
  expect(celdaMasSvg('<b>' as unknown as number, 2).includes('<b>')).toBe(false)
  expect(c.length < 120000).toBe(true)
})
