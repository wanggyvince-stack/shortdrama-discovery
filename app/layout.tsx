import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ShortDrama Discovery — Find Your Next Binge-Worthy Short Drama',
    template: '%s | ShortDrama Discovery',
  },
  description: 'Discover the best short dramas across ReelShort, ShortMax, GoodShort, FlexTV, and more. Browse 700+ titles by mood, genre, and scene.',
  keywords: ['short drama', 'micro drama', 'reelshort', 'shortmax', 'goodshort', 'mini drama', 'vertical drama', 'drama discovery'],
  authors: [{ name: 'ShortDrama Discovery' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ShortDrama Discovery',
    title: 'ShortDrama Discovery — Find Your Next Binge-Worthy Short Drama',
    description: 'Discover 700+ short dramas across all major platforms. Browse by mood, genre, and scene.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShortDrama Discovery',
    description: 'Discover 700+ short dramas across all major platforms.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header>
          <nav>
            <a href="/" className="logo">ShortDrama Discovery</a>
            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
              <a href="/">Discover</a>
              <a href="/genres">Genres</a>
              <a href="/platforms">Platforms</a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            ShortDrama Discovery
          </p>
          <p>© 2026 ShortDrama Discovery. Data sourced from official platforms.</p>
        </footer>
      </body>
    </html>
  );
}
