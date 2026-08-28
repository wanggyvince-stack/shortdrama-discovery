import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import MiniDiscoBall from '@/components/MiniDiscoBall';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DramaDisco — Discover Your Next Short Drama Obsession',
    template: '%s | DramaDisco',
  },
  description: 'Discover 714+ short dramas across ReelShort, GoodShort, ShortMax, DramaBox & more. Filter by mood, genre & rating. Find where to watch legally.',
  keywords: ['short drama', 'micro drama', 'reelshort', 'shortmax', 'goodshort', 'dramabox', 'mini drama', 'vertical drama', 'drama discovery', 'dramadisco', 'where to watch short drama'],
  authors: [{ name: 'DramaDisco' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'DramaDisco',
    title: 'DramaDisco — Discover Your Next Short Drama Obsession',
    description: 'Discover 714+ short dramas across all major platforms. Filter by mood, genre & rating. Find where to watch legally.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DramaDisco — Short Drama Discovery Engine',
    description: '714+ short dramas across 5 platforms. Filter by mood, genre & rating.',
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
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header>
          <nav>
            <Link href="/" className="logo">
              <MiniDiscoBall size={32} />
              DramaDisco
            </Link>
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
              <p className="site-footer__brand-name">DramaDisco</p>
              <p className="site-footer__brand-desc">
                Your cross-platform discovery engine for short dramas. 
                Find, compare, and watch the best micro dramas from ReelShort, GoodShort, ShortMax, DramaBox & more.
              </p>
            </div>
            <div className="site-footer__col">
              <p className="site-footer__col-title">Discover</p>
              <Link href="/" className="site-footer__link">All Dramas</Link>
              <Link href="/genres?filter=emotion" className="site-footer__link">Browse by Mood</Link>
              <Link href="/genres" className="site-footer__link">All Genres</Link>
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
              <span className="site-footer__link" style={{ cursor: 'default' }}>© 2026 DramaDisco</span>
            </div>
          </div>
        </footer>

        {/* Google Analytics 4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-RMHH5XM5QN" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RMHH5XM5QN');
          `}
        </Script>
        {/* GA4 Outbound Click Tracking */}
        <Script id="ga4-outbound-click" strategy="afterInteractive">
          {`
            (function() {
              var ownHosts = ['dramadisco.com', 'www.dramadisco.com'];
              document.addEventListener('click', function(e) {
                var link = e.target.closest('a');
                if (!link || !link.href) return;
                try {
                  var u = new URL(link.href);
                  if (ownHosts.indexOf(u.hostname) !== -1) return;
                  var dramaTitle = '';
                  var h1 = document.querySelector('h1');
                  if (h1) dramaTitle = h1.textContent.trim();
                  gtag('event', 'outbound_click', {
                    event_category: 'CPS',
                    event_label: link.href,
                    drama_title: dramaTitle,
                    button_text: link.textContent.trim().substring(0, 50),
                    transport_type: 'beacon'
                  });
                } catch(ex) {}
              }, true);
            })();
          `}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "y89dn9xqyc");
          `}
        </Script>
      </body>
    </html>
  );
}
