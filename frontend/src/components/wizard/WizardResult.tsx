import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

export const WizardResult: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: any };
  const cards = state?.result?.cards as Array<{
    title: string;
    status: string;
    message: string;
    reasons?: string[];
  }>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        結果（暫定）
      </Typography>
      <Grid container spacing={2}>
        {(cards || []).map((c, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {c.title}
                  </Typography>
                  <Chip
                    label={c.status}
                    color={
                      c.status === 'ok'
                        ? 'success'
                        : c.status === 'warn'
                          ? 'warning'
                          : c.status === 'ng'
                            ? 'error'
                            : 'default'
                    }
                    size="small"
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: c.reasons?.length ? 1 : 0 }}
                >
                  {c.message}
                </Typography>
                {c.reasons?.length ? (
                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {c.reasons.map((r, i) => (
                      <li key={i}>
                        <Typography variant="caption">{r}</Typography>
                      </li>
                    ))}
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/wizard')}>
          もう一度チェック
        </Button>
        <Button variant="contained" onClick={() => navigate('/')}>
          ホームへ
        </Button>
      </Box>
    </Box>
  );
};
