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
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { useShiftStore } from '@store/shiftStore';
import useI18nStore, { SupportedLanguage, SupportedCountry } from '@/store/i18nStore';
import { useI18n } from '@/hooks/useI18n';
import { useUnifiedStore } from '@/store/unifiedStore';
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
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  
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
              </List>
            </CardContent>
          </Card>
        </TabPanel>


      </Box>

    </Box>
  );
};