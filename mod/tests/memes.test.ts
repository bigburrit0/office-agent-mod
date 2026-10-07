import { expect, test } from 'claude-code/testing'

import { afinarReaccion, tarjetaDe } from '../hooks/memes'

const F = (id: string, status: string, desde: number, desc = `T-${id} · sonnet · algo`, fin?: number) => ({
  id,
  description: desc,
  status,
  firstSeen: desde,
  ...(fin !== undefined ? { endedAt: fin } : {}),
})
const R = (tipo: string) => ({ tipo, hasta: 9e9, quien: 'x' })

test('tarjetaDe: el ID al principio de la descripción', () => {
  expect(tarjetaDe('T-9 · sonnet · implementador · algo')).toBe('T-9')
  expect(tarjetaDe('app-12b · algo')).toBe('APP-12B')
  expect(tarjetaDe('sin tarjeta')).toBe('')
})

test('Pikachu: falla antes de los 30 s; si corría más, ruge', () => {
  const prev = [F('1', 'running', 0)]
  expect(afinarReaccion(R('ruge'), prev, [F('1', 'failed', 0, undefined, 10000)], 10000)?.tipo).toBe('pikachu')
  expect(afinarReaccion(R('ruge'), prev, [F('1', 'failed', 0, undefined, 40000)], 40000)?.tipo).toBe('ruge')
})

test('This is fine: fallan varios y otros siguen; si no queda nadie, pánico', () => {
  const prev = [F('1', 'running', 0), F('2', 'running', 0), F('3', 'running', 0)]
  expect(afinarReaccion(R('panico'), prev, [F('1', 'failed', 0), F('2', 'failed', 0), F('3', 'running', 0)], 5)?.tipo).toBe('estoEstaBien')
  expect(afinarReaccion(R('panico'), prev, [F('1', 'failed', 0), F('2', 'failed', 0), F('3', 'completed', 0)], 5)?.tipo).toBe('panico')
})

test('al llegar uno: «Ah, otra vez» si su tarjeta ya falló; novio distraído si otro lleva más de 10 min', () => {
  const fallo = [F('1', 'failed', 0, 'T-4 · a')]
  expect(afinarReaccion(R('caceria'), fallo, [...fallo, F('2', 'running', 5, 'T-4 · b')], 5)).toEqual({ tipo: 'otraVez', hasta: 9e9, quien: 'T-4' })
  const viejo = [F('1', 'running', 0, 'T-1 · a')]
  expect(afinarReaccion(R('caceria'), viejo, [...viejo, F('2', 'running', 700000, 'T-2 · b')], 700000)?.tipo).toBe('distraido')
  expect(afinarReaccion(R('caceria'), viejo, [...viejo, F('2', 'running', 1000, 'T-2 · b')], 1000)?.tipo).toBe('caceria')
})

test('Success Kid: termina una tarjeta que nunca falló; sin tarjeta, contento', () => {
  const prev = [F('1', 'running', 0, 'T-1 · a'), F('2', 'running', 0, 'b sin tarjeta'), F('3', 'running', 0, 'T-9 · c')]
  expect(afinarReaccion(R('contento'), prev, [F('1', 'completed', 0, 'T-1 · a'), prev[1], prev[2]], 5)?.tipo).toBe('successKid')
  expect(afinarReaccion(R('contento'), prev, [prev[0], F('2', 'completed', 0, 'b sin tarjeta'), prev[2]], 5)?.tipo).toBe('contento')
  const conFalla = [F('0', 'failed', 0, 'T-1 · antes'), ...prev]
  expect(afinarReaccion(R('contento'), conFalla, [conFalla[0], F('1', 'completed', 0, 'T-1 · a'), prev[1], prev[2]], 5)?.tipo).toBe('contento')
  expect(afinarReaccion(null, prev, prev, 5)).toBe(null)
})
