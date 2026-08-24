import { getPopularDramas, getAllTags, getPlatforms } from '@/lib/data';
import Link from 'next/link';

export default function HomePage() {
  const popularDramas = getPopularDramas(24);
  const popularTags = getAllTags().slice(0, 20);
  const platformStats = getPlatforms();
  const totalDramas = platformStats.reduce((sum, p) => sum + p.dramaCount, 0);

  return (
    <>
      {/* Hero Section */}
      <section style={{ marginBottom: 'var(--space-12)' }}>
        <p className="section-label">Discovery Engine</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Find Your Next<br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent-wine)' }}>Short Drama</em> Obsession
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-4)', fontSize: 'var(--text-lg)', maxWidth: '520px' }}>
          Browse {totalDramas}+ short dramas across {platformStats.length} platforms. 
          Filter by mood, genre, and scene — discover where to watch legally.
        </p>
        
        {/* Platform Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          {platformStats.map((p) => (
            <span key={p.id} style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 500,
              background: `var(--platform-${p.slug})`,
              color: 'white',
              opacity: 0.9,
            }}>
              {p.name} · {p.dramaCount}
            </span>
          ))}
        </div>
      </section>

      {/* Browse by Tag */}
      <section style={{ marginBottom: 'var(--space-12)' }}>
        <p className="section-label">Browse by Mood</p>
        <div className="tag-cloud">
          {popularTags.map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag-chip">
              {tag.name}
              <span className="tag-chip__count">{tag.dramaCount}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Dramas */}
      <section style={{ marginBottom: 'var(--space-12)' }}>
        <p className="section-label">Trending Now</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-6)' }}>
          Popular Short Dramas
        </h2>
        <div className="drama-grid">
          {popularDramas.map((drama) => {
            const platformSlug = drama.source?.toLowerCase().replace(/\s+/g, '') || '';
            return (
              <Link key={drama.id} href={`/drama/${drama.slug}`} className="drama-card">
                {/* Platform Badge */}
                {drama.source && (
                  <span className={`drama-card__platform-badge ${platformSlug}`}>
                    {drama.source}
                  </span>
                )}
                
                {/* Poster */}
                {drama.coverUrl && (
                  <img
                    className="drama-card__poster"
                    src={drama.coverUrl}
                    alt={drama.title}
                    loading="lazy"
                  />
                )}
                
                {/* Info */}
                <div className="drama-card__info">
                  <div className="drama-card__title">{drama.title}</div>
                  <div className="drama-card__meta">
                    {drama.chapterCount > 0 && <span>{drama.chapterCount} EP</span>}
                  </div>
                  
                  {/* Tags */}
                  {drama.tags && drama.tags.length > 0 && (
                    <div className="drama-card__tags">
                      {drama.tags.slice(0, 2).map((dt) => (
                        <span key={dt.slug} className="drama-card__tag drama-card__tag--genre">
                          {dt.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {popularDramas.length === 0 && (
        <section style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            No dramas yet. Run the scraper to import data.
          </p>
        </section>
      )}
    </>
  );
}
