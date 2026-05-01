import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id,
        s.title,
        s.summary,
        array_agg(se.event_id ORDER BY se.position) AS event_ids
      FROM stories s
      JOIN story_events se ON se.story_id = s.id
      WHERE s.status = 'published'
      GROUP BY s.id, s.title, s.summary
      ORDER BY count(se.event_id) DESC
    `);
    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error('stories DB error', err);
    return NextResponse.json({ items: [] });
  }
}
