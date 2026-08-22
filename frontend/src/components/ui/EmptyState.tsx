import React from 'react';
import { Wrench } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There is no data to display at this time.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center my-4 shadow-sm">
      <div className="w-16 h-16 bg-blue-50 text-brand-500 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
        {icon || <Wrench className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-all duration-200"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
