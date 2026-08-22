import React, { useEffect, useState } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { DataTable, Column } from '../../components/ui/DataTable';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Scale, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const FinancePage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income' | 'journal'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    category: 'Workshop Utilities',
    description: '',
    amount: 15000,
    paymentMethod: 'cash',
    referenceNumber: '',
  });

  // Journal Form with Debit/Credit validation
  const [journalDesc, setJournalDesc] = useState('');
  const [journalLines, setJournalLines] = useState<Array<{ account: string; debit: number; credit: number }>>([
    { account: 'Cash / Bank', debit: 50000, credit: 0 },
    { account: 'Service Income', debit: 0, credit: 50000 },
  ]);

  const totalDebit = journalLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = journalLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isJournalBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getEntries({
        page,
        limit: 10,
        type: activeTab !== 'all' ? activeTab : undefined,
      });
      if (res.success) {
        setEntries(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load financial records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page, activeTab]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await financeApi.createEntry({
        entryType: 'expense',
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        referenceNumber: expenseForm.referenceNumber,
      });
      if (res.success) {
        toast.success('Expense recorded');
        setIsExpenseModalOpen(false);
        fetchEntries();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error recording expense');
    }
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJournalBalanced) {
      toast.error('Total Debit must equal Total Credit before submitting!');
      return;
    }
    try {
      const res = await financeApi.createEntry({
        entryType: 'journal',
        description: journalDesc || 'General Journal Entry',
        amount: totalDebit,
        lineItems: journalLines,
      });
      if (res.success) {
        toast.success('Journal Voucher posted successfully');
        setIsJournalModalOpen(false);
        fetchEntries();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Journal posting failed');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Voucher # / Date',
      accessor: (item) => (
        <div>
          <div className="font-bold text-slate-900 font-mono">{item.voucherNumber}</div>
          <div className="text-xs text-slate-400">{formatDate(item.date)}</div>
        </div>
      ),
    },
    {
      header: 'Entry Type',
      accessor: (item) => (
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
            item.entryType === 'expense'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : item.entryType === 'income'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}
        >
          {item.entryType}
        </span>
      ),
    },
    {
      header: 'Category / Description',
      accessor: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.description}</div>
          <div className="text-xs text-slate-400">{item.category || 'General Ledger'}</div>
        </div>
      ),
    },
    {
      header: 'Amount (LKR)',
      accessor: (item) => (
        <span
          className={`text-sm font-extrabold ${
            item.entryType === 'expense' ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {item.entryType === 'expense' ? '-' : '+'}
          {formatLKR(item.amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finance & Accounting</h2>
          <p className="text-sm text-slate-500">
            Expenses, other income, cash register, and double-entry journal vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200"
          >
            <ArrowDownRight className="w-4 h-4" />
            Record Expense
          </button>
          <button
            onClick={() => setIsJournalModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <Scale className="w-4 h-4" />
            New Journal Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['all', 'expense', 'income', 'journal'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider capitalize transition-all ${
              activeTab === tab ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Entries Table */}
      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          onPageChange: (p) => setPage(p),
        }}
        emptyTitle="No Financial Entries"
        emptyDescription="Record expenses or journal vouchers to build ledger balance."
      />

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsExpenseModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Record Operating Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Expense Category *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  placeholder="Electricity, Rent, Spare Parts Purchase, Tea"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Description *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Monthly CEB Electricity Bill payment"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Amount (LKR) *</label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-rose-600 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-md">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journal Entry Modal with Debit = Credit Validation */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsJournalModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">Double-Entry Journal Voucher</h3>
            <p className="text-xs text-slate-500 mb-4">Total Debit MUST equal Total Credit before posting.</p>

            <form onSubmit={handleCreateJournal} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Voucher Narrative / Description *</label>
                <input
                  type="text"
                  required
                  value={journalDesc}
                  onChange={(e) => setJournalDesc(e.target.value)}
                  placeholder="Record month-end depreciation adjustment"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Journal Line Items */}
              <div className="space-y-2 border-t border-b border-slate-100 py-3">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase">
                  <div className="col-span-6">Account Title</div>
                  <div className="col-span-3 text-right">Debit (Rs.)</div>
                  <div className="col-span-3 text-right">Credit (Rs.)</div>
                </div>

                {journalLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={line.account}
                      onChange={(e) => {
                        const newLines = [...journalLines];
                        newLines[idx].account = e.target.value;
                        setJournalLines(newLines);
                      }}
                      className="col-span-6 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      value={line.debit}
                      onChange={(e) => {
                        const newLines = [...journalLines];
                        newLines[idx].debit = Number(e.target.value);
                        setJournalLines(newLines);
                      }}
                      className="col-span-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold"
                    />
                    <input
                      type="number"
                      value={line.credit}
                      onChange={(e) => {
                        const newLines = [...journalLines];
                        newLines[idx].credit = Number(e.target.value);
                        setJournalLines(newLines);
                      }}
                      className="col-span-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold"
                    />
                  </div>
                ))}
              </div>

              {/* Validation Status Indicator */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  isJournalBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isJournalBalanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>
                    {isJournalBalanced
                      ? 'Balanced Journal Entry'
                      : `Unbalanced! Difference: ${formatLKR(Math.abs(totalDebit - totalCredit))}`}
                  </span>
                </div>

                <div className="text-right">
                  <span>Debit: {formatLKR(totalDebit)}</span> | <span>Credit: {formatLKR(totalCredit)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsJournalModalOpen(false)} className="px-4 py-2 border rounded-xl">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJournalBalanced}
                  className="px-5 py-2 bg-brand-500 text-white font-bold rounded-xl shadow-md disabled:opacity-40"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
