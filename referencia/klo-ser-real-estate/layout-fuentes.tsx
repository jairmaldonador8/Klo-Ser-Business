import type { Metadata, Viewport } from "next";
import { Caveat, Fredoka, Geist_Mono, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BarraProgreso } from "@/components/nav/barra-progreso";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// v0.3 «Klo azul»: la redonda hermana del wordmark. Titulares, saludos y
// cifras héroe hablan en Fredoka; el cuerpo sigue en Poppins. Conserva el
// nombre --font-logo para que `font-logo` siga funcionando en toda la app.
const fredoka = Fredoka({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Las notas a mano junto a Klo («Aquí se cierra en grande.»): manuscrita.
const caveat = Caveat({
  variable: "--font-mano",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klo-Ser",
  description: "Un buen cierre se construye. El sistema con el que una inmobiliaria atiende cada prospecto a tiempo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Sin cover, TODOS los env(safe-area-inset-*) valen 0 en iPhone — la app ya
  // los usa (nav asesor, bottom sheets); esto los enciende de verdad.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Tema PLUMA: la cookie la escribe CambiarTema; leerla aquí evita el
  // parpadeo claro→oscuro al recargar (el html ya llega con la clase).
  const tema = (await cookies()).get("tema")?.value;
  const oscuro = tema === "negro" ? " dark" : "";

  return (
    <html
      lang="es"
      className={`${poppins.variable} ${fredoka.variable} ${caveat.variable} ${geistMono.variable} h-full antialiased${oscuro}`}
    >
      {/* overflow-x-clip: red de seguridad — ningún elemento pasado de ancho
          debe convertirse en scroll horizontal de página en el teléfono
          (reporte de Arturo, Live test 2026-08-17). clip no crea contenedor
          de scroll, así que sticky/fixed siguen funcionando. */}
      <body className="min-h-full flex flex-col overflow-x-clip">
        {/* La línea de carga al navegar (2026-09-14, sin esqueletos). Lee la
            query con useSearchParams, así que va en su propio Suspense para
            no volver dinámicas las páginas estáticas (landing, login). */}
        <Suspense fallback={null}>
          <BarraProgreso />
        </Suspense>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
