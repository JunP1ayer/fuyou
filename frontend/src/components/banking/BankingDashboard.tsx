// 🏦 Open Banking連携ダッシュボード - 自動収入管理

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  Link,
  LinkOff,
  TrendingUp,
  TrendingDown,
  Analytics,
  Security,
  Refresh,
  Warning,
  CheckCircle,
  Info,
  AttachMoney,
  Schedule,
  Work,
  AutoAwesome,
  Sync,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import { openBankingService } from '../../services/openBankingService';
import type { BankAccount, Transaction, IncomeAnalysis } from '../../services/openBankingService';
import { useUnifiedStore } from '../../store/unifiedStore';
import useI18n from '../../hooks/useI18n';
import { logger, LogCategory } from '../../utils/logger';

export const BankingDashboard: React.FC = () => {
  const { t, formatCurrency, country } = useI18n();
  const [linkedAccounts, setLinkedAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<IncomeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [linkingDialogOpen, setLinkingDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // 初期化
  useEffect(() => {
    loadLinkedAccounts();
  }, []);

  const loadLinkedAccounts = async () => {
    try {
      setIsLoading(true);
      const accounts = openBankingService.getLinkedAccounts();
      setLinkedAccounts(accounts);
      
      // 最初のアカウントがある場合は自動で取引データを読み込み
      if (accounts.length > 0) {
        await loadTransactionData(accounts[0].id);
      }
    } catch (error) {
      logger.error(LogCategory.API, 'Failed to load linked accounts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionData = async (accountId: string) => {
    try {
      setIsLoading(true);
      setSyncStatus('syncing');
      
      const { transactions: txs, analysis: analysisData } = await openBankingService
        .fetchTransactionsAndAnalyze(accountId);
      
      setTransactions(txs);
      setAnalysis(analysisData);
      setSyncStatus('success');
      
      logger.info(LogCategory.API, 'Transaction data loaded', {
        accountId,
        transactionCount: txs.length
      });

    } catch (error) {
      setSyncStatus('error');
      logger.error(LogCategory.API, 'Failed to load transaction data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (bankId: string) => {
    try {
      setIsLoading(true);
      const { authUrl } = await openBankingService.linkBankAccount(bankId, country);
      
      // 新しいウィンドウで認証ページを開く
      const authWindow = window.open(
        authUrl,
        'bank_auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // 認証完了を監視
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          // 認証完了後にアカウント情報を再読み込み
          setTimeout(() => loadLinkedAccounts(), 1000);
        }
      }, 1000);

      logger.info(LogCategory.UI, 'Bank linking window opened', { bankId });

    } catch (error) {
      logger.error(LogCategory.API, 'Failed to initiate bank linking', error);
    } finally {
      setIsLoading(false);
      setLinkingDialogOpen(false);
    }
  };

  const handleUnlinkAccount = async (accountId: string) => {
    try {
      await openBankingService.unlinkAccount(accountId);
      setLinkedAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      // アンリンクしたアカウントが選択中だった場合はクリア
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null);
        setTransactions([]);
        setAnalysis(null);
      }

      logger.info(LogCategory.API, 'Bank account unlinked', { accountId });

    } catch (error) {
      logger.error(LogCategory.API, 'Failed to unlink account', error);
    }
  };

  // 支援銀行リスト
  const supportedBanks = useMemo(() => {
    return openBankingService.getSupportedBanks(country);
  }, [country]);

  // 労働関連取引のフィルタリング
  const workTransactions = useMemo(() => {
    return transactions.filter(tx => tx.isWorkRelated);
  }, [transactions]);

  // リスクレベルの色
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'danger': return 'error.main';
      case 'warning': return 'warning.main';
      case 'safe': return 'success.main';
      default: return 'text.secondary';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          🏦 Open Banking 連携
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          銀行口座と連携してバイト収入を自動管理・分析
        </Typography>
        
        {/* 同期ステータス */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={
              syncStatus === 'syncing' ? '同期中...' :
              syncStatus === 'success' ? '同期完了' :
              syncStatus === 'error' ? '同期エラー' :
              '待機中'
            }
            color={
              syncStatus === 'success' ? 'success' :
              syncStatus === 'error' ? 'error' :
              'default'
            }
            icon={
              syncStatus === 'syncing' ? <CircularProgress size={16} /> :
              syncStatus === 'success' ? <CheckCircle /> :
              syncStatus === 'error' ? <Warning /> :
              <Sync />
            }
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => selectedAccount && loadTransactionData(selectedAccount.id)}
            disabled={isLoading || !selectedAccount}
          >
            データ更新
          </Button>
        </Box>
      </Box>

      {/* セキュリティ情報 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security />
          <Typography variant="body2">
            <strong>🔒 セキュリティ保証:</strong> 銀行レベルの暗号化でデータを保護。読み取り専用アクセスのみ。
          </Typography>
        </Box>
      </Alert>

      <Grid container spacing={3}>
        {/* 連携済み口座一覧 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  連携済み口座
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Link />}
                  onClick={() => setLinkingDialogOpen(true)}
                >
                  口座を追加
                </Button>
              </Box>

              {linkedAccounts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AccountBalance sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    まだ口座が連携されていません
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {linkedAccounts.map((account) => (
                    <ListItem
                      key={account.id}
                      button
                      selected={selectedAccount?.id === account.id}
                      onClick={() => {
                        setSelectedAccount(account);
                        loadTransactionData(account.id);
                      }}
                      sx={{ 
                        borderRadius: 1, 
                        mb: 1,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                        }
                      }}
                    >
                      <ListItemIcon>
                        <AccountBalance />
                      </ListItemIcon>
                      <ListItemText
                        primary={account.bankName}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {account.accountNumber}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              {formatCurrency(account.balance)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="口座連携を解除">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlinkAccount(account.id);
                            }}
                          >
                            <LinkOff />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 収入分析結果 */}
        <Grid item xs={12} md={8}>
          {analysis ? (
            <Grid container spacing={2}>
              {/* 月間収入トレンド */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {analysis.monthlyIncome.trend === 'increasing' ? (
                          <TrendingUp color="success" />
                        ) : analysis.monthlyIncome.trend === 'decreasing' ? (
                          <TrendingDown color="error" />
                        ) : (
                          <Analytics color="primary" />
                        )}
                        <Typography variant="h6" sx={{ fontWeight: 600, ml: 1 }}>
                          月間収入
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                        {formatCurrency(analysis.monthlyIncome.current)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          前月: {formatCurrency(analysis.monthlyIncome.previous)}
                        </Typography>
                        <Chip
                          label={`${analysis.monthlyIncome.changePercent > 0 ? '+' : ''}${analysis.monthlyIncome.changePercent}%`}
                          size="small"
                          color={analysis.monthlyIncome.changePercent > 0 ? 'success' : 'error'}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* 税金リスク評価 */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Warning sx={{ mr: 1, color: getRiskColor(analysis.taxProjection.riskLevel) }} />
                        扶養控除リスク
                      </Typography>
                      
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {formatCurrency(analysis.taxProjection.projected)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        年間予測収入
                      </Typography>
                      
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (analysis.taxProjection.projected / 1230000) * 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getRiskColor(analysis.taxProjection.riskLevel),
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        推奨上限: {formatCurrency(analysis.taxProjection.recommendedLimit)}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* ワークプレース別収入 */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Work sx={{ mr: 1 }} />
                        バイト先別収入分析
                      </Typography>
                      
                      {analysis.workplaceBreakdown.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          ワークプレースが特定されていません
                        </Typography>
                      ) : (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>バイト先</TableCell>
                                <TableCell align="right">収入</TableCell>
                                <TableCell align="right">入金回数</TableCell>
                                <TableCell align="right">頻度</TableCell>
                                <TableCell align="right">最終入金</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {analysis.workplaceBreakdown.map((workplace) => (
                                <TableRow key={workplace.workplaceId}>
                                  <TableCell>{workplace.workplaceName}</TableCell>
                                  <TableCell align="right">
                                    <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                                      {formatCurrency(workplace.amount)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">{workplace.transactionCount}回</TableCell>
                                  <TableCell align="right">
                                    <Chip 
                                      label={
                                        workplace.frequency === 'weekly' ? '週次' :
                                        workplace.frequency === 'biweekly' ? '隔週' : '月次'
                                      }
                                      size="small"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    {format(parseISO(workplace.lastPayment), 'MM/dd', { locale: ja })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* 節約提案 */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                        <AutoAwesome sx={{ mr: 1 }} />
                        AI節約提案
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          月{formatCurrency(analysis.savingsOpportunity.potentialSavings)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          の節約が可能
                        </Typography>
                      </Box>
                      
                      <List dense>
                        {analysis.savingsOpportunity.suggestions.map((suggestion, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Info color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={suggestion} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Analytics sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    口座を選択して分析を開始
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    左側から連携済み口座を選択してください
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* 取引履歴詳細ダイアログ */}
      <Dialog 
        open={transactionDialogOpen} 
        onClose={() => setTransactionDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          労働関連取引履歴 ({workTransactions.length}件)
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>日付</TableCell>
                  <TableCell>金額</TableCell>
                  <TableCell>説明</TableCell>
                  <TableCell>バイト先</TableCell>
                  <TableCell>信頼度</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workTransactions.slice(0, 50).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {format(parseISO(tx.date), 'yyyy/MM/dd', { locale: ja })}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                        {formatCurrency(tx.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      {tx.workplaceId ? (
                        <Chip label={tx.merchantName || 'Unknown'} size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          未分類
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={tx.confidence || 0}
                          sx={{ width: 60, height: 4 }}
                        />
                        <Typography variant="caption">
                          {Math.round(tx.confidence || 0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionDialogOpen(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* 口座連携ダイアログ */}
      <Dialog 
        open={linkingDialogOpen} 
        onClose={() => setLinkingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>銀行口座を連携</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            対応銀行から選択してください。安全なOAuth認証を使用します。
          </Typography>
          
          <List>
            {supportedBanks.map((bank) => (
              <ListItem
                key={bank.id}
                button
                onClick={() => handleLinkAccount(bank.id)}
                sx={{ borderRadius: 1, mb: 1 }}
              >
                <ListItemIcon>
                  <AccountBalance />
                </ListItemIcon>
                <ListItemText 
                  primary={bank.name}
                  secondary="OAuth2セキュア認証"
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkingDialogOpen(false)}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>

      {/* 労働関連取引詳細ボタン */}
      {workTransactions.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          <Badge badgeContent={workTransactions.length} color="primary">
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={() => setTransactionDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              給与取引詳細
            </Button>
          </Badge>
        </Box>
      )}
    </Box>
  );
};