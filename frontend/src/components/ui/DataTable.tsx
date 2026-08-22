import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './LoadingSkeleton';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
  };
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id?: string; _id?: string }>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Search records...',
  onSearch,
  pagination,
  emptyTitle,
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
      {/* Top bar with Search & Filters */}
      {onSearch && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* Table Content */}
      {!data || data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {columns.map((col, idx) => (
                  <th key={idx} className={`py-3.5 px-4 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, rowIdx) => (
                <tr
                  key={item.id || item._id || rowIdx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`py-3.5 px-4 text-slate-700 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total records: <strong className="text-slate-800">{pagination.totalRecords}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page Numbers */}
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
              let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }
              
              // Show first page if not starting from 1
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => pagination.onPageChange(1)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      pagination.currentPage === 1
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(<span key="ellipsis-start" className="px-2 text-slate-400">...</span>);
                }
              }
              
              // Show page numbers
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => pagination.onPageChange(i)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      pagination.currentPage === i
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              
              // Show last page if not ending at totalPages
              if (endPage < pagination.totalPages) {
                if (endPage < pagination.totalPages - 1) {
                  pages.push(<span key="ellipsis-end" className="px-2 text-slate-400">...</span>);
                }
                pages.push(
                  <button
                    key={pagination.totalPages}
                    onClick={() => pagination.onPageChange(pagination.totalPages)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      pagination.currentPage === pagination.totalPages
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pagination.totalPages}
                  </button>
                );
              }
              
              return pages;
            })()}
            
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
