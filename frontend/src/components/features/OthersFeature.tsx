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
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Divider,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import {
  Settings,
  Help,
  Info,
  Feedback,
  GetApp,
  Share,
  Security,
  Update,
  Code,
  GitHub,
} from '@mui/icons-material';

export const OthersFeature: React.FC = () => {
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const menuItems = [
    {
      icon: <Settings color="primary" />,
      title: '設定',
      description: 'アプリの設定を変更',
      action: () => alert('設定機能は準備中です'),
      available: false,
    },
    {
      icon: <Help color="primary" />,
      title: 'ヘルプ',
      description: '使い方やよくある質問',
      action: () => setHelpDialogOpen(true),
      available: true,
    },
    {
      icon: <Info color="primary" />,
      title: 'アプリについて',
      description: 'バージョン情報とクレジット',
      action: () => setAboutDialogOpen(true),
      available: true,
    },
    {
      icon: <Feedback color="primary" />,
      title: 'フィードバック',
      description: '改善点やバグを報告',
      action: () =>
        window.open('mailto:feedback@fuyou-app.com?subject=フィードバック'),
      available: true,
    },
    {
      icon: <GetApp color="primary" />,
      title: 'データエクスポート',
      description: 'シフトデータをCSVで出力',
      action: () => alert('エクスポート機能は準備中です'),
      available: false,
    },
    {
      icon: <Share color="primary" />,
      title: 'アプリをシェア',
      description: '友達にアプリを紹介',
      action: () => {
        if (navigator.share) {
          navigator.share({
            title: '扶養管理アプリ',
            text: '学生向けの扶養管理に便利なアプリです！',
            url: window.location.origin,
          });
        } else {
          navigator.clipboard.writeText(window.location.origin);
          alert('URLをコピーしました！');
        }
      },
      available: true,
    },
  ];

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          その他
        </Typography>
        <Typography variant="body1" color="text.secondary">
          設定・ヘルプ・アプリ情報
        </Typography>
      </Box>

      {/* メニュー一覧 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <List>
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={item.action}
                    disabled={!item.available}
                    sx={{
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: 500,
                        },
                      }}
                    />
                    {!item.available && (
                      <Chip
                        label="準備中"
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </ListItemButton>
                </ListItem>
                {index < menuItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* アプリ情報カード */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">セキュリティ</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              データは安全に暗号化されており、プライバシーが保護されています。
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Update color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">自動アップデート</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              新機能やバグ修正は自動的に適用されます。
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ヘルプダイアログ */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>ヘルプ・使い方</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              基本的な使い方
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="1. シフト登録"
                  secondary="カレンダーの日付をクリックしてシフトを追加"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. AI機能"
                  secondary="シフト表の写真を撮って自動でシフトを登録"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. 給料計算"
                  secondary="扶養控除範囲内での収入を自動計算・管理"
                />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              よくある質問
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Q: データは安全ですか？</strong>
                <br />
                A: はい。すべてのデータは暗号化されて保存されています。
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Q: オフラインでも使えますか？</strong>
                <br />
                A: 基本機能はオフラインでも利用可能です。
              </Typography>
            </Alert>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Q: データのバックアップは？</strong>
                <br />
                A: 自動的にクラウドにバックアップされます。
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* アプリについてダイアログ */}
      <Dialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Info color="primary" sx={{ mr: 1 }} />
            扶養管理アプリについて
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              扶養管理アプリ
            </Typography>
            <Chip label="v1.0.0" color="primary" variant="outlined" />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              学生アルバイト向けの扶養控除管理システムです。
              シフト管理、AI機能、給料計算を統合し、扶養範囲内での収入管理をサポートします。
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              主な機能
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Code />
                </ListItemIcon>
                <ListItemText primary="シフトカレンダー管理" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Code />
                </ListItemIcon>
                <ListItemText primary="AI画像認識（OCR）" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Code />
                </ListItemIcon>
                <ListItemText primary="扶養控除計算エンジン" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Code />
                </ListItemIcon>
                <ListItemText primary="月別給料集計" />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              技術スタック
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="React 18" size="small" variant="outlined" />
              <Chip label="TypeScript" size="small" variant="outlined" />
              <Chip label="Material-UI" size="small" variant="outlined" />
              <Chip label="Node.js" size="small" variant="outlined" />
              <Chip label="Supabase" size="small" variant="outlined" />
              <Chip
                label="Google Cloud Vision"
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GitHub sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              オープンソースプロジェクト
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
