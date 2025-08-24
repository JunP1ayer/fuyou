// 日付タップ時のイベントタイプ選択ダイアログ
import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  ButtonBase,
  IconButton,
} from '@mui/material';
import {
  Work,
  Event,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DateEventTypeSelectorProps {
  open: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onSelectShift: () => void;
  onSelectPersonal: () => void;
}

export const DateEventTypeSelector: React.FC<DateEventTypeSelectorProps> = ({
  open,
  selectedDate,
  onClose,
  onSelectShift,
  onSelectPersonal,
}) => {
  // 日付のフォーマット
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'M月d日(E)', { locale: ja });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-end',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: '16px 16px 0 0',
          maxHeight: '50vh',
          margin: 0,
          marginBottom: 0,
          width: '100%',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
        }
      }}
      TransitionProps={{
        timeout: 300,
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* ハンドルバー */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          py: 1,
        }}>
          <Box sx={{
            width: 40,
            height: 4,
            backgroundColor: 'grey.300',
            borderRadius: 2,
          }} />
        </Box>

        {/* ヘッダー */}
        <Box sx={{ 
          px: 2, 
          py: 1.5, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          textAlign: 'center',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {selectedDate && formatDateHeader(selectedDate)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            予定の種類を選択してください
          </Typography>
        </Box>

        {/* 選択ボタン */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* シフト選択 */}
          <ButtonBase
            onClick={onSelectShift}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#38bdf8',
                bgcolor: 'rgba(56, 189, 248, 0.05)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Work sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                シフト
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                勤務予定やバイトのシフトを登録
              </Typography>
            </Box>
          </ButtonBase>

          {/* 個人予定選択 */}
          <ButtonBase
            onClick={onSelectPersonal}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#10b981',
                bgcolor: 'rgba(16, 185, 129, 0.05)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Event sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                個人予定
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                プライベートや学校の予定を登録
              </Typography>
            </Box>
          </ButtonBase>
        </Box>

        {/* フッター */}
        <Box sx={{ 
          px: 2, 
          py: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <KeyboardArrowDown />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};