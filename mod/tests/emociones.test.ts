import { expect, test } from 'claude-code/testing'

import {
  CONCENTRADO_MS,
  DORMIR_MS,
  OCIO_PASO_MS,
  ROTACION_OCIO,
  SOSPECHA_MS,
  accesorioDelDia,
  decidirEmocion,
  emocionOcio,
  franjaHora,
  fueraDeHora,
  huevoDeHora,
  proximoCambioOcio,
} from '../hooks/emociones'

const MIN = 60000
const hora = (h: number, m = 0) => h * 60 + m

test('los tiempos valen lo que dice el plan (números fijos)', () => {
  expect(SOSPECHA_MS).toBe(10 * MIN)
  expect(CONCENTRADO_MS).toBe(3 * MIN)
  expect(OCIO_PASO_MS).toBe(2 * MIN)
  expect(DORMIR_MS).toBe(10 * MIN)
  expect(ROTACION_OCIO.join(',')).toBe('bostezo,estira,riega,diario,solitario,silba,guina,rollSafe')
})

test('un estado vacío es el café del ocio y nunca lanza', () => {
  expect(decidirEmocion({})).toEqual({ emocion: 'aburrido', grupo: 'ocio' })
  expect(decidirEmocion(undefined as never)).toEqual({ emocion: 'aburrido', grupo: 'ocio' })
  expect(decidirEmocion({ corriendo: Number.NaN, ocioMs: 'x' as never })).toEqual({ emocion: 'aburrido', grupo: 'ocio' })
})

test('la reacción vigente gana a todo, con su grupo', () => {
  const todo = { corriendo: 5, masLargoMs: SOSPECHA_MS + 1, molesto: true, cambiosSinGuardar: true, minutosDelDia: hora(12, 30) }
  expect(decidirEmocion({ ...todo, reaccion: 'ruge' })).toEqual({ emocion: 'ruge', grupo: 'malo' })
  expect(decidirEmocion({ ...todo, reaccion: 'panico' }).emocion).toBe('panico')
  expect(decidirEmocion({ ...todo, reaccion: 'frustrado' }).emocion).toBe('frustrado')
  expect(decidirEmocion({ ...todo, reaccion: 'chispazo' }).emocion).toBe('chispazo')
  expect(decidirEmocion({ ...todo, reaccion: 'festeja' })).toEqual({ emocion: 'festeja', grupo: 'bueno' })
  expect(decidirEmocion({ ...todo, reaccion: 'aplaude' }).emocion).toBe('aplaude')
  expect(decidirEmocion({ ...todo, reaccion: 'alivio' }).emocion).toBe('alivio')
  expect(decidirEmocion({ ...todo, reaccion: 'saluda' })).toEqual({ emocion: 'saluda', grupo: 'social' })
  expect(decidirEmocion({ ...todo, reaccion: 'sorpresa' }).emocion).toBe('sorpresa')
  // Nombres viejos que siguen valiendo.
  expect(decidirEmocion({ reaccion: 'guardado' }).emocion).toBe('orgullo')
  expect(decidirEmocion({ reaccion: 'salta' }).emocion).toBe('caceria')
  // Una reacción desconocida no cuenta.
  expect(decidirEmocion({ reaccion: 'toString' })).toEqual({ emocion: 'aburrido', grupo: 'ocio' })
})

test('trabajo: pensando, concentrado, tipea, multitarea y sospecha', () => {
  expect(decidirEmocion({ corriendo: 1, masLargoMs: 10000 }).emocion).toBe('pensando')
  expect(decidirEmocion({ corriendo: 1, masLargoMs: CONCENTRADO_MS + 1 }).emocion).toBe('concentrado')
  expect(decidirEmocion({ corriendo: 2 }).emocion).toBe('tipea')
  expect(decidirEmocion({ corriendo: 3 }).emocion).toBe('tipea')
  expect(decidirEmocion({ corriendo: 4 }).emocion).toBe('multitarea')
  expect(decidirEmocion({ corriendo: 5 }).emocion).toBe('multitarea')
  expect(decidirEmocion({ corriendo: 6 }).emocion).toBe('doge')
  expect(decidirEmocion({ corriendo: 9, masLargoMs: SOSPECHA_MS + 1 }).emocion).toBe('sospecha')
  expect(decidirEmocion({ corriendo: 1, cambiosSinGuardar: true }).emocion).toBe('sospecha')
  // Trabajar le gana al enojo y a la hora del día.
  expect(decidirEmocion({ corriendo: 1, molesto: true, minutosDelDia: hora(12) })).toEqual({ emocion: 'pensando', grupo: 'trabajo' })
})

