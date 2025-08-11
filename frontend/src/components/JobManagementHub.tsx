// 🏢 バイト管理ハブ - メイン選択画面

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
} from '@mui/material';
import {
  Business,
  CalendarToday,
  Upload,
  Edit,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface JobManagementHubProps {
  onNavigateToWorkplaceManager: () => void;
  onNavigateToAISubmission: () => void;
}

export const JobManagementHub: React.FC<JobManagementHubProps> = ({
  onNavigateToWorkplaceManager,
  onNavigateToAISubmission,
}) => {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* コンパクトヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Business sx={{ color: 'primary.main', fontSize: 36, mb: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
          バイト管理
        </Typography>
      </Box>

      {/* メイン機能選択 */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(179, 229, 252, 0.3)',
              },
            }}
            onClick={onNavigateToWorkplaceManager}
          >
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                <Edit sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                バイト先管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                登録・編集・設定
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)',
              },
            }}
            onClick={onNavigateToAISubmission}
          >
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                <CalendarToday sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                シフト表提出
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                シフト表を画像でアップロード
              </Typography>
              <Typography variant="caption" color="text.secondary">
                AIがカレンダーに自動反映
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};