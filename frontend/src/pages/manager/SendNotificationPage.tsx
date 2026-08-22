import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Search, X, Mail, MessageSquare, Lock, AlertTriangle } from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  _id?: string;
  customerId: string;
  fullName: string;
  mobile: string;
  email: string;
  vehicles?: any[];
}

export const SendNotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();
  
  const [selectedType, setSelectedType] = useState<'appointment_confirmation' | 'appointment_cancellation' | 'appointment_reminder' | 'vehicle_ready' | 'invoice_ready' | 'payment_reminder'>(
    (type as any) || 'appointment_confirmation'
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<('email' | 'sms')[]>(['email', 'sms']);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Related IDs
  const [appointmentId, setAppointmentId] = useState('');
  const [jobCardId, setJobCardId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [reminderDays, setReminderDays] = useState(1);
  const [cancellationReason, setCancellationReason] = useState('');
  
  // Auto-filled data
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [technician, setTechnician] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  
  // UI state
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (type) {
      setSelectedType(type as any);
    }
  }, [type]);

  useEffect(() => {
    // Auto-fill subject based on type
    const subjects: any = {
      appointment_confirmation: 'Appointment Confirmation',
      appointment_cancellation: 'Appointment Cancellation',
      appointment_reminder: 'Appointment Reminder',
      vehicle_ready: 'Vehicle Ready for Collection',
      invoice_ready: 'Invoice Ready',
      payment_reminder: 'Payment Reminder',
    };
    setSubject(subjects[selectedType] || '');
  }, [selectedType]);

  const getTypeLabel = (type: string) => {
    const labels: any = {
      appointment_confirmation: 'Appointment Confirmation',
      appointment_cancellation: 'Appointment Cancellation',
      appointment_reminder: 'Appointment Reminder',
      vehicle_ready: 'Vehicle Ready',
      invoice_ready: 'Invoice Ready',
      payment_reminder: 'Payment Reminder',
    };
    return labels[type] || type;
  };

  const handleCustomerSearch = async () => {
    if (!customerSearchQuery) return;
    
    try {
      const res = await notificationApi.searchCustomers(customerSearchQuery);
      if (res.success) {
        setSearchResults(res.data || []);
      }
    } catch (err: any) {
      console.error('Error searching customers:', err);
      setSearchResults([]);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
    setSearchResults([]);
    // Auto-fill vehicle info if available
    if (customer.vehicles && customer.vehicles.length > 0) {
      const vehicle = customer.vehicles[0];
      setVehicleInfo(`${vehicle.make} ${vehicle.model} / ${vehicle.registrationNumber}`);
    }
  };

  const validateNotification = () => {
    if (!selectedCustomer) {
      setValidationError('Please select a customer');
      return false;
    }
    
    if (!message) {
      setValidationError('Please enter a message');
      return false;
    }
    
    if (selectedType === 'appointment_cancellation' && !cancellationReason) {
      setValidationError('Please provide a cancellation reason');
      return false;
    }
    
    // Business validation rules
    if (selectedType === 'vehicle_ready' && jobCardId) {
      // Would check job card status in real implementation
      // For now, we'll assume it's valid
    }
    
    if (selectedType === 'invoice_ready' && invoiceId) {
      // Would check invoice status in real implementation
    }
    
    if (selectedType === 'payment_reminder' && invoiceId) {
      // Would check if outstanding balance > 0
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
        type: selectedType,
        customerId: selectedCustomer._id || selectedCustomer.id,
        channels: selectedChannels,
        subject,
        message,
        appointmentId,
        jobCardId,
        invoiceId,
        reminderDays: selectedType === 'appointment_reminder' ? reminderDays : undefined,
      });
      
      if (res.success) {
        toast.success('Notification sent successfully');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager/notifications')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Notifications</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Send Notification</h1>
        <div className="w-32" /> {/* Spacer for alignment */}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        {/* Notification Type */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-500 uppercase mb-2">NOTIFICATION TYPE</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50"
          >
            <option value="appointment_confirmation">Appointment Confirmation</option>
            <option value="appointment_cancellation">Appointment Cancellation</option>
            <option value="appointment_reminder">Appointment Reminder</option>
            <option value="vehicle_ready">Vehicle Ready</option>
            <option value="invoice_ready">Invoice Ready</option>
            <option value="payment_reminder">Payment Reminder</option>
          </select>
        </div>

        {/* Recipient */}
        <div className="mb-6 bg-slate-50 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">RECIPIENT</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Customer *</label>
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-left flex items-center justify-between hover:bg-white transition-colors"
            >
              {selectedCustomer ? (
                <span className="text-slate-900">{selectedCustomer.fullName} ({selectedCustomer.customerId})</span>
              ) : (
                <span className="text-slate-400">🔍 Search customer</span>
              )}
              <Search className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          {selectedCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Mobile</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedCustomer.mobile}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                  />
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedCustomer.email}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm"
                  />
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related IDs based on type */}
        {(selectedType === 'appointment_confirmation' || selectedType === 'appointment_cancellation' || selectedType === 'appointment_reminder') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Appointment ID</label>
            <input
              type="text"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              placeholder="AP-00000"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
          </div>
        )}

        {selectedType === 'vehicle_ready' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Card ID</label>
            <input
              type="text"
              value={jobCardId}
              onChange={(e) => setJobCardId(e.target.value)}
              placeholder="JC-00000"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
          </div>
        )}

        {(selectedType === 'invoice_ready' || selectedType === 'payment_reminder') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Invoice ID</label>
            <input
              type="text"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="INV-00000"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
          </div>
        )}

        {/* Cancellation Reason */}
        {selectedType === 'appointment_cancellation' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Cancellation Reason *</label>
            <input
              type="text"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Workshop unavailable due to emergency"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
          </div>
        )}

        {/* Reminder Days */}
        {selectedType === 'appointment_reminder' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Reminder</label>
            <select
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            >
              <option value={1}>1 Day Before</option>
              <option value={2}>2 Days Before</option>
              <option value={3}>3 Days Before</option>
              <option value={7}>1 Week Before</option>
            </select>
          </div>
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
          <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl"
          />
        </div>

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
            {isLoading ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Select Customer</h3>
              <button onClick={() => setShowCustomerSearch(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name / phone / customer ID"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
              />
            </div>
            
            <button
              onClick={handleCustomerSearch}
              className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 mb-4 font-medium"
            >
              Search
            </button>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <p className="font-bold text-slate-900">{customer.fullName}</p>
                  <p className="text-sm text-slate-600">{customer.customerId}</p>
                  <p className="text-sm text-slate-600">{customer.mobile}</p>
                </div>
              ))}
              {searchResults.length === 0 && customerSearchQuery && (
                <p className="text-center text-sm text-slate-400 py-4">No customers found</p>
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
            
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-slate-900">{subject}</p>
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
                {isLoading ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
