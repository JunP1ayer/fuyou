// アプリ共通のカラーパレット（基準: 日付を押したときの色選択UI/シフトタブ）
export interface ColorOption {
  key: string;
  label: string;
  color: string;
}

export const APP_COLOR_PALETTE: ColorOption[] = [
  { key: 'yellow', label: 'イエロー', color: '#FFD54F' },
  { key: 'orange', label: 'オレンジ', color: '#FFB74D' },
  { key: 'red', label: 'レッド', color: '#E57373' },
  { key: 'pink', label: 'ピンク', color: '#F06292' },
  { key: 'purple', label: 'パープル', color: '#BA68C8' },
  { key: 'blue', label: 'ブルー', color: '#64B5F6' },
  { key: 'cyan', label: 'シアン', color: '#4FC3F7' },
  { key: 'green', label: 'グリーン', color: '#81C784' },
];

// デフォルト色（パレット先頭）
export const DEFAULT_APP_COLOR = APP_COLOR_PALETTE[0].color;


