'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@clerk/nextjs";
import { supabase } from '@/lib/supabase';

const languages = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'हिंदी' },
  { id: 'mr', name: 'मराठी' },
  { id: 'gu', name: 'ગુજરાતી' },
  { id: 'bn', name: 'বাংলা' }
];

const employmentTypes = [
  'Salaried',
  'Self-Employed',
  'Business Owner',
  'Freelancer',
  'Student',
  'Unemployed'
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    preferred_language: 'en',
    phone_number: '',
    full_name: user?.fullName || '',
    monthly_income: '0', // Set default value
    employment_type: '',
    credit_score: 0, // Set default value as number
    existing_loans: false,
    monthly_expenses: '0', // Add this field
  });

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkExistingProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('clerk_id')
          .eq('clerk_id', user.id)
          .single();

        if (profile) {
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingProfile();
  }, [user, isLoaded, router]);

  if (!isLoaded || isChecking) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.replace('/sign-in');
    return null;
  }

  const handleSubmit = async () => {
    if (!user) return;

    try {
      // Validate and transform data before sending
      const profileData = {
        clerk_id: user.id,
        full_name: formData.full_name,
        monthly_income: parseFloat(formData.monthly_income) || 0, // Convert to number
        employment_type: formData.employment_type,
        credit_score: parseInt(formData.credit_score) || 0, // Convert to integer
        existing_loans: Boolean(formData.existing_loans),
        monthly_expenses: parseFloat(formData.monthly_expenses) || 0 // Add this field
      };

      const preferencesData = {
        clerk_id: user.id,
        preferred_language: formData.preferred_language,
        phone_number: formData.phone_number
      };

      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert(preferencesData);

      if (prefsError) throw prefsError;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving user data:', error);
      // Add error handling UI here
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome to FinSaathi</h1>
          <p className="text-gray-500">Let's get to know you better</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Language</label>
              <Select
                value={formData.preferred_language}
                onValueChange={(value) => setFormData({...formData, preferred_language: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>Next</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Employment Type</label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({...formData, employment_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Employment Type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Income</label>
              <Input
                type="number"
                min="0"
                value={formData.monthly_income}
                onChange={(e) => setFormData({
                  ...formData,
                  monthly_income: e.target.value ? parseFloat(e.target.value) : 0
                })}
                placeholder="Enter your monthly income"
              />
            </div>

            {/* Add Monthly Expenses field */}
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Expenses</label>
              <Input
                type="number"
                min="0"
                value={formData.monthly_expenses}
                onChange={(e) => setFormData({
                  ...formData,
                  monthly_expenses: e.target.value ? parseFloat(e.target.value) : 0
                })}
                placeholder="Enter your monthly expenses"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Credit Score (optional)</label>
              <Input
                type="number"
                min="300"
                max="900"
                value={formData.credit_score}
                onChange={(e) => setFormData({
                  ...formData,
                  credit_score: e.target.value ? parseInt(e.target.value) : 0
                })}
                placeholder="Enter your credit score (300-900)"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="existing_loans"
                checked={formData.existing_loans}
                onChange={(e) => setFormData({
                  ...formData,
                  existing_loans: e.target.checked
                })}
                className="rounded border-gray-300 focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="existing_loans" className="text-sm font-medium">
                Do you have any existing loans?
              </label>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit}>Complete Setup</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
