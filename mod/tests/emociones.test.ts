import { expect, test } from 'claude-code/testing'

import {
  CONCENTRADO_MS,
  DORMIR_MS,
  OCIO_PASO_MS,
  ROTACION_OCIO,
  SOSPECHA_MS,
  decidirEmocion,
  emocionOcio,
  franjaHora,
  proximoCambioOcio,
} from '../hooks/emociones'

const MIN = 60000
const hora = (h: number, m = 0) => h * 60 + m

test('los tiempos valen lo que dice el plan (números fijos)', () => {
  expect(SOSPECHA_MS).toBe(10 * MIN)
  expect(CONCENTRADO_MS).toBe(3 * MIN)
  expect(OCIO_PASO_MS).toBe(2 * MIN)
  expect(DORMIR_MS).toBe(10 * MIN)
  expect(ROTACION_OCIO.join(',')).toBe('bostezo,estira,riega,diario,solitario,silba,guina')
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
  expect(decidirEmocion({ corriendo: 9, masLargoMs: SOSPECHA_MS + 1 }).emocion).toBe('sospecha')
  expect(decidirEmocion({ corriendo: 1, cambiosSinGuardar: true }).emocion).toBe('sospecha')
  // Trabajar le gana al enojo y a la hora del día.
  expect(decidirEmocion({ corriendo: 1, molesto: true, minutosDelDia: hora(12) })).toEqual({ emocion: 'pensando', grupo: 'trabajo' })
})

test('molesto, después cambios sin guardar, después la hora y por último el ocio', () => {
  expect(decidirEmocion({ molesto: true, cambiosSinGuardar: true, minutosDelDia: hora(12) }).emocion).toBe('molesto')
  expect(decidirEmocion({ cambiosSinGuardar: true, minutosDelDia: hora(12) })).toEqual({ emocion: 'sospecha', grupo: 'cambios' })
  expect(decidirEmocion({ minutosDelDia: hora(12), ocioMs: DORMIR_MS * 3 })).toEqual({ emocion: 'hambre', grupo: 'hora' })
})

test('hora del día: café de la mañana, hambre al mediodía y casi la hora de irse desde las 17:30', () => {
  expect(franjaHora(hora(7, 59))).toBe(null)
  expect(franjaHora(hora(8))?.emocion).toBe('manana')
  expect(franjaHora(hora(9, 59))?.emocion).toBe('manana')
  expect(franjaHora(hora(10))).toBe(null)
  expect(franjaHora(hora(11, 59))).toBe(null)
  expect(franjaHora(hora(12))?.emocion).toBe('hambre')
  expect(franjaHora(hora(13, 59))?.emocion).toBe('hambre')
  expect(franjaHora(hora(14))).toBe(null)
  expect(franjaHora(hora(17, 29))).toBe(null)
  expect(franjaHora(hora(17, 30))?.emocion).toBe('casa')
  expect(franjaHora(hora(17, 30))?.frase).toBe('Y en un rato me voy a casa.')
  expect(franjaHora(hora(12, 15))?.frase).toBe('Y me está dando hambre.')
  expect(franjaHora(hora(18, 59))?.emocion).toBe('casa')
  expect(franjaHora(hora(19))).toBe(null)
  expect(franjaHora(hora(0, 16))).toBe(null)
  expect(franjaHora(hora(21, 16))).toBe(null)
  expect(franjaHora(undefined)).toBe(null)
  // Sin hora conocida no hay emoción de la hora.
  expect(decidirEmocion({ ocioMs: 0 }).grupo).toBe('ocio')
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
  for (let s = 0; s < 7; s++) vistos.add(emocionOcio(OCIO_PASO_MS, s))
  expect(vistos.has('guina')).toBe(true)
})

test('próximo cambio del ocio: el borde del paso, y null cuando ya duerme', () => {
  expect(proximoCambioOcio(0)).toBe(OCIO_PASO_MS)
  expect(proximoCambioOcio(OCIO_PASO_MS + 1)).toBe(2 * OCIO_PASO_MS)
  expect(proximoCambioOcio(DORMIR_MS - 1)).toBe(DORMIR_MS)
  expect(proximoCambioOcio(DORMIR_MS)).toBe(null)
})

test('uso de las 5 horas al 80 % o más: sospecha con grupo uso, salvo reacción, agentes o menos uso', () => {
  expect(decidirEmocion({ usoCincoHoras: 85, ocioMs: 0 })).toEqual({ emocion: 'sospecha', grupo: 'uso' })
  expect(decidirEmocion({ usoCincoHoras: 80 }).grupo).toBe('uso')
  expect(decidirEmocion({ usoCincoHoras: 85, reaccion: 'ruge' })).toEqual({ emocion: 'ruge', grupo: 'malo' })
  expect(decidirEmocion({ usoCincoHoras: 85, corriendo: 1, masLargoMs: 1000 }).grupo).toBe('trabajo')
  expect(decidirEmocion({ usoCincoHoras: 85, molesto: true }).grupo).toBe('molesto')
  expect(decidirEmocion({ usoCincoHoras: 50, ocioMs: 0 }).grupo).not.toBe('uso')
  expect(decidirEmocion({ usoCincoHoras: 79.9 }).grupo).not.toBe('uso')
})
