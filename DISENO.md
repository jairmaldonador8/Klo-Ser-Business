# «Klo-Ser Noche» — la ley visual de Klo-Ser Business

> La referencia viva es `diseno/prototipo.html`. Este documento dice el porqué y los valores
> exactos; el prototipo dice cómo se ve. Si chocan, manda la referencia y se corrige este archivo.
> Desde 2026-10-14, para la forma (ventana, mosaicos, navegación) manda `diseno/vidrio.html` (§9).

## La idea en una línea

**El gallo canta al amanecer.** La app es la noche del founder (fondo azul-negro profundo) y lo
que importa *ahora* se pinta con **el amanecer**: un degradado azul Klo-Ser → violeta → coral →
sol. Es el carácter atrevido de Top Digital (degradado con intención, cifras gordas, resplandores)
vestido con la marca Klo-Ser (azul `#1c36ee`, el sol `#ffc933`, Klo, Fredoka).

Real Estate es papel y azul sereno para asesores en la calle. Business es de noche, de pantalla
grande y de trabajo profundo: más contraste, más tamaño, más luz.

## 1. Color

### Superficies (de lo más hondo a lo más cercano)

| Token | Valor | Uso |
|---|---|---|
| `--noche` | `#06071a` | Fondo de la página. Azul-negro, nunca negro puro ni gris |
| `--noche-2` | `#0c0e24` | Fondo de las píldoras de frentes y de chips oscuros |
| `--tarjeta` | `#11142d` | Tarjeta estándar |
| `--tarjeta-alta` | `#181c3d` | Tarjeta elevada, hover, inputs |
| `--linea` | `#242a52` | Bordes 1 px (`ring-1`) |
| `--linea-suave` | `rgba(255,255,255,.06)` | Divisores dentro de tarjeta |

### Tinta

| Token | Valor | Uso |
|---|---|---|
| `--tinta` | `#f3f4fb` | Texto principal, cifras |
| `--tinta-2` | `#a9aed0` | Texto secundario |
| `--tinta-3` | `#6b7199` | Micro-etiquetas, deshabilitado |

### Marca y acento

| Token | Valor | Uso |
|---|---|---|
| `--azul` | `#1c36ee` | Formas grandes: botón principal, Klo, el monograma. **Nunca texto sobre la noche** (2.5:1) |
| `--azul-luz` | `#7181f4` | Texto/ícono azul sobre la noche (5.5:1) |
| `--violeta` | `#7b4dff` | Tramo medio del amanecer |
| `--coral` | `#ff6b6b` → usar solo dentro del degradado | Tramo cálido del amanecer |
| `--sol` | `#ffc933` | El sol: detrás de Klo, el punto vivo, el subrayado a mano |

### El amanecer (la firma)

```css
--amanecer: linear-gradient(100deg, #1c36ee 0%, #7b4dff 38%, #ff5f8f 70%, #ffc933 100%);
```

Pasa por violeta y rosa a propósito: un azul directo a amarillo se ensucia en verde-gris a la
mitad.

**Dónde va (con intención, como en Top Digital):**

1. **La tarjeta que manda** — una por pantalla, rellena de amanecer, con la cifra que importa.
2. **La píldora activa** de la navegación (se desliza entre secciones).
3. **El «+» azul** de las píldoras de frentes, con resplandor.
4. **Palabras clave** en titulares grandes (`text-amanecer`, recorte de texto). Una por titular.
5. **Barras de avance** de proyectos y el aro del avatar.

**Dónde NO:** fondos de página, tarjetas estándar, texto de párrafo, más de una tarjeta rellena
por pantalla.

### Estados sin semáforo (ley de la familia Klo-Ser)

Nada de rojo/ámbar/verde para decir estado. La urgencia se dice con:

- **Peso y tinta**: lo vencido va en `--tinta` y semibold; lo que puede esperar, en `--tinta-3`.
- **El punto vivo**: un punto `--sol` de 6 px (con halo) marca lo que está pasando AHORA
  (bloque en curso, entrega de hoy, pago que vence hoy). Con cuentagotas.
- **Palabras**: «vencida», «hoy», «en 2 días». El texto manda.

## 2. Resplandores (auras)

El recurso más atrevido. Detrás de la tarjeta que manda van 2–3 manchas difuminadas:

```css
.aura { position:absolute; inset:-40px; z-index:-1; pointer-events:none; }
.aura i { position:absolute; border-radius:999px; filter:blur(60px); }
/* azul 45 %, violeta 35 %, sol 25 % */
```

- Solo detrás de **una** cosa por pantalla (la tarjeta que manda o el login).
- `box-shadow` con color para lo que flota: `0 12px 40px -12px rgba(123,77,255,.55)` en el «+»
  y en el botón principal.
