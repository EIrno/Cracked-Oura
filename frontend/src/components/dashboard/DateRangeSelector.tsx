import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, ArrowRight, Lock } from "lucide-react";
import { format, parseISO, subDays, subHours, subMinutes, subYears, isValid, parse } from "date-fns";
import { isIntradayKey } from "@/lib/utils";
import type { WidgetInstance } from "@/types";

interface DateRangeSelectorProps {
    widget: WidgetInstance;
    onUpdate: (updates: Partial<WidgetInstance>) => void;
    selectedDate?: Date;
    isLocked?: boolean;
}

export function DateRangeSelector({ widget, onUpdate, selectedDate = new Date(), isLocked = false }: DateRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempRange, setTempRange] = useState<{ from: Date | undefined; to?: Date | undefined } | undefined>(undefined);
    const [inputFrom, setInputFrom] = useState("");
    const [inputTo, setInputTo] = useState("");

    // Initialize temp range and inputs from widget config when opening
    useEffect(() => {
        if (isOpen) {
            const { type, startDate, endDate, value, unit, anchor } = widget.config.dateRange || {};

            let fromDate: Date | undefined;
            let toDate: Date | undefined;
            let fromStr = "";
            let toStr = "";

            const formatStr = 'yyyy-MM-dd';

            if (type === 'custom' && startDate) {
                fromDate = parseISO(startDate);
                toDate = endDate ? parseISO(endDate) : undefined;
                fromStr = format(fromDate, formatStr);
                toStr = toDate ? format(toDate, formatStr) : "";
            } else if (type === 'relative') {
                if (anchor === 'selected_date') {
                    toStr = "selection";
                    toDate = selectedDate;
                } else {
                    toStr = "today";
                    toDate = new Date();
                }

                if (value && unit) {
                    let unitStr = 'd';
                    if (unit === 'hours') unitStr = 'h';
                    if (unit === 'minutes') unitStr = 'm';
                    if (unit === 'years') unitStr = 'y';

                    fromStr = `${value}${unitStr}`;

                    if (unit === 'days') fromDate = subDays(toDate, value);
                    else if (unit === 'hours') fromDate = subHours(toDate, value);
                    else if (unit === 'minutes') fromDate = subMinutes(toDate, value);
                    else if (unit === 'years') fromDate = subYears(toDate, value);
                }
            } else if (type === 'selected_day') {
                fromStr = "selection";
                toStr = "selection";
                fromDate = selectedDate;
                toDate = selectedDate;
            } else if (type === 'last_30') {
                fromStr = "30d";
                toStr = "today";
                toDate = new Date();
                fromDate = subDays(toDate, 30);
            } else if (type === 'last_90') {
                fromStr = "90d";
                toStr = "today";
                toDate = new Date();
                fromDate = subDays(toDate, 90);
            } else {
                // Default to 7d - today if no config
                fromStr = "7d";
                toStr = "today";
                toDate = new Date();
                fromDate = subDays(toDate, 7);
            }

            setTempRange({ from: fromDate, to: toDate });
            setInputFrom(fromStr);
            setInputTo(toStr);
        }
    }, [isOpen, widget.config.dateRange, selectedDate]);



    const parseInput = (input: string): { date?: Date, isRelative?: boolean, value?: number, unit?: string, keyword?: string } => {
        const lower = input.toLowerCase().trim();

        // Keywords
        if (lower === 'today') return { date: new Date(), keyword: 'today' };
        if (lower === 'selection') return { date: selectedDate, keyword: 'selection' };

        // Handle "today HH:mm"
        if (lower.startsWith('today ')) {
            const timePart = lower.replace('today ', '');
            const today = new Date();
            const parsedTime = parse(timePart, 'HH:mm', today);
            if (isValid(parsedTime)) return { date: parsedTime };
        }

        // Relative patterns
        const daysMatch = lower.match(/^(\d+)d$/);
        if (daysMatch) return { isRelative: true, value: parseInt(daysMatch[1]), unit: 'days' };

        const yearsMatch = lower.match(/^(\d+)[ya]$/); // 'y' or 'a'
        if (yearsMatch) return { isRelative: true, value: parseInt(yearsMatch[1]), unit: 'years' };

        // Absolute dates
        // Try ISO first
        let parsed = parseISO(input);
        if (isValid(parsed)) return { date: parsed };

        // Try yyyy-MM-dd
        parsed = parse(input, 'yyyy-MM-dd', new Date());
        if (isValid(parsed)) return { date: parsed };

        return {};
    };

    const handleApply = () => {
        const from = parseInput(inputFrom);
        const to = parseInput(inputTo);

        // Case 1: Relative range
        if (from.isRelative && from.value && from.unit && to.keyword) {
            onUpdate({
                config: {
                    ...widget.config,
                    dateRange: {
                        type: 'relative',
                        value: from.value,
                        unit: from.unit as any,
                        anchor: to.keyword === 'selection' ? 'selected_date' : 'today'
                    }
                }
            });
            setIsOpen(false);
            return;
        }

        // Case 2: Keywords
        if (from.keyword === 'selection' && to.keyword === 'selection') {
            onUpdate({
                config: {
                    ...widget.config,
                    dateRange: { type: 'selected_day' }
                }
            });
            setIsOpen(false);
            return;
        }

        // Case 3: Absolute dates
        let startDate = from.date;
        let endDate = to.date;

        // Resolve relative start date if end date is known
        if (from.isRelative && from.value && from.unit && endDate) {
            if (from.unit === 'days') startDate = subDays(endDate, from.value);
            else if (from.unit === 'hours') startDate = subHours(endDate, from.value);
            else if (from.unit === 'minutes') startDate = subMinutes(endDate, from.value);
            else if (from.unit === 'years') startDate = subYears(endDate, from.value);
        }

        if (startDate) {
            onUpdate({
                config: {
                    ...widget.config,
                    dateRange: {
                        type: 'custom',
                        startDate: format(startDate, 'yyyy-MM-dd'), // Store date only
                        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
                    }
                }
            });
            setIsOpen(false);
        }
    };

    const handlePreset = (type: any, value?: number, unit?: string, anchor?: string) => {
        onUpdate({
            config: {
                ...widget.config,
                dateRange: {
                    type,
                    value,
                    unit: unit as any,
                    anchor: anchor as any
                }
            }
        });
        setIsOpen(false);
    };

    const effectiveIsLocked = isLocked || isIntradayKey(widget.config.dataKey || widget.config.dataKeys?.[0] || '');

    const getLabel = () => {
        if (effectiveIsLocked) return format(selectedDate, 'd.M.yyyy');
        const { type, value, unit, anchor } = widget.config.dateRange || {};
        if (type === 'selected_day') return 'Selection';
        if (type === 'relative') {
            const anchorLabel = anchor === 'selected_date' ? 'selection' : 'today';
            let unitStr = 'd';
            if (unit === 'hours') unitStr = 'h';
            if (unit === 'minutes') unitStr = 'm';
            if (unit === 'years') unitStr = 'y';
            return `${value}${unitStr} - ${anchorLabel}`;
        }
        if (type === 'last_30') return '30d - today';
        if (type === 'last_90') return '90d - today';
        if (type === 'all') return 'All Time';
        if (type === 'custom') return 'Custom';
        return '7d - today';
    };

    if (effectiveIsLocked) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1 shadow-sm relative z-[70]">
                        <Lock className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{format(selectedDate, 'd.M.yyyy')}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 text-xs text-muted-foreground" align="end">
                    This widget is locked to the daily view.
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1 shadow-sm relative z-[70]">
                    <CalendarIcon className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{getLabel()}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <div className="flex h-[380px]">
                    {/* Quick Ranges Column */}
                    <div className="w-[180px] border-r p-2 flex flex-col gap-1 overflow-y-auto">
                        <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                            Relative to Selection
                        </div>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8 font-normal"
                            onClick={() => handlePreset('selected_day')}>
                            Selection
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8 font-normal"
                            onClick={() => handlePreset('relative', 7, 'days', 'selected_date')}>
                            7d - selection
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8 font-normal"
                            onClick={() => handlePreset('relative', 30, 'days', 'selected_date')}>
                            30d - selection
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8 font-normal"
                            onClick={() => handlePreset('relative', 90, 'days', 'selected_date')}>
                            90d - selection
                        </Button>

                        <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 mt-2 uppercase tracking-wider">
                            Relative to Today
                        </div>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8 font-normal"
                            onClick={() => handlePreset('last_30')}>
                            30d - today
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8 font-normal"
                            onClick={() => handlePreset('last_90')}>
                            90d - today
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8 font-normal"
                            onClick={() => handlePreset('all')}>
                            All Time
                        </Button>
                    </div>

                    {/* Custom Range Column */}
                    <div className="flex flex-col w-[300px]">
                        <div className="p-3 border-b">
                            <div className="text-sm font-medium mb-2">Range</div>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <label className="text-[10px] text-muted-foreground">From</label>
                                    <Input
                                        className="h-8 text-xs"
                                        value={inputFrom}
                                        onChange={(e) => setInputFrom(e.target.value)}
                                        placeholder="e.g. 30d, today"
                                    />
                                </div>
                                <ArrowRight className="h-3 w-3 text-muted-foreground mt-4" />
                                <div className="flex-1">
                                    <label className="text-[10px] text-muted-foreground">To</label>
                                    <Input
                                        className="h-8 text-xs"
                                        value={inputTo}
                                        onChange={(e) => setInputTo(e.target.value)}
                                        placeholder="e.g. today"
                                    />
                                </div>
                            </div>
                            <Button size="sm" className="w-full mt-3 h-7 text-xs" onClick={handleApply}>
                                Apply
                            </Button>
                        </div>
                        <div className="p-2 flex-1 overflow-auto">
                            <Calendar
                                mode="range"
                                selected={tempRange}
                                onSelect={(range) => {
                                    setTempRange(range);
                                    if (range?.from) setInputFrom(format(range.from, 'yyyy-MM-dd'));
                                    if (range?.to) setInputTo(format(range.to, 'yyyy-MM-dd'));
                                    else setInputTo("");
                                }}
                                initialFocus
                                className="rounded-md border shadow-none w-full"
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
