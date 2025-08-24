// 🏢 バイト先選択コンポーネント

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
} from '@mui/material';
import { Business, Add, Edit } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import type { WorkplaceOption } from '../services/gptShiftService';
import { formatCurrency } from '../utils/calculations';
import useI18nStore from '../store/i18nStore';

interface WorkplaceSelectorProps {
  onSelectWorkplace: (workplace: WorkplaceOption) => void;
  selectedWorkplace?: WorkplaceOption | null;
  onRequestAddWorkplace?: () => void;
}

export const WorkplaceSelector: React.FC<WorkplaceSelectorProps> = ({
  onSelectWorkplace,
  selectedWorkplace,
  onRequestAddWorkplace,
}) => {
  const { workplaces } = useSimpleShiftStore();
  const { language } = useI18nStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false); // 互換用（未使用）

  const workplaceOptions: WorkplaceOption[] = workplaces.map(wp => ({
    id: wp.id,
    name: wp.name,
    defaultHourlyRate: wp.defaultHourlyRate,
    color: wp.color,
  }));

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Business sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            バイト先を選択
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          シフトを提出するバイト先を選択してください
        </Typography>

        <Grid container spacing={2}>
          {workplaceOptions.map(workplace => (
            <Grid item xs={12} sm={6} md={4} key={workplace.id}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  variant={
                    selectedWorkplace?.id === workplace.id
                      ? 'outlined'
                      : 'elevation'
                  }
                  sx={{
                    cursor: 'pointer',
                    border:
                      selectedWorkplace?.id === workplace.id
                        ? '2px solid'
                        : '1px solid transparent',
                    borderColor:
                      selectedWorkplace?.id === workplace.id
                        ? 'primary.main'
                        : 'transparent',
                    backgroundColor:
                      selectedWorkplace?.id === workplace.id
                        ? 'primary.light'
                        : 'background.paper',
                    '&:hover': {
                      backgroundColor:
                        selectedWorkplace?.id === workplace.id
                          ? 'primary.light'
                          : 'action.hover',
                    },
                  }}
                  onClick={() => onSelectWorkplace(workplace)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: workplace.color,
                          mr: 1,
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {workplace.name}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      時給: {formatCurrency(workplace.defaultHourlyRate)}
                    </Typography>

                    {selectedWorkplace?.id === workplace.id && (
                      <Chip
                        label="選択中"
                        size="small"
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}

          {/* 追加ボタンは登録画面へ誘導 */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={onRequestAddWorkplace}
            >
              バイト先を登録する
            </Button>
          </Grid>
        </Grid>

        {selectedWorkplace && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: '#bae6fd',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: selectedWorkplace.color,
                  mr: 2,
                }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: '#0c4a6e' }}
                >
                  {selectedWorkplace.name} を選択しました
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#0c4a6e' }}
                >
                  時給: {formatCurrency(selectedWorkplace.defaultHourlyRate)}{' '}
                  でシフト解析を行います
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
      </CardContent>

      {/* 追加ダイアログは廃止（登録画面へ誘導する方針） */}
    </Card>
  );
};
