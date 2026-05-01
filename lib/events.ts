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

export function formatEventDate(event: KasukuEvent): string {
  if (event.displayDate) return event.displayDate;
  if (event.startDate) {
    return new Date(event.startDate).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }
  return 'Date inconnue';
}
