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
  Plus,
  FileText,
  User,
} from 'lucide-react';

export const LeaveManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaveBalance();
    fetchLeaveRequests();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      const res = await leaveRequestApi.getLeaveBalance();
      if (res.data.success) {
        setLeaveBalance(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch leave balance');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await leaveRequestApi.getMyLeaveRequests();
      if (res.data.success) {
        setLeaveRequests(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch leave requests');
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

  const getTotalStats = () => {
    const balance = (leaveBalance || {}) as Record<string, { total: number; used: number; remaining: number }>;
    const total = Object.values(balance).reduce((sum: number, type) => sum + (type?.total || 0), 0);
    const used = Object.values(balance).reduce((sum: number, type) => sum + (type?.used || 0), 0);
    const remaining = Object.values(balance).reduce((sum: number, type) => sum + (type?.remaining || 0), 0);
    return { total, used, remaining };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employee/dashboard')}
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

      {/* Leave Summary Cards */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">📊 LEAVE SUMMARY</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">📅 TOTAL LEAVES</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">🟦 Annual</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">✅ USED LEAVES</p>
                <p className="text-3xl font-bold text-slate-900">{stats.used}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">🟩 Approved</p>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">✅ REMAINING</p>
                <p className="text-3xl font-bold text-slate-900">{stats.remaining}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">🟢 Available</p>
          </div>
        </div>

        {/* Leave Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            ⚠️ LEAVE BREAKDOWN BY TYPE
          </h3>
          <div className="space-y-2">
            {leaveBalance && Object.entries(leaveBalance).map(([type, data]: [string, any]) => (
              <div key={type} className="flex justify-between items-center text-sm">
                <span className="text-slate-700 capitalize">{type} Leave:</span>
                <span className="font-medium text-slate-900">
                  {data.used} Used / {data.remaining} Remaining
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">📋 RECENT LEAVE REQUESTS</h2>
          </div>
          <button
            onClick={() => navigate('/employee/leave-history')}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            View All
          </button>
        </div>

        {leaveRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No leave requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaveRequests.slice(0, 5).map((request) => (
              <div
                key={request._id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer"
                onClick={() => navigate(`/employee/leave-request/${request._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        Type: {request.leaveType} ({request.totalDays} Days)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/employee/apply-leave')}
          className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          APPLY FOR LEAVE
        </button>
        <button
          onClick={() => navigate('/employee/leave-history')}
          className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" />
          VIEW ALL REQUESTS
        </button>
      </div>
    </div>
  );
};
