import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://localhost/api/v1/events?limit=100', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], page: 1, totalPages: 0, totalItems: 0 }, { status: 200 });
  }
}
