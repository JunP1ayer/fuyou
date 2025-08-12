// 🏢 バイト管理ハブ - 統合管理画面

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Business,
  CalendarToday,
  Upload,
  Edit,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { WorkplaceManager } from './WorkplaceManager';
import { GPT5ShiftSubmissionFlow } from './GPT5ShiftSubmissionFlow';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`job-tabpanel-${index}`}
      aria-labelledby={`job-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface JobManagementHubProps {
  onNavigateToWorkplaceManager?: () => void;
  onNavigateToAISubmission?: () => void;
}

export const JobManagementHub: React.FC<JobManagementHubProps> = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 1.5, sm: 2 }, pb: 8 }}>
      {/* ヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Business sx={{ color: 'primary.main', fontSize: { xs: 28, sm: 36 }, mb: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          バイト管理
        </Typography>
        <Typography variant="body2" color="text.secondary">
          バイト先の管理とシフト表の提出を一画面で
        </Typography>
      </Box>

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered variant="fullWidth">
          <Tab
            icon={<Edit />}
            label="バイト先管理"
            sx={{ minHeight: 52, fontWeight: 600 }}
          />
          <Tab
            icon={<CalendarToday />}
            label="AIシフト解析"
            sx={{ minHeight: 52, fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* タブコンテンツ */}
      <TabPanel value={tabValue} index={0}>
        <WorkplaceManager />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <GPT5ShiftSubmissionFlow />
      </TabPanel>
    </Box>
  );
};