import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Alert,
  Snackbar,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';

import { ShiftCalendar } from './ShiftCalendar';
import { ShiftFormDialog } from './ShiftFormDialog';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import type {
  Shift,
  CreateShiftData,
  UpdateShiftData,
  Workplace,
} from '../../types/shift';

interface ShiftManagerProps {
  showAddButton?: boolean;
  onShiftsChange?: (shifts: Shift[]) => void;
  workplaces?: Workplace[];
  initialShifts?: Shift[];
}

export const ShiftManager: React.FC<ShiftManagerProps> = ({
  showAddButton = true,
  onShiftsChange,
  workplaces = [],
  initialShifts = [],
}) => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // フォームダイアログの状態
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | undefined>(
    undefined
  );
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 削除確認ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | undefined>(
    undefined
  );

  // シフト一覧の取得
  const fetchShifts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const response = await api.getShifts();
      if (response.success && response.data) {
        // 初期シフト（テストデータ）とAPIデータをマージ
        const testShiftIds = ['test-shift-1', 'test-shift-2'];
        const apiShifts = response.data;
        const testShifts = initialShifts.filter(s => testShiftIds.includes(s.id));
        const mergedShifts = [...apiShifts, ...testShifts];
        
        setShifts(mergedShifts);
        onShiftsChange?.(mergedShifts);
      } else {
        setError(response.error?.message || 'シフトの取得に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || 'シフトの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [user, onShiftsChange, initialShifts]);

  // 初回データ読み込み（初期データがない場合のみ）
  useEffect(() => {
    if (initialShifts.length === 0) {
      fetchShifts();
    }
  }, [fetchShifts, initialShifts.length]);

  // シフト追加ダイアログを開く
  const handleAddShift = (date?: string) => {
    setSelectedDate(date || '');
    setEditingShift(undefined);
    setFormDialogOpen(true);
  };

  // シフト編集ダイアログを開く
  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setSelectedDate('');
    setFormDialogOpen(true);
  };

  // シフト作成・更新の処理
  const handleShiftSubmit = async (data: CreateShiftData | UpdateShiftData) => {
    try {
      setLoading(true);
      setError('');

      if (editingShift) {
        // 更新
        const response = await api.updateShift(
          editingShift.id,
          data as UpdateShiftData
        );
        if (response.success) {
          setSuccess('シフトを更新しました');
          await fetchShifts();
          setFormDialogOpen(false);
        } else {
          throw new Error(response.error?.message || '更新に失敗しました');
        }
      } else {
        // 新規作成
        const createData = selectedDate
          ? { ...(data as CreateShiftData), date: selectedDate }
          : (data as CreateShiftData);

        const response = await api.createShift(createData);
        if (response.success) {
          setSuccess('シフトを追加しました');
          await fetchShifts();
          setFormDialogOpen(false);
        } else {
          throw new Error(response.error?.message || '作成に失敗しました');
        }
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        // 時間重複エラーは外部に投げる（フォームで処理）
        throw err;
      } else {
        setError(err.message || 'エラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  // シフト削除確認ダイアログを開く
  const handleDeleteShift = (shift: Shift) => {
    setShiftToDelete(shift);
    setDeleteDialogOpen(true);
  };

  // シフト削除の実行
  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;

    try {
      setLoading(true);
      setError('');

      const response = await api.deleteShift(shiftToDelete.id);
      if (response.success) {
        setSuccess('シフトを削除しました');
        await fetchShifts();
      } else {
        setError(response.error?.message || '削除に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || '削除中にエラーが発生しました');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setShiftToDelete(undefined);
    }
  };

  // エラー・成功メッセージを閉じる
  const handleCloseError = () => setError('');
  const handleCloseSuccess = () => setSuccess('');

  // フォームダイアログを閉じる
  const handleCloseFormDialog = () => {
    if (!loading) {
      setFormDialogOpen(false);
      setEditingShift(undefined);
      setSelectedDate('');
    }
  };

  // 削除確認ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    if (!loading) {
      setDeleteDialogOpen(false);
      setShiftToDelete(undefined);
    }
  };

  return (
    <Box>
      {/* メインコンテンツ */}
      <ShiftCalendar
        shifts={shifts}
        workplaces={workplaces}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
        loading={loading}
      />

      {/* シフト追加ボタン */}
      {showAddButton && (
        <Fab
          color="primary"
          aria-label="add shift"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => handleAddShift()}
          disabled={loading}
        >
          <Add />
        </Fab>
      )}

      {/* シフト作成・編集ダイアログ */}
      <ShiftFormDialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleShiftSubmit}
        editingShift={editingShift}
        loading={loading}
        workplaces={workplaces}
      />

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>シフトを削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {shiftToDelete && (
              <>
                以下のシフトを削除します。この操作は取り消せません。
                <br />
                <br />
                <strong>{shiftToDelete.jobSourceName}</strong>
                <br />
                {shiftToDelete.date} {shiftToDelete.startTime} -{' '}
                {shiftToDelete.endTime}
                <br />
                給与: ¥{shiftToDelete.calculatedEarnings.toLocaleString()}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* エラーメッセージ */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* 成功メッセージ */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};
