import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { Plus, Search, Lock, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface Account {
  code: string;
  name: string;
  type: string;
  parent: string;
  status: string;
  level: number;
}

export const ChartOfAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getChartOfAccounts({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined
      });
      if (res.success) {
        // Calculate hierarchy level based on parent
        const accountsWithLevel = res.data.map((account: any) => ({
          ...account,
          level: account.parent ? 1 : 0,
          parent: account.parent || '—'
        }));
        setAccounts(accountsWithLevel);
      }
    } catch (error) {
      toast.error('Failed to load chart of accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        fetchAccounts();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredAccounts = accounts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chart of Accounts</h2>
          <p className="text-sm text-slate-500">Foundation of the accounting module</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Type</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
            <option value="Equity">Equity</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading accounts...</div>
        ) : filteredAccounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Code</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Account Name</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Parent</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr 
                    key={account.code} 
                    className="border-b border-slate-100 hover:bg-slate-50"
                    style={{ paddingLeft: `${account.level * 20}px` }}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-slate-900">{account.code}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {account.level > 0 && <span className="mr-2 text-slate-400">└</span>}
                      {account.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.type === 'Asset' ? 'bg-blue-100 text-blue-700' :
                        account.type === 'Liability' ? 'bg-amber-100 text-amber-700' :
                        account.type === 'Income' ? 'bg-emerald-100 text-emerald-700' :
                        account.type === 'Expense' ? 'bg-rose-100 text-rose-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{account.parent}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No accounts found. Click "Add Account" to create your first account.
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Lock className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Code</label>
                <input
                  type="text"
                  placeholder="e.g., 1010"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g., Cash"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Type</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                  <option value="">Select Type</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Equity">Equity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Parent Account</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                  <option value="">No Parent (Root Account)</option>
                  <option value="1000">1000 - Assets</option>
                  <option value="2000">2000 - Liabilities</option>
                  <option value="3000">3000 - Equity</option>
                  <option value="4000">4000 - Revenue</option>
                  <option value="5000">5000 - Expenses</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors">
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};