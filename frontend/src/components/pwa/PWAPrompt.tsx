// 📲 PWA インストールプロンプト

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha,
  Slide,
} from '@mui/material';
import {
  Add,
  Close,
  InstallMobile,
  CloudOff,
  Notifications,
  Speed,
  Security,
  Storage,
  Sync,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

interface PWAPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

const Transition = React.forwardRef<unknown, any>((props, ref) => (
  <Slide direction="up" ref={ref} {...props}>
    {props.children}
  </Slide>
));

export const PWAPrompt: React.FC<PWAPromptProps> = ({ onInstall, onDismiss }) => {
  const theme = useTheme();
  const { 
    capabilities, 
    installPrompt, 
    installApp,
    sendNotification,
    hasFeature 
  } = usePWA();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // インストール可能になったら表示
  useEffect(() => {
    if (installPrompt && !dismissed && !capabilities.isInstalled) {
      // 少し遅延させて表示
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [installPrompt, dismissed, capabilities.isInstalled]);

  // ローカルストレージで非表示状態を管理
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
      sendNotification({
        title: 'インストール完了！',
        body: 'アプリがホーム画面に追加されました',
      });
      onInstall?.();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    onDismiss?.();
  };

  const features = [
    {
      icon: <CloudOff />,
      title: 'オフライン対応',
      description: 'インターネット接続がなくても使用できます',
      available: hasFeature('supportsBackgroundSync'),
    },
    {
      icon: <Notifications />,
      title: 'プッシュ通知',
      description: 'シフトやタスクのリマインダーを受け取れます',
      available: hasFeature('supportsPushNotifications'),
    },
    {
      icon: <Speed />,
      title: '高速起動',
      description: 'ネイティブアプリのように瞬時に起動します',
      available: true,
    },
    {
      icon: <Storage />,
      title: 'ローカルストレージ',
      description: 'データをデバイスに保存して高速アクセス',
      available: true,
    },
    {
      icon: <Security />,
      title: 'セキュア',
      description: 'HTTPS接続で安全なデータ通信',
      available: true,
    },
    {
      icon: <Sync />,
      title: 'バックグラウンド同期',
      description: 'オフライン時のデータも自動で同期',
      available: hasFeature('supportsBackgroundSync'),
    },
  ];

  if (!installPrompt || dismissed || capabilities.isInstalled) {
    return null;
  }

  return (
    <>
      {/* コンパクトプロンプト */}
      <AnimatePresence>
        {showPrompt && !showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              right: 16,
              zIndex: 1300,
            }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, 
                  ${theme.palette.primary.main} 0%, 
                  ${theme.palette.secondary.main} 100%
                )`,
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: alpha(theme.palette.common.white, 0.2),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <InstallMobile sx={{ fontSize: 24 }} />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      アプリとしてインストール
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      より快適にご利用いただけます
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="text"
                      sx={{ color: 'white', minWidth: 'auto' }}
                      onClick={() => setShowDetails(true)}
                    >
                      詳細
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ 
                        backgroundColor: alpha(theme.palette.common.white, 0.2),
                        color: 'white',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.common.white, 0.3),
                        }
                      }}
                      startIcon={<Add />}
                      onClick={handleInstall}
                    >
                      追加
                    </Button>
                    <IconButton
                      size="small"
                      sx={{ color: 'white' }}
                      onClick={handleDismiss}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 詳細ダイアログ */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.primary.main, 0.05)} 0%,
              ${alpha(theme.palette.secondary.main, 0.05)} 100%
            )`,
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* ヘッダー */}
          <Box
            sx={{
              background: `linear-gradient(135deg, 
                ${theme.palette.primary.main} 0%, 
                ${theme.palette.secondary.main} 100%
              )`,
              color: 'white',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '20px',
                background: alpha(theme.palette.common.white, 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
              }}
            >
              <InstallMobile sx={{ fontSize: 40 }} />
            </Box>
            
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              扶養管理アプリ
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              ホーム画面に追加して、もっと便利に
            </Typography>
          </Box>

          {/* 機能一覧 */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
              アプリ版の特徴
            </Typography>
            
            <List sx={{ p: 0 }}>
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: feature.available
                            ? `linear-gradient(135deg, 
                                ${theme.palette.primary.main} 0%, 
                                ${theme.palette.secondary.main} 100%
                              )`
                            : theme.palette.grey[300],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: feature.available ? 'white' : 'text.secondary',
                        }}
                      >
                        {feature.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {feature.title}
                          </Typography>
                          {!feature.available && (
                            <Chip label="準備中" size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={feature.description}
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>

            {/* アクションボタン */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowDetails(false)}
                sx={{ py: 1.5 }}
              >
                後で
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={async () => {
                  await handleInstall();
                  setShowDetails(false);
                }}
                sx={{ 
                  py: 1.5,
                  background: `linear-gradient(135deg, 
                    ${theme.palette.primary.main} 0%, 
                    ${theme.palette.secondary.main} 100%
                  )`,
                }}
                startIcon={<Add />}
              >
                ホーム画面に追加
              </Button>
            </Box>

            {/* 手動インストール手順（デバイス別） */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                💡 ボタンが表示されない場合は、ブラウザの「共有」メニューから
                「ホーム画面に追加」を選択してください
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};