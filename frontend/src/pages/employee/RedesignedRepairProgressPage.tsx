import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { repairProgressApi } from '../../api/repairProgressApi';
import { workLogApi } from '../../api/workLogApi';
import { roadTestApi } from '../../api/roadTestApi';
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
  Upload,
} from 'lucide-react';

// Status definitions matching wireframe
const STATUS_CONFIG = {
  inspection_complete: {
    label: 'Inspection Complete',
    icon: '🟡',
    color: 'yellow',
    progress: 20,
    nextActions: ['repair_started']
  },
  repair_started: {
    label: 'Repair Started',
    icon: '🔵',
    color: 'blue',
    progress: 35,
    nextActions: ['waiting_for_parts', 'repair_in_progress']
  },
  waiting_for_parts: {
    label: 'Waiting for Parts',
    icon: '🟠',
    color: 'orange',
    progress: 40,
    nextActions: ['repair_in_progress']
  },
  repair_in_progress: {
    label: 'Repair In Progress',
    icon: '🔵',
    color: 'blue',
    progress: 70,
    nextActions: ['testing']
  },
  testing: {
    label: 'Testing',
    icon: '🟣',
    color: 'purple',
    progress: 90,
    nextActions: ['work_complete']
  },
  work_complete: {
    label: 'Work Complete',
    icon: '✅',
    color: 'green',
    progress: 100,
    nextActions: ['create_final_inspection']
  }
};

const getStatusColorClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    green: 'bg-green-100 text-green-800 border-green-200',
  };
  return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const RedesignedRepairProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams();
  const [repairData, setRepairData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (jobCardId) {
      fetchRepairProgress();
    }
  }, [jobCardId]);

  const fetchRepairProgress = async () => {
    setIsLoading(true);
    try {
      const res = await repairProgressApi.getRepairProgress(jobCardId!);
      if (res.success) {
        setRepairData(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch repair progress');
      }
    } catch (error: any) {
      console.error('Error fetching repair progress:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch repair progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, remarks?: string) => {
    if (!repairData?.jobCard) return;

    try {
      const additionalData: any = {};
      
      // Add status-specific data
      if (newStatus === 'inspection_complete' && formData.inspectionNotes) {
        additionalData.inspectionNotes = formData.inspectionNotes;
        additionalData.problemsFound = formData.problemsFound;
      }
      if (newStatus === 'repair_started' && formData.assignedBay) {
        additionalData.assignedBay = formData.assignedBay;
      }
      if (newStatus === 'repair_in_progress' && formData.workPerformed) {
        additionalData.workPerformed = formData.workPerformed;
      }

      const res = await repairProgressApi.updateRepairStatus(repairData.jobCard._id, {
        status: newStatus,
        remarks,
        additionalData
      });

      if (res.success) {
        toast.success(`Status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`);
        setActiveModal(null);
        setFormData({});
        fetchRepairProgress();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCreateFinalInspection = () => {
    navigate(`/employee/final-inspection-form/${jobCardId}`);
  };

  const handleRoadTest = () => {
    navigate(`/employee/road-test-form/${jobCardId}`);
  };

  const handleRequestParts = () => {
    navigate(`/employee/request-parts/${jobCardId}`);
  };

  // Get customer and vehicle info
  const customerName = repairData?.jobCard?.customer?.user 
    ? `${repairData.jobCard.customer.user.firstName || ''} ${repairData.jobCard.customer.user.lastName || ''}`.trim() 
    : repairData?.jobCard?.customer?.name || 'N/A';
  const vehicleName = repairData?.jobCard?.vehicle 
    ? `${repairData.jobCard.vehicle.make || ''} ${repairData.jobCard.vehicle.model || ''}`.trim() 
    : 'N/A';
  const vehiclePlate = repairData?.jobCard?.vehicle?.plateNumber || repairData?.jobCard?.vehicle?.registrationNumber || 'N/A';
  const technicianName = repairData?.jobCard?.assignedTechnician?.user 
    ? `${repairData.jobCard.assignedTechnician.user.firstName || ''} ${repairData.jobCard.assignedTechnician.user.lastName || ''}`.trim() 
    : 'N/A';
  const currentStatus = repairData?.jobCard?.status || 'pending';
  const statusConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG];

  const getStatusUpdateTime = () => {
    if (repairData?.jobCard?.statusHistory && repairData.jobCard.statusHistory.length > 0) {
      const lastEntry = repairData.jobCard.statusHistory[repairData.jobCard.statusHistory.length - 1];
      return new Date(lastEntry.changedAt).toLocaleString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!repairData?.jobCard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Job card not found</p>
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(`/employee/assigned-jobs/${jobCardId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">← Back to Job</span>
          </button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">🔧 Repair Progress Update</span>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <h1 className="text-xl font-bold text-slate-900">
            Job Card #{repairData.jobCard.jobCardNumber || 'N/A'}
          </h1>
        </div>
      </div>

      {/* Job Details Section (Auto-filled) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">📋 Job Details (Auto-filled)</h2>
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
              <Wrench className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Technician</p>
                <p className="text-sm font-medium text-gray-900">{technicianName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Complaint</p>
                <p className="text-sm font-medium text-gray-900">{repairData.jobCard.complaint || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">📌 Current Status</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-full border ${getStatusColorClasses(statusConfig?.color || 'gray')}`}>
                {statusConfig?.icon} {statusConfig?.label}
              </span>
              <span className="text-sm text-gray-500">
                Updated: {getStatusUpdateTime()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Progress:</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${statusConfig?.progress || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {statusConfig?.progress || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status-Specific Sections */}
      {currentStatus === 'inspection_complete' && (
        <InspectionCompleteSection 
          jobCard={repairData.jobCard}
          onUpdate={(notes, problems) => {
            setFormData({ inspectionNotes: notes, problemsFound: problems });
            setActiveModal('update_status');
          }}
          onNext={() => handleStatusUpdate('repair_started')}
        />
      )}

      {currentStatus === 'repair_started' && (
        <RepairStartedSection 
          jobCard={repairData.jobCard}
          onWaitForParts={() => handleStatusUpdate('waiting_for_parts')}
          onInProgress={() => handleStatusUpdate('repair_in_progress')}
        />
      )}

      {currentStatus === 'waiting_for_parts' && (
        <WaitingForPartsSection 
          partsRequests={repairData.partsRequests}
          onRequestParts={handleRequestParts}
          onInProgress={() => handleStatusUpdate('repair_in_progress')}
        />
      )}

      {currentStatus === 'repair_in_progress' && (
        <RepairInProgressSection 
          jobCard={repairData.jobCard}
          onTesting={() => handleStatusUpdate('testing')}
        />
      )}

      {currentStatus === 'testing' && (
        <TestingSection 
          roadTests={repairData.roadTests}
          onRoadTest={handleRoadTest}
          onComplete={() => handleStatusUpdate('work_complete')}
        />
      )}

      {currentStatus === 'work_complete' && (
        <WorkCompleteSection 
          jobCard={repairData.jobCard}
          finalReport={repairData.finalReport}
          onCreateFinalInspection={handleCreateFinalInspection}
        />
      )}

      {/* Status Update Modal */}
      {activeModal === 'update_status' && (
        <StatusUpdateModal
          currentStatus={currentStatus}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setActiveModal(null);
            setFormData({});
          }}
          onSubmit={(remarks) => handleStatusUpdate(statusConfig?.nextActions[0] || currentStatus, remarks)}
        />
      )}
    </div>
  );
};

// Status-Specific Components

const InspectionCompleteSection = ({ jobCard, onUpdate, onNext }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
    {/* Inspection Notes */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">📝 Inspection Notes</h3>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        {jobCard.problemsFound && jobCard.problemsFound.length > 0 ? (
          <ul className="space-y-2">
            {jobCard.problemsFound.map((problem: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{problem}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No problems found recorded</p>
        )}
        {jobCard.inspectionNotes && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-gray-500 mb-1">Additional Notes:</p>
            <p className="text-sm text-gray-800">{jobCard.inspectionNotes}</p>
          </div>
        )}
      </div>
    </div>

    {/* Evidence Upload */}
    {jobCard.evidence && jobCard.evidence.length > 0 && (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">📎 Evidence Upload</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex flex-wrap gap-2">
            {jobCard.evidence.map((ev: any, index: number) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                {ev.type === 'video' ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                {ev.caption || `evidence_${index + 1}`}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Next Action */}
    <div className="border-t border-gray-200 pt-4">
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        <Play className="w-4 h-4" />
        ⏭️ Mark as Repair Started
      </button>
    </div>
  </div>
);

const RepairStartedSection = ({ jobCard, onWaitForParts, onInProgress }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
    {/* Work Started Details */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">🔧 Work Started Details</h3>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Started at</p>
            <p className="text-sm font-medium text-gray-900">
              {jobCard.statusHistory?.find((h: any) => h.status === 'repair_started')?.changedAt 
                ? new Date(jobCard.statusHistory.find((h: any) => h.status === 'repair_started').changedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Assigned Bay</p>
            <p className="text-sm font-medium text-gray-900">{jobCard.serviceBay || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Next Actions */}
    <div className="border-t border-gray-200 pt-4 space-y-3">
      <button
        onClick={onWaitForParts}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
      >
        <Package className="w-4 h-4" />
        ⏭️ Mark as Waiting for Parts
      </button>
      <button
        onClick={onInProgress}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        <Wrench className="w-4 h-4" />
        ⏭️ Mark as Repair In Progress
      </button>
    </div>
  </div>
);

const WaitingForPartsSection = ({ partsRequests, onRequestParts, onInProgress }: any) => (
  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-6">
    {/* Parts Requested */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-900">🔩 Parts Requested</h3>
      </div>
      <div className="bg-white rounded-lg p-4 border border-orange-100">
        {partsRequests && partsRequests.length > 0 ? (
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
      </div>
    </div>

    {/* Next Action */}
    <div className="border-t border-orange-200 pt-4">
      <button
        onClick={onInProgress}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        <Wrench className="w-4 h-4" />
        ⏭️ Mark as Repair In Progress
      </button>
    </div>
  </div>
);

const RepairInProgressSection = ({ jobCard, onTesting }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
    {/* Progress */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">📊 Progress</h3>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${jobCard.progress || 70}%` }}
          ></div>
        </div>
        <p className="text-center text-sm font-semibold text-gray-700 mt-2">{jobCard.progress || 70}%</p>
      </div>
    </div>

    {/* Work Notes */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">📝 Work Notes</h3>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        {jobCard.workPerformed && jobCard.workPerformed.length > 0 ? (
          <ul className="space-y-2">
            {jobCard.workPerformed.map((work: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{work}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No work notes recorded yet</p>
        )}
      </div>
    </div>

    {/* Next Action */}
    <div className="border-t border-gray-200 pt-4">
      <button
        onClick={onTesting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
      >
        <Car className="w-4 h-4" />
        ⏭️ Mark as Testing
      </button>
    </div>
  </div>
);

const TestingSection = ({ roadTests, onRoadTest, onComplete }: any) => {
  const latestRoadTest = roadTests && roadTests.length > 0 ? roadTests[0] : null;
  const hasPassedRoadTest = roadTests && roadTests.some((rt: any) => rt.result === 'pass');

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 space-y-6">
      {/* Road Test */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">🚗 Road Test (Required)</h3>
        </div>
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          {latestRoadTest ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Result:</span>
                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                  latestRoadTest.result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {latestRoadTest.result === 'pass' ? '● Pass' : '● Fail'}
                </span>
              </div>
              {latestRoadTest.remarks && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                  <p className="text-sm text-gray-800">{latestRoadTest.remarks}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No road test performed yet</p>
          )}
        </div>
      </div>

      {/* Next Action */}
      <div className="border-t border-purple-200 pt-4">
        {!hasPassedRoadTest ? (
          <button
            onClick={onRoadTest}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            <Car className="w-4 h-4" />
            🚗 Perform Road Test
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <CheckCircle className="w-4 h-4" />
            ⏭️ Mark as Work Complete
          </button>
        )}
      </div>
    </div>
  );
};

const WorkCompleteSection = ({ jobCard, finalReport, onCreateFinalInspection }: any) => (
  <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-6">
    {/* Work Summary */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-green-900">📝 Work Summary</h3>
      </div>
      <div className="bg-white rounded-lg p-4 border border-green-100">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Time Spent</p>
            <p className="text-sm font-medium text-gray-900">
              {jobCard.timeLogs?.reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0).toFixed(1) || 0} hours
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Parts Used</p>
            <p className="text-sm font-medium text-gray-900">{jobCard.parts?.length || 0} items</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Completed By</p>
            <p className="text-sm font-medium text-gray-900">
              {jobCard.assignedTechnician?.user 
                ? `${jobCard.assignedTechnician.user.firstName} ${jobCard.assignedTechnician.user.lastName}` 
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Important Notice */}
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-900">⚠️ Important: Job marked as "Work Complete"</p>
          <p className="text-sm text-yellow-800 mt-1">📋 Final Inspection Report is REQUIRED to close the job</p>
        </div>
      </div>
    </div>

    {/* Create Final Inspection Report Button */}
    <div className="border-t border-green-200 pt-4">
      <button
        onClick={onCreateFinalInspection}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
      >
        <FileText className="w-5 h-5" />
        📋 Create Final Inspection Report
      </button>
      <p className="text-center text-xs text-gray-600 mt-2">
        ⚡ This will generate the final report and mark the job as ready for delivery
      </p>
    </div>

    {/* Action Buttons */}
    <div className="flex gap-3 pt-4 border-t border-green-200">
      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
        <Save className="w-4 h-4" />
        ⏹️ Save as Draft
      </button>
      <button 
        onClick={() => window.history.back()}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        🔄 Back to Job
      </button>
    </div>
  </div>
);

const StatusUpdateModal = ({ currentStatus, formData, setFormData, onClose, onSubmit }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Update Status</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <textarea
            value={formData.remarks || ''}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any remarks for this status change..."
          />
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(formData.remarks)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Update Status
        </button>
      </div>
    </div>
  </div>
);

export default RedesignedRepairProgressPage;