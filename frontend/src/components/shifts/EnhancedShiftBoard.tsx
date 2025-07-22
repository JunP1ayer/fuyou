import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  getDay,
  isSameMonth,
  isToday
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';

// コンポーネントのインポート
interface ShiftFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  workplaces: Record<string, Workplace>;
  onSave: (shiftData: Omit<Shift, 'id'>) => void;
}

// 型定義
interface Shift {
  id: string;
  date: string;
  workplaceId: string;
  workplace: string;
  start: string;
  end: string;
  crossMidnight?: boolean;
  earnings: number;
  hours: number;
}

interface Workplace {
  id: string;
  name: string;
  baseHourly: number;
  transportation?: number;
  color: string;
}

interface MonthlyStats {
  totalHours: number;
  totalEarnings: number;
  shiftCount: number;
  avgHours: number;
}

interface MonthlyGoal {
  targetEarnings: number;
  targetHours: number;
  targetShifts: number;
}

const EnhancedShiftBoard: React.FC = () => {
  // Auth integration
  const { token } = useAuth();
  
  // State管理
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Record<string, Shift>>({});
  const [workplaces, setWorkplaces] = useState<Record<string, Workplace>>({});
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isWorkplaceModalOpen, setIsWorkplaceModalOpen] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState<MonthlyGoal>({
    targetEarnings: 80000,
    targetHours: 60,
    targetShifts: 15
  });

  // LocalStorage keys
  const STORAGE_KEYS = useMemo(() => ({
    shifts: 'enhancedShiftBoard_shifts',
    workplaces: 'enhancedShiftBoard_workplaces',
    goals: 'enhancedShiftBoard_goals'
  }), []);

  // データの読み込み
  const loadFromStorage = useCallback(() => {
    try {
      // シフトデータの読み込み
      const savedShifts = localStorage.getItem(STORAGE_KEYS.shifts);
      if (savedShifts) {
        setShifts(JSON.parse(savedShifts));
      }

      // 職場データの読み込み
      const savedWorkplaces = localStorage.getItem(STORAGE_KEYS.workplaces);
      if (savedWorkplaces) {
        setWorkplaces(JSON.parse(savedWorkplaces));
      } else {
        // 初回のみサンプルデータを設定
        const sampleWorkplaces: Record<string, Workplace> = {
          'convenience-a': {
            id: 'convenience-a',
            name: 'コンビニA店',
            baseHourly: 1200,
            transportation: 300,
            color: 'blue'
          },
          'cafe-b': {
            id: 'cafe-b',
            name: 'カフェB店',
            baseHourly: 1100,
            transportation: 200,
            color: 'green'
          },
          'restaurant-c': {
            id: 'restaurant-c',
            name: 'レストランC店',
            baseHourly: 1300,
            transportation: 400,
            color: 'orange'
          }
        };
        setWorkplaces(sampleWorkplaces);
        localStorage.setItem(STORAGE_KEYS.workplaces, JSON.stringify(sampleWorkplaces));
      }

      // 目標データの読み込み
      const savedGoals = localStorage.getItem(STORAGE_KEYS.goals);
      if (savedGoals) {
        setMonthlyGoal(JSON.parse(savedGoals));
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }, [STORAGE_KEYS]);

  // データの保存
  const saveToStorage = useCallback((key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, []);

  // 初期データ設定
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // シフトデータの変更を監視してLocalStorageに保存
  useEffect(() => {
    if (Object.keys(shifts).length > 0) {
      saveToStorage(STORAGE_KEYS.shifts, shifts);
    }
  }, [shifts, saveToStorage, STORAGE_KEYS.shifts]);

  // 職場データの変更を監視してLocalStorageに保存
  useEffect(() => {
    if (Object.keys(workplaces).length > 0) {
      saveToStorage(STORAGE_KEYS.workplaces, workplaces);
    }
  }, [workplaces, saveToStorage, STORAGE_KEYS.workplaces]);

  // 目標データの変更を監視してLocalStorageに保存
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.goals, monthlyGoal);
  }, [monthlyGoal, saveToStorage, STORAGE_KEYS.goals]);

  // カレンダー日付生成
  const generateCalendarDates = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    // 月初の曜日に合わせて前月の日を最小限追加（要件：前後月埋めは最小限）
    const startDayOfWeek = getDay(start);
    const emptyDays = Array(startDayOfWeek).fill(null);
    
    return [...emptyDays, ...days];
  };

  // 月次統計計算
  const calculateMonthlyStats = (): MonthlyStats => {
    const monthShifts = Object.values(shifts).filter(shift => {
      const shiftDate = new Date(shift.date);
      return isSameMonth(shiftDate, currentDate);
    });

    const totalHours = monthShifts.reduce((sum, shift) => sum + shift.hours, 0);
    const totalEarnings = monthShifts.reduce((sum, shift) => sum + shift.earnings, 0);
    const shiftCount = monthShifts.length;
    const avgHours = shiftCount > 0 ? totalHours / shiftCount : 0;

    return { totalHours, totalEarnings, shiftCount, avgHours };
  };

  // 年間扶養ステータス計算
  const calculateFuyouStatus = () => {
    const monthlyStats = calculateMonthlyStats();
    const yearlyEarnings = monthlyStats.totalEarnings * 12; // 月平均から年間予測
    const fuyouLimit = 1030000;
    const remainingAmount = Math.max(0, fuyouLimit - yearlyEarnings);
    const achievementRate = Math.min(100, (yearlyEarnings / fuyouLimit) * 100);

    return {
      yearlyEarnings,
      remainingAmount,
      achievementRate: Math.round(achievementRate),
      alertType: achievementRate < 80 ? 'success' : achievementRate < 95 ? 'warning' : 'danger'
    };
  };

  // 日付クリックハンドラー
  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    setIsShiftModalOpen(true);
  };

  // 月変更
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  // シフト保存ハンドラー（API統合準備済み）
  const handleSaveShift = async (shiftData: Omit<Shift, 'id'>) => {
    try {
      const newShift: Shift = {
        ...shiftData,
        id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // ローカル状態を即座に更新
      setShifts(prev => ({
        ...prev,
        [selectedDate]: newShift
      }));
      
      // APIとの統合（現在はモック、将来的に実装）
      if (token) {
        try {
          const response = await apiService.createShift(token, {
            jobSourceId: shiftData.workplaceId,
            jobSourceName: shiftData.workplace,
            date: shiftData.date,
            startTime: shiftData.start,
            endTime: shiftData.end,
            hourlyRate: workplaces[shiftData.workplaceId]?.baseHourly || 1000,
            breakMinutes: 0,
            description: `${shiftData.workplace}でのシフト勤務`,
            isConfirmed: false
          });
          console.log('Shift saved to API:', response);
        } catch (apiError) {
          console.error('API error (continuing with local data):', apiError);
          // APIエラーでもローカルデータは保持
        }
      }
      
      setIsShiftModalOpen(false);
    } catch (error) {
      console.error('Failed to save shift:', error);
      alert('シフトの保存に失敗しました。もう一度お試しください。');
    }
  };

  const calendarDates = generateCalendarDates();
  const monthlyStats = calculateMonthlyStats();
  const fuyouStatus = calculateFuyouStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl p-6 mb-5 shadow-xl">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-3 mb-2">
            🏦 扶養管理 - シフトボード
          </h1>
          <p className="text-gray-600">学生アルバイター向け扶養控除自動管理システム</p>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* 扶養ステータス */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📊 扶養ステータス
            </h2>
            
            {/* アラート */}
            <div className={`p-4 rounded-xl mb-5 font-medium border-l-4 ${
              fuyouStatus.alertType === 'success' 
                ? 'bg-green-50 text-green-700 border-green-500'
                : fuyouStatus.alertType === 'warning'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-500'
                : 'bg-red-50 text-red-700 border-red-500'
            }`}>
              {fuyouStatus.alertType === 'success' && '扶養内です！安全な範囲で働けています。'}
              {fuyouStatus.alertType === 'warning' && '注意: 扶養限度額に近づいています。'}
              {fuyouStatus.alertType === 'danger' && '危険: 扶養限度額を超過する可能性があります！'}
            </div>

            {/* 進捗バー */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>今年の収入: {fuyouStatus.yearlyEarnings.toLocaleString()}円</span>
                <span>限度額: 1,030,000円</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${fuyouStatus.achievementRate}%` }}
                />
              </div>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-blue-600">{fuyouStatus.achievementRate}%</div>
                <div className="text-xs text-gray-600">達成率</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-blue-600">{fuyouStatus.remainingAmount.toLocaleString()}円</div>
                <div className="text-xs text-gray-600">残り余裕</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-blue-600">{fuyouStatus.yearlyEarnings.toLocaleString()}円</div>
                <div className="text-xs text-gray-600">年末予測</div>
              </div>
            </div>
          </div>

          {/* クイックアクション */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4">⚡ クイックアクション</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setIsWorkplaceModalOpen(true)}
                className="w-full bg-blue-600 text-white rounded-xl p-4 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                🏢 バイト先を管理
              </button>
              <button 
                onClick={() => {
                  setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                  setIsShiftModalOpen(true);
                }}
                className="w-full border-2 border-blue-600 text-blue-600 rounded-xl p-4 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                ➕ シフト追加
              </button>
              <button className="w-full border-2 border-blue-600 text-blue-600 rounded-xl p-4 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                📸 シフト表を撮影
              </button>
            </div>
          </div>
        </div>

        {/* シフトカレンダー */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-bold">
              📅 シフトカレンダー - {format(currentDate, 'yyyy年M月', { locale: ja })}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevMonth}
                className="bg-gray-100 hover:bg-gray-200 rounded-lg p-2 transition-colors"
              >
                ‹
              </button>
              <button 
                onClick={handleNextMonth}
                className="bg-gray-100 hover:bg-gray-200 rounded-lg p-2 transition-colors"
              >
                ›
              </button>
            </div>
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-2">
            {/* 曜日ヘッダー */}
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div 
                key={day} 
                className={`text-center font-bold p-2 ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
            
            {/* 日付セル */}
            {calendarDates.map((date, index) => {
              const isCurrentMonth = date ? isSameMonth(date, currentDate) : false;
              const isCurrentDay = date ? isToday(date) : false;
              const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
              const shift = shifts[dateStr];

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`
                    min-h-20 border border-gray-200 rounded-lg p-1 cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-400 hover:shadow-md
                    ${!date ? 'cursor-default hover:bg-transparent hover:border-gray-200 hover:shadow-none' : ''}
                    ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'bg-white'}
                    ${isCurrentDay ? 'bg-yellow-100 border-yellow-400 font-bold' : ''}
                    ${shift ? 'bg-gradient-to-br from-green-100 to-green-50 border-green-400' : ''}
                  `}
                >
                  {date && (
                    <>
                      <div className="text-center font-medium mb-1">
                        {format(date, 'd')}
                      </div>
                      {shift && (
                        <div className="bg-green-500 text-white text-xs rounded-full px-2 py-1 text-center font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                          {shift.start}-{shift.end}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* シフト一覧 */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            📝 {format(currentDate, 'M月', { locale: ja })}のシフト一覧
          </h3>
          
          {monthlyStats.shiftCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>今月のシフトはまだ登録されていません</p>
              <p className="text-sm mt-1">カレンダーの日付をクリックしてシフトを登録しましょう</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(shifts)
                .filter(([date]) => {
                  const shiftDate = new Date(date);
                  return isSameMonth(shiftDate, currentDate);
                })
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, shift]) => (
                  <div 
                    key={date}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold text-gray-800">
                          {format(new Date(date), 'd日')}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({format(new Date(date), 'E', { locale: ja })})
                        </div>
                      </div>
                      
                      <div className={`w-3 h-3 rounded-full ${
                        workplaces[shift.workplaceId]?.color === 'blue' ? 'bg-blue-500' :
                        workplaces[shift.workplaceId]?.color === 'green' ? 'bg-green-500' :
                        workplaces[shift.workplaceId]?.color === 'orange' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`} />
                      
                      <div>
                        <div className="font-medium text-gray-800">
                          {shift.workplace}
                        </div>
                        <div className="text-sm text-gray-600">
                          {shift.start}-{shift.end}
                          {shift.crossMidnight && (
                            <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">翌日</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {shift.earnings.toLocaleString()}円
                      </div>
                      <div className="text-xs text-gray-500">
                        {shift.hours.toFixed(1)}時間
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 月間目標と実績 */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            🎯 {format(currentDate, 'M月', { locale: ja })}の目標達成状況
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 収入目標 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-800">収入目標</h4>
                <span className="text-xs text-blue-600">
                  {Math.round((monthlyStats.totalEarnings / monthlyGoal.targetEarnings) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {monthlyStats.totalEarnings.toLocaleString()}円
              </div>
              <div className="text-sm text-blue-700 mb-3">
                / {monthlyGoal.targetEarnings.toLocaleString()}円
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (monthlyStats.totalEarnings / monthlyGoal.targetEarnings) * 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* 時間目標 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-800">勤務時間</h4>
                <span className="text-xs text-green-600">
                  {Math.round((monthlyStats.totalHours / monthlyGoal.targetHours) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {Math.round(monthlyStats.totalHours)}h
              </div>
              <div className="text-sm text-green-700 mb-3">
                / {monthlyGoal.targetHours}h
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (monthlyStats.totalHours / monthlyGoal.targetHours) * 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* シフト数目標 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-orange-800">シフト日数</h4>
                <span className="text-xs text-orange-600">
                  {Math.round((monthlyStats.shiftCount / monthlyGoal.targetShifts) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {monthlyStats.shiftCount}日
              </div>
              <div className="text-sm text-orange-700 mb-3">
                / {monthlyGoal.targetShifts}日
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (monthlyStats.shiftCount / monthlyGoal.targetShifts) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* 月末予測 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 mb-3">📈 月末予測</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">予想収入:</span>
                <span className="ml-2 font-bold text-gray-800">
                  {Math.round((monthlyStats.totalEarnings / new Date().getDate()) * new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()).toLocaleString()}円
                </span>
              </div>
              <div>
                <span className="text-gray-600">残り必要時間:</span>
                <span className="ml-2 font-bold text-gray-800">
                  {Math.max(0, monthlyGoal.targetHours - monthlyStats.totalHours)}時間
                </span>
              </div>
              <div>
                <span className="text-gray-600">残りシフト数:</span>
                <span className="ml-2 font-bold text-gray-800">
                  {Math.max(0, monthlyGoal.targetShifts - monthlyStats.shiftCount)}日
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 月次サマリー */}
        <div className="bg-white rounded-2xl p-5 shadow-xl">
          <h3 className="text-xl font-bold mb-4">📊 今月の実績・予測</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(monthlyStats.totalHours)}h</div>
              <div className="text-sm text-gray-600">今月勤務時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalEarnings.toLocaleString()}円</div>
              <div className="text-sm text-gray-600">今月収入</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.shiftCount}日</div>
              <div className="text-sm text-gray-600">シフト日数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.avgHours.toFixed(1)}h</div>
              <div className="text-sm text-gray-600">1日平均</div>
            </div>
          </div>
        </div>
      </div>

      {/* フローティングカメラボタン */}
      <button className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full w-16 h-16 text-2xl shadow-xl hover:scale-110 transition-transform">
        📸
      </button>

      {/* シフト登録モーダル */}
      {isShiftModalOpen && (
        <ShiftFormDialog
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          selectedDate={selectedDate}
          workplaces={workplaces}
          onSave={handleSaveShift}
        />
      )}

      {isWorkplaceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">バイト先管理</h3>
            <p className="text-gray-600 mb-4">バイト先管理モーダルは後で実装します</p>
            <button 
              onClick={() => setIsWorkplaceModalOpen(false)}
              className="w-full bg-blue-600 text-white rounded-xl p-3 font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// シフト登録モーダルコンポーネント
const ShiftFormDialog: React.FC<ShiftFormDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  workplaces,
  onSave
}) => {
  const [formData, setFormData] = useState({
    workplaceId: '',
    workplace: '',
    start: '10:00',
    end: '18:00',
    crossMidnight: false,
    earnings: 0,
    hours: 0
  });
  const [predictedEarnings, setPredictedEarnings] = useState(0);

  useEffect(() => {
    // 最初の職場を選択
    const workplaceEntries = Object.entries(workplaces);
    if (workplaceEntries.length > 0) {
      const [firstId, firstWorkplace] = workplaceEntries[0];
      setFormData(prev => ({
        ...prev,
        workplaceId: firstId,
        workplace: firstWorkplace.name
      }));
    }
  }, [workplaces]);

  useEffect(() => {
    // 収入予測計算
    if (formData.workplaceId && workplaces[formData.workplaceId]) {
      const workplace = workplaces[formData.workplaceId];
      const hours = calculateHours(formData.start, formData.end, formData.crossMidnight);
      const earnings = hours * workplace.baseHourly + (workplace.transportation || 0);
      
      setPredictedEarnings(earnings);
      setFormData(prev => ({
        ...prev,
        hours,
        earnings
      }));
    }
  }, [formData.workplaceId, formData.start, formData.end, formData.crossMidnight, workplaces]);

  const calculateHours = (start: string, end: string, crossMidnight: boolean): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    let [endHour] = end.split(':').map(Number);
    const [, endMin] = end.split(':').map(Number);
    
    if (crossMidnight && endHour < startHour) {
      endHour += 24;
    }
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) return 0;
    
    return (endMinutes - startMinutes) / 60;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.workplaceId || !formData.start || !formData.end) {
      alert('職場、開始時間、終了時間を全て入力してください。');
      return;
    }
    
    if (formData.hours <= 0) {
      alert('有効な労働時間を設定してください。翌日まで働く場合はチェックボックスを確認してください。');
      return;
    }

    onSave({
      date: selectedDate,
      workplaceId: formData.workplaceId,
      workplace: workplaces[formData.workplaceId].name,
      start: formData.start,
      end: formData.end,
      crossMidnight: formData.crossMidnight,
      earnings: formData.earnings,
      hours: formData.hours
    });
  };

  if (!isOpen) return null;

  const workplaceEntries = Object.entries(workplaces);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            📅 {format(new Date(selectedDate), 'M月d日(E)', { locale: ja })} のシフト登録
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 職場選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">職場</label>
            <select
              value={formData.workplaceId}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                workplaceId: e.target.value,
                workplace: workplaces[e.target.value]?.name || ''
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {workplaceEntries.length === 0 ? (
                <option value="">まずバイト先を登録してください</option>
              ) : (
                workplaceEntries.map(([id, workplace]) => (
                  <option key={id} value={id}>
                    {workplace.name} (時給{workplace.baseHourly}円)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 勤務時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">勤務時間</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">開始時間</label>
                <input
                  type="time"
                  value={formData.start}
                  onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">終了時間</label>
                <input
                  type="time"
                  value={formData.end}
                  onChange={(e) => setFormData(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* 翌日チェックボックス */}
            <div className="mt-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={formData.crossMidnight}
                  onChange={(e) => setFormData(prev => ({ ...prev, crossMidnight: e.target.checked }))}
                  className="mr-2 rounded"
                />
                翌日まで働く
              </label>
            </div>
          </div>

          {/* 予想収入 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700">
              予想収入: <span className="text-blue-600 font-bold">{Math.round(predictedEarnings).toLocaleString()}円</span>
            </label>
            <div className="text-xs text-gray-500 mt-1">
              {formData.hours.toFixed(1)}時間 × {workplaces[formData.workplaceId]?.baseHourly || 0}円
              {workplaces[formData.workplaceId]?.transportation && ` + 交通費${workplaces[formData.workplaceId].transportation}円`}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={workplaceEntries.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              シフト登録
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedShiftBoard;