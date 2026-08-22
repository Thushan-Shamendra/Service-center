import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
    </div>
    <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm animate-pulse">
    <div className="h-10 bg-slate-100 rounded-xl mb-4"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 py-3 border-b border-slate-50 last:border-0">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
      </div>
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <TableSkeleton rows={6} />
  </div>
);

// Named export alias so Dashboard files can import { LoadingSkeleton }
export { PageSkeleton as LoadingSkeleton };
