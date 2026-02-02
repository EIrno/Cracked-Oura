import { useState, useEffect } from 'react';

import { api } from '@/lib/api';

interface QueryResult {
    date: string;
    value: number;
}

export function useOuraQuery(path: string, startDate?: string, endDate?: string) {
    const [data, setData] = useState<QueryResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!path) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const json = await api.getQuery(path, startDate, endDate);
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error("Query Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [path, startDate, endDate]);

    return { data, loading, error };
}
