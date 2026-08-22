import React, { useState, useEffect } from 'react';
import { formatLKR } from '../../../utils/formatters';
import { financeApi } from '../../../api/financeApi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { Download, FileText, Filter, RotateCcw, DollarSign, Building2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const FinancialReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<'profit-loss' | 'balance-sheet' | 'cash-flow'>('profit-loss');
  
  const [filters, setFilters] = useState({
    financialYear: '2026',
    month: 'August',
    reportType: 'profit-loss'
  });

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getFinancialReport(filters);
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
    setFilters({
      financialYear: '2026',
      month: 'August',
      reportType: 'profit-loss'
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
        <h2 className="text-lg font-bold text-slate-900 mb-4">Financial Reports</h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">FILTERS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Financial Year</label>
              <select
                value={filters.financialYear}
                onChange={(e) => setFilters({ ...filters, financialYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Month</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Report Type</label>
              <select
                value={filters.reportType}
                onChange={(e) => {
                  setFilters({ ...filters, reportType: e.target.value });
                  setReportType(e.target.value as any);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="profit-loss">Profit & Loss</option>
                <option value="balance-sheet">Balance Sheet</option>
                <option value="cash-flow">Cash Flow</option>
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
            {/* Profit & Loss Report */}
            {reportType === 'profit-loss' && (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">PROFIT & LOSS</span>
                  </div>
                </div>

                {/* P&L Chart */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Monthly Comparison</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={reportData.monthlyComparison || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                        formatter={(v: any) => [formatLKR(v), '']}
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" />
                      <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expenses" />
                      <Bar dataKey="profit" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* P&L Summary */}
                <div className="mb-4 bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">P&L Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Revenue</span>
                      <span className="font-bold text-slate-900">{formatLKR(reportData.revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Cost of Sales</span>
                      <span className="font-bold text-slate-900">{formatLKR(reportData.costOfSales || 0)}</span>
                    </div>
                    <div className="border-t border-slate-200 my-2"></div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">Gross Profit</span>
                      <span className="text-emerald-600">{formatLKR(reportData.grossProfit || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Operating Expenses</span>
                      <span className="font-bold text-slate-900">{formatLKR(reportData.operatingExpenses || 0)}</span>
                    </div>
                    <div className="border-t border-slate-200 my-2"></div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">Net Profit</span>
                      <span className="text-emerald-600">{formatLKR(reportData.netProfit || 0)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Balance Sheet Report */}
            {reportType === 'balance-sheet' && (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">BALANCE SHEET</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {/* Assets */}
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="text-sm font-bold text-emerald-800 mb-3">ASSETS</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700">Cash</span>
                        <span className="font-bold text-emerald-900">{formatLKR(reportData.cash || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700">Bank</span>
                        <span className="font-bold text-emerald-900">{formatLKR(reportData.bank || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700">Inventory</span>
                        <span className="font-bold text-emerald-900">{formatLKR(reportData.inventory || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-700">Receivable</span>
                        <span className="font-bold text-emerald-900">{formatLKR(reportData.receivable || 0)}</span>
                      </div>
                      <div className="border-t border-emerald-200 my-2"></div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-800">TOTAL</span>
                        <span className="text-emerald-900">{formatLKR(reportData.totalAssets || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                    <h3 className="text-sm font-bold text-rose-800 mb-3">LIABILITIES</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-rose-700">Suppliers</span>
                        <span className="font-bold text-rose-900">{formatLKR(reportData.suppliers || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-rose-700">Loans</span>
                        <span className="font-bold text-rose-900">{formatLKR(reportData.loans || 0)}</span>
                      </div>
                      <div className="border-t border-rose-200 my-2"></div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-rose-800">TOTAL</span>
                        <span className="text-rose-900">{formatLKR(reportData.totalLiabilities || 0)}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-rose-800 mb-3 mt-4">EQUITY</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-rose-700">Owner Capital</span>
                        <span className="font-bold text-rose-900">{formatLKR(reportData.ownerCapital || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-rose-700">Retained Earnings</span>
                        <span className="font-bold text-rose-900">{formatLKR(reportData.retainedEarnings || 0)}</span>
                      </div>
                      <div className="border-t border-rose-200 my-2"></div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-rose-800">Total Equity</span>
                        <span className="text-rose-900">{formatLKR(reportData.totalEquity || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Cash Flow Report */}
            {reportType === 'cash-flow' && (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">CASH FLOW</span>
                  </div>
                </div>

                {/* Cash Flow Chart */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Cash Flow Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={reportData.cashFlowTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                        formatter={(v: any) => [formatLKR(v), '']}
                      />
                      <Area type="monotone" dataKey="openingCash" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} name="Opening Cash" />
                      <Area type="monotone" dataKey="inflows" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Inflows" />
                      <Area type="monotone" dataKey="outflows" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Outflows" />
                      <Area type="monotone" dataKey="closingCash" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Closing Cash" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Cash Flow Summary */}
                <div className="mb-4 bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Cash Flow Statement</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">OPERATING ACTIVITIES</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Customer Payments</span>
                        <span className="font-bold text-emerald-600">+{formatLKR(reportData.customerPayments || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Supplier Payments</span>
                        <span className="font-bold text-rose-600">{formatLKR(reportData.supplierPayments || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Operating Expenses</span>
                        <span className="font-bold text-rose-600">{formatLKR(reportData.operatingExpenses || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">INVESTING ACTIVITIES</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Equipment Purchase</span>
                        <span className="font-bold text-rose-600">{formatLKR(reportData.equipmentPurchase || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">FINANCING ACTIVITIES</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Loan Received</span>
                        <span className="font-bold text-emerald-600">+{formatLKR(reportData.loanReceived || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Net Cash Flow</span>
                    <span className="text-emerald-600">{formatLKR(reportData.netCashFlow || 0)}</span>
                  </div>
                </div>
              </>
            )}

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
