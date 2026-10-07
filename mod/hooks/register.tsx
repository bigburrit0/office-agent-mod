import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'
import type { CatalogoEstado, RolBorrador, RolSpec } from '../types/index'
import {
  EQUIPOS_ESQUEMA,
  listarCatalogo,
  migrarRoles,
  nombreTarjeta,
  plantillaAgente,
  rolAAgente,
  rolesBaseEsquema,
  serializeAgente,
  validarAgente,
} from './catalogo'
import type { AgenteCatalogo, FsMin } from './catalogo'
import {
  DEFAULT_ROLES,
  EFFORTS,
  errorText,
  mergeRoles,
  MODELS,
  presetTools,
  ROLE_NAMES,
  savedRoles,
  toAgentSpec,
  toolsKind,
  toolsLabel,
} from './roles'
import { caraRobotSvg, EMOCION_ALT } from './arte-loro'
import {
  celdaMasSvg,
  celdaPatioSvg,
  doselPatioSvg,
  PATIO_ALTO,
  PATIO_ANCHO,
  pisoPatioSvg,
} from './arte-mar'
import { bodegaSvg, lechoSvg, repisaSvg, sogaSvg } from './arte-bodega'
import { codiceSvg, paredTallerSvg, temploSvg, tzolkin } from './arte-edificio'
import { EQUIPO_ACENTO, TIPO_NOMBRE, tipoDeAgente } from './arte-iconos'
import { DIOSES_EQUIPO, diosSvg, doblonesSvg, glifoSvg, lunaDiaSvg } from './arte-insignias'
import { actividadDe, actividadParaCelda } from './arte-actividades'
import { decidirEmocion, DORMIR_MS, franjaHora, SOSPECHA_MS } from './emociones'
import type { Grupo } from './emociones'
import {
  normalizeStatus,
  palabraEstadoSvg,
  PALETTE,
  roleColor,
  statusColor,
  timelineSvg,
} from './pixel'
import type { FilaTiempo } from './pixel'
import {
  barraUso,
  BUCKET_MS,
  bucketOf,
  cachedSvg,
  cambiosBorrador,
  partirSecciones,
  reemplazarSeccion,
  textoSeccion,
  tituloSeccion,
  datosUsoDe,
  CARA_ALTO,
  CARA_ANCHO,
  chipEquipo,
  clean,
  colorUso,
  cuandoRenueva,
  cuerpoSkill,
  DASH,
  DESIGN_WIDTH,
  detectReaction,
  DOSEL_ALTO,
  fmtNum,
  glifoDe,
  INFORME_MAX,
  isKnown,
  isTerminal,
  linesOf,
  MAX_AGENTS,
  MAX_INFORMES,
  mergeAgents,
  minutosDelDia,
  mmss,
  NARROW_COLUMNS,
  nextPatio,
  NOMBRE_LIMITE,
  normalizarUso,
  ocioDesdeDe,
  orderTree,
  pad,
  PANE,
  parse,
  PERIOD_MS,
  plural,
  podarCeldas,
  REACT_CHISPAZO_MS,
  REACT_MEDIO_MS,
  ritmoRobot,
  semillaDe,
  SEP,
  sizeProps,
  statusWord,
  STORE_ANTERIORES,
  STORE_ROLES,
  svgSize,
  TAREA_EQUIPO,
  TITLE,
  totalTokens,
} from './tablero-nucleo'
import { altUso, quedaPct, tableroUsoSvg } from './arte-uso'
import { ESCENA_FONDO, escenaAlto, escenaOficinaSvg, porFilaEscena } from './arte-barco'
import { CLARO, colorUsoClaro, legibleSobre, PASTILLAS_CLARO } from './tema'
import type { Ordered, PatioEntrada, UsoSesion } from './tablero-nucleo'

// ---- Estado del panel (átomos de $.state) ----------------------------------
// Se declaran acá porque el motor lee los átomos en el mismo archivo donde se usan.
const agents = atom({ plugin: 'tablero-oficina', key: 'agents' } as const, [])
const nowAtom = atom({ plugin: 'tablero-oficina', key: 'now' } as const, 0)
const viewAtom = atom({ plugin: 'tablero-oficina', key: 'view' } as const, 'subagentes')
const rolesAtom = atom({ plugin: 'tablero-oficina', key: 'roles' } as const, {})
const draftAtom = atom({ plugin: 'tablero-oficina', key: 'draft' } as const, null)
const promptAtom = atom({ plugin: 'tablero-oficina', key: 'promptAbierto' } as const, false)
const abiertosAtom = atom({ plugin: 'tablero-oficina', key: 'abiertos' } as const, {})
const skillsEquipoAtom = atom({ plugin: 'tablero-oficina', key: 'skillsEquipo' } as const, {})
const nuevoAtom = atom({ plugin: 'tablero-oficina', key: 'nuevo' } as const, null)
const informesAtom = atom({ plugin: 'tablero-oficina', key: 'informes' } as const, {})
const tokensSesionAtom = atom(
  { plugin: 'tablero-oficina', key: 'tokensSesion' } as const,
  { input: 0, output: 0, cacheLectura: 0, cacheEscritura: 0, turnos: 0 },
)
const noticeAtom = atom({ plugin: 'tablero-oficina', key: 'notice' } as const, '')
const catalogoAtom = atom(
  { plugin: 'tablero-oficina', key: 'catalogo' } as const,
  { agentes: [], errores: [], cargado: false, raiz: '' } as CatalogoEstado,
)
const filtroAtom = atom({ plugin: 'tablero-oficina', key: 'filtro' } as const, 'todas')

const reaccionAtom = atom({ plugin: 'tablero-oficina', key: 'reaccion' } as const, null)
const usoAtom = atom({ plugin: 'tablero-oficina', key: 'uso' } as const, null)
const molestoAtom = atom({ plugin: 'tablero-oficina', key: 'molesto' } as const, '')
const patioAtom = atom({ plugin: 'tablero-oficina', key: 'patio' } as const, {})
const quietoAtom = atom({ plugin: 'tablero-oficina', key: 'quieto' } as const, false)

// El timer vive en el módulo: una recarga en caliente lo cancela junto con
// el entorno viejo, y el render lo vuelve a armar si el panel sigue abierto.
let timer: Timer | undefined

function stopTimer(): void {
  timer?.cancel()
  timer = undefined
}

// Lee `$.agent.list()` y mezcla con lo ya guardado. Escribir en `$.state`
// redibuja el panel (y la app recarga cada marco Svg), así que solo se escribe
// si cambia algo visible: la lista, una reacción, el patio, el ritmo del ocio, o el balde de 10 s
// de `now` mientras algo corre. Sin cambios, no hay escrituras.
async function refresh($: EngineInterface): Promise<void> {
  // Con un borrador abierto no se toca el estado: el redibujado pisaría lo tipeado.
  if ((await read($, draftAtom)) !== null) return
  // Solo los últimos MAX_AGENTS del motor: lo más viejo no vuelve a entrar.
  const list = (await $.agent.list()).slice(-MAX_AGENTS)
  const now = await $.clock.now()
  const prev = await read($, agents)
  const merged = mergeAgents(prev, list, now)
  const changed = JSON.stringify(merged.rows) !== JSON.stringify(prev)
  const storedNow = await read($, nowAtom)
  const anyRunning = merged.rows.some(row => row.status === 'running')
  const bucketChanged = anyRunning && bucketOf(now) !== bucketOf(storedNow)
  // Reacción del robot: una nueva reemplaza a la anterior; al vencer se borra (una sola escritura).
  const react0 = await read($, reaccionAtom)
  // Molesto: se enoja con una falla y se le pasa cuando otro subagente termina bien (alivio).
  // Guarda la tarjeta del que falló (vacío = no molesto; un `true` viejo cuenta como molesto sin nombre).
  const molestoRaw: unknown = await read($, molestoAtom)
  const molesto0 = molestoRaw === true ? '?' : typeof molestoRaw === 'string' ? molestoRaw : ''
  const reaction = detectReaction(prev, merged.rows, now, molesto0)
  const expired = reaction === null && react0 !== null && react0.hasta <= now
  const falla = reaction !== null && (reaction.tipo === 'ruge' || reaction.tipo === 'panico' || reaction.tipo === 'frustrado')
  const molesto = falla
    ? (reaction?.quien ?? '')
    : reaction !== null && reaction.tipo === 'alivio'
      ? ''
      : (molestoRaw as string)
  // Patio de agentes que salen o explotan.
  const patio0 = await read($, patioAtom)
  const patio = nextPatio(prev, merged.rows, patio0 as Record<string, PatioEntrada>, now)
  const patioChanged = JSON.stringify(patio) !== JSON.stringify(patio0)
  if (changed) await update($, agents, () => merged.rows)
  if (reaction !== null) await update($, reaccionAtom, () => reaction)
  else if (expired) await update($, reaccionAtom, () => null)
  if (molesto !== molestoRaw) await update($, molestoAtom, () => molesto)
  if (patioChanged) await update($, patioAtom, () => patio)
  // Sin nada corriendo, la cara cambia sola con el paso del ocio y con la hora del día.
  const ocioDesde = ocioDesdeDe(merged.rows, now)
  const ritmoChanged = ritmoRobot(merged.rows, ocioDesde, storedNow) !== ritmoRobot(merged.rows, ocioDesde, now)
  if (
    changed ||
    bucketChanged ||
    reaction !== null ||
    expired ||
    patioChanged ||
    ritmoChanged
  ) {
    await update($, nowAtom, () => now)
  }
}

async function isPaneOpen($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(pane => pane.id === PANE)
}

async function tick($: EngineInterface): Promise<void> {
  try {
    if (!(await isPaneOpen($))) {
      stopTimer()

      return
    }
    if (!usoPedido) {
      usoPedido = true
      await pedirUso($)
    }
    await refresh($)
  } catch {
    // Un tick fallido no debe tirar el panel: el próximo reintenta.
  }
}

function startTimer($: EngineInterface): void {
  if (timer) return
  timer = $.clock.every(PERIOD_MS, () => {
    void tick($)
  })
}

async function refreshQuietly($: EngineInterface): Promise<void> {
  try {
    await refresh($)
  } catch {
    // Sin drama: el siguiente tick o evento lo vuelve a intentar.
  }
}

// Se pide `$.session.usage()` una vez por carga del módulo; después llegan los `session.measure`.
let usoPedido = false

// Guarda el uso solo si cambió algo visible (no el instante de la medición). Nunca lanza.
async function guardarUso($: EngineInterface, datos: unknown): Promise<void> {
  try {
    const ahora = await $.clock.now()
    const nuevo = normalizarUso(datos, ahora)
    const previo = (await read($, usoAtom)) as UsoSesion | null
    const igual =
      previo !== null &&
      JSON.stringify(previo.limites) === JSON.stringify(nuevo.limites) &&
      previo.contexto === nuevo.contexto &&
      previo.costo === nuevo.costo
    if (!igual) await update($, usoAtom, () => nuevo)
  } catch {
    // El uso es accesorio: sin datos, el panel lo dice.
  }
}

async function pedirUso($: EngineInterface): Promise<void> {
  try {
    await guardarUso($, await $.session.usage())
  } catch {
    // Sin datos de uso: el próximo `session.measure` los trae.
  }
}

// Compacta la conversación, lo mismo que `/compact`. El motor lo rechaza mientras Claude está en un turno.
async function compactarSesion($: EngineInterface): Promise<void> {
  await update($, abiertosAtom, v => ({ ...v, 'confirmar-compactar': false }))
  await setNotice($, 'Compactando la sesión…')
  try {
    const resultado = await $.session.compact()
    if (resultado.messages === undefined) {
      await setNotice($, `No se compactó: ${clean(resultado.skip) || 'otro plugin lo frenó'}.`)

      return
    }
    const antes = resultado.tokensBefore
    const despues = resultado.tokensAfter
    const cifras =
      typeof antes === 'number' && typeof despues === 'number' ? `: de ${fmtNum(antes)} a ${fmtNum(despues)} tokens` : ''
    await setNotice($, `Sesión compactada${cifras}.`)
    await pedirUso($)
  } catch (error) {
    await setNotice(
      $,
      `No se pudo compactar: ${errorText(error)}. Si Claude está respondiendo, probá cuando termine el turno.`,
    )
  }
}

// ---- Roles: estado, store y registro -------------------------------------

async function setNotice($: EngineInterface, text: string): Promise<void> {
  try {
    await update($, noticeAtom, () => text)
    // Un aviso de error hace saltar chispas al robot.
    if (text.startsWith('No se pudo')) {
      const ahora = await $.clock.now()
      await update($, reaccionAtom, () => ({ tipo: 'chispazo' as const, hasta: ahora + REACT_CHISPAZO_MS }))
      await update($, nowAtom, () => ahora)
    }
  } catch {
    // Un aviso que no se puede guardar no debe romper nada.
  }
}

// Respaldo (comportamiento viejo): lee el store, deja los roles guardados en el
// estado y registra los cuatro (lo guardado manda sobre los valores por defecto).
// Nunca lanza.
async function syncRoles($: EngineInterface): Promise<void> {
  let saved: Record<string, RolSpec> = {}
  try {
    saved = savedRoles(await $.store.get(STORE_ROLES))
  } catch (error) {
    await setNotice($, `No se pudo leer lo guardado: ${errorText(error)}`)
  }
  try {
    await update($, rolesAtom, () => saved)
  } catch {
    // El estado se rearma en la próxima sincronización.
  }
  const live = mergeRoles(saved)
  for (const name of Object.keys(live)) {
    try {
      await $.agent.register(toAgentSpec(name, live[name]))
    } catch (error) {
      await setNotice($, `No se pudo registrar el rol ${name}: ${errorText(error)}`)
    }
  }
}

