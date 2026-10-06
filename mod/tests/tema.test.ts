import { expect, test } from 'claude-code/testing'

import { CLARO, FONDOS_CLARO, PASTILLAS_CLARO, colorUsoClaro, contrasteHex, legibleSobre } from '../hooks/tema'

test('texto y textoSuave son legibles sobre todos los fondos claros', () => {
  for (const f of FONDOS_CLARO) {
    expect(contrasteHex(CLARO.texto, f)).toBeGreaterThanOrEqual(4.5)
    expect(contrasteHex(CLARO.textoSuave, f)).toBeGreaterThanOrEqual(4.5)
  }
})

test('el acento es legible sobre el panel y la tarjeta', () => {
  expect(contrasteHex(CLARO.acento, CLARO.panel)).toBeGreaterThanOrEqual(4.5)
  expect(contrasteHex(CLARO.acento, CLARO.tarjeta)).toBeGreaterThanOrEqual(4.5)
})

test('contrasteHex mide bien los extremos y no distingue mayusculas', () => {
  const c = contrasteHex('#000000', '#ffffff')
  expect(c).toBeGreaterThan(20.9)
  expect(c).toBeLessThan(21.1)
  expect(contrasteHex('#ABCDEF', '#abcdef')).toBe(1)
  expect(contrasteHex('rojo', '#ffffff')).toBe(1)
})

test('legibleSobre oscurece solo cuando hace falta', () => {
  const r = legibleSobre('#4fe08a', CLARO.panel)
  expect(r).not.toBe('#4fe08a')
  expect(contrasteHex(r, CLARO.panel)).toBeGreaterThanOrEqual(4.5)
  expect(legibleSobre(CLARO.texto, CLARO.panel)).toBe(CLARO.texto)
  expect(legibleSobre('rojo', CLARO.panel)).toBe(CLARO.texto)
})

test('cada pastilla de estado es legible', () => {
  for (const p of Object.values(PASTILLAS_CLARO)) {
    expect(contrasteHex(p.color, p.fondo)).toBeGreaterThanOrEqual(4.5)
  }
})

test('colorUsoClaro da tres colores distintos y legibles', () => {
  const cs = [colorUsoClaro(10), colorUsoClaro(60), colorUsoClaro(95)]
  expect(new Set(cs).size).toBe(3)
  for (const c of cs) {
    expect(contrasteHex(c, CLARO.panel)).toBeGreaterThanOrEqual(4.5)
    expect(contrasteHex(c, CLARO.tarjeta)).toBeGreaterThanOrEqual(4.5)
  }
})
