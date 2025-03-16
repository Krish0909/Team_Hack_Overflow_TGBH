'use client';
import { Card } from "@/components/ui/card";
import { useLanguage } from '@/lib/languageContext';
import { translateText } from '@/lib/translation';
import { useState, useEffect } from 'react';

export default function StatsCard({ title, value, type = "number", icon: Icon }) {
  const { language } = useLanguage();
  const [translatedTitle, setTranslatedTitle] = useState(title);

  useEffect(() => {
    const translateTitle = async () => {
      if (language !== 'en-IN') {
        const translated = await translateText(title, language);
        setTranslatedTitle(translated);
      } else {
        setTranslatedTitle(title);
      }
    };

    translateTitle();
  }, [title, language]);

  const formattedValue = type === "currency" 
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    : value.toLocaleString('en-IN');

  return (
    <Card className="p-4 border-emerald-200/50 bg-gradient-to-br from-background via-background to-emerald-500/5">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
          <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{translatedTitle}</p>
          <p className="text-2xl font-semibold">{formattedValue}</p>
        </div>
      </div>
    </Card>
  );
}
