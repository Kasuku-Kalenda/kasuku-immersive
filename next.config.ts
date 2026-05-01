import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nécessaire pour Docker — génère un serveur Node.js autonome
  output: "standalone",

  // Préfixe de chemin pour vivre sous /immersive dans nginx
  // En dev local (npm run dev), NEXT_PUBLIC_BASE_PATH n'est pas défini → pas de basePath
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // Autoriser les images Wikipedia et postimg
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "i.postimg.cc" },
    ],
  },
};

export default nextConfig;
