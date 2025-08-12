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

  // 共有オプション（Googleの哲学: デフォルトは安全・最小選択）
  const [sharePeriod, setSharePeriod] = useState<'custom' | 'all'>('custom');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [hideWorkplace, setHideWorkplace] = useState<boolean>(true); // プライバシーはデフォルトで守る
  const [shareContent, setShareContent] = useState<'shifts-only' | 'all-events'>('shifts-only'); // デフォルトはシフトのみ

  // 色パレット（共通）
  const colorPalette = APP_COLOR_PALETTE.map(c => c.color);

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

    const encoded = btoa(JSON.stringify(demoSchedule));
    setShareCode(encoded);
    setShowShareDialog(true);
    return encoded;
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

    const friendId = crypto.randomUUID();
    const newFriend = {
      id: friendId,
      displayName: friendName.trim(),
      color: friendColor,
    };

    // 友達追加
    addFriend(newFriend);

    // スケジュール取り込み
    const success = importFriendSchedule(friendId, importCode.trim());
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

  // デモ友達追加
  const addDemoFriend = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const demoSchedule = {
      days: {
        [today.toISOString().split('T')[0]]: { 
          shifts: [{ start: '10:00', end: '16:00', workplace: 'カフェ' }] 
        },
        [tomorrow.toISOString().split('T')[0]]: { 
          shifts: [{ start: '19:00', end: '23:00', workplace: 'レストラン' }] 
        },
      }
    };
    
    const friendId = crypto.randomUUID();
    const demoFriend = {
      id: friendId,
      displayName: 'デモ友達',
      color: '#81c784',
    };

    addFriend(demoFriend);
    importFriendSchedule(friendId, btoa(JSON.stringify(demoSchedule)));
    setAlert({ type: 'success', message: 'デモ友達を追加しました！カレンダーで確認できます' });
  };

  // 表示切替
  const toggleFriendVisibility = (friendId: string) => {
    const newVisible = visibleFriendIds.includes(friendId)
      ? visibleFriendIds.filter(id => id !== friendId)
      : [...visibleFriendIds, friendId];
    setVisibleFriends(newVisible);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 1.5 }}>
      {/* ヘッダー（コンパクト化） */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
            <PeopleAlt sx={{ color: 'warning.main', fontSize: 32, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              シフト共有
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
            友達とシフトを共有して、お互いのスケジュールを確認できます
          </Typography>
        </CardContent>
      </Card>

      {/* アラート */}
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)} 
          sx={{ mb: 1.5 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* タブナビゲーション（わかりやすく整理） */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<Share />} label="共有する" data-testid="share-tab" sx={{ minHeight: 48 }} />
          <Tab icon={<PersonAdd />} label="友達を追加" data-testid="add-friend-tab" sx={{ minHeight: 48 }} />
        </Tabs>
      </Card>


      {/* シェアタブ */}
      {activeTab === 0 && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <QrCode sx={{ fontSize: 40, color: 'warning.main', mb: 0.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                かんたん共有
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                シフトだけを安全に共有できます
              </Typography>
            </Box>

            {/* 2つのCTA：全部 / 期間指定 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              <Button
                variant="contained"
                size="medium"
                onClick={async () => {
                  const code = generateShareCode('all', { hideWorkplace, shareContent });
                  try {
                    await navigator.clipboard.writeText(code);
                    setAlert({ type: 'success', message: 'シェアコードをコピーしました' });
                  } catch {}
                }}
                sx={{
                  background: 'linear-gradient(135deg, #ffd54f 0%, #ffcc02 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ffcc02 0%, #ffd54f 100%)',
                  },
                  px: 3,
                  py: 1,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  width: '100%',
                }}
              >
                全部のシフトを共有してコピー
              </Button>
              <Button
                variant="contained"
                size="medium"
                data-testid="generate-share-code-button"
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
                }}
                sx={{
                  background: 'linear-gradient(135deg, #ffd54f 0%, #ffcc02 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ffcc02 0%, #ffd54f 100%)',
                  },
                  px: 3,
                  py: 1,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  width: '100%',
                }}
              >
                期間指定のシフトを共有してコピー
              </Button>
              
              {/* 期間指定UI - 期間限定ボタンの下に配置 */}
              <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                  📅 期間指定
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      type="date"
                      label="開始日"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      fullWidth
                      size="small"
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
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>

            {/* 高度な設定（プログレッシブディスクロージャ） */}
            <Accordion sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 1 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>高度な設定（任意）</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>共有内容</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={shareContent === 'shifts-only'} 
                            onChange={(_, checked) => setShareContent(checked ? 'shifts-only' : 'all-events')}
                            size="small"
                          />
                        }
                        label="シフトのみ"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', ml: 4 }}>
                        {shareContent === 'shifts-only' ? '個人予定は共有しません' : '個人予定も含めて共有します'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>表示設定</Typography>
                    <FormControlLabel
                      control={<Switch checked={hideWorkplace} onChange={(_, v) => setHideWorkplace(v)} size="small" />}
                      label="職場名を隠す"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 友達追加タブ */}
      {activeTab === 1 && (
        <Box>
          {/* 友達追加フォーム */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                友達を追加
              </Typography>
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
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    label="友達のシェアコード"
                    value={importCode}
                    onChange={e => setImportCode(e.target.value)}
                    placeholder="友達から受け取ったシェアコードを貼り付け"
                    inputProps={{ 'data-testid': 'friend-share-code' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAddFriend}
                    disabled={!friendName.trim() || !importCode.trim()}
                    sx={{ py: 1 }}
                    data-testid="confirm-add-friend"
                  >
                    友達を追加
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={addDemoFriend}
                    sx={{ 
                      py: 1,
                      borderColor: 'warning.main',
                      color: 'warning.main',
                      '&:hover': {
                        borderColor: 'warning.dark',
                        backgroundColor: 'warning.lighter',
                      }
                    }}
                  >
                    デモ友達を追加
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 友達一覧（統合） */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
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
            </CardContent>
          </Card>
        </Box>
      )}


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