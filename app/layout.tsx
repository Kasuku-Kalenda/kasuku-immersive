import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

// Même famille que l'app native et le site Kasuku (Native/src/theme.ts,
// Web/index.html) — Cinzel n'appartient à aucune charte Kasuku existante et
// cassait la cohérence visuelle entre l'univers immersif et le reste du
// produit. Auto-hébergée via next/font (pas de requête réseau externe au
// premier chargement, important sur mobile/réseau lent).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kasuku — Encyclopédie Immersive Africaine",
  description: "Explorez l'histoire, les civilisations et les cultures africaines dans un univers de connaissance immersif.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