// Adaptador del fs del motor a lo mínimo que usa el catálogo.
function fsAdapter($: EngineInterface): FsMin {
  return {
    list: async path => (await $.fs.list(path)).map(entry => ({ name: entry.name, kind: entry.kind })),
    read: path => $.fs.read(path),
    write: (path, text) => $.fs.write(path, text),
    exists: path => $.fs.exists(path),
  }
}

// Carpeta de los agentes nativos: <USERPROFILE o HOME>\.claude\agents.
async function raizCatalogo($: EngineInterface): Promise<string> {
  const home = (await $.env.get('USERPROFILE')) || (await $.env.get('HOME'))
  if (!home) throw new Error('no se encontró la carpeta del usuario (USERPROFILE/HOME)')
  const sep = home.includes('/') && !home.includes('\\') ? '/' : '\\'

  return `${home.replace(/[\\/]+$/, '')}${sep}.claude${sep}agents`
}

// Migra lo guardado (sin sobrescribir), lee el catálogo y lo deja en el estado.
// Si algo falla avisa y usa el comportamiento viejo (registrar los cuatro roles).
// Nunca lanza.
async function cargarCatalogo($: EngineInterface): Promise<void> {
  let ok = false
  try {
    const raiz = await raizCatalogo($)
    let saved: Record<string, RolSpec> = {}
    try {
      saved = savedRoles(await $.store.get(STORE_ROLES))
    } catch {
      // Sin lo guardado se migran los valores por defecto.
    }
    await update($, rolesAtom, () => saved)
    const fs = fsAdapter($)
    // Solo se migra si hay roles guardados por la versión vieja del panel (la compu de casa).
    // En una compu nueva no se escribe nada en la carpeta de agentes sin que la usuaria lo pida.
    if (Object.keys(saved).length > 0) await migrarRoles(fs, raiz, mergeRoles(saved))
    const { agentes, errores } = await listarCatalogo(fs, raiz)
    await update($, catalogoAtom, () => ({ agentes, errores, cargado: true, raiz }))
    ok = agentes.length > 0
  } catch (error) {
    await setNotice($, `No se pudo leer el catálogo de agentes: ${errorText(error)}. Se usan los roles de siempre.`)
  }
  if (!ok) await syncRoles($)
}

// Botón «Crear los 4 roles base»: los escribe en <agentes>\base, en la versión que cumple el esquema.
// Nunca pisa un archivo ni un nombre que ya exista. Nunca lanza.
async function crearRolesBase($: EngineInterface): Promise<void> {
  try {
    await update($, abiertosAtom, v => ({ ...v, 'confirmar-roles-base': false }))
    const catalogo = await read($, catalogoAtom)
    if (!catalogo.raiz) throw new Error('no se sabe dónde está la carpeta de agentes')
    const existentes = new Set(catalogo.agentes.map(a => a.name))
    const creados: string[] = []
    for (const agente of rolesBaseEsquema(DEFAULT_ROLES, catalogo.raiz)) {
      if (existentes.has(agente.name) || (await $.fs.exists(agente.ruta))) continue
      await $.fs.write(agente.ruta, serializeAgente(agente))
      creados.push(agente.name)
    }
    await cargarCatalogo($)
    await update($, abiertosAtom, v => ({ ...v, 'grupo:base': true }))
    await setNotice(
      $,
      creados.length > 0
        ? `Creados ${creados.join(', ')} en ${catalogo.raiz}. Claude Code los toma en unos segundos.`
        : 'Los 4 roles base ya existían: no se escribió nada.',
    )
  } catch (error) {
    await setNotice($, `No se pudo crear los roles base (${errorText(error)}).`)
  }
}

// Abre o cierra un desplegable. Ausente = cerrado, salvo `porDefecto` (el resumen arranca abierto).
async function alternar($: EngineInterface, clave: string, porDefecto = false): Promise<void> {
  await update($, abiertosAtom, v => ({ ...v, [clave]: !(clave in v ? v[clave] : porDefecto) }))
}

// Abre o cierra la skill del equipo; la lee del disco solo al abrir.
async function alternarSkill($: EngineInterface, equipo: string): Promise<void> {
  const clave = `skill:${equipo}`
  const abierto = (await read($, abiertosAtom))[clave] === true
  await alternar($, clave)
  if (abierto) return
  let texto = 'Este equipo no tiene skill todavía.'
  try {
    const raiz = (await read($, catalogoAtom)).raiz
    if (raiz) {
      const sep = raiz.includes('/') && !raiz.includes('\\') ? '/' : '\\'
      const base = raiz.replace(/[\\/]+$/, '').replace(/[\\/]agents$/, '')
      const ruta = `${base}${sep}skills${sep}equipo-${equipo}${sep}SKILL.md`
      if (await $.fs.exists(ruta)) texto = cuerpoSkill(String(await $.fs.read(ruta))) || texto
    }
  } catch {
    // Sin skill legible se muestra el mensaje de siempre.
  }
  await update($, skillsEquipoAtom, v => ({ ...v, [equipo]: texto }))
}

async function copiarTarjeta($: EngineInterface, agente: AgenteCatalogo, surface: any): Promise<void> {
  const texto = nombreTarjeta(agente)
  try {
    const res: any = await $.ui.copy({ text: texto, surface })
    if (res && res.ok === false) throw new Error(String(res.error ?? 'la superficie no lo aceptó'))
    await setNotice($, `Copiado: ${texto}`)
  } catch (error) {
    await setNotice($, `No se pudo copiar: ${errorText(error)}. Texto para copiar a mano: ${texto}`)
  }
}

async function crearAgente($: EngineInterface): Promise<void> {
  try {
    const nuevo = await read($, nuevoAtom)
    if (!nuevo) return
    const catalogo = await read($, catalogoAtom)
    const nombre = nuevo.nombre.trim()
    const equipo = nuevo.equipo || 'base'
    let agente: AgenteCatalogo
    try {
      agente = plantillaAgente(nombre, equipo, catalogo.raiz)
    } catch (error) {
      await setNotice($, `No se pudo crear: ${errorText(error)}`)

      return
    }
    if (catalogo.agentes.some(a => a.name === nombre)) {
      await setNotice($, `No se pudo crear: ya existe un agente llamado ${nombre}.`)

      return
    }
    if (await $.fs.exists(agente.ruta)) {
      await setNotice($, `No se pudo crear: ya existe el archivo ${agente.ruta}.`)

      return
    }
    await $.fs.write(agente.ruta, serializeAgente(agente))
    await update($, nuevoAtom, () => null)
    await cargarCatalogo($)
    await update($, abiertosAtom, v => ({ ...v, [`grupo:${equipo}`]: true, [`agente:${nombre}`]: true }))
    await setNotice($, `Creado ${agente.ruta}. Completalo en Editar; Claude Code lo toma en unos segundos.`)
  } catch (error) {
    await setNotice($, `No se pudo crear: ${errorText(error)}`)
  }
}

// Deja cerrado lo de Equipos: grupos, agentes, skills y errores. No toca el resto.
async function cerrarEquipos($: EngineInterface): Promise<void> {
  await update($, abiertosAtom, v => {
    const out: Record<string, boolean> = {}
    for (const [clave, valor] of Object.entries(v)) {
      if (clave.startsWith('grupo:') || clave.startsWith('agente:') || clave.startsWith('skill:') || clave === 'errores') continue
      out[clave] = valor as boolean
    }

    return out
  })
}

// Cierra lo desplegable de la vista Editar: descripción, secciones del prompt y confirmaciones.
async function cerrarDesc($: EngineInterface): Promise<void> {
  await update($, abiertosAtom, v => {
    const out: Record<string, boolean> = {}
    for (const [clave, valor] of Object.entries(v)) if (!clave.startsWith('seccion:') && !clave.startsWith('cambiar-seccion:')) out[clave] = valor as boolean

    return { ...out, desc: false, 'confirmar-restaurar': false, 'confirmar-anterior': false }
  })
}

async function showView($: EngineInterface, view: 'subagentes' | 'roles'): Promise<void> {
  // Tocar la pestaña activa no debe descartar el borrador.
  if ((await read($, viewAtom)) === view) return
  await update($, draftAtom, () => null)
  await update($, noticeAtom, () => '')
  await update($, viewAtom, () => view)
  // Al entrar en Equipos se relee la carpeta: toma lo que se editó por fuera.
  if (view === 'roles') {
    await cerrarEquipos($)
    await cargarCatalogo($)
  }
}

// Copias guardadas antes de cada Guardar (ruta → texto). Nunca lanza.
async function leerAnteriores($: EngineInterface): Promise<Record<string, string>> {
  try {
    const crudo: unknown = await $.store.get(STORE_ANTERIORES)
    if (!crudo || typeof crudo !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [ruta, texto] of Object.entries(crudo as Record<string, unknown>)) if (typeof texto === 'string') out[ruta] = texto

    return out
  } catch {
    return {}
  }
}

// Arma el borrador con lo que dice el archivo (ya leído en el catálogo) y su copia anterior, si hay.
async function borradorDe($: EngineInterface, agente: AgenteCatalogo): Promise<RolBorrador> {
  const anterior = (await leerAnteriores($))[agente.ruta]

  return {
    name: agente.name,
    description: agente.description,
    prompt: agente.prompt,
    tools: agente.tools === null ? null : [...agente.tools],
    model: agente.model,
    effort: agente.effort,
    ruta: agente.ruta,
    ...(anterior !== undefined ? { anterior } : {}),
  }
}

async function startEdit($: EngineInterface, name: string): Promise<void> {
  const agente = (await read($, catalogoAtom)).agentes.find(a => a.name === name)
  if (!agente) return
  await update($, noticeAtom, () => '')
  await update($, promptAtom, () => false)
  await cerrarDesc($)
  const borrador = await borradorDe($, agente)
  await update($, draftAtom, () => borrador)
}

// Botón «Releer archivo»: vuelve a leer la carpeta y rearma el borrador desde el archivo (descarta lo no guardado).
async function releerArchivo($: EngineInterface): Promise<void> {
  const draft = await read($, draftAtom)
  if (!draft) return
  await cargarCatalogo($)
  const agente = (await read($, catalogoAtom)).agentes.find(a => a.ruta === draft.ruta)
  if (!agente) {
    await setNotice($, `No se pudo releer: ${draft.ruta ?? draft.name} ya no está en la carpeta de agentes.`)

    return
  }
  await cerrarDesc($)
  const borrador = await borradorDe($, agente)
  await update($, draftAtom, () => borrador)
  await setNotice($, `Releído desde ${agente.ruta}.`)
}

async function copiarRuta($: EngineInterface, ruta: string, surface: any, motivo = ''): Promise<void> {
  try {
    const res: any = await $.ui.copy({ text: ruta, surface })
    if (res && res.ok === false) throw new Error(String(res.error ?? 'la superficie no lo aceptó'))
    await setNotice($, `${motivo}Ruta copiada: ${ruta}`)
  } catch (error) {
    await setNotice($, `${motivo}No se pudo copiar (${errorText(error)}). Ruta: ${ruta}`)
  }
}

// Botón «Abrir en el editor». El motor no abre archivos por sí mismo: se prueba el comando `code`
// (VS Code), directo y por cmd (en Windows `code` es un .cmd). Si ninguno anda se copia la ruta.
async function abrirEnEditor($: EngineInterface, surface: any): Promise<void> {
  const draft = await read($, draftAtom)
  const ruta = draft?.ruta
  if (!ruta) return
  const intentos: string[][] = [
    ['code', ruta],
    ['cmd', '/c', 'code', ruta],
  ]
  for (const argv of intentos) {
    try {
      const res = await $.process.run(argv, { timeoutMs: 15000 })
      if (res.exitCode === 0) {
        await setNotice($, `Abierto en el editor: ${ruta}. Cuando lo guardes ahí, tocá «Releer archivo».`)

        return
      }
    } catch {
      // Se prueba el siguiente.
    }
  }
  await copiarRuta($, ruta, surface, 'No encontré el editor (comando «code»). ')
}

// Cambia el texto de una sección del prompt (n según partirSecciones).
async function patchSeccion($: EngineInterface, indice: number, texto: string): Promise<void> {
  await update($, draftAtom, draft => (draft ? { ...draft, prompt: reemplazarSeccion(draft.prompt, indice, texto) } : draft))
}

async function cancelEdit($: EngineInterface): Promise<void> {
  await update($, draftAtom, () => null)
  await update($, promptAtom, () => false)
  await cerrarDesc($)
  await update($, noticeAtom, () => '')
  await refreshQuietly($)
}

async function patchDraft($: EngineInterface, patch: Partial<RolBorrador>): Promise<void> {
  await update($, draftAtom, draft => (draft ? { ...draft, ...patch } : draft))
}

async function pickTools($: EngineInterface, kind: string): Promise<void> {
  const tools = presetTools(kind)
  // «personalizado» no es un preset: se conservan las herramientas actuales.
  if (tools === undefined) return
  await patchDraft($, { tools })
}

// Escribe el agente en su archivo; si falla, avisa y el borrador queda abierto.
async function escribirAgente(
  $: EngineInterface,
  agente: AgenteCatalogo,
  texto = serializeAgente(agente),
): Promise<boolean> {
  // Copia de lo que hay en el disco antes de pisarlo: «Volver a la versión anterior».
  let previo: string | undefined
  try {
    if (await $.fs.exists(agente.ruta)) previo = String(await $.fs.read(agente.ruta))
  } catch {
    // Sin copia se guarda igual.
  }
  try {
    await $.fs.write(agente.ruta, texto)
  } catch (error) {
    await setNotice($, `No se pudo guardar: ${errorText(error)}`)

    return false
  }
  if (previo !== undefined && previo !== texto) {
    try {
      const anteriores = await leerAnteriores($)
      await $.store.set(STORE_ANTERIORES, { ...anteriores, [agente.ruta]: previo })
    } catch {
      // La copia es una ayuda: si no se puede guardar, lo escrito vale igual.
    }
  }
  await update($, draftAtom, () => null)
  await update($, promptAtom, () => false)
  await cerrarDesc($)
  await cargarCatalogo($)
  const guardado = (await read($, catalogoAtom)).agentes.find(a => a.ruta === agente.ruta)
  const avisos = guardado ? validarAgente(guardado).length : 0
  await setNotice(
    $,
    avisos > 0
      ? `Guardado en ${agente.ruta} con ${plural(avisos, 'aviso', 'avisos')} para revisar. Claude Code lo toma en unos segundos.`
      : `Guardado en ${agente.ruta}. Claude Code lo toma en unos segundos.`,
  )
  await refreshQuietly($)

  return true
}

