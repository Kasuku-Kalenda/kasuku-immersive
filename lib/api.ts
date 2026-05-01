/**
 * Helpers d'URL pour kasuku-immersive
 *
 * En dev (localhost:3001, sans basePath) :
 *   apiPath('/api/events') → '/api/events'
 *
 * En Docker (derrière nginx, basePath = /immersive) :
 *   apiPath('/api/events') → '/immersive/api/events'
 *
 * NEXT_PUBLIC_BASE_PATH est injecté au build par docker-compose.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Préfixe un chemin avec le basePath — à utiliser dans tous les fetch() côté client */
export function apiPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** URL interne de l'API Kasuku — utilisée côté serveur (API routes, SSR) */
export const KASUKU_API = process.env.KASUKU_API_URL ?? 'http://localhost/api/v1';
