import { NextResponse } from 'next/server';
import { KASUKU_API } from '@/lib/api';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await fetch(`${KASUKU_API}/events/slug/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: res.status });
    const data = await res.json();
    // Normaliser les noms de champs snake_case → camelCase si nécessaire
    return NextResponse.json({
      id:                 data.id,
      slug:               data.slug,
      lang:               data.lang,
      title:              data.title,
      summary:            data.summary,
      temporalType:       data.temporalType ?? data.temporal_type,
      startDate:          data.startDate   ?? data.start_date,
      endDate:            data.endDate     ?? data.end_date,
      displayDate:        data.displayDate ?? data.display_date,
      approxCentury:      data.approxCentury ?? data.approx_century,
      approxDecade:       data.approxDecade  ?? data.approx_decade,
      primaryCountryCode: data.primaryCountryCode ?? data.primary_country_code,
      reliability:        data.reliability,
      themes:             data.themes ?? [],
      thumbnailUrl:       data.thumbnailUrl ?? data.thumbnail_url ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
