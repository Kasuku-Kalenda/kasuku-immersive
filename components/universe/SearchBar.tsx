"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { KasukuEvent } from '@/lib/events';

interface Story { id: string; title: string; eventIds: string[]; }

interface SearchBarProps {
  events: KasukuEvent[];
  stories: Story[];
  onSelect: (event: KasukuEvent) => void;
}

/**
 * Recherche déclenchée par une simple loupe discrète (coin haut-droit,
 * symétrique du bouton retour top-gauche de UniverseScene) — remplace
 * l'ancienne barre toujours visible, jugée trop envahissante à l'écran.
 * Le panneau se déploie depuis le bouton (transformOrigin top-right) avec un
 * anneau d'ouverture ponctuel (keyframe `pulse-ring`, déjà utilisée ailleurs
 * dans l'univers pour les étoiles — cohérence visuelle plutôt qu'une
 * animation inventée pour l'occasion).
 */
export default function SearchBar({ events, stories, onSelect }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
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
      if (filter === 'story') return stories.some(s => s.eventIds.includes(e.id));
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

  const openSearch = useCallback(() => {
    setExpanded(true);
    setPulseKey(k => k + 1);
    // Le focus après le début de l'animation d'ouverture (pas avant) : sur
    // mobile, focus immédiat + transition CSS simultanée donne un clavier
    // qui saccade l'animation.
    setTimeout(() => inputRef.current?.focus(), 180);
  }, []);

  const closeSearch = useCallback(() => {
    setExpanded(false);
    setFocused(false);
    setOpen(false);
    setQuery('');
    setFilter('all');
    inputRef.current?.blur();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape' && expanded) closeSearch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded, openSearch, closeSearch]);

  return (
    <>
      {/* Backdrop — ferme au tap en dehors du panneau */}
      {expanded && (
        <div
          onClick={closeSearch}
          style={{
            position: 'fixed', inset: 0, zIndex: 75,
            background: 'rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.25s ease',
          }}
        />
      )}

      {/* Bouton loupe — position fixe, ne bouge jamais (contrairement au
          panneau qui, lui, se déploie depuis ce point). */}
      <div style={{
        position: 'fixed',
        top: 'max(16px, calc(env(safe-area-inset-top) + 12px))',
        right: 'max(16px, env(safe-area-inset-right))',
        zIndex: 85,
      }}>
        {expanded && (
          <div key={pulseKey} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid rgba(230,126,34,0.6)',
            animation: 'pulse-ring 0.6s ease-out',
            pointerEvents: 'none',
          }} />
        )}
        <button
          onClick={() => (expanded ? closeSearch() : openSearch())}
          aria-label={expanded ? 'Fermer la recherche' : 'Rechercher'}
          style={{
            position: 'relative', width: 40, height: 40, borderRadius: '50%',
            background: expanded ? 'rgba(230,126,34,0.16)' : 'rgba(4,8,18,0.7)',
            border: expanded ? '1px solid rgba(230,126,34,0.45)' : '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s ease, border-color 0.2s ease',
            cursor: 'pointer',
          }}
        >
          {/* Loupe / croix — fondu-enchaîné + légère rotation, pas de layout shift */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={expanded ? 'transparent' : 'rgba(230,126,34,0.85)'}
            strokeWidth="2.4" strokeLinecap="round"
            style={{
              position: 'absolute',
              opacity: expanded ? 0 : 1,
              transform: expanded ? 'rotate(-45deg) scale(0.7)' : 'rotate(0deg) scale(1)',
              transition: 'opacity 0.2s ease, transform 0.25s ease',
            }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={expanded ? 'rgba(230,126,34,0.9)' : 'transparent'}
            strokeWidth="2.4" strokeLinecap="round"
            style={{
              position: 'absolute',
              opacity: expanded ? 1 : 0,
              transform: expanded ? 'rotate(0deg) scale(1)' : 'rotate(45deg) scale(0.7)',
              transition: 'opacity 0.2s ease, transform 0.25s ease',
            }}>
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Panneau — déployé depuis le bouton (coin haut-droit) */}
      <div style={{
        position: 'fixed',
        top: 'max(64px, calc(env(safe-area-inset-top) + 60px))',
        right: 'max(16px, env(safe-area-inset-right))',
        zIndex: 80, width: 'min(400px, calc(100vw - 32px))',
        transformOrigin: 'top right',
        transform: expanded ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(-10px)',
        opacity: expanded ? 1 : 0,
        pointerEvents: expanded ? 'auto' : 'none',
        transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease',
      }}>
        {/* Card shell */}
        <div style={{
          background: focused ? 'rgba(8,14,26,0.96)' : 'rgba(8,14,26,0.9)',
          border: focused
            ? '1px solid rgba(230,126,34,0.4)'
            : '1px solid rgba(255,255,255,0.1)',
          borderRadius: showDropdown ? '14px 14px 0 0' : 14,
          backdropFilter: 'blur(24px)',
          boxShadow: focused
            ? '0 0 0 1px rgba(230,126,34,0.1), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.5)',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
        }}>
          {/* Scan line — cohérent avec HolographicCard/StoryPanel */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(230,126,34,0.5), transparent)',
            animation: 'scanline 3.5s linear infinite',
          }} />

          {/* Row 1 — input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 0' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={focused ? 'rgba(230,126,34,0.9)' : 'rgba(230,126,34,0.55)'}
              strokeWidth="2.5" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              className="search-input"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => { setFocused(true); setOpen(true); }}
              // Ne referme pas si un filtre est actif ou qu'une recherche est en
              // cours : au toucher, le blur peut arriver avant même le clic sur
              // un chip de filtre (contrairement à la souris) — fermer
              // systématiquement ici rouvrait puis refermait le panneau aussitôt.
              onBlur={() => {
                setFocused(false);
                setTimeout(() => {
                  if (filter === 'all' && query.trim() === '') setOpen(false);
                }, 180);
              }}
              placeholder="Rechercher un événement, une date, un récit…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'rgba(250,248,245,0.9)', fontSize: '0.82rem',
                fontFamily: 'var(--font-body)', padding: '10px 0',
                letterSpacing: '0.01em', minWidth: 0,
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 14px 0' }} />

          {/* Row 2 — filters, en grille qui s'enroule (jamais de contenu hors champ) */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 14px 12px',
          }}>
            {filters.map(f => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => { setFilter(f.key as typeof filter); setOpen(true); }}
                  style={{
                    padding: '6px 12px', borderRadius: 99, minHeight: 30,
                    fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
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
            maxHeight: '50vh', overflowY: 'auto',
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
                const storyForEvent = stories.find(s => s.eventIds.includes(event.id));
                const dotColor = event.themes[0]?.color || '#E67E22';
                return (
                  <div
                    key={event.id}
                    onClick={() => { onSelect(event); closeSearch(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', cursor: 'pointer',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      transition: 'background 0.1s',
                    }}
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
    </>
  );
}
