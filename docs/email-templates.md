# 📧 Supabase メールテンプレート設定

## 設定方法
1. Supabase Dashboard → Settings → Auth → Email Templates
2. "Confirm signup" テンプレートを選択
3. 以下の内容に置き換え

## 📝 改善されたメールテンプレート

### 件名 (Subject)
```
扶養管理カレンダー - メールアドレス確認のお願い
```

### 本文 (Body - HTML)
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>扶養管理カレンダー - メール確認</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- ヘッダー -->
    <div style="text-align: center; margin-bottom: 30px; padding: 20px 0; border-bottom: 3px solid #1976d2;">
        <h1 style="color: #1976d2; margin: 0; font-size: 24px; font-weight: 700;">
            📅 扶養管理カレンダー
        </h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">
            学生アルバイト向け扶養控除管理システム
        </p>
    </div>

    <!-- メイン内容 -->
    <div style="background: #f8f9ff; padding: 25px; border-radius: 12px; border-left: 4px solid #1976d2; margin-bottom: 25px;">
        <h2 style="color: #1976d2; margin: 0 0 15px 0; font-size: 20px;">
            🎉 ご登録ありがとうございます！
        </h2>
        
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7;">
            メールアドレスの確認を完了するため、下のボタンをクリックしてください。
        </p>

        <!-- 確認ボタン -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="display: inline-block; background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3); transition: all 0.3s ease;">
                ✅ メールアドレスを確認する
            </a>
        </div>
    </div>

    <!-- 重要な次のステップ -->
    <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">
            📱 重要：次の手順をお忘れなく！
        </h3>
        <ol style="margin: 0; padding-left: 20px; color: #856404;">
            <li style="margin-bottom: 8px; font-weight: 500;">上のボタンをクリック</li>
            <li style="margin-bottom: 8px; font-weight: 500;">アプリのタブに戻る</li>
            <li style="margin-bottom: 8px; font-weight: 500;">「メール確認完了」ボタンを押す</li>
        </ol>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: #856404;">
            👆 この手順でログインが完了します！
        </p>
    </div>

    <!-- サポート情報 -->
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #555; margin: 0 0 15px 0; font-size: 16px;">
            💡 扶養管理カレンダーでできること
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
            <li>シフト管理とアルバイト収入の自動計算</li>
            <li>扶養控除限度額（103万円/150万円）の管理</li>
            <li>月別・年別の収入予測とアラート機能</li>
            <li>CSV入力によるかんたんデータ取り込み</li>
        </ul>
    </div>

    <!-- フッター -->
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #ddd;">
        <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
            このメールに心当たりがない場合は、無視していただいて構いません。
        </p>
        <p style="margin: 0; color: #999; font-size: 12px;">
            © 2024 扶養管理カレンダー
        </p>
    </div>

</body>
</html>
```

### 本文 (Body - Plain Text)
```
📅 扶養管理カレンダー
学生アルバイト向け扶養控除管理システム

🎉 ご登録ありがとうございます！

メールアドレスの確認を完了するため、下のリンクをクリックしてください：

{{ .ConfirmationURL }}

📱 重要：次の手順をお忘れなく！
1. 上のリンクをクリック
2. アプリのタブに戻る  
3. 「メール確認完了」ボタンを押す

👆 この手順でログインが完了します！

💡 扶養管理カレンダーでできること：
・シフト管理とアルバイト収入の自動計算
・扶養控除限度額（103万円/150万円）の管理
・月別・年別の収入予測とアラート機能
・CSV入力によるかんたんデータ取り込み

このメールに心当たりがない場合は、無視していただいて構いません。

© 2024 扶養管理カレンダー
```

## 🎯 改善ポイント

1. **親しみやすいタイトル** - アプリ名を明確に表示
2. **明確な手順** - 3ステップで完了までの流れを説明  
3. **目立つボタン** - グラデーションの大きなボタン
4. **重要な注意** - アプリに戻る手順を強調
5. **アプリの価値** - 何ができるかを簡潔に説明
6. **安心感** - 誤送信の場合の対応も記載

## 📱 設定手順
1. Supabase Dashboard にログイン
2. Settings → Auth → Email Templates
3. "Confirm signup" を選択
4. Subject と Body (HTML/Text) を上記内容に置き換え
5. Save changes

これで、ユーザーが受信するメールが格段に分かりやすくなります！