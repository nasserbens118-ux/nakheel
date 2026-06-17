import React, { createContext, useContext, useState, useEffect } from 'react';
import fr from '../services/i18n/fr.json';
import ar from '../services/i18n/ar.json';

export type Language = 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const stored = localStorage.getItem('nakheel_lang');
    if (stored === 'ar' || stored === 'fr') {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nakheel_lang', lang);
  };

  useEffect(() => {
    // Dynamic RTL/LTR layout adjustment
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const dict = language === 'ar' ? ar : fr;
    const fallbackDict = fr;

    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    let val = getNestedValue(dict, key) || getNestedValue(fallbackDict, key);
    if (!val) return key;

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        val = val.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
