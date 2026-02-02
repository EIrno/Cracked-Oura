import { parseISO, addDays, format } from 'date-fns';
import type { TimeSeriesPoint, NormalizedData } from '@/types/data';

export function normalizeTimeSeriesData(
    data: any[],
    primaryKey: string,
    selectedDayIndex: number | null = null,
    requestedStart?: string,
    requestedEnd?: string
): NormalizedData {
    if ((!data || data.length === 0) && (!requestedStart || !requestedEnd)) {
        return { data: [], isIntraday: false };
    }

    // 1. Detect Data Type (Daily vs Intraday)
    // 1. Detect Data Type (Daily vs Intraday)
    let isIntraday = false;
    let isFlatIntraday = false;

    if (data && data.length > 0) {
        let firstVal = data[0][primaryKey];
        if (typeof firstVal === 'string') {
            try { firstVal = JSON.parse(firstVal); } catch (e) { }
        }
        const isIntradayNested = Array.isArray(firstVal) || (typeof firstVal === 'object' && firstVal !== null && Array.isArray((firstVal as any).items));
        isFlatIntraday = data[0]?.date?.includes('T');
        isIntraday = isIntradayNested || isFlatIntraday;
    }

    // --- CASE 1: DAILY DATA ---
    if (!isIntraday) {
        // Sort data by date
        const sorted = [...(data || [])].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Determine boundaries
        let startDateStr = sorted.length > 0 ? sorted[0].date.split('T')[0] : (requestedStart || new Date().toISOString().split('T')[0]);
        let endDateStr = sorted.length > 0 ? sorted[sorted.length - 1].date.split('T')[0] : (requestedEnd || new Date().toISOString().split('T')[0]);

        // Override with requested dates if provided
        if (requestedStart) startDateStr = requestedStart;
        if (requestedEnd) endDateStr = requestedEnd;

        const filledData: TimeSeriesPoint[] = [];
        let current = parseISO(startDateStr);
        let dataIndex = 0;

        while (true) {
            // Use format to get local date string (matches input)
            const dateStr = format(current, 'yyyy-MM-dd');
            if (dateStr > endDateStr) break;

            const item = sorted[dataIndex];
            const itemDateStr = item ? (item.date.includes('T') ? item.date.split('T')[0] : item.date) : '';

            if (item && itemDateStr === dateStr) {
                filledData.push(item);
                dataIndex++;
                // Handle duplicates if any
                while (sorted[dataIndex] && (sorted[dataIndex].date.includes('T') ? sorted[dataIndex].date.split('T')[0] : sorted[dataIndex].date) === dateStr) {
                    dataIndex++;
                }
            } else {
                // Check if we passed the item (shouldn't happen if sorted)
                if (item && itemDateStr < dateStr) {
                    dataIndex++;
                    continue; // Retry with next item
                }

                // Missing day, insert null
                filledData.push({
                    date: dateStr,
                    value: null,
                    [primaryKey]: null
                } as any);
            }

            // Increment day safely
            current = addDays(current, 1);
        }

        return { data: filledData, isIntraday: false };
    }

    // --- CASE 2: INTRADAY DATA ---
    let rawItems: any[] = [];
    let targetIndex = 0;
    let dayData: any = {};

    if (isFlatIntraday) {
        // Flat data (e.g. heart_rate from useMultiOuraQuery)
        rawItems = data.map((d: any) => {
            const val = d[primaryKey];
            if (val === undefined || val === null) return null;
            if (typeof val === 'object') return { ...val, timestamp: d.date };
            return { value: val, timestamp: d.date };
        }).filter(Boolean);

        dayData = data[data.length - 1] || {};
    } else {
        // Nested data (e.g. readiness.contributors)
        targetIndex = selectedDayIndex ?? data.length - 1;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= data.length) targetIndex = data.length - 1;

        dayData = data[targetIndex];
        let val = dayData[primaryKey];
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) { }
        }
        rawItems = Array.isArray(val) ? val : (val as any)?.items;
    }

    if (!rawItems || !Array.isArray(rawItems)) {
        return { data: [], isIntraday: false };
    }

    // Process Items: Linear Grid Generation
    // We only support timestamped data now.
    const hasExplicitTimestamp = rawItems[0] && typeof rawItems[0] === 'object' && 'timestamp' in rawItems[0];
    const chartData: TimeSeriesPoint[] = [];

    if (hasExplicitTimestamp) {
        // 1. Parse all items and sort by time
        const itemsWithTime = rawItems.map((val: any) => {
            let time = 0;
            if (val && typeof val === 'object' && val.timestamp) {
                time = parseISO(val.timestamp).getTime();
            }

            // Extract numeric value
            let numericVal = val;
            if (typeof val === 'object' && val !== null) {
                numericVal = val.bpm ?? val.score ?? val.value ?? val.average ?? null;
            }

            return { time, val: numericVal, original: val };
        }).filter(i => i.time > 0).sort((a: any, b: any) => a.time - b.time);

        if (itemsWithTime.length > 0 || (requestedStart && requestedEnd)) {
            // Determine start/end times
            let startTimeMs = itemsWithTime.length > 0 ? itemsWithTime[0].time : 0;
            let endTimeMs = itemsWithTime.length > 0 ? itemsWithTime[itemsWithTime.length - 1].time : 0;

            if (requestedStart) {
                startTimeMs = parseISO(requestedStart).getTime();
            }
            if (requestedEnd) {
                const endDate = parseISO(requestedEnd);
                // End of day (23:59:59 +)
                endTimeMs = addDays(endDate, 1).getTime() - 1;
            }

            // If we still don't have valid times (e.g. no data and no requested range), bail
            if (startTimeMs === 0 || endTimeMs === 0) return { data: [], isIntraday: false };

            const totalDuration = endTimeMs - startTimeMs;


            // Adaptive Downsampling
            const MAX_POINTS = 2000;
            const minInterval = totalDuration / MAX_POINTS;

            // Define available intervals (ms)
            const INTERVALS = [
                5 * 60 * 1000,        // 5 mins
                15 * 60 * 1000,       // 15 mins
                30 * 60 * 1000,       // 30 mins
                60 * 60 * 1000,       // 1 hour
                4 * 60 * 60 * 1000,   // 4 hours
                12 * 60 * 60 * 1000,  // 12 hours
                24 * 60 * 60 * 1000   // 1 day
            ];

            // Find smallest interval that keeps points under MAX_POINTS
            let INTERVAL = INTERVALS[0];
            for (const interval of INTERVALS) {
                if (interval >= minInterval) {
                    INTERVAL = interval;
                    break;
                }
            }

            let itemIndex = 0;

            // 2. Iterate from start to end in 5-minute steps
            for (let t = startTimeMs; t <= endTimeMs; t += INTERVAL) {
                // Find if there is a data point close to this time (within +/- 2.5 mins)
                let foundItem = null;

                // Advance itemIndex to current time window
                while (itemIndex < itemsWithTime.length && itemsWithTime[itemIndex].time < t - INTERVAL / 2) {
                    itemIndex++;
                }

                // Check if current item matches
                if (itemIndex < itemsWithTime.length) {
                    const itemTime = itemsWithTime[itemIndex].time;
                    if (Math.abs(itemTime - t) <= INTERVAL / 2) {
                        foundItem = itemsWithTime[itemIndex];
                    }
                }

                if (foundItem) {
                    chartData.push({
                        date: new Date(t).toISOString(),
                        value: foundItem.val,
                        [primaryKey]: foundItem.val
                    });
                } else {
                    // Insert null for missing interval to maintain linearity
                    chartData.push({
                        date: new Date(t).toISOString(),
                        value: null,
                        [primaryKey]: null
                    });
                }
            }
        }
    } else {
        console.warn("normalizeTimeSeriesData: Intraday data missing timestamps", rawItems);
    }

    return {
        data: chartData,
        isIntraday: true,
        currentDay: dayData.date,
        currentIndex: targetIndex,
        totalDays: data.length
    };
}
