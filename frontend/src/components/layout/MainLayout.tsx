import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Dashboard } from "@/types";
import { ModeToggle } from "@/components/mode-toggle";

interface MainLayoutProps {
    children: React.ReactNode;
    rightPanel?: React.ReactNode;
    onChatToggle?: () => void;
    isChatOpen?: boolean;
    selectedDate?: Date;
    onDateChange?: (date: Date | undefined) => void;
    onSettingsClick?: () => void;
    headerActions?: React.ReactNode;

    // Dashboard Props
    dashboards: Dashboard[];
    activeDashboardId: string;
    onDashboardSelect: (id: string) => void;
    onDashboardAdd: () => void;
    onDashboardDelete: (id: string) => void;
    onDashboardRename: (id: string, newName: string) => void;

    // Navigation
    activeView?: 'dashboard' | 'chat-page';
    onChatPageSelect?: () => void;
}

export function MainLayout({
    children,
    rightPanel,
    onChatToggle,
    isChatOpen,
    selectedDate = new Date(),
    onDateChange,
    onSettingsClick,
    headerActions,
    dashboards,
    activeDashboardId,
    onDashboardSelect,
    onDashboardAdd,
    onDashboardDelete,
    onDashboardRename,
    activeView,
    onChatPageSelect
}: MainLayoutProps) {
    const activeDashboardName = dashboards.find(d => d.id === activeDashboardId)?.name || "Dashboard";

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Left Sidebar */}
            <AppSidebar
                onSettingsClick={onSettingsClick}
                dashboards={dashboards}
                activeDashboardId={activeDashboardId}
                onDashboardSelect={onDashboardSelect}
                onDashboardAdd={onDashboardAdd}
                onDashboardDelete={onDashboardDelete}
                onDashboardRename={onDashboardRename}
                activeView={activeView}
                onChatPageSelect={onChatPageSelect}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">{activeDashboardName}</h1>
                        <div className="h-6 w-px bg-border" />

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => {
                                    if (onDateChange && selectedDate) {
                                        const prevDay = new Date(selectedDate);
                                        prevDay.setDate(prevDay.getDate() - 1);
                                        onDateChange(prevDay);
                                    }
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] h-9 justify-start text-left font-normal",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={onDateChange}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => {
                                    if (onDateChange && selectedDate) {
                                        const nextDay = new Date(selectedDate);
                                        nextDay.setDate(nextDay.getDate() + 1);
                                        onDateChange(nextDay);
                                    }
                                }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {headerActions}
                        <ModeToggle />
                        <Button
                            variant={isChatOpen ? "secondary" : "outline"}
                            size="sm"
                            onClick={onChatToggle}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Ask AI
                        </Button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 flex overflow-hidden">
                    <main className="flex-1 overflow-auto p-6 relative">
                        {children}
                    </main>

                    {/* Persistent Right Panel */}
                    {rightPanel}
                </div>
            </div>
        </div>
    );
}
