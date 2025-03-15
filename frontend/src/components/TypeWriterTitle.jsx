"use client";
import { useEffect, useState } from "react";

const saathiVariants = {
    "en-IN": "साथी",
    "hi-IN": "साथी",
    "bn-IN": "সাথি",
    "ta-IN": "சாதி",
    "te-IN": "సాథి",
    "mr-IN": "साथी",
    "gu-IN": "સાથી",
    "kn-IN": "ಸಾಥಿ",
    "ml-IN": "സാഥി",
    "pa-IN": "ਸਾਥੀ",
};

export default function TypewriterTitle() {
    const [text, setText] = useState("साथी");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentLanguage, setCurrentLanguage] = useState("en-IN");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (!saathiVariants[currentLanguage]) return;

        const fullText = saathiVariants[currentLanguage];

        if (isTransitioning) {
            // Pausing between delete and type phases
            const timeout = setTimeout(() => {
                setIsTransitioning(false);
                setIsDeleting(false);
                setCurrentIndex(0);
                setText("");
            }, 500);
            return () => clearTimeout(timeout);
        } else if (!isDeleting && currentIndex < fullText.length) {
            // Typing phase
            const timeout = setTimeout(() => {
                setText(fullText.substring(0, currentIndex + 1));
                setCurrentIndex((prev) => prev + 1);
            }, 100);
            return () => clearTimeout(timeout);
        } else if (!isDeleting && currentIndex >= fullText.length) {
            // Pause at full text before deleting
            const timeout = setTimeout(() => {
                setIsDeleting(true);
            }, 2000);
            return () => clearTimeout(timeout);
        } else if (isDeleting && text.length > 0) {
            // Deleting phase
            const timeout = setTimeout(() => {
                setText((prev) => prev.slice(0, -1));
            }, 50);
            return () => clearTimeout(timeout);
        } else if (isDeleting && text.length === 0) {
            // Switch to next language
            const timeout = setTimeout(() => {
                const languages = Object.keys(saathiVariants);
                const currentIdx = languages.indexOf(currentLanguage);
                const nextIndex = (currentIdx + 1) % languages.length;
                setCurrentLanguage(languages[nextIndex]);
                setIsTransitioning(true);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, currentLanguage, isDeleting, isTransitioning, text]);

    return (
        <span className="bg-clip-text text-transparent bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 inline-block pt-5">
            <span>Loan</span>
            <span>{text}</span>
            <span className="animate-pulse text-emerald-500">_</span>
        </span>
    );
}
