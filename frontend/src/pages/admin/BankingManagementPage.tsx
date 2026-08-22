import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { 
  Plus, 
  X, 
  Lock, 
  Calendar, 
  Building2, 
  ArrowDownUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BankAccount {
  _id: string;
  accountNumber: string;
  bankName: string;
  accountType?: string;
  branch?: string;
  balance: number;
  status: string;
}

export const BankingManagementPage: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'accounts' | 'transactions' | 'reconciliation'>('accounts');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [addAccountForm, setAddAccountForm] = useState({
    accountNumber: '',
    bankName: '',
    accountType: 'savings',
    branch: '',
    balance: 0,
    status: 'Active'
  });
  
  // Bank Transaction Modal
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    bankAccountId: '',
    transactionType: 'deposit',
    amount: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    toBankAccountId: '' // for transfers
  });

  // Bank Reconciliation
  const [reconciliationData, setReconciliationData] = useState({
    bankAccountId: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    statementBalance: '',
    systemBalance: 0,
    difference: 0,
    selectedTransactions: [] as string[],
    unreconciledTransactions: [] as any[]
  });

  const fetchBankAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getBankAccounts();
      if (res.success) {
        setBankAccounts(res.data);
      }
    } catch (error) {
      toast.error('Failed to load bank accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBankTransactions = async () => {
    try {
      const res = await financeApi.getBankTransactions();
      if (res.success) {
        setBankTransactions(res.data);
      }
    } catch (error) {
      console.error('Failed to load bank transactions');
    }
  };

  useEffect(() => {
    fetchBankAccounts();
    fetchBankTransactions();
  }, []);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedAccount = bankAccounts.find(acc => acc._id === transactionForm.bankAccountId);
      const currentBalance = selectedAccount?.balance || 0;
      const amount = Number(transactionForm.amount);

      let newBalance = currentBalance;
      if (transactionForm.transactionType === 'deposit') {
        newBalance = currentBalance + amount;
      } else if (transactionForm.transactionType === 'withdrawal') {
        newBalance = currentBalance - amount;
      } else if (transactionForm.transactionType === 'transfer') {
        newBalance = currentBalance - amount;
      }

      const transactionData = {
        bankAccount: transactionForm.bankAccountId,
        transactionType: transactionForm.transactionType as 'deposit' | 'withdrawal' | 'transfer',
        amount,
        description: transactionForm.reference,
        referenceNumber: transactionForm.reference,
        relatedTo: transactionForm.toBankAccountId
      };

      await financeApi.createBankTransaction(transactionData);
      toast.success('Bank transaction recorded successfully');
      setShowTransactionModal(false);
      resetTransactionForm();
      fetchBankAccounts();
      fetchBankTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      bankAccountId: '',
      transactionType: 'deposit',
      amount: '',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      toBankAccountId: ''
    });
  };

  const calculateNewBalance = () => {
    const selectedAccount = bankAccounts.find(acc => acc._id === transactionForm.bankAccountId);
    const currentBalance = selectedAccount?.balance || 0;
    const amount = Number(transactionForm.amount) || 0;

    if (transactionForm.transactionType === 'deposit') {
      return currentBalance + amount;
    } else if (transactionForm.transactionType === 'withdrawal') {
      return currentBalance - amount;
    } else if (transactionForm.transactionType === 'transfer') {
      return currentBalance - amount;
    }
    return currentBalance;
  };

  const handleReconciliation = async () => {
    try {
      const selectedAccount = bankAccounts.find(acc => acc._id === reconciliationData.bankAccountId);
      const systemBalance = selectedAccount?.balance || 0;
      const statementBalance = Number(reconciliationData.statementBalance) || 0;
      const difference = Math.abs(systemBalance - statementBalance);

      setReconciliationData({
        ...reconciliationData,
        systemBalance,
        difference
      });

      // Get unreconciled transactions for the period
      const periodTransactions = bankTransactions.filter(
        t => t.bankAccount === reconciliationData.bankAccountId &&
             new Date(t.date) >= new Date(reconciliationData.startDate) &&
             new Date(t.date) <= new Date(reconciliationData.endDate)
      );

      setReconciliationData(prev => ({
        ...prev,
        unreconciledTransactions: periodTransactions
      }));
    } catch (error) {
      toast.error('Failed to perform reconciliation');
    }
  };

  const handleTransactionSelect = (transactionId: string) => {
    setReconciliationData(prev => ({
      ...prev,
      selectedTransactions: prev.selectedTransactions.includes(transactionId)
        ? prev.selectedTransactions.filter(id => id !== transactionId)
        : [...prev.selectedTransactions, transactionId]
    }));
  };

  const handleMarkReconciled = async () => {
    try {
      toast.success('Selected transactions marked as reconciled');
      setReconciliationData(prev => ({
        ...prev,
        selectedTransactions: []
      }));
      fetchBankTransactions();
    } catch (error) {
      toast.error('Failed to mark transactions as reconciled');
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await financeApi.createBankAccount(addAccountForm);
      if (res.success) {
        toast.success('Bank account added successfully');
        setShowAddAccountModal(false);
        setAddAccountForm({
          accountNumber: '',
          bankName: '',
          accountType: 'savings',
          branch: '',
          balance: 0,
          status: 'Active'
        });
        fetchBankAccounts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add bank account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Banking</h2>
          <p className="text-sm text-slate-500">Manage bank accounts and transactions</p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'accounts', label: 'Bank Accounts' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'reconciliation', label: 'Reconciliation' }
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

      {/* Bank Accounts Section */}
      {activeSection === 'accounts' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Bank Accounts
            </h3>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Bank Account
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading bank accounts...</div>
          ) : bankAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Account</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Bank</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Account No.</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Balance</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccounts.map((account) => (
                    <tr key={account._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-900">BANK-{String(account._id).slice(-5).padStart(5, '0')}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{account.bankName}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">****{account.accountNumber.slice(-4)}</td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right">{(account.balance / 1000000).toFixed(2)}M</td>
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
              No bank accounts found. Click "Add Bank Account" to create your first account.
            </div>
          )}
        </div>
      )}

      {/* Bank Transactions Section */}
      {activeSection === 'transactions' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5" />
              Bank Transactions
            </h3>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
          </div>

          {bankTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Bank</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Type</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Reference</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bankTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-900">{transaction.transactionId || 'BT-' + transaction._id?.slice(-4)}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{transaction.bankAccount?.bankName || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.transactionType === 'deposit' ? 'bg-emerald-100 text-emerald-700' :
                          transaction.transactionType === 'withdrawal' ? 'bg-rose-100 text-rose-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right">{formatLKR(transaction.amount)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{transaction.referenceNumber || '—'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatDate(transaction.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No bank transactions found. Click "New Transaction" to create your first transaction.
            </div>
          )}
        </div>
      )}

      {/* Bank Reconciliation Section */}
      {activeSection === 'reconciliation' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Bank Reconciliation
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Account</label>
                <select
                  value={reconciliationData.bankAccountId}
                  onChange={(e) => setReconciliationData({ ...reconciliationData, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map(account => (
                    <option key={account._id} value={account._id}>{account.bankName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Statement Period Start</label>
                  <input
                    type="date"
                    value={reconciliationData.startDate}
                    onChange={(e) => setReconciliationData({ ...reconciliationData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Statement Period End</label>
                  <input
                    type="date"
                    value={reconciliationData.endDate}
                    onChange={(e) => setReconciliationData({ ...reconciliationData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Balance Comparison */}
            {reconciliationData.systemBalance > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Bank Statement Balance</span>
                  <span className="text-xs font-bold text-slate-900">LKR {formatLKR(reconciliationData.statementBalance ? Number(reconciliationData.statementBalance) : 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">System Balance</span>
                  <span className="text-xs font-bold text-slate-900">LKR {formatLKR(reconciliationData.systemBalance)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                  <span className="text-xs font-bold text-slate-700">Difference</span>
                  <span className={`text-xs font-bold ${reconciliationData.difference === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>LKR {formatLKR(reconciliationData.difference)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Statement Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span>
                <input
                  type="number"
                  value={reconciliationData.statementBalance}
                  onChange={(e) => setReconciliationData({ ...reconciliationData, statementBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              onClick={handleReconciliation}
              className="w-full px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Perform Reconciliation
            </button>

            {/* Transactions List */}
            {reconciliationData.unreconciledTransactions.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Transactions</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reconciliationData.unreconciledTransactions.map((transaction) => (
                    <div key={transaction._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={reconciliationData.selectedTransactions.includes(transaction._id)}
                        onChange={() => handleTransactionSelect(transaction._id)}
                        className="w-4 h-4 text-brand-500 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">BT-{String(transaction._id).slice(-5).padStart(5, '0')}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            transaction.transactionType === 'deposit' ? 'bg-emerald-100 text-emerald-700' :
                            transaction.transactionType === 'withdrawal' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {transaction.transactionType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">{formatLKR(transaction.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {reconciliationData.selectedTransactions.length > 0 && (
                  <button
                    onClick={handleMarkReconciled}
                    className="mt-3 w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Mark Selected as Reconciled
                  </button>
                )}
              </div>
            )}

            {/* Reconciliation Status */}
            {reconciliationData.difference !== undefined && (
              <div className={`p-3 rounded-lg border ${
                reconciliationData.difference === 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  {reconciliationData.difference === 0 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="text-xs font-bold text-slate-900">
                    Reconciliation Status: {reconciliationData.difference === 0 ? '🟢 Reconciled' : '🟡 Difference Exists'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Bank Transaction</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value="BT-*****"
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Account</label>
                <select
                  value={transactionForm.bankAccountId}
                  onChange={(e) => setTransactionForm({ ...transactionForm, bankAccountId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map(account => (
                    <option key={account._id} value={account._id}>{account.bankName}</option>
                  ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transactionType"
                      value="deposit"
                      checked={transactionForm.transactionType === 'deposit'}
                      onChange={(e) => setTransactionForm({ ...transactionForm, transactionType: e.target.value })}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-sm text-slate-700">Deposit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transactionType"
                      value="withdrawal"
                      checked={transactionForm.transactionType === 'withdrawal'}
                      onChange={(e) => setTransactionForm({ ...transactionForm, transactionType: e.target.value })}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-sm text-slate-700">Withdrawal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transactionType"
                      value="transfer"
                      checked={transactionForm.transactionType === 'transfer'}
                      onChange={(e) => setTransactionForm({ ...transactionForm, transactionType: e.target.value })}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-sm text-slate-700">Transfer</span>
                  </label>
                </div>
              </div>

              {/* Transfer To Account (only for transfers) */}
              {transactionForm.transactionType === 'transfer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Transfer To</label>
                  <select
                    value={transactionForm.toBankAccountId}
                    onChange={(e) => setTransactionForm({ ...transactionForm, toBankAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">Select Destination Account</option>
                    {bankAccounts.filter(acc => acc._id !== transactionForm.bankAccountId).map(account => (
                      <option key={account._id} value={account._id}>{account.bankName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span>
                  <input
                    type="number"
                    name="amount"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reference</label>
                <input
                  type="text"
                  value={transactionForm.reference}
                  onChange={(e) => setTransactionForm({ ...transactionForm, reference: e.target.value })}
                  placeholder="Check number, description, etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Balance Information */}
              {transactionForm.bankAccountId && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Current Balance</span>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="text-xs font-bold text-slate-500 absolute left-0 top-1/2 -translate-y-1/2">LKR</span>
                        <input
                          type="text"
                          value={formatLKR(bankAccounts.find(acc => acc._id === transactionForm.bankAccountId)?.balance || 0)}
                          disabled
                          className="pl-12 pr-8 py-1 border border-slate-200 rounded text-xs bg-slate-100 text-slate-900 font-bold w-32"
                        />
                        <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Auto Filled</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700">New Balance</span>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="text-xs font-bold text-slate-500 absolute left-0 top-1/2 -translate-y-1/2">LKR</span>
                        <input
                          type="text"
                          value={formatLKR(calculateNewBalance())}
                          disabled
                          className="pl-12 pr-8 py-1 border border-slate-200 rounded text-xs bg-slate-100 text-brand-600 font-bold w-32"
                        />
                        <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Auto Calculated</p>
                </div>
              )}

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

      {/* Add Bank Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add Bank Account</h3>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={addAccountForm.bankName}
                  onChange={(e) => setAddAccountForm({ ...addAccountForm, bankName: e.target.value })}
                  required
                  placeholder="Commercial Bank"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Number</label>
                <input
                  type="text"
                  value={addAccountForm.accountNumber}
                  onChange={(e) => setAddAccountForm({ ...addAccountForm, accountNumber: e.target.value })}
                  required
                  placeholder="1234567890"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Type</label>
                <select
                  value={addAccountForm.accountType}
                  onChange={(e) => setAddAccountForm({ ...addAccountForm, accountType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  <option value="fixed_deposit">Fixed Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Branch</label>
                <input
                  type="text"
                  value={addAccountForm.branch}
                  onChange={(e) => setAddAccountForm({ ...addAccountForm, branch: e.target.value })}
                  placeholder="Main Branch"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Initial Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span>
                  <input
                    type="number"
                    value={addAccountForm.balance}
                    onChange={(e) => setAddAccountForm({ ...addAccountForm, balance: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};