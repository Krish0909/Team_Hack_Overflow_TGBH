'use client';
import { createContext, useContext, useState } from 'react';
import { supabase } from './supabase';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState('en-IN');

    const setLanguage = async (newLanguage, userId) => {
        setLanguageState(newLanguage);
        if (userId) {
            try {
                await supabase
                    .from('user_preferences')
                    .upsert({ clerk_id: userId, preferred_language: newLanguage });
            } catch (error) {
                console.error('Error saving language preference:', error);
            }
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
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
