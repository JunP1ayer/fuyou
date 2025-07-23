import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  Divider,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Compare,
  AutoFixHigh,
  Warning,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  SwapHoriz,
  Psychology,
  Timeline,
  ContentCopy,
} from '@mui/icons-material';

import type { 
  EditableShift,
  OCRProcessingResponse,
  UserProfile,
  SmartSuggestion,
  ConflictData,
} from '../../types/intelligentOCR';

interface IntelligentResultsEditorProps {
  shifts: EditableShift[];
  onShiftsChange: (shifts: EditableShift[]) => void;
  ocrResults: OCRProcessingResponse | null;
  userProfile?: UserProfile;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

export const IntelligentResultsEditor: React.FC<IntelligentResultsEditorProps> = ({
  shifts,
  onShiftsChange,
  ocrResults,
  userProfile,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [editingShift, setEditingShift] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Record<string, SmartSuggestion[]>>({});

  // スマート提案の生成
  const generateSuggestions = useCallback((shift: EditableShift): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];

    // 時間の妥当性チェック
    const startHour = parseInt(shift.startTime.split(':')[0]);
    const endHour = parseInt(shift.endTime.split(':')[0]);
    
    if (startHour >= endHour) {
      suggestions.push({
        type: 'time_correction',
        message: '終了時間が開始時間より早いか同じです',
        originalValue: `${shift.startTime} - ${shift.endTime}`,
        suggestedValue: `${shift.startTime} - ${(endHour + 12).toString().padStart(2, '0')}:00`,
        confidence: 0.8,
        reason: '一般的なシフト時間パターンから推測',
        actionable: true,
      });
    }

    // 時給の提案
    if (shift.hourlyRate < 900) {
      suggestions.push({
        type: 'rate_adjustment',
        message: '時給が最低賃金を下回っている可能性があります',
        originalValue: shift.hourlyRate,
        suggestedValue: userProfile?.preferences.defaultHourlyRate || 1000,
        confidence: 0.9,
        reason: '法定最低賃金および設定値から推測',
        actionable: true,
      });
    }

    // 休憩時間の最適化
    const workHours = calculateWorkHours(shift.startTime, shift.endTime);
    if (workHours > 6 && (!shift.breakMinutes || shift.breakMinutes < 45)) {
      suggestions.push({
        type: 'break_optimization',
        message: '6時間以上の勤務には45分以上の休憩が必要です',
        originalValue: shift.breakMinutes || 0,
        suggestedValue: 60,
        confidence: 0.95,
        reason: '労働基準法の規定',
        actionable: true,
      });
    }

    return suggestions;
  }, [userProfile]);

