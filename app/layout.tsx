import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientWrapper from '@/components/layout/ClientWrapper';

export const metadata: Metadata = {
  metadataBase: new URL('https://mobile-kondate-app.netlify.app'),
  title: 'こんだて - スマホで簡単献立作成',
  description: '和食を中心とした献立を簡単に作成できるスマホアプリ',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/icon-180x180.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icon-180x180.png',
      }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'こんだて',
  },
  openGraph: {
    title: 'こんだて - スマホで簡単献立作成',
    description: '和食を中心とした献立を簡単に作成できるスマホアプリ',
    url: 'https://mobile-kondate-app.netlify.app',
    siteName: 'こんだて',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'こんだて - 献立アプリ',
      }
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'こんだて - スマホで簡単献立作成',
    description: '和食を中心とした献立を簡単に作成できるスマホアプリ',
    images: ['/twitter-image.png'],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="mask-icon" href="/icon-192x192.png" color="#10b981" />
        <meta name="theme-color" content="#FCE7F3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="こんだて" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#FCE7F3" />
        <meta name="msapplication-TileImage" content="/icon-144x144.png" />
      </head>
      <body className="min-h-screen pwa-standalone">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
