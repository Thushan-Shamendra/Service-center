import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Clock, AlertTriangle, DollarSign, X, Search, Plus } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatLKR, formatDate } from '../../utils/formatters';
import { invoiceApi } from '../../api/invoiceApi';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  customer: any;
  vehicle: any;
  jobCard: any;
  amount: number;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  paidAmount: number;
  createdAt: string;
  dueDate?: string;
}

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  const [stats, setStats] = useState({
    total: 0,
    pendingApproval: 0,
    partiallyPaid: 0,
    paid: 0,
    unpaid: 0,
    todayRevenue: 0,
    outstandingBalance: 0,
  });

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await invoiceApi.getInvoices({ limit: 100 });
      
      if (res.success) {
        setInvoices(res.data || []);
        
        // Calculate stats
        const invoiceData = res.data || [];
        setStats({
          total: invoiceData.length,
          pendingApproval: invoiceData.filter((i: Invoice) => i.status === 'review').length,
          partiallyPaid: invoiceData.filter((i: Invoice) => i.paymentStatus === 'partially_paid').length,
          paid: invoiceData.filter((i: Invoice) => i.paymentStatus === 'paid').length,
          unpaid: invoiceData.filter((i: Invoice) => i.paymentStatus === 'unpaid').length,
          todayRevenue: invoiceData
            .filter((i: Invoice) => i.paymentStatus === 'paid' && new Date(i.createdAt).toDateString() === new Date().toDateString())
            .reduce((sum: number, i: Invoice) => sum + i.amount, 0),
          outstandingBalance: invoiceData
            .filter((i: Invoice) => i.paymentStatus !== 'paid')
            .reduce((sum: number, i: Invoice) => sum + (i.amount - i.paidAmount), 0),
        });
      } else {
        setError(res.message || 'Failed to load invoices');
      }
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.response?.data?.message || 'Error loading invoices');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getCustomerName = (invoice: Invoice) => {
    const customer = invoice.customer;
    if (typeof customer === 'object' && customer.user) {
      return `${customer.user.firstName} ${customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getVehicleReg = (invoice: Invoice) => {
    const vehicle = invoice.vehicle;
    if (typeof vehicle === 'object') {
      return vehicle.registrationNumber;
    }
    return 'N/A';
  };

  const getJobCardNumber = (invoice: Invoice) => {
    const jobCard = invoice.jobCard;
    if (typeof jobCard === 'object') {
      return jobCard.jobCardNumber;
    }
    return 'N/A';
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: any = {
      unpaid: { label: 'Unpaid', color: 'bg-rose-100 text-rose-800' },
      partially_paid: { label: 'Partial', color: 'bg-amber-100 text-amber-800' },
      paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-800' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.unpaid;
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>{config.label}</span>;
  };

  const filteredInvoices = invoices.filter(i => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchInvoice = i.invoiceNumber.toLowerCase().includes(search);
      const matchCustomer = getCustomerName(i).toLowerCase().includes(search);
      const matchVehicle = getVehicleReg(i).toLowerCase().includes(search);
      const matchJobCard = getJobCardNumber(i).toLowerCase().includes(search);
      if (!matchInvoice && !matchCustomer && !matchVehicle && !matchJobCard) return false;
    }
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (paymentStatusFilter !== 'all' && i.paymentStatus !== paymentStatusFilter) return false;
    return true;
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchInvoices} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoice Management</h1>
          <p className="text-sm text-slate-500">
            Manage final invoices, approvals and customer payments.
          </p>
        </div>
        <Link
          to="/manager/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Generate Invoice
        </Link>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5 text-brand-600" />
            <span className="text-xs text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total Invoices</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-slate-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingApproval}</p>
          <p className="text-xs text-slate-500">Pending Approval</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-slate-500">Partial</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.partiallyPaid}</p>
          <p className="text-xs text-slate-500">Partially Paid</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-slate-500">Paid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.paid}</p>
          <p className="text-xs text-slate-500">Paid</p>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <X className="w-5 h-5 text-rose-600" />
            <span className="text-xs text-slate-500">Unpaid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.unpaid}</p>
          <p className="text-xs text-slate-500">Unpaid</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-slate-500">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatLKR(stats.todayRevenue)}</p>
          <p className="text-xs text-slate-500">Today's Revenue</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-slate-500">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatLKR(stats.outstandingBalance)}</p>
          <p className="text-xs text-slate-500">Outstanding Balance</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice / Customer / Vehicle / Job Card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Status: All</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Payment Status: All</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="today">Date: Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Payment Method: All</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">INVOICES</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Invoice No</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Vehicle</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Job Card</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-brand-600">
                      <Link to={`/manager/invoices/${invoice._id || invoice.id}`} className="hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getCustomerName(invoice)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getVehicleReg(invoice)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getJobCardNumber(invoice)}</td>
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">{formatLKR(invoice.amount)}</td>
                    <td className="py-3 px-4">{getPaymentStatusBadge(invoice.paymentStatus)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-12 text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Invoices Found</h3>
          <p className="text-sm text-slate-500 mb-4">
            Create an invoice from a completed job card.
          </p>
          <Link
            to="/manager/invoices/new"
            className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            + Generate Invoice
          </Link>
        </div>
      )}
    </div>
  );
};