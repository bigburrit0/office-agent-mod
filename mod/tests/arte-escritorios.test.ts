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

const matriz = Array.from({ length: 16 }, (_, y) => (y === 0 || y === 15 ? '.OOOOOOOOOOOOOO.' : 'OASSSSSSSSSSSSaO'))
const paleta = { O: '#1c120a', A: '#3fae6a', a: '#23703f', S: '#efdcae' }
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
    const s = celdaPatioSvg({ fase, matriz, paleta, semilla: 3 })
    expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(s.length < 120000).toBe(true)
    expect(/<script|href=|on\w+=/i.test(s)).toBe(false)
    expect(s.includes('<animate')).toBe(true)
    todos.push(s)
  }
  expect(new Set(todos).size).toBe(4)
})

test('una fase desconocida da lo mismo que juega', () => {
  const a = celdaPatioSvg({ fase: 'xyz', matriz, paleta, semilla: 5 })
  expect(a).toBe(celdaPatioSvg({ fase: 'juega', matriz, paleta, semilla: 5 }))
})

test('con quieto no hay animaciones, y las fases siguen siendo distintas', () => {
  const todos: string[] = []
  for (const fase of FASES) {
    const s = celdaPatioSvg({ fase, matriz, paleta, quieto: true })
    expect(/<animate|<set/.test(s)).toBe(false)
    todos.push(s)
  }
  expect(new Set(todos).size >= 3).toBe(true)
})

test('la etiqueta se recorta a 6 caracteres y se escapa', () => {
  const s = celdaPatioSvg({ fase: 'juega', matriz, paleta, etiqueta: 'T-81<b>&"' })
  expect(s.includes('<b>')).toBe(false)
  expect(s.includes('T-81&lt;b')).toBe(true)
  expect(s.includes('&amp;')).toBe(false)
})

test('el titulo se escapa y sin titulo no hay <title>', () => {
  const s = celdaPatioSvg({ fase: 'juega', matriz, paleta, titulo: 'T-81 <cara> & "x"' })
  expect(s.includes('<title>T-81 &lt;cara&gt; &amp; &quot;x&quot;</title>')).toBe(true)
  expect(celdaPatioSvg({ fase: 'juega', matriz, paleta }).includes('<title>')).toBe(false)
})

test('la semilla cambia pelo, camisa y objeto', () => {
  const a = celdaPatioSvg({ fase: 'juega', matriz, paleta, semilla: 0 })
  expect(a).not.toBe(celdaPatioSvg({ fase: 'juega', matriz, paleta, semilla: 1 }))
  expect(a).not.toBe(celdaPatioSvg({ fase: 'juega', matriz, paleta, semilla: 4 }))
  expect(a).not.toBe(celdaPatioSvg({ fase: 'juega', matriz, paleta, semilla: 3 }))
})

test('la celda mide 22x27 por la escala y el ícono se dibuja con su paleta', () => {
  const s = celdaPatioSvg({ fase: 'juega', matriz, paleta, escala: 2, quieto: true })
  expect(s.includes('width="44"') && s.includes('height="54"')).toBe(true)
  expect(s.includes('#3fae6a')).toBe(true)
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
