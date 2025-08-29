// 🤖 GPT-5 シフト表提出フロー - プロフェッショナル版

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Grid,
} from '@mui/material';
import {
  Upload,
  AutoAwesome,
  Visibility,
  Edit,
  Check,
  Error as ErrorIcon,
  Info,
  CalendarMonth,
  Business,
  Person,
  Schedule,
  ArrowBack,
  Send,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimpleShiftStore } from '../store/simpleShiftStore';
import { useCalendarStore } from '../store/calendarStore';

// 型定義
interface ShiftData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  confidence: number;
  workplaceName: string;
  hourlyRate: number;
}

interface GPT5AnalysisResult {
  success: boolean;
  analysis: {
    detectedWorkerName: string;
    workplaceDetected: string;
    totalShiftsFound: number;
  };
  shifts: Array<{
    date: string;
    startTime: string;
    endTime: string;
    confidence: number;
  }>;
  warnings: string[];
  processingNotes: string;
}

const STEPS = ['情報入力', 'AI解析', '結果確認', 'カレンダー反映'];

interface GPT5ShiftSubmissionFlowProps {
  onClose?: () => void;
}

export const GPT5ShiftSubmissionFlow: React.FC<GPT5ShiftSubmissionFlowProps> = ({ onClose }) => {
  const { workplaces, addShift } = useSimpleShiftStore();
  const { importFromShifts } = useCalendarStore();
  
  // State管理
  const [activeStep, setActiveStep] = useState(0);
  const [selectedWorkplace, setSelectedWorkplace] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GPT5AnalysisResult | null>(null);
  const [extractedShifts, setExtractedShifts] = useState<ShiftData[]>([]);
  const [editingShift, setEditingShift] = useState<ShiftData | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 選択された職場の詳細取得
  const workplace = workplaces.find(w => w.id === selectedWorkplace);

  // ファイル選択処理
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイル形式検証
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors({ file: '対応していないファイル形式です。PNG、JPG、WebP、PDFのみ対応しています。' });
      return;
    }

    // ファイルサイズ検証（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ file: 'ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。' });
      return;
    }

    setSelectedFile(file);
    setErrors({});
  }, []);

  // バリデーション
  const validateStep1 = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    
    if (!selectedWorkplace) {
      newErrors.workplace = 'バイト先を選択してください';
    }
    if (!workerName.trim()) {
      newErrors.workerName = 'あなたの名前を入力してください';
    }
    if (!selectedFile) {
      newErrors.file = 'シフト表ファイルを選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedWorkplace, workerName, selectedFile]);

  // GPT-5解析実行
  const executeGPT5Analysis = useCallback(async () => {
    if (!selectedFile || !workplace) return;

    setIsAnalyzing(true);
    setActiveStep(1);
    
    try {
      // Base64変換
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result && (result.startsWith('data:image/') || result.startsWith('data:application/pdf'))) {
            resolve(result);
          } else {
            reject(new Error('ファイルの読み込みに失敗しました'));
          }
        };
        reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
        reader.readAsDataURL(selectedFile);
      });

      // GPT-5 API呼び出し（ローカル・プロダクション対応）
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/gpt5-shift-analyzer'
        : 'https://fuyou-sigma.vercel.app/api/gpt5-shift-analyzer';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          workerName: workerName.trim(),
          workplaceName: workplace.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: GPT5AnalysisResult = await response.json();
      
      if (!result.success) {
        throw new Error(result.processingNotes || 'GPT-5解析に失敗しました');
      }

      // シフトデータの変換・拡張
      const processedShifts: ShiftData[] = result.shifts.map((shift, index) => ({
        id: `gpt5-${Date.now()}-${index}`,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        confidence: shift.confidence,
        workplaceName: result.analysis.workplaceDetected || workplace.name,
        hourlyRate: workplace.defaultHourlyRate || 1000,
      }));

      setAnalysisResult(result);
      setExtractedShifts(processedShifts);
      setActiveStep(2);
      
    } catch (error: any) {
      console.error('GPT-5 Analysis Error:', error);
      const errorMessage = error?.message || 'AI解析でエラーが発生しました';
      setErrors({ analysis: errorMessage });
      setActiveStep(0);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, workplace, workerName]);

  // シフト編集
  const handleEditShift = useCallback((shift: ShiftData) => {
    setEditingShift({ ...shift });
  }, []);

  const handleSaveShift = useCallback(() => {
    if (!editingShift) return;
    
    setExtractedShifts(prev => 
      prev.map(shift => shift.id === editingShift.id ? editingShift : shift)
    );
    setEditingShift(null);
  }, [editingShift]);

  // カレンダー反映
  const handleConfirmToCalendar = useCallback(() => {
    if (!extractedShifts.length) return;

    // シフトストアに追加
    extractedShifts.forEach(shift => {
      const startTime = new Date(`2024-01-01T${shift.startTime}`);
      const endTime = new Date(`2024-01-01T${shift.endTime}`);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const totalEarnings = Math.round(hours * shift.hourlyRate);

      addShift({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workplaceName: shift.workplaceName,
        hourlyRate: shift.hourlyRate,
        totalEarnings,
        status: 'confirmed',
      });
    });

    // カレンダーにインポート
    importFromShifts(extractedShifts.map(s => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      workplaceName: s.workplaceName,
      hourlyRate: s.hourlyRate,
      totalEarnings: 0, // 後で計算
    })));

    setActiveStep(3);
    setTimeout(() => {
      // リセット
      setActiveStep(0);
      setSelectedWorkplace('');
      setWorkerName('');
      setSelectedFile(null);
      setAnalysisResult(null);
      setExtractedShifts([]);
    }, 2000);
  }, [extractedShifts, addShift, importFromShifts]);

  // 信頼度による色分け
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* コンパクトヘッダー */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', mb: 2, py: 1 }}>
        <Send sx={{ color: 'primary.main', fontSize: 20, mb: 0.5 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
          シフト登録
        </Typography>
        <Box 
          sx={{ 
            width: '100%', 
            height: 1, 
            backgroundColor: 'primary.main',
            borderRadius: 0.5,
            maxWidth: 200,
            mx: 'auto'
          }} 
        />
      </Box>


      {/* メインコンテンツエリア - 残りの高さを使用 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>

      <AnimatePresence mode="wait">
        {/* Step 1: 情報入力 */}
        {activeStep === 0 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '1.1rem',
                    color: 'primary.main',
                    fontWeight: 600
                  }}>
                    <Send sx={{ mr: 1, color: 'primary.main' }} />
                    シフト表を提出
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.workplace} size="small">
                      <InputLabel>バイト先</InputLabel>
                      <Select
                        value={selectedWorkplace}
                        onChange={(e) => setSelectedWorkplace(e.target.value)}
                        startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        {workplaces.map((wp) => (
                          <MenuItem key={wp.id} value={wp.id}>
                            {wp.name} (時給: ¥{wp.defaultHourlyRate})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.workplace && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {errors.workplace}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="あなたの名前"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      error={!!errors.workerName}
                      helperText={errors.workerName}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      placeholder="例: 田中太郎"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Button
                        component="label"
                        variant="contained"
                        size="large"
                        startIcon={<Upload />}
                        sx={{ 
                          mb: 1,
                          px: 3,
                          py: 1.5
                        }}
                      >
                        シフト表を選択
                        <input
                          type="file"
                          hidden
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                        />
                      </Button>
                      
                      {selectedFile && (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            icon={<Check />}
                            label={`選択: ${selectedFile.name}`}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      )}
                      
                      {errors.file && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {errors.file}
                        </Alert>
                      )}
                      
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                        PNG, JPG, WebP, PDF対応（最大10MB）
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      if (validateStep1()) {
                        executeGPT5Analysis();
                      }
                    }}
                    disabled={!selectedWorkplace || !workerName.trim() || !selectedFile}
                    sx={{
                      px: 3,
                      py: 1.5,
                      backgroundColor: '#2196F3',
                      '&:hover': {
                        backgroundColor: '#1976D2',
                      }
                    }}
                  >
                    シフト表を提出
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: AI解析中 */}
        {activeStep === 1 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <AutoAwesome sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  AIがシフト表を解析中...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  最新のAI技術でシフト情報を正確に抽出しています
                </Typography>
                <LinearProgress sx={{ mb: 1, height: 6, borderRadius: 3 }} />
                <Typography variant="caption" color="text.secondary">
                  通常15〜30秒程度で完了します
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: 結果確認 */}
        {activeStep === 2 && analysisResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={2}>
              {/* 左側: 解析結果サマリー */}
              <Grid item xs={12} lg={5}>
                <Card sx={{ height: 'fit-content' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontSize: '1.1rem' }}>
                      <Visibility sx={{ mr: 1 }} />
                      AI 解析結果
                    </Typography>

                    {/* コンパクトサマリー */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'info.light' }}>
                          <Schedule sx={{ color: 'info.contrastText', fontSize: '1.2rem' }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.contrastText', fontSize: '1.5rem' }}>
                            {analysisResult.analysis.totalShiftsFound}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'info.contrastText' }}>
                            シフト
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.light' }}>
                          <Person sx={{ color: 'success.contrastText', fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.contrastText' }}>
                            {analysisResult.analysis.detectedWorkerName || '未検出'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'success.contrastText' }}>
                            作業者
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'warning.light' }}>
                          <Business sx={{ color: 'warning.contrastText', fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.contrastText' }}>
                            {analysisResult.analysis.workplaceDetected || '未検出'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'warning.contrastText' }}>
                            職場
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* 警告表示 */}
                    {analysisResult.warnings.length > 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>注意事項:</Typography>
                        {analysisResult.warnings.map((warning, index) => (
                          <Typography key={index} variant="caption" display="block">• {warning}</Typography>
                        ))}
                      </Alert>
                    )}

                    {/* アクションボタン */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setActiveStep(0)}
                        sx={{ flex: 1 }}
                      >
                        最初に戻る
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CalendarMonth />}
                        onClick={handleConfirmToCalendar}
                        disabled={extractedShifts.length === 0}
                        sx={{
                          flex: 2,
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                          }
                        }}
                      >
                        {extractedShifts.length}件追加
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 右側: シフト一覧 */}
              <Grid item xs={12} lg={7}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>
                      抽出されたシフト一覧
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ py: 1 }}>日付</TableCell>
                            <TableCell sx={{ py: 1 }}>時間</TableCell>
                            <TableCell sx={{ py: 1 }}>信頼度</TableCell>
                            <TableCell align="center" sx={{ py: 1 }}>操作</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {extractedShifts.map((shift) => (
                            <TableRow key={shift.id} hover>
                              <TableCell sx={{ py: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                  {new Date(shift.date).toLocaleDateString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                    weekday: 'short'
                                  })}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                  {shift.startTime} - {shift.endTime}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1 }}>
                                <Chip
                                  label={`${Math.round(shift.confidence * 100)}%`}
                                  color={getConfidenceColor(shift.confidence) as any}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </TableCell>
                              <TableCell align="center" sx={{ py: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditShift(shift)}
                                  sx={{ p: 0.5 }}
                                >
                                  <Edit sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* Step 4: 完了 */}
        {activeStep === 3 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Check sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  カレンダーに反映完了！
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AIで解析したシフトデータがカレンダーに正常に追加されました
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      </Box> {/* メインコンテンツエリア終了 */}

      {/* シフト編集ダイアログ */}
      <Dialog
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ py: 2 }}>シフト編集</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          {editingShift && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="日付"
                type="date"
                value={editingShift.date}
                onChange={(e) => setEditingShift(prev => prev ? { ...prev, date: e.target.value } : null)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="開始時間"
                    type="time"
                    value={editingShift.startTime}
                    onChange={(e) => setEditingShift(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="終了時間"
                    type="time"
                    value={editingShift.endTime}
                    onChange={(e) => setEditingShift(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ py: 2 }}>
          <Button size="small" onClick={() => setEditingShift(null)}>キャンセル</Button>
          <Button size="small" onClick={handleSaveShift} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};