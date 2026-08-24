import { getTagBySlug, getAllTags, getAllTagSlugs } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
  const totalReads = dramas.reduce((sum, d) => sum + (d.readCount || 0), 0);
  const avgEpisodes = dramas.length > 0
    ? dramas.reduce((sum, d) => sum + (d.chapterCount || 0), 0) / dramas.length
    : 0;

  return (
    <article>
      {/* Header */}
      <section>
        <h1>Best {tag.name} Short Dramas</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Discover top-rated {tag.name.toLowerCase()} short dramas. 
          Browse {dramas.length} curated titles with an average rating of {avgScore.toFixed(1)}/10.
        </p>
      </section>

      {/* Stats */}
      <section className="drama-section">
        <div className="price-compare">
          <div className="price-row">
            <span>Total Dramas</span>
            <strong>{dramas.length}</strong>
          </div>
          <div className="price-row">
            <span>Average Rating</span>
            <strong>⭐ {avgScore.toFixed(1)}/10</strong>
          </div>
          <div className="price-row">
            <span>Total Views</span>
            <strong>{formatNumber(totalReads)}</strong>
          </div>
          <div className="price-row">
            <span>Average Episodes</span>
            <strong>{avgEpisodes.toFixed(0)} eps</strong>
          </div>
        </div>
      </section>

      {/* Drama List */}
      <section className="drama-section">
        <h2>{tag.name} Short Dramas</h2>
        <div className="drama-grid">
          {dramas.map((drama) => (
            <Link key={drama.id} href={`/drama/${drama.slug}`} className="drama-card">
              {drama.coverUrl && (
                <img src={drama.coverUrl} alt={drama.title} loading="lazy" />
              )}
              <div className="drama-card-content">
                <div className="drama-card-title">{drama.title}</div>
                <div className="drama-card-meta">
                  {drama.score && <span>⭐ {drama.score}</span>}
                  {drama.chapterCount && <span>📺 {drama.chapterCount} ep</span>}
                  {drama.readCount && <span>👁️ {formatNumber(drama.readCount)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Related Tags */}
      {relatedTags.length > 0 && (
        <section className="drama-section">
          <h2>Related Tags</h2>
          <div className="tag-list">
            {relatedTags.map((relatedTag) => (
              <Link key={relatedTag.id} href={`/tag/${relatedTag.slug}`} className="tag">
                {relatedTag.name} ({relatedTag.dramaCount})
              </Link>
            ))}
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

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
