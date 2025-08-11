// 🧠 スマート提案コンポーネント

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  useTheme,
  alpha,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  AccessTime,
  Work,
  Person,
  Settings,
  Close,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Info,
  Lightbulb,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartNotifications, useAI } from '../../hooks/useAI';

interface SmartSuggestionsProps {
  compact?: boolean;
  maxSuggestions?: number;
  onSuggestionAccepted?: (suggestion: any) => void;
}

const SuggestionIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'shift':
      return <Work />;
    case 'schedule':
      return <AccessTime />;
    case 'optimization':
      return <TrendingUp />;
    case 'reminder':
      return <Person />;
    default:
      return <Lightbulb />;
  }
};

const SuggestionCard: React.FC<{
  suggestion: any;
  onAccept: () => void;
  onDismiss: () => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}> = ({ suggestion, onAccept, onDismiss, expanded = false, onToggleExpanded }) => {
  const theme = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return '高精度';
    if (confidence >= 0.6) return '中精度';
    return '低精度';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid ${getPriorityColor(suggestion.priority)}`,
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.background.paper, 0.95)} 0%,
            ${alpha(getPriorityColor(suggestion.priority), 0.02)} 100%
          )`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
          transition: 'all 0.2s ease',
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, 
                  ${getPriorityColor(suggestion.priority)} 0%,
                  ${alpha(getPriorityColor(suggestion.priority), 0.7)} 100%
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <SuggestionIcon type={suggestion.type} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {suggestion.title}
                </Typography>
                
                <Chip
                  label={getConfidenceLabel(suggestion.confidence)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: getPriorityColor(suggestion.priority),
                    color: getPriorityColor(suggestion.priority),
                    fontSize: '0.7rem',
                  }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {suggestion.description}
              </Typography>

              {/* 信頼度バー */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    信頼度
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {Math.round(suggestion.confidence * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={suggestion.confidence * 100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: alpha(getPriorityColor(suggestion.priority), 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPriorityColor(suggestion.priority),
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              {/* 展開可能な詳細情報 */}
              <Collapse in={expanded}>
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    詳細データ:
                  </Typography>
                  <Box component="pre" sx={{ 
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 100,
                  }}>
                    {JSON.stringify(suggestion.data, null, 2)}
                  </Box>
                </Box>
              </Collapse>

              {/* アクションボタン */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onAccept}
                  sx={{
                    background: `linear-gradient(135deg, 
                      ${getPriorityColor(suggestion.priority)} 0%,
                      ${alpha(getPriorityColor(suggestion.priority), 0.8)} 100%
                    )`,
                    color: 'white',
                    '&:hover': {
                      background: `linear-gradient(135deg, 
                        ${alpha(getPriorityColor(suggestion.priority), 0.9)} 0%,
                        ${alpha(getPriorityColor(suggestion.priority), 0.7)} 100%
                      )`,
                    },
                  }}
                  startIcon={<CheckCircle />}
                >
                  適用
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onToggleExpanded}
                  startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {expanded ? '閉じる' : '詳細'}
                </Button>
              </Box>
            </Box>

            <IconButton
              size="small"
              onClick={onDismiss}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'error.main',
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  compact = false,
  maxSuggestions = 5,
  onSuggestionAccepted,
}) => {
  const theme = useTheme();
  const { notifications, dismissNotification, acceptSuggestion } = useSmartNotifications();
  const { state: aiState } = useAI();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const displayedSuggestions = showAll 
    ? notifications 
    : notifications.slice(0, maxSuggestions);

  const handleAccept = (suggestion: any) => {
    acceptSuggestion(suggestion);
    dismissNotification(suggestion.id);
    onSuggestionAccepted?.(suggestion);
  };

  const handleDismiss = (suggestionId: string) => {
    dismissNotification(suggestionId);
  };

  const toggleExpanded = (suggestionId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  if (compact && displayedSuggestions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* ヘッダー */}
      {!compact && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: `linear-gradient(135deg, 
                  ${theme.palette.primary.main} 0%, 
                  ${theme.palette.secondary.main} 100%
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Psychology />
            </Box>
            
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                AI スマート提案
              </Typography>
              <Typography variant="body2" color="text.secondary">
                あなたの使用パターンに基づく最適化提案
              </Typography>
            </Box>

            {aiState.isLearning && (
              <Tooltip title="AIが学習中です">
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  px: 2,
                  py: 1,
                  backgroundColor: 'primary.light',
                  borderRadius: 2,
                  color: 'primary.contrastText',
                }}>
                  <Psychology sx={{ animation: 'pulse 2s infinite' }} />
                  <Typography variant="caption">学習中...</Typography>
                </Box>
              </Tooltip>
            )}
          </Box>

          {aiState.lastUpdate && (
            <Typography variant="caption" color="text.secondary">
              最終更新: {aiState.lastUpdate.toLocaleString()}
            </Typography>
          )}
        </Box>
      )}

      {/* 提案リスト */}
      <AnimatePresence>
        {displayedSuggestions.length > 0 ? (
          <>
            {displayedSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion)}
                onDismiss={() => handleDismiss(suggestion.id)}
                expanded={expandedIds.has(suggestion.id)}
                onToggleExpanded={() => toggleExpanded(suggestion.id)}
              />
            ))}

            {!showAll && notifications.length > maxSuggestions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowAll(true)}
                  sx={{ mt: 2, py: 1.5 }}
                >
                  さらに {notifications.length - maxSuggestions} 件の提案を表示
                </Button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 3,
                backgroundColor: 'background.paper',
                borderRadius: 3,
                border: `2px dashed ${theme.palette.divider}`,
              }}
            >
              <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                新しい提案はありません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                アプリを使い続けると、AIがあなたに最適な提案をします
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AIの信頼度情報 */}
      {!compact && aiState.confidence > 0 && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            borderRadius: 2,
            borderLeft: `4px solid ${theme.palette.info.main}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Info color="info" />
            <Typography variant="subtitle2" color="info.main">
              AI精度情報
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            現在のAI提案精度: {Math.round(aiState.confidence * 100)}%
            <br />
            より多くのデータが蓄積されると、提案の精度が向上します。
          </Typography>
        </Box>
      )}
    </Box>
  );
};