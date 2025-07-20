#!/usr/bin/env python3
"""
PWA用アイコンファイル生成スクリプト
扶養プロアプリのアイコンを各サイズで生成
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_app_icon(size, filename):
    """扶養プロアプリのアイコンを作成"""
    
    # アイコンベース作成
    img = Image.new('RGBA', (size, size), (76, 175, 80, 255))  # Material Green
    draw = ImageDraw.Draw(img)
    
    # 円形背景
    margin = size // 8
    circle_size = size - margin * 2
    draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                fill=(255, 255, 255, 255))
    
    # ¥マークを描画
    center = size // 2
    symbol_size = size // 3
    
    # フォントサイズ調整
    font_size = symbol_size
    try:
        # システムフォント使用を試行
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
    
    # ¥記号を中央に描画
    text = "¥"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - size // 20  # 少し上に調整
    
    draw.text((text_x, text_y), text, fill=(76, 175, 80, 255), font=font)
    
    # 小さな星印を追加（扶養管理のイメージ）
    star_size = size // 12
    star_x = center + symbol_size // 3
    star_y = center - symbol_size // 3
    
    # 簡単な星形を描画
    star_points = []
    import math
    for i in range(10):
        angle = i * math.pi / 5
        if i % 2 == 0:
            radius = star_size
        else:
            radius = star_size // 2
        x = star_x + radius * math.cos(angle - math.pi/2)
        y = star_y + radius * math.sin(angle - math.pi/2)
        star_points.append((x, y))
    
    draw.polygon(star_points, fill=(255, 193, 7, 255))  # Amber color
    
    # ファイル保存
    img.save(filename, 'PNG')
    print(f"Created: {filename} ({size}x{size})")

def create_favicon(size, filename):
    """ファビコン作成（シンプル版）"""
    img = Image.new('RGBA', (size, size), (76, 175, 80, 255))
    draw = ImageDraw.Draw(img)
    
    # 白い円
    margin = 2
    draw.ellipse([margin, margin, size-margin, size-margin], fill=(255, 255, 255, 255))
    
    # ¥記号
    try:
        font_size = size - 6
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "¥"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - 1
    
    draw.text((text_x, text_y), text, fill=(76, 175, 80, 255), font=font)
    
    img.save(filename, 'PNG')
    print(f"Created: {filename} ({size}x{size})")

# アイコンサイズとファイル名の定義
icon_configs = [
    (192, 'icon-192.png'),
    (512, 'icon-512.png'),
    (192, 'icon-maskable-192.png'),
    (512, 'icon-maskable-512.png'),
    (180, 'apple-touch-icon.png'),
    (32, 'favicon-32x32.png'),
    (16, 'favicon-16x16.png'),
    (96, 'shortcut-96.png'),  # ショートカット用
]

print("扶養プロ PWAアイコン生成開始...")

for size, filename in icon_configs:
    if 'favicon' in filename:
        create_favicon(size, filename)
    else:
        create_app_icon(size, filename)

print("\n✅ すべてのPWAアイコンファイルが生成されました！")
print("これでスマホでのホーム画面追加が可能になります。")