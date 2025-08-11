// 扶養カレンダー - 最強扶養管理アプリ

import React, { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  createTheme,
  Card,
  CardContent,
  Grid,
  Button,
  Container,
  Chip,
  useMediaQuery,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControl,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  Notifications,
  Security,
  Palette,
  DataUsage,
  GetApp,
  CloudSync,
  Info,
  ContactSupport,
  CalendarToday,
} from '@mui/icons-material';

// コンポーネントとストアをインポート
import { useTestStore } from './store/testStore';
import { useSimpleShiftStore } from './store/simpleShiftStore';
import { SimpleCalendarView } from './components/SimpleCalendarView';
import { SafeCalendarView } from './components/SafeCalendarView';
import { ShiftboardTabs, type TabValue } from './components/ShiftboardTabs';
import { WizardStart } from './components/wizard/WizardStart';
import { WizardSteps } from './components/wizard/WizardSteps';
import { WizardResult } from './components/wizard/WizardResult';
import { GPTShiftSubmitter } from './components/GPTShiftSubmitter';
import { WorkplaceManager } from './components/WorkplaceManager';
import LegalPage from './pages/Legal';
import { ShiftboardSalaryManager } from './components/ShiftboardSalaryManager';
import { MobileSalaryView } from './components/salary/MobileSalaryView';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5ac8fa', // iOSの水色系に近い
      light: '#aee6ff',
      dark: '#0fb5f0',
    },
    background: {
      default: '#f7fbfe', // ごく薄い水色ベース
      paper: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
      },
    },
  },
});

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState<TabValue>('shift');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { shiftsCount, totalEarnings, incrementShifts, addEarnings } =
    useTestStore();
  const { shifts, getTotalEarnings } = useSimpleShiftStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 設定項目のstate
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(() => {
    const saved = localStorage.getItem('weekStartsOnMonday');
    return saved ? JSON.parse(saved) : false; // デフォルトは日曜日始まり
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : true;
  });
  const [appTheme, setAppTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });
  const [dataSync, setDataSync] = useState(() => {
    const saved = localStorage.getItem('dataSync');
    return saved ? JSON.parse(saved) : true;
  });

  // 設定の永続化
  React.useEffect(() => {
    localStorage.setItem(
      'weekStartsOnMonday',
      JSON.stringify(weekStartsOnMonday)
    );
  }, [weekStartsOnMonday]);

  React.useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  React.useEffect(() => {
    localStorage.setItem('theme', appTheme);
  }, [appTheme]);

  React.useEffect(() => {
    localStorage.setItem('dataSync', JSON.stringify(dataSync));
  }, [dataSync]);

  // タブ切り替え時にルートパスに戻る
  const handleTabChange = (tab: TabValue) => {
    setCurrentTab(tab);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'shift':
        try {
          return <SafeCalendarView />;
        } catch (error) {
          console.error('Calendar error:', error);
          return (
            <Card>
              <CardContent>
                <Typography variant="h6" color="error">
                  エラーが発生しました
                </Typography>
                <Typography variant="body2">{String(error)}</Typography>
              </CardContent>
            </Card>
          );
        }
      case 'salary':
        return <MobileSalaryView />;
      case 'submit':
        return (
          <GPTShiftSubmitter
            onNavigateToWorkplaces={() => setCurrentTab('other')}
          />
        );
      case 'other':
        return <WorkplaceManager />;
      case 'settings':
        // 設定タブを押した時に設定ダイアログを開く
        if (!settingsOpen) {
          setSettingsOpen(true);
          // 設定を開いたら前のタブに戻る
          setCurrentTab('shift');
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* シフトボード風タブナビゲーション */}
      <ShiftboardTabs currentTab={currentTab} onTabChange={handleTabChange} />

      <Container
        maxWidth="lg"
        sx={{
          py: isMobile ? 1 : 0,
          pt: isMobile ? 2 : 6,
          pb: isMobile ? 10 : 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダー（設定アイコン付き） */}
        {isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }} />
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: 'primary.main' }}
            >
              扶養カレンダー
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                onClick={() => setSettingsOpen(true)}
                size="small"
                sx={{ color: 'primary.main' }}
              >
                <Settings />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* デスクトップ版の設定アイコン */}
        {!isMobile && (
          <IconButton
            onClick={() => setSettingsOpen(true)}
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 1200,
              color: 'primary.main',
              backgroundColor: 'white',
              boxShadow: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Settings />
          </IconButton>
        )}

        {/* メインコンテンツ（スクロール） */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={renderContent()} />
            <Route path="/wizard" element={<WizardStart />} />
            <Route path="/wizard/steps" element={<WizardSteps />} />
            <Route path="/wizard/result" element={<WizardResult />} />
            <Route path="/submit" element={<GPTShiftSubmitter />} />
            <Route path="/legal" element={<LegalPage />} />
          </Routes>
        </Box>
      </Container>

      {/* 設定ダイアログ */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 3,
            backgroundColor: 'background.paper',
          } 
        }}
        sx={{ 
          zIndex: 1300,
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)', // 濃い背景で後ろを隠す
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Settings sx={{ mr: 1, color: 'primary.main' }} />
            設定
          </Box>
        </DialogTitle>

        <DialogContent>
          <List>
            {/* カレンダー設定 */}
            <ListItem>
              <ListItemIcon>
                <CalendarToday />
              </ListItemIcon>
              <ListItemText 
                primary="週の開始曜日" 
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Chip 
                      label="日曜始まり" 
                      size="small" 
                      color={!weekStartsOnMonday ? "primary" : "default"}
                      variant={!weekStartsOnMonday ? "filled" : "outlined"}
                      onClick={() => setWeekStartsOnMonday(false)}
                      sx={{ cursor: 'pointer' }}
                    />
                    <Chip 
                      label="月曜始まり" 
                      size="small" 
                      color={weekStartsOnMonday ? "primary" : "default"}
                      variant={weekStartsOnMonday ? "filled" : "outlined"}
                      onClick={() => setWeekStartsOnMonday(true)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                } 
              />
            </ListItem>

            <Box sx={{ pl: 7, pb: 1 }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                {weekStartsOnMonday ? 
                  '📅 月・火・水・木・金・土・日' : 
                  '📅 日・月・火・水・木・金・土'}
              </Typography>
            </Box>

            <Divider />

            {/* 通知設定 */}
            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText
                primary="通知"
                secondary="給料日やシフト登録のリマインダー"
              />
              <Switch
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
                color="primary"
              />
            </ListItem>

            <Divider />

            {/* テーマ設定 */}
            <ListItem>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">テーマ</Typography>
                <FormControl size="small" sx={{ mt: 1, minWidth: 120 }}>
                  <Select
                    value={appTheme}
                    onChange={e => setAppTheme(e.target.value)}
                  >
                    <MenuItem value="light">ライト</MenuItem>
                    <MenuItem value="dark">ダーク</MenuItem>
                    <MenuItem value="auto">自動</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </ListItem>

            <Divider />

            {/* データ同期 */}
            <ListItem>
              <ListItemIcon>
                <CloudSync />
              </ListItemIcon>
              <ListItemText
                primary="データ同期"
                secondary="クラウドにデータを自動保存"
              />
              <Switch
                checked={dataSync}
                onChange={e => setDataSync(e.target.checked)}
                color="primary"
              />
            </ListItem>

            <Divider />

            {/* セキュリティ */}
            <ListItem button>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText
                primary="セキュリティ"
                secondary="パスワード・認証設定"
              />
            </ListItem>

            <Divider />

            {/* データ使用量 */}
            <ListItem button>
              <ListItemIcon>
                <DataUsage />
              </ListItemIcon>
              <ListItemText
                primary="データ使用量"
                secondary="ストレージとネットワーク使用量"
              />
            </ListItem>

            <Divider />

            {/* データエクスポート */}
            <ListItem button>
              <ListItemIcon>
                <GetApp />
              </ListItemIcon>
              <ListItemText
                primary="データエクスポート"
                secondary="CSV・PDF形式でダウンロード"
              />
            </ListItem>

            <Divider />

            {/* ヘルプ・サポート */}
            <ListItem button>
              <ListItemIcon>
                <ContactSupport />
              </ListItemIcon>
              <ListItemText
                primary="ヘルプ・サポート"
                secondary="使い方やお問い合わせ"
              />
            </ListItem>

            <Divider />

            {/* 法務・ポリシー */}
            <ListItem button onClick={() => { setSettingsOpen(false); navigate('/legal'); }}>
              <ListItemIcon>
                <Info />
              </ListItemIcon>
              <ListItemText
                primary="法務・ポリシー"
                secondary="免責・プライバシー・利用規約"
              />
            </ListItem>
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default App;
