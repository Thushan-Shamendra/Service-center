import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { workLogApi } from '../../api/workLogApi';
import { roadTestApi } from '../../api/roadTestApi';
import { sparePartsApi } from '../../api/sparePartsApi';
import { finalInspectionReportApi } from '../../api/finalInspectionReportApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Wrench,
  Clock,
  Plus,
  Edit,
  Eye,
  ChevronRight,
  Play,
  Pause,
  CheckCircle,
  Save,
  FileText,
  AlertCircle,
  Calendar,
  Trash2,
  Car,
  AlertTriangle,
  Package,
  Camera,
  Video,
  ClipboardList,
  User,
  Phone,
  MapPin,
  Gauge,
  ListChecks,
  ClipboardCheck,
  FileCheck,
  Printer,
  Send,
  Download,
  X,
  Check,
  Loader,
} from 'lucide-react';

// Status options with colors, icons, and progress (matching wireframe mapping)
const STATUS_OPTIONS = [
  { value: 'inspection_complete', label: 'Inspection Complete', color: 'blue', icon: '✅', progress: 20, code: 'IC' },
  { value: 'repair_started', label: 'Repair Started', color: 'orange', icon: '🔧', progress: 35, code: 'RS' },
  { value: 'waiting_for_parts', label: 'Waiting for Parts', color: 'yellow', icon: '⏳', progress: 40, code: 'WP' },
  { value: 'repair_in_progress', label: 'Repair In Progress', color: 'purple', icon: '🔧', progress: 70, code: 'RP' },
  { value: 'testing', label: 'Testing', color: 'cyan', icon: '🚗', progress: 90, code: 'TE' },
  { value: 'work_complete', label: 'Work Complete', color: 'green', icon: '✅', progress: 100, code: 'WC' },
];

// Sequential status transitions (what can transition to what)
const VALID_TRANSITIONS: Record<string, string[]> = {
  'inspection_complete': ['repair_started'],
  'repair_started': ['repair_in_progress', 'waiting_for_parts'],
  'waiting_for_parts': ['repair_in_progress'],
  'repair_in_progress': ['testing'],
  'testing': ['work_complete'],
  'work_complete': [], // Final state
};

const getStatusColor = (status: string) => {
  const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
  if (!statusOption) return 'bg-gray-100 text-gray-800';
  
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    green: 'bg-green-100 text-green-800 border-green-200',
  };
  return colorMap[statusOption.color] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusLabel = (status: string) => {
  const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption?.label || status;
};

const getProgressForStatus = (status: string) => {
  const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption?.progress || 0;
};

// Get valid next statuses based on current status
const getValidNextStatuses = (currentStatus: string) => {
  return VALID_TRANSITIONS[currentStatus] || [];
};

// Check if transition is valid
const isValidTransition = (fromStatus: string, toStatus: string) => {
  const validTransitions = VALID_TRANSITIONS[fromStatus] || [];
  return validTransitions.includes(toStatus);
};

// Get step number for timeline display
const getStepNumber = (status: string) => {
  const statusFlow = ['inspection_complete', 'repair_started', 'waiting_for_parts', 'repair_in_progress', 'testing', 'work_complete'];
  return statusFlow.indexOf(status) + 1;
};

// Get total steps
const getTotalSteps = () => {
  return 6; // Total number of status steps in the workflow
};

const getElapsedTime = (startTime: string) => {
  if (!startTime) return '0m';
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins} Minutes`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours} Hour${hours > 1 ? 's' : ''} ${mins} Minutes`;
};

