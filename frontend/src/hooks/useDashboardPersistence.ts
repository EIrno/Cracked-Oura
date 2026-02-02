import { useState, useEffect, useCallback } from 'react';
import type { Dashboard } from '../types';

import { api } from "@/lib/api";

// ...

export const useDashboardPersistence = () => {
    const [savedDashboards, setSavedDashboards] = useState<Dashboard[] | null>(null);
    const [savedActiveDashboardId, setSavedActiveDashboardId] = useState<string | null>(null);

    // Load dashboards from server with retry logic
    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 10;

        const loadConfig = () => {
            api.getLayout()
                .then(data => {
                    if (data.dashboards && Array.isArray(data.dashboards)) {
                        setSavedDashboards(data.dashboards);
                        setSavedActiveDashboardId(data.activeDashboardId || data.dashboards[0]?.id);
                    } else if (data.widgets && data.layout) {
                        // Migration
                        const defaultDashboard: Dashboard = {
                            id: 'default',
                            name: 'Daily Overview',
                            widgets: data.widgets,
                            layout: data.layout
                        };
                        setSavedDashboards([defaultDashboard]);
                        setSavedActiveDashboardId('default');
                    }
                })
                .catch(() => {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(loadConfig, 1000); // Retry after 1s
                    } else {
                        console.error("Gave up loading dashboard config after multiple attempts.");
                    }
                });
        };

        loadConfig();
    }, []);

    const saveDashboards = useCallback((dashboards: Dashboard[], activeDashboardId: string) => {
        api.saveLayout({ dashboards, activeDashboardId })
            .catch(err => console.error("Error saving dashboard config:", err));

        // Optimistic update
        setSavedDashboards(dashboards);
        setSavedActiveDashboardId(activeDashboardId);
    }, []);

    return { savedDashboards, savedActiveDashboardId, saveDashboards };
};
