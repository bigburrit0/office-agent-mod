import { expect, test } from 'claude-code/testing'

import { caraRobotSvg } from '../hooks/arte-robot'
import { celdaPatioSvg } from '../hooks/arte-escritorios'
import { oficinaVaciaSvg } from '../hooks/arte-oficina'
import { ESCENA_FONDO, escenaAlto, escenaOficinaSvg } from '../hooks/arte-escena'

const celda = (i: number, quieto = false) => ({
  svg: celdaPatioSvg({ fase: 'juega', escala: 3, semilla: i * 5, fondo: ESCENA_FONDO, quieto, titulo: `agente ${i}` }),
})
const celdas = (n: number, quieto = false) => Array.from({ length: n }, (_x, i) => celda(i, quieto))
const viewBox = (s: string) => {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(s)!
  return { w: Number(m[1]), h: Number(m[2]) }
}
// Un fragmento reconocible del interior de un SVG hijo (sin la etiqueta de apertura).
const trozo = (svg: string) => svg.slice(svg.indexOf('>') + 1, svg.indexOf('>') + 400)

test('el viewBox mide el ancho pedido y el alto de escenaAlto', () => {
  for (const ancho of [300, 378, 640]) {
    const cara = caraRobotSvg('feliz', 3, { fondo: ESCENA_FONDO, marco: true })
    for (const n of [0, 2, 8]) {
      const v = viewBox(escenaOficinaSvg({ ancho, cara, celdas: celdas(n) }))
      expect(v.w).toBe(ancho)
      expect(v.h).toBe(escenaAlto(ancho, n, false))
    }
    const vv = viewBox(escenaOficinaSvg({ ancho, cara, celdas: [], vacia: oficinaVaciaSvg(ancho - 146, 2) }))
    expect(vv.h).toBe(escenaAlto(ancho, 0, true))
  }
})

test('anida el robot y las celdas', () => {
  const cara = caraRobotSvg('feliz', 3, { fondo: ESCENA_FONDO, marco: true })
  const cs = celdas(3)
  const s = escenaOficinaSvg({ ancho: 640, cara, celdas: cs })
  expect(s.includes(trozo(cara))).toBe(true)
  expect(s.includes('<svg x="8" y="')).toBe(true)
  for (const c of cs) expect(s.includes(trozo(c.svg))).toBe(true)
})

test('sin celdas muestra el escritorio libre y sin nada no lanza', () => {
  const cara = caraRobotSvg('aburrido', 3, { marco: true })
  const vacia = oficinaVaciaSvg(232, 2)
  expect(escenaOficinaSvg({ ancho: 378, cara, celdas: [], vacia }).includes(trozo(vacia))).toBe(true)
  expect(() => escenaOficinaSvg({ ancho: 378, cara, celdas: [] })).not.toThrow()
})

test('con 8 celdas reales y la cara bostezo pesa menos de 120000', () => {
  const cara = caraRobotSvg('bostezo', 3, { fondo: ESCENA_FONDO, marco: true })
  for (const ancho of [378, 640, 1200]) {
    expect(escenaOficinaSvg({ ancho, cara, celdas: celdas(8) }).length).toBeLessThan(120000)
  }
})

test('con quieto no hay animaciones', () => {
  const cara = caraRobotSvg('bostezo', 3, { fondo: ESCENA_FONDO, marco: true, quieto: true })
  const s = escenaOficinaSvg({ ancho: 640, cara, celdas: celdas(4, true), quieto: true })
  expect(s.includes('<animate')).toBe(false)
  expect(escenaOficinaSvg({ ancho: 640, cara, celdas: [] }).includes('<animate')).toBe(true)
})

test('alt se escapa y no hay script', () => {
  const cara = caraRobotSvg('feliz', 3, { marco: true })
  const s = escenaOficinaSvg({ ancho: 378, cara, celdas: celdas(1), alt: '<x>' })
  expect(s.includes('aria-label="&lt;x&gt;"')).toBe(true)
  expect(s.includes('<x>')).toBe(false)
  expect(s.includes('<script')).toBe(false)
  expect(escenaOficinaSvg({ ancho: 378, cara, celdas: [] }).includes('aria-label="Oficina de agentes"')).toBe(true)
})

test('el escritorio libre es más bajo que dos filas de agentes', () => {
  expect(escenaAlto(400, 0, true)).toBeLessThan(escenaAlto(400, 9, false))
})
