/**
 * Contrato de los valores que el mod «tablero-oficina» guarda en `$.state`.
 * Autocontenido: sin imports.
 */

/** Un subagente tal como lo recuerda el tablero. */
export type TableroFila = {
  /** Id del subagente (el de `$.agent.list()`). */
  id: string
  /** Etiqueta cruda: `T-60 · sonnet · implementador · panel de subagentes`. */
  description: string
  /** Definición del agente (`general-purpose`, `Explore`, ...). */
  type: string
  /** `running`, `completed`, `failed`, `killed` u otro estado del motor. */
  status: string
  /** Id del subagente que lo lanzó; ausente si lo lanzó el hilo principal. */
  parentId?: string
  /** Instante (ms desde epoch) en que el mod vio este id por primera vez. */
  firstSeen: number
  /** Instante en que el mod lo vio terminar (`completed`, `failed` o `killed`); ausente si no terminó. */
  endedAt?: number
  /** `true` si ya estaba terminado cuando el mod lo vio: no se sabe cuánto duró. */
  durationUnknown?: true
}

/** Especificación de un rol de subagente (su «nicho»). Es lo que se guarda en `$.store`. */
export type RolSpec = {
  /** Cuándo delegar a este rol (una línea). */
  description: string
  /** System prompt completo del rol. */
  prompt: string
  /** Herramientas permitidas; `null` es «todas» (sin restricción). */
  tools: string[] | null
  /** `haiku`, `sonnet`, `opus` o `inherit`. */
  model: string
  /** `low`, `medium`, `high`, `xhigh` o `max`. */
  effort: string
}

/** Un agente nativo leído de la carpeta de agentes de Claude Code (equivale a `AgenteCatalogo` de hooks/catalogo.ts). */
export type AgenteTablero = {
  name: string
  description: string
  prompt: string
  tools: string[] | null
  model: string
  effort: string
  color?: string
  equipos: string[]
  etiquetas: string[]
  emblema?: string
  /** Líneas de frontmatter desconocidas, valor crudo. */
  extra: Record<string, string>
  /** Ruta del archivo. */
  ruta: string
}

/** Lo que el panel sabe del catálogo de agentes nativos. */
export type CatalogoEstado = {
  agentes: AgenteTablero[]
  /** Archivos que no se pudieron leer, con el motivo. */
  errores: { ruta: string; error: string }[]
  /** `true` cuando el catálogo se leyó al menos una vez. */
  cargado: boolean
  /** Carpeta raíz del catálogo; vacía si no se pudo determinar. */
  raiz: string
}

/** Borrador del formulario de edición de un rol: sus campos más el nombre del rol. */
export type RolBorrador = RolSpec & {
  /** Nombre del agente que se está editando (`implementador`, ...). */
  name: string
  /** Ruta del archivo del agente que se reescribe al guardar. */
  ruta?: string
  /** Texto del archivo antes del último Guardar desde el panel (para «Volver a la versión anterior»); ausente si no hay copia. */
  anterior?: string
}

declare module 'claude-code' {
  interface PluginState {
    'tablero-oficina': {
      /** Subagentes vistos, los últimos 100, del más viejo al más nuevo. */
      agents: TableroFila[]
      /** Instante (ms desde epoch) de la última actualización del panel. */
      now: number
      /** Agentes nativos leídos de la carpeta de agentes (pestaña Equipos). */
      catalogo: CatalogoEstado
      /** Filtro de la pestaña Equipos: `todas` o una etiqueta/equipo. */
      filtro: string
      /** Vista del panel: la tabla de subagentes o la pestaña Equipos (editor de agentes). */
      view: 'subagentes' | 'roles'
      /** Roles guardados por la usuaria (rol → especificación); lo que falta usa el valor por defecto. */
      roles: Record<string, RolSpec>
      /** Borrador del formulario de edición; `null` si no se está editando ningún rol. */
      draft: RolBorrador | null
      /** `true` cuando el prompt completo está desplegado en la vista Editar; empieza cerrado. */
      promptAbierto: boolean
      /**
       * Desplegables abiertos del panel. Claves: `grupo:<equipo>`, `agente:<name>`, `skill:<equipo>`, `errores`, `desc`, `fila:<id>`, `resumen`,
       * `uso`, `confirmar-restaurar`, `confirmar-anterior`, `seccion:<n>` (sección n del prompt en Editar),
       * `confirmar-compactar` y `confirmar-roles-base`.
       * Ausente = cerrado, salvo `resumen` y `uso`, que arrancan abiertos (ausente = abierto).
       */
      abiertos: Record<string, boolean>
      /**
       * Informe de cada subagente por su id (máximo 100, se descartan los más viejos): último texto final
       * (recortado a 4000 caracteres), tokens sumados de todos sus turnos y cantidad de turnos.
       */
      informes: Record<string, { texto: string; tokens: Record<string, number>; turnos: number }>
      /** Tokens que consumió la sesión entera (hilo principal y subagentes), sumados turno a turno; `turnos` cuenta los turnos. */
      tokensSesion: { input: number; output: number; cacheLectura: number; cacheEscritura: number; turnos: number }
      /** Cuerpo (sin frontmatter) de la skill de cada equipo, leído al abrir su desplegable `skill:<equipo>`. */
      skillsEquipo: Record<string, string>
      /** Formulario de «Nuevo agente»; `null` si está cerrado. */
      nuevo: { nombre: string; equipo: string } | null
      /** Aviso de una línea (error o confirmación); vacío si no hay. */
      notice: string
      /** Reacción transitoria del jaguar y el instante (ms desde epoch) en que vence; `null` si no hay. */
      reaccion: {
        tipo:
          | 'caceria'
          | 'ruge'
          | 'contento'
          | 'bufido'
          | 'guardado'
          | 'panico'
          | 'frustrado'
          | 'chispazo'
          | 'festeja'
          | 'aplaude'
          | 'orgullo'
          | 'alivio'
          | 'saluda'
          | 'sorpresa'
        hasta: number
        quien?: string
      } | null
      /**
       * Uso de la sesión según el motor (`$.session.usage()` y `session.measure`): ventanas de
       * `five_hour`, `seven_day` (y `spend_limit`) con su porcentaje y su renovación, y el contexto lleno en %.
       * `null` hasta la primera lectura. `medido` es el instante (ms desde epoch) de la lectura.
       */
      uso: {
        limites: Array<{ kind: string; percentUsed: number; resetsAt?: string }>
        contexto?: number
        /** Costo de la sesión en dólares (redondeado a centavos); ausente si el motor no lo da. */
        costo?: number
        medido: number
      } | null
      /**
       * Tarjeta (o id) del subagente que falló, desde que el jaguar rugió hasta que aparece uno nuevo corriendo;
       * vacío si no está molesto. Un `true` viejo guardado se trata como molesto sin nombre.
       */
      molesto: string
      /** Agentes del patio que ya no corren: salen (`sale`) o explotan (`explota`) hasta el instante `hasta` (ms desde epoch). */
      patio: Record<string, { fase: 'sale' | 'explota'; hasta: number }>
      /** `true` cuando la usuaria pidió el arte quieto (sin animaciones). */
      quieto: boolean
    }
  }
}
