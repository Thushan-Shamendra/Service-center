import React, { useEffect, useState } from 'react';
import { hrApi } from '../../api/hrApi';
import { userApi } from '../../api/userApi';
import { formatLKR } from '../../utils/formatters';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Clock,
  TrendingUp,
  Building,
  Search,
  Plus,
  Save,
  X,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Edit
} from 'lucide-react';
import { SalaryAdvancePage } from './SalaryAdvancePage';
import { LoanPage } from './LoanPage';
import { PayrollPage } from './PayrollPage';

type HRSubTab = 'overview' | 'attendance' | 'leave' | 'payroll' | 'advances' | 'loans';

interface HRStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeave: number;
  pendingAdvances: number;
  activeLoans: number;
  monthlyPayroll: {
    totalGross: number;
    totalNet: number;
    processedCount: number;
  };
  advanceStats?: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  loanStats?: {
    pending: number;
    active: number;
    completed: number;
    total: number;
  };
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export const HRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HRSubTab>('overview');
  const [stats, setStats] = useState<HRStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  
  // Leave management state
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoadingLeave, setIsLoadingLeave] = useState(false);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [isLoadingLeaveStats, setIsLoadingLeaveStats] = useState(false);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [showLeaveReviewModal, setShowLeaveReviewModal] = useState(false);
  const [leaveReviewForm, setLeaveReviewForm] = useState({
    remarks: ''
  });
  const [isSubmittingLeaveReview, setIsSubmittingLeaveReview] = useState(false);
  
  // Attendance filters and form
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '17:00',
    status: 'present',
    lateReason: '',
    lateReasonDetails: '',
    absenceReason: '',
    leaveType: '',
    leaveReference: '',
    halfDayType: 'morning',
    halfDayReason: '',
    holidayType: 'public',
    holidayName: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchHRStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await hrApi.getHRStats();
      if (res.success) {
        setStats(res.data);
      } else {
        console.error('HR stats API returned unsuccessful response:', res.message);
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch HR stats:', error);
      setStats(null); // Set to null on error to prevent undefined issues
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchAttendance = async () => {
    setIsLoadingAttendance(true);
    try {
      const params: any = {};
      if (searchTerm) params.employee = searchTerm;
      if (dateFilter) params.startDate = dateFilter;
      if (statusFilter) params.status = statusFilter;
      
      const res = await hrApi.getAttendance(params);
      if (res.success) {
        setAttendance(res.data);
      } else {
        console.error('Attendance API returned unsuccessful response:', res.message);
        setAttendance([]);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setAttendance([]); // Set empty array on error
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const fetchLeaveRequests = async () => {
    setIsLoadingLeave(true);
    try {
      const params: any = {};
      if (leaveStatusFilter) params.status = leaveStatusFilter;
      
      const res = await hrApi.getLeaveRequests(params);
      if (res.success) {
        setLeaveRequests(res.data);
      } else {
        console.error('Leave requests API returned unsuccessful response:', res.message);
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      setLeaveRequests([]); // Set empty array on error
    } finally {
      setIsLoadingLeave(false);
    }
  };

  const fetchLeaveStats = async () => {
    setIsLoadingLeaveStats(true);
    try {
      const res = await hrApi.getLeaveStats();
      if (res.success) {
        setLeaveStats(res.data);
      } else {
        console.error('Leave stats API returned unsuccessful response:', res.message);
        setLeaveStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch leave stats:', error);
      setLeaveStats(null); // Set to null on error
    } finally {
      setIsLoadingLeaveStats(false);
    }
  };

  const fetchAdvanceStats = async () => {
    try {
      const res = await hrApi.getAdvanceStats();
      if (res.success) {
        setStats(prev => prev ? { ...prev, advanceStats: res.data } : null);
      } else {
        console.error('Advance stats API returned unsuccessful response:', res.message);
      }
    } catch (error) {
      console.error('Failed to fetch advance stats:', error);
    }
  };

  const fetchLoanStats = async () => {
    try {
      const res = await hrApi.getLoanStats();
      if (res.success) {
        setStats(prev => prev ? { ...prev, loanStats: res.data } : null);
      } else {
        console.error('Loan stats API returned unsuccessful response:', res.message);
      }
    } catch (error) {
      console.error('Failed to fetch loan stats:', error);
    }
  };

  useEffect(() => {
    fetchHRStats();
    fetchStaffMembers();
    fetchLeaveStats();
    // Also fetch advance and loan stats for overview
    fetchAdvanceStats();
    fetchLoanStats();

    // Cleanup function to cancel pending requests on unmount
    return () => {
      hrApi.cancelAllRequests();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    } else if (activeTab === 'leave') {
      fetchLeaveRequests();
    }
  }, [activeTab, searchTerm, dateFilter, statusFilter, leaveStatusFilter]);

  // Auto-calculate hours worked based on check-in and check-out
  const calculateHoursWorked = (checkIn: string, checkOut: string) => {
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    
    const inDate = new Date();
    inDate.setHours(inHours, inMinutes, 0, 0);
    
    const outDate = new Date();
    outDate.setHours(outHours, outMinutes, 0, 0);
    
    const diffMs = outDate.getTime() - inDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.max(0, diffHours).toFixed(1);
  };

  // Format hours worked for display
  const formatHoursWorked = (hours: string) => {
    const [whole, decimal] = hours.split('.');
    const minutes = decimal ? Math.round(parseFloat(`0.${decimal}`) * 60) : 0;
    return `${whole}h ${String(minutes).padStart(2, '0')}m`;
  };

  // Determine which fields to show based on status
  const showCheckInOut = ['present', 'late', 'half-day'].includes(attendanceForm.status);
  const showLateReason = attendanceForm.status === 'late';
  const showAbsenceReason = attendanceForm.status === 'absent';
  const showLeaveFields = attendanceForm.status === 'leave';
  const showHalfDayFields = attendanceForm.status === 'half-day';
  const showHolidayFields = attendanceForm.status === 'holiday';

  const handleAttendanceSubmit = async () => {
    setSubmitError('');
    setIsSubmitting(true);
    
    try {
      if (!attendanceForm.employeeId) {
        setSubmitError('Please select a staff member');
        setIsSubmitting(false);
        return;
      }
      
      // Set hours worked to 0 for Absent, Leave, and Holiday statuses
      let hoursWorked = 0;
      let checkIn = null;
      let checkOut = null;
      
      if (['present', 'late', 'half-day'].includes(attendanceForm.status)) {
        hoursWorked = parseFloat(calculateHoursWorked(attendanceForm.checkIn, attendanceForm.checkOut));
        // Convert time strings to Date objects for the backend
        const [inHours, inMinutes] = attendanceForm.checkIn.split(':').map(Number);
        const [outHours, outMinutes] = attendanceForm.checkOut.split(':').map(Number);
        
        const checkInDate = new Date(attendanceForm.date);
        checkInDate.setHours(inHours, inMinutes, 0, 0);
        checkIn = checkInDate.toISOString();
        
        const checkOutDate = new Date(attendanceForm.date);
        checkOutDate.setHours(outHours, outMinutes, 0, 0);
        checkOut = checkOutDate.toISOString();
      }
      
      let res;
      if (isEditingAttendance && selectedAttendance) {
        // Update existing attendance
        res = await hrApi.updateAttendance(selectedAttendance._id, {
          status: attendanceForm.status,
          checkIn: checkIn,
          checkOut: checkOut,
          hoursWorked: hoursWorked,
          remarks: attendanceForm.remarks
        });
      } else {
        // Create new attendance
        res = await hrApi.recordAttendance({
          employeeId: attendanceForm.employeeId,
          date: attendanceForm.date,
          status: attendanceForm.status,
          hoursWorked: hoursWorked,
          checkIn: checkIn,
          checkOut: checkOut,
        });
      }
      
      if (res.success) {
        setShowAttendanceForm(false);
        setIsEditingAttendance(false);
        setSelectedAttendance(null);
        fetchAttendance();
        setAttendanceForm({
          employeeId: '',
          date: new Date().toISOString().split('T')[0],
          checkIn: '08:00',
          checkOut: '17:00',
          status: 'present',
          lateReason: '',
          lateReasonDetails: '',
          absenceReason: '',
          leaveType: '',
          leaveReference: '',
          halfDayType: 'morning',
          halfDayReason: '',
          holidayType: 'public',
          holidayName: '',
          remarks: ''
        });
      } else {
        setSubmitError(res.message || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('Failed to record attendance:', error);
      setSubmitError(error.message || 'An error occurred while recording attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      // Fetch both employees and managers with proper error handling
      const [employeesRes, managersRes] = await Promise.allSettled([
        userApi.getUsers({ role: 'employee', status: 'active', limit: 100 }),
        userApi.getUsers({ role: 'manager', status: 'active', limit: 100 })
      ]);
      
      let allStaff: any[] = [];
      
      // Process employees result
      if (employeesRes.status === 'fulfilled' && employeesRes.value?.success) {
        allStaff = [...allStaff, ...(employeesRes.value.data || [])];
      } else if (employeesRes.status === 'rejected') {
        console.error('Failed to fetch employees:', employeesRes.reason);
      }
      
      // Process managers result
      if (managersRes.status === 'fulfilled' && managersRes.value?.success) {
        allStaff = [...allStaff, ...(managersRes.value.data || [])];
      } else if (managersRes.status === 'rejected') {
        console.error('Failed to fetch managers:', managersRes.reason);
      }
      
      // Filter staff that have valid profiles (or employeeDetails) and add proper ID based on role
      const validStaff = allStaff
        .map(staff => {
          const profile = staff.profile || staff.employeeDetails;
          if (!profile) return null;
          return {
            ...staff,
            profile,
            displayId: staff.role === 'manager' 
              ? (profile.managerId || profile.employeeId || `MGR-${staff._id.slice(-4)}`)
              : (profile.employeeId || `EMP-${staff._id.slice(-4)}`)
          };
        })
        .filter(Boolean);
      
      setStaffMembers(validStaff);
      
      // Show error if no staff members found
      if (validStaff.length === 0) {
        console.warn('No valid staff members found with proper profiles');
      }
    } catch (error) {
      console.error('Unexpected error fetching staff members:', error);
      setStaffMembers([]); // Set empty array on error to prevent undefined issues
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Leave review functions
  const handleReviewLeave = (leave: any) => {
    setSelectedLeave(leave);
    setLeaveReviewForm({ remarks: leave.remarks || '' });
    setShowLeaveReviewModal(true);
  };

  const handleApproveLeave = async () => {
    setIsSubmittingLeaveReview(true);
    try {
      const res = await hrApi.updateLeaveStatus(selectedLeave._id, {
        status: 'approved',
        remarks: leaveReviewForm.remarks
      });
      
      if (res.success) {
        setShowLeaveReviewModal(false);
        fetchLeaveRequests();
        fetchLeaveStats();
        setSelectedLeave(null);
      } else {
        console.error('Failed to approve leave:', res.message);
        alert(res.message || 'Failed to approve leave request');
      }
    } catch (error) {
      console.error('Failed to approve leave:', error);
      alert('An error occurred while approving the leave request');
    } finally {
      setIsSubmittingLeaveReview(false);
    }
  };

  const handleRejectLeave = async () => {
    setIsSubmittingLeaveReview(true);
    try {
      const res = await hrApi.updateLeaveStatus(selectedLeave._id, {
        status: 'rejected',
        remarks: leaveReviewForm.remarks
      });
      
      if (res.success) {
        setShowLeaveReviewModal(false);
        fetchLeaveRequests();
        fetchLeaveStats();
        setSelectedLeave(null);
      } else {
        console.error('Failed to reject leave:', res.message);
        alert(res.message || 'Failed to reject leave request');
      }
    } catch (error) {
      console.error('Failed to reject leave:', error);
      alert('An error occurred while rejecting the leave request');
    } finally {
      setIsSubmittingLeaveReview(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;
    
    try {
      const res = await hrApi.deleteLeaveRequest(leaveId);
      if (res.success) {
        fetchLeaveRequests();
        fetchLeaveStats();
      } else {
        console.error('Failed to delete leave:', res.message);
        alert(res.message || 'Failed to delete leave request');
      }
    } catch (error) {
      console.error('Failed to delete leave:', error);
      alert('An error occurred while deleting the leave request');
    }
  };

  // Attendance view and edit handlers
  const handleViewAttendance = (attendance: any) => {
    setSelectedAttendance(attendance);
    setShowAttendanceDetails(true);
  };

  const handleEditAttendance = (attendance: any) => {
    setSelectedAttendance(attendance);
    // Populate the form with existing data
    setAttendanceForm({
      employeeId: attendance.employee?._id || attendance.employee,
      date: new Date(attendance.date).toISOString().split('T')[0],
      checkIn: attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00',
      checkOut: attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '17:00',
      status: attendance.status || 'present',
      lateReason: attendance.lateReason || '',
      lateReasonDetails: attendance.lateReasonDetails || '',
      absenceReason: attendance.absenceReason || '',
      leaveType: attendance.leaveType || '',
      leaveReference: attendance.leaveReference || '',
      halfDayType: attendance.halfDayType || 'morning',
      halfDayReason: attendance.halfDayReason || '',
      holidayType: attendance.holidayType || 'public',
      holidayName: attendance.holidayName || '',
      remarks: attendance.remarks || ''
    });
    setIsEditingAttendance(true);
    setShowAttendanceForm(true);
  };

  // Calculate total days between dates
  const calculateTotalDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const tabs = [
    { id: 'overview' as HRSubTab, label: 'Overview', icon: TrendingUp },
    { id: 'attendance' as HRSubTab, label: 'Attendance', icon: UserCheck },
    { id: 'leave' as HRSubTab, label: 'Leave', icon: Calendar },
    { id: 'payroll' as HRSubTab, label: 'Payroll', icon: DollarSign },
    { id: 'advances' as HRSubTab, label: 'Advances', icon: CreditCard },
    { id: 'loans' as HRSubTab, label: 'Loans', icon: Building },
  ];

  const attendanceColumns: Column<any>[] = [
    {
      header: 'Attendance ID',
      accessor: (item) => (
        <span className="text-xs font-mono text-slate-500">{item.attendanceId || 'ATT-00000'}</span>
      ),
    },
    {
      header: 'Employee',
      accessor: (item) => (
        <div>
          <div className="font-bold text-slate-900">
            {item.employee?.user?.firstName || item.employee?.firstName} {item.employee?.user?.lastName || item.employee?.lastName}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {item.employee?.employeeId || item.employee?.managerId}
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: (item) => {
        const date = new Date(item.date);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      },
    },
    {
      header: 'In',
      accessor: (item) => item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      header: 'Out',
      accessor: (item) => item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      header: 'Hours',
      accessor: (item) => {
        const hours = item.hoursWorked || 0;
        const status = item.status?.toLowerCase();
        // For absent, leave, holiday, show 0
        if (['absent', 'leave', 'holiday'].includes(status)) {
          return '0';
        }
        return hours.toFixed(1);
      },
    },
    {
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewAttendance(item)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditAttendance(item)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Attendance"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const leaveColumns: Column<any>[] = [
    {
      header: 'Leave ID',
      accessor: (item) => (
        <span className="text-xs font-mono text-slate-500">{item.leaveId}</span>
      ),
    },
    {
      header: 'Staff',
      accessor: (item) => (
        <div>
          <div className="font-bold text-slate-900">
            {item.employee?.user?.firstName} {item.employee?.user?.lastName}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {item.employee?.employeeId || item.employee?.managerId}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (item) => (
        <span className="text-xs font-semibold text-slate-700 capitalize">
          {item.leaveType.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'From',
      accessor: (item) => {
        const date = new Date(item.startDate);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      },
    },
    {
      header: 'To',
      accessor: (item) => {
        const date = new Date(item.endDate);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      },
    },
    {
      header: 'Days',
      accessor: (item) => (
        <span className="text-xs font-bold text-slate-800">{item.totalDays}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Action',
      accessor: (item) => (
        <div className="flex gap-2">
          {item.status === 'pending' && (
            <>
              <button
                onClick={() => handleReviewLeave(item)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all"
              >
                <FileText className="w-3 h-3" />
                Review
              </button>
              <button
                onClick={() => handleDeleteLeave(item._id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Human Resource Management</h2>
          <p className="text-sm text-slate-500">
            Manage workforce attendance, payroll, leave, advances, and loans.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Staff"
              value={stats?.totalEmployees || 0}
              icon={Users}
              subtext="Active employees"
              color="blue"
            />
            <StatCard
              title="Present Today"
              value={stats?.presentToday || 0}
              icon={UserCheck}
              subtext="Currently at work"
              color="emerald"
            />
            <StatCard
              title="Pending Leave"
              value={stats?.pendingLeave || 0}
              icon={Calendar}
              subtext="Awaiting approval"
              color="amber"
            />
            <StatCard
              title="Payroll This Month"
              value={formatLKR(stats?.monthlyPayroll?.totalGross || 0)}
              icon={DollarSign}
              subtext="Gross salary payout"
              color="purple"
            />
            <StatCard
              title="Advances Pending"
              value={stats?.pendingAdvances || 0}
              icon={CreditCard}
              subtext="Awaiting approval"
              color="rose"
            />
            <StatCard
              title="Active Loans"
              value={stats?.activeLoans || 0}
              icon={Building}
              subtext="Outstanding loans"
              color="purple"
            />
            <StatCard
              title="Payroll Processed"
              value={stats?.monthlyPayroll?.processedCount || 0}
              icon={Clock}
              subtext="Employees processed"
              color="emerald"
            />
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Monthly Net Payroll</h3>
                  <p className="text-xs text-slate-500">After EPF deductions</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatLKR(stats?.monthlyPayroll?.totalNet || 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Attendance Rate Today</h3>
                  <p className="text-xs text-slate-500">Staff present vs total</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {stats?.totalEmployees > 0 
                  ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half-day">Half Day</option>
                  <option value="leave">Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
                
                <button
                  onClick={() => setShowAttendanceForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Attendance
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Form Modal */}
          {showAttendanceForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-900">{isEditingAttendance ? 'Edit Attendance' : 'Record Attendance'}</h3>
                  <button
                    onClick={() => {
                      setShowAttendanceForm(false);
                      setIsEditingAttendance(false);
                      setSelectedAttendance(null);
                      setAttendanceForm({
                        employeeId: '',
                        date: new Date().toISOString().split('T')[0],
                        checkIn: '08:00',
                        checkOut: '17:00',
                        status: 'present',
                        lateReason: '',
                        lateReasonDetails: '',
                        absenceReason: '',
                        leaveType: '',
                        leaveReference: '',
                        halfDayType: 'morning',
                        halfDayReason: '',
                        holidayType: 'public',
                        holidayName: '',
                        remarks: ''
                      });
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                  {/* Attendance ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Attendance ID</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                      <span>{isEditingAttendance ? selectedAttendance?.attendanceId || 'ATT-*****' : 'ATT-*****'}</span>
                      <span className="text-slate-400">🔒</span>
                    </div>
                  </div>

                  {/* Employee Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee / Manager *</label>
                    <select
                      value={attendanceForm.employeeId}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      required
                      disabled={isLoadingStaff || isEditingAttendance}
                    >
                      <option value="">{isLoadingStaff ? 'Loading staff...' : 'Select Staff ▼'}</option>
                      {staffMembers.map((staff) => (
                        <option key={staff._id} value={staff.profile?._id}>
                          {staff.displayId} - {staff.firstName} {staff.lastName} ({staff.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Date *</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={attendanceForm.date}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        required
                        disabled={isEditingAttendance}
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Status *</label>
                    <select
                      value={attendanceForm.status}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="half-day">Half Day</option>
                      <option value="leave">Leave</option>
                      <option value="holiday">Holiday</option>
                    </select>
                  </div>

                  {/* Check In/Out - Only show for Present, Late, Half Day */}
                  {showCheckInOut && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Check In {showCheckInOut ? '*' : ''}
                        </label>
                        <input
                          type="time"
                          value={attendanceForm.checkIn}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Check Out</label>
                        <input
                          type="time"
                          value={attendanceForm.checkOut}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Hours Worked</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                          <span className="font-bold">{formatHoursWorked(calculateHoursWorked(attendanceForm.checkIn, attendanceForm.checkOut))}</span>
                          <span className="text-slate-400">🔒 Auto Calculated</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Hours Worked = 0 for Absent, Leave, Holiday */}
                  {!showCheckInOut && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Hours Worked</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">0h 00m</span>
                        <span className="text-slate-400">🔒 Auto Set to 0</span>
                      </div>
                    </div>
                  )}

                  {/* Late Reason - Only show for Late status */}
                  {showLateReason && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Late Reason *</label>
                        <select
                          value={attendanceForm.lateReason}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, lateReason: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        >
                          <option value="">Select Reason ▼</option>
                          <option value="traffic">Traffic</option>
                          <option value="personal">Personal</option>
                          <option value="transport">Transport Issue</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {attendanceForm.lateReason === 'other' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason Details *</label>
                          <input
                            type="text"
                            value={attendanceForm.lateReasonDetails}
                            onChange={(e) => setAttendanceForm({ ...attendanceForm, lateReasonDetails: e.target.value })}
                            placeholder="Please specify..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Absence Reason - Only show for Absent status */}
                  {showAbsenceReason && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Absence Reason *</label>
                      <select
                        value={attendanceForm.absenceReason}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, absenceReason: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        <option value="">Select Reason ▼</option>
                        <option value="sick">Sick</option>
                        <option value="personal">Personal</option>
                        <option value="unauthorized">Unauthorized</option>
                        <option value="emergency">Emergency</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  {/* Leave Fields - Only show for Leave status */}
                  {showLeaveFields && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave Type *</label>
                        <select
                          value={attendanceForm.leaveType}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, leaveType: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        >
                          <option value="">Select Leave Type ▼</option>
                          <option value="annual">Annual Leave</option>
                          <option value="sick">Sick Leave</option>
                          <option value="casual">Casual Leave</option>
                          <option value="maternity">Maternity Leave</option>
                          <option value="paternity">Paternity Leave</option>
                          <option value="unpaid">Unpaid Leave</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave Reference</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                          <span>LV-*****</span>
                          <span className="text-slate-400">🔒</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Half Day Fields - Only show for Half Day status */}
                  {showHalfDayFields && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Half-Day Type *</label>
                        <select
                          value={attendanceForm.halfDayType}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, halfDayType: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason</label>
                        <input
                          type="text"
                          value={attendanceForm.halfDayReason}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, halfDayReason: e.target.value })}
                          placeholder="Enter reason..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Holiday Fields - Only show for Holiday status */}
                  {showHolidayFields && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Holiday Type</label>
                        <select
                          value={attendanceForm.holidayType}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, holidayType: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        >
                          <option value="public">Public Holiday</option>
                          <option value="company">Company Holiday</option>
                          <option value="religious">Religious Holiday</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Holiday Name</label>
                        <input
                          type="text"
                          value={attendanceForm.holidayName}
                          onChange={(e) => setAttendanceForm({ ...attendanceForm, holidayName: e.target.value })}
                          placeholder="e.g., Poya Day"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Remarks - Common field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks</label>
                    <input
                      type="text"
                      value={attendanceForm.remarks}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, remarks: e.target.value })}
                      placeholder="Additional notes..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {/* Auto Calculation Preview - Only show for statuses with check-in/out */}
                  {showCheckInOut && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-700 mb-2">Auto Calculation</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Check In</span>
                          <span className="font-mono">{attendanceForm.checkIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Check Out</span>
                          <span className="font-mono">{attendanceForm.checkOut}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
                          <span className="text-slate-500">Hours Worked</span>
                          <span className="font-bold text-brand-600">{formatHoursWorked(calculateHoursWorked(attendanceForm.checkIn, attendanceForm.checkOut))}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setShowAttendanceForm(false);
                        setIsEditingAttendance(false);
                        setSelectedAttendance(null);
                        setAttendanceForm({
                          employeeId: '',
                          date: new Date().toISOString().split('T')[0],
                          checkIn: '08:00',
                          checkOut: '17:00',
                          status: 'present',
                          lateReason: '',
                          lateReasonDetails: '',
                          absenceReason: '',
                          leaveType: '',
                          leaveReference: '',
                          halfDayType: 'morning',
                          halfDayReason: '',
                          holidayType: 'public',
                          holidayName: '',
                          remarks: ''
                        });
                      }}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAttendanceSubmit}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting ? 'Saving...' : (isEditingAttendance ? 'Update Attendance' : 'Save Attendance')}
                    </button>
                  </div>
                  
                  {/* Error Message */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                      {submitError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Details Modal */}
          {showAttendanceDetails && selectedAttendance && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Attendance Details</h3>
                  <button
                    onClick={() => {
                      setShowAttendanceDetails(false);
                      setSelectedAttendance(null);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">Attendance ID:</span>
                      <span className="text-xs font-mono text-slate-600">{selectedAttendance.attendanceId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Date:</span>
                      <span className="text-xs text-slate-600">
                        {new Date(selectedAttendance.date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">Employee:</span>
                      <span className="text-xs text-slate-600">
                        {selectedAttendance.employee?.user?.firstName || selectedAttendance.employee?.firstName} {selectedAttendance.employee?.user?.lastName || selectedAttendance.employee?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Employee ID:</span>
                      <span className="text-xs font-mono text-slate-600">
                        {selectedAttendance.employee?.employeeId || selectedAttendance.employee?.managerId}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 mb-1">Check In</div>
                      <div className="text-sm text-slate-600">
                        {selectedAttendance.checkIn ? new Date(selectedAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 mb-1">Check Out</div>
                      <div className="text-sm text-slate-600">
                        {selectedAttendance.checkOut ? new Date(selectedAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 mb-1">Hours Worked</div>
                      <div className="text-sm text-slate-600">
                        {selectedAttendance.hoursWorked?.toFixed(1) || '0'}h
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 mb-1">Status</div>
                      <div className="mt-1">
                        <StatusBadge status={selectedAttendance.status} />
                      </div>
                    </div>
                  </div>

                  {selectedAttendance.remarks && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 mb-1">Remarks</div>
                      <div className="text-sm text-slate-600">{selectedAttendance.remarks}</div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setShowAttendanceDetails(false);
                        handleEditAttendance(selectedAttendance);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowAttendanceDetails(false);
                        setSelectedAttendance(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <DataTable
            columns={attendanceColumns}
            data={attendance}
            isLoading={isLoadingAttendance}
            emptyTitle="No Attendance Records"
            emptyDescription="Attendance records will appear here as employees check in and out."
          />
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {/* Leave Stats Dashboard */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Leave Applications</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-bold text-amber-900">Pending</span>
                </div>
                <p className="text-2xl font-extrabold text-amber-700">{leaveStats?.pending || 0}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-900">Approved</span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-700">{leaveStats?.approved || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-bold text-red-900">Rejected</span>
                </div>
                <p className="text-2xl font-extrabold text-red-700">{leaveStats?.rejected || 0}</p>
              </div>
            </div>
          </div>

          {/* Leave Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <select
                  value={leaveStatusFilter}
                  onChange={(e) => setLeaveStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leave Table */}
          <DataTable
            columns={leaveColumns}
            data={leaveRequests}
            isLoading={isLoadingLeave}
            emptyTitle="No Leave Requests"
            emptyDescription="Leave requests will appear here as employees submit them."
          />

          {/* Leave Review Modal */}
          {showLeaveReviewModal && selectedLeave && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-900">Leave Review Form</h3>
                  <button
                    onClick={() => setShowLeaveReviewModal(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                  {/* Leave ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave ID</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                      <span>{selectedLeave.leaveId}</span>
                      <span className="text-slate-400">🔒</span>
                    </div>
                  </div>

                  {/* Employee/Manager */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee / Manager</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {selectedLeave.employee?.employeeId || selectedLeave.employee?.managerId} - {selectedLeave.employee?.user?.firstName} {selectedLeave.employee?.user?.lastName}
                    </div>
                  </div>

                  {/* Leave Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave Type</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 capitalize">
                      {selectedLeave.leaveType.replace('_', ' ')} Leave
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Start Date</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {new Date(selectedLeave.startDate).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">End Date</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {new Date(selectedLeave.endDate).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  {/* Total Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Days</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      <span className="font-bold">{selectedLeave.totalDays}</span>
                      <span className="text-slate-400">🔒 Auto Calculated</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {selectedLeave.reason}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks</label>
                    <textarea
                      value={leaveReviewForm.remarks}
                      onChange={(e) => setLeaveReviewForm({ ...leaveReviewForm, remarks: e.target.value })}
                      placeholder="Add remarks for this decision..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      rows={3}
                    />
                  </div>

                  {/* Auto Calculation Preview */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-2">Auto Calculation</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Start Date</span>
                        <span className="font-mono">{new Date(selectedLeave.startDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">End Date</span>
                        <span className="font-mono">{new Date(selectedLeave.endDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between">
                        <span className="text-slate-500">Total Days</span>
                        <span className="font-bold text-brand-600">{selectedLeave.totalDays}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowLeaveReviewModal(false)}
                      disabled={isSubmittingLeaveReview}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectLeave}
                      disabled={isSubmittingLeaveReview}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      {isSubmittingLeaveReview ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={handleApproveLeave}
                      disabled={isSubmittingLeaveReview}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isSubmittingLeaveReview ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <PayrollPage />
        </div>
      )}

      {/* Advances Tab */}
      {activeTab === 'advances' && (
        <div className="space-y-6">
          <SalaryAdvancePage />
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <LoanPage />
        </div>
      )}
    </div>
  );
};