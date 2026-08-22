import React, { useState, useEffect } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { Plus, X, Lock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface JournalLine {
  account: string;
  accountCode: string;
  debit: number;
  credit: number;
}

export const JournalEntriesPage: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    entryNumber: 'JE-00001',
    entryDate: new Date().toISOString().split('T')[0],
    narration: ''
  });

  const fetchJournalEntries = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getJournalEntries({ status: 'Posted' });
      if (res.success) {
        setJournalEntries(res.data);
      }
    } catch (error) {
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const [lines, setLines] = useState<JournalLine[]>([
    { account: '', accountCode: '', debit: 0, credit: 0 },
    { account: '', accountCode: '', debit: 0, credit: 0 }
  ]);

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = () => {
    setLines([...lines, { account: '', accountCode: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const updatedLines = [...lines];
    if (field === 'debit' || field === 'credit') {
      updatedLines[index][field] = Number(value) || 0;
    } else {
      updatedLines[index][field] = value as string;
    }
    setLines(updatedLines);
  };

  const handleSubmit = async () => {
    if (!isBalanced) {
      toast.error('Journal entry must be balanced (Debit = Credit)');
      return;
    }

    setIsSubmitting(true);
    try {
      const entryData = {
        entryDate: formData.entryDate,
        narration: formData.narration,
        lineItems: lines.filter(line => line.account && (line.debit > 0 || line.credit > 0)),
        status: 'Posted'
      };

      await financeApi.createJournalEntry(entryData);
      toast.success('Journal entry created successfully');
      setShowAddModal(false);
      // Reset form
      setFormData({
        entryNumber: 'JE-00001',
        entryDate: new Date().toISOString().split('T')[0],
        narration: ''
      });
      setLines([
        { account: '', accountCode: '', debit: 0, credit: 0 },
        { account: '', accountCode: '', debit: 0, credit: 0 }
      ]);
      fetchJournalEntries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Journal Entries</h2>
          <p className="text-sm text-slate-500">Create and manage double-entry journal entries</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Journal Entry
        </button>
      </div>

      {/* Journal Entries List */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading journal entries...</div>
        ) : journalEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Entry No.</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Narration</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Total Debit</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-600">Total Credit</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries.map((entry) => (
                  <tr key={entry.entryNumber} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-slate-900">{entry.entryNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatDate(entry.entryDate)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{entry.narration}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatLKR(entry.totalDebit)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{formatLKR(entry.totalCredit)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.status === 'Posted' ? 'bg-emerald-100 text-emerald-700' : 
                        entry.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No journal entries found. Click "Create Journal Entry" to create your first entry.
          </div>
        )}
      </div>

      {/* Create Journal Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Create Journal Entry</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Entry Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Entry No.</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.entryNumber}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Entry Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Entry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Narration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Narration</label>
                <input
                  type="text"
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  placeholder="e.g., Monthly electricity expense"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Journal Lines */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Account</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Debit (LKR)</th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Credit (LKR)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="py-2 px-3">
                          <select
                            value={line.account}
                            onChange={(e) => updateLine(index, 'account', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          >
                            <option value="">Select Account</option>
                            <option value="1010">1010 - Cash</option>
                            <option value="1020">1020 - Bank</option>
                            <option value="5010">5010 - Salaries Expense</option>
                            <option value="5020">5020 - Rent Expense</option>
                            <option value="5030">5030 - Electricity Expense</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(index, 'debit', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-right focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(index, 'credit', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-right focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          {lines.length > 2 && (
                            <button
                              onClick={() => removeLine(index)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={addLine}
                  className="w-full py-2 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors border-t border-slate-100"
                >
                  + Add Line
                </button>
              </div>

              {/* Totals and Validation */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">Total Debit</span>
                  <span className="text-sm font-bold text-slate-900">{formatLKR(totalDebit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">Total Credit</span>
                  <span className="text-sm font-bold text-slate-900">{formatLKR(totalCredit)}</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-slate-200 ${
                  isBalanced ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {isBalanced ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm font-bold">
                    {isBalanced ? 'Validation: 🟢 Debit = Credit' : '⚠ Journal entry is not balanced'}
                  </span>
                </div>
                {!isBalanced && (
                  <div className="text-xs text-rose-600">
                    Difference: {formatLKR(Math.abs(totalDebit - totalCredit))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isBalanced}
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Journal Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};