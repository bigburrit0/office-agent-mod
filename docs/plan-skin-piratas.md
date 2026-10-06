# Plan: skin «Piratas»

**Fecha:** 06/10/2026. **Rama:** `skin-piratas` (salió de `master` en `c9b07b1`).
**Fuente:** el formulario «Nueva skin de la oficina» que completó Nimai (respuestas guardadas el 06/10/2026, 20:30).
**Boceto:** `node mod/preview/boceto-piratas.mjs` → `mod/tests/salida/boceto-piratas.html` (panel a 378 px, el loro en 8 emociones, los peces, el tiburón, las banderas y los huevos de pascua). Abrirlo en el navegador: todo se mueve.

Este documento es el plan: todavía no se tocó el mod. Nimai aprobó el plan y las ideas el 06/10/2026 y pidió subir el nivel del arte (ver sección 6).

## 1. Lo que pidió Nimai

| Tema | Respuesta |
|---|---|
| Nombre | Piratas |
| Frase | «Gracia y quirkyness» |
| Mundo | Barco pirata, océano, playa, tropical |
| Mood | Enérgico, nostálgico, divertido, misterioso. Energía 9/10, humor 9/10 |
| Colores | Paleta «Neón»: fondo `#120b1f`, principal `#21e6c1`, acento `#ff2e88` |
| Dibujo | Pixel 8 bits (como hoy) |
| Protagonista | Un loro pirata (reemplaza al robot) |
| Subagentes | Peces y tiburones (reemplazan a los oficinistas) |
| Piezas | Todas: escena, personaje, patio, íconos, placas, uso, franjas, tarjetas y textos |
| Tono | Más humor |
| Referencias | El mar Caribe, *Piratas del Caribe* |
| Cómo se elige | Solo en su rama, como otra versión del mod |

No respondió: claro u oscuro, ni cuánta animación. Ver sección 5.

## 2. Cómo se hace

El mod ya separa el dibujo de la lógica: cada pieza es una función pura que devuelve un SVG (`hooks/arte-*.ts`, `hooks/pixel.ts`) y los colores del panel salen de `hooks/tema.ts`. La skin reemplaza esas funciones **con el mismo contrato** (mismos nombres, mismos parámetros, mismo tamaño de lienzo), así `register.tsx` casi no cambia y las pruebas de lógica siguen sirviendo.

- La paleta neón es oscura: el panel pasa a fondo `#120b1f` y textos claros. Los chequeos de contraste de `tema.test.ts` se rehacen sobre los fondos nuevos (≥ 4,5).
- Las referencias son de ambiente: nada de personajes, logos ni nombres de la película.
- Como Nimai eligió **solo rama**, los arreglos que se hagan en `master` no llegan solos. Propuesta: traer `master` a `skin-piratas` (merge) al terminar cada oleada.

## 3. Qué se convierte en qué

| Hoy (oficina) | Piratas | Archivo |
|---|---|---|
| Robot de los 80 con ~31 emociones, colgado del techo | **Loro pirata** con tricornio y parche, parado en la cofa. Mismas 31 emociones, con su versión pirata (tabla de abajo) | `arte-robot.ts` → `arte-loro.ts` |
| Cielorraso, pared y piso de la oficina | **Cubierta de noche:** cielo con luna y estrellas, mástil, vela con calavera, faroles magenta, barandilla y mar con espuma turquesa | `arte-escena.ts`, `arte-edificio.ts` |
| Oficinistas en escritorios, con la camisa del color del equipo | **Peces** del color del equipo, nadando bajo la línea de flotación; cada equipo con su objeto (dev con laptop, research con catalejo, datos con mapa…) | `arte-escritorios.ts`, `arte-actividades.ts` |
| Fases entra / juega / sale / explota | Entra nadando / nada en el lugar / se va nadando / **lo come el tiburón** (o explota en burbujas) | `arte-escritorios.ts` |
| 6 íconos de rol | Escriba → pluma y pergamino · vidente → catalejo · guardián → ancla · curandero → botiquín de barco · pm → brújula · estratega → mapa del tesoro | `arte-iconos.ts` |
| 12 placas de dioses por equipo | **12 banderas pirata:** calavera con huesos del color del equipo, cada una con su detalle | `arte-iconos.ts` |
| Contador LCD, batería de 5 h, almanaque | **Cofre de monedas** (tokens), **reloj de arena** (5 horas), **bitácora** (semana) | `arte-uso.ts` |
| Greca maya, pasillo, estante | **Cuerda y olas**; abajo, fondo marino con arena, algas y un cofre | `pixel.ts`, `arte-oficina.ts` |
| Tarjetas crema con borde del equipo | Tarjetas noche (`#1d1238`) con borde del equipo; botón principal magenta, secundarios turquesa | `tema.ts`, `register.tsx` |
| Burbuja del robot | Burbuja del loro, con humor pirata: «¡Arrr! 3 marineros nadando y un tiburón al acecho.» | `register.tsx`, `emociones.ts` |

