// 📖 国別ヘルプドキュメント - 各国の税制・規則説明

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Info,
  Warning,
  AttachMoney,
  School,
  FamilyRestroom as Family,
  Work,
  LocalAtm,
  AccountBalance,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import useI18n from '../../hooks/useI18n';
import { getCountryLimits } from '../../lib/rules/provider';

interface CountrySpecificHelpProps {
  compact?: boolean;
}

export const CountrySpecificHelp: React.FC<CountrySpecificHelpProps> = ({
  compact = false,
}) => {
  const { t, country, formatCurrency } = useI18n();
  const limits = getCountryLimits(country);

  // 国別情報データ
  const countryData = {
    JP: {
      name: '日本',
      currency: 'JPY',
      taxYear: '1月〜12月',
      mainLimits: [
        { type: '扶養控除限度額', amount: 1230000, description: '年間123万円まで扶養控除対象' },
        { type: '学生特例（19-22歳）', amount: 1500000, description: '年間150万円まで（2025年税制改正）' },
        { type: '親の税負担増加', amount: 1030000, description: '年間103万円超過で配偶者控除減額' },
      ],
      helpSections: [
        {
          title: 'アルバイト収入と税金',
          icon: <AttachMoney />,
          content: `
            日本では学生アルバイトに以下の制度があります：
            • 年間収入103万円以下：所得税・住民税なし
            • 年間収入130万円以下：社会保険扶養対象
            • 2025年改正：19-22歳学生は150万円まで扶養控除
          `,
        },
        {
          title: '学生特例制度',
          icon: <School />,
          content: `
            2025年税制改正による新制度：
            • 19歳〜22歳の学生：年間150万円まで扶養控除対象
            • 通常学生：年間123万円まで
            • 勤労学生控除：年間130万円まで適用可能
          `,
        },
        {
          title: '親への影響',
          icon: <Family />,
          content: `
            学生収入が以下を超えると親の税負担が増加：
            • 103万円超：配偶者控除段階的減額
            • 130万円超：社会保険扶養除外
            • 扶養控除額：最大38万円（所得税）+ 33万円（住民税）
          `,
        },
      ],
      importantNotes: [
        '確定申告は2月16日〜3月15日',
        '給与所得控除55万円は自動適用',
        '複数バイト先がある場合は年末調整要注意',
        '交通費は非課税（月15万円まで）',
      ],
    },
    UK: {
      name: 'United Kingdom',
      currency: 'GBP',
      taxYear: 'April 6 - April 5',
      mainLimits: [
        { type: 'Personal Allowance', amount: 12570, description: '£12,570/year tax-free' },
        { type: 'Student Loan Threshold', amount: 27295, description: 'Repayments start at £27,295/year' },
        { type: 'Child Benefit Limit', amount: 8000, description: 'Parental benefits affected at £8,000+' },
      ],
      helpSections: [
        {
          title: 'Tax and National Insurance',
          icon: <AttachMoney />,
          content: `
            UK tax system for students:
            • Personal Allowance: £12,570 tax-free per year
            • National Insurance: Starts at £242/week (£12,584/year)
            • Student jobs: Usually tax-free if below thresholds
          `,
        },
        {
          title: 'Student Employment',
          icon: <School />,
          content: `
            Special rules for students:
            • Part-time work: No limit during term time
            • Holiday work: Full-time allowed during breaks
            • Tier 4/Student visa: 20 hours/week limit during studies
          `,
        },
        {
          title: 'Benefits Impact',
          icon: <Family />,
          content: `
            How student income affects family benefits:
            • Child Benefit: Reduced if parent earns £50,000+
            • Tax Credits: Student income may affect family claims
            • Universal Credit: Student grants usually ignored
          `,
        },
      ],
      importantNotes: [
        'Tax year runs April 6 - April 5',
        'P60 certificate needed for tax returns',
        'Emergency tax code 1257L for new jobs',
        'Student loan repayments pause if income drops',
      ],
    },
    DE: {
      name: 'Deutschland',
      currency: 'EUR',
      taxYear: '1. Januar - 31. Dezember',
      mainLimits: [
        { type: 'Minijob-Grenze', amount: 520, description: '€520/Monat steuerfrei' },
        { type: 'Werkstudent-Grenze', amount: 1040, description: '€1.040/Monat bei 20 Std/Woche' },
        { type: 'Kindergeld-Grenze', amount: 6240, description: 'Kindergeld bei €6.240+/Jahr betroffen' },
      ],
      helpSections: [
        {
          title: 'Minijob und Steuern',
          icon: <AttachMoney />,
          content: `
            Deutsche Steuerregeln für Studenten:
            • Minijob: €520/Monat steuerfrei
            • Werkstudent: Bis €1.040/Monat bei 20 Std/Woche
            • Grundfreibetrag: €10.908/Jahr
          `,
        },
        {
          title: 'Studentenstatus',
          icon: <School />,
          content: `
            Besondere Regelungen für Studenten:
            • Werkstudent: Bis 20 Std/Woche während Vorlesungszeit
            • Semesterferien: Vollzeit erlaubt
            • Krankenversicherung: Bis 25 Jahre familienversichert
          `,
        },
        {
          title: 'Kindergeld und Familienleistungen',
          icon: <Family />,
          content: `
            Auswirkungen auf Familienleistungen:
            • Kindergeld: €250/Monat bis 25 Jahre
            • Einkommensgrenze: €6.240/Jahr
            • Überschreitung: Kindergeld muss zurückgezahlt werden
          `,
        },
      ],
      importantNotes: [
        'Steuererklärung bis 31. Juli',
        'Lohnsteuerklasse I für Studenten',
        'Sozialversicherungspflicht ab €520/Monat',
        'Werkstudentenstatus: Maximal 26 Wochen Vollzeit/Jahr',
      ],
    },
    DK: {
      name: 'Danmark',
      currency: 'DKK',
      taxYear: '1. januar - 31. december',
      mainLimits: [
        { type: 'Personfradrag', amount: 48000, description: 'kr. 48.000/år skattefrit' },
        { type: 'SU-grænse', amount: 15000, description: 'kr. 15.000/måned ved SU' },
        { type: 'Børnecheck-påvirkning', amount: 35000, description: 'Forældreydelser påvirkes ved kr. 35.000+' },
      ],
      helpSections: [
        {
          title: 'Skat og fradrag',
          icon: <AttachMoney />,
          content: `
            Danske skatteregler for studerende:
            • Personfradrag: kr. 48.000/år skattefrit
            • Arbejdsmarkedsbidrag: 8% af indkomst over kr. 48.000
            • Bundskat: 12,11% efter fradrag
          `,
        },
        {
          title: 'SU og studiejob',
          icon: <School />,
          content: `
            Regler for studerende med SU:
            • Fribeløb: kr. 15.000/måned ved fuld SU
            • Overskridelse: SU tilbagebetales med 50% af overskud
            • Ferieperioder: Højere fribeløb (kr. 30.000/måned)
          `,
        },
        {
          title: 'Familieydelser',
          icon: <Family />,
          content: `
            Påvirkning af familieydelser:
            • Børne- og ungeydelse: Til 17 år
            • Børnecheck: Påvirkes hvis barnets indkomst > kr. 35.000
            • Boligstøtte: Kan påvirkes af høj indkomst
          `,
        },
      ],
      importantNotes: [
        'Forskudsopgørelse skal opdateres ved jobskift',
        'Årsopgørelse kommer automatisk i marts',
        'Borger.dk bruges til skatteforhold',
        'Feriepengebeløb udbetales året efter',
      ],
    },
    FI: {
      name: 'Suomi',
      currency: 'EUR',
      taxYear: '1. tammikuu - 31. joulukuu',
      mainLimits: [
        { type: 'Perusvähennys', amount: 11600, description: '€11.600/vuosi verovapaasti' },
        { type: 'Opintotuki-tuloraja', amount: 1500, description: '€1.500/kk opintotuen kanssa' },
        { type: 'Lapsilisä-vaikutus', amount: 8500, description: 'Vanhempainedut vaikuttaa €8.500+/vuosi' },
      ],
      helpSections: [
        {
          title: 'Verotus ja vähennykset',
          icon: <AttachMoney />,
          content: `
            Suomen verosäännöt opiskelijoille:
            • Perusvähennys: €11.600/vuosi verovapaasti
            • Työtulovähennys: Lisäksi €1.800/vuosi
            • Kunnallisvero: n. 20% (vaihtelee kunnittain)
          `,
        },
        {
          title: 'Opintotuki ja työnteko',
          icon: <School />,
          content: `
            Säännöt opintotuen saajille:
            • Tuloraja: €1.500/kk (€15.600/vuosi)
            • Ylitys: Opintotuki vähenee 50 senttiä/euro
            • Kesälomat: Korkeampi tuloraja (€3.900/kk)
          `,
        },
        {
          title: 'Lapsilisä ja etuudet',
          icon: <Family />,
          content: `
            Vaikutus perheetuuksiin:
            • Lapsilisä: 17 ikävuoteen asti
            • Asumistuki: Voi vähentyä korkean tulon myötä
            • Toimeentulotuki: Työtulojen vaikutus laskennassa
          `,
        },
      ],
      importantNotes: [
        'Veroilmoitus toukokuun loppuun mennessä',
        'Työmatkakuluvähennys vähintään €750/vuosi',
        'Verokortti tarvitaan uuteen työpaikkaan',
        'OmaVero-palvelu verohallinnon sivustolla',
      ],
    },
    NO: {
      name: 'Norge',
      currency: 'NOK',
      taxYear: '1. januar - 31. desember',
      mainLimits: [
        { type: 'Personfradrag', amount: 65550, description: 'kr. 65.550/år skattefritt' },
        { type: 'Stipend-grense', amount: 300000, description: 'kr. 300.000/år ved stipend' },
        { type: 'Barnetrygd-påvirkning', amount: 50000, description: 'Foreldreytelser påvirkes ved kr. 50.000+' },
      ],
      helpSections: [
        {
          title: 'Skatt og fradrag',
          icon: <AttachMoney />,
          content: `
            Norske skatteregler for studenter:
            • Personfradrag: kr. 65.550/år skattefritt
            • Trygdeavgift: 8,2% av inntekt over kr. 65.550
            • Kommuneskatt: Varierer fra 11,5% til 17,9%
          `,
        },
        {
          title: 'Stipend og studentarbeid',
          icon: <School />,
          content: `
            Regler for studenter med stipend:
            • Inntektstak: kr. 300.000/år for å beholde fullt stipend
            • Overskridelse: Stipend reduseres krone for krone
            • Feriepenger: Opptjenes på vanlig måte
          `,
        },
        {
          title: 'Barnetrygd og stønad',
          icon: <Family />,
          content: `
            Påvirkning av familiestønad:
            • Barnetrygd: kr. 1.766/måned til 18 år
            • Kontantstøtte: Påvirkes ikke av barnets inntekt
            • Bostøtte: Kan reduseres ved høy husholdningsinntekt
          `,
        },
      ],
      importantNotes: [
        'Skattemelding leveres innen 31. mai',
        'Forskuddsskatt beregnes automatisk',
        'Skatteetaten.no for alle skatteforhold',
        'Minsteinntekt for opptjening av feriepenger: kr. 29.391',
      ],
    },
  };

  const currentCountry = countryData[country as keyof typeof countryData] || countryData.JP;

  return (
    <Box sx={{ maxWidth: compact ? 600 : 1200, mx: 'auto', p: compact ? 1 : 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalance sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {currentCountry.name} - {t('help.title', 'ヘルプ & サポート')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentCountry.taxYear} • {currentCountry.currency}
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              このヘルプは{currentCountry.name}の税制・学生就労規則に基づいています。
              最新の法改正については公式機関にご確認ください。
            </Alert>
          </CardContent>
        </Card>

        {/* 主要限度額 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
              <LocalAtm sx={{ mr: 1 }} />
              主要な収入限度額
            </Typography>
            
            {currentCountry.mainLimits.map((limit, index) => (
              <Box key={index} sx={{ mb: 2, last: { mb: 0 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {limit.type}
                  </Typography>
                  <Chip 
                    label={formatCurrency(limit.amount)}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {limit.description}
                </Typography>
                {index < currentCountry.mainLimits.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* 詳細セクション */}
        {!compact && (
          <Box sx={{ mb: 3 }}>
            {currentCountry.helpSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {section.icon}
                      <Typography sx={{ ml: 1, fontWeight: 500 }}>
                        {section.title}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography 
                      variant="body2" 
                      sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}
                    >
                      {section.content}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            ))}
          </Box>
        )}

        {/* 重要事項 */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
              <Warning sx={{ mr: 1, color: 'warning.main' }} />
              重要な注意事項
            </Typography>
            
            <List dense>
              {currentCountry.importantNotes.map((note, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Info color="info" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={note}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                税制は毎年変更される可能性があります。最新情報は以下の公式サイトでご確認ください：
                <br />
                {country === 'JP' && (
                  <Link href="https://www.nta.go.jp/" target="_blank" rel="noopener">
                    国税庁（nta.go.jp）
                  </Link>
                )}
                {country === 'UK' && (
                  <Link href="https://www.gov.uk/browse/tax" target="_blank" rel="noopener">
                    UK Government Tax（gov.uk）
                  </Link>
                )}
                {country === 'DE' && (
                  <Link href="https://www.bundesfinanzministerium.de/" target="_blank" rel="noopener">
                    Bundesfinanzministerium（bundesfinanzministerium.de）
                  </Link>
                )}
                {country === 'DK' && (
                  <Link href="https://skat.dk/" target="_blank" rel="noopener">
                    Skattestyrelsen（skat.dk）
                  </Link>
                )}
                {country === 'FI' && (
                  <Link href="https://www.vero.fi/" target="_blank" rel="noopener">
                    Verohallinto（vero.fi）
                  </Link>
                )}
                {country === 'NO' && (
                  <Link href="https://skatteetaten.no/" target="_blank" rel="noopener">
                    Skatteetaten（skatteetaten.no）
                  </Link>
                )}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};