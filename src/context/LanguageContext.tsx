"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { dictionary, Locale, Direction } from "@/lib/dictionaries";

type LanguageContextType = {
  language: Locale;
  direction: Direction;
  t: typeof dictionary.en;
  setLanguage: (lang: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Locale>('en');
  
  useEffect(() => {
    // Load language from localStorage if available
    const savedLang = localStorage.getItem('site_language') as Locale;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    localStorage.setItem('site_language', lang);
    
    // Update document direction and lang attribute
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  };

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const t = dictionary[language];

  // Sync document attributes on mount/change
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  return (
    <LanguageContext.Provider value={{ language, direction, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
