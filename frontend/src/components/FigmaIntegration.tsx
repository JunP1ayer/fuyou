import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Chip,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  DesignServices,
  Refresh,
  Download,
  Code,
  Palette,
  TextFields,
  SpaceBar,
  ComponentIcon,
  Visibility,
  Settings,
  ExpandMore,
  FileCopy,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
} from '@mui/icons-material';
import { useFigmaIntegration, useFigmaConfig } from '../hooks/useFigma';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

export const FigmaIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'typescript'>('css');
  const [copied, setCopied] = useState(false);

  // Figma設定管理
  const {
    config,
    updateConfig,
    isConfigValid,
    setToken,
    setFileKey,
  } = useFigmaConfig();

  // Figma連携データ
  const {
    tokens,
    components,
    loading,
    error,
    refetchAll,
    tokensData,
    componentsData,
  } = useFigmaIntegration(config, {
    enableTokens: isConfigValid,
    enableComponents: isConfigValid,
    autoRefreshTokens: false,
  });

  // タブ変更
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 設定保存
  const handleSaveConfig = () => {
    if (config.token && config.fileKey) {
      refetchAll();
    }
  };

  // コードコピー
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ステータス表示
  const getStatusChip = (loading: boolean, error: string | null, data: any) => {
    if (loading) return <Chip label="読み込み中" color="warning" size="small" />;
    if (error) return <Chip label="エラー" color="error" size="small" />;
    if (data) return <Chip label="同期済み" color="success" size="small" />;
    return <Chip label="未設定" color="default" size="small" />;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <DesignServices sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Figma 連携
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  デザインシステムとプロトタイプの自動同期
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2}>
              {getStatusChip(loading, error, tokens || components.length > 0)}
              <IconButton 
                onClick={refetchAll}
                disabled={!isConfigValid || loading}
                sx={{ color: 'white' }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 設定セクション */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
            Figma 設定
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Personal Access Token"
                type="password"
                value={config.token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="figd_..."
                helperText="Figma > Settings > Personal access tokens から取得"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="File Key"
                value={config.fileKey}
                onChange={(e) => setFileKey(e.target.value)}
                placeholder="https://www.figma.com/file/[FILE_KEY]/..."
                helperText="FigmaファイルのURLから抽出"
              />
            </Grid>
          </Grid>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={handleSaveConfig}
              disabled={!config.token || !config.fileKey}
            >
              設定を保存して同期
            </Button>
            {(tokens || components.length > 0) && (
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => setExportDialogOpen(true)}
              >
                エクスポート
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* メインコンテンツ */}
      {isConfigValid && (
        <Card>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="デザイントークン" icon={<Palette />} />
            <Tab label="コンポーネント" icon={<ComponentIcon />} />
            <Tab label="プロトタイプ" icon={<Visibility />} />
            <Tab label="設定" icon={<Settings />} />
          </Tabs>

          {/* デザイントークンタブ */}
          <TabPanel value={activeTab} index={0}>
            <CardContent>
              {tokensData.loading && <LinearProgress sx={{ mb: 2 }} />}
              
              {tokens && (
                <Box>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      デザイントークン
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      最終更新: {new Date(tokens.lastUpdated).toLocaleString()}
                    </Typography>
                  </Box>

                  {/* カラートークン */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Palette sx={{ mr: 1 }} />
                      <Typography>
                        カラー ({Object.keys(tokens.colors).length}個)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {Object.entries(tokens.colors).map(([name, value]) => (
                          <Grid item xs={6} md={3} key={name}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 1,
                                  backgroundColor: value,
                                  border: '1px solid #ddd',
                                }}
                              />
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {value}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  {/* タイポグラフィ */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <TextFields sx={{ mr: 1 }} />
                      <Typography>
                        タイポグラフィ ({Object.keys(tokens.typography).length}個)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {Object.entries(tokens.typography).map(([name, styles]) => (
                          <ListItem key={name}>
                            <ListItemText
                              primary={name}
                              secondary={
                                <Box component="span" sx={styles}>
                                  {styles.fontFamily} • {styles.fontSize} • {styles.fontWeight}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* スペーシング */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <SpaceBar sx={{ mr: 1 }} />
                      <Typography>
                        スペーシング ({Object.keys(tokens.spacing).length}個)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {Object.entries(tokens.spacing).map(([name, value]) => (
                          <Grid item xs={6} md={3} key={name}>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {value}
                              </Typography>
                              <Box
                                sx={{
                                  width: value,
                                  height: 8,
                                  backgroundColor: 'primary.main',
                                  mt: 0.5,
                                }}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </CardContent>
          </TabPanel>

          {/* コンポーネントタブ */}
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              {componentsData.loading && <LinearProgress sx={{ mb: 2 }} />}
              
              <Typography variant="h6" gutterBottom>
                コンポーネント ({components.length}個)
              </Typography>

              <List>
                {components.map((component) => (
                  <React.Fragment key={component.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <ComponentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={component.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {component.description || 'No description'}
                            </Typography>
                            <Chip
                              label={component.type}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(component.updatedAt).toLocaleDateString()}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </TabPanel>

          {/* プロトタイプタブ */}
          <TabPanel value={activeTab} index={2}>
            <CardContent>
              <Alert severity="info">
                プロトタイプ同期機能は開発中です。今後のバージョンで提供予定です。
              </Alert>
            </CardContent>
          </TabPanel>

          {/* 設定タブ */}
          <TabPanel value={activeTab} index={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                同期設定
              </Typography>
              
              <FormControlLabel
                control={<Switch />}
                label="デザイントークンの自動同期"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={<Switch />}
                label="コンポーネントの自動同期"
                sx={{ mb: 2 }}
              />

              <Alert severity="info">
                自動同期機能は将来のアップデートで実装予定です。
              </Alert>
            </CardContent>
          </TabPanel>
        </Card>
      )}

      {/* エクスポートダイアログ */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>デザイントークンのエクスポート</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={exportFormat}
              onChange={(_, value) => setExportFormat(value)}
            >
              <Tab label="CSS" value="css" />
              <Tab label="TypeScript" value="typescript" />
            </Tabs>
          </Box>

          {tokens && (
            <Box
              sx={{
                backgroundColor: 'grey.100',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              <pre>
                {exportFormat === 'css' 
                  ? tokensData.cssVariables
                  : tokensData.typeScriptTokens
                }
              </pre>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            startIcon={copied ? <CheckCircle /> : <FileCopy />}
            onClick={() => tokens && handleCopyCode(
              exportFormat === 'css' 
                ? tokensData.cssVariables 
                : tokensData.typeScriptTokens
            )}
          >
            {copied ? 'コピー済み' : 'コピー'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FigmaIntegration;