import { expect, test } from 'claude-code/testing'

import { caraRobotSvg } from '../hooks/arte-robot'
import { celdaPatioSvg } from '../hooks/arte-escritorios'
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
    const vv = viewBox(escenaOficinaSvg({ ancho, cara, celdas: [], vacia: true }))
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
  const s = escenaOficinaSvg({ ancho: 378, cara, celdas: [], vacia: true })
  expect(s.includes('LIBRE') || s.includes('#F28C28')).toBe(true)
  expect(s.includes('#13251b')).toBe(true)
  expect((s.match(/<svg/g) ?? []).length).toBe(2)
  expect(escenaOficinaSvg({ ancho: 378, cara, celdas: [], vacia: 'x' as unknown as boolean }).includes('#13251b')).toBe(true)
  expect(escenaAlto(378, 0, true)).toBe(escenaAlto(378, 1, false))
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
  const q = caraRobotSvg('bostezo', 3, { fondo: ESCENA_FONDO, marco: true, quieto: true })
  expect(escenaOficinaSvg({ ancho: 378, cara: q, celdas: [], vacia: true, quieto: true }).includes('<animate')).toBe(false)
  expect(escenaOficinaSvg({ ancho: 378, cara: q, celdas: [], vacia: true }).includes('<animate')).toBe(true)
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

// ---- cuadros colgados en la pared ----
const cuadroPrueba = (color: string, lado = 48) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}"><rect width="${lado}" height="${lado}" fill="${color}"/></svg>`

test('los cuadros se cuelgan en la pared: 3 colores aparecen y el alto no cambia', () => {
  const cara = caraRobotSvg('feliz', 3, { fondo: ESCENA_FONDO, marco: true })
  const colores = ['#123401', '#123402', '#123403']
  const s = escenaOficinaSvg({ ancho: 378, cara, celdas: [], cuadros: colores.map((c) => cuadroPrueba(c)) })
  for (const c of colores) expect(s.includes(c)).toBe(true)
  expect(viewBox(s).h).toBe(escenaAlto(378, 0, false))
  // Un cuadro más alto que la pared se omite.
  const alto = escenaOficinaSvg({ ancho: 378, cara, celdas: [], cuadros: [cuadroPrueba('#abcd01', 200)] })
  expect(alto.includes('#abcd01')).toBe(false)
})

test('con 30 cuadros a 378 px no se pasa del ancho', () => {
  const cara = caraRobotSvg('feliz', 3, { fondo: ESCENA_FONDO, marco: true })
  const todos = Array.from({ length: 30 }, (_x, i) => cuadroPrueba(`#77${String(i).padStart(2, '0')}aa`))
  const s = escenaOficinaSvg({ ancho: 378, cara, celdas: [], cuadros: todos })
  expect(viewBox(s).w).toBe(378)
  const dibujados = todos.filter((q) => s.includes(q.match(/fill="(#[0-9a-f]+)"/)![1])).length
  expect(dibujados > 0 && dibujados < 30).toBe(true)
  for (const m of s.matchAll(/<svg x="(\d+)" y="\d+" xmlns[^>]*width="(\d+)"/g)) expect(Number(m[1]) + Number(m[2]) <= 378).toBe(true)
})

test('con cuadros y sin celdas no aparece el cartel del escritorio libre', () => {
  const cara = caraRobotSvg('aburrido', 3, { marco: true })
  const s = escenaOficinaSvg({ ancho: 378, cara, celdas: [], vacia: true, cuadros: [cuadroPrueba('#123401')] })
  const cuenta = (t: string) => (t.match(/#F28C28/g) ?? []).length
  expect(cuenta(s) < cuenta(escenaOficinaSvg({ ancho: 378, cara, celdas: [], vacia: true }))).toBe(true)
})
