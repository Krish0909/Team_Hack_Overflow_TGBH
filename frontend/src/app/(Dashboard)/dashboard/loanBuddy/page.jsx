'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Upload, Send, Image as ImageIcon, FileText, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { processChatResponse } from '@/lib/chatResponseProcessor';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function LoanBuddyPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { language } = useLanguage();
  const [fileUploadPrompt, setFileUploadPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      type: 'assistant',
      content: 'Welcome to LoanBuddy! I can help you analyze loan documents, explain terms, and guide you through the loan process. You can:',
      suggestions: [
        'Upload a loan document',
        'Share an image of financial documents',
        'Ask about loan terms'
      ]
    }]);
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Unsupported file type. Please upload PDF, DOCX, TXT, or images (JPG, PNG).');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setSelectedFile(file);
      setShowPromptInput(true);
      setFileUploadPrompt(`Please analyze this ${file.type.includes('image') ? 'image' : 'document'}`);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUploadWithPrompt = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('language', language);
    formData.append('message', fileUploadPrompt);

    try {
        const response = await fetch('http://localhost:5000/loanbuddy/document', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            setCurrentDocument({
                type: 'document',
                content: data.data.text,
                name: selectedFile.name
            });

            // Add document analysis message
            setMessages(prev => [
                ...prev,
                {
                    type: 'user',
                    content: `Analyzing: ${selectedFile.name}`,
                    isFile: true
                },
                {
                    type: 'assistant',
                    isDocumentAnalysis: true,
                    analysis: data.data.text,
                    key_info: data.data.key_info,
                    suggestions: [
                        'Calculate EMI for this loan',
                        'Check eligibility criteria',
                        'Compare with other loans'
                    ]
                }
            ]);
        }
    } catch (error) {
        toast.error('Error processing document: ' + error.message);
    } finally {
        setUploading(false);
        setShowPromptInput(false);
        setSelectedFile(null);
        setFileUploadPrompt('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
};

  const processWithLLM = async (prompt, content) => {
    try {
      const llmResponse = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${prompt}\n\nContent: ${content}`,
          language
        })
      });

      if (!llmResponse.ok) throw new Error('Failed to analyze content');

      const llmData = await llmResponse.json();
      if (llmData.success) {
        const processedResponse = processChatResponse(llmData.data);
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: processedResponse.response,
          suggestions: processedResponse.suggestions
        }]);
      }
    } catch (error) {
      toast.error('Error analyzing content: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || processing) return;

    const userMessage = inputText;
    setInputText('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setProcessing(true);

    try {
      const response = await fetch('http://localhost:5000/loanbuddy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, language })
      });

      const data = await response.json();
      if (data.success) {
        // Add assistant response directly
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.data.response,
          suggestions: data.data.suggestions || []
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setProcessing(false);
    }
  };

  const DocumentAnalysis = ({ analysis, keyInfo, suggestions }) => {
    return (
      <Card className="w-full mb-4 border-emerald-200/50 max-w-3xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg font-medium">Document Analysis</CardTitle>
          </div>
          <CardDescription>Comprehensive analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {/* Key Information */}
          {keyInfo && Object.keys(keyInfo).length > 0 && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-lg">
              {Object.entries(keyInfo).map(([key, value]) => (
                value && (
                  <div key={key} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-muted-foreground capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{value}</p>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Document Content with Markdown */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
          </div>

          {/* Suggestions */}
          {suggestions?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(suggestion)}
                  className="flex items-center gap-2 p-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-left"
                >
                  <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderMessage = (msg, index) => {
    if (msg.type === 'assistant' && msg.isDocumentAnalysis) {
      return <DocumentAnalysis {...msg} />;
    }
    
    return (
      <div className={`max-w-md rounded-lg p-3 ${
        msg.type === 'user' 
          ? 'bg-primary text-primary-foreground ml-auto'
          : msg.type === 'error'
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
      }`}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInputText(suggestion)}
                className="text-xs px-2 py-1 rounded-full bg-background/10 hover:bg-background/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-1rem)] flex flex-col max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col bg-gradient-to-b from-background to-muted/20 border-none rounded-lg">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <Bot className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">LoanBuddy Assistant</h2>
        </div>

        {/* Document Indicator */}
        {currentDocument && (
          <div className="px-6 py-3 bg-emerald-50/80 dark:bg-emerald-900/20 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentDocument.type === 'image' ? (
                <ImageIcon className="h-5 w-5 text-emerald-600" />
              ) : (
                <FileText className="h-5 w-5 text-emerald-600" />
              )}
              <div>
                <p className="font-medium text-sm">{currentDocument.name}</p>
                <p className="text-xs text-muted-foreground">Active document for analysis</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDocument(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-h-[calc(100vh-12rem)]"
        >
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {renderMessage(message, index)}
              </motion.div>
            ))}
          </AnimatePresence>
          {(processing || uploading) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{uploading ? 'Uploading...' : 'Processing...'}</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800/50 dark:to-gray-900/50">
          {showPromptInput ? (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center bg-background rounded-lg border">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile?.type || 'Document'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPromptInput(false);
                      setSelectedFile(null);
                      setFilePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fileUploadPrompt}
                  onChange={(e) => setFileUploadPrompt(e.target.value)}
                  placeholder="Add a prompt for analysis..."
                  className="flex-1 rounded-lg px-4 py-2 bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button 
                  type="button"
                  onClick={handleUploadWithPrompt}
                  disabled={uploading || !fileUploadPrompt.trim()}
                >
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing || uploading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                disabled={processing || uploading}
                className="flex-1 rounded-lg px-4 py-2 bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button 
                type="submit" 
                disabled={!inputText.trim() || processing || uploading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
