import { notFound } from 'next/navigation';
import { KASUKU_API } from '@/lib/api';
import EventDetailClient from './EventDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getEventBySlug(slug: string) {
  try {
    const res = await fetch(`${KASUKU_API}/events/slug/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id:                 data.id,
      slug:               data.slug,
      lang:               data.lang,
      title:              data.title,
      summary:            data.summary,
      temporalType:       data.temporalType ?? data.temporal_type,
      startDate:          data.startDate    ?? data.start_date,
      endDate:            data.endDate      ?? data.end_date,
      displayDate:        data.displayDate  ?? data.display_date,
      approxCentury:      data.approxCentury ?? data.approx_century,
      approxDecade:       data.approxDecade  ?? data.approx_decade,
      primaryCountryCode: data.primaryCountryCode ?? data.primary_country_code,
      reliability:        data.reliability,
      themes:             data.themes ?? [],
      thumbnailUrl:       data.thumbnailUrl ?? data.thumbnail_url ?? null,
    };
  } catch { return null; }
}

async function getStoryForEvent(slug: string) {
  try {
    const ev = await getEventBySlug(slug);
    if (!ev) return null;

    const timelineSlug: string | null = (ev as any).timelineSlug ?? null;
    const timelineId:   string | null = (ev as any).timelineId   ?? null;
    if (!timelineSlug && !timelineId) return null;

    const tlUrl = timelineSlug
      ? `${KASUKU_API}/timelines/slug/${encodeURIComponent(timelineSlug)}`
      : `${KASUKU_API}/timelines/${timelineId}`;

    const res = await fetch(tlUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return null;
    const tl = await res.json();

    const moments: any[] = tl.moments ?? [];
    const currentPosition = moments.findIndex((m: any) => m.slug === slug);

    return {
      id:              tl.id,
      title:           tl.title,
      summary:         tl.summary,
      currentPosition: currentPosition >= 0 ? currentPosition : 0,
      total:           moments.length,
      events:          moments.map((m: any, i: number) => ({
        id: m.id, slug: m.slug, title: m.title,
        position: m.position ?? i, thumbnailUrl: m.thumbnailUrl ?? null,
      })),
    };
  } catch { return null; }
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const [event, story] = await Promise.all([getEventBySlug(slug), getStoryForEvent(slug)]);
  if (!event) notFound();
  return <EventDetailClient event={event} story={story} />;
}
