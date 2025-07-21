import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Schedule,
  MonetizationOn,
  AccessTime,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type {
  OptimizationConstraint,
  AvailabilitySlot,
  CreateOptimizationConstraintRequest,
  CreateAvailabilitySlotRequest,
} from '../../types/optimization';

interface OptimizationConstraintsPanelProps {
  constraints: OptimizationConstraint[];
  availability: AvailabilitySlot[];
  onUpdate: () => void;
}

export function OptimizationConstraintsPanel({
  constraints,
  availability,
  onUpdate,
}: OptimizationConstraintsPanelProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [constraintDialogOpen, setConstraintDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] =
    useState<OptimizationConstraint | null>(null);
  const [editingAvailability, setEditingAvailability] =
    useState<AvailabilitySlot | null>(null);

  const [constraintForm, setConstraintForm] =
    useState<CreateOptimizationConstraintRequest>({
      constraintType: 'max_weekly_hours',
      constraintValue: 20,
      constraintUnit: 'hours',
      priority: 3,
      isActive: true,
      metadata: {},
    });

  const [availabilityForm, setAvailabilityForm] =
    useState<CreateAvailabilitySlotRequest>({
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      notes: '',
    });

  const constraintTypes = [
    {
      value: 'max_weekly_hours',
      label: '週間最大労働時間',
      icon: <AccessTime />,
      unit: 'hours',
    },
    {
      value: 'max_monthly_hours',
      label: '月間最大労働時間',
      icon: <AccessTime />,
      unit: 'hours',
    },
    {
      value: 'min_monthly_income',
      label: '月間最小収入',
      icon: <MonetizationOn />,
      unit: 'yen',
    },
    {
      value: 'max_monthly_income',
      label: '月間最大収入',
      icon: <MonetizationOn />,
      unit: 'yen',
    },
    {
      value: 'fuyou_limit',
      label: '扶養控除限度額',
      icon: <Warning />,
      unit: 'yen',
    },
  ];

  const dayOfWeekLabels = ['日', '月', '火', '水', '木', '金', '土'];

  const handleCreateConstraint = async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      setError(null);

      if (editingConstraint) {
        await apiService.updateOptimizationConstraint(
          user.token,
          editingConstraint.id,
          constraintForm
        );
      } else {
        await apiService.createOptimizationConstraint(
          user.token,
          constraintForm
        );
      }

      setConstraintDialogOpen(false);
      setEditingConstraint(null);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '制約の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAvailability = async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      setError(null);

      if (editingAvailability) {
        await apiService.updateAvailabilitySlot(
          user.token,
          editingAvailability.id,
          availabilityForm
        );
      } else {
        await apiService.createAvailabilitySlot(user.token, availabilityForm);
      }

      setAvailabilityDialogOpen(false);
      setEditingAvailability(null);
      onUpdate();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '可用性スロットの保存に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConstraint = async (constraintId: string) => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      await apiService.deleteOptimizationConstraint(user.token, constraintId);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '制約の削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvailability = async (slotId: string) => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      await apiService.deleteAvailabilitySlot(user.token, slotId);
      onUpdate();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '可用性スロットの削除に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConstraint = (constraint: OptimizationConstraint) => {
    setEditingConstraint(constraint);
    setConstraintForm({
      constraintType: constraint.constraintType,
      constraintValue: constraint.constraintValue,
      constraintUnit: constraint.constraintUnit,
      priority: constraint.priority,
      isActive: constraint.isActive,
      metadata: constraint.metadata,
    });
    setConstraintDialogOpen(true);
  };

  const handleEditAvailability = (slot: AvailabilitySlot) => {
    setEditingAvailability(slot);
    setAvailabilityForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      notes: slot.notes,
    });
    setAvailabilityDialogOpen(true);
  };

  const resetConstraintForm = () => {
    setConstraintForm({
      constraintType: 'max_weekly_hours',
      constraintValue: 20,
      constraintUnit: 'hours',
      priority: 3,
      isActive: true,
      metadata: {},
    });
    setEditingConstraint(null);
  };

  const resetAvailabilityForm = () => {
    setAvailabilityForm({
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      notes: '',
    });
    setEditingAvailability(null);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Constraints Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">最適化制約</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    resetConstraintForm();
                    setConstraintDialogOpen(true);
                  }}
                >
                  制約を追加
                </Button>
              </Stack>

              <List>
                {constraints.map(constraint => {
                  const typeInfo = constraintTypes.find(
                    t => t.value === constraint.constraintType
                  );
                  return (
                    <React.Fragment key={constraint.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              {typeInfo?.icon}
                              <Typography variant="subtitle1">
                                {typeInfo?.label || constraint.constraintType}
                              </Typography>
                              <Chip
                                label={constraint.isActive ? '有効' : '無効'}
                                color={
                                  constraint.isActive ? 'success' : 'default'
                                }
                                size="small"
                              />
                            </Stack>
                          }
                          secondary={
                            <Typography variant="body2" color="textSecondary">
                              値: {constraint.constraintValue}{' '}
                              {constraint.constraintUnit}, 優先度:{' '}
                              {constraint.priority}/5
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleEditConstraint(constraint)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteConstraint(constraint.id)
                            }
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  );
                })}
                {constraints.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="制約が設定されていません"
                      secondary="最適化を実行するには制約を追加してください"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Availability Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">可用性スケジュール</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    resetAvailabilityForm();
                    setAvailabilityDialogOpen(true);
                  }}
                >
                  時間を追加
                </Button>
              </Stack>

              <List>
                {availability.map(slot => (
                  <React.Fragment key={slot.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Schedule />
                            <Typography variant="subtitle1">
                              {dayOfWeekLabels[slot.dayOfWeek]}曜日
                            </Typography>
                            <Chip
                              label={slot.isAvailable ? '利用可能' : '利用不可'}
                              color={slot.isAvailable ? 'success' : 'error'}
                              size="small"
                            />
                          </Stack>
                        }
                        secondary={
                          <Typography variant="body2" color="textSecondary">
                            {slot.startTime} - {slot.endTime}
                            {slot.notes && ` (${slot.notes})`}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => handleEditAvailability(slot)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAvailability(slot.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
                {availability.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="可用性スケジュールが設定されていません"
                      secondary="最適化の精度を向上させるため、利用可能な時間を設定してください"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Constraint Dialog */}
      <Dialog
        open={constraintDialogOpen}
        onClose={() => setConstraintDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingConstraint ? '制約を編集' : '新しい制約を追加'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>制約タイプ</InputLabel>
                <Select
                  value={constraintForm.constraintType}
                  onChange={e =>
                    setConstraintForm({
                      ...constraintForm,
                      constraintType: e.target.value as
                        | 'max_weekly_hours'
                        | 'max_monthly_hours'
                        | 'min_monthly_income'
                        | 'max_monthly_income'
                        | 'fuyou_limit'
                        | 'custom',
                    })
                  }
                >
                  {constraintTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {type.icon}
                        <Typography>{type.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="制約値"
                type="number"
                value={constraintForm.constraintValue}
                onChange={e =>
                  setConstraintForm({
                    ...constraintForm,
                    constraintValue: Number(e.target.value),
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>単位</InputLabel>
                <Select
                  value={constraintForm.constraintUnit}
                  onChange={e =>
                    setConstraintForm({
                      ...constraintForm,
                      constraintUnit: e.target.value as
                        | 'hours'
                        | 'yen'
                        | 'percentage'
                        | 'custom',
                    })
                  }
                >
                  <MenuItem value="hours">時間</MenuItem>
                  <MenuItem value="yen">円</MenuItem>
                  <MenuItem value="percentage">パーセント</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>
                優先度: {constraintForm.priority}
              </Typography>
              <Slider
                value={constraintForm.priority}
                onChange={(_, value) =>
                  setConstraintForm({
                    ...constraintForm,
                    priority: value as number,
                  })
                }
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={constraintForm.isActive}
                    onChange={e =>
                      setConstraintForm({
                        ...constraintForm,
                        isActive: e.target.checked,
                      })
                    }
                  />
                }
                label="この制約を有効にする"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConstraintDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleCreateConstraint}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog
        open={availabilityDialogOpen}
        onClose={() => setAvailabilityDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAvailability
            ? '可用性スケジュールを編集'
            : '新しい可用性スケジュールを追加'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>曜日</InputLabel>
                <Select
                  value={availabilityForm.dayOfWeek}
                  onChange={e =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      dayOfWeek: Number(e.target.value),
                    })
                  }
                >
                  {dayOfWeekLabels.map((label, index) => (
                    <MenuItem key={index} value={index}>
                      {label}曜日
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="開始時間"
                type="time"
                value={availabilityForm.startTime}
                onChange={e =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    startTime: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="終了時間"
                type="time"
                value={availabilityForm.endTime}
                onChange={e =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    endTime: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="メモ"
                value={availabilityForm.notes}
                onChange={e =>
                  setAvailabilityForm({
                    ...availabilityForm,
                    notes: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={availabilityForm.isAvailable}
                    onChange={e =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        isAvailable: e.target.checked,
                      })
                    }
                  />
                }
                label="この時間帯を利用可能にする"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvailabilityDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleCreateAvailability}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
