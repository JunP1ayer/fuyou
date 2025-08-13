import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Stack, Tooltip } from '@mui/material';
import { taxAndInsuranceZeroCap, Answers } from '@/lib/taxInsuranceZero';
import { LocalAtm, Shield, Gavel } from '@mui/icons-material';

type Props = { answers: Answers };

export const TaxInsuranceZeroCard: React.FC<Props> = ({ answers }) => {
  const result = taxAndInsuranceZeroCap(answers);

  const chips: Array<{ label: string; value?: number; icon?: React.ReactNode }>[] = [
    [
      { label: '税金0', value: result.breakdown.taxZeroCap, icon: <Gavel fontSize="small" /> },
      { label: '所得税', value: result.breakdown.incomeTaxCap },
      { label: '住民税', value: result.breakdown.residentTaxCap },
    ],
    [
      { label: '社保0', value: result.breakdown.insuranceCap ?? undefined, icon: <Shield fontSize="small" /> },
      { label: '被扶養', value: 1_300_000 },
      { label: '106万', value: result.breakdown.cap106Applied ? 1_056_000 : undefined },
    ],
  ];

  const hero = result.capJPY;

  const title = answers.hasDependent ? '税金・社会保険ゼロで収まる上限' : '税金ゼロで収まる上限';

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
          <LocalAtm color="primary" />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
          {hero !== null ? hero.toLocaleString() + ' 円' : '—'}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
          {chips.map((row, idx) => (
            <Stack key={idx} direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {row.map((c, i) => (
                <Tooltip key={i} title={c.label}>
                  <Chip size="small" label={`${c.label}${c.value ? `: ${c.value.toLocaleString()}円` : ''}`} icon={c.icon as any} />
                </Tooltip>
              ))}
            </Stack>
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          住民税は翌年度課税・自治体により微差あり。106万は月8.8万円・週20h・2か月超・従業員51人以上など全条件で判定。被扶養の130万は健康保険組合の運用差あり。
        </Typography>

        {result.reasons?.length ? (
          <Box sx={{ mt: 0.5 }}>
            {result.reasons.map((r, i) => (
              <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                ・{r}
              </Typography>
            ))}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TaxInsuranceZeroCard;


