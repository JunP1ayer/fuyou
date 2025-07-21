import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { CSVUpload, type ParsedIncomeData } from './CSVUpload';
import { ShiftCalendar } from './shifts/ShiftCalendar';
import { ShiftFormDialog } from './shifts/ShiftFormDialog';
import { ShiftEditDialog } from './shifts/ShiftEditDialog';
import { RecurringShiftDialog } from './shifts/RecurringShiftDialog';
import { QuickShiftRegistration } from './QuickShiftRegistration';
import { JobManagement } from './JobManagement';
import { SimplifiedOCRComponent } from './SimplifiedOCRComponent';
import type { Shift, CreateShiftData } from '../types/shift';

export function Dashboard() {
  const { logout } = useAuth();
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [shiftEditOpen, setShiftEditOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [recurringShiftOpen, setRecurringShiftOpen] = useState(false);
  const [quickShiftOpen, setQuickShiftOpen] = useState(false);
  const [jobManagementOpen, setJobManagementOpen] = useState(false);

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

  const handleAddShift = (date?: string) => {
    setSelectedDate(date || null);
    setSelectedShift(null);
    
    // 常にクイック登録を使用
    if (date) {
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

    // 5秒後に成功メッセージを消す
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  const handleOCRError = (error: string) => {
    console.error('OCR error:', error);
  };

  const handleOCRClose = () => {
    setOcrOpen(false);
  };

  const handleRecurringShiftSuccess = (shiftsCreated: number) => {
    setUploadSuccess(`${shiftsCreated}件の定期シフトを登録しました`);
    setRecurringShiftOpen(false);

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

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
      }}
    >
      <Box>
        {/* シンプルなヘッダー */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
            シフト管理
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            size="small"
            sx={{ fontSize: '0.85rem' }}
          >
            ログアウト
          </Button>
        </Box>


        <Box sx={{ p: 1, height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
          {/* 成功メッセージ */}
          {uploadSuccess && (
            <Alert severity="success" sx={{ mb: 1, mx: 1 }}>
              {uploadSuccess}
            </Alert>
          )}

          {/* メインカレンダー表示 */}
          <Box
            sx={{
              height: 'calc(100vh - 120px)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <ShiftCalendar
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              compactMode={true}
            />
          </Box>
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

        {/* SimplifiedOCRComponentダイアログ */}
        <Dialog
          open={ocrOpen}
          onClose={handleOCRClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 },
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
          PaperProps={{
            sx: { height: '80vh' },
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
