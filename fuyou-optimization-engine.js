// 扶養特化最適化エンジン
class FuyouOptimizationEngine {
    constructor() {
        // 2025年の扶養控除制度
        this.limits = {
            dependent: 1030000,        // 扶養控除限度額
            socialInsurance: 1060000,  // 社会保険料免除限度額 
            municipalTax: 1000000,     // 住民税非課税限度額
            warning: 0.9,              // 警告レベル（90%）
            danger: 0.95               // 危険レベル（95%）
        };
        
        // 学生の特別控除
        this.studentBonuses = {
            勤労学生控除: 270000,      // 勤労学生控除額
            基礎控除: 380000           // 基礎控除額
        };
    }

    /**
     * 包括的な扶養リスク分析
     * @param {number} currentIncome - 現在の年収
     * @param {Array} shifts - シフトデータ
     * @param {Array} workplaces - 勤務先データ
     * @returns {Object} リスク分析結果
     */
    analyzeRisk(currentIncome, shifts, workplaces) {
        const analysis = {
            current: this.getCurrentStatus(currentIncome),
            prediction: this.predictYearEnd(currentIncome, shifts),
            optimization: this.generateOptimizationSuggestions(currentIncome, shifts, workplaces),
            alerts: this.generateAlerts(currentIncome, shifts)
        };

        return analysis;
    }

    /**
     * 現在のステータス分析
     */
    getCurrentStatus(currentIncome) {
        const dependentProgress = currentIncome / this.limits.dependent;
        const socialInsuranceProgress = currentIncome / this.limits.socialInsurance;
        
        let riskLevel = 'safe';
        if (dependentProgress >= this.limits.danger) riskLevel = 'danger';
        else if (dependentProgress >= this.limits.warning) riskLevel = 'warning';

        return {
            dependentRemaining: Math.max(0, this.limits.dependent - currentIncome),
            socialInsuranceRemaining: Math.max(0, this.limits.socialInsurance - currentIncome),
            dependentProgress: dependentProgress,
            socialInsuranceProgress: socialInsuranceProgress,
            riskLevel: riskLevel,
            safetyMargin: (this.limits.dependent * this.limits.warning) - currentIncome
        };
    }

    /**
     * 年末予測計算
     */
    predictYearEnd(currentIncome, shifts) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const remainingMonths = 12 - (currentMonth + 1);
        
