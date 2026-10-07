import { expect, test } from 'claude-code/testing'

import { ACCESORIOS, EMOCIONES, EMOCION_ALT, caraRobotSvg, robotAscii } from '../hooks/arte-robot-terminal'
import { CELDA_H, CELDA_W, carpetaGrilla, celdaMasTerminalSvg, celdaTerminalSvg, escenaAlto, escenaOficinaSvg, porFilaMonitor } from '../hooks/arte-monitor'
import { bordeMesaSvg, disquetesSvg, escritorioSvg, tecladoSvg } from '../hooks/arte-escritorio'
import { contadorSvg, diosSvg, fechaSvg, glifoSvg } from '../hooks/arte-insignias-terminal'
import { anchoTexto, cuadros, grilla, texto } from '../hooks/arte-fosforo'

const seguro = (s: string) => s.startsWith('<svg') && s.endsWith('</svg>') && !/<script|\son\w+=|href=/i.test(s) && s.length < 131072
const ancho = (s: string) => Number(/width="(\d+)"/.exec(s)?.[1] ?? 0)

test('el robot: 51 emociones (las 31 de la oficina primero), todas con texto alternativo distinto', () => {
  expect(EMOCIONES.length).toBe(51)
  expect(EMOCIONES.slice(0, 9).join(',')).toBe('aburrido,dormido,pensando,caceria,sospecha,ruge,molesto,bufido,contento')
  for (const e of ['arranque', 'siesta', 'mate', 'apagado', 'zombi', 'noEncontrado', 'estoEstaBien', 'doge', 'harold', 'rickroll']) {
    expect(EMOCIONES.includes(e)).toBe(true)
  }
  for (const e of EMOCIONES) expect((EMOCION_ALT[e] ?? '').length > 0).toBe(true)
  expect(new Set(EMOCIONES.map(e => EMOCION_ALT[e])).size).toBe(EMOCIONES.length)
})

test('cada emoción da un SVG seguro, liviano y animado; quieto sin animación', () => {
  const vistos = new Set<string>()
  for (const e of EMOCIONES) {
    const s = caraRobotSvg(e, 3)
    expect(seguro(s)).toBe(true)
    expect(s.length < 40000).toBe(true)
    expect(ancho(s)).toBe(132)
    expect(s.includes('<animate')).toBe(true)
    expect(caraRobotSvg(e, 3, { quieto: true }).includes('<animate')).toBe(false)
    vistos.add(s)
  }
  expect(vistos.size).toBe(EMOCIONES.length)
  // Una emoción desconocida es el café.
  expect(caraRobotSvg('no-existe', 3)).toBe(caraRobotSvg('aburrido', 3))
})

test('la pantallita del pecho: barra con datos del proyecto, latido sin datos; accesorios por fecha', () => {
  const sin = caraRobotSvg('aburrido', 3, { quieto: true })
  const con = caraRobotSvg('aburrido', 3, { quieto: true, progreso: 50 })
  const lleno = caraRobotSvg('aburrido', 3, { quieto: true, progreso: 100 })
  expect(new Set([sin, con, lleno]).size).toBe(3)
  for (const a of ACCESORIOS) expect(caraRobotSvg('aburrido', 3, { quieto: true, accesorio: a }) === sin).toBe(false)
  expect(caraRobotSvg('aburrido', 3, { quieto: true, accesorio: 'raro' })).toBe(sin)
})

test('el robot en ASCII para la terminal: 6 líneas, cara de muerto apagado y barra del proyecto', () => {
  const r = robotAscii('aburrido', 50)
  expect(r.length).toBe(6)
  expect(r[5]).toBe(' [███░░░]')
  expect(robotAscii('aburrido')[5]).toBe(' [~~~~~~]')
  expect(robotAscii('apagado')[2].includes('x  x')).toBe(true)
  expect(robotAscii('noEncontrado')[1].includes('404')).toBe(true)
})

