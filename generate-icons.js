const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// アイコンサイズの定義
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 180, name: 'icon-180x180.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

async function generateIcons(inputPath) {
  const publicDir = path.join(__dirname, 'public');
  
  try {
    // 入力画像を読み込み
    const inputBuffer = fs.readFileSync(inputPath);
    
    // 各サイズのアイコンを生成
    for (const { size, name } of iconSizes) {
      await sharp(inputBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(publicDir, name));
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }
    
    // favicon.ico を生成 (32x32)
    await sharp(inputBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    
    // OGイメージを生成 (1200x630)
    await sharp(inputBuffer)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 252, g: 231, b: 243, alpha: 1 } // ピンクの背景
      })
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    
    // Twitterイメージを生成 (1200x600)
    await sharp(inputBuffer)
      .resize(1200, 600, {
        fit: 'contain',
        background: { r: 252, g: 231, b: 243, alpha: 1 } // ピンクの背景
      })
      .png()
      .toFile(path.join(publicDir, 'twitter-image.png'));
    
    console.log('🎉 All icons generated successfully!');
    console.log('📝 Next steps:');
    console.log('1. Replace the generated icon files with your actual icon image');
    console.log('2. Run: npm run build');
    console.log('3. Deploy to Netlify');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

// 使用方法の説明
if (process.argv.length < 3) {
  console.log('📖 Usage: node generate-icons.js <path-to-your-icon-image>');
  console.log('📖 Example: node generate-icons.js ./your-icon.png');
  console.log('');
  console.log('📝 The input image should be:');
  console.log('  - Square (1:1 aspect ratio)'); 
  console.log('  - At least 512x512 pixels');
  console.log('  - PNG format with transparent background');
  process.exit(1);
}

const inputPath = process.argv[2];

if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

// アイコン生成を実行
generateIcons(inputPath);
