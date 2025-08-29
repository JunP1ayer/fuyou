#!/usr/bin/env node

// アプリストア用アイコン生成スクリプト
// SVGからPNG画像を生成（手動実行用ガイド）

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// アプリストア用アイコンサイズ定義
const iconConfigs = {
  android: [
    // Google Play Store用
    { size: 512, name: 'play-store-icon-512.png', desc: 'Google Play Store用メインアイコン' },
    
    // Androidアプリ用（全密度）
    { size: 192, name: 'android-icon-192.png', desc: 'Android xxxhdpi (192dp)' },
    { size: 144, name: 'android-icon-144.png', desc: 'Android xxhdpi (144dp)' },
    { size: 96, name: 'android-icon-96.png', desc: 'Android xhdpi (96dp)' },
    { size: 72, name: 'android-icon-72.png', desc: 'Android hdpi (72dp)' },
    { size: 48, name: 'android-icon-48.png', desc: 'Android mdpi (48dp)' },
    { size: 36, name: 'android-icon-36.png', desc: 'Android ldpi (36dp)' },

    // Adaptive Icons用
    { size: 432, name: 'adaptive-icon-432.png', desc: 'Adaptive icon 432x432' },
    { size: 324, name: 'adaptive-icon-324.png', desc: 'Adaptive icon 324x324' },
    { size: 216, name: 'adaptive-icon-216.png', desc: 'Adaptive icon 216x216' },
    { size: 162, name: 'adaptive-icon-162.png', desc: 'Adaptive icon 162x162' },
    { size: 108, name: 'adaptive-icon-108.png', desc: 'Adaptive icon 108x108' },
  ],
  
  ios: [
    // App Store用
    { size: 1024, name: 'app-store-icon-1024.png', desc: 'Apple App Store用メインアイコン' },
    
    // iPhone用
    { size: 180, name: 'iphone-icon-180.png', desc: 'iPhone 6 Plus/6s Plus/7 Plus/8 Plus (60pt@3x)' },
    { size: 120, name: 'iphone-icon-120.png', desc: 'iPhone/iPod touch iOS 7-14 (60pt@2x)' },
    
    // iPad用  
    { size: 167, name: 'ipad-icon-167.png', desc: 'iPad Pro 9.7inch (83.5pt@2x)' },
    { size: 152, name: 'ipad-icon-152.png', desc: 'iPad/iPad mini iOS 7-14 (76pt@2x)' },
    { size: 76, name: 'ipad-icon-76.png', desc: 'iPad iOS 7-14 (76pt@1x)' },
    
    // 通知アイコン用
    { size: 40, name: 'iphone-notification-40.png', desc: 'iPhone通知 (20pt@2x)' },
    { size: 60, name: 'iphone-notification-60.png', desc: 'iPhone通知 (20pt@3x)' },
    
    // 設定アイコン用  
    { size: 58, name: 'iphone-settings-58.png', desc: 'iPhone設定 (29pt@2x)' },
    { size: 87, name: 'iphone-settings-87.png', desc: 'iPhone設定 (29pt@3x)' },
  ]
};

// アイコン生成ガイドの出力
function generateIconGuide() {
  const outputDir = path.join(__dirname, '..', 'public', 'icons');
  
  console.log('🎨 アプリストア用アイコン生成ガイド');
  console.log('=====================================\n');
  
  console.log('📁 出力ディレクトリ:', outputDir);
  console.log('📄 元ファイル: public/app-icon.svg\n');
  
  console.log('🤖 ANDROID用アイコン:');
  console.log('───────────────────────');
  iconConfigs.android.forEach(icon => {
    console.log(`  • ${icon.size}x${icon.size}px → ${icon.name}`);
    console.log(`    ${icon.desc}`);
  });
  
  console.log('\n🍎 iOS用アイコン:');
  console.log('──────────────');
  iconConfigs.ios.forEach(icon => {
    console.log(`  • ${icon.size}x${icon.size}px → ${icon.name}`);
    console.log(`    ${icon.desc}`);
  });
  
  console.log('\n🛠️ 手動生成手順:');
  console.log('──────────────');
  console.log('1. https://realfavicongenerator.net/ を開く');
  console.log('2. public/app-icon.svg をアップロード');
  console.log('3. 各プラットフォーム設定:');
  console.log('   - Android: Adaptive Icons対応');
  console.log('   - iOS: 全サイズ対応');
  console.log('   - 背景色: #1976d2');
  console.log('4. 生成されたファイルを public/icons/ に保存');
  
  console.log('\n🎯 オンライン変換ツール推奨:');
  console.log('────────────────────────');
  console.log('• https://appicon.co/ (全サイズ一括生成)');
  console.log('• https://makeappicon.com/ (iOS/Android対応)'); 
  console.log('• https://app-icon-generator.co/ (SVG対応)');
  
  console.log('\n📋 生成後のファイル配置:');
  console.log('──────────────────────');
  console.log('Android用: frontend/android/app/src/main/res/mipmap-*/ へ配置');
  console.log('iOS用: frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/ へ配置');
  
  // アイコンディレクトリ作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`\n✅ ${outputDir} ディレクトリを作成しました`);
  }
  
  // 必要なサイズ一覧をJSONで出力
  const allSizes = {
    android: iconConfigs.android,
    ios: iconConfigs.ios,
    totalCount: iconConfigs.android.length + iconConfigs.ios.length
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'required-sizes.json'),
    JSON.stringify(allSizes, null, 2)
  );
  
  console.log(`✅ ${outputDir}/required-sizes.json に必要サイズ一覧を保存しました`);
  
  return allSizes;
}

// スクリプト実行
generateIconGuide();

export { generateIconGuide, iconConfigs };