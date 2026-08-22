import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Check, X, Download, Printer } from 'lucide-react';

export const QuotationReportsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const reportTypes = [
    {
      id: 'pending-quotations',
      title: 'Pending Quotations',
      description: 'Quotations awaiting customer approval',
      icon: FileText,
      color: 'bg-amber-50 text-amber-600',
      path: '/manager/reports/quotations/pending'
    },
    {
      id: 'approved-quotations',
      title: 'Approved Quotations',
      description: 'Quotations approved by customers',
      icon: Check,
      color: 'bg-emerald-50 text-emerald-600',
      path: '/manager/reports/quotations/approved'
    },
    {
      id: 'rejected-quotations',
      title: 'Rejected Quotations',
      description: 'Quotations rejected by customers',
      icon: X,
      color: 'bg-rose-50 text-rose-600',
      path: '/manager/reports/quotations/rejected'
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
        <h1 className="text-2xl font-bold text-slate-900">📄 Quotation Reports</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
