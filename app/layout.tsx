import type { Metadata } from "next";
import "./globals.css";
import { Cinzel, Cinzel_Decorative } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cinzel-decorative",
});

export const metadata: Metadata = {
  title: "Kasuku — Encyclopédie Immersive Africaine",
  description: "Explorez l'histoire, les civilisations et les cultures africaines dans un univers de connaissance immersif.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full ${cinzel.variable} ${cinzelDecorative.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
