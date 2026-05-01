import { NextResponse } from 'next/server';
import { KASUKU_API } from '@/lib/api';

export async function GET() {
  try {
    const res = await fetch(`${KASUKU_API}/events?limit=200`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ items: [] });
  }
}
