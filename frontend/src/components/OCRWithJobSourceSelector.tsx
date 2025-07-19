import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Fade,
  Paper,
  Divider,
} from '@mui/material';
import {
  Work as WorkIcon,
  CloudUpload as CloudUploadIcon,
  Psychology as PsychologyIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import JobSourceSelector, { JobSource } from './JobSourceSelector';
import { OCRShiftManager } from './OCRShiftManager';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';

interface OCRWithJobSourceSelectorProps {
  onShiftsCreated?: (shifts: any[]) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export default function OCRWithJobSourceSelector({
  onShiftsCreated,
  onError,
  onClose,
}: OCRWithJobSourceSelectorProps) {
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedJobSource, setSelectedJobSource] = useState<JobSource | null>(null);
  const [showOCR, setShowOCR] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    {
      label: 'バイト先選択',
      description: 'シフト表の対象バイト先を選択してください',
      icon: <WorkIcon />,
    },
    {
      label: 'OCR処理',
      description: 'シフト表の画像を解析します',
      icon: <PsychologyIcon />,
    },
  ];

  const handleJobSourceSelect = (jobSource: JobSource | null) => {
    setSelectedJobSource(jobSource);
    if (jobSource) {
      setError(null);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0 && selectedJobSource) {
      setCurrentStep(1);
      setShowOCR(true);
    }
  };

  const handleBackStep = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
      setShowOCR(false);
    }
  };

  const handleShiftsSaved = async (shifts: any[]) => {
    if (!selectedJobSource) {
      setError('バイト先が選択されていません');
      return;
    }

    try {
      // シフトデータにバイト先情報を追加
      const shiftsWithJobSource = shifts.map(shift => ({
        ...shift,
        jobSourceId: selectedJobSource.id,
        jobSourceName: selectedJobSource.name,
        hourlyRate: shift.hourlyRate || selectedJobSource.hourly_rate || 1000,
      }));

      // シフトを一括保存
      if (token) {
        await apiService.createBulkShifts(token, shiftsWithJobSource);
      }

      if (onShiftsCreated) {
        onShiftsCreated(shiftsWithJobSource);
      }

      // 成功時の処理
      setError(null);
    } catch (error: any) {
      const errorMessage = 'シフトの保存に失敗しました: ' + (error.message || 'Unknown error');
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleOCRError = (errorMessage: string) => {
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  if (showOCR && selectedJobSource) {
    return (
      <Box sx={{ width: '100%' }}>
        {/* ヘッダー */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                シフト表OCR処理 - {selectedJobSource.name}
              </Typography>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBackStep}
                variant="outlined"
                size="small"
              >
                バイト先を変更
              </Button>
            </Box>
            
            <Stepper activeStep={currentStep} sx={{ mt: 2 }}>
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel icon={step.icon}>
                    <Typography variant="body2">{step.label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* OCRコンポーネント */}
        <OCRShiftManager
          onShiftsSaved={handleShiftsSaved}
          onError={handleOCRError}
          onClose={onClose}
          compactMode={false}
          autoNavigateToShifts={true}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            シフト表OCR - バイト先選択
          </Typography>
          <Typography variant="body2" color="text.secondary">
            シフト表の画像を解析する前に、対象のバイト先を選択してください
          </Typography>
          
          <Stepper activeStep={currentStep} sx={{ mt: 3 }}>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel icon={step.icon}>
                  <Typography variant="body2">{step.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* バイト先選択 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            バイト先を選択
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            シフト表の対象となるバイト先を選択してください。新しいバイト先がない場合は「新規」ボタンから追加できます。
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <JobSourceSelector
            selectedJobSourceId={selectedJobSource?.id}
            onJobSourceSelect={handleJobSourceSelect}
            showAddButton={true}
            required={true}
            label="シフト表の対象バイト先"
          />

          {/* アクションボタン */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={onClose}
              variant="outlined"
            >
              キャンセル
            </Button>
            
            <Button
              onClick={handleNextStep}
              disabled={!selectedJobSource}
              variant="contained"
              endIcon={<ArrowForwardIcon />}
            >
              次へ（画像アップロード）
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}