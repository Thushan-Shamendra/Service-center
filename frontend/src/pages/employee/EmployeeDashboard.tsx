import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { EmployeeSummaryData } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  ClipboardList,
  Wrench,
  Clock,
  CheckCircle2,
  Navigation,
  Package,
  Camera,
  CheckSquare,
  PlayCircle,
  FileCheck,
  DollarSign,
  Landmark,
  Calendar,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmployeeDashboard: React.FC = () => {
  const [data, setData] = useState<EmployeeSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getEmployeeSummary();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch technician summary');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-700 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block backdrop-blur-xs">
            Technician & Workshop Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Technician Service Desk
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Manage assigned job cards, log repair worktimes, request spare parts from inventory, upload evidence photos, and perform safety inspections.
          </p>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Technician Workflow Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <Link
            to="/employee/assigned-jobs"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 text-brand-600 border border-blue-100 transition-all text-center group"
          >
            <ClipboardList className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Assigned Jobs</span>
          </Link>
          <Link
            to="/employee/inspection"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50/50 hover:bg-sky-50 text-sky-600 border border-sky-100 transition-all text-center group"
          >
            <CheckSquare className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Inspection</span>
          </Link>
          <Link
            to="/employee/repair-progress"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 text-amber-600 border border-amber-100 transition-all text-center group"
          >
            <Wrench className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Update Repair</span>
          </Link>
          <Link
            to="/employee/parts-requests"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 text-purple-600 border border-purple-100 transition-all text-center group"
          >
            <Package className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Request Parts</span>
          </Link>
          <Link
            to="/employee/time-tracking"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 border border-emerald-100 transition-all text-center group"
          >
            <Clock className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Record Time</span>
          </Link>
          <Link
            to="/employee/evidence"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100 transition-all text-center group"
          >
            <Camera className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Upload Photos</span>
          </Link>
          <Link
            to="/employee/road-test"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-50/50 hover:bg-teal-50 text-teal-600 border border-teal-100 transition-all text-center group"
          >
            <Navigation className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Road Test</span>
          </Link>
          <Link
            to="/employee/final-inspection"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50/50 hover:bg-rose-50 text-rose-600 border border-rose-100 transition-all text-center group"
          >
            <FileCheck className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold">Final Signoff</span>
          </Link>
        </div>
      </div>

      {/* Employee Benefits & Financial Self-Service */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-brand-600" />
          Employee Benefits & Self-Service
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/employee/advances?tab=advances"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Salary Advance
              </p>
              <p className="text-[10px] text-slate-500">Apply for short-term advance</p>
            </div>
          </Link>

          <Link
            to="/employee/advances?tab=loans"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                Staff Loan
              </p>
              <p className="text-[10px] text-slate-500">Apply & view repayments</p>
            </div>
          </Link>

          <Link
            to="/employee/leave-management"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Leave Management
              </p>
              <p className="text-[10px] text-slate-500">Request & check leave balance</p>
            </div>
          </Link>

          <Link
            to="/employee/attendance"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                My Attendance
              </p>
              <p className="text-[10px] text-slate-500">View check-in & work logs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Assigned Jobs"
          value={data?.assignedJobs || 0}
          icon={ClipboardList}
          subtext="Active job cards assigned to you"
          color="blue"
        />
        <StatCard
          title="Jobs In Progress"
          value={data?.jobsInProgress || 0}
          icon={Wrench}
          subtext="Currently undergoing repairs"
          color="amber"
        />
        <StatCard
          title="Waiting for Parts"
          value={data?.waitingForParts || 0}
          icon={Clock}
          subtext="Pending inventory issuance"
          color="rose"
        />
        <StatCard
          title="Completed Jobs Today"
          value={data?.completedJobsToday || 0}
          icon={CheckCircle2}
          subtext="Finished and delivered today"
          color="emerald"
        />
        <StatCard
          title="Pending Road Tests"
          value={data?.pendingRoadTests || 0}
          icon={Navigation}
          subtext="Testing stage before delivery"
          color="purple"
        />
        <StatCard
          title="Hours Worked Today"
          value={`${data?.totalHoursWorkedToday || 0} hrs`}
          icon={Clock}
          subtext="Log time logged today"
          color="blue"
        />
      </div>
    </div>
  );
};
