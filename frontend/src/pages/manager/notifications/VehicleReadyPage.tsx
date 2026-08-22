import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Search, X, Mail, MessageSquare, Lock, Car, AlertTriangle, Check } from 'lucide-react';
import { notificationApi } from '../../../api/notificationApi';
import { jobCardApi } from '../../../api/jobCardApi';
import { invoiceApi } from '../../../api/invoiceApi';
import toast from 'react-hot-toast';
import { formatLKR } from '../../../utils/formatters';

interface Customer {
  id: string;
  _id?: string;
  customerId: string;
  fullName: string;
  mobile: string;
  email: string;
}

interface JobCard {
  id: string;
  _id?: string;
  jobCardNumber: string;
  customer: any;
  vehicle: any;
  status: string;
}

interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: string;
  status: string;
}

export const VehicleReadyPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<('email' | 'sms')[]>(['email', 'sms']);
  const [message, setMessage] = useState('');
  
  // Auto-filled data
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [serviceStatus, setServiceStatus] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  
  // UI state
  const [showJobCardSearch, setShowJobCardSearch] = useState(false);
  const [jobCardSearchQuery, setJobCardSearchQuery] = useState('');
  const [jobCardResults, setJobCardResults] = useState<JobCard[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Generate default message when job card is selected
    if (selectedJobCard && selectedCustomer) {
      let defaultMessage = `Dear ${selectedCustomer.fullName},

Your ${vehicleInfo} is ready for collection.

Please contact VSMS.LK for collection details.`;
      
      if (selectedInvoice && selectedInvoice.outstandingBalance > 0) {
        defaultMessage += `

Invoice: ${selectedInvoice.invoiceNumber}
Outstanding Balance: ${formatLKR(selectedInvoice.outstandingBalance)}`;
      }
      
      defaultMessage += `

Thank you.`;
      
      setMessage(defaultMessage);
    }
  }, [selectedJobCard, selectedCustomer, vehicleInfo, selectedInvoice]);

  const handleJobCardSearch = async () => {
    if (!jobCardSearchQuery) return;
    
    try {
      const res = await jobCardApi.getJobCards({ search: jobCardSearchQuery });
      if (res.success) {
        // Filter for ready for delivery job cards only
        const validJobCards = (res.data || []).filter((jc: JobCard) => 
          jc.status === 'ready_for_delivery'
        );
        setJobCardResults(validJobCards);
      }
    } catch (err: any) {
      console.error('Error searching job cards:', err);
      setJobCardResults([]);
    }
  };

  const handleSelectJobCard = async (jobCard: JobCard) => {
    setSelectedJobCard(jobCard);
    setShowJobCardSearch(false);
    setJobCardSearchQuery('');
    setJobCardResults([]);
    
    if (jobCard.customer) {
      const customerData = typeof jobCard.customer === 'object' 
        ? jobCard.customer 
        : { fullName: jobCard.customer, customerId: '', mobile: '', email: '' };
      setSelectedCustomer(customerData as Customer);
    }
    
    if (jobCard.vehicle) {
      const vehicleData = typeof jobCard.vehicle === 'object' 
        ? jobCard.vehicle 
        : { make: '', model: '', registrationNumber: jobCard.vehicle };
      setVehicleInfo(`${vehicleData.make} ${vehicleData.model} (${vehicleData.registrationNumber})`);
    }
    
    setServiceStatus('Ready for Delivery');
    
    // Try to load invoice for this job card
    try {
      const invoiceRes = await invoiceApi.getInvoices({ jobCardId: jobCard._id || jobCard.id });
      if (invoiceRes.success && invoiceRes.data && invoiceRes.data.length > 0) {
        const invoice = invoiceRes.data[0];
        setSelectedInvoice(invoice);
        setInvoiceStatus(invoice.status);
        setPaymentStatus(invoice.paymentStatus);
        setOutstandingBalance(formatLKR(invoice.outstandingBalance));
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
    }
  };

  const validateNotification = () => {
    if (!selectedCustomer) {
      setValidationError('Please select a customer');
      return false;
    }
    
    if (!selectedJobCard) {
      setValidationError('Please select a job card');
      return false;
    }
    
    if (selectedJobCard.status !== 'ready_for_delivery') {
      setValidationError('Vehicle is not marked as Ready for Delivery');
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
        type: 'vehicle_ready',
        customerId: selectedCustomer._id || selectedCustomer.id,
        channels: selectedChannels,
        subject: 'Vehicle Ready for Collection',
        message,
        jobCardId: selectedJobCard._id || selectedJobCard.id,
        invoiceId: selectedInvoice?._id || selectedInvoice?.id,
      });
      
      if (res.success) {
        toast.success('Vehicle ready notification sent successfully');
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
        <h1 className="text-2xl font-bold text-slate-900">🚗 Vehicle Ready</h1>
        <div className="w-32" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        {/* Job Card Selection */}
        <div className="mb-6 bg-slate-50 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">JOB CARD</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Job Card *</label>
            <button
              onClick={() => setShowJobCardSearch(true)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-left flex items-center justify-between hover:bg-white transition-colors"
            >
              {selectedJobCard ? (
                <span className="text-slate-900">{selectedJobCard.jobCardNumber}</span>
              ) : (
                <span className="text-slate-400">🔍 Search job card</span>
              )}
              <Search className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Auto-filled Details */}
        {selectedJobCard && (
          <>
            <div className="mb-6 bg-slate-50 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">VEHICLE DETAILS</h3>
              
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
                  <label className="block text-xs text-slate-500 mb-1">Vehicle</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={vehicleInfo}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                    />
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Service Status</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={serviceStatus}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                    />
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            {selectedInvoice && (
              <div className="mb-6 bg-slate-50 rounded-xl p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">INVOICE DETAILS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Invoice Status</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={invoiceStatus}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                      />
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Payment Status</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={paymentStatus}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                      />
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Outstanding Balance</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={outstandingBalance}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                      />
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {selectedInvoice.outstandingBalance > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">Outstanding payment exists. Customer should be informed about the balance.</p>
                  </div>
                )}
              </div>
            )}
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
          >
            Preview
          </button>
          <button
            onClick={handleSendNotification}
            disabled={isLoading}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Sending...' : 'Send Vehicle Ready'}
          </button>
        </div>
      </div>

      {/* Job Card Search Modal */}
      {showJobCardSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Select Job Card</h3>
              <button onClick={() => setShowJobCardSearch(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by job card ID or customer name"
                value={jobCardSearchQuery}
                onChange={(e) => setJobCardSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJobCardSearch()}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
              />
            </div>
            
            <button
              onClick={handleJobCardSearch}
              className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 mb-4 font-medium"
            >
              Search
            </button>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jobCardResults.map((jobCard) => (
                <div
                  key={jobCard.id}
                  onClick={() => handleSelectJobCard(jobCard)}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <p className="font-bold text-slate-900">{jobCard.jobCardNumber}</p>
                  <p className="text-sm text-slate-600">Status: {jobCard.status}</p>
                </div>
              ))}
              {jobCardResults.length === 0 && jobCardSearchQuery && (
                <p className="text-center text-sm text-slate-400 py-4">No ready job cards found</p>
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
                {isLoading ? 'Sending...' : 'Send Vehicle Ready'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