test('celdas de agentes: 66 × 72, el color del equipo, [OK] al salir y SEGV al fallar', () => {
  for (const fase of ['entra', 'juega', 'sale', 'explota']) {
    const s = celdaTerminalSvg({ equipo: 'research', color: '#5aa9e6', fase, etiqueta: 'T-9', alt: 'Agente T-9' })
    expect(seguro(s)).toBe(true)
    expect(ancho(s)).toBe(CELDA_W * 3)
    expect(s.includes(`height="${CELDA_H * 3}"`)).toBe(true)
    expect(s.includes('#5aa9e6')).toBe(true)
  }
  expect(celdaTerminalSvg({ equipo: 'datos', color: '#2cc6d0', fase: 'juega', quieto: true }).includes('<animate')).toBe(false)
  expect(ancho(celdaMasTerminalSvg(7))).toBe(66)
  // Equipo desconocido: el ícono de base.
  expect(seguro(celdaTerminalSvg({ equipo: 'nuevo', fase: 'juega' }))).toBe(true)
  expect(carpetaGrilla('base', '#8a93a0', 'base', true).length).toBe(17)
})

test('el monitor: mide el ancho pedido, lleva al robot, a los agentes, carpetas o el editor, y no se pasa de peso', () => {
  const cara = caraRobotSvg('tipea', 3)
  const celda = celdaTerminalSvg({ equipo: 'dev-a1', color: '#f08a24', fase: 'juega', etiqueta: 'T-1' })
  for (const w of [378, 640, 1200]) {
    const s = escenaOficinaSvg({ ancho: w, cara, celdas: Array.from({ length: 20 }, () => ({ svg: celda })), hora: '10:15', estado: '[3 AG] [58%]' })
    expect(seguro(s)).toBe(true)
    expect(ancho(s)).toBe(w)
  }
  expect(porFilaMonitor(378)).toBe(3)
  expect(escenaAlto(378, 4)).toBeGreaterThan(escenaAlto(378, 0))
  const vacio = escenaOficinaSvg({ ancho: 378, cara, progreso: 58 })
  expect(vacio.includes('<animate')).toBe(true)
  expect(escenaOficinaSvg({ ancho: 378, cara: caraRobotSvg('tipea', 3, { quieto: true }), quieto: true }).includes('<animate')).toBe(false)
  const carpetas = escenaOficinaSvg({ ancho: 378, cara, carpetas: [{ equipo: 'base', color: '#8a93a0', nombre: 'base', aviso: true }] })
  expect(carpetas.includes('#ffb43a')).toBe(true) // el triángulo ámbar del aviso
  const editor = escenaOficinaSvg({ ancho: 378, cara, lineas: ['---', 'NAME: X', '## ROL'] })
  expect(seguro(editor)).toBe(true)
  // Apagado: la luz del monitor pasa a ámbar.
  expect(escenaOficinaSvg({ ancho: 378, cara, apagado: true, quieto: true }).includes('#ffb43a')).toBe(true)
  expect(escenaOficinaSvg({ ancho: 378, cara, quieto: true }).includes('#ffb43a')).toBe(false)
})

test('teclado, escritorio, borde, disquetes, íconos, contador y fecha', () => {
  const teclas = tecladoSvg(378, { tipeando: true })
  expect(seguro(teclas) && teclas.includes('<animate')).toBe(true)
  expect(tecladoSvg(378, { tipeando: true, quieto: true }).includes('<animate')).toBe(false)
  for (const alto of [60, 96, 140]) expect(seguro(escritorioSvg(378, alto, { activo: true }))).toBe(true)
  expect(ancho(bordeMesaSvg(378))).toBe(378)
  expect(seguro(disquetesSvg(378, ['#8a93a0', '#5aa9e6']))).toBe(true)
  for (const tipo of ['escriba', 'vidente', 'guardian', 'curandero', 'pm', 'estratega']) expect(seguro(glifoSvg(tipo, 'research', 2))).toBe(true)
  expect(diosSvg('datos', 2, ['#2cc6d0', '#16777d']).includes('Placa del equipo datos')).toBe(true)
  expect(contadorSvg(5, 2).includes('5 en el contador')).toBe(true)
  expect(fechaSvg(7, 10).includes('07/10')).toBe(true)
})

test('motor: texto de 3 × 5 y cuadros que guardan solo lo que cambia', () => {
  expect(anchoTexto('HOLA')).toBe(15)
  const g = grilla(20, 7)
  expect(texto(g, 0, 0, 'ok', '#5ef27f')).toBe(7)
  const a = grilla(4, 4)
  const b = grilla(4, 4)
  b[0][0] = '#ffffff'
  const animado = cuadros([[a, 1], [b, 1]], 3, { vacio: '#000000' })
  expect(animado.includes('<animate')).toBe(true)
  expect(cuadros([[a, 1], [b, 1]], 3, { quieto: true }).includes('<animate')).toBe(false)
})
