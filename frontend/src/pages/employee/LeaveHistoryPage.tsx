import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveRequestApi } from '../../api/leaveRequestApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Search,
  Filter,
} from 'lucide-react';

export const LeaveHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Check user permissions
  useEffect(() => {
    const checkPermissions = () => {
      // Only employees and managers can view their own leave history
      const allowedRoles = ['employee', 'manager'];
      const hasRequiredRole = user?.role && allowedRoles.includes(user.role);
      
      if (!hasRequiredRole) {
        console.error('User does not have permission to view leave history');
        toast.error('You do not have permission to view leave history');
        navigate('/dashboard');
        return;
      }
      
      setHasPermission(true);
      setIsCheckingPermission(false);
    };

    checkPermissions();
  }, [user, navigate]);

  useEffect(() => {
    if (hasPermission) {
      fetchLeaveRequests(true); // Pass true for filter changes
    }
  }, [filterStatus, filterYear, hasPermission]);

  const fetchLeaveRequests = async (isFilterChange = false) => {
    if (isFilterChange) {
      setIsFiltering(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterYear) params.year = filterYear;

      const res = await leaveRequestApi.getMyLeaveRequests(params);
      if (res.data?.success) {
        setLeaveRequests(res.data.data || []);
      } else {
        console.error('Leave requests API returned unsuccessful response:', res.data?.message);
        toast.error(res.data?.message || 'Failed to fetch leave history');
        setLeaveRequests([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch leave history:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch leave history';
      toast.error(errorMessage);
      setLeaveRequests([]);
    } finally {
      if (isFilterChange) {
        setIsFiltering(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-600 bg-amber-100';
      case 'approved': return 'text-emerald-600 bg-emerald-100';
      case 'rejected': return 'text-rose-600 bg-rose-100';
      case 'cancelled': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRequests = leaveRequests.filter(request =>
    request.leaveRequestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStats = () => {
    const total = leaveRequests.length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
    return { total, approved, rejected };
  };

  if (isCheckingPermission || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employee/leave-management')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">📋 Leave History</h1>
            <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">📊 LEAVE SUMMARY</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">📅 TOTAL</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">✅ APPROVED</p>
                <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">❌ REJECTED</p>
                <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              disabled={isFiltering}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              disabled={isFiltering}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or type..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
              disabled={isFiltering}
            />
          </div>

          {isFiltering && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
              <span>Filtering...</span>
            </div>
          )}
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">📋 ALL LEAVE REQUESTS</h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request._id}
                onClick={() => navigate(`/employee/leave-request/${request._id}`)}
                className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} | {request.totalDays} Day{request.totalDays !== 1 ? 's' : ''} | {request.leaveRequestId}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
