import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Schedule, Upload, AttachMoney, Settings } from '@mui/icons-material';

import { ShiftManager } from './shifts/ShiftManager';
import { OCRShiftManager } from './OCRShiftManager';
import { MonthlySalaryCard } from './MonthlySalaryCard';
import { SettingsPage } from './settings/SettingsPage';
import type { Shift, Workplace } from '../types/shift';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const TabbedShiftApp: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 初期職場データを設定
  React.useEffect(() => {
    const demoWorkplaces: Workplace[] = [
      {
        id: 'wp-1',
        name: 'カフェ A',
        hourlyRate: 1000,
        color: '#2196f3',
        description: '駅前カフェ',
      },
      {
        id: 'wp-2',
        name: 'コンビニ B',
        hourlyRate: 950,
        color: '#4caf50',
        description: '24時間営業',
      },
      {
        id: 'wp-3',
        name: '家庭教師',
        hourlyRate: 1500,
        color: '#ff9800',
        description: '個別指導',
      },
    ];
    setWorkplaces(demoWorkplaces);
  }, []);

  // テスト用シフトデータ（デモ）
  React.useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const testShifts: Shift[] = [
      {
        id: 'test-shift-1',
        userId: 'demo-user',
        jobSourceId: 'wp-1',
        jobSourceName: 'カフェ A',
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
        startTime: '09:00',
        endTime: '17:00',
        hourlyRate: 1000,
        breakMinutes: 60,
        workingHours: 7,
        calculatedEarnings: 7000,
        isConfirmed: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'test-shift-2',
        userId: 'demo-user',
        jobSourceId: 'wp-2',
        jobSourceName: 'コンビニ B',
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-18`,
        startTime: '18:00',
        endTime: '22:00',
        hourlyRate: 950,
        breakMinutes: 0,
        workingHours: 4,
        calculatedEarnings: 3800,
        isConfirmed: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    setShifts(testShifts);
  }, []);

  const handleShiftsSaved = (
    newShifts: {
      jobSourceId?: string;
      jobSourceName: string;
      date: string;
      startTime: string;
      endTime: string;
      hourlyRate: number;
      breakMinutes?: number;
      workingHours?: number;
      calculatedEarnings?: number;
    }[]
  ) => {
    // OCRで保存されたシフトをstateに追加
    const convertedShifts = newShifts.map((shift, index) => ({
      id: `ocr-${Date.now()}-${index}`,
      userId: 'demo-user',
      jobSourceId: shift.jobSourceId || 'unknown',
      jobSourceName: shift.jobSourceName,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      hourlyRate: shift.hourlyRate,
      breakMinutes: shift.breakMinutes || 0,
      workingHours: shift.workingHours || 0,
      calculatedEarnings: shift.calculatedEarnings || 0,
      isConfirmed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setShifts(prev => [...prev, ...convertedShifts]);
  };

  const tabs = [
    {
      label: 'マイシフト',
      icon: <Schedule />,
      component: (
        <ShiftManager
          workplaces={workplaces}
          initialShifts={shifts}
          onShiftsChange={setShifts}
          showAddButton={false}
        />
      ),
    },
    {
      label: 'シフト提出',
      icon: <Upload />,
      component: (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ mb: 3, fontWeight: 'bold' }}
          >
            シフト表を画像から読み取り
          </Typography>
          <OCRShiftManager
            onShiftsSaved={handleShiftsSaved}
            onComplete={() => {
              // シフト提出完了後、マイシフトタブに移動
              setActiveTab(0);
            }}
          />
        </Box>
      ),
    },
    {
      label: '給料計算',
      icon: <AttachMoney />,
      component: (
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <MonthlySalaryCard
            shifts={shifts}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </Box>
      ),
    },
    {
      label: 'その他',
      icon: <Settings />,
      component: <SettingsPage />,
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.default',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* デスクトップ版ヘッダー */}
      {!isMobile && (
        <Paper
          elevation={1}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            borderRadius: 0,
            mb: 0,
          }}
        >
          <Box sx={{ px: 3, pt: 2, pb: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 2,
              }}
            >
              シフトボード
            </Typography>

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="standard"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 60,
                  fontSize: '0.95rem',
                  fontWeight: 'medium',
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  sx={{
                    '&.Mui-selected': {
                      color: 'primary.main',
                    },
                  }}
                />
              ))}
            </Tabs>
          </Box>
        </Paper>
      )}

      {/* モバイル版ヘッダー */}
      {isMobile && (
        <Paper
          elevation={1}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            borderRadius: 0,
            mb: 0,
          }}
        >
          <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              シフトボード
            </Typography>
          </Box>
        </Paper>
      )}

      {/* タブコンテンツ */}
      <Box
        sx={{
          flex: 1,
          px: { xs: 2, md: 3 },
          pb: isMobile ? 10 : 3,
          pt: 2,
        }}
      >
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Box>

      {/* モバイル版下部タブ */}
      {isMobile && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            borderRadius: 0,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '0.75rem',
                fontWeight: 'medium',
                py: 1,
              },
              '& .MuiTab-iconWrapper': {
                mb: 0.5,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                sx={{
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                }}
              />
            ))}
          </Tabs>
        </Paper>
      )}
    </Box>
  );
};
