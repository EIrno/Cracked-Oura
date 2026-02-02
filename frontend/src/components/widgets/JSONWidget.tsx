import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";

interface JSONWidgetProps {
    data: any;
    date?: string;
    fetchFullDump?: boolean;
}

const JsonNode = ({ label, data, level = 0 }: { label: string, data: any, level?: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isObject = data !== null && typeof data === 'object';
    const isEmpty = isObject && Object.keys(data).length === 0;

    if (!isObject) {
        let color = "text-green-400"; // Strings
        if (typeof data === 'number') color = "text-blue-400";
        if (typeof data === 'boolean') color = "text-purple-400";
        if (data === null) color = "text-gray-400";

        return (
            <div style={{ paddingLeft: level * 20 }} className="font-mono text-xs py-0.5 hover:bg-white/5 rounded px-1 flex items-start">
                <span className="text-muted-foreground mr-2 shrink-0">{label}:</span>
                <span className={cn("break-all", color)}>{JSON.stringify(data)}</span>
            </div>
        );
    }

    return (
        <div className="font-mono text-xs">
            <div
                onClick={() => !isEmpty && setIsOpen(!isOpen)}
                style={{ paddingLeft: level * 20 }}
                className={cn(
                    "flex items-center gap-1 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5 select-none",
                    isEmpty && "opacity-50 cursor-default"
                )}
            >
                <span className="text-muted-foreground w-4 flex justify-center shrink-0">
                    {isEmpty ? '•' : (isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
                </span>
                <span className="text-foreground font-medium">{label}</span>
                {Array.isArray(data) && (
                    <span className="text-muted-foreground text-[10px] ml-1">[{data.length}]</span>
                )}
            </div>

            {isOpen && (
                <div className="border-l border-border ml-2 pl-2 my-1">
                    {Object.entries(data).map(([key, value]) => (
                        <JsonNode key={key} label={key} data={value} level={0} />
                    ))}
                </div>
            )}
        </div>
    );
};

export function JSONWidget({ data, date, fetchFullDump }: JSONWidgetProps) {
    const [fullData, setFullData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (fetchFullDump && date) {
            setLoading(true);
            fetch(`http://localhost:8000/api/days/${date}?include_details=true`)
                .then(res => res.json())
                .then(json => {
                    setFullData(json);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching full dump:", err);
                    setLoading(false);
                });
        } else {
            setFullData(null);
        }
    }, [date, fetchFullDump]);

    const displayData = fetchFullDump ? fullData : data;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading raw data...
            </div>
        );
    }

    if (!displayData) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
            </div>
        );
    }

    return (
        <ScrollArea className="h-full w-full rounded-md border bg-card p-2">
            <div className="space-y-1">
                {Object.entries(displayData).map(([key, value]) => (
                    <JsonNode key={key} label={key} data={value} />
                ))}
            </div>
        </ScrollArea>
    );
}
