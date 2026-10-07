import { expect, test } from 'claude-code/testing'

import {
  barraProyecto,
  duracionAproximada,
  estimar,
  etiquetaProyecto,
  fraseProyecto,
  leerTarjeta,
  listaTodo,
  nombreProyecto,
  progresoDeTareas,
  progresoDeTarjetas,
  progresoProyecto,
  tareaActualizada,
  tareaCreada,
} from '../hooks/proyecto'
import type { TareaSesion, TarjetaProyecto } from '../hooks/proyecto'

const MIN = 60000

test('tareas de la sesión: se crean, cambian de estado, se borran y la completada guarda su cierre', () => {
  let t: TareaSesion[] = []
  t = tareaCreada(t, '1', 'T-1 · panel')
  t = tareaCreada(t, '2', 'T-2 · burbuja')
  t = tareaCreada(t, '', 'sin id')
  expect(t.map(x => x.id)).toEqual(['1', '2'])
  t = tareaActualizada(t, '1', { estado: 'in_progress' }, 100)
  expect(t[0].estado).toBe('in_progress')
  t = tareaActualizada(t, '1', { estado: 'completed' }, 200)
  expect(t[0]).toEqual({ id: '1', titulo: 'T-1 · panel', estado: 'completed', cerrada: 200 })
  // Volver a completar no mueve el cierre; reabrir lo borra.
  expect(tareaActualizada(t, '1', { estado: 'completed' }, 999)[0].cerrada).toBe(200)
  expect(tareaActualizada(t, '1', { estado: 'pending' }, 999)[0].cerrada).toBe(undefined)
  t = tareaActualizada(t, '2', { estado: 'deleted' }, 300)
  expect(t.length).toBe(1)
  // Un TaskUpdate de una tarea que no se vio crear la suma.
  expect(tareaActualizada([], '9', { estado: 'completed', titulo: 'otra' }, 5).length).toBe(1)
})

test('TodoWrite reemplaza la lista y conserva el cierre de las que ya estaban completas', () => {
  const antes = listaTodo([], [{ content: 'A', status: 'completed' }, { content: 'B', status: 'pending' }], 10)
  expect(antes.map(t => t.cerrada)).toEqual([10, undefined])
  const despues = listaTodo(antes, [{ content: 'A', status: 'completed' }, { content: 'B', status: 'completed' }, { content: 'C', status: 'raro' }], 50)
  expect(despues.map(t => [t.titulo, t.cerrada])).toEqual([['A', 10], ['B', 50]])
  expect(listaTodo(antes, 'no es una lista', 1)).toBe(antes)
})

test('tarjetas: lee estado, id, título y motivo (frontmatter o lista), con o sin tildes', () => {
  expect(leerTarjeta('---\nid: T-70\ntitulo: Panel de uso\nestado: en curso\n---\n', 'T-70.md')).toEqual({ id: 'T-70', titulo: 'Panel de uso', estado: 'en curso' })
  expect(leerTarjeta('# Arreglar el login\n- **Estado:** Hecha\n', 'C:\\proy\\tarjetas\\APP-3.md')).toEqual({ id: 'APP-3', titulo: 'Arreglar el login', estado: 'hecha' })
  expect(leerTarjeta('estado: frenada\nmotivo: falta la clave\n', 'T-7.md')).toEqual({ id: 'T-7', titulo: 'T-7', estado: 'frenada', motivo: 'falta la clave' })
  expect(leerTarjeta('estado: aprobada', 'a.md')?.estado).toBe('aprobada')
  expect(leerTarjeta('estado: Propuesta', 'a.md')?.estado).toBe('propuesta')
  expect(leerTarjeta('estado: quién sabe', 'a.md')).toBe(null)
  expect(leerTarjeta('sin estado', 'a.md')).toBe(null)
})

test('progreso: tareas primero, si no tarjetas, y sin datos null (no inventa)', () => {
  const tareas: TareaSesion[] = [
    { id: '1', titulo: 'T-1 · a', estado: 'completed', cerrada: 0 },
    { id: '2', titulo: 'T-2 · b', estado: 'in_progress' },
    { id: '3', titulo: 'T-3 · c', estado: 'pending' },
    { id: '4', titulo: 'T-4 · d', estado: 'pending' },
  ]
  const p = progresoDeTareas(tareas)!
  expect([p.fuente, p.total, p.hechas, p.pct, p.faltan]).toEqual(['tareas', 4, 1, 25, 3])
  expect(p.enCurso).toEqual(['T-2'])
  expect(p.siguiente).toBe('T-3')
  const tarjetas: TarjetaProyecto[] = [
    { id: 'T-1', titulo: 'a', estado: 'hecha' },
    { id: 'T-2', titulo: 'b', estado: 'frenada' },
    { id: 'T-3', titulo: 'c', estado: 'aprobada' },
  ]
  const q = progresoDeTarjetas(tarjetas)!
  expect([q.fuente, q.pct, q.faltan, q.frenadas.join(), q.siguiente]).toEqual(['tarjetas', 33, 2, 'T-2', 'T-3'])
  expect(progresoProyecto(tareas, tarjetas)?.fuente).toBe('tareas')
  expect(progresoProyecto([], tarjetas)?.fuente).toBe('tarjetas')
  expect(progresoProyecto([], [])).toBe(null)
})

test('ritmo: con 2 cierres o más estima lo que falta; con menos, nada', () => {
  expect(estimar([0], 3)).toBe(undefined)
  expect(estimar([0, 10 * MIN, 20 * MIN], 3)).toBe(30 * MIN)
  expect(estimar([0, 10 * MIN], 0)).toBe(undefined)
  expect(duracionAproximada(70 * MIN)).toBe('~1 h 10 min')
  expect(duracionAproximada(2 * MIN)).toBe('~5 min')
  expect(duracionAproximada(120 * MIN)).toBe('~2 h')
})

test('la frase del robot: barra, %, cuánto falta, frenadas, ritmo y 100 %', () => {
  expect(barraProyecto(58)).toBe('▕██████░░░░▏')
  expect(barraProyecto(0)).toBe('▕░░░░░░░░░░▏')
  expect(barraProyecto(150)).toBe('▕██████████▏')
  const tareas: TareaSesion[] = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    titulo: `T-${i}`,
    estado: i < 7 ? 'completed' : 'pending',
    ...(i < 7 ? { cerrada: i * 10 * MIN } : {}),
  }))
  const frase = fraseProyecto(progresoDeTareas(tareas), 'mi-app')
  expect(frase).toBe('Proyecto mi-app ▕██████░░░░▏ 58 %: faltan 5 de 12 tareas (42 %). A este ritmo, ~50 min.')
  const conFrenada = fraseProyecto(progresoDeTarjetas([{ id: 'T-1', titulo: '', estado: 'hecha' }, { id: 'T-7', titulo: '', estado: 'frenada' }]))
  expect(conFrenada).toBe('Proyecto ▕█████░░░░░▏ 50 %: faltan 1 de 2 tarjetas (50 %). T-7 está frenada y espera por vos.')
  expect(fraseProyecto(progresoDeTarjetas([{ id: 'T-1', titulo: '', estado: 'hecha' }]))).toBe('¡Proyecto al 100 %! 1 de 1 tarjeta. Lentes puestos.')
  expect(fraseProyecto(null)).toBe('No veo tareas ni tarjetas de este proyecto: cuando haya, te digo cuánto falta.')
  expect(etiquetaProyecto(null)).toBe('[--%]')
  expect(nombreProyecto('C:\\Users\\yo\\mi-app\\')).toBe('mi-app')
  expect(nombreProyecto('')).toBe('')
})
