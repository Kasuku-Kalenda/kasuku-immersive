"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { KasukuEvent } from '@/lib/events';

const UniverseScene = dynamic(
  () => import('@/components/universe/UniverseScene'),
  { ssr: false }
);

const DEMO_EVENTS: KasukuEvent[] = [
  {
    id: 'demo-1', slug: 'mansa-musa', title: 'Pèlerinage de Mansa Musa',
    summary: 'En 1324, le roi du Mali traverse l\'Afrique vers La Mecque avec une caravane de 60 000 hommes et tant d\'or qu\'il provoque une inflation en Égypte.',
    startDate: '1324-01-01', displayDate: '1324', thumbnailUrl: null,
    primaryCountryCode: 'ML', reliability: 'confirmed',
    themes: [{ id: 't1', name: 'Histoire', color: '#E57C3C' }],
  },
  {
    id: 'demo-2', slug: 'conference-berlin', title: 'Conférence de Berlin',
    summary: 'Les puissances européennes se réunissent pour diviser l\'Afrique entre elles, sans la participation d\'aucun Africain.',
    startDate: '1885-02-26', displayDate: '1885', thumbnailUrl: null,
    primaryCountryCode: null, reliability: 'confirmed',
    themes: [{ id: 't1', name: 'Histoire', color: '#E57C3C' }],
  },
  {
    id: 'demo-3', slug: 'independances', title: 'Vague des Indépendances',
    summary: '1960 : l\'année de l\'Afrique. 17 pays accèdent à l\'indépendance en une seule année.',
    startDate: '1960-01-01', displayDate: '1960', thumbnailUrl: null,
    primaryCountryCode: null, reliability: 'confirmed',
    themes: [{ id: 't1', name: 'Histoire', color: '#E57C3C' }],
  },
  {
    id: 'demo-4', slug: 'tombouctou', title: 'Tombouctou, cité du savoir',
    summary: 'Au XVe siècle, Tombouctou est l\'une des villes les plus importantes du monde avec ses 180 écoles coraniques et 25 000 étudiants.',
    startDate: null, displayDate: 'XVe siècle', thumbnailUrl: null,
    primaryCountryCode: 'ML', reliability: 'confirmed',
    themes: [{ id: 't2', name: 'Culture', color: '#7C3CE5' }],
  },
];

export default function HomeClient() {
  const searchParams = useSearchParams();
  const focusSlug = searchParams.get('focus');
  const [events, setEvents] = useState<KasukuEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => {
        const items: KasukuEvent[] = data.items ?? [];
        setEvents(items.length > 0 ? items : DEMO_EVENTS);
      })
      .catch(() => setEvents(DEMO_EVENTS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#06080f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '1px solid rgba(230,126,34,0.2)',
          borderTopColor: '#E67E22',
          animation: 'rotate-slow 1s linear infinite',
        }} />
      </div>
    );
  }

  return <UniverseScene events={events} focusSlug={focusSlug} />;
}
