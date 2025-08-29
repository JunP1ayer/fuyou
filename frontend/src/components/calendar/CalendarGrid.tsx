// カレンダーグリッドコンポーネント（前のロジック使用）

import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle } from 'react';
import { Box, Grid, Typography, alpha, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useI18n } from '@/hooks/useI18n';
import { useUnifiedCalendar } from '../../hooks/useUnifiedCalendar';
import { useUnifiedStore } from '../../store/unifiedStore';
import type { CalendarEvent } from '../../types/calendar';

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

// イベントチップ（単日）- メモ化でレンダリング最適化
const EventChip = React.memo<{ event: CalendarEvent; isPC?: boolean; onClick?: () => void }>(
  ({ event, isPC = false, onClick }) => {
    const displayTitle = event.type === 'shift'
      ? (event.workplace?.name || event.title || '')
      : (event.title || '');
    
    return (
      <Box
        onClick={onClick}
        sx={{
          backgroundColor: event.color || (event.type === 'shift' ? '#1976d2' : '#666'),
          color: '#fff',
          px: isPC ? 0.25 : 0.5,
          py: isPC ? 0.1 : 0.2,
          borderRadius: 0,
          fontSize: isPC ? '11px' : '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          mb: isPC ? 0.05 : 0.1,
          cursor: 'pointer',
          width: '100%',
          display: 'block',
          textAlign: 'left',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          transition: 'all 0.2s ease',
          '&:hover': { 
            opacity: 0.85,
            transform: 'scale(1.02)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          },
        }}
      >
        <Typography variant="caption" sx={{ 
          display: 'block', 
          fontSize: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 1.2,
        }}>
          {displayTitle}
        </Typography>
      </Box>
    );
  }
);

// 連続イベント帯（同一parentIdを連結）- メモ化でレンダリング最適化
const SpanBand = React.memo<{ color: string; title: string; left: boolean; right: boolean; isPC?: boolean }>(
  ({ color, title, left, right, isPC = false }) => (
  <Box
    sx={{
      backgroundColor: color,
      color: '#fff',
      px: isPC ? 0.25 : 0.5,
      py: isPC ? 0.1 : 0.2,
      borderRadius: 0,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      fontSize: isPC ? '12px' : '13px',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      mb: isPC ? 0.05 : 0.1,
      width: '100%',
      display: 'block',
      textShadow: '0 1px 1px rgba(0,0,0,0.35)',
    }}
  >
    {title}
  </Box>
  )
);

// 日付セルコンポーネント - 高度にメモ化（props変更時のみ再レンダリング）
const DateCell = React.memo<{
  day: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isTodayDate: boolean;
  isMobile: boolean;
  onDateClick: (date: Date) => void;
}>(({ day, events, isCurrentMonth, isTodayDate, isMobile, onDateClick }) => {
  const theme = useTheme();
  const dateStr = format(day, 'yyyy-MM-dd');
  const dayEvents = events.filter(e => e.date === dateStr);
  
  // 連続帯イベントの連結情報（同一parentIdで端を判定）
  const spanBands = dayEvents
    .filter(e => e.parentId)
    .map(e => {
      const sameParent = events.filter(ev => ev.parentId === e.parentId);
      const hasLeft = sameParent.some(ev => new Date(ev.date) < new Date(e.date));
      const hasRight = sameParent.some(ev => new Date(ev.date) > new Date(e.date));
      const title = e.type === 'shift' ? (e.workplace?.name || e.title) : e.title;
      return { key: `${e.parentId}-${e.date}`, color: e.color, title, left: !hasLeft, right: !hasRight };
    });
  
  const dayOfWeek = day.getDay();
  const dimOutsideMonth = !isMobile; // スマホは当月以外も薄くしない
  const showMonth = false; // モバイルのセル左上の月テキストを非表示

  return (
    <Box
      sx={{
        height: '100%',
        cursor: 'pointer',
        p: { xs: 0.25, md: 0.5 },
        border: '1px solid',
        borderColor: 'divider',
        borderRight: '1px solid',
        borderBottom: '1px solid',
        backgroundColor: isTodayDate 
          ? alpha(theme.palette.primary.main, 0.1)
          : dayOfWeek === 0 || dayOfWeek === 6 
            ? alpha(theme.palette.action.hover, 0.3)
            : 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
        },
        transition: 'background-color 0.2s ease',
      }}
      onClick={() => onDateClick(day)}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 0.5,
      }}>
        {/* 日付数字 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          minHeight: '20px',
        }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isTodayDate ? 700 : 600,
              color: !isCurrentMonth && dimOutsideMonth
                ? 'text.disabled'
                : isTodayDate
                  ? 'primary.main'
                  : dayOfWeek === 0
                    ? 'error.main'
                    : dayOfWeek === 6
                      ? 'info.main'
                      : 'text.primary',
              fontSize: { xs: '14px', md: '15px' },
              transition: 'color 0.2s ease',
              lineHeight: 1,
            }}
          >
            {format(day, 'd')}
          </Typography>
          {isTodayDate && (
            <Box
              sx={{
                width: 4,
                height: 4,
                backgroundColor: 'primary.main',
                borderRadius: '50%',
                ml: 0.5,
              }}
            />
          )}
        </Box>
        {/* 月表示 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {showMonth && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '10px', lineHeight: 1 }}
            >
              {format(day, 'MMM', { locale: ja })}
            </Typography>
          )}
        </Box>
      </Box>

      {/* イベント表示 */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'stretch', opacity: !isCurrentMonth && dimOutsideMonth ? 0.2 : 1 }}>
        {/* PC版は最大5件、モバイル版は最大3件表示 */}
        {/* まず連続帯を表示（1つだけ代表表示）*/}
        {spanBands.length > 0 && (
          <SpanBand
            key={spanBands[0].key}
            color={spanBands[0].color}
            title={spanBands[0].title}
            left={spanBands[0].left}
            right={spanBands[0].right}
            isPC={!isMobile}
          />
        )}
        {/* 単日イベント */}
        {dayEvents
          .filter(e => !e.parentId)
          .slice(0, isMobile ? 2 : 4)
          .map((event, idx) => (
            <EventChip key={`${event.id}-${idx}`} event={event} isPC={!isMobile} />
          ))}
        
        {/* 残りイベント数 */}
        {dayEvents.length > (isMobile ? 3 : 5) && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '9px' : '10px', mt: 0.25 }}
          >
            +{dayEvents.length - (isMobile ? 3 : 5)}件
          </Typography>
        )}
      </Box>
    </Box>
  );
});

