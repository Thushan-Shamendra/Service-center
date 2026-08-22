import React, { useEffect, useState } from 'react';
import { hrApi } from '../../api/hrApi';
import { userApi } from '../../api/userApi';
import { formatLKR } from '../../utils/formatters';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  Building2, 
  DollarSign, 
  ClipboardList, 
  Plus, 
  Search, 
  Eye,
  FileText,
  Calendar,
  User,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Edit
} from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-slate-100 text-slate-800',
  rejected: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  active: CheckCircle,
  completed: CheckCircle,
  rejected: XCircle
};

interface LoanStats {
  activeLoans: number;
  totalOutstanding: number;
  pendingLoans: number;
  completedLoans: number;
  monthlyRepayments: number;
}

export const LoanPage: React.FC = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffTypeFilter, setStaffTypeFilter] = useState('');
  
  // Create Loan modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [loanForm, setLoanForm] = useState({
    employeeId: '',
    loanAmount: 0,
    interestRate: 10,
    installments: 12,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [selectedEmployeeSalary, setSelectedEmployeeSalary] = useState<number>(0);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [existingLoanWarning, setExistingLoanWarning] = useState<any>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  
  // Loan Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showRepaymentHistory, setShowRepaymentHistory] = useState(false);
  
  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (staffTypeFilter) params.staffType = staffTypeFilter;
      
      const res = await hrApi.getLoans(params);
      if (res.success) setLoans(res.data);
    } catch (error) {
      console.error('Failed to load loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await hrApi.getLoanStats();
      if (res.success) setStats(res.data);
    } catch (error) {
      console.error('Failed to load loan stats:', error);
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
    fetchLoans();
    fetchStats();
    fetchStaffMembers();
  }, [statusFilter, staffTypeFilter]);

  const calculateLoanSummary = () => {
    const { loanAmount, interestRate, installments } = loanForm;
    const interestAmount = Math.round(loanAmount * (interestRate / 100));
    const totalRepayable = loanAmount + interestAmount;
    const monthlyDeduction = Math.round(totalRepayable / installments);
    
    return {
      interestAmount,
      totalRepayable,
      monthlyDeduction,
      outstandingBalance: totalRepayable
    };
  };

  const summary = calculateLoanSummary();

  const handleCreateLoan = async () => {
    setSubmitError('');
    setValidationError('');
    setIsSubmitting(true);
    
    try {
      if (!loanForm.employeeId) {
        setSubmitError('Please select a staff member');
        setIsSubmitting(false);
        return;
      }
      
      if (!loanForm.loanAmount || loanForm.loanAmount <= 0) {
        setValidationError('Loan amount must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      
      if (loanForm.interestRate < 0) {
        setValidationError('Interest rate cannot be negative');
        setIsSubmitting(false);
        return;
      }
      
      if (!loanForm.installments || loanForm.installments <= 0) {
        setValidationError('Installments must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      
      let res;
      if (editingLoanId) {
        // Update existing loan
        res = await hrApi.updateLoan(editingLoanId, {
          loanAmount: loanForm.loanAmount,
          interestRate: loanForm.interestRate,
          installments: loanForm.installments,
        });
      } else {
        // Create new loan
        res = await hrApi.createLoan({
          employeeId: loanForm.employeeId,
          loanAmount: loanForm.loanAmount,
          interestRate: loanForm.interestRate,
          installments: loanForm.installments,
          status: 'pending'
        });
      }
      
      if (res.success) {
        setShowCreateModal(false);
        fetchLoans();
        fetchStats();
        setLoanForm({
          employeeId: '',
          loanAmount: 0,
          interestRate: 10,
          installments: 12,
        });
        setSelectedEmployeeSalary(0);
        setSelectedStaffId('');
        setExistingLoanWarning(null);
        setEditingLoanId(null);
      } else {
        setSubmitError(res.message || `Failed to ${editingLoanId ? 'update' : 'create'} loan`);
        if (res.existingLoan) {
          setExistingLoanWarning({ loanId: res.existingLoan, outstandingBalance: res.outstandingBalance });
        }
      }
    } catch (error: any) {
      console.error(`Failed to ${editingLoanId ? 'update' : 'create'} loan:`, error);
      setSubmitError(error.message || `An error occurred while ${editingLoanId ? 'updating' : 'creating'} loan`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = staffMembers.find(s => s.employeeId === employeeId);
    if (employee) {
      setSelectedEmployeeSalary(employee.profile?.basicSalary || 0);
      setSelectedStaffId(employee.displayId || '');
      setLoanForm({ ...loanForm, employeeId });
      setExistingLoanWarning(null);
    }
  };

  const handleViewLoan = (loan: any) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
    setShowRepaymentHistory(false);
  };

  const handleEditLoan = (loan: any) => {
    setShowDetailsModal(false);
    setShowCreateModal(true);
    
    // Populate form with existing loan data
    setLoanForm({
      employeeId: loan.employee._id,
      loanAmount: loan.loanAmount,
      interestRate: loan.interestRate,
      installments: loan.installments,
    });
    
    setSelectedEmployeeSalary(loan.currentSalary);
    setSelectedStaffId(loan.staffId);
    setExistingLoanWarning(null);
  };

  const handleApproveLoan = async (loan: any) => {
    if (!confirm(`Approve loan ${loan.loanId} for ${formatLKR(loan.loanAmount)}?`)) return;
    
    try {
      const res = await hrApi.updateLoanStatus(loan._id, { status: 'approved' });
      if (res.success) {
        fetchLoans();
        fetchStats();
        alert('Loan approved successfully');
      }
    } catch (error) {
      console.error('Failed to approve loan:', error);
      alert('Failed to approve loan');
    }
  };

  const handleRejectLoan = async (loan: any) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
      const res = await hrApi.updateLoanStatus(loan._id, { status: 'rejected', rejectionReason: reason });
      if (res.success) {
        fetchLoans();
        fetchStats();
        alert('Loan rejected successfully');
      }
    } catch (error) {
      console.error('Failed to reject loan:', error);
      alert('Failed to reject loan');
    }
  };

  // Filter loans
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = !searchTerm || 
      loan.employee?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.employee?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const columns: Column<any>[] = [
    {
      header: 'Loan ID',
      accessor: (item) => (
        <span className="text-xs font-mono text-slate-500">{item.loanId}</span>
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
            {item.staffId}
          </div>
        </div>
      ),
    },
    {
      header: 'Loan Amount',
      accessor: (item) => <span className="text-xs font-bold text-slate-800">{formatLKR(item.loanAmount)}</span>,
    },
    {
      header: 'Outstanding',
      accessor: (item) => <span className="text-xs font-bold text-slate-700">{formatLKR(item.outstandingBalance)}</span>,
    },
    {
      header: 'Installment',
      accessor: (item) => <span className="text-xs font-semibold text-slate-600">{formatLKR(item.monthlyDeduction)}</span>,
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
            onClick={() => handleViewLoan(item)}
            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            title="View Details"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          {item.status === 'pending' && (
            <button
              onClick={() => handleEditLoan(item)}
              className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
              title="Edit Loan"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          )}
          {item.status === 'pending' && (
            <button
              onClick={() => handleApproveLoan(item)}
              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
              title="Approve Loan"
            >
              <CheckCircle className="w-3 h-3" />
              Approve
            </button>
          )}
          {item.status === 'pending' && (
            <button
              onClick={() => handleRejectLoan(item)}
              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
              title="Reject Loan"
            >
              <XCircle className="w-3 h-3" />
              Reject
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee & Manager Loans</h2>
          <p className="text-sm text-slate-500">
            Manage staff loans, repayments and outstanding balances
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Loan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">Active Loans</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-700">{stats?.activeLoans || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">Outstanding</span>
          </div>
          <p className="text-lg font-extrabold text-slate-700">{formatLKR(stats?.totalOutstanding || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">Pending</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-700">{stats?.pendingLoans || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">This Month</span>
          </div>
          <p className="text-lg font-extrabold text-slate-700">{formatLKR(stats?.monthlyRepayments || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-bold text-slate-900">Completed</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-700">{stats?.completedLoans || 0}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Loan / Staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={staffTypeFilter}
            onChange={(e) => setStaffTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">All Staff</option>
            <option value="employee">Employees</option>
            <option value="manager">Managers</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <DataTable
          columns={columns}
          data={filteredLoans}
          isLoading={isLoading}
          emptyTitle="No Loan Records"
          emptyDescription="Loan records will appear here as employees take loans."
        />
      </div>

      {/* Create Loan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLoanId ? 'Edit Employee / Manager Loan' : 'Create Employee / Manager Loan'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingLoanId(null);
                  setLoanForm({ employeeId: '', loanAmount: 0, interestRate: 10, installments: 12 });
                  setSelectedEmployeeSalary(0);
                  setSelectedStaffId('');
                  setExistingLoanWarning(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <p className="text-sm text-slate-500">Create a new staff loan and repayment schedule</p>

              {/* Loan ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loan ID</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  <span>LN-*****</span>
                  <span className="text-slate-400">🔒</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto Generated</p>
              </div>

              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee / Manager *</label>
                <select
                  value={loanForm.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                  disabled={isLoadingStaff}
                >
                  <option value="">{isLoadingStaff ? 'Loading staff...' : 'Select Staff ▼'}</option>
                  {staffMembers.map((staff) => (
                    <option key={staff._id} value={staff.employeeId}>
                      {staff.displayId} — {staff.firstName} {staff.lastName} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Staff ID</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <span>{selectedStaffId}</span>
                  <span className="text-slate-400">🔒</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
              </div>

              {/* Current Salary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Salary</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <span className="font-bold">{formatLKR(selectedEmployeeSalary)}</span>
                  <span className="text-slate-400">🔒</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
              </div>

              {/* Existing Loan Warning */}
              {existingLoanWarning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-bold">Existing Active Loan</span>
                  </div>
                  <p>Outstanding Balance: {formatLKR(existingLoanWarning.outstandingBalance)}</p>
                </div>
              )}

              {/* Loan Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loan Amount *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={loanForm.loanAmount || ''}
                    onChange={(e) => setLoanForm({ ...loanForm, loanAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">LKR</span>
                </div>
                {validationError && (
                  <p className="text-xs text-red-600 mt-1">{validationError}</p>
                )}
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Interest Rate *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={loanForm.interestRate}
                    onChange={(e) => setLoanForm({ ...loanForm, interestRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Simple Fixed Interest</p>
              </div>

              {/* Installments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Installments *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={loanForm.installments}
                    onChange={(e) => setLoanForm({ ...loanForm, installments: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Months</span>
                </div>
              </div>

              {/* Repayment Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-700 mb-3">💰 Loan Calculation</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Principal Amount</span>
                    <span className="font-mono">{formatLKR(loanForm.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Interest ({loanForm.interestRate}%)</span>
                    <span className="font-mono">{formatLKR(summary.interestAmount)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                    <span className="text-slate-600 font-bold">Total Repayable</span>
                    <span className="font-bold text-slate-800">{formatLKR(summary.totalRepayable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Installments</span>
                    <span className="font-mono">{loanForm.installments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Monthly Deduction</span>
                    <span className="font-bold text-brand-600">{formatLKR(summary.monthlyDeduction)}</span>
                  </div>
                </div>
              </div>

              {/* Outstanding Balance */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Outstanding Balance</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <span className="font-bold">{formatLKR(summary.outstandingBalance)}</span>
                  <span className="text-slate-400">🔒</span>
                </div>
              </div>

              {/* Loan Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loan Status</label>
                <select
                  value="pending"
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50"
                >
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setLoanForm({ employeeId: '', loanAmount: 0, interestRate: 10, installments: 12 });
                    setSelectedEmployeeSalary(0);
                    setSelectedStaffId('');
                    setExistingLoanWarning(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLoan}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : (editingLoanId ? 'Update Loan' : 'Save Loan')}
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

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Loan Details — {selectedLoan.loanId}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              {!showRepaymentHistory ? (
                <>
                  {/* Employee Info */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {selectedLoan.employee?.user?.firstName} {selectedLoan.employee?.user?.lastName}
                    </div>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 mt-1">
                      {selectedLoan.staffId}
                    </div>
                  </div>

                  {/* Current Salary */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Salary</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {formatLKR(selectedLoan.currentSalary)}
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Loan Amount</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        {formatLKR(selectedLoan.loanAmount)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Interest Rate</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        {selectedLoan.interestRate}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Interest Amount</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {formatLKR(selectedLoan.interestAmount)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Repayable</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      {formatLKR(selectedLoan.totalRepayable)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Monthly Deduction</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        {formatLKR(selectedLoan.monthlyDeduction)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Installments</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        {selectedLoan.installments}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Paid Amount</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        {formatLKR(selectedLoan.paidAmount)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Outstanding</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        {formatLKR(selectedLoan.outstandingBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[selectedLoan.status]}`}>
                        {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowRepaymentHistory(true)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      View Repayment History
                    </button>
                    {selectedLoan.status === 'pending' && (
                      <button
                        onClick={() => handleEditLoan(selectedLoan)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Loan
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Repayment History */}
                  <div>
                    <button
                      onClick={() => setShowRepaymentHistory(false)}
                      className="text-xs text-brand-600 hover:text-brand-700 mb-4 flex items-center gap-1"
                    >
                      ← Back to Loan Details
                    </button>
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Repayment History — {selectedLoan.loanId}</h4>
                    
                    {selectedLoan.repaymentHistory && selectedLoan.repaymentHistory.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold text-slate-700">Installment</th>
                              <th className="px-3 py-2 text-left font-bold text-slate-700">Month</th>
                              <th className="px-3 py-2 text-left font-bold text-slate-700">Amount</th>
                              <th className="px-3 py-2 text-left font-bold text-slate-700">Balance</th>
                              <th className="px-3 py-2 text-left font-bold text-slate-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLoan.repaymentHistory.map((rep: any) => (
                              <tr key={rep._id} className="border-t border-slate-200">
                                <td className="px-3 py-2">{rep.installmentNumber}</td>
                                <td className="px-3 py-2">
                                  {new Date(rep.payrollYear, rep.payrollMonth - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-3 py-2">{formatLKR(rep.amount)}</td>
                                <td className="px-3 py-2">{formatLKR(rep.balanceAfterPayment)}</td>
                                <td className="px-3 py-2">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${rep.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {rep.status.charAt(0).toUpperCase() + rep.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No repayment history yet
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
