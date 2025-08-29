// アイコン生成スクリプト（手動実行用）
// このファイルは参考用です - 実際の画像は手動で作成してください

const iconSizes = [
  { size: 192, name: 'app-icon-192.png' },
  { size: 512, name: 'app-icon-512.png' },
  { size: 180, name: 'apple-icon-180.png' },
  { size: 167, name: 'apple-icon-167.png' },
  { size: 152, name: 'apple-icon-152.png' },
  { size: 120, name: 'apple-icon-120.png' }
];

console.log('PWAアイコンとして以下のサイズが必要です:');
iconSizes.forEach(icon => {
  console.log(`- ${icon.size}x${icon.size}px: public/${icon.name}`);
});

console.log('\n手動作成手順:');
console.log('1. app-icon.svgをブラウザで開く');
console.log('2. スクリーンショットまたはSVG→PNG変換ツールを使用');
console.log('3. 各サイズにリサイズしてpublic/フォルダに保存');