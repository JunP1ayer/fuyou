import React from 'react';
import { Box, Typography } from '@mui/material';

export const LegalPage: React.FC = () => {
  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        利用規約 / プライバシーポリシー
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        本サービスは情報提供を目的とし、法的助言ではありません。制度や基準は頻繁に更新されるため、表示内容は常に最新であることを保証しません。重要な判断は、公的機関または専門家に確認してください。
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>データの取り扱い</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        入力されたデータは計算・利便性のために保存されます。OCR/GPT解析における画像・テキストは処理のために送信されます。結果の品質向上のため匿名化した統計を利用する場合があります。
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>免責</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
      </Typography>
    </Box>
  );
};

export default LegalPage;


