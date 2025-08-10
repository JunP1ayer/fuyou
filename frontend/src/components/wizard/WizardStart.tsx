import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const WizardStart: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: 'calc(100vh - 120px)', md: 'calc(100vh - 160px)' },
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 640 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 1 }}
            align="center"
          >
            税金・保険料のチェック
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
            align="center"
          >
            いくつかの質問に答えるだけで、123万/130万/106万の壁の目安を確認できます。
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => navigate('/submit')}>
              先にシフト表を提出する
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/wizard/steps')}
              size="large"
            >
              チェックを開始
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
