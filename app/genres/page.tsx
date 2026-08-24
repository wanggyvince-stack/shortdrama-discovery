import { getAllTags } from '@/lib/data';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Genres & Moods',
  description: 'Browse short dramas by genre and mood. Find romance, revenge, CEO, werewolf, and more micro dramas across all platforms.',
};

const CATEGORY_COLORS: Record<string, string> = {
  emotion: '#e8457a',
  scene: '#2d9f6f',
  genre: '#4a7cf7',
};

const CATEGORY_ICONS: Record<string, string> = {
  emotion: '🎭',
  scene: '🎬',
  genre: '📚',
};

export default function GenresPage({ searchParams }: { searchParams?: { filter?: string } }) {
  const allTags = getAllTags();
  const filterCategory = searchParams?.filter; // e.g., ?filter=emotion

  // Group tags by category
  const grouped: Record<string, typeof allTags> = {};
  for (const tag of allTags) {
    if (!grouped[tag.category]) {
      grouped[tag.category] = [];
    }
    grouped[tag.category].push(tag);
  }

  const categoryOrder = filterCategory
    ? ['emotion', 'genre', 'scene'].filter(c => c === filterCategory)
    : ['emotion', 'genre', 'scene'];
  const categoryLabels: Record<string, string> = {
    emotion: 'By Mood & Emotion',
    genre: 'By Genre',
    scene: 'By Scene',
  };

  return (
    <article>
      <section style={{ marginBottom: 'var(--space-10)' }}>
        <p className="section-label">Taxonomy</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-3)' }}>
          Genres & Moods
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', maxWidth: '600px' }}>
          Browse {allTags.length} tags across all categories. Find your next short drama obsession.
        </p>
      </section>

      {categoryOrder.map((category) => {
        const tags = grouped[category];
        if (!tags || tags.length === 0) return null;
        const color = CATEGORY_COLORS[category] || '#4a7cf7';
        const icon = CATEGORY_ICONS[category] || '📚';

        return (
          <section key={category} style={{ marginBottom: 'var(--space-10)' }}>
            <p className="section-label" style={{ color }}>
              {icon} {categoryLabels[category] || category}
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
              {tags.length} {categoryLabels[category] || category} Tags
            </h2>
            <div className="tag-cloud">
              {tags.map((tag) => (
                <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag-chip" style={{ borderColor: color }}>
                  {tag.name}
                  <span className="tag-chip__count">{tag.dramaCount}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Show any categories not in the standard order */}
      {Object.keys(grouped)
        .filter((cat) => !categoryOrder.includes(cat))
        .map((category) => {
          const tags = grouped[category];
          return (
            <section key={category} style={{ marginBottom: 'var(--space-10)' }}>
              <p className="section-label">{category}</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
                {tags.length} Tags
              </h2>
              <div className="tag-cloud">
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`} className="tag-chip">
                    {tag.name}
                    <span className="tag-chip__count">{tag.dramaCount}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
    </article>
  );
}
