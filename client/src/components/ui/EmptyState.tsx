import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = 'py-16',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 neu-panel ${className}`}>
      <div className="w-14 h-14 neu-badge bg-neu-bg flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-7 h-7 text-brand-600" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-md font-medium">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex items-center px-5 py-2.5 text-sm font-bold text-white neu-btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
