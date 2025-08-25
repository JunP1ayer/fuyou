// アプリ共通のカラーパレット（基準: 日付を押したときの色選択UI/シフトタブ）
export interface ColorOption {
  key: string;
  label: string;
  color: string;
}

export const APP_COLOR_PALETTE: ColorOption[] = [
  { key: 'yellow', label: 'イエロー', color: '#FFF3C4' },
  { key: 'orange', label: 'オレンジ', color: '#FFE0B2' },
  { key: 'red', label: 'レッド', color: '#FFCDD2' },
  { key: 'pink', label: 'ピンク', color: '#F8BBD9' },
  { key: 'purple', label: 'パープル', color: '#E1BEE7' },
  { key: 'blue', label: 'ブルー', color: '#BBDEFB' },
  { key: 'cyan', label: 'シアン', color: '#B3E5FC' },
  { key: 'green', label: 'グリーン', color: '#C8E6C9' },
];

// デフォルト色（パレット先頭）
export const DEFAULT_APP_COLOR = APP_COLOR_PALETTE[0].color;


