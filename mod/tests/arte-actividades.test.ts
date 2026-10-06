import { expect, test } from 'claude-code/testing'

import {
  ACTIVIDADES,
  ACTIVIDAD_EQUIPO,
  ACTIVIDAD_GENERICA,
  actividadDe,
  actividadParaCelda,
  actividadSvg,
} from '../hooks/arte-actividades'
import { EQUIPOS_ESQUEMA } from '../hooks/catalogo'

// Los 12 equipos de hoy, escritos a mano.
const EQUIPOS = [
  'base',
  'direccion',
  'research',
  'librarian',
  'datos',
  'dev-a1',
  'dev-tablero',
  'seguridad',
  'mantenimiento',
  'limpieza',
  'facilities',
  'arquitectura',
]

const seguro = (s: string) => !/<script|href=|on\w+=|<svg/i.test(s) && s.length < 20000

test('cada equipo del esquema tiene su actividad pensada (un equipo nuevo sin actividad hace fallar esta prueba)', () => {
  for (const equipo of Object.keys(EQUIPOS_ESQUEMA)) {
    expect(`${equipo}: ${actividadDe(equipo).pensada}`).toBe(`${equipo}: true`)
  }
  expect(Object.keys(ACTIVIDAD_EQUIPO).sort().join(',')).toBe([...EQUIPOS].sort().join(','))
})

test('la actividad va por equipo, según la tabla del plan', () => {
  expect(actividadDe('research').actividad).toBe('cuaderno')
  expect(actividadDe('dev-a1').actividad).toBe('laptop')
  expect(actividadDe('dev-tablero').actividad).toBe('laptop')
  expect(actividadDe('datos').actividad).toBe('tablas')
  expect(actividadDe('librarian').actividad).toBe('libros')
  expect(actividadDe('direccion').actividad).toBe('pizarra')
  expect(actividadDe('base').actividad).toBe('papeles')
  expect(actividadDe('seguridad').actividad).toBe('camaras')
  expect(actividadDe('mantenimiento').actividad).toBe('foco')
  expect(actividadDe('limpieza').actividad).toBe('carrito')
  expect(actividadDe('facilities').actividad).toBe('llaves')
  expect(actividadDe('arquitectura').actividad).toBe('escuadra')
})

test('un equipo desconocido usa la genérica y queda marcado como no pensado', () => {
  expect(actividadDe('marketing')).toEqual({ actividad: ACTIVIDAD_GENERICA, pensada: false })
  expect(actividadDe(undefined).pensada).toBe(false)
  expect(actividadDe('toString').pensada).toBe(false)
  expect(actividadDe('dev-b2').pensada).toBe(false)
})

test('cada actividad tiene entre 2 y 5 cuadros, todos distintos y seguros', () => {
  for (const nombre of Object.keys(ACTIVIDADES)) {
    const a = ACTIVIDADES[nombre]
    expect(a.tiempos.length >= 2 && a.tiempos.length <= 5).toBe(true)
    expect(a.texto.length > 0).toBe(true)
    const cuadros = a.tiempos.map((_t, i) => actividadSvg(nombre, i, 2, '#3fae6a'))
    for (const c of cuadros) expect(seguro(c)).toBe(true)
    expect(new Set(cuadros).size).toBe(cuadros.length)
  }
})

test('las actividades se distinguen entre sí y los brazos llevan el color de la camisa', () => {
  const primeros = Object.keys(ACTIVIDADES).map(n => actividadSvg(n, 0, 2, '#123456'))
  expect(new Set(primeros).size).toBe(Object.keys(ACTIVIDADES).length)
  for (const p of primeros) expect(p.includes('fill="#123456"')).toBe(true)
})

test('cuadro fuera de rango da la vuelta, nombre desconocido es la genérica y el color inválido se ignora', () => {
  expect(actividadSvg('laptop', 5, 2)).toBe(actividadSvg('laptop', 0, 2))
  expect(actividadSvg('laptop', -1, 2)).toBe(actividadSvg('laptop', 4, 2))
  expect(actividadSvg('xyz', 1, 2)).toBe(actividadSvg('papeles', 1, 2))
  expect(actividadSvg('papeles', 0, 2, '"/><script>')).toBe(actividadSvg('papeles', 0, 2))
})

test('actividadParaCelda trae los cuadros a escala, sus tiempos y el cuadro sin brazos', () => {
  const a = actividadParaCelda('cuaderno', 2, '#3fae6a')
  expect(a.nombre).toBe('cuaderno')
  expect(a.cuadros.length).toBe(a.tiempos.length)
  expect(a.cuadros[0]).toBe(actividadSvg('cuaderno', 0, 2, '#3fae6a'))
  expect(a.sinBrazos.includes('#3fae6a')).toBe(false)
  expect(a.sinBrazos.length > 0 && a.sinBrazos.length < a.cuadros[0].length).toBe(true)
  // Escala 2: el cuaderno empieza en x 6 → 12 px.
  expect(a.cuadros[0].includes('<rect x="12" y="30"')).toBe(true)
  expect(actividadParaCelda('nada').nombre).toBe('papeles')
})