- **Grano**: una capa de ruido SVG al 4 % sobre la página quita lo plano de la noche.

## 3. Tipografía

| Rol | Fuente | Cómo |
|---|---|---|
| Titulares, saludos, nombres de proyecto | **Fredoka** 600 | La redonda hermana del wordmark. `tracking-tight` |
| Cifras héroe, contadores, horas, dinero | **Poppins** 800 | `tabular-nums`, `tracking -0.04em`, `leading-none`. Gordas, al estilo TD |
| Cuerpo y UI | **Poppins** 400/500/600 | 14–15 px en teléfono |
| Notas a mano | **Caveat** 700 | Con cuentagotas: un comentario de Klo, un «¡Vas bien!» en la tarjeta que manda, girada −4° |

Escala: micro 11 px · cuerpo 14–15 · subtítulo 18 · título 24–28 (Fredoka) · cifra 40 · cifra
héroe 64–88 (Poppins 800).

**Micro-etiqueta (eyebrow)**: MAYÚSCULAS 11 px, `tracking .22em`, `--tinta-3`, con una rayita de
amanecer de 14×2 px delante — tomado del brand kit de Top Digital.

## 4. Forma

- Radio base `1rem`; tarjetas `1.4rem` (`rounded-[1.4rem]`); la que manda `1.75rem`; píldoras
  `rounded-full`.
- Tarjeta estándar: `bg-tarjeta ring-1 ring-linea`. Al pasar el mouse sube 2 px y el borde se
  tiñe de violeta (`ring-violeta/45`) con sombra violeta difusa.
- Vidrio: ver §9. Solo tres capas con blur: la ventana, el riel y las píldoras; los mosaicos son
  translúcidos **sin** blur propio, porque el vidrio cuesta fps.
- Rejilla bento: ver §9 (4 columnas en escritorio, 2 a 390 px, huecos de 12 px). **Nunca scroll
  horizontal.**

## 5. Klo y la marca sobre la noche

- **Wordmark Klo-Ser**: blanco (`marca/logos/blanco/03-wordmark.svg`) sobre la noche. Debajo, en
  versalitas Fredoka espaciadas, **BUSINESS** (como REAL ESTATE en el hermano). El lockup completo
  solo en login, splash y portadas; en la barra va el wordmark solo.
- **Monograma K**: ícono de app — cuadro de amanecer a sangre con la K blanca (`marca/icono-business/`;
  el de Real Estate es azul liso, así se distinguen en la pantalla del teléfono).
- **Klo va SIEMPRE azul** (`marca/logos/azul/`). Sobre la noche se para en un **disco sol** o un
  disco claro; nunca se pinta de blanco (el ojo se ve al revés). Va en momentos: saludo, vacíos,
  captura, festejo. Nunca como ícono de navegación.
- Ornamentos (`marca/ornamentos/`): soles, destellos, rayitas. En la noche se usan en `--sol` o
  `--azul-luz`, con cuentagotas, nunca sobre texto operativo.
- **Intocable**: el lettering, la K y el gallo no se redibujan ni se deforman.

## 6. Movimiento

- Cambio de vista: sale en 160 ms (blur 8 px, −10 px); entra en 480 ms
  `cubic-bezier(.16,1,.3,1)` desde blur 10 px, +18 px. (Tomado de TD.)
- Cifras que cuentan de 0 al valor (ease-out cúbico, 900 ms) solo en la tarjeta que manda.
- Barras de avance que crecen; palomita que se dibuja; tarea que se tacha.
- Klo festeja cuando cierras el día (salta y se voltea).
- **Todo** respeta `prefers-reduced-motion`, y el contenido nunca depende de que una animación
  corra (se ve completo sin ella).

## 7. Tema claro

Por defecto la app es de noche. Si algún día se pide un tema claro, se hereda el de Klo-Ser Real
Estate (`referencia/klo-ser-real-estate/globals-tokens.css`) y el amanecer se queda igual. No es
parte de la v0.1.

## 8. Tokens para Tailwind v4 (pegar en `globals.css`)

```css
@theme {
  --color-noche: #06071a;
  --color-noche-2: #0c0e24;
  --color-tarjeta: #11142d;
  --color-tarjeta-alta: #181c3d;
  --color-linea: #242a52;
  --color-tinta: #f3f4fb;
  --color-tinta-2: #a9aed0;
  --color-tinta-3: #6b7199;
  --color-azul: #1c36ee;
  --color-azul-luz: #7181f4;
  --color-violeta: #7b4dff;
  --color-rosa: #ff5f8f;
  --color-sol: #ffc933;
  --radius: 1rem;
}
@utility bg-amanecer {
  background-image: linear-gradient(100deg, #1c36ee 0%, #7b4dff 38%, #ff5f8f 70%, #ffc933 100%);
}
@utility text-amanecer {
  background-image: linear-gradient(100deg, #7181f4 0%, #9b7bff 35%, #ff7fa6 70%, #ffd25c 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
```

