'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translateText } from './translation';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = {
  'en-IN': 'English',
  'hi-IN': 'हिंदी',
  'bn-IN': 'বাংলা',
  'gu-IN': 'ગુજરાતી',
  'kn-IN': 'ಕನ್ನಡ',
  'ml-IN': 'മലയാളം',
  'mr-IN': 'मराठी',
  'ta-IN': 'தமிழ்',
  'te-IN': 'తెలుగు',
  'pa-IN': 'ਪੰਜਾਬੀ'
};

export const LANGUAGE_CONTENT = {
  navigation: {
    'en-IN': {
      overview: 'Overview',
      loanAssistant: 'Loan Assistant',
      scanDocuments: 'Scan Documents',
      emiAnalysis: 'EMI Analysis',
      latestNews: 'Latest News',
      settings: 'Settings'
    },
    'hi-IN': {
      overview: 'अवलोकन',
      loanAssistant: 'ऋण सहायक',
      scanDocuments: 'दस्तावेज़ स्कैन करें',
      emiAnalysis: 'ईएमआई विश्लेषण',
      latestNews: 'ताज़ा खबरें',
      settings: 'सेटिंग्स'
    },
    // Add other languages...
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en-IN');
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (key, text) => {
    if (language === 'en-IN') return text;
    
    const cacheKey = `${language}:${key}`;
    if (translations[cacheKey]) return translations[cacheKey];

    try {
      setIsTranslating(true);
      const translated = await translateText(text, language);
      setTranslations(prev => ({
        ...prev,
        [cacheKey]: translated
      }));
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  const t = async (key) => {
    const text = typeof key === 'string' ? key : key.default;
    return language === 'en-IN' ? text : await translate(key, text);
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
    // Clear translations cache when language changes
    setTranslations({});
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: changeLanguage, 
      t, 
      translations,
      isTranslating 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
