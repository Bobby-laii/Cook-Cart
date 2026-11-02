"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "./translations";

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => translations.en[key] || String(key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cookcart_lang") as Language;
    if (saved && (saved === "en" || saved === "zh-HK")) {
      setLanguageState(saved);
      document.documentElement.lang = saved === "zh-HK" ? "zh-HK" : "en";
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("cookcart_lang", lang);
      document.documentElement.lang = lang === "zh-HK" ? "zh-HK" : "en";
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
