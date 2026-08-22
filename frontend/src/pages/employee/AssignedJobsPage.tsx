import React, { useEffect, useState } from 'react';
import { jobCardApi } from '../../api/jobCardApi';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatters';
import {
  Wrench,
  Car,
  ChevronRight,
  Clock,
  AlertCircle,
  Package,
  CheckCircle2,
  Gauge,
  Truck,
  X,
  Zap,
  Search,
  FileText,
  ArrowLeft,
  ChevronDown,
  Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const STAGE_ORDER = [
  'pending', 'inspection_started', 'inspection_complete', 'repair_started', 
  'waiting_for_parts', 'testing', 'work_complete', 'road_test_pending',
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dotColor: string }> = {
  pending: { label: 'Pending', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dotColor: 'bg-slate-400' },
  inspection_started: { label: 'Inspection Started', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dotColor: 'bg-blue-500' },
  inspection_complete: { label: 'Inspection Complete', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', dotColor: 'bg-cyan-500' },
  repair_started: { label: 'Repair Started', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dotColor: 'bg-orange-500' },
  waiting_for_parts: { label: 'Waiting for Parts', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dotColor: 'bg-purple-500' },
  testing: { label: 'Testing', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dotColor: 'bg-yellow-500' },
  work_complete: { label: 'Work Complete', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dotColor: 'bg-green-500' },
  road_test_pending: { label: 'Road Test Pending', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', dotColor: 'bg-pink-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; hex: string }> = {
  high: { label: 'HIGH', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', hex: '#FF4444' },
  medium: { label: 'MEDIUM', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', hex: '#FFA500' },
  low: { label: 'LOW', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', hex: '#44BB44' },
};

export const AssignedJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('assignedDate');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await jobCardApi.getJobCards({ limit: 50 });
      if (res.success) {
        setJobs(res.data);
        setFilteredJobs(res.data);
      }
    } catch {
      toast.error('Failed to load assigned jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.jobCardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.complaint?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'assignedDate') {
        return new Date(b.assignedDate || 0).getTime() - new Date(a.assignedDate || 0).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
      } else if (sortBy === 'estimatedDelivery') {
        return new Date(a.estimatedDeliveryDate || 0).getTime() - new Date(b.estimatedDeliveryDate || 0).getTime();
      }
      return 0;
    });

    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [jobs, searchTerm, filterStatus, sortBy]);

  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      const res = await jobCardApi.updateStatus(selectedJob._id, { status: newStatus, remarks, progress });
      if (res.success) {
        toast.success('Job updated successfully');
        setIsUpdateModalOpen(false);
        fetchJobs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating job');
    }
  };

  const getNextStatus = (current: string) => {
    const idx = STAGE_ORDER.indexOf(current);
    return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : current;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            My Assigned Jobs
          </h2>
          <p className="text-sm text-slate-500 mt-1">Active vehicle job cards assigned to you</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job number, customer, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
            >
              <option value="assignedDate">Sort: Assigned Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="estimatedDelivery">Sort: Est. Delivery</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-card">
          <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No Assigned Jobs</h3>
          <p className="text-sm text-slate-400">You have no active job cards matching the current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedJobs.map((job) => {
            const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
            const priorityCfg = PRIORITY_CONFIG[job.priority?.toLowerCase()] || PRIORITY_CONFIG.low;
            
            return (
              <div
                key={job._id}
                className="bg-white rounded-2xl border-2 border-slate-200 shadow-card p-5 hover:shadow-lg transition-shadow"
              >
                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="font-extrabold text-slate-900 font-mono text-lg">
                      JOB #{job.jobCardNumber || 'N/A'}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${priorityCfg.bg} ${priorityCfg.color} border ${priorityCfg.border}`}
                      style={{ borderColor: priorityCfg.hex }}
                    >
                      {priorityCfg.label}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-4" />

                {/* Job Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Customer:</span>
                    <span className="text-sm text-slate-700 font-medium">
                      {job.customer?.user ? `${job.customer.user.firstName} ${job.customer.user.lastName}` : job.customer?.customerId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Vehicle:</span>
                    <span className="text-sm text-slate-700 font-medium">{job.vehicle?.registrationNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Make:</span>
                    <span className="text-sm text-slate-700 font-medium">{job.vehicle?.make} {job.vehicle?.model || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Complaint:</span>
                    <span className="text-sm text-slate-700 font-medium">{job.complaint || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Assigned:</span>
                    <span className="text-sm text-slate-700 font-medium">{job.assignedDate || job.createdAt ? formatDate(job.assignedDate || job.createdAt) : 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Est.Deliv:</span>
                    <span className="text-sm text-slate-700 font-medium">{job.estimatedDeliveryDate || job.estimatedDelivery ? formatDate(job.estimatedDeliveryDate || job.estimatedDelivery) : 'N/A'}</span>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.dotColor}`} />
                    <span className={`text-sm font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/employee/assigned-jobs/${job._id}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Details
                    </Link>
                    {(job.status === 'pending' || job.status === 'inspection_started') && (
                      <Link
                        to={`/employee/inspection/${job._id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Start Inspect
                      </Link>
                    )}
                    {(job.status === 'inspection_complete' || job.status === 'repair_started' || job.status === 'waiting_for_parts' || job.status === 'repair_in_progress' || job.status === 'testing') && (
                      <Link
                        to={`/employee/repair-progress/${job._id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Update Progress
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                &lt; Prev
              </button>
              <span className="text-sm text-slate-600 font-medium px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsUpdateModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-1">Update Repair Progress</h3>
            <p className="text-xs text-slate-500 mb-5">Job: <strong>{selectedJob.jobCardNumber}</strong> — {selectedJob.vehicle?.registrationNumber}</p>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Stage / Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold capitalize"
                >
                  {STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 mb-2 font-bold">
                  Completion Progress: <span className="text-brand-600">{progress}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Technician Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Inspection complete, cylinder head removed, road test passed..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-500 text-white font-bold rounded-xl shadow-md">Save Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
