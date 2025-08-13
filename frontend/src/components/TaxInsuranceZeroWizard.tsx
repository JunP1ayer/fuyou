import React, { useMemo, useState } from 'react';
import { Card, CardContent, Box, Typography, Grid, TextField, MenuItem, FormControlLabel, Checkbox, Divider, Stack, InputAdornment, Link } from '@mui/material';
import TaxInsuranceZeroCard from './TaxInsuranceZeroCard';
import { Answers, StudentStatus } from '@/lib/taxInsuranceZero';

const prefectures = ['全国'];

export const TaxInsuranceZeroWizard: React.FC = () => {
	const [age, setAge] = useState<number>(20);
	const [isStudent, setIsStudent] = useState<boolean>(true);
	const [studentStatus, setStudentStatus] = useState<StudentStatus>('none');
	const [studentException, setStudentException] = useState<boolean>(false);
	const [salaryOnly, setSalaryOnly] = useState<boolean>(true);
	const [hasDependent, setHasDependent] = useState<boolean>(true);
	const [weeklyHours20Plus, setWeeklyHours20Plus] = useState<boolean>(false);
	const [monthsOver2, setMonthsOver2] = useState<boolean>(true);
	const [employer51Plus, setEmployer51Plus] = useState<boolean>(true);
	const [hourlyWage, setHourlyWage] = useState<number>(1100);
	const [weeklyHours, setWeeklyHours] = useState<number>(15);
	const [monthlyWageOverride, setMonthlyWageOverride] = useState<number | ''>('');
	const [prefecture, setPrefecture] = useState<string>('全国');

	const monthlyWageJPY = useMemo(() => {
		if (monthlyWageOverride !== '') return Number(monthlyWageOverride) || 0;
		const approx = Math.round((hourlyWage || 0) * (weeklyHours || 0) * 4.33);
		return approx;
	}, [hourlyWage, weeklyHours, monthlyWageOverride]);

	const answers: Answers = useMemo(() => ({
		age,
		isStudent,
		studentStatus,
		salaryOnly,
		hasDependent,
		weeklyHours20Plus,
		monthsOver2,
		employer51Plus,
		monthlyWageJPY,
		studentException,
		prefecture,
		manualLimit: null,
	}), [age, isStudent, studentStatus, salaryOnly, hasDependent, weeklyHours20Plus, monthsOver2, employer51Plus, monthlyWageJPY, studentException, prefecture]);

	return (
		<Box>
			<Card sx={{ mb: 1.5 }}>
				<CardContent>
					<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>税金も社会保険も「自分で払わずに」済む上限判定（2025年基準）</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
						回答に応じて「税金ゼロ」「社会保険ゼロ」を同時に満たす年収の上限を自動計算します。住民税は自治体により微差があるため、標準値で試算します。
					</Typography>
					<Grid container spacing={1}>
						<Grid item xs={6} sm={3}>
							<TextField label="年齢" type="number" size="small" fullWidth value={age} onChange={e => setAge(Number(e.target.value))} />
						</Grid>
						<Grid item xs={6} sm={3}>
							<TextField select label="学生" size="small" fullWidth value={isStudent ? 'yes' : 'no'} onChange={e => setIsStudent(e.target.value === 'yes')}>
								<MenuItem value="yes">はい</MenuItem>
								<MenuItem value="no">いいえ</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField select label="勤労学生OKか（学生の区分）" size="small" fullWidth value={studentStatus} onChange={e => setStudentStatus(e.target.value as StudentStatus)} disabled={!isStudent} helperText="休学は不可。夜間・通信・在学・卒業継続は可の目安です。">
								<MenuItem value="none">在学（通常）</MenuItem>
								<MenuItem value="night">夜間・通信</MenuItem>
								<MenuItem value="graduate_soon">卒業予定で継続就労</MenuItem>
								<MenuItem value="leave">休学（勤労学生控除は不可）</MenuItem>
							</TextField>
						</Grid>

						<Grid item xs={12} sm={3}>
							<FormControlLabel control={<Checkbox checked={salaryOnly} onChange={e => setSalaryOnly(e.target.checked)} />} label="給与収入のみ" />
						</Grid>
						<Grid item xs={12} sm={3}>
							<FormControlLabel control={<Checkbox checked={hasDependent} onChange={e => setHasDependent(e.target.checked)} />} label="家族の被扶養に該当/予定" />
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 3.5 }}>チェックを外すと「社保0」は対象外となり、税金ゼロ上限のみを表示します。</Typography>
						</Grid>
						<Grid item xs={12} sm={3}>
							<FormControlLabel control={<Checkbox checked={studentException} onChange={e => setStudentException(e.target.checked)} disabled={!isStudent} />} label="学生例外が外れる（休学/夜間等で106対象に）" />
						</Grid>

					</Grid>

					<Divider sx={{ my: 1 }} />

					<Grid container spacing={1}>
						<Grid item xs={12} sm={3}>
							<FormControlLabel control={<Checkbox checked={weeklyHours20Plus} onChange={e => setWeeklyHours20Plus(e.target.checked)} />} label="週20時間以上" />
						</Grid>
						<Grid item xs={12} sm={3}>
							<FormControlLabel control={<Checkbox checked={monthsOver2} onChange={e => setMonthsOver2(e.target.checked)} />} label="雇用期間2か月超" />
						</Grid>
						<Grid item xs={12} sm={3}>
							<FormControlLabel control={<Checkbox checked={employer51Plus} onChange={e => setEmployer51Plus(e.target.checked)} />} label="従業員51人以上（任意特定含む）" />
						</Grid>

						<Grid item xs={12} sm={3}>
							<TextField label="月額賃金（概算）" size="small" fullWidth value={monthlyWageOverride} onChange={e => setMonthlyWageOverride(e.target.value === '' ? '' : Number(e.target.value))} placeholder={monthlyWageJPY.toString()} helperText="未入力なら時給×週時間×4.33で自動計算" InputProps={{ endAdornment: <InputAdornment position="end">円</InputAdornment> }} />
						</Grid>

						<Grid item xs={6} sm={3}>
							<TextField label="時給" type="number" size="small" fullWidth value={hourlyWage} onChange={e => setHourlyWage(Number(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">円</InputAdornment> }} />
						</Grid>
						<Grid item xs={6} sm={3}>
							<TextField label="週の労働時間" type="number" size="small" fullWidth value={weeklyHours} onChange={e => setWeeklyHours(Number(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">h</InputAdornment> }} />
						</Grid>

						<Grid item xs={12} sm={3}>
							<TextField select label="地域（任意）" size="small" fullWidth value={prefecture} onChange={e => setPrefecture(e.target.value)} helperText="未選択＝全国基準。将来、自治体テーブルで上書きします。">
								{prefectures.map(p => (
									<MenuItem key={p} value={p}>{p}</MenuItem>
								))}
							</TextField>
						</Grid>
					</Grid>

					<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
						<Typography variant="caption" color="text.secondary">根拠:</Typography>
						<Typography variant="caption" color="text.secondary">所得税160万・住民税110万/学生134万・被扶養130万・106万（月8.8万円, 週20h, 2か月超, 51人以上）</Typography>
					</Stack>

					<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
						詳細は
						<Link href="https://www.nta.go.jp/" target="_blank" rel="noopener">国税庁</Link>・
						<Link href="https://www.nenkin.go.jp/" target="_blank" rel="noopener">日本年金機構</Link>
						等の公式情報をご確認ください。
					</Typography>
				</CardContent>
			</Card>

			<TaxInsuranceZeroCard answers={answers} />
		</Box>
	);
};

export default TaxInsuranceZeroWizard;


