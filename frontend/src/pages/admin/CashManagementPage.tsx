import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { 
  Plus, 
  X, 
  Lock, 
  Wallet,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CashTransaction {
  _id: string;
  transactionNumber: string;
  cashIn: number;
  cashOut: number;
  description: string;
  balance: number;
  cashier: string;
  date: string;
}

interface PettyCashData {
  openingBalance: number;
  cashAdded: number;
  cashSpent: number;
  currentBalance: number;
}

export const CashManagementPage: React.FC = () => {
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'register' | 'petty'>('register');
  
  // Cash Transaction Modal
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    cashIn: '',
    cashOut: '',
    description: '',
    cashier: 'Administrator'
  });

  // Petty Cash
  const [pettyCashData, setPettyCashData] = useState<PettyCashData>({
    openingBalance: 0,
    cashAdded: 0,
    cashSpent: 0,
    currentBalance: 0
  });

  const fetchCashRegisters = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getCashRegisters();
      if (res.success) {
        setCashRegisters(res.data);
      }
    } catch (error) {
      toast.error('Failed to load cash registers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCashTransactions = async () => {
    try {
      const res = await financeApi.getCashRegisterTransactions();
      if (res.success) {
        setCashTransactions(res.data);
        
        // Calculate petty cash data from transactions
        const transactions = res.data || [];
        const cashAdded = transactions
          .filter((t: any) => t.transactionType === 'cash_in')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        const cashSpent = transactions
          .filter((t: any) => t.transactionType === 'cash_out')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        // Get current balance from cash register or latest transaction
        const currentBalance = cashRegisters.length > 0 
          ? cashRegisters[0].balance 
          : (transactions.length > 0 ? transactions[0].balance : 0);
        
        setPettyCashData({
          openingBalance: currentBalance - cashAdded + cashSpent,
          cashAdded,
          cashSpent,
          currentBalance
        });
      }
    } catch (error) {
      console.error('Failed to load cash transactions');
    }
  };

  useEffect(() => {
    fetchCashRegisters();
    fetchCashTransactions();
  }, [cashRegisters]);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cashIn = Number(transactionForm.cashIn) || 0;
      const cashOut = Number(transactionForm.cashOut) || 0;

      // Validation: Only one of cashIn or cashOut should be entered
      if ((cashIn > 0 && cashOut > 0) || (cashIn === 0 && cashOut === 0)) {
        toast.error('Only Cash In OR Cash Out should be entered for one transaction');
        setIsSubmitting(false);
        return;
      }

      const currentBalance = cashTransactions.length > 0 
        ? cashTransactions[0].balance 
        : pettyCashData.currentBalance;

      const newBalance = cashIn > 0 ? currentBalance + cashIn : currentBalance - cashOut;

      const transactionData = {
        cashRegister: cashRegisters[0]?._id || 'default',
        transactionType: (cashIn > 0 ? 'cash_in' : 'cash_out') as 'cash_in' | 'cash_out',
        amount: cashIn > 0 ? cashIn : cashOut,
        description: transactionForm.description,
        cashier: transactionForm.cashier
      };

      await financeApi.createCashRegisterTransaction(transactionData);
      toast.success('Cash transaction recorded successfully');
      setShowTransactionModal(false);
      resetTransactionForm();
      fetchCashTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      cashIn: '',
      cashOut: '',
      description: '',
      cashier: 'Administrator'
    });
  };

  const calculateNewBalance = () => {
    const currentBalance = cashTransactions.length > 0 
      ? cashTransactions[0].balance 
      : pettyCashData.currentBalance;
    const cashIn = Number(transactionForm.cashIn) || 0;
    const cashOut = Number(transactionForm.cashOut) || 0;

    if (cashIn > 0) return currentBalance + cashIn;
    if (cashOut > 0) return currentBalance - cashOut;
    return currentBalance;
  };

  const handleAddPettyCash = () => {
    toast.success('Petty cash added successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cash Management</h2>
          <p className="text-sm text-slate-500">Manage cash registers and petty cash</p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'register', label: 'Cash Register' },
            { id: 'petty', label: 'Petty Cash' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSection === section.id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cash Register Section */}
      {activeSection === 'register' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Cash Register
            </h3>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Cash Transaction
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading cash transactions...</div>
          ) : cashTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Transaction No</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Cash In</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Cash Out</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Description</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Balance</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Cashier</th>
                  </tr>
                </thead>
                <tbody>
                  {cashTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-900">{transaction.transactionNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-emerald-600 text-right">
                        {transaction.cashIn > 0 ? formatLKR(transaction.cashIn) : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-rose-600 text-right">
                        {transaction.cashOut > 0 ? formatLKR(transaction.cashOut) : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{transaction.description}</td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right">{formatLKR(transaction.balance)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{transaction.cashier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No cash transactions found. Click "Cash Transaction" to create your first transaction.
            </div>
          )}
        </div>
      )}

      {/* Petty Cash Section */}
      {activeSection === 'petty' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Petty Cash
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-xs font-bold text-slate-700">Opening Balance</span>
              <span className="text-sm font-bold text-slate-900">{formatLKR(pettyCashData.openingBalance)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
              <span className="text-xs font-bold text-slate-700">Cash Added</span>
              <span className="text-sm font-bold text-emerald-600">{formatLKR(pettyCashData.cashAdded)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-rose-50 rounded-lg">
              <span className="text-xs font-bold text-slate-700">Cash Spent</span>
              <span className="text-sm font-bold text-rose-600">{formatLKR(pettyCashData.cashSpent)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-brand-50 rounded-lg border-2 border-brand-200">
              <span className="text-xs font-bold text-slate-700">Current Balance</span>
              <span className="text-lg font-bold text-brand-600">{formatLKR(pettyCashData.currentBalance)}</span>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddPettyCash}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors"
              >
                + Add Petty Cash
              </button>
              <button
                className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors"
              >
                View Transactions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Cash Transaction</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              {/* Transaction No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction No</label>
                <div className="relative">
                  <input
                    type="text"
                    value="CASH-*****"
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Cash In */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Cash In</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span>
                  <input
                    type="number"
                    name="cashIn"
                    value={transactionForm.cashIn}
                    onChange={(e) => setTransactionForm({ ...transactionForm, cashIn: e.target.value, cashOut: '' })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={transactionForm.cashOut !== ''}
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Cash Out */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Cash Out</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span>
                  <input
                    type="number"
                    name="cashOut"
                    value={transactionForm.cashOut}
                    onChange={(e) => setTransactionForm({ ...transactionForm, cashOut: e.target.value, cashIn: '' })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={transactionForm.cashIn !== ''}
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  placeholder="Service Payment, Fuel, etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Balance */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Balance</span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="text-xs font-bold text-slate-500 absolute left-0 top-1/2 -translate-y-1/2">LKR</span>
                      <input
                        type="text"
                        value={formatLKR(calculateNewBalance())}
                        disabled
                        className="pl-12 pr-8 py-1 border border-slate-200 rounded text-xs bg-slate-100 text-slate-900 font-bold w-32"
                      />
                      <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Auto Calculated</p>
              </div>

              {/* Cashier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Cashier</label>
                <div className="relative">
                  <input
                    type="text"
                    value={transactionForm.cashier}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Current User</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false);
                    resetTransactionForm();
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
