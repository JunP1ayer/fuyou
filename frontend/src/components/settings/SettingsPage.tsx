import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Divider,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import {
  Person,
  Notifications,
  Palette,
  Language,
  Security,
  Info,
  ChevronRight,
  Work,
  Schedule,
  AttachMoney,
  Backup,
  Download,
  Delete,
  Help,
  Feedback,
  Star,
} from '@mui/icons-material';

export const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState({
    shiftReminder: true,
    salaryAlert: true,
    pushNotification: false,
  });
  
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  const handleNotificationChange = (key: keyof typeof notifications) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  const settingsData = {
    profile: {
      name: 'デモユーザー',
      email: 'demo@example.com',
      studentId: '202400001',
      university: 'サンプル大学',
    },
    statistics: {
      totalShifts: 24,
      totalEarnings: 156000,
      averageHourlyRate: 1100,
      currentMonth: new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        その他・設定
      </Typography>

      {/* プロフィールカード */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
              <Person sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {settingsData.profile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {settingsData.profile.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {settingsData.profile.university}
              </Typography>
            </Box>
            <IconButton onClick={() => setProfileDialogOpen(true)}>
              <ChevronRight />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* 統計情報 */}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {settingsData.statistics.totalShifts}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  総シフト数
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  ¥{settingsData.statistics.totalEarnings.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  総収入
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  ¥{settingsData.statistics.averageHourlyRate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  平均時給
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 設定項目 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            通知設定
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Schedule />
              </ListItemIcon>
              <ListItemText
                primary="シフトリマインダー"
                secondary="シフト開始1時間前に通知"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.shiftReminder}
                  onChange={handleNotificationChange('shiftReminder')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <AttachMoney />
              </ListItemIcon>
              <ListItemText
                primary="給料アラート"
                secondary="扶養控除限度額の警告"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.salaryAlert}
                  onChange={handleNotificationChange('salaryAlert')}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText
                primary="プッシュ通知"
                secondary="ブラウザ通知を有効にする"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.pushNotification}
                  onChange={handleNotificationChange('pushNotification')}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* データ管理 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            データ管理
          </Typography>
          <List>
            <ListItem button>
              <ListItemIcon>
                <Backup />
              </ListItemIcon>
              <ListItemText
                primary="データバックアップ"
                secondary="シフトデータをエクスポート"
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem button>
              <ListItemIcon>
                <Download />
              </ListItemIcon>
              <ListItemText
                primary="CSV出力"
                secondary="給料明細をCSVファイルで保存"
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 一般設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            一般設定
          </Typography>
          <List>
            <ListItem button>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <ListItemText
                primary="テーマ設定"
                secondary="ライト・ダークモード"
              />
              <ListItemSecondaryAction>
                <Chip label="ライト" size="small" />
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem button>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText
                primary="言語設定"
                secondary="表示言語の変更"
              />
              <ListItemSecondaryAction>
                <Chip label="日本語" size="small" />
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem button>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText
                primary="プライバシー"
                secondary="データの取り扱いについて"
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* サポート */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            サポート・情報
          </Typography>
          <List>
            <ListItem button>
              <ListItemIcon>
                <Help />
              </ListItemIcon>
              <ListItemText
                primary="ヘルプ・FAQ"
                secondary="よくある質問と使い方"
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem button>
              <ListItemIcon>
                <Feedback />
              </ListItemIcon>
              <ListItemText
                primary="フィードバック"
                secondary="アプリの改善にご協力ください"
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem button onClick={() => setAboutDialogOpen(true)}>
              <ListItemIcon>
                <Info />
              </ListItemIcon>
              <ListItemText
                primary="アプリについて"
                secondary="バージョン情報"
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem button>
              <ListItemIcon>
                <Star />
              </ListItemIcon>
              <ListItemText
                primary="アプリを評価"
                secondary="レビューを書く"
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 危険な操作 */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.light' }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom color="error.main">
            データの削除
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            以下の操作は元に戻すことができません。実行前に必ずデータをバックアップしてください。
          </Alert>
          <List>
            <ListItem>
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              <ListItemText
                primary="全データを削除"
                secondary="すべてのシフトデータと設定を削除"
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" color="error" size="small">
                  削除
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* プロフィール詳細ダイアログ */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>プロフィール詳細</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6">{settingsData.profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              学生ID: {settingsData.profile.studentId}
            </Typography>
          </Box>
          
          <List>
            <ListItem>
              <ListItemText primary="メールアドレス" secondary={settingsData.profile.email} />
            </ListItem>
            <ListItem>
              <ListItemText primary="所属" secondary={settingsData.profile.university} />
            </ListItem>
            <ListItem>
              <ListItemText primary="登録日" secondary="2024年1月15日" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>閉じる</Button>
          <Button variant="contained">編集</Button>
        </DialogActions>
      </Dialog>

      {/* アプリ情報ダイアログ */}
      <Dialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>シフトボード</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Work sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            バージョン 1.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            学生アルバイト向けの扶養控除管理システム
          </Typography>
          <Typography variant="caption" color="text.secondary">
            © 2024 シフトボード. All rights reserved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setAboutDialogOpen(false)}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};