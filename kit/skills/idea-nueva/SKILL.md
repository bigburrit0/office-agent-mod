---
name: idea-nueva
description: Lleva una idea nueva de cero a plan en 6 pasos (PRD, TRD, flujo, diseño, backend, plan) con cuestionarios en páginas interactivas y puertas de aprobación. Invocala al arrancar o retomar una idea en {{OFICINA}}\ideas\.
---
# Idea nueva

Fuente de verdad de pasos y puertas: `{{OFICINA}}\ideas\CLAUDE.md`. Si este texto y ese archivo difieren, manda el archivo. Vos sos el orquestador: despachás a los agentes y hablás con la usuaria. No escribís código ni los documentos vos.

## Antes de empezar

1. Fijá el nombre corto de la idea. La carpeta es `{{OFICINA}}\ideas\<idea>\`.
2. Si no hay `ESTADO.md`, creala con el paso 1 como actual. Si existe, leela y retomá desde el paso y la puerta pendiente que marca.
3. Mirá `{{BIBLIOTECA}}\index.md`: si ya hay conocimiento sobre el tema, usalo.
4. Plantillas en `{{EQUIPOS}}\plantillas\` (`PRD.md`, `TRD.md`, `FLUJO.md`, `DISENO.md`, `BACKEND.md`, `pagina-idea.html`, `pagina-idea.md`).

## Paso a paso

Cada paso termina cuando el documento existe en `<idea>\`, la página está publicada y `ESTADO.md` lo registra.

| Paso | Agente | Plantilla | Documento | Página para la usuaria |
|---|---|---|---|---|
| 1 | estratega | `PRD.md` | `PRD.md` | Una tarjeta por feature y una matriz de prioridad |
| 2 | arquitecto | `TRD.md` | `TRD.md` | Tabla requisito → cómo se prueba |
| 3 | disenador | `FLUJO.md` | `FLUJO.md` | Diagrama de pantallas para confirmar |
| 4 | disenador | `DISENO.md` | `DISENO.md` | Paletas y tipografías para elegir |
| 5 | arquitecto | `BACKEND.md` | `BACKEND.md` | Diagrama de entidades para validar |
| 6 | pm | (plan en oleadas) | `PLAN.md` + tareas JSON | Oleadas en una línea de tiempo |

### Paso 1 · PRD
1. Despachá al estratega con la idea y lo que dijo la biblioteca. Devuelve las features candidatas.
2. Publicá la página desde `{{EQUIPOS}}\plantillas\pagina-idea.html`: cambiá solo el bloque `<script type="application/json" id="datos">` (ver `pagina-idea.md`). Publicala con `capabilities: { db: {} }`.
3. Leé las respuestas con `ArtifactData`, acción `get`, ruta `respuestas/usuaria`. Un campo ausente es una pregunta sin responder: preguntá, no completes.
4. Con las respuestas, el estratega escribe `PRD.md`.
5. Anotá en `ESTADO.md`: link de la página, fecha, y «Puerta A pendiente».

### Pasos 2 a 5 · TRD, FLUJO, DISENO, BACKEND
Se despachan en este orden, cada uno con el PRD aprobado y los documentos anteriores:
1. Arquitecto → `TRD.md`.
2. Disenador → `FLUJO.md` y `DISENO.md`.
3. Arquitecto → `BACKEND.md` (ERD en Mermaid y endpoints).

Para cada documento, publicá una página propia según la columna «Página para la usuaria» de la tabla, con `db` y con preguntas de confirmar o elegir. Seguí el estilo de `pagina-idea.html`. Leé las respuestas con `ArtifactData` get `respuestas/usuaria`. Si la usuaria corrige algo, el mismo agente reescribe el documento.
Anotá en `ESTADO.md` cada link, cada decisión con fecha y «Puerta B pendiente».

### Paso 6 · PLAN
1. Despachá al pm con PRD, TRD y BACKEND aprobados. Escribe `PLAN.md` y las tareas en JSON (oleadas de máximo 3 tareas en paralelo, sin archivos compartidos).
2. Publicá las oleadas en una línea de tiempo. Leé las respuestas igual que antes.
3. Anotá en `ESTADO.md`: link, fecha y «Puerta C pendiente».

## Puertas (frenan y preguntan)

- **Puerta A**, después del PRD: la usuaria aprueba qué entra y qué queda afuera. Sin aprobación no arranca el paso 2.
- **Puerta B**, después de los pasos 2 a 5: aprueba técnica, flujo, diseño y datos. Sin aprobación no arranca el paso 6.
- **Puerta C**, después del plan: aprueba las oleadas. Recién ahí la idea pasa a proyecto: se **copian** (no se mueven) los documentos a `<proyecto>\docs\producto\`. Crear el proyecto también es puerta: se pregunta antes.

En cada puerta: mostrá el resumen y el link de la página, preguntá, esperá. Al aprobar, anotá fecha y decisión en `ESTADO.md` y pasá al paso siguiente.

## ESTADO.md

Paso actual (N de 6), puerta pendiente, links a las páginas y decisiones tomadas con fecha. El portafolio de la Oficina muestra «idea: paso N de 6», así que actualizalo en cada cambio de paso.

## Reglas

- Sin código: solo documentos y páginas.
- Cada pregunta abierta tiene dueño (la usuaria, el estratega, el arquitecto, el disenador o el pm) y queda anotada en `ESTADO.md`.
- Si falta información, parás y preguntás. No completás adivinando.
- Research solo si la biblioteca no tiene el tema: 2 investigadores en paralelo y después el librarian para ingerir el informe.
- Los cambios de alcance, de reglas del negocio y todo lo de producción, deploy, push, instalaciones y secretos son de la usuaria.
- Español rioplatense con voseo, claro y sin jerga. Separá lo verificado (con fuente y fecha) de lo supuesto.
