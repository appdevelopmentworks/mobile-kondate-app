/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/]
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 本番環境でのみ静的エクスポートを有効化
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    images: {
      unoptimized: true
    },
    trailingSlash: true,
  }),
  
  // 開発環境では通常のNext.js設定
  ...(process.env.NODE_ENV === 'development' && {
    images: {
      domains: ['localhost'],
    },
  }),
  
  // Base path設定（必要に応じて）
  // basePath: '/mobile-kondate-app',
  
  // Asset prefix設定（CDN使用時）
  // assetPrefix: 'https://your-cdn-domain.com',
  
  // 静的ファイルの圧縮
  compress: true,
  
  // 実験的機能
  experimental: {
    // アプリディレクトリの使用
    appDir: true,
  }
};

module.exports = withPWA(nextConfig);
