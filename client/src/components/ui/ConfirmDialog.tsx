import React from 'react';
import { Modal } from './Modal.js';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-4 mb-4">
        {isDestructive && (
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 neu-badge">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <p className="text-sm text-slate-700 font-medium leading-relaxed">{message}</p>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-300/40">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-semibold text-slate-700 neu-btn"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`inline-flex items-center px-5 py-2 text-sm font-bold text-white rounded-xl ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-700 shadow-md'
              : 'neu-btn-primary'
          }`}
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
