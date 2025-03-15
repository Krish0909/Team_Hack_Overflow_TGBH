"use client";
import { useEffect, useState } from "react";

const greetings = {
    "en-IN": "Type your loan query here...",
    "hi-IN": "अपना लोन प्रश्न यहां टाइप करें...",
    "bn-IN": "আপনার ঋণ সম্পর্কিত প্রশ্ন এখানে টাইপ করুন...",
    "ta-IN": "உங்கள் கடன் கேள்வியை இங்கே தட்டச்சு செய்யவும்...",
    "te-IN": "మీ రుణ ప్రశ్నను ఇక్కడ టైప్ చేయండి...",
    "mr-IN": "तुमचा कर्ज प्रश्न येथे टाइप करा...",
    "gu-IN": "તમારો લોન પ્રશ્ન અહીં ટાઇપ કરો...",
    "kn-IN": "ನಿಮ್ಮ ಸಾಲದ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...",
    "ml-IN": "നിങ്ങളുടെ വായ്പാ ചോദ്യം ഇവിടെ ടൈപ്പ് ചെയ്യുക...",
    "pa-IN": "ਆਪਣਾ ਲੋਨ ਸਵਾਲ ਇੱਥੇ ਟਾਈਪ ਕਰੋ...",
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

    return (
        <div className="flex items-center gap-2 text-gray-600 min-h-[28px]">
            {" "}
            {/* Changed text color */}
            <div className="flex gap-1">
                <span
                    className={`h-2 w-2 rounded-full bg-[#25D366] animate-bounce [animation-delay:-0.3s]`}
                ></span>
                <span
                    className={`h-2 w-2 rounded-full bg-[#25D366] animate-bounce [animation-delay:-0.15s]`}
                ></span>
                <span
                    className={`h-2 w-2 rounded-full bg-[#25D366] animate-bounce`}
                ></span>
            </div>
            <span className="text-base">{text}</span>
        </div>
    );
}