test('molesto, después cambios sin guardar (Dos botones), avisos del esquema (paloma), la hora y por último el ocio', () => {
  expect(decidirEmocion({ molesto: true, cambiosSinGuardar: true, minutosDelDia: hora(12) }).emocion).toBe('molesto')
  expect(decidirEmocion({ cambiosSinGuardar: true, minutosDelDia: hora(12) })).toEqual({ emocion: 'dosBotones', grupo: 'cambios' })
  expect(decidirEmocion({ avisosEsquema: true, minutosDelDia: hora(12) })).toEqual({ emocion: 'paloma', grupo: 'esquema' })
  expect(decidirEmocion({ minutosDelDia: hora(12, 45), ocioMs: DORMIR_MS * 3 })).toEqual({ emocion: 'hambre', grupo: 'hora' })
})

test('el día: arranque, café, chivito, siesta, mate y «me voy»; los lunes a la mañana, «Ah, otra vez»', () => {
  expect(franjaHora(hora(7, 59))).toBe(null)
  expect(franjaHora(hora(8))?.emocion).toBe('arranque')
  expect(franjaHora(hora(8, 15))?.emocion).toBe('manana')
  expect(franjaHora(hora(9, 59))?.emocion).toBe('manana')
  expect(franjaHora(hora(9, 30), 1)?.emocion).toBe('otraVez')
  expect(franjaHora(hora(10))).toBe(null)
  expect(franjaHora(hora(12, 29))).toBe(null)
  expect(franjaHora(hora(12, 30))?.emocion).toBe('hambre')
  expect(franjaHora(hora(13, 29))?.emocion).toBe('hambre')
  expect(franjaHora(hora(14))?.emocion).toBe('siesta')
  expect(franjaHora(hora(15))).toBe(null)
  expect(franjaHora(hora(16, 30))?.emocion).toBe('mate')
  expect(franjaHora(hora(17, 15))).toBe(null)
  expect(franjaHora(hora(17, 30))?.emocion).toBe('casa')
  expect(franjaHora(hora(17, 30))?.frase).toBe('Y en un rato me voy.')
  expect(franjaHora(hora(18))).toBe(null)
  expect(franjaHora(undefined)).toBe(null)
  // Sin hora conocida no hay emoción de la hora.
  expect(decidirEmocion({ ocioMs: 0 }).grupo).toBe('ocio')
})

test('fuera de hora: apagado antes de las 8, desde las 18 y el fin de semana; con agentes, modo zombi', () => {
  expect(fueraDeHora(hora(7, 59), 3)).toBe(true)
  expect(fueraDeHora(hora(8), 3)).toBe(false)
  expect(fueraDeHora(hora(17, 59), 3)).toBe(false)
  expect(fueraDeHora(hora(18), 3)).toBe(true)
  expect(fueraDeHora(hora(11), 0)).toBe(true)
  expect(fueraDeHora(hora(11), 6)).toBe(true)
  expect(fueraDeHora(undefined)).toBe(false)
  expect(decidirEmocion({ minutosDelDia: hora(19), diaSemana: 3 })).toEqual({ emocion: 'apagado', grupo: 'apagado' })
  expect(decidirEmocion({ minutosDelDia: hora(11), diaSemana: 6 }).emocion).toBe('apagado')
  expect(decidirEmocion({ minutosDelDia: hora(19), diaSemana: 3, corriendo: 2 })).toEqual({ emocion: 'zombi', grupo: 'trabajo' })
  // Lo que pide atención gana al apagado; las reacciones también.
  expect(decidirEmocion({ minutosDelDia: hora(19), diaSemana: 3, cambiosSinGuardar: true }).emocion).toBe('dosBotones')
  expect(decidirEmocion({ minutosDelDia: hora(19), diaSemana: 3, reaccion: 'ruge' }).emocion).toBe('ruge')
})

