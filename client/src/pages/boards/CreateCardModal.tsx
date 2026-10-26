import React, { useState } from 'react';
import { Board, WorkspaceMember, Hospital, Doctor, CardPriority, BoardLabel } from '../../types/index.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  Plus,
  Trash2,
  Paperclip,
  CheckSquare,
  Tag,
  Calendar,
  AlertCircle,
  X,
  FileText,
  UploadCloud,
  Palette,
  Check,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client.js';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
  board: Board;
  workspaceId: string;
  members: WorkspaceMember[];
  hospitals: Hospital[];
  doctors: Doctor[];
  eligibleMembers: WorkspaceMember[];
  superiorMembers?: WorkspaceMember[];
  onCardCreated: () => Promise<void>;
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

interface LocalChecklistItem {
  id: string;
  title: string;
  isDone: boolean;
}

export const CreateCardModal: React.FC<CreateCardModalProps> = ({
  isOpen,
  onClose,
  listId,
  listTitle,
  board,
  workspaceId,
  hospitals,
  doctors,
  eligibleMembers,
  onCardCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<CardPriority>('MEDIA');
  const [dueDate, setDueDate] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState(eligibleMembers[0]?.id || '');
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || '');
  const [doctorId, setDoctorId] = useState('');
  const [cardCategory, setCardCategory] = useState<'VISITA' | 'PROTOCOLO' | 'HLC_37' | 'FACILITADOR' | 'PROJETO'>('VISITA');
  const [statusBadge, setStatusBadge] = useState('Em contato');

  // Gestão de Etiquetas Selecionadas
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelTitle, setNewLabelTitle] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#10b981');
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  // Checklist de Múltiplos Itens (com suporte a tickar)
  const [checklistItems, setChecklistItems] = useState<LocalChecklistItem[]>([
    { id: '1', title: 'Checagem de prontuário e diretiva bioética', isDone: false },
  ]);
  const [newItemTitle, setNewItemTitle] = useState('');

  // Anexos de Arquivos para Upload
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle de etiqueta existente
  const handleToggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  // Criar nova etiqueta no quadro e selecionar
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelTitle.trim() && !newLabelColor) return;
    setIsSavingLabel(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/boards/${board.id}/labels`, {
        title: newLabelTitle.trim() || null,
        color: newLabelColor,
      });
      const createdLabel: BoardLabel = res.data.data.label;
      setSelectedLabelIds((prev) => [...prev, createdLabel.id]);
      setNewLabelTitle('');
      setIsCreatingLabel(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSavingLabel(false);
    }
  };

  // Adicionar item ao checklist local
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: String(Date.now()), title: newItemTitle.trim(), isDone: false },
    ]);
    setNewItemTitle('');
  };

  // Toggle checklist item
  const handleToggleChecklistItem = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isDone: !item.isDone } : item))
    );
  };

  // Remover item do checklist
  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Manipulação de Arquivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Salvar Cartão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título da demanda.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Criar o cartão
      const payload = {
        listId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignedMemberId: assignedMemberId || null,
        hospitalId: hospitalId || null,
        doctorId: doctorId || null,
        statusBadge: statusBadge || null,
        cardCategory,
        labelIds: selectedLabelIds,
        checklistItems: checklistItems.map((item) => item.title),
      };

      const res = await api.post(`/workspaces/${workspaceId}/boards/cards`, payload);
      const newCard = res.data.data.card;

      // 2. Se houver itens de checklist marcados como 'concluídos', atualizar status
      if (newCard.checklistItems && newCard.checklistItems.length > 0) {
        for (let i = 0; i < checklistItems.length; i++) {
          if (checklistItems[i].isDone && newCard.checklistItems[i]) {
            try {
              await api.patch(
                `/workspaces/${workspaceId}/boards/checklist-items/${newCard.checklistItems[i].id}`,
                { isDone: true }
              );
            } catch (err) {
              console.warn('Falha ao atualizar status do checklist item:', err);
            }
          }
        }
      }

      // 3. Se houver arquivos anexados, enviar cada um
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('cardId', newCard.id);
          try {
            await api.post(`/workspaces/${workspaceId}/attachments/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (err) {
            console.error('Falha no upload do arquivo:', file.name, err);
          }
        }
      }

      await onCardCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = checklistItems.filter((i) => i.isDone).length;
  const progressPercent =
    checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="7xl">
      <form onSubmit={handleSubmit} className="p-2 text-slate-800 space-y-4">
        {/* Cabeçalho Horizontal da Demanda */}
        <div className="border-b border-slate-300/40 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-bold text-brand-600 uppercase tracking-wider">Nova Demanda</span>
              <span>/</span>
              <span>Coluna: <strong className="text-slate-800">{listTitle}</strong></span>
            </div>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da demanda (Ex: Visita ao Dr. Carlos - Alinhamento PBM)..."
              className="w-full text-base sm:text-lg font-bold text-slate-900 neu-input px-3.5 py-2.5 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
            <div className="w-36">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Categoria
              </label>
              <select
                value={cardCategory}
                onChange={(e) => setCardCategory(e.target.value as 'VISITA' | 'PROTOCOLO' | 'HLC_37' | 'FACILITADOR' | 'PROJETO')}
                className="w-full px-2.5 py-1.5 neu-input text-xs font-semibold"
              >
                <option value="VISITA">Visita Médica</option>
                <option value="PROTOCOLO">Protocolo Clínico</option>
                <option value="HLC_37">Apresentação HLC-37</option>
                <option value="FACILITADOR">Facilitador Hospitalar</option>
                <option value="PROJETO">Projeto / Gestão</option>
              </select>
            </div>

            <div className="w-32">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Status
              </label>
              <input
                type="text"
                value={statusBadge}
                onChange={(e) => setStatusBadge(e.target.value)}
                placeholder="Ex: Em contato"
                className="w-full px-2.5 py-1.5 neu-input text-xs"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Layout Horizontal Esticado em 3 Colunas Sem Rolagem */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Coluna 1: Descrição Ampla & Anexos */}
          <div className="space-y-3.5">
            <div className="neu-panel p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Descrição da Demanda</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Diretrizes & Notas
                </span>
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Insira notas completas da demanda: histórico de contatos com o corpo clínico, alinhamento sobre estratégias bloodless, literatura técnica entregue, procedimentos agendados..."
                className="w-full p-3 neu-input text-xs leading-relaxed resize-y"
              />
            </div>

            <div className="neu-panel p-3.5 space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-brand-600" />
                  <span>Anexar Documentos</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  PDFs, diretivas, formulários
                </span>
              </label>

              <div className="p-3 text-center border border-dashed border-slate-300 rounded-xl relative hover:border-brand-500 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Clique ou arraste arquivos aqui"
                />
                <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-700">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-[10px] text-slate-400">
                  Máximo 15MB por arquivo
                </p>
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {attachedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="neu-card p-2 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <FileText className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-800 truncate text-[11px]">{f.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 neu-btn text-slate-400 hover:text-rose-600"
                        title="Remover anexo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2: Etiquetas & Checklist */}
          <div className="space-y-3.5">
            {/* Seção de Etiquetas */}
            <div className="neu-panel p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-brand-600" />
                  <span>Etiquetas Coloridas</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                  className="neu-btn px-2 py-0.5 text-[11px] font-bold text-brand-600 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isCreatingLabel ? 'Fechar' : 'Nova'}</span>
                </button>
              </div>

              {isCreatingLabel && (
                <div className="neu-panel p-2.5 space-y-2 bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">
                    Criar nova etiqueta:
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newLabelTitle}
                      onChange={(e) => setNewLabelTitle(e.target.value)}
                      placeholder="Nome da etiqueta..."
                      className="flex-1 px-2.5 py-1 neu-input text-xs"
                    />
                    <button
                      type="button"
                      disabled={isSavingLabel || !newLabelTitle.trim()}
                      onClick={handleCreateLabel}
                      className="px-3 py-1 neu-btn-primary text-xs font-bold whitespace-nowrap disabled:opacity-50"
                    >
                      {isSavingLabel ? '...' : 'Salvar'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {BOARD_LABEL_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setNewLabelColor(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        className={`w-6 h-6 rounded-md shadow-sm flex items-center justify-center transition-transform hover:scale-110 ${
                          newLabelColor.toLowerCase() === col.hex.toLowerCase()
                            ? 'ring-2 ring-slate-800 scale-110'
                            : ''
                        }`}
                        title={col.name}
                      >
                        {newLabelColor.toLowerCase() === col.hex.toLowerCase() && (
                          <Check className="w-3 h-3 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                    <div className="flex items-center gap-1 pl-1 ml-auto">
                      <Palette className="w-3 h-3 text-slate-400" />
                      <input
                        type="color"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        title="Cor personalizada"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 items-center max-h-28 overflow-y-auto">
                {board.labels && board.labels.length > 0 ? (
                  board.labels.map((lbl) => {
                    const isSelected = selectedLabelIds.includes(lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => handleToggleLabel(lbl.id)}
                        style={{
                          backgroundColor: lbl.color,
                          color: '#ffffff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-1 ring-slate-800 scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span>{lbl.title || lbl.name || 'Etiqueta'}</span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Nenhuma etiqueta criada. Use "+ Nova" para adicionar.
                  </span>
                )}
              </div>
            </div>

            {/* Seção de Checklist */}
            <div className="neu-panel p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Checklist ({completedCount}/{checklistItems.length})
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-teal-700">
                  {progressPercent}%
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="bg-teal-600 h-full transition-all duration-300 rounded-full"
                />
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 neu-card text-xs group"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={item.isDone}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                      />
                      <span
                        className={
                          item.isDone
                            ? 'line-through text-slate-400 font-medium text-[11px]'
                            : 'text-slate-800 font-semibold text-[11px]'
                        }
                      >
                        {item.title}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="p-1 neu-btn text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem(e);
                    }
                  }}
                  placeholder="Nova tarefa (Enter)..."
                  className="flex-1 px-2.5 py-1.5 neu-input text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-3 py-1.5 neu-btn text-xs font-bold text-slate-700 hover:text-teal-600 flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3 h-3" />
                  <span>Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* Coluna 3: Metadados, Vínculos & Prazo */}
          <div className="space-y-3.5">
            {/* Prioridade */}
            <div className="neu-panel p-3.5 space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase block">
                Prioridade da Demanda
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'BAIXA', label: 'Baixa', color: 'text-slate-600' },
                  { key: 'MEDIA', label: 'Média', color: 'text-brand-600' },
                  { key: 'ALTA', label: 'Alta', color: 'text-amber-600' },
                  { key: 'CRITICA', label: 'Crítica', color: 'text-rose-600' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key as CardPriority)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                      priority === p.key
                        ? 'neu-btn-active bg-neu-bg border border-brand-300 ' + p.color
                        : 'neu-btn text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Membro Designado */}
            <div className="neu-panel p-3.5 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase block">
                Membro Designado
              </label>
              <select
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full px-2.5 py-1.5 neu-input text-xs"
              >
                <option value="">Não atribuído</option>
                {eligibleMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Centro Hospitalar */}
            <div className="neu-panel p-3.5 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase block">
                Centro Hospitalar
              </label>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full px-2.5 py-1.5 neu-input text-xs"
              >
                <option value="">Nenhum hospital selecionado</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} {h.city ? `(${h.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Médico de Referência */}
            <div className="neu-panel p-3.5 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase block">
                Médico de Referência
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-2.5 py-1.5 neu-input text-xs"
              >
                <option value="">Nenhum médico selecionado</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr(a). {d.name} — {d.specialty} (CRM {d.crm})
                  </option>
                ))}
              </select>
            </div>

            {/* Prazo de Entrega */}
            <div className="neu-panel p-3.5 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Prazo de Entrega</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 neu-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-300/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 neu-btn"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 text-xs font-bold text-white neu-btn-primary disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Criando demanda...' : 'Criar Cartão Completo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
