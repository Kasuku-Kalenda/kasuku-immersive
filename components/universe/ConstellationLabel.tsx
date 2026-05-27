"use client";

import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { KasukuEvent, getStarPosition, getStarColor } from '@/lib/events';

interface Story {
  id: string;
  title: string;
  eventIds: string[];
}

interface ConstellationLabelProps {
  story: Story;
  events: KasukuEvent[];
  onOpen: (story: Story) => void;
}

export default function ConstellationLabel({ story, events, onOpen }: ConstellationLabelProps) {
  const [hovered, setHovered] = useState(false);

  const { center, color } = useMemo(() => {
    const storyEvents = story.eventIds
      .map(id => events.find(e => e.id === id))
      .filter(Boolean) as KasukuEvent[];

    if (storyEvents.length === 0) return { center: new THREE.Vector3(), color: '#E67E22' };

    const positions = storyEvents.map(e => getStarPosition(e));
    const centroid = positions.reduce(
      (acc, p) => acc.add(p),
      new THREE.Vector3()
    ).divideScalar(positions.length);

    centroid.y += 2.2;

    const color = storyEvents[0] ? getStarColor(storyEvents[0]) : '#E67E22';
    return { center: centroid, color };
  }, [story, events]);

  const eventCount = story.eventIds.filter(id => events.find(e => e.id === id)).length;

  return (
    <Html
      position={center}
      center
      distanceFactor={22}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
    >
      <div
        onClick={() => onOpen(story)}
        onMouseEnter={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onMouseLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 11px 4px 8px',
          borderRadius: 99,
          background: hovered ? `rgba(4,10,20,0.92)` : 'rgba(4,10,20,0.75)',
          border: `1px solid ${color}${hovered ? '60' : '30'}`,
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: hovered ? `0 0 16px ${color}30` : 'none',
          animation: 'fadeIn 0.5s ease both',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        {/* Dot */}
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 ${hovered ? 10 : 5}px ${color}`,
          display: 'block', flexShrink: 0,
          transition: 'box-shadow 0.18s',
        }} />

        {/* Title */}
        <span style={{
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: hovered ? color : color + 'cc',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
          transition: 'color 0.18s',
        }}>
          {story.title.length > 32 ? story.title.slice(0, 32) + '…' : story.title}
        </span>

        {/* Count badge */}
        <span style={{
          fontSize: '7px', fontFamily: 'Inter, system-ui, sans-serif',
          color: color + '80',
          background: color + '18',
          border: `1px solid ${color}25`,
          borderRadius: 99,
          padding: '1px 5px',
          marginLeft: 2,
        }}>
          {eventCount}
        </span>
      </div>
    </Html>
  );
}
