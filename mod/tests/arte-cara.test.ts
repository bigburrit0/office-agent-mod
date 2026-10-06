import { expect, test } from 'claude-code/testing'

import { EMOCIONES, EMOCION_ALT, caraJaguarSvg } from '../hooks/arte-cara'

const esSeguro = (s: string) =>
  s.startsWith('<svg') && s.endsWith('</svg>') && s.length < 120000 && !/<script|on\w+=|href=/i.test(s)

test('las 9 emociones dan un SVG seguro, con animación y con texto alternativo', () => {
  expect(EMOCIONES.length).toBe(9)
  for (const e of EMOCIONES) {
    const s = caraJaguarSvg(e, 3)
    expect(esSeguro(s)).toBe(true)
    expect(s.includes('<animate')).toBe(true)
    expect(s.includes('width="102" height="78" viewBox="0 0 102 78"')).toBe(true)
    expect(typeof EMOCION_ALT[e]).toBe('string')
  }
})

test('quieto no trae animaciones ni efectos', () => {
  for (const e of EMOCIONES) {
    const q = caraJaguarSvg(e, 3, { quieto: true })
    expect(esSeguro(q)).toBe(true)
    expect(/<animate|<set/.test(q)).toBe(false)
  }
})

test('dormirEn agrega el cambio a dormido, y 0 o menos devuelve la cara dormida', () => {
  const d = caraJaguarSvg('aburrido', 3, { dormirEn: 30 })
  expect(d.includes('<set')).toBe(true)
  expect(d.includes('begin="30s"')).toBe(true)
  expect(caraJaguarSvg('aburrido', 3, { dormirEn: 0 })).toBe(caraJaguarSvg('dormido', 3))
  expect(caraJaguarSvg('contento', 3, { dormirEn: 30 })).toBe(caraJaguarSvg('contento', 3))
})

test('una emoción desconocida se ve como aburrido', () => {
  expect(caraJaguarSvg('xyz', 3)).toBe(caraJaguarSvg('aburrido', 3))
})

test('la escala se acota entre 1 y 8 y, si no es un número, vale 3', () => {
  expect(caraJaguarSvg('aburrido', 100)).toBe(caraJaguarSvg('aburrido', 8))
  expect(caraJaguarSvg('aburrido', 0)).toBe(caraJaguarSvg('aburrido', 1))
  expect(caraJaguarSvg('aburrido', Number.NaN)).toBe(caraJaguarSvg('aburrido', 3))
})

test('con marco el lienzo es de 42 x 34 y la cara se corre 4 unidades', () => {
  const s = caraJaguarSvg('pensando', 3, { marco: true })
  expect(s.includes('width="126"')).toBe(true)
  expect(s.includes('height="102"')).toBe(true)
  expect(s.includes('translate(12 12)')).toBe(true)
  expect(s.includes('#e2a72e')).toBe(true)
  expect(caraJaguarSvg('pensando', 3).includes('width="102"')).toBe(true)
})

test('el marco convive con quieto y con dormirEn', () => {
  expect(caraJaguarSvg('ruge', 3, { marco: true, quieto: true }).includes('<animate')).toBe(false)
  expect(caraJaguarSvg('aburrido', 3, { marco: true, dormirEn: 20 }).includes('begin="20s"')).toBe(true)
})
