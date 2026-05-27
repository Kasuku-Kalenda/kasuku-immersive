"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import EventStar from './EventStar';
import HolographicCard from './HolographicCard';
import ConstellationLines from './ConstellationLines';
import ConstellationLabel from './ConstellationLabel';
import StoryPanel from './StoryPanel';
import SearchBar from './SearchBar';
import { KasukuEvent, getStarPosition } from '@/lib/events';
import { apiPath } from '@/lib/api';

interface Story {
  id: string;
  title: string;
  eventIds: string[];
}

const HOME_POS = new THREE.Vector3(0, 0, 35);

// ── Camera warp animation ────────────────────────────────────────────────────
function CameraRig({
  warpTarget,
  returning,
  onArrived,
  onReturned,
}: {
  warpTarget: THREE.Vector3 | null;
  returning: boolean;
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
      camera.position.lerpVectors(startPos.current, HOME_POS, eased);
      camera.lookAt(0, 0, 0);
      if (progress.current >= 1) { mode.current = 'idle'; onReturned(); }
    }
  });

  return null;
}

// ── Inner Three.js scene ─────────────────────────────────────────────────────
function Scene({
  events,
  stories,
  selectedId,
  isWarping,
  warpTarget,
  returning,
  onStarClick,
  onStoryClick,
  onArrived,
  onReturned,
}: {
  events: KasukuEvent[];
  stories: Story[];
  selectedId: string | null;
  isWarping: boolean;
  warpTarget: THREE.Vector3 | null;
  returning: boolean;
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

      <CameraRig warpTarget={warpTarget} returning={returning} onArrived={onArrived} onReturned={onReturned} />
      <OrbitControls
        makeDefault
        enabled={!isWarping && !returning}
        enablePan={false}
        enableZoom
        minDistance={3}
        maxDistance={80}
        rotateSpeed={0.4}
        zoomSpeed={0.8}
        // THREE.js OrbitControls internal TOUCH enum (NOT THREE.TOUCH):
        //   0 = ROTATE, 1 = PAN, 2 = DOLLY_PAN, 3 = DOLLY_ROTATE
        // ONE finger → rotate; TWO fingers → zoom (pan disabled by enablePan)
        touches={{ ONE: 0, TWO: 2 }}
        autoRotate={!isWarping && !returning && selectedId === null}
        autoRotateSpeed={0.6}
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
export default function UniverseScene({ events, focusSlug }: { events: KasukuEvent[]; focusSlug?: string | null }) {
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
    setSelectedEvent(event);
    setWarpTarget(pos.clone());
    setIsWarping(true);
    setShowCard(false);
    setWarpFlash(true);
  }, [isWarping]);

  const handleArrived = useCallback(() => {
    setIsWarping(false);
    setWarpTarget(null);
    setTimeout(() => setWarpFlash(false), 300);
    setTimeout(() => setShowCard(true), 200);
  }, []);

  const handleClose = useCallback(() => {
    setShowCard(false);
    setSelectedEvent(null);
    setReturning(true);
    // Safety net: reset returning after 6 s so OrbitControls is never
    // permanently disabled if the return animation doesn't complete.
    setTimeout(() => setReturning(false), 6000);
  }, []);

  const handleReturned = useCallback(() => {
    setReturning(false);
  }, []);

  const handleNavigate = useCallback((event: KasukuEvent) => {
    setShowCard(false);
    setTimeout(() => warpToEvent(event), 100);
  }, [warpToEvent]);

  return (
    <>
      <Canvas
        style={{ position: 'fixed', inset: 0, background: '#06080f', touchAction: 'none' }}
        camera={{ position: [0, 0, 35], fov: typeof window !== 'undefined' && window.innerWidth < 768 ? 75 : 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
      >
        <Scene
          events={events}
          stories={stories}
          selectedId={selectedEvent?.id ?? null}
          isWarping={isWarping}
          warpTarget={warpTarget}
          returning={returning}
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

      {/* Retour Kasuku Kalenda — discret, coin bas-gauche */}
      <a
        href="/"
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.35'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
        style={{
          position: 'fixed',
          bottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))',
          left: 'max(20px, env(safe-area-inset-left))',
          zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 12px 6px 8px',
          borderRadius: 99,
          background: 'rgba(4,8,18,0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          textDecoration: 'none',
          opacity: 0.35,
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          cursor: 'pointer',
        }}
      >
        {/* Flèche gauche */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(250,248,245,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.6rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(250,248,245,0.7)',
          fontWeight: 500,
        }}>
          Kasuku Kalenda
        </span>
      </a>

      {/* Watermark — Kasuku × AFRIKIA */}
      <div
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
        style={{
          position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: 14,
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
    </>
  );
}
