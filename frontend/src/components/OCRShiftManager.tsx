import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { CameraAlt } from '@mui/icons-material';

import type { CreateShiftData } from '../types/shift';

interface OCRShiftManagerProps {
  onShiftsSaved?: (shifts: CreateShiftData[]) => void;
  onClose?: () => void;
  onComplete?: (shifts: CreateShiftData[]) => void;
}

// Mock OCRShiftManager component for demo
export const OCRShiftManager: React.FC<OCRShiftManagerProps> = () => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <CameraAlt sx={{ mr: 1 }} />
          <Typography variant="h6">OCRシフト管理</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          OCR機能は開発中です。
        </Typography>
      </CardContent>
    </Card>
  );
};
