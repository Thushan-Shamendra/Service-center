import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR } from '../../utils/formatters';
import { Download, FileText, Table, Building2, Scale } from 'lucide-react';
import toast from 'react-hot-toast';

export const BalanceSheetPage: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceSheetData, setBalanceSheetData] = useState<any>({
    assets: [],
    liabilities: [],
    equity: [],
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    isBalanced: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalanceSheet = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getBalanceSheet({ asOfDate });
      if (res.success) {
        setBalanceSheetData(res.data);
      }
    } catch (error) {
      toast.error('Failed to load balance sheet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Balance Sheet</h2>
          <p className="text-sm text-slate-500">Financial position as of specific date</p>
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

      {/* Date Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-700">As at:</span>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            ASSETS
          </h3>
          <div className="space-y-3">
            {balanceSheetData.assets.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-700">{item.account}</span>
                <span className="text-sm font-bold text-slate-900">{formatLKR(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 border-t-2 border-blue-200 bg-blue-50 rounded-lg px-3 mt-4">
              <span className="text-sm font-bold text-blue-900">Total Assets</span>
              <span className="text-sm font-bold text-blue-900">{formatLKR(balanceSheetData.totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity Section */}
        <div className="space-y-6">
          {/* Liabilities */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">LIABILITIES</h3>
            <div className="space-y-3">
              {balanceSheetData.liabilities.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-700">{item.account}</span>
                  <span className="text-sm font-bold text-slate-900">{formatLKR(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 border-t-2 border-amber-200 bg-amber-50 rounded-lg px-3 mt-4">
                <span className="text-sm font-bold text-amber-900">Total Liabilities</span>
                <span className="text-sm font-bold text-amber-900">{formatLKR(balanceSheetData.totalLiabilities)}</span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">EQUITY</h3>
            <div className="space-y-3">
              {balanceSheetData.equity.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-700">{item.account}</span>
                  <span className="text-sm font-bold text-slate-900">{formatLKR(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 border-t-2 border-purple-200 bg-purple-50 rounded-lg px-3 mt-4">
                <span className="text-sm font-bold text-purple-900">Total Equity</span>
                <span className="text-sm font-bold text-purple-900">{formatLKR(balanceSheetData.totalEquity)}</span>
              </div>
            </div>
          </div>

          {/* Total Liabilities + Equity */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center py-3 border-t-2 border-slate-300 bg-slate-50 rounded-lg px-4">
              <span className="text-sm font-bold text-slate-900">Liabilities + Equity</span>
              <span className="text-sm font-bold text-slate-900">{formatLKR(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Validation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <Scale className="w-5 h-5 text-slate-400" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${balanceSheetData.isBalanced ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
            <div className={`w-3 h-3 rounded-full ${balanceSheetData.isBalanced ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-sm font-bold">
              {balanceSheetData.isBalanced ? '✓ Balance Sheet Balanced' : '⚠ Balance Sheet Not Balanced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};