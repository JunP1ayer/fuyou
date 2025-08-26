// 🏢 バイト管理ハブ - 統合管理画面

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Business,
  Edit,
} from '@mui/icons-material';
import { WorkplaceManager } from './WorkplaceManager';

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
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 0.75, sm: 1.5 }, pt: 0.25, pb: 8 }}>
      {/* ヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 0.5 }}>
        <Business sx={{ color: 'primary.main', fontSize: { xs: 18, sm: 22 }, mb: 0.25 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0 }}>
          バイト管理
        </Typography>
      </Box>

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0.75 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered 
          variant="fullWidth"
          sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontSize: { xs: 12, sm: 13 } }, '& .MuiTab-iconWrapper': { fontSize: 16 } }}
        >
          <Tab
            icon={<Edit />}
            label="バイト先管理"
            sx={{ minHeight: 40, fontWeight: 600 }}
          />
        </Tabs>
      </Box>



      {/* タブコンテンツ */}
      <TabPanel value={tabValue} index={0}>
        <WorkplaceManager />
      </TabPanel>


    </Box>
  );
};