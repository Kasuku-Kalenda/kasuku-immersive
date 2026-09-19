"use client";

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  /** Vrai pendant un warp ou un retour (CameraRig) — déclenche l'effet. */
  active: boolean;
  /** Couleur de l'événement ciblé — les traînées prennent sa teinte. */
  color?: string;
}

const STREAK_COUNT = 120;
const INNER_RADIUS = 1.2;
const OUTER_RADIUS = 14;

/**
 * « Voyage dans le temps » — traînées lumineuses radiant depuis le centre de
 * l'écran, comme un saut en hyperespace, pendant le warp caméra vers un
 * événement (ou le retour). Un groupe suit la caméra à chaque frame (position
 * recopiée) : les traînées semblent alors défiler AUTOUR du spectateur plutôt
 * qu'autour d'un point fixe de l'univers, ce qui vend l'illusion de vitesse.
 *
 * Une seule géométrie/un seul draw call pour les 120 segments (BufferGeometry
 * partagée, positions réécrites en place chaque frame) — le coût est
 * négligeable même quand l'effet est invisible (opacité 0, hors warp).
 */
export default function HyperspaceStreaks({ active, color = '#E67E22' }: Props) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const dirs = useRef<Float32Array>(new Float32Array(STREAK_COUNT * 3));
  const progress = useRef<Float32Array>(new Float32Array(STREAK_COUNT));
  const speed = useRef<Float32Array>(new Float32Array(STREAK_COUNT));

  const { geometry, material } = useMemo(() => {
    for (let i = 0; i < STREAK_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dirs.current[i * 3] = Math.sin(phi) * Math.cos(theta);
      dirs.current[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      dirs.current[i * 3 + 2] = Math.cos(phi);
      progress.current[i] = Math.random();
      speed.current[i] = 0.6 + Math.random() * 0.8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STREAK_COUNT * 2 * 3), 3));
    const mat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geometry: geo, material: mat };
  }, []);

  // La couleur peut changer d'un warp à l'autre (thème de l'événement ciblé).
  useMemo(() => { material.color = new THREE.Color(color); }, [color, material]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(camera.position);

    const targetOpacity = active ? 0.85 : 0;
    material.opacity += (targetOpacity - material.opacity) * 0.15;
    if (material.opacity < 0.01 && !active) return; // rien à animer, effet invisible

    const rate = active ? 1.8 : 0.15;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < STREAK_COUNT; i++) {
      progress.current[i] += delta * rate * speed.current[i];
      if (progress.current[i] > 1) progress.current[i] -= 1;

      const dx = dirs.current[i * 3];
      const dy = dirs.current[i * 3 + 1];
      const dz = dirs.current[i * 3 + 2];
      const p = progress.current[i];
      const rInner = INNER_RADIUS + p * (OUTER_RADIUS - INNER_RADIUS);
      const rOuter = rInner + 1.2 + p * 2.5; // s'allonge en s'éloignant — flou de mouvement

      const base = i * 6;
      arr[base] = dx * rInner; arr[base + 1] = dy * rInner; arr[base + 2] = dz * rInner;
      arr[base + 3] = dx * rOuter; arr[base + 4] = dy * rOuter; arr[base + 5] = dz * rOuter;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry} material={material} />
    </group>
  );
}
