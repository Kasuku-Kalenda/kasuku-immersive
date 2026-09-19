"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import EventStar from './EventStar';
import HolographicCard from './HolographicCard';
import ConstellationLines from './ConstellationLines';
import ConstellationLabel from './ConstellationLabel';
import StoryPanel from './StoryPanel';
import SearchBar from './SearchBar';
import HyperspaceStreaks from './HyperspaceStreaks';
import TimelineScrubber from './TimelineScrubber';
import { KasukuEvent, getStarPosition, getStarColor } from '@/lib/events';
import { apiPath } from '@/lib/api';

interface Story {
  id: string;
  title: string;
  eventIds: string[];
}

// ── Camera warp animation ────────────────────────────────────────────────────
function CameraRig({
  warpTarget,
  returning,
  homePos,
  homeLookAt,
  onArrived,
  onReturned,
}: {
  warpTarget: THREE.Vector3 | null;
  returning: boolean;
  homePos: THREE.Vector3;
  homeLookAt: THREE.Vector3;
  onArrived: () => void;
  onReturned: () => void;
}) {
  const { camera } = useThree();
  const startPos = useRef(new THREE.Vector3());
  const progress = useRef(0);
  const mode = useRef<'idle' | 'warp' | 'return'>('idle');

  useEffect(() => {
    if (warpTarget) {
      startPos.current.copy(camera.position);
      progress.current = 0;
      mode.current = 'warp';
    }
  }, [warpTarget, camera]);

  useEffect(() => {
    if (returning) {
      startPos.current.copy(camera.position);
      progress.current = 0;
      mode.current = 'return';
    }
  }, [returning, camera]);

  useFrame((_, delta) => {
    if (mode.current === 'idle') return;

    const speed = mode.current === 'return' ? 0.45 : 0.65;
    progress.current = Math.min(progress.current + delta * speed, 1);
    const t = progress.current;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (mode.current === 'warp' && warpTarget) {
      const dir = warpTarget.clone().normalize();
      const dist = warpTarget.length();
      const stopPoint = dir.multiplyScalar(Math.max(dist - 5, 2));
      camera.position.lerpVectors(startPos.current, stopPoint, eased);
      camera.lookAt(warpTarget);
      if (progress.current >= 1) { mode.current = 'idle'; onArrived(); }
    } else if (mode.current === 'return') {
      camera.position.lerpVectors(startPos.current, homePos, eased);
      camera.lookAt(homeLookAt);
      if (progress.current >= 1) { mode.current = 'idle'; onReturned(); }
    }
  });

  return null;
}

// ── Mode « Ligne du temps » : la caméra glisse en continu d'une étoile à
// l'autre (interpolation position + lookAt), pilotée par un index flottant
// mis à jour à haute fréquence par TimelineScrubber (ref, pas de state react
// à chaque pixel glissé — évite un re-render par frame de drag). Même
// structure que CameraRig (position en retrait de la cible dans l'axe
// origine→cible) pour rester cohérent avec le warp discret.
function TimelineCameraRig({
  active,
  indexRef,
  sortedEvents,
}: {
  active: boolean;
  indexRef: React.MutableRefObject<number>;
  sortedEvents: KasukuEvent[];
}) {
  const { camera } = useThree();
  const lookAtVec = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useEffect(() => { initialized.current = false; }, [active]);

  useFrame(() => {
    if (!active || sortedEvents.length === 0) return;
    const idx = indexRef.current;
    const i0 = Math.max(0, Math.min(sortedEvents.length - 1, Math.floor(idx)));
    const i1 = Math.max(0, Math.min(sortedEvents.length - 1, Math.ceil(idx)));
    const t = idx - i0;
    const p0 = getStarPosition(sortedEvents[i0]);
    const p1 = getStarPosition(sortedEvents[i1]);
    const target = new THREE.Vector3().lerpVectors(p0, p1, t);

    const dir = target.clone().normalize();
    const dist = target.length();
    const desiredPos = dir.multiplyScalar(Math.max(dist - 5, 2));

    if (!initialized.current) {
      camera.position.copy(desiredPos);
      lookAtVec.current.copy(target);
      initialized.current = true;
    } else {
      camera.position.lerp(desiredPos, 0.08);
      lookAtVec.current.lerp(target, 0.15);
    }
    camera.lookAt(lookAtVec.current);
  });

  return null;
}

