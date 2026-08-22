import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboardApi';
import { appointmentApi } from '../../api/appointmentApi';
import { CustomerSummaryData } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatLKR, formatDate } from '../../utils/formatters';
import {
  Car,
  Calendar,
  Wrench,
  Receipt,
  RotateCcw,
  ShieldAlert,
  Bell,
  Star,
  PlusCircle,
  ShieldCheck,
  Clock,
  Check,
  X,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<CustomerSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getCustomerSummary();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch customer portal summary');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const customerId = user?.profile?._id || user?._id;
      const res = await appointmentApi.getAppointments({ customer: customerId, limit: 5 });
      if (res.success) {
        setRecentAppointments(res.data);
      }
    } catch (err) {
      console.error('Error fetching recent appointments:', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchRecentAppointments();
  }, []);

  // Auto-refresh dashboard every 30 seconds to show latest status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchDashboard();
        fetchRecentAppointments();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block backdrop-blur-xs">
            Customer Self-Service Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome to Your Vehicle Portal
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Track your vehicle's live repair status in the workshop, view past service records, download invoices, and book service appointments.
          </p>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Customer Portal Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            onClick={() => navigate('/customer/appointments?new=true')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 border border-blue-200 transition-all text-center group font-semibold shadow-xs"
          >
            <PlusCircle className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs">Book Appointment</span>
          </button>
          <Link
            to="/customer/vehicles"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all text-center group"
          >
            <Car className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform text-slate-500" />
            <span className="text-xs font-bold">My Vehicles</span>
          </Link>
          <Link
            to="/customer/tracking"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all text-center group"
          >
            <ShieldCheck className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Track Status</span>
          </Link>
          <Link
            to="/customer/history"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all text-center group"
          >
            <RotateCcw className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform text-slate-500" />
            <span className="text-xs font-bold">Service History</span>
          </Link>
          <Link
            to="/customer/invoices"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all text-center group"
          >
            <Receipt className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Invoices & Bills</span>
          </Link>
          <Link
            to="/customer/notifications"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all text-center group"
          >
            <Bell className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Notifications</span>
          </Link>
          <Link
            to="/customer/reviews"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all text-center group"
          >
            <Star className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Submit Review</span>
          </Link>
        </div>
      </div>

      {/* Recent Status Updates */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Recent Status Updates
            </h3>
            <p className="text-xs text-slate-400">Latest appointment and service status changes</p>
          </div>
          <button
            onClick={() => {
              fetchDashboard();
              fetchRecentAppointments();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
        <div className="p-6">
          {isLoadingAppointments ? (
            <div className="text-center py-6 text-sm text-slate-400">Loading status updates...</div>
          ) : recentAppointments.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No appointment status updates yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAppointments.map((apt) => {
                const statusStyles: Record<string, { bg: string; text: string; icon: any }> = {
                  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
                  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Check },
                  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: X },
                  rescheduled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Calendar },
                  cancelled: { bg: 'bg-slate-100', text: 'text-slate-700', icon: XCircle },
                  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Check },
                };
                const style = statusStyles[apt.status] || statusStyles.pending;
                const StatusIcon = style.icon;
                const history = apt.statusHistory || [];
                const lastUpdate = history.length > 0 ? history[history.length - 1] : null;

                return (
                  <div key={apt._id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-slate-800">
                          {apt.appointmentNumber}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {apt.vehicle?.make} {apt.vehicle?.model} • {apt.serviceType}
                      </div>
                      {lastUpdate && (
                        <div className="text-xs text-slate-400 mt-1">
                          {lastUpdate.remarks || `Status changed to ${apt.status}`} • {new Date(lastUpdate.changedAt).toLocaleString()}
                        </div>
                      )}
                      {history.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {history.map((h: any, idx: number) => (
                            <span key={idx} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
                              {h.status}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="My Registered Vehicles"
          value={data?.myVehicles || 0}
          icon={Car}
          subtext="Vehicles linked to your profile"
          color="blue"
        />
        <StatCard
          title="Upcoming Appointments"
          value={data?.upcomingAppointments || 0}
          icon={Calendar}
          subtext="Scheduled service visits"
          color="blue"
        />
        <StatCard
          title="Vehicles in Service"
          value={data?.vehiclesInService || 0}
          icon={Wrench}
          subtext="Currently inside workshop"
          color="amber"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatLKR(data?.outstandingBalance || 0)}
          icon={Receipt}
          subtext="Unpaid invoice total"
          color="rose"
        />

        <StatCard
          title="Completed Services"
          value={data?.totalCompletedServices || 0}
          icon={RotateCcw}
          subtext="Total lifetime services"
          color="emerald"
        />
        <StatCard
          title="Next Service Due"
          value={formatDate(data?.nextServiceDue)}
          icon={Calendar}
          subtext="Recommended maintenance"
          color="purple"
        />
        <StatCard
          title="Warranty Expiring Soon"
          value={data?.warrantyExpiringSoon || 0}
          icon={ShieldAlert}
          subtext="Within next 30 days"
          color="amber"
        />
        <StatCard
          title="Insurance Expiring Soon"
          value={data?.insuranceExpiringSoon || 0}
          icon={ShieldAlert}
          subtext="Policy expiry alert"
          color="rose"
        />
      </div>
    </div>
  );
};