`text-amanecer` usa una versión **más clara** del degradado: el `#1c36ee` como texto sobre la
noche no se lee.

## 9. Vidrio (dirección 2026-10-14)

Referencia viva de la forma: `diseno/vidrio.html` (aprobada por Jair, inspirada en un tablero
estilo Vision OS). Lo de arriba (noche, amanecer, tipografía, Klo, estados sin semáforo) sigue
mandando; esto agrega cómo se acomoda. Para la forma de las vistas, manda `vidrio.html` sobre
`prototipo.html`.

- **Ventana**: la app vive en un panel de vidrio (`rgba(22,25,58,.62)` + `backdrop-blur` 30 px,
  borde `rgba(255,255,255,.10)`, radio 34 px; 28 px en teléfono) sobre la noche con auras.
- **Mosaicos**: dentro, rejilla bento de 4 columnas en escritorio, 2 en teléfono; radio 26 px
  (22 px en teléfono); fondo `rgba(255,255,255,.06)` sin blur. Lo vacío o «por crear» va punteado.
- **Color de frente** (identidad, **no** estado — no rompe «estados sin semáforo»): `azul`
  `#3550ff→#1c2fd0`, `violeta` `#9067ff→#6a3df0`, `rosa` `#ff7aa2→#f2457a`, `sol` `#ffd75a→#ffb81f`
  (tinta `#14102a` encima del sol). Pinta los mosaicos del frente, su píldora y el tinte de la
  ventana al estar dentro.
- **Piezas**: medidor de media luna con el amanecer · anillos de avance · hitos como cuentas ·
  pilas (barra de avance con texto encima) · interruptores · chips · orbe giratorio de Klo.
- **Navegación**: riel vertical de íconos (fila arriba en teléfono) y píldoras de frentes flotando
  abajo con el **+** azul.
- **Movimiento**: los mosaicos entran escalonados (55 ms) y los arcos se dibujan al abrir; todo se
  apaga con `prefers-reduced-motion`.

## 10. Negro (dirección 2026-10-18)

Pedido de Jair: fondo **negro puro**, estético y minimalista, profesional — una app que invite a
trabajar, cerrar deals y hacer dinero. Se monta sobre el vidrio (§9) cambiando tokens:

- Fondo `#000`, sin auras; superficies `rgba(255,255,255,.035)` con línea `rgba(255,255,255,.08)`.
- **Una sola familia: Poppins** (Fredoka sale). Neue Montreal se evaluó, pero su licencia comercial es de pago.
- Klo va **solo sobre el negro**, sin disco ni sol atrás.
- **Pantalla completa:** la ventana deja de ser caja; la app ocupa todo el ancho (6 columnas desde 1800 px, 4 en escritorio, 2 en tableta y teléfono).
- El amanecer se reduce a **azul**: medidor, barras y textos destacados van de `#1c36ee` a azul claro o blanco.
- Los mosaicos de frente son oscuros: su color queda en una línea arriba, la letra grande y el punto de la píldora.
- **Botones minimalistas:** esquinas de 10 px (8 en chicos), sin resplandores. Principal = blanco con tinta negra;
  secundario = línea fina `rgba(255,255,255,.12)`; lo elegido (opciones de la hoja, palomita, interruptor) va en blanco.
- **Navegación tipo Codex:** riel pegado a la orilla, de alto completo y con una línea (arriba en el teléfono, fijo al
  desplazar); barra de arriba sin caja con una línea abajo; metadatos (fecha, chips, etiquetas, ⌘K) y el campo de Klo en
  **JetBrains Mono**, con `›` de terminal en lugar del orbe.


## 11. Aura viva (dirección 2026-10-18)

- Luz de color detrás del negro: azul Klo, violeta y brasa (#ff5a2a / durazno #ff9a6b), como vidrio esmerilado. El negro sigue mandando.
- Fondo: 3 manchas fijas (`.v-auras`) con degradado radial, deriva lenta de 70–90 s. Grano fijo encima (SVG, opacidad .07).
- Cada mosaico trae su luz (`.v-t::before`), rotando la paleta por posición; «Tu día» lleva brasa sobre azul; los frentes, su color.
- Barato: nada de `filter:blur` ni `backdrop-filter`; solo se anima `transform`. Pasando del 8.º mosaico la luz queda quieta. Con «reducir movimiento» todo queda fijo.
