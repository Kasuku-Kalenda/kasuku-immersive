import { NextResponse } from 'next/server';
import { KASUKU_API } from '@/lib/api';

export async function GET() {
  try {
    const res = await fetch(`${KASUKU_API}/timelines?limit=50`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ items: [] });
    const data = await res.json();
    return NextResponse.json({ items: data.items ?? [] });
  } catch (err) {
    console.error('stories API error', err);
    return NextResponse.json({ items: [] });
  }
}
