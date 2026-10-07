import { expect, mock } from 'claude-code/testing'

import { plantillaAgente, rolAAgente, serializeAgente } from '../hooks/catalogo'
import { DEFAULT_ROLES } from '../hooks/roles'
import type { AgenteCatalogo } from '../hooks/catalogo'

// Reloj de las pruebas: un miércoles a las 10:30, hora local (horario de trabajo y fuera de las franjas del día).
// Así el robot no está «apagado» (antes de las 8, desde las 18 y el fin de semana) salvo que la prueba lo pida.
export const T0 = new Date(2026, 9, 7, 10, 30).getTime()

// ---- Disco falso: ninguna prueba toca el disco real ----
export const HOME_FALSO = 'C:\\home-falso'
export const RAIZ_FALSA = `${HOME_FALSO}\\.claude\\agents`

// Los 4 roles tal como los dejó la migración de la versión vieja en la compu de casa.
// El disco falso arranca con ellos, salvo que la prueba pida `{ vacio: true }` (una compu nueva).
export const ROLES_MIGRADOS: Record<string, string> = Object.fromEntries(
  Object.entries(DEFAULT_ROLES).map(([nombre, spec]) => {
    const a = rolAAgente(nombre, spec, `${HOME_FALSO}\\.claude\\agents`)
    return [a.ruta, serializeAgente(a)]
  }),
)

export type DiscoFalso = { archivos: Map<string, string>; escrituras: string[]; fuera: string[] }
export const discos = new WeakMap<object, DiscoFalso>()

// Responde env.get y todo fs.* desde un Map en memoria. Una ruta fuera de
// C:\home-falso se anota en `fuera` y falla. Llamarlo dos veces con el mismo
// `on` devuelve el mismo disco (el primero manda).
// Fuera de Windows el motor toma `C:\home-falso\…` como ruta relativa y le antepone la
// carpeta actual («/repo/mod/C:\home-falso\…»): se recorta desde `C:\home-falso`, así
// las mismas pruebas corren en Windows, Linux y macOS.
export function fsFalso(on: any, archivos: Record<string, string> = {}, opts: { vacio?: boolean } = {}): DiscoFalso {
  const previo = discos.get(on)
  if (previo) return previo
  const inicial = opts.vacio ? archivos : { ...ROLES_MIGRADOS, ...archivos }
  const disco: DiscoFalso = { archivos: new Map(Object.entries(inicial)), escrituras: [], fuera: [] }
  discos.set(on, disco)
  const revisar = (path: string): string => {
    const ruta = String(path)
    const desde = ruta.indexOf(HOME_FALSO)
    const antes = desde > 0 ? ruta.slice(0, desde) : ''
    // Solo vale el prefijo de la carpeta actual (una ruta absoluta que termina en separador).
    if (desde < 0 || (desde > 0 && !/^(\/|[A-Za-z]:\\).*[\\/]$/.test(antes))) {
      disco.fuera.push(ruta)
      throw new Error(`ruta fuera del disco falso: ${path}`)
    }
    return ruta.slice(desde)
  }
  const hijos = (dir: string) => {
    const pref = `${dir.replace(/\\+$/, '')}\\`
    const out = new Map<string, 'file' | 'dir'>()
    for (const ruta of disco.archivos.keys()) {
      if (!ruta.startsWith(pref)) continue
      const resto = ruta.slice(pref.length)
      const corte = resto.indexOf('\\')
      if (corte < 0) out.set(resto, 'file')
      else out.set(resto.slice(0, corte), 'dir')
    }
    return out
  }
  on('env.get', () => ({ value: HOME_FALSO }))
  // La carpeta de la sesión también es falsa: el panel busca ahí tarjetas/*.md (estado del proyecto).
  on('session.cwd', () => ({ value: `${HOME_FALSO}\\proyecto` }))
  on('fs.list', (_$: any, e: any) => {
    const dir = revisar(e.path)
    return {
      value: [...hijos(dir)].map(([name, kind]) => ({ name, kind, size: 0, mtimeMs: 0, isLink: false })),
    }
  })
  on('fs.read', (_$: any, e: any) => {
    const ruta = revisar(e.path)
    const texto = disco.archivos.get(ruta)
    if (texto === undefined) throw new Error(`ENOENT: ${ruta}`)
    return { value: texto }
  })
  on('fs.write', (_$: any, e: any) => {
    const ruta = revisar(e.path)
    disco.archivos.set(ruta, String(e.text))
    disco.escrituras.push(ruta)
    return { value: undefined }
  })
  on('fs.exists', (_$: any, e: any) => {
    const ruta = revisar(e.path)
    return { value: disco.archivos.has(ruta) || hijos(ruta).size > 0 }
  })
  on('fs.stat', (_$: any, e: any) => {
    const ruta = revisar(e.path)
    const esArchivo = disco.archivos.has(ruta)
    if (!esArchivo && hijos(ruta).size === 0) throw new Error(`ENOENT: ${ruta}`)
    return { value: { kind: esArchivo ? 'file' : 'dir', size: 0, mtimeMs: 0, isLink: false } }
  })
  return disco
}

