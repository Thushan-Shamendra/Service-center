import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Banknote,
  Building2,
  FileCheck2,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Receipt,
  ArrowUpDown,
  Calendar,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { paymentApi } from '../../api/paymentApi';
import { formatLKR, formatDate, formatDateTime } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';

export const ManagerPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Selected payment for verification/details
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [paymentToReject, setPaymentToReject] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await paymentApi.getPayments({ limit: 100 });
      if (res.success) {
        setPayments(res.data || []);
      } else {
        setError(res.message || 'Failed to fetch payments');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (payment: any) => {
    if (!window.confirm(`Are you sure you want to verify and approve payment ${payment.paymentId || ''} of ${formatLKR(payment.amount)}? This will credit the invoice balance.`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await paymentApi.verifyPayment(payment._id || payment.id, {
        action: 'approve',
      });
      if (res.success) {
        toast.success(res.message || 'Payment verified and approved!');
        fetchPayments();
        if (selectedPayment?._id === payment._id) {
          setSelectedPayment(res.data);
        }
      } else {
        toast.error(res.message || 'Failed to approve payment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error verifying payment');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenRejectModal = (payment: any) => {
    setPaymentToReject(payment);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!paymentToReject) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await paymentApi.verifyPayment(paymentToReject._id || paymentToReject.id, {
        action: 'reject',
        rejectionReason: rejectionReason.trim(),
      });
      if (res.success) {
        toast.success('Payment rejected. Customer has been notified.');
        setIsRejectModalOpen(false);
        setPaymentToReject(null);
        fetchPayments();
        if (selectedPayment?._id === paymentToReject._id) {
          setSelectedPayment(res.data);
        }
      } else {
        toast.error(res.message || 'Failed to reject payment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error rejecting payment');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getMethodBadge = (method: string) => {
    const config: Record<string, { label: string; icon: any; color: string }> = {
      card: { label: 'Card Payment', icon: CreditCard, color: 'bg-blue-50 text-blue-700 border-blue-200' },
      cash: { label: 'Cash', icon: Banknote, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      bank_transfer: { label: 'Bank Transfer', icon: Building2, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      cheque: { label: 'Cheque', icon: FileCheck2, color: 'bg-amber-50 text-amber-700 border-amber-200' },
      card_machine: { label: 'Card Machine (POS)', icon: Smartphone, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    };
    const c = config[method] || { label: method, icon: CreditCard, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${c.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified & Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Pending Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Refunded
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 font-semibold">{status}</span>;
    }
  };

  // Metrics
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const rejectedPayments = payments.filter((p) => p.status === 'rejected');
  const totalVerifiedRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Filtered list
  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
    if (methodFilter !== 'all' && payment.paymentMethod !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const invNum = payment.invoice?.invoiceNumber?.toLowerCase() || '';
      const pId = payment.paymentId?.toLowerCase() || '';
      const custName = `${payment.customer?.user?.firstName || ''} ${payment.customer?.user?.lastName || ''}`.toLowerCase();
      const ref = payment.referenceNumber?.toLowerCase() || '';
      if (!invNum.includes(q) && !pId.includes(q) && !custName.includes(q) && !ref.includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchPayments} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Verification & Management</h1>
          <p className="text-sm text-slate-500">
            Verify customer payments (Card, Cash, Bank Transfer, Cheque, POS Machine) and update invoice records.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Verification Card */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-amber-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-900">{pendingPayments.length}</div>
          <div className="text-xs text-amber-700 mt-1 font-semibold">
            {formatLKR(totalPendingAmount)} awaiting approval
          </div>
        </div>

        {/* Verified & Approved Card */}
        <div 
          onClick={() => setStatusFilter('completed')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Verified & Approved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-900">{completedPayments.length}</div>
          <div className="text-xs text-emerald-700 mt-1 font-semibold">
            {formatLKR(totalVerifiedRevenue)} total collected
          </div>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-rose-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected Payments</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-900">{rejectedPayments.length}</div>
          <div className="text-xs text-rose-600 mt-1">Declined or invalid slips</div>
        </div>

        {/* Total Payments Recorded */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-brand-50/80 border-brand-300 ring-2 ring-brand-400/20 shadow-md'
              : 'bg-white border-slate-200/80 hover:border-brand-200 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{payments.length}</div>
          <div className="text-xs text-slate-500 mt-1">All payment transactions</div>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: `Pending (${pendingPayments.length})` },
            { id: 'completed', label: 'Verified' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Method Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice, Payment ID, Customer, Ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 outline-hidden"
          >
            <option value="all">All Methods</option>
            <option value="card">Card Payment</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="card_machine">Card Machine (POS)</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Payment ID</th>
                <th className="py-3.5 px-4">Invoice</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Method & Details</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payment records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const customerName = p.customer?.user
                    ? `${p.customer.user.firstName} ${p.customer.user.lastName}`
                    : p.payerName || 'N/A';
                  const isPending = p.status === 'pending';

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                        {p.paymentId || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">
                          {p.invoice?.invoiceNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{customerName}</div>
                        {p.customer?.user?.mobile && (
                          <div className="text-[11px] text-slate-400">{p.customer.user.mobile}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getMethodBadge(p.paymentMethod)}
                          {/* Details line */}
                          {p.paymentMethod === 'bank_transfer' && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Bank: {p.bankDetails?.bankName || 'N/A'} · Ref: {p.referenceNumber || 'N/A'}
                            </div>
                          )}
                          {p.paymentMethod === 'card' && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              {p.cardDetails?.cardType || 'Card'} · **** {p.cardDetails?.lastFourDigits || '****'}
                            </div>
                          )}
                          {p.paymentMethod === 'cheque' && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Cheque #{p.bankDetails?.chequeNumber || p.referenceNumber} ({p.bankDetails?.bankName || ''})
                            </div>
                          )}
                          {p.paymentMethod === 'card_machine' && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Terminal: {p.posTerminalDetails?.terminalId || 'POS'} · Auth: {p.posTerminalDetails?.authCode || p.referenceNumber}
                            </div>
                          )}
                          {p.paymentMethod === 'cash' && p.notes && (
                            <div className="text-[11px] text-slate-500 italic">
                              Note: {p.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        {formatLKR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(p)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                              title="Verify payment and credit invoice"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify & Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(p)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition-colors"
                              title="Reject payment"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setIsDetailsOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Payment Modal */}
      {isRejectModalOpen && paymentToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reject Payment Submission</h3>
                <p className="text-xs text-slate-500">{paymentToReject.paymentId} · {formatLKR(paymentToReject.amount)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please specify the reason why this payment cannot be verified. This reason will be recorded and displayed to the customer.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Bank transfer slip reference was not found in statement / Cheque date invalid / Cash amount mismatch"
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isActionLoading || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {isActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Drawer / Modal */}
      {isDetailsOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Details</span>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedPayment.paymentId}</h3>
              </div>
              {getStatusBadge(selectedPayment.status)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Invoice:</span>
                  <div className="font-bold text-slate-800">{selectedPayment.invoice?.invoiceNumber || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Amount:</span>
                  <div className="font-extrabold text-slate-900 text-sm">{formatLKR(selectedPayment.amount)}</div>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400">Payment Method:</span>
                <div className="pt-1">{getMethodBadge(selectedPayment.paymentMethod)}</div>

                {selectedPayment.referenceNumber && (
                  <div className="pt-2 text-slate-600">
                    <span className="text-slate-400">Reference:</span> <strong className="font-mono">{selectedPayment.referenceNumber}</strong>
                  </div>
                )}

                {selectedPayment.bankDetails?.bankName && (
                  <div className="text-slate-600">
                    <span className="text-slate-400">Bank:</span> {selectedPayment.bankDetails.bankName}
                  </div>
                )}
                {selectedPayment.bankDetails?.chequeNumber && (
                  <div className="text-slate-600">
                    <span className="text-slate-400">Cheque No:</span> {selectedPayment.bankDetails.chequeNumber}
                  </div>
                )}
                {selectedPayment.cardDetails?.lastFourDigits && (
                  <div className="text-slate-600">
                    <span className="text-slate-400">Card:</span> {selectedPayment.cardDetails.cardType} **** {selectedPayment.cardDetails.lastFourDigits}
                  </div>
                )}
              </div>

              {selectedPayment.verifiedBy && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified by Manager
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-1">
                    {selectedPayment.verifiedBy.firstName} {selectedPayment.verifiedBy.lastName} ({selectedPayment.verifiedBy.email})
                    {selectedPayment.verifiedAt && ` on ${formatDateTime(selectedPayment.verifiedAt)}`}
                  </div>
                </div>
              )}

              {selectedPayment.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Rejection Details
                  </div>
                  <div className="text-[11px] text-rose-800 mt-1">
                    Reason: {selectedPayment.rejectionReason}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPaymentsPage;
