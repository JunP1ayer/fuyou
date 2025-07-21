import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Button,
  Collapse,
  Alert,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Notifications,
  Warning,
  Error as ErrorIcon,
  Info,
  Close,
  ExpandMore,
  ExpandLess,
  NotificationsActive,
  CheckCircle,
} from '@mui/icons-material';
import type { SmartAlert } from '../types/fuyou';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface AlertsPanelProps {
  maxHeight?: number;
  showAll?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  maxHeight = 400,
  showAll = false,
}) => {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = (await apiService.getAlerts(token)) as {
        success: boolean;
        data?: unknown;
        error?: unknown;
      };

      if (
        !('success' in response) ||
        !(response as { success: boolean }).success
      ) {
        throw new Error('アラートの取得に失敗しました');
      }

      const responseData = response as { success: boolean; data?: unknown };
      const alertsData =
        (responseData.data as Array<Record<string, unknown>>) || [];

      // Transform API data to match frontend types
      const transformedAlerts: SmartAlert[] = alertsData.map(alert => ({
        id: alert.id as string,
        alertType: alert.alertType as
          | 'monthly_target'
          | 'yearly_projection'
          | 'limit_approach'
          | 'new_income_detected'
          | 'schedule_optimization',
        severity: alert.severity as 'info' | 'warning' | 'critical',
        title: alert.title as string,
        message: alert.message as string,
        actionSuggestion: alert.actionSuggestion as string,
        isRead: alert.isRead as boolean,
        isDismissed: alert.isDismissed as boolean,
        triggeredAt: alert.triggeredAt as string,
      }));

      setAlerts(transformedAlerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError(
        err instanceof Error ? err.message : '予期せぬエラーが発生しました'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    if (!token) return;

    try {
      await apiService.markAlertAsRead(token, alertId);

      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleDismiss = async (alertId: string) => {
    if (!token) return;

    try {
      await apiService.dismissAlert(token, alertId);

      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, isDismissed: true } : alert
        )
      );
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Notifications />;
    }
  };

  const getSeverityColor = (
    severity: string
  ): 'error' | 'warning' | 'info' | 'default' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}日前`;
    } else if (diffHours > 0) {
      return `${diffHours}時間前`;
    } else {
      return '1時間以内';
    }
  };

  const unreadCount = alerts.filter(
    alert => !alert.isRead && !alert.isDismissed
  ).length;
  const visibleAlerts = alerts.filter(alert => !alert.isDismissed);
  const displayAlerts = showAll ? visibleAlerts : visibleAlerts.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader title="アラート" />
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={100}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="アラート" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsActive
                color={unreadCount > 0 ? 'primary' : 'action'}
              />
            </Badge>
            <Typography variant="h6">アラート</Typography>
          </Box>
        }
        action={
          !showAll &&
          visibleAlerts.length > 3 && (
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              {expanded ? '閉じる' : `すべて表示 (${visibleAlerts.length})`}
            </Button>
          )
        }
      />
      <CardContent>
        {visibleAlerts.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={3}>
            <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              現在、アラートはありません
            </Typography>
          </Box>
        ) : (
          <Box>
            <List
              disablePadding
              sx={{ maxHeight: showAll ? 'none' : maxHeight, overflow: 'auto' }}
            >
              {displayAlerts.map(alert => (
                <ListItem
                  key={alert.id}
                  divider
                  sx={{
                    bgcolor: alert.isRead ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>{getSeverityIcon(alert.severity)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={alert.isRead ? 'normal' : 'bold'}
                        >
                          {alert.title}
                        </Typography>
                        <Chip
                          label={
                            alert.severity === 'critical'
                              ? '緊急'
                              : alert.severity === 'warning'
                                ? '警告'
                                : '情報'
                          }
                          size="small"
                          color={getSeverityColor(alert.severity)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {alert.message}
                        </Typography>
                        {alert.actionSuggestion && (
                          <Typography
                            variant="body2"
                            color="primary"
                            fontStyle="italic"
                          >
                            💡 {alert.actionSuggestion}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: 'block' }}
                        >
                          {formatTimestamp(alert.triggeredAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {!alert.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(alert.id)}
                          title="既読にする"
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDismiss(alert.id)}
                        title="削除"
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {!showAll && (
              <Collapse in={expanded}>
                <List disablePadding sx={{ mt: 1 }}>
                  {visibleAlerts.slice(3).map(alert => (
                    <ListItem
                      key={alert.id}
                      divider
                      sx={{
                        bgcolor: alert.isRead ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        {getSeverityIcon(alert.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.title}
                        secondary={alert.message}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => handleDismiss(alert.id)}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
