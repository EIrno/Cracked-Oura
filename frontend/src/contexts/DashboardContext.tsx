import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { WidgetInstance, Dashboard } from '@/types';
import { useOuraData } from '@/hooks/useOuraData';
import { useDashboardPersistence } from '@/hooks/useDashboardPersistence';
import { format } from 'date-fns';

// Initial empty dashboard skeleton
const EMPTY_DASHBOARD: Dashboard = {
    id: 'default',
    name: 'Daily Overview',
    widgets: [],
    layout: []
};

type PanelType = 'none' | 'chat' | 'editor' | 'settings';
type ViewType = 'dashboard' | 'chat-page';

interface DashboardContextType {
    // Dashboard State
    dashboards: Dashboard[];
    activeDashboardId: string;
    activeDashboard: Dashboard;
    setActiveDashboardId: (id: string) => void;
    addDashboard: () => void;
    deleteDashboard: (id: string) => void;
    renameDashboard: (id: string, name: string) => void;

    // Layout/Widget State (for active dashboard)
    widgets: WidgetInstance[];
    layout: any[];
    updateActiveDashboard: (updates: Partial<Dashboard>) => void;

    // UI State
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
    activePanel: PanelType;
    setActivePanel: (panel: PanelType) => void;
    activeView: ViewType;
    setActiveView: (view: ViewType) => void;

    // Widget Editing
    editingWidget: WidgetInstance | undefined;
    startEditingWidget: (widget?: WidgetInstance) => void; // If undefined, adds new
    saveEditingWidget: () => void;
    cancelEditingWidget: () => void;
    updateEditingWidget: (widget: WidgetInstance) => void;
    deleteWidget: (id: string) => void;

    // Data State
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    data: any;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    // --- State Definitions ---

    const [isEditing, setIsEditing] = useState(false);
    const [activePanel, setActivePanel] = useState<PanelType>('none');
    const [activeView, setActiveView] = useState<ViewType>('dashboard');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Dashboards
    const [dashboards, setDashboards] = useState<Dashboard[]>([EMPTY_DASHBOARD]);
    const [activeDashboardId, setActiveDashboardId] = useState<string>('default');

    // Widget Editing
    const [editingWidget, setEditingWidget] = useState<WidgetInstance | undefined>(undefined);
    const [originalWidget, setOriginalWidget] = useState<WidgetInstance | undefined>(undefined);

    // Persistence
    const { savedDashboards, savedActiveDashboardId, saveDashboards } = useDashboardPersistence();

    // Data Fetching
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const data = useOuraData(dateString);

    // --- Effects ---

    // Load saved state
    useEffect(() => {
        if (savedDashboards && savedDashboards.length > 0) {
            setDashboards(savedDashboards);
            if (savedActiveDashboardId) {
                setActiveDashboardId(savedActiveDashboardId);
            } else {
                setActiveDashboardId(savedDashboards[0].id);
            }
        }
    }, [savedDashboards, savedActiveDashboardId]);

    // Resize trigger on panel change
    useEffect(() => {
        window.dispatchEvent(new Event('resize'));
    }, [activePanel]);

    // --- Helpers ---

    const activeDashboard = dashboards.find(d => d.id === activeDashboardId) || dashboards[0];
    const widgets = activeDashboard?.widgets || [];
    const layout = activeDashboard?.layout || [];



    const persist = (newDashboards: Dashboard[], newActiveId: string) => {
        saveDashboards(newDashboards, newActiveId);
    };

    // --- Actions ---

    const addDashboard = () => {
        const newId = `dashboard-${Date.now()}`;
        const newDashboard: Dashboard = {
            id: newId,
            name: 'New Dashboard',
            widgets: [],
            layout: []
        };
        const newDashboards = [...dashboards, newDashboard];
        setDashboards(newDashboards);
        setActiveDashboardId(newId);
        setActiveView('dashboard');
        persist(newDashboards, newId);
    };

    const deleteDashboard = (id: string) => {
        if (dashboards.length <= 1) return;
        const newDashboards = dashboards.filter(d => d.id !== id);
        setDashboards(newDashboards);

        let newActiveId = activeDashboardId;
        if (activeDashboardId === id) {
            newActiveId = newDashboards[0].id;
            setActiveDashboardId(newActiveId);
        }
        persist(newDashboards, newActiveId);
    };

