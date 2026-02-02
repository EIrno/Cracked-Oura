export interface WidgetConfig {
    color?: string;
    showLegend?: boolean;
    showPoints?: boolean;
    dataKey?: string;
    dataKeys?: string[];
    dateRange?: {
        type: 'all' | 'custom' | 'to_today' | 'last_30' | 'last_90' | 'selected_day' | 'relative';
        startDate?: string;
        endDate?: string;
        value?: number;
        unit?: 'days' | 'weeks' | 'months' | 'hours' | 'minutes' | 'years';
        anchor?: 'today' | 'selected_date';
    };
    [key: string]: any;
}

export interface WidgetInstance {
    id: string;
    type: string;
    title: string;
    width: string;
    height: string;
    config: WidgetConfig;
}

export interface DashboardRow {
    id: string;
    widgets: WidgetInstance[];
}

export interface DashboardConfig {
    id: string;
    title: string;
    rows: DashboardRow[];
}

export interface Dashboard {
    id: string;
    name: string;
    widgets: WidgetInstance[];
    layout: any[];
}
