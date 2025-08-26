// ⚙️ 設定画面コンポーネント
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  Logout,
  Person,
  Notifications,
  Language,
  Security,
  Info,
  Backup,
  Delete,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import useI18nStore from '../store/i18nStore';

export const SettingsScreen: React.FC = () => {
  const { user, logout, loading } = useSimpleAuth();
  const { country, setCountry } = useI18nStore();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // ログアウト処理
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutDialogOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  // 言語/地域切り替え
  const handleCountryChange = () => {
    // 簡易的な切り替え（日本⇔アメリカ）
    const newCountry = country === 'JP' ? 'US' : 'JP';
    setCountry(newCountry);
  };

  const settingsItems = [
    {
      id: 'profile',
      icon: Person,
      title: 'プロフィール',
      description: user?.name || user?.email || '未設定',
      action: () => console.log('Profile clicked'),
    },
    {
      id: 'notifications',
      icon: Notifications,
      title: '通知設定',
      description: '扶養限度額アラート、シフト通知など',
      action: () => setNotificationsEnabled(!notificationsEnabled),
      toggle: notificationsEnabled,
    },
    {
      id: 'language',
      icon: Language,
      title: '地域設定',
      description: `現在: ${country === 'JP' ? '日本' : 'アメリカ'}`,
      action: handleCountryChange,
    },
    {
      id: 'security',
      icon: Security,
      title: 'セキュリティ',
      description: 'パスワード変更、二段階認証',
      action: () => console.log('Security clicked'),
    },
    {
      id: 'backup',
      icon: Backup,
      title: 'データのバックアップ',
      description: 'シフト・収入データのエクスポート',
      action: () => console.log('Backup clicked'),
    },
    {
      id: 'about',
      icon: Info,
      title: 'アプリについて',
      description: 'バージョン 3.0.0',
      action: () => console.log('About clicked'),
    },
  ];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2, pb: 10 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ヘッダー */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            ⚙️ 設定
          </Typography>
          <Typography variant="body2" color="text.secondary">
            アプリの設定とアカウント管理
          </Typography>
        </Box>

        {/* ユーザー情報カード */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                {user?.name?.[0] || user?.email?.[0] || '👤'}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {user?.name || 'ユーザー'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                <Chip
                  label="認証済み"
                  size="small"
                  icon={<CheckCircle />}
                  sx={{
                    mt: 1,
                    background: 'rgba(76, 175, 80, 0.1)',
                    color: 'success.main',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 設定項目 */}
        <Card sx={{ mb: 3 }}>
          <List>
            {settingsItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={item.action}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <IconComponent color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                        }
                        secondary={item.description}
                      />
                      {item.toggle !== undefined && (
                        <Switch
                          checked={item.toggle}
                          onChange={item.action}
                          color="primary"
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                  {index < settingsItems.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Card>

        {/* ログアウトボタン */}
        <Card>
          <CardContent>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="large"
              startIcon={<Logout />}
              onClick={() => setLogoutDialogOpen(true)}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'error.lighter',
                },
              }}
            >
              ログアウト
            </Button>
          </CardContent>
        </Card>

        {/* データ削除警告 */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            💡 <strong>ヒント:</strong> シフトデータは自動的にバックアップされています。
            別のデバイスからログインしても、データは同期されます。
          </Typography>
        </Alert>
      </motion.div>

      {/* ログアウト確認ダイアログ */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ログアウトの確認
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            本当にログアウトしますか？
          </Typography>
          <Alert severity="info">
            ログアウト後も、シフトデータは安全に保存されています。
            同じアカウントで再ログインすれば、データにアクセスできます。
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            variant="outlined"
            disabled={loggingOut}
            sx={{ flex: 1 }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            disabled={loggingOut}
            startIcon={loggingOut ? <CircularProgress size={16} /> : <Logout />}
            sx={{ flex: 1 }}
          >
            {loggingOut ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};