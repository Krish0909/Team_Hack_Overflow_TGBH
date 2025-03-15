'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Upload, Send, Image as ImageIcon, FileText, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { processChatResponse } from '@/lib/chatResponseProcessor';
import { useRouter } from 'next/navigation';

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
    const isImage = selectedFile.type.startsWith('image/');
    
    formData.append(isImage ? 'image' : 'file', selectedFile);
    formData.append('language', language);
    formData.append('message', fileUploadPrompt);

    try {
      const endpoint = isImage ? '/chat/image' : '/chat/document';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        // Store document/image content for future reference
        setCurrentDocument({
          type: isImage ? 'image' : 'document',
          content: data.data.text || data.data,
          name: selectedFile.name
        });

        // Add file upload message with prompt
        setMessages(prev => [...prev, {
          type: 'user',
          content: `${selectedFile.name}\nPrompt: ${fileUploadPrompt}`,
          isFile: true,
          fileType: isImage ? 'image' : 'document'
        }]);

        // Process initial analysis
        await processWithLLM(fileUploadPrompt, data.data.text || data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message);
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
      // If there's a current document, include its content in the context
      const message = currentDocument 
        ? `Regarding ${currentDocument.name}:\n${userMessage}\n\nDocument content: ${currentDocument.content}`
        : userMessage;

      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });

      const data = await response.json();
      if (data.success) {
        const processedResponse = processChatResponse(data.data);
        
        // Add the assistant's response
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: processedResponse.response,
          suggestions: processedResponse.suggestions
        }]);

        // Handle navigation if needed
        if (processedResponse.action === 'navigate' && processedResponse.path) {
          // Add navigation message
          setMessages(prev => [...prev, {
            type: 'assistant',
            content: `I'll take you to ${processedResponse.path} for better assistance.`,
            isNavigation: true
          }]);

          // Navigate after a short delay
          setTimeout(() => {
            router.push(processedResponse.path);
          }, 2000);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-4">
      <Card className="h-[calc(100vh-8rem)] flex flex-col bg-card">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">LoanBuddy Assistant</h1>
        </div>

        {/* Add current document indicator if exists */}
        {currentDocument && (
          <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentDocument.type === 'image' ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="text-sm">Analyzing: {currentDocument.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDocument(null)}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
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
                <div className={`max-w-[80%] rounded-lg p-4 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : message.type === 'error'
                    ? 'bg-destructive text-destructive-foreground'
                    : message.isNavigation
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted'
                }`}>
                  {message.isFile ? (
                    <div className="flex items-center gap-2">
                      {message.fileType === 'image' ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span>{message.content}</span>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.suggestions.map((suggestion, i) => (
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
                    </>
                  )}
                </div>
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
        <form onSubmit={handleSubmit} className="p-4 border-t space-y-4">
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
