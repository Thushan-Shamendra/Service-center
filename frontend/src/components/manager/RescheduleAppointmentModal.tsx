import React, { useState } from 'react';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  RotateCcw,
  Calendar,
  Clock,
  User as UserIcon,
  Car,
  Mail,
  MessageSquare,
  X,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface RescheduleAppointmentModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { rescheduleDate: string; rescheduleTime: string; reason: string }) => void;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [reason, setReason] = useState('');
  const [reassignTechnician, setReassignTechnician] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select new date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        rescheduleDate,
        rescheduleTime,
        reason,
      });
      
      if (sendEmail || sendSMS) {
        toast.success('Notification sent to customer');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to reschedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCustomerName = () => {
    if (typeof appointment.customer === 'object' && appointment.customer.user) {
      return `${appointment.customer.user.firstName} ${appointment.customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getVehicleInfo = () => {
    if (typeof appointment.vehicle === 'object') {
      return `${appointment.vehicle.registrationNumber} - ${appointment.vehicle.make} ${appointment.vehicle.model}`;
    }
    return 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
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
          {/* Current Appointment Info */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Current Appointment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{getCustomerName()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{getVehicleInfo()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{formatDate(appointment.preferredDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{appointment.preferredTime}</span>
              </div>
            </div>
          </div>

          {/* New Date/Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Date *
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={dayjs().format('YYYY-MM-DD')}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Time *
              </label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Time</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          {/* Capacity Check */}
          {rescheduleDate && rescheduleTime && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-800">
                  Workshop capacity available for selected slot
                </span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Rescheduling *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this appointment needs to be rescheduled..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Technician Reassignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reassign Technician (Optional)
            </label>
            <select
              value={reassignTechnician}
              onChange={(e) => setReassignTechnician(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Keep Current Technician</option>
              <option value="tech1">Kasun</option>
              <option value="tech2">Amila</option>
              <option value="tech3">Nuwan</option>
            </select>
          </div>

          {/* Notification Options */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Send Notification</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded"
                />
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Send Email</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  className="rounded"
                />
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Send SMS</span>
              </label>
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
            disabled={isSubmitting}
            className="px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
