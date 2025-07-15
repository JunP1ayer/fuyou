import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            扶養管理アプリ
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.fullName}さん
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          ダッシュボード
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ユーザー情報
              </Typography>
              <Typography variant="body1">氏名: {user?.fullName}</Typography>
              <Typography variant="body1">メール: {user?.email}</Typography>
              <Typography variant="body1">
                学生: {user?.isStudent ? 'はい' : 'いいえ'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                扶養ステータス
              </Typography>
              <Typography variant="body1" color="text.secondary">
                実装予定: 扶養控除の計算結果とアラート
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                最近の収入
              </Typography>
              <Typography variant="body1" color="text.secondary">
                実装予定: 収入履歴と統計情報
              </Typography>
            </Paper>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                収入登録
              </Typography>
              <Typography variant="body1" color="text.secondary">
                実装予定: 新しい収入を登録するフォーム
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                年間予測
              </Typography>
              <Typography variant="body1" color="text.secondary">
                実装予定: 年末までの収入予測と扶養限度額チェック
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
