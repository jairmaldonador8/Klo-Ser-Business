# Ícono de Klo-Ser Business

La K del monograma Klo-Ser, en blanco, sobre **el amanecer** (`#1c36ee → #7b4dff → #ff5f8f →
#ffc933`, en diagonal) con un brillo suave arriba a la izquierda. Aprobado por Jair el 2026-10-12.
El de Real Estate es la misma K sobre azul liso: así se distinguen en la pantalla del teléfono
(ver `prueba-en-pantalla.png`).

| Archivo | Dónde va en Next |
|---|---|
| `icono-business.svg` | Fuente maestra. No se edita la K |
| `icon-1024.png`, `icon-512.png`, `icon-192.png` | `public/icons/`, declarados en `manifest.ts` dos veces (`any` y `maskable`) |
| `apple-icon.png` (180, RGB sin alfa) | `src/app/apple-icon.png` |
| `favicon.ico` (16/32/48) | `src/app/favicon.ico` |

- Van **a sangre**, sin redondeo: cada sistema pone su forma. La K ocupa el 52 % del lado, dentro de
  la zona segura del recorte circular de Android.
- Los PNG de la PWA van en RGBA (Next falla con algunos PNG sin alfa); el de iOS va en RGB a propósito.
- Si la app ya está instalada en el iPhone, el ícono no cambia hasta quitarla y volver a agregarla.
