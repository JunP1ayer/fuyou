// 🌍 タブ型言語切り替えコンポーネント

import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageTabsProps {
  variant?: 'compact' | 'full';
  showLabel?: boolean;
}

const languages = [
  { code: 'ja', flag: '🇯🇵', label: '日本語', shortLabel: 'JP' },
  { code: 'en', flag: '🇺🇸', label: 'English', shortLabel: 'EN' },
  { code: 'ko', flag: '🇰🇷', label: '한국어', shortLabel: 'KO' },
];

export const LanguageTabs: React.FC<LanguageTabsProps> = ({
  variant = 'compact',
  showLabel = false,
}) => {
  const theme = useTheme();
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (
    _: React.MouseEvent<HTMLElement>,
    newLanguage: string | null
  ) => {
    if (newLanguage) {
      setLanguage(newLanguage);
    }
  };

  if (variant === 'compact') {
    return (
      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={handleLanguageChange}
        size="small"
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          padding: 0.5,
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: 1.5,
            px: showLabel ? 2 : 1.5,
            py: 0.5,
            color: theme.palette.text.secondary,
            fontSize: showLabel ? '0.875rem' : '1rem',
            textTransform: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
            '&.Mui-selected': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.primary.main,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: theme.palette.background.paper,
              },
            },
          },
        }}
      >
        {languages.map((lang) => (
          <ToggleButton key={lang.code} value={lang.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              {showLabel && (
                <Typography variant="body2" fontWeight={500}>
                  {lang.shortLabel}
                </Typography>
              )}
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  // Full variant - より大きな表示
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        backgroundColor: alpha(theme.palette.background.default, 0.5),
        borderRadius: 3,
      }}
    >
      {languages.map((lang, index) => (
        <motion.div
          key={lang.code}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{ flex: 1 }}
        >
          <Box
            onClick={() => setLanguage(lang.code)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              p: 2,
              borderRadius: 2.5,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor:
                language === lang.code
                  ? theme.palette.background.paper
                  : 'transparent',
              border: '2px solid',
              borderColor:
                language === lang.code
                  ? theme.palette.primary.main
                  : 'transparent',
              boxShadow:
                language === lang.code
                  ? '0 4px 16px rgba(90, 200, 250, 0.2)'
                  : 'none',
              transform: language === lang.code ? 'scale(1.05)' : 'scale(1)',
              '&:hover': {
                backgroundColor:
                  language === lang.code
                    ? theme.palette.background.paper
                    : alpha(theme.palette.primary.main, 0.05),
                transform: 'scale(1.05)',
              },
            }}
          >
            <Typography variant="h5">{lang.flag}</Typography>
            <Typography
              variant="caption"
              fontWeight={language === lang.code ? 600 : 400}
              color={
                language === lang.code ? 'primary' : 'text.secondary'
              }
            >
              {lang.label}
            </Typography>
          </Box>
        </motion.div>
      ))}
    </Box>
  );
};