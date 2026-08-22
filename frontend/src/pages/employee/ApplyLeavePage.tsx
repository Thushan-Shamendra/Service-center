import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaveRequestApi } from '../../api/leaveRequestApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Upload,
  Save,
  AlertTriangle,
  Paperclip,
  Trash2,
} from 'lucide-react';

export const ApplyLeavePage: React.FC = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!requestId;

  const [leaveData, setLeaveData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    isHalfDay: false,
    halfDayType: '',
    reason: '',
    attachments: [] as Array<{ type: string; url: string; name: string }>,
  });

  useEffect(() => {
    fetchLeaveBalance();
    if (requestId) {
      fetchLeaveRequest();
    }
  }, [requestId]);

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

  const fetchLeaveRequest = async () => {
    try {
      const res = await leaveRequestApi.getLeaveRequestById(requestId);
      if (res.data.success) {
        const request = res.data.data;
        setLeaveData({
          leaveType: request.leaveType || '',
          fromDate: request.startDate ? new Date(request.startDate).toISOString().split('T')[0] : '',
          toDate: request.endDate ? new Date(request.endDate).toISOString().split('T')[0] : '',
          isHalfDay: request.isHalfDay || false,
          halfDayType: request.halfDayType || '',
          reason: request.reason || '',
          attachments: request.attachments || [],
        });
      }
    } catch (error) {
      toast.error('Failed to fetch leave request');
    }
  };

  const calculateTotalDays = () => {
    if (!leaveData.fromDate || !leaveData.toDate) return 0;
    
    const from = new Date(leaveData.fromDate);
    const to = new Date(leaveData.toDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return leaveData.isHalfDay ? 0.5 : diffDays;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setLeaveData(prev => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        ...files.map(file => ({
          type: file.type,
          url: URL.createObjectURL(file),
          name: file.name,
        })),
      ],
    }));
  };

  const handleRemoveAttachment = (index: number) => {
    setLeaveData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!leaveData.leaveType) {
      toast.error('Please select leave type');
      return;
    }

    if (!leaveData.fromDate || !leaveData.toDate) {
      toast.error('Please select from and to dates');
      return;
    }

    if (new Date(leaveData.toDate) < new Date(leaveData.fromDate)) {
      toast.error('To date must be after from date');
      return;
    }

    if (!leaveData.reason || leaveData.reason.length < 10) {
      toast.error('Please enter a reason (minimum 10 characters)');
      return;
    }

    const totalDays = calculateTotalDays();
    const availableBalance = leaveBalance?.[leaveData.leaveType]?.remaining || 0;

    if (totalDays > availableBalance) {
      toast.error(`Insufficient leave balance. Available: ${availableBalance} days`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        leaveType: leaveData.leaveType,
        fromDate: leaveData.fromDate,
        toDate: leaveData.toDate,
        isHalfDay: leaveData.isHalfDay,
        reason: leaveData.reason,
        attachments: leaveData.attachments,
      };

      // Only include halfDayType when it's actually a half-day request
      if (leaveData.isHalfDay && leaveData.halfDayType) {
        payload.halfDayType = leaveData.halfDayType;
      }

      if (isEditMode && requestId) {
        const res = await leaveRequestApi.updateLeaveRequest(requestId, payload);
        if (res.data.success) {
          toast.success('Leave request updated successfully');
          navigate(`/employee/leave-request/${requestId}`);
        }
      } else {
        const res = await leaveRequestApi.createLeaveRequest(payload);
        if (res.data.success) {
          toast.success('Leave request submitted successfully');
          navigate(`/employee/leave-request/${res.data.data._id}`);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLeaveTypeName = (type: string) => {
    const names: Record<string, string> = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      compensatory: 'Compensatory',
      emergency: 'Emergency Leave',
    };
    return names[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const totalDays = calculateTotalDays();
  const remainingAfterRequest = leaveBalance?.[leaveData.leaveType]?.remaining - totalDays || 0;

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
              {isEditMode ? '✏️ Edit Leave Request' : '📝 Apply for Leave'}
            </h1>
            <p className="text-sm text-slate-600">Welcome, {user?.firstName} {user?.lastName}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">
            {isEditMode ? '✏️ EDIT LEAVE REQUEST' : '📝 NEW LEAVE REQUEST'}
          </h2>
        </div>

        {/* Auto-filled fields */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Request ID:</span>
              <span className="ml-2 text-slate-900">{isEditMode ? 'Existing Request' : 'Auto Generated'}</span>
            </div>
            <div>
              <span className="text-slate-500">Employee Name:</span>
              <span className="ml-2 text-slate-900">{user?.firstName} {user?.lastName}</span>
            </div>
            <div>
              <span className="text-slate-500">Employee ID:</span>
              <span className="ml-2 text-slate-900">{user?.employeeId || 'Auto Filled'}</span>
            </div>
            <div>
              <span className="text-slate-500">Department:</span>
              <span className="ml-2 text-slate-900">{(user as any)?.department || 'Auto Filled'}</span>
            </div>
          </div>
        </div>

        {/* Leave Details */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            📅 LEAVE DETAILS
          </h3>

          {/* Leave Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
            <select
              value={leaveData.leaveType}
              onChange={(e) => setLeaveData(prev => ({ ...prev, leaveType: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Select Leave Type</option>
              <option value="annual">Annual Leave ({leaveBalance?.annual?.remaining || 0} Remaining)</option>
              <option value="sick">Sick Leave ({leaveBalance?.sick?.remaining || 0} Remaining)</option>
              <option value="casual">Casual Leave ({leaveBalance?.casual?.remaining || 0} Remaining)</option>
              <option value="compensatory">Compensatory ({leaveBalance?.compensatory?.remaining || 0} Remaining)</option>
              <option value="emergency">Emergency Leave ({leaveBalance?.emergency?.remaining || 0} Remaining)</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
              <input
                type="date"
                value={leaveData.fromDate}
                onChange={(e) => setLeaveData(prev => ({ ...prev, fromDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
              <input
                type="date"
                value={leaveData.toDate}
                onChange={(e) => setLeaveData(prev => ({ ...prev, toDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Total Days */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Total Days</label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-900 font-medium">{totalDays} Days (Auto Calculated)</span>
            </div>
          </div>

          {/* Half Day */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Is this a half-day?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!leaveData.isHalfDay}
                  onChange={() => setLeaveData(prev => ({ ...prev, isHalfDay: false, halfDayType: '' }))}
                  className="w-4 h-4 text-brand-600"
                />
                <span className="text-sm text-slate-700">Full Day</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={leaveData.isHalfDay && leaveData.halfDayType === 'morning'}
                  onChange={() => setLeaveData(prev => ({ ...prev, isHalfDay: true, halfDayType: 'morning' }))}
                  className="w-4 h-4 text-brand-600"
                />
                <span className="text-sm text-slate-700">Half Day (Morning)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={leaveData.isHalfDay && leaveData.halfDayType === 'afternoon'}
                  onChange={() => setLeaveData(prev => ({ ...prev, isHalfDay: true, halfDayType: 'afternoon' }))}
                  className="w-4 h-4 text-brand-600"
                />
                <span className="text-sm text-slate-700">Half Day (Afternoon)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Leave Reason */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            📝 LEAVE REASON
          </h3>
          <textarea
            value={leaveData.reason}
            onChange={(e) => setLeaveData(prev => ({ ...prev, reason: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="Enter reason for leave request..."
            maxLength={500}
          />
          <p className="text-xs text-slate-400 mt-1">{leaveData.reason.length}/500 characters</p>
        </div>

        {/* Attachments */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            📎 ATTACHMENTS (Optional)
          </h3>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-600 mb-2">Upload supporting documents</p>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-bold">
                <Upload className="w-4 h-4" />
                Upload Document
              </span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          {leaveData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {leaveData.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{attachment.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Balance Warning */}
        {leaveData.leaveType && totalDays > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">⚠️ LEAVE BALANCE AFTER REQUEST</h3>
            </div>
            <p className="text-sm text-amber-700">
              {getLeaveTypeName(leaveData.leaveType)}: {leaveBalance?.[leaveData.leaveType]?.remaining || 0} → {remainingAfterRequest} Remaining (After Request)
            </p>
            <p className="text-xs text-amber-600 mt-1">⚠️ You will have {remainingAfterRequest} {leaveData.leaveType} leaves left</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/employee/leave-management')}
            className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? '💾 UPDATE REQUEST' : '📤 SUBMIT REQUEST'}
          </button>
        </div>
      </div>
    </div>
  );
};