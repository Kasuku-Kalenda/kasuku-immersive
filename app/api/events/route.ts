import { NextResponse } from 'next/server';
import { KASUKU_API } from '@/lib/api';
import { normalizeMediaUrl } from '@/lib/events';

export async function GET(request: Request) {
  try {
    const res = await fetch(`${KASUKU_API}/events?limit=200`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const host = request.headers.get('host')?.split(':')[0] ?? null;
    const items = (data.items ?? []).map((e: any) => ({
      ...e, thumbnailUrl: normalizeMediaUrl(e.thumbnailUrl ?? null, host),
    }));
    return NextResponse.json({ ...data, items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
