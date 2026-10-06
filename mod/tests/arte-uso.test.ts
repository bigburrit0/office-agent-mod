import { expect, test } from 'claude-code/testing'

import { abreviarTokens, altUso, formatoTokens, quedaPct, tableroUsoSvg } from '../hooks/arte-uso'

const completo = {
  tokens: { total: 1284560, nuevos: 212000, cache: 1072560 },
  cincoHoras: { pct: 75, renueva: 'hoy 14:00' },
  semana: { pct: 39, renueva: 'vie 22:00', hoy: 2 },
}

const ancho = (s: string) => Number(/viewBox="0 0 (\d+) (\d+)"/.exec(s)![1])
const alto = (s: string) => Number(/viewBox="0 0 (\d+) (\d+)"/.exec(s)![2])
const cuantos = (s: string, t: string) => s.split(t).length - 1

test('formatos de tokens y porcentaje restante', () => {
  expect(formatoTokens(1284560)).toBe('1.284.560')
  expect(formatoTokens(-3)).toBe('0')
  expect(formatoTokens(NaN)).toBe('0')
  expect(abreviarTokens(212000)).toBe('212 mil')
  expect(abreviarTokens(1284560)).toBe('1,3 M')
  expect(abreviarTokens(950)).toBe('950')
  expect(quedaPct(75)).toBe(25)
  expect(quedaPct(150)).toBe(0)
  expect(quedaPct(-5)).toBe(100)
})

test('con datos completos el dibujo trae las cifras y el ancho pedido', () => {
  for (const px of [420, 600]) {
    const svg = tableroUsoSvg(completo, px)
    for (const t of ['1.284.560', 'quedan 25 %', 'quedan 61 %', 'hoy 14:00', 'vie 22:00']) {
      expect(svg.includes(t)).toBe(true)
    }
    expect(ancho(svg)).toBe(px)
  }
})

test('sin 5 horas ni semana espera la primera respuesta y no dice quedan', () => {
  const svg = tableroUsoSvg({}, 420)
  expect(svg.includes('esperando la primera respuesta')).toBe(true)
  expect(svg.includes('quedan')).toBe(false)
})

test('el texto de afuera sale escapado y nunca crudo', () => {
  const svg = tableroUsoSvg({ ...completo, cincoHoras: { pct: 10, renueva: '<b>&' } }, 420)
  expect(svg.includes('&lt;b&gt;&amp;')).toBe(true)
  expect(svg.includes('<b>')).toBe(false)
})

test('la bateria llena 8 segmentos con 25 % usado y parpadea solo con poco y sin quieto', () => {
  const svg = tableroUsoSvg({ cincoHoras: { pct: 25, renueva: 'x' } }, 420)
  expect(cuantos(svg, 'data-seg="llena"')).toBe(8)
  const poco = { cincoHoras: { pct: 95, renueva: 'x' } }
  expect(tableroUsoSvg(poco, 420).includes('<animate')).toBe(true)
  expect(tableroUsoSvg(poco, 420, { quieto: true }).includes('<animate')).toBe(false)
  expect(tableroUsoSvg(completo, 420).includes('<animate')).toBe(false)
})

test('a 300 px se apila y es mas alto que a 600 px', () => {
  expect(alto(tableroUsoSvg(completo, 300))).toBeGreaterThan(alto(tableroUsoSvg(completo, 600)))
  expect(alto(tableroUsoSvg(completo, 300))).toBeLessThanOrEqual(260)
})

test('todo SVG pesa menos de 120000 y no trae script ni eventos', () => {
  const casos = [
    tableroUsoSvg(completo, 420),
    tableroUsoSvg({}, 420),
    tableroUsoSvg(completo, 200),
    tableroUsoSvg(completo, 1200),
    tableroUsoSvg(completo, 99999),
    tableroUsoSvg({ semana: { pct: 100, renueva: 'x', hoy: 9 } }, 420),
  ]
  for (const svg of casos) {
    expect(svg.length).toBeLessThan(120000)
    expect(svg.includes('<script')).toBe(false)
    expect(/\son\w+=/.test(svg)).toBe(false)
  }
  expect(ancho(casos[2])).toBe(200)
  expect(ancho(casos[3])).toBe(1200)
  expect(ancho(casos[4])).toBe(1200)
})

test('el texto alternativo trae las mismas cifras', () => {
  const alt = altUso(completo)
  for (const t of ['1.284.560', '25 %', '61 %']) expect(alt.includes(t)).toBe(true)
  expect(tableroUsoSvg(completo, 420).includes(`aria-label="${alt}"`)).toBe(true)
})
