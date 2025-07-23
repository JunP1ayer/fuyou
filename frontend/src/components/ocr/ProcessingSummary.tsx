import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  AttachMoney,
  TrendingUp,
  AutoAwesome,
  SmartToy,
  Visibility,
  Save,
  CalendarToday,
} from '@mui/icons-material';

import type { 
  EditableShift,
  OCRProcessingResponse,
} from '../../types/intelligentOCR';

interface ProcessingSummaryProps {
  shifts: EditableShift[];
  ocrResults: OCRProcessingResponse | null;
  isComplete: boolean;
}

export const ProcessingSummary: React.FC<ProcessingSummaryProps> = ({
  shifts,
  ocrResults,
  isComplete,
}) => {
  // 統計計算
  const statistics = React.useMemo(() => {
    const totalShifts = shifts.length;
    const totalHours = shifts.reduce((sum, shift) => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }
      
      const workMinutes = endMinutes - startMinutes - (shift.breakMinutes || 0);
      return sum + workMinutes / 60;
    }, 0);
    
    const totalEarnings = shifts.reduce((sum, shift) => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }
      
      const workMinutes = endMinutes - startMinutes - (shift.breakMinutes || 0);
      return sum + (workMinutes / 60) * shift.hourlyRate;
    }, 0);

    const editedCount = shifts.filter(shift => shift.isEdited).length;
    const averageConfidence = ocrResults 
      ? ocrResults.consolidatedResult.overallConfidence 
      : 0;

    return {
      totalShifts,
      totalHours: Math.round(totalHours * 10) / 10,
      totalEarnings: Math.round(totalEarnings),
      editedCount,
      averageConfidence,
    };
  }, [shifts, ocrResults]);

  // AI プロバイダーパフォーマンス
  const aiPerformance = React.useMemo(() => {
    if (!ocrResults) return [];

    return Object.entries(ocrResults.results).map(([provider, result]) => ({
      name: provider,
      displayName: 
        provider === 'gemini' ? 'Gemini AI' :
        provider === 'openai' ? 'OpenAI GPT-4o' :
        'Google Vision',
      icon: 
        provider === 'gemini' ? <AutoAwesome /> :
        provider === 'openai' ? <SmartToy /> :
        <Visibility />,
      confidence: result.confidence,
      processingTime: result.processingTime,
      shiftsDetected: result.shifts.length,
      success: result.success,
    }));
  }, [ocrResults]);

  return (
    <Box>
      {/* 完了ヘッダー */}
      <Paper sx={{ p: 4, mb: 3, textAlign: 'center', bgcolor: 'success.50' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
          🎉 シフト解析完了！
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {statistics.totalShifts}件のシフトをカレンダーに保存しました
        </Typography>
        
        {isComplete && (
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary" mt={1}>
              処理完了 - カレンダーに自動反映されました
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 統計サマリー */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
              <CalendarToday />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {statistics.totalShifts}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              登録シフト数
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
              <Schedule />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {statistics.totalHours}h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              総労働時間
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
              <AttachMoney />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              ¥{statistics.totalEarnings.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              予想収入
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
              <TrendingUp />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {Math.round(statistics.averageConfidence * 100)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI信頼度
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* AI パフォーマンス */}
      {aiPerformance.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🤖 AI解析パフォーマンス
          </Typography>
          
          <Grid container spacing={2}>
            {aiPerformance.map((ai) => (
              <Grid item xs={12} md={4} key={ai.name}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: ai.success ? 'success.main' : 'error.main' }}>
                        {ai.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {ai.displayName}
                        </Typography>
                        <Chip 
                          label={ai.success ? '成功' : '失敗'} 
                          color={ai.success ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    {ai.success && (
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            信頼度
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {Math.round(ai.confidence * 100)}%
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            処理時間
                          </Typography>
                          <Typography variant="body2">
                            {ai.processingTime}ms
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            検出数
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {ai.shiftsDetected}件
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* 処理タイムライン */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          📊 処理フロー
        </Typography>
        
        <Timeline>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="success">
                <CheckCircle />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" fontWeight="bold">
                画像アップロード完了
              </Typography>
              <Typography variant="body2" color="text.secondary">
                シフト表画像を正常に読み込み
              </Typography>
            </TimelineContent>
          </TimelineItem>
          
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="success">
                <AutoAwesome />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" fontWeight="bold">
                AI並列解析完了
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {aiPerformance.length}つのAIでシフト情報を抽出
              </Typography>
            </TimelineContent>
          </TimelineItem>
          
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="success">
                <TrendingUp />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" fontWeight="bold">
                結果統合・最適化完了
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最適な結果を選択し品質向上
              </Typography>
            </TimelineContent>
          </TimelineItem>
          
          {statistics.editedCount > 0 && (
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <TrendingUp />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2" fontWeight="bold">
                  手動編集完了
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {statistics.editedCount}件のシフトを手動調整
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}
          
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="success">
                <Save />
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" fontWeight="bold">
                カレンダー保存完了
              </Typography>
              <Typography variant="body2" color="text.secondary">
                全シフトをカレンダーに自動反映
              </Typography>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </Paper>

      {/* 成功メッセージ */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎯 処理成功！
        </Typography>
        <Typography variant="body2">
          シフト表の解析から保存まで全ての処理が正常に完了しました。
          カレンダーでシフトスケジュールを確認できます。
        </Typography>
      </Alert>

      {/* シフト詳細リスト */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          📅 登録されたシフト一覧
        </Typography>
        
        <Grid container spacing={2}>
          {shifts.map((shift, index) => (
            <Grid item xs={12} md={6} key={shift.id}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {shift.date}
                  </Typography>
                  {shift.isEdited && (
                    <Chip label="編集済み" color="primary" size="small" />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {shift.jobSourceName}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">
                    {shift.startTime} - {shift.endTime}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    ¥{shift.hourlyRate}/h
                  </Typography>
                </Box>
                
                {shift.breakMinutes && shift.breakMinutes > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    休憩: {shift.breakMinutes}分
                  </Typography>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};