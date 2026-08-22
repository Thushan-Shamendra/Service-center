import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import { Appointment } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  Check,
  X,
  RotateCcw,
  Eye,
  Bell,
  FileText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  User,
  Car,
  Wrench,
  Factory,
  Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

type TabType = 'list' | 'calendar' | 'pending' | 'create';

export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    workshopCapacity: { used: 0, total: 6 },
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(dayjs());
  const [calendarView, setCalendarView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: any = {
        limit: 100,
      };

      if (dateFilter === 'today') {
        params.date = dayjs().format('YYYY-MM-DD');
      } else if (dateFilter === 'week') {
        params.startDate = dayjs().startOf('week').format('YYYY-MM-DD');
        params.endDate = dayjs().endOf('week').format('YYYY-MM-DD');
      }

      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await appointmentApi.getAppointments(params);

      if (res.success) {
        const appointmentsData = res.data || [];
        setAppointments(appointmentsData);
        
        // Calculate stats
        const today = dayjs().format('YYYY-MM-DD');
        const todayAppts = appointmentsData.filter((apt: Appointment) => 
          apt.preferredDate && dayjs(apt.preferredDate).format('YYYY-MM-DD') === today
        );
        
        const pending = appointmentsData.filter((apt: Appointment) => apt.status === 'pending').length;
        const confirmed = appointmentsData.filter((apt: Appointment) => apt.status === 'approved').length;
        const completed = appointmentsData.filter((apt: Appointment) => apt.status === 'completed').length;
        const cancelled = appointmentsData.filter((apt: Appointment) => apt.status === 'cancelled').length;
        
        // Calculate workshop capacity (6 bays)
        const usedBays = todayAppts.filter((apt: Appointment) => apt.status === 'approved').length;
        
        setStats({
          total: appointmentsData.length,
          today: todayAppts.length,
          pending,
          confirmed,
          completed,
          cancelled,
          workshopCapacity: { used: Math.min(usedBays, 6), total: 6 },
        });
      } else {
        setError(res.message || 'Failed to load appointments');
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err.response?.data?.message || err.message || 'Error loading appointments');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, statusFilter, searchQuery]);

  const handleAppointmentAction = (appointment: Appointment, action: string) => {
    const aptId = appointment._id || appointment.id;
    
    switch (action) {
      case 'view':
        if (aptId) {
          navigate(`/manager/appointments/${aptId}`);
        } else {
          toast.error('Cannot view appointment: Missing ID');
        }
        break;
      case 'edit':
        if (aptId) {
          navigate(`/manager/appointments/${aptId}/edit`);
        } else {
          toast.error('Cannot edit appointment: Missing ID');
        }
        break;
      case 'approve':
        handleApproveAppointment(aptId);
        break;
      case 'reschedule':
        setSelectedAppointment(appointment);
        setShowRescheduleModal(true);
        break;
      case 'reject':
        handleRejectAppointment(aptId);
        break;
      case 'cancel':
        setSelectedAppointment(appointment);
        setShowCancelModal(true);
        break;
      case 'jobcard':
        navigate(`/manager/job-cards/new?appointment=${aptId}`);
        break;
    }
  };

  const handleApproveAppointment = async (aptId: string) => {
    try {
      const res = await appointmentApi.updateStatus(aptId, { status: 'approved' });
      if (res.success) {
        toast.success('Appointment approved successfully');
        fetchAppointments();
      } else {
        toast.error(res.message || 'Failed to approve appointment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error approving appointment');
    }
  };

  const handleRejectAppointment = async (aptId: string) => {
    try {
      const res = await appointmentApi.updateStatus(aptId, { status: 'rejected', rejectionReason: 'Rejected by manager' });
      if (res.success) {
        toast.success('Appointment rejected');
        fetchAppointments();
      } else {
        toast.error(res.message || 'Failed to reject appointment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error rejecting appointment');
    }
  };

  const getCustomerName = (appointment: Appointment) => {
    try {
      const customer = appointment.customer;
      if (typeof customer === 'object' && customer !== null) {
        // Handle populated customer with user
        if (customer.user) {
          if (typeof customer.user === 'object') {
            return `${customer.user.firstName || ''} ${customer.user.lastName || ''}`.trim();
          }
          // Handle if user is just an ID string
          return 'Unknown';
        }
        // Handle if customer has firstName/lastName directly
        if (customer.firstName || customer.lastName) {
          return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        }
      }
      return 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  };

  const getCustomerPhone = (appointment: Appointment) => {
    try {
      const customer = appointment.customer;
      if (typeof customer === 'object' && customer !== null) {
        // Handle populated customer with user
        if (customer.user) {
          if (typeof customer.user === 'object') {
            return customer.user.mobile || 'N/A';
          }
          // Handle if user is just an ID string
          return 'N/A';
        }
        // Handle if customer has mobile directly
        if (customer.mobile) {
          return customer.mobile;
        }
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const getVehicleInfo = (appointment: Appointment) => {
    try {
      const vehicle = appointment.vehicle;
      if (typeof vehicle === 'object') {
        return `${vehicle.make || ''} ${vehicle.model || ''}`.trim();
      }
      return 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  };

  const getVehicleReg = (appointment: Appointment) => {
    try {
      const vehicle = appointment.vehicle;
      if (typeof vehicle === 'object') {
        return vehicle.registrationNumber || 'N/A';
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const getTechnicianName = (appointment: Appointment) => {
    try {
      const technician = appointment.assignedTechnician;
      if (typeof technician === 'object' && technician.user) {
        return `${technician.user.firstName || ''} ${technician.user.lastName || ''}`.trim();
      }
      return 'Unassigned';
    } catch (e) {
      return 'Unassigned';
    }
  };

  const getFilteredAppointments = () => {
    let filtered = [...appointments];
    
    if (activeTab === 'pending') {
      filtered = filtered.filter(apt => apt.status === 'pending');
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.appointmentNumber?.toLowerCase().includes(query) ||
        getCustomerName(apt).toLowerCase().includes(query) ||
        getVehicleReg(apt).toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => {
      const dateCompare = dayjs(a.preferredDate).diff(dayjs(b.preferredDate));
      if (dateCompare !== 0) return dateCompare;
      return (a.preferredTime || '').localeCompare(b.preferredTime || '');
    });
  };

  const getPaginatedAppointments = () => {
    const filtered = getFilteredAppointments();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredAppointments().length / itemsPerPage);

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
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getQuickActions = (appointment: Appointment) => {
    switch (appointment.status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => handleAppointmentAction(appointment, 'edit')}
              className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'approve')}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'reschedule')}
              className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
              title="Reschedule"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'reject')}
              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'view')}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
          </>
        );
      case 'approved':
      case 'confirmed' as any:
        return (
          <>
            <button
              onClick={() => handleAppointmentAction(appointment, 'edit')}
              className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'reschedule')}
              className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
              title="Reschedule"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'cancel')}
              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'jobcard')}
              className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors"
              title="Create Job Card"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'view')}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
          </>
        );
      default:
        return (
          <>
            <button
              onClick={() => handleAppointmentAction(appointment, 'edit')}
              className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAppointmentAction(appointment, 'view')}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
          </>
        );
    }
  };

  const renderListView = () => {
    const filteredAppointments = getPaginatedAppointments();
    const totalFiltered = getFilteredAppointments().length;

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, customer, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Appt ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAppointments.map((apt, index) => (
                  <tr key={apt._id || apt.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-900">{apt.appointmentNumber || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-900">{getCustomerName(apt)}</div>
                      <div className="text-xs text-slate-500">{getCustomerPhone(apt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-900">{getVehicleReg(apt)}</div>
                      <div className="text-xs text-slate-500">{getVehicleInfo(apt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-900">
                        {apt.preferredDate ? dayjs(apt.preferredDate).format('DD MMM YYYY') : 'N/A'}
                      </div>
                      <div className="text-xs text-slate-500">{apt.preferredTime || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(apt.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {getQuickActions(apt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No appointments found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered} appointments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Calendar className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Appointments</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
                <p className="text-xs text-slate-500">Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Check className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.confirmed}</p>
                <p className="text-xs text-slate-500">Confirmed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workshop Capacity */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Factory className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Workshop Capacity</p>
                <p className="text-xs text-slate-500">
                  {stats.workshopCapacity.used}/{stats.workshopCapacity.total} Bays Occupied ({stats.workshopCapacity.total - stats.workshopCapacity.used} Available)
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(stats.workshopCapacity.total)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-2 rounded-full ${i < stats.workshopCapacity.used ? 'bg-brand-500' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPendingView = () => {
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-600">
          <Clock className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Pending Approvals ({pendingAppointments.length})</h2>
          <span className="text-sm text-slate-500">- Created by Employees - Requires Manager Action</span>
        </div>

        {pendingAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Check className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
            <p className="text-slate-500">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAppointments.map((apt, index) => (
              <div key={apt._id || apt.id || index} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">Request #{index + 1}</h3>
                    <p className="text-sm text-slate-500">Appointment ID: {apt.appointmentNumber || 'N/A'}</p>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Customer</p>
                    <p className="text-sm font-medium text-slate-900">{getCustomerName(apt)}</p>
                    <p className="text-xs text-slate-500">{getCustomerPhone(apt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Vehicle</p>
                    <p className="text-sm font-medium text-slate-900">{getVehicleReg(apt)}</p>
                    <p className="text-xs text-slate-500">{getVehicleInfo(apt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date/Time</p>
                    <p className="text-sm font-medium text-slate-900">
                      {apt.preferredDate ? dayjs(apt.preferredDate).format('DD MMM YYYY') : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">{apt.preferredTime || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-1">Complaint</p>
                  <p className="text-sm text-slate-700">{apt.complaint || 'No complaint specified'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">Technician:</p>
                  <p className="text-sm font-medium text-slate-900">{getTechnicianName(apt)}</p>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleAppointmentAction(apt, 'approve')}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAppointmentAction(apt, 'reschedule')}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleAppointmentAction(apt, 'reject')}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const calendarAppointments = getAppointmentsForView();

    return (
      <div className="space-y-4">
        {/* Calendar Controls */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCalendarDate(d => d.subtract(1, calendarView === 'monthly' ? 'month' : 'week'))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900">
              {calendarDate.format(calendarView === 'monthly' ? 'MMMM YYYY' : 'MMM YYYY')}
            </h3>
            <button
              onClick={() => setCalendarDate(d => d.add(1, calendarView === 'monthly' ? 'month' : 'week'))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCalendarView('daily')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                calendarView === 'daily' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCalendarView('weekly')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                calendarView === 'weekly' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarView('monthly')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                calendarView === 'monthly' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`min-h-[80px] p-2 rounded-lg border transition-colors ${
                  day.isToday ? 'bg-brand-50 border-brand-200' : 'bg-slate-50 border-slate-200'
                } ${!day.isCurrentMonth ? 'opacity-50' : ''}`}
              >
                <div className="text-sm font-medium text-slate-900 mb-1">{day.date}</div>
                <div className="space-y-1">
                  {day.appointments.slice(0, 3).map((apt: any, aptIndex: number) => (
                    <div
                      key={aptIndex}
                      onClick={() => handleAppointmentAction(apt, 'view')}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: apt.status === 'approved' ? '#10b981' : 
                                       apt.status === 'pending' ? '#f59e0b' : 
                                       apt.status === 'cancelled' ? '#64748b' : '#3b82f6'
                      }}
                    >
                      {apt.preferredTime}
                    </div>
                  ))}
                  {day.appointments.length > 3 && (
                    <div className="text-xs text-slate-500">+{day.appointments.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-4">
            📅 TODAY - {dayjs().format('MMMM D, YYYY')} ({dayjs().format('dddd')})
          </h3>
          {calendarAppointments.length === 0 ? (
            <p className="text-slate-500 text-sm">No appointments scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {calendarAppointments.map((apt, index) => (
                <div
                  key={apt._id || apt.id || index}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => handleAppointmentAction(apt, 'view')}
                >
                  <div className="text-sm font-medium text-slate-900 w-24">
                    {apt.preferredTime}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{getCustomerName(apt)}</p>
                    <p className="text-xs text-slate-500">{getVehicleReg(apt)}</p>
                  </div>
                  <div className="text-sm text-slate-600 w-32">
                    {getTechnicianName(apt)}
                  </div>
                  <div>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const generateCalendarDays = () => {
    const startOfMonth = calendarDate.startOf('month');
    const endOfMonth = calendarDate.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');
    
    const days = [];
    let current = startOfWeek.clone();
    
    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayAppointments = appointments.filter(apt => 
        apt.preferredDate && dayjs(apt.preferredDate).format('YYYY-MM-DD') === dateStr
      );
      
      days.push({
        date: current.format('D'),
        fullDate: dateStr,
        isCurrentMonth: current.isSame(calendarDate, 'month'),
        isToday: current.isSame(dayjs(), 'day'),
        appointments: dayAppointments
      });
      
      current = current.add(1, 'day');
    }
    
    return days;
  };

  const getAppointmentsForView = () => {
    let filtered = [...appointments];
    
    if (calendarView === 'daily') {
      const dateStr = calendarDate.format('YYYY-MM-DD');
      filtered = filtered.filter(apt => 
        apt.preferredDate && dayjs(apt.preferredDate).format('YYYY-MM-DD') === dateStr
      );
    } else if (calendarView === 'weekly') {
      const startOfWeek = calendarDate.startOf('week');
      const endOfWeek = calendarDate.endOf('week');
      filtered = filtered.filter(apt => {
        if (!apt.preferredDate) return false;
        const d = dayjs(apt.preferredDate);
        return !(d.isBefore(startOfWeek, 'day') || d.isAfter(endOfWeek, 'day'));
      });
    }
    
    return filtered.sort((a, b) => {
      return (a.preferredTime || '').localeCompare(b.preferredTime || '');
    });
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchAppointments} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Management</h1>
          <p className="text-sm text-slate-500">Manage and track all service appointments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'list' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          All Appointments
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'calendar' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'pending' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {stats.pending > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {stats.pending}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'list' && renderListView()}
      {activeTab === 'calendar' && renderCalendarView()}
      {activeTab === 'pending' && renderPendingView()}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <RescheduleAppointmentModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
            fetchAppointments();
          }}
          appointment={selectedAppointment}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <CancelAppointmentModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={() => {
            setShowCancelModal(false);
            setSelectedAppointment(null);
            fetchAppointments();
          }}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
};

const RescheduleAppointmentModal = ({ isOpen, onClose, onSuccess, appointment }: any) => {
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
            <h2 className="text-xl font-bold text-slate-900">Reschedule Appointment</h2>
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
              <span className="font-medium">Current:</span>{' '}
              {appointment?.preferredDate ? dayjs(appointment.preferredDate).format('DD MMM YYYY') : 'N/A'}{' '}
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
            <label className="block text-sm text-slate-600 mb-1">Assign Technician</label>
            <select
              value={assignedTechnician}
              onChange={(e) => setAssignedTechnician(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Unassigned</option>
              {technicians.map((tech) => (
                <option key={tech._id} value={tech._id}>
                  {tech.name} {tech.isAvailable ? '(Available)' : '(Busy)'}
                </option>
              ))}
            </select>
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

const CancelAppointmentModal = ({ isOpen, onClose, onSuccess, appointment }: any) => {
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
            <h2 className="text-xl font-bold text-slate-900">Cancel Appointment</h2>
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
