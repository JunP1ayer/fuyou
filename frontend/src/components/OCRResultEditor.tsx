import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Autocomplete,
  InputAdornment,
  Tooltip,
  Badge,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
  ExpandMore,
  Edit,
  Save,
  Cancel,
  Add,
  Delete,
  Visibility,
  VisibilityOff,
  AutoAwesome,
  Schedule,
  DateRange,
  AttachMoney,
  LocationOn,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { format } from '../utils/dateUtils';
import type { OCRResponse, ExtractedShiftData } from '../types/ocr';
import type { CreateShiftData } from '../types/shift';

interface OCRResultEditorProps {
  ocrResult: OCRResponse;
  originalImage: string;
  onSave?: (shifts: CreateShiftData[]) => void;
  onCancel?: () => void;
  onEditComplete?: (editedShifts: ExtractedShiftData[]) => void;
}

interface ParsedShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  location: string;
  confidence: number;
  edited: boolean;
  source: 'auto' | 'manual';
}

const COMMON_LOCATIONS = [
  '本店',
  '駅前店',
  '新宿店',
  '渋谷店',
  '池袋店',
  '中央店',
  '南口店',
  '北口店',
  '西口店',
  '東口店',
];

const COMMON_HOURLY_RATES = [900, 950, 1000, 1100, 1200, 1300, 1400, 1500];

