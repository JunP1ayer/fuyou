import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs,
  Tab,
  Card,
  CardContent,
  Container,
  Divider,
  Button
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`legal-tabpanel-${index}`}
      aria-labelledby={`legal-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const LegalPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => window.history.back()}
            sx={{ mb: 2 }}
          >
            戻る
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            法的情報
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最終更新日: 2024年12月
          </Typography>
        </Box>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
              <Tab label="利用規約" />
              <Tab label="プライバシー" />
              <Tab label="免責事項" />
            </Tabs>
          </Box>
          
          <CardContent sx={{ p: 4 }}>
            <TabPanel value={tabValue} index={0}>
              {/* 利用規約 */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                扶養管理カレンダー 利用規約
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                本アプリは、学生・アルバイト従事者向けの扶養控除管理と収入計算を支援するツールです。
                ご利用の前に、以下の規約をお読みください。
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                1. サービス内容
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, ml: 2, lineHeight: 1.7 }}>
                • シフト管理とカレンダー表示<br />
                • 収入計算と扶養控除範囲の管理<br />
                • 税金・社会保険料の概算計算<br />
                • 多言語対応（日本語含む6言語）
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                2. 免責事項
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                本アプリは情報提供を目的とし、税務・法務の専門的助言ではありません。
                制度変更により内容が古くなる可能性があります。最終判断は公的機関または専門家にご相談ください。
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                3. データ取扱い
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                入力データは計算・利便性のために安全に保存されます。
                詳細は「プライバシー」タブをご確認ください。
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* プライバシーポリシー */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                プライバシーポリシー
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                お客様のプライバシーを保護することは、当方の最優先事項です。
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                収集する情報
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, ml: 2, lineHeight: 1.7 }}>
                • シフト情報（日時、職場、時給等）<br />
                • 収入データ（月収、年収等）<br />
                • 扶養設定（年齢、学生区分等）<br />
                • 匿名化された利用統計
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                データの利用目的
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, ml: 2, lineHeight: 1.7 }}>
                • サービス機能の提供<br />
                • アプリの改善・バグ修正<br />
                • 利用統計の作成（個人特定不可）
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                セキュリティ
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                業界標準の暗号化技術により、お客様のデータを保護しています。
                不正アクセス・漏洩の防止に最大限の努力をしています。
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                データ削除
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                アプリ設定からいつでもデータを削除できます。
                アカウント削除の場合は、support@fuyou-app.com までご連絡ください。
              </Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* 免責事項 */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                免責事項・注意事項
              </Typography>
              
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3, color: 'warning.main' }}>
                ⚠️ 重要な注意事項
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                本アプリの計算結果は目安であり、実際の税制や社会保険制度と異なる場合があります。
                重要な判断については、必ず税務署・年金事務所・税理士等の専門家にご相談ください。
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                1. 計算の精度について
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, ml: 2, lineHeight: 1.7 }}>
                • 税制改正により計算式が変更される場合があります<br />
                • 地域・個人の状況により実際の計算と異なる場合があります<br />
                • 概算値として参考程度にご利用ください
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                2. サービス利用に関する免責
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                本アプリの利用により生じた損害（税務上の問題、収入超過等を含む）について、
                運営者は一切の責任を負いません。
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                3. サポート・お問い合わせ
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                ご質問・バグ報告・データ削除依頼は以下までご連絡ください：<br />
                <strong>support@fuyou-app.com</strong><br />
                (リリース時に正式なメールアドレスに変更予定)
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                4. 推奨する確認先
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, ml: 2, lineHeight: 1.7 }}>
                • <strong>税務署</strong>: 所得税に関する相談<br />
                • <strong>年金事務所</strong>: 社会保険に関する相談<br />
                • <strong>勤務先</strong>: 給与計算・扶養手当に関する相談<br />
                • <strong>税理士</strong>: 専門的な税務相談
              </Typography>
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LegalPage;


