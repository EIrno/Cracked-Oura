import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import RGL, { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetCard } from './WidgetCard';
import { WidgetRegistry } from '../WidgetRegistry';
import type { WidgetInstance } from '@/types';
import { cn, isIntradayKey } from '@/lib/utils';

import { DateRangeSelector } from './DateRangeSelector';

import { ErrorBoundary } from '../ErrorBoundary';

const GridLayout = WidthProvider(RGL);


interface DashboardGridProps {
    widgets: WidgetInstance[];
    layout: any[];
    isEditing: boolean;
    onLayoutChange: (layout: any[]) => void;
    onEditWidget?: (widget: WidgetInstance) => void;
    onWidgetChange?: (widget: WidgetInstance) => void;
    onDeleteWidget?: (widgetId: string) => void;

    data?: any;
    selectedDate: Date;
}

export function DashboardGrid({
    widgets,
    layout,
    isEditing,
    onLayoutChange,
    onEditWidget,
    onWidgetChange,
    onDeleteWidget,
    data,
    selectedDate
}: DashboardGridProps) {
    // Fix for RGL mounting issue
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className={cn("w-full", isEditing && "bg-secondary/10 rounded-xl border border-dashed border-secondary/50")}>
            {isEditing ? (
                <GridLayout
                    className="layout"
                    layout={layout}
                    cols={12}
                    rowHeight={60}
                    isDraggable={isEditing}
                    isResizable={isEditing}
                    onLayoutChange={onLayoutChange as any}
                    margin={[16, 16]}
                    containerPadding={[16, 16]}
                    draggableHandle=".drag-handle"
                >
                    {widgets.map((widget) => {
                        const layoutItem = layout.find(l => l.i === widget.id);
                        if (!layoutItem) return null;
                        // This ensures the button is always visible for charts that support it, INCLUDING intraday ones (so user can pick "Selected Day")
                        const supportsDateRange = widget.type === 'trend' || widget.type === 'bar';
                        const showDateSelector = (!!widget.config.dateRange || supportsDateRange) && widget.type !== 'table';

                        return (
                            <div key={widget.id} className="relative group">
                                <WidgetCard
                                    title={widget.title}
                                    subtitle={undefined}
                                    isEditing={isEditing}
                                    onEdit={() => onEditWidget?.(widget)}
                                    onDelete={() => onDeleteWidget?.(widget.id)}
                                    className="h-full"
                                    headerContent={showDateSelector && (
                                        <DateRangeSelector
                                            widget={widget}
                                            onUpdate={(updates) => onWidgetChange?.({ ...widget, ...updates })}
                                            selectedDate={selectedDate}
                                            isLocked={isIntradayKey(widget.config.dataKey || widget.config.dataKeys?.[0] || '')}
                                        />
                                    )}
                                >
                                    <div className="h-full pt-2">
                                        <ErrorBoundary>
                                            <WidgetRegistry widget={widget} data={data} date={format(selectedDate, 'yyyy-MM-dd')} />
                                        </ErrorBoundary>
                                    </div>
                                </WidgetCard>
                            </div>
                        );
                    })}
                </GridLayout >
            ) : (
                <div
                    className="grid grid-cols-12 gap-4 p-4"
                    style={{
                        gridAutoRows: '60px'
                    }}
                >
                    {widgets.map((widget) => {
                        const layoutItem = layout.find(l => l.i === widget.id);
                        if (!layoutItem) return null;
                        // This ensures the button is always visible for charts that support it, INCLUDING intraday ones (so user can pick "Selected Day")
                        const supportsDateRange = widget.type === 'trend' || widget.type === 'bar';
                        const showDateSelector = (!!widget.config.dateRange || supportsDateRange) && widget.type !== 'table';

                        return (
                            <div
                                key={widget.id}
                                className="relative group"
                                style={{
                                    gridColumn: `${(layoutItem.x || 0) + 1} / span ${layoutItem.w || 1}`,
                                    gridRow: `${(layoutItem.y || 0) + 1} / span ${layoutItem.h || 1}`
                                }}
                            >
                                <WidgetCard
                                    title={widget.title}
                                    subtitle={undefined}
                                    isEditing={isEditing}
                                    onEdit={() => onEditWidget?.(widget)}
                                    onDelete={() => onDeleteWidget?.(widget.id)}
                                    className="h-full"
                                    headerContent={showDateSelector && (
                                        <DateRangeSelector
                                            widget={widget}
                                            onUpdate={(updates) => onWidgetChange?.({ ...widget, ...updates })}
                                            selectedDate={selectedDate}
                                            isLocked={isIntradayKey(widget.config.dataKey || widget.config.dataKeys?.[0] || '')}
                                        />
                                    )}
                                >
                                    <div className="h-full pt-2">
                                        <ErrorBoundary>
                                            <WidgetRegistry widget={widget} data={data} date={format(selectedDate, 'yyyy-MM-dd')} />
                                        </ErrorBoundary>
                                    </div>
                                </WidgetCard>
                            </div>
                        );
                    })}
                </div >
            )
            }
        </div >
    );
}
