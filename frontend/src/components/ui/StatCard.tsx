import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  color = 'blue',
  onClick,
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100 text-brand-600 ring-4 ring-blue-100/50',
      hover: 'hover:border-blue-200 hover:shadow-card-hover',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-100/50',
      hover: 'hover:border-emerald-200 hover:shadow-card-hover',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100 text-amber-700 ring-4 ring-amber-100/50',
      hover: 'hover:border-amber-200 hover:shadow-card-hover',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100 text-rose-700 ring-4 ring-rose-100/50',
      hover: 'hover:border-rose-200 hover:shadow-card-hover',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-100 text-purple-700 ring-4 ring-purple-100/50',
      hover: 'hover:border-purple-200 hover:shadow-card-hover',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-100',
      iconBg: 'bg-slate-100 text-slate-700 ring-4 ring-slate-100/50',
      hover: 'hover:border-slate-200 hover:shadow-card-hover',
    },
  };

  const currentStyle = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-3 border shadow-card transition-all duration-200 ${currentStyle.bg} ${currentStyle.border} ${onClick ? `cursor-pointer ${currentStyle.hover}` : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentStyle.iconBg}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`inline-flex items-center text-[10px] font-bold px-1 py-0.5 rounded-md ${
              trend.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isUp ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
            {trend.value}%
          </span>
        )}
      </div>

      {subtext && <p className="text-[10px] text-slate-500 mt-1 font-medium">{subtext}</p>}
    </div>
  );
};
