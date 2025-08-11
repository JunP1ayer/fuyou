import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

export const WizardStart: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
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
            {t('wizard.start.title', '税金・保険料のチェック')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
            align="center"
          >
            {t('wizard.start.subtitle', 'いくつかの質問に答えるだけで、123万/130万/106万の壁の目安を確認できます。')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => navigate('/submit')}>
              {t('wizard.start.goSubmit', '先にシフト表を提出する')}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/wizard/steps')}
              size="large"
            >
              {t('wizard.start.begin', 'チェックを開始')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
