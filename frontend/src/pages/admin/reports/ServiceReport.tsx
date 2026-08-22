import React, { useState, useEffect } from 'react';
import { formatLKR, formatDate } from '../../../utils/formatters';
import { dashboardApi } from '../../../api/dashboardApi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Download, FileText, Filter, RotateCcw, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

export const ServiceReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    serviceCategory: '',
    technician: '',
    serviceStatus: 'completed'
  });

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFilters({
      ...filters,
      dateFrom: formatDate(firstDay),
      dateTo: formatDate(today)
    });
  }, []);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardApi.getServiceReport(filters);
      if (res.success) {
        setReportData(res.data);
        toast.success('Report generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFilters({
      dateFrom: formatDate(firstDay),
      dateTo: formatDate(today),
      serviceCategory: '',
      technician: '',
      serviceStatus: 'completed'
    });
    setReportData(null);
  };

  const handleExportPDF = () => {
    toast.success('Exporting PDF...');
  };

  const handleExportExcel = () => {
    toast.success('Exporting Excel...');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Service Reports</h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">FILTERS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Service Category</label>
              <select
                value={filters.serviceCategory}
                onChange={(e) => setFilters({ ...filters, serviceCategory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Categories</option>
                <option value="full-service">Full Service</option>
                <option value="oil-change">Oil Change</option>
                <option value="brake-service">Brake Service</option>
                <option value="ac-service">AC Service</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Technician / Employee</label>
              <select
                value={filters.technician}
                onChange={(e) => setFilters({ ...filters, technician: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Employees</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Filter className="w-3 h-3" />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">SERVICE SUMMARY</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Jobs', value: reportData.totalJobs || 0, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Completed', value: reportData.completed || 0, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  { label: 'Avg Duration', value: `${reportData.avgDuration || 0} min`, color: 'bg-purple-50 border-purple-200 text-purple-700' },
                  { label: 'Avg Revenue', value: formatLKR(reportData.avgRevenue || 0), color: 'bg-amber-50 border-amber-200 text-amber-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`p-4 rounded-lg border ${color}`}>
                    <div className="text-xs font-bold opacity-70 mb-1">{label}</div>
                    <div className="text-xl font-extrabold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services by Category - Horizontal Bar Chart */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Services by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.servicesByCategory || []} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#0000FF" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Services by Technician */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Services by Technician</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.servicesByTechnician || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="technician" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="completedJobs" fill="#0000FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Service Duration */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Service Duration</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={reportData.serviceDuration || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="duration" stroke="#0000FF" strokeWidth={2} dot={{ r: 4, fill: '#0000FF' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Export Section */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">Report Actions:</span>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-3 h-3" />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Export Excel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
