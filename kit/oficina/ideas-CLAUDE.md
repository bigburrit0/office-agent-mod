# Sesión de idea

Cada idea nueva se trabaja en su propia sesión, en `{{OFICINA}}\ideas\<idea>\`. Acá no se da el parte de la Oficina ni se escribe código.

## Al empezar
1. Si la carpeta `<idea>\` no tiene `ESTADO.md`, creala con el paso 1 y seguí `/idea-nueva`.
2. Si existe, leé `ESTADO.md` (paso actual y links a las páginas) y retomá desde ahí.

## Los 6 pasos (uno por documento, en `<idea>\`)
| Paso | Documento | Quién lo arma | Página para la usuaria |
|---|---|---|---|
| 1 | `PRD.md` | estratega | Una tarjeta por feature y una matriz de prioridad |
| 2 | `TRD.md` | arquitecto | Tabla requisito → cómo se prueba |
| 3 | `FLUJO.md` (Mermaid) | disenador | Diagrama de pantallas para confirmar |
| 4 | `DISENO.md` | disenador | Paletas y tipografías para elegir |
| 5 | `BACKEND.md` (ERD en Mermaid + endpoints) | arquitecto | Diagrama de entidades para validar |
| 6 | `PLAN.md` + tareas en JSON | pm | Oleadas en una línea de tiempo |

Plantillas: `{{EQUIPOS}}\plantillas\`. Investigación previa: `{{BIBLIOTECA}}\wiki\concepto-plantillas-documentar-idea.md`.

## Puertas (frenan y preguntan)
- **A** después del PRD: la usuaria aprueba qué entra y qué queda afuera.
- **B** después de los pasos 2 a 5: aprueba técnica, flujo, diseño y datos.
- **C** después del plan: aprueba las oleadas. Recién ahí la idea pasa a proyecto: se **copian** los documentos a `<proyecto>\docs\producto\` (no se mueven) y crear el proyecto es puerta (se pregunta).

## Cómo se pregunta
- Por feature: problema, para quién, prioridad, cómo sabés que funciona, qué queda afuera y un ejemplo.
- Las preguntas van en una página Artifact con almacenamiento `db`, fácil de entender, interactiva y con gráficos cuando se pueda. Las respuestas se leen con `ArtifactData`.
- Cada pregunta abierta tiene dueño. Si falta algo, el agente para y pregunta; no completa adivinando.

## ESTADO.md de la idea
Paso actual (N de 6), puerta pendiente, links a las páginas y decisiones tomadas con fecha. El portafolio de la Oficina muestra «idea: paso N de 6».

## Cómo hablar
Español rioplatense con voseo, claro, sin jerga. Separá lo verificado (con fuente y fecha) de lo supuesto.
