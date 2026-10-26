import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Carregando...',
  className = 'py-12',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-slate-500 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
