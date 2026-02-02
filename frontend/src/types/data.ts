export interface TimeSeriesPoint {
    date: string; // ISO string
    value: number | null;
    original?: any; // Keep original data for tooltips
    [key: string]: any; // Allow dynamic keys for multi-series
}

export interface NormalizedData {
    data: TimeSeriesPoint[];
    isIntraday: boolean;
    currentDay?: string;
    currentIndex?: number;
    totalDays?: number;
}
