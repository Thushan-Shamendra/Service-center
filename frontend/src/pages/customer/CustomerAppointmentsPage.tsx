import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import { vehicleApi } from '../../api/vehicleApi';
import { serviceApi } from '../../api/serviceApi';
import toast from 'react-hot-toast';
import {
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  Upload,
  Send,
  XCircle,
  Car,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  User,
  CalendarCheck,
  CalendarPlus,
  History,
  Info,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';

interface Vehicle {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
}

interface Service {
  _id: string;
  name: string;
  serviceCode: string;
  description?: string;
  estimatedDurationMinutes: number;
  status: string;
}

interface TimeSlot {
  time: string;
  status: 'available' | 'limited' | 'full';
  bookings: number;
}

interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  changedBy?: any;
  remarks?: string;
}

interface Appointment {
  _id: string;
  appointmentNumber: string;
  vehicle: Vehicle;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  complaint?: string;
  assignedTechnician?: {
    _id?: string;
    user?: {
      firstName: string;
      lastName: string;
    };
    firstName?: string;
    lastName?: string;
  };
  rescheduleDate?: string;
  rescheduleTime?: string;
  rejectionReason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'cancelled' | 'completed';
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
}

export const CustomerAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Master appointments list
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    complaint: '',
    images: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cancellation modal state
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Timeline modal state
  const [timelineAppointment, setTimelineAppointment] = useState<Appointment | null>(null);

  // History filtering and pagination state
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyDateFilter, setHistoryDateFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(5);

  // Check URL params for direct booking trigger
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  // Fetch appointments for the current customer
  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const customerId = user?.profile?._id || user?._id;
      // Fetch up to 200 records to ensure all active and historical items are retrieved
      const response = await appointmentApi.getAppointments({
        customer: customerId,
        limit: 200,
      });
      if (response.success) {
        setAppointments(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const customerId = user?.profile?._id || user?._id;
      const response = await vehicleApi.getVehicles({ customer: customerId });
      if (response.success) {
        setVehicles(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const response = await serviceApi.getServices({ status: 'active' });
      if (response.success) {
        setServices(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const fetchTimeSlots = async (date: string) => {
    if (!date) {
      setTimeSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    try {
      const response = await appointmentApi.getAvailableTimeSlots(date);
      if (response.success) {
        setTimeSlots(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching time slots:', err);
      toast.error('Failed to load available time slots');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchAppointments(true), fetchVehicles(), fetchServices()]);
      } catch (err) {
        setError('Failed to load appointment data');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      loadData();
    }
  }, [user, fetchAppointments]);

  // Auto-refresh appointments every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && user) {
        fetchAppointments(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoading, user, fetchAppointments]);

  // Fetch time slots when preferred date changes
  useEffect(() => {
    if (formData.preferredDate) {
      fetchTimeSlots(formData.preferredDate);
    } else {
      setTimeSlots([]);
    }
  }, [formData.preferredDate]);

  // Helper for technician name
  const getTechnicianName = (apt: Appointment) => {
    const tech = apt.assignedTechnician;
    if (!tech) {
      if (apt.status === 'pending') return 'Pending Assignment';
      if (apt.status === 'approved' || apt.status === 'rescheduled') return 'To be Assigned';
      return '—';
    }

    const capitalize = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

    if (typeof tech === 'object') {
      if (tech.user?.firstName) {
        const first = capitalize(tech.user.firstName);
        const last = capitalize(tech.user.lastName);
        return `${first} ${last}`.trim();
      }
      if (tech.firstName) {
        const first = capitalize(tech.firstName);
        const last = capitalize(tech.lastName);
        return `${first} ${last}`.trim();
      }
    }
    return 'Assigned Technician';
  };

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'rescheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Calendar className="w-3 h-3 text-blue-600" />
            Rescheduled
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Declined
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <Check className="w-3 h-3 text-teal-600" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Section 1: Pending Appointments
  const pendingAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'pending')
      .sort((a, b) => new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime());
  }, [appointments]);

  // Section 1: Upcoming Appointments (Approved & Rescheduled)
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'approved' || a.status === 'rescheduled')
      .sort((a, b) => {
        const dateA = a.status === 'rescheduled' && a.rescheduleDate ? a.rescheduleDate : a.preferredDate;
        const dateB = b.status === 'rescheduled' && b.rescheduleDate ? b.rescheduleDate : b.preferredDate;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  }, [appointments]);

  // Section 2: Rejected Requests
  const rejectedAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'rejected')
      .sort((a, b) => new Date(b.createdAt || b.preferredDate).getTime() - new Date(a.createdAt || a.preferredDate).getTime());
  }, [appointments]);

  // Section 3: History Appointments (Completed, Cancelled, and past appointments)
  const historyAppointments = useMemo(() => {
    return appointments.filter((a) => ['completed', 'cancelled', 'rejected'].includes(a.status));
  }, [appointments]);

  // Filtered & Paginated History
  const filteredHistory = useMemo(() => {
    return historyAppointments
      .filter((apt) => {
        // Status filter
        if (historyStatusFilter !== 'all' && apt.status !== historyStatusFilter) {
          return false;
        }

        // Search query
        if (historySearch.trim()) {
          const query = historySearch.toLowerCase();
          const aptNum = (apt.appointmentNumber || '').toLowerCase();
          const reg = (apt.vehicle?.registrationNumber || '').toLowerCase();
          const vMake = (apt.vehicle?.make || '').toLowerCase();
          const vModel = (apt.vehicle?.model || '').toLowerCase();
          const service = (apt.serviceType || '').toLowerCase();
          const techName = getTechnicianName(apt).toLowerCase();
          if (
            !aptNum.includes(query) &&
            !reg.includes(query) &&
            !vMake.includes(query) &&
            !vModel.includes(query) &&
            !service.includes(query) &&
            !techName.includes(query)
          ) {
            return false;
          }
        }

        // Date filter
        if (historyDateFilter === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          const aptDateStr = new Date(apt.preferredDate).toISOString().split('T')[0];
          if (aptDateStr !== todayStr) return false;
        } else if (historyDateFilter === 'week') {
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const aptDate = new Date(apt.preferredDate);
          if (aptDate < weekAgo) return false;
        } else if (historyDateFilter === 'month') {
          const now = new Date();
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const aptDate = new Date(apt.preferredDate);
          if (aptDate < monthAgo) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.preferredDate).getTime() - new Date(a.preferredDate).getTime());
  }, [historyAppointments, historyStatusFilter, historySearch, historyDateFilter]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / historyItemsPerPage));

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyItemsPerPage;
    return filteredHistory.slice(start, start + historyItemsPerPage);
  }, [filteredHistory, historyPage, historyItemsPerPage]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.vehicle) newErrors.vehicle = 'Vehicle is required';
    if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
    if (!formData.preferredDate) newErrors.preferredDate = 'Preferred date is required';
    if (!formData.preferredTime) newErrors.preferredTime = 'Preferred time is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerId = user?.profile?._id || user?._id;
      const response = await appointmentApi.createAppointment({
        customer: customerId,
        vehicle: formData.vehicle,
        serviceType: formData.serviceType,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        complaint: formData.complaint,
        images: formData.images,
      });

      if (response.success) {
        toast.success('Appointment request submitted successfully!');
        setShowForm(false);
        setFormData({
          vehicle: '',
          serviceType: '',
          preferredDate: '',
          preferredTime: '',
          complaint: '',
          images: [],
        });
        await fetchAppointments(true);
      } else {
        toast.error(response.message || 'Failed to submit appointment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-book from a rejected or completed appointment
  const handleRebook = (apt: Appointment) => {
    setFormData({
      vehicle: apt.vehicle?._id || '',
      serviceType: apt.serviceType || '',
      preferredDate: '',
      preferredTime: '',
      complaint: apt.complaint ? `Re-booking for previous ${apt.appointmentNumber}: ${apt.complaint}` : '',
      images: [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel appointment confirmation
  const handleConfirmCancel = async () => {
    if (!cancellingAppointment) return;
    setIsCancelling(true);
    try {
      // Attempt status update API
      let res;
      try {
        res = await appointmentApi.updateStatus(cancellingAppointment._id, {
          status: 'cancelled',
          remarks: 'Cancelled by customer',
        });
      } catch {
        // Fallback to updateAppointment
        res = await appointmentApi.updateAppointment(cancellingAppointment._id, {
          status: 'cancelled',
        });
      }

      if (res.success || res.data) {
        toast.success(`Appointment ${cancellingAppointment.appointmentNumber} cancelled`);
        setCancellingAppointment(null);
        await fetchAppointments(true);
      } else {
        toast.error(res.message || 'Failed to cancel appointment');
      }
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      toast.error(err.response?.data?.message || 'Error cancelling appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header & Page Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Bookings</h1>
            {isRefreshing && (
              <RefreshCw className="w-4 h-4 text-brand-600 animate-spin" title="Updating..." />
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Request, track, and manage your vehicle maintenance and service schedules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAppointments()}
            className="p-2.5 text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh appointments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!showForm ? (
            <button
              onClick={() => {
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              Request Appointment
            </button>
          ) : (
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Close Form
            </button>
          )}
        </div>
      </div>

      {/* Metric / Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3.5 transition-all">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-amber-950 mt-0.5">{pendingAppointments.length}</p>
          </div>
        </div>

        {/* Upcoming Card */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3.5 transition-all">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Upcoming</p>
            <p className="text-2xl font-bold text-emerald-950 mt-0.5">{upcomingAppointments.length}</p>
          </div>
        </div>

        {/* Declined Card */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3.5 transition-all">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Declined</p>
            <p className="text-2xl font-bold text-rose-950 mt-0.5">{rejectedAppointments.length}</p>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 transition-all">
          <div className="w-11 h-11 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Appointment Request Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-200 shadow-lg overflow-hidden transition-all">
          <div className="px-6 py-4 border-b border-brand-100 bg-brand-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Request New Service Appointment</h2>
                <p className="text-xs text-slate-500">Pick your vehicle and select an open time slot</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.vehicle}
                  onChange={(e) => {
                    setFormData({ ...formData, vehicle: e.target.value });
                    if (errors.vehicle) setErrors({ ...errors, vehicle: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${
                    errors.vehicle ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select Registered Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
                {errors.vehicle && <p className="text-xs text-red-500 mt-1">{errors.vehicle}</p>}
                {vehicles.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No vehicles registered yet. Please register a vehicle in your profile first.
                  </p>
                )}
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => {
                    setFormData({ ...formData, serviceType: e.target.value });
                    if (errors.serviceType) setErrors({ ...errors, serviceType: '' });
                  }}
                  disabled={isLoadingServices}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${
                    errors.serviceType ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {isLoadingServices ? 'Loading active services...' : 'Select Service Type'}
                  </option>
                  {services.map((service) => (
                    <option key={service._id} value={service.name}>
                      {service.name} ({service.serviceCode}) - ~{service.estimatedDurationMinutes || 60} mins
                    </option>
                  ))}
                </select>
                {errors.serviceType && <p className="text-xs text-red-500 mt-1">{errors.serviceType}</p>}
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => {
                    setFormData({ ...formData, preferredDate: e.target.value, preferredTime: '' });
                    if (errors.preferredDate) setErrors({ ...errors, preferredDate: '' });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${
                    errors.preferredDate ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.preferredDate && <p className="text-xs text-red-500 mt-1">{errors.preferredDate}</p>}
              </div>

              {/* Preferred Time Slot */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Time Slot <span className="text-red-500">*</span>
                </label>
                {!formData.preferredDate ? (
                  <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    Please pick a date first to view open slots
                  </div>
                ) : isLoadingSlots ? (
                  <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                    Checking slot availability...
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
                    No time slots available for this date. Please select another date.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map((slot) => {
                        const isAvailable = slot.status === 'available';
                        const isLimited = slot.status === 'limited';
                        const isFull = slot.status === 'full';
                        const isSelected = formData.preferredTime === slot.time;

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => {
                              if (!isFull) {
                                setFormData({ ...formData, preferredTime: slot.time });
                                if (errors.preferredTime) setErrors({ ...errors, preferredTime: '' });
                              }
                            }}
                            disabled={isFull}
                            className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                              isSelected
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                : isFull
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                : isLimited
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            <div className="font-semibold">{slot.time}</div>
                            <div className="text-[10px] mt-0.5 opacity-80">
                              {isFull ? 'Booked' : isLimited ? 'Limited' : 'Available'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.preferredTime && (
                      <p className="text-xs text-red-500">{errors.preferredTime}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Complaint / Problem Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Problem Description / Service Notes <span className="text-slate-400">(Optional)</span>
              </label>
              <textarea
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                rows={3}
                placeholder="Mention any symptoms, strange noises, warning indicators, or specific checks you need..."
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: SIDE-BY-SIDE GRID (PENDING APPOINTMENTS & UPCOMING APPOINTMENTS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Pending Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Pending Appointments
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                    {pendingAppointments.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Awaiting workshop review and slot approval</p>
              </div>
            </div>
          </div>

          {/* Body Cards */}
          <div className="p-6 flex-1 bg-slate-50/30">
            {pendingAppointments.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Pending Requests</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  All your service requests have been reviewed. You don't have any appointments currently waiting for approval.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    className="bg-white border border-amber-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-bold font-mono text-brand-600">
                          {apt.appointmentNumber}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Car className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-bold text-slate-900">
                            {apt.vehicle?.registrationNumber || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({apt.vehicle?.make} {apt.vehicle?.model})
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-amber-50/40 rounded-lg p-2.5 mb-3 border border-amber-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Service</span>
                        <span className="font-semibold text-slate-800">{apt.serviceType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Requested Date</span>
                        <span className="font-medium text-slate-800">
                          {formatDate(apt.preferredDate)} • {apt.preferredTime}
                        </span>
                      </div>
                    </div>

                    {apt.complaint && (
                      <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
                        <span className="font-semibold text-slate-700">Note: </span>
                        {apt.complaint}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => setTimelineAppointment(apt)}
                        className="flex items-center gap-1 text-slate-600 hover:text-brand-600 font-medium transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {apt.statusHistory?.length || 0} Updates
                      </button>

                      <button
                        onClick={() => setCancellingAppointment(apt)}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium hover:underline transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming / Approved Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Upcoming Appointments
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
                    {upcomingAppointments.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Confirmed & scheduled workshop visits</p>
              </div>
            </div>
          </div>

          {/* Body Cards */}
          <div className="p-6 flex-1 bg-slate-50/30">
            {upcomingAppointments.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Upcoming Appointments</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                  You don't have any confirmed appointments scheduled right now. Need maintenance or repairs?
                </p>
                <button
                  onClick={() => {
                    setShowForm(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                >
                  + Book Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => {
                  const isRescheduled = apt.status === 'rescheduled';
                  const activeDate = isRescheduled && apt.rescheduleDate ? apt.rescheduleDate : apt.preferredDate;
                  const activeTime = isRescheduled && apt.rescheduleTime ? apt.rescheduleTime : apt.preferredTime;

                  return (
                    <div
                      key={apt._id}
                      className="bg-white border border-emerald-200/70 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${isRescheduled ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                      
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-bold font-mono text-brand-600">
                            {apt.appointmentNumber}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Car className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-bold text-slate-900">
                              {apt.vehicle?.registrationNumber || 'N/A'}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({apt.vehicle?.make} {apt.vehicle?.model})
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>

                      {/* Rescheduled Notice Banner */}
                      {isRescheduled && (
                        <div className="mb-2.5 p-2 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Rescheduled by workshop: </span>
                            New proposed slot is on {formatDate(activeDate)} at {activeTime}.
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-emerald-50/30 rounded-lg p-2.5 mb-3 border border-emerald-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Service</span>
                          <span className="font-semibold text-slate-800">{apt.serviceType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Confirmed Slot</span>
                          <span className="font-semibold text-emerald-900">
                            {formatDate(activeDate)} • {activeTime}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-emerald-100/80 flex items-center justify-between">
                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            Technician:
                          </span>
                          <span className="font-medium text-slate-800 text-[11px]">
                            {getTechnicianName(apt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <button
                          onClick={() => setTimelineAppointment(apt)}
                          className="flex items-center gap-1 text-slate-600 hover:text-brand-600 font-medium transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {apt.statusHistory?.length || 0} Updates
                        </button>

                        <button
                          onClick={() => setCancellingAppointment(apt)}
                          className="flex items-center gap-1 text-slate-500 hover:text-rose-600 font-medium transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel Appointment
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: REJECTED / DECLINED REQUESTS (Action Required) */}
      {/* ========================================================================= */}
      {rejectedAppointments.length > 0 && (
        <div className="bg-white rounded-2xl border border-rose-200/90 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Declined Requests
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900">
                    {rejectedAppointments.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Appointments that could not be confirmed by the service center. Pick a new slot to re-book.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="bg-white border border-rose-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-600">
                          {apt.appointmentNumber}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Car className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-bold text-slate-900">
                            {apt.vehicle?.registrationNumber || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({apt.vehicle?.make} {apt.vehicle?.model})
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="text-xs text-slate-600 mb-2.5">
                      <span className="font-semibold text-slate-700">{apt.serviceType}</span> • Requested for{' '}
                      {formatDate(apt.preferredDate)} at {apt.preferredTime}
                    </div>

                    {/* Rejection Reason Notice */}
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 mb-4">
                      <span className="font-bold block mb-0.5 text-rose-950">Workshop Reason:</span>
                      <p className="italic">
                        {apt.rejectionReason || 'The selected slot or technician was unavailable. Please select another date or time.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setTimelineAppointment(apt)}
                      className="flex items-center gap-1 text-slate-600 hover:text-brand-600 font-medium transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      View Updates
                    </button>

                    <button
                      onClick={() => handleRebook(apt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Request New Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: APPOINTMENT HISTORY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Appointment History
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  {filteredHistory.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Completed, cancelled, and archived service appointments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500">Show:</span>
            <select
              value={historyItemsPerPage}
              onChange={(e) => {
                setHistoryItemsPerPage(Number(e.target.value));
                setHistoryPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search history by ID, vehicle, service, technician..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 focus:bg-white transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={historyStatusFilter}
              onChange={(e) => {
                setHistoryStatusFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Declined</option>
            </select>

            {/* Date Filter */}
            <select
              value={historyDateFilter}
              onChange={(e) => {
                setHistoryDateFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            {/* Reset Filters */}
            {(historySearch || historyStatusFilter !== 'all' || historyDateFilter !== 'all') && (
              <button
                onClick={() => {
                  setHistorySearch('');
                  setHistoryStatusFilter('all');
                  setHistoryDateFilter('all');
                  setHistoryPage(1);
                }}
                className="px-3 py-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No appointment records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no completed or cancelled appointments matching your current search and filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Appointment #</th>
                    <th className="py-3.5 px-6">Vehicle</th>
                    <th className="py-3.5 px-6">Service Type</th>
                    <th className="py-3.5 px-6">Scheduled Date</th>
                    <th className="py-3.5 px-6">Technician</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedHistory.map((apt) => {
                    const scheduledDate =
                      apt.status === 'rescheduled' && apt.rescheduleDate
                        ? apt.rescheduleDate
                        : apt.preferredDate;

                    return (
                      <tr key={apt._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 font-mono font-medium text-brand-600 text-xs">
                          {apt.appointmentNumber}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 text-xs">
                            {apt.vehicle?.registrationNumber || 'N/A'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {apt.vehicle?.make} {apt.vehicle?.model}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-700 text-xs font-medium">
                          {apt.serviceType}
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-xs">
                          <div>{formatDate(scheduledDate)}</div>
                          <div className="text-[11px] text-slate-400">{apt.preferredTime}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-xs">
                          {getTechnicianName(apt)}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(apt.status)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setTimelineAppointment(apt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                              title="View timeline history"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Updates
                            </button>
                            {apt.status === 'rejected' && (
                              <button
                                onClick={() => handleRebook(apt)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                                title="Re-book this service"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                                Re-book
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {historyTotalPages > 1 && (
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Showing {(historyPage - 1) * historyItemsPerPage + 1} to{' '}
                  {Math.min(historyPage * historyItemsPerPage, filteredHistory.length)} of{' '}
                  {filteredHistory.length} history records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>

                  {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setHistoryPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        historyPage === p
                          ? 'bg-brand-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage === historyTotalPages}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TIMELINE / STATUS HISTORY MODAL */}
      {/* ========================================================================= */}
      {timelineAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-brand-600">
                  {timelineAppointment.appointmentNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Appointment Updates Timeline</h3>
                <p className="text-xs text-slate-500">
                  {timelineAppointment.vehicle?.registrationNumber} • {timelineAppointment.serviceType}
                </p>
              </div>
              <button
                onClick={() => setTimelineAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Current Status:</span>
                {getStatusBadge(timelineAppointment.status)}
              </div>

              {timelineAppointment.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  <span className="font-bold block mb-1">Reason for Decline:</span>
                  <p>{timelineAppointment.rejectionReason}</p>
                </div>
              )}

              {timelineAppointment.statusHistory && timelineAppointment.statusHistory.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {[...timelineAppointment.statusHistory]
                    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                    .map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5 shrink-0 ring-4 ring-brand-100" />
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold uppercase tracking-wider text-slate-800">
                              {item.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(item.changedAt).toLocaleString()}
                            </span>
                          </div>
                          {item.remarks && (
                            <p className="text-slate-600 mt-1">{item.remarks}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No status updates recorded yet. Created on {formatDate(timelineAppointment.createdAt)}.
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setTimelineAppointment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANCEL APPOINTMENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cancellingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center">
                Cancel Appointment {cancellingAppointment.appointmentNumber}?
              </h3>
              <p className="text-xs text-slate-500 text-center mt-1.5 leading-relaxed">
                Are you sure you want to cancel this booking for your{' '}
                <span className="font-semibold text-slate-700">
                  {cancellingAppointment.vehicle?.registrationNumber}
                </span>{' '}
                ({cancellingAppointment.serviceType})? The reserved workshop slot will be released.
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCancellingAppointment(null)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Yes, Cancel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
