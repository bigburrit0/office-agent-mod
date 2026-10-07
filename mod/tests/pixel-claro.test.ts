import { expect, test } from 'claude-code/testing'
import { timelineSvg } from '../hooks/pixel'

const ahora = 1_000_000
const filas = [
  { label: 'uno', role: 'implementador', status: 'running', startMs: ahora - 60000, endMs: null },
  { label: 'dos', role: 'corrector', status: 'completed', startMs: ahora - 50000, endMs: ahora - 20000 },
  { label: 'tres', role: 'revisor', status: 'failed', startMs: ahora - 30000, endMs: ahora - 10000 },
] as any

test('sin opts es igual a tema oscuro y usa el azul', () => {
  const a = timelineSvg(filas, ahora, 420)
  expect(a).toBe(timelineSvg(filas, ahora, 420, { tema: 'oscuro' }))
  expect(a).toContain('#1F5FA8')
})

test('tema del escritorio (noche pirata) usa fondo de noche y letra hueso', () => {
  const c = timelineSvg(filas, ahora, 420, { tema: 'claro' })
  expect(c).not.toContain('#1F5FA8')
  expect(c).not.toContain('#FFF4DF')
  expect(c).toContain('#160F26')
  expect(c).toContain('#FFF6E0')
  expect(c).toContain('viewBox="0 0 420 ')
})

test('vacío en el tema del escritorio no usa el azul', () => {
  const v = timelineSvg([], ahora, 420, { tema: 'claro' })
  expect(v).not.toContain('#1F5FA8')
  expect(v).toContain('#160F26')
})
