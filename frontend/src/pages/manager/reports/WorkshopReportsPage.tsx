import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, ClipboardList, Users, Gauge, Download, Printer } from 'lucide-react';

export const WorkshopReportsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const reportTypes = [
    {
      id: 'active-jobs',
      title: 'Active Jobs',
      description: 'Currently active job cards and their status',
      icon: Wrench,
      color: 'bg-rose-50 text-rose-600',
      path: '/manager/reports/workshop/active-jobs'
    },
    {
      id: 'completed-jobs',
      title: 'Completed Jobs',
      description: 'Job cards completed during selected period',
      icon: ClipboardList,
      color: 'bg-emerald-50 text-emerald-600',
      path: '/manager/reports/workshop/completed-jobs'
    },
    {
      id: 'technician-productivity',
      title: 'Technician Productivity',
      description: 'Technician performance and efficiency metrics',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      path: '/manager/reports/workshop/technician-productivity'
    },
    {
      id: 'workshop-queue',
      title: 'Workshop Queue',
      description: 'Current workshop queue and waiting times',
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600',
      path: '/manager/reports/workshop/queue'
    },
    {
      id: 'bay-utilization',
      title: 'Service Bay Utilization',
      description: 'Service bay usage and efficiency',
      icon: Gauge,
      color: 'bg-purple-50 text-purple-600',
      path: '/manager/reports/workshop/bay-utilization'
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
        <h1 className="text-2xl font-bold text-slate-900">🔧 Workshop Reports</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
