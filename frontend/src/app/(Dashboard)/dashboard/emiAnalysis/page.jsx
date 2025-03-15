'use client';
import { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/languageContext';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calculator, TrendingUp, BarChart2, IndianRupee } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns'; // Add this import

export default function EMIAnalysisPage() {
  const { user } = useUser();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userLoans, setUserLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [formData, setFormData] = useState({
    loan_amount: '',
    interest_rate: '',
    tenure_months: '',
    monthly_salary: '',
    monthly_expenses: '',
    extra_payment: '0'
  });
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserLoans();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserLoans = async () => {
    try {
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          *,
          loan_payments(*)
        `)
        .eq('clerk_id', user.id)
        .eq('loan_status', 'active');

      if (error) throw error;

      const loansWithPaymentInfo = loans.map(loan => {
        const totalPaid = loan.loan_payments.reduce((sum, payment) => sum + Number(payment.payment_amount), 0);
        const remainingAmount = Number(loan.loan_amount) - totalPaid;
        const completedPayments = loan.loan_payments.length;
        const remainingPayments = loan.tenure_months - completedPayments;

        return {
          ...loan,
          totalPaid,
          remainingAmount,
          completedPayments,
          remainingPayments
        };
      });

      setUserLoans(loansWithPaymentInfo);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      if (error) throw error;

      setUserProfile(data);
      setFormData(prev => ({
        ...prev,
        monthly_salary: data.monthly_income || '',
        monthly_expenses: data.monthly_expenses || ''
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLoanSelect = (loan) => {
    setSelectedLoan(loan);
    setFormData({
      loan_amount: loan.loan_amount,
      interest_rate: loan.interest_rate,
      tenure_months: loan.tenure_months,
      monthly_salary: userProfile?.monthly_income || '',
      monthly_expenses: userProfile?.monthly_expenses || '',
      extra_payment: '0'
    });
  };

  const calculateEMI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/emi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          language
        })
      });

      if (!response.ok) throw new Error('Failed to calculate EMI');
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateEMI();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">EMI Analysis</h1>
      
      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart2 className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <TrendingUp className="h-4 w-4 mr-2" />
            Smart Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Loan EMI Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Loan Selection */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Select Active Loan</label>
                <Select
                  value={selectedLoan?.id || "new"}
                  onValueChange={(value) => {
                    if (value === "new") {
                      setSelectedLoan(null);
                      setFormData({
                        loan_amount: '',
                        interest_rate: '',
                        tenure_months: '',
                        monthly_salary: '',
                        monthly_expenses: '',
                        extra_payment: '0'
                      });
                    } else {
                      const loan = userLoans.find(l => l.id === value);
                      if (loan) handleLoanSelect(loan);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loan to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Loan Calculation</SelectItem>
                    {userLoans.map(loan => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.loan_type} - {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(loan.loan_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedLoan && (
                  <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-medium">{formatCurrency(selectedLoan.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Amount</p>
                      <p className="text-lg font-medium">{formatCurrency(selectedLoan.remainingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">EMIs Paid</p>
                      <p className="text-lg font-medium">{selectedLoan.completedPayments} of {selectedLoan.tenure_months}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining EMIs</p>
                      <p className="text-lg font-medium">{selectedLoan.remainingPayments}</p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Loan Amount</label>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interest Rate (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter interest rate"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Loan Term (Months)</label>
                    <Input
                      type="number"
                      placeholder="Enter loan tenure in months"
                      value={formData.tenure_months}
                      onChange={(e) => setFormData({...formData, tenure_months: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Salary</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Enter monthly salary"
                        className="pl-9"
                        value={formData.monthly_salary}
                        onChange={(e) => setFormData({...formData, monthly_salary: e.target.value})}
                        required
                      />
                    </div>
                    {userProfile?.monthly_income && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pre-filled from your profile
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Expenses</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Enter monthly expenses"
                        className="pl-9"
                        value={formData.monthly_expenses}
                        onChange={(e) => setFormData({...formData, monthly_expenses: e.target.value})}
                        required
                      />
                    </div>
                    {userProfile?.monthly_expenses && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pre-filled from your profile
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Extra Monthly Payment (Optional)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Enter extra payment"
                        className="pl-9"
                        value={formData.extra_payment}
                        onChange={(e) => setFormData({...formData, extra_payment: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Calculate EMI Stats Preview */}
                {formData.loan_amount && formData.monthly_salary && (
                  <Card className="mt-4 p-4 bg-muted">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Loan Amount</p>
                        <p className="text-lg font-medium">{formatCurrency(formData.loan_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Income</p>
                        <p className="text-lg font-medium">{formatCurrency(formData.monthly_salary)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                        <p className="text-lg font-medium">{formatCurrency(formData.monthly_expenses)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Available for EMI</p>
                        <p className="text-lg font-medium">
                          {formatCurrency(formData.monthly_salary - formData.monthly_expenses)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Calculating...' : 'Calculate EMI'}
                </Button>
              </form>

              {result && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly EMI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">₹{result.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Total Interest</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">₹{result.total_interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Interest Saved</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{result.smart_payment_impact.Interest_Saved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          {result && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Balance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.amortization_schedule.map((balance, month) => ({
                        month: month + 1,
                        balance,
                        balanceWithExtra: result.smart_payment_impact.amortization_with_extra?.[month] || null
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Months', position: 'bottom' }} />
                        <YAxis label={{ value: 'Balance (₹)', angle: -90, position: 'left' }} />
                        <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#8884d8" 
                          name="Regular Payment"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balanceWithExtra" 
                          stroke="#82ca9d" 
                          name="With Extra Payment"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Payment History Chart */}
              {selectedLoan && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedLoan.loan_payments.map((payment, index) => ({
                          month: format(new Date(payment.payment_date), 'MMM yyyy'),
                          amount: payment.payment_amount
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={formatCurrency} />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Bar dataKey="amount" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Smart Payment Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <ReactMarkdown>{result.report}</ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
