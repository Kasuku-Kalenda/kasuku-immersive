import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    // Find which story this event belongs to, and get all events in that story
    const { rows } = await pool.query(`
      SELECT
        s.id AS story_id,
        s.title AS story_title,
        s.summary AS story_summary,
        se_current.position AS current_position,
        (SELECT COUNT(*) FROM story_events WHERE story_id = s.id) AS total,
        json_agg(
          json_build_object(
            'id', e.id,
            'slug', e.slug,
            'title', e.title,
            'position', se.position,
            'thumbnailUrl', (
              SELECT m.url FROM event_media em JOIN media m ON m.id = em.media_id
              WHERE em.event_id = e.id AND em.is_cover = true LIMIT 1
            )
          ) ORDER BY se.position
        ) AS events
      FROM events ev
      JOIN story_events se_current ON se_current.event_id = ev.id
      JOIN stories s ON s.id = se_current.story_id
      JOIN story_events se ON se.story_id = s.id
      JOIN events e ON e.id = se.event_id AND e.deleted_at IS NULL
      WHERE ev.slug = $1 AND ev.deleted_at IS NULL AND s.status = 'published'
      GROUP BY s.id, s.title, s.summary, se_current.position
      LIMIT 1
    `, [slug]);

    if (rows.length === 0) return NextResponse.json({ story: null });

    const row = rows[0];
    return NextResponse.json({
      story: {
        id: row.story_id,
        title: row.story_title,
        summary: row.story_summary,
        currentPosition: row.current_position,
        total: parseInt(row.total),
        events: row.events,
      }
    });
  } catch (err) {
    console.error('story for event error', err);
    return NextResponse.json({ story: null });
  }
}
