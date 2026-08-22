import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Users, Car, Wrench, DollarSign, Download, FileText, Package, UserCheck, Building2, Calculator, Wrench as WorkshopIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { SalesReport } from './reports/SalesReport';
import { InventoryReport } from './reports/InventoryReport';
import { CustomerReport } from './reports/CustomerReport';
import { ServiceReport } from './reports/ServiceReport';
import { EmployeeReport } from './reports/EmployeeReport';
import { FinancialReport } from './reports/FinancialReport';
import { TaxReport } from './reports/TaxReport';
import { WorkshopReport } from './reports/WorkshopReport';

const CHART_COLORS = ['#0000FF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'inventory' | 'customers' | 'services' | 'employees' | 'financial' | 'tax' | 'workshop'>('overview');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardApi.getAdminStats();
        if (res.success) setStats(res.data);
      } catch {
        toast.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleExport = () => {
    toast.success('Report export initiated (PDF/Excel)');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-slate-100" />
        ))}
      </div>
    );
  }

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'sales', label: 'Sales' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'customers', label: 'Customers' },
    { key: 'services', label: 'Services' },
    { key: 'employees', label: 'Employees' },
    { key: 'financial', label: 'Financial' },
    { key: 'tax', label: 'Tax' },
    { key: 'workshop', label: 'Workshop' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Analyze sales, inventory, customers, services, employees and finance</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl text-sm font-semibold transition-all"
        >
          <Download className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Tab Bar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.key ? 'bg-brand-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue This Month', value: formatLKR(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Services Completed', value: stats?.completedJobCards || 0, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { label: 'Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
              { label: 'Inventory Value', value: formatLKR(stats?.inventoryValue || 0), icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm`}>
                <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Additional KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Employee Efficiency', value: '87%', icon: UserCheck, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100' },
              { label: 'Workshop Utilization', value: '76%', icon: WorkshopIcon, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm`}>
                <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Revenue Overview Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats?.monthlyRevenue || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [formatLKR(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0000FF" fill="#0000FF" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Service Performance Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Service Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.servicesByCategory || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" fill="#0000FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Individual Report Tabs */}
      {activeTab === 'sales' && <SalesReport />}
      {activeTab === 'inventory' && <InventoryReport />}
      {activeTab === 'customers' && <CustomerReport />}
      {activeTab === 'services' && <ServiceReport />}
      {activeTab === 'employees' && <EmployeeReport />}
      {activeTab === 'financial' && <FinancialReport />}
      {activeTab === 'tax' && <TaxReport />}
      {activeTab === 'workshop' && <WorkshopReport />}
    </div>
  );
};
