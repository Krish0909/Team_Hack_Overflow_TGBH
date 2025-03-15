"use client";
import { useState } from "react";
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
} from "recharts";
import { Calculator, TrendingUp, BarChart2, IndianRupee } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { saveAs } from "file-saver";

export default function EMIAnalysisPage() {
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
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            placeholder="Enter loan term"
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
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Calculating..."
                                        : "Calculate EMI"}
                                </Button>
                            </form>

                            {result && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* Analysis Tab */}
                <TabsContent value="analysis">
                    {result && (
                        <div className="grid grid-cols-1 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Loan Balance Over Time
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <LineChart
                                                data={result.amortization_schedule.map(
                                                    (balance, month) => ({
                                                        month: month + 1,
                                                        balance,
                                                        balanceWithExtra:
                                                            result
                                                                .smart_payment_impact
                                                                .amortization_with_extra?.[
                                                                month
                                                            ] || null,
                                                    })
                                                )}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="month"
                                                    label={{
                                                        value: "Months",
                                                        position: "bottom",
                                                    }}
                                                />
                                                <YAxis
                                                    label={{
                                                        value: "Balance (₹)",
                                                        angle: -90,
                                                        position: "left",
                                                    }}
                                                />
                                                <Tooltip
                                                    formatter={(value) =>
                                                        `₹${value.toLocaleString(
                                                            "en-IN"
                                                        )}`
                                                    }
                                                />
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

                            {/* Add more analysis components */}
                        </div>
                    )}
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations">
                    {result && (
                        <>
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        Smart Payment Recommendations
                                        <Button onClick={downloadPDF}>
                                            Download PDF Report
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="prose prose-sm max-w-none">
                                    <ReactMarkdown>
                                        {result.report}
                                    </ReactMarkdown>
                                </CardContent>
                            </Card>

                            {result.loan_suggestions && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Loan Suggestions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="prose prose-sm max-w-none">
                                        <ReactMarkdown>
                                            {result.loan_suggestions}
                                        </ReactMarkdown>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
