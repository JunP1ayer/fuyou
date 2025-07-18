import { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Logout,
  Upload,
  Dashboard as DashboardIcon,
  Schedule,
  CameraAlt,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { CSVUpload, type ParsedIncomeData } from './CSVUpload';
import { FuyouStatusCard } from './FuyouStatusCard';
import { IncomeHistoryCard } from './IncomeHistoryCard';
import { AlertsPanel } from './AlertsPanel';
import { ShiftCalendar } from './shifts/ShiftCalendar';
import { ShiftFormDialog } from './shifts/ShiftFormDialog';
import { ShiftEditDialog } from './shifts/ShiftEditDialog';
import { OCRShiftManager } from './OCRShiftManager';
import type { FuyouStatus } from '../types/fuyou';
import type { Shift, CreateShiftData } from '../types/shift';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [fuyouStatus, setFuyouStatus] = useState<FuyouStatus | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [shiftEditOpen, setShiftEditOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
  };

  const handleCSVUploadComplete = (data: ParsedIncomeData[]) => {
    console.log('CSV upload completed:', data);
    setUploadSuccess(`${data.length}件の収入データを処理しました`);
    setCsvUploadOpen(false);

    // 5秒後に成功メッセージを消す
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  const handleCSVUploadError = (error: string) => {
    console.error('CSV upload error:', error);
    // エラーハンドリングは CSVUpload コンポーネント内で行われる
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAddShift = (date?: string) => {
    setSelectedDate(date || null);
    setSelectedShift(null);
    setShiftFormOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setShiftEditOpen(true);
  };

  const handleShiftFormClose = () => {
    setShiftFormOpen(false);
    setSelectedDate(null);
  };

  const handleShiftEditClose = () => {
    setShiftEditOpen(false);
    setSelectedShift(null);
  };

  const handleShiftFormSuccess = () => {
    setShiftFormOpen(false);
    setSelectedDate(null);
    // Trigger shift calendar refresh by updating a key or using a callback
  };

  const handleShiftEditSuccess = () => {
    setShiftEditOpen(false);
    setSelectedShift(null);
    // Trigger shift calendar refresh
  };

  const handleOCRShiftsSaved = (shifts: CreateShiftData[]) => {
    console.log('OCR shifts saved:', shifts);
    setUploadSuccess(`${shifts.length}件のシフトを OCR から登録しました`);
    
    // シフト管理タブに切り替え
    setCurrentTab(1);
    
    // 5秒後に成功メッセージを消す
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  const handleOCRError = (error: string) => {
    console.error('OCR error:', error);
    // エラーハンドリングは OCRShiftManager コンポーネント内で行われる
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            扶養管理アプリ
          </Typography>
          {currentTab === 0 && (
            <Button
              color="inherit"
              onClick={() => setCsvUploadOpen(true)}
              startIcon={<Upload />}
              sx={{ mr: 2 }}
            >
              CSV登録
            </Button>
          )}
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.fullName}さん
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<Logout />}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="メイン ナビゲーション"
        >
          <Tab
            icon={<DashboardIcon />}
            label="ダッシュボード"
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab
            icon={<Schedule />}
            label="シフト管理"
            id="tab-1"
            aria-controls="tabpanel-1"
          />
          <Tab
            icon={<CameraAlt />}
            label="OCR登録"
            id="tab-2"
            aria-controls="tabpanel-2"
          />
        </Tabs>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* 成功メッセージ */}
        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {uploadSuccess}
          </Alert>
        )}

        {/* ダッシュボードタブ */}
        {currentTab === 0 && (
          <Box role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
            <Typography variant="h4" gutterBottom>
              ダッシュボード
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
                gap: 3,
                mb: 3,
              }}
            >
              {/* 扶養ステータス */}
              <FuyouStatusCard onStatusUpdate={setFuyouStatus} />

              {/* ユーザー情報 */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ユーザー情報
                  </Typography>
                  <Typography variant="body1">
                    氏名: {user?.fullName}
                  </Typography>
                  <Typography variant="body1">メール: {user?.email}</Typography>
                  <Typography variant="body1">
                    学生: {user?.isStudent ? 'はい' : 'いいえ'}
                  </Typography>

                  {fuyouStatus && (
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary">
                        適用制度: {fuyouStatus.selectedLimit.name}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* アラートパネル */}
            <Box sx={{ mb: 3 }}>
              <AlertsPanel />
            </Box>

            {/* 収入履歴 */}
            <Box sx={{ mb: 3 }}>
              <IncomeHistoryCard
                onUploadCSV={() => setCsvUploadOpen(true)}
                onAddIncome={() => {
                  // TODO: 手動収入追加ダイアログを実装
                  console.log('Manual income addition - to be implemented');
                }}
              />
            </Box>

            {/* 追加情報カード */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    バイト先管理
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    CSVから自動検出されたバイト先の管理
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} disabled>
                    バイト先一覧（実装予定）
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    労働時間最適化
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    扶養範囲内での最適な労働計画提案
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} disabled>
                    最適化提案（実装予定）
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* シフト管理タブ */}
        {currentTab === 1 && (
          <Box role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
            <Typography variant="h4" gutterBottom>
              シフト管理
            </Typography>

            <ShiftCalendar
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
            />
          </Box>
        )}

        {/* OCR登録タブ */}
        {currentTab === 2 && (
          <Box role="tabpanel" id="tabpanel-2" aria-labelledby="tab-2">
            <Typography variant="h4" gutterBottom>
              OCR登録
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              シフト表の画像からシフト情報を自動抽出して登録します
            </Typography>

            <OCRShiftManager
              onShiftsSaved={handleOCRShiftsSaved}
              onError={handleOCRError}
            />
          </Box>
        )}
      </Box>

      {/* CSV アップロードダイアログ */}
      <Dialog
        open={csvUploadOpen}
        onClose={() => setCsvUploadOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>銀行明細CSVアップロード</DialogTitle>
        <DialogContent>
          <CSVUpload
            onUploadComplete={handleCSVUploadComplete}
            onError={handleCSVUploadError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvUploadOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* シフト新規登録ダイアログ */}
      <ShiftFormDialog
        open={shiftFormOpen}
        onClose={handleShiftFormClose}
        onSuccess={handleShiftFormSuccess}
        initialDate={selectedDate}
      />

      {/* シフト編集ダイアログ */}
      <ShiftEditDialog
        open={shiftEditOpen}
        onClose={handleShiftEditClose}
        onSuccess={handleShiftEditSuccess}
        shift={selectedShift}
      />
    </Box>
  );
}
