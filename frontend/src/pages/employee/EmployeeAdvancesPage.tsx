import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { userApi } from '../../api/userApi';
import { formatLKR } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  DollarSign,
  Landmark,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Eye,
  Calendar,
  FileText,
  X,
  HelpCircle,
  Percent,
  Wallet,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface AdvanceStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface LoanStats {
  activeLoans: number;
  totalOutstanding: number;
  pendingLoans: number;
  completedLoans: number;
  monthlyRepayments: number;
}

export const EmployeeAdvancesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active tab: 'advances' | 'loans'
  const activeTab = searchParams.get('tab') === 'loans' ? 'loans' : 'advances';

  const setTab = (tab: 'advances' | 'loans') => {
    setSearchParams({ tab });
  };

  // Employee details & basic salary
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const basicSalary = employeeProfile?.basicSalary || 50000;
  const maxAdvanceAllowed = Math.min((basicSalary * 30) / 100, 50000);

  // ---------------- SALARY ADVANCES STATE ----------------
  const [advances, setAdvances] = useState<any[]>([]);
  const [advanceStats, setAdvanceStats] = useState<AdvanceStats | null>(null);
  const [isLoadingAdvances, setIsLoadingAdvances] = useState(true);
  const [advanceStatusFilter, setAdvanceStatusFilter] = useState('');
  const [advanceSearch, setAdvanceSearch] = useState('');

  // Request Advance Modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    requestedAmount: 0,
    reason: '',
  });
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);
  const [advanceError, setAdvanceError] = useState('');

  // ---------------- LOANS STATE ----------------
  const [loans, setLoans] = useState<any[]>([]);
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [loanStatusFilter, setLoanStatusFilter] = useState('');
  const [loanSearch, setLoanSearch] = useState('');

  // Apply Loan Modal
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({
    loanAmount: 0,
    installments: 12,
    reason: '',
  });
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState('');

  // Loan Repayment Details Modal
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);

  // Fetch employee profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        if (res.success && res.data?.employeeDetails) {
          setEmployeeProfile(res.data.employeeDetails);
        }
      } catch (err) {
        console.error('Failed to load employee profile:', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch advances data
  const fetchAdvancesData = async () => {
    setIsLoadingAdvances(true);
    try {
      const [advancesRes, statsRes] = await Promise.allSettled([
        hrApi.getSalaryAdvances(advanceStatusFilter ? { status: advanceStatusFilter } : {}),
        hrApi.getAdvanceStats(),
      ]);

      if (advancesRes.status === 'fulfilled' && advancesRes.value?.success) {
        setAdvances(advancesRes.value.data || []);
      } else if (advancesRes.status === 'rejected') {
        const err = advancesRes.reason;
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED' && !err?.message?.includes('cancel')) {
          console.error('Failed to load salary advances:', err);
        }
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setAdvanceStats(statsRes.value.data || null);
      } else if (statsRes.status === 'rejected') {
        const err = statsRes.reason;
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED' && !err?.message?.includes('cancel')) {
          console.error('Failed to load advance stats:', err);
        }
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || error?.message?.includes('cancel')) {
        return;
      }
      console.error('Failed to load salary advances:', error);
    } finally {
      setIsLoadingAdvances(false);
    }
  };

  // Fetch loans data
  const fetchLoansData = async () => {
    setIsLoadingLoans(true);
    try {
      const [loansRes, statsRes] = await Promise.allSettled([
        hrApi.getLoans(loanStatusFilter ? { status: loanStatusFilter } : {}),
        hrApi.getLoanStats(),
      ]);

      if (loansRes.status === 'fulfilled' && loansRes.value?.success) {
        setLoans(loansRes.value.data || []);
      } else if (loansRes.status === 'rejected') {
        const err = loansRes.reason;
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED' && !err?.message?.includes('cancel')) {
          console.error('Failed to load loans:', err);
        }
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setLoanStats(statsRes.value.data || null);
      } else if (statsRes.status === 'rejected') {
        const err = statsRes.reason;
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED' && !err?.message?.includes('cancel')) {
          console.error('Failed to load loan stats:', err);
        }
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || error?.message?.includes('cancel')) {
        return;
      }
      console.error('Failed to load loans:', error);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  useEffect(() => {
    fetchAdvancesData();
  }, [advanceStatusFilter]);

  useEffect(() => {
    fetchLoansData();
  }, [loanStatusFilter]);

  // ---------------- SUBMIT HANDLERS ----------------
  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvanceError('');

    const amount = Number(advanceForm.requestedAmount);
    if (!amount || amount <= 0) {
      setAdvanceError('Please enter a valid requested amount greater than 0.');
      return;
    }

    if (amount > maxAdvanceAllowed) {
      setAdvanceError(
        `Requested amount exceeds maximum advance limit of ${formatLKR(maxAdvanceAllowed)} (30% of basic salary).`
      );
      return;
    }

    if (!advanceForm.reason || advanceForm.reason.trim().length < 5) {
      setAdvanceError('Please provide a clear reason for the advance (minimum 5 characters).');
      return;
    }

    setIsSubmittingAdvance(true);
    try {
      const res = await hrApi.createSalaryAdvance({
        requestedAmount: amount,
        reason: advanceForm.reason.trim(),
      });

      if (res.success) {
        toast.success(res.message || 'Salary advance request submitted successfully!');
        setShowAdvanceModal(false);
        setAdvanceForm({ requestedAmount: 0, reason: '' });
        fetchAdvancesData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit salary advance request.';
      setAdvanceError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingAdvance(false);
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanError('');

    const amount = Number(loanForm.loanAmount);
    const installments = parseInt(String(loanForm.installments));

    if (!amount || amount <= 0) {
      setLoanError('Please enter a valid loan amount greater than 0.');
      return;
    }

    if (!installments || installments <= 0) {
      setLoanError('Please select a repayment installment period.');
      return;
    }

    setIsSubmittingLoan(true);
    try {
      const res = await hrApi.createLoan({
        loanAmount: amount,
        installments,
        interestRate: 10, // Company policy standard
      });

      if (res.success) {
        toast.success(res.message || 'Loan application submitted successfully!');
        setShowLoanModal(false);
        setLoanForm({ loanAmount: 0, installments: 12, reason: '' });
        fetchLoansData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit loan application.';
      setLoanError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  // Helpers for Loan Calculator in Modal
  const calcLoanPrincipal = Number(loanForm.loanAmount) || 0;
  const calcLoanInstallments = Number(loanForm.installments) || 12;
  const calcInterestAmount = Math.round(calcLoanPrincipal * (10 / 100));
  const calcTotalRepayable = calcLoanPrincipal + calcInterestAmount;
  const calcMonthlyDeduction = calcLoanInstallments > 0 ? Math.round(calcTotalRepayable / calcLoanInstallments) : 0;

  // Check if employee currently has active or pending loan
  const hasActiveLoan = loans.some((l) => ['active', 'approved'].includes(l.status));
  const hasPendingLoan = loans.some((l) => l.status === 'pending');
  const hasPendingAdvance = advances.some((a) => a.status === 'pending');

  // Filter advances by search
  const filteredAdvances = advances.filter((adv) => {
    if (!advanceSearch) return true;
    const term = advanceSearch.toLowerCase();
    return (
      adv.advanceId?.toLowerCase().includes(term) ||
      adv.reason?.toLowerCase().includes(term) ||
      adv.status?.toLowerCase().includes(term)
    );
  });

  // Filter loans by search
  const filteredLoans = loans.filter((loan) => {
    if (!loanSearch) return true;
    const term = loanSearch.toLowerCase();
    return (
      loan.loanId?.toLowerCase().includes(term) ||
      loan.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-flex items-center gap-1.5 backdrop-blur-xs">
              <Wallet className="w-3.5 h-3.5 text-blue-200" />
              Employee Financial Self-Service
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Advances & Loan Applications
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Request short-term salary advances for urgent expenses, apply for company loans, and monitor approved deductions.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 text-right">
            <p className="text-xs text-blue-200 font-medium">Basic Monthly Salary</p>
            <p className="text-2xl font-black text-white mt-0.5">
              {formatLKR(basicSalary)}
            </p>
            <p className="text-[11px] text-blue-300 mt-1">
              Max Advance Limit (30%): <span className="font-bold text-white">{formatLKR(maxAdvanceAllowed)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-fit gap-2">
        <button
          onClick={() => setTab('advances')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'advances'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <DollarSign className={`w-4 h-4 ${activeTab === 'advances' ? 'text-brand-600' : 'text-slate-500'}`} />
          Salary Advances
          {advanceStats && advanceStats.pending > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-extrabold">
              {advanceStats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('loans')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'loans'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Landmark className={`w-4 h-4 ${activeTab === 'loans' ? 'text-brand-600' : 'text-slate-500'}`} />
          Loan Applications
          {loanStats && loanStats.activeLoans > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              {loanStats.activeLoans} Active
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* ----------------- TAB 1: SALARY ADVANCES ----------------- */}
      {/* ========================================================= */}
      {activeTab === 'advances' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Requests</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{advanceStats?.total || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Submitted advance requests</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600">{advanceStats?.pending || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Awaiting manager approval</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">{advanceStats?.approved || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Approved for disbursement</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rejected</span>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600">{advanceStats?.rejected || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Declined requests</p>
            </div>
          </div>

          {/* Action Bar & Filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search advance ID or reason..."
                  value={advanceSearch}
                  onChange={(e) => setAdvanceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <select
                value={advanceStatusFilter}
                onChange={(e) => setAdvanceStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={() => {
                setAdvanceError('');
                setAdvanceForm({ requestedAmount: 0, reason: '' });
                setShowAdvanceModal(true);
              }}
              disabled={hasPendingAdvance}
              title={hasPendingAdvance ? 'You already have a pending advance request under review' : ''}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 ${
                hasPendingAdvance
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25 active:scale-95'
              }`}
            >
              <Plus className="w-4 h-4" />
              Request Salary Advance
            </button>
          </div>

          {hasPendingAdvance && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>
                <strong>Pending Advance Notice:</strong> You currently have an advance request under review. Once reviewed by management, you will be able to submit a new request.
              </span>
            </div>
          )}

          {/* Advances Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Your Salary Advance History
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {filteredAdvances.length} record{filteredAdvances.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Advance ID</th>
                    <th className="p-4">Requested Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Review / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingAdvances ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mb-2"></div>
                        <p>Loading salary advances...</p>
                      </td>
                    </tr>
                  ) : filteredAdvances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">
                        <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-bold text-slate-700">No Salary Advances Found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          You haven't submitted any salary advance requests yet.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAdvances.map((adv) => {
                      let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                      if (adv.status === 'approved') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      if (adv.status === 'rejected') badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';

                      return (
                        <tr key={adv._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900">{adv.advanceId}</td>
                          <td className="p-4 text-slate-600 font-medium">
                            {new Date(adv.requestedDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-4 font-bold text-slate-900 text-sm">
                            {formatLKR(adv.requestedAmount)}
                          </td>
                          <td className="p-4 text-slate-700 max-w-xs truncate" title={adv.reason}>
                            {adv.reason}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase ${badgeColor}`}>
                              {adv.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {adv.status === 'rejected' ? (
                              <span className="text-rose-600 font-medium">
                                Reason: {adv.rejectionReason || 'Declined by management'}
                              </span>
                            ) : adv.status === 'approved' ? (
                              <span className="text-emerald-700 font-medium">
                                Approved on {adv.approvedDate ? new Date(adv.approvedDate).toLocaleDateString('en-GB') : 'Payroll Cycle'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Under review</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ------------------- TAB 2: LOANS ----------------------- */}
      {/* ========================================================= */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Loans</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{loanStats?.activeLoans || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Currently running staff loans</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Balance</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600">
                {formatLKR(loanStats?.totalOutstanding || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Remaining balance to repay</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Applications</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600">{loanStats?.pendingLoans || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Awaiting management approval</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Deduction</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600">
                {formatLKR(loanStats?.monthlyRepayments || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Scheduled monthly payroll deduction</p>
            </div>
          </div>

          {/* Action Bar & Filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search loan ID..."
                  value={loanSearch}
                  onChange={(e) => setLoanSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <select
                value={loanStatusFilter}
                onChange={(e) => setLoanStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={() => {
                setLoanError('');
                setLoanForm({ loanAmount: 0, installments: 12, reason: '' });
                setShowLoanModal(true);
              }}
              disabled={hasActiveLoan || hasPendingLoan}
              title={
                hasActiveLoan
                  ? 'You already have an active loan. Staff policy permits one active loan at a time.'
                  : hasPendingLoan
                  ? 'You have a loan application currently pending approval.'
                  : ''
              }
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all shrink-0 ${
                hasActiveLoan || hasPendingLoan
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25 active:scale-95'
              }`}
            >
              <Plus className="w-4 h-4" />
              Apply for Loan
            </button>
          </div>

          {(hasActiveLoan || hasPendingLoan) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900 text-xs">
              <ShieldCheck className="w-5 h-5 shrink-0 text-brand-600" />
              <span>
                <strong>Policy Notice:</strong> Company policy permits one active loan per employee.
                {hasActiveLoan && ' You currently have an active loan undergoing repayment.'}
                {hasPendingLoan && ' Your loan application is currently under review by management.'}
              </span>
            </div>
          )}

          {/* Loans Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Landmark className="w-4 h-4 text-brand-600" />
                Your Loan Applications & History
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {filteredLoans.length} record{filteredLoans.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Loan ID</th>
                    <th className="p-4">Principal Amount</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Monthly Deduction</th>
                    <th className="p-4">Repayment Progress</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingLoans ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mb-2"></div>
                        <p>Loading loans...</p>
                      </td>
                    </tr>
                  ) : filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <Landmark className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-bold text-slate-700">No Loans Found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          You haven't submitted any loan applications yet.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => {
                      let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                      if (loan.status === 'active') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      if (loan.status === 'approved') badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                      if (loan.status === 'completed') badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
                      if (loan.status === 'rejected') badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';

                      const paidPct =
                        loan.totalRepayable > 0
                          ? Math.min(100, Math.round(((loan.paidAmount || 0) / loan.totalRepayable) * 100))
                          : 0;

                      return (
                        <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900">{loan.loanId}</td>
                          <td className="p-4 font-bold text-slate-900 text-sm">
                            {formatLKR(loan.loanAmount)}
                            <div className="text-[10px] text-slate-400 font-normal">
                              Total: {formatLKR(loan.totalRepayable)} (10% int.)
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {loan.installments} Months
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {formatLKR(loan.monthlyDeduction)} / mo
                          </td>
                          <td className="p-4 min-w-[160px]">
                            <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                              <span className="text-slate-600">Paid: {formatLKR(loan.paidAmount || 0)}</span>
                              <span className="text-slate-500">{paidPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${paidPct}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Bal: {formatLKR(loan.outstandingBalance)}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase ${badgeColor}`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowLoanDetailsModal(true);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ------------ MODAL: REQUEST SALARY ADVANCE -------------- */}
      {/* ========================================================= */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAdvanceModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Request Salary Advance</h3>
                <p className="text-xs text-slate-500">Fast approval for emergency or personal requirements</p>
              </div>
            </div>

            {advanceError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{advanceError}</span>
              </div>
            )}

            <form onSubmit={handleAdvanceSubmit} className="space-y-4">
              {/* Employee Limit Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Current Basic Salary:</span>
                  <span className="font-bold text-slate-800">{formatLKR(basicSalary)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Max Permitted Advance (30%):</span>
                  <span className="font-bold text-emerald-700">{formatLKR(maxAdvanceAllowed)}</span>
                </div>
              </div>

              {/* Requested Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requested Advance Amount (LKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    LKR
                  </span>
                  <input
                    type="number"
                    required
                    min="500"
                    max={maxAdvanceAllowed}
                    step="500"
                    placeholder="e.g. 10000"
                    value={advanceForm.requestedAmount || ''}
                    onChange={(e) =>
                      setAdvanceForm({ ...advanceForm, requestedAmount: Number(e.target.value) })
                    }
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Maximum permitted request: {formatLKR(maxAdvanceAllowed)}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Advance *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the purpose of this salary advance (e.g. medical emergency, household repairs)..."
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-800 leading-relaxed">
                💡 <strong>Payroll Deduction Note:</strong> Approved salary advances are automatically deducted in full during your next monthly payroll computation.
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdvance}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingAdvance ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Advance Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* --------------- MODAL: APPLY FOR LOAN ------------------- */}
      {/* ========================================================= */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLoanModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Apply for Company Loan</h3>
                <p className="text-xs text-slate-500">Long-term staff financing with structured payroll deductions</p>
              </div>
            </div>

            {loanError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{loanError}</span>
              </div>
            )}

            <form onSubmit={handleLoanSubmit} className="space-y-4">
              {/* Basic Salary Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                <span className="text-slate-500">Your Current Basic Salary:</span>
                <span className="font-bold text-slate-900">{formatLKR(basicSalary)}</span>
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requested Loan Amount (LKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    LKR
                  </span>
                  <input
                    type="number"
                    required
                    min="10000"
                    step="5000"
                    placeholder="e.g. 100000"
                    value={loanForm.loanAmount || ''}
                    onChange={(e) =>
                      setLoanForm({ ...loanForm, loanAmount: Number(e.target.value) })
                    }
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Installments Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Repayment Duration (Months) *
                </label>
                <select
                  value={loanForm.installments}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, installments: parseInt(e.target.value) })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={18}>18 Months</option>
                  <option value={24}>24 Months (2 Years)</option>
                  <option value={36}>36 Months (3 Years)</option>
                </select>
              </div>

              {/* Interactive Calculation Card */}
              {calcLoanPrincipal > 0 && (
                <div className="p-4 bg-brand-50/60 border border-brand-100 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Company Standard Interest Rate:</span>
                    <span className="font-bold text-slate-900">10% per annum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Interest Amount:</span>
                    <span className="font-bold text-slate-900">{formatLKR(calcInterestAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-200/50 pt-1.5">
                    <span className="text-slate-700 font-semibold">Total Amount Repayable:</span>
                    <span className="font-black text-brand-900">{formatLKR(calcTotalRepayable)}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-200/50 pt-1.5 text-sm">
                    <span className="text-brand-800 font-extrabold">Estimated Monthly Deduction:</span>
                    <span className="font-black text-brand-600">{formatLKR(calcMonthlyDeduction)} / mo</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLoan}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingLoan ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ------------ MODAL: LOAN REPAYMENT DETAILS ------------- */}
      {/* ========================================================= */}
      {showLoanDetailsModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowLoanDetailsModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Loan Details — {selectedLoan.loanId}
                </h3>
                <p className="text-xs text-slate-500">Repayment breakdown and scheduled deductions</p>
              </div>
            </div>

            {/* Overview Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500">Principal</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {formatLKR(selectedLoan.loanAmount)}
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500">Total Repayable</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {formatLKR(selectedLoan.totalRepayable)}
                </p>
              </div>
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                <p className="text-[11px] text-emerald-700">Total Paid</p>
                <p className="text-sm font-black text-emerald-800 mt-0.5">
                  {formatLKR(selectedLoan.paidAmount || 0)}
                </p>
              </div>
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-100">
                <p className="text-[11px] text-amber-700">Outstanding</p>
                <p className="text-sm font-black text-amber-800 mt-0.5">
                  {formatLKR(selectedLoan.outstandingBalance)}
                </p>
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-2 text-xs mb-6">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Application Date:</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedLoan.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Installments:</span>
                <span className="font-bold text-slate-800">{selectedLoan.installments} Months</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Monthly Deduction:</span>
                <span className="font-bold text-slate-800">
                  {formatLKR(selectedLoan.monthlyDeduction)} / month
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold uppercase text-brand-700">{selectedLoan.status}</span>
              </div>
              {selectedLoan.rejectionReason && (
                <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                  <span>Rejection Reason:</span>
                  <span className="font-bold">{selectedLoan.rejectionReason}</span>
                </div>
              )}
            </div>

            {/* Repayment History list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Recorded Payroll Deductions
              </h4>
              {selectedLoan.repaymentHistory && selectedLoan.repaymentHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedLoan.repaymentHistory.map((rep: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          Installment #{rep.installmentNumber}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {rep.payrollMonth}/{rep.payrollYear} • {new Date(rep.paymentDate).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">+{formatLKR(rep.amount)}</p>
                        <p className="text-[10px] text-slate-400">
                          Bal: {formatLKR(rep.balanceAfterPayment)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center italic">
                  No payroll deductions recorded yet. Deductions begin once the loan is approved and active.
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowLoanDetailsModal(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
