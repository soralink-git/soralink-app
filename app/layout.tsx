import type { Metadata, Viewport } from 'next';
import './globals.css';
import './interface.css';

export const viewport: Viewport = { themeColor: '#101112' };

export const metadata: Metadata = {
  metadataBase: new URL('https://soralink.link'),
  openGraph: {
    type: 'website',
    siteName: 'SoraLink',
    title: 'SoraLink — Toute votre activité dans un lien',
    description: 'Votre carte digitale, catalogue et rendez-vous. NFC, QR et lien direct.',
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
  title: 'SoraLink — Toute votre activité dans un lien',
  description: 'Carte digitale, catalogue et rendez-vous pour les professionnels au Maroc.',
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
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
