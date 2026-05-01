"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiPath } from '@/lib/api';

interface Theme { id: string; name: string; color: string; }
interface StoryEvent { id: string; slug: string; title: string; position: number; thumbnailUrl: string | null; }
interface Story {
  id: string; title: string; summary: string | null;
  currentPosition: number; total: number; events: StoryEvent[];
}
interface KasukuEvent {
  id: string; slug: string; title: string; summary: string | null;
  startDate: string | null; displayDate: string | null;
  approxCentury: number | null; approxDecade: number | null;
  primaryCountryCode: string | null; thumbnailUrl: string | null;
  themes: Theme[];
}

interface WikiData { extract: string | null; extractHtml: string | null; thumbnail: string | null; pageUrl: string | null; }

// Wikipedia title mapping (slug prefix → English title)
const WIKI_TITLES: Record<string, string> = {
  'seed-julius-nyerere': 'Julius Nyerere',
  'seed-nelson-mandela': 'Nelson Mandela',
  'seed-kwame-nkrumah': 'Kwame Nkrumah',
  'seed-thomas-sankara': 'Thomas Sankara',
  'seed-haile-selassie': 'Haile Selassie',
  'seed-mansa-musa': 'Mansa Musa',
  'seed-cheikh-anta-diop': 'Cheikh Anta Diop',
  'seed-wangari-maathai': 'Wangari Maathai',
  'seed-patrice-lumumba': 'Patrice Lumumba',
  'seed-soundiata-keita': 'Sundiata Keita',
  'seed-toussaint-louverture': 'Toussaint Louverture',
  'seed-steve-biko': 'Steve Biko',
  'seed-makeba': 'Miriam Makeba',
  'seed-hatshepsout': 'Hatshepsut',
  'seed-cleopatre': 'Cleopatra',
  'seed-ramses': 'Ramesses II',
  'seed-pyramides-meroe': 'Pyramids of Meroë',
  'seed-grandes-zimbabwe': 'Great Zimbabwe',
  'seed-empire-mali': 'Mali Empire',
  'seed-empire-songhai': 'Songhai Empire',
  'seed-empire-ghana': 'Ghana Empire',
  'seed-empire-zoulou': 'Zulu Kingdom',
  'seed-empire-axoum': 'Kingdom of Aksum',
  'seed-bataille-adoua': 'Battle of Adwa',
  'seed-traite-berlin': 'Berlin Conference',
  'seed-genocide-rwanda': 'Rwandan genocide',
  'seed-apartheid': 'Apartheid',
  'seed-independance-algerie': 'Algerian War',
};

function getWikiTitle(slug: string, eventTitle: string): string {
  for (const [prefix, title] of Object.entries(WIKI_TITLES)) {
    if (slug.startsWith(prefix)) return title;
  }
  return eventTitle;
}

