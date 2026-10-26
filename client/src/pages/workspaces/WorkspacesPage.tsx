import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import { Modal } from '../../components/ui/Modal.js';
import { api, getErrorMessage } from '../../api/client.js';
import { Building, Plus, ArrowRight, MapPin, Users, HeartHandshake, Loader2, Check } from 'lucide-react';

export const WorkspacesPage: React.FC = () => {
  const {
    workspaces,
    isLoadingWorkspaces,
    error,
    setCurrentWorkspaceId,
    reloadWorkspaces,
    createWorkspace,
  } = useWorkspace();
  const navigate = useNavigate();

  const [publicWorkspaces, setPublicWorkspaces] = useState<any[]>([]);
  const [isJoiningId, setIsJoiningId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/workspaces/public').then((res) => {
      setPublicWorkspaces(res.data.data.workspaces || []);
    }).catch(() => {});
  }, [workspaces]);

  const handleJoinWorkspace = async (wsId: string) => {
    setIsJoiningId(wsId);
    try {
      await api.post(`/workspaces/${wsId}/join`, {
        roleTitle: 'Facilitador de Visitas Hospitalares',
      });
      await reloadWorkspaces();
      setCurrentWorkspaceId(wsId);
      navigate(`/workspaces/${wsId}/dashboard`);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsJoiningId(null);
    }
  };

  const handleSelectWorkspace = (id: string) => {
    setCurrentWorkspaceId(id);
    navigate(`/workspaces/${id}/dashboard`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createWorkspace({
        name,
        city,
        state: state.toUpperCase(),
        description: description || undefined,
      });
      setIsModalOpen(false);
      setName('');
      setCity('');
      setState('');
      setDescription('');
      navigate(`/workspaces/${created.id}/dashboard`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingWorkspaces) {
    return <LoadingSpinner message="Carregando suas comissões..." className="py-24" />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorAlert message={error} onRetry={reloadWorkspaces} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300/40">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Comissões Hospitalares (Workspaces)</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Selecione uma comissão regional ativa ou cadastre uma nova
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="neu-btn-primary px-4 py-2.5 text-sm font-bold flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Comissão
        </button>
      </div>

      <div className="mt-8">
        {workspaces.length === 0 ? (
          <div className="space-y-6">
            <div className="neu-panel p-6 text-center max-w-xl mx-auto">
              <Building className="w-12 h-12 text-brand-600 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">Nenhuma comissão vinculada à sua conta</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Participe de uma comissão regional ativa abaixo para atuar como Facilitador de Visitas ou registre uma nova comissão COLIH.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 neu-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nova Comissão</span>
              </button>
            </div>

            {publicWorkspaces.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-brand-600" />
                  Comissões Regionais Disponíveis para Integrar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicWorkspaces.map((ws) => (
                    <div key={ws.id} className="neu-card p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-base text-slate-900">{ws.name}</h4>
                          <span className="text-xs px-2.5 py-0.5 neu-badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                            Ativa
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ws.city} - {ws.state}</span>
                        </div>
                        {ws.description && (
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2">{ws.description}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-300/40 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          {ws.memberCount || 1} membro(s) ativos
                        </span>
                        <button
                          type="button"
                          onClick={() => handleJoinWorkspace(ws.id)}
                          disabled={isJoiningId === ws.id}
                          className="neu-btn px-4 py-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isJoiningId === ws.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Integrando...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-brand-600" />
                              <span>Participar como Facilitador</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                className="neu-card neu-card-hover p-5 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                      {ws.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 neu-badge bg-neu-bg text-slate-700 font-bold">
                      {ws.userRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {ws.city} - {ws.state}
                    </span>
                  </div>

                  {ws.description && (
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2">{ws.description}</p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-300/40 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ws._count?.members || 1} membro(s)</span>
                  </div>
                  <span className="inline-flex items-center font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                    Acessar <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Nova Comissão / Workspace"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-100/70 border border-red-200 text-sm text-red-700">{submitError}</div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Nome da Comissão / Regional *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: COLIH Salvador e Região Metropolitana"
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Cidade Sede *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Salvador"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Estado (UF) *
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="Ex: BA"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Informações adicionais sobre o território e hospitais cobertos..."
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-300/40">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 neu-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white neu-btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Comissão'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
