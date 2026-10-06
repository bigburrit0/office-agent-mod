import { expect, test } from 'claude-code/testing'

import { DIOSES_EQUIPO, diosMatriz, diosSvg } from '../hooks/arte-dioses'

const EQUIPOS = ['base', 'direccion', 'dev-a1', 'dev-tablero', 'datos', 'research', 'librarian']
const VALIDAS = new Set('OWKRrYyBZzCcMFfQLTGgmSsAa.'.split(''))

test('las 7 claves existen y cada matriz es de 24x24 con letras válidas', () => {
  expect(Object.keys(DIOSES_EQUIPO).sort()).toEqual([...EQUIPOS].sort())
  for (const eq of EQUIPOS) {
    const filas = diosMatriz(eq)
    expect(filas.length).toBe(24)
    for (const f of filas) {
      expect(f.length).toBe(24)
      for (const ch of f) expect(VALIDAS.has(ch)).toBe(true)
    }
  }
})

test('diosSvg: estructura segura por equipo', () => {
  for (const eq of EQUIPOS) {
    const s = diosSvg(eq, 2, ['#112233', '#445566'])
    expect(s.startsWith('<svg')).toBe(true)
    expect(s).toContain('width="48"')
    expect(s).toContain('#112233')
    expect(s).not.toContain('<script')
    expect(s).not.toContain('href')
  }
})

test('diosSvg: desconocido, escala y acento inválido', () => {
  const ac: [string, string] = ['#112233', '#445566']
  expect(diosSvg('zzz', 2, ac)).toBe(diosSvg('base', 2, ac))
  expect(diosSvg('base', 99, ac)).toContain('width="192"')
  expect(diosSvg('base', Number('x'), ac)).toContain('width="24"')
  expect(diosSvg('base', 2, ['rojo', 'x'])).toContain('#3fae6a')
})
