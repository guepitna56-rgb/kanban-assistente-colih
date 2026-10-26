import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { Board, Card, WorkspaceMember, Hospital, Doctor } from '../../types/index.js';
import { useWorkspace } from '../../contexts/WorkspaceContext.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import { Modal } from '../../components/ui/Modal.js';
import { CardModal } from './CardModal.js';
import { CreateCardModal } from './CreateCardModal.js';
import { CardLabelsModal } from './CardLabelsModal.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Search,
  Tag,
  Clock,
} from 'lucide-react';

interface BoardKanbanPageProps {
  embedded?: boolean;
}

export const BoardKanbanPage: React.FC<BoardKanbanPageProps> = ({ embedded }) => {
  const params = useParams<{ workspaceId: string; boardId: string }>();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = params.workspaceId || currentWorkspace?.id;
  const [boardId, setBoardId] = useState<string | null>(params.boardId || null);

  const [board, setBoard] = useState<Board | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Criar Lista
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Criar Cartão Regular
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [targetListId, setTargetListId] = useState<string>('');

  // Modal Rápido do Usuário: Nova Designação de Visita COLIH
  const [isQuickVisitModalOpen, setIsQuickVisitModalOpen] = useState(false);
  const [quickDoctorName, setQuickDoctorName] = useState('');
  const [quickSpecialty, setQuickSpecialty] = useState('Cirurgia Geral');
  const [quickHospitalId, setQuickHospitalId] = useState('');
  const [quickMemberId, setQuickMemberId] = useState('');
  const [isSubmittingQuickVisit, setIsSubmittingQuickVisit] = useState(false);
  const [quickVisitError, setQuickVisitError] = useState<string | null>(null);

  // Detalhes do Cartão & Comentários
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Gestão Rápida de Etiquetas no Card
  const [cardForLabels, setCardForLabels] = useState<Card | null>(null);

  // Exclusões
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  // Acesso universal irrestrito ao Kanban (sem restrições de admin / super admin / visualizador)
  const isViewer = false;
  const eligibleMembers = members;
  const superiorMembers: WorkspaceMember[] = [];

  const loadBoardData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      let currentBoardId = boardId;
      if (!currentBoardId) {
        const boardsRes = await api.get(`/workspaces/${workspaceId}/boards`);
        const boards = boardsRes.data.data.boards;
        if (boards && boards.length > 0) {
          currentBoardId = boards[0].id;
          setBoardId(currentBoardId);
        } else {
          setError('Nenhum quadro disponível.');
          setIsLoading(false);
          return;
        }
      }

      const [boardRes, memRes, hospRes, docRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/boards/${currentBoardId}`),
        api.get(`/workspaces/${workspaceId}/members`),
        api.get(`/workspaces/${workspaceId}/hospitals`),
        api.get(`/workspaces/${workspaceId}/doctors`),
      ]);
      setBoard(boardRes.data.data.board);
      setMembers(memRes.data.data.members);
      setHospitals(hospRes.data.data.hospitals);
      setDoctors(docRes.data.data.doctors);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [workspaceId, boardId]);

  const refreshSelectedCard = async (cardId: string) => {
    if (!workspaceId) return;
    try {
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${cardId}`);
      setSelectedCard(res.data.data.card);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveBoardId = boardId || board?.id;
    if (!workspaceId || !effectiveBoardId || !newListTitle || isViewer) return;
    setIsCreatingList(true);
    try {
      await api.post(`/workspaces/${workspaceId}/boards/${effectiveBoardId}/lists`, {
        title: newListTitle,
      });
      setNewListTitle('');
      setIsNewListModalOpen(false);
      await loadBoardData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleDeleteList = async () => {
    if (!workspaceId || !deletingListId || isViewer) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/boards/lists/${deletingListId}`);
      setDeletingListId(null);
      await loadBoardData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleOpenCreateCard = (listId: string) => {
    if (isViewer) return;
    setTargetListId(listId);
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: Card) => {
    setSelectedCard(card);
    refreshSelectedCard(card.id);
  };

  // Submissão do Modal Rápido de Visita Médica
  const handleQuickVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !board || isViewer) return;
    setIsSubmittingQuickVisit(true);
    setQuickVisitError(null);

    try {
      // Localiza a lista "Visitas Encaminhadas" ou a primeira lista existente
      let targetList = board.lists?.find((l) => l.title.toLowerCase().includes('visita')) || board.lists?.[0];
      if (!targetList) {
        // Se não houver lista, cria uma
        const newListRes = await api.post(`/workspaces/${workspaceId}/boards/${board.id}/lists`, {
          title: 'Visitas Encaminhadas',
        });
        targetList = newListRes.data.data.list;
      }

      const hosp = hospitals.find((h) => h.id === quickHospitalId);
      const hospitalTag = hosp ? hosp.name.slice(0, 7).toUpperCase().replace(/\s+/g, '-') : 'COLIH';

      // Cria o cartão diretamente
      await api.post(`/workspaces/${workspaceId}/boards/cards`, {
        listId: targetList!.id,
        title: quickDoctorName.startsWith('Dr') ? quickDoctorName : `Dr. ${quickDoctorName}`,
        description: `${quickSpecialty} • ${hosp ? hosp.name : 'Unidade Hospitalar'}`,
        priority: 'ALTA',
        assignedMemberId: quickMemberId || null,
        hospitalId: quickHospitalId || null,
        tag: hospitalTag,
        statusBadge: 'Agendado',
        checklistTitle: 'Checagem de prontuário bioético',
        checklistDone: false,
        cardCategory: 'VISITA',
      });

      setIsQuickVisitModalOpen(false);
      setQuickDoctorName('');
      await loadBoardData();
    } catch (err) {
      setQuickVisitError(getErrorMessage(err));
    } finally {
      setIsSubmittingQuickVisit(false);
    }
  };

  const isCardCompleted = (card: Card) => {
    return (
      card.statusBadge?.trim().toLowerCase() === 'concluído' ||
      card.statusBadge?.trim().toLowerCase() === 'concluido' ||
      card.statusBadge?.trim().toUpperCase() === 'CONCLUIDO'
    );
  };

  const handleToggleCardCompletion = async (card: Card, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!workspaceId || isViewer) return;
    const completed = isCardCompleted(card);
    const newStatus = completed ? 'Em andamento' : 'Concluído';
    try {
      await api.put(`/workspaces/${workspaceId}/boards/cards/${card.id}`, {
        listId: card.listId,
        title: card.title,
        priority: card.priority,
        statusBadge: newStatus,
      });
      await loadBoardData();
      if (selectedCard?.id === card.id) {
        await refreshSelectedCard(card.id);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleToggleChecklistItemOnBoard = async (
    itemId: string,
    currentDone: boolean,
    e: React.MouseEvent | React.ChangeEvent
  ) => {
    e.stopPropagation();
    if (isViewer || !workspaceId) return;
    try {
      await api.patch(`/workspaces/${workspaceId}/boards/checklist-items/${itemId}`, {
        isDone: !currentDone,
      });
      await loadBoardData();
      if (selectedCard) {
        await refreshSelectedCard(selectedCard.id);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleToggleChecklist = async (card: Card, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (isViewer || !workspaceId) return;

    try {
      await api.patch(`/workspaces/${workspaceId}/boards/cards/${card.id}/checklist`, {
        done: !card.checklistDone,
      });
      await loadBoardData();
      if (selectedCard?.id === card.id) {
        await refreshSelectedCard(card.id);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteCard = async () => {
    if (!workspaceId || !deletingCard || isViewer) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/boards/cards/${deletingCard.id}`);
      setDeletingCard(null);
      if (selectedCard?.id === deletingCard.id) setSelectedCard(null);
      await loadBoardData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleMoveCard = async (cardId: string, destListId: string, newPosition: number) => {
    if (!workspaceId || isViewer) return;
    try {
      await api.post(`/workspaces/${workspaceId}/boards/cards/${cardId}/move`, {
        targetListId: destListId,
        newPosition,
      });
      await loadBoardData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Drag and drop HTML5 com feedback visual operacional
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, cardId: string) => {
    if (isViewer) return;
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, listId: string) => {
    if (isViewer) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverListId !== listId) {
      setDragOverListId(listId);
    }
  };

  const onDragLeave = () => {
    setDragOverListId(null);
  };

  const onDropList = async (e: React.DragEvent, destListId: string) => {
    if (isViewer) return;
    e.preventDefault();
    setDragOverListId(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;

    const destList = board?.lists?.find((l) => l.id === destListId);
    const destPosition = destList ? destList.cards.length : 0;
    await handleMoveCard(cardId, destListId, destPosition);
  };

  // Contagem de cartões no quadro
  const totalCardsCount = useMemo(() => {
    return board?.lists?.reduce((acc, l) => acc + (l.cards?.length || 0), 0) || 0;
  }, [board]);

  // Filtragem de cartões por Hospital e Busca textual
  const filteredLists = useMemo(() => {
    if (!board?.lists) return [];

    return board.lists.map((list) => {
      const filteredCards = list.cards.filter((card) => {
        // Filtro por Hospital
        if (selectedHospitalId !== 'ALL') {
          const matchHospitalId = card.hospitalId === selectedHospitalId;
          if (!matchHospitalId) return false;
        }

        // Busca textual
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = card.title.toLowerCase().includes(q);
          const matchDesc = card.description?.toLowerCase().includes(q);
          const matchDoc = card.doctor?.name.toLowerCase().includes(q);
          const matchHosp = card.hospital?.name.toLowerCase().includes(q);
          const matchTag = card.tag?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchDoc && !matchHosp && !matchTag) return false;
        }

        return true;
      });

      return {
        ...list,
        cards: filteredCards,
      };
    });
  }, [board, selectedHospitalId, searchQuery]);

  if (isLoading) {
    return <LoadingSpinner message="Carregando quadro de ações da comissão..." className="py-24" />;
  }

  if (error || !board) {
    return <ErrorAlert message={error || 'Quadro não encontrado.'} onRetry={loadBoardData} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] space-y-3">
      {/* Indicador de Modo Visualizador (se GUEST) */}
      {isViewer && (
        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs flex-shrink-0">
          <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Modo Visualizador:</strong> Seu papel neste workspace é de leitura restrita. Você pode acompanhar as visitas e cartões sem alterá-los.
          </span>
        </div>
      )}

      {/* Header Superior Compacto & Navegação COLIH */}
      <div className="neu-panel px-4 py-3 space-y-2.5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!embedded && (
              <Link
                to={`/workspaces/${workspaceId}/boards`}
                className="neu-btn p-1.5 text-slate-500 hover:text-slate-800"
                title="Voltar para lista de quadros"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#1F619E] text-white font-mono text-xs uppercase font-extrabold tracking-wider shadow-sm">
                COLIH
              </span>
              <span className="text-sm font-semibold text-slate-400">/</span>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{board.title}</h1>
              <span className="text-xs sm:text-sm font-bold text-slate-600 px-3 py-1 rounded-full bg-slate-100">
                {totalCardsCount} cartões
              </span>
            </div>
          </div>

          {/* Busca & Ações */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar demandas, médicos..."
                className="h-9 pl-9 pr-3 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
              />
            </div>

            {!isViewer && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setQuickHospitalId(hospitals[0]?.id || '');
                    setQuickMemberId(members[0]?.id || '');
                    setQuickVisitError(null);
                    setIsQuickVisitModalOpen(true);
                  }}
                  className="h-9 px-4 rounded-full bg-[#1F619E] hover:bg-[#1A5285] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Visita</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewListModalOpen(true)}
                  className="h-9 px-4 rounded-full border border-[#1F619E] text-[#1F619E] hover:bg-sky-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Coluna</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Linha de Filtros por Hospital com Letras Ampliadas */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-sm">
          <span className="text-slate-600 font-extrabold uppercase text-xs mr-1 flex-shrink-0 tracking-wider">Hospital:</span>
          <button
            type="button"
            onClick={() => setSelectedHospitalId('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              selectedHospitalId === 'ALL'
                ? 'neu-btn-active bg-neu-bg text-brand-600 border border-brand-200 shadow-sm'
                : 'neu-btn text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas as Unidades ({totalCardsCount})
          </button>
          {hospitals.map((hosp) => (
            <button
              key={hosp.id}
              type="button"
              onClick={() => setSelectedHospitalId(hosp.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                selectedHospitalId === hosp.id
                  ? 'neu-btn-active bg-neu-bg text-brand-600 border border-brand-200 shadow-sm'
                  : 'neu-btn text-slate-600 hover:text-slate-900'
              }`}
            >
              {hosp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Workflow Board - Centerpiece com Destaque Máximo */}
      <section className="flex-1 min-h-0 flex gap-5 overflow-x-auto pb-3 pt-1 select-none scroll-smooth">
        {filteredLists.length === 0 ? (
          <div className="w-full py-16 text-center neu-panel p-8 self-center">
            <p className="text-base font-bold text-slate-700">Este quadro ainda não possui colunas.</p>
            {!isViewer && (
              <button
                type="button"
                onClick={() => setIsNewListModalOpen(true)}
                className="mt-4 px-5 py-2.5 text-xs sm:text-sm font-bold text-white neu-btn-primary rounded-xl"
              >
                Criar Coluna
              </button>
            )}
          </div>
        ) : (
          filteredLists.map((list, listIdx) => (
            <div
              key={list.id}
              onDragOver={(e) => onDragOver(e, list.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDropList(e, list.id)}
              className={`w-[380px] min-w-[360px] flex-shrink-0 rounded-2xl p-4 transition-all flex flex-col h-full ${
                dragOverListId === list.id
                  ? 'neu-well ring-2 ring-brand-500/50 bg-brand-50/30'
                  : 'neu-well'
              }`}
            >
              {/* Cabeçalho da Coluna com Tipografia Ampliada */}
              <div className="flex items-center justify-between pb-3 px-1 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#1F619E]"></span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-wide uppercase">{list.title}</h2>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-mono text-xs font-bold">
                    {list.cards.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateCard(list.id)}
                      className="neu-btn p-1.5 text-slate-500 hover:text-brand-600 rounded-lg"
                      title="Adicionar demanda nesta coluna"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => setDeletingListId(list.id)}
                      className="neu-btn p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Excluir Coluna"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pl-0.5 py-1">
                {list.cards.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => !isViewer && handleOpenCreateCard(list.id)}
                    disabled={isViewer}
                    className="w-full neu-panel p-6 text-center flex flex-col items-center justify-center gap-2 mt-2 border border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/30 transition-all rounded-xl cursor-pointer group"
                    title={isViewer ? 'Fila vazia' : 'Clique para adicionar um cartão diretamente aqui'}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 group-hover:text-brand-700">Fila vazia</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isViewer ? 'Sem demandas nesta etapa.' : 'Clique aqui para adicionar um cartão'}
                      </p>
                    </div>
                  </button>
                ) : (
                  list.cards.map((card) => {
                    const completed = isCardCompleted(card);
                    const items = card.checklistItems || [];
                    const hasLegacy = !!card.checklistTitle;
                    const totalChecklist = items.length + (hasLegacy ? 1 : 0);
                    const completedChecklist =
                      items.filter((i) => i.isDone).length + (hasLegacy && card.checklistDone ? 1 : 0);
                    const isChecklistReady = totalChecklist > 0 && completedChecklist === totalChecklist;

                    return (
                      <div
                        key={card.id}
                        draggable={!isViewer}
                        onDragStart={(e) => onDragStart(e, card.id)}
                        onClick={() => {
                          setSelectedCard(card);
                          refreshSelectedCard(card.id);
                        }}
                        className={`neu-card neu-card-hover p-4 sm:p-5 flex flex-col gap-3 relative group rounded-2xl ${
                          !isViewer ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                        } ${completed ? 'ring-2 ring-emerald-400/80 bg-emerald-50/20' : ''}`}
                      >
                        {/* ETIQUETAS COLORIDAS NO CARD COM GESTÃO DIRETA */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {card.labels && card.labels.length > 0 ? (
                            <>
                              {card.labels.map((lbl) => (
                                <button
                                  key={lbl.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardForLabels(card);
                                  }}
                                  style={{
                                    backgroundColor: lbl.color,
                                    color: '#ffffff',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center leading-tight tracking-wide hover:opacity-90 transition-opacity"
                                  title={`Etiqueta: ${lbl.title || lbl.name || 'Sem título'} (Clique para gerenciar)`}
                                >
                                  {lbl.title || lbl.name || '•'}
                                </button>
                              ))}
                              {!isViewer && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardForLabels(card);
                                  }}
                                  className="p-1 rounded-lg neu-btn text-slate-400 hover:text-brand-600 text-xs"
                                  title="Adicionar / Criar Etiquetas neste Cartão"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            !isViewer && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCardForLabels(card);
                                }}
                                className="px-2.5 py-1 rounded-lg neu-btn text-xs font-bold text-slate-400 hover:text-brand-600 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                                title="Criar etiqueta colorida para este card"
                              >
                                <Tag className="w-3.5 h-3.5 text-brand-500" />
                                <span>+ Etiqueta</span>
                              </button>
                            )
                          )}
                        </div>

                        {/* Linha de Tags, Status e Prontidão */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg neu-badge bg-neu-bg text-slate-700 font-mono text-xs font-bold">
                              {card.tag || (card.hospital ? card.hospital.name.slice(0, 10).toUpperCase() : 'COLIH')}
                            </span>
                            {card.statusBadge && !completed && (
                              <span className="px-2.5 py-1 neu-badge bg-neu-bg text-brand-600 text-xs font-bold">
                                {card.statusBadge}
                              </span>
                            )}
                          </div>

                          {/* Status de Concluído ou Pronto para Avançar */}
                          {completed ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ✓ Concluído
                            </span>
                          ) : isChecklistReady ? (
                            <span
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 animate-pulse"
                              title="Checklist 100% pronto! Liberado para seguir para a próxima coluna/área"
                            >
                              🚀 Pronto p/ avançar
                            </span>
                          ) : null}
                        </div>

                        {/* Título e Descrição */}
                        <div>
                          <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors leading-snug tracking-tight">
                            {card.title}
                          </h3>
                          {card.description && (
                            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                              {card.description}
                            </p>
                          )}
                        </div>

                        {/* Médico Vinculado (se houver) */}
                        {card.doctor && (
                          <div className="neu-panel px-3 py-2 text-xs flex items-center justify-between rounded-xl">
                            <span className="font-bold text-slate-800 truncate">
                              Dr(a). {card.doctor.name}
                            </span>
                            <span className="text-xs text-brand-600 font-semibold truncate ml-2">
                              {card.doctor.specialty}
                            </span>
                          </div>
                        )}

                        {/* Checklist Dinâmico com suporte a itens individuais e prontidão */}
                        {totalChecklist > 0 && (
                          <div className="neu-panel p-3 mt-0.5 space-y-2 text-xs rounded-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs uppercase">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                                <span>Checklist ({completedChecklist}/{totalChecklist})</span>
                              </span>
                              {isChecklistReady ? (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  ✓ Pronto p/ seguir
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-slate-500 font-mono">
                                  {Math.round((completedChecklist / totalChecklist) * 100)}%
                                </span>
                              )}
                            </div>

                            {/* Barra de progresso do checklist */}
                            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full transition-all ${isChecklistReady ? 'bg-emerald-500' : 'bg-brand-500'}`}
                                style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
                              />
                            </div>

                            {/* Itens do Checklist */}
                            <div className="space-y-1.5 pt-0.5">
                              {items.map((item) => (
                                <label
                                  key={item.id}
                                  className="flex items-center gap-2 cursor-pointer text-xs group/item"
                                >
                                  <input
                                    type="checkbox"
                                    disabled={isViewer}
                                    checked={item.isDone}
                                    onChange={(e) => handleToggleChecklistItemOnBoard(item.id, item.isDone, e)}
                                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                                  />
                                  <span className={item.isDone ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-semibold'}>
                                    {item.title}
                                  </span>
                                </label>
                              ))}

                              {/* Item legado se existir */}
                              {card.checklistTitle && (
                                <label className="flex items-center gap-2 cursor-pointer text-xs">
                                  <input
                                    type="checkbox"
                                    disabled={isViewer}
                                    checked={!!card.checklistDone}
                                    onChange={(e) => handleToggleChecklist(card, e)}
                                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                                  />
                                  <span className={card.checklistDone ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-semibold'}>
                                    {card.checklistTitle}
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Rodapé do Cartão */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-300/40 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5 font-medium">
                            {card.dueDate ? (
                              (() => {
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);
                                const due = new Date(card.dueDate);
                                due.setHours(0, 0, 0, 0);
                                const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                const isCardDone = card.statusBadge?.toLowerCase().includes('conclu') || list.title.toLowerCase().includes('conclu');

                                if (isCardDone) {
                                  return (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                  );
                                }
                                if (diffDays < 0) {
                                  return (
                                    <span
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-300 animate-pulse"
                                      title={`Prazo vencido há ${Math.abs(diffDays)} dia(s)`}
                                    >
                                      <Clock className="w-3 h-3 text-rose-600" />
                                      {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} (Atrasado)
                                    </span>
                                  );
                                }
                                if (diffDays === 0) {
                                  return (
                                    <span
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-black text-[11px] border border-amber-300"
                                      title="Vence hoje!"
                                    >
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      Hoje
                                    </span>
                                  );
                                }
                                if (diffDays <= 3) {
                                  return (
                                    <span
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200"
                                      title={`Vence em ${diffDays} dia(s)`}
                                    >
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ({diffDays}d)
                                    </span>
                                  );
                                }
                                return (
                                  <span
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]"
                                    title={`Prazo da visita: ${new Date(card.dueDate).toLocaleDateString('pt-BR')}`}
                                  >
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-slate-400 text-[11px]">Fluxo contínuo</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {card.assignedMember && (
                              <div
                                className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs neu-badge"
                                title={`${card.assignedMember.user.name} (${card.assignedMember.role || 'Membro'})`}
                              >
                                {card.assignedMember.user.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ações de Mover / Autonomia Flexível de Colunas */}
                        {!isViewer && (
                          <div
                            className="pt-2.5 flex items-center justify-between border-t border-slate-300/40 gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap flex-1">
                              {/* Botão de Concluir Demanda (em QUALQUER coluna) */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleCardCompletion(card, e)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  completed
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'neu-btn text-slate-600 hover:text-emerald-700'
                                }`}
                                title={completed ? 'Demanda concluída! Clique para reabrir.' : 'Concluir esta demanda nesta coluna'}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{completed ? 'Concluído' : 'Concluir'}</span>
                              </button>

                              {/* Seletor Mover para Qualquer Coluna / Assunto */}
                              {board.lists && board.lists.length > 1 && (
                                <select
                                  value={card.listId}
                                  onChange={(e) => {
                                    const destId = e.target.value;
                                    if (destId !== card.listId) {
                                      const destList = board.lists?.find((l) => l.id === destId);
                                      handleMoveCard(card.id, destId, destList ? destList.cards.length : 0);
                                    }
                                  }}
                                  className="neu-btn text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg border-0 bg-transparent cursor-pointer hover:text-brand-600 max-w-[130px] truncate"
                                  title="Mover para qualquer coluna / assunto deste quadro"
                                >
                                  <option value="" disabled>Mover coluna...</option>
                                  {board.lists.map((l) => (
                                    <option key={l.id} value={l.id}>
                                      {l.id === card.listId ? `📍 ${l.title} (Atual)` : `→ ${l.title}`}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Botão Avançar Sequencial (se houver próxima lista) com destaque de Pronto */}
                              {listIdx < filteredLists.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveCard(card.id, filteredLists[listIdx + 1].id, filteredLists[listIdx + 1].cards.length)
                                  }
                                  className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 rounded-lg transition-all ${
                                    isChecklistReady
                                      ? 'neu-btn-primary bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                      : 'neu-btn text-slate-600 hover:text-brand-600'
                                  }`}
                                  title={`Avançar para: ${filteredLists[listIdx + 1].title}${isChecklistReady ? ' (Checklist 100% pronto!)' : ''}`}
                                >
                                  <span>{isChecklistReady ? '🚀 Seguir' : 'Avançar'}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Botão Voltar (se houver coluna anterior) */}
                              {listIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveCard(card.id, filteredLists[listIdx - 1].id, filteredLists[listIdx - 1].cards.length)
                                  }
                                  className="neu-btn px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center rounded-lg"
                                  title={`Retornar para: ${filteredLists[listIdx - 1].title}`}
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCard(card)}
                                className="neu-btn p-2 text-slate-500 hover:text-slate-900 rounded-lg"
                                title="Editar / Ver Detalhes do Cartão"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingCard(card)}
                                className="neu-btn p-2 text-red-500 hover:text-red-700 rounded-lg"
                                title="Excluir Cartão"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botão de Adicionar Card na Coluna */}
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateCard(list.id)}
                  className="mt-3 w-full py-2.5 neu-btn text-xs font-bold text-slate-700 hover:text-brand-600 flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <Plus className="w-4 h-4 text-brand-600" /> Adicionar Card
                </button>
              )}
            </div>
          ))
        )}
      </section>

      {/* Modal Rápido do Usuário: Nova Designação de Visita COLIH */}
      <Modal
        isOpen={isQuickVisitModalOpen}
        onClose={() => setIsQuickVisitModalOpen(false)}
        title="Nova Designação de Visita COLIH"
        maxWidth="md"
      >
        <form onSubmit={handleQuickVisitSubmit} className="space-y-4">
          {quickVisitError && (
            <div className="p-3 rounded-lg bg-red-50 text-xs text-red-700">{quickVisitError}</div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              Nome do Médico Cooperado *
            </label>
            <input
              type="text"
              required
              value={quickDoctorName}
              onChange={(e) => setQuickDoctorName(e.target.value)}
              placeholder="Ex: Dr. Roberto Guimarães"
              className="w-full px-3.5 py-2.5 neu-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                Especialidade Clínica
              </label>
              <select
                value={quickSpecialty}
                onChange={(e) => setQuickSpecialty(e.target.value)}
                className="w-full px-3 py-2.5 neu-input text-xs"
              >
                <option value="Cirurgia Geral">Cirurgia Geral</option>
                <option value="Cardiologia">Cardiologia</option>
                <option value="Oncologia">Oncologia</option>
                <option value="Ortopedia / Traumatologia">Ortopedia / Traumatologia</option>
                <option value="Gastroenterologia">Gastroenterologia</option>
                <option value="Urologia">Urologia</option>
                <option value="Ginecologia e Obstetrícia">Ginecologia e Obstetrícia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                Hospital Alvo
              </label>
              <select
                value={quickHospitalId}
                onChange={(e) => setQuickHospitalId(e.target.value)}
                className="w-full px-3 py-2.5 neu-input text-xs"
              >
                <option value="">Não informado</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Facilitador / Responsável pela Visita
              </label>
            </div>

            {members.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                Nenhum facilitador pré-selecionado (a demanda pode ser criada livremente).
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setQuickMemberId(quickMemberId === m.id ? '' : m.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      quickMemberId === m.id
                        ? 'bg-[#1F619E] text-white shadow-sm'
                        : 'border border-slate-300 text-slate-700 hover:border-[#1F619E]'
                    }`}
                  >
                    <span>{m.user.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300/40">
            <button
              type="button"
              onClick={() => setIsQuickVisitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 neu-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingQuickVisit || !quickDoctorName.trim()}
              className="px-5 py-2 neu-btn-primary text-xs font-bold disabled:opacity-50"
            >
              {isSubmittingQuickVisit ? 'Salvando...' : 'Criar Visita'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Adicionar Coluna */}
      <Modal
        isOpen={isNewListModalOpen}
        onClose={() => setIsNewListModalOpen(false)}
        title="Adicionar Nova Coluna"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateList} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Nome da Coluna *
            </label>
            <input
              type="text"
              required
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Ex: Em Análise..."
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsNewListModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 neu-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreatingList}
              className="px-5 py-2 text-sm font-bold text-white neu-btn-primary disabled:opacity-50"
            >
              {isCreatingList ? 'Adicionando...' : 'Adicionar Coluna'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Rico Anti-Slop de Criação de Cartão */}
      {isCardModalOpen && board && (
        <CreateCardModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          listId={targetListId}
          listTitle={board.lists?.find((l) => l.id === targetListId)?.title || 'Coluna'}
          board={board}
          workspaceId={workspaceId!}
          members={members}
          hospitals={hospitals}
          doctors={doctors}
          eligibleMembers={eligibleMembers}
          superiorMembers={superiorMembers}
          onCardCreated={loadBoardData}
        />
      )}

      {/* Modal Lateral / Detalhes do Cartão e Comentários Reais */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          board={board}
          workspaceId={workspaceId!}
          isViewer={isViewer}
          onClose={() => setSelectedCard(null)}
          onUpdate={(updatedCard) => {
            setSelectedCard(updatedCard);
            loadBoardData();
          }}
          onMoveCard={handleMoveCard}
          onBoardUpdated={loadBoardData}
        />
      )}

      {/* Modal Dedicado de Gestão e Criação de Etiquetas Coloridas no Card */}
      {cardForLabels && board && (
        <CardLabelsModal
          isOpen={true}
          card={cardForLabels}
          board={board}
          workspaceId={workspaceId!}
          isViewer={isViewer}
          onClose={() => setCardForLabels(null)}
          onCardUpdated={(updated) => {
            setCardForLabels(updated);
            if (selectedCard?.id === updated.id) {
              setSelectedCard(updated);
            }
          }}
          onBoardUpdated={loadBoardData}
        />
      )}

      {/* Confirmação de Exclusão de Lista */}
      <ConfirmDialog
        isOpen={!!deletingListId}
        onClose={() => setDeletingListId(null)}
        onConfirm={handleDeleteList}
        title="Excluir Coluna"
        message="Tem certeza que deseja excluir esta coluna? Todos os cartões contidos nela serão removidos permanentemente."
        confirmLabel="Sim, Excluir Coluna"
      />

      {/* Confirmação de Exclusão de Cartão */}
      <ConfirmDialog
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        onConfirm={handleDeleteCard}
        title="Excluir Cartão"
        message={`Deseja realmente excluir o cartão "${deletingCard?.title}"?`}
        confirmLabel="Sim, Excluir"
      />
    </div>
  );
};
