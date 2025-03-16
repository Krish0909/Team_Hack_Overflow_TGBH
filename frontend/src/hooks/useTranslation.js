import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { translateText } from '@/lib/translation';

export function useTranslation(text, options = {}) {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);
  const cacheKey = `${language}:${text}`;

  const translate = useCallback(async () => {
    if (language === 'en-IN' || !text) {
      setTranslated(text);
      return;
    }

    setLoading(true);
    try {
      const result = await translateText(text, language, options.source || 'en-IN');
      setTranslated(result);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslated(text);
    } finally {
      setLoading(false);
    }
  }, [text, language, options.source]);

  useEffect(() => {
    translate();
  }, [translate]);

  return {
    translated,
    loading,
    retranslate: translate
  };
}
