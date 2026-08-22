import React, { useEffect, useState } from 'react';
import { hrApi } from '../../api/hrApi';
import { userApi } from '../../api/userApi';
import { formatLKR } from '../../utils/formatters';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  Eye,
  FileText,
  Calendar,
  User,
  X
} from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle
};

interface AdvanceStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export const SalaryAdvancePage: React.FC = () => {
  const [advances, setAdvances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdvanceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  
  // Create Advance modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employeeId: '',
    requestedAmount: 0,
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [selectedEmployeeSalary, setSelectedEmployeeSalary] = useState<number>(0);
  
  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const fetchAdvances = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (activeStatFilter) params.status = activeStatFilter;
      
      const res = await hrApi.getSalaryAdvances(params);
      if (res.success) setAdvances(res.data);
    } catch (error) {
      console.error('Failed to load salary advances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await hrApi.getAdvanceStats();
      if (res.success) setStats(res.data);
    } catch (error) {
      console.error('Failed to load advance stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      const [employeesRes, managersRes] = await Promise.all([
        userApi.getUsers({ role: 'employee', status: 'active', limit: 100 }),
        userApi.getUsers({ role: 'manager', status: 'active', limit: 100 })
      ]);
      
      const allStaff = [
        ...(employeesRes.success ? employeesRes.data : []),
        ...(managersRes.success ? managersRes.data : [])
      ];
      
      const validStaff = allStaff
        .map(staff => {
          const profile = staff.profile || staff.employeeDetails;
          if (!profile) return null;
          return {
            ...staff,
            profile,
            displayId: staff.role === 'manager' 
              ? (profile.managerId || profile.employeeId || `MGR-${staff._id.slice(-4)}`)
              : (profile.employeeId || `EMP-${staff._id.slice(-4)}`),
            employeeId: profile._id
          };
        })
        .filter(Boolean);
      
      setStaffMembers(validStaff);
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
    fetchStats();
    fetchStaffMembers();
  }, [statusFilter, activeStatFilter]);

  const handleCreateAdvance = async () => {
    setSubmitError('');
    setValidationError('');
    setIsSubmitting(true);
    
    console.log('Submit button clicked');
    console.log('Form data:', advanceForm);
    console.log('Selected employee salary:', selectedEmployeeSalary);
    
    try {
      if (!advanceForm.employeeId) {
        console.log('Validation failed: No employee selected');
        setSubmitError('Please select a staff member');
        setIsSubmitting(false);
        return;
      }
      
      if (!advanceForm.requestedAmount || advanceForm.requestedAmount <= 0) {
        console.log('Validation failed: Invalid amount');
        setValidationError('Requested amount must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      
      if (!advanceForm.reason.trim()) {
        console.log('Validation failed: No reason provided');
        setSubmitError('Please provide a reason for the advance');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Calling API with:', {
        employeeId: advanceForm.employeeId,
        requestedAmount: advanceForm.requestedAmount,
        reason: advanceForm.reason,
      });
      
      console.log('Selected staff member:', staffMembers.find(s => s.employeeId === advanceForm.employeeId));
      
      const res = await hrApi.createSalaryAdvance({
        employeeId: advanceForm.employeeId,
        requestedAmount: advanceForm.requestedAmount,
        reason: advanceForm.reason,
      });
      
      console.log('API response:', res);
      
      if (res.success) {
        console.log('Advance created successfully');
        setShowCreateModal(false);
        fetchAdvances();
        fetchStats();
        setAdvanceForm({
          employeeId: '',
          requestedAmount: 0,
          reason: '',
        });
        setSelectedEmployeeSalary(0);
      } else {
        console.log('API returned error:', res.message);
        setSubmitError(res.message || 'Failed to create salary advance');
        if (res.maxAllowed) {
          setValidationError(`Maximum allowed amount: ${formatLKR(res.maxAllowed)}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to create salary advance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while creating salary advance';
      setSubmitError(errorMessage);
      console.error('Error details:', {
        response: error.response?.data,
        message: error.message,
        status: error.response?.status
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = staffMembers.find(s => s.employeeId === employeeId);
    if (employee) {
      setSelectedEmployeeSalary(employee.profile?.basicSalary || 0);
      setAdvanceForm({ ...advanceForm, employeeId });
    }
  };

  const handleReviewAdvance = (advance: any) => {
    setSelectedAdvance(advance);
    setShowReviewModal(true);
    setRejectionReason('');
  };

  const handleApproveAdvance = async () => {
    if (!confirm(`Approve salary advance ${selectedAdvance.advanceId} for ${formatLKR(selectedAdvance.requestedAmount)}?`)) return;
    
    setIsProcessing(true);
    try {
      const res = await hrApi.updateAdvanceStatus(selectedAdvance._id, {
        status: 'approved'
      });
      
      if (res.success) {
        setShowReviewModal(false);
        fetchAdvances();
        fetchStats();
        setSelectedAdvance(null);
      }
    } catch (error) {
      console.error('Failed to approve advance:', error);
      alert('Failed to approve advance');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAdvance = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await hrApi.updateAdvanceStatus(selectedAdvance._id, {
        status: 'rejected',
        rejectionReason
      });
      
      if (res.success) {
        setShowReviewModal(false);
        fetchAdvances();
        fetchStats();
        setSelectedAdvance(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Failed to reject advance:', error);
      alert('Failed to reject advance');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatCardClick = (filter: string | null) => {
    setActiveStatFilter(filter);
    setStatusFilter('');
  };

  // Filter advances
  const filteredAdvances = advances.filter(advance => {
    const matchesSearch = !searchTerm || 
      advance.employee?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advance.employee?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      advance.advanceId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const columns: Column<any>[] = [
    {
      header: 'Advance ID',
      accessor: (item) => (
        <span className="text-xs font-mono text-slate-500">{item.advanceId}</span>
      ),
    },
    {
      header: 'Employee',
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
      header: 'Salary',
      accessor: (item) => <span className="text-xs font-semibold text-slate-700">{formatLKR(item.currentSalary)}</span>,
    },
    {
      header: 'Requested',
      accessor: (item) => <span className="text-xs font-bold text-slate-800">{formatLKR(item.requestedAmount)}</span>,
    },
    {
      header: 'Status',
      accessor: (item) => {
        const StatusIcon = STATUS_ICONS[item.status] || Clock;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Action',
      accessor: (item) => (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => handleReviewAdvance(item)}
            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            title="Review"
          >
            <Eye className="w-3 h-3" />
            Review
          </button>
          {item.status === 'pending' && (
            <button
              onClick={() => handleReviewAdvance(item)}
              className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
              title="View Details"
            >
              <FileText className="w-3 h-3" />
              Details
            </button>
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Salary Advances</h2>
          <p className="text-sm text-slate-500">
            Manage employee and manager salary advance requests
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Advance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => handleStatCardClick(null)}
          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer transition-all ${activeStatFilter === null ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">Total</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-700">{stats?.total || 0}</p>
        </div>
        <div 
          onClick={() => handleStatCardClick('pending')}
          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer transition-all ${activeStatFilter === 'pending' ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-bold text-slate-900">Pending</span>
          </div>
          <p className="text-2xl font-extrabold text-yellow-700">{stats?.pending || 0}</p>
        </div>
        <div 
          onClick={() => handleStatCardClick('approved')}
          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer transition-all ${activeStatFilter === 'approved' ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-slate-900">Approved</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{stats?.approved || 0}</p>
        </div>
        <div 
          onClick={() => handleStatCardClick('rejected')}
          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer transition-all ${activeStatFilter === 'rejected' ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-bold text-slate-900">Rejected</span>
          </div>
          <p className="text-2xl font-extrabold text-red-700">{stats?.rejected || 0}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee / Advance ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setActiveStatFilter(null); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredAdvances}
          isLoading={isLoading}
          emptyTitle="No Salary Advance Requests"
          emptyDescription="Salary advance requests will appear here as employees submit them."
        />
      </div>

      {/* Create Advance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">New Salary Advance</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <p className="text-sm text-slate-500">Create a salary advance request</p>

              {/* Advance ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Advance ID</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  <span>ADV-*****</span>
                  <span className="text-slate-400">🔒</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto Generated</p>
              </div>

              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee / Manager *</label>
                <select
                  value={advanceForm.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                  disabled={isLoadingStaff}
                >
                  <option value="">{isLoadingStaff ? 'Loading staff...' : 'Select Staff ▼'}</option>
                  {staffMembers.map((staff) => (
                    <option key={staff._id} value={staff.employeeId}>
                      {staff.displayId} — {staff.firstName} {staff.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Salary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Salary</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <span className="font-bold">{formatLKR(selectedEmployeeSalary)}</span>
                  <span className="text-slate-400">🔒</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto Filled from Employee Record</p>
              </div>

              {/* Requested Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Requested Amount *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={advanceForm.requestedAmount || ''}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, requestedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">LKR</span>
                </div>
                {validationError && (
                  <p className="text-xs text-red-600 mt-1">{validationError}</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason *</label>
                <textarea
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="Enter reason for salary advance..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  rows={3}
                />
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Approval Status</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="font-bold">Pending</span>
                  <span className="text-slate-400">🔒</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAdvance}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
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

      {/* Review Modal */}
      {showReviewModal && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Salary Advance Request</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-slate-500">{selectedAdvance.advanceId}</span>
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-700">Pending Approval</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Staff</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  {selectedAdvance.employee?.employeeId || selectedAdvance.employee?.managerId} — {selectedAdvance.employee?.user?.firstName} {selectedAdvance.employee?.user?.lastName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Salary</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  {formatLKR(selectedAdvance.currentSalary)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Requested Amount</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  {formatLKR(selectedAdvance.requestedAmount)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  {selectedAdvance.reason}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Requested Date</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  {new Date(selectedAdvance.requestedDate).toLocaleDateString('en-GB')}
                </div>
              </div>

              {selectedAdvance.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      if (confirm('Reject this salary advance request?')) {
                        setRejectionReason('');
                        // Show rejection input
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleApproveAdvance}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              )}

              {rejectionReason && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    rows={2}
                  />
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setRejectionReason('')}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectAdvance}
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
