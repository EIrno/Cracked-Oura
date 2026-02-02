import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/useChat";
import { ThoughtsDisplay } from "@/components/dashboard/ThoughtsDisplay";

interface ChatPanelProps {
    onClose: () => void;
    messages: Message[];
    isLoading: boolean;
    onSend: (message: string) => void;
}

export function ChatPanel({ onClose, messages, isLoading, onSend }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        onSend(input.trim());
        setInput("");
    };

    return (
        <div className="w-[400px] border-l bg-card flex flex-col h-full shadow-xl z-20">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <div>
                        <h2 className="text-sm font-semibold">AI Assistant</h2>
                        <p className="text-xs text-muted-foreground">Ask about your health data</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8 px-4">
                            <p>👋 Hi! I can analyze your Oura Ring data.</p>
                            <p className="mt-2">Try asking:</p>
                            <ul className="mt-2 space-y-1 text-xs bg-muted/50 p-3 rounded-md text-left">
                                <li>"How is my sleep score trending?"</li>
                                <li>"What's my average HRV this month?"</li>
                                <li>"Did I meet my activity goals last week?"</li>
                                <li>"Show me my lowest heart rate during sleep"</li>
                            </ul>
                        </div>
                    )}

                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex gap-3 text-sm",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={cn(
                                "p-3 rounded-lg max-w-[80%]",
                                msg.role === 'user'
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-muted rounded-tl-none"
                            )}>
                                {msg.content}

                                {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && (
                                    <ThoughtsDisplay thoughts={msg.thoughts} />
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-muted p-3 rounded-lg rounded-tl-none flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-xs text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

// This component is shared and imported
// See: components/dashboard/ThoughtsDisplay.tsx


