"use client";

import { useCallback, useRef } from 'react';
import { KasukuEvent, getStarColor, formatEventDate } from '@/lib/events';

interface Props {
  /** Événements triés chronologiquement (sortYear croissant). */
  events: KasukuEvent[];
  /** Index courant, entier — arrondi côté appelant pour l'affichage. */
  index: number;
  /** Pixels glissés → nouvel index (flottant, non arrondi). */
  onScrub: (index: number) => void;
  onExit: () => void;
  onOpen: () => void;
}

// Pixels de glissement pour avancer d'un événement — plus la valeur est
// petite, plus un geste court parcourt d'événements (à ajuster au ressenti).
const PX_PER_STEP = 70;

/**
 * HUD du mode « Ligne du temps » (#20 côté natif → équivalent web ici) :
 * bande en bas d'écran, titre + année de l'événement courant, règle à coches
 * qui défile sous le doigt. Remplace temporairement la navigation libre
 * (OrbitControls désactivé pendant ce mode, cf. UniverseScene) par un
 * défilement chronologique linéaire — la caméra suit en continu
 * (TimelineCameraRig), et l'effet hyperespace déjà en place réagit tout seul
 * à la vitesse de ce défilement, sans code spécifique ici.
 */
export default function TimelineScrubber({ events, index, onScrub, onExit, onOpen }: Props) {
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(0);
  const dragging = useRef(false);

  const clamp = useCallback(
    (v: number) => Math.max(0, Math.min(events.length - 1, v)),
    [events.length]
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartIndex.current = index;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [index]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    // Glisser vers la GAUCHE avance dans le temps (convention liste mobile :
    // on "tire" le futur vers soi), vers la droite recule.
    const deltaPx = e.clientX - dragStartX.current;
    onScrub(clamp(dragStartIndex.current - deltaPx / PX_PER_STEP));
  }, [clamp, onScrub]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  if (events.length === 0) return null;
  const current = events[Math.round(clamp(index))];
  const color = getStarColor(current);

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0,
      bottom: 'max(16px, calc(env(safe-area-inset-bottom) + 12px))',
      zIndex: 60, display: 'flex', justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div style={{
        width: 'min(520px, 100%)',
        background: 'linear-gradient(160deg, rgba(8,14,26,0.95) 0%, rgba(4,10,20,0.98) 100%)',
        border: `1px solid ${color}35`,
        borderRadius: 18,
        backdropFilter: 'blur(24px)',
        boxShadow: `0 0 40px ${color}18, 0 20px 48px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
        animation: 'fadeUp 0.35s ease both',
      }}>
        {/* Scan line — cohérent avec HolographicCard/StoryPanel/SearchBar */}
        <div style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
          animation: 'scanline 3.5s linear infinite',
        }} />

        {/* Titre + année + sortie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              onClick={onOpen}
              style={{
                fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                color: color + 'cc', fontFamily: 'var(--font-display)', marginBottom: 3,
                cursor: 'pointer',
              }}
            >
              {formatEventDate(current)} · Voir la fiche →
            </div>
            <div
              onClick={onOpen}
              style={{
                fontSize: '0.95rem', fontFamily: 'var(--font-display)', fontWeight: 600,
                color: 'var(--ivory)', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', cursor: 'pointer',
                textShadow: `0 0 24px ${color}40`,
              }}
            >
              {current.title}
            </div>
          </div>
          <button
            onClick={onExit}
            aria-label="Quitter la ligne du temps"
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(250,248,245,0.5)', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Règle à coches — glisser pour défiler */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'relative', height: 44, padding: '0 16px 14px',
            touchAction: 'none', cursor: 'grab', userSelect: 'none',
          }}
        >
          {/* Repère central fixe */}
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-1px)',
            width: 2, height: 20, background: color, borderRadius: 1,
            boxShadow: `0 0 8px ${color}`,
          }} />
          {/* Piste des coches, décalée pour garder l'index courant sous le repère */}
          <div style={{
            position: 'absolute', top: 16, left: '50%', height: 4,
            transform: `translateX(calc(-50% - ${index * 22}px))`,
            display: 'flex', alignItems: 'center', gap: 18,
            transition: dragging.current ? 'none' : 'transform 0.12s ease-out',
          }}>
            {events.map((ev, i) => {
              const active = Math.round(clamp(index)) === i;
              const evColor = getStarColor(ev);
              return (
                <div key={ev.id} style={{
                  width: active ? 6 : 3, height: active ? 6 : 3, borderRadius: '50%',
                  flexShrink: 0, background: active ? evColor : 'rgba(255,255,255,0.25)',
                  boxShadow: active ? `0 0 8px ${evColor}` : 'none',
                  transition: 'all 0.15s ease',
                }} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
