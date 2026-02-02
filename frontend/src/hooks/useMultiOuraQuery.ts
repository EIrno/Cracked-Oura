import { useState, useEffect } from 'react';

import { api } from "@/lib/api";

interface QueryResult {
    date: string;
    value: any;
}

export function useMultiOuraQuery(paths: string[], startDate?: string, endDate?: string) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!paths || paths.length === 0) {
            setData([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {

                // Fetch all paths in parallel
                const promises = paths.map(async (path) => {
                    const data = await api.getQuery(path, startDate, endDate);
                    return { path, data: data as QueryResult[] };
                });

                const results = await Promise.all(promises);

                // Merge data by date
                const mergedMap = new Map<string, any>();

                results.forEach(({ path, data }) => {
                    data.forEach(item => {
                        const dateKey = item.date;
                        if (!mergedMap.has(dateKey)) {
                            mergedMap.set(dateKey, {
                                date: dateKey,
                                timestamp: dateKey // Ensure timestamp exists for charts
                            });
                        }
                        const entry = mergedMap.get(dateKey);

                        entry[path] = item.value;
                    });
                });

                // Convert map to array and sort by date
                const mergedArray = Array.from(mergedMap.values()).sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );

                setData(mergedArray);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error("Multi Query Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [JSON.stringify(paths), startDate, endDate]);

    return { data, loading, error };
}