function formatDate(event: KasukuEvent): string {
  if (event.displayDate) return event.displayDate;
  if (event.startDate) {
    return new Date(event.startDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (event.approxCentury) return `${event.approxCentury}e siècle`;
  if (event.approxDecade) return `Années ${event.approxDecade}`;
  return '';
}

export default function EventDetailClient({ event, story }: { event: KasukuEvent; story: Story | null }) {
  const router = useRouter();
  const [wiki, setWiki] = useState<WikiData | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const color = event.themes[0]?.color ?? '#E67E22';

  // globals.css sets overflow:hidden for the universe — unlock it on detail pages
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    const wikiTitle = getWikiTitle(event.slug, event.title);
    fetch(apiPath(`/api/wiki?title=${encodeURIComponent(wikiTitle)}`))
      .then(r => r.json())
      .then(setWiki)
      .catch(() => {});
  }, [event.slug, event.title]);

  const handleBack = useCallback(() => {
    router.push(`/?focus=${event.slug}`);
  }, [router, event.slug]);

  const heroImg = event.thumbnailUrl ?? wiki?.thumbnail ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--space-bg)', color: 'var(--ivory)', fontFamily: 'var(--font-body)' }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: '65vh', minHeight: 400, overflow: 'hidden' }}>
        {heroImg ? (
          <>
            <img
              src={heroImg}
              alt={event.title}
              onLoad={() => setHeroLoaded(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: heroLoaded ? 0.55 : 0,
                transition: 'opacity 0.8s ease',
                filter: 'saturate(0.8)',
              }}
            />
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 100% 80% at 30% 50%, ${color}22 0%, transparent 60%), linear-gradient(135deg, rgba(8,14,26,1) 0%, rgba(12,20,40,1) 100%)`,
          }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '30%',
                width: i * 120, height: i * 120, borderRadius: '50%',
                border: `1px solid ${color}${['20','14','0d','07'][i-1]}`,
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
            <div style={{
              position: 'absolute', top: '50%', left: '30%',
              width: 8, height: 8, borderRadius: '50%',
              background: color, transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 20px ${color}, 0 0 40px ${color}60`,
            }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, rgba(6,9,14,0.3) 0%, rgba(6,9,14,0.1) 40%, rgba(6,9,14,0.85) 80%, rgba(6,9,14,1) 100%)`,
        }} />

        {/* Scanline */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
          background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
        }} />

        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            position: 'absolute', top: 24, left: 24,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px 8px 12px',
            background: 'rgba(6,9,14,0.75)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99,
            color: 'rgba(250,248,245,0.7)', cursor: 'pointer',
            fontSize: '0.78rem', fontFamily: 'var(--font-display)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color + '60'; (e.currentTarget as HTMLButtonElement).style.color = color; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(250,248,245,0.7)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Retour à l'univers
        </button>

        {/* Hero content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 clamp(24px, 6vw, 80px) 48px',
          animation: 'fadeUp 0.7s ease both',
        }}>
          {/* Themes */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {event.themes.map(t => (
              <span key={t.id} style={{
                fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 99,
                border: `1px solid ${t.color}45`, color: t.color + 'cc',
                background: t.color + '15', fontFamily: 'var(--font-display)',
              }}>{t.name}</span>
            ))}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 4vw, 3rem)',
            fontWeight: 700, lineHeight: 1.2,
            color: 'var(--ivory)',
            textShadow: `0 0 60px ${color}40`,
            marginBottom: 16,
            maxWidth: 800,
            letterSpacing: '0.01em',
          }}>
            {event.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${color}80, transparent)` }} />
            <span style={{
              fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: color + 'cc', fontFamily: 'var(--font-display)',
            }}>
              {formatDate(event)}
              {event.primaryCountryCode && ` · ${event.primaryCountryCode}`}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 860, margin: '0 auto',
        padding: '48px clamp(24px, 5vw, 60px) 80px',
        animation: 'fadeUp 0.8s 0.15s ease both',
      }}>

        {/* Story progress bar */}
        {story && (
          <div style={{
            marginBottom: 48, padding: '20px 24px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${color}20`,
            borderRadius: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: color + 'aa', fontFamily: 'var(--font-display)', marginBottom: 4 }}>Récit</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--ivory)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{story.title}</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'rgba(250,248,245,0.3)', fontFamily: 'var(--font-display)' }}>
                {story.currentPosition}/{story.total}
              </span>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
              {story.events.map(e => (
                <div
                  key={e.id}
                  onClick={() => router.push(`/events/${e.slug}`)}
                  title={e.title}
                  style={{
                    flex: 1, height: 3, borderRadius: 2, cursor: 'pointer',
                    background: e.position <= story.currentPosition ? color : 'rgba(255,255,255,0.12)',
                    boxShadow: e.position === story.currentPosition ? `0 0 8px ${color}` : 'none',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>

            {/* Prev / next */}
            <div style={{ display: 'flex', gap: 8 }}>
              {story.events.find(e => e.position === story.currentPosition - 1) && (
                <button
                  onClick={() => router.push(`/events/${story.events.find(e => e.position === story.currentPosition - 1)!.slug}`)}
                  style={{
                    flex: 1, padding: '9px 12px', textAlign: 'left',
                    background: `${color}0e`, border: `1px solid ${color}25`,
                    borderRadius: 9, color: 'rgba(250,248,245,0.6)',
                    fontSize: '0.75rem', fontFamily: 'var(--font-body)', cursor: 'pointer',
                  }}
                >
                  <span style={{ color: color, marginRight: 4 }}>◀</span>
                  <span style={{ opacity: 0.5 }}>Précédent · </span>
                  {story.events.find(e => e.position === story.currentPosition - 1)!.title.slice(0, 40)}…
                </button>
              )}
              {story.events.find(e => e.position === story.currentPosition + 1) && (
                <button
                  onClick={() => router.push(`/events/${story.events.find(e => e.position === story.currentPosition + 1)!.slug}`)}
                  style={{
                    flex: 1, padding: '9px 12px', textAlign: 'right',
                    background: `${color}0e`, border: `1px solid ${color}25`,
                    borderRadius: 9, color: 'rgba(250,248,245,0.6)',
                    fontSize: '0.75rem', fontFamily: 'var(--font-body)', cursor: 'pointer',
                  }}
                >
                  <span style={{ opacity: 0.5 }}>Suivant · </span>
                  {story.events.find(e => e.position === story.currentPosition + 1)!.title.slice(0, 40)}…
                  <span style={{ color: color, marginLeft: 4 }}>▶</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {event.summary && (
          <p style={{
            fontSize: '1.1rem', lineHeight: 1.8,
            color: 'rgba(250,248,245,0.8)',
            marginBottom: 36, fontStyle: 'italic',
            borderLeft: `2px solid ${color}50`,
            paddingLeft: 20,
          }}>
            {event.summary}
          </p>
        )}

        {/* Wikipedia extract */}
        {wiki?.extractHtml && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 28, height: 1, background: `${color}60` }} />
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.3)', fontFamily: 'var(--font-display)' }}>
                Contexte historique
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <div
              style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'rgba(250,248,245,0.65)' }}
              dangerouslySetInnerHTML={{ __html: wiki.extractHtml }}
            />
            {wiki.pageUrl && (
              <a
                href={wiki.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 16, fontSize: '0.75rem', color: color + 'aa',
                  textDecoration: 'none', letterSpacing: '0.06em',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Lire l'article complet sur Wikipedia
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Story thumbnails */}
        {story && story.events.length > 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 28, height: 1, background: `${color}60` }} />
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.3)', fontFamily: 'var(--font-display)' }}>
                Autres moments du récit
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {story.events.filter(e => e.slug !== event.slug).map(e => (
                <div
                  key={e.id}
                  onClick={() => router.push(`/events/${e.slug}`)}
                  style={{
                    borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLDivElement).style.borderColor = color + '40'; (ev.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (ev.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{ height: 90, overflow: 'hidden', background: `linear-gradient(135deg, ${color}18, rgba(6,9,14,1))` }}>
                    {e.thumbnailUrl && (
                      <img src={e.thumbnailUrl} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: '0.62rem', color: color + '80', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', marginBottom: 4 }}>
                      {e.position}/{story.total}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(250,248,245,0.75)', lineHeight: 1.4 }}>
                      {e.title.length > 50 ? e.title.slice(0, 50) + '…' : e.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom back button */}
        <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 28px',
              background: `linear-gradient(135deg, ${color}20, ${color}0a)`,
              border: `1px solid ${color}40`, borderRadius: 99,
              color: color, cursor: 'pointer',
              fontSize: '0.8rem', fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Retour à l'univers
          </button>
        </div>
      </div>
    </div>
  );
}
