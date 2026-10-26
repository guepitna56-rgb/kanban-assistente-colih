import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LoadingSpinner } from './components/ui/LoadingSpinner.js';
import { BoardKanbanPage } from './pages/boards/BoardKanbanPage.js';

// Redirecionamento direto para o Quadro de Ações (Kanban)
const RootRedirect: React.FC = () => {
  const { workspaces, currentWorkspace, isLoadingWorkspaces } = useWorkspace();

  if (isLoadingWorkspaces) {
    return <LoadingSpinner message="Carregando Quadro de Ações COLIH..." className="min-h-screen" />;
  }

  const targetWs = currentWorkspace || workspaces[0];
  if (!targetWs) {
    return <LoadingSpinner message="Inicializando Quadro..." className="min-h-screen" />;
  }

  return <Navigate to={`/workspaces/${targetWs.id}/boards`} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            {/* O sistema mantém exclusivamente o Quadro de Ações (Kanban) */}
            <Route
              path="/workspaces/:workspaceId/boards/:boardId"
              element={
                <AppLayout>
                  <BoardKanbanPage />
                </AppLayout>
              }
            />

            <Route
              path="/workspaces/:workspaceId/boards"
              element={
                <AppLayout>
                  <BoardKanbanPage />
                </AppLayout>
              }
            />

            <Route
              path="/workspaces/:workspaceId"
              element={<RootRedirect />}
            />

            {/* Redirecionamento da Raiz e Fallbacks diretamente para o Kanban */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
