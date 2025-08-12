// ⚙️ FUYOU PRO - 設定画面（一画面対応・タブ化）

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  useTheme,
  alpha,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Palette,
  Notifications,
  NotificationsOff,
  Security,
  Storage,
  Info,
  Delete,
  Refresh,
  GetApp,
  ViewModule,
  ViewAgenda,
  VolumeUp,
  VolumeOff,
  Vibration,
  CloudSync,
  AutoAwesome,
  Settings,
  PhoneAndroid,
  DataUsage,
  SwipeVertical,
  ViewWeek,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { useShiftStore } from '@store/shiftStore';
import useI18nStore, { SupportedLanguage, SupportedCountry } from '@/store/i18nStore';
import { useI18n } from '@/hooks/useI18n';
import type { ThemeMode } from '@/types/index';

interface SettingsViewProps {
  themeMode: ThemeMode;
  onThemeToggle: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ py: 1 }}>{children}</Box>}
    </div>
  );
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  onThemeToggle,
}) => {
  const { shifts, workplaces } = useShiftStore();
  const { language, country, setLanguage, setCountry } = useI18nStore();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // カレンダー表示モード設定
  const [calendarViewMode, setCalendarViewMode] = useState<'vertical' | 'horizontal'>(() => {
    const saved = localStorage.getItem('calendarViewMode') as 'vertical' | 'horizontal';
    return saved || 'vertical';
  });

  // 通知設定
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // サウンド設定
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // バイブレーション設定
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    const saved = localStorage.getItem('vibrationEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // 自動同期設定
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    const saved = localStorage.getItem('autoSyncEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  // AIアシスタント設定
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(() => {
    const saved = localStorage.getItem('aiAssistantEnabled');
    return saved ? JSON.parse(saved) : true;
  });

  // カレンダー表示モード変更
  const handleCalendarViewModeChange = () => {
    const newMode = calendarViewMode === 'vertical' ? 'horizontal' : 'vertical';
    setCalendarViewMode(newMode);
    localStorage.setItem('calendarViewMode', newMode);
    toast.success(newMode === 'vertical' ? '縦スクロールに変更しました' : '月間グリッド表示に変更しました');
    // 設定変更を即座に反映
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // 通知設定の切り替え
  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
    toast.success(newValue ? '通知を有効にしました' : '通知を無効にしました');
  };

  // サウンド設定の切り替え
  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('soundEnabled', JSON.stringify(newValue));
    toast.success(newValue ? 'サウンドを有効にしました' : 'サウンドを無効にしました');
  };

  // バイブレーション設定の切り替え
  const handleVibrationToggle = () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue);
    localStorage.setItem('vibrationEnabled', JSON.stringify(newValue));
    toast.success(newValue ? 'バイブレーションを有効にしました' : 'バイブレーションを無効にしました');
  };

  // 自動同期設定の切り替え
  const handleAutoSyncToggle = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('autoSyncEnabled', JSON.stringify(newValue));
    toast.success(newValue ? '自動同期を有効にしました' : '自動同期を無効にしました');
  };

  // AIアシスタント設定の切り替え
  const handleAiAssistantToggle = () => {
    const newValue = !aiAssistantEnabled;
    setAiAssistantEnabled(newValue);
    localStorage.setItem('aiAssistantEnabled', JSON.stringify(newValue));
    toast.success(newValue ? 'AIアシスタントを有効にしました' : 'AIアシスタントを無効にしました');
  };

  // データのエクスポート
  const handleDataExport = () => {
    const data = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      shifts,
      workplaces,
      settings: {
        themeMode,
        calendarViewMode,
        notificationsEnabled,
        soundEnabled,
        vibrationEnabled,
        autoSyncEnabled,
        aiAssistantEnabled,
        language,
        country,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuyou-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('データをエクスポートしました');
    setExportDialogOpen(false);
  };

  // 全データ削除
  const handleDataClear = () => {
    localStorage.clear();
    toast.success('全データを削除しました');
    setDeleteDialogOpen(false);
    window.location.reload();
  };

  // アプリ情報
  const appInfo = {
    version: '2.0.0',
    totalShifts: shifts.length,
    totalWorkplaces: workplaces.length,
    dataSize: `${Math.round(JSON.stringify({ shifts, workplaces }).length / 1024)}KB`,
  };

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー（コンパクト化） */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          ⚙️ 設定
        </Typography>
        <Typography variant="body2" color="text.secondary">
          アプリの設定とデータ管理
        </Typography>
      </Box>

      {/* タブナビゲーション */}
      <Card sx={{ mx: 2, mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<Settings />} label="基本" />
          <Tab icon={<PhoneAndroid />} label="通知" />
          <Tab icon={<DataUsage />} label="データ" />
        </Tabs>
      </Card>

      {/* タブコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        
        {/* 基本設定タブ */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {themeMode === 'dark' ? <DarkMode /> : <LightMode />}
                  </ListItemIcon>
                  <ListItemText
                    primary="ダークモード"
                    secondary="暗いテーマで表示"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={themeMode === 'dark'}
                      onChange={onThemeToggle}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {calendarViewMode === 'vertical' ? <SwipeVertical /> : <ViewWeek />}
                  </ListItemIcon>
                  <ListItemText
                    primary={t('settings.display.mobileCalendar', 'モバイル向けカレンダー')}
                    secondary={calendarViewMode === 'vertical' 
                      ? t('settings.display.verticalScroll', '✓ 縦スクロール可能 - 複数月を連続表示') 
                      : t('settings.display.gridLayout', '月間グリッド表示（デスクトップ向け）')
                    }
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={calendarViewMode === 'vertical'}
                      onChange={handleCalendarViewModeChange}
                      size="small"
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Palette />
                  </ListItemIcon>
                  <ListItemText
                    primary="言語設定"
                    secondary="表示言語を変更"
                  />
                  <ListItemSecondaryAction>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                      >
                        <MenuItem value="ja">日本語</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* 通知設定タブ */}
        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {notificationsEnabled ? <Notifications /> : <NotificationsOff />}
                  </ListItemIcon>
                  <ListItemText
                    primary="プッシュ通知"
                    secondary="シフト通知を受け取る"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationsEnabled}
                      onChange={handleNotificationToggle}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {soundEnabled ? <VolumeUp /> : <VolumeOff />}
                  </ListItemIcon>
                  <ListItemText
                    primary="音声通知"
                    secondary="通知音を有効にする"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={soundEnabled}
                      onChange={handleSoundToggle}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Vibration />
                  </ListItemIcon>
                  <ListItemText
                    primary="バイブレーション"
                    secondary="通知時に振動させる"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={vibrationEnabled}
                      onChange={handleVibrationToggle}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AutoAwesome />
                  </ListItemIcon>
                  <ListItemText
                    primary="AIアシスタント"
                    secondary="AI機能を有効にする"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={aiAssistantEnabled}
                      onChange={handleAiAssistantToggle}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CloudSync />
                  </ListItemIcon>
                  <ListItemText
                    primary="自動同期"
                    secondary="クラウドに自動同期"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={autoSyncEnabled}
                      onChange={handleAutoSyncToggle}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* データ管理タブ */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Info />
                  </ListItemIcon>
                  <ListItemText
                    primary="アプリ情報"
                    secondary={`v${appInfo.version} • ${appInfo.totalShifts}件のシフト • ${appInfo.dataSize}`}
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemIcon>
                    <GetApp />
                  </ListItemIcon>
                  <ListItemText
                    primary="データエクスポート"
                    secondary="JSON形式でダウンロード"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setExportDialogOpen(true)}
                    >
                      エクスポート
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Delete color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="全データ削除"
                    secondary="すべてのデータを削除"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      削除
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>

      {/* データ削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>全データ削除</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            この操作は元に戻せません。
          </Alert>
          <Typography>
            すべてのシフトデータ、バイト先情報、設定が削除されます。
            本当に削除しますか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleDataClear} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* データエクスポートダイアログ */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>データエクスポート</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            すべてのデータをJSON形式でエクスポートします。
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip label={`${appInfo.totalShifts}件のシフト`} color="primary" />
            <Chip label={`${appInfo.totalWorkplaces}件のバイト先`} color="primary" />
            <Chip label={appInfo.dataSize} color="info" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleDataExport} variant="contained">
            ダウンロード
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};