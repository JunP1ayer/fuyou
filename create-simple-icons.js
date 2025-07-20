// 簡易PWAアイコン生成スクリプト（Node.js用）
const fs = require('fs');

// SVGからDataURLに変換
function createDataURL(size) {
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="#4CAF50"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - size/8}" fill="#FFFFFF"/>
  <text x="${size/2}" y="${size/2 + size*0.15}" font-family="Arial" font-size="${size*0.4}" font-weight="bold" text-anchor="middle" fill="#4CAF50">¥</text>
  ${size >= 96 ? `<polygon points="${size*0.75},${size*0.25} ${size*0.78},${size*0.32} ${size*0.85},${size*0.32} ${size*0.8},${size*0.37} ${size*0.83},${size*0.44} ${size*0.75},${size*0.4} ${size*0.67},${size*0.44} ${size*0.7},${size*0.37} ${size*0.65},${size*0.32} ${size*0.72},${size*0.32}" fill="#FFC107"/>` : ''}
</svg>`;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// HTMLファイルとして出力（ブラウザでPNGに変換可能）
const iconHTML = `<!DOCTYPE html>
<html>
<head>
    <title>扶養プロアイコン生成</title>
    <style>
        .icon-container { display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
        .icon-item { text-align: center; border: 1px solid #ddd; padding: 10px; }
        canvas { display: block; margin: 10px auto; }
    </style>
</head>
<body>
    <h1>扶養プロ PWAアイコン</h1>
    <div class="icon-container" id="icons"></div>
    
    <script>
        const sizes = [
            { size: 16, name: 'favicon-16x16.png' },
            { size: 32, name: 'favicon-32x32.png' },
            { size: 96, name: 'shortcut-96.png' },
            { size: 180, name: 'apple-touch-icon.png' },
            { size: 192, name: 'icon-192.png' },
            { size: 512, name: 'icon-512.png' }
        ];

        function createIcon(size, name) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // 背景円
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
            ctx.fill();

            // 内側白円
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - size/8, 0, 2 * Math.PI);
            ctx.fill();

            // ¥記号
            ctx.fillStyle = '#4CAF50';
            ctx.font = \`bold \${size * 0.4}px Arial\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('¥', size/2, size/2);

            // 星（大きいサイズのみ）
            if (size >= 96) {
                ctx.fillStyle = '#FFC107';
                drawStar(ctx, size * 0.75, size * 0.3, size * 0.08);
            }

            return canvas;
        }

        function drawStar(ctx, x, y, size) {
            const spikes = 5;
            const step = Math.PI / spikes;
            let rot = Math.PI / 2 * 3;
            
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            
            for (let i = 0; i < spikes; i++) {
                let sx = x + Math.cos(rot) * size;
                let sy = y + Math.sin(rot) * size;
                ctx.lineTo(sx, sy);
                rot += step;
                
                sx = x + Math.cos(rot) * (size * 0.5);
                sy = y + Math.sin(rot) * (size * 0.5);
                ctx.lineTo(sx, sy);
                rot += step;
            }
            
            ctx.lineTo(x, y - size);
            ctx.closePath();
            ctx.fill();
        }

        // アイコン生成と表示
        sizes.forEach(({size, name}) => {
            const div = document.createElement('div');
            div.className = 'icon-item';
            
            const canvas = createIcon(size, name);
            div.appendChild(canvas);
            
            const label = document.createElement('div');
            label.textContent = \`\${name} (\${size}x\${size})\`;
            div.appendChild(label);
            
            const link = document.createElement('a');
            link.download = name;
            link.href = canvas.toDataURL('image/png');
            link.textContent = 'ダウンロード';
            link.style.display = 'block';
            link.style.marginTop = '5px';
            link.style.padding = '5px 10px';
            link.style.background = '#4CAF50';
            link.style.color = 'white';
            link.style.textDecoration = 'none';
            link.style.borderRadius = '4px';
            div.appendChild(link);
            
            document.getElementById('icons').appendChild(div);
        });
    </script>
</body>
</html>`;

console.log('✅ アイコン生成HTMLファイルを作成中...');
fs.writeFileSync('icon-generator.html', iconHTML);
console.log('✅ icon-generator.html が作成されました！');
console.log('📋 使用方法:');
console.log('1. icon-generator.html をブラウザで開く');
console.log('2. 各アイコンの「ダウンロード」ボタンをクリック');
console.log('3. ダウンロードしたファイルをアプリディレクトリに配置');