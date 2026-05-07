"use client";

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { KasukuEvent, getStarColor } from '@/lib/events';

interface EventStarProps {
  event: KasukuEvent;
  position: THREE.Vector3;
  onClick: (position: THREE.Vector3) => void;
  isSelected: boolean;
}

export default function EventStar({ event, position, onClick, isSelected }: EventStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = getStarColor(event);
  const threeColor = new THREE.Color(color);
  const timeOffset = useRef(Math.random() * Math.PI * 2);
  const active = hovered || isSelected;

  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = state.clock.elapsedTime + timeOffset.current;
    const pulse = 1 + Math.sin(t * 1.1) * 0.18;
    meshRef.current.scale.setScalar(active ? 2.2 * pulse : pulse);
    glowRef.current.scale.setScalar(active ? 4.5 : 2.5 + Math.sin(t * 0.7) * 0.4);
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
      active ? 0.4 : 0.1 + Math.sin(t * 0.9) * 0.04;
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={threeColor} transparent opacity={0.1} depthWrite={false} />
      </mesh>

      {/* Invisible touch hit area — larger target for mobile taps */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(position); }}
        onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={active ? 5 : 2.5}
          toneMapped={false}
        />
      </mesh>

      {/* Local light on hover */}
      {active && <pointLight color={threeColor} intensity={3} distance={8} />}

      {/* Hover label */}
      {hovered && !isSelected && (
        <Html
          center
          distanceFactor={18}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          position={[0, 0.5, 0]}
        >
          <div style={{
            background: 'rgba(8,18,30,0.92)',
            border: `1px solid ${color}50`,
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#FAF8F5',
            fontSize: '11px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 16px ${color}30`,
            animation: 'label-in 0.15s ease',
          }}>
            <span style={{ color: color, marginRight: '6px', fontSize: '9px' }}>●</span>
            {event.title.length > 36 ? event.title.slice(0, 36) + '…' : event.title}
          </div>
        </Html>
      )}
    </group>
  );
}
