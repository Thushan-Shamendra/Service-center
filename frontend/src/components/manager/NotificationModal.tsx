import React, { useEffect, useState } from 'react';
import { notificationApi } from '../../api/notificationApi';
import { User } from '../../types';
import { Search, X, Mail, MessageSquare, Check, Lock, AlertTriangle } from 'lucide-react';
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

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedType, setSelectedType] = useState<'appointment_confirmation' | 'appointment_cancellation' | 'appointment_reminder' | 'vehicle_ready' | 'invoice_ready' | 'payment_reminder'>('appointment_confirmation');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<('email' | 'sms')[]>(['email', 'sms']);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [appointmentId, setAppointmentId] = useState('');
  const [jobCardId, setJobCardId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [reminderDays, setReminderDays] = useState(1);
  const [cancellationReason, setCancellationReason] = useState('');
  
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedType('appointment_confirmation');
      setSelectedCustomer(null);
      setSelectedChannels(['email', 'sms']);
      setSubject('Appointment Confirmation');
      setMessage('');
      setAppointmentId('');
      setJobCardId('');
      setInvoiceId('');
      setReminderDays(1);
      setCancellationReason('');
      setValidationError('');
      setSearchResults([]);
      setCustomerSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
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

  const handleCustomerSearch = async () => {
    if (!customerSearchQuery) return;
    
    try {
      const res = await notificationApi.searchCustomers(customerSearchQuery);
      if (res.success) {
        setSearchResults(res.data || []);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setSearchResults([]);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setCustomerSearchQuery('');
    setSearchResults([]);
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
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.message || 'Failed to send notification');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error sending notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Notification Type */}
      <div>
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
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">RECIPIENT</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Customer *</label>
          <button
            type="button"
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

      {/* Related IDs */}
      {(selectedType === 'appointment_confirmation' || selectedType === 'appointment_cancellation' || selectedType === 'appointment_reminder') && (
        <div>
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
        <div>
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
        <div>
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
        <div>
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
        <div>
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
      <div>
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
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl"
          placeholder="Enter your message here..."
        />
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800">{validationError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSendNotification}
          disabled={isLoading}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
        >
          <Check className="w-4 h-4" />
          {isLoading ? 'Sending...' : 'Send Notification'}
        </button>
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
              type="button"
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
    </div>
  );
};
