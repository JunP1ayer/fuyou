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
  ViewModule,
  ViewAgenda,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { useShiftStore } from '@store/shiftStore';
import useI18nStore, { SupportedLanguage, SupportedCountry } from '@/store/i18nStore';
import { useI18n } from '@/hooks/useI18n';
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
  const { t } = useI18n();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // カレンダー表示モード設定
  const [calendarViewMode, setCalendarViewMode] = useState<'vertical' | 'horizontal'>(() => {
    const saved = localStorage.getItem('calendarViewMode') as 'vertical' | 'horizontal';
    return saved || 'vertical';
  });

  // カレンダー表示モード変更
  const handleCalendarViewModeChange = () => {
    const newMode = calendarViewMode === 'vertical' ? 'horizontal' : 'vertical';
    setCalendarViewMode(newMode);
    localStorage.setItem('calendarViewMode', newMode);
    toast.success(
      t(
        newMode === 'vertical'
          ? 'settings.calendarMode.changedToVertical'
          : 'settings.calendarMode.changedToHorizontal',
        newMode === 'vertical' ? '縦スクロールに変更しました' : '横表示に変更しました'
      )
    );
  };

  // データ削除
  const handleDataDelete = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success(t('settings.data.deletedAll', '全データを削除しました'));
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

    toast.success(t('settings.data.exported', 'データをエクスポートしました'));
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
          {t('settings.title', '⚙️ 設定')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('settings.subtitle', 'アプリの設定とデータ管理')}
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
              {t('settings.display.title', '🎨 表示設定')}
            </Typography>

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  {themeMode === 'dark' ? <DarkMode /> : <LightMode />}
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.display.darkMode', 'ダークモード')}
                  secondary={t('settings.display.darkMode.desc', '暗いテーマで表示します')}
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
                  {calendarViewMode === 'vertical' ? <ViewAgenda /> : <ViewModule />}
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.display.calendarMode', 'カレンダー表示モード')}
                  secondary={
                    calendarViewMode === 'vertical'
                      ? t('settings.display.calendarMode.verticalDesc', 'モバイル向け縦スクロール表示')
                      : t('settings.display.calendarMode.horizontalDesc', 'PC向け横表示モード')
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={calendarViewMode === 'horizontal'}
                    onChange={handleCalendarViewModeChange}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Palette />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.locale.title', '言語と言語圏')}
                  secondary={t('settings.locale.subtitle', 'アプリの表示言語と国別ルールを設定します')}
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>{t('settings.language', '言語')}</InputLabel>
                      <Select
                        label={t('settings.language', '言語')}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                      >
                        <MenuItem value={'ja'}>{t('lang.ja', '日本語')}</MenuItem>
                        <MenuItem value={'en'}>{t('lang.en', 'English')}</MenuItem>
                        <MenuItem value={'de'}>{t('lang.de', 'Deutsch')}</MenuItem>
                        <MenuItem value={'da'}>{t('lang.da', 'Dansk')}</MenuItem>
                        <MenuItem value={'fi'}>{t('lang.fi', 'Suomi')}</MenuItem>
                        <MenuItem value={'no'}>{t('lang.no', 'Norsk')}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>{t('settings.country', '国')}</InputLabel>
                      <Select
                        label={t('settings.country', '国')}
                        value={country}
                        onChange={(e) => setCountry(e.target.value as SupportedCountry)}
                      >
                        <MenuItem value={'JP'}>{t('country.JP', '日本')}</MenuItem>
                        <MenuItem value={'UK'}>{t('country.UK', 'United Kingdom')}</MenuItem>
                        <MenuItem value={'DE'}>{t('country.DE', 'Deutschland')}</MenuItem>
                        <MenuItem value={'DK'}>{t('country.DK', 'Danmark')}</MenuItem>
                        <MenuItem value={'FI'}>{t('country.FI', 'Suomi')}</MenuItem>
                        <MenuItem value={'NO'}>{t('country.NO', 'Norge')}</MenuItem>
                        <MenuItem value={'AT'}>{t('country.AT', 'Österreich')}</MenuItem>
                        <MenuItem value={'PL'}>{t('country.PL', 'Polska')}</MenuItem>
                        <MenuItem value={'HU'}>{t('country.HU', 'Magyarország')}</MenuItem>
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
              {t('settings.data.title', '💾 データ管理')}
            </Typography>

            <List disablePadding>
              <ListItem>
                <ListItemIcon>
                  <GetApp />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.data.export', 'データのエクスポート')}
                  secondary={t('settings.data.export.desc', 'シフトデータをJSON形式でダウンロード')}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setExportDialogOpen(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('common.export', 'エクスポート')}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider sx={{ my: 1 }} />

              <ListItem>
                <ListItemIcon>
                  <Delete color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.data.deleteAll', '全データを削除')}
                  secondary={t('settings.data.deleteAll.desc', '保存されているすべてのデータを削除します')}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('common.delete', '削除')}
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
              {t('settings.appInfo.title', 'ℹ️ アプリ情報')}
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
                  {t('settings.appInfo.version', 'バージョン')}
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
                  {t('settings.appInfo.totalShifts', '登録シフト数')}
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
                  {t('settings.appInfo.totalWorkplaces', '登録勤務先数')}
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
                  {t('settings.appInfo.dataSize', 'データサイズ')}
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
                {t('settings.appInfo.badgeTitle', '🎓 学生向け扶養管理アプリ')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {t('settings.appInfo.badgeDesc', '2025年税制改正対応・最新の学生特例制度（150万円）に対応しています')}
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
          {t('settings.data.deleteConfirm.title', '🗑️ データ削除の確認')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('settings.data.deleteConfirm.irreversible', 'この操作は取り消せません！')}
          </Alert>
          <Typography variant="body1" gutterBottom>
            {t('settings.data.deleteConfirm.willDelete', '以下のデータが完全に削除されます：')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, mt: 1 }}>
            <Typography component="li" variant="body2">
              {t('settings.data.deleteConfirm.list.shifts', '全シフトデータ')}（{appInfo.totalShifts}{t('common.items', '件')}）
            </Typography>
            <Typography component="li" variant="body2">
              {t('settings.data.deleteConfirm.list.workplaces', '勤務先情報')}（{appInfo.totalWorkplaces}{t('common.items', '件')}）
            </Typography>
            <Typography component="li" variant="body2">
              {t('settings.data.deleteConfirm.list.appSettings', 'アプリの設定')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('settings.data.deleteConfirm.notice', 'データを復元したい場合は、事前にエクスポートしておくことをお勧めします。')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel', 'キャンセル')}
          </Button>
          <Button
            onClick={handleDataDelete}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            {t('settings.data.deleteConfirm.confirm', '削除する')}
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
          {t('settings.data.export.title', '📤 データのエクスポート')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {t('settings.data.export.message', '以下のデータをJSONファイルとしてダウンロードします：')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, mt: 1, mb: 2 }}>
            <Typography component="li" variant="body2">
              {t('settings.data.export.list.shifts', 'シフトデータ')}（{appInfo.totalShifts}{t('common.items', '件')}）
            </Typography>
            <Typography component="li" variant="body2">
              {t('settings.data.export.list.workplaces', '勤務先情報')}（{appInfo.totalWorkplaces}{t('common.items', '件')}）
            </Typography>
            <Typography component="li" variant="body2">
              {t('settings.data.export.list.meta', 'エクスポート日時・バージョン情報')}
            </Typography>
          </Box>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {t('settings.data.export.tip', 'このファイルは他のデバイスでのデータ移行やバックアップに使用できます。')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExportDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel', 'キャンセル')}
          </Button>
          <Button
            onClick={handleDataExport}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            {t('common.download', 'ダウンロード')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
