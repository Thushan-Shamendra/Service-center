import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR } from '../../utils/formatters';
import { Download, FileText, Table, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfitLossPage: React.FC = () => {
  const [period, setPeriod] = useState('2026-08');
  const [profitLossData, setProfitLossData] = useState<any>({
    revenue: [],
    expenses: [],
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfitLoss = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getProfitLoss({ startDate: `${period}-01`, endDate: `${period}-31` });
      if (res.success) {
        setProfitLossData(res.data);
      }
    } catch (error) {
      toast.error('Failed to load profit & loss statement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profit & Loss</h2>
          <p className="text-sm text-slate-500">Income statement for the selected period</p>
        </div>
        
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <Table className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-700">Period:</span>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            REVENUE
          </h3>
          <div className="space-y-3">
            {profitLossData.revenue.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-700">{item.account}</span>
                <span className="text-sm font-bold text-slate-900">{formatLKR(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 border-t-2 border-emerald-200 bg-emerald-50 rounded-lg px-3 mt-4">
              <span className="text-sm font-bold text-emerald-900">Total Revenue</span>
              <span className="text-sm font-bold text-emerald-900">{formatLKR(profitLossData.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-600" />
            EXPENSES
          </h3>
          <div className="space-y-3">
            {profitLossData.expenses.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-700">{item.account}</span>
                <span className="text-sm font-bold text-slate-900">{formatLKR(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 border-t-2 border-rose-200 bg-rose-50 rounded-lg px-3 mt-4">
              <span className="text-sm font-bold text-rose-900">Total Expenses</span>
              <span className="text-sm font-bold text-rose-900">{formatLKR(profitLossData.totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Profit Summary */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center py-4 border-t-2 border-slate-300 bg-slate-50 rounded-lg px-6">
          <span className="text-lg font-bold text-slate-900">NET PROFIT</span>
          <span className={`text-lg font-bold ${profitLossData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatLKR(profitLossData.netProfit)}
          </span>
        </div>
      </div>
    </div>
  );
};