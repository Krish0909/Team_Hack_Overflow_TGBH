"use client";
import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import {
    Upload,
    FileSearch,
    AlertTriangle,
    Download,
    Bot
} from "lucide-react";

export default function LoanGuard() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [chat, setChat] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const fileInput = useRef(null);

    const handleUpload = async (file) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', 'en-IN');

        try {
            const response = await fetch('/api/loanguard/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setReport(data.data.report);
                setSuggestions(data.data.suggestions || []);
                toast.success("Document analysis complete");
            } else {
                toast.error('Failed to analyze document');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error analyzing document');
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async (message) => {
        try {
            const response = await fetch('/api/loanguard/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            if (data.success) {
                setChat([...chat, { message, response: data.data.response }]);
                setSuggestions(data.data.suggestions || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error sending message');
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-lg border bg-card p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Loan Document Analysis
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Protect yourself from predatory lending with AI-powered document analysis
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Upload Section */}
                <Card className="border-t-4 border-t-emerald-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSearch className="h-5 w-5" />
                            Document Upload & Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Card className="border border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-10">
                                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                                <Button
                                    onClick={() => fileInput.current?.click()}
                                    variant="outline"
                                    disabled={loading}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                                >
                                    Upload Document
                                </Button>
                                <input
                                    ref={fileInput}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => handleUpload(e.target.files[0])}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                    PDF, JPG, JPEG, PNG files supported
                                </p>
                            </CardContent>
                        </Card>

                        {loading && (
                            <div className="flex items-center justify-center py-6">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
                                    <span className="text-sm text-muted-foreground">
                                        Analyzing document...
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Analysis Results */}
                {report && (
                    <>
                        {/* Risk Score Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className={`${
                                report.severity === 'critical' ? 'border-red-500 bg-red-500/5' :
                                report.severity === 'high' ? 'border-orange-500 bg-orange-500/5' :
                                report.severity === 'medium' ? 'border-yellow-500 bg-yellow-500/5' :
                                'border-emerald-500 bg-emerald-500/5'
                            }`}>
                                <CardHeader>
                                    <CardTitle className="text-sm">Overall Risk Score</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className={`h-8 w-8 ${
                                            report.severity === 'critical' ? 'text-red-500' :
                                            report.severity === 'high' ? 'text-orange-500' :
                                            report.severity === 'medium' ? 'text-yellow-500' :
                                            'text-emerald-500'
                                        }`} />
                                        <div>
                                            <p className="text-2xl font-bold capitalize">{report.severity}</p>
                                            <p className="text-sm text-muted-foreground">Risk Level</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-500/50">
                                <CardHeader>
                                    <CardTitle className="text-sm">Document Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">Loan Agreement</p>
                                    <p className="text-sm text-muted-foreground">
                                        {Object.keys(report.findings).length} potential issues found
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-500/50">
                                <CardHeader>
                                    <CardTitle className="text-sm">Analysis Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Categories Analyzed:</span> {Object.keys(report.findings).length}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Red Flags Found:</span> {
                                                Object.values(report.findings).reduce((acc, curr) => acc + curr.length, 0)
                                            }
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Analysis Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    Detailed Analysis Report
                                    <Button variant="outline" className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Export Report
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Risk Categories Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(report.findings).map(([category, matches]) => (
                                        <Card key={category} className="border-l-4 border-l-red-500">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium capitalize">
                                                    {category.replace('_', ' ')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <ul className="space-y-2">
                                                    {matches.map((match, idx) => (
                                                        <li key={idx} className="text-sm flex items-start gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                            <span>{match.match}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Document Preview */}
                                <Card className="bg-muted/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Document Extract</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-sm font-mono whitespace-pre-wrap">
                                            {report.text_preview}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* AI Analysis */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Expert Analysis</h3>
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-4" {...props} />,
                                                h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-3" {...props} />,
                                                h3: ({node, ...props}) => <h3 className="text-base font-medium mb-2" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-4" {...props} />,
                                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                p: ({node, ...props}) => <p className="mb-4" {...props} />
                                            }}
                                        >
                                            {report.analysis}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
