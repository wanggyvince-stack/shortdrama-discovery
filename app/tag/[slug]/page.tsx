import { getTagBySlug, getAllTags, getAllTagSlugs } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllTagSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = getTagBySlug(slug);

  if (!result) {
    return { title: 'Tag Not Found' };
  }

  const { tag } = result;

  return {
    title: `Best ${tag.name} Short Dramas`,
    description: `Discover the best ${tag.name.toLowerCase()} short dramas. Browse our curated collection of top-rated ${tag.name.toLowerCase()} micro dramas.`,
  };
}

const TAG_COLORS: Record<string, string> = {
  emotion: '#e8457a',
  scene: '#2d9f6f',
  genre: '#4a7cf7',
};

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const result = getTagBySlug(slug);

  if (!result) {
    notFound();
  }

  const { tag, dramas } = result;

  // Get related tags (same category)
  const allTags = getAllTags();
  const relatedTags = allTags
    .filter(t => t.category === tag.category && t.slug !== tag.slug)
    .slice(0, 10);

  // Calculate stats
  const avgScore = dramas.length > 0
    ? dramas.reduce((sum, d) => sum + (d.score || 0), 0) / dramas.length
    : 0;
  const avgEpisodes = dramas.length > 0
    ? dramas.reduce((sum, d) => sum + (d.chapterCount || 0), 0) / dramas.length
    : 0;

  const tagColor = TAG_COLORS[tag.category] || TAG_COLORS.genre;

  return (
    <article>
      {/* Header */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <p className="section-label" style={{ color: tagColor }}>{tag.category === 'emotion' ? '🎭 Emotion' : tag.category === 'scene' ? '🎬 Scene' : '🎭 Genre'}</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-3)' }}>
          Best {tag.name} Short Dramas
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', maxWidth: '600px' }}>
          Discover top-rated {tag.name.toLowerCase()} short dramas. 
          Browse {dramas.length} curated titles.
        </p>
      </section>

      {/* Stats Cards */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--accent-wine)' }}>{dramas.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-1)' }}>Total Dramas</div>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--accent-gold)' }}>★ {avgScore.toFixed(1)}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-1)' }}>Avg Rating</div>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--accent-wine)' }}>{avgEpisodes.toFixed(0)}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-1)' }}>Avg Episodes</div>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--accent-wine)' }}>{relatedTags.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'var(--space-1)' }}>Related Tags</div>
          </div>
        </div>
      </section>

      {/* Drama List */}
      <section style={{ marginBottom: 'var(--space-10)' }}>
        <p className="section-label">Collection</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>
          {tag.name} Short Dramas
        </h2>
        <div className="drama-grid">
          {dramas.map((drama) => {
            const platformSlug = drama.source?.toLowerCase().replace(/\s+/g, '') || '';
            return (
              <Link key={drama.id} href={`/drama/${drama.slug}`} className="drama-card">
                {drama.source && (
                  <span className={`drama-card__platform-badge ${platformSlug}`}>
                    {drama.source}
                  </span>
                )}
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
                <div className="drama-card__info">
                  <div className="drama-card__title">{drama.title}</div>
                  <div className="drama-card__meta">
                    {drama.score && <span style={{ color: 'var(--accent-gold)' }}>★ {drama.score}</span>}
                    {drama.chapterCount > 0 && <span>{drama.chapterCount} EP</span>}
                  </div>
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

      {/* Related Tags */}
      {relatedTags.length > 0 && (
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <p className="section-label">Explore More</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>
            Related Tags
          </h2>
          <div className="tag-cloud">
            {relatedTags.map((relatedTag) => {
              const color = TAG_COLORS[relatedTag.category] || TAG_COLORS.genre;
              return (
                <Link key={relatedTag.id} href={`/tag/${relatedTag.slug}`} className="tag-chip" style={{ borderColor: color }}>
                  {relatedTag.name}
                  <span className="tag-chip__count">{relatedTag.dramaCount}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Best ${tag.name} Short Dramas`,
            description: `Discover top-rated ${tag.name.toLowerCase()} short dramas.`,
            numberOfItems: dramas.length,
            itemListElement: dramas.slice(0, 10).map((drama, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'TVSeries',
                name: drama.title,
                url: `https://shortdrama-discovery.vercel.app/drama/${drama.slug}`,
                image: drama.coverUrl,
              },
            })),
          }),
        }}
      />
    </article>
  );
}
