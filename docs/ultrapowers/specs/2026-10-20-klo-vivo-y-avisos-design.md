# Klo vivo + avisos — spec (2026-10-20)

Aprobado por Jair el 2026-10-20 («Dale con el diseño»). Reemplaza §6 del spec v0.1 (Klo: la captura)
y adelanta las notificaciones que no estaban en la v0.1.

## 1. Objetivo

Que Jair empiece a usar la app en serio hoy: sin fallas en la web, con **avisos push en el iPhone**
y con **Klo vivo** — un socio que entiende su panorama, captura, actúa y responde.

### Criterios de éxito

1. Ninguna pantalla de producción da error (logs de Vercel limpios, e2e en verde).
2. «Tell Klo: pasa la junta de Ana al jueves a las 4» → la task se mueve y Klo responde con Undo,
   en ≤ 5 s (mediana).
3. «¿Qué tengo el jueves?» → Klo responde con las tasks reales del jueves.
4. Una task a las 16:00 con aviso de 10 min hace vibrar el iPhone a las 15:50 (±1 min).
5. A las 8:00 de la zona de Jair llega el resumen del día.
6. «Recuérdame llamar a Ana a las 3» → push a las 15:00.

## 2. Alcance

| Dentro | Fuera (después) |
| --- | --- |
| Revisión de estabilidad y arreglos | Delegar tareas a otras personas (se deja la puerta: `asignar_a`) |
| Klo con Claude, herramientas, panorama, brief y memoria | Klo por voz / WhatsApp |
| Panel de conversación desde la barra (⌘K) | Historial largo de conversaciones (solo la sesión actual + últimas 20) |
| Web Push: antes de cada task, resumen de la mañana, avisos de Klo | Avisos por correo/SMS |
| Botón «Turn on notifications» en Ajustes | Resumen vespertino de vencidas |

## 3. Klo

### 3.1 Modelo y llamada

- Anthropic directo con `@anthropic-ai/sdk`, llave `ANTHROPIC_API_KEY` (solo servidor, también en
  Vercel). Modelo económico de la familia 5: `claude-haiku-5-5` (se confirma en la investigación).
- Bucle manual de herramientas en el servidor (route handler `POST /api/klo`, `maxDuration = 30`),
  máximo 6 vueltas y 20 s de tope; `output_config.effort: "low"` (chat corto). La respuesta final se manda al cliente (streaming si la investigación lo recomienda).
- **Prompt caching**: el bloque fijo (instrucciones de Klo + definiciones de herramientas + brief +
  memoria) va primero y marcado para caché; el panorama en vivo y el mensaje van después.

### 3.2 Contexto

1. **Instrucciones de Klo** (en código, `lib/klo/sistema.ts`): voz corta y cálida en inglés, socio que
   cuida la agenda; reglas: nunca inventar ids, usar `buscar` si no está en el panorama, fechas en
   la zona del usuario, pedir confirmación solo en lo delicado (§3.4).
2. **Klo's brief** (`perfiles.klo_brief`, texto ≤ 4 000 caracteres): lo escribe Jair en Ajustes →
   «Klo's brief» (quién es, spaces, prioridades, gente clave, cómo trabaja). Con un texto guía de
   ejemplo como placeholder.
3. **Memoria** (`klo_memoria`): datos cortos que Klo guarda con `recordar` («Ana = clienta de Top
   Digital, prefiere juntas en la tarde»). Ajustes las lista y deja borrarlas. Máximo 100; se mandan
   todas.
4. **Panorama en vivo** (`lib/klo/panorama.ts`, puro sobre datos ya leídos): fecha/hora actual y
   zona; spaces `{id, nombre, atajo}`; proyectos activos `{id, nombre, space, fecha_meta}`;
   actividades (clases) disponibles; tasks vencidas y de los próximos 14 días
   `{id, titulo, space, fecha, hora, hora_fin, clase, hecha}` (tope 80, las más cercanas primero).
5. **Conversación**: los últimos mensajes de la sesión (tope 20) desde `klo_mensajes`.

### 3.3 Herramientas

Cada herramienta tiene esquema zod (`lib/klo/herramientas.ts`), se valida en el servidor y se
ejecuta con el cliente Supabase de la sesión (RLS: Klo solo toca lo del usuario). Reutilizan la
lógica existente (`esquemaTarea`, `tareas/acciones.ts`, `repetir.ts`) en vez de duplicarla.

