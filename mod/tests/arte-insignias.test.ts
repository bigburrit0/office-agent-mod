import { expect, test } from 'claude-code/testing'

import { EQUIPO_ACENTO, TIPOS_GLIFO } from '../hooks/arte-iconos'
import { ACENTO_INSIGNIAS, DIOSES_EQUIPO, diosMatriz, diosSvg, glifoMatriz, glifoSvg } from '../hooks/arte-insignias'

const esSeguro = (s: string) =>
  s.startsWith('<svg') && s.endsWith('</svg>') && !/<script|on\w+=|href=/i.test(s) &&
  !s.replace('xmlns="http://www.w3.org/2000/svg"', '').includes('http')

test('los colores de los equipos son los mismos que en arte-iconos', () => {
  expect(ACENTO_INSIGNIAS).toEqual(EQUIPO_ACENTO)
  expect(Object.keys(DIOSES_EQUIPO).sort()).toEqual(Object.keys(EQUIPO_ACENTO).sort())
})

test('seis íconos de rol distintos, de 16 x 16, con el color del equipo en el borde', () => {
  const vistos = new Set<string>()
  for (const t of TIPOS_GLIFO) {
    const m = glifoMatriz(t)
    expect(m.length).toBe(16)
    for (const f of m) expect(f.length).toBe(16)
    vistos.add(m.join('\n'))
    const s = glifoSvg(t, 'datos', 3)
    expect(esSeguro(s)).toBe(true)
    expect(s.includes('width="48" height="48"')).toBe(true)
    expect(s.includes(EQUIPO_ACENTO.datos[0])).toBe(true)
  }
  expect(vistos.size).toBe(6)
  expect(glifoMatriz('xyz')).toEqual(glifoMatriz('escriba'))
})

test('doce banderas distintas de 24 x 24, con calavera y el emblema del equipo', () => {
  const vistas = new Set<string>()
  for (const [equipo, acento] of Object.entries(EQUIPO_ACENTO)) {
    const m = diosMatriz(equipo)
    expect(m.length).toBe(24)
    for (const f of m) expect(f.length).toBe(24)
    vistas.add(m.join('\n'))
    const s = diosSvg(equipo, 2, acento)
    expect(esSeguro(s)).toBe(true)
    expect(s.includes('width="48" height="48"')).toBe(true)
    expect(s.includes('#fff6e0')).toBe(true) // la calavera
  }
  expect(vistas.size).toBe(12)
  expect(diosMatriz('xyz')).toEqual(diosMatriz('base'))
  expect(diosSvg('base', Number.NaN, ['x', 'y'] as never).includes('width="24"')).toBe(true)
})
