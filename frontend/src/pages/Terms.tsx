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

export const Terms: React.FC = () => {
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
            利用規約
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最終更新日: 2024年12月
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              1. 本規約について
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              この利用規約（以下「本規約」）は、扶養管理カレンダー（以下「本アプリ」）の利用に関する条件を定めるものです。
              本アプリをご利用になる場合には、本規約に同意いただいたものとみなします。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              2. サービス内容
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, ml: 2, lineHeight: 1.7 }}>
              • アルバイト・パートのシフト管理機能<br />
              • 収入計算と扶養控除範囲内での管理機能<br />
              • 税金・社会保険料の概算計算機能<br />
              • カレンダー表示と予定管理機能
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              3. 利用者の責任
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              利用者は、以下の責任を負うものとします：
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, ml: 2, lineHeight: 1.7 }}>
              • 正確な情報の入力<br />
              • 個人のアカウント管理<br />
              • 本アプリの適切な利用<br />
              • 最終的な税務判断は専門家への相談
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              4. 禁止事項
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              以下の行為を禁止します：
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, ml: 2, lineHeight: 1.7 }}>
              • 不正アクセスやシステムの妨害<br />
              • 虚偽情報の入力・拡散<br />
              • 第三者の権利侵害<br />
              • 営利目的での無断利用<br />
              • その他、法令に違反する行為
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              5. 免責事項
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              本アプリは情報提供を目的としており、税務や法務の専門的助言を行うものではありません。
              最終的な判断は利用者の責任で行い、必要に応じて専門家にご相談ください。
              また、本アプリの利用により生じた損害について、当方は責任を負いません。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              6. サービスの変更・終了
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              当方は、事前の通知により本アプリの内容を変更、または提供を終了することができるものとします。
              サービス終了の場合は、合理的な期間をもって利用者に通知いたします。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              7. 知的財産権
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              本アプリの著作権、商標権、その他の知的財産権は当方または正当な権利者に帰属します。
              利用者は、これらの権利を侵害する行為を行ってはなりません。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              8. 準拠法・管轄
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              本規約は日本法を準拠法とし、本アプリに関する紛争については、
              東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              9. 規約の変更
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              本規約は、利用者への通知により変更することができるものとします。
              変更後も継続してご利用いただく場合、変更後の規約に同意いただいたものとみなします。
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              10. お問い合わせ
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              本規約に関するお問い合わせは、以下までご連絡ください：<br />
              <br />
              メール: support@fuyou-app.com<br />
              (実際のリリース時に正式な連絡先に変更してください)
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};