**Algunas emociones del loro** (la tabla completa va en P-1):

| Emoción | Hoy | Loro |
|---|---|---|
| aburrido | toma café | se rasca con la pata |
| dormido | ahorro de energía | cabeza bajo el ala, «zzz» |
| pensando | procesando | mira con el catalejo |
| ruge | alarma | grita «¡Al abordaje!» |
| contento / festeja | feliz | muerto de risa, pico abierto |
| panico | pánico | plumas al aire, ojo enorme |
| hambre | hambre | pide galleta |
| tipea | tipea rápido | escribe en la bitácora con una pluma |

## 4. Oleadas (tarjetas P)

Como en las oleadas anteriores: cada tarjeta con agente, ≤ 5 archivos y aceptación binaria. Al cerrar cada una: `claude plugin test mod` en 0 fail, maqueta revisada a 378 px y merge de `master` en la rama.

| # | Qué | Archivos | Depende de |
|---|---|---|---|
| P-0 | **Paleta y panel oscuro:** `tema.ts` con la paleta neón y contraste ≥ 4,5 en todos los fondos | `tema.ts`, `tema.test.ts`, `register.tsx` | — |
| P-1 | **El loro:** `arte-loro.ts` con el contrato de `caraRobotSvg` y las 31 emociones, 2-4 cuadros cada una | `arte-loro.ts`, `register.tsx`, pruebas | P-0 |
| P-2 | **Escena de cubierta** con el loro en la cofa | `arte-escena.ts`, `arte-edificio.ts`, pruebas | P-1 |
| P-3 | **Peces y tiburón** en las 4 fases, con objeto por equipo | `arte-escritorios.ts`, `arte-actividades.ts`, pruebas | P-2 |
| P-4 | **Íconos de rol y banderas** de los 12 equipos | `arte-iconos.ts`, pruebas | P-0 |
| P-5 | **Cofre, reloj de arena y bitácora** | `arte-uso.ts`, pruebas | P-0 |
| P-6 | **Cuerda, olas y fondo marino** | `pixel.ts`, `arte-oficina.ts`, pruebas | P-0 |
| P-7 | **Textos con humor pirata** (burbuja, avisos, emociones) | `register.tsx`, `emociones.ts`, pruebas | P-1 |

Orden: P-0 y P-1 primero (lo que más se ve), después P-2 y P-3, y al final P-4 a P-7. Todas menos P-4, P-5 y P-6 tocan `register.tsx`: van en serie.

## 5. Preguntas para Nimai

1. **¿Solo oscuro?** La paleta neón está pensada para noche. Propuesta: solo tema oscuro.
2. **Animación.** No la marcaste. Por la energía 9/10 propongo **viva**: olas que se mueven, faroles que titilan, peces que nadan. El botón «Quieto» sigue frenando todo.
3. **¿Qué es el tiburón?** Propuesta: aparece cuando un subagente **falla** y se come al pez (la fase «explota»). Los que terminan bien se van nadando.
4. **Solo rama.** ¿Te sirve traer `master` a la rama después de cada oleada para no perder arreglos?
5. **El boceto:** ¿el loro, los peces y las banderas van por buen camino?

