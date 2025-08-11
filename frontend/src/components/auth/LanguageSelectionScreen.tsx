// 🌍 言語選択画面コンポーネント（ログイン前表示）

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageDropdown } from '../common/LanguageDropdown';

export const LanguageSelectionScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            sx={{
              maxWidth: 500,
              mx: 'auto',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <CardContent sx={{ px: 5, py: 6, textAlign: 'center' }}>
              {/* 言語選択セクション */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: '#2c2c2c',
                    mb: 1.5,
                    fontSize: '1.8rem',
                    fontWeight: 600,
                  }}
                >
                  言語を選択
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: '#666',
                    mb: 5,
                    fontSize: '1.8rem',
                    fontWeight: 600,
                  }}
                >
                  Select Language
                </Typography>

                {/* 言語選択ドロップダウン（大きく） */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ minWidth: 320, maxWidth: 400 }}>
                    <LanguageDropdown 
                      variant="outlined" 
                      showCurrentFlag 
                      autoAdvance
                      fullWidth
                    />
                  </Box>
                </Box>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};