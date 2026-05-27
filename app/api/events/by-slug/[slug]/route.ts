import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const { rows } = await pool.query(`
      SELECT
        e.id, e.slug, e.lang, e.title, e.summary,
        e.temporal_type, e.start_date, e.end_date, e.display_date,
        e.approx_century, e.approx_decade,
        e.primary_country_code,
        e.reliability,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color
          ))
          FROM event_themes et JOIN themes t ON t.id = et.theme_id
          WHERE et.event_id = e.id),
          '[]'
        ) AS themes,
        (SELECT m.url
         FROM event_media em JOIN media m ON m.id = em.media_id
         WHERE em.event_id = e.id AND em.is_cover = true
         LIMIT 1
        ) AS thumbnail_url
      FROM events e
      WHERE e.slug = $1 AND e.deleted_at IS NULL AND e.status = 'published'
      LIMIT 1
    `, [slug]);

    if (rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      slug: row.slug,
      lang: row.lang,
      title: row.title,
      summary: row.summary,
      temporalType: row.temporal_type,
      startDate: row.start_date,
      endDate: row.end_date,
      displayDate: row.display_date,
      approxCentury: row.approx_century,
      approxDecade: row.approx_decade,
      primaryCountryCode: row.primary_country_code,
      reliability: row.reliability,
      themes: row.themes ?? [],
      thumbnailUrl: row.thumbnail_url ?? null,
    });
  } catch (err) {
    console.error('event by-slug error', err);
    return NextResponse.json({ error: 'error' }, { status: 500 });
  }
}
