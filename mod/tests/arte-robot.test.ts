import { expect, test } from 'claude-code/testing'

import { EMOCIONES, EMOCION_ALT, caraRobotSvg } from '../hooks/arte-robot'

const esSeguro = (s: string) =>
  s.startsWith('<svg') && s.endsWith('</svg>') && s.length < 120000 && !/<script|on\w+=|href=/i.test(s)

// Tamaño del lienzo de caraJaguarSvg medido una vez (34 x 26 unidades; con marco 42 x 34).
const JAGUAR: Record<string, string> = {
  '3': 'width="102" height="78" viewBox="0 0 102 78"',
  '5': 'width="170" height="130" viewBox="0 0 170 130"',
}
const JAGUAR_MARCO: Record<string, string> = {
  '3': 'width="126" height="102" viewBox="0 0 126 102"',
  '5': 'width="210" height="170" viewBox="0 0 210 170"',
}

// Las 31 emociones del plan, escritas a mano: las 9 de siempre primero y en el mismo orden.
const LAS_31 =
  'aburrido,dormido,pensando,caceria,sospecha,ruge,molesto,bufido,contento,' +
  'bostezo,estira,riega,diario,solitario,silba,guina,manana,hambre,casa,concentrado,tipea,multitarea,' +
  'festeja,aplaude,orgullo,alivio,panico,frustrado,chispazo,saluda,sorpresa'

test('las 31 claves: las 9 del jaguar primero y en el mismo orden, todas con texto alternativo', () => {
  expect(EMOCIONES.join(',')).toBe(LAS_31)
  for (const e of EMOCIONES) expect(typeof EMOCION_ALT[e] === 'string' && EMOCION_ALT[e].length > 0).toBe(true)
  expect(new Set(Object.values(EMOCION_ALT)).size).toBe(31)
  expect(EMOCION_ALT.aburrido).toBe('tomando café')
  expect(EMOCION_ALT.hambre).toBe('con hambre')
  expect(EMOCION_ALT.casa).toBe('pensando en irse a casa')
})

test('el guiño está en el ocio, en el orgullo y en el saludo (y no hace falta un clic)', () => {
  // Las tres llevan un cuadro con guiño, así que tienen al menos 3 cuadros animados y son distintas entre sí.
  const tres = ['guina', 'orgullo', 'saluda'].map(e => caraRobotSvg(e, 1))
  for (const s of tres) {
    expect(s.includes('<animate')).toBe(true)
    expect(s.split('<animate').length - 1 >= 3).toBe(true)
  }
  expect(new Set(tres).size).toBe(3)
})

test('las 31 emociones dan un SVG seguro y animado, y cada una es distinta', () => {
  const vistos = new Set<string>()
  for (const e of EMOCIONES) {
    const s = caraRobotSvg(e, 3)
    expect(esSeguro(s)).toBe(true)
    expect(s.includes('<animate')).toBe(true)
    expect(s.includes('xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(s.includes('http')).toBe(true)
    vistos.add(s)
  }
  expect(vistos.size).toBe(31)
  const quietos = new Set<string>()
  for (const e of EMOCIONES) quietos.add(caraRobotSvg(e, 3, { quieto: true }))
  expect(quietos.size).toBe(31)
})

test('sin referencias externas más que el espacio de nombres', () => {
  for (const e of EMOCIONES) {
    const s = caraRobotSvg(e, 8, { marco: true, fondo: '#112233' })
    expect(esSeguro(s)).toBe(true)
    expect(s.replace('xmlns="http://www.w3.org/2000/svg"', '').includes('http')).toBe(false)
    expect(s.length < 120000).toBe(true)
  }
})

test('quieto no trae animaciones ni efectos', () => {
  for (const e of EMOCIONES) {
    const q = caraRobotSvg(e, 3, { quieto: true })
    expect(esSeguro(q)).toBe(true)
    expect(/<animate|<set/.test(q)).toBe(false)
  }
})

test('dormirEn agrega el cambio a dormido, y 0 o menos devuelve el robot dormido', () => {
  const d = caraRobotSvg('aburrido', 3, { dormirEn: 30 })
  expect(d.includes('<set')).toBe(true)
  expect(d.includes('begin="30s"')).toBe(true)
  expect(caraRobotSvg('aburrido', 3, { dormirEn: 0 })).toBe(caraRobotSvg('dormido', 3))
  expect(caraRobotSvg('aburrido', 3, { dormirEn: -5, quieto: true })).toBe(caraRobotSvg('dormido', 3, { quieto: true }))
  expect(caraRobotSvg('contento', 3, { dormirEn: 30 })).toBe(caraRobotSvg('contento', 3))
})

test('una emoción desconocida se ve como aburrido', () => {
  expect(caraRobotSvg('xyz', 3)).toBe(caraRobotSvg('aburrido', 3))
})

test('la escala se acota entre 1 y 8 y, si no es un número, vale 3', () => {
  expect(caraRobotSvg('aburrido', 100)).toBe(caraRobotSvg('aburrido', 8))
  expect(caraRobotSvg('aburrido', 0)).toBe(caraRobotSvg('aburrido', 1))
  expect(caraRobotSvg('aburrido', Number.NaN)).toBe(caraRobotSvg('aburrido', 3))
})

test('el lienzo mide lo mismo que el del jaguar, sin marco y con marco', () => {
  for (const esc of [3, 5]) {
    for (const e of EMOCIONES) {
      expect(caraRobotSvg(e, esc).includes(JAGUAR[String(esc)])).toBe(true)
      expect(caraRobotSvg(e, esc, { marco: true }).includes(JAGUAR_MARCO[String(esc)])).toBe(true)
    }
  }
})

test('el marco convive con quieto y con dormirEn, y la paleta trae el beige y la pantalla', () => {
  expect(caraRobotSvg('ruge', 3, { marco: true, quieto: true }).includes('<animate')).toBe(false)
  expect(caraRobotSvg('aburrido', 3, { marco: true, dormirEn: 20 }).includes('begin="20s"')).toBe(true)
  const m = caraRobotSvg('contento', 3, { marco: true })
  expect(m.includes('translate(12 12)')).toBe(true)
  expect(m.includes('#E8DCC0')).toBe(true)
  expect(m.includes('#3FAE6A')).toBe(true)
  expect(caraRobotSvg('pensando', 3).includes('#9FE3C8')).toBe(true)
})
