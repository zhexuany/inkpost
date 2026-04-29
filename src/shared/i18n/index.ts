import { zh } from './zh';
import { en } from './en';

export type Lang = 'zh' | 'en';

const translations: Record<Lang, Record<string, string>> = { zh, en };

let currentLang: Lang = 'zh';

export function setLang(lang: Lang): void {
  currentLang = lang;
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let text = translations[currentLang]?.[key] ?? translations['zh']?.[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
