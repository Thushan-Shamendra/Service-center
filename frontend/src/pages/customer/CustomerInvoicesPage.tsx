import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { invoiceApi } from '../../api/invoiceApi';
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
  Mail
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
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
  }>;
}

export const CustomerInvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customerId = user?.profile?._id || user?._id;
      const res = await invoiceApi.getInvoices({ customer: customerId, limit: 50 });
      if (res.success) {
        setInvoices(res.data);
        if (res.data.length > 0 && !selectedInvoice) {
          setSelectedInvoice(res.data[0]);
        }
      } else {
        setError(res.message || 'Failed to fetch invoices');
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

  const handlePayNow = () => {
    toast.success('Payment functionality would be implemented here');
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.vehicle?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.outstandingBalance || 0), 0);
  const pendingInvoices = invoices.filter(inv => inv.outstandingBalance > 0).length;

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchInvoices} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices & Payments</h1>
        <p className="text-sm text-slate-500">View your invoices, payment history, and outstanding balances</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by invoice number or vehicle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Invoice List</h2>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No invoices found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredInvoices.map((invoice) => {
                  const status = getPaymentStatus(invoice);
                  const isSelected = selectedInvoice?._id === invoice._id;
                  
                  return (
                    <div
                      key={invoice._id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50 border-l-4 border-brand-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-bold text-brand-600 text-sm">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-slate-500">{formatDate(invoice.createdAt)}</div>
                      </div>
                      
                      <div className="text-xs mb-2">
                        <div className="text-slate-400">Vehicle</div>
                        <div className="font-semibold text-slate-700">{invoice.vehicle?.registrationNumber}</div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-slate-700">{formatLKR(invoice.grandTotal)}</div>
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

                      <div className="flex items-center justify-between mt-2">
                        {getStatusBadge(status)}
                        <div className="flex gap-1">
                          <button className="text-[10px] text-brand-600 hover:text-brand-700 font-medium">View</button>
                          <span className="text-slate-300">|</span>
                          <button className="text-[10px] text-brand-600 hover:text-brand-700 font-medium">PDF</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outstanding Balance Summary */}
          {totalOutstanding > 0 && (
            <div className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Outstanding Balance Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Outstanding:</span>
                  <span className="text-2xl font-extrabold">{formatLKR(totalOutstanding)}</span>
                </div>
                <div className="text-xs opacity-90">({pendingInvoices} invoice{pendingInvoices !== 1 ? 's' : ''} pending)</div>
                <button
                  onClick={handlePayNow}
                  className="w-full mt-3 bg-white text-orange-600 font-bold py-2 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Details Panel */}
        <div className="lg:col-span-2">
          {selectedInvoice ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">Invoice Details</h2>
                <p className="text-sm text-slate-500">Selected: {selectedInvoice.invoiceNumber}</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Invoice & Job Card Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Invoice Number</div>
                    <div className="text-sm font-semibold text-slate-700">{selectedInvoice.invoiceNumber}</div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Job Card</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {selectedInvoice.jobCard?.jobCardNumber || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Vehicle</div>
                  <div className="text-sm font-semibold text-slate-700">{selectedInvoice.vehicle?.registrationNumber}</div>
                  <div className="text-xs text-slate-500">{selectedInvoice.vehicle?.make} {selectedInvoice.vehicle?.model}</div>
                  <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                </div>

                {/* Parts Used */}
                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Parts Used</div>
                    <div className="text-sm text-slate-700">
                      {selectedInvoice.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span>{item.description}</span>
                          <span className="text-slate-500">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Labor Charges */}
                {selectedInvoice.laborCharges && selectedInvoice.laborCharges.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Labor Charges</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {formatLKR(selectedInvoice.laborCharges.reduce((sum, lc) => sum + lc.total, 0))}
                    </div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Discount */}
                {selectedInvoice.discount > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Discount</div>
                    <div className="text-sm font-semibold text-emerald-600">{formatLKR(selectedInvoice.discount)}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Grand Total */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Grand Total</div>
                  <div className="text-lg font-extrabold text-brand-600">{formatLKR(selectedInvoice.grandTotal)}</div>
                  <div className="text-[10px] text-slate-400">(Auto Calculated)</div>
                </div>

                {/* Payment History */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Payment History</div>
                  <div className="text-[10px] text-slate-400">(Auto Loaded)</div>
                  
                  {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {selectedInvoice.payments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                          <div>
                            <div className="font-semibold text-slate-700">{payment.paymentId}</div>
                            <div className="text-slate-500">{formatDate(payment.paymentDate)} · {payment.paymentMethod}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-700">{formatLKR(payment.amount)}</div>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 mt-2">No payments recorded yet</div>
                  )}
                </div>

                {/* Outstanding Balance */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Outstanding Balance</div>
                  <div className={`text-lg font-extrabold ${
                    selectedInvoice.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {formatLKR(selectedInvoice.outstandingBalance)}
                  </div>
                  <div className="text-[10px] text-slate-400">(Auto Calculated)</div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  {selectedInvoice.outstandingBalance > 0 && (
                    <button
                      onClick={handlePayNow}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-card">
              <Receipt className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 mb-1">Select an Invoice</h3>
              <p className="text-sm text-slate-400">Choose an invoice from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
