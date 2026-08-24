import { getAllTags } from '@/lib/data';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Genres & Moods',
  description: 'Browse short dramas by genre and mood. Find romance, revenge, CEO, werewolf, and more micro dramas across all platforms.',
};

export default function GenresPage() {
  const allTags = getAllTags();

  // Group tags by category
  const grouped: Record<string, typeof allTags> = {};
  for (const tag of allTags) {
    if (!grouped[tag.category]) {
      grouped[tag.category] = [];
    }
    grouped[tag.category].push(tag);
  }

  const categoryOrder = ['emotion', 'genre', 'scene'];
  const categoryLabels: Record<string, string> = {
    emotion: 'By Mood & Emotion',
    genre: 'By Genre',
    scene: 'By Scene',
  };

  return (
    <article>
      <section>
        <h1>Genres & Moods</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Browse {allTags.length} tags across all categories. Find your next short drama obsession.
        </p>
      </section>

      {categoryOrder.map((category) => {
        const tags = grouped[category];
        if (!tags || tags.length === 0) return null;

        return (
          <section key={category} className="drama-section">
            <h2>{categoryLabels[category] || category}</h2>
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

      {/* Show any categories not in the standard order */}
      {Object.keys(grouped)
        .filter((cat) => !categoryOrder.includes(cat))
        .map((category) => {
          const tags = grouped[category];
          return (
            <section key={category} className="drama-section">
              <h2>{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
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
