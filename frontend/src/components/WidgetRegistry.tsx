import { ScoreGaugeCanvas } from './widgets/ScoreGaugeCanvas';
import { SmartTrendWidgetCanvas } from './widgets/SmartTrendWidgetCanvas';
import { MetricWidget } from './widgets/MetricWidget';
import { BarChartCanvas } from './widgets/BarChartCanvas';
import { RadarChartCanvas } from './widgets/RadarChartCanvas';
import { JSONWidget } from './widgets/JSONWidget';
import type { WidgetInstance } from '@/types';

interface WidgetRegistryProps {
    widget: WidgetInstance;
    data?: any;
    date?: string;
    onUpdate?: (updates: Partial<WidgetInstance>) => void;
}

export const WidgetRegistry = ({ widget, data, date, onUpdate }: WidgetRegistryProps) => {
    // Helper to resolve dot notation
    const resolveData = (path: string) => {
        if (!path || path === 'root') return data;
        const keys = path?.split('.') || [];
        let value = data;
        for (const key of keys) {
            value = value?.[key];
        }
        return value;
    };

    switch (widget.type) {
        case 'score':
            const score = resolveData(widget.config.dataKey || '') || 0;
            const scoreLabel = widget.config.dataKey || 'Score';
            return (
                <ScoreGaugeCanvas
                    score={typeof score === 'number' ? score : 0}
                    title={scoreLabel}
                    color={widget.config.color}
                />
            );
        case 'trend':
            return (
                <SmartTrendWidgetCanvas
                    widget={widget}
                    date={date || new Date().toISOString().split('T')[0]}
                    onUpdate={onUpdate}
                />
            );
        case 'metric':
            const metricValue = resolveData(widget.config.dataKey || '') || 0;
            const metricLabel = widget.config.dataKey || 'Metric';

            // Special formatting for duration (if dataKey contains 'total' or 'duration')
            let displayValue = metricValue;
            let unit = widget.config.unit;

            if (widget.config.dataKey?.includes('sleep.total') || widget.config.dataKey?.includes('duration')) {
                const hours = Math.floor(metricValue / 60);
                const mins = metricValue % 60;
                displayValue = `${hours}h ${mins}m`;
                unit = ""; // Unit is built-in
            }

            return (
                <MetricWidget
                    value={displayValue}
                    label={metricLabel}
                    unit={unit}
                    color={widget.config.color}
                />
            );
        case 'bar':
            let barData = resolveData(widget.config.dataKey || '') || [];

            // If data is an object (raw contributors), format it for Bar Chart (Static)
            // BUT check if it's actually an intraday object (has 'items' array) - if so, let SmartTrendWidget handle it
            const isIntradayObject = barData && typeof barData === 'object' && Array.isArray((barData as any).items);

            if (barData && !Array.isArray(barData) && typeof barData === 'object' && !isIntradayObject) {
                barData = Object.entries(barData).map(([key, value]) => ({
                    name: key.replace(/_/g, ' '),
                    value
                }));

                return (
                    <BarChartCanvas
                        data={Array.isArray(barData) ? barData : []}
                        dataKey="value"
                        categoryKey="name"
                        color={widget.config.color}
                    />
                );
            }

            return <SmartTrendWidgetCanvas widget={widget} date={date || new Date().toISOString()} chartType="bar" />;
        case 'table':
            return (
                <SmartTrendWidgetCanvas
                    widget={widget}
                    date={date || new Date().toISOString().split('T')[0]}
                    chartType="table"
                />
            );
        case 'radar':
            let radarData = resolveData(widget.config.dataKey || '') || [];

            // If data is an object (raw contributors), format it for Radar Chart
            if (radarData && !Array.isArray(radarData) && typeof radarData === 'object') {
                radarData = Object.entries(radarData).map(([key, value]) => ({
                    subject: key.replace(/_/g, ' '),
                    value,
                    fullMark: 100
                }));
            }

            return (
                <RadarChartCanvas
                    data={Array.isArray(radarData) ? radarData : []}
                    dataKey="value"
                    axisKey="subject"
                    color={widget.config.color}
                />
            );
        case 'json':
            // If root is selected, use the date to fetch full dump
            // Otherwise use the resolved data
            const isRoot = !widget.config.dataKey || widget.config.dataKey === 'root';
            const jsonData = resolveData(widget.config.dataKey || 'root');

            return (
                <JSONWidget
                    data={jsonData}
                    date={isRoot ? date : undefined}
                    fetchFullDump={isRoot}
                />
            );
        default:
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Unknown Widget Type: {widget.type}
                </div>
            );
    }
};
