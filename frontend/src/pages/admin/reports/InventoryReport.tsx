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
  ResponsiveContainer 
} from 'recharts';
import { Download, FileText, Filter, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    stockStatus: '',
    lowStockOnly: false,
    outOfStockOnly: false
  });

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardApi.getInventoryReport(filters);
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
      category: '',
      supplier: '',
      stockStatus: '',
      lowStockOnly: false,
      outOfStockOnly: false
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
        <h2 className="text-lg font-bold text-slate-900 mb-4">Inventory Reports</h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">FILTERS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Categories</option>
                <option value="spare-parts">Spare Parts</option>
                <option value="lubricants">Lubricants</option>
                <option value="tires">Tires</option>
                <option value="batteries">Batteries</option>
                <option value="filters">Filters</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Suppliers</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
            
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={filters.lowStockOnly}
                  onChange={(e) => setFilters({ ...filters, lowStockOnly: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Low Stock Only
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={filters.outOfStockOnly}
                  onChange={(e) => setFilters({ ...filters, outOfStockOnly: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Out of Stock Only
              </label>
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
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">INVENTORY SUMMARY</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Items', value: reportData.totalItems || 0, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Low Stock', value: reportData.lowStock || 0, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                  { label: 'Out of Stock', value: reportData.outOfStock || 0, color: 'bg-rose-50 border-rose-200 text-rose-700' },
                  { label: 'Stock Value', value: formatLKR(reportData.stockValue || 0), color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`p-4 rounded-lg border ${color}`}>
                    <div className="text-xs font-bold opacity-70 mb-1">{label}</div>
                    <div className="text-xl font-extrabold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock by Category Chart */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Stock by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.stockByCategory || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="quantity" fill="#0000FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock Movement Chart */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Stock Movement</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.stockMovement || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="stockIn" fill="#10b981" radius={[6, 6, 0, 0]} name="Stock In" />
                  <Bar dataKey="stockOut" fill="#ef4444" radius={[6, 6, 0, 0]} name="Stock Out" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Reorder Alerts */}
            {reportData.reorderAlerts && reportData.reorderAlerts.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">⚠ Reorder Required</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-amber-200">
                        <th className="text-left py-2 px-3 text-xs font-bold text-amber-800">Item</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-amber-800">Current</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-amber-800">Reorder Level</th>
                        <th className="text-right py-2 px-3 text-xs font-bold text-amber-800">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.reorderAlerts.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-amber-100">
                          <td className="py-2 px-3 text-xs font-medium text-amber-900">{item.name}</td>
                          <td className="py-2 px-3 text-xs text-right text-amber-800">{item.currentStock}</td>
                          <td className="py-2 px-3 text-xs text-right text-amber-800">{item.reorderLevel}</td>
                          <td className="py-2 px-3 text-xs text-right font-bold text-amber-900">{item.required}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
