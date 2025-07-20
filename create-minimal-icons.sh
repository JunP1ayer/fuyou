#!/bin/bash
# 最小限のPWAアイコンファイルを作成

# ImageMagickで単色アイコンを作成
create_icon() {
    local size=$1
    local filename=$2
    
    # 単色の緑アイコンを作成（ImageMagick使用）
    if command -v convert &> /dev/null; then
        convert -size ${size}x${size} xc:"#4CAF50" -fill white -draw "circle $((size/2)),$((size/2)) $((size/2-size/8)),$((size/2))" \
                -fill "#4CAF50" -pointsize $((size/3)) -gravity center -annotate +0+0 "¥" "$filename"
    else
        # ImageMagickがない場合は最小限のPNGを作成
        echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$filename"
    fi
    echo "Created: $filename"
}

# 必要なアイコンを作成
create_icon 192 "icon-192.png"
create_icon 512 "icon-512.png"
create_icon 192 "icon-maskable-192.png"
create_icon 512 "icon-maskable-512.png"
create_icon 180 "apple-touch-icon.png"
create_icon 32 "favicon-32x32.png"
create_icon 16 "favicon-16x16.png"
create_icon 96 "shortcut-96.png"

echo "✅ 基本的なPWAアイコンファイルが作成されました！"