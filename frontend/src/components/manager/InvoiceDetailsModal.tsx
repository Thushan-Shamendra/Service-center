import React, { useEffect, useState } from 'react';
import { invoiceApi } from '../../api/invoiceApi';
import { Invoice } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { formatLKR, formatDate } from '../../utils/formatters';
import { X, Printer, FileText, User, Car, Calendar, CreditCard, AlertCircle } from 'lucide-react';

interface InvoiceDetailsModalProps {
  invoiceId: string;
  onClose: () => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await invoiceApi.getInvoiceById(invoiceId);
      if (res.success) {
        setInvoice(res.data);
      } else {
        setError(res.message || 'Failed to fetch invoice');
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
  const vehicle = typeof invoice.vehicle === 'object' ? invoice.vehicle : null;
  const jobCard = typeof invoice.jobCard === 'object' ? invoice.jobCard : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-brand-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invoice {invoice.invoiceNumber}</h2>
              <StatusBadge status={invoice.paymentStatus} />
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Customer</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-6">
                  {customer?.firstName && customer?.lastName
                    ? `${customer.firstName} ${customer.lastName}`
                    : 'N/A'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Vehicle</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-6">
                  {vehicle?.make && vehicle?.model
                    ? `${vehicle.make} ${vehicle.model} / ${vehicle.registrationNumber || 'N/A'}`
                    : 'N/A'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Job Card</span>
                </div>
                <p className="text-sm font-medium text-slate-900 pl-6">
                  {jobCard?.jobCardNumber || 'N/A'}
                </p>
              </div>

              <div className="space-y-3">
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
              <h3 className="text-sm font-bold text-slate-900 mb-3">DESCRIPTION</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2 px-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                      <th className="text-right py-2 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="py-2 px-4 text-sm text-slate-900">{item.description}</td>
                        <td className="py-2 px-4 text-sm text-right text-slate-900">
                          {formatLKR(item.total)}
                        </td>
                      </tr>
                    ))}
                    {invoice.laborCharges?.map((item, index) => (
                      <tr key={`labor-${index}`} className="border-t border-slate-100">
                        <td className="py-2 px-4 text-sm text-slate-900">
                          {item.description} ({item.hours} hrs @ {formatLKR(item.ratePerHour)}/hr)
                        </td>
                        <td className="py-2 px-4 text-sm text-right text-slate-900">
                          {formatLKR(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-900">{formatLKR(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Discount</span>
                <span className="text-slate-900">{formatLKR(invoice.discount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax Amount</span>
                <span className="text-slate-900">{formatLKR(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Grand Total</span>
                <span className="text-brand-600">{formatLKR(invoice.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Payment Summary</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Paid</span>
                  <span className="text-emerald-600 font-medium">{formatLKR(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Outstanding</span>
                  <span className={`font-medium ${invoice.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatLKR(invoice.outstandingBalance)}
                  </span>
                </div>
              </div>

              {/* Payment History */}
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
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
  );
};