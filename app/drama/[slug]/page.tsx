import { getDramaBySlug, getRelatedDramas, getAllDramaSlugs } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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

export default async function DramaPage({ params }: Props) {
  const { slug } = await params;
  const drama = getDramaBySlug(slug);

  if (!drama) notFound();

  const tagNames = drama.tags.map(t => t.name);
  const relatedDramas = getRelatedDramas(drama.id, tagNames, 6);
  const platformSlug = drama.source?.toLowerCase().replace(/\s+/g, '') || '';

  return (
    <article>
      {/* Dark Hero Section */}
      <div className="drama-hero">
        <div className="drama-hero__inner">
          {/* Poster */}
          {drama.coverUrl && (
            <img
              className="drama-hero__poster"
              src={drama.coverUrl}
              alt={drama.title}
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
                background: `var(--platform-${platformSlug}, var(--accent-wine))`,
                color: 'white',
                marginBottom: 'var(--space-4)',
              }}>
                {drama.source}
              </span>
            )}

            <h1 className="drama-hero__title">{drama.title}</h1>

            <div className="drama-hero__meta">
              {drama.chapterCount > 0 && <span>{drama.chapterCount} Episodes</span>}
              {drama.source && <span>•</span>}
              {drama.source && <span>{drama.source}</span>}
            </div>

            {drama.synopsis && (
              <p className="drama-hero__synopsis">{drama.synopsis}</p>
            )}

            {/* Gold Watch Now CTA */}
            {drama.sourceUrl && (
              <a
                href={drama.sourceUrl}
                className="btn-watch"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                ▶ Watch on {drama.source}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Light Body Section */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-10) var(--space-6)' }}>
        {/* Tags */}
        {drama.tags.length > 0 && (
          <section style={{ marginBottom: 'var(--space-10)' }}>
            <p className="section-label">Genres & Moods</p>
            <div className="tag-cloud">
              {drama.tags.map((dt) => (
                <Link key={dt.slug} href={`/tag/${dt.slug}`} className="tag-chip">
                  {dt.name}
                </Link>
              ))}
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
                return (
                  <Link key={rel.id} href={`/drama/${rel.slug}`} className="drama-card">
                    {rel.source && (
                      <span className={`drama-card__platform-badge ${relPlatform}`}>
                        {rel.source}
                      </span>
                    )}
                    {rel.coverUrl && (
                      <img
                        className="drama-card__poster"
                        src={rel.coverUrl}
                        alt={rel.title}
                        loading="lazy"
                      />
                    )}
                    <div className="drama-card__info">
                      <div className="drama-card__title">{rel.title}</div>
                      <div className="drama-card__meta">
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
            provider: drama.source ? { '@type': 'Organization', name: drama.source } : undefined,
            genre: drama.tags.map((dt) => dt.name),
          }),
        }}
      />
    </article>
  );
}
