import { expect, test } from 'claude-code/testing'

import { PATIO_ALTO, PATIO_ANCHO, celdaMasSvg, celdaPatioSvg, doselPatioSvg, pisoPatioSvg } from '../hooks/arte-mar'

const esSeguro = (s: string) =>
  s.startsWith('<svg') && s.endsWith('</svg>') && s.length < 120000 && !/<script|on\w+=|href=/i.test(s) &&
  !s.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '').includes('http')

const EQUIPOS: Array<[string, [string, string], string]> = [
  ['dev-a1', ['#f08a24', '#9c4f0c'], '#21e6c1'], // laptop con pantalla turquesa
  ['research', ['#5aa9e6', '#2f6ea3'], '#b8771a'], // catalejo de bronce
  ['datos', ['#2cc6d0', '#16777d'], '#f0e2c0'], // mapa de pergamino
  ['facilities', ['#e070a8', '#93355f'], '#f2b632'], // llavero de oro
]

test('cada fase da un SVG seguro de 66 x 54 a escala 3, transparente', () => {
  expect([PATIO_ANCHO, PATIO_ALTO]).toEqual([22, 18])
  for (const fase of ['entra', 'juega', 'sale', 'explota', 'otra']) {
    for (const quieto of [false, true]) {
      const s = celdaPatioSvg({ fase, acento: ['#f08a24', '#9c4f0c'], escala: 3, quieto, etiqueta: 'T-60', fondo: '#123456' })
      expect(esSeguro(s)).toBe(true)
      expect(s.includes('width="66" height="54"')).toBe(true)
      expect(s.includes('#123456')).toBe(false)
    }
  }
})

test('el pez lleva el color de su equipo y el objeto que le toca', () => {
  for (const [, acento, colorObjeto] of EQUIPOS) {
    const s = celdaPatioSvg({ fase: 'juega', acento, escala: 3, quieto: true })
    expect(s.includes(acento[0])).toBe(true)
    expect(s.includes(colorObjeto)).toBe(true)
  }
  // Sin acento, el color sale de la semilla y no hay objeto.
  expect(celdaPatioSvg({ fase: 'juega', escala: 3, semilla: 0, quieto: true }).includes('#ff8a3d')).toBe(true)
})

test('explota: llega el tiburón con su diente de oro; sale: tilde verde', () => {
  const e = celdaPatioSvg({ fase: 'explota', acento: ['#5aa9e6', '#2f6ea3'], escala: 3 })
  expect(e.includes('#c7d3e0')).toBe(true) // tiburón
  expect(e.includes('#f2b632')).toBe(true) // diente de oro
  expect(e.includes('#ff5a3c')).toBe(true) // ✕ roja
  expect(celdaPatioSvg({ fase: 'sale', acento: ['#5aa9e6', '#2f6ea3'], escala: 3 }).includes('#4fe08a')).toBe(true)
})

test('quieto no anima; nadando sí', () => {
  expect(/<animate|<set/.test(celdaPatioSvg({ fase: 'juega', escala: 3, quieto: true }))).toBe(false)
  expect(celdaPatioSvg({ fase: 'juega', escala: 3 }).includes('<animate')).toBe(true)
})

test('etiqueta y título se escapan', () => {
  const s = celdaPatioSvg({ fase: 'juega', escala: 3, etiqueta: '<b>', titulo: 'a & "b"' })
  expect(s.includes('&lt;b&gt;')).toBe(true)
  expect(s.includes('<title>a &amp; &quot;b&quot;</title>')).toBe(true)
})

test('«+N», mar vacío y superficie: seguros y del tamaño pedido', () => {
  const mas = celdaMasSvg(4, 3)
  expect(esSeguro(mas)).toBe(true)
  expect(mas.includes('+4')).toBe(true)
  expect(pisoPatioSvg(100, 2).includes('width="100" height="36"')).toBe(true)
  const d = doselPatioSvg(101, 2)
  expect(d.includes('width="101" height="18"')).toBe(true)
  expect(doselPatioSvg(101, 2, { quieto: true }).includes('<animate')).toBe(false)
})
