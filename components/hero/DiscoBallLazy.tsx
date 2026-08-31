'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import DiscoBall — no SSR, heavy Three.js stays out of initial bundle
const DiscoBallInner = dynamic(() => import('./DiscoBall'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle loading indicator — gold dot pulse */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#D4AF37',
          animation: 'discoPulse 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes discoPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
      `}</style>
    </div>
  ),
});

export default function DiscoBallLazy() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#0A0A0A',
          }}
        />
      }
    >
      <DiscoBallInner />
    </Suspense>
  );
}
