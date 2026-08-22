import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Search, X, Mail, MessageSquare, Lock, DollarSign, AlertTriangle, Check } from 'lucide-react';
import { notificationApi } from '../../../api/notificationApi';
import { invoiceApi } from '../../../api/invoiceApi';
import toast from 'react-hot-toast';
import { formatLKR, formatDate } from '../../../utils/formatters';

interface Customer {
  id: string;
  _id?: string;
  customerId: string;
  fullName: string;
  mobile: string;
  email: string;
}

interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  customer: any;
  vehicle: any;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: string;
  status: string;
  createdAt?: string;
  dueDate?: string;
}

export const PaymentReminderPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<('email' | 'sms')[]>(['email', 'sms']);
  const [message, setMessage] = useState('');
  
  // Auto-filled data
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  
  // UI state
  const [showInvoiceSearch, setShowInvoiceSearch] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<Invoice[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Generate default message when invoice is selected
    if (selectedInvoice && selectedCustomer) {
      const defaultMessage = `Dear ${selectedCustomer.fullName},

This is a friendly reminder regarding the outstanding balance for invoice ${selectedInvoice.invoiceNumber}.

Outstanding Balance: ${formatLKR(selectedInvoice.outstandingBalance)}

Please contact VSMS.LK to arrange payment.

Thank you.`;
      setMessage(defaultMessage);
    }
  }, [selectedInvoice, selectedCustomer]);

  const handleInvoiceSearch = async () => {
    if (!invoiceSearchQuery) return;
    
    try {
      const res = await invoiceApi.getInvoices({ search: invoiceSearchQuery });
      if (res.success) {
        // Filter for invoices with outstanding balance
        const validInvoices = (res.data || []).filter((inv: Invoice) => 
          inv.outstandingBalance > 0
        );
        setInvoiceResults(validInvoices);
      }
    } catch (err: any) {
      console.error('Error searching invoices:', err);
      setInvoiceResults([]);
    }
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceSearch(false);
    setInvoiceSearchQuery('');
    setInvoiceResults([]);
    
    if (invoice.customer) {
      const customerData = typeof invoice.customer === 'object' 
        ? invoice.customer 
        : { fullName: invoice.customer, customerId: '', mobile: '', email: '' };
      setSelectedCustomer(customerData as Customer);
    }
    
    if (invoice.vehicle) {
      const vehicleData = typeof invoice.vehicle === 'object' 
        ? invoice.vehicle 
        : { make: '', model: '', registrationNumber: invoice.vehicle };
      setVehicleInfo(`${vehicleData.make} ${vehicleData.model} / ${vehicleData.registrationNumber}`);
    }
    
    setInvoiceTotal(formatLKR(invoice.grandTotal));
    setAmountPaid(formatLKR(invoice.amountPaid));
    setOutstandingBalance(formatLKR(invoice.outstandingBalance));
    setInvoiceDate(invoice.createdAt ? formatDate(invoice.createdAt) : '');
    setPaymentStatus(invoice.paymentStatus);
  };

  const validateNotification = () => {
    if (!selectedCustomer) {
      setValidationError('Please select a customer');
      return false;
    }
    
    if (!selectedInvoice) {
      setValidationError('Please select an invoice');
      return false;
    }
    
    if (selectedInvoice.outstandingBalance <= 0) {
      setValidationError('This invoice is fully paid. No payment reminder is required.');
      return false;
    }
    
    if (!message) {
      setValidationError('Please enter a message');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const handleSendNotification = async () => {
    if (!validateNotification()) {
      toast.error(validationError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await notificationApi.sendNotification({
        type: 'payment_reminder',
        customerId: selectedCustomer._id || selectedCustomer.id,
        channels: selectedChannels,
        subject: 'Payment Reminder',
        message,
        invoiceId: selectedInvoice._id || selectedInvoice.id,
      });
      
      if (res.success) {
        toast.success('Payment reminder sent successfully');
        navigate('/manager/notifications');
      } else {
        toast.error(res.message || 'Failed to send notification');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error sending notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (!validateNotification()) {
      toast.error(validationError);
      return;
    }
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager/notifications')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Notifications</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">💰 Payment Reminder</h1>
        <div className="w-32" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        {/* Invoice Selection */}
        <div className="mb-6 bg-slate-50 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">INVOICE</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Invoice *</label>
            <button
              onClick={() => setShowInvoiceSearch(true)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-left flex items-center justify-between hover:bg-white transition-colors"
            >
              {selectedInvoice ? (
                <span className="text-slate-900">{selectedInvoice.invoiceNumber}</span>
              ) : (
                <span className="text-slate-400">🔍 Search invoice</span>
              )}
              <Search className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Auto-filled Details */}
        {selectedInvoice && (
          <>
            <div className="mb-6 bg-slate-50 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">INVOICE DETAILS</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Customer</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedCustomer?.fullName || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                    />
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Invoice</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedInvoice.invoiceNumber}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                    />
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Invoice Date</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={invoiceDate}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                    />
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mb-6 bg-slate-50 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">PAYMENT SUMMARY</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Invoice Amount</span>
                  <span className="text-sm font-medium text-slate-900">{invoiceTotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Amount Paid</span>
                  <span className="text-sm font-medium text-slate-900">{amountPaid}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm font-medium text-slate-700">Outstanding Balance</span>
                  <span className="text-sm font-bold text-slate-900">{outstandingBalance}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    paymentStatus === 'paid' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : paymentStatus === 'partially_paid'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {paymentStatus === 'paid' ? 'PAID' : paymentStatus === 'partially_paid' ? 'PARTIAL' : 'UNPAID'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delivery Channels */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-500 uppercase mb-3">DELIVERY CHANNEL</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedChannels.includes('email')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedChannels([...selectedChannels, 'email']);
                  } else {
                    setSelectedChannels(selectedChannels.filter(c => c !== 'email'));
                  }
                }}
                className="rounded w-4 h-4"
              />
              <span className="text-sm text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedChannels.includes('sms')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedChannels([...selectedChannels, 'sms']);
                  } else {
                    setSelectedChannels(selectedChannels.filter(c => c !== 'sms'));
                  }
                }}
                className="rounded w-4 h-4"
              />
              <span className="text-sm text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS
              </span>
            </label>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            placeholder="Enter your message here..."
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-800">{validationError}</p>
          </div>
        )}

        {/* Success Message for fully paid invoices */}
        {selectedInvoice && selectedInvoice.outstandingBalance <= 0 && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">This invoice is fully paid. No payment reminder is required.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={() => navigate('/manager/notifications')}
            className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handlePreview}
            className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            disabled={selectedInvoice?.outstandingBalance <= 0}
          >
            Preview
          </button>
          <button
            onClick={handleSendNotification}
            disabled={isLoading || selectedInvoice?.outstandingBalance <= 0}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Sending...' : 'Send Payment Reminder'}
          </button>
        </div>
      </div>

      {/* Invoice Search Modal */}
      {showInvoiceSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Select Invoice</h3>
              <button onClick={() => setShowInvoiceSearch(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by invoice ID or customer name"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvoiceSearch()}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
              />
            </div>
            
            <button
              onClick={handleInvoiceSearch}
              className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 mb-4 font-medium"
            >
              Search
            </button>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invoiceResults.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => handleSelectInvoice(invoice)}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <p className="font-bold text-slate-900">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-slate-600">Outstanding: {formatLKR(invoice.outstandingBalance)}</p>
                  <p className="text-sm text-slate-600">Status: {invoice.paymentStatus}</p>
                </div>
              ))}
              {invoiceResults.length === 0 && invoiceSearchQuery && (
                <p className="text-center text-sm text-slate-400 py-4">No invoices with outstanding balance found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Notification Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 text-sm text-slate-600">
              <p><span className="font-medium">To:</span> {selectedCustomer?.fullName}</p>
              <p>{selectedCustomer?.mobile} • {selectedCustomer?.email}</p>
            </div>
            
            <div className="mb-4 text-sm text-slate-600">
              <p><span className="font-medium">Channel:</span> {selectedChannels.includes('email') && selectedChannels.includes('sms') ? 'Email + SMS' : selectedChannels.join(', ')}</p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{message}</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
              >
                Edit Message
              </button>
              <button
                onClick={handleSendNotification}
                disabled={isLoading}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Sending...' : 'Send Payment Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
