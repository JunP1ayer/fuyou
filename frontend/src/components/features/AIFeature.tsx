import React from 'react';
import { Box } from '@mui/material';

import { OCRShiftManager } from '../OCRShiftManager';
import type { CreateShiftData } from '../../types/shift';

interface AIFeatureProps {
  onShiftsSaved?: (shifts: CreateShiftData[]) => void;
}

export const AIFeature: React.FC<AIFeatureProps> = ({ onShiftsSaved }) => {
  return (
    <Box sx={{ maxWidth: { xs: '100%', sm: '600px' }, mx: 'auto' }}>
      <OCRShiftManager
        onShiftsSaved={onShiftsSaved}
        onComplete={() => console.log('シフト提出完了')}
      />
    </Box>
  );
};
