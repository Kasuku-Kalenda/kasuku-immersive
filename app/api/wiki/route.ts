import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  if (!title) return NextResponse.json({ extract: null });

  try {
    const encoded = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { headers: { 'User-Agent': 'KasukuImmersive/1.0' }, next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    return NextResponse.json({
      extract: data.extract ?? null,
      extractHtml: data.extract_html ?? null,
      thumbnail: data.thumbnail?.source ?? null,
      pageUrl: data.content_urls?.desktop?.page ?? null,
    });
  } catch {
    return NextResponse.json({ extract: null });
  }
}
