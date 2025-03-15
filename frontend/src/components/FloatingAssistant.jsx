"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Mic, MicOff, Send, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/languageContext";

const VOICE_FALLBACKS = {
    "hi-IN": ["hi-IN", "en-IN"],
    "mr-IN": ["hi-IN", "en-IN"],
    "bn-IN": ["bn-IN", "en-IN"],
    "ta-IN": ["ta-IN", "en-IN"],
    "te-IN": ["te-IN", "en-IN"],
    "gu-IN": ["hi-IN", "en-IN"],
    "kn-IN": ["kn-IN", "en-IN"],
    "ml-IN": ["ml-IN", "en-IN"],
    "pa-IN": ["hi-IN", "en-IN"],
};

const GREETINGS = {
    "en-IN": "Namaste! How may I help you today?",
    "hi-IN": "नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?",
    // ...add other greetings...
};

const SARVAM_SPEAKERS = {
    "hi-IN": "amol",
    "mr-IN": "amol",
    "en-IN": "arjun",
    "bn-IN": "neel",
    "ta-IN": "pavithra",
    "te-IN": "maitreyi",
    "gu-IN": "arvind",
    "kn-IN": "arvind",
    "ml-IN": "pavithra",
    "pa-IN": "amol",
};

const PROJECT_FEATURES = {
    loan_analysis: {
        path: "/loanguard",
        description: "Analyze loan documents and get insights",
    },
    loan_eligibility: {
        path: "/dashboard/eligibility",
        description: "Check loan eligibility and requirements",
    },
    loan_applications: {
        path: "/dashboard/applications",
        description: "View and manage loan applications",
    },
    profile: {
        path: "/dashboard/profile",
        description: "View and update user profile",
    },
    document_analysis: {
        path: "/loanguard",
        description: "Analyze and understand loan documents",
    },
    emi_calculator: {
        path: "/tools/emi-calculator",
        description: "Calculate EMI and loan payments",
    },
    support: {
        path: "/support",
        description: "Get help and support",
    },
};

const splitTextForTTS = (text) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = "";

    sentences.forEach((sentence) => {
        if ((currentChunk + sentence).length <= 500) {
            currentChunk += sentence;
        } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        }
    });

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
};

