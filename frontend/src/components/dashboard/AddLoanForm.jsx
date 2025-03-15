'use client';
import { useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/languageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, IndianRupee } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const loanTypes = [
  'Personal Loan',
  'Home Loan',
  'Car Loan',
  'Education Loan',
  'Business Loan',
  'Gold Loan'
];

export default function AddLoanForm({ open, onOpenChange, onSuccess }) {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    loan_type: '',
    loan_amount: '',
    interest_rate: '',
    tenure_months: '',
    start_date: new Date(),
    payment_date: '1',
    lender_name: '',
    loan_account_number: '',
    loan_purpose: '',
    amount_paid: '0', // Add this field
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const r = (parseFloat(formData.interest_rate) / 12) / 100;
      const n = parseInt(formData.tenure_months);
      const p = parseFloat(formData.loan_amount);
      const amountPaid = parseFloat(formData.amount_paid) || 0;
      
      const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      const end_date = new Date(formData.start_date);
      end_date.setMonth(end_date.getMonth() + n);

      const { data, error } = await supabase.from('loans').insert({
        clerk_id: user.id,
        ...formData,
        emi_amount: emi,
        end_date,
        remaining_amount: p - amountPaid,
        amount_paid: amountPaid,
        loan_status: amountPaid >= p ? 'completed' : 'active'
      }).select();

      if (error) throw error;

      // If amount was paid, create a payment record
      if (amountPaid > 0) {
        const { error: paymentError } = await supabase.from('loan_payments').insert({
          loan_id: data[0].id,
          payment_amount: amountPaid,
          payment_date: formData.start_date,
          payment_status: 'completed',
          payment_mode: 'initial',
          transaction_reference: 'Initial amount paid'
        });

        if (paymentError) throw paymentError;
      }

      toast.success("Loan added successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding loan:', error);
      toast.error("Failed to add loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEMI = () => {
    const p = parseFloat(formData.loan_amount) || 0;
    const r = (parseFloat(formData.interest_rate) || 0) / 12 / 100;
    const n = parseInt(formData.tenure_months) || 0;
    
    if (p && r && n) {
      const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      return emi.toFixed(2);
    }
    return '0';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('dashboard.addNewLoan')}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full pr-4 -mr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Loan Type</Label>
                <Select
                  value={formData.loan_type}
                  onValueChange={(value) => setFormData({...formData, loan_type: value})}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select your loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Loan Amount (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter loan amount"
                      className="pl-9"
                      value={formData.loan_amount}
                      onChange={(e) => setFormData({...formData, loan_amount: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter annual interest rate"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Loan Tenure (Months)</Label>
                  <Input
                    type="number"
                    placeholder="Enter tenure in months"
                    value={formData.tenure_months}
                    onChange={(e) => setFormData({...formData, tenure_months: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label>EMI Date</Label>
                  <Select
                    value={formData.payment_date}
                    onValueChange={(value) => setFormData({...formData, payment_date: value})}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select EMI date" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 28}, (_, i) => i + 1).map(date => (
                        <SelectItem key={date} value={date.toString()}>
                          {date}th of every month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Lender Name</Label>
                  <Input
                    placeholder="Enter bank or lender name"
                    value={formData.lender_name}
                    onChange={(e) => setFormData({...formData, lender_name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label>Loan Account Number</Label>
                  <Input
                    placeholder="Enter loan account number"
                    value={formData.loan_account_number}
                    onChange={(e) => setFormData({...formData, loan_account_number: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Loan Purpose</Label>
                <Input
                  placeholder="Brief description of loan purpose"
                  value={formData.loan_purpose}
                  onChange={(e) => setFormData({...formData, loan_purpose: e.target.value})}
                />
              </div>

              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1.5 justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({...formData, start_date: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Add this field before the EMI preview card */}
              <div className="space-y-2">
                <Label>Amount Already Paid</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter amount already paid"
                    className="pl-9"
                    value={formData.amount_paid}
                    onChange={(e) => {
                      const value = e.target.value;
                      const loanAmount = parseFloat(formData.loan_amount) || 0;
                      if (parseFloat(value) > loanAmount) {
                        toast.error("Amount paid cannot exceed loan amount");
                        return;
                      }
                      setFormData({...formData, amount_paid: value})
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter any amount you've already paid towards this loan
                </p>
              </div>

              {/* EMI Preview Card - Update to show amount paid */}
              {formData.loan_amount && formData.interest_rate && formData.tenure_months && (
                <Card className="bg-muted">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Estimated Monthly EMI</p>
                        <p className="text-3xl font-bold text-primary mt-1">
                          ₹{parseInt(calculateEMI()).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Remaining Amount</p>
                        <p className="text-3xl font-bold text-primary mt-1">
                          ₹{(parseFloat(formData.loan_amount) - parseFloat(formData.amount_paid || 0)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </form>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button type="submit" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Adding...' : 'Add Loan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
