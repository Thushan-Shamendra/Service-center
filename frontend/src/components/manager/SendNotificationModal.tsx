import React, { useState } from 'react';
import { Appointment, User } from '../../types';
import { formatDate, formatPhone } from '../../utils/formatters';
import {
  Mail,
  MessageSquare,
  Send,
  X,
  Calendar,
  Car,
  User as UserIcon,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

type NotificationType = 
  | 'confirmation'
  | 'cancellation'
  | 'reminder'
  | 'vehicle-ready'
  | 'invoice-ready'
  | 'payment-reminder';

interface SendNotificationModalProps {
  appointment: Appointment;
  customer?: User;
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { type: NotificationType; sendEmail: boolean; sendSMS: boolean }) => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  appointment,
  customer,
  isOpen,
  onClose,
  onSend,
}) => {
  const [notificationType, setNotificationType] = useState<NotificationType>('confirmation');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notificationTypes: { value: NotificationType; label: string; icon: React.ReactNode }[] = [
    { value: 'confirmation', label: 'Appointment Confirmation', icon: <Check className="w-4 h-4" /> },
    { value: 'cancellation', label: 'Appointment Cancellation', icon: <X className="w-4 h-4" /> },
    { value: 'reminder', label: 'Appointment Reminder', icon: <Calendar className="w-4 h-4" /> },
    { value: 'vehicle-ready', label: 'Vehicle Ready for Pickup', icon: <Car className="w-4 h-4" /> },
    { value: 'invoice-ready', label: 'Invoice Ready', icon: <Mail className="w-4 h-4" /> },
    { value: 'payment-reminder', label: 'Payment Reminder', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const handleSubmit = async () => {
    if (!sendEmail && !sendSMS) {
      toast.error('Please select at least one notification method');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSend({
        type: notificationType,
        sendEmail,
        sendSMS,
      });
      toast.success('Notification sent successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCustomerName = () => {
    if (typeof appointment.customer === 'object' && appointment.customer.user) {
      return `${appointment.customer.user.firstName} ${appointment.customer.user.lastName}`;
    }
    return customer?.fullName || 'Unknown';
  };

  const getVehicleInfo = () => {
    if (typeof appointment.vehicle === 'object') {
      return `${appointment.vehicle.registrationNumber} - ${appointment.vehicle.make} ${appointment.vehicle.model}`;
    }
    return 'Unknown';
  };

  const getMessagePreview = () => {
    const customerName = getCustomerName();
    const vehicleInfo = getVehicleInfo();
    const date = formatDate(appointment.preferredDate);
    const time = appointment.preferredTime;

    switch (notificationType) {
      case 'confirmation':
        return `Dear ${customerName},\n\nYour appointment (${appointment.appointmentNumber}) for ${vehicleInfo} has been confirmed for ${date} at ${time}.\n\nThank you for choosing VSMS.LK!`;
      case 'cancellation':
        return `Dear ${customerName},\n\nYour appointment (${appointment.appointmentNumber}) for ${vehicleInfo} scheduled for ${date} at ${time} has been cancelled.\n\nWe apologize for any inconvenience.`;
      case 'reminder':
        return `Dear ${customerName},\n\nThis is a friendly reminder about your appointment (${appointment.appointmentNumber}) for ${vehicleInfo} scheduled for ${date} at ${time}.\n\nPlease arrive on time. Thank you!`;
      case 'vehicle-ready':
        return `Dear ${customerName},\n\nYour vehicle ${vehicleInfo} is ready for pickup.\n\nPlease visit our workshop during business hours to collect your vehicle.`;
      case 'invoice-ready':
        return `Dear ${customerName},\n\nYour invoice for appointment ${appointment.appointmentNumber} is ready.\n\nPlease check your email for the detailed invoice and payment information.`;
      case 'payment-reminder':
        return `Dear ${customerName},\n\nThis is a reminder that payment for appointment ${appointment.appointmentNumber} is pending.\n\nPlease complete the payment at your earliest convenience.`;
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Send Notification</h3>
              <p className="text-sm text-slate-500">{appointment.appointmentNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Info */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{getCustomerName()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{getVehicleInfo()}</span>
              </div>
            </div>
          </div>

          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notification Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {notificationTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setNotificationType(type.value)}
                  className={`p-3 border rounded-xl flex items-center gap-3 transition-colors ${
                    notificationType === type.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {type.icon}
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message Preview
            </label>
            <div className="p-4 bg-slate-50 rounded-xl">
              <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">
                {getMessagePreview()}
              </pre>
            </div>
          </div>

          {/* Send Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Send Via
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded"
                />
                <Mail className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">Email</span>
                  <p className="text-xs text-slate-500">{customer?.email || 'N/A'}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  className="rounded"
                />
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">SMS</span>
                  <p className="text-xs text-slate-500">{formatPhone(customer?.mobile)}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Recipient</h4>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Email:</span> {customer?.email || 'N/A'}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Mobile:</span> {formatPhone(customer?.mobile)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!sendEmail && !sendSMS)}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Sending...' : (
              <>
                <Send className="w-4 h-4" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