export default function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState([]);
    const [processing, setProcessing] = useState(false);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const router = useRouter();
    const { t, language } = useLanguage();
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [speaking, setSpeaking] = useState(false);
    const audioRef = useRef(null);
    const [currentPath, setCurrentPath] = useState("");
    const [isPaused, setIsPaused] = useState(false);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = language;

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onerror = (event) => {
                    console.error("Speech recognition error:", event.error);
                    setIsListening(false);
                };
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    handleUserInput(transcript);
                };

                recognitionRef.current = recognition;
            }
        }
    }, [language]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        setCurrentPath(window.location.pathname);
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/wav",
                });
                await convertSpeechToText(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setRecording(true);

            // Stop recording after 5 seconds
            setTimeout(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                    setRecording(false);
                }
            }, 5000);
        } catch (error) {
            console.error("Error starting recording:", error);
            setRecording(false);
        }
    };

    const convertSpeechToText = async (audioBlob) => {
        setProcessing(true);
        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.wav");
            formData.append("model", "saarika:v2");
            formData.append("language_code", language);
            formData.append("with_timestamps", "false");
            formData.append("with_diarization", "false");

            const response = await fetch(
                process.env.NEXT_PUBLIC_SARVAM_STT_API_URL,
                {
                    method: "POST",
                    headers: {
                        "api-subscription-key":
                            process.env.NEXT_PUBLIC_SARVAM_API_SUBSCRIPTION_KEY,
                    },
                    body: formData,
                }
            );

            if (!response.ok) throw new Error("Speech to text failed");

            const data = await response.json();
            if (data.transcript) {
                await handleUserInput(data.transcript);
            }
        } catch (error) {
            console.error("Speech to text error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    type: "error",
                    content:
                        "Sorry, I had trouble understanding that. Please try again.",
                },
            ]);
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = GREETINGS[language] || GREETINGS["en-IN"];
            setMessages([
                {
                    type: "assistant",
                    content: greeting,
                    suggestions: [
                        "Loan Assistant", // Replaced t('common.loanAssistant')
                        "Check Eligibility", // Replaced t('common.eligibilityCheck')
                        "View My Loans", // Replaced t('common.myLoans')
                    ],
                },
            ]);
            speakWithSarvam(greeting);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    const getBestVoice = (lang) => {
        return new Promise((resolve) => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(selectVoice(voices, lang));
            } else {
                speechSynthesis.onvoiceschanged = () => {
                    resolve(selectVoice(speechSynthesis.getVoices(), lang));
                };
            }
        });
    };

    const selectVoice = (voices, lang) => {
        // Try exact match first
        let voice = voices.find((v) => v.lang === lang);
        if (!voice) {
            // Try language match without region
            const langPrefix = lang.split("-")[0];
            voice = voices.find((v) => v.lang.startsWith(langPrefix));
        }
        if (!voice) {
            // Fallback to Hindi for Indian languages or English
            voice =
                voices.find((v) => v.lang === "hi-IN") ||
                voices.find((v) => v.lang === "en-IN") ||
                voices.find((v) => v.lang.startsWith("en"));
        }
        return voice || voices[0];
    };

    const speakWithSarvam = async (text) => {
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            window.speechSynthesis.cancel();
            setSpeaking(true);
            setIsPaused(false);

            // Split text into chunks of max 500 characters
            const textChunks = splitTextForTTS(text);

            // Process each chunk sequentially
            for (const chunk of textChunks) {
                if (isPaused) {
                    await new Promise(resolve => {
                        const checkPause = () => {
                            if (!isPaused) resolve();
                            else setTimeout(checkPause, 100);
                        };
                        checkPause();
                    });
                }
                const response = await fetch(
                    process.env.NEXT_PUBLIC_SARVAM_TTS_API_URL,
                    {
                        method: "POST",
                        headers: {
                            "api-subscription-key":
                                process.env
                                    .NEXT_PUBLIC_SARVAM_API_SUBSCRIPTION_KEY,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            inputs: [chunk],
                            target_language_code: language,
                            speaker: SARVAM_SPEAKERS[language] || "meera",
                            pitch: 0,
                            pace: 1.0,
                            loudness: 1.5,
                            speech_sample_rate: 16000,
                            enable_preprocessing: true,
                            model: "bulbul:v1",
                            eng_interpolation_wt: 0.5,
                        }),
                    }
                );

                if (!response.ok) throw new Error("TTS failed");

                const data = await response.json();
                if (data.audios?.[0]) {
                    await new Promise((resolve, reject) => {
                        const audio = new Audio(
                            `data:audio/wav;base64,${data.audios[0]}`
                        );
                        audioRef.current = audio;

                        audio.onended = () => {
                            audioRef.current = null;
                            resolve();
                        };

                        audio.onerror = reject;
                        audio.play().catch(reject);
                    });
                }
            }
        } catch (error) {
            console.error("Sarvam TTS error:", error);
            await fallbackTTS(text);
        } finally {
            setSpeaking(false);
        }
    };

    const fallbackTTS = async (text) => {
        setSpeaking(true);
        window.speechSynthesis.cancel();

        try {
            const voice = await getBestVoice(language);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language;
            utterance.voice = voice;
            utterance.rate = 0.9;

            return new Promise((resolve, reject) => {
                utterance.onend = () => {
                    setSpeaking(false);
                    resolve();
                };
                utterance.onerror = (error) => {
                    setSpeaking(false);
                    reject(error);
                };
                window.speechSynthesis.speak(utterance);
            });
        } catch (error) {
            setSpeaking(false);
            throw error;
        }
    };

    const toggleListening = () => {
        if (recording) {
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            setRecording(false);
        } else {
            startRecording();
        }
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
        if (audioRef.current) {
            if (isPaused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    };

    const handleNavigation = async (assistantResponse) => {
        if (assistantResponse.action === 'navigate' && assistantResponse.path) {
            const currentLocation = window.location.pathname;
            if (currentLocation !== assistantResponse.path) {
                // Add navigation message
                setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: assistantResponse.response,
                    suggestions: assistantResponse.suggestions || []
                }]);
                
                // Immediate navigation for forced navigation
                if (assistantResponse.force_navigate) {
                    router.push(assistantResponse.path);
                    setCurrentPath(assistantResponse.path);
                } else {
                    // Speak first, then navigate for non-forced
                    await speakWithSarvam(assistantResponse.response);
                    router.push(assistantResponse.path);
                    setCurrentPath(assistantResponse.path);
                }
            }
        }
    };

    const handleUserInput = async (text) => {
        if (!text.trim()) return;
        
        setMessages(prev => [...prev, { 
            type: 'user', 
            content: text 
        }]);
        setInputText('');
        setProcessing(true);
    
        try {
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    language,
                    currentPath
                })
            });
    
            const data = await response.json();
            
            if (data.success && data.data) {
                const assistantResponse = JSON.parse(data.data);
                
                // Handle navigation or stay response
                if (assistantResponse.action === 'navigate') {
                    await handleNavigation(assistantResponse);
                } else {
                    setMessages(prev => [...prev, {
                        type: 'assistant',
                        content: assistantResponse.response,
                        suggestions: assistantResponse.suggestions || []
                    }]);
                    await speakWithSarvam(assistantResponse.response);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage =
                language === "hi-IN"
                    ? "क्षमा करें, मुझे एक त्रुटि मिली। कृपया पुनः प्रयास करें।"
                    : "Sorry, I encountered an error. Please try again.";

            setMessages((prev) => [
                ...prev,
                {
                    type: "error",
                    content: errorMessage,
                },
            ]);
            await speakWithSarvam(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleUserInput(inputText);
        }
    };

    const handleClose = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis.cancel();
        setSpeaking(false);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.3 }}
                        className="bg-card rounded-lg shadow-2xl mb-4 w-96"
                    >
                        {/* Chat Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-primary text-primary-foreground rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <Bot
                                    className={`h-5 w-5 ${
                                        speaking ? "animate-pulse" : ""
                                    }`}
                                />
                                <h3 className="font-medium">
                                    FinSaathi Assistant
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {speaking && (
                                    <button
                                        onClick={togglePause}
                                        className="p-1 hover:bg-primary-foreground/10 rounded-full"
                                    >
                                        {isPaused ? (
                                            <Play className="h-4 w-4" />
                                        ) : (
                                            <Pause className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                                <button onClick={handleClose} className="hover:opacity-75">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${
                                        msg.type === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${
                                            msg.type === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : msg.type === "error"
                                                ? "bg-destructive text-destructive-foreground"
                                                : "bg-muted"
                                        }`}
                                    >
                                        <p>{msg.content}</p>
                                        {msg.suggestions && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {msg.suggestions.map(
                                                    (suggestion, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() =>
                                                                handleUserInput(
                                                                    suggestion
                                                                )
                                                            }
                                                            className="text-xs px-2 py-1 rounded-full bg-background/10 hover:bg-background/20"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t">
                            <div className="flex items-center gap-2">
                                {speaking && (
                                    <div className="absolute left-4 -top-8 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                        Speaking...
                                    </div>
                                )}
                                <button
                                    onClick={toggleListening}
                                    disabled={processing}
                                    className={`p-2 rounded-full transition-colors ${
                                        recording
                                            ? "bg-red-500 text-white animate-pulse"
                                            : "bg-muted hover:bg-muted/80"
                                    }`}
                                >
                                    {recording ? (
                                        <MicOff className="h-5 w-5" />
                                    ) : (
                                        <Mic className="h-5 w-5" />
                                    )}
                                </button>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    onKeyPress={handleKeyPress}
                                    placeholder={
                                        isListening
                                            ? "Listening..."
                                            : "Type a message..."
                                    }
                                    disabled={isListening}
                                    className="flex-1 rounded-full px-4 py-2 bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                    onClick={() => handleUserInput(inputText)}
                                    disabled={processing || !inputText.trim()}
                                    className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90"
            >
                <Bot className="h-6 w-6" />
            </motion.button>
        </div>
    );
}
