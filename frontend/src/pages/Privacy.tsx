import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
          >
            戻る
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            プライバシーポリシー
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最終更新日: 2024年12月
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              1. 収集する情報について
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              扶養管理カレンダーでは、サービスの提供と改善のため、以下の情報を収集いたします：
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, ml: 2, lineHeight: 1.7 }}>
              • シフト情報（勤務日時、職場名、時給等）<br />
              • 収入情報（月収、年収等の計算結果）<br />
              • 扶養設定情報（年齢、学生区分等）<br />
              • アプリの利用状況（匿名統計情報）
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              2. 情報の利用目的
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, ml: 2, lineHeight: 1.7 }}>
              • 扶養控除範囲内での収入管理機能の提供<br />
              • シフト管理とカレンダー機能の提供<br />
              • アプリの機能改善とバグ修正<br />
              • 統計データの作成（個人を特定できない形式）
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              3. データの保存と管理
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              • 入力されたデータは暗号化されて安全に保存されます<br />
              • データはお客様のデバイスと弊社の安全なサーバーに保存されます<br />
              • 第三者への情報提供は行いません（法的要請を除く）
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              4. お客様の権利
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, ml: 2, lineHeight: 1.7 }}>
              • データの確認・修正・削除を要求する権利<br />
              • データ処理の停止を要求する権利<br />
              • データの可搬性を要求する権利
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              5. Cookie及び類似技術
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              本アプリでは、利用状況の分析とユーザー体験の向上のため、
              Cookieやローカルストレージ等の技術を使用しています。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              6. セキュリティ対策
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              お客様の個人情報を保護するため、業界標準のセキュリティ対策を実施し、
              不正アクセス、漏洩、改ざん等の防止に努めています。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              7. 本ポリシーの変更
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              本プライバシーポリシーは、法的要件の変更やサービスの改善に応じて更新される場合があります。
              重要な変更がある場合は、アプリ内での通知により、お客様にお知らせいたします。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              8. お問い合わせ
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              本プライバシーポリシーに関するご質問やご要望がございましたら、
              以下の連絡先までお問い合わせください：<br />
              <br />
              メール: privacy@fuyou-app.com<br />
              (実際のリリース時に正式な連絡先に変更してください)
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};