        // 過去3ヶ月の平均収入を計算
        const recentShifts = shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            const monthsAgo = (now.getFullYear() - shiftDate.getFullYear()) * 12 + 
                             (now.getMonth() - shiftDate.getMonth());
            return monthsAgo <= 3 && monthsAgo >= 0;
        });

        const monthlyAverages = this.calculateMonthlyAverages(recentShifts);
        const trendMultiplier = this.calculateTrendMultiplier(monthlyAverages);
        
        // 保守的・楽観的・現実的な3つのシナリオ
        const scenarios = {
            conservative: currentIncome + (monthlyAverages.recent * 0.8 * remainingMonths),
            realistic: currentIncome + (monthlyAverages.recent * trendMultiplier * remainingMonths),
            optimistic: currentIncome + (monthlyAverages.highest * 1.2 * remainingMonths)
        };

        return {
            scenarios: scenarios,
            recommendedScenario: 'realistic',
            riskAssessment: this.assessScenarioRisks(scenarios),
            monthlyTarget: this.calculateOptimalMonthlyTarget(currentIncome, remainingMonths)
        };
    }

    /**
     * 月次平均収入計算
     */
    calculateMonthlyAverages(shifts) {
        const monthlyTotals = {};
        
        shifts.forEach(shift => {
            const monthKey = shift.date.substring(0, 7); // YYYY-MM
            if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = 0;
            monthlyTotals[monthKey] += shift.earnings;
        });

        const amounts = Object.values(monthlyTotals);
        
        return {
            recent: amounts.length > 0 ? amounts[amounts.length - 1] : 0,
            average: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0,
            highest: amounts.length > 0 ? Math.max(...amounts) : 0,
            lowest: amounts.length > 0 ? Math.min(...amounts) : 0
        };
    }

    /**
     * トレンド倍率計算
     */
    calculateTrendMultiplier(monthlyAverages) {
        if (monthlyAverages.recent > monthlyAverages.average * 1.2) return 1.1; // 上昇トレンド
        if (monthlyAverages.recent < monthlyAverages.average * 0.8) return 0.9; // 下降トレンド
        return 1.0; // 安定
    }

    /**
     * シナリオリスク評価
     */
    assessScenarioRisks(scenarios) {
        const risks = {};
        
        Object.keys(scenarios).forEach(scenario => {
            const amount = scenarios[scenario];
            const progress = amount / this.limits.dependent;
            
            if (progress >= 1.0) risks[scenario] = 'critical';
            else if (progress >= this.limits.danger) risks[scenario] = 'high';
            else if (progress >= this.limits.warning) risks[scenario] = 'medium';
            else risks[scenario] = 'low';
        });

        return risks;
    }

    /**
     * 最適月次目標計算
     */
    calculateOptimalMonthlyTarget(currentIncome, remainingMonths) {
        if (remainingMonths <= 0) return 0;
        
        const safeLimit = this.limits.dependent * this.limits.warning; // 90%まで
        const remaining = Math.max(0, safeLimit - currentIncome);
        
        return Math.floor(remaining / remainingMonths);
    }

    /**
     * 最適化提案生成
     */
    generateOptimizationSuggestions(currentIncome, shifts, workplaces) {
        const suggestions = [];
        const status = this.getCurrentStatus(currentIncome);
        const prediction = this.predictYearEnd(currentIncome, shifts);

        // 収入調整提案
        if (status.riskLevel === 'warning' || status.riskLevel === 'danger') {
            suggestions.push({
                type: 'income_reduction',
                priority: 'high',
                title: '収入調整が必要です',
                description: `扶養限度額まであと¥${status.dependentRemaining.toLocaleString()}です。労働時間の調整を検討してください。`,
                actions: this.generateIncomeReductionActions(currentIncome, shifts, workplaces)
            });
        }

        // 労働時間最適化
        const timeOptimization = this.optimizeWorkingHours(shifts, workplaces, status.dependentRemaining);
        if (timeOptimization.suggestions.length > 0) {
            suggestions.push({
                type: 'time_optimization',
                priority: 'medium',
                title: '労働時間最適化',
                description: '効率的な働き方で収入を最大化できます',
                actions: timeOptimization.suggestions
            });
        }

        // 勤務先バランス最適化
        if (workplaces.length > 1) {
            const balanceOptimization = this.optimizeWorkplaceBalance(shifts, workplaces, status.dependentRemaining);
            suggestions.push({
                type: 'workplace_balance',
                priority: 'low',
                title: '勤務先バランス最適化',
                description: '時給の高い勤務先での労働時間を増やすことを検討してください',
                actions: balanceOptimization.suggestions
            });
        }

        return suggestions;
    }

    /**
     * 収入削減アクション生成
     */
    generateIncomeReductionActions(currentIncome, shifts, workplaces) {
        const actions = [];
        const excessAmount = currentIncome - (this.limits.dependent * this.limits.warning);
        
        if (excessAmount > 0) {
            // 最も時給の低い勤務先から削減
            const sortedWorkplaces = workplaces.sort((a, b) => a.hourlyWage - b.hourlyWage);
            const lowestPayingWorkplace = sortedWorkplaces[0];
            
            const hoursToReduce = Math.ceil(excessAmount / lowestPayingWorkplace.hourlyWage);
            
            actions.push({
                type: 'reduce_hours',
                workplace: lowestPayingWorkplace.name,
                hoursReduction: hoursToReduce,
                description: `${lowestPayingWorkplace.name}での労働時間を月${hoursToReduce}時間削減`
            });
        }

        return actions;
    }

    /**
     * 労働時間最適化
     */
    optimizeWorkingHours(shifts, workplaces, remainingBudget) {
        const suggestions = [];
        
        // 時給効率の分析
        const workplaceEfficiency = workplaces.map(workplace => {
            const workplaceShifts = shifts.filter(s => s.workplaceId === workplace.id);
            const totalHours = workplaceShifts.reduce((sum, shift) => sum + shift.hours, 0);
            const totalEarnings = workplaceShifts.reduce((sum, shift) => sum + shift.earnings, 0);
            
            return {
                workplace: workplace,
                totalHours: totalHours,
                totalEarnings: totalEarnings,
                efficiency: workplace.hourlyWage,
                utilizationRate: totalHours / (workplaceShifts.length * 8) // 8時間を標準とした場合
            };
        }).sort((a, b) => b.efficiency - a.efficiency);

        // 高時給勤務先での時間増加提案
        if (workplaceEfficiency.length > 1) {
            const highestPayingWorkplace = workplaceEfficiency[0];
            const lowestPayingWorkplace = workplaceEfficiency[workplaceEfficiency.length - 1];
            
            if (highestPayingWorkplace.efficiency > lowestPayingWorkplace.efficiency * 1.2) {
                suggestions.push({
                    type: 'shift_hours',
                    from: lowestPayingWorkplace.workplace.name,
                    to: highestPayingWorkplace.workplace.name,
                    description: `${lowestPayingWorkplace.workplace.name}から${highestPayingWorkplace.workplace.name}への時間シフトで収入効率向上`,
                    potentialIncrease: (highestPayingWorkplace.efficiency - lowestPayingWorkplace.efficiency) * 10 // 10時間想定
                });
            }
        }

        return { suggestions };
    }

    /**
     * 勤務先バランス最適化
     */
    optimizeWorkplaceBalance(shifts, workplaces, remainingBudget) {
        const suggestions = [];
        
        // 各勤務先の収益性分析
        const workplaceAnalysis = workplaces.map(workplace => {
            const workplaceShifts = shifts.filter(s => s.workplaceId === workplace.id);
            const monthlyHours = workplaceShifts.reduce((sum, shift) => sum + shift.hours, 0) / 12;
            const monthlyEarnings = workplaceShifts.reduce((sum, shift) => sum + shift.earnings, 0) / 12;
            
            return {
                workplace: workplace,
                monthlyHours: monthlyHours,
                monthlyEarnings: monthlyEarnings,
                efficiency: workplace.hourlyWage,
                contribution: monthlyEarnings
            };
        });

        // 最適配分の計算
        const totalBudget = remainingBudget / 3; // 3ヶ月想定
        const optimalAllocation = this.calculateOptimalAllocation(workplaceAnalysis, totalBudget);
        
        if (optimalAllocation.improvements.length > 0) {
            suggestions.push(...optimalAllocation.improvements);
        }

        return { suggestions };
    }

    /**
     * 最適配分計算
     */
    calculateOptimalAllocation(workplaceAnalysis, budget) {
        const improvements = [];
        
        // 時給順にソート
        const sortedWorkplaces = workplaceAnalysis.sort((a, b) => b.efficiency - a.efficiency);
        
        for (let i = 0; i < sortedWorkplaces.length - 1; i++) {
            const current = sortedWorkplaces[i];
            const next = sortedWorkplaces[i + 1];
            
            if (current.efficiency > next.efficiency * 1.15) { // 15%以上の差がある場合
                const potentialShift = Math.min(next.monthlyHours * 0.3, budget / next.efficiency); // 30%まで移動可能
                const incomeIncrease = potentialShift * (current.efficiency - next.efficiency);
                
                improvements.push({
                    type: 'rebalance_hours',
                    from: next.workplace.name,
                    to: current.workplace.name,
                    hours: Math.round(potentialShift),
                    incomeIncrease: Math.round(incomeIncrease),
                    description: `${next.workplace.name}から${current.workplace.name}に月${Math.round(potentialShift)}時間移動で¥${Math.round(incomeIncrease)}の収入増加`
                });
            }
        }

        return { improvements };
    }

    /**
     * アラート生成
     */
    generateAlerts(currentIncome, shifts) {
        const alerts = [];
        const status = this.getCurrentStatus(currentIncome);
        
        // 扶養限度額アラート
        if (status.riskLevel === 'danger') {
            alerts.push({
                type: 'critical',
                title: '扶養限度額超過の危険',
                message: `現在の収入が扶養限度額の${Math.round(status.dependentProgress * 100)}%に達しています。早急な対策が必要です。`,
                actions: ['労働時間削減', '年末調整準備']
            });
        } else if (status.riskLevel === 'warning') {
            alerts.push({
                type: 'warning',
                title: '扶養限度額に接近中',
                message: `現在の収入が扶養限度額の${Math.round(status.dependentProgress * 100)}%に達しています。注意が必要です。`,
                actions: ['収入ペース調整', '月次予算見直し']
            });
        }

        // 社会保険料免除アラート
        if (status.socialInsuranceProgress > 0.9) {
            alerts.push({
                type: 'info',
                title: '社会保険料免除限度額に接近',
                message: `社会保険料免除の限度額¥${this.limits.socialInsurance.toLocaleString()}に接近しています。`,
                actions: ['社会保険適用確認']
            });
        }

        // 月次収入異常アラート
        const monthlyAlerts = this.checkMonthlyAnomalies(shifts);
        alerts.push(...monthlyAlerts);

        return alerts;
    }

    /**
     * 月次異常チェック
     */
    checkMonthlyAnomalies(shifts) {
        const alerts = [];
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const currentMonthShifts = shifts.filter(shift => shift.date.startsWith(currentMonthKey));
        const currentMonthEarnings = currentMonthShifts.reduce((sum, shift) => sum + shift.earnings, 0);
        
        // 月収が異常に高い場合
        if (currentMonthEarnings > this.limits.dependent / 12 * 1.5) {
            alerts.push({
                type: 'warning',
                title: '今月の収入が高額です',
                message: `今月の収入¥${currentMonthEarnings.toLocaleString()}が月平均を大幅に上回っています。`,
                actions: ['来月以降の調整検討']
            });
        }

        // 連続勤務警告
        const consecutiveWorkDays = this.checkConsecutiveWorkDays(currentMonthShifts);
        if (consecutiveWorkDays > 6) {
            alerts.push({
                type: 'info',
                title: '連続勤務に注意',
                message: `${consecutiveWorkDays}日連続で勤務しています。体調管理にご注意ください。`,
                actions: ['休養日確保']
            });
        }

        return alerts;
    }

    /**
     * 連続勤務日数チェック
     */
    checkConsecutiveWorkDays(shifts) {
        if (shifts.length === 0) return 0;
        
        const workDays = shifts.map(shift => shift.date).sort();
        let maxConsecutive = 1;
        let currentConsecutive = 1;
        
        for (let i = 1; i < workDays.length; i++) {
            const prevDate = new Date(workDays[i - 1]);
            const currentDate = new Date(workDays[i]);
            const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                currentConsecutive++;
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
                currentConsecutive = 1;
            }
        }
        
        return maxConsecutive;
    }

    /**
     * 詳細レポート生成
     */
    generateDetailedReport(currentIncome, shifts, workplaces) {
        const analysis = this.analyzeRisk(currentIncome, shifts, workplaces);
        
        return {
            summary: {
                totalIncome: currentIncome,
                remainingBudget: analysis.current.dependentRemaining,
                riskLevel: analysis.current.riskLevel,
                yearEndPrediction: analysis.prediction.scenarios.realistic
            },
            recommendations: analysis.optimization,
            alerts: analysis.alerts,
            detailedBreakdown: this.generateBreakdown(shifts, workplaces),
            actionPlan: this.generateActionPlan(analysis)
        };
    }

    /**
     * 詳細内訳生成
     */
    generateBreakdown(shifts, workplaces) {
        const breakdown = {
            byWorkplace: {},
            byMonth: {},
            efficiency: {}
        };

        // 勤務先別集計
        workplaces.forEach(workplace => {
            const workplaceShifts = shifts.filter(s => s.workplaceId === workplace.id);
            breakdown.byWorkplace[workplace.name] = {
                totalShifts: workplaceShifts.length,
                totalHours: workplaceShifts.reduce((sum, s) => sum + s.hours, 0),
                totalEarnings: workplaceShifts.reduce((sum, s) => sum + s.earnings, 0),
                averageShiftLength: workplaceShifts.length > 0 ? 
                    workplaceShifts.reduce((sum, s) => sum + s.hours, 0) / workplaceShifts.length : 0
            };
        });

        // 月別集計
        shifts.forEach(shift => {
            const monthKey = shift.date.substring(0, 7);
            if (!breakdown.byMonth[monthKey]) {
                breakdown.byMonth[monthKey] = { earnings: 0, hours: 0, shifts: 0 };
            }
            breakdown.byMonth[monthKey].earnings += shift.earnings;
            breakdown.byMonth[monthKey].hours += shift.hours;
            breakdown.byMonth[monthKey].shifts += 1;
        });

        return breakdown;
    }

    /**
     * アクションプラン生成
     */
    generateActionPlan(analysis) {
        const actionPlan = {
            immediate: [],
            shortTerm: [],
            longTerm: []
        };

        // 即座に実行すべきアクション
        if (analysis.current.riskLevel === 'danger') {
            actionPlan.immediate.push('労働時間の即時削減');
            actionPlan.immediate.push('高時給勤務先でのシフト削減優先');
        }

        // 短期アクション（1-3ヶ月）
        if (analysis.prediction.riskAssessment.realistic === 'high') {
            actionPlan.shortTerm.push('月次収入上限設定');
            actionPlan.shortTerm.push('勤務先別時間配分見直し');
        }

        // 長期アクション（3ヶ月以上）
        actionPlan.longTerm.push('来年度収入計画策定');
        actionPlan.longTerm.push('勤務先選択最適化');

        return actionPlan;
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FuyouOptimizationEngine;
}

if (typeof window !== 'undefined') {
    window.FuyouOptimizationEngine = FuyouOptimizationEngine;
}