"use client";
import { useState } from "react";
import { useLanguage } from "@/lib/languageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Languages, Eye, AlertTriangle, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TranslationCard = ({ item }) => (
    <div className="p-6 border rounded-xl mb-4 hover:bg-emerald-50/50 transition-all duration-300 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <h4 className="font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Original Text
                </h4>
                <p className="text-sm bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">{item.original}</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{item.purpose}</p>
            </div>
            <div className="space-y-2">
                <h4 className="font-medium text-teal-700 dark:text-teal-300 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Translated Text
                </h4>
                <p className="text-sm bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">{item.translated_text}</p>
                <p className="text-xs text-teal-600/70 dark:text-teal-400/70">{item.instructions}</p>
            </div>
        </div>
    </div>
);

const GuideSection = ({ guide }) => {
    const decodedGuide = guide
        ? decodeURIComponent(JSON.parse(`"${guide}"`.replace(/\n/g, "\\n")))
        : "";

    return (
        <div className="prose prose-emerald dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap bg-white/50 dark:bg-gray-800/50 p-6 rounded-xl">{decodedGuide}</div>
        </div>
    );
};

export default function LoanGaurd() {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [targetLanguage, setTargetLanguage] = useState("Hindi");
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (
            selectedFile &&
            (selectedFile.type === "application/pdf" ||
                selectedFile.type.startsWith("image/"))
        ) {
            setFile(selectedFile);
        } else {
            toast.error("Please upload a PDF or image file");
        }
    };

    const processDocument = async () => {
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        setLoading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("targetLanguage", targetLanguage);
            formData.append("sourceLanguage", language);

            const response = await fetch(
                "http://localhost:5000/chat/document",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) throw new Error("Failed to process document");

            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 500);

            const data = await response.json();
            setProgress(100);
            clearInterval(progressInterval);

            if (data.success) {
                setAnalysis(data.data);
                toast.success("Document processed successfully!");
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="relative overflow-hidden rounded-lg border bg-card p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    LoanGaurd Analysis
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Advanced document analysis and translation system to protect you from predatory lending practices
                </p>
            </div>

            <Tabs defaultValue="upload" className="space-y-8">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 p-1 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-xl">
                    <TabsTrigger value="upload" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        <Eye className="h-4 w-4 mr-2" />
                        Analysis
                    </TabsTrigger>
                    <TabsTrigger value="translations" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        <Languages className="h-4 w-4 mr-2" />
                        Translations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    <Card className="border-emerald-200/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-emerald-800 dark:text-emerald-200">Upload Loan Document</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                        Select Target Language
                                    </label>
                                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                        <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-emerald-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Hindi">
                                                Hindi
                                            </SelectItem>
                                            <SelectItem value="Malayalam">
                                                Malayalam
                                            </SelectItem>
                                            <SelectItem value="Kannada">
                                                Kannada
                                            </SelectItem>
                                            <SelectItem value="Telugu">
                                                Telugu
                                            </SelectItem>
                                            <SelectItem value="Tamil">
                                                Tamil
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                        Upload Document
                                    </label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-emerald-200 border-dashed rounded-xl cursor-pointer bg-emerald-50/50 dark:bg-gray-800/30 hover:bg-emerald-100/50 transition-all duration-300">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                                <FileText className="w-12 h-12 mb-4 text-emerald-500" />
                                                <p className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                                                    PDF or Image files supported
                                                </p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                </div>

                                {file && (
                                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg">
                                        <Check className="w-4 h-4" />
                                        Selected: {file.name}
                                    </div>
                                )}

                                {loading && (
                                    <div className="space-y-2">
                                        <Progress value={progress} className="w-full bg-emerald-100 dark:bg-emerald-900" 
                                            indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500" />
                                        <p className="text-sm text-center text-emerald-600 dark:text-emerald-400">
                                            Processing document... {progress}%
                                        </p>
                                    </div>
                                )}

                                <Button
                                    onClick={processDocument}
                                    disabled={!file || loading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                                >
                                    {loading ? "Processing..." : "Analyze Document"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analysis">
                    {analysis ? (
                        <div className="space-y-6">
                            {/* OCR Visualization */}
                            {analysis.ocr_images && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Document OCR Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4">
                                            {analysis.ocr_images.map(
                                                (image, index) => (
                                                    <div
                                                        key={index}
                                                        className="border rounded-lg p-2"
                                                    >
                                                        <h4 className="text-sm font-medium mb-2">
                                                            Page {index + 1}
                                                        </h4>
                                                        <img
                                                            src={`data:image/png;base64,${image}`}
                                                            alt={`OCR overlay page ${
                                                                index + 1
                                                            }`}
                                                            className="w-full rounded-lg"
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Document Guide */}
                            {analysis.guide && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Document Guide</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <GuideSection guide={analysis.guide} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-10 text-gray-500">
                                No document analysis available. Please upload a
                                document first.
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="translations">
                    {analysis?.translations ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Translations</span>
                                    <div className="text-sm text-gray-500">
                                        {analysis.translations.length} items
                                        translated
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analysis.translations.map((item, index) => (
                                    <TranslationCard key={index} item={item} />
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-10 text-gray-500">
                                No translations available. Please upload a
                                document first.
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {loading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-[300px] border-emerald-200/50">
                        <CardContent className="space-y-4 p-6">
                            <Progress value={progress} className="w-full" />
                            <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
                                Processing document... {progress}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