// ── Inner Three.js scene ─────────────────────────────────────────────────────
function Scene({
  events,
  sortedEvents,
  stories,
  selectedId,
  warpColor,
  isWarping,
  warpTarget,
  returning,
  timelineMode,
  timelineIndexRef,
  centroid,
  homePos,
  onStarClick,
  onStoryClick,
  onArrived,
  onReturned,
}: {
  events: KasukuEvent[];
  sortedEvents: KasukuEvent[];
  stories: Story[];
  selectedId: string | null;
  warpColor: string;
  isWarping: boolean;
  warpTarget: THREE.Vector3 | null;
  returning: boolean;
  timelineMode: boolean;
  timelineIndexRef: React.MutableRefObject<number>;
  centroid: THREE.Vector3;
  homePos: THREE.Vector3;
  onStarClick: (event: KasukuEvent, pos: THREE.Vector3) => void;
  onStoryClick: (story: Story) => void;
  onArrived: () => void;
  onReturned: () => void;
}) {
  const positions = useRef<Map<string, THREE.Vector3>>(new Map());

  const getPos = useCallback((event: KasukuEvent) => {
    if (!positions.current.has(event.id)) {
      positions.current.set(event.id, getStarPosition(event));
    }
    return positions.current.get(event.id)!;
  }, []);

  return (
    <>
      <ambientLight intensity={0.05} />
      <Stars radius={120} depth={80} count={typeof window !== 'undefined' && window.innerWidth < 768 ? 3000 : 10000} factor={3} saturation={0.3} fade speed={0.5} />

      {/* Constellation lines + labels */}
      <ConstellationLines events={events} stories={stories} />
      {stories.map(story => (
        <ConstellationLabel key={story.id} story={story} events={events} onOpen={onStoryClick} />
      ))}

      {/* Event stars */}
      {events.map(event => (
        <EventStar
          key={event.id}
          event={event}
          position={getPos(event)}
          isSelected={selectedId === event.id}
          onClick={pos => onStarClick(event, pos)}
        />
      ))}

      <HyperspaceStreaks active={isWarping || returning} color={warpColor} />

      <CameraRig
        warpTarget={warpTarget}
        returning={returning}
        homePos={homePos}
        homeLookAt={centroid}
        onArrived={onArrived}
        onReturned={onReturned}
      />
      <TimelineCameraRig active={timelineMode} indexRef={timelineIndexRef} sortedEvents={sortedEvents} />
      <OrbitControls
        makeDefault
        target={centroid}
        enabled={!isWarping && !returning && !timelineMode}
        enablePan={false}
        enableZoom
        // 80 coupait le recul bien avant le fond d'étoiles d'ambiance (Stars
        // radius 120 + depth 80, cf. plus haut) : on ne pouvait jamais prendre
        // assez de recul pour voir l'ensemble du nuage d'un coup. 300 reste
        // sous le plan de coupe de la caméra (far: 500), large marge.
        minDistance={3}
        maxDistance={300}
        rotateSpeed={0.4}
        zoomSpeed={0.8}
        // THREE.js OrbitControls internal TOUCH enum (NOT THREE.TOUCH):
        //   0 = ROTATE, 1 = PAN, 2 = DOLLY_PAN, 3 = DOLLY_ROTATE
        // ONE finger → rotate; TWO fingers → zoom (pan disabled by enablePan)
        touches={{ ONE: 0, TWO: 2 }}
        autoRotate={!isWarping && !returning && !timelineMode && selectedId === null}
        autoRotateSpeed={0.3}
      />
    </>
  );
}

// ── Warp flash overlay ───────────────────────────────────────────────────────
function WarpFlash({ active }: { active: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
      background: 'radial-gradient(ellipse at center, rgba(230,126,34,0.08) 0%, rgba(150,200,255,0.1) 50%, transparent 70%)',
      opacity: active ? 1 : 0,
      transition: active ? 'opacity 0.08s' : 'opacity 1.4s ease',
    }} />
  );
}

