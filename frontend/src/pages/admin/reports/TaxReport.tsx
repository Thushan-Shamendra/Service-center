import React, { useState, useEffect } from 'react';
import { formatLKR, formatDate } from '../../../utils/formatters';
import { financeApi } from '../../../api/financeApi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Download, FileText, Filter, RotateCcw, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

export const TaxReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    taxPeriod: 'August 2026',
    taxType: '',
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
      const res = await financeApi.getTaxReport(filters);
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
      taxPeriod: 'August 2026',
      taxType: '',
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
        <h2 className="text-lg font-bold text-slate-900 mb-4">Tax Reports</h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">FILTERS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tax Period</label>
              <select
                value={filters.taxPeriod}
                onChange={(e) => setFilters({ ...filters, taxPeriod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="June 2026">June 2026</option>
                <option value="May 2026">May 2026</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tax Type</label>
              <select
                value={filters.taxType}
                onChange={(e) => setFilters({ ...filters, taxType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All</option>
                <option value="vat">VAT</option>
                <option value="income-tax">Income Tax</option>
                <option value="withholding-tax">Withholding Tax</option>
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
            {/* Tax Summary */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">TAX SUMMARY</span>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Taxable Sales</span>
                    <span className="font-bold text-slate-900">{formatLKR(reportData.taxableSales || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Output Tax</span>
                    <span className="font-bold text-slate-900">{formatLKR(reportData.outputTax || 0)}</span>
                  </div>
                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Taxable Expenses</span>
                    <span className="font-bold text-slate-900">{formatLKR(reportData.taxableExpenses || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Input Tax</span>
                    <span className="font-bold text-slate-900">{formatLKR(reportData.inputTax || 0)}</span>
                  </div>
                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Net Tax</span>
                    <span className="text-emerald-600">{formatLKR(reportData.netTax || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Chart */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Tax Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.taxByType || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v: any) => [formatLKR(v), '']}
                  />
                  <Bar dataKey="outputTax" fill="#ef4444" radius={[6, 6, 0, 0]} name="Output Tax" />
                  <Bar dataKey="inputTax" fill="#10b981" radius={[6, 6, 0, 0]} name="Input Tax" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tax Report Table */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Tax Report</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Date</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Reference</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Tax Type</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Taxable Amount</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Tax</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions?.map((txn: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3 text-xs text-slate-600">{formatDate(txn.date)}</td>
                        <td className="py-2 px-3 text-xs font-mono font-bold text-slate-900">{txn.reference}</td>
                        <td className="py-2 px-3 text-xs text-slate-600">{txn.taxType}</td>
                        <td className="py-2 px-3 text-xs font-bold text-slate-900 text-right">{formatLKR(txn.taxableAmount)}</td>
                        <td className="py-2 px-3 text-xs font-bold text-slate-900 text-right">{formatLKR(txn.tax)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            txn.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
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
