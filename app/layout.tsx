import type { Metadata } from 'next';
import Link from 'next/link';
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
            <Link href="/" className="logo">ShortDrama Discovery</Link>
            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
              <Link href="/">Discover</Link>
              <Link href="/genres">Genres</Link>
              <Link href="/platforms">Platforms</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <div className="site-footer__brand">
              <p className="site-footer__brand-name">ShortDrama Discovery</p>
              <p className="site-footer__brand-desc">
                Your cross-platform discovery engine for short dramas. 
                Find, compare, and watch the best micro dramas from ReelShort, ShortMax, GoodShort, FlexTV and more.
              </p>
            </div>
            <div className="site-footer__col">
              <p className="site-footer__col-title">Discover</p>
              <Link href="/" className="site-footer__link">All Dramas</Link>
              <Link href="/genres" className="site-footer__link">Browse by Mood</Link>
              <Link href="/genres" className="site-footer__link">Browse by Genre</Link>
              <Link href="/tag/revenge-comeback" className="site-footer__link">Top Revenge</Link>
            </div>
            <div className="site-footer__col">
              <p className="site-footer__col-title">Platforms</p>
              <Link href="/platforms" className="site-footer__link">All Platforms</Link>
              <Link href="/platforms" className="site-footer__link">ReelShort</Link>
              <Link href="/platforms" className="site-footer__link">ShortMax</Link>
              <Link href="/platforms" className="site-footer__link">GoodShort</Link>
            </div>
            <div className="site-footer__col">
              <p className="site-footer__col-title">About</p>
              <span className="site-footer__link" style={{ cursor: 'default' }}>Data from official platforms</span>
              <span className="site-footer__link" style={{ cursor: 'default' }}>© 2026 ShortDrama Discovery</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
