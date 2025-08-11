// 🌍 言語選択コンポーネント

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

interface LanguageSelectorProps {
  onLanguageSelect: (language: string) => void;
}

const languages = [
  {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵',
    appName: '扶養管理カレンダー',
    description: '学生向け扶養控除管理システム',
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    appName: 'Dependent Management Calendar',
    description: 'Tax dependent management system for students',
  },
  {
    code: 'ko',
    name: '한국어',
    flag: '🇰🇷',
    appName: '부양 관리 캘린더',
    description: '학생을 위한 부양 공제 관리 시스템',
  },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageSelect,
}) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        sx={{
          maxWidth: 480,
          mx: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {/* ヘッダー */}
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            px: 3,
          }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: '#1a1a1a',
                letterSpacing: '-0.01em',
              }}
            >
              🌍
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                mb: 1,
                color: '#1a1a1a',
              }}
            >
              言語を選択してください
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                fontWeight: 400,
              }}
            >
              Choose your language / 언어를 선택하세요
            </Typography>
          </motion.div>
        </Box>

        <CardContent sx={{ px: 3, pb: 4, pt: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {languages.map((lang, index) => (
              <motion.div
                key={lang.code}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => onLanguageSelect(lang.code)}
                  sx={{
                    py: 2,
                    px: 3,
                    borderRadius: 3,
                    border: '1px solid #e1e8ed',
                    backgroundColor: '#fafbfc',
                    color: '#1a1a1a',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#f0f8ff',
                      border: '1px solid #5ac8fa',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 16px rgba(90, 200, 250, 0.2)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography
                      variant="h5"
                      sx={{ mr: 2, fontSize: '1.5rem' }}
                    >
                      {lang.flag}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: '1.1rem',
                        }}
                      >
                        {lang.appName}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.85rem',
                        }}
                      >
                        {lang.description}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: '#5ac8fa',
                        ml: 1,
                      }}
                    >
                      {lang.name}
                    </Typography>
                  </Box>
                </Button>
              </motion.div>
            ))}
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 3, fontSize: '0.8rem' }}
            >
              言語はいつでも設定から変更できます
              <br />
              Language can be changed in settings anytime
            </Typography>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};