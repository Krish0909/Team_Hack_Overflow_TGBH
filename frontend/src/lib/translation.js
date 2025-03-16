const SARVAM_API_URL = 'https://api.sarvam.ai/translate';

export const translateText = async (text, targetLanguage, sourceLanguage = 'en-IN') => {
  try {
    if (!text || text.trim() === '') return text;
    
    const response = await fetch(SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': "9ede12ba-df25-4f8c-8429-eac58a72fc8f"
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sourceLanguage,
        target_language_code: targetLanguage,
        mode: 'formal',
        enable_preprocessing: true,
        output_script: 'fully-native',
        numerals_format: 'international'
      })
    });

    if (!response.ok) throw new Error('Translation failed');
    const data = await response.json();
    return data.translated_text || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

// Add batch translation support
export const translateBatch = async (items, targetLanguage, sourceLanguage = 'en-IN') => {
  try {
    const promises = items.map(async item => {
      if (typeof item === 'string') {
        return translateText(item, targetLanguage, sourceLanguage);
      }
      
      // Handle objects recursively
      const translatedItem = { ...item };
      for (const key in item) {
        if (typeof item[key] === 'string') {
          translatedItem[key] = await translateText(item[key], targetLanguage, sourceLanguage);
        }
      }
      return translatedItem;
    });
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Batch translation error:', error);
    return items;
  }
};
