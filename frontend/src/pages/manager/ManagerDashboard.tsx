import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { ManagerSummaryData } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FormModal } from '../../components/ui/FormModal';
import { RegisterCustomerModal } from '../../components/manager/RegisterCustomerModal';
import { RegisterVehicleModal } from '../../components/manager/RegisterVehicleModal';
import { JobCardModal } from '../../components/manager/JobCardModal';
import { QuotationModal } from '../../components/manager/QuotationModal';
import { NotificationModal } from '../../components/manager/NotificationModal';
import { formatLKR } from '../../utils/formatters';
import {
  Calendar,
  Car,
  ClipboardList,
  Clock,
  CheckCircle2,
  FileText,
  Receipt,
  DollarSign,
  Users,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Wrench,
  FlaskConical,
  Package,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

export const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<ManagerSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [summaryRes, workshopBaysRes, appointmentsRes, jobCardsRes, alertsRes] = await Promise.all([
        dashboardApi.getManagerSummary().catch(() => ({ success: false, data: {} })),
        dashboardApi.getWorkshopBays().catch(() => ({ success: false, data: [] })),
        dashboardApi.getTodaysAppointments().catch(() => ({ success: false, data: [] })),
        dashboardApi.getRecentJobCards().catch(() => ({ success: false, data: [] })),
        dashboardApi.getManagerAlerts().catch(() => ({ success: false, data: [] })),
      ]);

      // Combine all data
      const combinedData: ManagerSummaryData = {
        ...(summaryRes.success ? summaryRes.data : {}),
        workshopBays: workshopBaysRes.success ? workshopBaysRes.data : [],
        todaysAppointmentsList: appointmentsRes.success ? appointmentsRes.data : [],
        recentJobCards: jobCardsRes.success ? jobCardsRes.data : [],
        alerts: alertsRes.success ? alertsRes.data : [],
      };

      setData(combinedData);

      if (!summaryRes.success && !workshopBaysRes.success && !appointmentsRes.success) {
        setError('Failed to fetch dashboard data');
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

  const currentDate = dayjs().format('dddd, D MMM YYYY');

  // Use API data or fallback to empty arrays
  const workshopBays = data?.workshopBays || [];
  const todaysAppointments = data?.todaysAppointmentsList || [];
  const recentJobCards = data?.recentJobCards || [];
  const alerts = data?.alerts || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Repair':
        return <Wrench className="w-4 h-4" />;
      case 'Testing':
        return <FlaskConical className="w-4 h-4" />;
      case 'Parts':
        return <Clock className="w-4 h-4" />;
      case 'Empty':
        return null;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Repair':
        return 'text-amber-600 bg-amber-50';
      case 'Testing':
        return 'text-blue-600 bg-blue-50';
      case 'Parts':
        return 'text-rose-600 bg-rose-50';
      case 'Empty':
        return 'text-slate-400 bg-slate-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back, Manager! Here's today's workshop overview.</p>
        </div>
        <div className="text-sm text-slate-500 font-medium">{currentDate}</div>
      </div>

      {/* First Row - Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={data?.todaysAppointments ?? 0}
          icon={Calendar}
          subtext={data?.todaysAppointmentsTrend ? `${data.todaysAppointmentsTrend > 0 ? '+' : ''}${data.todaysAppointmentsTrend} vs yesterday` : ''}
          color="blue"
          trend={data?.todaysAppointmentsTrend ? { value: Math.abs(data.todaysAppointmentsTrend), isUp: data.todaysAppointmentsTrend > 0 } : undefined}
        />
        <StatCard
          title="Vehicles in Workshop"
          value={data?.vehiclesInWorkshop ?? 0}
          icon={Car}
          subtext={data?.activeBays ? `${data.activeBays} bays active` : ''}
          color="amber"
        />
        <StatCard
          title="Pending Job Cards"
          value={data?.pendingJobCards ?? 0}
          icon={ClipboardList}
          subtext={data?.urgentJobCards ? `${data.urgentJobCards} urgent` : ''}
          color="purple"
        />
        <StatCard
          title="Waiting for Parts"
          value={data?.waitingForParts ?? 0}
          icon={Clock}
          subtext={data?.delayedParts ? `${data.delayedParts} delayed` : ''}
          color="rose"
        />
      </div>

      {/* Second Row - Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/manager/job-cards?status=ready" className="block">
          <StatCard
            title="Ready for Delivery"
            value={data?.readyForDelivery ?? 0}
            icon={CheckCircle2}
            subtext="View →"
            color="emerald"
          />
        </Link>
        <Link to="/manager/quotations?status=pending" className="block">
          <StatCard
            title="Quotations Pending"
            value={data?.quotationsPendingApproval ?? 0}
            icon={FileText}
            subtext="Review →"
            color="amber"
          />
        </Link>
        <Link to="/manager/invoices?status=unpaid" className="block">
          <StatCard
            title="Unpaid Invoices"
            value={data?.unpaidInvoices ?? 0}
            icon={Receipt}
            subtext="Follow Up →"
            color="rose"
          />
        </Link>
        <Link to="/manager/reports" className="block">
          <StatCard
            title="Today's Revenue"
            value={formatLKR(data?.todaysRevenue ?? 0)}
            icon={DollarSign}
            subtext="View Report →"
            color="emerald"
          />
        </Link>
      </div>

      {/* Quick Actions and Workshop Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-900 text-center">Register Customer</span>
            </button>
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 hover:from-emerald-100 hover:to-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-900 text-center">Register Vehicle</span>
            </button>
            <button
              onClick={() => setIsJobCardModalOpen(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-900 text-center">Create Job Card</span>
            </button>
            <button
              onClick={() => setIsQuotationModalOpen(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 hover:from-cyan-100 hover:to-cyan-200 hover:border-cyan-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-cyan-900 text-center">Generate Quotation</span>
            </button>
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 hover:from-rose-100 hover:to-rose-200 hover:border-rose-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-rose-900 text-center">Send Notification</span>
            </button>
            <Link
              to="/manager/technicians"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 hover:from-indigo-100 hover:to-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-indigo-900 text-center">Assign Technician</span>
            </Link>
            <Link
              to="/manager/parts-requests"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:from-orange-100 hover:to-orange-200 hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-orange-900 text-center">Approve Parts Request</span>
            </Link>
          </div>
        </div>

        {/* Workshop Status */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Workshop Status
            </h3>
            <Link
              to="/manager/workshop"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View Workshop Queue
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {workshopBays.length > 0 ? (
              workshopBays.map((bay) => (
                <div
                  key={bay.id}
                  className={`p-4 rounded-xl border-2 ${
                    bay.status === 'Empty'
                      ? 'border-dashed border-slate-200 bg-slate-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">Bay {String(bay.id).padStart(2, '0')}</span>
                    {bay.status !== 'Empty' && (
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${getStatusColor(bay.status)}`}>
                        {getStatusIcon(bay.status)}
                        {bay.status}
                      </div>
                    )}
                  </div>
                  {bay.status !== 'Empty' ? (
                    <>
                      <p className="text-sm font-bold text-slate-900">{bay.vehicle}</p>
                      <p className="text-xs text-slate-500">{bay.customer}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-sm text-slate-400">
                No workshop bay information available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Appointments and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Today's Appointments
            </h3>
            <Link
              to="/manager/appointments"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View Calendar
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {todaysAppointments.length > 0 ? (
              todaysAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-slate-900 w-16">{apt.time}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{apt.customer}</p>
                      <p className="text-xs text-slate-500">{apt.vehicle} • {apt.service}</p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                No appointments scheduled for today
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Alerts
            </h3>
            <Link
              to="/manager/notifications"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All Alerts
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.color === 'red' ? 'bg-red-500' :
                      alert.color === 'orange' ? 'bg-orange-500' :
                      alert.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="text-sm font-medium text-slate-700">{alert.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{alert.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                No active alerts
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Job Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Recent Job Cards
          </h3>
          <Link
            to="/manager/job-cards"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All Job Cards
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Job Card ID</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentJobCards.length > 0 ? (
                recentJobCards.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-brand-600">
                      <Link to={`/manager/job-cards/${job.id}`} className="hover:underline">
                        {job.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">{job.vehicle}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{job.customer}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-slate-900">
                      {formatLKR(job.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                    No recent job cards found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <FormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Register New Customer"
        size="lg"
      >
        <RegisterCustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSuccess={() => {
            setIsCustomerModalOpen(false);
            fetchDashboard();
          }}
        />
      </FormModal>

      <FormModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Register New Vehicle"
        size="lg"
      >
        <RegisterVehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          onSuccess={() => {
            setIsVehicleModalOpen(false);
            fetchDashboard();
          }}
        />
      </FormModal>

      <FormModal
        isOpen={isJobCardModalOpen}
        onClose={() => setIsJobCardModalOpen(false)}
        title="Create New Job Card"
        size="lg"
      >
        <JobCardModal
          isOpen={isJobCardModalOpen}
          onClose={() => setIsJobCardModalOpen(false)}
          onSuccess={() => {
            setIsJobCardModalOpen(false);
            fetchDashboard();
          }}
        />
      </FormModal>

      <FormModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        title="Generate Quotation"
        size="xl"
      >
        <QuotationModal
          isOpen={isQuotationModalOpen}
          onClose={() => setIsQuotationModalOpen(false)}
          onSuccess={() => {
            setIsQuotationModalOpen(false);
            fetchDashboard();
          }}
        />
      </FormModal>

      <FormModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        title="Send Notification"
        size="lg"
      >
        <NotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          onSuccess={() => {
            setIsNotificationModalOpen(false);
            fetchDashboard();
          }}
        />
      </FormModal>
    </div>
  );
};
