export type StudentStatus = 'none' | 'leave' | 'night' | 'graduate_soon';

export type Answers = {
  age: number;
  isStudent: boolean;
  studentStatus?: StudentStatus;     // 休学=不可、夜間/通信/在学/卒業継続=可
  salaryOnly: boolean;
  hasDependent: boolean;            // 家族の健保扶養に入っている/入る予定
  weeklyHours20Plus?: boolean;      // 106要件1
  monthsOver2?: boolean;            // 106要件2
  employer51Plus?: boolean;         // 106要件3（任意特定適用はtrue扱い）
  monthlyWageJPY?: number;          // 106要件4（>=88,000）
  studentException?: boolean;       // 休学/夜間等で「学生除外」が外れるならtrue
  prefecture?: string;              // 住民税の将来差対応
  manualLimit?: number | null;      // 手動優先
};

// 定数（2025）
export const INCOME_TAX_ZERO_CAP = 1_600_000;       // 所得税0の上限（目安）
export const RESIDENT_TAX_ZERO_CAP_STD = 1_100_000; // 住民税0（標準自治体）
export const RESIDENT_TAX_ZERO_CAP_STU = 1_340_000; // 学生で勤労学生控除OK
export const DEPENDENT_CAP = 1_300_000;             // 被扶養の年収上限
export const CAP_106 = 1_056_000;                   // 8.8万円×12か月（概算）

export function canClaimKinroGakusei(a: Answers): boolean {
  if (!a.isStudent) return false;
  // 休学は不可。夜間/通信/在学/卒業継続は可（自治体差は将来上書き）
  return a.studentStatus !== 'leave';
}

export function looksLike106Applies(a: Answers): boolean {
  // 学生は原則除外。ただし「学生除外が外れる」ケース（休学・夜間等）は適用され得る
  const studentExcluded = a.isStudent && a.studentStatus !== 'leave' && !a.studentException;
  if (studentExcluded) return false;

  const wage88k = (a.monthlyWageJPY ?? 0) >= 88_000; // 参考ライン
  return !!(a.weeklyHours20Plus && a.monthsOver2 && a.employer51Plus && wage88k);
}

export function taxAndInsuranceZeroCap(a: Answers): { capJPY: number | null; reasons: string[]; breakdown: {
  taxZeroCap: number;
  incomeTaxCap: number;
  residentTaxCap: number;
  insuranceCap: number | null;
  cap106Applied: boolean;
} } {
  const reasons: string[] = [];
  if (a.manualLimit != null) return { capJPY: a.manualLimit, reasons: ['manual override'], breakdown: {
    taxZeroCap: a.manualLimit,
    incomeTaxCap: INCOME_TAX_ZERO_CAP,
    residentTaxCap: canClaimKinroGakusei(a) ? RESIDENT_TAX_ZERO_CAP_STU : RESIDENT_TAX_ZERO_CAP_STD,
    insuranceCap: null,
    cap106Applied: false,
  } };
  if (!a.salaryOnly)   return { capJPY: null, reasons: ['給与のみ対象'], breakdown: {
    taxZeroCap: 0,
    incomeTaxCap: INCOME_TAX_ZERO_CAP,
    residentTaxCap: canClaimKinroGakusei(a) ? RESIDENT_TAX_ZERO_CAP_STU : RESIDENT_TAX_ZERO_CAP_STD,
    insuranceCap: null,
    cap106Applied: false,
  } };

  // 税金ゼロ上限
  const residentCap = canClaimKinroGakusei(a) ? RESIDENT_TAX_ZERO_CAP_STU : RESIDENT_TAX_ZERO_CAP_STD;
  const taxZeroCap = Math.min(INCOME_TAX_ZERO_CAP, residentCap);
  reasons.push(`税金0の上限は${taxZeroCap.toLocaleString()}円`);

  // 社会保険ゼロ上限
  if (!a.hasDependent) {
    // 扶養がない場合、被用者保険に入らなくても国保等の負担が発生するため「社保0」は基本不可
    reasons.push('扶養なし＝本人負担の医療保険が必要（社保0は不可）');
    return { capJPY: taxZeroCap, reasons, breakdown: {
      taxZeroCap,
      incomeTaxCap: INCOME_TAX_ZERO_CAP,
      residentTaxCap: residentCap,
      insuranceCap: null,
      cap106Applied: false,
    } };
  }

  const cap106Applied = looksLike106Applies(a);
  const cap106 = cap106Applied ? CAP_106 : Number.POSITIVE_INFINITY;
  const insuranceZeroCap = Math.min(DEPENDENT_CAP, cap106);
  reasons.push(`社保0の上限は${isFinite(insuranceZeroCap) ? insuranceZeroCap.toLocaleString()+'円' : '上限制約なし（106要件に非該当）'}`);

  // 税&社保0の最終上限
  const cap = Math.min(taxZeroCap, insuranceZeroCap);
  return { capJPY: isFinite(cap) ? cap : taxZeroCap, reasons, breakdown: {
    taxZeroCap,
    incomeTaxCap: INCOME_TAX_ZERO_CAP,
    residentTaxCap: residentCap,
    insuranceCap: isFinite(insuranceZeroCap) ? insuranceZeroCap : null,
    cap106Applied,
  } };
}


