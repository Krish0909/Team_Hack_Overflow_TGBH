"use client";
import { useEffect, useState } from "react";

const greetings = {
    "en-IN": "So how can I help you today?",
    "hi-IN": "तो आज मैं आपकी कैसे मदद कर सकता हूं?",
    "bn-IN": "তাহলে আজ আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
    "ta-IN": "அப்படியானால் இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    "te-IN": "మరి నేను ఈరోజు మీకు ఎలా సహాయం చేయగలను?",
    "mr-IN": "तर मी आज तुम्हाला कशी मदत करू शकतो?",
    "gu-IN": "તો આજે હું તમને કેવી રીતે મદદ કરી શકું?",
    "kn-IN": "ಹಾಗಾದರೆ ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    "ml-IN": "അപ്പോൾ ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാൻ കഴിയും?",
    "pa-IN": "ਤਾਂ ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
};

export default function TypewriterText({ language: initialLanguage }) {
    const [text, setText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!greetings[currentLanguage]) return;

        const fullText = greetings[currentLanguage];

        if (!isDeleting && currentIndex < fullText.length) {
            // Typing phase
            const timeout = setTimeout(() => {
                setText((prev) => prev + fullText[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, 50);
            return () => clearTimeout(timeout);
        } else if (!isDeleting && currentIndex >= fullText.length) {
            // Switch to deleting phase after a pause
            const timeout = setTimeout(() => {
                setIsDeleting(true);
                setCurrentIndex((prev) => prev - 1);
            }, 2000);
            return () => clearTimeout(timeout);
        } else if (isDeleting && currentIndex >= 0) {
            // Deleting phase
            const timeout = setTimeout(() => {
                setText((prev) => prev.slice(0, -1));
                setCurrentIndex((prev) => prev - 1);
            }, 30);
            return () => clearTimeout(timeout);
        } else if (isDeleting && currentIndex < 0) {
            // Switch to next language
            const timeout = setTimeout(() => {
                const languages = Object.keys(greetings);
                const currentIdx = languages.indexOf(currentLanguage);
                const nextIndex = (currentIdx + 1) % languages.length;
                setCurrentLanguage(languages[nextIndex]);
                setIsDeleting(false);
                setCurrentIndex(0);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, currentLanguage, isDeleting]);

    return <div className="h-6 text-xl mt-2 mb-1 text-gray-700">{text}</div>;
}
