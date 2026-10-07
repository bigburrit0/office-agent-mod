import { expect, test } from 'claude-code/testing'

import { caraRobotSvg } from '../hooks/arte-loro'
import { celdaPatioSvg } from '../hooks/arte-mar'
import { ESCENA_FONDO, escenaAlto, escenaOficinaSvg, porFilaEscena } from '../hooks/arte-barco'

const celda = (i: number, quieto = false, fase = 'juega') => ({
  svg: celdaPatioSvg({ fase, acento: ['#f08a24', '#9c4f0c'], escala: 3, semilla: i * 5, quieto, etiqueta: `T-${i}`, titulo: `agente ${i}` }),
})
const celdas = (n: number, quieto = false) => Array.from({ length: n }, (_x, i) => celda(i, quieto))
const viewBox = (s: string) => {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(s)!
  return { w: Number(m[1]), h: Number(m[2]) }
}
const trozo = (svg: string) => svg.slice(svg.indexOf('>') + 1, svg.indexOf('>') + 400)
const loro = (e = 'aburrido', quieto = false) => caraRobotSvg(e, 3, { quieto, marco: true })

test('el viewBox mide el ancho pedido y el alto de escenaAlto', () => {
  for (const ancho of [300, 378, 640]) {
    for (const n of [0, 2, 8]) {
      const v = viewBox(escenaOficinaSvg({ ancho, cara: loro(), celdas: celdas(n) }))
      expect(v.w).toBe(ancho)
      expect(v.h).toBe(escenaAlto(ancho, n, false))
    }
    expect(viewBox(escenaOficinaSvg({ ancho, cara: loro(), celdas: [], vacia: true })).h).toBe(escenaAlto(ancho, 0, true))
  }
})

test('los peces nadan a lo ancho, debajo del barco: más por fila que en la oficina', () => {
  expect(porFilaEscena(378)).toBe(5)
  expect(porFilaEscena(640)).toBe(9)
  expect(escenaAlto(378, 5, false)).toBe(escenaAlto(378, 1, false))
  expect(escenaAlto(378, 6, false)).toBeGreaterThan(escenaAlto(378, 5, false))
  // Como mucho dos filas.
  expect(escenaAlto(378, 30, false)).toBe(escenaAlto(378, 10, false))
})

test('anida el loro en la baranda y los peces en el agua', () => {
  const cara = loro('contento')
  const cs = celdas(3)
  const s = escenaOficinaSvg({ ancho: 640, cara, celdas: cs })
  expect(s.includes(trozo(cara))).toBe(true)
  expect(s.includes('<svg x="8" y="34"')).toBe(true)
  for (const c of cs) expect(s.includes(trozo(c.svg))).toBe(true)
})

test('el barco se llama «La Galleta» y sin peces flota la boya «LIBRE»', () => {
  const vacia = escenaOficinaSvg({ ancho: 378, cara: loro(), celdas: [], vacia: true })
  expect(vacia.includes('#F28C28')).toBe(true)
  expect((vacia.match(/<svg/g) ?? []).length).toBe(2)
  expect(escenaOficinaSvg({ ancho: 378, cara: loro(), celdas: celdas(2) }).includes('#F28C28')).toBe(false)
  expect(escenaAlto(400, 0, true)).toBeLessThan(escenaAlto(400, 9, false))
  expect(() => escenaOficinaSvg({ ancho: 378, cara: loro(), celdas: [] })).not.toThrow()
})

test('con 8 peces y el loro más pesado pesa menos de 120000', () => {
  for (const ancho of [378, 640, 1200]) {
    expect(escenaOficinaSvg({ ancho, cara: loro('multitarea'), celdas: celdas(8) }).length).toBeLessThan(120000)
  }
})

test('con quieto no hay animaciones; sin quieto, el mar se mueve', () => {
  const s = escenaOficinaSvg({ ancho: 640, cara: loro('bostezo', true), celdas: celdas(4, true), quieto: true })
  expect(/<animate|<set/.test(s)).toBe(false)
  expect(escenaOficinaSvg({ ancho: 640, cara: loro(), celdas: [] }).includes('<animate')).toBe(true)
})

test('los cuadros cuelgan de la driza cuando no hay peces', () => {
  const placa = caraRobotSvg('contento', 1)
  const s = escenaOficinaSvg({ ancho: 640, cara: loro(), celdas: [], cuadros: [placa] })
  expect(s.includes(trozo(placa))).toBe(true)
  expect(viewBox(s).h).toBe(escenaAlto(640, 0, false))
})

test('alt se escapa, hay valor por defecto y no hay script ni referencias externas', () => {
  const s = escenaOficinaSvg({ ancho: 378, cara: loro(), celdas: celdas(1), alt: '<x>' })
  expect(s.includes('aria-label="&lt;x&gt;"')).toBe(true)
  expect(s.includes('<x>')).toBe(false)
  expect(s.includes('<script')).toBe(false)
  expect(s.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '').includes('http')).toBe(false)
  expect(escenaOficinaSvg({ ancho: 378, cara: loro(), celdas: [] }).includes('aria-label="Barco de agentes"')).toBe(true)
  expect(ESCENA_FONDO).toBe('#1d1238')
})
