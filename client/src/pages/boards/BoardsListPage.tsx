import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { Board } from '../../types/index.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import { Modal } from '../../components/ui/Modal.js';
import { FolderKanban, Plus, ArrowRight, Columns } from 'lucide-react';

export const BoardsListPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadBoards = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/boards`);
      const loadedBoards = res.data.data.boards || [];
      setBoards(loadedBoards);
      if (loadedBoards.length > 0) {
        navigate(`/workspaces/${workspaceId}/boards/${loadedBoards[0].id}`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.post(`/workspaces/${workspaceId}/boards`, {
        title,
        description: description || undefined,
      });
      const newBoard: Board = res.data.data.board;
      setIsModalOpen(false);
      navigate(`/workspaces/${workspaceId}/boards/${newBoard.id}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando quadros..." className="py-24" />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={loadBoards} />;
  }

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quadros de Ações e Demandas</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Planejamento operacional, visitas e fluxos de atendimento da comissão
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="neu-btn-primary px-4 py-2.5 text-sm font-bold flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Quadro
        </button>
      </div>

      {boards.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Você ainda não possui nenhum quadro."
          description="Crie seu primeiro quadro para organizar listas e cartões de demandas da equipe."
          action={{
            label: "Criar Primeiro Quadro",
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((b) => (
            <Link
              key={b.id}
              to={`/workspaces/${workspaceId}/boards/${b.id}`}
              className="neu-card neu-card-hover p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 neu-badge flex items-center justify-center text-brand-600 bg-neu-bg">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                  {b.title}
                </h3>
                {b.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{b.description}</p>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-300/40 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold">
                  <Columns className="w-3.5 h-3.5 text-slate-400" />
                  {b._count?.lists || 0} coluna(s)
                </span>
                <span className="font-bold text-brand-600 flex items-center group-hover:translate-x-1 transition-transform">
                  Abrir <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Novo Quadro"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-100/70 border border-red-200 text-sm text-red-700">{submitError}</div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Título do Quadro *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Plantões e Visitas Hospitalares"
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Finalidade do quadro..."
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
              {isSubmitting ? 'Criando...' : 'Criar Quadro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
