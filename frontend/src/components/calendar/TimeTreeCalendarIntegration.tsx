import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Event,
  Sync,
  Settings,
  Schedule,
  Group,
  Add,
  Check,
  CloudSync,
  CalendarMonth,
  AccessTime,
  Work,
} from '@mui/icons-material';

import type { Shift } from '../../types/shift';

interface TimeTreeCalendarIntegrationProps {
  shifts: Shift[];
  onShiftsSync: () => void;
}

interface Calendar {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  isConnected: boolean;
  lastSync?: string;
}

export const TimeTreeCalendarIntegration: React.FC<TimeTreeCalendarIntegrationProps> = ({
  shifts,
  onShiftsSync,
}) => {
  const [calendars, setCalendars] = useState<Calendar[]>([
    {
      id: 'family',
      name: '家族カレンダー',
      color: '#4CAF50',
      memberCount: 4,
      isConnected: true,
      lastSync: '2024-01-15 14:30',
    },
    {
      id: 'work',
      name: 'バイト管理',
      color: '#2196F3',
      memberCount: 1,
      isConnected: false,
    },
    {
      id: 'university',
      name: '大学スケジュール',
      color: '#FF9800',
      memberCount: 12,
      isConnected: false,
    },
  ]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    notifyMembers: false,
    includeEarnings: false,
    syncFrequency: 'realtime',
  });

  const handleConnect = async (calendarId: string) => {
    setIsConnecting(true);
    
    // シミュレートされた接続処理
    setTimeout(() => {
      setCalendars(prev =>
        prev.map(cal =>
          cal.id === calendarId
            ? { ...cal, isConnected: true, lastSync: new Date().toLocaleString('ja-JP') }
            : cal
        )
      );
      setIsConnecting(false);
      setConnectDialogOpen(false);
    }, 2000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    // シミュレートされた同期処理
    setTimeout(() => {
      setCalendars(prev =>
        prev.map(cal =>
          cal.isConnected
            ? { ...cal, lastSync: new Date().toLocaleString('ja-JP') }
            : cal
        )
      );
      setIsSyncing(false);
      onShiftsSync();
    }, 3000);
  };

  const connectedCalendars = calendars.filter(cal => cal.isConnected);
  const availableCalendars = calendars.filter(cal => !cal.isConnected);

  const upcomingShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    return shiftDate >= today && shiftDate <= threeDaysFromNow;
  });

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        カレンダー連携
      </Typography>

      {/* 接続状況サマリー */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'primary.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CloudSync sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {connectedCalendars.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                接続済みカレンダー
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {shifts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                同期対象シフト
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'warning.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccessTime sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {upcomingShifts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今後3日のシフト
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 接続済みカレンダー */}
      {connectedCalendars.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                接続済みカレンダー
              </Typography>
              <Box>
                <IconButton onClick={() => setSettingsDialogOpen(true)}>
                  <Settings />
                </IconButton>
                <Button
                  variant="contained"
                  startIcon={isSyncing ? <Sync className="animate-spin" /> : <Sync />}
                  onClick={handleSync}
                  disabled={isSyncing}
                  sx={{ ml: 1 }}
                >
                  {isSyncing ? '同期中...' : 'すべて同期'}
                </Button>
              </Box>
            </Box>

            {isSyncing && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  シフトデータを同期しています...
                </Typography>
              </Box>
            )}

            <List>
              {connectedCalendars.map((calendar) => (
                <ListItem key={calendar.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: calendar.color }}>
                      <Event />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={calendar.name}
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            size="small"
                            icon={<Group />}
                            label={`${calendar.memberCount}名`}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            icon={<Check />}
                            label="接続中"
                            color="success"
                            variant="outlined"
                          />
                        </Box>
                        {calendar.lastSync && (
                          <Typography variant="caption" color="text.secondary">
                            最終同期: {calendar.lastSync}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 利用可能なカレンダー */}
      {availableCalendars.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              利用可能なカレンダー
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              TimeTreeアカウントで参加しているカレンダーです
            </Typography>

            <List>
              {availableCalendars.map((calendar) => (
                <ListItem key={calendar.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: calendar.color }}>
                      <Event />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={calendar.name}
                    secondary={
                      <Chip
                        size="small"
                        icon={<Group />}
                        label={`${calendar.memberCount}名`}
                        variant="outlined"
                      />
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => handleConnect(calendar.id)}
                      disabled={isConnecting}
                    >
                      接続
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 同期予定のシフト */}
      {upcomingShifts.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              同期予定のシフト
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              今後3日間のシフトが自動的にカレンダーに追加されます
            </Typography>

            <List>
              {upcomingShifts.map((shift) => (
                <ListItem key={shift.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Work />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={shift.jobSourceName}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {shift.date} {shift.startTime} - {shift.endTime}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ¥{shift.calculatedEarnings.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      size="small"
                      label="同期予定"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 初回接続案内 */}
      {connectedCalendars.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <CalendarMonth sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            カレンダー連携でシフト管理をもっと便利に
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            TimeTreeアカウントと連携することで、シフト情報を家族や職場のメンバーと簡単に共有できます
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setConnectDialogOpen(true)}
          >
            TimeTreeと連携する
          </Button>
        </Paper>
      )}

      {/* 同期設定ダイアログ */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>同期設定</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={syncSettings.autoSync}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                />
              }
              label="自動同期を有効にする"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              シフトの変更を自動的にカレンダーに反映します
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={syncSettings.notifyMembers}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, notifyMembers: e.target.checked }))}
                />
              }
              label="メンバーに通知する"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              シフトが追加・変更されたときにカレンダーメンバーに通知します
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={syncSettings.includeEarnings}
                  onChange={(e) => setSyncSettings(prev => ({ ...prev, includeEarnings: e.target.checked }))}
                />
              }
              label="給料情報を含める"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
              シフトの給料情報もカレンダーに表示します
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={() => setSettingsDialogOpen(false)}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 接続確認ダイアログ */}
      <Dialog open={connectDialogOpen} onClose={() => setConnectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>TimeTree連携</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            TimeTreeアカウントでログインしてカレンダー連携を開始します
          </Alert>
          <Typography variant="body2">
            連携により以下の機能が利用できます：
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>シフト情報の自動同期</li>
            <li>家族・職場メンバーとの共有</li>
            <li>リアルタイム通知</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={() => handleConnect('work')}
            disabled={isConnecting}
          >
            {isConnecting ? '接続中...' : 'TimeTreeで連携'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};