test('huevos de pascua por hora y accesorios por fecha', () => {
  expect(huevoDeHora(hora(16, 4))).toBe('noEncontrado')
  expect(huevoDeHora(hora(16, 5))).toBe(null)
  expect(huevoDeHora(hora(10, 2), 1)).toBe('rickroll')
  expect(huevoDeHora(hora(10, 2), 2)).toBe(null)
  expect(decidirEmocion({ minutosDelDia: hora(16, 4), diaSemana: 3 })).toEqual({ emocion: 'noEncontrado', grupo: 'huevo' })
  expect(decidirEmocion({ minutosDelDia: hora(16, 4), diaSemana: 3, corriendo: 1 }).grupo).toBe('trabajo')
  expect(accesorioDelDia({ mes: 10, diaMes: 31 })).toBe('calabaza')
  expect(accesorioDelDia({ mes: 12, diaMes: 3 })).toBe('gorro')
  expect(accesorioDelDia({ mes: 8, diaMes: 25 })).toBe('sol')
  expect(accesorioDelDia({ mes: 9, diaMes: 13, diaDelAnio: 256 })).toBe('dia256')
  expect(accesorioDelDia({ mes: 3, diaMes: 6, diaSemana: 5, minutosDelDia: hora(16) })).toBe('disco')
  expect(accesorioDelDia({ mes: 3, diaMes: 6, diaSemana: 5, minutosDelDia: hora(15) })).toBe('')
  expect(accesorioDelDia({ mes: 3, diaMes: 6, pct: 100 })).toBe('arcoiris')
  expect(accesorioDelDia({})).toBe('')
})

test('memes guardados como reacción: cada uno con su emoción', () => {
  expect(decidirEmocion({ reaccion: 'pikachu' })).toEqual({ emocion: 'sorpresa', grupo: 'malo' })
  for (const r of ['estoEstaBien', 'otraVez', 'distraido', 'successKid', 'stonks', 'notStonks', 'drake', 'masDe9000']) {
    expect(decidirEmocion({ reaccion: r }).emocion).toBe(r)
  }
})

test('ocio: café los primeros 2 minutos, rota cada 2 sin repetir y a los 10 duerme', () => {
  for (const semilla of [0, 1, 5, 123456]) {
    expect(emocionOcio(0, semilla)).toBe('aburrido')
    expect(emocionOcio(OCIO_PASO_MS - 1, semilla)).toBe('aburrido')
    let antes = 'aburrido'
    for (let paso = 1; paso < 5; paso++) {
      const e = emocionOcio(paso * OCIO_PASO_MS + 500, semilla)
      expect(ROTACION_OCIO.includes(e)).toBe(true)
      expect(e === antes).toBe(false)
      // Dentro del mismo paso no cambia (nada de parpadeo).
      expect(emocionOcio(paso * OCIO_PASO_MS + OCIO_PASO_MS - 1, semilla)).toBe(e)
      antes = e
    }
    expect(emocionOcio(DORMIR_MS, semilla)).toBe('dormido')
    expect(emocionOcio(DORMIR_MS * 50, semilla)).toBe('dormido')
  }
  // Semillas distintas dan rotaciones distintas.
  expect(emocionOcio(OCIO_PASO_MS, 0) === emocionOcio(OCIO_PASO_MS, 1)).toBe(false)
  // El guiño está en la rotación del ocio.
  const vistos = new Set<string>()
  for (let s = 0; s < 8; s++) vistos.add(emocionOcio(OCIO_PASO_MS, s))
  expect(vistos.has('guina')).toBe(true)
})

test('próximo cambio del ocio: el borde del paso, y null cuando ya duerme', () => {
  expect(proximoCambioOcio(0)).toBe(OCIO_PASO_MS)
  expect(proximoCambioOcio(OCIO_PASO_MS + 1)).toBe(2 * OCIO_PASO_MS)
  expect(proximoCambioOcio(DORMIR_MS - 1)).toBe(DORMIR_MS)
  expect(proximoCambioOcio(DORMIR_MS)).toBe(null)
})

test('uso de las 5 horas al 80 % o más: Hide the Pain Harold con grupo uso, salvo reacción, agentes o menos uso', () => {
  expect(decidirEmocion({ usoCincoHoras: 85, ocioMs: 0 })).toEqual({ emocion: 'harold', grupo: 'uso' })
  expect(decidirEmocion({ usoCincoHoras: 80 }).grupo).toBe('uso')
  expect(decidirEmocion({ usoCincoHoras: 85, reaccion: 'ruge' })).toEqual({ emocion: 'ruge', grupo: 'malo' })
  expect(decidirEmocion({ usoCincoHoras: 85, corriendo: 1, masLargoMs: 1000 }).grupo).toBe('trabajo')
  expect(decidirEmocion({ usoCincoHoras: 85, molesto: true }).grupo).toBe('molesto')
  expect(decidirEmocion({ usoCincoHoras: 50, ocioMs: 0 }).grupo).not.toBe('uso')
  expect(decidirEmocion({ usoCincoHoras: 79.9 }).grupo).not.toBe('uso')
})
