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
  useTheme,
  alpha,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  ListItemButton,
  Chip,
} from '@mui/material';
import {
  Palette,
  Notifications,
  NotificationsOff,
  Settings,
  SwipeVertical,
  ViewWeek,
  CalendarToday,
  CalendarViewWeek,
  Logout,
  Person,
  ExitToApp,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { useShiftStore } from '@store/shiftStore';
import useI18nStore, { SupportedLanguage, SupportedCountry } from '@/store/i18nStore';
import { useI18n } from '@/hooks/useI18n';
import { useUnifiedStore } from '@/store/unifiedStore';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
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
  const { ui: { weekStartsOn }, setWeekStartsOn } = useUnifiedStore();
  const { user, logout, loading } = useSimpleAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
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


  // カレンダー表示モード変更
  const handleCalendarViewModeChange = () => {
    const newMode = calendarViewMode === 'vertical' ? 'horizontal' : 'vertical';
    setCalendarViewMode(newMode);
    localStorage.setItem('calendarViewMode', newMode);
    toast.success(newMode === 'vertical' ? '縦スクロールに変更' : '横スワイプに変更');
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
    toast.success(newValue ? '通知オン' : '通知オフ');
  };


  // 週の開始日設定の切り替え
  const handleWeekStartToggle = () => {
    const newValue = weekStartsOn === 0 ? 1 : 0;
    setWeekStartsOn(newValue);
    toast.success(newValue === 1 ? '月曜始まりに変更' : '日曜始まりに変更');
  };

  // ログアウト処理
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutDialogOpen(false);
      toast.success('ログアウトしました');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('ログアウトに失敗しました');
    } finally {
      setLoggingOut(false);
    }
  };


  return (
    <Box sx={{ 
      height: '100vh', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      touchAction: 'none', // タッチによるスクロールを無効化
      userSelect: 'none', // テキスト選択を無効化
      WebkitTouchCallout: 'none', // タッチによるコールアウトを無効化
    }}>


      {/* タブナビゲーション */}
      <Card sx={{ mx: 2, mb: 2, mt: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<Settings />} label="基本" />
        </Tabs>
      </Card>

      {/* タブコンテンツ */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        px: 2,
        touchAction: 'pan-y', // 縦スクロールのみ許可
      }}>
        
        {/* 基本設定タブ */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {calendarViewMode === 'vertical' ? <SwipeVertical /> : <ViewWeek />}
                  </ListItemIcon>
                  <ListItemText
                    primary="カレンダー表示"
                    secondary={calendarViewMode === 'vertical' 
                      ? '縦スクロール' 
                      : '横スワイプ'
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
                    {weekStartsOn === 1 ? <CalendarViewWeek /> : <CalendarToday />}
                  </ListItemIcon>
                  <ListItemText
                    primary="週の開始日"
                    secondary={weekStartsOn === 1 ? '月曜始まり' : '日曜始まり'}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={weekStartsOn === 1}
                      onChange={handleWeekStartToggle}
                      size="small"
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {notificationsEnabled ? <Notifications /> : <NotificationsOff />}
                  </ListItemIcon>
                  <ListItemText
                    primary="通知"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationsEnabled}
                      onChange={handleNotificationToggle}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ListItemIcon>
                      <Palette />
                    </ListItemIcon>
                    <ListItemText
                      primary="言語設定"
                    />
                  </Box>
                  <Box sx={{ pl: 5 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              zIndex: 1400, // タブより前面に表示
                            }
                          }
                        }}
                      >
                        <MenuItem value="ja">日本語</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </ListItem>
                <ListItem>
                  <ListItemButton
                    onClick={() => setLogoutDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'error.lighter',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <ExitToApp color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="ログアウト"
                      secondary="アカウントからログアウトします"
                      primaryTypographyProps={{
                        sx: { color: 'error.main' }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

      </Box>

      {/* ログアウト確認ダイアログ */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            mx: 2,
            borderRadius: 3,
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <ExitToApp sx={{ fontSize: 48, color: 'error.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
              ログアウト確認
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', px: 3, py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, whiteSpace: 'nowrap' }}>
            本当にログアウトしますか？
          </Typography>
          <Alert severity="info" sx={{ textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2">
              ログアウト後も<br />再ログイン可能
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, flexDirection: 'column', gap: 1.5 }}>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            fullWidth
            size="large"
            disabled={loggingOut}
            startIcon={loggingOut ? <CircularProgress size={20} /> : <ExitToApp />}
            sx={{ 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            {loggingOut ? 'ログアウト中...' : 'ログアウト'}
          </Button>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            variant="outlined"
            fullWidth
            size="large"
            disabled={loggingOut}
            sx={{ 
              py: 1.5,
              fontSize: '1rem',
              borderRadius: 2
            }}
          >
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};