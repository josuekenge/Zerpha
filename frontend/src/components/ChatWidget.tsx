import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, Paperclip, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { createCompany } from '../api/client';
import { createPerson } from '../api/people';
import { buildApiUrl } from '../api/config';

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
    const [isOpen, setIsOpen] = useState(mode === 'embedded');
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm Zerpha AI. How can I help you today?",
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

    useEffect(() => {
        if (mode === 'embedded') {
            setIsOpen(true);
        }
    }, [mode]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
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

        let userContent = inputValue.trim();
        if (selectedFiles.length > 0) {
            const fileList = selectedFiles.map(f => f.name).join(', ');
            userContent += `\n\n[Attached: ${fileList}]`;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userContent,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        const filesToSend = [...selectedFiles];
        setSelectedFiles([]);
        setIsTyping(true);

        try {
            const formData = new FormData();
            const messagesToSend = [...messages, {
                role: userMessage.role,
                content: inputValue.trim()
            }];

            formData.append('messages', JSON.stringify(messagesToSend));
            if (context) formData.append('context', context);

            filesToSend.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch(buildApiUrl('/api/chat'), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            let content = data.content;

            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                try {
                    const actionBlock = JSON.parse(jsonMatch[1]);
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
                content: "I'm having trouble connecting. Please try again.",
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
            <div key={index} className="relative group flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-2 pr-7 border border-slate-200 dark:border-slate-700 shadow-sm">
                {isImage ? (
                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-3 h-3 text-indigo-500" />
                    </div>
                )}
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{file.name}</span>
                <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-500 rounded transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        );
    };

    if (mode === 'embedded') {
        return <ChatInterface mode={mode} setIsOpen={setIsOpen} messages={messages} isTyping={isTyping} messagesEndRef={messagesEndRef} selectedFiles={selectedFiles} renderFilePreview={renderFilePreview} handleSubmit={handleSubmit} fileInputRef={fileInputRef} handleFileSelect={handleFileSelect} inputValue={inputValue} setInputValue={setInputValue} context={context} />;
    }

    return (
        <div className={cn("fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3", className)}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="w-[340px] h-[480px] origin-bottom-right"
                    >
                        <ChatInterface mode={mode} setIsOpen={setIsOpen} messages={messages} isTyping={isTyping} messagesEndRef={messagesEndRef} selectedFiles={selectedFiles} renderFilePreview={renderFilePreview} handleSubmit={handleSubmit} fileInputRef={fileInputRef} handleFileSelect={handleFileSelect} inputValue={inputValue} setInputValue={setInputValue} context={context} />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
                    isOpen
                        ? "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl"
                )}
            >
                {isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <>
                        <MessageSquare className="w-5 h-5" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
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
}: ChatInterfaceProps) {
    return (
        <div className={cn(
            "flex flex-col h-full bg-white dark:bg-slate-950",
            mode === 'embedded'
                ? "border-l border-slate-200 dark:border-slate-800"
                : "rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden"
        )}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-500/20">
                        Z
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Zerpha AI</h3>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span className="text-[10px] text-slate-400">Online</span>
                        </div>
                    </div>
                </div>
                {mode === 'floating' && (
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn("flex w-full", message.role === 'user' ? "justify-end" : "justify-start")}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                                message.role === 'user'
                                    ? "bg-indigo-600 text-white rounded-br-md"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md shadow-sm"
                            )}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1.5">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 max-h-[60px] overflow-y-auto">
                        {selectedFiles.map((file, index) => renderFilePreview(file, index))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                        title="Attach files"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={(!inputValue.trim() && selectedFiles.length === 0) || isTyping}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>

                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Powered by Zerpha AI</span>
                </div>
            </div>
        </div>
    );
}
