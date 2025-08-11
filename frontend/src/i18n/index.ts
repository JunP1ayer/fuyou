import ja from '@/locales/ja.json';
import en from '@/locales/en.json';
import de from '@/locales/de.json';
import da from '@/locales/da.json';
import fi from '@/locales/fi.json';
import no from '@/locales/no.json';
import useI18nStore from '@/store/i18nStore';

type Dictionary = Record<string, string>;

const dictionaries: Record<string, Dictionary> = { ja, en, de, da, fi, no };

export function t(key: string, vars?: Record<string, string | number>): string {
  const { language } = useI18nStore.getState();
  const dict = dictionaries[language] || dictionaries.ja || {};
  let text = (dict[key] as string) || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}


