import React, { useEffect, useState } from 'react';
import { financeApi } from '../../api/financeApi';
import { supplierApi } from '../../api/supplierApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { 
  Plus, 
  X, 
  Receipt,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Lock,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Expense {
  _id: string;
  voucherNumber: string;
  category: string;
  vendor?: string;
  description: string;
  amount: number;
  tax: number;
  paymentMethod: string;
  date: string;
  invoiceFile?: string;
  status: string;
}

interface Vendor {
  _id: string;
  name: string;
  contact?: string;
}

const EXPENSE_CATEGORIES = {
  'Operating / General Expenses': ['Rent', 'Electricity', 'Water', 'Fuel', 'Office Supplies', 'Equipment'],
  'Service / Business Expenses': ['Maintenance', 'Salaries', 'Miscellaneous']
};

export const ExpenseManagementPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    tax: '0',
    paymentMethod: 'cash',
    bankAccount: '',
    bankAccountManual: '',
    cashRegister: '',
    date: new Date().toISOString().split('T')[0],
    invoiceFile: null as File | null
  });
  const [useManualBankEntry, setUseManualBankEntry] = useState(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getEntries({ type: 'expense' });
      if (res.success) {
        setExpenses(res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await supplierApi.getAllSuppliers();
      if (res.success) {
        setVendors(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load vendors');
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await financeApi.getBankAccounts();
      if (res.success) {
        setBankAccounts(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load bank accounts');
    }
  };

  const fetchCashRegisters = async () => {
    try {
      const res = await financeApi.getCashRegisters();
      if (res.success) {
        setCashRegisters(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load cash registers');
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchVendors();
    fetchBankAccounts();
    fetchCashRegisters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const expenseData = {
        entryType: 'expense' as const,
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        tax: Number(formData.tax),
        paymentMethod: formData.paymentMethod,
        bankAccount: useManualBankEntry ? formData.bankAccountManual : formData.bankAccount,
        date: formData.date
      };

      await financeApi.createEntry(expenseData);
      toast.success('Expense added successfully');
      setShowAddModal(false);
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      tax: '0',
      paymentMethod: 'cash',
      bankAccount: '',
      bankAccountManual: '',
      cashRegister: '',
      date: new Date().toISOString().split('T')[0],
      invoiceFile: null
    });
    setUseManualBankEntry(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, invoiceFile: e.target.files![0] }));
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    const matchesPaymentMethod = !paymentMethodFilter || expense.paymentMethod === paymentMethodFilter;
    const matchesDateRange = (!dateRange.start || new Date(expense.date) >= new Date(dateRange.start)) &&
                              (!dateRange.end || new Date(expense.date) <= new Date(dateRange.end));
    return matchesSearch && matchesCategory && matchesPaymentMethod && matchesDateRange;
  });

  const generateExpenseId = () => {
    const count = expenses.length + 1;
    return `EXP-${String(count).padStart(5, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expense Management</h2>
          <p className="text-sm text-slate-500">
            Track and manage all business expenses
          </p>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Expenses
          </h3>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-slate-50 rounded-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Category</option>
            {Object.values(EXPENSE_CATEGORIES).flat().map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Payment Method</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
          </select>
          
          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading expenses...</div>
        ) : filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Method</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-slate-900">{expense.voucherNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">{formatLKR(expense.amount)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 capitalize">{expense.paymentMethod === 'bank_transfer' ? 'Bank' : expense.paymentMethod}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatDate(expense.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No expenses found. Click "Add Expense" to create your first expense.
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Expense ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Expense ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={generateExpenseId()}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Auto Generated</p>
              </div>

              {/* Expense Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Expense Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select Category</option>
                  {Object.values(EXPENSE_CATEGORIES).flat().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  placeholder="Monthly electricity bill - August 2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="85,000.00"
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Tax */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tax</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">LKR</span>
                  <input
                    type="number"
                    name="tax"
                    value={formData.tax}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-sm text-slate-700">Cash</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span className="text-sm text-slate-700">Bank</span>
                  </label>
                </div>
              </div>

              {/* Conditional Bank Account Field */}
              {formData.paymentMethod === 'bank_transfer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Account *</label>
                  
                  {/* Toggle between dropdown and manual entry */}
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bankEntryMode"
                        checked={!useManualBankEntry}
                        onChange={() => {
                          setUseManualBankEntry(false);
                          setFormData(prev => ({ ...prev, bankAccount: '', bankAccountManual: '' }));
                        }}
                        className="w-4 h-4 text-brand-500"
                      />
                      <span className="text-sm text-slate-700">Select from list</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bankEntryMode"
                        checked={useManualBankEntry}
                        onChange={() => {
                          setUseManualBankEntry(true);
                          setFormData(prev => ({ ...prev, bankAccount: '', bankAccountManual: '' }));
                        }}
                        className="w-4 h-4 text-brand-500"
                      />
                      <span className="text-sm text-slate-700">Enter manually</span>
                    </label>
                  </div>

                  {!useManualBankEntry ? (
                    <select
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="">Select Bank Account</option>
                      {bankAccounts.map((account: any) => (
                        <option key={account._id} value={account._id}>
                          {account.bankName} - {account.accountNumber} ({account.accountName})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="bankAccountManual"
                      value={formData.bankAccountManual}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter bank account name or number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {!useManualBankEntry ? 'Select from available bank accounts' : 'Manually enter bank account details if not in list'}
                  </p>
                </div>
              )}

              {/* Conditional Cash Register Field */}
              {formData.paymentMethod === 'cash' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Cash Register *</label>
                  <input
                    type="text"
                    name="cashRegister"
                    value={formData.cashRegister}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter cash register name or location"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Manually enter cash register details</p>
                </div>
              )}

              {/* Expense Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Expense Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Invoice Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Invoice Upload</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-brand-300 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="invoice-upload"
                  />
                  <label
                    htmlFor="invoice-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Receipt className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="text-xs text-slate-600">
                      {formData.invoiceFile ? formData.invoiceFile.name : 'Upload Invoice'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};