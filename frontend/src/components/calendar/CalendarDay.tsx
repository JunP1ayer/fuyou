// 📅 FUYOU PRO - カレンダー日付セル

import React from 'react';
import { Box, Typography, Chip, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useI18n } from '@/hooks/useI18n';

import type { Shift } from '../../types/index';
import { formatCurrency } from '../../utils/calculations';

interface CalendarDayProps {
  date: Date;
  shifts: Shift[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
  onShiftClick: (shift: Shift) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  shifts,
  isCurrentMonth,
  isSelected,
  isToday,
  onClick,
  onShiftClick,
}) => {
  const theme = useTheme();
  const { t } = useI18n();

  // 日の総収入を計算
  const totalEarnings = shifts.reduce(
    (total, shift) => total + shift.totalEarnings,
    0
  );

  // 日付の背景色を決定
  const getBackgroundColor = () => {
    if (isSelected) {
      return theme.palette.primary.main;
    }
    if (isToday) {
      return alpha(theme.palette.primary.main, 0.1);
    }
    if (!isCurrentMonth) {
      return alpha(theme.palette.action.disabled, 0.05);
    }
    return 'transparent';
  };

  // テキスト色を決定
  const getTextColor = () => {
    if (isSelected) {
      return 'white';
    }
    if (!isCurrentMonth) {
      return theme.palette.text.disabled;
    }
    return theme.palette.text.primary;
  };

  // 境界線の色を決定
  const getBorderColor = () => {
    if (isToday && !isSelected) {
      return theme.palette.primary.main;
    }
    return 'transparent';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ height: '100%' }}
    >
      <Box
        onClick={onClick}
        sx={{
          minHeight: { xs: 80, md: 100 },
          p: 0.5,
          cursor: 'pointer',
          borderRadius: 2,
          border: `2px solid ${getBorderColor()}`,
          backgroundColor: getBackgroundColor(),
          color: getTextColor(),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: isSelected
              ? alpha(theme.palette.primary.main, 0.9)
              : alpha(theme.palette.action.hover, 0.08),
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows[2],
          },
        }}
      >
        {/* 日付番号 */}
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.9rem', md: '1rem' },
            fontWeight: 700,
            lineHeight: 1,
            textAlign: 'left',
            mb: 0.5,
            color: 'inherit',
          }}
        >
          {format(date, 'd')}
        </Typography>

        {/* シフト表示エリア */}
        {shifts.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.25,
              flex: 1,
              overflow: 'hidden',
            }}
          >
            {/* 最初の2つのシフトを表示 */}
            {shifts.slice(0, 2).map((shift, index) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Chip
                  label={shift.workplaceName}
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onShiftClick(shift);
                  }}
                  sx={{
                    height: { xs: 16, md: 20 },
                    fontSize: { xs: '0.6rem', md: '0.7rem' },
                    fontWeight: 500,
                    width: '100%',
                    backgroundColor:
                      shift.status === 'confirmed'
                        ? alpha(theme.palette.success.main, 0.8)
                        : alpha(theme.palette.warning.main, 0.8),
                    color: 'white',
                    '& .MuiChip-label': {
                      px: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                    '&:hover': {
                      backgroundColor:
                        shift.status === 'confirmed'
                          ? theme.palette.success.main
                          : theme.palette.warning.main,
                      transform: 'scale(1.02)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
              </motion.div>
            ))}

            {/* 追加シフトのインジケーター */}
            {shifts.length > 2 && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '0.6rem', md: '0.65rem' },
                  color: isSelected
                    ? 'rgba(255,255,255,0.8)'
                    : theme.palette.text.secondary,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                +{shifts.length - 2}{t('calendar.items', '件')}
              </Typography>
            )}
          </Box>
        )}

        {/* 収入表示 */}
        {totalEarnings > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: { xs: '0.6rem', md: '0.7rem' },
                fontWeight: 600,
                color: isSelected
                  ? 'rgba(255,255,255,0.9)'
                  : theme.palette.success.main,
                textAlign: 'center',
                display: 'block',
              }}
            >
              {formatCurrency(totalEarnings).replace('￥', '¥')}
            </Typography>
          </Box>
        )}

        {/* 今日のマーカー */}
        {isToday && !isSelected && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
                '50%': {
                  transform: 'scale(1.2)',
                  opacity: 0.7,
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          />
        )}

        {/* 選択時のオーバーレイ */}
        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
              zIndex: -1,
            }}
          />
        )}
      </Box>
    </motion.div>
  );
};
