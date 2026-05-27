"use client";

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[kasuku-immersive] Unhandled error:', error);
  }, [error]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#06080f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#e2c77d', fontFamily: 'system-ui, sans-serif', gap: '16px',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p style={{ fontSize: '18px', margin: 0 }}>L'univers n'a pas pu se charger</p>
      <p style={{ fontSize: '13px', color: '#8a7a5a', margin: 0 }}>
        {error.message || 'Une erreur inattendue s\'est produite.'}
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
            background: 'rgba(230,126,34,0.15)', border: '1px solid rgba(230,126,34,0.4)',
            color: '#E67E22', fontSize: '14px',
          }}
        >
          Réessayer
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(226,199,125,0.3)',
            color: '#e2c77d', fontSize: '14px',
          }}
        >
          Recharger la page
        </button>
      </div>
    </div>
  );
}
