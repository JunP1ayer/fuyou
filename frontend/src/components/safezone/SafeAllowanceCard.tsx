import React, { useMemo } from 'react';
import { Card, CardContent, Box, Typography, Chip, Stack, Tooltip, Link } from '@mui/material';
import useI18nStore from '@/store/i18nStore';
import { useSimpleShiftStore } from '@/store/simpleShiftStore';
import { getCountryLimits } from '@/lib/rules/provider';
import { formatCurrency } from '@/utils/calculations';

export const SafeAllowanceCard: React.FC = () => {
  const { language, country } = useI18nStore();
  const { shifts } = useSimpleShiftStore();

  const limits = getCountryLimits(country);

  const { monthTotal, yearTotal } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let monthSum = 0;
    let yearSum = 0;
    for (const s of shifts) {
      const d = new Date(s.date);
      if (d.getFullYear() === y) {
        yearSum += s.totalEarnings;
        if (d.getMonth() === m) monthSum += s.totalEarnings;
      }
    }
    return { monthTotal: monthSum, yearTotal: yearSum };
  }, [shifts]);

  const currency = limits.currency;
  const annualLimit = limits.taxAnnual;
  const monthlyLimit = limits.socialMonthly;

  const annualRemaining = typeof annualLimit === 'number' ? Math.max(0, annualLimit - yearTotal) : null;
  const monthlyRemaining = typeof monthlyLimit === 'number' ? Math.max(0, monthlyLimit - monthTotal) : null;

  const annualProgress = typeof annualLimit === 'number' && annualLimit > 0 ? Math.min(100, Math.round((yearTotal / annualLimit) * 100)) : null;
  const monthlyProgress = typeof monthlyLimit === 'number' && monthlyLimit > 0 ? Math.min(100, Math.round((monthTotal / monthlyLimit) * 100)) : null;

  if (!annualLimit && !monthlyLimit) return null;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            安全枠（{country}）
          </Typography>
          <Chip size="small" label={currency} />
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
          {typeof monthlyLimit === 'number' && (
            <Box sx={{ flex: 1, minWidth: 240, p: 2, border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {limits.labels?.shaho106 || '月次しきい値'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の見込み: {formatCurrency(monthTotal, { language, currency })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {formatCurrency(monthlyRemaining ?? 0, { language, currency })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / {formatCurrency(monthlyLimit, { language, currency })}
                </Typography>
              </Box>
              {monthlyProgress !== null && (
                <Tooltip title={`進捗 ${monthlyProgress}%`}>
                  <Box sx={{ mt: 1, height: 8, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{ width: `${monthlyProgress}%`, height: 8, bgcolor: monthlyProgress >= 100 ? 'error.main' : monthlyProgress >= 80 ? 'warning.main' : 'success.main' }} />
                  </Box>
                </Tooltip>
              )}
            </Box>
          )}

          {typeof annualLimit === 'number' && (
            <Box sx={{ flex: 1, minWidth: 240, p: 2, border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {limits.labels?.tax || '年次しきい値'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今年の累計: {formatCurrency(yearTotal, { language, currency })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {formatCurrency(annualRemaining ?? 0, { language, currency })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / {formatCurrency(annualLimit, { language, currency })}
                </Typography>
              </Box>
              {annualProgress !== null && (
                <Tooltip title={`進捗 ${annualProgress}%`}>
                  <Box sx={{ mt: 1, height: 8, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{ width: `${annualProgress}%`, height: 8, bgcolor: annualProgress >= 100 ? 'error.main' : annualProgress >= 80 ? 'warning.main' : 'success.main' }} />
                  </Box>
                </Tooltip>
              )}
            </Box>
          )}
        </Stack>

        {/* 根拠リンク（簡易マップ） */}
        <Box sx={{ mt: 1 }}>
          {(() => {
            const sources: Record<string, string> = {
              DK: 'https://www.su.dk/su/naar-du-faar-su/saa-meget-maa-du-tjene',
              FI: 'https://www.kela.fi/tulojen-vaikutus-toisella-asteella',
              NO: 'https://lanekassen.no/nb-NO/stipend-og-lan/norge/universitet-og-hogskole/',
              DE: 'https://www.minijob-zentrale.de/DE/die-minijobs/minijob-mit-verdienstgrenze/minijob-mit-verdienstgrenze_node.html',
              AT: 'https://www.ams.at/arbeitsuchende/topicliste/geringfuegigkeitsgrenze',
              PL: 'https://www.podatki.gov.pl/',
              HU: 'https://nav.gov.hu/',
              UK: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026',
              JP: 'https://www.nta.go.jp/',
            };
            const url = sources[country];
            return url ? (
              <Typography variant="caption" color="text.secondary">
                根拠: <Link href={url} target="_blank" rel="noopener noreferrer">公式情報</Link>
              </Typography>
            ) : null;
          })()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SafeAllowanceCard;


