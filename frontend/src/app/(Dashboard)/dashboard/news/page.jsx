'use client';
import { Suspense, useState, useEffect } from "react";
import {
    Clock,
    Link as LinkIcon,
    Newspaper,
    AlertCircle,
    Search,
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { useLanguage } from '@/lib/languageContext';
import { translateBatch, translateText } from '@/lib/translation';

const ScrollArea = ({ children, className = "" }) => (
    <div className={`overflow-auto ${className}`}>{children}</div>
);

const ErrorMessage = ({ message }) => (
    <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <p>{message}</p>
    </div>
);

export default function NewsFeed() {
    const { language } = useLanguage();
    const [translatedNews, setTranslatedNews] = useState([]);
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const translateContent = async () => {
            // First translate static content
            const staticContent = await translateBatch([
                'Loan News Feed',
                'Read full article',
                'Loading...',
                'Failed to fetch news'
            ], language);

            setTranslations({
                title: staticContent[0],
                readMore: staticContent[1],
                loading: staticContent[2],
                error: staticContent[3]
            });

            // Then fetch and translate news
            try {
                const response = await fetch("http://localhost:3000/api/news", {
                    next: { revalidate: 300 },
                });

                if (!response.ok) throw new Error("Failed to fetch news");
                const { news } = await response.json();

                // Translate news content
                const translatedItems = await Promise.all(news.map(async (article) => ({
                    ...article,
                    title: await translateText(article.title, language),
                    description: await translateText(article.description, language),
                })));

                setTranslatedNews(translatedItems);
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };

        translateContent();
    }, [language]);

    if (loading) {
        return <div>{translations.loading}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Newspaper className="h-6 w-6 text-gray-700" />
                    <h1 className="text-3xl font-bold text-gray-900">
                        {translations.title}
                    </h1>
                </div>
            </div>

            <ScrollArea className="h-[800px] rounded-md border border-gray-200 p-4 bg-gray-50">
                <Suspense fallback={<div>{translations.loading}</div>}>
                    <div className="grid gap-4">
                        {translatedNews.map((article, index) => (
                            <Card key={index} className="overflow-hidden">
                                <CardHeader className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                                {article.title}
                                            </h2>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="h-4 w-4" />
                                                {new Date(
                                                    article.pub_date
                                                ).toLocaleString()}
                                                <span className="px-2">•</span>
                                                {article.source}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-6">
                                    <p className="text-sm text-gray-600">
                                        {article.description}
                                    </p>
                                </CardContent>

                                <CardFooter className="px-6 py-4">
                                    <a
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        {translations.readMore}
                                    </a>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </Suspense>
            </ScrollArea>
        </div>
    );
}
