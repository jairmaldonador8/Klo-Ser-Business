# Brief — Klo-Ser Business

> Respuestas de Jair a las preguntas abiertas de `CONTEXTO.md` §4. Sesión de brainstorming del
> 2026-10-12. Lo que aquí se decide alimenta el spec de la v0.1
> (`2026-10-12-v0.1-design.md`).

## Las 6 preguntas

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Qué frentes tienes hoy? | **Klo-Ser** (la startup), **Top Digital** (la agencia), **Marca personal**. Los tres para empezar; se crean como datos, no en código. |
| 2 | ¿Cómo capturas un pendiente en la calle? | Se manda un **WhatsApp a sí mismo**. La v0.1 tiene que ser igual de rápida: la app instalada abre con la captura de Klo lista. Klo en WhatsApp viene después. |
| 3 | ¿Qué quieres ver primero en la mañana? | **La tarjeta que manda: cuántas cosas te tocan hoy y cuál sigue.** A la derecha, la agenda del día (como el prototipo). Abajo: lo que está en riesgo y la meta grande. |
| 4 | ¿La captura crea tarea, nota o decide sola? | **Klo decide** (tarea, bloque o nota), muestra lo que entendió y Jair confirma de un toque. Atajos `/` opcionales fijan el frente. Lo que Klo no entiende queda como nota. |
| 5 | ¿Manda el calendario o la lista? | **Mixto.** Con hora → agenda; sin hora → lista del día. Arrastrar entre ambas, después. |
| 6 | Papel de Jair y de Tadeo en Top Digital | **Socios.** Jair hace posts, diseños, sitios, sistemas, chatbots. Tadeo tendrá **su propio Klo-Ser Business**; se conectan compartiendo el **espacio** Top Digital y desde ahí se delegan tareas. |

## Decisiones que salieron de la sesión

| Decisión | Detalle |
|---|---|
| **Frente = espacio compartible** | Cada frente es un espacio con miembros. Hoy junta los espacios donde eres miembro. Compartir = invitar al espacio; delegar = asignar a un miembro. Multi-tenant desde la migración 0001. |
| **Google Calendar: leer en la v0.1** | Solo lectura (cubre también Notion Calendar, que vive sobre Google). Meta de fondo: que Klo-Ser Calendar sea el calendario principal → la escritura hacia Google llega en una versión siguiente. |
| **App web instalable (PWA)** | Sin App Store en la v0.1. Captura dentro de la app. Sin Atajo de iOS ni menú Compartir por ahora (Jair usa iPhone; Web Share Target no existe en iOS). App nativa (Capacitor) anotada para cuando se venda a otros founders. |
| **Comandos `/`** | Visión: en Business y en Real Estate, `/KLOSER` carga al frente, `/algo` delega. v0.1: solo `/atajo` de frente en la captura de Klo. |
| **Camino de construcción** | Proyecto nuevo y limpio; se copia código probado de Real Estate y Top Digital, no su esquema. |

## Módulos

| Módulo | v0.1 |
|---|---|
| Hoy | ★ |
| Proyectos y objetivos | ★ |
| Tareas y entregas | ★ |
| Clientes | ★ |
| Notas | ★ |
| Klo por texto (propone → confirmas, atajos `/`) | ★ |
| Calendario: día/semana + **leer** Google | ★ |
| App web instalable | ★ |
| Equipo: invitar a Tadeo, delegar | después |
| Escribir hacia Google Calendar | después |
| Dinero | después |
| Klo en WhatsApp · voz · Atajo de iOS | después |
| Notificaciones push | después |
| App nativa en App Store | cuando salga a otros founders |

## Pendiente de decidir

- **El dominio** — antes de subir la v0.1 a producción; no frena el arranque en localhost.
