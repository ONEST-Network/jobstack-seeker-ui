import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'ml' | 'pa';

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string, params?: Record<string, any>) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // Initialize with saved language or default to 'en'
  const getInitialLanguage = (): SupportedLanguage => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred-language') as SupportedLanguage;
      if (savedLanguage && ['en', 'hi', 'kn', 'bn', 'te', 'mr', 'ta', 'gu', 'ml', 'pa'].includes(savedLanguage)) {
        return savedLanguage;
      }
    }
    return 'en';
  };

  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/locales/${language}/common.json`);
        if (response.ok) {
          const commonTranslations = await response.json();
          
          // Load other translation files
          const translationFiles = [
            'auth', 'hero', 'pages', 'candidates', 'applications', 
            'jobs', 'profile', 'postJob', 'jobApplication', 'score', 
            'settings', 'footer', 'header', 'admin', 'dashboard', 
            'employers', 'help', 'map', 'notifications', 'organizations'
          ];
          
          const allTranslations: Record<string, any> = { ...commonTranslations };
          
          for (const file of translationFiles) {
            try {
              const fileResponse = await fetch(`/locales/${language}/${file}.json`);
              if (fileResponse.ok) {
                const fileTranslations = await fileResponse.json();
                allTranslations[file] = fileTranslations[file];
              }
            } catch (error) {
              console.warn(`Failed to load ${file}.json for ${language}:`, error);
            }
          }
          
          setTranslations(allTranslations);
        } else {
          console.warn(`Failed to load translations for ${language}`);
          // Fallback to English if current language fails
          if (language !== 'en') {
            const fallbackResponse = await fetch('/locales/en/common.json');
            if (fallbackResponse.ok) {
              const fallbackTranslations = await fallbackResponse.json();
              setTranslations(fallbackTranslations);
            }
          }
        }
      } catch (error) {
        console.error('Error loading translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string, fallback?: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    
    if (typeof value !== 'string') {
      return fallback || key;
    }
    
    // Handle interpolation if params are provided
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    
    return value;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Helper hook for specific translation namespaces
export const useTranslation = (namespace: string) => {
  const { t } = useI18n();
  
  return (key: string, fallback?: string, params?: Record<string, any>) => {
    return t(`${namespace}.${key}`, fallback, params);
  };
};
