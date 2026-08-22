import React, { useState, useEffect } from 'react';
import { formatDate } from '../../../utils/formatters';
import { dashboardApi } from '../../../api/dashboardApi';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Download, FileText, Filter, RotateCcw, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    registrationDateFrom: '',
    registrationDateTo: '',
    status: '',
    customerType: ''
  });

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    setFilters({
      ...filters,
      registrationDateFrom: formatDate(firstDay),
      registrationDateTo: formatDate(today)
    });
  }, []);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardApi.getCustomerReport(filters);
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
    const firstDay = new Date(today.getFullYear(), 0, 1);
    setFilters({
      registrationDateFrom: formatDate(firstDay),
      registrationDateTo: formatDate(today),
      status: '',
      customerType: ''
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
        <h2 className="text-lg font-bold text-slate-900 mb-4">Customer Reports</h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">FILTERS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Registration Date From</label>
              <input
                type="date"
                value={filters.registrationDateFrom}
                onChange={(e) => setFilters({ ...filters, registrationDateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Registration Date To</label>
              <input
                type="date"
                value={filters.registrationDateTo}
                onChange={(e) => setFilters({ ...filters, registrationDateTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Customer Type</label>
              <select
                value={filters.customerType}
                onChange={(e) => setFilters({ ...filters, customerType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All</option>
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
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
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">CUSTOMER SUMMARY</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Customers', value: reportData.totalCustomers || 0, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Active Customers', value: reportData.activeCustomers || 0, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  { label: 'New Customers', value: reportData.newCustomers || 0, color: 'bg-purple-50 border-purple-200 text-purple-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`p-4 rounded-lg border ${color}`}>
                    <div className="text-xs font-bold opacity-70 mb-1">{label}</div>
                    <div className="text-xl font-extrabold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Registration Trend */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Registration Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={reportData.registrationTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="newCustomers" stroke="#0000FF" strokeWidth={2} dot={{ r: 4, fill: '#0000FF' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Report Table */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Customer ID</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Name</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Registered Vehicles</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Services</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Total Spent</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customers?.map((customer: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3 text-xs font-mono font-bold text-slate-900">{customer.id}</td>
                        <td className="py-2 px-3 text-xs text-slate-600">{customer.name}</td>
                        <td className="py-2 px-3 text-xs text-slate-600">{customer.vehicles}</td>
                        <td className="py-2 px-3 text-xs text-right text-slate-600">{customer.services}</td>
                        <td className="py-2 px-3 text-xs font-bold text-slate-900 text-right">{customer.totalSpent}</td>
                        <td className="py-2 px-3 text-xs text-right text-slate-600">{customer.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
