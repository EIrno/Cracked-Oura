import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function isIntradayKey(key: string): boolean {
    if (!key) return false;
    const lowerKey = key.toLowerCase();

    // Specific intraday fields
    return (
        lowerKey.includes('hr_data') ||
        lowerKey.includes('hrv_data') ||
        lowerKey.includes('movement') ||
        lowerKey.includes('sleep_phase') ||
        lowerKey.includes('hypnogram') ||
        lowerKey.includes('class_5_min') ||
        lowerKey.includes('met') ||
        (lowerKey.includes('stress') && !lowerKey.startsWith('resilience'))
    );
}
