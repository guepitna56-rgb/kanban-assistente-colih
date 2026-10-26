import React, { useState } from 'react';
import { Card, Board, BoardLabel } from '../../types/index.js';
import { Modal } from '../../components/ui/Modal.js';
import { Plus, Check, Trash2, Search, Palette } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client.js';

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

interface CardLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  board: Board;
  workspaceId: string;
  isViewer: boolean;
  onCardUpdated: (updatedCard: Card) => void;
  onBoardUpdated: () => Promise<void>;
}

export const CardLabelsModal: React.FC<CardLabelsModalProps> = ({
  isOpen,
  onClose,
  card,
  board,
  workspaceId,
  isViewer,
  onCardUpdated,
  onBoardUpdated,
}) => {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle label on the card
  const handleToggleLabel = async (label: BoardLabel) => {
    if (isViewer || !workspaceId) return;
    setError(null);
    const isAttached = card.labels?.some((l) => l.id === label.id);

    try {
      if (isAttached) {
        await api.delete(`/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${label.id}`);
      } else {
        await api.post(`/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${label.id}`);
      }
      const res = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onCardUpdated(res.data.data.card);
      await onBoardUpdated();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Create new label in board and attach to this card
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !workspaceId || !selectedColor) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post(`/workspaces/${workspaceId}/boards/${board.id}/labels`, {
        title: newTitle.trim() || null,
        color: selectedColor,
      });
      const newLabel = res.data.data.label;

      // Attach to card
      await api.post(`/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${newLabel.id}`);

      setNewTitle('');
      setIsCreating(false);
      await onBoardUpdated();

      const cardRes = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onCardUpdated(cardRes.data.data.card);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete label permanently from the board
  const handleDeleteLabel = async (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isViewer || !workspaceId) return;
    if (!window.confirm('Deseja excluir esta etiqueta do quadro permanentemente?')) return;
    setError(null);

    try {
      await api.delete(`/workspaces/${workspaceId}/boards/labels/${labelId}`);
      await onBoardUpdated();
      const cardRes = await api.get(`/workspaces/${workspaceId}/boards/cards/${card.id}`);
      onCardUpdated(cardRes.data.data.card);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const boardLabels = board.labels || [];
  const filteredLabels = boardLabels.filter((lbl) => {
    const text = (lbl.title || lbl.name || '').toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Etiquetas: ${card.title.slice(0, 32)}${card.title.length > 32 ? '...' : ''}`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {!isCreating ? (
          <>
            {/* Campo de Pesquisa */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar etiquetas do quadro..."
                className="w-full pl-9 pr-3 py-2 neu-input text-xs"
              />
            </div>

            {/* Lista de Etiquetas do Quadro */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Etiquetas Disponíveis (Clique para alternar no card)
              </span>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredLabels.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic neu-panel p-4">
                    Nenhuma etiqueta encontrada. Crie uma nova abaixo!
                  </div>
                ) : (
                  filteredLabels.map((lbl) => {
                    const isAttached = card.labels?.some((l) => l.id === lbl.id);
                    return (
                      <div key={lbl.id} className="flex items-center gap-2 group">
                        <button
                          type="button"
                          onClick={() => handleToggleLabel(lbl)}
                          style={{
                            backgroundColor: lbl.color,
                            color: '#ffffff',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-between transition-all hover:opacity-95 ${
                            isAttached ? 'ring-2 ring-offset-1 ring-slate-800' : 'opacity-80'
                          }`}
                        >
                          <span className="truncate">{lbl.title || lbl.name || 'Sem título'}</span>
                          {isAttached ? (
                            <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/70 font-normal">Adicionar</span>
                          )}
                        </button>

                        {!isViewer && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLabel(lbl.id, e)}
                            className="p-2 neu-btn text-slate-400 hover:text-rose-600 transition-colors"
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
            </div>

            {/* Botão de Criação */}
            {!isViewer && (
              <div className="pt-2 border-t border-slate-300/40">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="w-full py-2.5 neu-btn text-xs font-bold text-slate-700 hover:text-brand-600 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-brand-600" />
                  <span>Criar Nova Etiqueta com Cor</span>
                </button>
              </div>
            )}
          </>
        ) : (
          /* Formulário de Criação de Etiqueta com Paleta e Custom Color */
          <form onSubmit={handleCreateLabel} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nome da Etiqueta
              </label>
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Urgente, Bioética, PBM, Visita Realizada..."
                className="w-full px-3.5 py-2 neu-input text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Definir Cor da Etiqueta
                </label>
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] font-bold text-slate-600 uppercase">
                    {selectedColor}
                  </span>
                </div>
              </div>

              {/* Amostras Pré-definidas */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {BOARD_LABEL_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setSelectedColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`h-9 rounded-xl shadow-sm flex items-center justify-center transition-all hover:scale-105 ${
                      selectedColor.toLowerCase() === col.hex.toLowerCase()
                        ? 'ring-2 ring-slate-800 scale-105 shadow-md'
                        : ''
                    }`}
                    title={col.name}
                  >
                    {selectedColor.toLowerCase() === col.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>

              {/* Seletor Customizado de Cor */}
              <div className="flex items-center gap-2 p-2.5 neu-panel rounded-xl">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  title="Escolher qualquer cor personalizada"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Cor personalizada: clique no quadrado para abrir a paleta de cores completa
                </span>
              </div>
            </div>

            {/* Pré-visualização da Etiqueta */}
            <div className="neu-panel p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Pré-visualização no Cartão:
              </span>
              <div
                style={{
                  backgroundColor: selectedColor,
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
                className="inline-block px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                {newTitle.trim() || 'Exemplo de Etiqueta'}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-300/40">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 neu-btn text-xs font-semibold text-slate-600"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 neu-btn-primary text-xs font-bold text-white disabled:opacity-50"
              >
                {isSubmitting ? 'Criando...' : 'Criar e Aplicar ao Card'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
