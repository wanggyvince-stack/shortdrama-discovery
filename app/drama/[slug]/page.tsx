import { getDramaBySlug, getRelatedDramas, getAllDramaSlugs, getPlatforms } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllDramaSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const drama = getDramaBySlug(slug);
  if (!drama) return { title: 'Drama Not Found' };

  return {
    title: drama.title,
    description: drama.synopsis?.substring(0, 155) || `Watch ${drama.title} on ${drama.source}`,
    openGraph: {
      title: drama.title,
      description: drama.synopsis?.substring(0, 155) || `Watch ${drama.title}`,
      images: drama.coverUrl ? [{ url: drama.coverUrl }] : [],
    },
  };
}

const TAG_COLORS: Record<string, string> = {
  emotion: '#e8457a',
  scene: '#2d9f6f',
  genre: '#4a7cf7',
};

// Platform color mapping
const PLATFORM_COLORS: Record<string, string> = {
  shortmax: '#FF6B35',
  goodshort: '#4A90D9',
  faltv: '#9B59B6',
  reelshort: '#E74C3C',
  netshort: '#2ECC71',
};

export default async function DramaPage({ params }: Props) {
  const { slug } = await params;
  const drama = getDramaBySlug(slug);

  if (!drama) notFound();

  const tagNames = drama.tags.map(t => t.name);
  const relatedDramas = getRelatedDramas(drama.id, tagNames, 6);
  const platformSlug = drama.source?.toLowerCase().replace(/\s+/g, '') || '';
  const platformColor = PLATFORM_COLORS[platformSlug] || 'var(--accent-wine)';

  // Get all platforms for "Where to Watch"
  const allPlatforms = getPlatforms();
  const currentPlatform = allPlatforms.find(p => p.name === drama.source);

  return (
    <article>
      {/* Dark Hero Section */}
      <div className="drama-hero">
        <div className="drama-hero__inner">
          {/* Poster */}
          {drama.coverUrl && (
            <Image
              className="drama-hero__poster"
              src={drama.coverUrl}
              alt={drama.title}
              width={300}
              height={400}
              priority
              style={{ objectFit: 'cover' }}
            />
          )}

          {/* Info */}
          <div>
            {/* Platform badge */}
            {drama.source && (
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                background: platformColor,
                color: 'white',
                marginBottom: 'var(--space-4)',
              }}>
                {drama.source}
              </span>
            )}

            <h1 className="drama-hero__title">{drama.title}</h1>

            <div className="drama-hero__meta">
              {drama.score && <span style={{ color: 'var(--accent-gold)' }}>★ {drama.score}/10</span>}
              {drama.chapterCount > 0 && <span>{drama.chapterCount} Episodes</span>}
              {drama.source && <span>•</span>}
              {drama.source && <span>{drama.source}</span>}
            </div>

            {drama.synopsis && (
              <p className="drama-hero__synopsis">{drama.synopsis}</p>
            )}

            {/* Tags */}
            {drama.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                {drama.tags.slice(0, 4).map((dt) => {
                  const color = TAG_COLORS[dt.category] || TAG_COLORS.genre;
                  return (
                    <span key={dt.slug} style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-ui)',
                      border: `1px solid ${color}`,
                      color: color,
                      background: 'rgba(255,255,255,0.05)',
                    }}>
                      {dt.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Where to Watch Section */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <p className="section-label">Where to Watch</p>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                {/* Platform icon/badge */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  background: platformColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                }}>
                  {drama.source?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
                    {drama.source}
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {drama.chapterCount > 0 ? `${drama.chapterCount} episodes available` : 'Full series available'}
                  </div>
                </div>
              </div>

              {/* Watch Now CTA */}
              <a
                href={drama.sourceUrl || '#'}
                className="btn-watch"
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-drama-id={drama.id}
                data-drama-slug={drama.slug}
                data-platform={drama.source}
                onClick={undefined}
              >
                ▶ Watch Now
              </a>
            </div>

            {/* Additional info */}
            {currentPlatform && (
              <div style={{
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: 'var(--space-6)',
                flexWrap: 'wrap',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}>
                <span>📺 {currentPlatform.dramaCount} dramas on platform</span>
                {drama.duration && <span>⏱️ {drama.duration} per episode</span>}
                <span>🌐 {drama.source} Official</span>
              </div>
            )}
          </div>
        </section>

        {/* Tags Section */}
        {drama.tags.length > 0 && (
          <section style={{ marginBottom: 'var(--space-10)' }}>
            <p className="section-label">Genres & Moods</p>
            <div className="tag-cloud">
              {drama.tags.map((dt) => {
                const color = TAG_COLORS[dt.category] || TAG_COLORS.genre;
                return (
                  <Link key={dt.slug} href={`/tag/${dt.slug}`} className="tag-chip" style={{ borderColor: color }}>
                    {dt.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Related Dramas */}
        {relatedDramas.length > 0 && (
          <section>
            <p className="section-label">Similar Titles</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>
              You May Also Like
            </h2>
            <div className="drama-grid">
              {relatedDramas.map((rel) => {
                const relPlatform = rel.source?.toLowerCase().replace(/\s+/g, '') || '';
                const relColor = PLATFORM_COLORS[relPlatform] || 'var(--accent-wine)';
                return (
                  <Link key={rel.id} href={`/drama/${rel.slug}`} className="drama-card">
                    {rel.source && (
                      <span className="drama-card__platform-badge" style={{ background: relColor }}>
                        {rel.source}
                      </span>
                    )}
                    {rel.coverUrl && (
                      <Image
                        className="drama-card__poster"
                        src={rel.coverUrl}
                        alt={rel.title}
                        width={300}
                        height={400}
                        loading="lazy"
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    <div className="drama-card__info">
                      <div className="drama-card__title">{rel.title}</div>
                      <div className="drama-card__meta">
                        {rel.score && <span style={{ color: 'var(--accent-gold)' }}>★ {rel.score}</span>}
                        {rel.chapterCount > 0 && <span>{rel.chapterCount} EP</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* CPS Click Tracking Script */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('.btn-watch[data-drama-id]').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            var dramaId = this.getAttribute('data-drama-id');
            var dramaSlug = this.getAttribute('data-drama-slug');
            var platform = this.getAttribute('data-platform');
            
            // Fire and forget - don't block navigation
            fetch('/api/click', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dramaId: dramaId, dramaSlug: dramaSlug, platform: platform }),
              keepalive: true
            }).catch(function() {});
          });
        });
      `}} />

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWorkSeries',
            name: drama.title,
            description: drama.synopsis || '',
            image: drama.coverUrl || '',
            numberOfEpisodes: drama.chapterCount,
            aggregateRating: drama.score ? {
              '@type': 'AggregateRating',
              ratingValue: drama.score,
              bestRating: 10,
              worstRating: 1,
              ratingCount: 1,
            } : undefined,
            provider: drama.source ? { '@type': 'Organization', name: drama.source, url: currentPlatform?.websiteUrl } : undefined,
            genre: drama.tags.map((dt) => dt.name),
            url: `https://shortdrama-discovery.vercel.app/drama/${drama.slug}`,
          }),
        }}
      />
    </article>
  );
}