async function saveDraft($: EngineInterface): Promise<void> {
  try {
    const draft = await read($, draftAtom)
    if (!draft) return
    const description = draft.description.trim()
    const prompt = draft.prompt.trim()
    if (!description || !prompt) {
      await setNotice($, 'No se pudo guardar: la descripción y el prompt no pueden quedar vacíos.')

      return
    }
    const original = (await read($, catalogoAtom)).agentes.find(a => a.ruta === draft.ruta)
    if (!original) {
      await setNotice($, 'No se pudo guardar: el agente ya no está en el catálogo.')

      return
    }
    const ok = await escribirAgente(
      $,
      {
        ...original,
        description,
        prompt,
        tools: draft.tools === null ? null : [...draft.tools],
        model: draft.model,
        effort: draft.effort,
      },
    )
    if (ok) {
      const ahora = await $.clock.now()
      await update($, reaccionAtom, () => ({ tipo: 'orgullo' as const, hasta: ahora + REACT_MEDIO_MS, quien: draft.name }))
      await update($, nowAtom, () => ahora)
    }
  } catch (error) {
    await setNotice($, `No se pudo guardar: ${errorText(error)}`)
  }
}

// «Volver a la versión anterior»: escribe la copia guardada antes del último Guardar.
// Lo que estaba queda a su vez como copia, así que se puede deshacer.
async function volverAnterior($: EngineInterface): Promise<void> {
  try {
    const draft = await read($, draftAtom)
    if (!draft?.ruta || draft.anterior === undefined) return
    const original = (await read($, catalogoAtom)).agentes.find(a => a.ruta === draft.ruta)
    if (!original) return
    await escribirAgente($, original, draft.anterior)
  } catch (error) {
    await setNotice($, `No se pudo guardar: ${errorText(error)}`)
  }
}

