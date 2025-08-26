// 💰 扶養チェックダイアログコンポーネント

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalance,
  School,
  Work,
  TrendingUp,
  CheckCircle,
  Warning,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfileStore, type FuyouCheckResult } from '../store/userProfileStore';

interface FuyouCheckDialogProps {
  open: boolean;
  onClose: () => void;
  isFirstTime?: boolean; // 初回ログイン時かどうか
}

type StepType = 'userType' | 'limits' | 'current' | 'result';

export const FuyouCheckDialog: React.FC<FuyouCheckDialogProps> = ({
  open,
  onClose,
  isFirstTime = false
}) => {
  const { completeFuyouCheck, deferFuyouCheck } = useUserProfileStore();
  
  const [currentStep, setCurrentStep] = useState<StepType>('userType');
  const [formData, setFormData] = useState({
    userType: '' as 'student' | 'worker' | '',
    age: '',
    selectedLimit: 103 as 103 | 130 | 150,
    currentYearEarnings: '',
    previousMonthEarnings: '',
  });

  const steps = [
    { id: 'userType', label: '基本情報' },
    { id: 'limits', label: '扶養限度額' },
    { id: 'current', label: '現在の収入' },
    { id: 'result', label: '結果' },
  ];

  const stepIndex = steps.findIndex(s => s.id === currentStep);

  // 計算ロジック
  const calculateResult = (): FuyouCheckResult => {
    const yearEarnings = parseFloat(formData.currentYearEarnings) || 0;
    const monthEarnings = parseFloat(formData.previousMonthEarnings) || 0;
    const limitAmount = formData.selectedLimit * 10000; // 万円を円に変換
    
    const remainingAmount = Math.max(0, limitAmount - yearEarnings);
    const remainingMonths = 12 - (new Date().getMonth() + 1); // 残り月数
    const monthlyLimit = remainingMonths > 0 ? remainingAmount / remainingMonths : 0;
    
    let riskLevel: 'safe' | 'warning' | 'danger' = 'safe';
    if (yearEarnings > limitAmount * 0.9) riskLevel = 'danger';
    else if (yearEarnings > limitAmount * 0.7) riskLevel = 'warning';
    
    return {
      userType: formData.userType as 'student' | 'worker',
      age: parseInt(formData.age) || 20,
      selectedLimit: formData.selectedLimit,
      currentYearEarnings: yearEarnings,
      previousMonthEarnings: monthEarnings,
      remainingAmount,
      riskLevel,
      monthlyRecommendedLimit: monthlyLimit,
      checkedAt: new Date().toISOString(),
      isValid: true,
    };
  };

  // ステップ進む
  const handleNext = () => {
    const nextSteps: Record<StepType, StepType> = {
      userType: 'limits',
      limits: 'current',
      current: 'result',
      result: 'result',
    };
    setCurrentStep(nextSteps[currentStep]);
  };

  // ステップ戻る
  const handleBack = () => {
    const prevSteps: Record<StepType, StepType> = {
      userType: 'userType',
      limits: 'userType',
      current: 'limits',
      result: 'current',
    };
    setCurrentStep(prevSteps[currentStep]);
  };

  // 完了処理
  const handleComplete = () => {
    const result = calculateResult();
    completeFuyouCheck(result);
    onClose();
  };

  // 後で実行（初回ログイン時のみ）
  const handleDefer = () => {
    if (isFirstTime) {
      deferFuyouCheck();
    }
    onClose();
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 'userType':
        return !formData.userType || !formData.age;
      case 'limits':
        return !formData.selectedLimit;
      case 'current':
        return !formData.currentYearEarnings;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'userType':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              👤 あなたの状況を教えてください
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                職業・学生区分
              </Typography>
              <RadioGroup
                value={formData.userType}
                onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as 'student' | 'worker' }))}
              >
                <FormControlLabel
                  value="student"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School color="primary" />
                      <Box>
                        <Typography variant="body1">学生</Typography>
                        <Typography variant="caption" color="text.secondary">
                          大学生・専門学生など
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="worker"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work color="primary" />
                      <Box>
                        <Typography variant="body1">社会人・フリーター</Typography>
                        <Typography variant="caption" color="text.secondary">
                          扶養範囲内で働いている方
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="年齢"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              placeholder="20"
              inputProps={{ min: 15, max: 65 }}
            />
          </Box>
        );

      case 'limits':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              💰 扶養限度額を選択してください
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { 
                  value: 103, 
                  title: '103万円の壁', 
                  desc: '所得税がかからない基本ライン',
                  recommended: formData.userType === 'student' 
                },
                { 
                  value: 130, 
                  title: '130万円の壁', 
                  desc: '社会保険の扶養から外れるライン',
                  recommended: false
                },
                { 
                  value: 150, 
                  title: '150万円の壁', 
                  desc: '2025年新制度：学生特例',
                  recommended: formData.userType === 'student'
                },
              ].map((option) => (
                <Card
                  key={option.value}
                  sx={{
                    cursor: 'pointer',
                    border: formData.selectedLimit === option.value ? '2px solid' : '1px solid',
                    borderColor: formData.selectedLimit === option.value ? 'primary.main' : 'divider',
                    backgroundColor: formData.selectedLimit === option.value ? 'primary.lighter' : 'background.paper',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, selectedLimit: option.value as 103 | 130 | 150 }))}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {option.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.desc}
                        </Typography>
                      </Box>
                      {option.recommended && (
                        <Chip label="おすすめ" color="primary" size="small" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      case 'current':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              📊 現在の収入状況
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="今年の収入合計（円）"
                value={formData.currentYearEarnings}
                onChange={(e) => setFormData(prev => ({ ...prev, currentYearEarnings: e.target.value }))}
                placeholder="500000"
                helperText="1月からの合計収入を入力してください"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="先月の収入（円）"
                value={formData.previousMonthEarnings}
                onChange={(e) => setFormData(prev => ({ ...prev, previousMonthEarnings: e.target.value }))}
                placeholder="80000"
                helperText="前月の収入（予測計算に使用）"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
              />
            </Box>
          </Box>
        );

      case 'result':
        const result = calculateResult();
        const progressPercentage = (result.currentYearEarnings / (result.selectedLimit * 10000)) * 100;
        
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
              📈 扶養チェック結果
            </Typography>
            
            {/* 進捗表示 */}
            <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${
              result.riskLevel === 'safe' ? '#e8f5e8' : 
              result.riskLevel === 'warning' ? '#fff3e0' : '#ffebee'
            }, ${
              result.riskLevel === 'safe' ? '#f1f8e9' : 
              result.riskLevel === 'warning' ? '#fce4ec' : '#ffcdd2'
            })` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {result.riskLevel === 'safe' && <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />}
                  {result.riskLevel === 'warning' && <Warning sx={{ color: 'warning.main', fontSize: 32 }} />}
                  {result.riskLevel === 'danger' && <Warning sx={{ color: 'error.main', fontSize: 32 }} />}
                  
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      ¥{result.remainingAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      あと稼げる金額
                    </Typography>
                  </Box>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progressPercentage, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: result.riskLevel === 'safe' ? 'success.main' : 
                              result.riskLevel === 'warning' ? 'warning.main' : 'error.main',
                    },
                  }}
                />
                
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  {result.selectedLimit}万円中 {(result.currentYearEarnings / 10000).toFixed(0)}万円使用 
                  ({progressPercentage.toFixed(0)}%)
                </Typography>
              </CardContent>
            </Card>

            {/* 推奨月額 */}
            <Alert 
              severity={result.riskLevel === 'safe' ? 'success' : result.riskLevel === 'warning' ? 'warning' : 'error'}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>月間推奨上限: ¥{result.monthlyRecommendedLimit.toLocaleString()}</strong>
                <br />
                {result.riskLevel === 'safe' && '余裕があります！このペースなら安心です。'}
                {result.riskLevel === 'warning' && '注意が必要です。ペースを調整しましょう。'}
                {result.riskLevel === 'danger' && '危険です！今月の収入を調整してください。'}
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isFirstTime ? handleDefer : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: 500 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isFirstTime ? '📝 扶養チェック（初回設定）' : '📝 扶養チェック'}
            </Typography>
          </Box>
          {!isFirstTime && (
            <Button onClick={onClose} size="small" sx={{ minWidth: 'auto', p: 0.5 }}>
              <Close />
            </Button>
          )}
        </Box>
        
        {/* ステッパー */}
        <Stepper activeStep={stepIndex} sx={{ mt: 2 }}>
          {steps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
        {isFirstTime && currentStep === 'userType' && (
          <Button onClick={handleDefer} color="inherit">
            後で設定する
          </Button>
        )}
        
        {currentStep !== 'userType' && (
          <Button onClick={handleBack} color="inherit">
            戻る
          </Button>
        )}
        
        <Box sx={{ flex: 1 }} />
        
        {currentStep !== 'result' ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={isNextDisabled()}
            sx={{ minWidth: 100 }}
          >
            次へ
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            variant="contained"
            color="success"
            sx={{ minWidth: 120 }}
          >
            完了
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};