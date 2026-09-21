import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { serviceBayApi } from '../../api/serviceBayApi';
import { JobCard } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate, formatLKR } from '../../utils/formatters';
import {
  ClipboardList,
  Search,
  Plus,
  Puzzle,
  Clock,
  Wrench,
  Factory,
  Car,
  User as UserIcon,
  Eye,
  MoreVertical,
  Printer,
  FileText,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const JobCardsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    activeJobs: 0,
    pending: 0,
    diagnosing: 0,
    repairing: 0,
    readyForDelivery: 0,
    waitingParts: 0,
    todayJobs: 0,
    techniciansWorking: 0,
    baysOccupied: null as number | null,
    baysTotal: null as number | null,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchJobCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: any = {
        limit: 50,
      };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const [res, baysRes] = await Promise.all([
        jobCardApi.getJobCards(params),
        serviceBayApi.getServiceBays().catch(() => null),
      ]);

      if (res.success) {
        setJobCards(res.data || []);
        
        // Calculate stats
        const activeJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        
        const pending = activeJobs.filter((jc: JobCard) => jc.status === 'pending').length;
        const diagnosing = activeJobs.filter((jc: JobCard) => ['diagnosing', 'inspection_started', 'inspection_complete'].includes(jc.status)).length;
        const repairing = activeJobs.filter((jc: JobCard) => ['repair_started', 'repair_in_progress'].includes(jc.status)).length;
        const readyForDelivery = activeJobs.filter((jc: JobCard) => jc.status === 'ready_for_delivery').length;
        const waitingParts = activeJobs.filter((jc: JobCard) => jc.status === 'waiting_for_parts').length;
        
        const todayJobs = activeJobs.filter((jc: JobCard) =>
          jc.createdAt && new Date(jc.createdAt).toDateString() === new Date().toDateString()
        ).length;
        const techniciansWorking = new Set(activeJobs.map((jc: JobCard) => {
          const technician = jc.assignedTechnician;
          return typeof technician === 'object' && technician
            ? technician._id || technician.id : technician;
        }).filter(Boolean)).size;
        
        setStats({
          activeJobs: activeJobs.length,
          pending,
          diagnosing,
          repairing,
          readyForDelivery,
          waitingParts,
          todayJobs,
          techniciansWorking,
          baysOccupied: baysRes?.success ? baysRes.data.filter((bay: { status: string }) => bay.status === 'occupied').length : null,
          baysTotal: baysRes?.success ? baysRes.data.length : null,
        });
      } else {
        setError(res.message || 'Failed to load job cards');
      }
    } catch (err: any) {
      console.error('Error loading job cards:', err);
      setError(err.response?.data?.message || 'Error loading job cards');
      setJobCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, [statusFilter, searchQuery]);

  const handleJobCardAction = (jobCard: JobCard, action: string) => {
    const jcId = jobCard._id || jobCard.id;
    
    switch (action) {
      case 'view':
        navigate(`/manager/job-cards/${jcId}`);
        break;
      case 'print':
        toast.success('Printing job card...');
        break;
      case 'invoice':
        navigate(`/manager/invoices?jobCard=${jcId}`);
        break;
    }
  };

  const getCustomerName = (jobCard: JobCard) => {
    const customer = jobCard.customer;
    if (typeof customer === 'object' && customer.user) {
      return `${customer.user.firstName} ${customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getVehicleInfo = (jobCard: JobCard) => {
    const vehicle = jobCard.vehicle;
    if (typeof vehicle === 'object') {
      return `${vehicle.make} ${vehicle.model}`;
    }
    return 'Unknown';
  };

  const getVehicleReg = (jobCard: JobCard) => {
    const vehicle = jobCard.vehicle;
    if (typeof vehicle === 'object') {
      return vehicle.registrationNumber;
    }
    return 'N/A';
  };

  const getTechnicianName = (jobCard: JobCard) => {
    const tech = jobCard.assignedTechnician;
    if (typeof tech === 'object' && tech.user) {
      return `${tech.user.firstName} ${tech.user.lastName}`;
    }
    return 'Unassigned';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🔴';
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCards} />;

  const activeJobCards = jobCards.filter(jc => 
    jc.status !== 'delivered' && jc.status !== 'cancelled'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">JOB CARD MANAGEMENT</h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/manager/job-cards/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            + NEW JOB CARD
          </Link>
          <Link
            to="/manager/job-cards/active"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <ClipboardList className="w-4 h-4" />
            📋 ACTIVE JOBS
          </Link>
          <Link
            to="/manager/job-cards/completed"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <Check className="w-4 h-4" />
            ✅ COMPLETED
          </Link>
          <Link
            to="/manager/job-cards/statistics"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <Factory className="w-4 h-4" />
            📊 STATISTICS
          </Link>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={ClipboardList}
          subtext="Currently in workshop"
          color="blue"
        />
        <StatCard
          title="Diagnosing"
          value={stats.diagnosing}
          icon={Search}
          subtext="Under inspection"
          color="amber"
        />
        <StatCard
          title="Repairing"
          value={stats.repairing}
          icon={Wrench}
          subtext="In progress"
          color="purple"
        />
        <StatCard
          title="Ready for Delivery"
          value={stats.readyForDelivery}
          icon={Car}
          subtext="Awaiting pickup"
          color="emerald"
        />
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Waiting Parts"
          value={stats.waitingParts}
          icon={Puzzle}
          subtext="Awaiting parts"
          color="rose"
        />
        <StatCard
          title="Today's Jobs"
          value={stats.todayJobs}
          icon={Clock}
          subtext="Started today"
          color="purple"
        />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Factory className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-500 uppercase">Workshop Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Technicians Working</span>
              <span className="font-bold text-slate-900">{stats.techniciansWorking}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Service Bays Occupied</span>
              <span className="font-bold text-slate-900">{stats.baysTotal === null ? 'Unavailable' : `${stats.baysOccupied} / ${stats.baysTotal}`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Job Card / Customer / Registration Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="diagnosing">Diagnosing</option>
              <option value="waiting_for_parts">Waiting Parts</option>
              <option value="repair_in_progress">Repairing</option>
              <option value="testing">Testing</option>
              <option value="ready_for_delivery">Ready for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>

            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Technician: All</option>
              <option value="kasun">Kasun</option>
              <option value="amila">Amila</option>
              <option value="nuwan">Nuwan</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Priority: All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Date: All</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Job Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            ACTIVE JOB CARDS
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  #
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  JC NO
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  CUSTOMER
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  VEHICLE
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  TECH
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  PRIO
                </th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {activeJobCards.length > 0 ? (
                activeJobCards.map((jobCard, index) => (
                  <tr key={jobCard.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 text-sm font-medium text-slate-600">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-brand-600">
                      {jobCard.jobCardNumber}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {getCustomerName(jobCard)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {getVehicleReg(jobCard)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {getTechnicianName(jobCard)}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={jobCard.status} />
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {getPriorityColor(jobCard.priority)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleJobCardAction(jobCard, 'view')}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="View Job Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleJobCardAction(jobCard, 'print')}
                          className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Print Job Card"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleJobCardAction(jobCard, 'invoice')}
                          className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    No active job cards
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {activeJobCards.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing 1-{activeJobCards.length} of {stats.activeJobs} job cards
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                &lt; Prev
              </button>
              <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                Next &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              📊 Quick Stats: <span className="font-bold text-slate-900">Active: {stats.activeJobs}</span> | 
              <span className="font-bold text-slate-900"> Pending: {stats.pending}</span> |
              <span className="font-bold text-slate-900"> Diagnosing: {stats.diagnosing}</span> | 
              <span className="font-bold text-slate-900"> Repair: {stats.repairing}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              🏭 Workshop Bays: <span className="font-bold text-slate-900">{stats.baysTotal === null ? 'Unavailable' : `${stats.baysOccupied}/${stats.baysTotal} Occupied`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
