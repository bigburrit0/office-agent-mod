import { expect, test } from 'claude-code/testing'

import { codiceSvg, frisoSvg, numeroMayaSvg, paredTallerSvg, temploSvg, tzolkin } from '../hooks/arte-templo'

test('el templo mide el ancho pedido y pone la fachada solo si cabe', () => {
  const t = temploSvg(400, 2)
  expect(t.includes('width="400"') && t.includes('height="72"')).toBe(true)
  expect(t.includes('#0a0c08')).toBe(true)
  expect(temploSvg(60, 2).includes('#0a0c08')).toBe(false)
})

test('friso y codice tienen el alto de su escala y son estaticos', () => {
  const f = frisoSvg(300, 2)
  const c = codiceSvg(400, 2)
  expect(f.includes('height="16"') && f.includes('width="300"')).toBe(true)
  expect(c.includes('height="44"') && c.includes('#e2a72e')).toBe(true)
  expect((f + c + temploSvg(400)).includes('<animate')).toBe(false)
  // Cambio: a 40 px la pagina 2 (rotacion) queda cortada y trae un glifo dorado; sin pincel se prueba con 30 px (solo pagina 1).
  expect(codiceSvg(30, 2).includes('#e2a72e')).toBe(false)
})

test('el codice nuevo tiene tapas de jade solo si caben (38 unidades)', () => {
  expect(codiceSvg(420, 2).includes('#2f8a5a')).toBe(true)
  expect(codiceSvg(40, 2).includes('#2f8a5a')).toBe(false)
})

test('el cero maya es una concha de 11 unidades de ancho', () => {
  const z = numeroMayaSvg(0, 2)
  expect(z.includes('width="22"') && z.includes('#efdcae')).toBe(true)
})

test('los niveles suman alto y el valor se acota', () => {
  const alto = (s: string) => Number(/height="(\d+)"/.exec(s)![1])
  expect(alto(numeroMayaSvg(20, 2))).toBeGreaterThan(alto(numeroMayaSvg(1, 2)))
  expect(alto(numeroMayaSvg(7, 2))).toBeGreaterThan(alto(numeroMayaSvg(5, 2)))
  expect(numeroMayaSvg(99999, 2)).toBe(numeroMayaSvg(7999, 2))
})

test('numero invalido da cero y el color propio se respeta', () => {
  expect(numeroMayaSvg(-3, 2)).toBe(numeroMayaSvg(0, 2))
  expect(numeroMayaSvg('x', 2)).toBe(numeroMayaSvg(0, 2))
  expect(numeroMayaSvg(3, 2, '#ff0000').includes('#ff0000')).toBe(true)
  expect(numeroMayaSvg(3, 2, 'rojo').includes('#efdcae')).toBe(true)
})

test('el 4 maya mide 11 unidades y sus puntos van separados', () => {
  const n = numeroMayaSvg(4, 2)
  expect(n.includes('width="22"')).toBe(true)
  const d = /d="([^"]*)"/.exec(n)![1]
  expect(d.split('M').length - 1).toBe(4)
})

test('la pared del taller mide lo pedido, tiene llama y se puede dejar quieta', () => {
  const p = paredTallerSvg(300, 2)
  expect(p.includes('width="300"') && p.includes('height="40"')).toBe(true)
  expect(p.includes('#e8553f') && p.includes('<animate')).toBe(true)
  expect(paredTallerSvg(300, 2, { quieto: true }).includes('<animate')).toBe(false)
})

test('el tzolkin da el dia sagrado maya de la fecha UTC', () => {
  expect(tzolkin(Date.UTC(2012, 11, 21)).texto).toBe('4 Ajaw')
  expect(tzolkin(Date.UTC(2012, 11, 22)).texto).toBe('5 Imix')
  expect(tzolkin(Date.UTC(2026, 9, 5)).texto).toBe("9 Kib'")
  expect(tzolkin(Number('x')).texto.length).toBeGreaterThan(0)
})