| Herramienta | Hace |
| --- | --- |
| `buscar` | Tasks/notas/proyectos por texto y/o rango de fechas (para lo que no está en el panorama). |
| `crear_task` | Crea task (título, space, fecha, fecha_fin, hora, hora_fin, clase, proyecto, aviso_min). |
| `cambiar_task` | Mueve/edita campos de una task por id. En tasks de serie aplica «Only this». |
| `completar_task` | Marca hecha / no hecha. |
| `borrar_task` | Borrado suave. **Siempre pide confirmación.** |
| `crear_nota` | Nota en un space. |
| `programar_aviso` | Push a una hora (`texto`, `enviar_en`), opcional ligado a una task. |
| `recordar` | Guarda un dato en la memoria. |

La lógica vive en funciones de `lib/klo/acciones.ts` que reciben el cliente Supabase; tanto las
server actions existentes como `/api/klo` las usan (el route handler no depende de
`revalidatePath`; el panel hace `router.refresh()`).

Validación: ids que no son del usuario → error devuelto a Claude («unknown id») para que corrija;
space faltante → space predeterminado; fechas/horas con las reglas de la hoja.

### 3.4 Autonomía («hace y avisa»)

- Crear, cambiar, completar, notas, avisos y recordar se ejecutan directo.
- Se pide confirmación para `borrar_task` y para el **4.º cambio en adelante** dentro de un mismo
  mensaje de Jair. Regla de conteo: el servidor lleva la cuenta de escrituras (todas las
  herramientas salvo `buscar`) a lo largo de todas las vueltas del bucle; las 3 primeras se
  ejecutan, y de ahí en adelante (y cualquier `borrar_task`, sea cual sea su número) **no se
  ejecutan**: se guardan en `pendiente` y a Claude se le responde «held for confirmation» para que
  lo diga. La UI muestra «Done: 3 · 2 more need your OK» con «Confirm / Cancel». Confirmar ejecuta
  exactamente lo guardado, sin volver a llamar a Claude.
- Cada acción ejecutada guarda su **deshacer** (estado anterior de los campos tocados) en
  `klo_mensajes.acciones`. El botón **Undo** del mensaje revierte todas las acciones de ese mensaje.

### 3.5 La barra y el panel

- El campo «Tell Klo» de la barra (y ⌘K, y el mosaico Klo de Today) abre un **panel** de vidrio:
  en escritorio flota bajo la barra; en el teléfono es una hoja desde abajo con el teclado abierto.
- Mensajes: lo que escribió Jair, la respuesta de Klo y chips de lo que hizo («Moved · Ana call →
  Thu 4 pm») con Undo. Indicador «Klo is thinking…».
- Al terminar una acción se refresca la vista (`router.refresh()`).
- Borrador en `localStorage` (try/catch). Sin red: no se envía y el texto se queda.

### 3.6 Fallas

- Error de Claude, respuesta inválida o > 20 s: si Klo no ejecutó nada, el texto se guarda como
  **nota** en el space predeterminado y Klo dice «I didn’t quite get that — saved it in Notes».
  Si ya ejecutó algo, se muestra lo hecho y el aviso del error.
- Sin `ANTHROPIC_API_KEY`: el panel dice «Klo is offline» y guarda como nota.
- Errores técnicos solo en la consola del servidor.

## 4. Avisos (Web Push)

### 4.1 Suscripción

- Service worker `public/sw.js` (eventos `push` y `notificationclick` → abre la URL del aviso, por
  defecto `/hoy`). Registro en el layout de la app.
- Llaves VAPID: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto). Envío
  con la librería `web-push`.
- Ajustes → «Notifications»: botón «Turn on notifications» (el permiso debe salir de un toque),
  estado actual, «Send a test», y la hora del resumen. En iPhone, si la app no está instalada en
  inicio, se explica cómo instalarla (iOS solo da push a apps instaladas, 16.4+).
- `push_suscripciones`: una fila por dispositivo (`endpoint` único). Si el servicio responde 404/410
  la fila se borra.

### 4.2 Qué se envía

**A quién y en qué zona:** el aviso de una task va al `responsable_id` (que por defecto es quien la
creó) y la fecha+hora de la task se interpretan en la `zona_horaria` de ese usuario. El resumen
cuenta las tasks no borradas cuyo `responsable_id` es el usuario. Tasks de varios días (`fecha_fin`)
avisan una vez, al inicio. Las repeticiones ya existen como filas reales con 180 días de horizonte,
así que el cron no necesita extender series.

