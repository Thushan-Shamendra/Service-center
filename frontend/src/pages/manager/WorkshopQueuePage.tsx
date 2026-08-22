import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { JobCard } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatters';
import {
  Search,
  User as UserIcon,
  Car,
  MoreVertical,
  RefreshCw,
  Wrench,
  UserCheck,
  Factory,
  Clock,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const WorkshopQueuePage: React.FC = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [bayFilter, setBayFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchWorkshopQueue = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });

      if (res.success) {
        const activeJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        
        setJobCards(activeJobs);
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        setError(res.message || 'Failed to load workshop queue');
      }
    } catch (err: any) {
      console.error('Error loading workshop queue:', err);
      setError(err.response?.data?.message || 'Error loading workshop queue');
      setJobCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshopQueue();
    
    const interval = setInterval(fetchWorkshopQueue, 30000);
    return () => clearInterval(interval);
  }, []);

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
      return `${tech.user.firstName}`;
    }
    return 'Unassigned';
  };

  const getEstimatedFinish = (jobCard: JobCard) => {
    if (jobCard.estimatedDelivery) {
      return dayjs(jobCard.estimatedDelivery).format('hh:mm A');
    }
    return 'TBD';
  };

  const getWaitingTime = (jobCard: JobCard) => {
    if (jobCard.createdAt) {
      const diff = dayjs().diff(dayjs(jobCard.createdAt), 'minute');
      if (diff < 60) return `${diff} min`;
      return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    }
    return '0 min';
  };

  const filteredJobCards = jobCards.filter(jc => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchJC = jc.jobCardNumber.toLowerCase().includes(search);
      const matchCustomer = getCustomerName(jc).toLowerCase().includes(search);
      const matchVehicle = getVehicleReg(jc).toLowerCase().includes(search);
      if (!matchJC && !matchCustomer && !matchVehicle) return false;
    }
    if (technicianFilter !== 'all' && jc.assignedTechnician !== technicianFilter) return false;
    if (bayFilter !== 'all' && jc.serviceBay !== bayFilter) return false;
    if (priorityFilter !== 'all' && jc.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && jc.status !== statusFilter) return false;
    return true;
  });

  const statusGroups = {
    pending: filteredJobCards.filter(jc => jc.status === 'pending'),
    diagnosing: filteredJobCards.filter(jc => jc.status === 'diagnosing'),
    waiting_for_parts: filteredJobCards.filter(jc => jc.status === 'waiting_for_parts'),
    repair_in_progress: filteredJobCards.filter(jc => jc.status === 'repair_in_progress'),
    testing: filteredJobCards.filter(jc => jc.status === 'testing'),
    ready_for_delivery: filteredJobCards.filter(jc => jc.status === 'ready_for_delivery'),
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchWorkshopQueue} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshop Queue</h1>
          <p className="text-sm text-slate-500">
            Monitor all vehicles currently inside the workshop.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-4 h-4" />
          <span>Live • Updated {lastUpdated}</span>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Jobs {jobCards.length}
        </button>
        <button
          onClick={() => setStatusFilter('diagnosing')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === 'diagnosing' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Diagnosing {statusGroups.diagnosing.length}
        </button>
        <button
          onClick={() => setStatusFilter('waiting_for_parts')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === 'waiting_for_parts' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Waiting Parts {statusGroups.waiting_for_parts.length}
        </button>
        <button
          onClick={() => setStatusFilter('repair_in_progress')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === 'repair_in_progress' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Repairing {statusGroups.repair_in_progress.length}
        </button>
        <button
          onClick={() => setStatusFilter('testing')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === 'testing' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Testing {statusGroups.testing.length}
        </button>
        <button
          onClick={() => setStatusFilter('ready_for_delivery')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === 'ready_for_delivery' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Ready {statusGroups.ready_for_delivery.length}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Job / Customer / Vehicle"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <select
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Technician: All</option>
            <option value="kasun">Kasun</option>
            <option value="amila">Amila</option>
            <option value="nuwan">Nuwan</option>
          </select>
          
          <select
            value={bayFilter}
            onChange={(e) => setBayFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Bay: All</option>
            <option value="B01">Bay 01</option>
            <option value="B02">Bay 02</option>
            <option value="B03">Bay 03</option>
            <option value="B04">Bay 04</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Priority: All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'board' : 'table')}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            <Layers className="w-4 h-4" />
            {viewMode === 'table' ? 'Board View' : 'Table View'}
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Job Card</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Vehicle</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Technician</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Priority</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Waiting</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobCards.length > 0 ? (
                  filteredJobCards.map((jobCard) => (
                    <tr key={jobCard.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-brand-600">
                        {jobCard.jobCardNumber}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {getCustomerName(jobCard)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {getVehicleReg(jobCard)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {getTechnicianName(jobCard)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={jobCard.status} />
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {jobCard.priority === 'high' ? '🔴 High' : jobCard.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {getWaitingTime(jobCard)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                      No jobs in queue
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredJobCards.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-600">
                <span className="font-medium">Estimated Finish:</span>
                {filteredJobCards.slice(0, 4).map((jc) => (
                  <span key={jc.id} className="ml-4">
                    {jc.jobCardNumber} → {getEstimatedFinish(jc)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Column */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-amber-900">🟠 PENDING</h3>
              <span className="text-xs text-amber-700">{statusGroups.pending.length} Jobs</span>
            </div>
            <div className="space-y-3">
              {statusGroups.pending.map((jobCard) => (
                <div key={jobCard.id} className="bg-white rounded-lg p-3 border border-amber-100 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">{jobCard.jobCardNumber}</p>
                  <p className="text-xs text-slate-600">{getVehicleInfo(jobCard)}</p>
                  <p className="text-xs text-slate-600">{getVehicleReg(jobCard)}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500">{getTechnicianName(jobCard)}</p>
                    <p className="text-xs text-slate-500">{jobCard.serviceBay || 'Unassigned'}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {jobCard.priority === 'high' ? '🔴 High' : jobCard.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                  </p>
                  <Link
                    to={`/manager/job-cards/${jobCard._id || jobCard.id}`}
                    className="block mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    [View]
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnosing Column */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-blue-900">🔵 DIAGNOSING</h3>
              <span className="text-xs text-blue-700">{statusGroups.diagnosing.length} Jobs</span>
            </div>
            <div className="space-y-3">
              {statusGroups.diagnosing.map((jobCard) => (
                <div key={jobCard.id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">{jobCard.jobCardNumber}</p>
                  <p className="text-xs text-slate-600">{getVehicleInfo(jobCard)}</p>
                  <p className="text-xs text-slate-600">{getVehicleReg(jobCard)}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500">{getTechnicianName(jobCard)}</p>
                    <p className="text-xs text-slate-500">{jobCard.serviceBay || 'Unassigned'}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {jobCard.priority === 'high' ? '🔴 High' : jobCard.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                  </p>
                  <Link
                    to={`/manager/job-cards/${jobCard._id || jobCard.id}`}
                    className="block mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    [View]
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting Parts Column */}
          <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-purple-900">🟣 WAITING PARTS</h3>
              <span className="text-xs text-purple-700">{statusGroups.waiting_for_parts.length} Jobs</span>
            </div>
            <div className="space-y-3">
              {statusGroups.waiting_for_parts.map((jobCard) => (
                <div key={jobCard.id} className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">{jobCard.jobCardNumber}</p>
                  <p className="text-xs text-slate-600">{getVehicleInfo(jobCard)}</p>
                  <p className="text-xs text-slate-600">{getVehicleReg(jobCard)}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500">{getTechnicianName(jobCard)}</p>
                    <p className="text-xs text-slate-500">{jobCard.serviceBay || 'Unassigned'}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {jobCard.priority === 'high' ? '🔴 High' : jobCard.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                  </p>
                  <Link
                    to={`/manager/job-cards/${jobCard._id || jobCard.id}`}
                    className="block mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    [View]
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Repairing Column */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-emerald-900">🟡 REPAIRING</h3>
              <span className="text-xs text-emerald-700">{statusGroups.repair_in_progress.length} Jobs</span>
            </div>
            <div className="space-y-3">
              {statusGroups.repair_in_progress.map((jobCard) => (
                <div key={jobCard.id} className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">{jobCard.jobCardNumber}</p>
                  <p className="text-xs text-slate-600">{getVehicleInfo(jobCard)}</p>
                  <p className="text-xs text-slate-600">{getVehicleReg(jobCard)}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500">{getTechnicianName(jobCard)}</p>
                    <p className="text-xs text-slate-500">{jobCard.serviceBay || 'Unassigned'}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {jobCard.priority === 'high' ? '🔴 High' : jobCard.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                  </p>
                  <Link
                    to={`/manager/job-cards/${jobCard._id || jobCard.id}`}
                    className="block mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    [View]
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};