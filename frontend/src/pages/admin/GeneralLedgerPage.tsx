import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { Search, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export const GeneralLedgerPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await financeApi.getChartOfAccounts({ status: 'Active' });
      if (res.success) {
        setAccounts(res.data);
      }
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const fetchLedgerData = async () => {
    if (!selectedAccount) return;
    
    setIsLoading(true);
    try {
      const res = await financeApi.getGeneralLedger({
        accountCode: selectedAccount,
        startDate: dateRange.from || undefined,
        endDate: dateRange.to || undefined
      });
      if (res.success) {
        setLedgerData(res.data);
      }
    } catch (error) {
      toast.error('Failed to load ledger data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchLedgerData();
    }
  }, [selectedAccount, dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">General Ledger</h2>
          <p className="text-sm text-slate-500">View detailed account transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Select Account</option>
            {accounts.map(account => (
              <option key={account.code} value={account.code}>{account.code} - {account.name}</option>
            ))}
          </select>

          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors">
            Apply Filter
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Date</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Reference</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Description</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Debit</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Credit</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((entry, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-600">{entry.date}</td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-900">{entry.reference}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{entry.description}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{entry.debit > 0 ? formatLKR(entry.debit) : '—'}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{entry.credit > 0 ? formatLKR(entry.credit) : '—'}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right">{formatLKR(entry.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};