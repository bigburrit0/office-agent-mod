import { expect, test } from 'claude-code/testing'

import { timelineSvg } from '../hooks/pixel'

const A = 1_000_000_000
const filas = [
  { label: 'T-1 a', role: 'implementador', status: 'completed', startMs: A - 600000, endMs: A - 300000 },
  { label: 'T-2 b', role: 'corrector', status: 'running', startMs: A - 200000 },
]

// Marcas del eje (fila de arriba, y="10"): texto, x y ancla.
const marcas = (svg: string) =>
  [...svg.matchAll(/<text x="(\d+)" y="10" text-anchor="(start|end)"[^>]*>([^<]*)<\/text>/g)].map(m => {
    const ancho = m[3].length * 5.5
    const x = Number(m[1])
    return { texto: m[3], desde: m[2] === 'end' ? x - ancho : x, hasta: m[2] === 'end' ? x : x + ancho }
  })

test('línea de tiempo: las marcas del eje nunca se pisan y el total siempre se ve', () => {
  for (const ancho of [200, 260, 320, 420, 640]) {
    const m = marcas(timelineSvg(filas, A, ancho))
    expect(m.length >= (ancho >= 260 ? 2 : 1)).toBe(true)
    for (const x of m) expect(x.desde >= 0 && x.hasta <= ancho).toBe(true)
    expect(m[m.length - 1].texto).toBe('10m00s')
    for (let i = 1; i < m.length; i++) expect(m[i].desde >= m[i - 1].hasta).toBe(true)
  }
  // Con ancho de sobra entran las 5.
  expect(marcas(timelineSvg(filas, A, 900)).length).toBe(5)
})
