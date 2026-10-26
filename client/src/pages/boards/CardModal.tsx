import React, { useState, useRef, useEffect } from 'react';
import { Card, Board, BoardLabel } from '../../types/index.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  Tag,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlignLeft,
  Activity,
  CheckSquare,
  Plus,
  X,
  Check,
  Trash2,
  Search,
  Download,
  UploadCloud,
  FileText,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client.js';

interface CardModalProps {
  card: Card;
  board: Board;
  workspaceId: string;
  isViewer?: boolean;
  onClose: () => void;
  onUpdate: (updatedCard: Card) => void;
  onMoveCard: (cardId: string, destListId: string, newPosition: number) => Promise<void>;
  onBoardUpdated?: () => Promise<void>;
}

const BOARD_LABEL_COLORS = [
  { name: 'Verde Esmeralda', hex: '#10b981' },
  { name: 'Azul Royal', hex: '#3b82f6' },
  { name: 'Âmbar / Amarelo', hex: '#f59e0b' },
  { name: 'Vermelho Vivo', hex: '#ef4444' },
  { name: 'Roxo / Violeta', hex: '#8b5cf6' },
  { name: 'Rosa Vibrante', hex: '#ec4899' },
  { name: 'Ciano', hex: '#06b6d4' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Verde Petróleo', hex: '#14b8a6' },
  { name: 'Cinza Ardósia', hex: '#64748b' },
];

export const CardModal: React.FC<CardModalProps> = ({
  card,
  board,
  workspaceId,
  isViewer,
  onClose,
  onUpdate,
  onMoveCard,
  onBoardUpdated,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(card.description || '');

  // Gestão de Etiquetas (Labels do Quadro)
  const [isLabelsPopoverOpen, setIsLabelsPopoverOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelTitle, setNewLabelTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  // Gestão de Checklist Dinâmico
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);
  const checklistInputRef = useRef<HTMLInputElement>(null);

  // Gestão de Anexos
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestão Dinâmica de Datas e Prazos da Demanda / Visita
  const [isDatesPopoverOpen, setIsDatesPopoverOpen] = useState(false);
  const [cardStartDate, setCardStartDate] = useState(card.startDate ? card.startDate.split('T')[0] : '');
  const [cardDueDate, setCardDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
  const [isSavingDates, setIsSavingDates] = useState(false);

  useEffect(() => {
    setCardStartDate(card.startDate ? card.startDate.split('T')[0] : '');
    setCardDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
  }, [card.startDate, card.dueDate]);

  const handleSaveDates = async (sDate?: string, dDate?: string) => {
    if (!workspaceId || isViewer) return;
    setIsSavingDates(true);
    try {
      const finalStart = sDate !== undefined ? sDate : cardStartDate;
      const finalDue = dDate !== undefined ? dDate : cardDueDate;

      await api.patch(`/workspaces/${workspaceId}/boards/cards/${card.id}`, {
        startDate: finalStart ? new Date(finalStart).toISOString() : null,
        dueDate: finalDue ? new Date(finalDue).toISOString() : null,
      });

      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
      setIsDatesPopoverOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSavingDates(false);
    }
  };

  // Sincronização Manual com Google Calendar
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [syncCalendarFeedback, setSyncCalendarFeedback] = useState<string | null>(null);

  const handleManualCalendarSync = async () => {
    setIsSyncingCalendar(true);
    setSyncCalendarFeedback(null);
    try {
      const res = await api.post(`/calendar/cards/${card.id}/sync`);
      setSyncCalendarFeedback(res.data.message || 'Sincronizado com o Google Agenda!');
      setTimeout(() => setSyncCalendarFeedback(null), 4000);
    } catch (err) {
      setSyncCalendarFeedback(getErrorMessage(err));
      setTimeout(() => setSyncCalendarFeedback(null), 4000);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleQuickSetDueDate = async (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = d.toISOString().split('T')[0];
    setCardDueDate(dateStr);
    await handleSaveDates(undefined, dateStr);
  };

  const handleClearDates = async () => {
    setCardStartDate('');
    setCardDueDate('');
    await handleSaveDates('', '');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newComment.trim()) return;

    setIsSendingComment(true);
    try {
      await api.post(`/workspaces/${workspaceId}/boards/cards/${card.id}/comments`, {
        content: newComment,
      });
      setNewComment('');

      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!workspaceId || isViewer) return;
    try {
      await api.put(`/workspaces/${workspaceId}/boards/cards/${card.id}`, {
        listId: card.listId,
        title: card.title,
        priority: card.priority,
        description: editedDescription,
      });
      setIsEditingDescription(false);
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Toggle do Checklist legado (se aplicável)
  const handleToggleLegacyChecklist = async () => {
    if (isViewer || !workspaceId) return;
    try {
      await api.patch(`/workspaces/${workspaceId}/boards/cards/${card.id}/checklist`, {
        done: !card.checklistDone,
      });
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Adicionar item ao checklist dinâmico
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !workspaceId || !newChecklistTitle.trim()) return;
    try {
      await api.post(`/workspaces/${workspaceId}/boards/cards/${card.id}/checklist-items`, {
        title: newChecklistTitle.trim(),
      });
      setNewChecklistTitle('');
      setIsAddingChecklistItem(false);
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Alternar status de tarefa do checklist ("deixar tickado")
  const handleToggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    if (isViewer || !workspaceId) return;
    try {
      await api.patch(`/workspaces/${workspaceId}/boards/checklist-items/${itemId}`, {
        isDone: !currentStatus,
      });
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Deletar tarefa do checklist
  const handleDeleteChecklistItem = async (itemId: string) => {
    if (isViewer || !workspaceId) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/boards/checklist-items/${itemId}`);
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Upload Real de Anexo
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewer || !workspaceId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cardId', card.id);

    setIsUploadingAttachment(true);
    try {
      await api.post(`/workspaces/${workspaceId}/attachments/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsUploadingAttachment(false);
      e.target.value = '';
    }
  };

  // Deletar anexo
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (isViewer || !workspaceId) return;
    if (!window.confirm('Deseja excluir este anexo permanentemente?')) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/attachments/${attachmentId}`);
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Alternar vínculo de uma etiqueta ao cartão
  const handleToggleLabel = async (label: BoardLabel) => {
    if (isViewer || !workspaceId) return;
    const isAttached = card.labels?.some((l) => l.id === label.id);

    try {
      if (isAttached) {
        await api.delete(`/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${label.id}`);
      } else {
        await api.post(`/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${label.id}`);
      }
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Criar nova etiqueta no quadro e associar ao cartão
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !workspaceId || !selectedColor) return;
    setIsSavingLabel(true);

    try {
      const res = await api.post(`/workspaces/${workspaceId}/boards/${board.id}/labels`, {
        title: newLabelTitle.trim() || null,
        color: selectedColor,
      });
      const newLabel = res.data.data.label;

      await api.post(`/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${newLabel.id}`);

      setNewLabelTitle('');
      setIsCreatingLabel(false);
      if (onBoardUpdated) await onBoardUpdated();

      const cardRes = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(cardRes.data.data.card);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSavingLabel(false);
    }
  };

  // Excluir etiqueta do quadro
  const handleDeleteLabel = async (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isViewer || !workspaceId) return;
    if (!window.confirm('Deseja excluir esta etiqueta do quadro permanentemente?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/boards/labels/${labelId}`);
      if (onBoardUpdated) await onBoardUpdated();
      const cardRes = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(cardRes.data.data.card);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Filtragem de etiquetas para a busca
  const boardLabels = board.labels || [];
  const filteredLabels = boardLabels.filter((lbl) => {
    const text = (lbl.title || lbl.name || '').toLowerCase();
    return text.includes(labelSearch.toLowerCase());
  });

  // Cálculo de Progresso do Checklist Dinâmico
  const checklistItems = card.checklistItems || [];
  const completedChecklistCount = checklistItems.filter((i) => i.isDone).length;
  const checklistPercent =
    checklistItems.length > 0
      ? Math.round((completedChecklistCount / checklistItems.length) * 100)
      : 0;

  const isCardCompleted =
    card.statusBadge?.trim().toLowerCase() === 'concluído' ||
    card.statusBadge?.trim().toLowerCase() === 'concluido' ||
    card.statusBadge?.trim().toUpperCase() === 'CONCLUIDO';

  const handleToggleCardCompletion = async () => {
    if (!workspaceId || isViewer) return;
    const newStatus = isCardCompleted ? 'Em andamento' : 'Concluído';
    try {
      await api.put(`/workspaces/${workspaceId}/boards/cards/${card.id}`, {
        listId: card.listId,
        title: card.title,
        priority: card.priority,
        statusBadge: newStatus,
      });
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onUpdate(res.data.data.card);
      if (onBoardUpdated) await onBoardUpdated();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="" maxWidth="4xl">
      <div className="flex flex-col md:flex-row gap-6 p-2 text-slate-800 relative">
        {/* Main Content (2/3) */}
        <div className="flex-1 space-y-6">
          {/* Header info */}
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 tracking-tight">
                {card.title}
              </h2>
              {isCardCompleted ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs neu-badge flex items-center gap-1.5 border border-emerald-300 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Demanda Concluída
                </span>
              ) : checklistPercent === 100 && checklistItems.length > 0 ? (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs neu-badge flex items-center gap-1.5 border border-emerald-300">
                  🚀 Pronto para seguir
                </span>
              ) : null}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span>Na coluna:</span>
              <span className="font-bold text-brand-600 underline underline-offset-2">
                {board.lists?.find((l) => l.id === card.listId)?.title}
              </span>
            </div>
          </div>

          {/* Badges e Propriedades de Cabeçalho */}
          <div className="flex flex-wrap gap-x-6 gap-y-4 items-start">
            {/* Membros Section */}
            {((card.members && card.members.length > 0) || card.assignedMember) && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Membros
                </h3>
                <div className="flex items-center gap-1.5">
                  {card.assignedMember && (
                    <div
                      className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold neu-badge"
                      title={card.assignedMember.user.name}
                    >
                      {card.assignedMember.user.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {card.members?.map((m) => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold neu-badge"
                      title={m.user.name}
                    >
                      {m.user.name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labels Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Etiquetas
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {card.labels && card.labels.length > 0 ? (
                  card.labels.map((label) => (
                    <span
                      key={label.id}
                      onClick={() => !isViewer && setIsLabelsPopoverOpen(true)}
                      style={{
                        backgroundColor: label.color,
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      }}
                      className="px-3 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      title="Clique para gerenciar etiquetas"
                    >
                      <span>{label.title || label.name || 'Etiqueta'}</span>
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLabel(label);
                          }}
                          className="hover:bg-black/20 rounded-full p-0.5 text-white/90"
                          title="Remover do cartão"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Sem etiquetas</span>
                )}

                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => setIsLabelsPopoverOpen(true)}
                    className="w-7 h-7 neu-btn text-slate-700 hover:text-brand-600 flex items-center justify-center text-xs font-bold rounded-md"
                    title="Adicionar / Gerenciar Etiquetas"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Dates Section Interativa com Status de Prazo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Prazo da Demanda / Visita
                </h3>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => setIsDatesPopoverOpen(true)}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline"
                  >
                    {card.startDate || card.dueDate ? 'Alterar' : '+ Definir Prazo'}
                  </button>
                )}
              </div>

              {card.startDate || card.dueDate ? (
                <div>
                  <div
                  onClick={() => !isViewer && setIsDatesPopoverOpen(true)}
                  className={`flex items-center gap-2 px-3 py-2 neu-panel rounded-xl text-xs font-bold transition-all ${
                    !isViewer ? 'cursor-pointer hover:bg-slate-200/60' : ''
                  }`}
                  title={!isViewer ? 'Clique para alterar o prazo da visita' : undefined}
                >
                  <Calendar className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span className="text-slate-800">
                    {card.startDate ? `De ${new Date(card.startDate).toLocaleDateString('pt-BR')}` : ''}
                    {card.startDate && card.dueDate ? ' até ' : ''}
                    {card.dueDate ? new Date(card.dueDate).toLocaleDateString('pt-BR') : ''}
                  </span>

                  {/* Badge Dinâmico de Situação do Prazo */}
                  {(() => {
                    if (!card.dueDate) return null;
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const due = new Date(card.dueDate);
                    due.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    if (isCardCompleted) {
                      return (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Concluído
                        </span>
                      );
                    }
                    if (diffDays < 0) {
                      return (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Atrasado ({Math.abs(diffDays)}d)
                        </span>
                      );
                    }
                    if (diffDays === 0) {
                      return (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Vence Hoje!
                        </span>
                      );
                    }
                    if (diffDays <= 3) {
                      return (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Faltam {diffDays}d
                        </span>
                      );
                    }
                    return (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Faltam {diffDays}d
                      </span>
                    );
                  })()}
                </div>

                {/* Google Calendar Sync Indicator */}
                {card.dueDate && card.assignedMember && (
                  <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200/80 text-[11px] font-semibold text-blue-900 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google Agenda: Sincronização Mobile</span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Vinculado
                    </span>
                  </div>
                )}
              </div>
            ) : (
                <button
                  type="button"
                  onClick={() => setIsDatesPopoverOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 neu-btn text-xs font-bold text-slate-600 hover:text-brand-600 rounded-xl w-full justify-center"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>+ Definir data da visita / prazo limite</span>
                </button>
              )}
            </div>
          </div>

          {/* Description Section (Ampla e Espaçosa) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-slate-500" />
                Descrição Completa
              </h3>
              {!isViewer && !isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="px-3 py-1 neu-btn text-slate-700 text-xs font-bold"
                >
                  Editar Descrição
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  rows={7}
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Insira notas completas, histórico clínico, alinhamento com a diretoria médica..."
                  className="w-full p-4 neu-input text-sm leading-relaxed"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDescription}
                    className="px-4 py-1.5 neu-btn-primary text-xs font-bold"
                  >
                    Salvar Descrição
                  </button>
                  <button
                    onClick={() => setIsEditingDescription(false)}
                    className="px-4 py-1.5 neu-btn text-slate-600 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`p-4 neu-panel text-sm whitespace-pre-wrap leading-relaxed cursor-pointer rounded-xl ${
                  !card.description ? 'text-slate-400 italic' : 'text-slate-800 font-normal'
                }`}
                onClick={() => !isViewer && setIsEditingDescription(true)}
                title="Clique para editar a descrição"
              >
                {card.description || 'Nenhuma descrição adicionada ainda. Clique para adicionar detalhes completos...'}
              </div>
            )}
          </div>

          {/* Checklist Dinâmico com Múltiplas Tarefas ("Deixar Tickado") */}
          <div className="neu-panel p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Checklist de Verificação ({completedChecklistCount}/{checklistItems.length})
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700">
                {checklistPercent}% concluído
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${checklistPercent}%` }}
                className="bg-teal-600 h-full transition-all duration-300 rounded-full"
              />
            </div>

            {/* Aviso de Prontidão quando 100% */}
            {checklistPercent === 100 && checklistItems.length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚀</span>
                  <span>Checklist 100% concluído! Este card já pode seguir para frente ou para outra coluna.</span>
                </div>
              </div>
            )}

            {/* Itens do Checklist */}
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 neu-card text-xs group transition-all"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      disabled={isViewer}
                      checked={item.isDone}
                      onChange={() => handleToggleChecklistItem(item.id, item.isDone)}
                      className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <span
                      className={
                        item.isDone
                          ? 'line-through text-slate-400 font-medium'
                          : 'text-slate-800 font-semibold'
                      }
                    >
                      {item.title}
                    </span>
                  </label>

                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="p-1 neu-btn text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Excluir item do checklist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Item Legado se existir e não tiver sido migrado */}
              {card.checklistTitle && checklistItems.length === 0 && (
                <div className="flex items-center justify-between p-2.5 neu-card text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      disabled={isViewer}
                      checked={!!card.checklistDone}
                      onChange={handleToggleLegacyChecklist}
                      className="w-4 h-4 rounded text-teal-600 border-slate-300"
                    />
                    <span
                      className={
                        card.checklistDone
                          ? 'line-through text-slate-400 font-medium'
                          : 'text-slate-800 font-semibold'
                      }
                    >
                      {card.checklistTitle}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Formulário para Adicionar Item */}
            {!isViewer && (
              <div>
                {isAddingChecklistItem ? (
                  <form onSubmit={handleAddChecklistItem} className="space-y-2 pt-1">
                    <input
                      ref={checklistInputRef}
                      type="text"
                      autoFocus
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      placeholder="Adicione um item para verificar (Ex: Entregar formulário HLC-31)..."
                      className="w-full px-3 py-2 neu-input text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!newChecklistTitle.trim()}
                        className="px-4 py-1.5 neu-btn-primary text-xs font-bold disabled:opacity-50"
                      >
                        Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingChecklistItem(false)}
                        className="px-3 py-1.5 neu-btn text-xs font-semibold text-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingChecklistItem(true);
                      setTimeout(() => checklistInputRef.current?.focus(), 50);
                    }}
                    className="neu-btn px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-teal-600 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar item ao checklist</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Anexos de Arquivos (Upload Real, Download & Exclusão) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-brand-600" />
                <span>Anexos ({card.attachments?.length || 0})</span>
              </h3>

              {!isViewer && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleUploadAttachment}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingAttachment}
                    onClick={() => fileInputRef.current?.click()}
                    className="neu-btn px-3 py-1.5 text-xs font-bold text-brand-600 flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingAttachment ? 'Enviando...' : 'Anexar Arquivo'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Anexos */}
            {card.attachments && card.attachments.length > 0 ? (
              <div className="space-y-2">
                {card.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="neu-card p-3 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg neu-panel flex items-center justify-center text-brand-600 flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-800 truncate" title={att.originalName}>
                          {att.originalName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(att.sizeBytes / 1024).toFixed(1)} KB •{' '}
                          {new Date(att.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`/api/workspaces/${workspaceId}/attachments/${att.id}/download`}
                        download={att.originalName}
                        className="neu-btn px-2.5 py-1 text-[11px] font-bold text-slate-700 flex items-center gap-1"
                        title="Baixar arquivo"
                      >
                        <Download className="w-3.5 h-3.5 text-brand-600" />
                        <span>Baixar</span>
                      </a>

                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 neu-btn text-slate-400 hover:text-rose-600"
                          title="Excluir anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="neu-panel p-4 text-center text-xs text-slate-400 italic">
                Nenhum documento ou arquivo anexado a esta demanda.
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                Atividade & Comentários
              </h3>
            </div>

            {/* Comment Box */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold neu-badge">
                EU
              </div>
              <form onSubmit={handleAddComment} className="flex-1 space-y-2">
                <div className="neu-panel p-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário ou atualização sobre a demanda..."
                    className="w-full p-2.5 text-sm bg-transparent outline-none resize-none min-h-[60px]"
                  />
                  <div className="px-2 py-1.5 flex justify-end gap-2 border-t border-slate-300/40">
                    <button
                      type="submit"
                      disabled={isSendingComment || !newComment.trim()}
                      className="px-4 py-1.5 neu-btn-primary text-xs font-bold disabled:opacity-50"
                    >
                      {isSendingComment ? 'Enviando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Activity Feed */}
            <div className="space-y-3">
              {card.comments?.map((cm) => (
                <div key={cm.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold neu-badge">
                    {cm.author?.user?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-800">{cm.author?.user?.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(cm.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="neu-card p-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {cm.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="w-full md:w-56 flex-shrink-0 space-y-4">
          {!isViewer && board.lists && (
            <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Coluna / Assunto do Quadro
              </h4>

              {/* Seletor Livre para QUALQUER coluna */}
              <select
                value={card.listId}
                onChange={async (e) => {
                  const targetId = e.target.value;
                  if (targetId && targetId !== card.listId) {
                    const destList = board.lists?.find((l) => l.id === targetId);
                    await onMoveCard(card.id, targetId, destList ? destList.cards.length : 0);
                  }
                }}
                className="w-full px-3 py-2 neu-input text-xs font-bold text-slate-800"
                title="Mover para qualquer coluna / assunto deste quadro"
              >
                {board.lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id === card.listId ? `📍 ${l.title} (Coluna Atual)` : `→ Mover para: ${l.title}`}
                  </option>
                ))}
              </select>

              {/* Ações Rápidas de Sequência */}
              {(() => {
                const lists = board.lists || [];
                const currentIdx = lists.findIndex((l) => l.id === card.listId);
                const nextList =
                  currentIdx >= 0 && currentIdx < lists.length - 1 ? lists[currentIdx + 1] : null;
                const prevList = currentIdx > 0 ? lists[currentIdx - 1] : null;

                return (
                  <div className="space-y-1.5 pt-1">
                    {nextList && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onMoveCard(card.id, nextList.id, nextList.cards.length);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          checklistPercent === 100 && checklistItems.length > 0
                            ? 'neu-btn-primary bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                            : 'neu-btn-primary text-white'
                        }`}
                        title={`Avançar para: ${nextList.title}`}
                      >
                        <span>
                          {checklistPercent === 100 && checklistItems.length > 0
                            ? `🚀 Seguir p/ ${nextList.title}`
                            : `Avançar: ${nextList.title}`}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {prevList && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onMoveCard(card.id, prevList.id, prevList.cards.length);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 neu-btn text-xs font-bold text-slate-600"
                        title={`Voltar para: ${prevList.title}`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Voltar: {prevList.title}</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Conclusão de Demanda (Independente da Coluna) */}
              <div className="pt-3 border-t border-slate-300/40">
                <button
                  type="button"
                  onClick={handleToggleCardCompletion}
                  className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isCardCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                      : 'neu-btn text-slate-700 hover:text-emerald-700'
                  }`}
                  title={isCardCompleted ? 'Reabrir demanda' : 'Concluir esta demanda nesta coluna'}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isCardCompleted ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{isCardCompleted ? '✓ Concluído (Reabrir)' : 'Marcar como Concluído'}</span>
                </button>
                <p className="text-[10px] text-slate-400 mt-1 text-center">
                  Pode ser concluído em qualquer coluna.
                </p>
              </div>
            </div>
          )}

          <div className="relative">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Adicionar ao cartão
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsLabelsPopoverOpen(!isLabelsPopoverOpen)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-bold transition-all ${
                  isLabelsPopoverOpen
                    ? 'neu-btn-active bg-neu-bg text-brand-600'
                    : 'neu-btn text-slate-700'
                }`}
              >
                <Tag className="w-4 h-4 text-brand-600" />
                Etiquetas
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddingChecklistItem(true);
                  setTimeout(() => checklistInputRef.current?.focus(), 50);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 neu-btn text-slate-700 text-sm font-bold hover:text-teal-600"
              >
                <CheckSquare className="w-4 h-4 text-teal-600" />
                Checklist
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 neu-btn text-slate-700 text-sm font-bold hover:text-brand-600"
              >
                <Paperclip className="w-4 h-4 text-brand-600" />
                Anexo
              </button>

              <button
                type="button"
                onClick={() => setIsDatesPopoverOpen(!isDatesPopoverOpen)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-bold transition-all ${
                  isDatesPopoverOpen
                    ? 'neu-btn-active bg-neu-bg text-brand-600'
                    : 'neu-btn text-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-600" />
                Datas / Prazo
              </button>
            </div>

            {/* Popover de Datas / Prazos Operacionais */}
            {isDatesPopoverOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 neu-card p-4 shadow-neu-flat-lg border border-slate-200/50 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Prazo da Demanda / Visita</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => setIsDatesPopoverOpen(false)}
                    className="p-1 rounded-full neu-btn text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Atalhos Rápidos com 1 Clique */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                    Atalhos Rápidos de Prazo:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickSetDueDate(0)}
                      className="neu-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-brand-600 text-left"
                    >
                      ⚡ Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetDueDate(1)}
                      className="neu-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-brand-600 text-left"
                    >
                      📅 Amanhã (+1d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetDueDate(7)}
                      className="neu-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-brand-600 text-left"
                    >
                      ⏱️ 1 Semana (+7d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetDueDate(15)}
                      className="neu-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-brand-600 text-left"
                    >
                      📆 15 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetDueDate(30)}
                      className="neu-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-brand-600 text-left"
                    >
                      🗓️ 1 Mês (+30d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetDueDate(60)}
                      className="neu-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-brand-600 text-left"
                    >
                      🗓️ 2 Meses (+60d)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-300/40">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Data de Início (Opcional):
                    </label>
                    <input
                      type="date"
                      value={cardStartDate}
                      onChange={(e) => setCardStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 neu-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Data de Entrega / Prazo Limite *:
                    </label>
                    <input
                      type="date"
                      value={cardDueDate}
                      onChange={(e) => setCardDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 neu-input text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-300/40">
                  {(card.startDate || card.dueDate || cardStartDate || cardDueDate) && (
                    <button
                      type="button"
                      disabled={isSavingDates}
                      onClick={handleClearDates}
                      className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Remover Prazo
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSavingDates}
                    onClick={() => handleSaveDates()}
                    className="ml-auto px-4 py-1.5 neu-btn-primary text-xs font-bold disabled:opacity-50"
                  >
                    {isSavingDates ? 'Salvando...' : 'Salvar Prazo'}
                  </button>
                </div>
              </div>
            )}

            {/* Popover de Etiquetas do Quadro */}
            {isLabelsPopoverOpen && (
              <div className="absolute right-0 top-10 z-50 w-72 neu-card p-4 shadow-neu-flat-lg border border-slate-200/50 flex flex-col gap-3">
                {/* Cabeçalho do Popover */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isCreatingLabel ? 'Criar Etiqueta' : 'Etiquetas'}
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLabelsPopoverOpen(false);
                      setIsCreatingLabel(false);
                    }}
                    className="p-1 rounded-full neu-btn text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!isCreatingLabel ? (
                  <>
                    {/* Campo de Busca */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={labelSearch}
                        onChange={(e) => setLabelSearch(e.target.value)}
                        placeholder="Procurar etiquetas..."
                        className="w-full pl-8 pr-3 py-1.5 neu-input text-xs"
                      />
                    </div>

                    {/* Lista de Etiquetas do Quadro com Checkbox */}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {filteredLabels.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2 italic">
                          Nenhuma etiqueta encontrada.
                        </p>
                      ) : (
                        filteredLabels.map((lbl) => {
                          const isAttached = card.labels?.some((l) => l.id === lbl.id);
                          return (
                            <div key={lbl.id} className="flex items-center gap-2 group">
                              <button
                                type="button"
                                onClick={() => handleToggleLabel(lbl)}
                                style={{ backgroundColor: lbl.color }}
                                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm flex items-center justify-between transition-transform active:scale-95"
                              >
                                <span className="truncate">{lbl.title || lbl.name || 'Etiqueta'}</span>
                                {isAttached && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                              </button>

                              {!isViewer && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteLabel(lbl.id, e)}
                                  className="p-1.5 neu-btn text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Excluir etiqueta do quadro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Botão para Criar Nova Etiqueta */}
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingLabel(true)}
                        className="w-full py-2 neu-btn text-xs font-bold text-slate-700 hover:text-brand-600 flex items-center justify-center gap-1.5 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Criar nova etiqueta
                      </button>
                    )}
                  </>
                ) : (
                  /* Formulário de Criação de Etiqueta com Paleta */
                  <form onSubmit={handleCreateLabel} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={newLabelTitle}
                        onChange={(e) => setNewLabelTitle(e.target.value)}
                        placeholder="Ex: Alta Prioridade, PBM..."
                        className="w-full px-3 py-2 neu-input text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                          Selecione uma cor
                        </label>
                        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                          {selectedColor}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        {BOARD_LABEL_COLORS.map((col) => (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => setSelectedColor(col.hex)}
                            style={{ backgroundColor: col.hex }}
                            className={`h-8 rounded-lg shadow-sm flex items-center justify-center transition-transform hover:scale-105 ${
                              selectedColor.toLowerCase() === col.hex.toLowerCase()
                                ? 'ring-2 ring-slate-800 scale-105'
                                : ''
                            }`}
                            title={col.name}
                          >
                            {selectedColor.toLowerCase() === col.hex.toLowerCase() && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 p-1.5 neu-panel rounded-lg">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          title="Personalizar cor"
                        />
                        <span className="text-[10px] text-slate-600 font-medium">
                          Paleta personalizada (RGB/Hex)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-300/40">
                      <button
                        type="submit"
                        disabled={isSavingLabel}
                        className="flex-1 py-1.5 neu-btn-primary text-xs font-bold disabled:opacity-50"
                      >
                        {isSavingLabel ? 'Criando...' : 'Criar e Vincular'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingLabel(false)}
                        className="py-1.5 px-3 neu-btn text-xs font-semibold text-slate-600"
                      >
                        Voltar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Bloco de Integração com Google Agenda */}
          <div className="pt-4 border-t border-slate-300/40 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Agenda</span>
              </h4>
              {card.dueDate && card.assignedMember && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sincronização ativa" />
              )}
            </div>

            <button
              type="button"
              onClick={handleManualCalendarSync}
              disabled={isSyncingCalendar || !card.dueDate || !card.assignedMember}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 neu-btn text-slate-700 text-xs font-bold hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
              title={
                !card.dueDate || !card.assignedMember
                  ? 'Defina um facilitador e um prazo no cartão para sincronizar com o Google Agenda'
                  : 'Sincronizar esta visita agora com o Google Agenda do facilitador'
              }
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
              <span>{isSyncingCalendar ? 'Sincronizando...' : 'Sincronizar Agenda'}</span>
            </button>

            {syncCalendarFeedback && (
              <p className="text-[10px] text-blue-700 font-semibold text-center animate-fade-in bg-blue-50 p-1.5 rounded-lg border border-blue-200">
                {syncCalendarFeedback}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