export const OCRResultEditor: React.FC<OCRResultEditorProps> = ({
  ocrResult,
  originalImage,
  onSave,
  onCancel,
  onEditComplete,
}) => {
  const [extractedText, setExtractedText] = useState(
    ocrResult.data?.extractedText || ''
  );
  const [parsedShifts, setParsedShifts] = useState<ParsedShift[]>([]);
  const [editingShift, setEditingShift] = useState<string | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [autoParseEnabled, setAutoParseEnabled] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // 初期解析
  useEffect(() => {
    if (autoParseEnabled && extractedText) {
      parseShiftsFromText(extractedText);
    }
  }, [extractedText, autoParseEnabled]);

  // テキストからシフトデータを解析
  const parseShiftsFromText = (text: string) => {
    try {
      const shifts: ParsedShift[] = [];
      const lines = text.split('\n').filter(line => line.trim());

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 日付パターンの検出
        const dateMatch = line.match(
          /(\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}日)/
        );
        if (dateMatch) {
          const timeMatch = line.match(
            /(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/
          );
          const rateMatch = line.match(/(\d{3,4})円/);
          const locationMatch = line.match(
            /(店|支店|本店|駅前|新宿|渋谷|池袋|中央|南口|北口|西口|東口)/
          );

          if (timeMatch) {
            const shift: ParsedShift = {
              id: `shift-${Date.now()}-${i}`,
              date: normalizeDateString(dateMatch[0]),
              startTime: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
              endTime: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`,
              hourlyRate: rateMatch ? parseInt(rateMatch[1]) : 1000,
              location: locationMatch ? locationMatch[0] : '本店',
              confidence: calculateConfidence(
                dateMatch[0],
                timeMatch[0],
                rateMatch?.[0]
              ),
              edited: false,
              source: 'auto',
            };
            shifts.push(shift);
          }
        }
      }

      setParsedShifts(shifts);
      setParseError(null);
    } catch (error) {
      setParseError('テキストの解析に失敗しました');
    }
  };

  // 日付文字列の正規化
  const normalizeDateString = (dateStr: string): string => {
    const currentYear = new Date().getFullYear();

    if (dateStr.includes('/')) {
      const [month, day] = dateStr.split('/');
      return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (dateStr.includes('-')) {
      return dateStr;
    } else if (dateStr.includes('日')) {
      const day = dateStr.replace('日', '');
      const currentMonth = new Date().getMonth() + 1;
      return `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return dateStr;
  };

  // 信頼度の計算
  const calculateConfidence = (
    dateStr: string,
    timeStr: string,
    rateStr?: string
  ): number => {
    let confidence = 0.5;

    if (dateStr.match(/\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}-\d{1,2}/))
      confidence += 0.2;
    if (timeStr.match(/\d{1,2}:\d{2}\s*[-~]\s*\d{1,2}:\d{2}/))
      confidence += 0.2;
    if (rateStr) confidence += 0.1;

    return Math.min(confidence, 1.0);
  };

  // シフトの編集
  const handleEditShift = (shiftId: string, updates: Partial<ParsedShift>) => {
    setParsedShifts(prev =>
      prev.map(shift =>
        shift.id === shiftId ? { ...shift, ...updates, edited: true } : shift
      )
    );
    validateShift(shiftId, updates);
  };

  // バリデーション
  const validateShift = (shiftId: string, shift: Partial<ParsedShift>) => {
    const errors: Record<string, string> = {};

    if (shift.date && !isValidDate(shift.date)) {
      errors[`${shiftId}-date`] = '有効な日付を入力してください';
    }

    if (shift.startTime && shift.endTime && shift.startTime >= shift.endTime) {
      errors[`${shiftId}-time`] = '終了時間は開始時間より後に設定してください';
    }

    if (shift.hourlyRate && shift.hourlyRate < 800) {
      errors[`${shiftId}-rate`] = '時給は800円以上を設定してください';
    }

    setValidationErrors(prev => ({ ...prev, ...errors }));
  };

  // 日付の妥当性チェック
  const isValidDate = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && !!dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  };

  // 新しいシフトの追加
  const addNewShift = () => {
    const newShift: ParsedShift = {
      id: `shift-${Date.now()}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: 1000,
      location: '本店',
      confidence: 0,
      edited: false,
      source: 'manual',
    };
    setParsedShifts(prev => [...prev, newShift]);
    setEditingShift(newShift.id);
  };

  // シフトの削除
  const removeShift = (shiftId: string) => {
    setParsedShifts(prev => prev.filter(shift => shift.id !== shiftId));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(shiftId)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  // 保存処理
  const handleSave = () => {
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const shifts: CreateShiftData[] = parsedShifts.map(shift => ({
      jobSourceName: shift.location,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      hourlyRate: shift.hourlyRate,
      breakMinutes: 60, // デフォルト60分
      description: `OCR自動登録 (信頼度: ${Math.round(shift.confidence * 100)}%)`,
      isConfirmed: shift.confidence > 0.8,
    }));

    onSave?.(shifts);
    onEditComplete?.(
      parsedShifts.map(shift => ({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        hourlyRate: shift.hourlyRate,
        location: shift.location,
        confidence: shift.confidence,
      }))
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <Box>
      <Grid2 container spacing={3}>
        {/* 左側: 画像表示 */}
        <Grid2 xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">元画像</Typography>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showOriginalImage}
                        onChange={e => setShowOriginalImage(e.target.checked)}
                      />
                    }
                    label="画像表示"
                  />
                  {ocrResult.data?.boundingBoxes && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showBoundingBoxes}
                          onChange={e => setShowBoundingBoxes(e.target.checked)}
                        />
                      }
                      label="境界線表示"
                    />
                  )}
                </Box>
              </Box>

              {showOriginalImage && (
                <Box position="relative">
                  <CardMedia
                    component="img"
                    image={originalImage}
                    alt="OCR処理済み画像"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />

                  {/* 境界ボックスのオーバーレイ */}
                  {showBoundingBoxes && ocrResult.data?.boundingBoxes && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      width="100%"
                      height="100%"
                    >
                      {ocrResult.data.boundingBoxes.map((box, index) => (
                        <Tooltip
                          key={index}
                          title={`${box.text} (${Math.round(box.confidence * 100)}%)`}
                        >
                          <Box
                            position="absolute"
                            border="2px solid"
                            borderColor="primary.main"
                            bgcolor="primary.main"
                            sx={{
                              opacity: 0.3,
                              left: `${Math.min(...box.vertices.map(v => v.x))}px`,
                              top: `${Math.min(...box.vertices.map(v => v.y))}px`,
                              width: `${Math.max(...box.vertices.map(v => v.x)) - Math.min(...box.vertices.map(v => v.x))}px`,
                              height: `${Math.max(...box.vertices.map(v => v.y)) - Math.min(...box.vertices.map(v => v.y))}px`,
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>

        {/* 右側: テキストとシフト編集 */}
        <Grid2 xs={12} md={6}>
          {/* 抽出テキスト */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                抽出テキスト
              </Typography>
              <TextField
                multiline
                rows={6}
                fullWidth
                value={extractedText}
                onChange={e => setExtractedText(e.target.value)}
                placeholder="抽出されたテキストを編集できます"
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  onClick={() => parseShiftsFromText(extractedText)}
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  size="small"
                >
                  再解析
                </Button>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoParseEnabled}
                      onChange={e => setAutoParseEnabled(e.target.checked)}
                    />
                  }
                  label="自動解析"
                />
              </Box>
            </CardContent>
          </Card>

          {/* 解析エラー */}
          {parseError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {parseError}
            </Alert>
          )}

          {/* 検証エラー */}
          {hasValidationErrors && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              入力内容に問題があります。修正してから保存してください。
            </Alert>
          )}

          {/* 解析されたシフト */}
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">
                  解析されたシフト
                  <Badge
                    badgeContent={parsedShifts.length}
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Button
                  onClick={addNewShift}
                  variant="outlined"
                  startIcon={<Add />}
                  size="small"
                >
                  シフト追加
                </Button>
              </Box>

              {parsedShifts.length === 0 ? (
                <Alert severity="info" icon={<Info />}>
                  シフトが検出されませんでした。「シフト追加」ボタンから手動で追加してください。
                </Alert>
              ) : (
                <List>
                  {parsedShifts.map(shift => (
                    <ListItem key={shift.id} sx={{ px: 0 }}>
                      <Box width="100%">
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={`信頼度: ${Math.round(shift.confidence * 100)}%`}
                              color={getConfidenceColor(shift.confidence)}
                              size="small"
                            />
                            {shift.edited && (
                              <Chip
                                label="編集済み"
                                color="info"
                                size="small"
                                icon={<Edit />}
                              />
                            )}
                            <Chip
                              label={shift.source === 'auto' ? '自動' : '手動'}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                          <IconButton
                            onClick={() => removeShift(shift.id)}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>

                        <Grid2 container spacing={2}>
                          <Grid2 xs={12} sm={6}>
                            <TextField
                              label="日付"
                              type="date"
                              value={shift.date}
                              onChange={e =>
                                handleEditShift(shift.id, {
                                  date: e.target.value,
                                })
                              }
                              fullWidth
                              size="small"
                              error={!!validationErrors[`${shift.id}-date`]}
                              helperText={validationErrors[`${shift.id}-date`]}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid2>
                          <Grid2 xs={12} sm={6}>
                            <Autocomplete
                              options={COMMON_LOCATIONS}
                              freeSolo
                              value={shift.location}
                              onChange={(event, newValue) => {
                                handleEditShift(shift.id, {
                                  location: newValue || '',
                                });
                              }}
                              onInputChange={(event, newInputValue) => {
                                handleEditShift(shift.id, {
                                  location: newInputValue,
                                });
                              }}
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label="勤務場所"
                                  size="small"
                                  fullWidth
                                />
                              )}
                              size="small"
                            />
                          </Grid2>
                          <Grid2 xs={6}>
                            <TextField
                              label="開始時間"
                              type="time"
                              value={shift.startTime}
                              onChange={e =>
                                handleEditShift(shift.id, {
                                  startTime: e.target.value,
                                })
                              }
                              fullWidth
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid2>
                          <Grid2 xs={6}>
                            <TextField
                              label="終了時間"
                              type="time"
                              value={shift.endTime}
                              onChange={e =>
                                handleEditShift(shift.id, {
                                  endTime: e.target.value,
                                })
                              }
                              fullWidth
                              size="small"
                              error={!!validationErrors[`${shift.id}-time`]}
                              helperText={validationErrors[`${shift.id}-time`]}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid2>
                          <Grid2 xs={12}>
                            <Autocomplete
                              options={COMMON_HOURLY_RATES}
                              freeSolo
                              value={shift.hourlyRate}
                              onChange={(event, newValue) => {
                                handleEditShift(shift.id, {
                                  hourlyRate: Number(newValue) || 0,
                                });
                              }}
                              onInputChange={(event, newInputValue) => {
                                handleEditShift(shift.id, {
                                  hourlyRate: Number(newInputValue) || 0,
                                });
                              }}
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label="時給"
                                  type="number"
                                  size="small"
                                  fullWidth
                                  error={!!validationErrors[`${shift.id}-rate`]}
                                  helperText={
                                    validationErrors[`${shift.id}-rate`]
                                  }
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        円
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                              size="small"
                            />
                          </Grid2>
                        </Grid2>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* アクションボタン */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined" startIcon={<Cancel />}>
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={parsedShifts.length === 0 || hasValidationErrors}
          startIcon={<Save />}
        >
          シフトを保存 ({parsedShifts.length}件)
        </Button>
      </Box>
    </Box>
  );
};
