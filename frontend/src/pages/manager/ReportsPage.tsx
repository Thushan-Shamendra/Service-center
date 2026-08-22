import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Car, 
  Wrench, 
  FileText, 
  CreditCard, 
  Package, 
  Calendar, 
  DollarSign, 
  Download, 
  Printer,
  TrendingUp,
  TrendingDown,
  Filter,
  RotateCcw
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import dayjs from 'dayjs';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  
  // Overview stats
  const [stats, setStats] = useState({
    customers: { count: 428, trend: 8.4, trendUp: true },
    vehicles: { count: 512, trend: 5.2, trendUp: true },
    activeJobs: { count: 24, trend: 3.1, trendUp: false },
    sales: { count: 1245000, trend: 12.5, trendUp: true },
    appointments: { count: 68 },
    quotations: { count: 17 },
    outstanding: { count: 285400 },
    lowStock: { count: 12 }
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = dayjs();
    let from = dayjs();
    
    switch (period) {
      case 'today':
        from = now.startOf('day');
        break;
      case 'this_week':
        from = now.startOf('week');
        break;
      case 'this_month':
        from = now.startOf('month');
        break;
      case 'this_year':
        from = now.startOf('year');
        break;
      case 'custom':
        return;
    }
    
    setDateFrom(from.format('YYYY-MM-DD'));
    setDateTo(now.format('YYYY-MM-DD'));
  };

  const handleReset = () => {
    setSelectedPeriod('this_month');
    setDateFrom(dayjs().startOf('month').format('YYYY-MM-DD'));
    setDateTo(dayjs().format('YYYY-MM-DD'));
  };

  const reportCategories = [
    { 
      id: 'customers', 
      label: 'Customers', 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/manager/reports/customers'
    },
    { 
      id: 'vehicles', 
      label: 'Vehicles', 
      icon: Car, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/manager/reports/vehicles'
    },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: Calendar, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/manager/reports/appointments'
    },
    { 
      id: 'workshop', 
      label: 'Workshop', 
      icon: Wrench, 
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      path: '/manager/reports/workshop'
    },
    { 
      id: 'quotations', 
      label: 'Quotations', 
      icon: FileText, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/manager/reports/quotations'
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: CreditCard, 
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      path: '/manager/reports/invoices'
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Package, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/manager/reports/inventory'
    }
  ];

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    trend, 
    trendUp, 
    isCurrency = false 
  }: { 
    icon: any; 
    label: string; 
    value: number | string; 
    trend?: number; 
    trendUp?: boolean; 
    isCurrency?: boolean;
  }) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-brand-600" />
        {trend !== undefined && (
          <span className={`text-xs flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">
        {isCurrency ? formatCurrency(value as number) : value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">
            Operational performance, workshop activity and customer insights
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">DATE RANGE</span>
          </div>
          
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          
          <span className="text-slate-400">→</span>
          
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom</option>
          </select>
          
          <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
            Apply Filters
          </button>
          
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">OVERVIEW</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard 
            icon={Users} 
            label="Customers" 
            value={stats.customers.count} 
            trend={stats.customers.trend} 
            trendUp={stats.customers.trendUp} 
          />
          <StatCard 
            icon={Car} 
            label="Vehicles" 
            value={stats.vehicles.count} 
            trend={stats.vehicles.trend} 
            trendUp={stats.vehicles.trendUp} 
          />
          <StatCard 
            icon={Wrench} 
            label="Active Jobs" 
            value={stats.activeJobs.count} 
            trend={stats.activeJobs.trend} 
            trendUp={stats.activeJobs.trendUp} 
          />
          <StatCard 
            icon={DollarSign} 
            label="Sales" 
            value={stats.sales.count} 
            trend={stats.sales.trend} 
            trendUp={stats.sales.trendUp} 
            isCurrency 
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Appointments" value={stats.appointments.count} />
          <StatCard icon={FileText} label="Quotations" value={stats.quotations.count} />
          <StatCard icon={CreditCard} label="Outstanding" value={stats.outstanding.count} isCurrency />
          <StatCard icon={Package} label="Low Stock" value={stats.lowStock.count} />
        </div>
      </div>

      {/* Report Categories */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">REPORT CATEGORIES</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reportCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => navigate(category.path)}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-brand-300 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${category.bgColor} ${category.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">{category.label}</span>
                </div>
                <div className="h-1 w-0 bg-brand-500 rounded-full group-hover:w-full transition-all duration-300" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
