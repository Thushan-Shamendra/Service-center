import React, { useEffect, useState } from 'react';
import { invoiceApi } from '../../api/invoiceApi';
import { paymentApi } from '../../api/paymentApi';
import { Invoice } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { formatLKR, formatDate } from '../../utils/formatters';
import { X, Printer, FileText, User, Car, Calendar, CreditCard, AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface InvoiceDetailsModalProps {
  invoiceId: string;
  onClose: () => void;
  onPaymentRecorded?: () => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoiceId, onClose, onPaymentRecorded }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Record payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'cheque'>('cash');
  const [refNumber, setRefNumber] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, payRes] = await Promise.all([
        invoiceApi.getInvoiceById(invoiceId),
        paymentApi.getPayments({ invoice: invoiceId }),
      ]);
      if (res.success) {
        setInvoice(res.data);
        setPayAmount(res.data.outstandingBalance || '');
      } else {
        setError(res.message || 'Failed to fetch invoice');
      }
      if (payRes.success) {
        setPayments(payRes.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading invoice');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (amountNum > (invoice.outstandingBalance || 0)) {
      toast.error(`Amount exceeds outstanding balance of ${formatLKR(invoice.outstandingBalance || 0)}`);
      return;
    }

    if (payMethod === 'bank_transfer' && !refNumber.trim()) {
      toast.error('Reference number is required for bank transfer');
      return;
    }

    if (payMethod === 'card' && !cardLast4.trim()) {
      toast.error('Card last 4 digits are required');
      return;
    }

    if (payMethod === 'cheque' && (!chequeNumber.trim() || !chequeDate)) {
      toast.error('Cheque number and cheque date are required');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const payload: any = {
        amount: amountNum,
        paymentMethod: payMethod,
        referenceNumber: refNumber.trim() || undefined,
        paymentDate: new Date().toISOString(),
      };

      if (payMethod === 'card') {
        payload.cardDetails = { lastFourDigits: cardLast4.trim() };
      }
      if (payMethod === 'cheque') {
        payload.bankDetails = { chequeNumber: chequeNumber.trim(), chequeDate };
      }

      const res = await invoiceApi.recordPayment(invoice._id || invoice.id, payload);
      if (res.success) {
        toast.success(res.message || 'Payment recorded successfully');
        setShowPaymentForm(false);
        setRefNumber('');
        setCardLast4('');
        setChequeNumber('');
        setChequeDate('');
        await fetchInvoice();
        onPaymentRecorded?.();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="space-y-2 mt-6">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Invoice</h3>
          <p className="text-sm text-slate-600 mb-4">{error || 'Invoice not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const customer = typeof invoice.customer === 'object' ? invoice.customer : null;
  const customerUser = customer?.user || customer;
  const customerFullName = customerUser?.firstName
    ? `${customerUser.firstName} ${customerUser.lastName || ''}`.trim()
    : (customer?.name || 'N/A');

  const vehicle = typeof invoice.vehicle === 'object' ? invoice.vehicle : null;
  const vehicleInfo = vehicle
    ? `${vehicle.make || ''} ${vehicle.model || ''}${vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : ''}`.trim()
    : (typeof invoice.vehicle === 'string' ? invoice.vehicle : 'N/A');

  const jobCard = typeof invoice.jobCard === 'object' ? invoice.jobCard : null;
  const jobCardNumber = jobCard?.jobCardNumber || (typeof invoice.jobCard === 'string' ? invoice.jobCard : 'N/A');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-brand-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invoice {invoice.invoiceNumber}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={invoice.paymentStatus} />
                <span className="text-xs text-slate-400 capitalize">Status: {invoice.status || 'draft'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Invoice Details */}
          <div className="space-y-6">
            {/* Customer & Vehicle Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Customer</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-6">
                  {customerFullName}
                </p>
                {customerUser?.mobile && (
                  <p className="text-xs text-slate-500 pl-6">{customerUser.mobile}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Vehicle</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-6">
                  {vehicleInfo}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Job Card</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-6">
                  {jobCardNumber}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Invoice Date</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-6">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">ITEMS & LABOR</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2 px-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                      <th className="text-right py-2 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => (
                        <tr key={`item-${index}`} className="border-t border-slate-100">
                          <td className="py-2 px-4 text-sm text-slate-900">
                            {item.description}
                            {item.quantity && item.unitPrice ? (
                              <span className="text-xs text-slate-400 block">
                                {item.quantity} × {formatLKR(item.unitPrice)}
                                {item.discount ? ` (Discount: ${formatLKR(item.discount)})` : ''}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2 px-4 text-sm text-right text-slate-900">
                            {formatLKR(item.total)}
                          </td>
                        </tr>
                      ))
                    ) : null}
                    {invoice.laborCharges && invoice.laborCharges.length > 0 ? (
                      invoice.laborCharges.map((item, index) => (
                        <tr key={`labor-${index}`} className="border-t border-slate-100">
                          <td className="py-2 px-4 text-sm text-slate-900">
                            {item.description}
                            <span className="text-xs text-slate-400 block">
                              {item.hours} hrs @ {formatLKR(item.ratePerHour)}/hr
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm text-right text-slate-900">
                            {formatLKR(item.total)}
                          </td>
                        </tr>
                      ))
                    ) : null}
                    {(!invoice.items || invoice.items.length === 0) &&
                     (!invoice.laborCharges || invoice.laborCharges.length === 0) && (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-xs text-slate-400">
                          No line items specified
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-900">{formatLKR(invoice.subtotal || 0)}</span>
              </div>
              {Number(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount</span>
                  <span className="text-slate-900">-{formatLKR(invoice.discount)}</span>
                </div>
              )}
              {Number(invoice.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax ({invoice.taxRate || 0}%)</span>
                  <span className="text-slate-900">{formatLKR(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Grand Total</span>
                <span className="text-brand-600">{formatLKR(invoice.grandTotal || 0)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Payment Summary</span>
                </div>
                {invoice.outstandingBalance > 0 && !showPaymentForm && (
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-xs font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Paid</span>
                  <span className="text-emerald-600 font-medium">{formatLKR(invoice.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Outstanding Balance</span>
                  <span className={`font-semibold ${invoice.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatLKR(invoice.outstandingBalance || 0)}
                  </span>
                </div>
              </div>

              {/* Inline Payment Form */}
              {showPaymentForm && (
                <form onSubmit={handleRecordPaymentSubmit} className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-700">Record Customer Payment</h4>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Amount (Rs.)</label>
                      <input
                        type="number"
                        min="1"
                        max={invoice.outstandingBalance || undefined}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
                      <select
                        value={payMethod}
                        onChange={(e: any) => setPayMethod(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Credit / Debit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>

                    {payMethod === 'card' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Last 4 Digits</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="e.g. 4321"
                          value={cardLast4}
                          onChange={(e) => setCardLast4(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    )}

                    {payMethod === 'cheque' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Cheque Number</label>
                          <input
                            type="text"
                            placeholder="Cheque No."
                            value={chequeNumber}
                            onChange={(e) => setChequeNumber(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Cheque Date</label>
                          <input
                            type="date"
                            value={chequeDate}
                            onChange={(e) => setChequeDate(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </>
                    )}

                    {(payMethod === 'bank_transfer' || payMethod === 'cash') && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {payMethod === 'bank_transfer' ? 'Reference Number *' : 'Reference / Receipt No. (Optional)'}
                        </label>
                        <input
                          type="text"
                          placeholder={payMethod === 'bank_transfer' ? 'Transaction reference' : 'Optional reference'}
                          value={refNumber}
                          onChange={(e) => setRefNumber(e.target.value)}
                          required={payMethod === 'bank_transfer'}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isSubmittingPayment ? 'Recording...' : 'Confirm & Save Payment'}
                    </button>
                  </div>
                </form>
              )}

              {/* Payment Records */}
              {payments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Records</span>
                  <div className="space-y-1.5">
                    {payments.map((p) => (
                      <div key={p._id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <div className="font-semibold text-slate-800">{p.paymentId || 'Payment'} · <span className="capitalize">{p.paymentMethod?.replace('_', ' ')}</span></div>
                          <div className="text-[11px] text-slate-400">{formatDate(p.paymentDate || p.createdAt)} {p.referenceNumber && `· Ref: ${p.referenceNumber}`}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800">{formatLKR(p.amount)}</div>
                          {p.status === 'pending' && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">Pending Approval</span>}
                          {p.status === 'completed' && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">Verified</span>}
                          {p.status === 'rejected' && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">Rejected</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Date */}
              {invoice.dueDate && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">Due Date: {formatDate(invoice.dueDate)}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Notes</h3>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            {invoice.outstandingBalance > 0 && !showPaymentForm && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Record Payment
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};