// Un archivo de agente en formato nativo.
export function archivoAgente(name: string, equipo: string, etiquetas: string[], description = `Descripción de ${name}`): string {
  const agente: AgenteCatalogo = {
    name,
    description,
    prompt: `Prompt de ${name}.`,
    tools: ['Read', 'Grep'],
    model: 'sonnet',
    effort: 'medium',
    equipos: [equipo],
    etiquetas,
    extra: { maxTurns: '5' },
    ruta: '',
  }
  return serializeAgente(agente)
}

export const PANE = { id: 'tablero-oficina', title: 'Tablero de subagentes' }
export const PROPS = {
  title: 'Tablero de subagentes',
  isFocused: true,
  bodyColumns: 100,
  placement: 'inline',
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
} as const

export const AGENTS = [
  { id: 'a1', description: 'T-62 · sonnet · implementador · panel con jaguar', type: 'general-purpose', status: 'running' },
  { id: 'a2', description: 'T-61 · haiku · corrector · arreglo de pruebas', type: 'general-purpose', status: 'completed' },
  { id: 'a3', description: 'T-60 · sonnet · investigador · busca algo', type: 'general-purpose', status: 'failed' },
  { id: 'a4', description: '  texto\n raro <b>&</b> "comillas"   sin formato  ', type: 'Explore', status: 'weird' },
]

// ---- Desplegables de la pestaña Equipos ----
export const rotulo = async (ui: any, key: string): Promise<string | undefined> => {
  const b = await ui.find({ type: 'Button', key })
  return b === undefined ? undefined : String(b.props.label ?? '')
}
// Abre un grupo y un agente si están cerrados.
export const abrirAgente = async (ui: any, name: string, grupo = 'base'): Promise<void> => {
  if ((await rotulo(ui, `abrir-grupo-${grupo}`))?.startsWith('▸')) await ui.press({ key: `abrir-grupo-${grupo}` })
  if ((await rotulo(ui, `abrir-agente-${name}`))?.startsWith('▸')) await ui.press({ key: `abrir-agente-${name}` })
}
// Abre todos los grupos y todos los agentes.
export const abrirTodo = async (ui: any): Promise<void> => {
  for (let i = 0; i < 20; i++) {
    const b = (await ui.findAll({ type: 'Button' })).find(
      (x: any) => /^abrir-(grupo|agente)-/.test(String(x.key ?? '')) && String(x.props.label ?? '').startsWith('▸'),
    )
    if (!b) return
    await ui.press({ key: String(b.key) })
  }
}

export const PANES = [{ id: PANE.id, title: PANE.title, isShown: true, isFocused: true, isPlaced: true }]

export const jaguarAlt = async (ui: any): Promise<string> => {
  const svgs: Array<{ props: Record<string, unknown> }> = await ui.findAll({ type: 'Svg' })
  const svg = svgs.find(s => /^Tablero, jaguar/.test(String(s.props.alt ?? '')))
  return String(svg?.props.alt ?? '')
}

export const D = (id: string, status: string) => ({
  id,
  description: 'T-9 · haiku · corrector · algo',
  type: 'general-purpose',
  status,
})

export async function montar($: any, on: any, getList: () => unknown[]) {
  fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  on('agent.list', () => ({ value: getList() }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 100, rows: 60 },
  })
  const paso = async (ms: number) => {
    await clock.advance(ms)
    await ui.redraw()
  }
  return { ui, paso }
}

export const celdasAlt = async (ui: any): Promise<string[]> =>
  (await ui.findAll({ type: 'Svg' })).map((s: any) => String(s.props.alt ?? '')).filter((a: string) => /^Agente /.test(a))

export async function montarAncho(
  $: any,
  on: any,
  bodyColumns: number,
  agentes: unknown[] = AGENTS,
  rows = 60,
) {
  fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  mock.store(on, {})
  on('agent.list', () => ({ value: agentes }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: { ...PROPS, bodyColumns } as never,
    requestId: PANE.id,
    viewport: { columns: 200, rows },
  })
  await clock.advance(2000)
  await ui.redraw()
  return ui
}

