import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  TextField,
  Button,
  Divider,
  Paper,
  Stack,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  ChevronLeft,
  ChevronRight,
  Settings,
} from '@mui/icons-material';

interface SalaryData {
  monthlyTarget: number;
  currentEarnings: number;
  workingHours: number;
  workplaces: {
    name: string;
    hours: number;
    earnings: number;
  }[];
}

import type { Shift } from '../types/shift';

interface ShiftboardSalaryCardProps {
  compact?: boolean;
  shifts?: Shift[];
}

export function ShiftboardSalaryCard({ compact = false, shifts: _shifts = [] }: ShiftboardSalaryCardProps) {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState(50000);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  // デモデータ
  const salaryData: SalaryData = {
    monthlyTarget: targetAmount,
    currentEarnings: 0,
    workingHours: 0,
    workplaces: [
      { name: '我屋', hours: 0, earnings: 0 },
    ],
  };

  const handleTargetSave = () => {
    setIsEditingTarget(false);
  };

  return (
    <Card sx={{ 
      maxWidth: compact ? 400 : 600, 
      width: '100%',
      borderRadius: 2,
      overflow: 'visible',
    }}>
      <Box sx={{ 
        bgcolor: 'white',
        p: 2,
        borderBottom: '1px solid #e0e0e0',
      }}>
        {/* ヘッダー */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {currentYear}年{currentMonth}月
            </Typography>
            <IconButton size="small">
              <ChevronRight />
            </IconButton>
          </Box>
          <IconButton color="primary">
            <Settings />
          </IconButton>
        </Box>

        {/* 月間目標 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2,
        }}>
          {isEditingTarget ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value) || 0)}
                type="number"
                size="small"
                sx={{ width: 150 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                }}
              />
              <Button 
                variant="contained" 
                size="small"
                onClick={handleTargetSave}
              >
                完了
              </Button>
            </Box>
          ) : (
            <Box 
              onClick={() => setIsEditingTarget(true)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                cursor: 'pointer',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                px: 3,
                py: 1,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              <Typography variant="body2" color="text.secondary">
                月間目標
              </Typography>
              <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                ¥{salaryData.monthlyTarget.toLocaleString()}
              </Typography>
              <Edit fontSize="small" color="action" />
            </Box>
          )}
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* 今日までの給料 */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            今日までの給料
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
            ¥{salaryData.currentEarnings}
          </Typography>
        </Box>

        {/* 青い情報ボックス */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: '#1976d2',
            color: 'white',
            p: 2,
            borderRadius: 2,
            mb: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">
            シフトが終わると、その分の
          </Typography>
          <Typography variant="body2">
            給料が自動計算されます
          </Typography>
        </Paper>

        {/* 統計情報 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              勤務時間
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {salaryData.workingHours}h{Math.round((salaryData.workingHours % 1) * 60)}m
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              給料見込
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              ¥{salaryData.currentEarnings}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 職場別内訳 */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip label="勤務時間" size="small" sx={{ mr: 1 }} />
            <Chip label="給料見込" size="small" sx={{ mr: 1 }} />
            <Chip label="給料実績" size="small" variant="outlined" />
          </Box>

          <Stack spacing={2}>
            {salaryData.workplaces.map((workplace, index) => (
              <Box key={index}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {workplace.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {workplace.hours}h00m
                  </Typography>
                  <Typography variant="body2">
                    ¥{workplace.earnings}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    未入力 ✏️
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="h6" color="text.secondary">
              合計
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {salaryData.workingHours}h00m
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                ¥{salaryData.currentEarnings}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ccc' }}>
                ¥-
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 給料計算の内訳を見るボタン */}
        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 3, py: 1.5 }}
        >
          給料計算の内訳を見る
        </Button>

        {/* 使い方ヒント */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 2,
            px: 2,
          }}
        >
          実際に支払われた給料と給料計算が異なるときは
          <br />
          <Typography 
            component="span" 
            variant="caption" 
            sx={{ color: '#1976d2', textDecoration: 'underline' }}
          >
            使い方
          </Typography>
          をご確認ください
        </Typography>
      </CardContent>
    </Card>
  );
}