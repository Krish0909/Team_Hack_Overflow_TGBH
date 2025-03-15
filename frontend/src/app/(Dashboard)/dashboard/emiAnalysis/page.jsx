"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/languageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Calculator,
    TrendingUp,
    BarChart2,
    IndianRupee,
    Sparkles,
    Target,
    Download,
    ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@clerk/nextjs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import remarkGfm from 'remark-gfm';

export default function EMIAnalysisPage() {
    const { userId } = useAuth();
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState({
        loan_amount: "",
        interest_rate: "",
        loan_term: "",
        monthly_salary: "",
        monthly_expenses: "",
        extra_payment: "0",
    });
    const [userLoans, setUserLoans] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState(null);

    useEffect(() => {
        const fetchUserLoans = async () => {
            const { data, error } = await supabase
                .from('loans')
                .select('*')
                .eq('clerk_id', userId);

            if (error) {
                toast.error("Failed to fetch loans");
                return;
            }

            setUserLoans(data);
        };

        if (userId) {
            fetchUserLoans();
        }
    }, [userId]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: userData, error } = await supabase
                    .from('user_profiles')
                    .select('monthly_income, monthly_expenses')
                    .eq('clerk_id', userId)
                    .single();

                if (error) throw error;

                if (userData) {
                    setFormData(prev => ({
                        ...prev,
                        monthly_salary: userData.monthly_income?.toString() || '',
                        monthly_expenses: userData.monthly_expenses?.toString() || ''
                    }));
                }
            } catch (error) {
                toast.error("Failed to fetch user data");
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    const calculateEMI = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                "http://localhost:5000/api/emi/calculate",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...formData,
                        language,
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to calculate EMI");

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

    const downloadPDF = () => {
        if (result?.pdf_report) {
            const byteCharacters = atob(result.pdf_report);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            saveAs(blob, "Loan_Analysis_Report.pdf");
        }
    };

    const handleLoanSelect = (value) => {
        const loan = userLoans.find(l => l.id === value);
        setSelectedLoan(loan);
        setFormData(prev => ({
            ...prev,
            loan_amount: loan.loan_amount.toString(),
            interest_rate: loan.interest_rate.toString(),
            loan_term: (loan.tenure_months / 12).toString(), // Convert months to years
        }));
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="relative overflow-hidden rounded-lg border bg-card p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Smart Loan Analysis
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Optimize your loan payments with AI-powered insights
                </p>
            </div>

            {userLoans.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Select Existing Loan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            onValueChange={handleLoanSelect}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose a loan to analyze" />
                            </SelectTrigger>
                            <SelectContent>
                                {userLoans.map((loan) => (
                                    <SelectItem key={loan.id} value={loan.id}>
                                        {loan.loan_type} - ₹{loan.loan_amount.toLocaleString('en-IN')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="insights" className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 p-1 bg-muted/20 backdrop-blur-sm">
                    <TabsTrigger value="insights" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Smart Insights
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        <PieChart className="h-4 w-4 mr-2" />
                        Visual Analysis
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        <Target className="h-4 w-4 mr-2" />
                        AI Recommendations
                    </TabsTrigger>
                </TabsList>

                {/* Replace old TabsContent with new styled versions */}
                <TabsContent value="insights">
                    <Card className="border-t-4 border-t-emerald-500">
                        <CardHeader>
                            <CardTitle>Smart Loan Calculator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Existing form with enhanced styling */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Loan Amount
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="Enter loan amount"
                                                className="pl-9"
                                                value={formData.loan_amount}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        loan_amount:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Interest Rate (%)
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter interest rate"
                                            value={formData.interest_rate}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    interest_rate:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Loan Term (Years)
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="Enter loan term in years"
                                            value={formData.loan_term}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    loan_term: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Monthly Salary
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="Enter monthly salary"
                                                className="pl-9"
                                                value={formData.monthly_salary}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        monthly_salary:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Monthly Expenses
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="Enter monthly expenses"
                                                className="pl-9"
                                                value={
                                                    formData.monthly_expenses
                                                }
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        monthly_expenses:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Extra Monthly Payment (Optional)
                                        </label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="Enter extra payment"
                                                className="pl-9"
                                                value={formData.extra_payment}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        extra_payment:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                    disabled={loading}
                                >
                                    {loading ? "Analyzing..." : "Analyze Loan"}
                                </Button>
                            </form>
                            
                            {/* Enhanced results display */}
                            {result && (
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Monthly EMI</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">
                                                ₹
                                                {result.emi.toLocaleString(
                                                    "en-IN",
                                                    { maximumFractionDigits: 0 }
                                                )}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Total Interest
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">
                                                ₹
                                                {result.total_interest.toLocaleString(
                                                    "en-IN",
                                                    { maximumFractionDigits: 0 }
                                                )}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Interest Saved
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₹
                                                {result.smart_payment_impact.Interest_Saved.toLocaleString(
                                                    "en-IN",
                                                    { maximumFractionDigits: 0 }
                                                )}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analysis">
                    {!result ? (
                        <Card className="border border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <PieChart className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                <h3 className="text-xl font-medium text-center mb-2">No Analysis Available Yet</h3>
                                <p className="text-muted-foreground text-center max-w-sm">
                                    Complete the loan analysis in the Smart Insights tab to view detailed visualizations and charts.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Loan Balance Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Loan Balance Over Time</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart 
                                                data={result.amortization_schedule.map((balance, month) => ({
                                                    month: month + 1,
                                                    balance: Math.max(0, balance),
                                                    balanceWithExtra: result.smart_payment_impact.amortization_with_extra?.[month] 
                                                        ? Math.max(0, result.smart_payment_impact.amortization_with_extra[month])
                                                        : null,
                                                }))}
                                                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis 
                                                    dataKey="month" 
                                                    label={{ 
                                                        value: "Months", 
                                                        position: "bottom",
                                                        offset: -10
                                                    }}
                                                    tickFormatter={(value) => `${value}`}
                                                />
                                                <YAxis 
                                                    label={{ 
                                                        value: "Balance (₹)", 
                                                        angle: -90, 
                                                        position: "insideLeft",
                                                        offset: -10
                                                    }}
                                                    tickFormatter={(value) => `₹${(value/100000).toFixed(1)}L`}
                                                />
                                                <Tooltip 
                                                    formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Balance"]}
                                                    labelFormatter={(label) => `Month ${label}`}
                                                />
                                                <Legend verticalAlign="top" height={36}/>
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="balance" 
                                                    stroke="#8884d8" 
                                                    name="Regular Payment"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="balanceWithExtra" 
                                                    stroke="#82ca9d" 
                                                    name="With Extra Payment"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Distribution Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Principal', value: result.loan_details.amount },
                                                        { name: 'Interest', value: result.total_interest }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                >
                                                    <Cell fill="#10B981" />
                                                    <Cell fill="#F59E0B" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Savings Comparison */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Interest Savings with Extra Payments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                {
                                                    name: 'Regular Payment',
                                                    amount: result.total_interest
                                                },
                                                {
                                                    name: 'With Extra Payment',
                                                    amount: result.smart_payment_impact.New_Interest
                                                }
                                            ]}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                                <Bar dataKey="amount" fill="#10B981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="recommendations">
                    {!result ? (
                        <Card className="border border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Target className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                <h3 className="text-xl font-medium text-center mb-2">No Recommendations Yet</h3>
                                <p className="text-muted-foreground text-center max-w-sm">
                                    Get personalized AI-powered recommendations after analyzing your loan details in the Smart Insights tab.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <Card className="lg:col-span-8">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        Smart Payment Analysis
                                        <Button onClick={downloadPDF} variant="outline" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Download Report
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Loan Overview</h4>
                                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                                <p>Amount: ₹{result.loan_details.amount.toLocaleString('en-IN')}</p>
                                                <p>Interest Rate: {result.loan_details.rate}%</p>
                                                <p>Term: {result.loan_details.term} years</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Payment Impact</h4>
                                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                                <p>Original Term: {result.smart_payment_impact.Original_Term} months</p>
                                                <p>New Term: {result.smart_payment_impact.New_Term} months</p>
                                                <p className="text-emerald-600 font-medium">
                                                    Saved: ₹{result.smart_payment_impact.Interest_Saved.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {/* Main content without think tag */}
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                table: ({node, ...props}) => (
                                                    <div className="w-full my-4 overflow-auto">
                                                        <table className="w-full border-collapse" {...props} />
                                                    </div>
                                                ),
                                                thead: ({node, ...props}) => (
                                                    <thead className="bg-muted" {...props} />
                                                ),
                                                th: ({node, ...props}) => (
                                                    <th className="border p-2 text-left font-medium" {...props} />
                                                ),
                                                td: ({node, ...props}) => (
                                                    <td className="border p-2" {...props} />
                                                ),
                                                img: ({node, ...props}) => (
                                                    <img className="w-full rounded-lg shadow-lg my-4 opacity-0 " {...props} />
                                                )
                                            }}
                                        >
                                            {result.report.split('<think>')[0]}
                                        </ReactMarkdown>

                                        {/* Collapsible reasoning section */}
                                        {result.report.includes('<think>') && (
                                            <Collapsible>
                                                <CollapsibleTrigger className="border flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                                                    <span className="text-lg font-semibold">AI Reasoning and Analysis</span>
                                                    <ChevronDown className="h-5 w-5" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="p-4 mt-2 border rounded-lg bg-muted/50">
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            table: ({node, ...props}) => (
                                                                <div className="w-full my-4 overflow-auto">
                                                                    <table className="w-full border-collapse" {...props} />
                                                                </div>
                                                            ),
                                                            thead: ({node, ...props}) => (
                                                                <thead className="bg-muted" {...props} />
                                                            ),
                                                            th: ({node, ...props}) => (
                                                                <th className="border p-2 text-left font-medium" {...props} />
                                                            ),
                                                            td: ({node, ...props}) => (
                                                                <td className="border p-2" {...props} />
                                                            )
                                                        }}
                                                    >
                                                        {result.report.split('<think>')[1]?.split('</think>')[0]}
                                                    </ReactMarkdown>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        )}

                                        {/* Content after think tag */}
                                        {result.report.split('</think>')[1] && (
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    table: ({node, ...props}) => (
                                                        <div className="w-full my-4 overflow-auto">
                                                            <table className="w-full border-collapse" {...props} />
                                                        </div>
                                                    ),
                                                    thead: ({node, ...props}) => (
                                                        <thead className="bg-muted" {...props} />
                                                    ),
                                                    th: ({node, ...props}) => (
                                                        <th className="border p-2 text-left font-medium" {...props} />
                                                    ),
                                                    td: ({node, ...props}) => (
                                                        <td className="border p-2" {...props} />
                                                    )
                                                }}
                                            >
                                                {result.report.split('</think>')[1]}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="lg:col-span-4 space-y-6">
                                {/* Best Available Loans Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <IndianRupee className="h-5 w-5 text-emerald-500" />
                                            Best Available Loans
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {result.loan_suggestions?.best_loans ? (
                                            <div className="space-y-4">
                                                {result.loan_suggestions.best_loans.map((loan, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-muted/50 p-4 rounded-lg border border-muted-foreground/20 hover:border-emerald-500/50 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <h4 className="font-medium">{loan.type}</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {loan.bank}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-semibold text-emerald-600">
                                                                    {loan.rate}%
                                                                </p>
                                                                {formData.interest_rate && (
                                                                    <p className={`text-xs ${
                                                                        loan.rate < parseFloat(formData.interest_rate)
                                                                            ? "text-emerald-600"
                                                                            : "text-amber-600"
                                                                    }`}>
                                                                        {loan.rate < parseFloat(formData.interest_rate)
                                                                            ? `${(parseFloat(formData.interest_rate) - loan.rate).toFixed(2)}% lower`
                                                                            : `${(loan.rate - parseFloat(formData.interest_rate)).toFixed(2)}% higher`
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {loan.monthly_savings > 0 && (
                                                            <div className="mt-2 p-2 bg-emerald-500/10 rounded text-sm">
                                                                <span className="text-emerald-600 font-medium">
                                                                    Potential monthly savings: ₹{loan.monthly_savings.toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <p className="text-xs text-muted-foreground text-center mt-4">
                                                    Based on analysis of {result.loan_suggestions.total_analyzed} loan products
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-muted-foreground text-sm">No loan suggestions available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Loan Statistics Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Loan Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">EMI to Income Ratio</span>
                                                <span className="font-medium">
                                                    {((result.emi / parseFloat(formData.monthly_salary)) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Interest to Principal Ratio</span>
                                                <span className="font-medium">
                                                    {((result.total_interest / result.loan_details.amount) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            {/* Additional statistics */}
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Total Cost of Loan</span>
                                                <span className="font-medium">
                                                    ₹{(result.loan_details.amount + result.total_interest).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Monthly Savings Potential</span>
                                                <span className="font-medium text-emerald-600">
                                                    ₹{(parseFloat(formData.monthly_salary) - parseFloat(formData.monthly_expenses) - result.emi).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
