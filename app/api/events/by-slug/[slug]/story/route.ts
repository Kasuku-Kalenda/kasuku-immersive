import { NextResponse } from 'next/server';
import { KASUKU_API } from '@/lib/api';

/**
 * Retourne le récit (story/timeline) auquel appartient cet événement.
 * Proxie vers GET /api/v1/timelines/slug/:timelineSlug après avoir
 * résolu le slug de la timeline depuis l'événement.
 */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    // 1. Récupérer l'événement pour savoir à quel récit il appartient
    const evRes = await fetch(`${KASUKU_API}/events/slug/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!evRes.ok) return NextResponse.json({ story: null });
    const event = await evRes.json();

    // timelineSlug ou timelineId peut être renseigné sur l'événement
    const timelineSlug: string | null = event.timelineSlug ?? null;
    const timelineId:   string | null = event.timelineId   ?? null;

    if (!timelineSlug && !timelineId) return NextResponse.json({ story: null });

    // 2. Récupérer le récit complet (avec ses moments)
    const tlUrl = timelineSlug
      ? `${KASUKU_API}/timelines/slug/${encodeURIComponent(timelineSlug)}`
      : `${KASUKU_API}/timelines/${timelineId}`;

    const tlRes = await fetch(tlUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!tlRes.ok) return NextResponse.json({ story: null });
    const tl = await tlRes.json();

    const moments: any[] = tl.moments ?? [];
    const currentPosition = moments.findIndex(
      (m: any) => m.slug === slug || (m as any).eventSlug === slug
    );

    return NextResponse.json({
      story: {
        id:              tl.id,
        title:           tl.title,
        summary:         tl.summary,
        currentPosition: currentPosition >= 0 ? currentPosition : 0,
        total:           moments.length,
        events:          moments.map((m: any, i: number) => ({
          id:           m.id,
          slug:         m.slug,
          title:        m.title,
          position:     m.position ?? i,
          thumbnailUrl: m.thumbnailUrl ?? null,
        })),
      },
    });
  } catch (err) {
    console.error('story for event error', err);
    return NextResponse.json({ story: null });
  }
}