  // 働く時間を計算
  const calculateWorkHours = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // 翌日の場合
    }
    
    return (endMinutes - startMinutes) / 60;
  };

  // シフト更新
  const updateShift = useCallback((shiftId: string, updates: Partial<EditableShift>) => {
    onShiftsChange(shifts.map(shift => {
      if (shift.id === shiftId) {
        const updatedShift = { ...shift, ...updates, isEdited: true };
        
        // 提案を再生成
        const newSuggestions = generateSuggestions(updatedShift);
        setSuggestions(prev => ({ ...prev, [shiftId]: newSuggestions }));
        
        return updatedShift;
      }
      return shift;
    }));
  }, [shifts, onShiftsChange, generateSuggestions]);

  // 提案を適用
  const applySuggestion = useCallback((shiftId: string, suggestion: SmartSuggestion) => {
    const updates: Partial<EditableShift> = {};
    
    switch (suggestion.type) {
      case 'time_correction':
        const [newStart, newEnd] = (suggestion.suggestedValue as string).split(' - ');
        updates.endTime = newEnd;
        break;
      case 'rate_adjustment':
        updates.hourlyRate = suggestion.suggestedValue as number;
        break;
      case 'break_optimization':
        updates.breakMinutes = suggestion.suggestedValue as number;
        break;
    }
    
    updateShift(shiftId, updates);
  }, [updateShift]);

  // シフト削除
  const deleteShift = useCallback((shiftId: string) => {
    onShiftsChange(shifts.filter(shift => shift.id !== shiftId));
    setSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[shiftId];
      return newSuggestions;
    });
  }, [shifts, onShiftsChange]);

  // 新しいシフト追加
  const addNewShift = useCallback(() => {
    const newShift: EditableShift = {
      id: `new-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      jobSourceName: 'アルバイト先',
      hourlyRate: userProfile?.preferences.defaultHourlyRate || 1000,
      breakMinutes: userProfile?.preferences.defaultBreakMinutes || 60,
      description: '手動追加',
      isConfirmed: false,
      isEdited: true,
      originalData: {} as EditableShift,
      validationErrors: [],
    };
    
    onShiftsChange([...shifts, newShift]);
  }, [shifts, onShiftsChange, userProfile]);

  // カード展開状態切り替え
  const toggleCardExpansion = useCallback((shiftId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shiftId)) {
        newSet.delete(shiftId);
      } else {
        newSet.add(shiftId);
      }
      return newSet;
    });
  }, []);

  // 統計情報
  const statistics = useMemo(() => {
    const totalShifts = shifts.length;
    const totalHours = shifts.reduce((sum, shift) => {
      const hours = calculateWorkHours(shift.startTime, shift.endTime);
      const breakHours = (shift.breakMinutes || 0) / 60;
      return sum + hours - breakHours;
    }, 0);
    const totalEarnings = shifts.reduce((sum, shift) => {
      const hours = calculateWorkHours(shift.startTime, shift.endTime);
      const breakHours = (shift.breakMinutes || 0) / 60;
      return sum + (hours - breakHours) * shift.hourlyRate;
    }, 0);
    const editedCount = shifts.filter(shift => shift.isEdited).length;
    const issuesCount = Object.values(suggestions).flat().length;

    return {
      totalShifts,
      totalHours: Math.round(totalHours * 10) / 10,
      totalEarnings: Math.round(totalEarnings),
      editedCount,
      issuesCount,
    };
  }, [shifts, suggestions]);

  // 初回提案生成
  React.useEffect(() => {
    const newSuggestions: Record<string, SmartSuggestion[]> = {};
    shifts.forEach(shift => {
      newSuggestions[shift.id] = generateSuggestions(shift);
    });
    setSuggestions(newSuggestions);
  }, [shifts, generateSuggestions]);

  return (
    <Box>
      {/* ヘッダー統計 */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          📝 シフト詳細編集
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" fontWeight="bold">
                {statistics.totalShifts}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                シフト数
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {statistics.totalHours}h
              </Typography>
              <Typography variant="caption" color="text.secondary">
                総労働時間
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main" fontWeight="bold">
                ¥{statistics.totalEarnings.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                総収入
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Badge badgeContent={statistics.issuesCount} color="warning">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {statistics.editedCount}
                </Typography>
              </Badge>
              <Typography variant="caption" color="text.secondary">
                編集済み
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* タブナビゲーション */}
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, value) => setSelectedTab(value)}
          variant="fullWidth"
        >
          <Tab 
            label="編集" 
            icon={<Edit />} 
          />
          <Tab 
            label={
              <Badge badgeContent={statistics.issuesCount} color="error">
                提案
              </Badge>
            }
            icon={<AutoFixHigh />} 
          />
          <Tab 
            label="比較" 
            icon={<Compare />} 
            disabled={!ocrResults}
          />
        </Tabs>
      </Paper>

      {/* 編集タブ */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={2}>
          {shifts.map((shift) => {
            const isExpanded = expandedCards.has(shift.id);
            const shiftSuggestions = suggestions[shift.id] || [];
            const workHours = calculateWorkHours(shift.startTime, shift.endTime);
            const netHours = workHours - (shift.breakMinutes || 0) / 60;
            const earnings = netHours * shift.hourlyRate;
            
            return (
              <Grid item xs={12} md={6} key={shift.id}>
                <Card 
                  elevation={shift.isEdited ? 4 : 1}
                  sx={{
                    border: shift.isEdited ? 2 : 0,
                    borderColor: 'primary.main',
                    position: 'relative',
                  }}
                >
                  {/* 編集済みバッジ */}
                  {shift.isEdited && (
                    <Chip
                      label="編集済み"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                      }}
                    />
                  )}

                  <CardContent>
                    {/* ヘッダー */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {shift.date}
                      </Typography>
                      
                      <Box display="flex" gap={1}>
                        {shiftSuggestions.length > 0 && (
                          <Tooltip title={`${shiftSuggestions.length}件の提案があります`}>
                            <IconButton size="small" color="warning">
                              <Badge badgeContent={shiftSuggestions.length} color="error">
                                <Warning />
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => deleteShift(shift.id)}
                        >
                          <Delete />
                        </IconButton>
                        
                        <IconButton 
                          size="small"
                          onClick={() => toggleCardExpansion(shift.id)}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* 基本情報 */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="開始時間"
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => updateShift(shift.id, { startTime: e.target.value })}
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="終了時間"
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => updateShift(shift.id, { endTime: e.target.value })}
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>

                    {/* 詳細編集 */}
                    <Collapse in={isExpanded}>
                      <Box mt={2}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              label="勤務先"
                              value={shift.jobSourceName}
                              onChange={(e) => updateShift(shift.id, { jobSourceName: e.target.value })}
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="時給 (円)"
                              type="number"
                              value={shift.hourlyRate}
                              onChange={(e) => updateShift(shift.id, { hourlyRate: parseInt(e.target.value) || 0 })}
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="休憩時間 (分)"
                              type="number"
                              value={shift.breakMinutes || 0}
                              onChange={(e) => updateShift(shift.id, { breakMinutes: parseInt(e.target.value) || 0 })}
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="メモ"
                              value={shift.description || ''}
                              onChange={(e) => updateShift(shift.id, { description: e.target.value })}
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>

                    {/* 計算結果 */}
                    <Box mt={2} pt={2} borderTop={`1px solid ${theme.palette.divider}`}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            労働時間
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {netHours.toFixed(1)}h
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            予想収入
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ¥{Math.round(earnings).toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          {shift.confidence && (
                            <>
                              <Typography variant="caption" color="text.secondary">
                                信頼度
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {Math.round(shift.confidence * 100)}%
                              </Typography>
                            </>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {/* 新規追加ボタン */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                minHeight: 200, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: `2px dashed ${theme.palette.divider}`,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
              onClick={addNewShift}
            >
              <Box textAlign="center">
                <Add sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  新しいシフトを追加
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 提案タブ */}
      <TabPanel value={selectedTab} index={1}>
        <Box>
          <Typography variant="h6" gutterBottom>
            🤖 AI による改善提案
          </Typography>
          
          {Object.entries(suggestions).map(([shiftId, shiftSuggestions]) => {
            const shift = shifts.find(s => s.id === shiftId);
            if (!shift || shiftSuggestions.length === 0) return null;
            
            return (
              <Paper key={shiftId} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {shift.date} - {shift.jobSourceName}
                </Typography>
                
                {shiftSuggestions.map((suggestion, index) => (
                  <Alert
                    key={index}
                    severity="warning"
                    sx={{ mb: 1 }}
                    action={
                      suggestion.actionable && (
                        <Button 
                          size="small" 
                          onClick={() => applySuggestion(shiftId, suggestion)}
                        >
                          適用
                        </Button>
                      )
                    }
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {suggestion.message}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {suggestion.originalValue} → {suggestion.suggestedValue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      理由: {suggestion.reason} (信頼度: {Math.round(suggestion.confidence * 100)}%)
                    </Typography>
                  </Alert>
                ))}
              </Paper>
            );
          })}
          
          {Object.values(suggestions).flat().length === 0 && (
            <Alert severity="success">
              <Typography>
                🎉 すべてのシフトが適切に設定されています！
              </Typography>
            </Alert>
          )}
        </Box>
      </TabPanel>

      {/* 比較タブ */}
      <TabPanel value={selectedTab} index={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            🔍 AI解析結果の比較
          </Typography>
          
          {ocrResults && (
            <Grid container spacing={2}>
              {Object.entries(ocrResults.results).map(([provider, result]) => (
                <Grid item xs={12} md={4} key={provider}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {provider.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      信頼度: {Math.round(result.confidence * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      処理時間: {result.processingTime}ms
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="caption" fontWeight="bold">
                      検出シフト数: {result.shifts.length}
                    </Typography>
                    
                    {result.naturalLanguageMessage && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          {result.naturalLanguageMessage}
                        </Typography>
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </TabPanel>
    </Box>
  );
};