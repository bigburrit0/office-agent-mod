import { expect, mock, test } from 'claude-code/testing'

import { listarCatalogo, validarAgente } from '../hooks/catalogo'
import type { FsMin } from '../hooks/catalogo'
import { actividadDe } from '../hooks/arte-actividades'
import { KIT } from './kit-agentes'
import { PANES, PROPS, PANE, RAIZ_FALSA, abrirTodo, fsFalso, textosDe } from './ayuda-tablero'

// La compu del trabajo: los agentes del kit instalados en ~\.claude\agents (kit-agentes.ts se
// regenera con `node mod/tests/generar-kit-agentes.mjs` cuando cambia un agente del kit).

function fsMin(archivos: Map<string, string>): FsMin {
  const hijos = (dir: string) => {
    const pref = `${dir.replace(/\\+$/, '')}\\`
    const out = new Map<string, 'file' | 'dir'>()
    for (const r of archivos.keys()) {
      if (!r.startsWith(pref)) continue
      const resto = r.slice(pref.length)
      const c = resto.indexOf('\\')
      out.set(c < 0 ? resto : resto.slice(0, c), c < 0 ? 'file' : 'dir')
    }
    return out
  }
  return {
    list: async p => [...hijos(p)].map(([name, kind]) => ({ name, kind })),
    read: async p => archivos.get(p) ?? '',
    write: async (p, t) => void archivos.set(p, t),
    exists: async p => archivos.has(p) || hijos(p).size > 0,
  }
}

const montar = async ($: any, on: any, archivos: Record<string, string>) => {
  const disco = fsFalso(on, archivos, { vacio: true })
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on, {})
  let lista: unknown[] = []
  on('agent.list', () => ({ value: lista }))
  on('ui.panes', () => ({ value: PANES }))
  on('ui.open', () => ({ value: undefined }))
  on('agent.register', () => ({ value: undefined }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000 }, rateLimits: [] } }))
  await $.command.run({ command: 'oficina' } as never)
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 160, rows: 80 },
  })
  await clock.advance(2000)
  await ui.redraw()
  return { ui, disco, clock, ponerLista: (l: unknown[]) => void (lista = l) }
}

test('kit: los 15 agentes se leen sin errores, cumplen el esquema y su equipo tiene actividad', async () => {
  const { agentes, errores } = await listarCatalogo(fsMin(new Map(Object.entries(KIT))), RAIZ_FALSA)
  expect(errores).toEqual([])
  expect(agentes.length).toBe(Object.keys(KIT).length)
  for (const a of agentes) {
    expect(`${a.name}: ${validarAgente(a).join(' | ')}`).toBe(`${a.name}: `)
    expect(actividadDe(a.equipos[0]).pensada).toBe(true)
  }
})

test('compu del trabajo con el kit: /oficina no escribe nada y Equipos muestra los equipos sin avisos', async ($, on) => {
  const { ui, disco } = await montar($, on, KIT)
  expect(disco.escrituras).toEqual([])
  expect(disco.fuera).toEqual([])
  await ui.press({ key: 'tab-roles' })
  await abrirTodo(ui)
  const t = await textosDe(ui)
  for (const equipo of ['base', 'datos', 'direccion', 'librarian', 'research']) {
    expect((await ui.find({ type: 'Box', key: `grupo-${equipo}` })) !== undefined).toBe(true)
  }
  expect(t.filter(x => /^ ⚠ \d+$/.test(x) || x.startsWith('⚠ '))).toEqual([])
  expect(await ui.find({ type: 'Button', key: 'roles-base' })).toBe(undefined)
})

test('compu del trabajo: un agente por equipo del edificio, creado desde el panel, trabaja en el patio', async ($, on) => {
  const { ui, disco, clock, ponerLista } = await montar($, on, KIT)
  await ui.press({ key: 'tab-roles' })
  const equipos = ['seguridad', 'mantenimiento', 'limpieza', 'facilities', 'arquitectura']
  for (const eq of equipos) {
    await ui.press({ key: 'nuevo-agente' })
    await ui.input({ key: 'nuevo-nombre', text: `ronda-${eq}`, kind: 'change' } as never)
    await ui.select({ key: 'nuevo-equipo', value: eq } as never)
    await ui.press({ key: 'nuevo-crear' })
    expect(disco.archivos.has(`${RAIZ_FALSA}\\${eq}\\ronda-${eq}.md`)).toBe(true)
  }
  await ui.press({ key: 'tab-subagentes' })
  ponerLista(
    equipos.map((eq, i) => ({
      id: `w${i}`,
      description: `OPS-${i + 1} · sonnet · ${eq}/ronda-${eq} · ronda de control`,
      type: 'general-purpose',
      status: 'running',
    })),
  )
  await clock.advance(2000)
  await ui.redraw()
  const escena = (await ui.findAll({ type: 'Svg' })).find((s: any) => /^Oficina, robot/.test(String(s.props.alt ?? '')))
  const nombrados = String(escena?.props.alt ?? '').split('. ').filter(a => /^Agente OPS-/.test(a))
  expect(nombrados.length).toBe(5)
  const fuentes = [String(escena?.props.source ?? '')]
  for (const eq of equipos) expect(fuentes.some(f => f.includes(`equipo ${eq}`))).toBe(true)
  expect((await ui.findAll({ type: 'Text', text: /^ ■ / })).length).toBe(5)
})
