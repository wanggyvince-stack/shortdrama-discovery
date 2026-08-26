import { getPopularDramas, getAllTags, getPlatforms } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import HeroSection from '@/components/hero/HeroSection';

const TAG_COLORS: Record<string, string> = {
  emotion: 'var(--tag-emotion, #e8457a)',
  scene: 'var(--tag-scene, #2d9f6f)',
  genre: 'var(--tag-genre, #4a7cf7)',
};

export default function HomePage() {
  const popularDramas = getPopularDramas(24);
  const popularTags = getAllTags().slice(0, 20);
  const platformStats = getPlatforms();
  const totalDramas = platformStats.reduce((sum, p) => sum + p.dramaCount, 0);

  return (
    <>
      {/* ─── Disco Ball Hero ─── */}
      <HeroSection />

      {/* ─── Browse by Tag ─── */}
      <section style={{ marginBottom: 'var(--space-12)' }}>
        <p className="section-label">Browse by Mood</p>
        <div className="tag-cloud">
          {popularTags.map((tag) => {
            const tagColor = TAG_COLORS[tag.category] || TAG_COLORS.genre;
            return (
              <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag-chip" style={{ borderColor: tagColor }}>
                {tag.name}
                <span className="tag-chip__count">{tag.dramaCount}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Popular Dramas ─── */}
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
                  <Image
                    className="drama-card__poster"
                    src={drama.coverUrl}
                    alt={drama.title}
                    width={300}
                    height={400}
                    loading="lazy"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                
                {/* Info */}
                <div className="drama-card__info">
                  <div className="drama-card__title">{drama.title}</div>
                  <div className="drama-card__meta">
                    {drama.score && <span style={{ color: 'var(--accent-gold)' }}>★ {drama.score}</span>}
                    {drama.chapterCount > 0 && <span>{drama.chapterCount} EP</span>}
                  </div>
                  
                  {/* Tags with color by category */}
                  {drama.tags && drama.tags.length > 0 && (
                    <div className="drama-card__tags">
                      {drama.tags.slice(0, 2).map((dt) => {
                        const color = TAG_COLORS[dt.category] || TAG_COLORS.genre;
                        return (
                          <span key={dt.slug} className="drama-card__tag" style={{ borderColor: color, color: color }}>
                            {dt.name}
                          </span>
                        );
                      })}
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

      {/* JSON-LD: WebSite with SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'DramaDisco',
            url: 'https://dramadisco.com',
            description: 'Discover 714+ short dramas across all major platforms. Filter by mood, genre & rating.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://dramadisco.com/search?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      {/* JSON-LD: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'DramaDisco',
            url: 'https://dramadisco.com',
            logo: 'https://dramadisco.com/logo.png',
          }),
        }}
      />
    </>
  );
}
