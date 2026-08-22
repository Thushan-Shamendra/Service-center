import React, { useEffect, useState } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { ExpenseManagementPage } from './ExpenseManagementPage';
import { OtherIncomeManagementPage } from './OtherIncomeManagementPage';
import { BankingManagementPage } from './BankingManagementPage';
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  FileText, 
  Building2, 
  Banknote,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  bankBalance: number;
  cashBalance: number;
  payables: number;
  recentTransactions: any[];
  bankAccountsCount: number;
  cashRegistersCount: number;
  payablesCount: number;
  monthlyData?: {
    month: string;
    revenue: number;
    expenses: number;
  }[];
}

export const FinancialManagementPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income' | 'banking'>('overview');
  
  // Quick Entry Modal
  const [showQuickEntryModal, setShowQuickEntryModal] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<'expense' | 'income' | 'bank'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getManagementDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (error) {
      toast.error('Failed to load financial dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Handle different types of quick entries
      if (quickEntryType === 'expense') {
        const form = e.target as HTMLFormElement;
        const expenseData = {
          entryType: 'expense' as const,
          category: form.category.value,
          description: form.description.value,
          amount: Number(form.amount.value),
          paymentMethod: form.paymentMethod.value,
          referenceNumber: form.referenceNumber.value,
        };
        await financeApi.createEntry(expenseData);
        toast.success('Expense recorded successfully');
      } else if (quickEntryType === 'income') {
        const form = e.target as HTMLFormElement;
        const incomeData = {
          entryType: 'income' as const,
          category: form.category.value,
          description: form.description.value,
          amount: Number(form.amount.value),
          paymentMethod: form.paymentMethod.value,
          referenceNumber: form.referenceNumber.value,
        };
        await financeApi.createEntry(incomeData);
        toast.success('Income recorded successfully');
      }
      
      setShowQuickEntryModal(false);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <ArrowDownRight className="w-4 h-4 text-rose-600" />;
      case 'income':
        return <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
      case 'bank':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'expense':
        return 'text-rose-600';
      case 'income':
        return 'text-emerald-600';
      case 'bank':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Management</h2>
          <p className="text-sm text-slate-500">
            Monitor revenue, expenses, cash, banking and accounting
          </p>
        </div>

        {activeTab === 'overview' && (
          <button
            onClick={() => setShowQuickEntryModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Quick Entry
          </button>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Row */}
        {/* Revenue This Month Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Revenue This Month</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatLKR(dashboardData?.totalRevenue || 0)}
          </p>
        </div>

        {/* Expenses This Month Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Expenses This Month</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatLKR(dashboardData?.totalExpenses || 0)}
          </p>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Net Profit</span>
          </div>
          <p className={`text-2xl font-extrabold ${(dashboardData?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatLKR(dashboardData?.netProfit || 0)}
          </p>
        </div>

        {/* Second Row */}
        {/* Cash Balance Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Cash Balance</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatLKR(dashboardData?.cashBalance || 0)}
          </p>
        </div>

        {/* Bank Balance Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Bank Balance</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatLKR(dashboardData?.bankBalance || 0)}
          </p>
        </div>

        {/* Outstanding Payables Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">Outstanding Payables</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatLKR(dashboardData?.payables || 0)}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(['overview', 'expenses', 'income', 'banking'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' ? (
        <ExpenseManagementPage />
      ) : activeTab === 'income' ? (
        <OtherIncomeManagementPage />
      ) : activeTab === 'banking' ? (
        <BankingManagementPage />
      ) : (
        <>
          {/* Revenue vs Expenses Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue vs Expenses</h3>
            
            {(() => {
              const chartData = dashboardData?.monthlyData && dashboardData.monthlyData.length > 0 
                ? dashboardData.monthlyData 
                : // Sample data for demonstration when no real data exists
                  [
                    { month: 'Aug 2026', revenue: 150000, expenses: 120000 },
                    { month: 'Sep 2026', revenue: 180000, expenses: 135000 },
                    { month: 'Oct 2026', revenue: 165000, expenses: 140000 },
                    { month: 'Nov 2026', revenue: 200000, expenses: 150000 },
                    { month: 'Dec 2026', revenue: 220000, expenses: 160000 },
                    { month: 'Jan 2027', revenue: 195000, expenses: 145000 },
                  ];
              
              const hasRealData = dashboardData?.monthlyData && dashboardData.monthlyData.length > 0;
              
              return (
                <>
                  {!hasRealData && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs">
                      <span className="font-bold">Sample Data:</span> No real financial data found. Showing sample data for demonstration.
                    </div>
                  )}
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `LKR ${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => [`LKR ${value.toLocaleString()}`, '']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="Revenue" 
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="expenses" 
                        name="Expenses" 
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {!hasRealData && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowQuickEntryModal(true)}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Real Transaction
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Recent Financial Transactions */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
              
              {/* Transaction Type Filters */}
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">
                  Expense
                </button>
                <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                  Income
                </button>
                <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                  Bank
                </button>
                <button className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                  Cash
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading transactions...</div>
            ) : dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentTransactions.map((transaction) => (
                  <div
                    key={transaction._id || transaction.transactionId || transaction.voucherNumber}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="font-bold text-slate-900">
                          {transaction.voucherNumber || transaction.transactionId || 'N/A'}
                        </div>
                        <div className="text-sm text-slate-600">{transaction.description}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatLKR(transaction.amount || transaction.total || 0)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {transaction.paymentMethod || transaction.bankAccount?.bankName || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDate(transaction.date || transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No recent transactions found
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick Entry Modal */}
      {showQuickEntryModal && activeTab === 'overview' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Quick Entry</h3>
              <button
                onClick={() => setShowQuickEntryModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entry Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setQuickEntryType('expense')}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  quickEntryType === 'expense'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => setQuickEntryType('income')}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  quickEntryType === 'income'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Income
              </button>
            </div>

            <form onSubmit={handleQuickEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                <input
                  type="text"
                  name="category"
                  required
                  placeholder="Operating expense, Service income, etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Description of the transaction"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount (LKR)</label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method</label>
                <select
                  name="paymentMethod"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reference Number (Optional)</label>
                <input
                  type="text"
                  name="referenceNumber"
                  placeholder="Invoice number, receipt number, etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickEntryModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};