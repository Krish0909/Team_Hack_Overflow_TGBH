'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { translations, defaultLanguage } from './translations';
import { supabase } from './supabase';

const LanguageContext = createContext();

export function LanguageProvider({ children, initialLanguage }) {
  const [language, setLanguage] = useState(initialLanguage || defaultLanguage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load language preference from localStorage first for instant display
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    setLoading(false);
  }, []);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || translations[defaultLanguage][keys[0]]?.[keys[1]] || key;
  };

  const updateLanguage = async (newLanguage, userId) => {
    try {
      // Update localStorage
      localStorage.setItem('preferred-language', newLanguage);
      
      // Update state
      setLanguage(newLanguage);
      
      // If user is logged in, update database
      if (userId) {
        await supabase
          .from('user_preferences')
          .upsert({ 
            clerk_id: userId, 
            preferred_language: newLanguage 
          });
      }

      // Reload the page to update all components
      window.location.reload();
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: updateLanguage, 
      t,
      isRTL: ['ar', 'he', 'fa'].includes(language) 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
