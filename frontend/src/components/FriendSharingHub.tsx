// 🤝 シフト共有機能ハブ

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Share,
  PeopleAlt,
  ContentCopy,
  Add,
  Delete,
  Visibility,
  VisibilityOff,
  CalendarToday,
  QrCode,
  PersonAdd,
  ExpandMore,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useFriendStore } from '../store/friendStore';
import { APP_COLOR_PALETTE } from '@/utils/colors';

interface FriendSharingHubProps {
  onBack: () => void;
}

export const FriendSharingHub: React.FC<FriendSharingHubProps> = ({
  onBack,
}) => {
  const {
    friends,
    visibleFriendIds,
    addFriend,
    removeFriend,
    setVisibleFriends,
    importFriendSchedule,
    getVisibleFriends,
    getVisibleSchedules,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState(0);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friendColor, setFriendColor] = useState('#4fc3f7');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);

  // 共有オプション（Googleの哲学: デフォルトは安全・最小選択）
  const [sharePeriod, setSharePeriod] = useState<'custom' | 'all'>('custom');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [hideWorkplace, setHideWorkplace] = useState<boolean>(true); // プライバシーはデフォルトで守る
  const [shareContent, setShareContent] = useState<'shifts-only' | 'all-events'>('shifts-only'); // デフォルトはシフトのみ

  // 色パレット（共通）
  const colorPalette = APP_COLOR_PALETTE.map(c => c.color);

  // 8桁のランダム数字を生成
  const generateRandomCode = () => {
    // 10000000から99999999の間でランダムな整数を生成
    const min = 10000000;
    const max = 99999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // 自分のシフトデータをシェアコード化（デモ用）
  const generateShareCode = (
    period: 'custom' | 'all' = sharePeriod,
    options?: { hideWorkplace?: boolean; range?: { start: string; end: string }; shareContent?: 'shifts-only' | 'all-events' }
  ) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const contentType = options?.shareContent ?? shareContent;
    
    // デモデータ（最小・わかりやすい）
    const baseDays: Record<string, { 
      shifts: Array<{ start: string; end: string; workplace?: string }>;
      events?: Array<{ start: string; end: string; title: string }>;
    }> = {
      [today.toISOString().split('T')[0]]: { 
        shifts: [{ start: '09:00', end: '17:00', workplace: '自分のバイト先' }],
        events: contentType === 'all-events' ? [{ start: '19:00', end: '20:30', title: '友達と夕食' }] : undefined
      },
      [tomorrow.toISOString().split('T')[0]]: { 
        shifts: [{ start: '18:00', end: '22:00', workplace: '自分のバイト先' }],
        events: contentType === 'all-events' ? [{ start: '15:00', end: '16:00', title: '歯医者' }] : undefined
      },
      [dayAfter.toISOString().split('T')[0]]: { 
        shifts: [{ start: '14:00', end: '19:00', workplace: '別のバイト先' }],
        events: contentType === 'all-events' ? [{ start: '10:00', end: '11:30', title: '授業' }] : undefined
      },
    };

    const shouldHideWorkplace = options?.hideWorkplace ?? hideWorkplace;
    const maskedDays: typeof baseDays = Object.fromEntries(
      Object.entries(baseDays).map(([date, value]) => [
        date,
        {
          shifts: value.shifts.map(s => ({
            start: s.start,
            end: s.end,
            workplace: shouldHideWorkplace ? undefined : s.workplace,
          })),
          events: value.events, // 個人予定はそのまま
        },
      ])
    );

    const demoSchedule = {
      meta: {
        period,
        hideWorkplace: shouldHideWorkplace,
        shareContent: contentType,
        generatedAt: new Date().toISOString(),
        range: period === 'custom' ? { start: options?.range?.start, end: options?.range?.end } : undefined,
      },
      days: maskedDays,
    };

    // 8桁のランダム数字を生成してシェアコードとする
    const randomCode = generateRandomCode().toString();
    setShareCode(randomCode);
    setShowShareDialog(true);
    return randomCode;
  };

  // シェアコードをクリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setAlert({ type: 'success', message: 'シェアコードをコピーしました' });
    } catch {
      setAlert({ type: 'error', message: 'コピーに失敗しました' });
    }
  };

  // 友達を追加
  const handleAddFriend = () => {
    if (!friendName.trim() || !importCode.trim()) {
      setAlert({ type: 'error', message: 'すべての項目を入力してください' });
      return;
    }

    // 8桁数字のバリデーション
    if (!/^\d{8}$/.test(importCode.trim())) {
      setAlert({ type: 'error', message: '8桁の数字を入力してください' });
      return;
    }

    const friendId = crypto.randomUUID();
    const newFriend = {
      id: friendId,
      displayName: friendName.trim(),
      color: friendColor,
    };

    // 友達追加
    addFriend(newFriend);

    // デモ用: 8桁コードから仮想的なスケジュールを生成
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const demoSchedule = {
      days: {
        [today.toISOString().split('T')[0]]: { 
          shifts: [{ start: '10:00', end: '16:00', workplace: friendName.trim() + 'のバイト' }] 
        },
        [tomorrow.toISOString().split('T')[0]]: { 
          shifts: [{ start: '19:00', end: '23:00', workplace: friendName.trim() + 'のバイト' }] 
        },
      }
    };
    
    // デモスケジュールをBase64エンコードして取り込み
    const success = importFriendSchedule(friendId, btoa(JSON.stringify(demoSchedule)));
    if (success) {
      setAlert({ type: 'success', message: `${friendName}を追加しました` });
      setFriendName('');
      setImportCode('');
      setShowAddDialog(false);
    } else {
      setAlert({ type: 'error', message: 'シェアコードが無効です' });
      removeFriend(friendId); // 追加を取り消し
    }
  };


  // 表示切替
  const toggleFriendVisibility = (friendId: string) => {
    const newVisible = visibleFriendIds.includes(friendId)
      ? visibleFriendIds.filter(id => id !== friendId)
      : [...visibleFriendIds, friendId];
    setVisibleFriends(newVisible);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh',
      px: 0.5,
      pt: 0,
      pb: 0.5,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* アラート */}
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)} 
          sx={{ mb: 0.5, flexShrink: 0 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* ヘッダー - 管理UIと同じスタイル（最上部配置） */}
      <Box sx={{ mb: 1, textAlign: 'center', pt: 0.5 }}>
        <PeopleAlt sx={{ fontSize: 40, color: '#81d4fa', mb: 0.5 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          シフト共有
        </Typography>
      </Box>

      {/* タブ切り替え - 管理UIと同じスタイル */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1, flexShrink: 0, px: 1 }}>
        <Box
          onClick={() => setActiveTab(0)}
          sx={{
            flex: 1,
            py: 1.5,
            px: 1.5,
            borderBottom: activeTab === 0 ? '3px solid #38bdf8' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              bgcolor: 'rgba(56, 189, 248, 0.05)',
            }
          }}
        >
          <Share sx={{ fontSize: 28, color: activeTab === 0 ? '#38bdf8' : '#94a3b8', mb: 0.5, display: 'block' }} />
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: activeTab === 0 ? 600 : 400,
              color: activeTab === 0 ? '#0c4a6e' : '#64748b',
              fontSize: '0.9rem',
              display: 'block'
            }}
          >
            シフト共有
          </Typography>
        </Box>
        <Box
          onClick={() => setActiveTab(1)}
          sx={{
            flex: 1,
            py: 1.5,
            px: 1.5,
            borderBottom: activeTab === 1 ? '3px solid #38bdf8' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              bgcolor: 'rgba(56, 189, 248, 0.05)',
            }
          }}
        >
          <PersonAdd sx={{ fontSize: 28, color: activeTab === 1 ? '#38bdf8' : '#94a3b8', mb: 0.5, display: 'block' }} />
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: activeTab === 1 ? 600 : 400,
              color: activeTab === 1 ? '#0c4a6e' : '#64748b',
              fontSize: '0.9rem',
              display: 'block'
            }}
          >
            友達追加
          </Typography>
        </Box>
      </Box>

      {/* メインコンテンツカード */}
      <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* 共有タブ */}
          {activeTab === 0 && (
            <>

              {/* ボタン */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={async () => {
                    const code = generateShareCode('all', { hideWorkplace, shareContent });
                    try {
                      await navigator.clipboard.writeText(code);
                      setAlert({ type: 'success', message: 'シェアコードをコピーしました' });
                    } catch {}
                  }}
                  sx={{
                    bgcolor: '#bae6fd',
                    color: '#0c4a6e',
                    '&:hover': { bgcolor: '#7dd3fc' },
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    minHeight: '48px'
                  }}
                >
                  全部のシフトを共有
                </Button>
                <Button
                  variant="contained"
                  data-testid="generate-share-code-button"
                  onClick={() => {
                    setShowPeriodSelector(true);
                  }}
                  sx={{
                    bgcolor: '#bae6fd',
                    color: '#0c4a6e',
                    '&:hover': { bgcolor: '#7dd3fc' },
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    minHeight: '48px'
                  }}
                >
                  期間を指定して共有
                </Button>
              </Box>


              {/* 高度な設定 */}
              <Accordion sx={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 36, py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    高度な設定
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 1.5 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    flexWrap: 'wrap'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={shareContent === 'shifts-only'} 
                          onChange={(_, checked) => setShareContent(checked ? 'shifts-only' : 'all-events')}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <div>シフトのみ共有</div>
                          <div style={{ fontSize: '0.8em', color: '#666' }}>(個人予定＝非共有)</div>
                        </Box>
                      }
                      sx={{ margin: 0 }}
                    />
                    <FormControlLabel
                      control={<Switch checked={hideWorkplace} onChange={(_, v) => setHideWorkplace(v)} size="small" />}
                      label="職場名を隠す"
                      sx={{ margin: 0 }}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </>
          )}

          {/* 友達追加タブ */}
          {activeTab === 1 && (
            <>

              {/* 友達追加フォーム */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="友達の名前"
                      value={friendName}
                      onChange={e => setFriendName(e.target.value)}
                      placeholder="例: 田中太郎"
                      inputProps={{ 'data-testid': 'friend-name' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                        カラー
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                        {colorPalette.map(color => (
                          <Box
                            key={color}
                            onClick={() => setFriendColor(color)}
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: color,
                              borderRadius: '50%',
                              cursor: 'pointer',
                              border: friendColor === color ? '2px solid' : '1px solid',
                              borderColor: friendColor === color ? 'primary.main' : 'divider',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              '&:hover': { transform: 'scale(1.1)' },
                              transition: 'all 0.2s ease',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontSize: '0.85rem', fontWeight: 500 }}>
                        友達のシェアコード（8桁の数字）
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <TextField
                          size="small"
                          value={importCode.slice(0, 4)}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setImportCode(value + importCode.slice(4));
                          }}
                          placeholder="1234"
                          inputProps={{ 
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            maxLength: 4,
                            style: { 
                              fontSize: '1.5rem',
                              letterSpacing: '0.1em',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              padding: '8px'
                            }
                          }}
                          sx={{ 
                            width: '120px',
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused fieldset': {
                                borderColor: importCode.length >= 4 ? 'success.main' : 'primary.main',
                              }
                            }
                          }}
                        />
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: 'text.secondary' }}>
                          -
                        </Typography>
                        <TextField
                          size="small"
                          value={importCode.slice(4, 8)}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setImportCode(importCode.slice(0, 4) + value);
                          }}
                          placeholder="5678"
                          inputProps={{ 
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            maxLength: 4,
                            style: { 
                              fontSize: '1.5rem',
                              letterSpacing: '0.1em',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              padding: '8px'
                            }
                          }}
                          sx={{ 
                            width: '120px',
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused fieldset': {
                                borderColor: importCode.length === 8 ? 'success.main' : 'primary.main',
                              }
                            }
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          textAlign: 'center',
                          mt: 1,
                          color: importCode.length === 8 ? 'success.main' : 
                                 importCode.length > 0 ? 'warning.main' : 'text.secondary',
                          fontWeight: importCode.length === 8 ? 600 : 400
                        }}
                      >
                        {importCode.length === 8 ? '✓ 入力完了' : 
                         importCode.length > 0 ? `${importCode.length}/8 桁` : '8桁の数字を入力してください'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleAddFriend}
                      disabled={!friendName.trim() || !importCode.trim()}
                      sx={{ py: 1.5 }}
                      data-testid="confirm-add-friend"
                    >
                      友達を追加
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* 友達一覧 */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                  友達一覧 ({friends.length}人)
                </Typography>
                
                {friends.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <PeopleAlt sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      まだ友達が追加されていません
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ py: 0 }}>
                    {friends.map(friend => (
                      <ListItem
                        key={friend.id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          py: 1,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: friend.color, width: 32, height: 32 }}>
                            {friend.displayName.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={friend.displayName}
                          secondary={
                            <Chip
                              label={visibleFriendIds.includes(friend.id) ? 'カレンダーに表示中' : '非表示'}
                              size="small"
                              color={visibleFriendIds.includes(friend.id) ? 'success' : 'default'}
                            />
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => toggleFriendVisibility(friend.id)}
                            sx={{ mr: 0.5 }}
                            size="small"
                          >
                            {visibleFriendIds.includes(friend.id) ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => removeFriend(friend.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                {getVisibleFriends().length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      カレンダーに表示中 ({getVisibleFriends().length}人)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {getVisibleFriends().map(friend => (
                        <Chip
                          key={friend.id}
                          label={friend.displayName}
                          size="small"
                          sx={{
                            backgroundColor: friend.color + '40',
                            color: friend.color,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>


      {/* 期間選択ダイアログ */}
      <Dialog
        open={showPeriodSelector}
        onClose={() => setShowPeriodSelector(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          📅 期間を選択
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="開始日"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="終了日"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPeriodSelector(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!customStart || !customEnd) {
                setAlert({ type: 'error', message: '開始日と終了日を入力してください' });
                return;
              }
              const code = generateShareCode('custom', { hideWorkplace, shareContent, range: { start: customStart, end: customEnd } });
              try {
                await navigator.clipboard.writeText(code);
                setAlert({ type: 'success', message: 'シェアコードをコピーしました' });
              } catch {}
              setShowPeriodSelector(false);
            }}
            disabled={!customStart || !customEnd}
          >
            共有コード生成
          </Button>
        </DialogActions>
      </Dialog>

      {/* シェアコード表示ダイアログ */}
      <Dialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>シェアコード生成完了</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            以下のコードを友達に送信してください：
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'grey.100',
              borderRadius: 1,
              mb: 2,
              border: '1px dashed grey.400',
            }}
          >
            <Typography
              variant="body2"
              sx={{ 
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                fontSize: '0.8rem',
              }}
              data-testid="my-share-code"
            >
              {shareCode}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>
            閉じる
          </Button>
          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={copyToClipboard}
          >
            コピー
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};