"use client";

import { useMemo } from 'react';
import * as THREE from 'three';
import { KasukuEvent, getStarPosition, getStarColor } from '@/lib/events';

interface Story {
  id: string;
  title: string;
  event_ids: string[];
}

interface ConstellationLinesProps {
  events: KasukuEvent[];
  stories: Story[];
}

export default function ConstellationLines({ events, stories }: ConstellationLinesProps) {
  const positionMap = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    events.forEach(e => map.set(e.id, getStarPosition(e)));
    return map;
  }, [events]);

  const eventMap = useMemo(() => {
    const map = new Map<string, KasukuEvent>();
    events.forEach(e => map.set(e.id, e));
    return map;
  }, [events]);

  const lineObjects = useMemo(() => {
    return stories.flatMap(story => {
      const points: THREE.Vector3[] = [];
      story.event_ids.forEach(eid => {
        const pos = positionMap.get(eid);
        if (pos) points.push(pos);
      });
      if (points.length < 2) return [];

      const firstEvent = eventMap.get(story.event_ids[0]);
      const color = new THREE.Color(firstEvent ? getStarColor(firstEvent) : '#E67E22');
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28 });
      return [{ id: story.id, obj: new THREE.Line(geometry, material) }];
    });
  }, [stories, positionMap, eventMap]);

  return (
    <>
      {lineObjects.map(({ id, obj }) => (
        <primitive key={id} object={obj} />
      ))}
    </>
  );
}
