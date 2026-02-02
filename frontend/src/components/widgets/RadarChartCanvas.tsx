import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useTheme } from '@/components/theme-provider';

// Register ChartJS components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface RadarChartCanvasProps {
    data: any[];
    dataKey: string;
    axisKey?: string;
    color?: string;
}

export function RadarChartCanvas({ data, dataKey, axisKey = "subject", color = "#8AB4F8" }: RadarChartCanvasProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data available for radar chart
            </div>
        );
    }

    const chartData = {
        labels: data.map(d => d[axisKey]),
        datasets: [
            {
                label: 'Value',
                data: data.map(d => d[dataKey]),
                backgroundColor: `${color}80`, // 50% opacity
                borderColor: color,
                borderWidth: 2,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: color,
            },
        ],
    };

    const options: ChartOptions<'radar'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                titleColor: isDark ? '#f3f4f6' : '#111827',
                bodyColor: isDark ? '#f3f4f6' : '#111827',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderWidth: 1,
            }
        },
        scales: {
            r: {
                angleLines: {
                    color: isDark ? '#374151' : '#e5e7eb'
                },
                grid: {
                    color: isDark ? '#374151' : '#e5e7eb'
                },
                pointLabels: {
                    color: isDark ? '#9ca3af' : '#6b7280',
                    font: {
                        size: 11
                    }
                },
                ticks: {
                    display: false, // Hide radial ticks for cleaner look
                    backdropColor: 'transparent',
                    stepSize: 20 // Optional: nice steps
                },
                min: 0,
                max: 100,
            }
        }
    };

    return (
        <div className="w-full h-full min-h-[200px]">
            <Radar data={chartData} options={options} />
        </div>
    );
}
