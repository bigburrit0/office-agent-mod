import { expect, test } from 'claude-code/testing'

import {
  DIOSES_EQUIPO,
  EQUIPO_ACENTO,
  TIPOS_GLIFO,
  TIPO_NOMBRE,
  diosMatriz,
  diosSvg,
  glifoMatriz,
  glifoPaleta,
  glifoSvg,
  tipoDeAgente,
} from '../hooks/arte-iconos'

const EQUIPOS = ['base', 'direccion', 'research', 'librarian', 'datos', 'seguridad', 'mantenimiento', 'limpieza', 'facilities', 'arquitectura', 'dev-a1', 'dev-tablero']
const VALIDAS = new Set('OWKGgYyRBCcMAaSs.'.split(''))

test('los 6 tipos dan iconos de 16x16 con nombre de oficina', () => {
  expect([...TIPOS_GLIFO].sort()).toEqual(['curandero', 'escriba', 'estratega', 'guardian', 'pm', 'vidente'])
  for (const tipo of TIPOS_GLIFO) {
    const g = glifoMatriz(tipo)
    expect(g.length).toBe(16)
    expect(g.every(f => f.length === 16)).toBe(true)
    expect(typeof TIPO_NOMBRE[tipo]).toBe('string')
  }
  expect(TIPO_NOMBRE.escriba).toBe('Redacción')
  expect(TIPO_NOMBRE.estratega).toBe('Estrategia')
})

test('los 12 equipos dan placas de 24x24 con letras válidas', () => {
  expect(Object.keys(DIOSES_EQUIPO).sort()).toEqual([...EQUIPOS].sort())
  expect(Object.keys(EQUIPO_ACENTO).sort()).toEqual([...EQUIPOS].sort())
  for (const eq of EQUIPOS) {
    const filas = diosMatriz(eq)
    expect(filas.length).toBe(24)
    for (const f of filas) {
      expect(f.length).toBe(24)
      for (const ch of f) expect(VALIDAS.has(ch)).toBe(true)
    }
  }
})

test('los 6 iconos y los 12 dibujos son distintos entre sí, y los 12 acentos también', () => {
  expect(new Set(TIPOS_GLIFO.map(t => glifoMatriz(t).join('/'))).size).toBe(6)
  expect(new Set(EQUIPOS.map(e => diosMatriz(e).join('/'))).size).toBe(12)
  expect(new Set(EQUIPOS.map(e => EQUIPO_ACENTO[e][0])).size).toBe(12)
})

test('tipoDeAgente da los mismos resultados fijos que el original', () => {
  const W = ['Read', 'Write', 'Edit']
  const R = ['Read', 'Glob', 'Grep']
  const RW = [...R, 'WebFetch', 'WebSearch']
  expect(tipoDeAgente({ name: 'implementador', tools: W })).toBe('escriba')
  expect(tipoDeAgente({ name: 'tablero-oficina:corrector', tools: W })).toBe('curandero')
  expect(tipoDeAgente({ name: 'investigador', tools: RW })).toBe('vidente')
  expect(tipoDeAgente({ name: 'revisor', tools: R })).toBe('guardian')
  expect(tipoDeAgente({ name: 'Tablero-Subagentes:PM', tools: R })).toBe('pm')
  expect(tipoDeAgente({ name: 'todo', tools: null })).toBe('escriba')
  expect(tipoDeAgente({ name: 'x', tools: RW, emblema: 'guardian' })).toBe('guardian')
})

test('equipo desconocido usa el acento de base; escala acotada', () => {
  expect(glifoPaleta('nadie').A).toBe(EQUIPO_ACENTO.base[0])
  expect(glifoSvg('nada', 'nadie', 1)).toBe(glifoSvg('escriba', 'base', 1))
  expect(glifoSvg('escriba', 'base', 99)).toContain('width="128"')
  expect(glifoSvg('escriba', 'base', Number('x'))).toContain('width="16"')
  const ac: [string, string] = ['#112233', '#445566']
  expect(diosSvg('zzz', 2, ac)).toBe(diosSvg('base', 2, ac))
  expect(diosSvg('base', 99, ac)).toContain('width="192"')
  expect(diosSvg('base', 2, ['rojo', 'x'])).toContain(EQUIPO_ACENTO.base[0])
})

test('SVG estático sin script ni href, con el acento del equipo', () => {
  for (const tipo of TIPOS_GLIFO) {
    for (const eq of EQUIPOS) {
      const s = glifoSvg(tipo, eq, 2)
      expect(s.startsWith('<svg')).toBe(true)
      expect(s).toContain('width="32"')
      expect(s).toContain(EQUIPO_ACENTO[eq][0])
      expect(/<script|href=/i.test(s)).toBe(false)
    }
  }
  for (const eq of EQUIPOS) {
    const s = diosSvg(eq, 2, ['#112233', '#445566'])
    expect(s).toContain('width="48"')
    expect(s).toContain('#112233')
    expect(/<script|href=/i.test(s)).toBe(false)
  }
})
