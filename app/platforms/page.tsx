import { getPlatforms } from '@/lib/data';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platforms',
  description: 'Discover short drama platforms including ReelShort, ShortMax, GoodShort, FlexTV, and more. Browse 700+ titles across all apps.',
};

export default function PlatformsPage() {
  const platforms = getPlatforms();

  return (
    <article>
      <section>
        <h1>Short Drama Platforms</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Browse {platforms.length} platforms and their drama libraries.
        </p>
      </section>

      <section className="drama-section">
        <div className="drama-grid">
          {platforms.map((platform) => {
            const platformSlug = platform.slug || '';
            return (
              <div key={platform.id} className="drama-card" style={{ cursor: 'default' }}>
                {/* Platform colored header */}
                <div style={{
                  background: `var(--platform-${platformSlug}, var(--accent-wine))`,
                  padding: 'var(--space-6) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-2xl)',
                    color: 'white',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}>
                    {platform.displayName || platform.name}
                  </span>
                </div>

                <div className="drama-card__info" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      Drama Library
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-xl)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}>
                      {platform.dramaCount}
                    </span>
                  </div>

                  {platform.websiteUrl && (
                    <a
                      href={platform.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      style={{
                        display: 'inline-block',
                        marginTop: 'var(--space-3)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-ui)',
                        color: 'var(--accent-wine)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
}
