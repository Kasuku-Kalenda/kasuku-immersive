import { Suspense } from 'react';
import HomeClient from './HomeClient';

// Suspense obligatoire pour useSearchParams() avec Next.js static export
export default function Home() {
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed', inset: 0, background: '#06080f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '1px solid rgba(230,126,34,0.2)',
          borderTopColor: '#E67E22',
          animation: 'rotate-slow 1s linear infinite',
        }} />
      </div>
    }>
      <HomeClient />
    </Suspense>
  );
}
