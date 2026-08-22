import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR } from '../../utils/formatters';
import { Download, FileText, Table } from 'lucide-react';
import toast from 'react-hot-toast';

export const TrialBalancePage: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [trialBalanceData, setTrialBalanceData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, isBalanced: true });
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrialBalance = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getTrialBalance({ asOfDate });
      if (res.success) {
        setTrialBalanceData(res.data);
        setSummary(res.summary);
      }
    } catch (error) {
      toast.error('Failed to load trial balance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, [asOfDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Trial Balance</h2>
          <p className="text-sm text-slate-500">Summary of all account balances</p>
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

      {/* Trial Balance Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Account</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Debit (LKR)</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Credit (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {trialBalanceData.map((item, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-900">{item.account}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{item.debit > 0 ? formatLKR(item.debit) : '—'}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{item.credit > 0 ? formatLKR(item.credit) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <td className="py-3 px-4 text-sm font-bold text-slate-900">TOTAL</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right">{formatLKR(summary.totalDebit)}</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right">{formatLKR(summary.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Balance Status */}
        <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${summary.isBalanced ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-sm font-bold text-slate-900">
              Status: {summary.isBalanced ? '🟢 Balanced' : '🔴 Not Balanced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};