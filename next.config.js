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
  
  // 静的ファイルの圧縮
  compress: true,
  
  // Next.js 14では appDir は不要（デフォルトで有効）
  // experimental: {
  //   appDir: true, // この行を削除
  // }
};

module.exports = withPWA(nextConfig);
