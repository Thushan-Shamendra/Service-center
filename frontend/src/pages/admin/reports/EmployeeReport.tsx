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
import { Download, FileText, Filter, RotateCcw, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const EmployeeReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    employee: '',
    department: '',
    dateFrom: '',
    dateTo: ''
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
      const res = await dashboardApi.getEmployeeReport(filters);
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
      employee: '',
      department: '',
      dateFrom: formatDate(firstDay),
      dateTo: formatDate(today)
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
        <h2 className="text-lg font-bold text-slate-900 mb-4">Employee Performance Reports</h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">FILTERS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Employee</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Employees</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Department / Role</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Departments</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            
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
            {/* Employee Performance Table */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">EMPLOYEE PERFORMANCE TABLE</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Employee</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Jobs</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Completed</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Avg Time</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Revenue</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.employees?.map((emp: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3 text-xs font-mono font-bold text-slate-900">{emp.id}</td>
                        <td className="py-2 px-3 text-xs text-right text-slate-600">{emp.jobs}</td>
                        <td className="py-2 px-3 text-xs text-right text-slate-600">{emp.completed}</td>
                        <td className="py-2 px-3 text-xs text-right text-slate-600">{emp.avgTime}</td>
                        <td className="py-2 px-3 text-xs font-bold text-slate-900 text-right">{formatLKR(emp.revenue)}</td>
                        <td className="py-2 px-3 text-xs text-right font-bold text-emerald-600">{emp.rating}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jobs Completed Chart */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Jobs Completed</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.employees || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="completed" fill="#0000FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Generated Chart */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Revenue Generated</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.employees || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v: any) => [formatLKR(v), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Average Service Completion Time */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Average Service Completion Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={reportData.employees || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
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
