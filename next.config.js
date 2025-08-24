/** @type {import('next').NextConfig} */

// PWAを一時的に無効化してデバッグ
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
//   buildExcludes: [/middleware-manifest.json$/]
// });

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Netlify用の設定（export不要）
  images: {
    unoptimized: true
  },
  trailingSlash: false,
  
  // 開発環境では通常のNext.js設定
  ...(process.env.NODE_ENV === 'development' && {
    images: {
      domains: ['localhost'],
    },
  }),
  
  // 静的ファイルの圧縮
  compress: true,
};

// PWA無効化のため、直接エクスポート
module.exports = nextConfig;
// module.exports = withPWA(nextConfig);
