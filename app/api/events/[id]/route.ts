import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`http://localhost/api/v1/events/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
