import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, Loader2, Paperclip, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { createCompany } from '../api/client';
import { createPerson } from '../api/people';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatWidgetProps {
    context?: string;
    mode?: 'floating' | 'embedded';
    className?: string;
}

export function ChatWidget({ context, mode = 'floating', className }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(mode === 'embedded'); // Default open if embedded
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm Zerpha AI. How can I help you analyze the market today?",
            timestamp: new Date(),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, selectedFiles]);

    // If embedded, always keep open
    useEffect(() => {
        if (mode === 'embedded') {
            setIsOpen(true);
        }
    }, [mode]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && selectedFiles.length === 0) || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim() + (selectedFiles.length > 0 ? `\n[Attached ${selectedFiles.length} file(s)]` : ''),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        const filesToSend = [...selectedFiles];
        setSelectedFiles([]); // Clear files immediately
        setIsTyping(true);

        try {
            const formData = new FormData();
            formData.append('messages', JSON.stringify([...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content
            }))));
            if (context) formData.append('context', context);

            filesToSend.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            let content = data.content;

            // Check for JSON action block
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                try {
                    const actionBlock = JSON.parse(jsonMatch[1]);
                    // Remove the JSON block from the displayed message
                    content = content.replace(jsonMatch[0], '').trim();

                    if (actionBlock.action === 'create_company') {
                        await createCompany(actionBlock.data);
                        content += '\n\n✅ Company saved to your workspace.';
                    } else if (actionBlock.action === 'create_person') {
                        await createPerson(actionBlock.data);
                        content += '\n\n✅ Person added to your contacts.';
                    }
                } catch (e) {
                    console.error('Failed to execute action:', e);
                    content += '\n\n⚠️ Failed to save data automatically.';
                }
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: content,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting to the server. Please try again later.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const renderFilePreview = (file: File, index: number) => {
        const isImage = file.type.startsWith('image/');
        return (
            <div key={index} className="relative group flex items-center gap-2 bg-slate-100 rounded-lg p-2 pr-8 border border-slate-200 max-w-[200px]">
                {isImage ? (
                    <div className="w-8 h-8 rounded bg-slate-200 overflow-hidden flex-shrink-0">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                )}
                <span className="text-xs text-slate-600 truncate">{file.name}</span>
                <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        );
    };

    const chatInterfaceProps = {
        mode,
        setIsOpen,
        messages,
        isTyping,
        messagesEndRef,
        selectedFiles,
        renderFilePreview,
        handleSubmit,
        fileInputRef,
        handleFileSelect,
        inputValue,
        setInputValue,
        context,
        removeFile
    };

    if (mode === 'embedded') {
        return <ChatInterface {...chatInterfaceProps} />;
    }

    return (
        <div className={cn("fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4", className)}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="w-[380px] h-[600px] origin-bottom-right"
                    >
                        <ChatInterface {...chatInterfaceProps} />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 relative group",
                    isOpen
                        ? "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/25"
                )}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <MessageSquare className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    </>
                )}
            </motion.button>
        </div>
    );
}

interface ChatInterfaceProps {
    mode: 'floating' | 'embedded';
    setIsOpen: (isOpen: boolean) => void;
    messages: Message[];
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    selectedFiles: File[];
    renderFilePreview: (file: File, index: number) => React.ReactNode;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputValue: string;
    setInputValue: (value: string) => void;
    context?: string;
}

function ChatInterface({
    mode,
    setIsOpen,
    messages,
    isTyping,
    messagesEndRef,
    selectedFiles,
    renderFilePreview,
    handleSubmit,
    fileInputRef,
    handleFileSelect,
    inputValue,
    setInputValue,
    context
}: ChatInterfaceProps) {
    return (
        <div className={cn("flex flex-col h-full bg-white", mode === 'embedded' ? "border-l border-slate-200" : "rounded-2xl shadow-2xl border border-slate-200 overflow-hidden")}>
            {/* Header */}
            <div className={cn(
                "p-4 flex items-center justify-between shrink-0",
                mode === 'embedded' ? "bg-white border-b border-slate-200" : "bg-gradient-to-r from-indigo-600 to-violet-600"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm",
                        mode === 'embedded' ? "bg-indigo-50" : "bg-white/20"
                    )}>
                        <Bot className={cn("w-5 h-5", mode === 'embedded' ? "text-indigo-600" : "text-white")} />
                    </div>
                    <div>
                        <h3 className={cn("font-semibold text-sm", mode === 'embedded' ? "text-slate-900" : "text-white")}>Zerpha Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            <span className={cn("text-xs", mode === 'embedded' ? "text-slate-500" : "text-indigo-100")}>Online</span>
                        </div>
                    </div>
                </div>
                {mode === 'floating' && (
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex w-full",
                            message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap",
                                message.role === 'user'
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                            )}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                {/* File Previews */}
                {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 max-h-[100px] overflow-y-auto">
                        {selectedFiles.map((file, index) => renderFilePreview(file, index))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                        accept="image/*,.pdf,.zip"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                        title="Attach files"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask anything..."
                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            autoFocus={mode === 'floating'}
                        />
                        <button
                            type="submit"
                            disabled={(!inputValue.trim() && selectedFiles.length === 0) || isTyping}
                            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                        >
                            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-center">
                        {context ? 'Viewing Company Context' : 'Powered by Zerpha Intelligence'}
                    </span>
                </div>
            </div>
        </div>
    );
}
