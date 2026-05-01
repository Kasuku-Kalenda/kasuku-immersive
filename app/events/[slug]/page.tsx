import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import EventDetailClient from './EventDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getEventBySlug(slug: string) {
  try {
    const { rows } = await pool.query(`
      SELECT
        e.id, e.slug, e.lang, e.title, e.summary,
        e.temporal_type, e.start_date, e.end_date, e.display_date,
        e.approx_century, e.approx_decade,
        e.primary_country_code, e.reliability,
        COALESCE(
          (SELECT json_agg(json_build_object('id',t.id,'name',t.name,'slug',t.slug,'color',t.color))
           FROM event_themes et JOIN themes t ON t.id = et.theme_id
           WHERE et.event_id = e.id), '[]'
        ) AS themes,
        (SELECT m.url FROM event_media em JOIN media m ON m.id = em.media_id
         WHERE em.event_id = e.id AND em.is_cover = true LIMIT 1) AS thumbnail_url
      FROM events e
      WHERE e.slug = $1 AND e.deleted_at IS NULL
      LIMIT 1
    `, [slug]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id, slug: r.slug, lang: r.lang, title: r.title, summary: r.summary,
      temporalType: r.temporal_type, startDate: r.start_date, endDate: r.end_date,
      displayDate: r.display_date, approxCentury: r.approx_century, approxDecade: r.approx_decade,
      primaryCountryCode: r.primary_country_code, reliability: r.reliability,
      themes: r.themes ?? [], thumbnailUrl: r.thumbnail_url ?? null,
    };
  } catch { return null; }
}

async function getStoryBySlug(slug: string) {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id AS story_id, s.title AS story_title, s.summary AS story_summary,
        se_cur.position AS current_position,
        (SELECT COUNT(*) FROM story_events WHERE story_id = s.id) AS total,
        json_agg(json_build_object(
          'id', e.id, 'slug', e.slug, 'title', e.title, 'position', se.position,
          'thumbnailUrl', (SELECT m.url FROM event_media em JOIN media m ON m.id=em.media_id
                          WHERE em.event_id=e.id AND em.is_cover=true LIMIT 1)
        ) ORDER BY se.position) AS events
      FROM events ev
      JOIN story_events se_cur ON se_cur.event_id = ev.id
      JOIN stories s ON s.id = se_cur.story_id AND s.status = 'published'
      JOIN story_events se ON se.story_id = s.id
      JOIN events e ON e.id = se.event_id AND e.deleted_at IS NULL
      WHERE ev.slug = $1 AND ev.deleted_at IS NULL
      GROUP BY s.id, s.title, s.summary, se_cur.position
      LIMIT 1
    `, [slug]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.story_id, title: r.story_title, summary: r.story_summary,
      currentPosition: r.current_position, total: parseInt(r.total), events: r.events,
    };
  } catch { return null; }
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const [event, story] = await Promise.all([getEventBySlug(slug), getStoryBySlug(slug)]);
  if (!event) notFound();
  return <EventDetailClient event={event} story={story} />;
}
