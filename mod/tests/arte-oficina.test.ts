import { expect, test } from 'claude-code/testing'

import { estanteSvg, franjaLisaMaxima, OFICINA_VACIA_ALTO, oficinaVaciaSvg, pieOficinaSvg } from '../hooks/arte-oficina'

const viewBox = (s: string) => {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(s)!
  return { w: Number(m[1]), h: Number(m[2]) }
}
const cuentaPath = (s: string) => (s.match(/<path/g) || []).length

test('el ancho del viewBox es exactamente el pedido', () => {
  for (const ancho of [300, 517]) {
    expect(viewBox(oficinaVaciaSvg(ancho)).w).toBe(ancho)
    expect(viewBox(estanteSvg(ancho)).w).toBe(ancho)
    for (const alto of [60, 300]) {
      const v = viewBox(pieOficinaSvg(ancho, alto))
      expect(v.w).toBe(ancho)
      expect(v.h).toBe(alto)
    }
  }
})

test('alto de la oficina vacia y del estante igualan unidades x escala', () => {
  expect(OFICINA_VACIA_ALTO).toBe(40)
  expect(viewBox(oficinaVaciaSvg(300, 2)).h).toBe(80)
  expect(viewBox(estanteSvg(300, 3)).h).toBe(36)
})

test('el alto del pasillo se acota entre 24 y 480', () => {
  expect(viewBox(pieOficinaSvg(400, 10)).h).toBe(24)
  expect(viewBox(pieOficinaSvg(400, 9999)).h).toBe(480)
})

test('con quieto no hay animacion y sin quieto la oficina y el pasillo animan', () => {
  expect(oficinaVaciaSvg(300, 2, { quieto: true }).includes('<animate')).toBe(false)
  expect(pieOficinaSvg(400, 300, 2, { quieto: true }).includes('<animate')).toBe(false)
  expect(estanteSvg(300).includes('<animate')).toBe(false)
  expect(oficinaVaciaSvg(300).includes('<animate')).toBe(true)
  expect(pieOficinaSvg(400, 300).includes('<animate')).toBe(true)
})

test('con mas alto el pasillo dibuja mas objetos', () => {
  const bajo = pieOficinaSvg(400, 40)
  const alto = pieOficinaSvg(400, 300)
  expect(cuentaPath(alto) > cuentaPath(bajo) || alto.length > bajo.length).toBe(true)
})

test('sin scripts ni manejadores y livianos', () => {
  const todos = [oficinaVaciaSvg(1200, 2), estanteSvg(1200, 2), pieOficinaSvg(1200, 480, 2), pieOficinaSvg(1200, 480, 1)]
  for (const svg of todos) {
    expect(svg.includes('<script')).toBe(false)
    expect(/ on[a-z]+=/i.test(svg)).toBe(false)
    expect(svg.length < 120000).toBe(true)
  }
})

test('ancho NaN o negativo no tira error', () => {
  for (const n of [Number.NaN, -5, 0]) {
    expect(oficinaVaciaSvg(n).startsWith('<svg')).toBe(true)
    expect(estanteSvg(n).startsWith('<svg')).toBe(true)
    expect(pieOficinaSvg(n, n).startsWith('<svg')).toBe(true)
  }
})

test('con alto de sobra el pasillo se llena: 420x300 tiene 1,4 veces los caracteres de 420x120', () => {
  expect(pieOficinaSvg(420, 300).length >= 1.4 * pieOficinaSvg(420, 120).length).toBe(true)
})

test('franjaLisaMaxima: ninguna franja de pared lisa pasa de 30 unidades', () => {
  for (const alto of [120, 200, 300, 480]) {
    for (const escala of [1, 2]) expect(franjaLisaMaxima(alto, escala) <= 30).toBe(true)
  }
})

test('el pasillo alto mantiene viewBox exacto y sin animacion con quieto', () => {
  for (const [ancho, alto] of [[420, 120], [420, 300], [1200, 480]]) {
    const v = viewBox(pieOficinaSvg(ancho, alto))
    expect(v.w).toBe(ancho)
    expect(v.h).toBe(alto)
    expect(pieOficinaSvg(ancho, alto, 2, { quieto: true }).includes('<animate')).toBe(false)
  }
})
