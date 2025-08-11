// ⚙️ FUYOU PRO - 設定画面

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
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Palette,
  Notifications,
  Security,
  Storage,
  Info,
  Delete,
  Refresh,
  GetApp,
  School,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { useShiftStore } from '@store/shiftStore';
import useI18nStore, { SupportedLanguage, SupportedCountry } from '@/store/i18nStore';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { ThemeMode } from '@/types/index';

interface SettingsViewProps {
  themeMode: ThemeMode;
  onThemeToggle: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  onThemeToggle,
}) => {
  const theme = useTheme();
  const { shifts, workplaces } = useShiftStore();
  const { language, country, setLanguage, setCountry } = useI18nStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // データ削除
  const handleDataDelete = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('全データを削除しました');
    setDeleteDialogOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // データエクスポート
  const handleDataExport = () => {
    const exportData = {
      shifts,
      workplaces,
      exportDate: new Date().toISOString(),
      version: '2.0.0',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `fuyou-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('データをエクスポートしました');
    setExportDialogOpen(false);
  };

  // アプリ情報
  const appInfo = {
    version: '2.0.0',
    totalShifts: shifts.length,
    totalWorkplaces: workplaces.length,
    dataSize: `${Math.round(JSON.stringify({ shifts, workplaces }).length / 1024)}KB`,
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%' }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          ⚙️ 設定
        </Typography>
        <Typography variant="body1" color="text.secondary">
          アプリの設定とデータ管理
        </Typography>
      </Box>

      {/* テーマ設定 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              🎨 表示設定
            </Typography>

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  {themeMode === 'dark' ? <DarkMode /> : <LightMode />}
                </ListItemIcon>
                <ListItemText
                  primary="ダークモード"
                  secondary="暗いテーマで表示します"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={themeMode === 'dark'}
                    onChange={onThemeToggle}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Palette />
                </ListItemIcon>
                <ListItemText
                  primary="言語と言語圏"
                  secondary="アプリの表示言語と国別ルールを設定します"
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>言語</InputLabel>
                      <Select
                        label="言語"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                      >
                        <MenuItem value={'ja'}>日本語</MenuItem>
                        <MenuItem value={'en'}>English</MenuItem>
                        <MenuItem value={'de'}>Deutsch</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>国</InputLabel>
                      <Select
                        label="国"
                        value={country}
                        onChange={(e) => setCountry(e.target.value as SupportedCountry)}
                      >
                        <MenuItem value={'JP'}>日本</MenuItem>
                        <MenuItem value={'UK'}>United Kingdom</MenuItem>
                        <MenuItem value={'DE'}>Deutschland</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </motion.div>

      {/* データ管理 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              💾 データ管理
            </Typography>

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  <GetApp />
                </ListItemIcon>
                <ListItemText
                  primary="データのエクスポート"
                  secondary="シフトデータをJSON形式でダウンロード"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setExportDialogOpen(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    エクスポート
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider sx={{ my: 1 }} />

              <ListItem>
                <ListItemIcon>
                  <Delete color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="全データを削除"
                  secondary="保存されているすべてのデータを削除します"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    削除
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </motion.div>

      {/* アプリ情報 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              ℹ️ アプリ情報
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  バージョン
                </Typography>
                <Chip label={`v${appInfo.version}`} size="small" />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  登録シフト数
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {appInfo.totalShifts}件
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  登録勤務先数
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {appInfo.totalWorkplaces}件
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  データサイズ
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {appInfo.dataSize}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Alert
              severity="info"
              icon={<School />}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                🎓 学生向け扶養管理アプリ
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                2025年税制改正対応・最新の学生特例制度（150万円）に対応しています
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      {/* データ削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          🗑️ データ削除の確認
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            この操作は取り消せません！
          </Alert>
          <Typography variant="body1" gutterBottom>
            以下のデータが完全に削除されます：
          </Typography>
          <Box component="ul" sx={{ pl: 3, mt: 1 }}>
            <Typography component="li" variant="body2">
              全シフトデータ（{appInfo.totalShifts}件）
            </Typography>
            <Typography component="li" variant="body2">
              勤務先情報（{appInfo.totalWorkplaces}件）
            </Typography>
            <Typography component="li" variant="body2">
              アプリの設定
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            データを復元したい場合は、事前にエクスポートしておくことをお勧めします。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleDataDelete}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      {/* データエクスポート確認ダイアログ */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          📤 データのエクスポート
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            以下のデータをJSONファイルとしてダウンロードします：
          </Typography>
          <Box component="ul" sx={{ pl: 3, mt: 1, mb: 2 }}>
            <Typography component="li" variant="body2">
              シフトデータ（{appInfo.totalShifts}件）
            </Typography>
            <Typography component="li" variant="body2">
              勤務先情報（{appInfo.totalWorkplaces}件）
            </Typography>
            <Typography component="li" variant="body2">
              エクスポート日時・バージョン情報
            </Typography>
          </Box>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            このファイルは他のデバイスでのデータ移行やバックアップに使用できます。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExportDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleDataExport}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            ダウンロード
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
