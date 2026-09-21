import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Receipt, Clock, AlertTriangle, DollarSign, X, Search, Plus, Eye, CreditCard } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatLKR, formatDate } from '../../utils/formatters';
import { invoiceApi } from '../../api/invoiceApi';
import { InvoiceDetailsModal } from '../../components/manager/InvoiceDetailsModal';
import toast from 'react-hot-toast';

interface Invoice {
  id?: string;
  _id?: string;
  invoiceNumber: string;
  customer: any;
  vehicle: any;
  jobCard: any;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }>;
  laborCharges?: Array<{
    description: string;
    hours: number;
    ratePerHour: number;
    total: number;
  }>;
  subtotal?: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal: number;
  amount?: number;
  amountPaid: number;
  paidAmount?: number;
  outstandingBalance: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  createdAt: string;
  dueDate?: string;
}

export const InvoicesPage: React.FC = () => {
  const { id: urlInvoiceId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobCardParam = searchParams.get('jobCard');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(urlInvoiceId || null);

  const [searchQuery, setSearchQuery] = useState(jobCardParam || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    partiallyPaid: 0,
    paid: 0,
    unpaid: 0,
    todayRevenue: 0,
    outstandingBalance: 0,
  });

  useEffect(() => {
    if (urlInvoiceId) {
      setSelectedInvoiceId(urlInvoiceId);
    }
  }, [urlInvoiceId]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await invoiceApi.getInvoices({ limit: 100 });
      
      if (res.success) {
        const invoiceData: Invoice[] = res.data || [];
        setInvoices(invoiceData);
        
        // Calculate stats
        const now = new Date();
        const todayRevenue = invoiceData
          .filter((i: Invoice) => {
            if (!i.createdAt) return false;
            const created = new Date(i.createdAt);
            const isToday = created.toDateString() === now.toDateString();
            return isToday && (i.paymentStatus === 'paid' || (i.amountPaid || 0) > 0);
          })
          .reduce((sum: number, i: Invoice) => sum + (i.amountPaid ?? i.grandTotal ?? i.amount ?? 0), 0);

        const outstandingBalance = invoiceData
          .reduce((sum: number, i: Invoice) => sum + (i.outstandingBalance ?? Math.max(0, (i.grandTotal ?? i.amount ?? 0) - (i.amountPaid ?? i.paidAmount ?? 0))), 0);

        setStats({
          total: invoiceData.length,
          draft: invoiceData.filter((i: Invoice) => i.status === 'draft').length,
          partiallyPaid: invoiceData.filter((i: Invoice) => i.paymentStatus === 'partially_paid').length,
          paid: invoiceData.filter((i: Invoice) => i.paymentStatus === 'paid').length,
          unpaid: invoiceData.filter((i: Invoice) => i.paymentStatus === 'unpaid').length,
          todayRevenue,
          outstandingBalance,
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
    if (customer && typeof customer === 'object') {
      if (customer.user) {
        return `${customer.user.firstName || ''} ${customer.user.lastName || ''}`.trim() || 'Unknown';
      }
      if (customer.firstName) {
        return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
      }
      if (customer.name) return customer.name;
    }
    return 'Unknown';
  };

  const getVehicleReg = (invoice: Invoice) => {
    const vehicle = invoice.vehicle;
    if (vehicle && typeof vehicle === 'object') {
      return vehicle.registrationNumber || (vehicle.make ? `${vehicle.make} ${vehicle.model || ''}`.trim() : 'N/A');
    }
    if (typeof vehicle === 'string') return vehicle;
    return 'N/A';
  };

  const getJobCardNumber = (invoice: Invoice) => {
    const jobCard = invoice.jobCard;
    if (jobCard && typeof jobCard === 'object') {
      return jobCard.jobCardNumber || 'N/A';
    }
    if (typeof jobCard === 'string') return jobCard;
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
      const matchInvoice = i.invoiceNumber?.toLowerCase().includes(search);
      const matchCustomer = getCustomerName(i).toLowerCase().includes(search);
      const matchVehicle = getVehicleReg(i).toLowerCase().includes(search);
      const matchJobCard = getJobCardNumber(i).toLowerCase().includes(search);
      if (!matchInvoice && !matchCustomer && !matchVehicle && !matchJobCard) return false;
    }
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (paymentStatusFilter !== 'all' && i.paymentStatus !== paymentStatusFilter) return false;
    if (dateFilter !== 'all' && i.createdAt) {
      const invDate = new Date(i.createdAt);
      const now = new Date();
      if (dateFilter === 'today') {
        if (invDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (invDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (invDate < monthAgo) return false;
      }
    }
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
            <span className="text-xs text-slate-500">Draft</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.draft}</p>
          <p className="text-xs text-slate-500">Draft Invoices</p>
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
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Status: All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Payment Status: All</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Date: All Time</option>
            <option value="today">Date: Today</option>
            <option value="week">Date: This Week</option>
            <option value="month">Date: This Month</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">INVOICES ({filteredInvoices.length})</h3>
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
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const invId = invoice._id || invoice.id || '';
                  const totalAmt = invoice.grandTotal ?? invoice.amount ?? 0;
                  return (
                    <tr key={invId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-brand-600 font-mono">
                        <button
                          onClick={() => setSelectedInvoiceId(invId)}
                          className="hover:underline text-left font-semibold text-brand-600"
                        >
                          {invoice.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 font-medium">{getCustomerName(invoice)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 font-mono">{getVehicleReg(invoice)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 font-mono">{getJobCardNumber(invoice)}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 font-semibold">{formatLKR(totalAmt)}</td>
                      <td className="py-3 px-4">{getPaymentStatusBadge(invoice.paymentStatus)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInvoiceId(invId)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition-colors"
                            title="View Invoice Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {invoice.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => setSelectedInvoiceId(invId)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
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

      {/* Invoice Details Modal */}
      {selectedInvoiceId && (
        <InvoiceDetailsModal
          invoiceId={selectedInvoiceId}
          onClose={() => {
            setSelectedInvoiceId(null);
            if (urlInvoiceId) {
              navigate('/manager/invoices');
            }
          }}
          onPaymentRecorded={fetchInvoices}
        />
      )}
    </div>
  );
};