'use client'
import { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { useLanguage } from '@/lib/languageContext';
import { translateBatch } from '@/lib/translation';

export default function ProfilePage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const { language } = useLanguage();
  const [translations, setTranslations] = useState({});

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchUserData();
  }, [user]);

  useEffect(() => {
    const translateContent = async () => {
      const translated = await translateBatch([
        'Profile Settings',
        'Personal Information',
        'Financial Information',
        'Save Changes',
        'Loading...',
        'Profile updated successfully',
        'Failed to update profile'
      ], language);

      setTranslations({
        title: translated[0],
        personalInfo: translated[1],
        financialInfo: translated[2],
        saveButton: translated[3],
        loading: translated[4],
        successMsg: translated[5],
        errorMsg: translated[6]
      });
    };

    translateContent();
  }, [language]);

  const fetchUserData = async () => {
    try {
      const [prefsResponse, profileResponse] = await Promise.all([
        supabase.from('user_preferences').select('*').eq('clerk_id', user.id).single(),
        supabase.from('user_profiles').select('*').eq('clerk_id', user.id).single()
      ]);

      setUserData({
        ...prefsResponse.data,
        ...profileResponse.data
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await Promise.all([
        supabase.from('user_preferences').upsert({
          clerk_id: user.id,  // Changed from id to clerk_id
          preferred_language: formData.preferred_language,
          phone_number: formData.phone_number
        }),
        supabase.from('user_profiles').upsert({
          clerk_id: user.id,  // Changed from id to clerk_id
          full_name: formData.full_name,
          monthly_income: formData.monthly_income,
          employment_type: formData.employment_type,
          credit_score: formData.credit_score,
          existing_loans: formData.existing_loans
        })
      ]);

      toast.success(translations.successMsg);
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(translations.errorMsg);
    }
  };

  if (loading) {
    return <div>{translations.loading}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">{translations.title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{translations.personalInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add form fields for personal information */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translations.financialInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add form fields for financial information */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
