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
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            sx={{
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <CardContent sx={{ px: 4, py: 5, textAlign: 'center' }}>
              {/* アプリタイトル */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    color: '#1a1a1a',
                    letterSpacing: '-0.02em',
                  }}
                >
                  扶養管理カレンダー
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 400, 
                    mb: 2,
                    color: '#666',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Dependent Management Calendar
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#666',
                    mb: 1,
                    fontSize: '1.0rem',
                    lineHeight: 1.6,
                  }}
                >
                  学生向け扶養控除管理システム
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#888',
                    mb: 4,
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                  }}
                >
                  Tax dependent management system for students
                </Typography>
              </motion.div>

              {/* 言語選択セクション */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 500,
                    mb: 0.5,
                    color: '#333',
                  }}
                >
                  言語を選択
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 400,
                    mb: 1,
                    color: '#666',
                    fontSize: '1.1rem',
                  }}
                >
                  Select Language
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#666',
                    mb: 1,
                  }}
                >
                  使用する言語を選択してください
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#888',
                    mb: 3,
                    fontSize: '0.9rem',
                  }}
                >
                  Please select your preferred language
                </Typography>

                {/* 言語選択ドロップダウン */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <LanguageDropdown 
                    variant="outlined" 
                    showCurrentFlag 
                    autoAdvance
                  />
                </Box>

                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#999',
                    fontSize: '0.85rem',
                    mb: 0.5,
                  }}
                >
                  設定からいつでも変更できます
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#aaa',
                    fontSize: '0.8rem',
                  }}
                >
                  You can change this anytime in settings
                </Typography>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};