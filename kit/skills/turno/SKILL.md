---
name: turno
description: Turno de ejecución de un proyecto: toma tarjetas aprobadas, despacha por oleadas, verifica cada aceptación, corrige solo y escribe el parte. Invocala en la carpeta del proyecto para correr un turno.
---

# Turno de ejecución

Sos el orquestador del turno. Planificás, despachás y verificás; no escribís código. Trabajás en la carpeta del proyecto. Reglas de fondo: `{{EQUIPOS}}\ESQUEMA-SISTEMA.md` (§1 a §4 y §9), `{{EQUIPOS}}\METODO.md` y `{{EQUIPOS}}\REGLAS-TARJETAS.md`.

## 1. Al empezar

1. Verificá tu modelo: tiene que ser Opus con esfuerzo alto. Si no lo es, avisale a la usuaria antes de seguir.
2. Corré `get_usage` y anotá los dos porcentajes (límite de 5 horas y semanal) como consumo de inicio.
3. Si el límite de 5 horas pasa del 80 %, no arranques: avisá y cerrá.
4. Sacá la foto previa con `git status` del repo (R10). Lo ajeno que ya estaba sin commitear no entra en ningún commit del turno; si entra, se avisa en el parte.

## 2. Tomar trabajo

1. Listá las tarjetas con `estado: aprobada` en `<proyecto>\tarjetas\` (en mi-app: `docs\arquitectura\tarjetas\`).
2. Armá oleadas de hasta 3 tarjetas sin archivos permitidos en común. Respetá las dependencias que digan las tarjetas.
3. Pasá a `estado: en curso` las de la oleada antes de despachar.
4. No inventes tarjetas ni cambies alcance: solo corrés lo aprobado.

## 3. Despachar

- Al agente que nombra la tarjeta (nunca `general-purpose`), con un mensaje corto que apunta al archivo: «Tu tarjeta: <ruta>».
- Las tres de una oleada van en paralelo, en el mismo mensaje.
- El subagente no ve la conversación: la tarjeta es su única especificación.

## 4. Verificar

1. Corré vos la aceptación de cada tarjeta, con la salida filtrada a totales y fallas. No te alcanza con el informe del subagente.
2. Verde: pasá la tarjeta a `hecha`, anotá la evidencia en el `ESTADO.md` o el tablero del proyecto y hacé commit local. Autor «Claude Code», nunca el nombre de la usuaria. Sumá al commit solo los archivos permitidos de la tarjeta.
3. Nada de push.

## 5. Se arregla solo (SIS-12)

- Aceptación en rojo: escribí la tarjeta `<ID>b` para el `corrector` (sonnet, esfuerzo medio), con el síntoma, la salida filtrada y los archivos permitidos, y despachala sin esperar a la usuaria.
- Segunda falla en la misma tarjeta: pasala a `frenada` con el motivo escrito en la tarjeta y seguí con las demás.
- El corrector nunca toca alcance, reglas del cálculo ni producción. Si la causa está ahí, frená directo.

## 6. Puertas

Frená la tarjeta y dejala en «pendiente de vos» si implica: deploy, push, migraciones remotas, secretos, compras o plata, crear cuentas o proyectos, instalar o actualizar software, borrar archivos, cambiar reglas del negocio o del cálculo, alcance nuevo, o dos fallas. Seguí con el resto de las tarjetas.

## 7. Cierre

1. Corré la suite completa una sola vez, al final de todas las tarjetas.
2. Si algo falla, aplicá la regla de reintentos de `METODO.md`: repetí solo lo que falló, hasta 3 veces. Si falla solo, es error real y va tarjeta `<ID>b`. Si pasa solo, corré la suite completa una vez más; si vuelve a fallar, tarjeta `<ID>b`; si pasa, anotala como prueba sensible a la carga.
3. Corré `get_usage` otra vez y anotá el consumo final.
4. Escribí el parte en `{{OFICINA}}\partes\AAAA-MM-DD-<proyecto>.md` con:
   - qué se hizo, tarjeta por tarjeta;
   - la evidencia (aceptación y suite);
   - consumo de inicio y de fin, con los dos porcentajes;
   - las `frenada` con su motivo y lo que queda en «pendiente de vos»;
   - los avisos de la foto previa si lo ajeno entró en un commit.
5. Actualizá el tablero del proyecto (máximo ~2 KB) y dejá todo commiteado en local.

## Referencia rápida

| Estado | Quién lo cambia | Cuándo |
|---|---|---|
| `aprobada` a `en curso` | turno | al armar la oleada |
| `en curso` a `hecha` | turno | aceptación verde corrida por el turno |
| `en curso` a `frenada` | turno | 2 fallas o una puerta |