    const renameDashboard = (id: string, name: string) => {
        const newDashboards = dashboards.map(d =>
            d.id === id ? { ...d, name } : d
        );
        setDashboards(newDashboards);
        persist(newDashboards, activeDashboardId);
    };

    // Overriding updateActiveDashboard to handle persistence
    const handleUpdateActiveDashboard = (updates: Partial<Dashboard>) => {
        const newDashboards = dashboards.map(d =>
            d.id === activeDashboardId ? { ...d, ...updates } : d
        );
        setDashboards(newDashboards);
        // We persist here because most updates (layout, widget CRUD) should be saved.
        persist(newDashboards, activeDashboardId);
    };

    // Widget Actions

    const startEditingWidget = (widget?: WidgetInstance) => {
        if (widget) {
            // Edit existing
            setEditingWidget(widget);
            setOriginalWidget(widget);
        } else {
            // Add new
            const maxId = widgets.length > 0
                ? Math.max(...widgets.map(w => parseInt(w.id) || 0))
                : 0;
            const newId = (maxId + 1).toString();

            const newWidget: WidgetInstance = {
                id: newId,
                type: 'score',
                title: 'New Widget',
                width: 'col-span-4',
                height: 'h-40',
                config: { dataKey: 'sleep.score', color: '#8AB4F8' }
            };

            const newWidgets = [...widgets, newWidget];
            const newLayout = [...layout, {
                i: newId,
                x: 0,
                y: Infinity,
                w: 4,
                h: 4
            }];

            handleUpdateActiveDashboard({ widgets: newWidgets, layout: newLayout });
            setEditingWidget(newWidget);
            setOriginalWidget(undefined); // undefined indicates new
        }
        setActivePanel('editor');
    };

    const updateEditingWidget = (updatedWidget: WidgetInstance) => {

        setDashboards(prev => prev.map(d =>
            d.id === activeDashboardId ? { ...d, widgets: d.widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w) } : d
        ));
        setEditingWidget(updatedWidget);
    };

    const saveEditingWidget = () => {
        setEditingWidget(undefined);
        setOriginalWidget(undefined);
        setActivePanel('none');
        persist(dashboards, activeDashboardId); // Save state "snapshot"
    };

    const cancelEditingWidget = () => {
        if (originalWidget) {
            // Revert
            const newWidgets = widgets.map(w => w.id === originalWidget.id ? originalWidget : w);
            handleUpdateActiveDashboard({ widgets: newWidgets });
        } else if (editingWidget) {
            // Remove newly added
            const newWidgets = widgets.filter(w => w.id !== editingWidget.id);
            const newLayout = layout.filter(l => l.i !== editingWidget.id);
            handleUpdateActiveDashboard({ widgets: newWidgets, layout: newLayout });
        }
        setEditingWidget(undefined);
        setOriginalWidget(undefined);
        setActivePanel('none');

    };

    const deleteWidget = (id: string) => {
        const newWidgets = widgets.filter(w => w.id !== id);
        const newLayout = layout.filter(l => l.i !== id);
        // Update and Save
        const newDashboards = dashboards.map(d =>
            d.id === activeDashboardId ? { ...d, widgets: newWidgets, layout: newLayout } : d
        );
        setDashboards(newDashboards);
        persist(newDashboards, activeDashboardId);
    };

    return (
        <DashboardContext.Provider value={{
            dashboards,
            activeDashboardId,
            activeDashboard,
            setActiveDashboardId,
            addDashboard,
            deleteDashboard,
            renameDashboard,
            widgets,
            layout,
            updateActiveDashboard: handleUpdateActiveDashboard,
            isEditing,
            setIsEditing,
            activePanel,
            setActivePanel,
            activeView,
            setActiveView,
            editingWidget,
            startEditingWidget,
            saveEditingWidget,
            cancelEditingWidget,
            updateEditingWidget,
            deleteWidget,
            selectedDate,
            setSelectedDate,
            data
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
