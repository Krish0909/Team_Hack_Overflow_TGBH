export const processChatResponse = (responseData) => {
  try {
    // Handle nested JSON strings
    const parsedData = typeof responseData === 'string' ? 
      JSON.parse(responseData) : responseData;

    // Clean up nested JSON if needed
    if (typeof parsedData.response === 'string' && 
        parsedData.response.includes('"action":')) {
      try {
        const nestedResponse = JSON.parse(parsedData.response);
        return {
          action: nestedResponse.action || 'stay',
          response: nestedResponse.response,
          suggestions: nestedResponse.suggestions || [],
          detected_language: nestedResponse.detected_language
        };
      } catch (e) {
        console.warn('Nested JSON parsing failed, using raw response');
      }
    }

    return {
      action: parsedData.action || 'stay',
      response: parsedData.response,
      suggestions: parsedData.suggestions || [],
      detected_language: parsedData.detected_language
    };
  } catch (error) {
    console.error('Error processing chat response:', error);
    return {
      action: 'stay',
      response: 'Sorry, I had trouble processing that response.',
      suggestions: [],
      detected_language: 'en-IN'
    };
  }
};
