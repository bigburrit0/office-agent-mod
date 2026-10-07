import { expect, test } from 'claude-code/testing'

import { ICONO_TEXTO, pantallaTerminal, textoDe } from '../hooks/terminal-texto'

const base = { emocion: 'tipea', progreso: 58, ancho: 60, hora: '10:15', prompt: '$ ./oficina', estado: '[2 AG] [58%] T-9' }

test('el monitor en texto: patito, marco del ancho pedido, prompt con hora, barra de estado y marca', () => {
  const l = pantallaTerminal(base).map(textoDe)
  expect(l[0].endsWith('__(o>')).toBe(true)
  expect(l[1]).toBe(`┌${'─'.repeat(58)}┐`)
  for (const x of l.slice(1, -1)) expect([...x].length).toBe(60)
  expect(l[2].includes('$ ./oficina█') && l[2].includes('10:15')).toBe(true)
  expect(l.some(x => x.includes('[2 AG] [58%] T-9'))).toBe(true)
  expect(l[l.length - 1].includes('TERMINAL 9000') && l[l.length - 1].includes('CLAVE: 1234')).toBe(true)
})

test('agentes con el ícono y el color de su equipo; [OK] al salir, [SEGV] al fallar; demasiados se resumen', () => {
  const agentes = [
    { equipo: 'research', color: '#5aa9e6', etiqueta: 'R-2', fase: 'juega', texto: 'busca' },
    { equipo: 'datos', color: '#2cc6d0', etiqueta: 'D-4', fase: 'sale' },
    { equipo: 'seguridad', color: '#d04a3c', etiqueta: 'S-1', fase: 'explota' },
  ]
  const lineas = pantallaTerminal({ ...base, agentes })
  const plano = lineas.map(textoDe).join('\n')
  expect(plano.includes(`${ICONO_TEXTO.research} R-2`)).toBe(true)
  expect(plano.includes('[OK]') && plano.includes('[SEGV]')).toBe(true)
  expect(lineas.flat().some(t => t.t.startsWith(ICONO_TEXTO.research) && t.c === '#5aa9e6')).toBe(true)
  const muchos = Array.from({ length: 12 }, (_, i) => ({ equipo: 'base', color: '#8a93a0', etiqueta: `T-${i}`, fase: 'juega' }))
  expect(pantallaTerminal({ ...base, agentes: muchos }).map(textoDe).join('\n').includes('agentes más')).toBe(true)
})

test('sin agentes muestra la barra del proyecto (o --% sin datos); apagado: fin del turno y luz ámbar', () => {
  expect(pantallaTerminal({ ...base, progreso: null }).map(textoDe).join('\n').includes('PROY')).toBe(true)
  expect(pantallaTerminal({ ...base, progreso: null }).map(textoDe).join('\n').includes('--%')).toBe(true)
  const ap = pantallaTerminal({ ...base, emocion: 'apagado', apagado: true })
  expect(ap.map(textoDe).join('\n').includes('FIN DEL TURNO')).toBe(true)
  expect(ap[ap.length - 1].some(t => t.t === '●' && t.c === '#FFB43A')).toBe(true)
})

test('Equipos con carpetas (cantidad y aviso) y Editar con el archivo', () => {
  const eq = pantallaTerminal({ ...base, carpetas: [{ nombre: 'base', color: '#8a93a0', cantidad: 5, aviso: true }] }).map(textoDe).join('\n')
  expect(eq.includes('base/ 5 ⚠')).toBe(true)
  const ed = pantallaTerminal({ ...base, lineas: ['---', 'name: alfa'] }).map(textoDe).join('\n')
  expect(ed.includes(' 2 name: alfa')).toBe(true)
})
