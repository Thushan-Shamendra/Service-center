import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobCardApi } from '../../api/jobCardApi';
import { appointmentApi } from '../../api/appointmentApi';
import { 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  AlertCircle, 
  Package, 
  Wrench, 
  Gauge, 
  CheckCircle2, 
  Truck, 
  Car, 
  Calendar,
  User,
  FileText,
  Bell,
  Star,
  LayoutDashboard,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  Mail,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Filter,
  X
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';

const STATUS_STAGES = [
  { key: 'scheduled', label: 'Scheduled', progress: 10, Icon: Calendar, color: 'blue', description: 'Appointment confirmed' },
  { key: 'pending', label: 'Pending', progress: 15, Icon: Clock, color: 'yellow', description: 'Waiting to be processed' },
  { key: 'diagnosing', label: 'Diagnosing', progress: 20, Icon: AlertCircle, color: 'purple', description: 'Technician inspecting' },
  { key: 'waiting_for_parts', label: 'Waiting for Parts', progress: 30, Icon: Package, color: 'orange', description: 'Parts on order' },
  { key: 'repair_in_progress', label: 'Repair In Progress', progress: 60, Icon: Wrench, color: 'red', description: 'Currently being repaired' },
  { key: 'testing', label: 'Testing', progress: 80, Icon: Gauge, color: 'cyan', description: 'Quality check' },
  { key: 'ready_for_delivery', label: 'Ready for Delivery', progress: 90, Icon: Car, color: 'green', description: 'Ready for customer' },
  { key: 'delivered', label: 'Delivered', progress: 100, Icon: CheckCircle2, color: 'green', description: 'Vehicle returned' },
];

const TIMELINE_EVENTS = [
  { key: 'approved', label: 'Appointment Approved', description: 'Appointment booked by customer. Approved by Service Desk Manager. Service slot confirmed.' },
  { key: 'pending', label: 'Vehicle Checked In', description: 'Vehicle arrived at workshop. Checked in by customer. Odometer reading documented. Vehicle condition documented.' },
  { key: 'diagnosing', label: 'Inspection Started', description: 'Initial inspection started by technician. Problems identified and documented.' },
  { key: 'waiting_for_parts', label: 'Parts Requested', description: 'Parts requested by technician. Awaiting manager approval and inventory availability.' },
  { key: 'repair_in_progress', label: 'Repair Started', description: 'Repair work started by technician. Parts approved and available. Work in progress.' },
  { key: 'testing', label: 'Testing Completed', description: 'Testing phase completed. Road test conducted. Quality check passed.' },
  { key: 'ready_for_delivery', label: 'Ready for Pickup', description: 'Vehicle ready for customer pickup. Final inspection report generated. Final cleaning completed.' },
  { key: 'delivered', label: 'Vehicle Delivered', description: 'Vehicle delivered to customer. Job completed. Customer satisfied.' },
];

export const ServiceTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showAppointments, setShowAppointments] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'details' | 'timeline' | 'progress'>('dashboard');
  
  // Dashboard state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching job cards for user:', user);
      const res = await jobCardApi.getJobCards({ limit: 100 });
      console.log('Job cards API response:', res);
      
      if (res.success) {
        console.log('Job cards data:', res.data);
        console.log('Number of job cards:', res.data.length);
        setJobs(res.data);
        setFilteredJobs(res.data);
        if (res.data.length > 0 && !selectedJob) {
          setSelectedJob(res.data[0]);
        } else if (res.data.length === 0) {
          console.log('No job cards found, fetching appointments as fallback');
          // Fetch appointments as fallback
          const customerId = user?.profile?._id || user?._id;
          console.log('Customer ID for appointments:', customerId);
          const aptRes = await appointmentApi.getAppointments({ customer: customerId });
          console.log('Appointments API response:', aptRes);
          
          if (aptRes.success) {
            const filteredAppointments = aptRes.data.filter((apt: any) => 
              ['approved', 'pending'].includes(apt.status)
            );
            console.log('Filtered appointments:', filteredAppointments);
            setAppointments(filteredAppointments);
            setShowAppointments(true);
          }
        }
      } else {
        console.error('Job cards API error:', res.message);
        setError(res.message || 'Failed to fetch job cards');
      }
    } catch (err: any) {
      console.error('Job cards fetch error:', err);
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jobs based on search and status
  useEffect(() => {
    let filtered = [...jobs];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.jobCardNumber?.toLowerCase().includes(query) ||
        job.vehicle?.registrationNumber?.toLowerCase().includes(query) ||
        job.vehicle?.make?.toLowerCase().includes(query) ||
        job.vehicle?.model?.toLowerCase().includes(query) ||
        job.complaint?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }
    
    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [jobs, searchQuery, statusFilter]);

  // Get paginated jobs
  const getPaginatedJobs = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const fetchTimelineData = async (jobId: string) => {
    setIsLoadingTimeline(true);
    try {
      const res = await jobCardApi.getJobCardTimeline(jobId);
      if (res.success) {
        setTimelineData(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching timeline:', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  // Auto-refresh jobs every 30 seconds to show latest status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchJobs();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoading, user]);

  const getStageIndex = (status: string) => {
    const statusMap: Record<string, number> = {
      'scheduled': 0,
      'pending': 1,
      'diagnosing': 2,
      'waiting_for_parts': 3,
      'repair_in_progress': 4,
      'testing': 5,
      'ready_for_delivery': 6,
      'delivered': 7,
    };
    return statusMap[status] || 1;
  };

  const getProgressPercentage = (status: string) => {
    // Match backend workflow values for jobs saved before progress was synchronized.
    const workflowProgress: Record<string, number> = {
      pending: 0,
      inspection_started: 10,
      inspection_complete: 20,
      repair_started: 35,
      waiting_for_parts: 40,
      repair_in_progress: 70,
      testing: 90,
      work_complete: 100,
      road_test_pending: 90,
      ready_for_delivery: 95,
      delivered: 100,
      cancelled: 0,
    };
    if (status in workflowProgress) return workflowProgress[status];
    const stage = STATUS_STAGES.find(s => s.key === status);
    return stage?.progress || 0;
  };

  const getStatusIcon = (status: string) => {
    const stage = STATUS_STAGES.find(s => s.key === status) || STATUS_STAGES[1];
    return stage.Icon;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-700 border-blue-200',
      'pending': 'bg-amber-100 text-amber-700 border-amber-200',
      'diagnosing': 'bg-purple-100 text-purple-700 border-purple-200',
      'waiting_for_parts': 'bg-orange-100 text-orange-700 border-orange-200',
      'repair_in_progress': 'bg-red-100 text-red-700 border-red-200',
      'testing': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'ready_for_delivery': 'bg-green-100 text-green-700 border-green-200',
      'delivered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colorMap[status] || colorMap['pending'];
  };

  const getStatusEmoji = (status: string) => {
    const emojiMap: Record<string, string> = {
      'scheduled': '🔵',
      'pending': '🟡',
      'diagnosing': '🟣',
      'waiting_for_parts': '🟠',
      'repair_in_progress': '🔧',
      'testing': '🧪',
      'ready_for_delivery': '✅',
      'delivered': '🏁',
    };
    return emojiMap[status] || '⏳';
  };

  const getTimelineEvents = (job: any) => {
    if (!job.statusHistory || job.statusHistory.length === 0) {
      return [];
    }
    
    return job.statusHistory.map((history: any) => {
      const event = TIMELINE_EVENTS.find(e => e.key === history.status);
      return {
        label: event?.label || history.status,
        description: event?.description || '',
        date: history.changedAt,
        status: history.status,
        remarks: history.remarks,
        performedBy: history.performedBy,
      };
    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getCustomerName = (job: any) => {
    if (job.customer?.user) {
      return `${job.customer.user.firstName} ${job.customer.user.lastName}`;
    }
    if (job.customer?.firstName) {
      return `${job.customer.firstName} ${job.customer.lastName || ''}`;
    }
    return 'Unknown';
  };

  const getTechnicianName = (job: any) => {
    if (job.assignedTechnician?.user) {
      return `${job.assignedTechnician.user.firstName} ${job.assignedTechnician.user.lastName} (${job.assignedTechnician.role || 'Technician'})`;
    }
    if (job.assignedTechnician?.firstName) {
      return `${job.assignedTechnician.firstName} ${job.assignedTechnician.lastName || ''} (${job.assignedTechnician.role || 'Technician'})`;
    }
    return 'Unassigned';
  };

  const renderProgressBar = (progress: number) => {
    const filledBlocks = Math.round(progress / 10);
    const emptyBlocks = 10 - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  };

  const renderDashboard = () => {
    const paginatedJobs = getPaginatedJobs();
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">🔍 Service Tracking</h1>
            <p className="text-sm text-slate-500">Real-time Status Updates</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Status</option>
            {STATUS_STAGES.map(stage => (
              <option key={stage.key} value={stage.key}>{stage.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              fetchJobs();
            }}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedJobs.map((job) => {
            const CurrentIcon = getStatusIcon(job.status);
            const progress = job.progress || getProgressPercentage(job.status);
            
            return (
              <div key={job._id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusEmoji(job.status)}</span>
                      <div>
                        <div className="font-bold text-slate-900">JOB #{job.jobCardNumber}</div>
                        <div className="text-xs text-slate-500">{job.vehicle?.make} {job.vehicle?.model}</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                      <CurrentIcon className="w-3 h-3 inline mr-1" />
                      {job.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-medium text-slate-700">{getCustomerName(job)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Complaint:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">{job.complaint || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Technician:</span>
                      <span className="font-medium text-slate-700">{getTechnicianName(job)}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress:</span>
                      <span className="font-bold text-slate-700">{progress}%</span>
                    </div>
                    <div className="font-mono text-xs text-slate-600 bg-slate-50 p-1 rounded">
                      {renderProgressBar(progress)} {progress}%
                    </div>
                  </div>

                  {/* Estimated Completion */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Est. Completion:</span>
                    <span className="font-medium text-slate-700">
                      {job.estimatedDelivery ? formatDate(job.estimatedDelivery) : 'TBD'}
                    </span>
                  </div>

                  {/* Last Update */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Last Update:</span>
                    <span className="font-medium text-slate-700">
                      {job.updatedAt ? formatDateTime(job.updatedAt) : 'N/A'}
                    </span>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setViewMode('details');
                      fetchTimelineData(job._id);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {paginatedJobs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No service jobs found</p>
          </div>
        )}
      </div>
    );
  };

  const renderDetailsView = () => {
    if (!selectedJob) return null;
    
    const job = selectedJob;
    const CurrentIcon = getStatusIcon(job.status);
    const progress = job.progress || getProgressPercentage(job.status);
    const currentIdx = getStageIndex(job.status);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">📊 Service Tracking - Job #{job.jobCardNumber}</h1>
            <p className="text-sm text-slate-500">{job.vehicle?.make} {job.vehicle?.model} - {getCustomerName(job)}</p>
          </div>
        </div>

        {/* Current Service Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">🔄 CURRENT SERVICE STATUS</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Job Card Number</div>
                <div className="text-sm font-semibold text-slate-700">{job.jobCardNumber}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Vehicle</div>
                <div className="text-sm font-semibold text-slate-700">{job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.year})</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Reg No.</div>
                <div className="text-sm font-semibold text-slate-700">{job.vehicle?.registrationNumber}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Complaint</div>
                <div className="text-sm font-semibold text-slate-700">{job.complaint}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Assigned Technician</div>
                <div className="text-sm font-semibold text-slate-700">{getTechnicianName(job)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Current Status</div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                  <CurrentIcon className="w-3 h-3" />
                  {job.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Est. Completion</div>
                <div className="text-sm font-semibold text-slate-700">{job.estimatedDelivery ? formatDateTime(job.estimatedDelivery) : 'TBD'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-400 mb-1">Latest Update</div>
                <div className="text-sm font-semibold text-slate-700">{job.updatedAt ? formatDateTime(job.updatedAt) : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetchJobs()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Full History
          </button>
          <button
            onClick={() => setViewMode('progress')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View Progress
          </button>
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    if (!selectedJob) return null;
    
    const job = selectedJob;
    const eventsToUse = timelineData.length > 0 ? timelineData : getTimelineEvents(job);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('details')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">⏱️ Service Timeline - Full History</h1>
            <p className="text-sm text-slate-500">JOB #{job.jobCardNumber} - {job.vehicle?.make} {job.vehicle?.model}</p>
          </div>
        </div>

        {/* Complete Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">📋 COMPLETE SERVICE TIMELINE</h2>
            <p className="text-sm text-slate-500">Total Events: {eventsToUse.length}</p>
          </div>
          <div className="p-6">
            {isLoadingTimeline ? (
              <div className="text-center py-8 text-slate-500">Loading timeline...</div>
            ) : (
              <div className="space-y-6">
                {eventsToUse.map((event: any, index: number) => {
                  const isLast = index === eventsToUse.length - 1;
                  const eventDate = event.createdAt || event.date;
                  const eventLabel = event.description || event.label;
                  const performedBy = event.performedByName || event.performedBy;
                  
                  return (
                    <div key={event._id || event.status} className="relative">
                      {/* Timeline connector */}
                      {!isLast && (
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-slate-200" />
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          'bg-emerald-500 text-white'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="text-xs text-slate-500 mb-1">
                            🟢 {formatDateTime(eventDate)}
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="text-sm font-semibold text-slate-900 mb-2">
                              {eventLabel}
                            </div>
                            {performedBy && (
                              <div className="text-xs text-slate-500">
                                👤 By: {performedBy}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {eventsToUse.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No timeline events recorded yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setViewMode('details')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    );
  };

  const renderProgressView = () => {
    if (!selectedJob) return null;
    
    const job = selectedJob;
    const progress = job.progress || getProgressPercentage(job.status);
    const currentIdx = getStageIndex(job.status);
    const timelineEvents = timelineData.length > 0 ? timelineData : getTimelineEvents(job);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode('details')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Details
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">📊 Status Progress - JOB #{job.jobCardNumber}</h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">📈 STATUS PROGRESS BAR</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                  <span key={p}>{p}%</span>
                ))}
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-extrabold text-brand-600">{progress}%</span>
                <span className="text-sm text-slate-500 ml-2">Current Progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Milestones */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">🎯 STATUS MILESTONES</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {STATUS_STAGES.map((stage, i) => {
                const StageIcon = stage.Icon;
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                const isPending = i > currentIdx;
                const eventHistory = timelineEvents.find((e: any) => {
                  if (e.eventType) {
                    const eventTypeMap: Record<string, string> = {
                      'appointment_approved': 'approved',
                      'vehicle_checked_in': 'pending',
                      'inspection_started': 'diagnosing',
                      'parts_requested': 'waiting_for_parts',
                      'repair_started': 'repair_in_progress',
                      'testing_started': 'testing',
                      'ready_for_pickup': 'ready_for_delivery',
                      'vehicle_delivered': 'delivered',
                    };
                    return eventTypeMap[e.eventType] === stage.key;
                  }
                  return e.status === stage.key;
                });
                
                return (
                  <div key={stage.key} className={`p-4 rounded-lg border-2 ${
                    isDone ? 'bg-emerald-50 border-emerald-200' :
                    isCurrent ? 'bg-brand-50 border-brand-200' :
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isDone ? 'bg-emerald-500 text-white' :
                          isCurrent ? 'bg-brand-500 text-white' :
                          'bg-slate-200 text-slate-400'
                        }`}>
                          <StageIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${
                            isCurrent ? 'text-brand-700' : isDone ? 'text-emerald-700' : 'text-slate-500'
                          }`}>
                            {stage.label}
                          </div>
                          <div className="text-xs text-slate-400">{stage.progress}%</div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isDone ? 'bg-emerald-100 text-emerald-700' :
                        isCurrent ? 'bg-brand-100 text-brand-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {isDone ? 'COMPLETED' : isCurrent ? 'CURRENT' : 'PENDING'}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <div className="text-xs text-slate-500">
                        {eventHistory ? `📅 ${formatDateTime(eventHistory.createdAt || eventHistory.date)}` : `📅 Expected: TBD`}
                      </div>
                      {isCurrent && (
                        <div className="text-xs text-brand-600 mt-1">
                          ⏳ Estimated: {job.estimatedDelivery ? formatDateTime(job.estimatedDelivery) : 'TBD'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetchJobs()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setViewMode('details')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobs} />;

  if (jobs.length === 0 && !showAppointments) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-card">
        <Car className="w-14 h-14 text-slate-200 mx-auto mb-4" />
        <h3 className="font-bold text-slate-700 mb-1">No Active Service Jobs</h3>
        <p className="text-sm text-slate-400">Book an appointment and our team will create a job card for tracking.</p>
      </div>
    );
  }

  if (showAppointments && appointments.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-card">
        <Calendar className="w-14 h-14 text-slate-200 mx-auto mb-4" />
        <h3 className="font-bold text-slate-700 mb-1">No Active Appointments</h3>
        <p className="text-sm text-slate-400">Book an appointment to get started with service tracking.</p>
      </div>
    );
  }

  // Show appointments when no job cards exist
  if (showAppointments && appointments.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Service Tracking</h1>
          <p className="text-sm text-slate-500">Your appointments awaiting job card creation</p>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Pending Appointments</h2>
            <p className="text-sm text-slate-500">These appointments will be converted to job cards once approved</p>
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold">
                        {apt.appointmentNumber}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Vehicle</div>
                        <div className="text-sm font-semibold text-slate-700">
                          {apt.vehicle?.registrationNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {apt.vehicle?.make} {apt.vehicle?.model}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Service Type</div>
                        <div className="text-sm font-semibold text-slate-700">{apt.serviceType}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Scheduled Date</div>
                        <div className="text-sm font-semibold text-slate-700">
                          {formatDate(apt.preferredDate)} at {apt.preferredTime}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Complaint</div>
                        <div className="text-sm text-slate-700">{apt.complaint || 'No complaint specified'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-blue-900">Job Card Pending</div>
              <div className="text-xs text-blue-700">
                Your appointment is being processed. A job card will be created once the appointment is approved and your vehicle arrives at the workshop.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render different views based on viewMode
  switch (viewMode) {
    case 'dashboard':
      return renderDashboard();
    case 'details':
      return renderDetailsView();
    case 'timeline':
      return renderTimelineView();
    case 'progress':
      return renderProgressView();
    default:
      return renderDashboard();
  }
};
