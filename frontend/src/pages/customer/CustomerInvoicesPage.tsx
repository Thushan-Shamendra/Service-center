import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { invoiceApi } from '../../api/invoiceApi';
import { paymentApi } from '../../api/paymentApi';
import { formatLKR, formatDate, formatDateTime } from '../../utils/formatters';
import { 
  FileText, 
  Car, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  CreditCard,
  Receipt,
  Printer,
  Mail,
  Clock,
  Building2,
  Banknote,
  Smartphone,
  FileCheck2
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { PaymentGatewayModal } from '../../components/payment/PaymentGatewayModal';
import toast from 'react-hot-toast';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  jobCard?: {
    jobCardNumber: string;
  };
  vehicle: {
    registrationNumber: string;
    make: string;
    model: string;
  };
  customer: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  laborCharges?: Array<{
    description: string;
    hours: number;
    ratePerHour: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  taxAmount: number;
  taxRate: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
  dueDate?: string;
  createdAt: string;
  payments?: Array<{
    paymentId: string;
    paymentDate: string;
    paymentMethod: string;
    amount: number;
    status?: string;
  }>;
}

export const CustomerInvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customerId = user?.profile?._id || user?._id;
      const [invRes, payRes] = await Promise.all([
        invoiceApi.getInvoices({ customer: customerId, limit: 50 }),
        paymentApi.getPayments({ limit: 100 }),
      ]);

      if (invRes.success) {
        setInvoices(invRes.data);
        if (invRes.data.length > 0) {
          // Keep current selected if valid, else first
          setSelectedInvoice((prev) => {
            if (prev) {
              const updated = invRes.data.find((i: Invoice) => i._id === prev._id);
              return updated || invRes.data[0];
            }
            return invRes.data[0];
          });
        }
      } else {
        setError(invRes.message || 'Failed to fetch invoices');
      }

      if (payRes.success) {
        setPayments(payRes.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const getPaymentStatus = (invoice: Invoice) => {
    if (invoice.outstandingBalance === 0) return 'paid';
    if (invoice.amountPaid > 0) return 'partially_paid';
    return 'unpaid';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
      paid: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Paid' },
      partially_paid: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Partially Paid' },
      unpaid: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', label: 'Unpaid' },
    };
    
    const config = statusConfig[status] || statusConfig.unpaid;
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  const handleDownloadPDF = () => {
    window.print();
    toast.success('PDF download initiated');
  };

  const handlePayNow = (targetInvoice?: Invoice) => {
    const inv = targetInvoice || selectedInvoice;
    if (!inv) {
      toast.error('Please select an invoice to pay');
      return;
    }
    setInvoiceToPay(inv);
    setIsPaymentModalOpen(true);
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.vehicle?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.outstandingBalance || 0), 0);
  const pendingInvoices = invoices.filter(inv => inv.outstandingBalance > 0).length;

  // Payments corresponding to the currently selected invoice
  const currentInvoicePayments = selectedInvoice
    ? payments.filter((p: any) => {
        const pInvId = p.invoice?._id || p.invoice;
        return pInvId === selectedInvoice._id || p.invoice?.invoiceNumber === selectedInvoice.invoiceNumber;
      })
    : [];

  const hasPendingPayment = currentInvoicePayments.some((p: any) => p.status === 'pending');

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchInvoices} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices & Payments</h1>
        <p className="text-sm text-slate-500">View your invoices, submit payments online or at counter, and check verification status</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by invoice number or vehicle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Invoice List & Outstanding Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Your Invoices</h2>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No invoices found
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredInvoices.map((invoice) => {
                  const isSelected = selectedInvoice?._id === invoice._id;
                  const status = getPaymentStatus(invoice);
                  const invPending = payments.some(
                    (p: any) => (p.invoice?._id === invoice._id || p.invoice === invoice._id) && p.status === 'pending'
                  );
                  return (
                    <div
                      key={invoice._id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-bold text-brand-600 text-sm">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-slate-500">{formatDate(invoice.createdAt)}</div>
                      </div>
                      
                      <div className="text-xs mb-2">
                        <div className="text-slate-400">Vehicle</div>
                        <div className="font-semibold text-slate-700">{invoice.vehicle?.registrationNumber || 'N/A'}</div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-slate-800">{formatLKR(invoice.grandTotal)}</div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Paid:</span>
                          <span className="font-semibold">{formatLKR(invoice.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Balance:</span>
                          <span className={`font-semibold ${
                            invoice.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {formatLKR(invoice.outstandingBalance)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        {getStatusBadge(status)}
                        {invPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-2.5 h-2.5" />
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outstanding Balance Summary Card */}
          {totalOutstanding > 0 && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">Outstanding Balance Summary</h3>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs opacity-90">Total Outstanding:</span>
                  <span className="text-2xl font-black tracking-tight">{formatLKR(totalOutstanding)}</span>
                </div>
                <div className="text-xs opacity-90">({pendingInvoices} invoice{pendingInvoices !== 1 ? 's' : ''} pending payment)</div>
                <button
                  onClick={() => handlePayNow(selectedInvoice || filteredInvoices[0])}
                  className="w-full mt-3 bg-white text-orange-600 font-extrabold py-2.5 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 shadow-md text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Invoice Details */}
        <div className="lg:col-span-2">
          {selectedInvoice ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-400">Invoice Number</div>
                  <div className="text-2xl font-black text-slate-800">{selectedInvoice.invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-slate-400">Job Card</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {selectedInvoice.jobCard?.jobCardNumber || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Pending Payment Notice Banner */}
              {hasPendingPayment && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 space-y-0.5">
                    <div className="font-bold text-sm text-amber-900">Payment Pending Verification</div>
                    <p>
                      You have submitted a payment for this invoice. The workshop manager is verifying the transaction. The invoice balance will be updated upon approval.
                    </p>
                  </div>
                </div>
              )}

              {/* Vehicle & Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Vehicle</div>
                  <div className="text-base font-extrabold text-slate-800">
                    {selectedInvoice.vehicle?.registrationNumber || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedInvoice.vehicle?.make} {selectedInvoice.vehicle?.model}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Customer</div>
                  <div className="text-base font-extrabold text-slate-800">
                    {selectedInvoice.customer?.user ? `${selectedInvoice.customer.user.firstName} ${selectedInvoice.customer.user.lastName}` : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">Auto Filled</div>
                </div>
              </div>

              {/* Parts / Items Breakdown */}
              <div className="border border-slate-100 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Parts / Items Used</div>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <span className="text-slate-700 font-medium">
                          {item.description} <span className="text-slate-400 font-mono">x{item.quantity}</span>
                        </span>
                        <span className="font-bold text-slate-800">{formatLKR(item.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No parts recorded</div>
                )}
              </div>

              {/* Labor Charges */}
              <div className="border border-slate-100 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Labor Charges</div>
                {selectedInvoice.laborCharges && selectedInvoice.laborCharges.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInvoice.laborCharges.map((labor, index) => (
                      <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <span className="text-slate-700 font-medium">
                          {labor.description} ({labor.hours} hrs @ {formatLKR(labor.ratePerHour)}/hr)
                        </span>
                        <span className="font-bold text-slate-800">{formatLKR(labor.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No labor charges recorded</div>
                )}
              </div>

              {/* Grand Total & Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Grand Total</div>
                  <div className="text-xl font-black text-brand-600">{formatLKR(selectedInvoice.grandTotal)}</div>
                  <div className="text-[10px] text-slate-400">(Auto Calculated)</div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Outstanding Balance</div>
                  <div className={`text-xl font-black ${
                    selectedInvoice.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {formatLKR(selectedInvoice.outstandingBalance)}
                  </div>
                  <div className="text-[10px] text-slate-400">(Auto Calculated)</div>
                </div>
              </div>

              {/* Payment History Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Payment History</div>
                  <span className="text-[10px] text-slate-400 font-medium">Recorded & Submitted Payments</span>
                </div>
                
                {currentInvoicePayments.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {currentInvoicePayments.map((payment: any, index: number) => {
                      const isPending = payment.status === 'pending';
                      const isRejected = payment.status === 'rejected';
                      const isCompleted = payment.status === 'completed';

                      return (
                        <div key={payment._id || index} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{payment.paymentId || 'Payment'}</span>
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                  <Clock className="w-2.5 h-2.5" />
                                  Pending Verification
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Verified & Approved
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                  <XCircle className="w-2.5 h-2.5" />
                                  Rejected
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              {formatDate(payment.paymentDate || payment.createdAt)} · Method: <strong className="capitalize text-slate-700">{payment.paymentMethod?.replace('_', ' ')}</strong>
                              {payment.referenceNumber && ` (Ref: ${payment.referenceNumber})`}
                            </div>
                            {isRejected && payment.rejectionReason && (
                              <div className="text-[11px] text-red-600 mt-1">
                                Reason: {payment.rejectionReason}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-slate-800">{formatLKR(payment.amount)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">No payments recorded yet</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                {selectedInvoice.outstandingBalance > 0 && (
                  <button
                    onClick={() => handlePayNow(selectedInvoice)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md transition-all ml-auto"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-card">
              <Receipt className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 mb-1">Select an Invoice</h3>
              <p className="text-sm text-slate-400">Choose an invoice from the list to view details and make a payment</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoiceToPay}
        onSuccess={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
};

export default CustomerInvoicesPage;
