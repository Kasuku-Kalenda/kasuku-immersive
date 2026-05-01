"use client";

import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { KasukuEvent, getStarPosition, getStarColor } from '@/lib/events';

interface Story {
  id: string;
  title: string;
  event_ids: string[];
}

interface ConstellationLabelProps {
  story: Story;
  events: KasukuEvent[];
}

export default function ConstellationLabel({ story, events }: ConstellationLabelProps) {
  const { center, color } = useMemo(() => {
    const storyEvents = story.event_ids
      .map(id => events.find(e => e.id === id))
      .filter(Boolean) as KasukuEvent[];

    if (storyEvents.length === 0) return { center: new THREE.Vector3(), color: '#E67E22' };

    const positions = storyEvents.map(e => getStarPosition(e));
    const centroid = positions.reduce(
      (acc, p) => acc.add(p),
      new THREE.Vector3()
    ).divideScalar(positions.length);

    // Offset slightly above center
    centroid.y += 1.8;

    const color = storyEvents[0] ? getStarColor(storyEvents[0]) : '#E67E22';
    return { center: centroid, color };
  }, [story, events]);

  return (
    <Html
      position={center}
      center
      distanceFactor={22}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '3px 10px 3px 7px',
        borderRadius: 99,
        background: 'rgba(4,10,20,0.75)',
        border: `1px solid ${color}30`,
        backdropFilter: 'blur(4px)',
        whiteSpace: 'nowrap',
        animation: 'fadeIn 0.5s ease both',
      }}>
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          display: 'block', flexShrink: 0,
        }} />
        <span style={{
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: color + 'cc',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
        }}>
          {story.title.length > 32 ? story.title.slice(0, 32) + '…' : story.title}
        </span>
      </div>
    </Html>
  );
}
