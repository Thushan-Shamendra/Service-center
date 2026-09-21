import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hrApi } from '../../api/hrApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  LogIn,
  LogOut,
  RefreshCw,
  History,
  TrendingUp,
  Timer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface AttendanceRecord {
  _id: string;
  attendanceId?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'late' | 'half-day' | 'absent' | 'leave' | 'holiday';
  hoursWorked?: number;
  overtimeHours?: number;
  lateReason?: string;
  remarks?: string;
}

export const EmployeeAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all attendance for employee
  const fetchAttendance = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await hrApi.getAttendance();
      if (res.data?.success || res.success || Array.isArray(res.data)) {
        const records: AttendanceRecord[] = res.data?.data || res.data || [];
        setAttendanceList(records);

        // Find today's record
        const todayStr = new Date().toISOString().split('T')[0];
        const foundToday = records.find((r) => {
          if (!r.date) return false;
          const recDateStr = new Date(r.date).toISOString().split('T')[0];
          return recDateStr === todayStr;
        });
        setTodayRecord(foundToday || null);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setIsLoading(false);
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance(true);
  }, [fetchAttendance]);

  // Handle Check In
  const handleCheckIn = async () => {
    setIsProcessingAction(true);
    try {
      const res = await hrApi.checkIn();
      if (res.data?.success || res.success) {
        toast.success(res.data?.message || res.message || 'Checked in successfully!');
        await fetchAttendance(true);
      } else {
        toast.error(res.data?.message || res.message || 'Check-in failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Check Out
  const handleCheckOut = async () => {
    setIsProcessingAction(true);
    try {
      const res = await hrApi.checkOut();
      if (res.data?.success || res.success) {
        toast.success(res.data?.message || res.message || 'Checked out successfully! Shift logged.');
        await fetchAttendance(true);
      } else {
        toast.error(res.data?.message || res.message || 'Check-out failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Format Time Helper (e.g. 08:30 AM)
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Present
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Late Arrival
          </span>
        );
      case 'half-day':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Timer className="w-3.5 h-3.5 text-blue-600" />
            Half Day
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Absent
          </span>
        );
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            On Leave
          </span>
        );
      case 'holiday':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            Holiday
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

  // Monthly stats calculation
  const monthlyStats = useMemo(() => {
    const [selectedYear, selectedMonth] = monthFilter.split('-').map(Number);
    const filteredMonthRecords = attendanceList.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
    });

    const presentDays = filteredMonthRecords.filter(
      (r) => r.status === 'present' || r.status === 'late' || r.status === 'half-day'
    ).length;

    const lateDays = filteredMonthRecords.filter((r) => r.status === 'late').length;

    const totalHours = filteredMonthRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const overtimeHours = filteredMonthRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return {
      presentDays,
      lateDays,
      totalHours: Math.round(totalHours * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
    };
  }, [attendanceList, monthFilter]);

  // Filtered attendance records for table
  const filteredRecords = useMemo(() => {
    return attendanceList
      .filter((r) => {
        // Status filter
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;

        // Month filter
        if (monthFilter !== 'all') {
          const [selectedYear, selectedMonth] = monthFilter.split('-').map(Number);
          const d = new Date(r.date);
          if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== selectedMonth) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceList, statusFilter, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Generate Month Options for filter
  const monthOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ label, value: val });
    }
    return options;
  }, []);

  // Today's Status State
  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              Attendance & Work Hours
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Welcome, {user?.firstName} {user?.lastName} • Manage your daily check-in, check-out, and attendance history
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAttendance()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TODAY'S PUNCH CLOCK CARD */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Clock & Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-mono text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-300">Today's Status:</span>
              {!hasCheckedIn ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Not Checked In
                </span>
              ) : !hasCheckedOut ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Currently Checked In (On Shift)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Shift Completed
                </span>
              )}
            </div>
          </div>

          {/* Center: Check-in / Check-out timestamps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Check-In</span>
              <span className="text-base sm:text-lg font-bold text-white font-mono mt-0.5 block">
                {formatTime(todayRecord?.checkIn)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Check-Out</span>
              <span className="text-base sm:text-lg font-bold text-white font-mono mt-0.5 block">
                {formatTime(todayRecord?.checkOut)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Hours Today</span>
              <span className="text-base sm:text-lg font-bold text-brand-300 font-mono mt-0.5 block">
                {todayRecord?.hoursWorked ? `${todayRecord.hoursWorked} hrs` : hasCheckedIn && !hasCheckedOut ? 'Counting...' : '0 hrs'}
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch lg:flex-col gap-3 shrink-0">
            {!hasCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isProcessingAction}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessingAction ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Check In Now
                  </>
                )}
              </button>
            ) : !hasCheckedOut ? (
              <button
                onClick={handleCheckOut}
                disabled={isProcessingAction}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessingAction ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Check Out Now
                  </>
                )}
              </button>
            ) : (
              <div className="px-5 py-3 rounded-xl bg-white/10 border border-white/15 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Checked out for today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: MONTHLY SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Monthly Overview</h2>
          </div>

          <select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Days Present */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Days Present</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{monthlyStats.presentDays}</span>
              <span className="text-xs text-slate-400 ml-1">days</span>
            </div>
          </div>

          {/* Late Arrivals */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{monthlyStats.lateDays}</span>
              <span className="text-xs text-slate-400 ml-1">days</span>
            </div>
          </div>

          {/* Total Hours Worked */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Work Hours</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Timer className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{monthlyStats.totalHours}</span>
              <span className="text-xs text-slate-400 ml-1">hrs</span>
            </div>
          </div>

          {/* Overtime Hours */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overtime Hours</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{monthlyStats.overtimeHours}</span>
              <span className="text-xs text-slate-400 ml-1">hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: ATTENDANCE HISTORY LOG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header & Controls */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Attendance Log
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  {filteredRecords.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">Chronological history of your check-in and check-out logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late Arrival</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No attendance logs found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no attendance records for the selected month and status filter. Check in to record your attendance for today!
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Check In</th>
                    <th className="py-3.5 px-6">Check Out</th>
                    <th className="py-3.5 px-6">Hours Worked</th>
                    <th className="py-3.5 px-6">Overtime</th>
                    <th className="py-3.5 px-6">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedRecords.map((record) => {
                    const recordDate = new Date(record.date);
                    const dayOfWeek = recordDate.toLocaleDateString('en-US', { weekday: 'short' });

                    return (
                      <tr key={record._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 text-xs">{formatDate(record.date)}</div>
                          <div className="text-[11px] text-slate-400">{dayOfWeek}</div>
                        </td>
                        <td className="py-4 px-6">{getStatusBadge(record.status)}</td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-700">
                          {formatTime(record.checkIn)}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-700">
                          {formatTime(record.checkOut)}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                          {record.hoursWorked ? `${record.hoursWorked} hrs` : '—'}
                        </td>
                        <td className="py-4 px-6 text-xs font-medium">
                          {record.overtimeHours && record.overtimeHours > 0 ? (
                            <span className="text-purple-600 font-semibold">+{record.overtimeHours} hrs</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                          {record.lateReason ? (
                            <span className="text-amber-700 italic">{record.lateReason}</span>
                          ) : record.remarks ? (
                            <span>{record.remarks}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === p
                          ? 'bg-brand-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
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

      {/* Help / Guidance Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700 block">Attendance Policy:</span>
          Regular shift starts at 08:30 AM. Check-ins after 09:15 AM are categorized as Late Arrivals. Overtime is automatically logged for working hours exceeding the standard 8-hour shift.
        </div>
      </div>
    </div>
  );
};
