import { expect, test } from 'claude-code/testing'

import { PATIO_ALTO, PATIO_ANCHO, celdaMasSvg, celdaPatioSvg, doselPatioSvg, pisoPatioSvg } from '../hooks/arte-patio'

const matriz = Array.from({ length: 16 }, (_, y) => (y === 0 || y === 15 ? '.OOOOOOOOOOOOOO.' : 'OASSSSSSSSSSSSaO'))
const paleta = { O: '#1c120a', A: '#3fae6a', a: '#23703f', S: '#efdcae' }
const FASES = ['entra', 'juega', 'sale', 'explota']

test('las 4 fases dan un SVG seguro y animado', () => {
  for (const fase of FASES) {
    const s = celdaPatioSvg({ fase, matriz, paleta, semilla: 3 })
    expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(s.length < 120000).toBe(true)
    expect(/<script|href=|on\w+=/i.test(s)).toBe(false)
    expect(s.includes('<animate')).toBe(true)
  }
})

test('la etiqueta se recorta a 6 caracteres y se escapa', () => {
  const s = celdaPatioSvg({ fase: 'juega', matriz, paleta, etiqueta: 'T-81<b>&"' })
  expect(s.includes('<b>')).toBe(false)
  expect(s.includes('&lt;')).toBe(true)
  expect(s.includes('T-81&lt;b')).toBe(true)
  expect(s.includes('&amp;')).toBe(false)
})

test('quieto no trae ninguna animación', () => {
  for (const fase of FASES) {
    const s = celdaPatioSvg({ fase, matriz, paleta, quieto: true })
    expect(/<animate|<set/.test(s)).toBe(false)
  }
})

test('la entrada no escala desde 0 y usa la curva rápida', () => {
  const s = celdaPatioSvg({ fase: 'entra', matriz, paleta })
  expect(s.includes('values="0.85;1"')).toBe(true)
  expect(s.includes('0.23 1 0.32 1')).toBe(true)
  expect(/scale\(0\)|type="scale"[^>]*values="0;/.test(s)).toBe(false)
})

test('el piso es estático y respeta el ancho pedido', () => {
  const p = pisoPatioSvg(100, 2)
  expect(p.includes('width="100"')).toBe(true)
  expect(p.includes('height="54"')).toBe(true)
  expect(p.includes('<animate')).toBe(false)
  expect(PATIO_ANCHO).toBe(22)
  expect(PATIO_ALTO).toBe(27)
})

test('el titulo se escapa y sin titulo no hay <title>', () => {
  const s = celdaPatioSvg({ fase: 'juega', matriz, paleta, titulo: 'T-81 <cara> & "x"' })
  expect(s.includes('<title>T-81 &lt;cara&gt; &amp; &quot;x&quot;</title>')).toBe(true)
  expect(celdaPatioSvg({ fase: 'juega', matriz, paleta }).includes('<title>')).toBe(false)
})

test('la selva lejana esta en la celda y en el piso', () => {
  expect(celdaPatioSvg({ fase: 'juega', matriz, paleta }).includes('#0a3418')).toBe(true)
  expect(pisoPatioSvg(100, 2).includes('#0a3418')).toBe(true)
})

test('el dosel es estatico y mide exactamente el ancho pedido', () => {
  const d = doselPatioSvg(100, 2)
  expect(d.includes('width="100"')).toBe(true)
  expect(d.includes('height="18"')).toBe(true)
  expect(d.includes('<animate')).toBe(false)
  expect(doselPatioSvg(100, 2, { fondo: '#0e4a22' }).includes('#0e4a22')).toBe(true)
})

test('la celda +N mide como las del patio, escapa el texto y es estatica', () => {
  const c = celdaMasSvg(7, 2, { fondo: '#0e4a22' })
  expect(c.includes('width="44"') && c.includes('height="54"')).toBe(true)
  expect(c.includes('+7') && c.includes('#0e4a22') && c.includes('#0a3418')).toBe(true)
  expect(c.includes('<animate')).toBe(false)
  expect(celdaMasSvg('<b>' as unknown as number, 2).includes('<b>')).toBe(false)
})
