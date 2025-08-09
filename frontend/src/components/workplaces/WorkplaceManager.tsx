import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add, Edit, Delete, Work, Palette } from '@mui/icons-material';
import { WorkplaceFormDialog } from './WorkplaceFormDialog';
import type {
  Workplace,
  CreateWorkplaceData,
  UpdateWorkplaceData,
} from '../../types/shift';

interface WorkplaceManagerProps {
  workplaces?: Workplace[];
  onWorkplacesChange?: (workplaces: Workplace[]) => void;
}

export const WorkplaceManager: React.FC<WorkplaceManagerProps> = ({
  workplaces: externalWorkplaces,
  onWorkplacesChange,
}) => {
  const [internalWorkplaces, setInternalWorkplaces] = useState<Workplace[]>([]);

  // Use external workplaces if provided, otherwise use internal state
  const workplaces = externalWorkplaces || internalWorkplaces;
  const setWorkplaces = onWorkplacesChange || setInternalWorkplaces;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // フォームダイアログの状態
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<
    Workplace | undefined
  >();

  // 削除確認ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workplaceToDelete, setWorkplaceToDelete] = useState<
    Workplace | undefined
  >();

  // デモデータを初期化（外部からworkplacesが提供されていない場合のみ）
  useEffect(() => {
    if (!externalWorkplaces) {
      const demoWorkplaces: Workplace[] = [
        {
          id: 'wp-1',
          userId: 'demo-user',
          name: 'コンビニA',
          hourlyRate: 1000,
          color: '#2196F3',
          payDay: 25,
          description: '近所のコンビニ',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'wp-2',
          userId: 'demo-user',
          name: 'ファミレスB',
          hourlyRate: 1200,
          color: '#4CAF50',
          payDay: 15,
          description: 'キッチンスタッフ',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setWorkplaces(demoWorkplaces);
    }
  }, [externalWorkplaces, setWorkplaces]);

  // 職場追加ダイアログを開く
  const handleAddWorkplace = () => {
    setEditingWorkplace(undefined);
    setFormDialogOpen(true);
  };

  // 職場編集ダイアログを開く
  const handleEditWorkplace = (workplace: Workplace) => {
    setEditingWorkplace(workplace);
    setFormDialogOpen(true);
  };

  // 職場作成・更新の処理
  const handleWorkplaceSubmit = async (
    data: CreateWorkplaceData | UpdateWorkplaceData
  ) => {
    try {
      setLoading(true);
      setError('');

      if (editingWorkplace) {
        // 更新
        const updatedWorkplace: Workplace = {
          ...editingWorkplace,
          ...(data as UpdateWorkplaceData),
          updatedAt: new Date().toISOString(),
        };
        setWorkplaces(prev =>
          prev.map(wp =>
            wp.id === editingWorkplace.id ? updatedWorkplace : wp
          )
        );
        setSuccess('職場情報を更新しました');
      } else {
        // 新規作成
        const newWorkplace: Workplace = {
          id: `wp-${Date.now()}`,
          userId: 'demo-user',
          ...(data as CreateWorkplaceData),
          isActive: data.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setWorkplaces(prev => [...prev, newWorkplace]);
        setSuccess('新しい職場を追加しました');
      }
      setFormDialogOpen(false);
    } catch (err: unknown) {
      setError((err as Error).message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 職場削除確認ダイアログを開く
  const handleDeleteWorkplace = (workplace: Workplace) => {
    setWorkplaceToDelete(workplace);
    setDeleteDialogOpen(true);
  };

  // 職場削除の実行
  const handleConfirmDelete = async () => {
    if (!workplaceToDelete) return;

    try {
      setLoading(true);
      setError('');

      setWorkplaces(prev => prev.filter(wp => wp.id !== workplaceToDelete.id));
      setSuccess('職場を削除しました');
    } catch (err: unknown) {
      setError((err as Error).message || '削除中にエラーが発生しました');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setWorkplaceToDelete(undefined);
    }
  };

  const handleCloseError = () => setError('');
  const handleCloseSuccess = () => setSuccess('');

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Work sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">バイト先管理</Typography>
          </Box>

          {workplaces.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              バイト先が登録されていません。「追加」ボタンから職場を登録してください。
            </Alert>
          ) : (
            <List>
              {workplaces.map(workplace => (
                <ListItem key={workplace.id} divider>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: workplace.color,
                        mr: 1,
                      }}
                    />
                    <Palette sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </Box>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {workplace.name}
                        </Typography>
                        {!workplace.isActive && (
                          <Chip label="停止中" size="small" color="default" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          時給: ¥{workplace.hourlyRate.toLocaleString()} |
                          給料日: 毎月{workplace.payDay || 25}日
                        </Typography>
                        {workplace.description && (
                          <Typography variant="caption" color="text.secondary">
                            {workplace.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditWorkplace(workplace)}
                      disabled={loading}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteWorkplace(workplace)}
                      disabled={loading}
                      sx={{ ml: 1 }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddWorkplace}
              disabled={loading}
            >
              バイト先を追加
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 職場作成・編集ダイアログ */}
      <WorkplaceFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleWorkplaceSubmit}
        editingWorkplace={editingWorkplace}
        loading={loading}
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>バイト先を削除しますか？</DialogTitle>
        <DialogContent>
          {workplaceToDelete && (
            <Typography>
              「{workplaceToDelete.name}
              」を削除します。この操作は取り消せません。
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
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
