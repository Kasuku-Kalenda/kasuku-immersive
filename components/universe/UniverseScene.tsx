"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import EventStar from './EventStar';
import HolographicCard from './HolographicCard';
import ConstellationLines from './ConstellationLines';
import ConstellationLabel from './ConstellationLabel';
import SearchBar from './SearchBar';
import { KasukuEvent, getStarPosition } from '@/lib/events';
import { apiPath } from '@/lib/api';

interface Story {
  id: string;
  title: string;
  event_ids: string[];
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
      <Stars radius={120} depth={80} count={10000} factor={3} saturation={0.3} fade speed={0.5} />

      {/* Constellation lines + labels */}
      <ConstellationLines events={events} stories={stories} />
      {stories.map(story => (
        <ConstellationLabel key={story.id} story={story} events={events} />
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
        enabled={!isWarping && !returning}
        enablePan={false}
        enableZoom
        minDistance={3}
        maxDistance={80}
        rotateSpeed={0.4}
        zoomSpeed={0.8}
        autoRotate={!isWarping && !returning && selectedId === null}
        autoRotateSpeed={0.15}
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
  const [warpTarget, setWarpTarget] = useState<THREE.Vector3 | null>(null);
  const [isWarping, setIsWarping] = useState(false);
  const [returning, setReturning] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [warpFlash, setWarpFlash] = useState(false);

  useEffect(() => {
    fetch(apiPath('/api/stories'))
      .then(r => r.json())
      .then(d => setStories(d.items ?? []))
      .catch(() => {});
  }, []);

  // Auto-warp when returning from event detail page
  useEffect(() => {
    if (!focusSlug || events.length === 0) return;
    const target = events.find(e => e.slug === focusSlug);
    if (target) {
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
        style={{ position: 'fixed', inset: 0, background: '#06080f' }}
        camera={{ position: [0, 0, 35], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Scene
          events={events}
          stories={stories}
          selectedId={selectedEvent?.id ?? null}
          isWarping={isWarping}
          warpTarget={warpTarget}
          returning={returning}
          onStarClick={handleStarClick}
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
