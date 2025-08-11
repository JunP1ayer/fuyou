export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface StrengthResult {
  score: StrengthLevel; // 0(弱) - 4(強)
  label: string;
  suggestions: string[];
}

export function evaluatePasswordStrength(password: string): StrengthResult {
  let score: StrengthLevel = 0;
  const suggestions: string[] = [];

  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  // Base scoring
  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if ([hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length >= 3) score += 1;
  if (hasUpper && hasNumber && hasSymbol && length >= 12) score += 1;

  // Suggestions
  if (length < 12) suggestions.push('12文字以上にすると安全性が高まります');
  if (!hasUpper) suggestions.push('大文字を含めてください');
  if (!hasNumber) suggestions.push('数字を含めてください');
  if (!hasSymbol) suggestions.push('記号（!@#$%など）を含めてください');

  const labels: Record<StrengthLevel, string> = {
    0: 'とても弱い',
    1: '弱い',
    2: '普通',
    3: '強い',
    4: 'とても強い',
  };

  return { score: Math.min(score, 4) as StrengthLevel, label: labels[score], suggestions };
}