// ── Main exported component ──────────────────────────────────────────────────
export default function UniverseScene({ events, focusSlug, embedded }: { events: KasukuEvent[]; focusSlug?: string | null; embedded?: boolean }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<KasukuEvent | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [warpTarget, setWarpTarget] = useState<THREE.Vector3 | null>(null);
  const [isWarping, setIsWarping] = useState(false);
  const [returning, setReturning] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [warpFlash, setWarpFlash] = useState(false);
  // Tracks whether the one-time auto-warp (from ?focus= URL param) has fired,
  // so events-array refreshes every 60 s don't re-trigger it.
  const autoWarpFired = useRef(false);

  // Centre réel du nuage d'étoiles — les centres de thème sont placés au hasard
  // (seed) sur toute la sphère (cf. getThemeCenter, lib/events.ts) : avec
  // seulement ~5 thèmes actifs, leur barycentre s'écarte facilement de
  // l'origine (0,0,0) sur laquelle la caméra visait par défaut, ce qui
  // décalait tout le nuage visible d'un côté de l'écran au lieu de le
  // centrer. On vise et on orbite désormais autour du vrai centre.
  const centroid = useMemo(() => {
    if (events.length === 0) return new THREE.Vector3();
    const sum = new THREE.Vector3();
    events.forEach((e) => sum.add(getStarPosition(e)));
    return sum.divideScalar(events.length);
  }, [events]);
  const homePos = useMemo(() => centroid.clone().add(new THREE.Vector3(0, 0, 35)), [centroid]);
  const homePosArray = useMemo((): [number, number, number] => [homePos.x, homePos.y, homePos.z], [homePos]);

  // ── Mode « Ligne du temps » ────────────────────────────────────────────────
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.sortYear - b.sortYear),
    [events]
  );
  const [timelineMode, setTimelineMode] = useState(false);
  // Index flottant à haute fréquence (ref, pas de re-render par pixel glissé) ;
  // copie arrondie en state pour le HUD (TimelineScrubber) et le highlight
  // d'étoile, mise à jour à un rythme raisonnable (à chaque scrub, pas chaque frame).
  const timelineIndexRef = useRef(0);
  const [timelineIndexDisplay, setTimelineIndexDisplay] = useState(0);

  const enterTimeline = useCallback(() => {
    setShowCard(false);
    setSelectedStory(null);
    timelineIndexRef.current = 0;
    setTimelineIndexDisplay(0);
    setTimelineMode(true);
  }, []);

  const exitTimeline = useCallback(() => {
    setTimelineMode(false);
  }, []);

  const scrubTimeline = useCallback((idx: number) => {
    timelineIndexRef.current = idx;
    setTimelineIndexDisplay(idx);
  }, []);

  const currentTimelineEvent = sortedEvents[Math.round(
    Math.max(0, Math.min(sortedEvents.length - 1, timelineIndexDisplay))
  )] ?? null;

  useEffect(() => {
    let cancelled = false;

    const loadStories = () =>
      fetch(apiPath('/api/stories'))
        .then(r => r.json())
        .then(d => {
          if (!cancelled) setStories(
            (d.items ?? []).map((s: any) => ({ ...s, eventIds: s.eventIds ?? [] }))
          );
        })
        .catch(() => {});

    loadStories();

    // Refresh every 60 s so new stories created in Kasuku appear automatically
    const interval = setInterval(loadStories, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Auto-warp when returning from event detail page.
  // Guard: only fire once per focusSlug — the events array refreshes every
  // 60 s (HomeClient polling), which would otherwise re-trigger the warp,
  // flipping isWarping on indefinitely and freezing OrbitControls.
  useEffect(() => {
    if (!focusSlug || events.length === 0) return;
    if (autoWarpFired.current) return;
    const target = events.find(e => e.slug === focusSlug);
    if (target) {
      autoWarpFired.current = true;
      const t = setTimeout(() => warpToEvent(target), 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSlug, events]);

  const warpToEvent = useCallback((event: KasukuEvent) => {
    const pos = getStarPosition(event);
    setSelectedEvent(event);
    setWarpTarget(pos.clone());
    setIsWarping(true);
    setShowCard(false);
    setWarpFlash(true);
    // Safety net: if the CameraRig animation never fires onArrived (e.g. the
    // component remounts mid-flight), reset isWarping after 6 s so
    // OrbitControls is never permanently disabled.
    setTimeout(() => setIsWarping(false), 6000);
  }, []);

  const handleStarClick = useCallback((event: KasukuEvent, pos: THREE.Vector3) => {
    if (isWarping) return;
    // En mode Ligne du temps, un tap direct doit rester possible (retour
    // utilisateur) : on fait glisser le scrub jusqu'à l'index de cet
    // événement (TimelineCameraRig s'en charge, en douceur) et on ouvre sa
    // fiche — plutôt que de lancer un warp discret en parallèle, qui
    // ferait piloter la caméra par deux rigs en même temps.
    if (timelineMode) {
      const idx = sortedEvents.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        timelineIndexRef.current = idx;
        setTimelineIndexDisplay(idx);
      }
      setSelectedEvent(event);
      setShowCard(true);
      return;
    }
    setSelectedEvent(event);
    setWarpTarget(pos.clone());
    setIsWarping(true);
    setShowCard(false);
    setWarpFlash(true);
  }, [isWarping, timelineMode, sortedEvents]);

  const handleArrived = useCallback(() => {
    setIsWarping(false);
    setWarpTarget(null);
    setTimeout(() => setWarpFlash(false), 300);
    setTimeout(() => setShowCard(true), 200);
  }, []);

  const handleClose = useCallback(() => {
    setShowCard(false);
    // Ouverte depuis le mode Ligne du temps : la caméra reste où
    // TimelineCameraRig l'a positionnée, pas de retour à l'origine —
    // le scrub reprend simplement là où on l'avait laissé.
    if (timelineMode) return;
    setSelectedEvent(null);
    setReturning(true);
    // Safety net: reset returning after 6 s so OrbitControls is never
    // permanently disabled if the return animation doesn't complete.
    setTimeout(() => setReturning(false), 6000);
  }, [timelineMode]);

  const openTimelineCard = useCallback(() => {
    if (currentTimelineEvent) {
      setSelectedEvent(currentTimelineEvent);
      setShowCard(true);
    }
  }, [currentTimelineEvent]);

  const handleReturned = useCallback(() => {
    setReturning(false);
  }, []);

  const handleNavigate = useCallback((event: KasukuEvent) => {
    setShowCard(false);
    // Bascule vers la navigation par warp discret : évite que TimelineCameraRig
    // et CameraRig pilotent la caméra en même temps.
    if (timelineMode) setTimelineMode(false);
    setTimeout(() => warpToEvent(event), 100);
  }, [warpToEvent, timelineMode]);

  return (
    <>
      <Canvas
        style={{ position: 'fixed', inset: 0, background: '#06080f', touchAction: 'none' }}
        camera={{ position: homePosArray, fov: typeof window !== 'undefined' && window.innerWidth < 768 ? 75 : 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
      >
        <Scene
          events={events}
          sortedEvents={sortedEvents}
          stories={stories}
          selectedId={timelineMode ? (currentTimelineEvent?.id ?? null) : (selectedEvent?.id ?? null)}
          warpColor={selectedEvent ? getStarColor(selectedEvent) : '#E67E22'}
          isWarping={isWarping}
          warpTarget={warpTarget}
          returning={returning}
          timelineMode={timelineMode}
          timelineIndexRef={timelineIndexRef}
          centroid={centroid}
          homePos={homePos}
          onStarClick={handleStarClick}
          onStoryClick={setSelectedStory}
          onArrived={handleArrived}
          onReturned={handleReturned}
        />
      </Canvas>

      <WarpFlash active={warpFlash} />

      {/* Search bar */}
      <SearchBar
        events={events}
        stories={stories}
        onSelect={event => warpToEvent(event)}
      />

      {timelineMode && (
        <TimelineScrubber
          events={sortedEvents}
          index={timelineIndexDisplay}
          onScrub={scrubTimeline}
          onExit={exitTimeline}
          onOpen={openTimelineCard}
        />
      )}

      {showCard && selectedEvent && (
        <HolographicCard
          event={selectedEvent}
          allEvents={events}
          stories={stories}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      )}

      {/* Story panel — opens when a constellation label is clicked */}
      {selectedStory && (
        <StoryPanel
          story={selectedStory}
          events={events}
          onClose={() => setSelectedStory(null)}
          onSelectEvent={event => { setSelectedStory(null); warpToEvent(event); }}
        />
      )}

      {/* Sortie vers Kasuku Kalenda — coin haut-gauche, même gabarit que le
          bouton retour de l'app native (cercle 40px, icône seule) : libère le
          bas de l'écran pour le watermark, sans risque de chevauchement sur
          petit écran (l'ancienne version, en bas-gauche avec un libellé texte,
          pouvait toucher le watermark centré sur les téléphones étroits).
          Masqué en `embedded` (#45) : la WebView native fournit déjà un
          bouton retour au même endroit — deux boutons superposés sinon. */}
      {!embedded && (
        <a
          href="/"
          aria-label="Retour à Kasuku Kalenda"
          style={{
            position: 'fixed',
            top: 'max(16px, calc(env(safe-area-inset-top) + 12px))',
            left: 'max(16px, env(safe-area-inset-left))',
            zIndex: 20,
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(4,8,18,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            textDecoration: 'none',
            transition: 'background 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.85)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </a>
      )}

      {/* Bascule Ligne du temps — empilé sous le bouton retour, même gabarit
          (remonte à la place du bouton retour quand il est masqué, `embedded`).
          Masqué pendant le warp/retour (mêmes conflits de rig caméra que les
          taps directs sur étoile, cf. handleStarClick). */}
      {!isWarping && !returning && (
        <button
          onClick={() => (timelineMode ? exitTimeline() : enterTimeline())}
          aria-label={timelineMode ? 'Quitter la ligne du temps' : 'Ligne du temps'}
          style={{
            position: 'fixed',
            // Toujours en dessous, même en `embedded` : le coin haut-gauche
            // libéré par le masquage du bouton retour WEB est en fait occupé
            // par le bouton retour NATIF de l'app (rendu par la WebView hôte,
            // hors de cette page) — les deux se superposaient exactement.
            top: 'max(64px, calc(env(safe-area-inset-top) + 60px))',
            left: 'max(16px, env(safe-area-inset-left))',
            zIndex: 20,
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            background: timelineMode ? 'rgba(230,126,34,0.16)' : 'rgba(4,8,18,0.7)',
            border: timelineMode ? '1px solid rgba(230,126,34,0.45)' : '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
            cursor: 'pointer',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke={timelineMode ? 'rgba(230,126,34,0.9)' : 'rgba(250,248,245,0.85)'}
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
        </button>
      )}

      {/* Watermark — Kasuku × AFRIKIA, masqué en Ligne du temps (le HUD du bas
          occupe déjà cette zone, cf. TimelineScrubber). */}
      {!timelineMode && (
      <div
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
        style={{
          position: 'fixed',
          bottom: 'max(22px, calc(env(safe-area-inset-bottom) + 14px))',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: 14,
          flexWrap: 'wrap', justifyContent: 'center',
          maxWidth: 'calc(100vw - 32px)',
          opacity: 0.3, transition: 'opacity 0.4s ease', cursor: 'default',
        }}
      >
        {/* Kasuku */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img
            src="https://i.postimg.cc/8cYFbspt/Kasuku-logo.png"
            alt="Kasuku"
            style={{ height: 18, width: 'auto', objectFit: 'contain' }}
          />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '0.72rem',
            fontWeight: 600, letterSpacing: '0.12em',
            color: 'var(--ivory)', textTransform: 'uppercase',
          }}>
            Kasuku
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 14, background: 'rgba(250,248,245,0.25)' }} />

        {/* Créé par AFRIKIA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '0.58rem',
            letterSpacing: '0.14em', color: 'rgba(250,248,245,0.6)',
            textTransform: 'uppercase',
          }}>
            Créé par
          </span>
          <img
            src="/afrikia-logo-white.svg"
            alt="Afrikia"
            style={{ height: 14, width: 'auto', objectFit: 'contain' }}
          />
        </div>
      </div>
      )}
    </>
  );
}
