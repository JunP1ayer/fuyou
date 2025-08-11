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
  Psychology,
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 2,
            }}
          >
            <Business sx={{ color: 'primary.main', fontSize: 48, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              バイト管理
            </Typography>
            <Typography variant="body1" color="text.secondary">
              バイト先の管理とシフト表の提出を一元管理
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* メイン機能選択 */}
      <Grid container spacing={3}>
        {/* バイト先管理 */}
        <Grid item xs={12} md={6}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(179, 229, 252, 0.3)',
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={onNavigateToWorkplaceManager}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 4px 12px rgba(179, 229, 252, 0.4)',
                  }}
                >
                  <Edit sx={{ fontSize: 36, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  バイト先管理
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  働いているバイト先の登録・編集・詳細設定
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      バイト先の登録・編集
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Edit sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      時給・締日・割増設定
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* AI提出機能 */}
        <Grid item xs={12} md={6}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(67, 233, 123, 0.3)',
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={onNavigateToAISubmission}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 4px 12px rgba(67, 233, 123, 0.4)',
                  }}
                >
                  <Psychology sx={{ fontSize: 36, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  AI提出機能
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  シフト表を画像でアップロードして自動解析・提出
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Upload sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      画像・PDF対応OCR解析
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Psychology sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      AI自動シフト抽出・提出
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

    </Box>
  );
};