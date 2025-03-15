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
import { Upload, FileText, Languages, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TranslationCard = ({ item }) => (
    <div className="p-4 border rounded-lg mb-4 hover:bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-medium text-gray-700">Original Text</h4>
                <p className="text-sm">{item.original}</p>
                <p className="text-xs text-gray-500 mt-1">{item.purpose}</p>
            </div>
            <div>
                <h4 className="font-medium text-blue-600">Translated Text</h4>
                <p className="text-sm">{item.translated_text}</p>
                <p className="text-xs text-blue-500 mt-1">
                    {item.instructions}
                </p>
            </div>
        </div>
    </div>
);

const GuideSection = ({ guide }) => {
    const decodedGuide = guide
        ? decodeURIComponent(JSON.parse(`"${guide}"`.replace(/\n/g, "\\n")))
        : "";

    return (
        <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{decodedGuide}</div>
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
            <h1 className="text-3xl font-bold">
                LoanGaurd - Document Analysis
            </h1>

            <Tabs defaultValue="upload" className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                    <TabsTrigger value="upload">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                    </TabsTrigger>
                    <TabsTrigger value="analysis">
                        <Eye className="h-4 w-4 mr-2" />
                        Analysis
                    </TabsTrigger>
                    <TabsTrigger value="translations">
                        <Languages className="h-4 w-4 mr-2" />
                        Translations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Loan Document</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Select Target Language
                                    </label>
                                    <Select
                                        value={targetLanguage}
                                        onValueChange={setTargetLanguage}
                                    >
                                        <SelectTrigger>
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

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Upload Document (PDF or Image)
                                    </label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 hover:bg-gray-100">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <FileText className="w-8 h-8 mb-4 text-gray-500" />
                                                <p className="mb-2 text-sm text-gray-500">
                                                    <span className="font-semibold">
                                                        Click to upload
                                                    </span>{" "}
                                                    or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PDF or Image files
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,image/*"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {file && (
                                    <div className="text-sm text-gray-500">
                                        Selected file: {file.name}
                                    </div>
                                )}

                                {loading && (
                                    <div className="space-y-2">
                                        <Progress
                                            value={progress}
                                            className="w-full"
                                        />
                                        <p className="text-sm text-gray-500 text-center">
                                            Processing document... {progress}%
                                        </p>
                                    </div>
                                )}

                                <Button
                                    onClick={processDocument}
                                    disabled={!file || loading}
                                    className="w-full"
                                >
                                    {loading
                                        ? "Processing..."
                                        : "Analyze Document"}
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-[300px]">
                        <CardContent className="space-y-4 p-4">
                            <Progress value={progress} className="w-full" />
                            <p className="text-center text-sm">
                                Processing document... {progress}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