## 6. Boceto 2: el arte (06/10/2026)

**Pedido de Nimai:** «Pixel art de excelente nivel. Con alma, detalles, easter eggs. Algo que la gente diga wow. El loro tiene que ser visto de frente y tener un parche en el ojo.»

**Cómo se dibuja ahora.** El boceto 1 armaba las figuras con rectángulos y elipses por fórmula: a 42 × 34 píxeles eso queda borroso. El boceto 2 dibuja a mano, píxel por píxel, lo que lleva carácter (la cara, el pico, el parche, los peces, la calavera) y deja las fórmulas solo para lo que es naturalmente continuo (el ala del tricornio, los degradés del cielo y del agua, las olas). Reglas que sigue todo:

- Luz de luna desde arriba a la izquierda, con rampas de 3 a 5 tonos por color.
- Borde neón de los faroles a la derecha (rosa en el loro, turquesa en el sombrero).
- Contorno oscuro casi negro (`#1a0f24`), y contorno cálido donde el rojo está iluminado.
- Animaciones en cuadros discretos (SMIL). El botón «Quieto» las apaga todas.

**Archivos** (todos en `mod/preview/`, el mod todavía no los usa):

| Archivo | Qué tiene |
|---|---|
| `pixel-piratas.mjs` | Motor: grillas de colores, tramas, líneas, SVG con cuadros animados |
| `loro-piratas.mjs` | El loro de frente en 42 × 34 (el lienzo del robot con marco), 8 emociones |
| `escena-piratas.mjs` | La escena en corte, los peces y el tiburón |
| `boceto-piratas.mjs` | La página del boceto y las banderas |

**El loro:** guacamayo rojo de frente, con tricornio (copa con calavera, ribete de oro en V, pluma magenta, agujero de bala), parche con una cruz bordada en oro, aro de oro, collar con doblón y alas con las bandas amarilla, verde y azul. Emociones del boceto: vigía, risa, pánico (plumas paradas), dormido (sombrero caído), sospecha, ¡al abordaje!, hambre y guiño. Las 31 del robot se arman con las mismas piezas (ojo, pico, parche, plumas, extras) en P-1.

**Huevos de pascua del boceto:**
- El loro levanta el parche para guiñar, y el ojo de abajo está perfecto.
- El cangrejito saluda desde la percha.
- La luna tiene cara y guiña cada 27 s.
- Hay una constelación con forma de ancla.
- El gato del barco mira por un ojo de buey y parpadea.
- Un patito de goma flota en el agua.
- El tiburón tiene un diente de oro.
- Un pulpito con tricornio se asoma del cofre.
- Cada medio minuto, un tentáculo del kraken sale de la arena.
- Hay una botella con un mensaje en la arena.
- Pasa una estrella fugaz cada 19 s.
- El barco se llama «La Galleta».

**Decisiones que tomé por las respuestas del formulario** (Nimai aprobó el plan; si alguna no va, se cambia):
- Solo tema oscuro.
- Animación viva.
- El tiburón aparece cuando un subagente falla.
- Traer `master` a la rama al cerrar cada oleada.

**Peso:** el panel limita cada SVG a 131.072 caracteres (`SVG_MAX`). Hoy pesan:
- Escena completa: 290.848 caracteres animada, 179.111 quieta.
- Loro: 91.118 en vigía (8 cuadros), entre 22.000 y 46.000 el resto.

En P-1 y P-2 hay que bajarlo:
- El loro y los peces van como SVG aparte, anidados en la escena, igual que hoy el robot y las celdas.
- Los cuadros del loro guardan solo lo que cambia (ojo, pico, pluma), no el loro entero cada vez.
- El cielo, la isla y el barco se dibujan una sola vez y se guardan en caché.

**Para pulir en su oleada:** los emblemas de las banderas se leen poco a escala 3 (P-4). El casco bajo el agua y el reflejo de la luna pueden quedar más finos (P-2).
