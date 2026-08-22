import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ClipboardList, AlertTriangle, Wrench, Download, Printer } from 'lucide-react';

export const InventoryReportsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const reportTypes = [
    {
      id: 'parts-issued',
      title: 'Parts Issued',
      description: 'Parts issued to job cards and consumption',
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      path: '/manager/reports/inventory/parts-issued'
    },
    {
      id: 'parts-requests',
      title: 'Parts Requests',
      description: 'Parts requests from technicians',
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600',
      path: '/manager/reports/inventory/parts-requests'
    },
    {
      id: 'low-stock',
      title: 'Low Stock Items',
      description: 'Items below minimum stock level',
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600',
      path: '/manager/reports/inventory/low-stock'
    },
    {
      id: 'stock-usage',
      title: 'Stock Usage by Job Card',
      description: 'Parts consumption per job card',
      icon: Wrench,
      color: 'bg-purple-50 text-purple-600',
      path: '/manager/reports/inventory/stock-usage'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager/reports')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Reports</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">📦 Inventory Reports</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => navigate(report.path)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-brand-300 hover:shadow-md transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-xl ${report.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{report.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{report.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-600">Generate Report</span>
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-600 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-brand-600 group-hover:text-white rotate-180" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
