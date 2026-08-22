import React, { useEffect, useState } from 'react';
import { financeApi } from '../../api/financeApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { 
  Plus, 
  X, 
  Receipt,
  Search,
  Download,
  Trash2,
  Edit,
  Lock,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OtherIncome {
  _id: string;
  voucherNumber: string;
  category: string;
  customer?: string;
  description: string;
  amount: number;
  tax: number;
  date: string;
  status: string;
}

interface Customer {
  _id: string;
  name: string;
  contact?: string;
}

const INCOME_CATEGORIES = {
  'Service / Business Income': ['Vehicle Wash', 'Parking Fees', 'Accessories Sales', 'Spare Parts Sales'],
  'Other Income': ['Counter Sales', 'Insurance Commission', 'Towing Services']
};

export const OtherIncomeManagementPage: React.FC = () => {
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [incomeTypeFilter, setIncomeTypeFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    incomeType: '',
    customer: '',
    description: '',
    amount: '',
    tax: '0',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchIncomes = async () => {
    setIsLoading(true);
    try {
      const res = await financeApi.getEntries({ type: 'income' });
      if (res.success) {
        setIncomes(res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load other income');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await financeApi.getCustomers();
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const incomeData = {
        entryType: 'income' as const,
        category: formData.incomeType,
        description: formData.description,
        amount: Number(formData.amount),
        tax: Number(formData.tax),
        paymentMethod: 'cash',
        referenceNumber: formData.customer,
        date: formData.date
      };

      await financeApi.createEntry(incomeData);
      toast.success('Other income recorded successfully');
      setShowAddModal(false);
      resetForm();
      fetchIncomes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      incomeType: '',
      customer: '',
      description: '',
      amount: '',
      tax: '0',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !incomeTypeFilter || income.category === incomeTypeFilter;
    const matchesCustomer = !customerFilter || income.customer === customerFilter;
    const matchesDateRange = (!dateRange.start || new Date(income.date) >= new Date(dateRange.start)) &&
                              (!dateRange.end || new Date(income.date) <= new Date(dateRange.end));
    return matchesSearch && matchesType && matchesCustomer && matchesDateRange;
  });

  const generateIncomeId = () => {
    const count = incomes.length + 1;
    return `INC-${String(count).padStart(5, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Other Income</h2>
          <p className="text-sm text-slate-500">
            Track income that isn't normal service invoice revenue
          </p>
        </div>
      </div>

      {/* Other Income List */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Other Income
          </h3>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Income
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
            value={incomeTypeFilter}
            onChange={(e) => setIncomeTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Income Type</option>
            {Object.values(INCOME_CATEGORIES).flat().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Customer</option>
            {customers.map(customer => (
              <option key={customer._id} value={customer.name}>{customer.name}</option>
            ))}
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
          <div className="text-center py-8 text-slate-500">Loading income records...</div>
        ) : filteredIncomes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Income ID</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.map((income) => (
                  <tr key={income._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-slate-900">{income.voucherNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {income.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{income.customer || '—'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{formatLKR(income.amount)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatDate(income.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No other income records found. Click "Add Income" to create your first record.
          </div>
        )}
      </div>

      {/* Add Other Income Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add Other Income</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Income ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Income ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={generateIncomeId()}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Income Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Income Type *</label>
                <select
                  name="incomeType"
                  value={formData.incomeType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select Income Type</option>
                  {Object.values(INCOME_CATEGORIES).flat().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Customer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer</label>
                <p className="text-xs text-slate-500 mb-1.5">Optional for non-customer income</p>
                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer.name}>{customer.name}</option>
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
                  placeholder="Spare part counter sale"
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
                    placeholder="125,000.00"
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
                    placeholder="22,500.00"
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Received Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Received Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
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
                  {isSubmitting ? 'Saving...' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};