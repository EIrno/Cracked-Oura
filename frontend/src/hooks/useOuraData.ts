import { useState, useEffect } from 'react';

import { api } from '@/lib/api';

export interface DailyScore {
    score: number;
    contributors: any;
    activity_balance?: number;
    body_temperature?: number;
    hrv_balance?: number;
    previous_day_activity?: number;
    previous_night?: number;
    recovery_index?: number;
    resting_heart_rate?: number;
    sleep_balance?: number;
    steps?: number;
    total_sleep_duration?: number;
}

export interface SleepSession {
    sleep_phase_5_min: string;
    sleep_phase_30_sec: string;
    deep_sleep_duration: number;
    rem_sleep_duration: number;
    light_sleep_duration: number;
    awake_time: number;
    start_time: string;
    hr_data: any;
    hrv_data: any;
    type?: string;
}

export interface ResilienceData {
    day: string;
    level: string;
    contributors: any;
    sleep_recovery?: number;
    daytime_recovery?: number;
    stress?: number;
}

export const useOuraData = (date: string) => {
    const [data, setData] = useState<any>(null);
    const [history, setHistory] = useState<{ sleep: any[], activity: any[], readiness: any[] }>({ sleep: [], activity: [], readiness: [] });

    useEffect(() => {
        if (!date) return;

        // Fetch full daily dump with retry
        let attempts = 0;
        const maxAttempts = 10;

        const fetchData = () => {
            api.getDailyData(date)
                .then(data => setData(data))
                .catch(() => {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(fetchData, 1000);
                    }
                });
        };
        fetchData();

        // Fetch history for heatmaps (last 365 days)
        const oneYearAgo = new Date(new Date(date).setDate(new Date(date).getDate() - 365)).toISOString().split('T')[0];
        Promise.all([
            api.getQuery('sleep.score', oneYearAgo, date),
            api.getQuery('activity.score', oneYearAgo, date),
            api.getQuery('readiness.score', oneYearAgo, date)
        ]).then(([sleepData, activityData, readinessData]) => {
            setHistory({
                sleep: sleepData,
                activity: activityData,
                readiness: readinessData
            });
        }).catch(err => console.error("Error fetching history:", err));

    }, [date]);



    return {
        // Pass through the raw data structure but add formatted helpers where needed
        ...data,
        // Adapter: Find primary sleep session (longest one) for widgets expecting singular 'sleep_session'
        sleep_session: data?.sleep_sessions?.reduce((longest: any, current: any) => {
            if (!longest) return current;
            return (current.total_sleep_duration || 0) > (longest.total_sleep_duration || 0) ? current : longest;
        }, null),
        sleepSessions: data?.sleep_sessions || [],
        readiness: data?.readiness ? {
            ...data.readiness,
        } : null,
        activity: data?.activity ? {
            ...data.activity,
            steps: data.activity.steps
        } : null,
        sleep: data?.sleep ? {
            ...data.sleep,
            total: data.sleep.total_sleep_duration ? Math.round(data.sleep.total_sleep_duration / 60) : 0, // in minutes
            average_spo2: data.sleep.average_spo2,
            breathing_disturbance_index: data.sleep.breathing_disturbance_index
        } : null,
        resilience: data?.resilience ? [data.resilience] : [], // Adapter for array expectation if needed
        history
    };
};
