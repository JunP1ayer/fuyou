// 友達機能紹介ダイアログ

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Switch,
  Chip,
  useTheme,
} from '@mui/material';
import {
  People,
  Visibility,
  VisibilityOff,
  Schedule,
  Info,
  ArrowForward,
} from '@mui/icons-material';

interface FriendFeatureIntroDialogProps {
  open: boolean;
  onClose: () => void;
  friendCount: number;
}

export const FriendFeatureIntroDialog: React.FC<FriendFeatureIntroDialogProps> = ({
  open,
  onClose,
  friendCount,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          mx: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
        }}
      >
        <People sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          🎉 友達機能が使えるようになりました！
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2, pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 友達数の表示 */}
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label={`${friendCount}人の友達を追加済み`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.9rem' }}
            />
          </Box>

          {/* 機能説明カード */}
          <Card sx={{ bgcolor: 'background.default', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule sx={{ color: 'primary.main', fontSize: 20 }} />
                友達のシフトを表示できます
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                カレンダーに友達のシフト予定も一緒に表示して、スケジュールを共有できます。
              </Typography>

              {/* スイッチの説明 */}
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  p: 2,
                  border: `2px solid ${theme.palette.primary.main}`,
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    友達のシフト表示
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={true}
                      size="small"
                      color="primary"
                      sx={{
                        '& .MuiSwitch-switchBase': { 
                          padding: '6px',
                        },
                        '& .MuiSwitch-track': {
                          borderRadius: 10,
                          width: 28,
                          height: 16,
                        },
                        '& .MuiSwitch-thumb': {
                          width: 12,
                          height: 12,
                        },
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  カレンダー右上のスイッチで表示をオンオフできます
                </Typography>
                
                {/* 矢印アイコン */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowForward sx={{ color: 'white', fontSize: 14 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 追加の説明 */}
          <Box sx={{ display: 'flex', gap: 1, bgcolor: 'info.light', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'info.main', opacity: 0.1 }}>
            <Info sx={{ color: 'info.main', fontSize: 20, mt: 0.25 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.dark', mb: 0.5 }}>
                プライバシーについて
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                友達のシフト情報は読み取り専用です。編集や削除はできません。
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            fontWeight: 600,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
            },
          }}
        >
          理解しました
        </Button>
      </DialogActions>
    </Dialog>
  );
};