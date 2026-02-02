import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { cn, isIntradayKey } from "@/lib/utils";
import { DataFieldSelector } from "./DataFieldSelector";
import type { WidgetInstance } from "@/types";


interface WidgetEditorPanelProps {
    onClose: () => void;
    onSave: (widget: Partial<WidgetInstance>) => void;
    onChange?: (widget: WidgetInstance) => void;
    widget?: WidgetInstance; // If provided, we are editing
}

export function WidgetEditorPanel({ onClose, onSave, onChange, widget }: WidgetEditorPanelProps) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"score" | "trend" | "metric" | "bar" | "radar" | "json" | "table">("score");
    const [dataKey, setDataKey] = useState("");
    const [dataKeys, setDataKeys] = useState<string[]>([]);
    const [color, setColor] = useState("#8AB4F8");
    const [dateRangeType, setDateRangeType] = useState<'all' | 'custom' | 'to_today' | 'last_30' | 'last_90' | 'selected_day' | 'relative'>('last_30');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showPoints, setShowPoints] = useState(false);

    useEffect(() => {
        if (widget) {
            setTitle(widget.title);
            setType(widget.type as any);
            setDataKey(widget.config.dataKey || "");
            setDataKeys(widget.config.dataKeys || (widget.config.dataKey ? [widget.config.dataKey] : []));
            setColor(widget.config.color || "#8AB4F8");
            setShowPoints(widget.config.showPoints || false);

            // Date Range
            if (widget.config.dateRange) {
                setDateRangeType(widget.config.dateRange.type);
                setStartDate(widget.config.dateRange.startDate || "");
                setEndDate(widget.config.dateRange.endDate || "");
            } else {
                setDateRangeType('last_30');
                setStartDate("");
                setEndDate("");
            }
        } else {
            // Defaults for new widget
            setTitle("New Widget");
            setType("score");
            setDataKey("sleep.score");
            setDataKeys(["sleep.score"]);
            setColor("#8AB4F8");
            setShowPoints(false);
            setDateRangeType('last_30');
            setStartDate("");
            setEndDate("");
        }
    }, [widget?.id]); // Only reset when widget ID changes, not on every update

    // Helper to update parent
    const updateWidget = (updates: Partial<WidgetInstance>) => {
        if (widget && onChange) {
            onChange({
                ...widget,
                ...updates
            });
        }
    };

    // Define available data sources and which widget types they support
    const DATA_OPTIONS = [
        { value: "sleep.score", label: "sleep.score", types: ["score", "metric", "trend", "table"] },
        { value: "readiness.score", label: "readiness.score", types: ["score", "metric", "trend", "table"] },
        { value: "activity.score", label: "activity.score", types: ["score", "metric", "trend", "table"] },
        { value: "sleep.total_sleep_duration", label: "sleep.total_sleep_duration", types: ["metric", "trend", "table"] },
        { value: "sleep.average_spo2", label: "sleep.average_spo2", types: ["metric", "trend", "table"] },
        { value: "sleep.breathing_disturbance_index", label: "sleep.breathing_disturbance_index", types: ["metric", "trend", "table"] },
        { value: "activity.steps", label: "activity.steps", types: ["metric", "trend", "table"] },
        { value: "sleep.contributors", label: "sleep.contributors", types: ["bar", "radar", "table"] },
        { value: "readiness.contributors", label: "readiness.contributors", types: ["bar", "radar", "table"] },
        { value: "activity.contributors", label: "activity.contributors", types: ["bar", "radar", "table"] },
        { value: "root", label: "full_dump (json)", types: ["json"] },
        { value: "sleep", label: "sleep (json)", types: ["json"] },
        { value: "readiness", label: "readiness (json)", types: ["json"] },
        { value: "activity", label: "activity (json)", types: ["json"] },
    ];



    const handleSave = () => {
        onSave({
            ...(widget || {}),
            title,
            type,
            config: {
                dataKey,
                dataKeys,
                color,
                showPoints,
                dateRange: {
                    type: dateRangeType,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined
                }
            }
        });
    };

    return (
        <div className="w-[400px] border-l bg-card flex flex-col h-full">
            <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">{widget ? "Edit Widget" : "Add Widget"}</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            updateWidget({ title: e.target.value });
                        }}
                        placeholder="Widget Title"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Widget Type</Label>
                    <Select
                        value={type}
                        onValueChange={(v: "score" | "trend" | "metric" | "bar" | "radar" | "json" | "table") => {
                            setType(v);
                            // Find the first valid data source for this new type
                            const validOptions = DATA_OPTIONS.filter(opt => opt.types.includes(v));
                            let newDataKey = dataKey;
                            if (validOptions.length > 0) {
                                newDataKey = validOptions[0].value;
                                setDataKey(newDataKey);
                                setDataKeys([newDataKey]);
                            }

                            updateWidget({
                                type: v,
                                config: { ...widget?.config, dataKey: newDataKey, dataKeys: [newDataKey], color }
                            });
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="score">Score Gauge</SelectItem>
                            <SelectItem value="trend">Trend Chart</SelectItem>
                            <SelectItem value="metric">Metric Number</SelectItem>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="radar">Radar Chart</SelectItem>
                            <SelectItem value="table">Table</SelectItem>
                            <SelectItem value="json">JSON Viewer</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        This determines how the data is visualized.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Data Source</Label>
                    <div className="space-y-2">
                        {/* Show selected keys for multi-select */}
                        {(type === 'table' || type === 'trend' || type === 'bar' || type === 'radar') && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {dataKeys.map(key => (
                                    <div key={key} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                        <span>{key}</span>
                                        <button
                                            onClick={() => {
                                                const newKeys = dataKeys.filter(k => k !== key);
                                                setDataKeys(newKeys);
                                                // If no keys left, clear primary dataKey too
                                                const newDataKey = newKeys.length > 0 ? newKeys[newKeys.length - 1] : "";
                                                if (newKeys.length === 0) setDataKey("");

                                                updateWidget({
                                                    config: { ...widget?.config, dataKeys: newKeys, dataKey: newDataKey, color }
                                                });
                                            }}
                                            className="hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Input
                            value={dataKey}
                            onChange={(e) => {
                                setDataKey(e.target.value);
                                updateWidget({
                                    config: { ...widget?.config, dataKey: e.target.value, color }
                                });
                            }}
                            placeholder="Select below or type path..."
                            className="font-mono text-xs"
                        />
                        <DataFieldSelector
                            selectedPath={dataKey}
                            selectedPaths={dataKeys}
                            multiSelect={type === 'table' || type === 'trend' || type === 'bar' || type === 'radar'}
                            onSelect={(path) => {
                                if (type === 'table' || type === 'trend' || type === 'bar' || type === 'radar') {
                                    // Multi-select logic
                                    let newKeys = [...dataKeys];
                                    if (newKeys.includes(path)) {
                                        newKeys = newKeys.filter(k => k !== path);
                                    } else {
                                        newKeys.push(path);
                                    }
                                    // Also update primary dataKey for backward compat or single-view
                                    // Check compatibility
                                    if (dataKeys.length > 0) {
                                        const firstKey = dataKeys[0];
                                        const isFirstIntraday = isIntradayKey(firstKey);
                                        const isNewIntraday = isIntradayKey(path);

                                        if (isFirstIntraday !== isNewIntraday) {
                                            // Incompatible types
                                            // Ideally show a toast, but for now just ignore or alert
                                            console.warn("Cannot mix Intraday and Daily data points.");
                                            return;
                                        }
                                    }

                                    setDataKeys(newKeys);

                                    // Update primary dataKey to the last selected one, or clear if empty
                                    // If we just removed 'path', we should pick another one.
                                    const finalDataKey = newKeys.length > 0 ? newKeys[newKeys.length - 1] : "";

                                    setDataKey(finalDataKey);
                                    updateWidget({
                                        config: { ...widget?.config, dataKeys: newKeys, dataKey: finalDataKey, color }
                                    });
                                } else {
                                    // Single select
                                    setDataKey(path);
                                    updateWidget({
                                        config: { ...widget?.config, dataKey: path, color }
                                    });
                                }
                            }}
                            isSelectable={(field) => {
                                // 1. Check for incompatible field names (timestamp, etc.)
                                if (type === 'trend' || type === 'bar' || type === 'radar') {
                                    const lower = field.toLowerCase();
                                    if (lower.endsWith('_time') ||
                                        lower.endsWith('_date') ||
                                        lower.endsWith('_id') ||
                                        lower.endsWith('_code') ||
                                        lower === 'comment' ||
                                        lower === 'day' ||
                                        lower === 'timestamp') {
                                        return false;
                                    }
                                }



                                return true;
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { color: '#8AB4F8', label: 'Blue' },
                            { color: '#4ade80', label: 'Green' },
                            { color: '#facc15', label: 'Yellow' },
                            { color: '#f87171', label: 'Red' },
                            { color: '#c084fc', label: 'Purple' },
                            { color: '#fb923c', label: 'Orange' },
                            { color: '#e879f9', label: 'Pink' }
                        ].map(({ color: c, label }) => (
                            <div
                                key={c}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-secondary/50 transition-all",
                                    color === c ? "border-primary bg-secondary/50" : "border-transparent"
                                )}
                                onClick={() => {
                                    setColor(c);
                                    updateWidget({
                                        config: { ...widget?.config, dataKey, color: c }
                                    });
                                }}
                            >
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                                <span className="text-xs">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {type === 'trend' && (
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="show-points" className="flex flex-col space-y-1">
                            <span>Show Data Points</span>
                            <span className="font-normal text-xs text-muted-foreground">Show dots for each data point</span>
                        </Label>
                        <Switch
                            id="show-points"
                            checked={showPoints}
                            onCheckedChange={(checked) => {
                                setShowPoints(checked);
                                updateWidget({
                                    config: { ...widget?.config, dataKey, color, showPoints: checked }
                                });
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="p-6 border-t bg-card">
                <div className="flex gap-2">
                    <Button variant="outline" className="w-full" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="w-full" onClick={handleSave}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
}
