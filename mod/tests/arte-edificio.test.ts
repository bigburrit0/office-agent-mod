import { expect, test } from 'claude-code/testing'

import { codiceSvg, frisoSvg, numeroMayaSvg, paredTallerSvg, temploSvg, tzolkin, TZOLKIN_NOMBRES } from '../hooks/arte-edificio'

const medidas = (s: string) => {
  const m = /width="(\d+)" height="(\d+)"/.exec(s)!
  return `${m[1]}x${m[2]}`
}

// Medidas fijas del arte original (alto = unidades x escala).
test('ancho y alto de cada funcion igualan los del arte original', () => {
  for (const [ancho, escala] of [[100, 1], [300, 2], [641, 3]] as const) {
    expect(medidas(temploSvg(ancho, escala))).toBe(`${ancho}x${36 * escala}`)
    expect(medidas(frisoSvg(ancho, escala))).toBe(`${ancho}x${8 * escala}`)
    expect(medidas(codiceSvg(ancho, escala))).toBe(`${ancho}x${22 * escala}`)
    expect(medidas(paredTallerSvg(ancho, escala))).toBe(`${ancho}x${20 * escala}`)
  }
  expect(medidas(temploSvg(400))).toBe('400x72')
})

test('el calendario da el dia y el nombre de la fecha local', () => {
  const r = tzolkin(new Date(2026, 9, 5, 12).getTime())
  expect(r).toEqual({ numero: 5, nombre: 'Lun', texto: 'Lun 5' })
  expect(TZOLKIN_NOMBRES).toEqual(['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'])
  expect(tzolkin(Number('x')).texto.length).toBeGreaterThan(0)
})

test('el display no tira error con 0, 7, 19, -1 y texto', () => {
  for (const n of [0, 7, 19, -1, 'x', 99999]) {
    expect(numeroMayaSvg(n, 2).startsWith('<svg')).toBe(true)
  }
  expect(numeroMayaSvg(-1, 2)).toBe(numeroMayaSvg(0, 2))
  expect(numeroMayaSvg('x', 2)).toBe(numeroMayaSvg(0, 2))
  expect(numeroMayaSvg(99999, 2)).toBe(numeroMayaSvg(7999, 2))
  expect(numeroMayaSvg(3, 2, '#ff0000').includes('#ff0000')).toBe(true)
})

test('con quieto la pared no tiene animacion', () => {
  const quieta = paredTallerSvg(300, 2, { quieto: true })
  expect(quieta.includes('<animate') || quieta.includes('<set')).toBe(false)
  expect(paredTallerSvg(300, 2).includes('<animate')).toBe(true)
})

test('ningun dibujo lleva scripts ni referencias externas', () => {
  const todo = temploSvg(400) + frisoSvg(400) + codiceSvg(400) + numeroMayaSvg(12) + paredTallerSvg(400)
  expect(todo.includes('<script')).toBe(false)
  expect(todo.includes('href=')).toBe(false)
  expect(todo.length).toBeLessThan(120000)
})
