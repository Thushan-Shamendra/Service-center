import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaveRequestApi } from '../../api/leaveRequestApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw,
  Edit,
  Trash2,
} from 'lucide-react';

export const LeaveRequestDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const [leaveRequest, setLeaveRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (requestId) {
      fetchLeaveRequest();
    }
  }, [requestId]);

  const fetchLeaveRequest = async () => {
    try {
      const res = await leaveRequestApi.getLeaveRequestById(requestId);
      if (res.data.success) {
        setLeaveRequest(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch leave request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    
    try {
      const res = await leaveRequestApi.cancelLeaveRequest(requestId);
      if (res.data.success) {
        toast.success('Leave request cancelled');
        fetchLeaveRequest();
      }
    } catch (error) {
      toast.error('Failed to cancel leave request');
    }
  };

  const handleEditRequest = () => {
    navigate(`/employee/edit-leave/${requestId}`);
  };

  const handleApplyAgain = () => {
    navigate('/employee/apply-leave');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-100 shadow-card">
        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">Leave Request Not Found</h3>
        <button
          onClick={() => navigate('/employee/leave-management')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leave Management
        </button>
      </div>
    );
  }

  const isPending = leaveRequest.status === 'pending';
  const isApproved = leaveRequest.status === 'approved';
  const isRejected = leaveRequest.status === 'rejected';

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
            <h1 className="text-2xl font-bold text-slate-900">
              {isPending && '⏳ Leave Request Pending'}
              {isApproved && '✅ Leave Approved'}
              {isRejected && '❌ Leave Rejected'}
            </h1>
            <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 ${
          isPending ? 'bg-amber-50 border border-amber-200' :
          isApproved ? 'bg-emerald-50 border border-emerald-200' :
          'bg-rose-50 border border-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {isPending && <Clock className="w-6 h-6 text-amber-600" />}
            {isApproved && <CheckCircle className="w-6 h-6 text-emerald-600" />}
            {isRejected && <XCircle className="w-6 h-6 text-rose-600" />}
            <div>
              <h2 className={`font-bold ${
                isPending ? 'text-amber-800' :
                isApproved ? 'text-emerald-800' :
                'text-rose-800'
              }`}>
                {isPending && 'LEAVE REQUEST SUBMITTED TO ADMIN'}
                {isApproved && 'LEAVE REQUEST APPROVED'}
                {isRejected && 'LEAVE REQUEST REJECTED'}
              </h2>
              <p className={`text-sm ${
                isPending ? 'text-amber-700' :
                isApproved ? 'text-emerald-700' :
                'text-rose-700'
              }`}>
                {isPending && 'Your leave request has been sent to Admin for approval'}
                {isApproved && 'Your leave request has been APPROVED by Admin'}
                {isRejected && 'Your leave request has been REJECTED by Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Request ID:</span>
              <span className="ml-2 font-medium text-slate-900">{leaveRequest.leaveRequestId}</span>
            </div>
            <div>
              <span className="text-slate-500">Request Date:</span>
              <span className="ml-2 font-medium text-slate-900">{new Date(leaveRequest.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Leave Type:</span>
              <span className="ml-2 font-medium text-slate-900 capitalize">{leaveRequest.leaveType}</span>
            </div>
            <div>
              <span className="text-slate-500">Leave Period:</span>
              <span className="ml-2 font-medium text-slate-900">
                {new Date(leaveRequest.startDate).toLocaleDateString()} to {new Date(leaveRequest.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Total Days:</span>
              <span className="ml-2 font-medium text-slate-900">{leaveRequest.totalDays} Days</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>
              <span className={`ml-2 font-medium ${
                isPending ? 'text-amber-600' :
                isApproved ? 'text-emerald-600' :
                'text-rose-600'
              }`}>
                {leaveRequest.status.toUpperCase()}
              </span>
            </div>
            {isApproved && (
              <>
                <div>
                  <span className="text-slate-500">Approved By:</span>
                  <span className="ml-2 font-medium text-slate-900">{leaveRequest.approvedBy?.firstName} {leaveRequest.approvedBy?.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Approved On:</span>
                  <span className="ml-2 font-medium text-slate-900">{new Date(leaveRequest.approvedAt).toLocaleString()}</span>
                </div>
              </>
            )}
            {isRejected && (
              <>
                <div>
                  <span className="text-slate-500">Rejected By:</span>
                  <span className="ml-2 font-medium text-slate-900">{leaveRequest.rejectedBy?.firstName} {leaveRequest.rejectedBy?.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Rejected On:</span>
                  <span className="ml-2 font-medium text-slate-900">{new Date(leaveRequest.rejectedAt).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Request Summary */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            📋 REQUEST SUMMARY
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Employee:</span>
              <span className="ml-2 text-slate-900">{leaveRequest.employee?.firstName} {leaveRequest.employee?.lastName} ({leaveRequest.employee?.employeeId})</span>
            </div>
            <div>
              <span className="text-slate-500">Leave Reason:</span>
              <span className="ml-2 text-slate-900">{leaveRequest.reason}</span>
            </div>
            {leaveRequest.attachments && leaveRequest.attachments.length > 0 && (
              <div>
                <span className="text-slate-500">Attachments:</span>
                <div className="ml-2 mt-1 space-y-1">
                  {leaveRequest.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="text-slate-900">{attachment.name}</div>
                  ))}
                </div>
              </div>
            )}
            {leaveRequest.adminRemarks && (
              <div>
                <span className="text-slate-500">Admin Remarks:</span>
                <span className="ml-2 text-slate-900">{leaveRequest.adminRemarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Leave Balance */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            📊 LEAVE BALANCE
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            {leaveRequest.leaveBalance && Object.entries(leaveRequest.leaveBalance).map(([type, data]: [string, any]) => (
              <div key={type} className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-700 capitalize">{type} Leave Remaining:</span>
                <span className="font-medium text-slate-900">{data.remaining} Days</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {isPending && (
            <>
              <button
                onClick={() => fetchLeaveRequest()}
                className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Check Status
              </button>
              <button
                onClick={handleEditRequest}
                className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Edit Request
              </button>
              <button
                onClick={handleCancelRequest}
                className="flex-1 py-3 border border-rose-200 text-rose-700 font-bold rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Cancel
              </button>
            </>
          )}
          {isApproved && (
            <>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print
              </button>
              <button
                onClick={() => navigate('/employee/leave-management')}
                className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
            </>
          )}
          {isRejected && (
            <>
              <button
                onClick={handleApplyAgain}
                className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Apply Again
              </button>
              <button
                onClick={() => navigate('/employee/leave-management')}
                className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
