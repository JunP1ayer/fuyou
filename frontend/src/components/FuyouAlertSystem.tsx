import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Button,
  Snackbar,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  TrendingUp,
  Schedule,
  Close,
  ExpandMore,
  ExpandLess,
  NotificationsActive,
  NotificationImportant,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import type { FuyouStatus } from '../types/fuyou';

interface FuyouAlert {
  id: string;
  type:
    | 'limit_warning'
    | 'limit_exceeded'
    | 'monthly_target'
    | 'trend_warning'
    | 'system_info';
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: string;
  actionable: boolean;
  suggestedAction?: string;
  timestamp: Date;
  dismissed: boolean;
  persistent: boolean; // 重要なアラートは閉じても再表示
}

interface FuyouAlertSystemProps {
  fuyouStatus: FuyouStatus | null;
  onAlert?: (alert: FuyouAlert) => void;
  compactMode?: boolean;
  showSnackbar?: boolean;
}

export const FuyouAlertSystem: React.FC<FuyouAlertSystemProps> = ({
  fuyouStatus,
  onAlert,
  compactMode = false,
  showSnackbar = true,
}) => {
  useAuth();
  const [alerts, setAlerts] = useState<FuyouAlert[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentSnackbarAlert, setCurrentSnackbarAlert] =
    useState<FuyouAlert | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );

  // アラート生成ロジック
  const generateAlerts = useCallback((status: FuyouStatus): FuyouAlert[] => {
    const newAlerts: FuyouAlert[] = [];
    const now = new Date();

    // 1. 扶養限度額超過アラート
    if (status.isOverLimit) {
      newAlerts.push({
        id: 'limit-exceeded',
        type: 'limit_exceeded',
        severity: 'error',
        title: '扶養限度額を超過しています',
        message: `年収が${formatCurrency(status.selectedLimit.amount)}の限度額を${formatCurrency(status.currentYearIncome - status.selectedLimit.amount)}超過しています。`,
        details:
          '直ちに労働時間の調整が必要です。配偶者控除・扶養控除が適用されません。',
        actionable: true,
        suggestedAction: 'シフトを減らすか、労働時間を調整してください',
        timestamp: now,
        dismissed: false,
        persistent: true,
      });
    }

    // 2. 90%到達警告
    else if (status.percentageUsed >= 90) {
      newAlerts.push({
        id: 'limit-warning-90',
        type: 'limit_warning',
        severity: 'error',
        title: '扶養限度額90%に到達',
        message: `年収が限度額の${status.percentageUsed.toFixed(1)}%に達しています。`,
        details: `残り${formatCurrency(status.remainingCapacity)}です。今月は慎重に働いてください。`,
        actionable: true,
        suggestedAction: '今月のシフトを制限することを強く推奨します',
        timestamp: now,
        dismissed: false,
        persistent: true,
      });
    }

    // 3. 80%到達警告
    else if (status.percentageUsed >= 80) {
      newAlerts.push({
        id: 'limit-warning-80',
        type: 'limit_warning',
        severity: 'warning',
        title: '扶養限度額80%に到達',
        message: `年収が限度額の${status.percentageUsed.toFixed(1)}%に達しています。`,
        details: `残り${formatCurrency(status.remainingCapacity)}です。計画的な労働調整をお勧めします。`,
        actionable: true,
        suggestedAction: '来月以降のシフトを調整検討してください',
        timestamp: now,
        dismissed: false,
        persistent: false,
      });
    }

    // 4. 年間予測超過警告
    if (status.projectedYearIncome > status.selectedLimit.amount) {
      const overageAmount =
        status.projectedYearIncome - status.selectedLimit.amount;
      newAlerts.push({
        id: 'projection-warning',
        type: 'trend_warning',
        severity: 'warning',
        title: '年間予測収入が限度額を超過見込み',
        message: `現在のペースでは年末に${formatCurrency(overageAmount)}の超過が予想されます。`,
        details: '予測は過去3ヶ月の平均を基に算出されています。',
        actionable: true,
        suggestedAction: '月間収入目標を下方修正することを検討してください',
        timestamp: now,
        dismissed: false,
        persistent: false,
      });
    }

    // 5. 月間目標超過アラート
    const currentMonth = now.getMonth() + 1;
    const daysInMonth = new Date(now.getFullYear(), currentMonth, 0).getDate();
    const daysElapsed = now.getDate();
    const dailyTarget = status.monthlyTargetIncome / daysInMonth;
    const expectedIncomeToDate = dailyTarget * daysElapsed;

    if (status.currentMonthIncome > expectedIncomeToDate * 1.2) {
      newAlerts.push({
        id: 'monthly-pace-warning',
        type: 'monthly_target',
        severity: 'warning',
        title: '今月の収入ペースが目標を大幅に上回っています',
        message: `今月${currentMonth}月の収入が予定より${formatCurrency(status.currentMonthIncome - expectedIncomeToDate)}多くなっています。`,
        details: '月末に目標を超過する可能性があります。',
        actionable: true,
        suggestedAction: '残り日数のシフトを調整してください',
        timestamp: now,
        dismissed: false,
        persistent: false,
      });
    }

    // 6. 2025年新制度案内
    if (status.selectedLimit.amount === 1030000) {
      newAlerts.push({
        id: 'new-system-2025',
        type: 'system_info',
        severity: 'info',
        title: '2025年新制度で収入枠が拡大されます',
        message: '2025年より配偶者控除が103万円から123万円に引き上げられます。',
        details:
          '新制度では年間20万円多く働けるようになります。学生の場合は150万円まで可能です。',
        actionable: false,
        timestamp: now,
        dismissed: false,
        persistent: false,
      });
    }

    return newAlerts;
  }, []);

  // フォーマット関数
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // アラート更新
  useEffect(() => {
    if (!fuyouStatus) return;

    const newAlerts = generateAlerts(fuyouStatus);

    // 既存のアラートと比較して新しいもののみ追加
    const currentAlertIds = new Set(alerts.map(alert => alert.id));
    const freshAlerts = newAlerts.filter(
      alert => !currentAlertIds.has(alert.id) && !dismissedAlerts.has(alert.id)
    );

    if (freshAlerts.length > 0) {
      setAlerts(prev => [
        ...prev.filter(
          alert => alert.persistent || !dismissedAlerts.has(alert.id)
        ),
        ...freshAlerts,
      ]);

      // 新しい重要なアラートをスナックバーで表示
      const urgentAlert = freshAlerts.find(alert => alert.severity === 'error');
      if (urgentAlert && showSnackbar) {
        setCurrentSnackbarAlert(urgentAlert);
        setSnackbarOpen(true);
      }

      // コールバック実行
      freshAlerts.forEach(alert => onAlert?.(alert));
    }
  }, [
    fuyouStatus,
    generateAlerts,
    alerts,
    dismissedAlerts,
    onAlert,
    showSnackbar,
  ]);

  // アラート展開/折りたたみ
  const toggleExpanded = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  // アラート削除
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  // アラートアイコン取得
  const getAlertIcon = (
    type: FuyouAlert['type'],
    severity: FuyouAlert['severity']
  ) => {
    switch (type) {
      case 'limit_exceeded':
        return <ErrorIcon />;
      case 'limit_warning':
        return <Warning />;
      case 'trend_warning':
        return <TrendingUp />;
      case 'monthly_target':
        return <Schedule />;
      case 'system_info':
        return <Info />;
      default:
        return severity === 'error' ? <ErrorIcon /> : <Warning />;
    }
  };

  // 重要度ソート
  const sortedAlerts = alerts.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2, success: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const activeAlerts = sortedAlerts.filter(alert => !alert.dismissed);

  if (compactMode) {
    const errorCount = activeAlerts.filter(
      alert => alert.severity === 'error'
    ).length;
    const warningCount = activeAlerts.filter(
      alert => alert.severity === 'warning'
    ).length;

    if (activeAlerts.length === 0) return null;

    return (
      <Card
        sx={{
          border: errorCount > 0 ? '2px solid' : '1px solid',
          borderColor: errorCount > 0 ? 'error.main' : 'warning.main',
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge
                badgeContent={activeAlerts.length}
                color={errorCount > 0 ? 'error' : 'warning'}
              >
                <NotificationsActive
                  color={errorCount > 0 ? 'error' : 'warning'}
                />
              </Badge>
              <Typography variant="body2" fontWeight="bold">
                {errorCount > 0 ? '緊急' : '注意'}: {errorCount + warningCount}
                件のアラート
              </Typography>
            </Box>
            <Button size="small" variant="text">
              詳細
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (activeAlerts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="body1">
              現在、アラートはありません。扶養範囲内で安全に働けています。
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationImportant color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6">
              扶養アラート ({activeAlerts.length}件)
            </Typography>
          </Box>

          <List>
            {activeAlerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  sx={{
                    border: 1,
                    borderColor: `${alert.severity}.main`,
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: `${alert.severity}.light`,
                    color: `${alert.severity}.contrastText`,
                  }}
                >
                  <ListItemIcon>
                    {getAlertIcon(alert.type, alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          {alert.title}
                        </Typography>
                        <Box>
                          {alert.persistent && (
                            <Chip
                              label="重要"
                              size="small"
                              color={alert.severity}
                              sx={{ mr: 1 }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={() => toggleExpanded(alert.id)}
                          >
                            {expandedAlerts.has(alert.id) ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={alert.message}
                  />
                </ListItem>

                <Collapse in={expandedAlerts.has(alert.id)}>
                  <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                    {alert.details && (
                      <Typography variant="body2" paragraph>
                        {alert.details}
                      </Typography>
                    )}
                    {alert.suggestedAction && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <AlertTitle>推奨アクション</AlertTitle>
                        {alert.suggestedAction}
                      </Alert>
                    )}
                  </Box>
                </Collapse>

                {index < activeAlerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* 緊急アラート用スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={8000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={currentSnackbarAlert?.severity || 'warning'}
          sx={{ width: '100%' }}
        >
          <AlertTitle>{currentSnackbarAlert?.title}</AlertTitle>
          {currentSnackbarAlert?.message}
        </Alert>
      </Snackbar>
    </>
  );
};
