import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'About DramaDisco — Short Drama Discovery Engine' },
  description:
    'DramaDisco is a cross-platform short drama discovery engine. Learn how we curate micro dramas from ReelShort, GoodShort, ShortMax, DramaBox and more, and how our recommendations work.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <article style={{ maxWidth: '720px' }}>
      <section style={{ marginBottom: 'var(--space-10)' }}>
        <p className="section-label">About</p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-4xl)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Find Your Next Short Drama Obsession
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-lg)',
            lineHeight: 1.7,
          }}
        >
          DramaDisco is a cross-platform discovery engine for short dramas — the
          fast-paced, vertical-screen micro dramas that run 60 to 100+ episodes
          on apps like ReelShort, GoodShort, ShortMax, and DramaBox.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            marginBottom: 'var(--space-3)',
          }}
        >
          What We Do
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7,
            marginBottom: 'var(--space-4)',
          }}
        >
          Every short drama platform has its own catalog, its own ranking, and
          its own paywall. If you want to know whether a drama is worth your
          time — and where you can actually watch it — you end up jumping
          between five different apps.
        </p>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7,
          }}
        >
          DramaDisco brings those catalogs together in one place:{' '}
          <strong>700+ dramas</strong> with ratings, episode counts, tags, and
          direct links to where each one is available. You can browse by genre,
          mood, platform, or rating, and compare titles before you tap play.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            marginBottom: 'var(--space-3)',
          }}
        >
          How We Curate
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7,
            marginBottom: 'var(--space-3)',
          }}
        >
          Our catalog is built from official platform data. Each drama is
          tagged by genre and mood, and we surface audience ratings and
          popularity signals to rank titles. Our editorial priority is simple:
        </p>
        <ul
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.8,
            paddingLeft: 'var(--space-6)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <li>High-rated, widely-watched dramas appear first</li>
          <li>
            Every listing links to a legitimate platform — we never host or
            link to pirated content
          </li>
          <li>
            Tags and descriptions help you judge fit before you commit to an
            episode
          </li>
        </ul>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7,
          }}
        >
          Synopses are drawn from official platform listings; where official
          descriptions are missing, our team writes original summaries based on
          the drama&rsquo;s premise, tags, and episode count.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Affiliate Disclosure
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7,
            marginBottom: 'var(--space-3)',
          }}
        >
          DramaDisco is free to use. Some of the links to streaming platforms
          are affiliate links: when you sign up or make a purchase through
          them, we may earn a small commission, at <strong>no additional cost
          to you</strong>. This commission supports the site and never affects
          which dramas we recommend — our rankings are driven by ratings and
          audience data, not by partner relationships.
        </p>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7,
          }}
        >
          We only link to official, licensed platforms.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Contact
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7,
          }}
        >
          Questions, corrections, or a drama you think we should cover? Email
          us at{' '}
          <a
            href="mailto:contact@dramadisco.com"
            style={{ color: 'var(--accent-wine)' }}
          >
            contact@dramadisco.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
