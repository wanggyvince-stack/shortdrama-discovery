'use client';

import Link from 'next/link';
import DiscoBall from './DiscoBall';

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#0A0A0A',
      }}
    >
      {/* ─── Disco Ball (absolute canvas) ─── */}
      <DiscoBall />

      {/* ─── CSS Spotlight Orbs ─── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div className="hero-spotlight hero-spotlight-1" />
        <div className="hero-spotlight hero-spotlight-2" />
        <div className="hero-spotlight hero-spotlight-3" />
        <div className="hero-spotlight hero-spotlight-4" />
      </div>

      {/* ─── Film Grain Overlay ─── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9998,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ─── Hero Text Content ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: '100vh',
          padding: '0 6vw 7vh',
          pointerEvents: 'none',
        }}
      >
        <p className="hero-tagline">Where every story finds its spotlight</p>

        <h1 className="hero-title">DramaDisco</h1>

        <p className="hero-subtitle">
          Discover your next short drama obsession. 714+ short dramas across 5 platforms.
        </p>

        <div className="hero-cta">
          <Link href="/genres" className="hero-btn-primary">
            Explore Now
          </Link>
          <Link href="/platforms" className="hero-btn-secondary">
            Browse Platforms
          </Link>
        </div>
      </div>

      {/* ─── Hero-specific styles ─── */}
      <style jsx>{`
        .hero-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1rem, 1.4vw, 1.4rem);
          font-style: italic;
          color: #D4AF37;
          letter-spacing: 0.06em;
          margin-bottom: clamp(0.4rem, 0.8vh, 0.8rem);
          animation: heroFadeUp 1s ease-out 0.3s both;
        }

        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.8rem, 6.5vw, 7rem);
          line-height: 1.05;
          margin-bottom: clamp(0.5rem, 1.2vh, 1.2rem);
          background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 45%, #B8860B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 18px rgba(212, 175, 55, 0.3));
          animation: heroFadeUp 1s ease-out 0.5s both;
        }

        .hero-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(0.95rem, 1.3vw, 1.25rem);
          color: #B0B0B0;
          max-width: 440px;
          line-height: 1.55;
          margin-bottom: clamp(1rem, 2.5vh, 2rem);
          animation: heroFadeUp 1s ease-out 0.7s both;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
          pointer-events: auto;
          animation: heroFadeUp 1s ease-out 0.9s both;
        }

        .hero-btn-primary {
          padding: 0.85rem 2.2rem;
          background: linear-gradient(135deg, #D4AF37, #F4D03F, #B8860B);
          color: #0A0A0A;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 0 28px rgba(212, 175, 55, 0.3);
          transition: transform 0.25s, box-shadow 0.25s;
          text-decoration: none;
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(212, 175, 55, 0.5);
        }

        .hero-btn-secondary {
          padding: 0.85rem 2.2rem;
          background: transparent;
          color: #D4AF37;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          border: 2px solid #D4AF37;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.25s;
          text-decoration: none;
        }
        .hero-btn-secondary:hover {
          background: #D4AF37;
          color: #0A0A0A;
        }

        /* ─── Spotlight Orbs ─── */
        .hero-spotlight {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          will-change: transform, opacity;
        }

        .hero-spotlight-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, transparent 70%);
          top: -150px;
          left: -100px;
          animation: heroSpot1 22s infinite ease-in-out;
        }

        .hero-spotlight-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 191, 0, 0.28) 0%, transparent 70%);
          bottom: -120px;
          right: -120px;
          animation: heroSpot2 28s infinite ease-in-out;
        }

        .hero-spotlight-3 {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(220, 20, 60, 0.2) 0%, transparent 70%);
          top: 45%;
          left: 55%;
          animation: heroSpot3 32s infinite ease-in-out;
        }

        .hero-spotlight-4 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, transparent 70%);
          top: 15%;
          right: 10%;
          animation: heroSpot4 18s infinite ease-in-out;
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroSpot1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          33% { transform: translate(90px, -60px) scale(1.12); opacity: 0.75; }
          66% { transform: translate(-40px, 80px) scale(0.88); opacity: 0.45; }
        }

        @keyframes heroSpot2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
          40% { transform: translate(-80px, -70px) scale(1.1); opacity: 0.65; }
          70% { transform: translate(50px, -30px) scale(0.92); opacity: 0.4; }
        }

        @keyframes heroSpot3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.35; }
          50% { transform: translate(-35%, -60%) scale(1.18); opacity: 0.55; }
        }

        @keyframes heroSpot4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-60px, 50px) scale(1.1); opacity: 0.5; }
        }

        /* Mobile adjustments */
        @media (max-width: 767px) {
          .hero-cta {
            flex-direction: column;
          }
          .hero-btn-primary,
          .hero-btn-secondary {
            text-align: center;
            padding: 0.75rem 1.8rem;
          }
        }
      `}</style>
    </section>
  );
}