1. **Antes de cada task**: tasks no hechas ni borradas con `hora`, cuando
   `inicio − aviso_min ≤ ahora` y `avisado_en is null`, con inicio aún en el futuro o hace < 5 min.
   `aviso_min` por defecto 10 (null = sin aviso), editable en la hoja («Alert: None, At start,
   5, 10, 15, 30, 60 min before»). Cambiar fecha/hora de la task limpia `avisado_en`.
   Texto: «Ana call · in 10 min (4:00 PM)».
2. **Resumen de la mañana**: a `perfiles.resumen_hora` (por defecto 08:00, null = apagado) en la zona
   del usuario, una vez al día (`perfiles.resumen_enviado` = fecha). Plantilla: «5 today · first at
   10:00: Ana call» / «Nothing scheduled today».
3. **Avisos de Klo**: filas de `avisos` con `enviar_en ≤ ahora` y `enviado_en is null`.

La lógica de «qué toca enviar» vive en funciones puras (`lib/avisos/calcular.ts`) con pruebas.

### 4.3 Quién dispara

- `GET /api/avisos/enviar` exige `Authorization: Bearer CRON_SECRET` (si no, 401). Usa el cliente
  de servicio (secret key) porque recorre a todos los usuarios; marca `avisado_en` / `enviado_en`
  **antes** de enviar (sin dobles avisos si dos pasadas se cruzan, con `update … where … is null
  returning`).
- `pg_cron` + `pg_net` en Supabase lo llaman **cada minuto** (el cron de Vercel Hobby es diario).
  El secreto del cron se guarda en Supabase Vault, no en la migración.

## 5. Datos

### 0013_klo

- `perfiles.klo_brief text` (≤ 4 000) + `grant update (klo_brief) on perfiles to authenticated`
  (perfiles y tareas usan permisos por columna).
- `klo_memoria (id, owner_id, texto ≤ 300, creado_en)` — RLS: dueño.
- `klo_mensajes (id, owner_id, sesion uuid, rol 'usuario'|'klo', texto, acciones jsonb,
  pendiente jsonb, deshecho_en, creado_en)` — RLS: dueño.

### 0014_avisos

- `tareas.aviso_min int default 10 check (aviso_min between 0 and 1440)`, `tareas.avisado_en
  timestamptz`; trigger que limpia `avisado_en` si cambian `fecha`, `hora` o `aviso_min`.
  `grant update (aviso_min) on tareas to authenticated` — `avisado_en` **no** se le da al usuario
  (solo service role / trigger).
- `perfiles.resumen_hora time default '08:00'`, `perfiles.resumen_enviado date`;
  `grant update (resumen_hora)` — `resumen_enviado` solo service role.
- `push_suscripciones (id, owner_id, endpoint unique, p256dh, auth, agente, creado_en)` — RLS: dueño.
- `avisos (id, owner_id, texto ≤ 200, url, tarea_id null, enviar_en, enviado_en, creado_en)` — RLS:
  dueño.
- Job de `pg_cron` (en un paso aparte con el secreto desde Vault).

Todas aditivas, con `owner_id` (multi-tenant) y su prueba de RLS en `scripts/probar-db.mjs`.

## 6. Estabilidad

Antes de construir: logs de runtime de Vercel (48 h), `npm run build`, e2e por proyecto, y paso
manual por Today, Calendar, Notes, Projects y Settings en 390 px y escritorio. Cada falla se arregla
con su prueba cuando aplique.

## 7. Pruebas

- **Vitest:** `klo/panorama` (topes, orden, zona), `klo/herramientas` (validación de ids ajenos,
  space predeterminado, conteo: 3 se ejecutan, el 4.º y `borrar_task` quedan pendientes), deshacer, `avisos/calcular`
  (ventana del aviso, resumen una vez al día en la zona, sin aviso con null).
- **e2e:** panel de Klo con `/api/klo` simulado (respuesta y Undo); Ajustes de notificaciones visible.
- **DB:** RLS de las tablas nuevas.
- **Real:** push de prueba en el iPhone de Jair y una conversación real con Klo en producción.

## 8. Orden

1. Estabilidad. 2. 0013 + Klo (servidor → panel → Ajustes brief/memoria). 3. 0014 + avisos
(SW, suscripción, endpoint, cron). 4. Variables en Vercel, deploy, prueba en el iPhone.
