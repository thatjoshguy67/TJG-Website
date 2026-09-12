import { ThemeProvider } from './components/ThemeProvider';
import { BlogFlagProvider } from './components/BlogFlagProvider';
import { getBlogEnabled } from '../lib/getBlogFlag';
import { getCornerSmoothingEnabled } from '../lib/getCornerSmoothingFlag';
import { getFmpSeparatedViewEnabled } from '../lib/getFmpSeparatedViewFlag';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import ProgressiveBlur from './components/ProgressiveBlur';
import DiscordPopup from './components/DiscordPopup';
import Navigation from './components/Navigation';
import type { Metadata } from 'next';
import { getSiteContext } from '../lib/siteEdition';
import { Google_Sans_Code } from 'next/font/google';

const googleSansCode = Google_Sans_Code({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContext();
  const siteUrl = site.canonicalOrigin;
  const isCollege = site.edition === 'college';
  const favicon = site.environment === 'production' ? '/favicon.ico' : `/favicon-${site.environment}.ico`;
  const title = isCollege ? 'College Portfolio | That Josh Guy' : 'That Josh Guy';
  const description = isCollege
    ? 'Josh Skinner’s college portfolio, featuring game development projects, process work, and development blogs.'
    : 'Designer, tech journalist, and Samsung/Android creator — explore my work, articles, and design projects.';

  return {
    metadataBase: new URL(site.origin),
    robots: !site.indexable ? { index: false, follow: true } : undefined,
    title,
    description,
    keywords: 'Josh Skinner, That Josh Guy, UI/UX Designer, Graphic Designer, Web Developer, Writer, Portfolio, Freelance, Creative',
    authors: [{ name: 'Josh Skinner' }],
    openGraph: {
      type: 'website',
      url: siteUrl,
      title,
      description,
      images: [
        {
          url: '/images/preview.png',
          width: 1200,
          height: 630,
          alt: 'That Josh Guy Portfolio Preview'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      site: '@thatjoshguy69',
      creator: '@thatjoshguy69',
      title,
      description,
      images: ['/images/preview.png']
    },
    icons: {
      icon: favicon
    }
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [blogEnabledValue, cornerSmoothingEnabledValue, fmpSeparatedViewEnabledValue, site] = await Promise.all([
    getBlogEnabled(), getCornerSmoothingEnabled(), getFmpSeparatedViewEnabled(), getSiteContext(),
  ]);
  
  return (
    <html lang="en" className={googleSansCode.variable} data-site-edition={site.edition} data-site-environment={site.environment} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#000" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var viewportWidth = window.innerWidth;
                var viewportHeight = window.innerHeight;
                var frame = 0;
                var hasCoarsePointer = window.matchMedia('(pointer: coarse)');

                function lockHeroViewportHeight() {
                  viewportWidth = window.innerWidth;
                  viewportHeight = window.innerHeight;
                  document.documentElement.style.setProperty(
                    '--hero-viewport-height',
                    viewportHeight + 'px'
                  );
                }

                function scheduleHeroViewportLock() {
                  cancelAnimationFrame(frame);
                  frame = requestAnimationFrame(lockHeroViewportHeight);
                }

                lockHeroViewportHeight();

                window.addEventListener('resize', function() {
                  var widthChanged = window.innerWidth !== viewportWidth;
                  var heightChanged = window.innerHeight !== viewportHeight;

                  if (!widthChanged && (!heightChanged || hasCoarsePointer.matches)) return;
                  scheduleHeroViewportLock();
                }, { passive: true });

                window.addEventListener('orientationchange', scheduleHeroViewportLock, { passive: true });
              })();
            `,
          }}
        />
        <link
          rel="preload"
          href="/fonts/oneuisans-subset.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var currentTheme;
                  if (theme && theme !== 'auto') {
                    currentTheme = theme;
                    document.documentElement.dataset.theme = theme;
                  } else {
                    currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.dataset.theme = currentTheme;
                  }
                  // Set theme-color meta tag for Safari URL bar
                  var themeColorMeta = document.querySelector('meta[name="theme-color"]');
                  if (themeColorMeta) {
                    themeColorMeta.setAttribute('content', currentTheme === 'dark' ? '#000' : '#f1f1f3');
                  }
                  var progressiveBlur = localStorage.getItem('progressiveBlur');
                  if (progressiveBlur) {
                    document.documentElement.dataset.progressiveBlur = progressiveBlur;
                  } else {
                    document.documentElement.dataset.progressiveBlur = 'true';
                  }
                  var accentColor = localStorage.getItem('accentColor') || 'blue';
                  var accentColors = {
                    blue: '#387aff',
                    coral: '#ff6b6b',
                    mint: '#4ecdc4',
                    lilac: '#a78bfa',
                    mono: '#808080'
                  };
                  if (!accentColors[accentColor]) accentColor = 'blue';
                  document.documentElement.dataset.accent = accentColor;
                  document.documentElement.style.setProperty('--accent', accentColors[accentColor] || accentColors.blue);
                  var csAvailable = ${cornerSmoothingEnabledValue ? 'true' : 'false'};
                  var csLisseSupported = 'ResizeObserver' in window && window.CSS && CSS.supports && CSS.supports('clip-path', 'path("M 0 0 L 1 0 L 1 1 Z")');
                  var csSaved = localStorage.getItem('cornerSmoothing');
                  var csEnabled = csAvailable && csLisseSupported && (csSaved === null ? true : csSaved === 'true');
                  document.documentElement.dataset.cornerSmoothing = csEnabled ? 'true' : 'false';
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedNavState = sessionStorage.getItem('sidebar-collapsed');
                  document.body.classList.toggle(
                    'nav-collapsed',
                    storedNavState === null ? true : storedNavState === 'true'
                  );
                } catch (e) {
                  document.body.classList.add('nav-collapsed');
                }
              })();
            `,
          }}
        />
        <ThemeProvider cornerSmoothingAvailable={cornerSmoothingEnabledValue} fmpSeparatedViewAvailable={fmpSeparatedViewEnabledValue}>
          <BlogFlagProvider blogEnabled={blogEnabledValue}>
            <a className="skip-link" href="#main-content" data-no-smooth-corners="">Skip to main content</a>
            <ProgressiveBlur />
            <ProgressiveBlur position="bottom" />
            <Navigation />
            <main className="site-main" id="main-content">
              {children}
            </main>
            {site.edition !== 'college' && <DiscordPopup />}
          </BlogFlagProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <svg width="0" height="0" style={{position:'absolute'}}>
          <filter id="progressive-blur" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation="0 24" edgeMode="duplicate"/>
          </filter>
        </svg>
      </body>
    </html>
  )
}
