// 📱 モバイル最適化統合アプリコンポーネント

import React, { useState, useCallback } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { CalendarApp } from '../calendar/CalendarApp';
import { SwipeableCalendar } from '../calendar/SwipeableCalendar';
import { PullToRefresh } from '../calendar/PullToRefresh';
import { FloatingActionButton } from './FloatingActionButton';
import { BottomNavigation } from '../layout/BottomNavigation';
import { TouchFeedback, triggerHapticFeedback } from './HapticFeedback';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type ViewType = 'calendar' | 'dashboard' | 'add' | 'settings';

interface MobileOptimizedAppProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onNavigateToWorkplaceManager?: () => void;
  children?: React.ReactNode;
}

export const MobileOptimizedApp: React.FC<MobileOptimizedAppProps> = ({
  currentView,
  onViewChange,
  onNavigateToWorkplaceManager,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // リフレッシュ処理
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    triggerHapticFeedback('medium');
    
    try {
      // データを再取得（実際のAPI呼び出しをここに）
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('データを更新しました');
      triggerHapticFeedback('light');
    } catch (error) {
      toast.error('更新に失敗しました');
      triggerHapticFeedback('heavy');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // FABアクション
  const handleAddShift = useCallback(() => {
    triggerHapticFeedback('medium');
    toast.success('シフト追加画面を開きます');
  }, []);

  const handleAddPersonalEvent = useCallback(() => {
    triggerHapticFeedback('medium');
    toast.success('個人予定追加画面を開きます');
  }, []);

  const handleOpenCalendar = useCallback(() => {
    triggerHapticFeedback('light');
    onViewChange('calendar');
  }, [onViewChange]);

  const handleOpenDashboard = useCallback(() => {
    triggerHapticFeedback('light');
    onViewChange('dashboard');
  }, [onViewChange]);

  // 日付クリック処理
  const handleDateClick = useCallback((date: string) => {
    triggerHapticFeedback('light');
    console.log('Date clicked:', date);
  }, []);

  // ビュー切り替えアニメーション
  const viewVariants = {
    enter: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: {
      x: -50,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.15 }
      }
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return (
          <motion.div
            key="calendar"
            variants={viewVariants}
            initial="exit"
            animate="enter"
            exit="exit"
            style={{ height: '100%' }}
          >
            {isMobile ? (
              <PullToRefresh 
                onRefresh={handleRefresh}
                disabled={isRefreshing}
              >
                <SwipeableCalendar onDateClick={handleDateClick} />
              </PullToRefresh>
            ) : (
              <CalendarApp 
                onNavigateToWorkplaceManager={onNavigateToWorkplaceManager}
              />
            )}
          </motion.div>
        );
      
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            variants={viewVariants}
            initial="exit"
            animate="enter"
            exit="exit"
            style={{ height: '100%' }}
          >
            <PullToRefresh onRefresh={handleRefresh}>
              <Box sx={{ 
                p: 2, 
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
              }}>
                ダッシュボード（開発中）
              </Box>
            </PullToRefresh>
          </motion.div>
        );
      
      case 'settings':
        return (
          <motion.div
            key="settings"
            variants={viewVariants}
            initial="exit"
            animate="enter"
            exit="exit"
            style={{ height: '100%' }}
          >
            <Box sx={{ 
              p: 2, 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}>
              設定画面（開発中）
            </Box>
          </motion.div>
        );
      
      default:
        return children;
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'background.default',
      }}
    >
      {/* メインコンテンツエリア */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          pb: isMobile ? '70px' : 0, // ボトムナビゲーション分の余白
        }}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </Box>

      {/* フローティングアクションボタン（モバイルのみ） */}
      {isMobile && (
        <FloatingActionButton
          onAddShift={handleAddShift}
          onAddPersonalEvent={handleAddPersonalEvent}
          onOpenCalendar={handleOpenCalendar}
          onOpenDashboard={handleOpenDashboard}
        />
      )}

      {/* ボトムナビゲーション（モバイルのみ） */}
      {isMobile && (
        <TouchFeedback
          hapticType="selection"
          pressScale={0.98}
          rippleEffect={false}
        >
          <BottomNavigation
            currentView={currentView}
            onViewChange={(view) => {
              triggerHapticFeedback('light');
              onViewChange(view);
            }}
          />
        </TouchFeedback>
      )}

      {/* ローディングオーバーレイ */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                background: 'background.paper',
                borderRadius: 2,
                p: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                color: 'text.primary',
              }}
            >
              更新中...
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};