async function restoreDraft($: EngineInterface): Promise<void> {
  try {
    const draft = await read($, draftAtom)
    if (!draft) return
    const defecto = DEFAULT_ROLES[draft.name]
    const original = (await read($, catalogoAtom)).agentes.find(a => a.ruta === draft.ruta)
    if (!defecto || !original) return
    const base = rolAAgente(draft.name, defecto, original.ruta)
    await escribirAgente(
      $,
      { ...base, ruta: original.ruta, equipos: original.equipos, etiquetas: original.etiquetas, extra: original.extra },
    )
  } catch (error) {
    await setNotice($, `No se pudo guardar: ${errorText(error)}`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'oficina',
      description: 'Abre la oficina de subagentes',
    })
    // El catálogo se migra y lee desde el arranque, con el panel cerrado.
    await cargarCatalogo($)

    return next(e)
  })

  on('command.run', { command: 'oficina' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })
    await cerrarEquipos($)
    // Relee el catálogo (y, solo si falla, vuelve a registrar los roles de siempre).
    await cargarCatalogo($)
    await refresh($)
    // Al abrir el panel el robot saluda (y guiña al final), salvo que ya esté reaccionando a algo.
    try {
      const ahora = await $.clock.now()
      const vigente = await read($, reaccionAtom)
      if (vigente === null || vigente.hasta <= ahora) {
        await update($, reaccionAtom, () => ({ tipo: 'saluda' as const, hasta: ahora + REACT_MEDIO_MS }))
        await update($, nowAtom, () => ahora)
      }
    } catch {
      // El saludo es accesorio.
    }
    await pedirUso($)
    startTimer($)

    return { text: 'Tablero de subagentes abierto.' }
  })

  // Al lanzarse un subagente ya existe: se refresca sin esperar el tick (y
  // aunque el panel esté cerrado, para anotar cuándo lo vimos por primera vez).
  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    void refreshQuietly($)

    return result
  })

  // Cuando termina un subagente se refresca, para fijar su hora de fin aunque
  // el panel esté cerrado. Un instante después se repite por si el estado del
  // motor todavía figuraba como «corriendo».
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    try {
      const crudo: unknown = e.usage ?? result?.usage
      if (crudo && typeof crudo === 'object') {
        const u = crudo as Record<string, unknown>
        const n = (k: string): number => (typeof u[k] === 'number' && Number.isFinite(u[k]) ? (u[k] as number) : 0)
        const hayNumero = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'].some(
          k => typeof u[k] === 'number' && Number.isFinite(u[k]),
        )
        if (hayNumero) {
          await update($, tokensSesionAtom, t => ({
            input: t.input + n('input_tokens'),
            output: t.output + n('output_tokens'),
            cacheLectura: t.cacheLectura + n('cache_read_input_tokens'),
            cacheEscritura: t.cacheEscritura + n('cache_creation_input_tokens'),
            turnos: t.turnos + 1,
          }))
        }
      }
    } catch {
      // El conteo es accesorio: nunca debe romper el turno.
    }
    if (e.agentId === undefined) void pedirUso($)
    if (e.agentId !== undefined) {
      try {
        const id = String(e.agentId)
        const bruto = typeof e.answer === 'string' && e.answer !== '' ? e.answer : String(result?.text ?? '')
        const texto = bruto.length > INFORME_MAX ? `${bruto.slice(0, INFORME_MAX)}…` : bruto
        const uso: unknown = e.usage ?? result?.usage
        const suma: Record<string, number> = {}
        if (uso && typeof uso === 'object') {
          for (const [k, v] of Object.entries(uso as Record<string, unknown>)) {
            if (typeof v === 'number' && Number.isFinite(v)) suma[k] = v
          }
        }
        await update($, informesAtom, previo => {
          const antes = previo[id]
          const tokens: Record<string, number> = { ...(antes?.tokens ?? {}) }
          for (const [k, v] of Object.entries(suma)) tokens[k] = (tokens[k] ?? 0) + v
          const nuevo = { texto: texto !== '' ? texto : (antes?.texto ?? ''), tokens, turnos: (antes?.turnos ?? 0) + 1 }
          const resto = { ...previo }
          delete resto[id]
          const claves = Object.keys(resto)
          while (claves.length >= MAX_INFORMES) delete resto[claves.shift() as string]

          return { ...resto, [id]: nuevo }
        })
      } catch {
        // El informe es accesorio: nunca debe romper el turno.
      }
      void refreshQuietly($)
      $.clock.after(300, () => {
        void refreshQuietly($)
      })
    }

    return result
  })

  // El motor avisa cuando cambia el uso (tras cada turno o cuando una ventana se mueve un punto).
  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    await guardarUso($, e)

    return result
  })

  // Cuando el panel se cierra, se frena el timer.
  on('ui.close', async ($, e, next) => {
    const result = await next(e)
    if (e.id === PANE && !(await isPaneOpen($))) stopTimer()

    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const resolved = $.ui.resolve(e)
    const { Box, Text, Button } = resolved
    // `Svg` no existe en la terminal: ahí el panel sigue siendo solo texto.
    const Svg = (resolved as unknown as Record<string, any>).Svg
    startTimer($)

    const view = await read($, viewAtom)
    const notice = await read($, noticeAtom)
    const catalogo = await read($, catalogoAtom)
    const roleNames = [...new Set([...ROLE_NAMES, ...catalogo.agentes.map(a => a.name.toLowerCase())])]

    const termRows = e.viewport?.rows ?? 24
    const hasSvg = Svg !== undefined && Svg !== null
    // Ancho útil del panel en celdas (`bodyColumns`); si no viene, el de toda la pantalla.
    const bodyRaw = (e as unknown as { props?: { bodyColumns?: unknown } }).props?.bodyColumns
    const bodyColumns =
      typeof bodyRaw === 'number' && Number.isFinite(bodyRaw) && bodyRaw > 0 ? bodyRaw : undefined
    const viewColumns = e.viewport?.columns
    const columns =
      bodyColumns ??
      (typeof viewColumns === 'number' && Number.isFinite(viewColumns) && viewColumns > 0
        ? viewColumns
        : undefined)
    const W =
      columns !== undefined
        ? Math.min(DESIGN_WIDTH, Math.max(200, Math.floor(columns * 7.8)))
        : DESIGN_WIDTH
    // Panel angosto: menos de 70 celdas útiles. Si no se sabe el ancho, se asume ancho.
    const narrow = bodyColumns !== undefined && bodyColumns < NARROW_COLUMNS
    const textCols = Math.max(10, (bodyColumns ?? 100) - 2)
    const titleScale = W >= 260 ? 3 : 2

    const noticeLine = notice ? (
      <Text wrap="wrap" color={notice.startsWith('No se pudo') ? 'red' : undefined} bold>
        {notice}
      </Text>
    ) : null

    const quieto = (await read($, quietoAtom)) === true
    // Estado del robot, común a las tres vistas.
    const rows = (await read($, agents)).filter(row => row && typeof row.id === 'string')
    const now = await read($, nowAtom)
    const molestoRaw: unknown = await read($, molestoAtom)
    const molestoQuien = typeof molestoRaw === 'string' ? molestoRaw : ''
    const molesto = molestoRaw === true || molestoQuien !== ''
    const fondo = CLARO.escena
    // Tema claro del panel en el escritorio; en la terminal el texto sin fondo propio sigue con el color del terminal.
    const claro = hasSvg && e.surface !== 'terminal'
    const tx = claro ? CLARO.texto : undefined
    const suave: { color?: string; dimColor?: boolean } = claro ? { color: CLARO.textoSuave } : { dimColor: true }
    const acentoTxt = claro ? CLARO.acento : PALETTE.oro
    // En el escritorio el panel entero es de noche, sea cual sea el tema de la app.
    const fondoPanel = claro ? { backgroundColor: CLARO.panel } : {}
    const legibleEn = (color: string, fondos: string[]): string => fondos.reduce((acc, f) => legibleSobre(acc, f), color)
    const running = rows.filter(row => row.status === 'running').length
    const reaccion = await read($, reaccionAtom)
    const draftComun = view === 'roles' ? await read($, draftAtom) : null
    const editadoComun = draftComun ? catalogo.agentes.find(a => a.ruta === draftComun.ruta) : undefined
    const hayCambios =
      draftComun !== null &&
      editadoComun !== undefined &&
      (draftComun.description !== editadoComun.description ||
        draftComun.prompt !== editadoComun.prompt ||
        draftComun.model !== editadoComun.model ||
        draftComun.effort !== editadoComun.effort ||
        JSON.stringify(draftComun.tools) !== JSON.stringify(editadoComun.tools))
    // Emoción del robot: la decide emociones.ts con lo que pasa ahora (ver sus prioridades).
    const nowReal = await $.clock.now()
    const reaccionVigente = reaccion && reaccion.hasta > now ? String(reaccion.tipo) : ''
    const corriendoRows = rows.filter(row => row.status === 'running')
    const masLargoMs = corriendoRows.reduce((max, row) => Math.max(max, now - row.firstSeen), 0)
    const ocioDesde = ocioDesdeDe(rows, nowReal)
    const minutosHoy = minutosDelDia(nowReal)
    const franja = franjaHora(minutosHoy)
    // Uso de la sesión: lo necesita el robot (preocupado) y el tablero de uso de Subagentes.
    const uso = (await read($, usoAtom)) as UsoSesion | null
    const tokensSes = await read($, tokensSesionAtom)
    const datosUso = datosUsoDe(uso, tokensSes, nowReal)
    const estado: { emocion: string; grupo: Grupo } = decidirEmocion({
      usoCincoHoras: datosUso.cincoHoras?.pct,
      reaccion: reaccionVigente,
      corriendo: running,
      masLargoMs,
      molesto,
      cambiosSinGuardar: hayCambios,
      ocioMs: nowReal - ocioDesde,
      minutosDelDia: minutosHoy,
      semilla: ocioDesde,
    })
    // Ocio, hora del día o cambios sin guardar: cada vista pone su propia frase en la burbuja.
    const tranquilo = estado.grupo === 'ocio' || estado.grupo === 'hora'
    const orgulloVigente =
      reaccion !== null && (reaccion.tipo === 'orgullo' || reaccion.tipo === 'guardado') && reaccion.hasta > nowReal

    let caraSvg = ''
    let caraAlt = ''
    let doselSvg = ''
    let grecaSvg = ''
    let frisoArte = ''
    let disponible = PATIO_ANCHO * 2
    if (hasSvg) {
      caraAlt = `Barco, loro ${EMOCION_ALT[estado.emocion] ?? estado.emocion}`
      // La firma no lleva `now`: el string queda idéntico entre redibujos y la animación no reinicia.
      caraSvg = cachedSvg('cara', `${estado.emocion}|${quieto}`, () =>
        caraRobotSvg(estado.emocion, 3, { quieto, fondo, marco: true }),
      )
      const anchoCara = svgSize(caraSvg).width || CARA_ANCHO
      disponible = Math.max(PATIO_ANCHO * 2, W - anchoCara)
      doselSvg = cachedSvg(`dosel-${disponible}`, `${disponible}`, () => doselPatioSvg(disponible, 2, { fondo }))
      grecaSvg = cachedSvg(`soga-${W}`, `${W}`, () => sogaSvg(W, 6))
      frisoArte = cachedSvg(`lecho-${W}`, `${W}`, () => lechoSvg(W, 2))
    }
    // Burbuja del robot: una frase que explica lo que pasa (con la tarjeta cuando se sabe).
    const burbujaEstado = (): string => {
      const con = (nombre: string, antes: string, despues: string): string =>
        nombre !== '' ? `${antes}${nombre}${despues}` : ''
      const quienReaccion = reaccion && typeof reaccion.quien === 'string' ? reaccion.quien : ''
      const minutos = (ms: number): number => Math.max(0, Math.floor(ms / 60000))
      // Trabajando en una franja de la hora del día, la burbuja lo comenta al final.
      const conHora = (texto: string): string => (franja ? `${texto} ${franja.frase}` : texto)
      const laburando = (extra: string): string => {
        const tarjetas = corriendoRows.map(row => parse(row.description, roleNames, row.type).card).filter(c => c !== '')
        const lista =
          tarjetas.length > 0 ? `: ${tarjetas.slice(0, 4).join(', ')}${tarjetas.length > 4 ? '…' : ''}.` : '.'

        return conHora(`Laburando con ${plural(corriendoRows.length, 'agente', 'agentes')}${lista} ${extra}`)
      }
      if (orgulloVigente) return `¡Guardado! ${quienReaccion} estrena rol en la próxima sesión. De nada.`
      switch (estado.emocion) {
        case 'dormido':
          return `Modo ahorro de energía hace ${minutos(nowReal - ocioDesde - DORMIR_MS)} min. Despertame si pasa algo interesante.`
        case 'pensando':
          return laburando('No me distraigas.')
        case 'tipea':
          return laburando('Tecleo a dos manos.')
        case 'multitarea':
          return laburando('¡Mil cosas a la vez!')
        case 'concentrado': {
          const largo = [...corriendoRows].sort((a, b) => a.firstSeen - b.firstSeen)[0]
          const nombre = largo ? parse(largo.description, roleNames, largo.type).card : ''

          return conHora(
            `${nombre !== '' ? nombre : 'El agente'} lleva ${minutos(masLargoMs)} min. Auriculares puestos: no me hablen.`,
          )
        }
        case 'sospecha': {
          if (estado.grupo === 'uso') {
            const cinco = datosUso.cincoHoras
            const q = quedaPct(cinco?.pct ?? 0)
            const renueva = cinco?.renueva ?? ''
            const cuando = renueva !== '' ? ` (se renueva ${renueva})` : ''
            if ((cinco?.pct ?? 0) >= 95) return `¡Casi sin ventana! Queda ${q} % de las 5 horas${cuando}. Mejor tareas cortas.`

            return `Ojo: queda ${q} % de las 5 horas${cuando}. Mejor tareas cortas.`
          }
          if (estado.grupo === 'cambios' || (hayCambios && masLargoMs <= SOSPECHA_MS)) {
            return 'Hay cambios sin guardar: Guardar (G) o Cancelar (C).'
          }
          const largo = [...corriendoRows].sort((a, b) => a.firstSeen - b.firstSeen)[0]
          const nombre = largo ? parse(largo.description, roleNames, largo.type).card : ''

          return `${nombre !== '' ? nombre : 'Un agente'} lleva ${minutos(masLargoMs)} min… ¿se fue a almorzar?`
        }
        case 'caceria':
          return `¡Llegó${con(quienReaccion, ' ', '')}! A trabajar, que el café no se paga solo.`
        case 'sorpresa':
          return `¡Uy! Llegaron ${quienReaccion || 'varios'} de golpe. ¿Quién organizó esta fiesta?`
        case 'saluda':
          return '¡Hola! Pasá, que la oficina está abierta.'
        case 'ruge':
          return `¡ERROR! Falló${con(quienReaccion, ' ', '')}. A mí no me mires.`
        case 'panico':
          return `¡Fallaron varios a la vez${con(quienReaccion, ' (', ')')}! ¡No es un simulacro!`
        case 'frustrado':
          return `¿Otra falla?${con(quienReaccion, ' ', '.')} Esto ya es personal.`
        case 'chispazo':
          return 'Chispazo: algo no salió. El aviso de arriba dice qué.'
        case 'molesto':
          return `Falló${con(molestoQuien, ' ', '')}. Estoy ofendido hasta que algo salga bien.`
        case 'bufido':
          return `¿Frenaron${con(quienReaccion, ' ', '')}? Ok. Ok. Respiro.`
        case 'contento':
          return `¡Terminó${con(quienReaccion, ' ', '')}! Siguen los demás.`
        case 'aplaude':
          return `¡Terminaron ${quienReaccion || 'varios'} juntos! Aplausos.`
        case 'festeja':
          return '¡Listo! Oleada terminada sin fallas. Obvio.'
        case 'alivio':
          return `${quienReaccion !== '' ? quienReaccion : 'Eso'} salió bien. Uf, ya se me pasó el enojo.`
        case 'manana':
          return 'Buen día. Primero el café, después los agentes.'
        case 'hambre':
          return '¿Ya es mediodía? Me está dando hambre.'
        case 'casa':
          return 'Ya son más de las cinco y media: dentro de poco me voy a casa.'
        case 'bostezo':
          return 'Aaaah… ¿Nadie tiene trabajo para mí?'
        case 'estira':
          return 'Estirando los circuitos. Sin agentes no hay vida.'
        case 'riega':
          return 'Riego la planta mientras nadie labura.'
        case 'diario':
          return 'Leyendo el diario. Ninguna noticia de agentes.'
        case 'solitario':
          return 'Solitario: voy ganando. Nadie me necesita.'
        case 'silba':
          return 'Fiu, fiu… la oficina está tranquila.'
        case 'guina':
          return 'Todo en orden por acá. Guiño, guiño.'
        default:
          return 'Tomando café. Avisame cuando alguien trabaje.'
      }
    }

    const frisoCierre =
      frisoArte !== '' ? (
        <Box key="caja-friso-cierre" width="100%" backgroundColor="#c9a35a">
          <Svg key="svg-friso-cierre" source={frisoArte} alt="Lecho de arena" {...sizeProps(frisoArte)} />
        </Box>
      ) : null

    // Pasillo de la oficina, justo antes de la cornisa: llena el espacio que sobra de la vista.
    const pieCierre = (altoPx: number, maximo = 140) => {
      if (!claro) return null
      const alto = Math.max(60, Math.min(maximo, Math.round(altoPx)))
      const pie = cachedSvg('pie', `${W}|${alto}|${quieto}`, () => bodegaSvg(W, alto, 2, { quieto }))

      return pie !== '' ? <Svg key="svg-pie" source={pie} alt="Bodega del barco" {...sizeProps(pie)} /> : null
    }

    // Cabecera común: cara grande a la izquierda, escena de la vista a la derecha, burbuja y greca debajo.
    const cabecera = (escena: any, burbuja: string) => {
      if (!hasSvg || caraSvg === '') return null

      return (
        <Box flexDirection="column">
          <Box flexDirection="row" alignItems="flex-end" backgroundColor={CLARO.escena}>
            <Svg key="svg-pista" source={caraSvg} {...sizeProps(caraSvg)} alt={caraAlt} isInteractive />
            <Box flexDirection="column" flexGrow={1} flexShrink={1} minWidth={0} backgroundColor={CLARO.escena}>
              {doselSvg !== '' && (
                <Svg key="svg-dosel" source={doselSvg} alt="Cielorraso de la oficina" {...sizeProps(doselSvg)} />
              )}
              {escena}
            </Box>
          </Box>
          {burbuja !== '' && (
            <Box backgroundColor={CLARO.burbuja} borderStyle="round" borderColor={CLARO.burbujaBorde} paddingX={1}>
              <Text color={CLARO.texto} wrap="wrap">
                {burbuja}
              </Text>
            </Box>
          )}
          {grecaSvg !== '' && (
            <Box key="caja-greca" width="100%" backgroundColor="#9c8763">
              <Svg key="svg-greca" source={grecaSvg} alt="Soga trenzada" {...sizeProps(grecaSvg)} />
            </Box>
          )}
        </Box>
      )
    }

    // Cabecera de escena única (Equipos y Editar): robot colgado y `cuadros` en la pared, burbuja y greca debajo.
    const cabeceraEscena = (cuadros: string[], alt: string, burbuja: string) => {
      if (!claro || caraSvg === '') return null
      const firma = `${estado.emocion}|${quieto}|${W}|${cuadros.length}|${cuadros.reduce((n, q) => n + q.length, 0)}`
      const escena = cachedSvg('escena-cuadros', `${firma}|${alt}`, () =>
        escenaOficinaSvg({
          ancho: W,
          cara: cachedSvg('cara-escena', `${estado.emocion}|${quieto}`, () =>
            caraRobotSvg(estado.emocion, 3, { quieto, marco: true }),
          ),
          celdas: [],
          cuadros,
          quieto,
          alt,
        }),
      )

      return (
        <Box flexDirection="column">
          {escena !== '' && (
            <Box width="100%" backgroundColor={ESCENA_FONDO}>
              <Svg key="svg-escena" source={escena} alt={alt} {...sizeProps(escena)} isInteractive />
            </Box>
          )}
          {burbuja !== '' && (
            <Box backgroundColor={CLARO.burbuja} borderStyle="round" borderColor={CLARO.burbujaBorde} paddingX={1}>
              <Text color={CLARO.texto} wrap="wrap">
                {burbuja}
              </Text>
            </Box>
          )}
          {grecaSvg !== '' && (
            <Box key="caja-greca" width="100%" backgroundColor="#9c8763">
              <Svg key="svg-greca" source={grecaSvg} alt="Soga trenzada" {...sizeProps(grecaSvg)} />
            </Box>
          )}
        </Box>
      )
    }

    // Fecha de hoy (hora local), con su número en el display.
    const local = nowReal - new Date(nowReal).getTimezoneOffset() * 60000
    const diaMaya = tzolkin(local)
    const barraSuperior = () => {
      const numMaya = hasSvg
        ? cachedSvg(`dia-luna-${diaMaya.numero}`, `${diaMaya.numero}`, () =>
            lunaDiaSvg(diaMaya.numero, 2),
          )
        : ''

      return (
        <Box
          flexDirection="row"
          alignItems="center"
          flexWrap="wrap"
          backgroundColor={CLARO.barra}
          paddingX={1}
          paddingY={1}
          columnGap={2}
        >
          <Box flexDirection="row" columnGap={2}>
            <Button
              key="tab-subagentes"
              label="Subagentes"
              variant={view === 'subagentes' ? 'primary' : 'secondary'}
              onPress={() => showView($, 'subagentes')}
            />
            <Button
              key="tab-roles"
              label="Equipos"
              variant={view === 'roles' ? 'primary' : 'secondary'}
              onPress={() => showView($, 'roles')}
            />
          </Box>
          <Box flexGrow={1} />
          {numMaya !== '' ? (
            <Svg
              key="svg-dia-maya"
              source={numMaya}
              alt={`Fecha de hoy: ${diaMaya.texto}`}
              {...sizeProps(numMaya)}
            />
          ) : null}
          {numMaya !== '' ? (
            <Text color={CLARO.acento}>{` ${diaMaya.texto} `}</Text>
          ) : (
            <Text color={CLARO.textoSuave}>{`${diaMaya.texto} `}</Text>
          )}
          {hasSvg && e.surface !== 'terminal' && (
            <Button
              key="quieto"
              label={quieto ? 'Animar' : 'Quieto'}
              onPress={() => update($, quietoAtom, v => !v)}
            />
          )}
        </Box>
      )
    }
    if (view === 'roles') {
      if (e.surface === 'mobile') {
        return (
          <Box flexDirection="column" {...fondoPanel}>
            {barraSuperior()}
            <Text dimColor>El editor de roles necesita campos de texto: abrilo en escritorio.</Text>
          </Box>
        )
      }
      const { Input, Select } = $.ui.resolve(e)
      const draft = await read($, draftAtom)
      const promptAbierto = await read($, promptAtom)
      const abiertos = await read($, abiertosAtom)

      if (draft) {
        const kind = toolsKind(draft.tools)
        const toolOptions = [
          { value: 'lectura', label: 'solo lectura' },
          { value: 'lectura-web', label: 'lectura y web' },
          { value: 'pruebas', label: 'pruebas (corre comandos)' },
          { value: 'documentos', label: 'documentos (lectura, web y escritura)' },
          { value: 'escritura', label: 'lectura y escritura' },
          { value: 'todas', label: 'todas' },
        ]
        if (kind === 'personalizado') {
          toolOptions.push({ value: 'personalizado', label: toolsLabel(draft.tools) })
        }

        const editado = catalogo.agentes.find(a => a.ruta === draft.ruta)
        const equipo = editado?.equipos[0] ?? 'base'
        const acento = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
        const dios = DIOSES_EQUIPO[equipo]?.dios ?? ''
        const tarea = TAREA_EQUIPO[equipo]
        const confirmando = abiertos['confirmar-restaurar'] === true
        const confirmandoAnterior = abiertos['confirmar-anterior'] === true
        const fondosTarjeta = [CLARO.tarjeta, CLARO.panel]
        const colorEquipo = acento[0]
        const etiqueta = (texto: string) => (
          <Box width={14}>
            <Text color={tx}>{texto}</Text>
          </Box>
        )
        // Tarjeta con el borde del color del equipo, como las de Equipos.
        const tarjeta = (clave: string, titulo: string, extra: any, ...hijos: any[]) => (
          <Box
            key={clave}
            flexDirection="column"
            borderStyle="round"
            borderColor={colorEquipo}
            paddingX={1}
            marginTop={1}
            {...(claro ? { backgroundColor: CLARO.tarjeta } : {})}
          >
            <Box flexDirection="row" columnGap={1} flexWrap="wrap">
              <Text bold color={claro ? legibleEn(colorEquipo, fondosTarjeta) : colorEquipo}>
                {titulo}
              </Text>
              {extra}
            </Box>
            {hijos}
          </Box>
        )
        let cuadrosEditar: string[] = []
        let escenaEditar: any = null
        if (hasSvg) {
          if (!claro) {
            const paredArte = cachedSvg(`pared-${disponible}`, `${disponible}|${quieto}`, () =>
              paredTallerSvg(disponible, 2, { quieto }),
            )
            const codiceArte = cachedSvg(`codice-${disponible}`, `${disponible}`, () => codiceSvg(disponible, 2))
            escenaEditar = (
              <Box flexDirection="column">
                {paredArte !== '' && (
                  <Svg key="svg-pared-taller" source={paredArte} alt="Pared del taller" {...sizeProps(paredArte)} />
                )}
                {codiceArte !== '' && (
                  <Svg key="svg-codice" source={codiceArte} alt="Pizarra del taller" {...sizeProps(codiceArte)} />
                )}
              </Box>
            )
          }
          const diosArte = cachedSvg(`dios2-${equipo}`, equipo, () => diosSvg(equipo, 2, acento))
          const editGlifo = glifoDe(draft.name, '', editado ? [editado] : catalogo.agentes)
          const roleIcon = cachedSvg(`glifo3-${editGlifo.tipo}-${equipo}`, equipo, () =>
            glifoSvg(editGlifo.tipo, equipo, 3),
          )
          cuadrosEditar = [roleIcon, diosArte].filter(q => q !== '')
          if (!claro && diosArte !== '') {
            // Sin escena clara la placa no se ve arriba: va una sola vez acá.
            escenaEditar = (
              <Box flexDirection="column">
                {escenaEditar}
                <Svg key="svg-dios-equipo" source={diosArte} alt={`Bandera ${dios} del equipo ${equipo}`} {...sizeProps(diosArte)} />
              </Box>
            )
          }
        }
        // Encabezado: la escena ya muestra ícono y placa; abajo de la ruta (con el nombre legible) van el equipo y su tarea.
        const subtituloEquipo = [`equipo ${equipo}`, dios, tarea].filter(x => x !== undefined && x !== '').join(' · ')
        const editHeader = <Text {...suave} wrap="wrap">{subtituloEquipo}</Text>
        const burbujaEditar =
          orgulloVigente || !(tranquilo || estado.grupo === 'cambios')
            ? burbujaEstado()
            : hayCambios
              ? 'Hay cambios sin guardar: Guardar (G) o Cancelar (C).'
              : `Editando ${draft.name}. Lo que guardes vale en una sesión nueva.`

        // Avisos del esquema calculados sobre el borrador (no sobre el archivo).
        const avisosBorrador = editado
          ? validarAgente({
              ...editado,
              description: draft.description.trim(),
              prompt: draft.prompt.trim(),
              tools: draft.tools,
              model: draft.model,
              effort: draft.effort,
            })
          : []
        const cajaAvisos =
          avisosBorrador.length > 0 ? (
            <Box key="rol-avisos" flexDirection="column" borderStyle="round" borderColor={acentoTxt} paddingX={1} marginTop={1}>
              <Text bold color={acentoTxt}>{`Para revisar (${avisosBorrador.length})`}</Text>
              {avisosBorrador.map((a, i) => (
                <Text key={`rol-aviso-${i}`} color={acentoTxt} wrap="wrap">{`⚠ ${a}`}</Text>
              ))}
            </Box>
          ) : (
            <Box key="rol-avisos" marginTop={1}>
              <Text color={claro ? legibleEn('#5FE39A', [CLARO.panel]) : 'green'}>✓ Cumple el esquema</Text>
            </Box>
          )

        // Ficha en solo lectura: equipo, etiquetas y líneas extra del frontmatter.
        const ficha = [
          editado && editado.etiquetas.length > 0 ? `etiquetas: ${editado.etiquetas.join(', ')}` : '',
          ...Object.entries(editado?.extra ?? {}).map(([k, v]) => `${k}: ${v}`),
        ].filter(x => x !== '')

        const largoDesc = draft.description.trim().length
        const contador = (
          <Text key="rol-desc-largo" color={largoDesc > 200 ? acentoTxt : undefined} {...(largoDesc > 200 ? {} : suave)}>
            {`${largoDesc}/200`}
          </Text>
        )

        const secciones = partirSecciones(draft.prompt)
        const unica = secciones.length === 1
        const bloquesPrompt = secciones.map((s, i) => {
          const titulo = tituloSeccion(s, unica)
          const abiertaSec = unica || abiertos[`seccion:${i}`] === true
          const cambiando = abiertos[`cambiar-seccion:${i}`] === true
          const cuerpo = s.cuerpo.trim()

          return (
            <Box key={`rol-seccion-${i}`} flexDirection="column">
              {unica ? (
                <Text bold color={tx}>{`${titulo} (${plural(cuerpo.length, 'carácter', 'caracteres')})`}</Text>
              ) : (
                <Box flexDirection="row">
                  <Button
                    key={`rol-ver-seccion-${i}`}
                    label={`${abiertaSec ? '▾' : '▸'} ${titulo} (${plural(cuerpo.length, 'carácter', 'caracteres')})`}
                    onPress={() => alternar($, `seccion:${i}`)}
                  />
                </Box>
              )}
              {abiertaSec && (
                <Box flexDirection="column" paddingLeft={unica ? 0 : 2}>
                  <Box borderStyle="round" borderColor={claro ? CLARO.borde : undefined} paddingX={1} flexDirection="column">
                    <Text color={tx} wrap="wrap">{cuerpo === '' ? '(vacía)' : cuerpo}</Text>
                  </Box>
                  {cambiando ? (
                    <Input
                      key={`rol-seccion-input-${i}`}
                      label={`${titulo}: `}
                      placeholder="Texto de la sección"
                      value={textoSeccion(s)}
                      onInput={value => patchSeccion($, i, value)}
                      onSubmit={value => patchSeccion($, i, value)}
                    />
                  ) : null}
                  <Box flexDirection="row">
                    <Button
                      key={`rol-cambiar-seccion-${i}`}
                      label={cambiando ? 'Listo' : 'Cambiar esta sección'}
                      onPress={() => alternar($, `cambiar-seccion:${i}`)}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )
        })

        const cambios = editado ? cambiosBorrador(editado, draft) : []
        const tieneAnterior = draft.anterior !== undefined

        return (
          <Box flexDirection="column" {...fondoPanel}>
            {barraSuperior()}
            {noticeLine}
            {claro
              ? cabeceraEscena(cuadrosEditar, `${caraAlt}. Taller de ${draft.name}`, burbujaEditar)
              : cabecera(escenaEditar, burbujaEditar)}
            <Box flexDirection="column">
              <Box flexDirection="row" columnGap={1}>
                <Button key="volver-equipos" label="← Equipos" onPress={() => cancelEdit($)} />
                <Text {...suave}>{` / ${equipo} / `}</Text>
                <Text bold color={claro ? legibleEn(roleColor(draft.name), [CLARO.panel]) : roleColor(draft.name)} wrap="wrap">
                  {draft.name}
                </Text>
              </Box>
              {editHeader}
              {cajaAvisos}
              {tarjeta(
                'rol-tarjeta-trabaja',
                'Cómo trabaja',
                null,
                <Box key="fila-modelo" flexDirection="row">
                  {etiqueta('Modelo')}
                  <Select
                    key="rol-model"
                    options={MODELS.map(value => ({ value }))}
                    value={draft.model}
                    onSelect={value => patchDraft($, { model: value })}
                  />
                </Box>,
                <Box key="fila-esfuerzo" flexDirection="row">
                  {etiqueta('Esfuerzo')}
                  <Select
                    key="rol-effort"
                    options={EFFORTS.map(value => ({ value }))}
                    value={draft.effort}
                    onSelect={value => patchDraft($, { effort: value })}
                  />
                </Box>,
                <Box key="fila-herramientas" flexDirection="row">
                  {etiqueta('Herramientas')}
                  <Select
                    key="rol-tools"
                    options={toolOptions}
                    value={kind}
                    onSelect={value => pickTools($, value)}
                  />
                </Box>,
                ...(ficha.length > 0 ? [<Text key="rol-ficha" {...suave} wrap="wrap">{ficha.join(' · ')}</Text>] : []),
              )}
              {tarjeta(
                'rol-tarjeta-cuando',
                'Cuándo usarlo',
                contador,
                abiertos.desc === true ? (
                  <Input
                    key="rol-description"
                    placeholder="Cuándo delegar a este rol"
                    value={draft.description}
                    onInput={value => patchDraft($, { description: value })}
                    onSubmit={value => patchDraft($, { description: value })}
                  />
                ) : (
                  <Text key="rol-desc-texto" color={tx} wrap="wrap">{draft.description}</Text>
                ),
                <Box key="fila-desc" flexDirection="row">
                  <Button
                    key="rol-ver-desc"
                    label={abiertos.desc === true ? 'Listo' : 'Cambiar descripción'}
                    hotkey="d"
                    onPress={() => alternar($, 'desc')}
                  />
                </Box>,
              )}
              {tarjeta(
                'rol-tarjeta-instrucciones',
                'Instrucciones',
                <Text key="rol-prompt-largo" {...suave}>{`${draft.prompt.length} caracteres`}</Text>,
                <Box key="fila-prompt" flexDirection="row" flexWrap="wrap" columnGap={2}>
                  <Button
                    key="rol-ver-prompt"
                    label={promptAbierto ? '▾ Ocultar' : unica ? '▸ Ver el prompt' : `▸ Ver por secciones (${secciones.length})`}
                    hotkey="p"
                    onPress={() => update($, promptAtom, v => !v)}
                  />
                  <Button key="rol-abrir-editor" label="Abrir en el editor" onPress={() => abrirEnEditor($, e.surface)} />
                  <Button key="rol-releer" label="Releer archivo" onPress={() => releerArchivo($)} />
                </Box>,
                ...(promptAbierto ? bloquesPrompt : []),
                <Text key="rol-ruta" {...suave} wrap="wrap">{draft.ruta ?? ''}</Text>,
              )}
              {hayCambios && <Text color={acentoTxt}>● Cambios sin guardar</Text>}
              {cambios.length > 0 && (
                <Text key="rol-cambios" color={tx} wrap="wrap">{`Vas a cambiar: ${cambios.join(' · ')}`}</Text>
              )}
              <Box flexDirection="row" columnGap={2} marginTop={1} flexWrap="wrap">
                <Box flexDirection="row" columnGap={2}>
                  <Button
                    key="rol-guardar"
                    label="Guardar"
                    hotkey="g"
                    variant="primary"
                    onPress={() => saveDraft($)}
                  />
                  <Button key="rol-cancelar" label="Cancelar" hotkey="c" onPress={() => cancelEdit($)} />
                </Box>
                <Box flexGrow={1} />
                {tieneAnterior && (
                  <Button
                    key="rol-anterior"
                    label="Volver a la versión anterior…"
                    hotkey="v"
                    onPress={() => alternar($, 'confirmar-anterior')}
                  />
                )}
                {DEFAULT_ROLES[draft.name] !== undefined && (
                  <Button
                    key="rol-restaurar"
                    label="Restaurar original…"
                    hotkey="r"
                    onPress={() => alternar($, 'confirmar-restaurar')}
                  />
                )}
              </Box>
              {confirmandoAnterior && tieneAnterior && (
                <Box flexDirection="column">
                  <Text color={tx} wrap="wrap">
                    ¿Volver al archivo como estaba antes del último Guardar? Lo de ahora queda como copia, así que se puede deshacer.
                  </Text>
                  <Box flexDirection="row" columnGap={2} marginTop={1}>
                    <Button
                      key="rol-anterior-si"
                      label="Sí, volver"
                      onPress={async () => {
                        await update($, abiertosAtom, v => ({ ...v, 'confirmar-anterior': false }))
                        await volverAnterior($)
                      }}
                    />
                    <Button
                      key="rol-anterior-no"
                      label="No"
                      onPress={() => update($, abiertosAtom, v => ({ ...v, 'confirmar-anterior': false }))}
                    />
                  </Box>
                </Box>
              )}
              {confirmando && DEFAULT_ROLES[draft.name] !== undefined && (
                <Box flexDirection="column">
                  <Text color={tx} wrap="wrap">¿Volver a los valores originales? Se pierde lo que cambiaste.</Text>
                  <Box flexDirection="row" columnGap={2} marginTop={1}>
                    <Button
                      key="rol-restaurar-si"
                      label="Sí, restaurar"
                      onPress={async () => {
                        await update($, abiertosAtom, v => ({ ...v, 'confirmar-restaurar': false }))
                        await restoreDraft($)
                      }}
                    />
                    <Button
                      key="rol-restaurar-no"
                      label="No"
                      onPress={() => update($, abiertosAtom, v => ({ ...v, 'confirmar-restaurar': false }))}
                    />
                  </Box>
                </Box>
              )}
            </Box>
            {pieCierre((termRows - 30) * 20)}
            {frisoCierre}
          </Box>
        )
      }

      const placasEquipos = claro
        ? Object.keys(DIOSES_EQUIPO).map(eq =>
            cachedSvg(`dios2-${eq}`, eq, () => diosSvg(eq, 2, EQUIPO_ACENTO[eq] ?? EQUIPO_ACENTO.base)),
          )
        : []
      const estanteArte = claro ? cachedSvg('repisa', `${W}`, () => repisaSvg(W)) : ''
      const temploArte = hasSvg && !claro ? cachedSvg(`templo-${disponible}`, `${disponible}`, () => temploSvg(disponible, 2)) : ''

      const skills = await read($, skillsEquipoAtom)
      const nuevo = await read($, nuevoAtom)
      const formNuevo =
        nuevo === null ? (
          <Button
            key="nuevo-agente"
            label="+ Nuevo agente"
            onPress={() => update($, nuevoAtom, () => ({ nombre: '', equipo: 'base' }))}
          />
        ) : (
          <Box flexDirection="column">
            <Input
              key="nuevo-nombre"
              label="Nombre: "
              placeholder="minúsculas-y-guiones"
              value={nuevo.nombre}
              onInput={value => update($, nuevoAtom, v => (v ? { ...v, nombre: value } : v))}
              onSubmit={value => update($, nuevoAtom, v => (v ? { ...v, nombre: value } : v))}
            />
            <Select
              key="nuevo-equipo"
              label="Equipo: "
              options={Object.keys(EQUIPOS_ESQUEMA).map(value => ({ value }))}
              value={nuevo.equipo}
              onSelect={value => update($, nuevoAtom, v => (v ? { ...v, equipo: value } : v))}
            />
            <Box flexDirection="row" columnGap={2}>
              <Button key="nuevo-crear" label="Crear" onPress={() => crearAgente($)} />
              <Button key="nuevo-cancelar" label="Cancelar" onPress={() => update($, nuevoAtom, () => null)} />
            </Box>
          </Box>
        )
      const filtro = await read($, filtroAtom)
      const opcionesFiltro = [
        ...new Set(['todas', ...catalogo.agentes.flatMap(a => [...a.equipos, ...a.etiquetas])]),
      ]
      const filtroActual = opcionesFiltro.includes(filtro) ? filtro : 'todas'
      const visibles = catalogo.agentes.filter(
        a => filtroActual === 'todas' || a.equipos.includes(filtroActual) || a.etiquetas.includes(filtroActual),
      )
      const grupos = new Map<string, AgenteCatalogo[]>()
      for (const agente of visibles) {
        const equipo = agente.equipos[0] ?? 'sin equipo'
        grupos.set(equipo, [...(grupos.get(equipo) ?? []), agente])
      }
      const tarjeta = (agente: AgenteCatalogo, pos: number) => {
        const name = agente.name
        const abierto = abiertos[`agente:${name}`] === true
        const etiquetas = agente.etiquetas.length > 0 ? `etiquetas: ${agente.etiquetas.join(', ')}` : ''
        const tipoAg = tipoDeAgente({ name: agente.name, tools: agente.tools, emblema: agente.emblema })
        const equipoAg = agente.equipos[0] ?? 'base'
        const iconSvg = hasSvg
          ? cachedSvg(`glifo2-${tipoAg}-${equipoAg}`, `${tipoAg}|${equipoAg}`, () =>
              glifoSvg(tipoAg, equipoAg, 2),
            )
          : ''
        const avisos = validarAgente(agente)
        const avisoCerrado =
          avisos.length > 0 ? (
            <Text key={`aviso-${name}`} color={acentoTxt}>{` ⚠ ${avisos.length}`}</Text>
          ) : null
        const listaAvisos = abierto
          ? avisos.map((a, i) => (
              <Text key={`aviso-${name}-${i}`} color={acentoTxt} wrap="wrap">{`⚠ ${a}`}</Text>
            ))
          : []
        const copiar = abierto ? (
          <Button
            key={`copiar-${name}`}
            label="Copiar nombre de tarjeta"
            onPress={() => copiarTarjeta($, agente, e.surface)}
          />
        ) : null
        const toggle = (
          <Button
            key={`abrir-agente-${name}`}
            label={abierto ? '▾' : '▸'}
            onPress={() => alternar($, `agente:${name}`)}
          />
        )
        const edit: any = abierto ? (
          <Button key={`editar-${name}`} label="Editar" onPress={() => startEdit($, name)} />
        ) : null
        if (!hasSvg) {
          return (
            <Box key={`rol-${name}`} flexDirection="column">
              <Box flexDirection="row">
                {toggle}
                <Text>{'  '}</Text>
                <Text color={roleColor(name)} bold>
                  {pad(name, 14)}
                </Text>
                <Text wrap="truncate">{agente.model}</Text>
                {avisoCerrado}
              </Box>
              {abierto && (
                <Box flexDirection="column" paddingX={2}>
                  <Text dimColor wrap="wrap">{agente.description}</Text>
                  <Text wrap="wrap">{`${agente.effort} · ${toolsLabel(agente.tools)}`}</Text>
                  {etiquetas !== '' && <Text dimColor wrap="wrap">{etiquetas}</Text>}
                  <Text dimColor wrap="wrap">{agente.ruta}</Text>
                  {listaAvisos}
                  <Box flexDirection="row" columnGap={2}>
                    {edit}
                    {copiar}
                  </Box>
                </Box>
              )}
            </Box>
          )
        }

        const colorEquipo = EQUIPO_ACENTO[equipoAg]?.[0] ?? EQUIPO_ACENTO.base[0]
        const fondoTarjeta = {
          backgroundColor: pos % 2 === 0 ? CLARO.tarjeta : CLARO.tarjetaAlt,
          hover: { backgroundColor: CLARO.tarjetaHover },
        }
        const icon =
          iconSvg !== '' ? (
            <Svg
              key={`icono-rol-${name}`}
              source={iconSvg}
              alt={`Ícono del rol ${name}`}
              {...sizeProps(iconSvg)}
            />
          ) : null
        const fila = (
          <Box
            flexDirection="row"
            alignItems="center"
            paddingLeft={2}
            {...(narrow ? { flexWrap: 'wrap' as const } : {})}
            {...fondoTarjeta}
          >
            {icon}
            <Box paddingX={1}>
              <Text color={legibleEn(roleColor(name), [CLARO.tarjeta, CLARO.tarjetaAlt, CLARO.tarjetaHover])} bold>
                {name}
              </Text>
            </Box>
            <Text backgroundColor={CLARO.chip.fondo} color={CLARO.chip.letra}>{` ${agente.model} `}</Text>
            {avisoCerrado}
            <Box flexGrow={1} />
            {toggle}
          </Box>
        )

        return (
          <Box key={`rol-${name}`} flexDirection="column">
            {fila}
            {abierto && (
              <Box flexDirection="column" borderStyle="round" borderColor={colorEquipo} paddingX={1} marginLeft={2}>
                <Text {...suave} wrap="wrap">
                  {agente.description}
                </Text>
                <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
                  <Text backgroundColor={CLARO.chip.fondo} color={CLARO.chip.letra}>{` ${agente.effort} `}</Text>
                  <Text backgroundColor={CLARO.chip.fondo} color={CLARO.chip.letra} wrap="wrap">
                    {` ${toolsLabel(agente.tools)} `}
                  </Text>
                </Box>
                {etiquetas !== '' && (
                  <Text color={acentoTxt} wrap="wrap">
                    {etiquetas}
                  </Text>
                )}
                {listaAvisos}
                <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
                  {edit}
                  {copiar}
                </Box>
                <Text {...suave} wrap="wrap">
                  {agente.ruta}
                </Text>
              </Box>
            )}
          </Box>
        )
      }

      const cantEquipos = new Set(catalogo.agentes.map(a => a.equipos[0] ?? 'sin equipo')).size
      const burbujaEquipos = !tranquilo
          ? burbujaEstado()
          : catalogo.agentes.length === 0
            ? 'No encuentro agentes. Creá uno con + Nuevo agente.'
            : `${plural(cantEquipos, 'equipo', 'equipos')} y ${plural(catalogo.agentes.length, 'agente', 'agentes')}. Abrí un equipo para ver quién hace qué.`

      // Un equipo sin actividad en el patio se marca: hay que pensarle una (arte-actividades.ts).
      const sinActividad = (equipo: string) =>
        equipo !== 'sin equipo' && !actividadDe(equipo).pensada ? (
          <Text key={`sin-actividad-${equipo}`} color={acentoTxt} wrap="wrap">
            {`⚠ El equipo ${equipo} no tiene actividad en el patio: hay que pensarla.`}
          </Text>
        ) : null

      const skillGrupo = (equipo: string, abierto: boolean) =>
        abierto ? (
          <Box key={`skill-${equipo}`} flexDirection="column">
            <Box marginTop={1}>
              <Button
                key={`abrir-skill-${equipo}`}
                label={`${abiertos[`skill:${equipo}`] === true ? '▾' : '▸'} Cómo trabaja el equipo`}
                dimColor
                onPress={() => alternarSkill($, equipo)}
              />
            </Box>
            {abiertos[`skill:${equipo}`] === true && (
              <Text color={tx} wrap="wrap">{skills[equipo] ?? 'Este equipo no tiene skill todavía.'}</Text>
            )}
          </Box>
        ) : null

      const encabezadoGrupo = (equipo: string, cantidad: number, abierto: boolean) => {
        if (!hasSvg || e.surface === 'terminal') {
          return (
            <Box key={`grupo-${equipo}`} flexDirection="column">
              <Box flexDirection="row" alignItems="center" flexWrap="wrap">
                <Box paddingX={1}>
                  <Button
                    key={`abrir-grupo-${equipo}`}
                    label={`${abierto ? '▾' : '▸'} ${equipo} (${cantidad})`}
                    onPress={() => alternar($, `grupo:${equipo}`)}
                  />
                </Box>
              </Box>
              {sinActividad(equipo)}
              {skillGrupo(equipo, abierto)}
            </Box>
          )
        }
        const acento = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
        const dios = DIOSES_EQUIPO[equipo]?.dios ?? ''
        const tarea = TAREA_EQUIPO[equipo]
        const diosArte = cachedSvg(`dios2-${equipo}`, equipo, () => diosSvg(equipo, 2, acento))
        const numArte = cachedSvg(`doblones2-${cantidad}-${acento[0]}`, `${cantidad}|${acento[0]}`, () =>
          doblonesSvg(cantidad, 2, acento[0]),
        )
        const subtitulo = dios !== '' && tarea !== undefined ? `${dios} · ${tarea}` : dios

        return (
          <Box
            key={`grupo-${equipo}`}
            flexDirection="row"
            alignItems="center"
            borderStyle="round"
            borderColor={acento[0]}
            paddingX={1}
            backgroundColor={CLARO.tarjeta}
            hover={{ backgroundColor: CLARO.tarjetaHover }}
          >
            <Svg
              key={`svg-grupo-${equipo}`}
              source={diosArte}
              alt={dios !== '' ? `Bandera ${dios} del equipo ${equipo}` : `Bandera del equipo ${equipo}`}
              {...sizeProps(diosArte)}
            />
            <Box flexDirection="column" flexGrow={1} flexShrink={1} minWidth={0} paddingX={1}>
              <Text
                color={legibleEn(acento[0], [CLARO.tarjeta, CLARO.tarjetaHover])}
                bold
                wrap="wrap"
              >
                {equipo}
              </Text>
              <Box flexDirection="row" alignItems="center">
                <Svg
                  key={`svg-maya-${equipo}`}
                  source={numArte}
                  alt={`${plural(cantidad, 'doblón', 'doblones')}, uno por agente`}
                  {...sizeProps(numArte)}
                />
                <Text color={CLARO.texto}>{cantidad === 1 ? ' 1 agente' : ` ${cantidad} agentes`}</Text>
              </Box>
              {subtitulo !== '' && (
                <Text color={CLARO.textoSuave} wrap="wrap">
                  {subtitulo}
                </Text>
              )}
              {sinActividad(equipo)}
              {skillGrupo(equipo, abierto)}
            </Box>
            <Box alignSelf="center">
              <Button
                key={`abrir-grupo-${equipo}`}
                label={`${abierto ? '▾' : '▸'} ${equipo}`}
                onPress={() => alternar($, `grupo:${equipo}`)}
              />
            </Box>
          </Box>
        )
      }

      return (
        <Box flexDirection="column" {...fondoPanel}>
          {barraSuperior()}
          {noticeLine}
          {claro
            ? cabeceraEscena(placasEquipos, `${caraAlt}. Banderas de los equipos: ${Object.keys(DIOSES_EQUIPO).join(', ')}`, burbujaEquipos)
            : cabecera(
                temploArte !== '' ? (
                  <Svg key="svg-templo" source={temploArte} alt="Edificio de la oficina" {...sizeProps(temploArte)} />
                ) : null,
                burbujaEquipos,
              )}
          <Box flexDirection="column">
          {claro && estanteArte !== '' && (
            <Svg key="svg-estante" source={estanteArte} alt="Repisa con botellas y mapas" {...sizeProps(estanteArte)} />
          )}
          <Box flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={2}>
            {formNuevo}
            <Select
              key="filtro-etiqueta"
              label="Etiqueta: "
              options={opcionesFiltro.map(value => ({ value }))}
              value={filtroActual}
              onSelect={value => update($, filtroAtom, () => value)}
            />
          </Box>
          {catalogo.errores.length > 0 && (
            <Box flexDirection="row">
              <Text color="red">⚠ </Text>
              <Button
                key="abrir-errores"
                label={`${abiertos.errores === true ? '▾' : '▸'} ${catalogo.errores.length} archivo(s) con error`}
                onPress={() => alternar($, 'errores')}
              />
            </Box>
          )}
          {abiertos.errores === true &&
            catalogo.errores.map(item => (
              <Text key={`error-${item.ruta}`} color="red" wrap="wrap">
                {`${item.ruta}: ${item.error}`}
              </Text>
            ))}
          {catalogo.cargado && catalogo.agentes.length === 0 && (
            <Box flexDirection="column">
              <Text {...suave} wrap="wrap">
                {`No hay agentes en ${catalogo.raiz}. Lo mejor es instalar los del kit (kit/agentes). Si no, podés crear los 4 roles base o uno nuevo con + Nuevo agente.`}
              </Text>
              <Box flexDirection="row" marginTop={1}>
                <Button
                  key="roles-base"
                  label="Crear los 4 roles base…"
                  onPress={() => alternar($, 'confirmar-roles-base')}
                />
              </Box>
              {abiertos['confirmar-roles-base'] === true && (
                <Box flexDirection="column">
                  <Text color={tx} wrap="wrap">
                    {`¿Crear implementador, corrector, investigador y revisor en ${catalogo.raiz}${catalogo.raiz.includes('/') ? '/' : '\\'}base? No se pisa ningún archivo.`}
                  </Text>
                  <Box flexDirection="row" columnGap={2} marginTop={1}>
                    <Button key="roles-base-si" label="Sí, crearlos" onPress={() => crearRolesBase($)} />
                    <Button
                      key="roles-base-no"
                      label="No"
                      onPress={() => update($, abiertosAtom, v => ({ ...v, 'confirmar-roles-base': false }))}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {[...grupos.entries()].map(([equipo, lista]) => {
            // Con un filtro que deja un solo grupo, ese grupo se muestra abierto.
            const grupoAbierto =
              abiertos[`grupo:${equipo}`] === true || (filtroActual !== 'todas' && grupos.size === 1)

            return (
              <Box key={`equipo-${equipo}`} flexDirection="column">
                {encabezadoGrupo(equipo, lista.length, grupoAbierto)}
                {grupoAbierto && lista.map((agente, pos) => tarjeta(agente, pos))}
              </Box>
            )
          })}
          <Text {...suave} wrap="wrap">Los cambios se guardan en el archivo del agente; valen en una sesión nueva o a los pocos segundos.</Text>
          </Box>
          {pieCierre((termRows - 30) * 20)}
          {frisoCierre}
        </Box>
      )
    }

    const abiertosSub = await read($, abiertosAtom)
    const informes = await read($, informesAtom)
    const resumenAbierto = abiertosSub.resumen !== false

    // Uso de la sesión: ventanas de 5 h y semanal, contexto y el botón de compactar. Arranca abierto.
    const usoAbierto = abiertosSub.uso !== false
    const confirmandoCompactar = abiertosSub['confirmar-compactar'] === true
    const svgUso =
      hasSvg && e.surface !== 'terminal'
        ? cachedSvg('uso-tablero', `${W}|${quieto}|${JSON.stringify(datosUso)}`, () =>
            tableroUsoSvg(datosUso, W, { quieto }),
          )
        : ''
    const anchoBarra = narrow ? 10 : 20
    const filaUso = (clave: string, nombre: string, pct: number, renueva: string, queda = false) => {
      const barra = barraUso(pct, anchoBarra)

      return (
        <Box key={`uso-${clave}`} flexDirection="row" flexWrap="wrap">
          <Text color={tx}>{pad(nombre, 10)}</Text>
          <Text color={claro ? colorUsoClaro(pct) : colorUso(pct)}>{barra.llena}</Text>
          <Text {...suave}>{barra.vacia}</Text>
          <Text color={tx} bold>{` ${pct.toLocaleString('es-UY', { maximumFractionDigits: 1 })} %`}</Text>
          {queda && <Text {...suave}>{` · quedan ${quedaPct(pct)} %`}</Text>}
          {renueva !== '' && <Text {...suave}>{` · se renueva ${renueva}`}</Text>}
        </Box>
      )
    }
    const limitesUso = (uso?.limites ?? []).slice().sort(
      (a, b) =>
        (a.kind === 'five_hour' ? 0 : a.kind === 'seven_day' ? 1 : 2) -
        (b.kind === 'five_hour' ? 0 : b.kind === 'seven_day' ? 1 : 2),
    )
    const confirmacionCompactar = confirmandoCompactar ? (
      <Box flexDirection="column">
        <Text color={tx} wrap="wrap">
          ¿Compactar la conversación ahora? Claude resume lo hablado y libera contexto, igual que /compact.
        </Text>
        <Box flexDirection="row" columnGap={2} marginTop={1}>
          <Button key="compactar-si" label="Sí, compactar" onPress={() => compactarSesion($)} />
          <Button
            key="compactar-no"
            label="No"
            onPress={() => update($, abiertosAtom, v => ({ ...v, 'confirmar-compactar': false }))}
          />
        </Box>
      </Box>
    ) : null
    // Escritorio: un solo lugar para el uso, el tablero dibujado. Botones en una fila arriba, pegado a la escena.
    const usoClaro = (
      <Box key="uso-sesion" flexDirection="column" width="100%" backgroundColor={ESCENA_FONDO}>
        <Box flexDirection="row" columnGap={2}>
          <Button
            key="abrir-uso"
            label={`${usoAbierto ? '▾' : '▸'} Uso de la sesión`}
            onPress={() => alternar($, 'uso', true)}
          />
          {usoAbierto && (
            <Button key="compactar" label="Compactar sesión…" onPress={() => alternar($, 'confirmar-compactar')} />
          )}
        </Box>
        {usoAbierto && confirmacionCompactar}
        {usoAbierto && svgUso !== '' && (
          <Svg key="svg-uso" source={svgUso} alt={altUso(datosUso)} {...sizeProps(svgUso)} />
        )}
      </Box>
    )
    const panelUso = claro ? null : (
      <Box key="uso-sesion" flexDirection="column">
        <Box marginTop={1}>
          <Button
            key="abrir-uso"
            label={`${usoAbierto ? '▾' : '▸'} Uso de la sesión`}
            onPress={() => alternar($, 'uso', true)}
          />
        </Box>
        {usoAbierto && (
          <Box flexDirection="column" paddingLeft={2}>
            {limitesUso.map(l =>
              filaUso(l.kind, NOMBRE_LIMITE[l.kind] ?? l.kind, l.percentUsed, cuandoRenueva(l.resetsAt, nowReal), l.kind === 'five_hour' || l.kind === 'seven_day'),
            )}
            {limitesUso.length === 0 && uso?.costo !== undefined && (
              <Box key="uso-costo" flexDirection="row" flexWrap="wrap">
                <Text color={tx}>{pad('Costo', 10)}</Text>
                <Text color={tx} bold>{`US$ ${uso.costo.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
                <Text {...suave}> en esta sesión</Text>
              </Box>
            )}
            {limitesUso.length === 0 && (
              <Text {...suave} wrap="wrap">
                Las ventanas de 5 horas y semanal aparecen después de la primera respuesta.
              </Text>
            )}
            {uso?.contexto !== undefined && filaUso('contexto', 'Contexto', uso.contexto, '')}
            <Box flexDirection="row" marginTop={1}>
              <Button
                key="compactar"
                label="Compactar sesión…"
                onPress={() => alternar($, 'confirmar-compactar')}
              />
            </Box>
            {confirmacionCompactar}
          </Box>
        )}
      </Box>
    )
    // Líneas que ocupa el bloque de uso (para no tapar la lista con poco espacio).
    const lineasUso = claro
      ? 1 + (usoAbierto ? linesOf(svgUso) + (confirmandoCompactar ? 3 : 0) : 0)
      : (usoAbierto
      ? 2 +
        Math.max(1, limitesUso.length) +
        (limitesUso.length === 0 && uso?.costo !== undefined ? 1 : 0) +
        (uso?.contexto !== undefined ? 1 : 0) +
        (confirmandoCompactar ? 3 : 0)
      : 1)
    const sorted = orderTree(rows)

    const count = (status: string) => rows.filter(row => row.status === status).length
    const done = count('completed')
    const failed = count('failed')
    const stopped = count('killed')
    const others = rows.filter(row => !isKnown(String(row.status ?? ''))).length
    const summary = [
      `${running} corriendo`,
      plural(done, 'lista', 'listas'),
      `${failed} ${failed === 1 ? 'falló' : 'fallaron'}`,
    ]
    if (stopped > 0) summary.push(plural(stopped, 'frenada', 'frenadas'))
    if (others > 0) summary.push(plural(others, 'otro', 'otros'))
    const tokensVistos = rows.reduce((sum, row) => sum + totalTokens(informes[row.id]?.tokens ?? {}), 0)
    if (tokensVistos > 0) summary.push(`${fmtNum(tokensVistos)} tokens`)

    const nowBucket = Math.floor(now / BUCKET_MS) * BUCKET_MS
    const patioEstado = (await read($, patioAtom)) as Record<string, PatioEntrada>

    // Palabra grande: corre > falló > lista; sin subagentes, ninguna.
    const bigWord = running > 0 ? 'corre' : failed > 0 ? 'falló' : done > 0 ? 'lista' : ''

    // Cada SVG se arma aparte: si uno falla, se omite y el resto sigue.
    let pisoSvg = ''
    type Celda = { id: string; fase: string; svg: string; alt: string; titulo: string; equipo: string }
    const celdas: Celda[] = []
    // Equipos que hay en el patio, en orden de aparición: la leyenda de colores.
    const equiposPatio: string[] = []
    let celdasPorFila = 1
    let filasPatio = 1
    // Escala del patio: 3 si todos los agentes del patio entran en una fila a escala 3 (se ven
    // mejor las actividades); si no, 2. A escala 3 la fila mide 81 px: con el cielorraso no pasa la cara.
    let escalaPatio = 2
    let wordSvg = ''
    let lineSvg = ''
    if (hasSvg) {
      const enPatio = rows.filter(row => {
        const entrada = patioEstado[row.id]

        return row.status === 'running' || (entrada !== undefined && entrada.hasta > now)
      }).length
      escalaPatio = enPatio > 0 && enPatio <= Math.floor(disponible / (PATIO_ANCHO * 3)) ? 3 : 2
      celdasPorFila = Math.max(1, Math.floor(disponible / (PATIO_ANCHO * escalaPatio)))
      // Escritorio: la escena única usa siempre escala 3; los peces nadan a lo ancho, debajo del barco.
      if (claro) {
        escalaPatio = 3
        celdasPorFila = porFilaEscena(W)
      }
      const fondoCelda = claro ? ESCENA_FONDO : fondo
      podarCeldas(new Set(rows.map(row => row.id)))
      for (const row of [...rows].sort((x, y) => (x.firstSeen ?? 0) - (y.firstSeen ?? 0))) {
        const entrada = patioEstado[row.id]
        const fase = row.status === 'running' ? 'entra' : entrada && entrada.hasta > now ? entrada.fase : ''
        if (fase === '') continue
        const info = parse(row.description, roleNames, row.type)
        const { equipo } = glifoDe(info.base, info.role, catalogo.agentes)
        const acento = EQUIPO_ACENTO[equipo] ?? EQUIPO_ACENTO.base
        const etiqueta = info.card
        const titulo = [info.card, info.model, info.role, info.text, `equipo ${equipo}`].filter(part => part !== '').join(SEP)
        const svg = cachedSvg(`celda-${row.id}`, `${fase}|${equipo}|${etiqueta}|${quieto}|${titulo}|${escalaPatio}`, () =>
          celdaPatioSvg({
            fase,
            acento,
            actividad: actividadParaCelda(actividadDe(equipo).actividad, escalaPatio, acento[0]),
            semilla: semillaDe(row.id),
            escala: escalaPatio,
            etiqueta,
            quieto,
            fondo: fondoCelda,
            titulo,
          }),
        )
        if (svg !== '' && !equiposPatio.includes(equipo)) equiposPatio.push(equipo)
        if (svg === '') continue
        const accion = fase === 'explota' ? 'explotando' : fase === 'sale' ? 'saliendo' : 'trabajando'
        celdas.push({ id: row.id, fase, svg, alt: `Agente ${etiqueta} ${accion}`, titulo, equipo })
      }
      // Tope de dos filas: salen/explotan primero, luego las que corren de la más nueva a la más vieja.
      const maxCeldas = claro ? Math.min(8, celdasPorFila * 2) : celdasPorFila * 2
      if (celdas.length > maxCeldas) {
        const orden = new Map(rows.map((row, i) => [row.id, i]))
        const saliendo = celdas.filter(c => c.fase === 'sale' || c.fase === 'explota')
        const corriendo = celdas
          .filter(c => !(c.fase === 'sale' || c.fase === 'explota'))
          .sort((x, y) => (rows[orden.get(y.id) ?? 0]?.firstSeen ?? 0) - (rows[orden.get(x.id) ?? 0]?.firstSeen ?? 0))
        const elegidas = [...saliendo, ...corriendo].slice(0, Math.max(0, maxCeldas - 1))
        const resto = celdas.length - elegidas.length
        const escalaMas = claro ? 3 : 2
        const masSvg =
          maxCeldas > 0
            ? cachedSvg(`celda-mas-${resto}-${escalaMas}`, `${resto}|${fondoCelda}`, () =>
                celdaMasSvg(resto, escalaMas, { fondo: fondoCelda }),
              )
            : ''
        celdas.length = 0
        celdas.push(...elegidas)
        if (masSvg !== '') {
          celdas.push({ id: 'mas', fase: '', svg: masSvg, alt: `Y ${resto} agentes más`, titulo: '', equipo: '' })
        }
      }
      filasPatio = Math.max(1, Math.ceil(celdas.length / Math.max(1, celdasPorFila)))
      if (!claro && celdas.length < celdasPorFila) {
        const resto = disponible - celdas.length * PATIO_ANCHO * escalaPatio
        if (resto > 0) {
          pisoSvg = cachedSvg(`piso-${resto}-${escalaPatio}`, `${resto}|${escalaPatio}`, () =>
            pisoPatioSvg(resto, escalaPatio, { fondo }),
          )
        }
      }
      wordSvg = bigWord ? cachedSvg('palabra', bigWord, () => palabraEstadoSvg(bigWord, 3, { fondo })) : ''
      const lineRows: FilaTiempo[] = [...rows]
        .sort((a, b) => (a.firstSeen ?? 0) - (b.firstSeen ?? 0))
        .slice(-12)
        .map(row => {
          const info = parse(row.description, roleNames, row.type)
          const label = info.card !== '' ? `${info.card} ${info.text}`.trim() : info.text
          const out: FilaTiempo = {
            label: label || clean(row.type) || DASH,
            role: info.base,
            status: normalizeStatus(String(row.status ?? '')),
            startMs: row.firstSeen,
          }
          if (row.endedAt !== undefined) out.endMs = row.endedAt

          return out
        })
      // Sin subagentes corriendo el tiempo «ahora» no se ve: se usa el último fin,
      // así el string es idéntico y el marco no se recarga cada 10 s.
      const lastEnd = rows.reduce((max, row) => Math.max(max, row.endedAt ?? 0), 0)
      const lineNow = running > 0 ? nowBucket : lastEnd
      lineSvg =
        rows.length > 0
          ? cachedSvg('linea', `${W}|${lineNow}|${JSON.stringify(lineRows)}`, () =>
              timelineSvg(lineRows, lineNow, W, { tema: 'claro' }),
            )
          : ''
    }

    // Prioridad con poco espacio: lista > resumen > línea de tiempo > encabezado.
    // Sin Svg el cálculo es el de siempre. Una línea de texto son unos 20 px.
    // Líneas que ocupa una fila de la lista (con wrap puede ser más de una).
    // Cerrada ocupa una línea (dos si el panel es angosto); abierta suma las del texto completo.
    const rowLines = ({ row, depth }: Ordered): number => {
      const info = parse(row.description, roleNames, row.type)
      const full = info.text || clean(row.type) || DASH
      const base = narrow ? 2 : 1
      if (abiertosSub[`fila:${row.id}`] !== true) return base

      return base + Math.max(1, Math.ceil((full.length + 2 + depth * 2) / Math.max(10, textCols - 2)))
    }
    let budget = Math.max(1, termRows - 8 - lineasUso)
    let showSummarySvg = false
    let showLine = false
    let showHeader = false
    if (hasSvg) {
      // Se reservan pestañas, aviso, texto del resumen y la línea de «y N más».
      const reserved = sorted.slice(0, 5).reduce((sum, item) => sum + rowLines(item), 0)
      // Se suma la línea del botón «Resumen visual».
      let spare = termRows - 6 - lineasUso - Math.max(1, reserved) - (narrow ? 1 : 0)
      const summaryCost = linesOf(wordSvg)
      if (summaryCost > 0 && spare >= summaryCost) {
        showSummarySvg = true
        spare -= summaryCost
      }
      const lineCost = resumenAbierto ? linesOf(lineSvg) : 0
      if (lineCost > 0 && spare >= lineCost) {
        showLine = true
        spare -= lineCost
      }
      const headerPx = claro
        ? escenaAlto(W, celdas.length, celdas.length === 0)
        : Math.max(CARA_ALTO, DOSEL_ALTO + PATIO_ALTO * escalaPatio * filasPatio)
      // Se suman la franja de greca y la línea de la burbuja del robot.
      // También la línea de la leyenda de colores del patio.
      const headerCost =
        resumenAbierto && caraSvg !== '' ? Math.ceil(headerPx / 20) + 2 + (equiposPatio.length > 0 ? 1 : 0) : 0
      if (headerCost > 0 && spare >= headerCost) {
        showHeader = true
        spare -= headerCost
      }
      const used =
        (showSummarySvg ? summaryCost : 0) + (showLine ? lineCost : 0) + (showHeader ? headerCost : 0)
      budget = Math.max(1, termRows - 6 - lineasUso - used)
    }
    // Cuántas filas entran en `budget` líneas; como mínimo una, así la lista nunca desaparece.
    let room = 0
    let usedLines = 0
    for (const item of sorted) {
      const need = rowLines(item)
      if (room > 0 && usedLines + need > budget) break
      usedLines += need
      room += 1
    }

    // Escena única (escritorio): cielorraso, robot colgado y agentes en un solo SVG, en caché por su firma.
    const escenaAlt = [caraAlt, ...celdas.map(c => c.alt)].join('. ')
    const escenaUnica = (() => {
      if (!claro || caraSvg === '') return ''
      const firma = `${estado.emocion}|${quieto}|${W}|${celdas.map(c => `${c.id}:${c.fase}:${c.equipo}:${c.titulo}`).join(',')}`
      return cachedSvg('escena', `${firma}|${escenaAlt}`, () =>
        escenaOficinaSvg({
          ancho: W,
          cara: cachedSvg('cara-escena', `${estado.emocion}|${quieto}`, () =>
            caraRobotSvg(estado.emocion, 3, { quieto, marco: true }),
          ),
          celdas: celdas.map(c => ({ svg: c.svg })),
          vacia: true,
          quieto,
          alt: escenaAlt,
        }),
      )
    })()
    const escenaPatio = (
      <Box flexDirection="row" flexWrap="wrap" backgroundColor={CLARO.escena}>
        {celdas.map(celda => (
          <Svg
            key={`celda-${celda.id}`}
            source={celda.svg}
            alt={celda.alt}
            {...sizeProps(celda.svg)}
            isInteractive
          />
        ))}
        {pisoSvg !== '' && (
          <Svg key="piso-patio" source={pisoSvg} alt="Patio de agentes vacío" {...sizeProps(pisoSvg)} isInteractive />
        )}
        {equiposPatio.length > 0 && (
          <Box key="leyenda-patio" flexDirection="row" flexWrap="wrap" width="100%" columnGap={1}>
            {equiposPatio.map(equipo => (
              <Text
                key={`leyenda-${equipo}`}
                backgroundColor={chipEquipo(equipo).fondo}
                color={chipEquipo(equipo).letra}
              >{` ■ ${equipo} `}</Text>
            ))}
          </Box>
        )}
      </Box>
    )

    const summaryText = (
      <Text bold color={tx} wrap="wrap">
        {summary.join(SEP)}
      </Text>
    )
    const pastillas: Array<{ texto: string; fondo: string; color: string }> = []
    if (running > 0) pastillas.push({ texto: ` ${running} corriendo `, ...PASTILLAS_CLARO.corre })
    if (done > 0) pastillas.push({ texto: ` ${plural(done, 'lista', 'listas')} `, ...PASTILLAS_CLARO.lista })
    if (failed > 0) {
      pastillas.push({ texto: ` ${failed} ${failed === 1 ? 'falló' : 'fallaron'} `, ...PASTILLAS_CLARO.fallo })
    }
    if (stopped > 0) pastillas.push({ texto: ` ${plural(stopped, 'frenada', 'frenadas')} `, ...PASTILLAS_CLARO.frenada })
    const bigStatus = bigWord === 'corre' ? 'running' : bigWord === 'lista' ? 'completed' : 'failed'

    return (
      <Box flexDirection="column" {...fondoPanel}>
        {barraSuperior()}
        {noticeLine}
        {claro ? (
          <Box flexDirection="column">
            <Box flexDirection="column" width="100%" backgroundColor={ESCENA_FONDO}>
              {showHeader && resumenAbierto && escenaUnica !== '' && (
                <Svg key="svg-escena" source={escenaUnica} alt={escenaAlt} {...sizeProps(escenaUnica)} isInteractive />
              )}
            </Box>
            {showHeader && resumenAbierto && escenaUnica !== '' && burbujaEstado() !== '' && (
              <Box backgroundColor={CLARO.burbuja} borderStyle="round" borderColor={CLARO.burbujaBorde} paddingX={1}>
                <Text color={CLARO.texto} wrap="wrap">
                  {burbujaEstado()}
                </Text>
              </Box>
            )}
            {showHeader && resumenAbierto && escenaUnica !== '' && equiposPatio.length > 0 && (
              <Box key="leyenda-patio" flexDirection="row" flexWrap="wrap" width="100%" columnGap={1}>
                {equiposPatio.map(equipo => (
                  <Text
                    key={`leyenda-${equipo}`}
                    backgroundColor={chipEquipo(equipo).fondo}
                    color={chipEquipo(equipo).letra}
                  >{` ■ ${equipo} `}</Text>
                ))}
              </Box>
            )}
            {showHeader && resumenAbierto && escenaUnica !== '' && grecaSvg !== '' && (
              <Box key="caja-greca" width="100%" backgroundColor="#9c8763">
                <Svg key="svg-greca" source={grecaSvg} alt="Soga trenzada" {...sizeProps(grecaSvg)} />
              </Box>
            )}
            {usoClaro}
          </Box>
        ) : (
          showHeader && resumenAbierto && caraSvg !== '' && cabecera(escenaPatio, burbujaEstado())
        )}
        <Box flexDirection="column">
        {hasSvg && e.surface !== 'terminal' ? (
          <Box flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={1}>
            {showSummarySvg && wordSvg !== '' && (
              <Svg
                key="svg-palabra"
                source={wordSvg}
                alt={`Estado general: ${statusWord(bigStatus)}`}
                {...sizeProps(wordSvg)}
                isInteractive
              />
            )}
            {pastillas.map(item => (
              <Text key={`pastilla-${item.texto}`} backgroundColor={item.fondo} color={item.color}>
                {item.texto}
              </Text>
            ))}
            {tokensVistos > 0 && <Text {...suave}>{`${fmtNum(tokensVistos)} tokens`}</Text>}
            <Box flexGrow={1} />
            {rows.length > 0 && (
              <Button
                key="abrir-resumen"
                label={resumenAbierto ? '▾ Resumen visual' : '▸ Resumen visual'}
                onPress={() => alternar($, 'resumen', true)}
              />
            )}
          </Box>
        ) : (
          summaryText
        )}
        {showLine && resumenAbierto && lineSvg !== '' && (
          <Svg
            key="svg-linea"
            source={lineSvg}
            {...sizeProps(lineSvg)}
            alt={`Línea de tiempo de ${plural(Math.min(rows.length, 12), 'subagente', 'subagentes')}`}
            isInteractive={running > 0}
          />
        )}
        </Box>
        {panelUso}
        {sorted.length === 0 &&
          (hasSvg && e.surface !== 'terminal' ? (
            <Box flexDirection="row" columnGap={2} alignItems="center">
              <Text color={tx} bold>Todavía no corrió ningún subagente.</Text>
              <Button key="ir-equipos" label="Ver equipos" onPress={() => showView($, 'roles')} />
            </Box>
          ) : (
            <Text bold color={tx}>Todavía no corrió ningún subagente.</Text>
          ))}
        {sorted.slice(0, room).map(({ row, depth }, index) => {
          const status = String(row.status ?? '')
          const info = parse(row.description, roleNames, row.type)
          const text = info.text || clean(row.type) || DASH
          const end = isTerminal(status) ? (row.endedAt ?? now) : now
          const elapsed = end - row.firstSeen
          const duration =
            row.durationUnknown || !Number.isFinite(elapsed) ? DASH : mmss(elapsed)
          const indent = '  '.repeat(Math.min(depth, 8))
          const isFailed = status === 'failed'
          const isDone = status === 'completed'
          const colFilas = [CLARO.filas[0], CLARO.filas[1], CLARO.filaHover]
          const colTexto = isDone ? CLARO.textoSuave : CLARO.texto
          const filaAbierta = abiertosSub[`fila:${row.id}`] === true
          const filaToggle = (
            <Button
              key={`abrir-fila-${row.id}`}
              label={filaAbierta ? '▾' : '▸'}
              onPress={() => alternar($, `fila:${row.id}`)}
            />
          )
          const nombreRol = info.role.slice(info.role.lastIndexOf('/') + 1)
          const glifoFila = glifoDe(info.base, info.role, catalogo.agentes)
          const iconSvg = hasSvg
            ? cachedSvg(`glifo1-${glifoFila.tipo}-${glifoFila.equipo}`, `${glifoFila.tipo}|${glifoFila.equipo}`, () =>
                glifoSvg(glifoFila.tipo, glifoFila.equipo, 1),
              )
            : ''

          return (
            <Box
              key={row.id}
              flexDirection="column"
              backgroundColor={CLARO.filas[index % 2]}
              hover={{ backgroundColor: CLARO.filaHover }}
            >
            <Box flexDirection={narrow ? 'column' : 'row'}>
              <Box flexDirection="row" flexShrink={0}>
                {iconSvg !== '' && (
                  <Svg
                    key={`icono-${row.id}`}
                    source={iconSvg}
                    alt={`Ícono ${TIPO_NOMBRE[glifoFila.tipo] ?? info.base} del equipo ${glifoFila.equipo}`}
                    {...sizeProps(iconSvg)}
                  />
                )}
                <Text color={legibleEn(statusColor(normalizeStatus(status)), colFilas)} bold={isFailed}>
                  {`${indent}${pad(statusWord(status), 8)}`}
                </Text>
                {(info.card !== '' || info.model !== '') && (
                  <Text color={colTexto}>
                    {`${info.card !== '' ? pad(info.card, 7) : ''}${info.model !== '' ? pad(info.model, 8) : ''}`}
                  </Text>
                )}
                {info.role !== '' && (
                  <Text color={legibleEn(roleColor(info.base), colFilas)}>
                    {pad(nombreRol, Math.max(14, nombreRol.length + 1))}
                  </Text>
                )}
              </Box>
              <Box flexDirection="row" flexGrow={1} flexShrink={1} minWidth={0}>
                <Box flexGrow={1} flexShrink={1} minWidth={0}>
                  <Text color={colTexto} wrap="truncate" bold={isFailed}>
                    {`${narrow ? '  ' : ''}${text}  ${duration}`}
                  </Text>
                </Box>
                <Box flexShrink={0}>{filaToggle}</Box>
              </Box>
            </Box>
            {filaAbierta && (
              <Text color={colTexto} wrap="wrap" bold={isFailed}>
                {`  ${text}`}
              </Text>
            )}
            {filaAbierta && (
              <Text color={colTexto} wrap="wrap">
                {`  Informe: ${informes[row.id] ? informes[row.id].texto || '(sin texto)' : 'todavía no llegó'}`}
              </Text>
            )}
            {filaAbierta && informes[row.id] && (
              <Text color={CLARO.textoSuave} wrap="wrap">
                {`  Tokens: entrada ${fmtNum(informes[row.id].tokens.input_tokens ?? 0)} · salida ${fmtNum(informes[row.id].tokens.output_tokens ?? 0)} · total ${fmtNum(totalTokens(informes[row.id].tokens))}`}
              </Text>
            )}
            </Box>
          )
        })}
        {sorted.length > room && (
          <Text {...suave}>… y {sorted.length - room} más (agrandá la ventana).</Text>
        )}
        {pieCierre((budget - usedLines) * 20)}
        {frisoCierre}
      </Box>
    )
  })
}
