// 🤝 友達共有機能ハブ

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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useFriendStore } from '../store/friendStore';

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

  // 色パレット
  const colorPalette = [
    '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
    '#ba68c8', '#64b5f6', '#aed581', '#ffcc02',
  ];

  // 自分のシフトデータをシェアコード化（デモ用）
  const generateShareCode = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    
    const demoSchedule = {
      days: {
        [today.toISOString().split('T')[0]]: { 
          shifts: [{ start: '09:00', end: '17:00', workplace: '自分のバイト先' }] 
        },
        [tomorrow.toISOString().split('T')[0]]: { 
          shifts: [{ start: '18:00', end: '22:00', workplace: '自分のバイト先' }] 
        },
        [dayAfter.toISOString().split('T')[0]]: { 
          shifts: [{ start: '14:00', end: '19:00', workplace: '別のバイト先' }] 
        },
      }
    };
    const encoded = btoa(JSON.stringify(demoSchedule));
    setShareCode(encoded);
    setShowShareDialog(true);
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <PeopleAlt sx={{ color: 'warning.main', fontSize: 40, mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              友達のシフト共有
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            友達とシフトを共有して、お互いのスケジュールを確認できます
          </Typography>
        </CardContent>
      </Card>

      {/* アラート */}
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)} 
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* タブナビゲーション */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<Share />} label="シェア" />
          <Tab icon={<PersonAdd />} label="友達追加" />
          <Tab icon={<CalendarToday />} label="共有カレンダー" />
        </Tabs>
      </Card>

      {/* シェアタブ */}
      {activeTab === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <QrCode sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              自分のシフトを共有
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              シェアコードを生成して友達に送信
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              onClick={generateShareCode}
              sx={{
                background: 'linear-gradient(135deg, #ffd54f 0%, #ffcc02 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ffcc02 0%, #ffd54f 100%)',
                },
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              シェアコードを生成
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 友達追加タブ */}
      {activeTab === 1 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              友達を追加
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="友達の名前"
                  value={friendName}
                  onChange={e => setFriendName(e.target.value)}
                  placeholder="例: 田中太郎"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    カラー
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                          borderColor: friendColor === color ? 'primary.main' : 'transparent',
                          '&:hover': { transform: 'scale(1.1)' },
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
                  rows={3}
                  label="友達のシェアコード"
                  value={importCode}
                  onChange={e => setImportCode(e.target.value)}
                  placeholder="友達から受け取ったシェアコードを貼り付け"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAddFriend}
                  disabled={!friendName.trim() || !importCode.trim()}
                  sx={{ py: 1.5 }}
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
                    py: 1.5,
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
      )}

      {/* 共有カレンダータブ */}
      {activeTab === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                友達一覧 ({friends.length}人)
              </Typography>
              
              {friends.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PeopleAlt sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    まだ友達が追加されていません
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => setActiveTab(1)}
                  >
                    友達を追加
                  </Button>
                </Box>
              ) : (
                <List>
                  {friends.map(friend => (
                    <ListItem
                      key={friend.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: friend.color }}>
                          {friend.displayName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={friend.displayName}
                        secondary={
                          <Chip
                            label={visibleFriendIds.includes(friend.id) ? '表示中' : '非表示'}
                            size="small"
                            color={visibleFriendIds.includes(friend.id) ? 'success' : 'default'}
                          />
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => toggleFriendVisibility(friend.id)}
                          sx={{ mr: 1 }}
                        >
                          {visibleFriendIds.includes(friend.id) ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => removeFriend(friend.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                表示中の友達 ({getVisibleFriends().length}人)
              </Typography>
              {getVisibleFriends().length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  表示する友達を選択してください
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {getVisibleFriends().map(friend => (
                    <Chip
                      key={friend.id}
                      label={friend.displayName}
                      sx={{
                        backgroundColor: friend.color + '40',
                        color: friend.color,
                        fontWeight: 600,
                      }}
                    />
                  ))}
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