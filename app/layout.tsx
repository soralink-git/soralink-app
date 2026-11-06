import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { BRAND } from './lib/brand';
import './fonts.css';
import './globals.css';
import './tokens.css';
import './interface.css';
import './docare.css';
import './workspace.css';
import './usability.css';
import { AppearanceProvider } from './theme-toggle';
import NavigationProgress from './navigation-progress';
import IdleSession from './idle-session';
import { HOME_TITLE, HOME_DESCRIPTION } from './lib/site-seo';

export const viewport: Viewport = { themeColor: BRAND.charcoal };

export const metadata: Metadata = {
  metadataBase: new URL('https://soralink.link'),
  openGraph: {
    type: 'website',
    siteName: 'SoraLink',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: 'https://soralink.link/og-soralink.png',
        width: 1200,
        height: 630,
        alt: 'SoraLink — carte digitale NFC et QR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoraLink',
    images: ['https://soralink.link/og-soralink.png'],
  },
  manifest: '/manifest.webmanifest',
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  appleWebApp: { capable: true, title: 'SoraLink', statusBarStyle: 'black-translucent' },
  icons: {
    apple: '/icons/apple-touch-icon.png',
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = (await headers()).get('x-soralink-lang');
  const turnstileSiteKey = (await headers()).get('x-turnstile-site-key') || '';
  const arabic = language === 'ar';
  return (
    <html
      lang={arabic ? 'ar' : 'fr'}
      dir={arabic ? 'rtl' : 'ltr'}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          href="/fonts/dm-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        {turnstileSiteKey && (
          <script
            dangerouslySetInnerHTML={{
              __html: 'window.__TURNSTILE_SITE_KEY__=' + JSON.stringify(turnstileSiteKey) + ';',
            }}
          />
        )}
      </head>
      <body className="antialiased">
        <AppearanceProvider>
          <NavigationProgress />
          <IdleSession />
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}
