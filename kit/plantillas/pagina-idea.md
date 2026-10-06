# Página de cuestionario por idea (plantilla)

Archivo: `{{EQUIPOS}}\plantillas\pagina-idea.html`. Es una página única, sin librerías. Para reutilizarla se cambia solo el bloque `<script type="application/json" id="datos">`.

## 1. Llenar el bloque `datos`

```json
{
  "idea": { "nombre": "Nombre de la idea", "resumen": "Una o dos frases." },
  "features": [
    { "id": "f1", "nombre": "Nombre corto", "descripcion": "Qué hace, en una frase.", "esfuerzo": "Bajo" }
  ]
}
```

- `id`: texto corto y estable (`f1`, `f2`...). Es la clave de las respuestas; no lo cambies después de publicar.
- `esfuerzo`: `Bajo`, `Medio` o `Alto`. Es una estimación del equipo y se usa en el eje horizontal de la matriz. Si falta, cuenta como `Medio`.
- El valor (eje vertical) sale de la prioridad que elige la usuaria.

## 2. Publicar

Pasá estas `capabilities` al publicar:

```
capabilities: { db: {} }
```

Si la página va a leerse solo desde Claude Code con `ArtifactData`, no hace falta más. Sin `db` (o con el visor sin sesión) la página avisa y guarda en `localStorage`; en ese caso las respuestas no llegan a Claude.

## 3. Leer las respuestas

Con la herramienta `ArtifactData`, acción `get`, ruta `respuestas/usuaria`. Devuelve:

```json
{ "<featureId>": { "problema": "", "paraQuien": "", "prioridad": "Alta|Media|Baja", "funciona": "", "afuera": "", "ejemplo": "" } }
```

Si el documento no existe, la usuaria todavía no contestó nada. Un campo ausente es una pregunta sin responder: el agente pregunta, no la completa adivinando.
