import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControlLabel,
  Switch,
  Chip,
  Link,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Help,
  OpenInNew,
  ContentCopy,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { FigmaConfig } from '../types/figma';

interface FigmaSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  config: FigmaConfig;
  onConfigChange: (config: FigmaConfig) => void;
  onTest?: (config: FigmaConfig) => Promise<boolean>;
}

const steps = [
  {
    label: 'Personal Access Token の取得',
    description: 'Figmaアカウントでアクセストークンを生成します',
  },
  {
    label: 'ファイルキーの取得',
    description: 'FigmaファイルのURLからファイルキーを抽出します',
  },
  {
    label: '接続テスト',
    description: '設定が正しく動作することを確認します',
  },
];

export const FigmaSettingsDialog: React.FC<FigmaSettingsDialogProps> = ({
  open,
  onClose,
  config,
  onConfigChange,
  onTest,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [localConfig, setLocalConfig] = useState<FigmaConfig>(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setTesting(true);
    try {
      const success = await onTest(localConfig);
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // File Key extraction from URL
  const extractFileKey = (url: string): string => {
    const match = url.match(/\/file\/([a-zA-Z0-9]+)\//);
    return match ? match[1] : '';
  };

  const handleFileUrlChange = (url: string) => {
    const fileKey = extractFileKey(url);
    setLocalConfig({
      ...localConfig,
      fileKey,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6">Figma 連携設定</Typography>
          <Chip
            label={testResult === 'success' ? '接続成功' : testResult === 'error' ? '接続エラー' : '未接続'}
            color={testResult === 'success' ? 'success' : testResult === 'error' ? 'error' : 'default'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Personal Access Token */}
            <Step>
              <StepLabel>Personal Access Token の取得</StepLabel>
              <StepContent>
                <Typography variant="body2" paragraph>
                  Figmaから個人用アクセストークンを取得してください：
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      1. Figmaにログイン → Settings → Personal access tokens
                      <br />
                      2. "New token" をクリック
                      <br />
                      3. トークン名を入力（例: "扶養管理アプリ"）
                      <br />
                      4. 生成されたトークンをコピー
                    </Typography>
                  </Alert>
                  
                  <Link
                    href="https://www.figma.com/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    display="inline-flex"
                    alignItems="center"
                    gap={1}
                    sx={{ mb: 2 }}
                  >
                    Figma Settings を開く
                    <OpenInNew fontSize="small" />
                  </Link>
                </Box>

                <TextField
                  fullWidth
                  label="Personal Access Token"
                  type={showToken ? 'text' : 'password'}
                  value={localConfig.token}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, token: e.target.value })
                  }
                  placeholder="figd_..."
                  helperText="「figd_」で始まるトークンを貼り付けてください"
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={showToken ? 'トークンを隠す' : 'トークンを表示'}>
                        <IconButton
                          onClick={() => setShowToken(!showToken)}
                          edge="end"
                        >
                          {showToken ? <Warning /> : <Help />}
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                />

                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleNext} disabled={!localConfig.token}>
                    次へ
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: File Key */}
            <Step>
              <StepLabel>ファイルキーの取得</StepLabel>
              <StepContent>
                <Typography variant="body2" paragraph>
                  連携したいFigmaファイルのURLまたはファイルキーを入力してください：
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Figma ファイル URL"
                      value=""
                      onChange={(e) => handleFileUrlChange(e.target.value)}
                      placeholder="https://www.figma.com/file/[FILE_KEY]/..."
                      helperText="FigmaファイルのURLを貼り付けるとファイルキーが自動抽出されます"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="File Key（自動抽出）"
                      value={localConfig.fileKey}
                      onChange={(e) =>
                        setLocalConfig({ ...localConfig, fileKey: e.target.value })
                      }
                      placeholder="ファイルキーを直接入力することもできます"
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => handleCopy(localConfig.fileKey)}
                            disabled={!localConfig.fileKey}
                          >
                            {copied ? <CheckCircle color="success" /> : <ContentCopy />}
                          </IconButton>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    戻る
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!localConfig.fileKey}
                  >
                    次へ
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Connection Test */}
            <Step>
              <StepLabel>接続テスト</StepLabel>
              <StepContent>
                <Typography variant="body2" paragraph>
                  設定した情報でFigma APIに接続できるかテストします：
                </Typography>

                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    設定内容
                  </Typography>
                  <Typography variant="body2">
                    Token: {localConfig.token ? '●'.repeat(20) + '...' : '未設定'}
                  </Typography>
                  <Typography variant="body2">
                    File Key: {localConfig.fileKey || '未設定'}
                  </Typography>
                </Paper>

                {testResult && (
                  <Alert
                    severity={testResult === 'success' ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                    icon={testResult === 'success' ? <CheckCircle /> : <ErrorIcon />}
                  >
                    {testResult === 'success'
                      ? 'Figma APIに正常に接続できました！デザイントークンとコンポーネント情報を取得できます。'
                      : '接続に失敗しました。トークンとファイルキーを確認してください。'
                    }
                  </Alert>
                )}

                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    戻る
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleTest}
                    disabled={testing || !localConfig.token || !localConfig.fileKey}
                    sx={{ mr: 1 }}
                  >
                    {testing ? '接続中...' : '接続テスト'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={testResult !== 'success'}
                  >
                    保存して完了
                  </Button>
                </Box>

                {testResult === 'success' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    設定が完了しました。「保存して完了」をクリックして設定を保存してください。
                  </Alert>
                )}
              </StepContent>
            </Step>
          </Stepper>

          {activeStep === steps.length && (
            <Paper square elevation={0} sx={{ p: 3 }}>
              <Typography>設定が完了しました！</Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                設定をやり直す
              </Button>
            </Paper>
          )}
        </Box>

        {/* Advanced Settings */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            詳細設定
          </Typography>
          
          <FormControlLabel
            control={<Switch />}
            label="起動時に自動同期"
            sx={{ mb: 1 }}
          />
          
          <FormControlLabel
            control={<Switch />}
            label="デザイントークンの自動更新（5分間隔）"
            sx={{ mb: 1 }}
          />
          
          <FormControlLabel
            control={<Switch />}
            label="コンポーネント情報の取得"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!localConfig.token || !localConfig.fileKey}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FigmaSettingsDialog;