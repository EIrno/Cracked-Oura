import type { DashboardConfig, DashboardRow, WidgetInstance } from '../types';

// Standard grid width (e.g., 12 columns)
export const GRID_COLS = 12;

/**
 * Converts the legacy row-based config to a flat react-grid-layout config.
 */
export const convertToGridLayout = (config: DashboardConfig): any[] => {
    const layout: any[] = [];
    let currentY = 0;

    config.rows.forEach((row: DashboardRow) => {
        const rowHeight = getRowHeight(row);
        const widgetWidth = Math.floor(GRID_COLS / row.widgets.length);

        row.widgets.forEach((widget: WidgetInstance, index: number) => {
            let w = widgetWidth;
            if (widget.width?.includes('col-span-1')) w = 4; // Assuming 3-col grid
            if (widget.width?.includes('w-full')) w = 12;

            layout.push({
                i: widget.id,
                x: (index * w) % GRID_COLS,
                y: currentY,
                w: w,
                h: rowHeight,
            });
        });

        currentY += rowHeight;
    });

    return layout;
};

/**
 * Helper to estimate row height based on widget content/classes.
 */
const getRowHeight = (row: DashboardRow): number => {
    // Check the first widget's height class to guess row height
    const heightClass = row.widgets[0]?.height;
    if (!heightClass) return 4; // Default

    if (heightClass.includes('h-40')) return 4; // ~160px
    if (heightClass.includes('h-[250px]')) return 6;
    if (heightClass.includes('h-[300px]')) return 8;
    if (heightClass.includes('h-[350px]')) return 9;
    if (heightClass.includes('h-[400px]')) return 10;

    return 6; // Default fallback
};
