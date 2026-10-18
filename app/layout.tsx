import type { Metadata, Viewport } from 'next';
import { BRAND } from './lib/brand';
import './globals.css';
import './interface.css';
import './landing.css';
import './docare.css';
import { AppearanceProvider } from './theme-toggle';
import NavigationProgress from './navigation-progress';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">
        <AppearanceProvider>
          <NavigationProgress />
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}
