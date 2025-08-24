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
      { url: '/kondate.png', sizes: '32x32', type: 'image/png' },
      { url: '/kondate.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/kondate.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/kondate.png',
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
        url: '/kondate.png',
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
    images: ['/kondate.png'],
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
        <link rel="icon" href="/kondate.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/kondate.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/kondate.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/kondate.png" />
        <link rel="apple-touch-icon" href="/kondate.png" />
        <link rel="mask-icon" href="/kondate.png" color="#EC4899" />
        <meta name="theme-color" content="#FCE7F3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="こんだて" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#FCE7F3" />
        <meta name="msapplication-TileImage" content="/kondate.png" />
      </head>
      <body className="min-h-screen pwa-standalone">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
