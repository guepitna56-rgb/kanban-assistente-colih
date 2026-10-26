import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getErrorMessage } from '../api/client.js';
import { Workspace } from '../types/index.js';
import { useAuth } from './AuthContext.js';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  error: string | null;
  setCurrentWorkspaceId: (id: string) => void;
  reloadWorkspaces: () => Promise<void>;
  createWorkspace: (data: { name: string; description?: string; city: string; state: string }) => Promise<Workspace>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadWorkspaces = async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      return;
    }

    setIsLoadingWorkspaces(true);
    setError(null);
    try {
      const response = await api.get('/workspaces');
      const list: Workspace[] = response.data.data.workspaces;
      setWorkspaces(list);

      // Tenta recuperar seleção anterior ou define o primeiro
      const savedId = localStorage.getItem('colih_current_workspace_id');
      const found = list.find((w) => w.id === savedId);
      if (found) {
        setCurrentWorkspace(found);
      } else if (list.length > 0) {
        setCurrentWorkspace(list[0]);
        localStorage.setItem('colih_current_workspace_id', list[0].id);
      } else {
        setCurrentWorkspace(null);
        localStorage.removeItem('colih_current_workspace_id');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    reloadWorkspaces();
  }, [isAuthenticated]);

  const setCurrentWorkspaceId = (id: string) => {
    const found = workspaces.find((w) => w.id === id);
    if (found) {
      setCurrentWorkspace(found);
      localStorage.setItem('colih_current_workspace_id', found.id);
    }
  };

  const createWorkspace = async (data: { name: string; description?: string; city: string; state: string }) => {
    const response = await api.post('/workspaces', data);
    const newWs: Workspace = response.data.data.workspace;
    await reloadWorkspaces();
    setCurrentWorkspaceId(newWs.id);
    return newWs;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoadingWorkspaces,
        error,
        setCurrentWorkspaceId,
        reloadWorkspaces,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace deve ser utilizado dentro de um WorkspaceProvider');
  }
  return context;
};
