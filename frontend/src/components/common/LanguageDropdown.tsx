// 🌍 ドロップダウン型言語選択コンポーネント

import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  alpha,
  useTheme,
  Fade,
  Paper,
} from '@mui/material';
import {
  Language as LanguageIcon,
  ExpandMore,
  Check,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

const languages = [
  { 
    code: 'ja', 
    flag: '🇯🇵', 
    name: '日本語',
    description: '日本語で表示',
  },
  { 
    code: 'en', 
    flag: '🇺🇸', 
    name: 'English',
    description: 'Display in English',
  },
  { 
    code: 'ko', 
    flag: '🇰🇷', 
    name: '한국어',
    description: '한국어로 표시',
  },
  { 
    code: 'zh', 
    flag: '🇨🇳', 
    name: '中文',
    description: '中文显示',
  },
  { 
    code: 'zh-TW', 
    flag: '🇹🇼', 
    name: '繁體中文',
    description: '繁體中文顯示',
  },
  { 
    code: 'es', 
    flag: '🇪🇸', 
    name: 'Español',
    description: 'Mostrar en español',
  },
  { 
    code: 'pt', 
    flag: '🇧🇷', 
    name: 'Português',
    description: 'Exibir em português',
  },
  { 
    code: 'fr', 
    flag: '🇫🇷', 
    name: 'Français',
    description: 'Afficher en français',
  },
  { 
    code: 'de', 
    flag: '🇩🇪', 
    name: 'Deutsch',
    description: 'Auf Deutsch anzeigen',
  },
  { 
    code: 'vi', 
    flag: '🇻🇳', 
    name: 'Tiếng Việt',
    description: 'Hiển thị bằng tiếng Việt',
  },
  { 
    code: 'th', 
    flag: '🇹🇭', 
    name: 'ไทย',
    description: 'แสดงเป็นภาษาไทย',
  },
];

interface LanguageDropdownProps {
  variant?: 'button' | 'text' | 'outlined';
  fullWidth?: boolean;
  showCurrentFlag?: boolean;
  autoAdvance?: boolean;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  variant = 'outlined',
  fullWidth = false,
  showCurrentFlag = true,
  autoAdvance = false,
}) => {
  const theme = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    handleClose();
    
    // autoAdvanceがtrueの場合、選択後に短い間をあけて進む
    if (autoAdvance) {
      // 設定が保存されてから進む
      setTimeout(() => {
        // ここでは自動でisLanguageSelectedがtrueになる
      }, 300);
    }
  };

  return (
    <>
      <Button
        variant={variant as any}
        onClick={handleClick}
        fullWidth={fullWidth}
        startIcon={
          showCurrentFlag ? (
            <span style={{ fontSize: '1.2rem' }}>{currentLanguage.flag}</span>
          ) : (
            <LanguageIcon />
          )
        }
        endIcon={
          <ExpandMore 
            sx={{ 
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }} 
          />
        }
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1,
          textTransform: 'none',
          backgroundColor: variant === 'outlined' 
            ? alpha(theme.palette.background.paper, 0.8)
            : undefined,
          backdropFilter: variant === 'outlined' ? 'blur(10px)' : undefined,
          border: variant === 'outlined' 
            ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
            : undefined,
          '&:hover': {
            backgroundColor: variant === 'outlined'
              ? alpha(theme.palette.primary.main, 0.05)
              : undefined,
            borderColor: variant === 'outlined'
              ? theme.palette.primary.main
              : undefined,
          },
        }}
      >
        <Typography variant="body2" fontWeight={500}>
          {currentLanguage.name}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 250,
            borderRadius: 2,
            mt: 1,
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('language.select', '言語を選択')}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 1 }} />

        {languages.map((lang, index) => (
          <motion.div
            key={lang.code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <MenuItem
              onClick={() => handleLanguageSelect(lang.code)}
              selected={language === lang.code}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.16),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  {lang.flag}
                </Typography>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" fontWeight={500}>
                    {lang.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {lang.description}
                  </Typography>
                }
              />
              {language === lang.code && (
                <Check 
                  sx={{ 
                    ml: 2, 
                    color: theme.palette.primary.main,
                    fontSize: 20,
                  }} 
                />
              )}
            </MenuItem>
          </motion.div>
        ))}

        <Divider sx={{ mt: 1, mb: 1 }} />
        
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('language.changeAnytime', '設定からいつでも変更できます')}
          </Typography>
        </Box>
      </Menu>
    </>
  );
};