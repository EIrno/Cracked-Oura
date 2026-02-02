import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

interface ScoreGaugeCanvasProps {
    score: number;
    title?: string;
    color?: string;
    className?: string;
}

export function ScoreGaugeCanvas({ score, title, color, className }: ScoreGaugeCanvasProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Determine color based on score if not provided
    const getScoreColor = (s: number) => {
        if (s >= 85) return "#4ade80"; // green-400
        if (s >= 70) return "#facc15"; // yellow-400
        return "#f87171"; // red-400
    };

    const finalColor = color || getScoreColor(score);
    const backgroundColor = isDark ? '#374151' : '#e5e7eb'; // Track color

    const chartData = {
        labels: ['Score', 'Remaining'],
        datasets: [
            {
                data: [score, 100 - score],
                backgroundColor: [finalColor, backgroundColor],
                borderWidth: 0,
                borderRadius: 20, // Rounded ends
                cutout: '85%', // Thickness of the ring
            },
        ],
    };

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0 // Instant resize
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false, // Disable tooltip for gauge
            }
        },
        rotation: -90, // Start from top
        circumference: 360, // Full circle
    };

    return (
        <div className={cn("h-full w-full flex flex-col items-center justify-center relative", className)}>
            <div className="w-full h-full p-4">
                <Doughnut data={chartData} options={options} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold" style={{ color: finalColor }}>
                    {score}
                </span>
                {title && <span className="text-sm text-muted-foreground mt-1">{title}</span>}
            </div>
        </div>
    );
}