// Format time duration
const formatDuration = (startTime: string, endTime?: string) => {
  if (!startTime) return '0m';
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins} mins`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
};

export const RepairProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [roadTests, setRoadTests] = useState<any[]>([]);
  const [partsRequests, setPartsRequests] = useState<any[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newWorkLog, setNewWorkLog] = useState({
    workDescription: '',
    workStartTime: '',
    workEndTime: '',
    remarks: '',
  });
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    progress: 0,
    remarks: '',
  });

  useEffect(() => {
    if (jobCardId) {
      fetchJobDetails(jobCardId);
    }
  }, [jobCardId]);

  useEffect(() => {
    if (job) {
      fetchWorkLogs(job._id);
      fetchRoadTests(job._id);
      fetchPartsRequests(job._id);
      fetchFinalReport(job._id);
      // Initialize status update with current job status
      setStatusUpdate({
        status: job.status,
        progress: job.progress || getProgressForStatus(job.status),
        remarks: '',
      });
    }
  }, [job]);

  const fetchJobDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await jobCardApi.getJobCardById(id);
      if (res.success) {
        setJob(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch job details');
      }
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch job details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkLogs = async (jobId: string) => {
    try {
      const res = await workLogApi.getWorkLogs({ jobCard: jobId });
      if (res.data.success) {
        setWorkLogs(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch work logs');
    }
  };

  const fetchRoadTests = async (jobId: string) => {
    try {
      const res = await roadTestApi.getRoadTests({ jobCard: jobId });
      if (res.data.success) {
        setRoadTests(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch road tests');
    }
  };

  const fetchPartsRequests = async (jobId: string) => {
    try {
      const res = await sparePartsApi.getSparePartsByJobCard(jobId);
      if (res.success) {
        setPartsRequests(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch parts requests');
    }
  };

  const fetchFinalReport = async (jobId: string) => {
    try {
      const res = await finalInspectionReportApi.getReportDataForJobCard(jobId);
      if (res.success) {
        setFinalReport(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch final report');
    }
  };

  const handleAddWorkLog = async () => {
    if (!job) return;

    try {
      const res = await workLogApi.createWorkLog({
        jobCard: job._id,
        ...newWorkLog,
        workStartTime: new Date(newWorkLog.workStartTime),
        workEndTime: new Date(newWorkLog.workEndTime),
      });
      if (res.data.success) {
        toast.success('Work log added successfully');
        setShowWorkLogModal(false);
        setNewWorkLog({ workDescription: '', workStartTime: '', workEndTime: '', remarks: '' });
        fetchWorkLogs(job._id);
      }
    } catch (error) {
      toast.error('Failed to add work log');
    }
  };

  const handleUpdateStatus = async () => {
    if (!job) return;

    // Validate status transition
    if (!isValidTransition(job.status, statusUpdate.status)) {
      toast.error(`Invalid status transition from ${getStatusLabel(job.status)} to ${getStatusLabel(statusUpdate.status)}`);
      return;
    }

    // Check if trying to complete testing without a passed road test
    if (job.status === 'testing' && statusUpdate.status === 'work_complete') {
      const hasPassedRoadTest = roadTests.some(rt => rt.result === 'pass');
      if (!hasPassedRoadTest) {
        toast.error('⚠️ Road test must be completed and passed before marking Work Complete');
        return;
      }
    }

    try {
      const res = await jobCardApi.updateJobCardStatus(job._id, {
        status: statusUpdate.status,
        progress: statusUpdate.progress,
        remarks: statusUpdate.remarks,
      });
      if (res.success) {
        toast.success('Status updated successfully');
        setShowStatusModal(false);
        setJob(res.data);
        fetchJobDetails(job._id);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Auto-calculate hours worked based on start and end time
  const calculateHoursWorked = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.max(0, diffHours).toFixed(2);
  };

  // Format hours for display
  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  // Get total hours worked today
  const getTotalHoursToday = () => {
    const today = new Date().toDateString();
    const todayLogs = workLogs.filter(log => 
      new Date(log.workStartTime).toDateString() === today
    );
    return todayLogs.reduce((acc, log) => acc + (log.hoursWorked || 0), 0).toFixed(2);
  };

  // Check if job is waiting for parts
  const isWaitingForParts = job?.status === 'waiting_for_parts';

  // Get latest road test status
  const latestRoadTest = roadTests.length > 0 ? roadTests[0] : null;
  const hasPassedRoadTest = roadTests.some(rt => rt.result === 'pass');
  const roadTestPending = !latestRoadTest || latestRoadTest.result === 'fail';
  const isTestingPhase = job?.status === 'testing';
  const testingProgress = hasPassedRoadTest ? 100 : 80;

  // Get customer and vehicle info
  const customerName = job?.customer?.user 
    ? `${job.customer.user.firstName || ''} ${job.customer.user.lastName || ''}`.trim() 
    : job?.customer?.name || 'N/A';
  const vehicleName = job?.vehicle 
    ? `${job.vehicle.make || ''} ${job.vehicle.model || ''}`.trim() 
    : 'N/A';
  const vehiclePlate = job?.vehicle?.plateNumber || job?.vehicle?.registrationNumber || 'N/A';
  const technicianName = job?.assignedTechnician?.user 
    ? `${job.assignedTechnician.user.firstName || ''} ${job.assignedTechnician.user.lastName || ''}`.trim() 
    : 'N/A';
  const serviceBay = job?.serviceBay || 'N/A';

  // Get status history for display
  const getStatusUpdatedTime = () => {
    if (job?.statusHistory && job.statusHistory.length > 0) {
      const lastEntry = job.statusHistory[job.statusHistory.length - 1];
      return new Date(lastEntry.changedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return 'N/A';
  };

  // Timeline component
  const Timeline = () => {
    const steps = [
      { key: 'inspection_complete', label: 'Inspection', shortLabel: 'Insp.' },
      { key: 'repair_started', label: 'Start', shortLabel: 'Start' },
      { key: 'waiting_for_parts', label: 'Parts', shortLabel: 'Parts' },
      { key: 'repair_in_progress', label: 'Progress', shortLabel: 'Prog.' },
      { key: 'testing', label: 'Test', shortLabel: 'Test' },
      { key: 'work_complete', label: 'Complete', shortLabel: 'Complete' },
    ];

    const currentStepIndex = steps.findIndex(step => step.key === job?.status);
    
    return (
      <div className="flex items-center justify-between mt-6 px-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${isCompleted ? 'bg-green-500 text-white' : 
                    isCurrent ? 'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-400'}
                `}>
                  {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                </div>
                <span className={`text-xs mt-1 ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                  {step.shortLabel}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2
                  ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Job Card Details Section (Auto-Filled)
  const JobCardDetailsSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <ClipboardList className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">📋 JOB CARD DETAILS (AUTO-FILLED)</h2>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="text-sm font-medium text-gray-900">{customerName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Car className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Vehicle</p>
              <p className="text-sm font-medium text-gray-900">{vehicleName} ({vehiclePlate})</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Complaint</p>
              <p className="text-sm font-medium text-gray-900">{job?.complaint || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Wrench className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Technician</p>
              <p className="text-sm font-medium text-gray-900">{technicianName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Assigned Bay</p>
              <p className="text-sm font-medium text-gray-900">{serviceBay}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Gauge className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Odometer</p>
              <p className="text-sm font-medium text-gray-900">{job?.odometer ? `${job.odometer.toLocaleString()} km` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Current Status Section (Auto-Filled)
  const CurrentStatusSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <CheckCircle className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">📌 CURRENT STATUS (AUTO-FILLED)</h2>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(job?.status)}`}>
              {STATUS_OPTIONS.find(opt => opt.value === job?.status)?.icon} {getStatusLabel(job?.status)}
            </span>
            <span className="text-sm text-gray-500">
              (Updated: {getStatusUpdatedTime()})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Progress:</span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${isTestingPhase && hasPassedRoadTest ? 'bg-green-500' : 'bg-blue-600'}`}
                style={{ width: `${isTestingPhase ? testingProgress : (job?.progress || getProgressForStatus(job?.status))}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {isTestingPhase ? testingProgress : (job?.progress || getProgressForStatus(job?.status))}%
            </span>
          </div>
        </div>
      </div>
      <Timeline />
    </div>
  );

  // Update Status Section
  const UpdateStatusSection = () => {
    const validNextStatuses = getValidNextStatuses(job?.status);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Edit className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">🔄 UPDATE STATUS</h2>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">New Status:</label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => {
                const isValid = isValidTransition(job?.status, option.value);
                const isCurrent = job?.status === option.value;
                const isRecommended = validNextStatuses[0] === option.value;
                
                // Block transitioning from testing to work_complete without a passed road test
                const isBlocked = job?.status === 'testing' && option.value === 'work_complete' && !hasPassedRoadTest;
                
                return (
                  <label
                    key={option.value}
                    className={`
                      flex items-center p-3 rounded-lg border cursor-pointer transition-all
                      ${isCurrent ? 'bg-blue-50 border-blue-300' : 
                        isValid && !isBlocked ? 'hover:bg-gray-50 border-gray-200' : 
                        'opacity-50 cursor-not-allowed border-gray-100'}
                    `}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={statusUpdate.status === option.value}
                      onChange={(e) => {
                        if (isValid && !isBlocked) {
                          const newStatus = e.target.value;
                          setStatusUpdate({
                            ...statusUpdate,
                            status: newStatus,
                            progress: getProgressForStatus(newStatus),
                          });
                        }
                      }}
                      disabled={!isValid || isBlocked}
                      className="mr-3"
                    />
                    <span className="flex-1">
                      {isCurrent && <span className="text-xs text-gray-500 mr-2">(Current)</span>}
                      {isRecommended && <span className="text-xs text-blue-600 font-bold mr-2">← RECOMMENDED</span>}
                      {isBlocked && <span className="text-xs text-red-500 font-bold mr-2">⚠️ REQUIRES ROAD TEST PASS</span>}
                      {option.icon} {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Progress Display */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress:</span>
              <span className="text-sm font-bold text-gray-900">{statusUpdate.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${statusUpdate.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Remarks with character count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📝 REMARKS</label>
            <div className="relative">
              <textarea
                value={statusUpdate.remarks}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setStatusUpdate({ ...statusUpdate, remarks: e.target.value });
                  }
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Enter status update remarks..."
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {statusUpdate.remarks.length}/500
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate(`/employee/assigned-jobs/${jobCardId}`)}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>↩️ Cancel</span>
            </button>
            <button
              onClick={() => {
                toast.success('Draft saved');
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>💾 Save Draft</span>
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={!isValidTransition(job?.status, statusUpdate.status) || (job?.status === 'testing' && statusUpdate.status === 'work_complete' && !hasPassedRoadTest)}
              className={`
                flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1
                ${isValidTransition(job?.status, statusUpdate.status) && !(job?.status === 'testing' && statusUpdate.status === 'work_complete' && !hasPassedRoadTest)
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
              `}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{job?.status === 'testing' ? '✅ MARK COMPLETE' : '✅ UPDATE STATUS'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Inspection Notes Section (for inspection_complete status)
  const InspectionNotesSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <ClipboardCheck className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">📝 INSPECTION NOTES</h2>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        {job?.problemsFound && job.problemsFound.length > 0 ? (
          <ul className="space-y-2">
            {job.problemsFound.map((problem: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{problem}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No inspection notes recorded</p>
        )}
        {job?.inspectionNotes && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-gray-500 mb-1">Additional Notes:</p>
            <p className="text-sm text-gray-800">{job.inspectionNotes}</p>
          </div>
        )}
      </div>
      
      {/* Evidence Uploaded */}
      {job?.evidence && job.evidence.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📎 Evidence Uploaded</p>
          <div className="flex flex-wrap gap-2">
            {job.evidence.map((ev: any, index: number) => (
              <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                {ev.type === 'video' ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                {ev.caption || `evidence_${index + 1}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Repair Actions Section (for repair_started status)
  const RepairActionsSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Wrench className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">🔧 REPAIR ACTIONS TAKEN</h2>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        {job?.workPerformed && job.workPerformed.length > 0 ? (
          <ul className="space-y-2">
            {job.workPerformed.map((action: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No repair actions recorded yet</p>
        )}
      </div>
    </div>
  );

  // Parts Request Section (for waiting_for_parts status)
  const PartsRequestSection = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Package className="w-5 h-5 text-yellow-600" />
        <h2 className="text-lg font-semibold text-yellow-900">📦 PARTS REQUESTED (SENT TO MANAGER)</h2>
      </div>
      <div className="bg-white rounded-lg p-4 border border-yellow-100">
        {partsRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Part Name</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Qty</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {partsRequests.map((request: any) => (
                  <tr key={request._id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900">{request.itemName}</td>
                    <td className="py-2 px-3 text-gray-900">{request.requestedQuantity}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        request.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status === 'approved' ? '✅ Approved' :
                         request.status === 'rejected' ? '❌ Rejected' :
                         request.status === 'issued' ? '📦 Issued' :
                         '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No parts requested yet</p>
        )}
        
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">⚠️ CANNOT proceed until parts are approved</span>
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            ⏳ Estimated wait: 15-30 minutes
          </div>
        </div>
      </div>
    </div>
  );

  // Work Progress Section (for repair_in_progress status)
  const WorkProgressSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <ListChecks className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">🔧 WORK PROGRESS</h2>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        {job?.workPerformed && job.workPerformed.length > 0 ? (
          <ul className="space-y-2">
            {job.workPerformed.map((action: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No work progress recorded yet</p>
        )}
      </div>
    </div>
  );

  // Testing Section (for testing status)
  const TestingSection = () => (
    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Car className="w-5 h-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-cyan-900">
            🚗 TESTING PHASE {hasPassedRoadTest ? '- COMPLETE' : ''}
          </h2>
        </div>
        {hasPassedRoadTest && (
          <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
            ✅ All tests passed
          </span>
        )}
      </div>

      {hasPassedRoadTest && latestRoadTest ? (
        <>
          {/* Road Test Summary */}
          <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">🚗 ROAD TEST SUMMARY</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Result</p>
                <p className="text-sm font-semibold text-green-600">✅ PASS</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Tested</p>
                <p className="text-sm text-gray-900">
                  {new Date(latestRoadTest.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
                   new Date(latestRoadTest.testDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Distance</p>
                <p className="text-sm text-gray-900">{latestRoadTest.distanceCovered || 0} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Evidence</p>
                <p className="text-sm text-gray-900">
                  {latestRoadTest.evidence?.filter((e: any) => e.type === 'image').length || 0} Images, {latestRoadTest.evidence?.filter((e: any) => e.type === 'video').length || 0} Video
                </p>
              </div>
            </div>
            {latestRoadTest.remarks && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                <p className="text-sm text-gray-800">{latestRoadTest.remarks}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/employee/final-inspection-form/${jobCardId}`)}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" />
              📋 SUBMIT FINAL REPORT
            </button>
            <button
              onClick={() => navigate(`/employee/road-test-history/${jobCardId}`)}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-semibold"
            >
              <Car className="w-4 h-4" />
              📊 VIEW ROAD TEST
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Road Test Warning */}
          <div className="bg-white rounded-lg p-4 border border-yellow-200 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🚗 ROAD TEST REQUIRED</h3>
            <div className="flex items-start gap-2 text-sm text-yellow-800 mb-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Road test must be completed before testing phase can be marked as complete.
              </span>
            </div>
            <button
              onClick={() => navigate(`/employee/road-test-form/${jobCardId}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold"
            >
              <Car className="w-4 h-4" />
              🚗 PERFORM ROAD TEST
            </button>
          </div>

          {/* Prior Failed Test Warning */}
          {latestRoadTest?.result === 'fail' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                ⚠️ PREVIOUS ROAD TEST FAILED
              </div>
              <p className="text-sm text-red-700 mb-3">
                Fix identified issues and perform a new road test.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/employee/road-test-fail/${jobCardId}`)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  📋 View Failed Test Details
                </button>
                <button
                  onClick={() => navigate(`/employee/road-test-history/${jobCardId}`)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  📊 View All Road Tests
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
          <span className="text-xs font-semibold text-cyan-700">
            {hasPassedRoadTest ? '100% (Testing Complete)' : '90%'}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${hasPassedRoadTest ? 'bg-green-500' : 'bg-cyan-500'}`}
            style={{ width: `${hasPassedRoadTest ? 100 : 90}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Work Complete Section (for work_complete status)
  const WorkCompleteSection = () => (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <FileCheck className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-green-900">✅ WORK COMPLETE - FINAL INSPECTION REPORT</h2>
      </div>

      {/* Job Card Summary */}
      <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 JOB CARD SUMMARY</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Customer</p>
            <p className="text-sm font-medium text-gray-900">{customerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Vehicle</p>
            <p className="text-sm font-medium text-gray-900">{vehicleName} ({vehiclePlate})</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Technician</p>
            <p className="text-sm font-medium text-gray-900">{technicianName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className="text-sm font-semibold text-green-600">✅ Work Complete</p>
          </div>
        </div>
      </div>

      {/* Work Performed */}
      <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🔧 WORK PERFORMED</h3>
        {job?.workPerformed && job.workPerformed.length > 0 ? (
          <ul className="space-y-2">
            {job.workPerformed.map((action: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No work performed recorded</p>
        )}
      </div>

      {/* Parts Replaced */}
      {job?.parts && job.parts.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🔩 PARTS REPLACED</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Part Name</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Qty</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Unit Price</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {job.parts.map((part: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900">{part.name || part.item?.name || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-900">{part.quantity}</td>
                    <td className="py-2 px-3 text-gray-900">Rs. {part.unitPrice?.toLocaleString() || '0'}</td>
                    <td className="py-2 px-3 text-gray-900">Rs. {part.total?.toLocaleString() || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Check */}
      <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">✅ SAFETY CHECK</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
            ● Pass
          </span>
          <span className="text-sm text-gray-500">(All safety checks completed)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['Brakes', 'Lights', 'Steering', 'Tyres', 'Fluids', 'Electrical', 'Seatbelts', 'Horn', 'Mirrors'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Road Test Result */}
      {latestRoadTest && (
        <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🛣️ ROAD TEST RESULT (AUTO-FILLED FROM TESTING)</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
              latestRoadTest.result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {latestRoadTest.result === 'pass' ? '● Pass' : '● Fail'}
            </span>
            <span className="text-sm text-gray-500">(From Road Test)</span>
          </div>
          {latestRoadTest.remarks && (
            <p className="text-sm text-gray-800">{latestRoadTest.remarks}</p>
          )}
        </div>
      )}

      {/* Remaining Issues */}
      {job?.finalInspection?.remainingIssues && (
        <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">⚠️ REMAINING ISSUES</h3>
          <p className="text-sm text-gray-800">{job.finalInspection.remainingIssues}</p>
        </div>
      )}

      {/* Future Recommendations */}
      {job?.finalInspection?.futureRecommendations && (
        <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 FUTURE RECOMMENDATIONS</h3>
          <p className="text-sm text-gray-800">{job.finalInspection.futureRecommendations}</p>
        </div>
      )}

      {/* Mechanic Final Remarks */}
      {job?.finalInspection?.mechanicRemarks && (
        <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📝 MECHANIC FINAL REMARKS</h3>
          <p className="text-sm text-gray-800">{job.finalInspection.mechanicRemarks}</p>
        </div>
      )}

      {/* Evidence Upload */}
      {job?.evidence && job.evidence.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📎 EVIDENCE UPLOAD</h3>
          <div className="flex flex-wrap gap-2">
            {job.evidence.map((ev: any, index: number) => (
              <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                {ev.type === 'video' ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                {ev.caption || `evidence_${index + 1}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Time Summary */}
      <div className="bg-white rounded-lg p-4 border border-green-100 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">⏱️ FINAL TIME SUMMARY</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Inspection Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'inspection').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Repair Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'repair').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Waiting Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'waiting').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Testing Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'testing').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg p-4 border border-green-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">📊 PROGRESS: 100% - COMPLETE</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-green-500 h-3 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={() => navigate(`/employee/final-inspection-form/${jobCardId}`)}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <FileText className="w-4 h-4" />
          ✅ SUBMIT FINAL REPORT
        </button>
        <button
          onClick={() => navigate(`/employee/final-inspection-preview/${finalReport?._id || ''}`)}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-semibold"
        >
          <Printer className="w-4 h-4" />
          🖨️ PRINT REPORT
        </button>
        <button
          onClick={() => navigate(`/employee/final-inspection-preview/${finalReport?._id || ''}`)}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-semibold"
        >
          <Send className="w-4 h-4" />
          📧 SEND TO CUSTOMER
        </button>
      </div>
    </div>
  );

  // Time Tracking Section
  const TimeTrackingSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">⏱️ TIME TRACKING</h2>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Inspection Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'inspection').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Repair Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'repair').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Waiting Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'waiting').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Testing Time</p>
            <p className="text-sm font-medium text-gray-900">
              {job?.timeLogs?.filter((t: any) => t.type === 'testing').reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0} hrs
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!jobCardId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No job card ID provided</p>
          <button
            onClick={() => navigate('/employee/assigned-jobs')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Assigned Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Job not found</p>
          <button
            onClick={() => navigate('/employee/assigned-jobs')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Assigned Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-card p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/employee/assigned-jobs/${jobCardId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">← Back to Job</span>
          </button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-brand-600" />
            <span className="text-sm font-bold text-slate-900">🔧 REPAIR PROGRESS UPDATE</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="text-lg font-bold text-slate-900">
            JOB #{job.jobCardNumber || 'N/A'} - {vehicleName}
          </div>
        </div>
      </div>

      {/* Job Card Details (Auto-Filled) */}
      <JobCardDetailsSection />

      {/* Current Status (Auto-Filled) */}
      <CurrentStatusSection />

      {/* Update Status */}
      <UpdateStatusSection />

      {/* Status-specific sections */}
      {job.status === 'inspection_complete' && <InspectionNotesSection />}
      {job.status === 'repair_started' && <RepairActionsSection />}
      {isWaitingForParts && <PartsRequestSection />}
      {job.status === 'repair_in_progress' && <WorkProgressSection />}
      {isTestingPhase && <TestingSection />}
      {job.status === 'work_complete' && <WorkCompleteSection />}

      {/* Time Tracking */}
      <TimeTrackingSection />

      {/* Repair Work Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">📋 REPAIR WORK LOG</h2>
          </div>
          <button
            onClick={() => setShowWorkLogModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Log Entry</span>
          </button>
        </div>

        {workLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No work logs recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workLogs.map((log) => (
              <div key={log._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Log ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{log.workLogId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Job Card</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{job.jobCardNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hours Worked</p>
                    <p className="text-sm font-semibold text-gray-900">{log.hoursWorked?.toFixed(2)} Hours</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Work Description:</p>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-sm text-gray-900">{log.workDescription}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Work Start Time</p>
                    <p className="text-sm text-gray-900">{new Date(log.workStartTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Work End Time</p>
                    <p className="text-sm text-gray-900">{new Date(log.workEndTime).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-sm text-gray-900">{log.remarks || 'No remarks'}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Total Hours Logged:</p>
                <p className="text-lg font-bold text-gray-900">{getTotalHoursToday()} Hours</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Work Log Modal */}
      {showWorkLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">✏️ ADD WORK LOG ENTRY</h3>
              </div>
              <button
                onClick={() => {
                  setShowWorkLogModal(false);
                  setNewWorkLog({ workDescription: '', workStartTime: '', workEndTime: '', remarks: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Auto-generated fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Log ID</label>
                  <input
                    type="text"
                    value={`WLOG-${new Date().toISOString().split('T')[0].replace(/-/g, '-')}-${String(workLogs.length + 1).padStart(3, '0')}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">(Auto)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Card</label>
                  <input
                    type="text"
                    value={job.jobCardNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">(Auto)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Description *</label>
                <textarea
                  value={newWorkLog.workDescription}
                  onChange={(e) => setNewWorkLog({ ...newWorkLog, workDescription: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the repair work performed..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time *</label>
                  <input
                    type="datetime-local"
                    value={newWorkLog.workStartTime}
                    onChange={(e) => setNewWorkLog({ ...newWorkLog, workStartTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work End Time *</label>
                  <input
                    type="datetime-local"
                    value={newWorkLog.workEndTime}
                    onChange={(e) => setNewWorkLog({ ...newWorkLog, workEndTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Auto-calculated hours */}
              {newWorkLog.workStartTime && newWorkLog.workEndTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                  <input
                    type="text"
                    value={`${calculateHoursWorked(newWorkLog.workStartTime, newWorkLog.workEndTime)} Hours`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">(Auto-calculated)</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={newWorkLog.remarks}
                  onChange={(e) => setNewWorkLog({ ...newWorkLog, remarks: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowWorkLogModal(false);
                  setNewWorkLog({ workDescription: '', workStartTime: '', workEndTime: '', remarks: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ❌ Cancel
              </button>
              <button
                onClick={handleAddWorkLog}
                disabled={!newWorkLog.workDescription || !newWorkLog.workStartTime || !newWorkLog.workEndTime}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                💾 Save Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};