import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/useChat";
import { ThoughtsDisplay } from "@/components/dashboard/ThoughtsDisplay";

interface ChatPageProps {
    messages: Message[];
    isLoading: boolean;
    onSend: (message: string) => void;
    onClear: () => void;
}

export function ChatPage({ messages, isLoading, onSend, onClear }: ChatPageProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSend(input.trim());
        setInput("");
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bot className="h-8 w-8 text-primary" />
                        AI Data Analyst
                    </h1>
                    <p className="text-muted-foreground">Deep dive into your health metrics with natural language.</p>
                </div>
                <Button variant="outline" size="sm" onClick={onClear} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear History
                </Button>
            </div>

            <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground py-20">
                                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium">No messages yet</h3>
                                <p className="mb-6">Start a conversation to analyze your data.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto text-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-w-4xl mx-auto text-xs">
                                        {[
                                            // Trends & Aggregations
                                            "How is my sleep score trending over the last 90 days?",
                                            "Which month had the highest average activity score in 2024?",
                                            "What is my average HRV on weekends vs weekdays?",

                                            // Complex Joins
                                            "What is my average sleep efficiency on days with high activity (score > 85)?",
                                            "List days where sleep score was < 70 but readiness was > 80",
                                            "On days where I worked out, what was my average sleep latency?",

                                            // Correlations & Insights
                                            "Is there a correlation between my total calories and deep sleep?",
                                            "How does my readiness compare on days with high vs low stress?",
                                            "Do I sleep longer on weekends?",

                                            // Specific Data Points
                                            "Show me my lowest heart rate during sleep for the last 30 days",
                                            "What was my best sleep score in 2024 and what day was it?",
                                            "List all tags I used last month",

                                            // Advanced/Tricky
                                            "What is my average readiness score when previous night's sleep was bad (< 70)?",
                                            "Show me the distribution of my sleep scores (Low, Medium, High)",
                                            "What is my average vascular age trend?",
                                            "How often does my ring battery drop below 20%?",
                                            "Compare my average deep sleep in winter (Dec-Feb) vs summer (Jun-Aug)",
                                            "What is my average bedtime on weekends?"
                                        ].map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => onSend(q)}
                                                className="p-3 bg-muted/50 hover:bg-muted rounded-lg text-left transition-colors border border-transparent hover:border-border"
                                            >
                                                "{q}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-4",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                </div>
                                <div className={cn(
                                    "max-w-[80%] space-y-2",
                                    msg.role === 'user' ? "items-end flex flex-col" : "items-start"
                                )}>
                                    <div className={cn(
                                        "p-4 rounded-2xl shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted rounded-tl-none"
                                    )}>
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </div>
                                    </div>

                                    {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && (
                                        <ThoughtsDisplay thoughts={msg.thoughts} />
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="bg-muted p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Analyzing data...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background/50 backdrop-blur">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2 max-w-4xl mx-auto"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask detailed questions about your health data..."
                            disabled={isLoading}
                            className="flex-1 h-12 text-base"
                        />
                        <Button type="submit" size="icon" className="h-12 w-12" disabled={isLoading || !input.trim()}>
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}




