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
  User,
  Search,
  Filter,
  Check,
  X,
  Eye,
} from 'lucide-react';

export const ManagerLeaveManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, [filterStatus, filterDepartment, filterYear]);

  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterDepartment !== 'all') params.department = filterDepartment;
      if (filterYear) params.year = filterYear;

      const res = await leaveRequestApi.getAllLeaveRequests(params);
      if (res.data.success) {
        setLeaveRequests(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
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
    request.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    try {
      const res = await leaveRequestApi.approveLeaveRequest(selectedRequest._id, { adminRemarks });
      if (res.data.success) {
        toast.success('Leave request approved');
        setShowApproveModal(false);
        setAdminRemarks('');
        setSelectedRequest(null);
        fetchLeaveRequests();
      }
    } catch (error) {
      toast.error('Failed to approve leave request');
    }
  };

  const handleReject = async () => {
    try {
      const res = await leaveRequestApi.rejectLeaveRequest(selectedRequest._id, { adminRemarks });
      if (res.data.success) {
        toast.success('Leave request rejected');
        setShowRejectModal(false);
        setAdminRemarks('');
        setSelectedRequest(null);
        fetchLeaveRequests();
      }
    } catch (error) {
      toast.error('Failed to reject leave request');
    }
  };

  const openApproveModal = (request: any) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const openRejectModal = (request: any) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const getStats = () => {
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
    return { pending, approved, rejected };
  };

  if (isLoading) {
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
            onClick={() => navigate('/manager/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">📅 Leave Management</h1>
            <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">⏳ Pending</p>
              <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">✅ Approved</p>
              <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">❌ Rejected</p>
              <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="pending">Pending</option>
              <option value="all">All Status</option>
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
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex-1 relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, or type..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">📋 LEAVE REQUESTS</h2>
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
                className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium text-slate-900">
                        {request.employee?.firstName} {request.employee?.lastName} ({request.employee?.employeeId})
                      </p>
                      <p className="text-sm text-slate-600">
                        {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} | {request.totalDays} Day{request.totalDays !== 1 ? 's' : ''} | {new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {request.leaveRequestId} | {request.employee?.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApproveModal(request)}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRejectModal(request)}
                          className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/manager/leave-request/${request._id}`)}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Approve Leave Request</h3>
            </div>
            <div className="mb-4 text-sm text-slate-600">
              <p><strong>Employee:</strong> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</p>
              <p><strong>Leave Type:</strong> {selectedRequest.leaveType}</p>
              <p><strong>Dates:</strong> {new Date(selectedRequest.fromDate).toLocaleDateString()} - {new Date(selectedRequest.toDate).toLocaleDateString()}</p>
              <p><strong>Days:</strong> {selectedRequest.totalDays}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Admin Remarks (Optional)</label>
              <textarea
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Add any remarks..."
                maxLength={500}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setAdminRemarks('');
                  setSelectedRequest(null);
                }}
                className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-6 h-6 text-rose-600" />
              <h3 className="text-lg font-bold text-slate-900">Reject Leave Request</h3>
            </div>
            <div className="mb-4 text-sm text-slate-600">
              <p><strong>Employee:</strong> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</p>
              <p><strong>Leave Type:</strong> {selectedRequest.leaveType}</p>
              <p><strong>Dates:</strong> {new Date(selectedRequest.fromDate).toLocaleDateString()} - {new Date(selectedRequest.toDate).toLocaleDateString()}</p>
              <p><strong>Days:</strong> {selectedRequest.totalDays}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason *</label>
              <textarea
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Enter reason for rejection..."
                maxLength={500}
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setAdminRemarks('');
                  setSelectedRequest(null);
                }}
                className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!adminRemarks.trim()}
                className="flex-1 py-2 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
