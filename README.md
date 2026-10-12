# Klo-Ser Business — paquete de arranque

Todo lo necesario para arrancar **Klo-Ser Business** (la mitad de Klo-Ser para emprendedores): el contexto, la
ley visual, la marca y un prototipo navegable. Se copia tal cual a la raíz del repo vacío.

```
klo-ser-business/
├── README.md              ← estás aquí
├── CLAUDE.md              reglas de la casa para el agente (se carga solo)
├── CONTEXTO.md            quién, qué, por qué, módulos, decisiones, preguntas abiertas
├── DISENO.md              «Klo-Ser Noche»: colores, tipografía, amanecer, auras, movimiento, tokens
├── diseno/
│   └── prototipo.html     la referencia visual viva (Hoy · Proyectos · Semana · Clientes)
├── marca/
│   ├── logos/             wordmark, Klo, cabeza, monograma K — en azul/, blanco/, tinta/, originales/
│   ├── icono-business/    EL ÍCONO DE LA APP: K blanca sobre el amanecer (SVG + PNG 1024/512/192, apple-icon, favicon)
│   ├── iconos-real-estate/ los íconos azules del hermano, solo de referencia
│   ├── ornamentos/        50 SVG: soles, destellos, rayitas, flechas, calendarios…
│   └── componentes/       wordmark.tsx, klo.tsx, ornamentos.tsx, vacio-klo.tsx, klo-festeja.tsx
└── referencia/
    ├── klo-ser-real-estate/   estilos.ts, tokens de globals.css, fuentes del layout
    └── top-digital/           tokens oscuros, píldora degradada, StatCard, «Mi día», calendario
```

## Cómo cargarlo

1. Copia el **contenido** de esta carpeta a la raíz del repo nuevo y haz el primer commit.
2. Abre `diseno/prototipo.html` en el navegador (doble clic). Arriba a la derecha está
   «Ver en teléfono».
3. Abre Claude Code en el repo nuevo y pega esto:

> Lee `CLAUDE.md`, `CONTEXTO.md` y `DISENO.md`, y abre `diseno/prototipo.html`. Es Klo-Ser
> Business, el sistema con el que organizo mi trabajo como founder. Arranquemos con el brainstorming
> del brief: hazme las preguntas abiertas de la sección 4 de `CONTEXTO.md`, una por una, y luego
> escribe el spec de la v0.1.

## Lo que falta decidir (lo pregunta el agente en el brief)

- El dominio.
- Qué módulos entran en la v0.1 (sugerencia marcada con ★ en `CONTEXTO.md`).
- Cómo capturas hoy y qué quieres ver primero en la mañana.
- Tu papel en Top Digital frente al de Tadeo, para saber qué entregas son tuyas y cuáles delegas.


Preparado el 2026-10-12 desde `Klo-Ser/Inmobiliaria-CRM`.
