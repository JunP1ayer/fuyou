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
  Analytics,
  Repeat,
  PhoneAndroid,
  Computer,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { CSVUpload, type ParsedIncomeData } from './CSVUpload';
import { FuyouStatusCard } from './FuyouStatusCard';
import { IncomeHistoryCard } from './IncomeHistoryCard';
import { AlertsPanel } from './AlertsPanel';
import { ShiftCalendar } from './shifts/ShiftCalendar';
import { ShiftFormDialog } from './shifts/ShiftFormDialog';
import { ShiftEditDialog } from './shifts/ShiftEditDialog';
import { RecurringShiftDialog } from './shifts/RecurringShiftDialog';
import { QuickShiftRegistration } from './QuickShiftRegistration';
import { JobManagement } from './JobManagement';
import { OCRShiftManager } from './OCRShiftManager';
import { SimplifiedOCRComponent } from './SimplifiedOCRComponent';
import { OptimizationDashboard } from './OptimizationDashboard';
// import { RealTimeIncomeDisplay } from './RealTimeIncomeDisplay';
// import { Enhanced2025FuyouCard } from './Enhanced2025FuyouCard';
import { FuyouAlertSystem } from './FuyouAlertSystem';
import { CompactIncomeIndicator } from './CompactIncomeIndicator';
import type { FuyouStatus } from '../types/fuyou';
import type { Shift, CreateShiftData } from '../types/shift';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [fuyouStatus, setFuyouStatus] = useState<FuyouStatus | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [isShiftBoardMode, setIsShiftBoardMode] = useState(true); // シフトボード型UIの切り替え
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [shiftEditOpen, setShiftEditOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [recurringShiftOpen, setRecurringShiftOpen] = useState(false);
  // const [useSimplifiedOCR, setUseSimplifiedOCR] = useState(true); // ChatGPT風OCRの使用フラグ
  const [quickShiftOpen, setQuickShiftOpen] = useState(false);
  const [jobManagementOpen, setJobManagementOpen] = useState(false);
  const [mobilePreviewMode, setMobilePreviewMode] = useState(false); // スマホプレビューモード

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

    // シフトボードモードの場合はクイック登録を使用
    if (isShiftBoardMode && date) {
      setQuickShiftOpen(true);
    } else {
      setShiftFormOpen(true);
    }
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
    setOcrOpen(false);

    // シフトボード型UIの場合は自動的にシフトタブに切り替え
    if (isShiftBoardMode) {
      setCurrentTab(1);
    }

    // 5秒後に成功メッセージを消す
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  const handleOCRError = (error: string) => {
    console.error('OCR error:', error);
    // エラーハンドリングはOCRコンポーネント内で行われるが、必要に応じて追加処理
  };

  const handleOCROpen = () => {
    setOcrOpen(true);
  };

  const handleOCRClose = () => {
    setOcrOpen(false);
  };

  const handleRecurringShiftSuccess = (shiftsCreated: number) => {
    setUploadSuccess(`${shiftsCreated}件の定期シフトを登録しました`);
    setRecurringShiftOpen(false);

    // シフトボード型UIの場合は自動的にシフトタブに切り替え
    if (isShiftBoardMode) {
      setCurrentTab(1);
    }

    // 5秒後に成功メッセージを消す
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  const handleQuickShiftSuccess = () => {
    setUploadSuccess('シフトをクイック登録しました');
    setQuickShiftOpen(false);
    setSelectedDate(null);

    // 5秒後に成功メッセージを消す
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  const handleQuickShiftClose = () => {
    setQuickShiftOpen(false);
    setSelectedDate(null);
  };

  // スマホプレビューモードのスタイル
  const mobilePreviewStyles = mobilePreviewMode
    ? {
        maxWidth: '375px', // iPhone 14相当の幅
        margin: '0 auto',
        border: '8px solid #333',
        borderRadius: '25px',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,0,0,0.3)',
        position: 'relative' as const,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          height: '6px',
          backgroundColor: '#333',
          borderRadius: '3px',
          zIndex: 1000,
        },
      }
    : {};

  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: mobilePreviewMode ? '#f0f0f0' : 'inherit',
        minHeight: '100vh',
        py: mobilePreviewMode ? 2 : 0,
      }}
    >
      <Box sx={mobilePreviewStyles}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              扶養管理アプリ
            </Typography>
            {currentTab === 0 && (
              <>
                <Button
                  color="inherit"
                  onClick={() => setMobilePreviewMode(!mobilePreviewMode)}
                  size="small"
                  sx={{
                    mr: 1,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    minWidth: { xs: '80px', sm: 'auto' },
                    px: { xs: 1, sm: 2 },
                  }}
                  startIcon={
                    mobilePreviewMode ? <Computer /> : <PhoneAndroid />
                  }
                >
                  {mobilePreviewMode ? 'PC表示' : 'スマホ表示'}
                </Button>
                <Button
                  color="inherit"
                  onClick={() => setIsShiftBoardMode(!isShiftBoardMode)}
                  size="small"
                  sx={{
                    mr: 1,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    minWidth: { xs: '80px', sm: 'auto' },
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  {isShiftBoardMode ? '詳細表示' : 'シンプル表示'}
                </Button>
                <Button
                  color="inherit"
                  onClick={() => setCsvUploadOpen(true)}
                  startIcon={<Upload />}
                  sx={{
                    mr: 1,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    minWidth: { xs: '70px', sm: 'auto' },
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  CSV登録
                </Button>
                <Button
                  color="inherit"
                  onClick={handleOCROpen}
                  startIcon={<CameraAlt />}
                  sx={{
                    mr: 2,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    minWidth: { xs: '90px', sm: 'auto' },
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  📷 シフト表読取
                </Button>
              </>
            )}
            <Typography
              variant="body1"
              sx={{
                mr: 2,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {user?.fullName}さん
            </Typography>
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<Logout />}
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                minWidth: { xs: '70px', sm: 'auto' },
                px: { xs: 1, sm: 2 },
              }}
            >
              ログアウト
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="メイン ナビゲーション"
            variant={mobilePreviewMode ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minWidth: { xs: 80, sm: 120 },
                px: { xs: 1, sm: 2 },
              },
            }}
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
            <Tab
              icon={<Analytics />}
              label="最適化"
              id="tab-3"
              aria-controls="tabpanel-3"
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

          {/* ダッシュボードタブ（シフトボード型UI） */}
          {currentTab === 0 && isShiftBoardMode && (
            <Box role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
              {/* シフトボード型メインUI - カレンダー中心設計 */}

              {/* 上部：コンパクトな収入・扶養ステータス */}
              <CompactIncomeIndicator
                fuyouStatus={fuyouStatus}
                onOCROpen={handleOCROpen}
                compactMode={true}
              />

              {/* メイン：シフトカレンダー（画面の80%を占める） */}
              <Box sx={{ mb: 2, minHeight: '65vh', position: 'relative' }}>
                <ShiftCalendar
                  onAddShift={handleAddShift}
                  onEditShift={handleEditShift}
                  compactMode={false} // メイン表示なのでフル機能
                />
              </Box>

              {/* 下部：必要最小限のクイックアクション */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                  mt: 2,
                }}
              >
                <Card
                  onClick={() => setCsvUploadOpen(true)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                    minWidth: 120,
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Upload
                      sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      給与明細登録
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setRecurringShiftOpen(true)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                    minWidth: 120,
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 1 }}>
                    <Repeat
                      sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      定期シフト登録
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* 扶養アラート（必要時のみ表示） */}
              {fuyouStatus &&
                (fuyouStatus as { risk?: string }).risk === 'high' && (
                  <Box sx={{ mt: 2 }}>
                    <FuyouAlertSystem
                      fuyouStatus={fuyouStatus}
                      compactMode={true}
                      showSnackbar={false}
                    />
                  </Box>
                )}
            </Box>
          )}

          {/* 従来のダッシュボードタブ（切り替え可能） */}
          {currentTab === 0 && !isShiftBoardMode && (
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
                    <Typography variant="body1">
                      メール: {user?.email}
                    </Typography>
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
                      バイト先の時給・交通費・テンプレート管理
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => setJobManagementOpen(true)}
                    >
                      バイト先一覧・管理
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
                compactMode={isShiftBoardMode}
                autoNavigateToShifts={isShiftBoardMode}
              />
            </Box>
          )}
          {/* 最適化タブ */}
          {currentTab === 3 && (
            <Box role="tabpanel" id="tabpanel-3" aria-labelledby="tab-3">
              <OptimizationDashboard simplified={isShiftBoardMode} />
            </Box>
          )}
        </Box>

        {/* CSV アップロードダイアログ */}
        <Dialog
          open={csvUploadOpen}
          onClose={() => setCsvUploadOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={mobilePreviewMode}
          PaperProps={{
            sx: {
              margin: { xs: 1, sm: 2 },
              maxHeight: { xs: '95vh', sm: '80vh' },
            },
          }}
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

        {/* SimplifiedOCRComponentダイアログ */}
        <Dialog
          open={ocrOpen}
          onClose={handleOCRClose}
          maxWidth="sm"
          fullWidth
          fullScreen={mobilePreviewMode}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              margin: { xs: 0, sm: 2 },
              maxHeight: { xs: '100vh', sm: '90vh' },
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            <SimplifiedOCRComponent
              onShiftsSaved={handleOCRShiftsSaved}
              onError={handleOCRError}
              onClose={handleOCRClose}
            />
          </DialogContent>
        </Dialog>

        {/* 定期シフト登録ダイアログ */}
        <RecurringShiftDialog
          open={recurringShiftOpen}
          onClose={() => setRecurringShiftOpen(false)}
          onSuccess={handleRecurringShiftSuccess}
        />

        {/* クイックシフト登録ダイアログ */}
        <QuickShiftRegistration
          open={quickShiftOpen}
          onClose={handleQuickShiftClose}
          onSuccess={handleQuickShiftSuccess}
          selectedDate={selectedDate}
        />

        {/* バイト先管理ダイアログ */}
        <Dialog
          open={jobManagementOpen}
          onClose={() => setJobManagementOpen(false)}
          maxWidth="lg"
          fullWidth
          fullScreen={mobilePreviewMode}
          PaperProps={{
            sx: {
              height: { xs: '100vh', sm: '80vh' },
              margin: { xs: 0, sm: 2 },
            },
          }}
        >
          <DialogTitle>バイト先管理</DialogTitle>
          <DialogContent>
            <JobManagement />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setJobManagementOpen(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
