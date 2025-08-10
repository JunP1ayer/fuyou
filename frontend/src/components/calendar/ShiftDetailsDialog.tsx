// 📋 FUYOU PRO - シフト詳細ダイアログ

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  AccessTime,
  Payment,
  Business,
  Notes,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import type { Shift } from '@types/index';
import { formatCurrency, formatDuration } from '@/utils/calculations';

interface ShiftDetailsDialogProps {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ShiftDetailsDialog: React.FC<ShiftDetailsDialogProps> = ({
  open,
  shift,
  onClose,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();

  if (!shift) return null;

  const shiftDate = new Date(shift.date);
  const workDuration = formatDuration(shift.actualWorkMinutes);
  const breakDuration = shift.breakMinutes
    ? formatDuration(shift.breakMinutes)
    : 'なし';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* ヘッダー */}
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            シフト詳細
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {format(shiftDate, 'yyyy年M月d日(E)', { locale: ja })}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* メイン情報 */}
        <Box sx={{ p: 3 }}>
          {/* ステータスチップ */}
          <Box sx={{ mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={shift.status === 'confirmed' ? '確定' : '仮'}
              color={shift.status === 'confirmed' ? 'success' : 'warning'}
              sx={{ fontWeight: 600 }}
            />
            {shift.notes && (
              <Chip
                icon={<Notes />}
                label="メモあり"
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          {/* 勤務先情報 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Business sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  勤務先
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {shift.workplaceName}
              </Typography>
            </Box>
          </motion.div>

          <Divider sx={{ my: 2 }} />

          {/* 時間情報 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  勤務時間
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    開始時間
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {shift.startTime}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    終了時間
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {shift.endTime}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    労働時間
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: 'primary.main' }}
                  >
                    {workDuration}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    休憩時間
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {breakDuration}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>

          <Divider sx={{ my: 2 }} />

          {/* 給料情報 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payment sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  給料詳細
                </Typography>
              </Box>

              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'success.main',
                    textAlign: 'center',
                    mb: 1,
                  }}
                >
                  {formatCurrency(shift.totalEarnings)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  時給 {formatCurrency(shift.hourlyRate)} × {workDuration}
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* メモ */}
          {shift.notes && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  メモ
                </Typography>
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderLeft: `4px solid ${theme.palette.info.main}`,
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">{shift.notes}</Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </Box>
      </DialogContent>

      {/* アクションボタン */}
      <DialogActions
        sx={{
          p: 3,
          backgroundColor: alpha(theme.palette.action.hover, 0.02),
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onEdit && (
            <Button
              startIcon={<Edit />}
              variant="outlined"
              onClick={onEdit}
              sx={{ borderRadius: 2 }}
            >
              編集
            </Button>
          )}
          {onDelete && (
            <Button
              startIcon={<Delete />}
              variant="outlined"
              color="error"
              onClick={onDelete}
              sx={{ borderRadius: 2 }}
            >
              削除
            </Button>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            minWidth: 100,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};
