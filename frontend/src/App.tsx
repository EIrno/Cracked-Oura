import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { Button } from "@/components/ui/button";
import { Edit2, Check } from "lucide-react";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { WidgetEditorPanel } from "@/components/dashboard/WidgetEditorPanel";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { useChat } from "@/hooks/useChat";
import { ChatPage } from "@/components/dashboard/ChatPage";

function DashboardApp() {
  const {
    dashboards,
    activeDashboardId,
    setActiveDashboardId,
    addDashboard,
    deleteDashboard,
    renameDashboard,
    widgets,
    layout,
    updateActiveDashboard,
    isEditing,
    setIsEditing,
    activePanel,
    setActivePanel,
    activeView,
    setActiveView,
    startEditingWidget,
    editingWidget,
    updateEditingWidget,
    saveEditingWidget,
    cancelEditingWidget,
    deleteWidget,
    selectedDate,
    setSelectedDate,
    data
  } = useDashboard();

  // Chat State
  const { messages, isLoading, sendMessage, clearHistory } = useChat();

  const handleLayoutChange = (newLayout: any[]) => {
    updateActiveDashboard({ layout: newLayout });
  };

  const renderRightPanel = () => {
    if (activePanel === 'editor') {
      return (
        <WidgetEditorPanel
          onClose={cancelEditingWidget}
          onSave={saveEditingWidget}
          onChange={updateEditingWidget}
          widget={editingWidget}
        />
      );
    }
    if (activePanel === 'chat') {
      return (
        <ChatPanel
          onClose={() => setActivePanel('none')}
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
        />
      );
    }
    if (activePanel === 'settings') {
      return (
        <SettingsPanel
          onClose={() => setActivePanel('none')}
        />
      );
    }
    return null;
  };

  return (
    <MainLayout
      rightPanel={renderRightPanel()}
      onChatToggle={() => setActivePanel(activePanel === 'chat' ? 'none' : 'chat')}
      isChatOpen={activePanel === 'chat'}
      selectedDate={selectedDate}
      onDateChange={(date) => date && setSelectedDate(date)}
      onSettingsClick={() => setActivePanel(activePanel === 'settings' ? 'none' : 'settings')}

      // Dashboard Props
      dashboards={dashboards}
      activeDashboardId={activeDashboardId}
      onDashboardSelect={(id) => {
        setActiveDashboardId(id);
        setActiveView('dashboard');
      }}
      onDashboardAdd={addDashboard}
      onDashboardDelete={deleteDashboard}
      onDashboardRename={renameDashboard}

      // Navigation
      activeView={activeView}
      onChatPageSelect={() => setActiveView('chat-page')}

      headerActions={
        activeView === 'dashboard' ? (
          <>
            {isEditing && (
              <Button onClick={() => startEditingWidget()} variant="secondary" size="sm">
                Add Widget
              </Button>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (isEditing) {
                  if (activePanel === 'editor') setActivePanel('none');
                }
                setIsEditing(!isEditing);
              }}
              className="gap-2"
            >
              {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {isEditing ? "Done Editing" : "Edit Layout"}
            </Button>
          </>
        ) : null
      }
    >

      {activeView === 'dashboard' ? (
        <DashboardGrid
          widgets={widgets}
          layout={layout}
          isEditing={isEditing}
          onLayoutChange={handleLayoutChange}
          onEditWidget={startEditingWidget}
          onDeleteWidget={deleteWidget}
          onWidgetChange={updateEditingWidget}
          data={data}
          selectedDate={selectedDate}
        />
      ) : (
        <ChatPage
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          onClear={clearHistory}
        />
      )}
    </MainLayout>
  );
}

function App() {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
}

export default App;
