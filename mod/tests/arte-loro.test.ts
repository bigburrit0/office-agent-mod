import { expect, test } from 'claude-code/testing'

import { EMOCIONES, EMOCION_ALT, caraRobotSvg, cuadrosDe, loroColores } from '../hooks/arte-loro'
import { EMOCIONES as EMOCIONES_ROBOT } from '../hooks/arte-robot'

const esSeguro = (s: string) =>
  s.startsWith('<svg') && s.endsWith('</svg>') && s.length < 120000 && !/<script|on\w+=|href=/i.test(s)

test('las 31 emociones del robot, en el mismo orden, todas con texto alternativo distinto', () => {
  expect(EMOCIONES.join(',')).toBe(EMOCIONES_ROBOT.join(','))
  for (const e of EMOCIONES) expect(typeof EMOCION_ALT[e] === 'string' && EMOCION_ALT[e].length > 0).toBe(true)
  expect(new Set(Object.values(EMOCION_ALT)).size).toBe(31)
  expect(EMOCION_ALT.aburrido).toBe('mirando el horizonte')
  expect(EMOCION_ALT.guina).toBe('guiñando con el ojo del parche')
})

test('las 31 dan un SVG seguro y animado, distinto entre sí, también quietas', () => {
  const animados = new Set<string>()
  const quietos = new Set<string>()
  for (const e of EMOCIONES) {
    const s = caraRobotSvg(e, 3)
    expect(esSeguro(s)).toBe(true)
    expect(s.includes('<animate')).toBe(true)
    animados.add(s)
    const q = caraRobotSvg(e, 3, { quieto: true })
    expect(esSeguro(q)).toBe(true)
    expect(/<animate|<set/.test(q)).toBe(false)
    quietos.add(q)
  }
  expect(animados.size).toBe(31)
  expect(quietos.size).toBe(31)
})

test('pesa poco: lo que no cambia entre cuadros se dibuja una sola vez', () => {
  for (const e of EMOCIONES) {
    const s = caraRobotSvg(e, 8, { marco: true, fondo: '#112233' })
    expect(esSeguro(s)).toBe(true)
    expect(s.replace('xmlns="http://www.w3.org/2000/svg"', '').includes('http')).toBe(false)
    expect(s.length < 60000).toBe(true)
  }
})

test('el guiño: levanta el parche y abajo hay un ojo sano', () => {
  const [primero] = cuadrosDe('guina')
  expect(primero[0].parche).toBe('levantado')
  const conParche = loroColores({})
  const levantado = loroColores({ parche: 'levantado', ojoParche: 'abierto' })
  // Donde estaba el parche ahora se ve el iris del ojo.
  expect(conParche[15][12]).not.toBe(levantado[15][12])
  expect(levantado.flat().filter(c => c === '#f2df8e').length > conParche.flat().filter(c => c === '#f2df8e').length).toBe(true)
})

test('dormirEn pasa de mirar el horizonte a dormir; 0 o menos devuelve el loro dormido', () => {
  const d = caraRobotSvg('aburrido', 3, { dormirEn: 30 })
  expect(d.includes('<set')).toBe(true)
  expect(d.includes('begin="30s"')).toBe(true)
  expect(caraRobotSvg('aburrido', 3, { dormirEn: 0 })).toBe(caraRobotSvg('dormido', 3))
  expect(caraRobotSvg('aburrido', 3, { dormirEn: -5, quieto: true })).toBe(caraRobotSvg('dormido', 3, { quieto: true }))
  expect(caraRobotSvg('contento', 3, { dormirEn: 30 })).toBe(caraRobotSvg('contento', 3))
})

test('una emoción desconocida se ve como aburrido, y la escala se acota entre 1 y 8', () => {
  expect(caraRobotSvg('xyz', 3)).toBe(caraRobotSvg('aburrido', 3))
  expect(caraRobotSvg('aburrido', 100)).toBe(caraRobotSvg('aburrido', 8))
  expect(caraRobotSvg('aburrido', 0)).toBe(caraRobotSvg('aburrido', 1))
  expect(caraRobotSvg('aburrido', Number.NaN)).toBe(caraRobotSvg('aburrido', 3))
})

test('el lienzo mide 42 x 34 (lo del robot con marco), con o sin marco, y el fondo es opcional', () => {
  for (const e of EMOCIONES) {
    expect(caraRobotSvg(e, 3).includes('width="126" height="102" viewBox="0 0 126 102"')).toBe(true)
    expect(caraRobotSvg(e, 3, { marco: true }).includes('width="126" height="102"')).toBe(true)
  }
  expect(caraRobotSvg('contento', 3, { fondo: '#1D1238' }).includes('<rect width="126" height="102" fill="#1D1238"/>')).toBe(true)
  expect(caraRobotSvg('contento', 3, { fondo: 'rojo' }).includes('<rect')).toBe(false)
})

test('la paleta del capitán: rojo guacamayo, sombrero de noche, oro y neón', () => {
  const s = caraRobotSvg('aburrido', 3, { quieto: true })
  for (const c of ['#e2283f', '#2b2142', '#f2b632', '#21e6c1', '#ff2e88']) expect(s.includes(c)).toBe(true)
})