export const todos = async (ui: any, query: Record<string, unknown>): Promise<any[]> => ui.findAll(query)

// Recorre el árbol buscando nodos que cumplan `fn`.
export function descendientes(node: any, fn: (n: any) => boolean, out: any[] = []): any[] {
  for (const child of node?.children ?? []) {
    if (typeof child !== 'object' || child === null) continue
    if (fn(child)) out.push(child)
    descendientes(child, fn, out)
  }
  return out
}

export const disposicion = async ($: any, on: any, cols: number) => {
  const ui = await montarAncho($, on, cols)
  await ui.press({ key: 'tab-roles' })
  await abrirTodo(ui)
  const card: any = await ui.find({ type: 'Box', key: 'rol-implementador' })
  expect(card !== undefined).toBe(true)
  const boton = descendientes(card, n => n.type === 'Button' && n.props?.key === 'editar-implementador')
  expect(boton.length).toBe(1)
  return String(card.props.flexDirection)
}

export const FIN_PROMPT = 'Tu rol: implementador. Escribís código según la tarjeta.'

export async function montarEquipos(
  $: any,
  on: any,
  archivos: Record<string, string>,
  store: Record<string, unknown> = {},
  opts: { vacio?: boolean } = {},
) {
  const disco = fsFalso(on, archivos, opts)
  const clock = mock.clock(on, { now: T0 })
  mock.store(on, store)
  on('agent.list', () => ({ value: [] }))
  on('ui.panes', () => ({ value: PANES }))
  let registros = 0
  on('agent.register', () => {
    registros += 1
    return { value: undefined }
  })
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 200, rows: 80 },
  })
  await clock.advance(2000)
  await ui.redraw()
  await ui.press({ key: 'tab-roles' })
  await ui.redraw()
  return { ui, disco, registros: () => registros }
}

export const textosDe = async (ui: any): Promise<string[]> =>
  (await ui.findAll({ type: 'Text' })).map((t: any) => String(t.text ?? ''))

export const DOS_EQUIPOS = {
  [`${RAIZ_FALSA}\\base\\alfa.md`]: archivoAgente('alfa', 'base', ['general'], 'Descripción larga de alfa'),
  [`${RAIZ_FALSA}\\dev-a1\\beta.md`]: archivoAgente('beta', 'dev-a1', ['frontend'], 'Descripción larga de beta'),
}

export async function montarSub($: any, on: any) {
  fsFalso(on)
  const clock = mock.clock(on, { now: T0 })
  mock.store(on, {})
  on('agent.list', () => ({ value: AGENTS }))
  on('ui.panes', () => ({ value: PANES }))
  const ui = await $.ui.mount({
    plugin: 'tablero-oficina',
    surface: 'desktop',
    component: 'Pane',
    props: PROPS as never,
    requestId: PANE.id,
    viewport: { columns: 200, rows: 80 },
  })
  await clock.advance(2000)
  await ui.redraw()
  return { ui }
}

export const USO = (i: number, o: number) => ({
  input_tokens: i,
  output_tokens: o,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
  model: 'm',
})
export const turnoSub = ($: any, agentId: string | undefined, answer: string, usage?: unknown) =>
  $.turn.complete({ answer, durationMs: 10, interrupted: false, turnId: 't', reason: 'answer', agentId, usage } as never)

export const agenteValido = (nombre: string, equipo: string): string =>
  serializeAgente({
    ...plantillaAgente(nombre, equipo, RAIZ_FALSA),
    description: 'Hace algo. Usalo para esto. No lo uses para aquello.',
  })

export const textos = async (ui: any, patron: RegExp): Promise<string[]> =>
  (await ui.findAll({ type: 'Text', text: patron })).map((t: any) => String(t.props.children ?? t.text ?? ''))
export const glifoAlts = async (ui: any): Promise<string[]> =>
  (await ui.findAll({ type: 'Svg' })).map((s: any) => String(s.props.alt ?? '')).filter((a: string) => /^Ícono /.test(a))
export const burbuja = async (ui: any, patron: RegExp): Promise<boolean> =>
  (await ui.findAll({ type: 'Text', text: patron })).length > 0

export const altsSvg = async (ui: any): Promise<string[]> =>
  (await ui.findAll({ type: 'Svg' })).map((s: any) => String(s.props.alt ?? ''))

