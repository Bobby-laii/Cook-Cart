import { translations } from "./translations";

export type TranslationKey = keyof typeof translations.en;

const t = (key: TranslationKey): string => translations.en[key] || String(key);

/** UI strings. Bon Taste is English only, so this is a plain lookup, not a context. */
export function useLanguage() {
  return { t };
}
