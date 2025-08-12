// 💳 CSVアップロード機能 - 銀行取引履歴の自動取り込み

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  AccountBalance,
  AttachMoney,
  Schedule,
  Insights,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface CSVUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'unknown';
  confidence: number;
  workplaceGuess?: string;
}

interface CSVParseResult {
  success: boolean;
  bankType: string;
  transactions: ParsedTransaction[];
  incomeTransactions: ParsedTransaction[];
  totalTransactions: number;
  errors: string[];
}

export const CSVUploadDialog: React.FC<CSVUploadDialogProps> = ({
  open,
  onClose,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    
    try {
      // CSVファイルのテキストを読み込み
      const text = await file.text();
      
      // モック解析結果（実際の実装では backend API を呼び出し）
      const mockResult: CSVParseResult = {
        success: true,
        bankType: '三菱UFJ銀行',
        transactions: [
          {
            date: '2024-02-01',
            amount: 35000,
            description: 'スターバックス　バイト代',
            type: 'income',
            confidence: 95,
            workplaceGuess: 'スターバックス'
          },
          {
            date: '2024-02-15',
            amount: 40000,
            description: 'スターバックス　バイト代',
            type: 'income',
            confidence: 95,
            workplaceGuess: 'スターバックス'
          },
          {
            date: '2024-01-28',
            amount: 25000,
            description: 'コンビニ　アルバイト',
            type: 'income',
            confidence: 92,
            workplaceGuess: 'コンビニ'
          },
          {
            date: '2024-01-15',
            amount: 60000,
            description: '塾講師　報酬',
            type: 'income',
            confidence: 98,
            workplaceGuess: '塾講師'
          },
          {
            date: '2024-02-03',
            amount: 10000,
            description: '出金　現金',
            type: 'expense',
            confidence: 100
          },
          {
            date: '2024-02-10',
            amount: 50000,
            description: '振込　親から仕送り',
            type: 'unknown',
            confidence: 70
          }
        ],
        incomeTransactions: [],
        totalTransactions: 6,
        errors: []
      };

      // 収入取引のフィルタリング
      mockResult.incomeTransactions = mockResult.transactions.filter(tx => tx.type === 'income');

      // 2秒待ってから結果を表示（リアルな体験のため）
      setTimeout(() => {
        setParseResult(mockResult);
        setUploading(false);
      }, 2000);

    } catch (error) {
      console.error('CSV parse error:', error);
      setParseResult({
        success: false,
        bankType: 'Unknown',
        transactions: [],
        incomeTransactions: [],
        totalTransactions: 0,
        errors: ['CSVファイルの解析に失敗しました']
      });
      setUploading(false);
    }
  };

  const handleImportShifts = () => {
    if (!parseResult) return;

    // ここで実際のシフトデータとして取り込み
    console.log('Importing shifts:', parseResult.incomeTransactions);
    
    // モック：シフトストアに追加
    alert(`${parseResult.incomeTransactions.length}件の収入データを取り込みました！`);
    
    // ダイアログを閉じる
    onClose();
  };

  const totalIncome = parseResult?.incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0) || 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ 
        sx: { 
          maxHeight: '90vh',
          overflow: 'hidden'
        } 
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            💳 銀行CSV取り込み
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflow: 'auto', py: 2 }}>
        {!parseResult && !uploading && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              銀行の取引履歴CSVファイルをアップロードして、バイト収入を自動解析・取り込みします
            </Typography>

            {/* ドラッグ&ドロップエリア */}
            <Card
              sx={{
                mb: 3,
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'grey.300',
                backgroundColor: dragOver ? 'primary.lighter' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <CloudUpload
                  sx={{
                    fontSize: 64,
                    color: dragOver ? 'primary.main' : 'grey.400',
                    mb: 2,
                  }}
                />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {dragOver ? 'ファイルをドロップ' : 'CSVファイルをドラッグ&ドロップ'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  または クリックしてファイルを選択
                </Typography>
              </CardContent>
            </Card>

            {/* 隠れたファイル入力 */}
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* 対応銀行一覧（コンパクト版） */}
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
              📋 対応銀行
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {['三菱UFJ銀行', '三井住友銀行', 'みずほ銀行', 'ゆうちょ銀行', '楽天銀行', 'イオン銀行'].map((bank) => (
                <Chip
                  key={bank}
                  label={bank}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<AccountBalance />}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* アップロード中 */}
        {uploading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Insights sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            </motion.div>
            <Typography variant="h6" sx={{ mb: 2 }}>
              AI解析中...
            </Typography>
            <LinearProgress sx={{ width: 200, mx: 'auto', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              銀行フォーマットを検出し、収入データを抽出しています
            </Typography>
          </Box>
        )}

        {/* 解析結果 */}
        {parseResult && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {parseResult.success ? (
                <Box>
                  {/* 成功アラート */}
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      ✅ 解析完了！
                    </Typography>
                    <Typography variant="body2">
                      {parseResult.bankType}形式を検出。{parseResult.incomeTransactions.length}件の収入データを抽出しました。
                    </Typography>
                  </Alert>

                  {/* 統計サマリー（コンパクト版） */}
                  <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                        📊 解析サマリー
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-around', textAlign: 'center' }}>
                        <Box>
                          <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                            ¥{totalIncome.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            バイト収入合計
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                            {parseResult.incomeTransactions.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            収入取引
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                            {parseResult.totalTransactions}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            総取引数
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* 収入取引一覧（コンパクト版） */}
                  <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                    💰 検出された収入取引 ({parseResult.incomeTransactions.length}件)
                  </Typography>
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      mb: 2, 
                      maxHeight: 300,
                      overflow: 'auto'
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.8rem' }}>日付</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>説明</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8rem' }}>金額</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>推定バイト先</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.8rem' }}>信頼度</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parseResult.incomeTransactions.map((tx, index) => (
                          <TableRow key={index} sx={{ height: 48 }}>
                            <TableCell sx={{ fontSize: '0.75rem' }}>
                              {new Date(tx.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120 }}>
                              <Box sx={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}>
                                {tx.description}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.8rem' }}>
                                ¥{tx.amount.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={tx.workplaceGuess || '不明'} 
                                size="small" 
                                color={tx.workplaceGuess ? 'primary' : 'default'}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${tx.confidence}%`}
                                size="small"
                                color={
                                  tx.confidence >= 90 ? 'success' :
                                  tx.confidence >= 70 ? 'warning' : 'error'
                                }
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Alert severity="error">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    ❌ 解析エラー
                  </Typography>
                  {parseResult.errors.map((error, index) => (
                    <Typography key={index} variant="body2">
                      {error}
                    </Typography>
                  ))}
                </Alert>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          キャンセル
        </Button>
        {parseResult?.success && (
          <Button
            variant="contained"
            onClick={handleImportShifts}
            startIcon={<CheckCircle />}
          >
            シフトデータとして取り込む
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};