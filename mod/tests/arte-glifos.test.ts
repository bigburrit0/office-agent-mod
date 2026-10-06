import { expect, test } from 'claude-code/testing'

import { EQUIPO_ACENTO, TIPOS_GLIFO, glifoMatriz, glifoSvg, tipoDeAgente } from '../hooks/arte-glifos'
import { EQUIPOS_EMBLEMA } from '../hooks/pixel'

const W = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash']
const R = ['Read', 'Glob', 'Grep']
const RW = [...R, 'WebFetch', 'WebSearch']

test('los 15 agentes del equipo dan el tipo esperado', () => {
  const casos: [{ name: string; tools: string[] | null; emblema?: string }, string][] = [
    [{ name: 'implementador', tools: W }, 'escriba'],
    [{ name: 'corrector', tools: W }, 'curandero'],
    [{ name: 'tablero-oficina:corrector', tools: W }, 'curandero'],
    [{ name: 'investigador', tools: RW }, 'vidente'],
    [{ name: 'revisor', tools: R }, 'guardian'],
    [{ name: 'estratega', tools: [...RW, 'Write', 'Edit'] }, 'estratega'],
    [{ name: 'pm', tools: [...R, 'Write', 'Edit'] }, 'pm'],
    [{ name: 'backend-a1', tools: W }, 'escriba'],
    [{ name: 'frontend-a1', tools: W }, 'escriba'],
    [{ name: 'tester-a1', tools: [...R, 'Bash', 'PowerShell'] }, 'guardian'],
    [{ name: 'analista', tools: W }, 'escriba'],
    [{ name: 'dataviz', tools: W }, 'escriba'],
    [{ name: 'explorador', tools: RW }, 'vidente'],
    [{ name: 'practico', tools: RW }, 'vidente'],
    [{ name: 'esceptico', tools: RW, emblema: 'guardian' }, 'guardian'],
    [{ name: 'librarian', tools: W, emblema: 'vidente' }, 'vidente'],
  ]
  for (const [agente, tipo] of casos) expect(tipoDeAgente(agente)).toBe(tipo)
})

test('tipoDeAgente: todas las herramientas, prefijo de plugin y NotebookEdit', () => {
  expect(tipoDeAgente({ name: 'todo', tools: null })).toBe('escriba')
  expect(tipoDeAgente({ name: 'todo' })).toBe('escriba')
  expect(tipoDeAgente({ name: 'Tablero-Subagentes:PM', tools: R })).toBe('pm')
  expect(tipoDeAgente({ name: 'x', tools: ['NotebookEdit'] })).toBe('escriba')
})

test('la matriz del glifo es de 16x16 para cada tipo', () => {
  for (const tipo of TIPOS_GLIFO) {
    const g = glifoMatriz(tipo)
    expect(g.length).toBe(16)
    expect(g.every(f => f.length === 16)).toBe(true)
  }
})

test('6 tipos por 6 equipos dan SVG seguro con el acento del equipo', () => {
  for (const tipo of TIPOS_GLIFO) {
    for (const equipo of Object.keys(EQUIPO_ACENTO)) {
      const s = glifoSvg(tipo, equipo, 2)
      expect(s.startsWith('<svg')).toBe(true)
      expect(s).toContain('width="32"')
      expect(s).toContain(EQUIPO_ACENTO[equipo][0])
      expect(/<script|href=/i.test(s)).toBe(false)
    }
  }
})

test('tipo o equipo desconocidos caen en escriba y base; escala acotada', () => {
  expect(glifoSvg('nada', 'nadie', 1)).toBe(glifoSvg('escriba', 'base', 1))
  expect(glifoSvg('escriba', 'base', 99)).toContain('width="128"')
  expect(glifoSvg('escriba', 'base', Number('x'))).toContain('width="16"')
})

test('el color de cada equipo en el emblema coincide con el acento del glifo', () => {
  expect(Object.keys(EQUIPOS_EMBLEMA).sort()).toEqual(Object.keys(EQUIPO_ACENTO).sort())
  expect(Object.keys(EQUIPO_ACENTO).length).toBe(7)
  for (const equipo of Object.keys(EQUIPO_ACENTO)) {
    expect(EQUIPOS_EMBLEMA[equipo].color.toLowerCase()).toBe(EQUIPO_ACENTO[equipo][0])
  }
})
