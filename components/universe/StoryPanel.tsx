"use client";

import { useEffect, useState } from 'react';
import { KasukuEvent, getStarColor } from '@/lib/events';

interface Story {
  id: string;
  title: string;
  event_ids: string[];
}

interface StoryPanelProps {
  story: Story;
  events: KasukuEvent[];
  onClose: () => void;
  onSelectEvent: (event: KasukuEvent) => void;
}

export default function StoryPanel({ story, events, onClose, onSelectEvent }: StoryPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  const storyEvents = story.event_ids
    .map(id => events.find(e => e.id === id))
    .filter(Boolean) as KasukuEvent[];

  const color = storyEvents[0] ? getStarColor(storyEvents[0]) : '#E67E22';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.25)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel — slide from right */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(400px, 92vw)',
        zIndex: 95,
        background: 'linear-gradient(160deg, rgba(8,14,26,0.97) 0%, rgba(4,8,18,0.99) 100%)',
        borderLeft: `1px solid ${color}25`,
        backdropFilter: 'blur(24px)',
        boxShadow: `-24px 0 80px rgba(0,0,0,0.6)`,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', scrollbarWidth: 'none',
      }}>
        {/* Scan line top */}
        <div style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
          flexShrink: 0,
          animation: 'scanline 3.5s linear infinite',
        }} />

        {/* Header */}
        <div style={{ padding: '28px 24px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '3px 10px', borderRadius: 99,
              background: `${color}18`, border: `1px solid ${color}35`,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'block', boxShadow: `0 0 6px ${color}` }} />
              <span style={{
                fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                color: color + 'cc', fontFamily: 'var(--font-display)',
              }}>
                Récit · {storyEvents.length} événements
              </span>
            </div>

            <button
              onClick={handleClose}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(250,248,245,0.5)', fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            fontWeight: 600, color: 'var(--ivory)', lineHeight: 1.3,
            textShadow: `0 0 30px ${color}40`,
            marginBottom: 0,
          }}>
            {story.title}
          </h2>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color}20, transparent)`, flexShrink: 0, margin: '0 24px' }} />

        {/* Event list */}
        <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {storyEvents.map((event, i) => {
            const evColor = getStarColor(event);
            return (
              <div
                key={event.id}
                onClick={() => { onSelectEvent(event); handleClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = `${evColor}10`;
                  el.style.borderColor = `${evColor}35`;
                  el.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = 'rgba(255,255,255,0.03)';
                  el.style.borderColor = 'rgba(255,255,255,0.06)';
                  el.style.transform = 'translateX(0)';
                }}
              >
                {/* Position number */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: `${evColor}18`, border: `1px solid ${evColor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', color: evColor, fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                }}>
                  {i + 1}
                </div>

                {/* Thumbnail */}
                {event.thumbnailUrl ? (
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={event.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                  </div>
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${evColor}20, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: evColor, boxShadow: `0 0 8px ${evColor}` }} />
                  </div>
                )}

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.82rem', color: 'rgba(250,248,245,0.85)',
                    fontFamily: 'var(--font-body)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 3,
                  }}>
                    {event.title}
                  </div>
                  {event.displayDate || event.startDate ? (
                    <div style={{
                      fontSize: '0.67rem', color: evColor + '90',
                      fontFamily: 'var(--font-display)', letterSpacing: '0.1em',
                    }}>
                      {event.displayDate || new Date(event.startDate!).getFullYear()}
                      {event.primaryCountryCode && ` · ${event.primaryCountryCode}`}
                    </div>
                  ) : null}
                </div>

                {/* Arrow */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={evColor + '60'} strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
