import { expect, test } from 'claude-code/testing'

import { bodegaSvg, lechoSvg, repisaSvg, sogaSvg } from '../hooks/arte-bodega'

const esSeguro = (s: string) =>
  s.startsWith('<svg') && s.endsWith('</svg>') && s.length < 120000 && !/<script|on\w+=|href=/i.test(s) &&
  !s.replace('xmlns="http://www.w3.org/2000/svg"', '').includes('http')
const medida = (s: string) => {
  const m = /width="(\d+)" height="(\d+)"/.exec(s)!
  return [Number(m[1]), Number(m[2])]
}

test('la bodega mide lo pedido (24..480 de alto), pesa poco y anima solo sin quieto', () => {
  for (const [w, h] of [[378, 60], [640, 140], [1200, 480], [200, 10], [300, 999]]) {
    const s = bodegaSvg(w, h, 2)
    expect(esSeguro(s)).toBe(true)
    expect(medida(s)).toEqual([w, Math.max(24, Math.min(480, h))])
  }
  expect(bodegaSvg(378, 140, 2).includes('<animate')).toBe(true)
  expect(/<animate|<set/.test(bodegaSvg(378, 140, 2, { quieto: true }))).toBe(false)
})

test('con pared de sobra aparecen la hamaca, los faroles y los ojos de buey; bajita, solo lo del piso', () => {
  const alta = bodegaSvg(378, 220, 2, { quieto: true })
  const baja = bodegaSvg(378, 40, 2, { quieto: true })
  expect(alta.includes('#d23a3a')).toBe(true) // camiseta del pirata dormido
  expect(alta.includes('#ffdd55')).toBe(true) // farol
  expect(alta.includes('#1f3b73')).toBe(true) // mar en el ojo de buey
  expect(baja.includes('#d23a3a')).toBe(false)
  expect(baja.includes('#9c6a3a')).toBe(true) // cajas
})

test('soga, lecho y repisa: seguros y del alto de siempre', () => {
  for (const s of [sogaSvg(378, 6), lechoSvg(378, 2), repisaSvg(378, 2)]) expect(esSeguro(s)).toBe(true)
  expect(medida(sogaSvg(378, 6))).toEqual([378, 6])
  expect(medida(lechoSvg(378, 2))).toEqual([378, 16])
  expect(medida(repisaSvg(378, 2))).toEqual([378, 24])
})
