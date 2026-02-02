

interface MetricWidgetProps {
    value: string | number;
    label?: string;
    unit?: string;
    color?: string;
}

export function MetricWidget({ value, label, unit, color = "#8AB4F8" }: MetricWidgetProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="text-4xl font-bold" style={{ color }}>
                {value}
                {unit && <span className="text-xl ml-1 text-muted-foreground">{unit}</span>}
            </div>
            {label && <div className="text-sm text-muted-foreground mt-2">{label}</div>}
        </div>
    );
}
