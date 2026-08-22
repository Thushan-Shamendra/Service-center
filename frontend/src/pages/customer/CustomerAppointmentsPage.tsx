import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import { vehicleApi } from '../../api/vehicleApi';
import { serviceApi } from '../../api/serviceApi';
import toast from 'react-hot-toast';
import { Calendar, Plus, Check, X, Clock, Eye, Upload, Send, XCircle, Car, AlertCircle, Clock as ClockIcon, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'cancelled' | 'completed';
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
}

export const CustomerAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we should show the form by default (for direct booking)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [formData, setFormData] = useState({
    vehicle: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    complaint: '',
    images: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);

  // Auto-refresh appointments every 30 seconds to show latest status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && user) {
        fetchAppointments();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoading, user, currentPage, itemsPerPage, statusFilter, searchQuery, dateFilter]);

  const fetchAppointments = async () => {
    try {
      const customerId = user?.profile?._id || user?._id;
      const params: any = {
        customer: customerId,
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add filters
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      if (dateFilter === 'today') {
        params.date = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        params.startDate = startOfWeek.toISOString().split('T')[0];
        params.endDate = endOfWeek.toISOString().split('T')[0];
      }

      const response = await appointmentApi.getAppointments(params);
      if (response.success) {
        setAppointments(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotalItems(response.pagination?.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const customerId = user?.profile?._id || user?._id;
      const response = await vehicleApi.getVehicles({ customer: customerId });
      if (response.success) {
        setVehicles(response.data);
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
        setServices(response.data);
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
        setTimeSlots(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching time slots:', err);
      toast.error('Failed to load available time slots');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchAppointments(), fetchVehicles(), fetchServices()]);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Check if we should show the form by default (for direct booking)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  // Fetch appointments when pagination or filters change (excluding initial load)
  useEffect(() => {
    if (!isLoading && user) {
      fetchAppointments();
    }
  }, [currentPage, itemsPerPage, statusFilter, searchQuery, dateFilter]);

  useEffect(() => {
    if (formData.preferredDate) {
      fetchTimeSlots(formData.preferredDate);
    }
  }, [formData.preferredDate]);

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
        toast.success('Appointment request submitted successfully');
        setShowForm(false);
        setFormData({
          vehicle: '',
          serviceType: '',
          preferredDate: '',
          preferredTime: '',
          complaint: '',
          images: [],
        });
        await fetchAppointments();
      } else {
        toast.error(response.message || 'Failed to submit appointment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      vehicle: '',
      serviceType: '',
      preferredDate: '',
      preferredTime: '',
      complaint: '',
      images: [],
    });
    setErrors({});
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1); // Reset to page 1 when filters change
    if (filterType === 'status') setStatusFilter(value);
    if (filterType === 'date') setDateFilter(value);
    if (filterType === 'search') setSearchQuery(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to page 1 when page size changes
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Check },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: X },
      rescheduled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Calendar },
      cancelled: { bg: 'bg-slate-100', text: 'text-slate-700', icon: XCircle },
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Check },
    };

    const style = statusStyles[status] || statusStyles.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusHistoryBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      rescheduled: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-slate-100 text-slate-700',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    return statusStyles[status] || statusStyles.pending;
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment bookings</h1>
          <p className="text-sm text-slate-500">Request and manage your vehicle service appointments</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Appointment
          </button>
        )}
      </div>

      {/* Request Appointment Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Request Appointment</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointment ID - Auto Generated */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Appointment ID
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>Auto Generated</span>
                </div>
              </div>

              {/* Vehicle Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.vehicle}
                  onChange={(e) => {
                    setFormData({ ...formData, vehicle: e.target.value });
                    if (errors.vehicle) setErrors({ ...errors, vehicle: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                    errors.vehicle ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} - {v.make} {v.model}
                    </option>
                  ))}
                </select>
                {errors.vehicle && <p className="text-xs text-red-500 mt-1">{errors.vehicle}</p>}
                <p className="text-[10px] text-slate-400 mt-1">(Registered Vehicles Only)</p>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => {
                    setFormData({ ...formData, serviceType: e.target.value });
                    if (errors.serviceType) setErrors({ ...errors, serviceType: '' });
                  }}
                  disabled={isLoadingServices}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                    errors.serviceType ? 'border-red-500' : 'border-slate-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {isLoadingServices ? 'Loading services...' : 'Select Service Type'}
                  </option>
                  {services.map((service) => (
                    <option key={service._id} value={service.name}>
                      {service.name} ({service.serviceCode})
                    </option>
                  ))}
                </select>
                {errors.serviceType && <p className="text-xs text-red-500 mt-1">{errors.serviceType}</p>}
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => {
                    setFormData({ ...formData, preferredDate: e.target.value });
                    if (errors.preferredDate) setErrors({ ...errors, preferredDate: '' });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                    errors.preferredDate ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.preferredDate && <p className="text-xs text-red-500 mt-1">{errors.preferredDate}</p>}
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Preferred Time <span className="text-red-500">*</span>
                </label>
                {!formData.preferredDate ? (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm">
                    Please select a date first
                  </div>
                ) : isLoadingSlots ? (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm">
                    Loading available slots...
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm">
                    No time slots available
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => {
                      const isAvailable = slot.status === 'available';
                      const isLimited = slot.status === 'limited';
                      const isFull = slot.status === 'full';
                      
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => {
                            if (isAvailable || isLimited) {
                              setFormData({ ...formData, preferredTime: slot.time });
                              if (errors.preferredTime) setErrors({ ...errors, preferredTime: '' });
                            }
                          }}
                          disabled={isFull}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            formData.preferredTime === slot.time
                              ? 'bg-brand-600 text-white border-2 border-brand-600'
                              : isFull
                              ? 'bg-red-50 text-red-400 border-2 border-red-200 cursor-not-allowed opacity-60'
                              : isLimited
                              ? 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {slot.time}
                          </div>
                          {isFull && (
                            <div className="text-[10px] mt-0.5">Full</div>
                          )}
                          {isLimited && (
                            <div className="text-[10px] mt-0.5">{slot.bookings}/4</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.preferredTime && <p className="text-xs text-red-500 mt-1">{errors.preferredTime}</p>}
                {formData.preferredDate && !isLoadingSlots && timeSlots.length > 0 && (
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-200"></div>
                      Available
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-200"></div>
                      Limited
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-200"></div>
                      Full
                    </div>
                  </div>
                )}
              </div>

              {/* Request Date - Auto */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Request Date
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">(Current Date - Auto)</p>
              </div>
            </div>

            {/* Complaint/Problem Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Complaint / Problem Description
              </label>
              <textarea
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                rows={4}
                placeholder="Describe the issue or problem with your vehicle..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              />
            </div>

            {/* Upload Images */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Upload Images <span className="text-slate-400">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-brand-500 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* Status - Auto */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                {getStatusBadge('pending')}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">(Pending Approval - Auto)</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Appointment History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Appointment History</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-slate-500">per page</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => {
                setCurrentPage(1);
                fetchAppointments();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No appointments yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Request your first appointment
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Appointment #
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Vehicle
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Service Type
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Preferred Date
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Scheduled Date
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Assigned Technician
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase">
                      Status History
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <React.Fragment key={apt._id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm font-medium text-brand-600">
                        {apt.appointmentNumber}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {apt.vehicle?.registrationNumber || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {apt.serviceType}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {formatDate(apt.preferredDate)}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {apt.status === 'rescheduled' && apt.rescheduleDate 
                          ? formatDate(apt.rescheduleDate) 
                          : apt.status === 'approved' 
                            ? formatDate(apt.preferredDate)
                            : '—'}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {(() => {
                          const tech = apt.assignedTechnician;
                          
                          // First check if technician exists
                          if (tech) {
                            // Handle populated user data
                            if (tech.user?.firstName) {
                              return `${tech.user.firstName} ${tech.user.lastName?.charAt(0) || ''}.`;
                            }
                            
                            // Handle direct employee data
                            if (tech.firstName) {
                              return `${tech.firstName} ${tech.lastName?.charAt(0) || ''}.`;
                            }
                            
                            // Handle just the ID
                            if (tech._id) {
                              return 'Assigned';
                            }
                          }
                          
                          // Only show status messages if no technician is assigned
                          if (apt.status === 'pending') {
                            return 'Pending Assignment';
                          } else if (apt.status === 'approved') {
                            return 'To be Assigned';
                          } else {
                            return '—';
                          }
                        })()}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(apt.status)}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setExpandedAppointment(expandedAppointment === apt._id ? null : apt._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          {apt.statusHistory?.length || 0} Updates
                          <ChevronRight className={`w-3 h-3 transition-transform ${expandedAppointment === apt._id ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    {expandedAppointment === apt._id && (
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <td colSpan={8} className="py-4 px-6">
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Appointment Status Timeline
                            </div>
                            {apt.statusHistory && apt.statusHistory.length > 0 ? (
                              <div className="space-y-2">
                                {[...apt.statusHistory].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()).map((history, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${getStatusHistoryBadge(history.status).split(' ')[0]}`}></div>
                                      {idx < (apt.statusHistory?.length || 0) - 1 && (
                                        <div className="w-px h-full bg-slate-300"></div>
                                      )}
                                    </div>
                                    <div className="flex-1 pb-3">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusHistoryBadge(history.status)}`}>
                                          {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          {new Date(history.changedAt).toLocaleString()}
                                        </span>
                                      </div>
                                      {history.remarks && (
                                        <div className="text-xs text-slate-600 mt-1">
                                          {history.remarks}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400">
                                No status history recorded yet. Current status: {apt.status}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} appointments
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium transition-colors disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Show ellipsis for hidden pages
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-slate-400">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-brand-600 text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium transition-colors disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};
