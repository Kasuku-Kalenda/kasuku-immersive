"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KasukuEvent, formatEventDate, getStarColor } from '@/lib/events';

interface Story {
  id: string;
  title: string;
  event_ids: string[];
}

interface HolographicCardProps {
  event: KasukuEvent;
  allEvents: KasukuEvent[];
  stories: Story[];
  onClose: () => void;
  onNavigate: (event: KasukuEvent) => void;
}

export default function HolographicCard({
  event,
  allEvents,
  stories,
  onClose,
  onNavigate,
}: HolographicCardProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const color = getStarColor(event);

  // Find which story this event belongs to
  const story = stories.find(s => s.event_ids.includes(event.id));
  const storyIndex = story ? story.event_ids.indexOf(event.id) : -1;
  const prevEventId = story && storyIndex > 0 ? story.event_ids[storyIndex - 1] : null;
  const nextEventId = story && storyIndex < story.event_ids.length - 1 ? story.event_ids[storyIndex + 1] : null;
  const prevEvent = prevEventId ? allEvents.find(e => e.id === prevEventId) : null;
  const nextEvent = nextEventId ? allEvents.find(e => e.id === nextEventId) : null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [event.id]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 380);
  }, [onClose]);

  const handleNav = useCallback((target: KasukuEvent) => {
    setVisible(false);
    setTimeout(() => onNavigate(target), 200);
  }, [onNavigate]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: visible ? 'all' : 'none',
      }}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }} />

      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(560px, 92vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '18px',
          border: `1px solid ${color}45`,
          background: 'linear-gradient(160deg, rgba(8,14,26,0.95) 0%, rgba(4,10,20,0.98) 100%)',
          backdropFilter: 'blur(28px)',
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${color}22, 0 32px 80px rgba(0,0,0,0.6)`,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(28px)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.48s cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {/* Scan line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${color}90 50%, transparent 100%)`,
          animation: 'scanline 3.5s linear infinite',
          zIndex: 2,
        }} />

        {/* Corner accents */}
        {[
          { top: 0, left: 0, borderTop: `1.5px solid ${color}70`, borderLeft: `1.5px solid ${color}70`, borderTopLeftRadius: 18 },
          { top: 0, right: 0, borderTop: `1.5px solid ${color}70`, borderRight: `1.5px solid ${color}70`, borderTopRightRadius: 18 },
          { bottom: 0, left: 0, borderBottom: `1.5px solid ${color}40`, borderLeft: `1.5px solid ${color}40`, borderBottomLeftRadius: 18 },
          { bottom: 0, right: 0, borderBottom: `1.5px solid ${color}40`, borderRight: `1.5px solid ${color}40`, borderBottomRightRadius: 18 },
        ].map((style, i) => (
          <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...style, pointerEvents: 'none', zIndex: 3 }} />
        ))}

        {/* Thumbnail / placeholder */}
        <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
          {event.thumbnailUrl ? (
            <>
              <img
                src={event.thumbnailUrl}
                alt={event.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to bottom, ${color}15 0%, rgba(8,14,26,0) 40%, rgba(4,10,20,0.96) 100%)`,
              }} />
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.05,
                backgroundImage: `repeating-linear-gradient(0deg, ${color} 0, ${color} 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, ${color} 0, ${color} 1px, transparent 1px, transparent 24px)`,
              }} />
            </>
          ) : (
            <>
              {/* Afrofuturist gradient placeholder */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse 120% 80% at 20% 50%, ${color}28 0%, transparent 60%), radial-gradient(ellipse 80% 120% at 80% 80%, rgba(14,98,81,0.3) 0%, transparent 60%), linear-gradient(135deg, rgba(8,14,26,1) 0%, rgba(12,20,40,1) 100%)`,
              }} />
              {/* Decorative concentric rings */}
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%', left: '30%',
                  width: i * 80, height: i * 80,
                  borderRadius: '50%',
                  border: `1px solid ${color}${['25','15','08'][i-1]}`,
                  transform: 'translate(-50%, -50%)',
                }} />
              ))}
              {/* Small central star */}
              <div style={{
                position: 'absolute', top: '50%', left: '30%',
                width: 6, height: 6, borderRadius: '50%',
                background: color,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 12px ${color}, 0 0 24px ${color}60`,
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 60%, rgba(4,10,20,0.96) 100%)',
              }} />
            </>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(4,10,20,0.8)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(250,248,245,0.6)',
              fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s',
              zIndex: 4,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '22px 26px 26px' }}>
          {/* Story badge */}
          {story && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginBottom: 12,
              padding: '4px 12px',
              borderRadius: 99,
              background: `${color}18`,
              border: `1px solid ${color}35`,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'block' }} />
              <span style={{
                fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: color + 'cc',
                fontFamily: 'var(--font-display)',
              }}>
                Récit · {storyIndex + 1}/{story.event_ids.length}
              </span>
            </div>
          )}

          {/* Theme badges */}
          {event.themes.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {event.themes.map(theme => (
                <span key={theme.id} style={{
                  fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '2px 9px', borderRadius: 99,
                  border: `1px solid ${theme.color}35`,
                  color: theme.color + 'bb',
                  background: theme.color + '0e',
                  fontFamily: 'var(--font-display)',
                }}>
                  {theme.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.1rem, 3vw, 1.45rem)',
            fontWeight: 600,
            color: 'var(--ivory)',
            marginBottom: 8,
            lineHeight: 1.3,
            textShadow: `0 0 40px ${color}45`,
            letterSpacing: '0.01em',
          }}>
            {event.title}
          </h2>

          {/* Date + country */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 1,
              background: `linear-gradient(90deg, ${color}80, transparent)`,
            }} />
            <p style={{
              fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              color: color + 'bb',
              fontFamily: 'var(--font-display)',
            }}>
              {formatEventDate(event)}
              {event.primaryCountryCode && ` · ${event.primaryCountryCode}`}
            </p>
          </div>

          {/* Summary */}
          {event.summary && (
            <p style={{
              fontSize: '0.88rem', lineHeight: 1.75,
              color: 'rgba(250,248,245,0.62)',
              marginBottom: 22,
              fontFamily: 'var(--font-body)',
            }}>
              {event.summary}
            </p>
          )}

          {/* Story navigation */}
          {story && (prevEvent || nextEvent) && (
            <div style={{
              marginBottom: 18,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <p style={{
                fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'rgba(250,248,245,0.3)', marginBottom: 10,
                fontFamily: 'var(--font-display)',
              }}>
                {story.title}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {prevEvent && (
                  <button
                    onClick={() => handleNav(prevEvent)}
                    style={{
                      flex: 1, padding: '9px 12px', textAlign: 'left',
                      background: `${color}10`,
                      border: `1px solid ${color}28`,
                      borderRadius: 9,
                      color: 'rgba(250,248,245,0.65)',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                  >
                    <span style={{ color: color, marginRight: 4, fontSize: '0.7rem' }}>◀</span>
                    <span style={{ color: 'rgba(250,248,245,0.4)', fontSize: '0.65rem' }}>Précédent</span>
                    <br />
                    <span style={{ fontSize: '0.75rem' }}>
                      {prevEvent.title.length > 38 ? prevEvent.title.slice(0, 38) + '…' : prevEvent.title}
                    </span>
                  </button>
                )}
                {nextEvent && (
                  <button
                    onClick={() => handleNav(nextEvent)}
                    style={{
                      flex: 1, padding: '9px 12px', textAlign: 'right',
                      background: `${color}10`,
                      border: `1px solid ${color}28`,
                      borderRadius: 9,
                      color: 'rgba(250,248,245,0.65)',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                  >
                    <span style={{ color: 'rgba(250,248,245,0.4)', fontSize: '0.65rem' }}>Suivant</span>
                    <span style={{ color: color, marginLeft: 4, fontSize: '0.7rem' }}>▶</span>
                    <br />
                    <span style={{ fontSize: '0.75rem' }}>
                      {nextEvent.title.length > 38 ? nextEvent.title.slice(0, 38) + '…' : nextEvent.title}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => router.push(`/events/${event.slug}`)}
              style={{
                flex: 1, padding: '11px 16px',
                background: `linear-gradient(135deg, ${color}28 0%, ${color}12 100%)`,
                border: `1px solid ${color}45`,
                borderRadius: 10,
                color: color,
                fontSize: '0.78rem', letterSpacing: '0.08em',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              Explorer l'événement →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