interface CalendarGridProps {
  onDateClick?: (date: string) => void;
}

export const CalendarGrid = React.forwardRef<
  { scrollToToday: () => void },
  CalendarGridProps
>(({ onDateClick }, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('horizontal');
  const { ui: { weekStartsOn } } = useUnifiedStore();
  const { 
    currentMonth, 
    events, 
    openEventDialog,
    setHeaderMonth,
    goToToday,
  } = useUnifiedCalendar();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentMonthRef = useRef<HTMLDivElement | null>(null);

  // 今日の日付に戻る関数
  const scrollToToday = useCallback(() => {
    // まず今日の月に変更
    goToToday();
    // 少し待ってからスクロール（月変更後にスクロール）
    setTimeout(() => {
      if (currentMonthRef.current) {
        currentMonthRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }, [goToToday]);

  // 外部から呼び出し可能にする
  useImperativeHandle(ref, () => ({
    scrollToToday,
  }), [scrollToToday]);

  // 設定から表示モードを読み込み
  useEffect(() => {
    const savedMode = localStorage.getItem('calendarViewMode') as 'vertical' | 'horizontal';
    if (savedMode) {
      setViewMode(savedMode);
    } else {
      // デフォルト設定：全デバイスで横スクロール
      const defaultMode = 'horizontal';
      setViewMode(defaultMode);
      localStorage.setItem('calendarViewMode', defaultMode);
    }
  }, [isMobile]);

  // デバイス変更時の自動調整
  useEffect(() => {
    const savedMode = localStorage.getItem('calendarViewMode') as 'vertical' | 'horizontal';
    if (!savedMode) {
      // 保存されていない場合は横スクロールをデフォルトに
      const defaultMode = 'horizontal';
      setViewMode(defaultMode);
      localStorage.setItem('calendarViewMode', defaultMode);
    }
  }, [isMobile]);

  // 設定変更をリアルタイムで反映
  useEffect(() => {
    const handleStorageChange = () => {
      const savedMode = localStorage.getItem('calendarViewMode') as 'vertical' | 'horizontal';
      if (savedMode && savedMode !== viewMode) {
        setViewMode(savedMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [viewMode]);

  // 日付クリック処理
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (onDateClick) {
      onDateClick(dateStr);
    } else {
      openEventDialog(dateStr);
    }
  };

  // 超軽量仮想スクロール設定
  const [visibleRange, setVisibleRange] = useState({ start: -1, end: 1 }); // 最小範囲で高速化
  const [scrollOffset, setScrollOffset] = useState(0);
  const monthRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isLoadingRef = useRef(false);
  const lastScrollTime = useRef(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);


  // 縦スクロール用の月間データ生成（メモ化で最適化）
  const generateVisibleMonths = useMemo(() => {
    const months: Date[] = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      months.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1));
    }
    return months;
  }, [currentMonth, visibleRange]);

  // PC版は単月表示、モバイル版は仮想スクロール
  const multipleMonths = isMobile && viewMode === 'vertical' ? generateVisibleMonths : [currentMonth];
  
  
  // 初期スクロール位置を当月へ
  useEffect(() => {
    if (isMobile && viewMode === 'vertical' && containerRef.current && currentMonthRef.current) {
      const container = containerRef.current;
      const targetTop = currentMonthRef.current.offsetTop;
      container.scrollTop = Math.max(0, targetTop - 40);
    }
  }, [isMobile, viewMode, currentMonth]);

  // requestAnimationFrame用のref
  const throttleTimeoutRef = useRef<number | null>(null);

  // 高速スクロールハンドラー（ヘッダー月表示の即座更新を追加）
  const handleScrollCore = useCallback((): void => {
    if (!containerRef.current || !isMobile || viewMode !== 'vertical' || isLoadingRef.current) return;
    
    const now = Date.now();
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // ヘッダー月表示の即座更新（最優先処理）
    const centerY = scrollTop + clientHeight / 2;
    let closestMonth: Date | null = null;
    let minDistance = Infinity;
    
    // 各月の要素を確認してスクロール中央に最も近い月を特定
    monthRefs.current.forEach((monthElement, monthOffset) => {
      if (!monthElement) return;
      
      const elementTop = monthElement.offsetTop;
      const elementBottom = elementTop + monthElement.offsetHeight;
      const elementCenter = elementTop + monthElement.offsetHeight / 2;
      
      // 要素の中央がスクロール中央に最も近い月を計算
      const distance = Math.abs(elementCenter - centerY);
      if (distance < minDistance && elementBottom > scrollTop && elementTop < scrollTop + clientHeight) {
        minDistance = distance;
        closestMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
      }
    });
    
    // 最も近い月が見つかった場合、即座にヘッダーを更新
    if (closestMonth) {
      setHeaderMonth(closestMonth);
    }
    
    // 超軽量スクロール処理（最小限の仮想スクロール）
    const scrollSpeed = Math.abs(scrollTop - (scrollOffset || 0));
    if (scrollSpeed > 1000 || now - lastScrollTime.current < 150) {
      setScrollOffset(scrollTop);
      return;
    }
    lastScrollTime.current = now;
    setScrollOffset(scrollTop);
    
    // 最小限の境界検出（3ヶ月表示に制限）
    const threshold = clientHeight * 1.5;
    
    // 上端検出（最小限の追加）
    if (scrollTop < threshold && visibleRange.start > -6) {
      isLoadingRef.current = true;
      setVisibleRange(prev => ({ start: prev.start - 1, end: prev.end }));
      setTimeout(() => { isLoadingRef.current = false; }, 50);
    }
    
    // 下端検出（最小限の追加）
    if (scrollTop + clientHeight > scrollHeight - threshold && visibleRange.end < 6) {
      isLoadingRef.current = true;
      setVisibleRange(prev => ({ start: prev.start, end: prev.end + 1 }));
      setTimeout(() => { isLoadingRef.current = false; }, 50);
    }
    
    // 積極的範囲制限（3ヶ月まで）
    const currentRange = visibleRange.end - visibleRange.start;
    if (currentRange > 3) {
      const scrollRatio = scrollTop / Math.max(scrollHeight, 1);
      if (scrollRatio > 0.7) {
        setVisibleRange(prev => ({ start: prev.start + 1, end: prev.end }));
      } else if (scrollRatio < 0.3) {
        setVisibleRange(prev => ({ start: prev.start, end: prev.end - 1 }));
      }
    }
    
  }, [isMobile, viewMode, currentMonth, setHeaderMonth]);

  // 高速スクロールハンドラー（より軽量化）
  const handleScroll = useCallback((): void => {
    // ヘッダー更新は毎回実行、重い処理のみフレーム制限
    if (!containerRef.current || !isMobile || viewMode !== 'vertical') return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const centerY = scrollTop + clientHeight / 2;
    
    // ヘッダー月表示の高速更新（フレーム制限なし）
    let closestMonth: Date | null = null;
    let minDistance = Infinity;
    
    monthRefs.current.forEach((monthElement, monthOffset) => {
      if (!monthElement) return;
      const elementCenter = monthElement.offsetTop + monthElement.offsetHeight / 2;
      const distance = Math.abs(elementCenter - centerY);
      if (distance < minDistance) {
        minDistance = distance;
        closestMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
      }
    });
    
    if (closestMonth) {
      setHeaderMonth(closestMonth);
    }
    
    // 重い仮想スクロール処理のみフレーム制限
    if (throttleTimeoutRef.current) return;
    throttleTimeoutRef.current = requestAnimationFrame(() => {
      handleScrollCore();
      throttleTimeoutRef.current = null;
    });
  }, [handleScrollCore, isMobile, viewMode, currentMonth, setHeaderMonth]);

  // スクロールイベントリスナー登録（最適化）
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile || viewMode !== 'vertical') return undefined;
    
    // パッシブリスナーで性能向上
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      // requestAnimationFrameのクリーンアップ
      if (throttleTimeoutRef.current) {
        cancelAnimationFrame(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
    };
  }, [handleScroll, isMobile, viewMode]);

  return (
    <Box ref={containerRef} sx={{ 
      height: 'calc(100vh - 140px)', // ナビゲーション分を除いた高さ（ヘッダー44px + 広告48px + ボトムナビ48px）
      display: 'flex', 
      flexDirection: 'column',
      overflowY: isMobile ? 'auto' : 'hidden',
      overflowX: 'hidden',
      // スムーズスクロール設定
      scrollBehavior: 'smooth',
      WebkitOverflowScrolling: 'touch', // iOSでスムーズなスクロール
      // 端まで表示（全ての余白を削除）
      px: 0,
      mx: 0,
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* 曜日ヘッダー - 固定表示（設定に応じて月曜始まり/日曜始まり） */}
      <Box sx={{ 
        height: { xs: '34px', md: '36px' }, 
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100, // 月境界線より確実に上に表示
        backgroundColor: 'background.paper',
      }}>
        <Grid container spacing={0} sx={{ height: '100%' }}>
          {(weekStartsOn === 1 ? [1,2,3,4,5,6,0] : [0,1,2,3,4,5,6]).map((dow, index) => {
            const day = t(`calendar.weekdays.${dow}`, WEEKDAYS_JA[dow]);
            return (
              <Grid item xs key={day}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    letterSpacing: 0.2,
                    fontSize: { xs: '12px', md: '13px' },
                    color: dow === 0 ? 'error.main' : dow === 6 ? 'info.main' : 'text.secondary',
                    backgroundColor: 'background.paper',
                    position: 'relative',
                    zIndex: 1, // 親のz-indexを継承して確実に表示
                  }}
                >
                  {day}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* カレンダー本体 */}
      <Box sx={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        height: viewMode === 'horizontal' && isMobile 
          ? 'calc(100vh - 200px)' // 横モード時は画面いっぱいに
          : isMobile ? 'auto' : 'calc(100% - 36px)', // 曜日ヘッダー分を差し引く（PC版は36px）
        minHeight: 0,
        px: 0, // 全ての余白を削除
        py: 0, // 全ての余白を削除
        m: 0,  // 全てのマージンを削除
        gap: 0, // フレックスアイテム間のギャップを削除
        width: '100%',
      }}>
        {multipleMonths.map((month, monthIndex) => {
          const monthOffset = visibleRange.start + monthIndex; // 実際の月のオフセット
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const isCurrentMonth = isSameMonth(month, new Date()); // 今日を含む月かチェック
          // 設定に応じた週の開始日
          const weekStartDay = weekStartsOn;
          // 週の重複を避けるため、当月の日付を含む週のみを表示
          const calendarStart = startOfWeek(monthStart, { weekStartsOn: weekStartDay });
          const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: weekStartDay });
          const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
          
          const weeks: Date[][] = [];
          for (let i = 0; i < calendarDays.length; i += 7) {
            const week = calendarDays.slice(i, i + 7);
            
            if (isMobile && viewMode === 'vertical') {
              // 月をまたぐ週の重複を防ぐ：厳格なルール適用
              const currentMonthDays = week.filter(day => isSameMonth(day, month)).length;
              
              
              // 厳格な条件：当月の日数が4日以上の場合のみ表示
              if (currentMonthDays >= 4) {
                weeks.push(week);
              }
              // 例外：当月日数が3日でも月初週（1日含む）で、かつ前月が週の大部分を占めない場合のみ表示
              else if (currentMonthDays === 3) {
                const hasFirstDay = week.some(day => 
                  isSameMonth(day, month) && day.getDate() === 1
                );
                // 前月が4日以上ある場合は表示しない（前月側で既に表示済み）
                const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
                const prevMonthDays = week.filter(day => isSameMonth(day, prevMonth)).length;
                
                if (hasFirstDay && prevMonthDays < 4) {
                  weeks.push(week);
                }
              }
              // 当月日数が1-2日の場合は表示しない（重複回避）
            } else {
              // PC版は従来通り（6週間）
              weeks.push(week);
            }
          }
          
          // モバイルのみ5週間表示に制限（35マス）
          const limitedWeeks = isMobile ? weeks.slice(0, 5) : weeks;
          
          // 月refの管理（スクロールハンドラーで使用）

          return (
            <Box
              key={`month-${monthOffset}`} // ユニークなキーを使用
              ref={(node) => {
                if (node && node instanceof HTMLDivElement) {
                  if (isCurrentMonth) currentMonthRef.current = node; // 今日を含む月にrefを設定
                  monthRefs.current.set(monthOffset, node); // 月のrefを保存（スクロールハンドラーで使用）
                }
              }}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                mb: 0, // 月間の余白を完全削除
                pb: 0, // 月の下パディングを削除
                flex: viewMode === 'vertical' ? 'none' : 1,
                minHeight: 0,
                // 月境界線は削除（日付セル間で処理）
              }}
            >
              {/* 背景の薄い月数字 */}
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '120px', md: '200px' },
                  color: alpha(theme.palette.text.primary, 0.08), // もう少し濃くして見やすく
                  lineHeight: 1,
                  zIndex: 1, // 日付セルの上に配置
                }}
              >
                {format(month, 'M')}
              </Box>
              {/* 月表示ヘッダーを削除してシームレススクロールを実現 */}

              {limitedWeeks.map((week, weekIndex) => (
                <Box key={weekIndex} sx={{ 
                  flex: 1,
                  height: `calc(100% / ${limitedWeeks.length})`,
                  minHeight: viewMode === 'horizontal' && isMobile ? '70px' : isMobile ? '80px' : 0,
                  m: 0, // 週の余白を削除
                  p: 0, // 週のパディングを削除
                  // 月境界線を削除してシームレスに
                  border: 'none',
                }}>
                  <Box sx={{ 
                    height: '100%',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridTemplateRows: '1fr',
                    gap: 0,
                    // すべてのボーダーを無効化（セル個別の絶対配置のみ使用）
                    border: 'none',
                    '& > *': {
                      border: 'none !important',
                      borderTop: 'none !important',
                      borderBottom: 'none !important',
                      borderLeft: 'none !important',
                      borderRight: 'none !important',
                    },
                  }}>
                  {week.map((day, dayIndex) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = events.filter(e => e.date === dateStr);
                    // 連続帯イベントの連結情報（同一parentIdで端を判定）
                    const spanBands = dayEvents
                      .filter(e => e.parentId)
                      .map(e => {
                        const sameParent = events.filter(ev => ev.parentId === e.parentId);
                        const hasLeft = sameParent.some(ev => new Date(ev.date) < new Date(e.date));
                        const hasRight = sameParent.some(ev => new Date(ev.date) > new Date(e.date));
                        const title = e.type === 'shift' ? (e.workplace?.name || e.title) : e.title;
                        return { key: `${e.parentId}-${e.date}`, color: e.color, title, left: !hasLeft, right: !hasRight };
                      });
                    const isCurrentMonth = isSameMonth(day, month);
                    const isTodayDate = isToday(day);
                    const dayOfWeek = day.getDay();
                    const dimOutsideMonth = viewMode === 'horizontal'; // 横スワイプモードでは当月以外を薄く
                    const showMonth = false; // モバイルのセル左上の月テキストを非表示
                    
                    // 2次元配列での月境界線判定
                    const sameMonth = (a: Date, b: Date) =>
                      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
                    
                    // 現在の週と日のインデックス（2次元配列での位置）
                    const r = limitedWeeks.indexOf(week); // 行（週）インデックス
                    const c = dayIndex; // 列（日）インデックス
                    
                    // 境界線判定（月の外周のみを囲む）
                    const monthBorders = {
                      top: false,
                      bottom: false,  
                      left: false,
                      right: false,
                    };
                    
                    // 縦スクロールモードでのみ月境界線を計算
                    if (viewMode === 'vertical' && sameMonth(day, month)) {
                      // 各方向の隣接セルをチェック
                      const hasUp = r > 0;
                      const hasDown = r < limitedWeeks.length - 1;
                      const hasLeft = c > 0;
                      const hasRight = c < 6;
                      
                      const upIsCurrent = hasUp ? sameMonth(limitedWeeks[r - 1][c], month) : false;
                      const downIsCurrent = hasDown ? sameMonth(limitedWeeks[r + 1][c], month) : false;
                      const leftIsCurrent = hasLeft ? sameMonth(limitedWeeks[r][c - 1], month) : false;
                      const rightIsCurrent = hasRight ? sameMonth(limitedWeeks[r][c + 1], month) : false;
                      
                      // 月の範囲を特定
                      const currentDate = day.getDate();
                      const isFirstDayOfMonth = currentDate === 1;
                      const isLastDayOfMonth = currentDate === new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                      
                      // 月の境界線を正しく描く
                      // 上線: 月初め（1日）の行全体に引く
                      const currentWeek = limitedWeeks[r];
                      const weekHasFirstDay = currentWeek.some(d => sameMonth(d, month) && d.getDate() === 1);
                      const weekHasLastDay = currentWeek.some(d => sameMonth(d, month) && d.getDate() === new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
                      
                      monthBorders.top = weekHasFirstDay;
                      // 下線: 月末（最終日）の行全体に引く
                      monthBorders.bottom = weekHasLastDay;
                      
                      // 左右の線: 隣接セルが当月でない場合のみ、かつカレンダーの端（列0、6）ではない場合
                      monthBorders.left = !leftIsCurrent && c > 0;   // 左に当月セルがなく、かつカレンダーの左端ではない
                      monthBorders.right = !rightIsCurrent && c < 6; // 右に当月セルがなく、かつカレンダーの右端ではない
                    }
                    
                    // 縦スクロールモードでのみ前月・翌月セルにも月境界線を表示
                    if (viewMode === 'vertical' && !sameMonth(day, month)) {
                      const currentWeek = limitedWeeks[r];
                      const weekHasFirstDay = currentWeek.some(d => sameMonth(d, month) && d.getDate() === 1);
                      const weekHasLastDay = currentWeek.some(d => sameMonth(d, month) && d.getDate() === new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
                      
                      // 前月セル（例：30日）は下線のみ、翌月セル（例：1,2,3日）は上線のみ
                      const isPreviousMonth = day < month;
                      const isNextMonth = day > month;
                      
                      if (isPreviousMonth) {
                        // 前月セルは下線のみ
                        monthBorders.top = false;
                        monthBorders.bottom = weekHasFirstDay; // 1日を含む週のみ
                      } else if (isNextMonth) {
                        // 翌月セルは上線のみ
                        monthBorders.top = weekHasLastDay; // 最終日を含む週のみ
                        monthBorders.bottom = false;
                      }
                      
                      // 前月・翌月セルには左右の縦線は引かない
                      monthBorders.left = false;
                      monthBorders.right = false;
                    }
                    
                    return (
                      <Box key={dayIndex} sx={{ 
                        height: '100%',
                        minWidth: 0,
                        position: 'relative',
                        overflow: 'visible', // はみ出しを許可
                      }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: '100%',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            border: 'none',
                            position: 'relative',
                            boxSizing: 'border-box',
                            backgroundColor: !isCurrentMonth && dimOutsideMonth 
                              ? alpha(theme.palette.action.disabledBackground, 0.05)
                              : alpha(theme.palette.background.paper, 0.8),
                            outline: isTodayDate ? `2px solid ${alpha(theme.palette.primary.main, 0.6)}` : 'none',
                            outlineOffset: '-1px',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                          onClick={() => handleDateClick(day)}
                        >
                          {/* 月境界線：縦スクロールモードのみ表示 */}
                          {viewMode === 'vertical' && monthBorders.top && (
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '1px',
                              backgroundColor: '#000000',
                              zIndex: 10,
                              pointerEvents: 'none',
                              transform: 'translateY(-0.5px)',
                            }} />
                          )}
                          {viewMode === 'vertical' && monthBorders.bottom && (
                            <Box sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '1px',
                              backgroundColor: '#000000',
                              zIndex: 10,
                              pointerEvents: 'none',
                              transform: 'translateY(0.5px)',
                            }} />
                          )}
                          {viewMode === 'vertical' && monthBorders.left && (
                            <Box sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '1px',
                              backgroundColor: '#000000',
                              zIndex: 10,
                              pointerEvents: 'none',
                              transform: 'translateX(-0.5px)',
                            }} />
                          )}
                          {viewMode === 'vertical' && monthBorders.right && (
                            <Box sx={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: '1px',
                              backgroundColor: '#000000',
                              zIndex: 10,
                              pointerEvents: 'none',
                              transform: 'translateX(0.5px)',
                            }} />
                          )}
                          
                          {/* 細いグリッド線（従来のグリッド線）- 全セル */}
                          {(
                            <>
                              <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '0.5px',
                                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                zIndex: 1,
                                transform: 'translateY(-0.25px)',
                              }} />
                              <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '0.5px',
                                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                zIndex: 1,
                                transform: 'translateY(0.25px)',
                              }} />
                              <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: '0.5px',
                                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                zIndex: 1,
                                transform: 'translateX(-0.25px)',
                              }} />
                              <Box sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: '0.5px',
                                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                                zIndex: 1,
                                transform: 'translateX(0.25px)',
                              }} />
                            </>
                          )}
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start', 
                            position: 'relative', 
                            zIndex: 3, 
                            px: { xs: 0.75, md: 0.75 }, 
                            pt: { xs: 0.5, md: 0.5 } 
                          }}>
                            {/* 日付数字を左側に表示 */}
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isTodayDate ? 700 : showMonth ? 600 : 500,
                                fontSize: { xs: '16px', md: '15px' },
                                color:
                                  !isCurrentMonth && dimOutsideMonth
                                    ? alpha(theme.palette.text.disabled, 0.3)
                                    : dayOfWeek === 0
                                      ? 'error.main'
                                      : dayOfWeek === 6
                                        ? 'info.main'
                                        : 'text.primary',
                                lineHeight: 1,
                              }}
                            >
                              {format(day, 'd')}
                            </Typography>
                            {/* モバイル版で月の1日目に月表示（右側に移動） */}
                            {showMonth && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: 'primary.main',
                                  lineHeight: 1,
                                  ml: 0.5,
                                }}
                              >
                                {format(day, 'M')}月
                              </Typography>
                            )}
                          </Box>

                          {/* イベント表示 */}
                          <Box sx={{ 
                            flex: 1, 
                            overflow: 'hidden', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'stretch', 
                            opacity: !isCurrentMonth && dimOutsideMonth ? 0.3 : 1, 
                            px: { xs: 0.5, md: 0.75 },
                            pb: { xs: 0.25, md: 0.25 }
                          }}>
                            {/* PC版は最大5件、モバイル版は最大3件表示 */}
                            {/* まず連続帯を表示（1つだけ代表表示）*/}
                            {spanBands.length > 0 && (
                              <SpanBand
                                key={spanBands[0].key}
                                color={spanBands[0].color}
                                title={spanBands[0].title}
                                left={spanBands[0].left}
                                right={spanBands[0].right}
                                isPC={!isMobile}
                              />
                            )}
                            {/* 単日イベント */}
                            {dayEvents
                              .filter(e => !e.parentId)
                              .slice(0, isMobile ? 3 : 5)
                              .map((event) => (
                                <EventChip key={event.id} event={event} isPC={!isMobile} />
                              ))}
                            {dayEvents.length > (isMobile ? 3 : 5) && (
                              <Typography sx={{ fontSize: { xs: '11px', md: '12px' }, color: 'text.secondary', fontWeight: 600 }}>
                                +{dayEvents.length - (isMobile ? 3 : 5)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  </Box>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});