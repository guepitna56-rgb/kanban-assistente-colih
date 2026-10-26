import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
}) => {
  const variantStyles = {
    default: 'bg-neu-bg text-slate-700 border-slate-300/40',
    primary: 'bg-blue-100/70 text-blue-800 border-blue-200',
    success: 'bg-emerald-100/70 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100/70 text-amber-800 border-amber-200',
    danger: 'bg-rose-100/70 text-rose-800 border-rose-200',
    purple: 'bg-purple-100/70 text-purple-800 border-purple-200',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span className={`inline-flex items-center font-bold neu-badge border ${variantStyles} ${sizeStyles}`}>
      {children}
    </span>
  );
};
