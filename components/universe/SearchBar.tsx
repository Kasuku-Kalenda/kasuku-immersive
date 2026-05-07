"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { KasukuEvent } from '@/lib/events';

interface Story { id: string; title: string; event_ids: string[]; }

interface SearchBarProps {
  events: KasukuEvent[];
  stories: Story[];
  onSelect: (event: KasukuEvent) => void;
}

export default function SearchBar({ events, stories, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'story' | string>('all');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allThemes = Array.from(
    new Map(events.flatMap(e => e.themes).map(t => [t.id, t])).values()
  );

  const filters = [
    { key: 'all',   label: 'Tout',   color: '#E67E22' },
    { key: 'story', label: 'Récits', color: '#1ABC9C' },
    ...allThemes.map(t => ({ key: t.id, label: t.name, color: t.color })),
  ];

  const hits = useCallback(() => {
    if (!query.trim() && filter === 'all') return [];
    const q = query.toLowerCase().trim();
    let list = events.filter(e => {
      if (filter === 'story') return stories.some(s => s.event_ids.includes(e.id));
      if (filter !== 'all') return e.themes.some(t => t.id === filter);
      return true;
    });
    if (q) list = list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.summary?.toLowerCase().includes(q) ||
      e.themes.some(t => t.name.toLowerCase().includes(q))
    );
    return list.slice(0, 8);
  }, [query, filter, events, stories]);

  const results = hits();
  const showDropdown = open && (results.length > 0 || query.length > 0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeFilter = filters.find(f => f.key === filter);

  return (
    <div style={{
      position: 'fixed',
      top: 'max(20px, calc(env(safe-area-inset-top) + 12px))',
      left: '50%', transform: 'translateX(-50%)',
      zIndex: 80, width: 'min(520px, 92vw)',
    }}>
      {/* Card shell */}
      <div style={{
        background: focused ? 'rgba(8,14,26,0.96)' : 'rgba(8,14,26,0.75)',
        border: focused
          ? '1px solid rgba(230,126,34,0.4)'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: showDropdown ? '14px 14px 0 0' : 14,
        backdropFilter: 'blur(24px)',
        boxShadow: focused
          ? '0 0 0 1px rgba(230,126,34,0.1), 0 8px 32px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.35)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Row 1 — input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={focused ? 'rgba(230,126,34,0.9)' : 'rgba(230,126,34,0.55)'}
            strokeWidth="2.5" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 180); }}
            placeholder="Rechercher un événement, une date, un récit…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'rgba(250,248,245,0.9)', fontSize: '0.82rem',
              fontFamily: 'var(--font-body)', padding: '10px 0',
              letterSpacing: '0.01em', minWidth: 0,
            }}
          />
          <kbd style={{
            fontSize: '0.58rem', color: 'rgba(250,248,245,0.18)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 5, padding: '2px 6px',
            fontFamily: 'var(--font-body)', flexShrink: 0,
            opacity: focused ? 0 : 1, transition: 'opacity 0.15s',
            pointerEvents: 'none',
          }}>⌘K</kbd>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 14px' }} />

        {/* Row 2 — filters */}
        <div style={{
          display: 'flex', gap: 5, padding: '7px 14px',
          overflowX: 'auto', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {filters.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onMouseDown={e => { e.preventDefault(); setFilter(f.key as typeof filter); setOpen(true); }}
                style={{
                  padding: '3px 10px', borderRadius: 99, flexShrink: 0,
                  fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: active ? `${f.color}28` : 'rgba(255,255,255,0.04)',
                  border: active ? `1px solid ${f.color}50` : '1px solid rgba(255,255,255,0.07)',
                  color: active ? f.color : 'rgba(250,248,245,0.38)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.15s',
                }}
              >
                {active && <span style={{ marginRight: 4, fontSize: '0.5rem' }}>●</span>}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          background: 'rgba(6,10,20,0.97)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: 'none',
          borderRadius: '0 0 14px 14px',
          backdropFilter: 'blur(24px)',
          overflow: 'hidden',
          boxShadow: '0 20px 48px rgba(0,0,0,0.6)',
        }}>
          {results.length === 0 ? (
            <div style={{
              padding: '14px 16px',
              color: 'rgba(250,248,245,0.28)',
              fontSize: '0.8rem', fontFamily: 'var(--font-body)',
            }}>
              Aucun résultat pour « {query} »
            </div>
          ) : (
            results.map((event, i) => {
              const storyForEvent = stories.find(s => s.event_ids.includes(event.id));
              const dotColor = event.themes[0]?.color || '#E67E22';
              return (
                <div
                  key={event.id}
                  onMouseDown={() => { onSelect(event); setQuery(''); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 16px', cursor: 'pointer',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(230,126,34,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: dotColor, boxShadow: `0 0 6px ${dotColor}`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.82rem', color: 'rgba(250,248,245,0.88)',
                      fontFamily: 'var(--font-body)', fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {event.title}
                    </div>
                    <div style={{
                      fontSize: '0.67rem', color: 'rgba(250,248,245,0.32)',
                      marginTop: 2, fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
                    }}>
                      {event.themes.map(t => t.name).join(' · ')}
                      {storyForEvent && (
                        <span style={{ color: '#E67E22', opacity: 0.65 }}>
                          {' · '}{storyForEvent.title.length > 34 ? storyForEvent.title.slice(0, 34) + '…' : storyForEvent.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.64rem', color: 'rgba(250,248,245,0.22)',
                    flexShrink: 0, fontFamily: 'var(--font-display)',
                  }}>
                    {event.startDate ? new Date(event.startDate).getFullYear() : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
