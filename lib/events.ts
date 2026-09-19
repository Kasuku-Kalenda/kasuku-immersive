import * as THREE from 'three';

export interface KasukuEvent {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  startDate: string | null;
  displayDate: string | null;
  thumbnailUrl: string | null;
  primaryCountryCode: string | null;
  reliability: string;
  // Année normalisée, déjà calculée côté API (date exacte ou approximation
  // par siècle/décennie) — seule clé de tri fiable : `startDate` est absent
  // pour les événements à date approximative (cf. mode Ligne du temps).
  sortYear: number;
  themes: { id: string; name: string; color: string }[];
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 100000) / 100000;
}

const THEME_CENTERS: Record<string, THREE.Vector3> = {};

function getThemeCenter(themeId: string): THREE.Vector3 {
  if (!THEME_CENTERS[themeId]) {
    const theta = seededRandom(themeId) * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(themeId + 'phi') - 1);
    const radius = 18 + seededRandom(themeId + 'r') * 12;
    THEME_CENTERS[themeId] = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi) * 0.35,
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }
  return THEME_CENTERS[themeId];
}

export function getStarPosition(event: KasukuEvent): THREE.Vector3 {
  if (event.themes.length > 0) {
    const center = getThemeCenter(event.themes[0].id);
    const spread = 3 + seededRandom(event.id + 's') * 4;
    const theta = seededRandom(event.id + 't') * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(event.id + 'p') - 1);
    return new THREE.Vector3(
      center.x + spread * Math.sin(phi) * Math.cos(theta),
      center.y + spread * Math.cos(phi) * 0.5,
      center.z + spread * Math.sin(phi) * Math.sin(theta),
    );
  }
  const radius = 22 + seededRandom(event.id) * 18;
  const theta = seededRandom(event.id + 't') * Math.PI * 2;
  const phi = Math.acos(2 * seededRandom(event.id + 'p') - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi) * 0.3,
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function getStarColor(event: KasukuEvent): string {
  if (event.themes.length > 0) return event.themes[0].color;
  return '#a8c4ff';
}

// Port MinIO fixe en dev (cf. absolu `http://localhost:9000/...` déjà servi
// par l'API pour la plupart des médias — vérifié en base).
const MINIO_PORT = '9000';

// L'API sert les médias sous deux formes, toutes deux problématiques hors de
// la machine de dev :
//  1. `http://localhost:9000/kasuku-media/...` (MinIO direct) — ne résout que
//     sur la machine qui fait tourner MinIO.
//  2. `/storage/fixtures/...` (chemin relatif d'anciennes fixtures) — résolu
//     par le navigateur contre l'origine COURANTE (ce site immersif), qui n'a
//     pas de route `/storage`. Vérifié directement dans MinIO (`mc find`) :
//     le seul bucket public existant est `kasuku-media` — un bucket `kasuku`
//     supposé par un ancien proxy Vite du back-office n'existe pas. `/storage`
//     y est donc réécrit comme `kasuku-media`, même convention que le proxy
//     Vite (`/storage/X` → bucket/X).
// Sur un téléphone, "localhost" désigne le téléphone lui-même et un chemin
// relatif pointe vers le mauvais serveur — même bug déjà rencontré et corrigé
// côté app native (`normalizeMediaUrl`). Pas besoin de config manuelle pour
// l'hôte : `window.location.hostname` côté client, l'en-tête `Host` de la
// requête entrante côté serveur (passé en second paramètre).
export function normalizeMediaUrl<T extends string | null | undefined>(url: T, host: string | null): T {
  if (!url || !host) return url;

  if (url.startsWith('/storage/')) {
    return `http://${host}:${MINIO_PORT}${url.replace(/^\/storage/, '/kasuku-media')}` as T;
  }

  const m = url.match(/^https?:\/\/localhost(:\d+)?\//);
  if (!m) return url;
  const port = m[1] ?? '';
  return url.replace(/^https?:\/\/localhost(:\d+)?/, `http://${host}${port}`) as T;
}

export function formatEventDate(event: KasukuEvent): string {
  if (event.displayDate) return event.displayDate;
  if (event.startDate) {
    return new Date(event.startDate).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }
  return 'Date inconnue';
}
