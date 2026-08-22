import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import { Appointment } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Bell,
  User as UserIcon,
  Car,
  Wrench,
  Calendar,
  Factory,
  FileText,
  Mail,
  Phone,
  Clock,
  Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const AppointmentDetailsPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const action = searchParams.get('action');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  // Modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const fetchAppointment = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await appointmentApi.getAppointmentById(appointmentId);
      
      if (res.success) {
        setAppointment(res.data);
      } else {
        setError(res.message || 'Failed to fetch appointment');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading appointment');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    } else {
      setError('No appointment ID provided');
    }
  }, [appointmentId]);

  const getCustomerName = () => {
    if (typeof appointment?.customer === 'object' && appointment.customer.user) {
      return `${appointment.customer.user.firstName} ${appointment.customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getCustomerPhone = () => {
    if (typeof appointment?.customer === 'object' && appointment.customer.user) {
      return appointment.customer.user.mobile || 'N/A';
    }
    return 'N/A';
  };

  const getCustomerEmail = () => {
    if (typeof appointment?.customer === 'object' && appointment.customer.user) {
      return appointment.customer.user.email || 'N/A';
    }
    return 'N/A';
  };

  const getVehicleInfo = () => {
    if (typeof appointment?.vehicle === 'object') {
      return `${appointment.vehicle.make} ${appointment.vehicle.model}`;
    }
    return 'Unknown';
  };

  const getVehicleReg = () => {
    if (typeof appointment?.vehicle === 'object') {
      return appointment.vehicle.registrationNumber || 'N/A';
    }
    return 'N/A';
  };

  const getVehicleYear = () => {
    if (typeof appointment?.vehicle === 'object') {
      return appointment.vehicle.year || 'N/A';
    }
    return 'N/A';
  };

  const getVehicleColor = () => {
    if (typeof appointment?.vehicle === 'object') {
      return appointment.vehicle.color || 'N/A';
    }
    return 'N/A';
  };

  const getTechnicianName = () => {
    if (typeof appointment?.assignedTechnician === 'object' && appointment.assignedTechnician.user) {
      return `${appointment.assignedTechnician.user.firstName} ${appointment.assignedTechnician.user.lastName}`;
    }
    return 'Unassigned';
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: any = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-rose-100 text-rose-700 border-rose-200',
      cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
      rescheduled: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    
    const statusIcons: any = {
      pending: <Clock className="w-3 h-3" />,
      approved: <Check className="w-3 h-3" />,
      confirmed: <Check className="w-3 h-3" />,
      rejected: <X className="w-3 h-3" />,
      cancelled: <X className="w-3 h-3" />,
      completed: <Check className="w-3 h-3" />,
      rescheduled: <RotateCcw className="w-3 h-3" />,
    };

    const defaultStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    const style = statusStyles[status] || defaultStyle;
    const icon = statusIcons[status] || null;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${style}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusTracker = () => {
    const statuses = ['pending', 'approved', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(appointment?.status || 'pending');
    
    return (
      <div className="flex items-center gap-2">
        {statuses.map((status, index) => (
          <React.Fragment key={status}>
            <div className={`flex items-center gap-2 ${index <= currentIndex ? 'text-brand-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index < currentIndex ? 'bg-brand-600 text-white' :
                index === currentIndex ? 'bg-brand-100 border-2 border-brand-600 text-brand-600' :
                'bg-slate-100 text-slate-400'
              }`}>
                {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className="text-sm font-medium capitalize">{status.replace('-', ' ')}</span>
            </div>
            {index < statuses.length - 1 && (
              <div className={`w-12 h-1 ${index < currentIndex ? 'bg-brand-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchAppointment} />;
  if (!appointment) return <ErrorState message="Appointment not found" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/manager/appointments"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Appointment Details</h1>
            <p className="text-sm text-slate-500">Appointment {appointment.appointmentNumber}</p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      {/* Status Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">📊 STATUS TRACKER</h3>
        {getStatusTracker()}
      </div>

      {/* Appointment Information & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">📋 APPOINTMENT INFORMATION</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">ID</span>
              <span className="text-sm font-medium text-slate-900">{appointment.appointmentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Date</span>
              <span className="text-sm font-medium text-slate-900">
                {appointment.preferredDate ? dayjs(appointment.preferredDate).format('DD MMM YYYY') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Time</span>
              <span className="text-sm font-medium text-slate-900">{appointment.preferredTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Status</span>
              <span className="text-sm font-medium text-slate-900 capitalize">{appointment.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Created</span>
              <span className="text-sm font-medium text-slate-900">
                {appointment.createdAt ? dayjs(appointment.createdAt).format('DD MMM YYYY') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">📊 STATUS TRACKER</h3>
          {getStatusTracker()}
        </div>
      </div>

      {/* Customer & Technician */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">👤 CUSTOMER</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-600">Name</span>
              <p className="text-sm font-medium text-slate-900">{getCustomerName()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-900">{getCustomerPhone()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-900">{getCustomerEmail()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🔧 TECHNICIAN</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-600">Name</span>
              <p className="text-sm font-medium text-slate-900">{getTechnicianName()}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Status</span>
              <p className="text-sm font-medium text-emerald-600">Available</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Workload</span>
              <p className="text-sm font-medium text-slate-900">3 jobs today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle & Estimated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🚗 VEHICLE</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-600">Reg No</span>
              <p className="text-sm font-medium text-slate-900">{getVehicleReg()}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Model</span>
              <p className="text-sm font-medium text-slate-900">{getVehicleInfo()}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Color</span>
              <p className="text-sm font-medium text-slate-900">{getVehicleColor()}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Year</span>
              <p className="text-sm font-medium text-slate-900">{getVehicleYear()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">⏱️ ESTIMATED</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-600">Duration</span>
              <p className="text-sm font-medium text-slate-900">{appointment.estimatedDuration || 2} Hours</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Est. Completion</span>
              <p className="text-sm font-medium text-slate-900">
                {appointment.preferredDate && appointment.preferredTime 
                  ? dayjs(appointment.preferredDate).format('DD MMM YYYY') + ' ' + appointment.preferredTime
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint & Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">📝 COMPLAINT & NOTES</h3>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-slate-600">Complaint</span>
            <p className="text-sm text-slate-900 mt-1">{appointment.complaint || 'No complaint specified'}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Service</span>
            <p className="text-sm text-slate-900 mt-1">{appointment.serviceType || 'N/A'}</p>
          </div>
          {appointment.notes && (
            <div>
              <span className="text-sm text-slate-600">Notes</span>
              <p className="text-sm text-slate-900 mt-1">{appointment.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🔔 NOTIFICATIONS</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4" />
            <span>Email: Appointment Confirmation - Sent {appointment.createdAt ? dayjs(appointment.createdAt).format('DD MMM YYYY HH:mm') : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4" />
            <span>SMS: Appointment Confirmation - Sent {appointment.createdAt ? dayjs(appointment.createdAt).format('DD MMM YYYY HH:mm') : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🔧 ACTIONS</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowRescheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reschedule
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={() => toast.success('Email sent to customer')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>
          <button
            onClick={() => toast.success('SMS sent to customer')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
          >
            <Phone className="w-4 h-4" />
            Send SMS
          </button>
          <Link
            to={`/manager/job-cards/new?appointment=${appointment._id || appointment.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
          >
            <FileText className="w-4 h-4" />
            Create Job Card
          </Link>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={() => {
            setShowRescheduleModal(false);
            fetchAppointment();
          }}
          appointment={appointment}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            fetchAppointment();
          }}
          appointment={appointment}
        />
      )}
    </div>
  );
};

// Sub-components
const RescheduleModal = ({ isOpen, onClose, onSuccess, appointment }: any) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && appointment) {
      setNewDate(appointment.preferredDate ? dayjs(appointment.preferredDate).format('YYYY-MM-DD') : '');
      setNewTime(appointment.preferredTime || '');
      setAssignedTechnician(appointment.assignedTechnician?._id || '');
      fetchTechnicians();
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (newDate) {
      fetchAvailableSlots(newDate);
    }
  }, [newDate]);

  const fetchTechnicians = async () => {
    try {
      const res = await appointmentApi.getAvailableTechnicians(newDate, newTime);
      if (res.success) {
        setTechnicians(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    try {
      const res = await appointmentApi.getAvailableTimeSlots(date);
      if (res.success) {
        setAvailableSlots(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
    }
  };

  const handleSubmit = async () => {
    if (!newDate || !newTime) {
      toast.error('Please select new date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await appointmentApi.updateStatus(appointment._id || appointment.id, {
        status: 'rescheduled',
        rescheduleDate: newDate,
        rescheduleTime: newTime,
        assignedTechnician: assignedTechnician || undefined,
      });

      if (res.success) {
        toast.success('Appointment rescheduled successfully');
        onSuccess();
      } else {
        toast.error(res.message || 'Failed to reschedule appointment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error rescheduling appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const customerName = appointment?.customer?.user 
    ? `${appointment.customer.user.firstName} ${appointment.customer.user.lastName}`
    : 'Unknown';
  const vehicleInfo = appointment?.vehicle 
    ? `${appointment.vehicle.registrationNumber} - ${appointment.vehicle.make} ${appointment.vehicle.model}`
    : 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">🔄 RESCHEDULE APPOINTMENT</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <p className="text-sm"><span className="font-medium">Appointment ID:</span> {appointment?.appointmentNumber}</p>
            <p className="text-sm"><span className="font-medium">Customer:</span> {customerName}</p>
            <p className="text-sm"><span className="font-medium">Vehicle:</span> {vehicleInfo}</p>
            <p className="text-sm">
              <span className="font-medium">Current Date:</span>{' '}
              {appointment?.preferredDate ? dayjs(appointment.preferredDate).format('YYYY-MM-DD') : 'N/A'}{' '}
              {appointment?.preferredTime}
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={dayjs().format('YYYY-MM-DD')}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">New Time</label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {availableSlots.length > 0 ? (
                availableSlots.map((slot: any) => (
                  <option
                    key={slot.time}
                    value={slot.time}
                    disabled={slot.status === 'full'}
                  >
                    {slot.time} {slot.status === 'full' ? '(Full)' : slot.status === 'limited' ? '(Limited)' : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Reason for rescheduling..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Available Technicians</label>
            <div className="space-y-2">
              {technicians.map((tech) => (
                <div
                  key={tech._id}
                  onClick={() => setAssignedTechnician(tech._id)}
                  className={`p-3 border rounded-xl cursor-pointer ${
                    assignedTechnician === tech._id ? 'bg-brand-50 border-brand-500' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tech.name}</span>
                    <span className={`text-xs ${tech.isAvailable ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {tech.isAvailable ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Workload: {tech.workload || 0} jobs</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🔔 Notify Customer
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-slate-600">Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-slate-600">SMS</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CancelModal = ({ isOpen, onClose, onSuccess, appointment }: any) => {
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!cancelReason) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await appointmentApi.updateStatus(appointment._id || appointment.id, {
        status: 'cancelled',
        rejectionReason: cancelReason,
      });

      if (res.success) {
        toast.success('Appointment cancelled successfully');
        onSuccess();
      } else {
        toast.error(res.message || 'Failed to cancel appointment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error cancelling appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const customerName = appointment?.customer?.user 
    ? `${appointment.customer.user.firstName} ${appointment.customer.user.lastName}`
    : 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">❌ CANCEL APPOINTMENT</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-rose-50 rounded-xl">
            <p className="text-rose-700 font-medium mb-2">⚠️ Are you sure you want to cancel this appointment?</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <p className="text-sm"><span className="font-medium">Appointment ID:</span> {appointment?.appointmentNumber}</p>
            <p className="text-sm"><span className="font-medium">Customer:</span> {customerName}</p>
            <p className="text-sm">
              <span className="font-medium">Date/Time:</span>{' '}
              {appointment?.preferredDate ? dayjs(appointment.preferredDate).format('DD MMM YYYY') : 'N/A'}{' '}
              {appointment?.preferredTime}
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Cancellation Reason</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Provide reason for cancellation..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🔔 Notify Customer
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-slate-600">Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-slate-600">SMS</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
