import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { vehicleApi } from '../../api/vehicleApi';
import { JobCard, User, Vehicle } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate, formatPhone, formatLKR } from '../../utils/formatters';
import {
  ArrowLeft,
  User as UserIcon,
  Car,
  Wrench,
  Clock,
  FileText,
  Package,
  Camera,
  Factory,
  Check,
  AlertTriangle,
  Gauge,
  Search,
  Eye,
  Printer,
  FileText as FileTextIcon,
  ClipboardList,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

type TabType = 'overview' | 'inspection' | 'time-logs' | 'parts' | 'evidence';

const JOB_STAGES = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'diagnosing', label: 'Diagnosing', icon: Search },
  { key: 'waiting_for_parts', label: 'Waiting Parts', icon: Package },
  { key: 'repair_in_progress', label: 'Repair In Progress', icon: Wrench },
  { key: 'testing', label: 'Testing', icon: Gauge },
  { key: 'ready_for_delivery', label: 'Ready for Delivery', icon: Check },
  { key: 'delivered', label: 'Delivered', icon: Check },
];

export const JobCardDetailsPage: React.FC = () => {
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  
  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const fetchJobCard = async () => {
    if (!jobCardId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const jcRes = await jobCardApi.getJobCards({ limit: 1000 });
      
      if (jcRes.success) {
        const jcData = jcRes.data.find((j: JobCard) => 
          j._id === jobCardId || j.id === jobCardId || j.jobCardNumber === jobCardId
        );
        
        if (jcData) {
          setJobCard(jcData);
          
          // Contact details belong to the populated user, not the customer profile ID.
          const customerUser = jcData.customer?.user;
          setCustomer(customerUser && typeof customerUser === 'object' ? customerUser : null);
          const vehicleId = typeof jcData.vehicle === 'object' 
            ? (jcData.vehicle as any)._id 
            : jcData.vehicle;
          
          if (vehicleId) {
            const vRes = await vehicleApi.getVehicles({ limit: 1000 });
            if (vRes.success) {
              const vehicleData = vRes.data.find((v: Vehicle) => 
                v._id === vehicleId || v.id === vehicleId
              );
              setVehicle(vehicleData || null);
            }
          }
        } else {
          setError('Job card not found');
        }
      } else {
        setError('Failed to fetch job card');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading job card');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCard();
  }, [jobCardId]);

  const handleStatusChange = async () => {
    if (!jobCard || !newStatus) return;
    
    try {
      const mongoId = jobCard._id || jobCard.id;
      const res = await jobCardApi.updateStatus(mongoId, {
        status: newStatus,
        remarks: statusReason,
      });
      
      if (res.success) {
        toast.success('Status updated successfully');
        setShowStatusModal(false);
        fetchJobCard();
      } else {
        setError(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating status');
    }
  };

  const getCurrentStageIndex = () => {
    if (!jobCard) return 0;
    return JOB_STAGES.findIndex(s => s.key === jobCard.status);
  };

  const getCustomerName = () => {
    if (typeof jobCard?.customer === 'object' && jobCard.customer.user) {
      return `${jobCard.customer.user.firstName} ${jobCard.customer.user.lastName}`;
    }
    return customer?.fullName || 'Unknown';
  };

  const getVehicleInfo = () => {
    if (typeof jobCard?.vehicle === 'object') {
      return `${jobCard.vehicle.make} ${jobCard.vehicle.model}`;
    }
    return vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown';
  };

  const getVehicleReg = () => {
    if (typeof jobCard?.vehicle === 'object') {
      return jobCard.vehicle.registrationNumber;
    }
    return vehicle?.registrationNumber || 'N/A';
  };

  const getTechnicianName = () => {
    if (typeof jobCard?.assignedTechnician === 'object' && jobCard.assignedTechnician.user) {
      return `${jobCard.assignedTechnician.user.firstName} ${jobCard.assignedTechnician.user.lastName}`;
    }
    return 'Unassigned';
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCard} />;
  if (!jobCard) return <ErrorState message="Job card not found" />;

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/manager/job-cards"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">JOB CARD DETAILS - {jobCard.jobCardNumber}</h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/manager/job-cards/new"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            + NEW JOB CARD
          </Link>
          <Link
            to="/manager/job-cards"
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

      {/* Job Card Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/manager/job-cards"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            🔙 [Back to List]
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">STATUS:</span>
            <StatusBadge status={jobCard.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Job Card Information */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">📋 JOB CARD INFORMATION</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">JC No:</span>
                <span className="ml-2 font-medium text-slate-900">{jobCard.jobCardNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Date:</span>
                <span className="ml-2 font-medium text-slate-900">{jobCard.createdAt ? formatDate(jobCard.createdAt) : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">Appt:</span>
                <span className="ml-2 font-medium text-slate-900">{jobCard.appointment ? 'APT-2026-001' : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">Priority:</span>
                <span className="ml-2 font-medium text-slate-900">{jobCard.priority}</span>
              </div>
            </div>
          </div>

          {/* Status Flow */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">📊 STATUS FLOW</h3>
            <div className="space-y-1 text-sm">
              {JOB_STAGES.map((stage, i) => {
                const isDone = i < currentStageIndex;
                const isCurrent = stage.key === jobCard.status;
                return (
                  <div key={stage.key} className="flex items-center gap-2">
                    <span className={isCurrent ? 'text-emerald-600' : isDone ? 'text-slate-400' : 'text-slate-300'}>
                      {isCurrent ? '✅' : isDone ? '✅' : '⬜'}
                    </span>
                    <span className={`font-medium ${isCurrent ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {stage.label}
                      {isCurrent && ' ← You are here'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">👤 CUSTOMER</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>
                <span className="ml-2 font-medium text-slate-900">{getCustomerName()}</span>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <span className="ml-2 font-medium text-slate-900">{formatPhone(customer?.mobile)}</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <span className="ml-2 font-medium text-slate-900">{customer?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">🚗 VEHICLE</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Reg No:</span>
                <span className="ml-2 font-medium text-slate-900">{getVehicleReg()}</span>
              </div>
              <div>
                <span className="text-slate-500">Model:</span>
                <span className="ml-2 font-medium text-slate-900">{getVehicleInfo()}</span>
              </div>
              <div>
                <span className="text-slate-500">Color:</span>
                <span className="ml-2 font-medium text-slate-900">{vehicle?.color || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">Mileage:</span>
                <span className="ml-2 font-medium text-slate-900">{vehicle?.currentMileage?.toLocaleString()} km</span>
              </div>
            </div>
          </div>

          {/* Complaint */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">📝 COMPLAINT</h3>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-900">
              {jobCard.complaint}
            </div>
          </div>

          {/* Technician */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">🔧 TECHNICIAN</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>
                <span className="ml-2 font-medium text-slate-900">{getTechnicianName()}</span>
              </div>
              <div>
                <span className="text-slate-500">Bay:</span>
                <span className="ml-2 font-medium text-slate-900">{jobCard.serviceBay || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <span className="ml-2 font-medium text-slate-900">Working on job</span>
              </div>
              <div>
                <span className="text-slate-500">Hours:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {jobCard.timeLogs?.reduce((sum, log) => sum + (log.hoursWorked || 0), 0).toFixed(1)} hrs logged
                </span>
              </div>
            </div>
          </div>

          {/* Estimates */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">💰 ESTIMATES</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Est. Cost:</span>
                <span className="ml-2 font-medium text-slate-900">{formatLKR(jobCard.estimatedCost)}</span>
              </div>
              <div>
                <span className="text-slate-500">Est. Del:</span>
                <span className="ml-2 font-medium text-slate-900">{jobCard.estimatedDelivery ? formatDate(jobCard.estimatedDelivery) : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Notes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🔍 INSPECTION NOTES (Employee Updates)</h3>
        <div className="border-t border-slate-200 pt-4">
          {jobCard.inspectionNotes ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-2">
                  [{dayjs(jobCard.createdAt).format('YYYY-MM-DD HH:mm A')}] {getTechnicianName()}:
                </div>
                <div className="text-sm text-slate-900 whitespace-pre-wrap">{jobCard.inspectionNotes}</div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">Inspection has not been completed yet.</p>
              </div>
              <p className="text-sm text-amber-700">
                Technician can add inspection findings from the employee interface.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Time Logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">⏱️ TIME LOGS (Employee Updates)</h3>
        <div className="border-t border-slate-200 pt-4">
          {jobCard.timeLogs && jobCard.timeLogs.length > 0 ? (
            <div className="space-y-2">
              {jobCard.timeLogs.map((log, index) => (
                <div key={index} className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">📅 {dayjs(log.startTime).format('YYYY-MM-DD HH:mm A')}</span>
                  <span className="font-medium text-slate-900">{log.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No time logs recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Parts Used */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🛠️ PARTS USED (Auto Updated from Inventory)</h3>
        <div className="border-t border-slate-200 pt-4">
          {jobCard.parts && jobCard.parts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Part Name</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qty</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Unit Price</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {jobCard.parts.map((part, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-600">{index + 1}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{part.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{part.quantity}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatLKR(part.unitPrice)}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right">{formatLKR(part.total)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{getTechnicianName()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-brand-50 border-t-2 border-brand-200">
                    <td colSpan={4} className="py-3 px-4 text-sm font-bold text-slate-700 uppercase">
                      Total Estimated Cost
                    </td>
                    <td className="py-3 px-4 text-sm font-extrabold text-brand-600 text-right">
                      {formatLKR(jobCard.parts.reduce((sum, part) => sum + (part.total || 0), 0))}
                    </td>
                    <td className="py-3 px-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No parts recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">📷 EVIDENCE (Employee Uploads)</h3>
        <div className="border-t border-slate-200 pt-4">
          {jobCard.evidence && jobCard.evidence.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {jobCard.evidence.map((evidence, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-3">
                  <div className="aspect-square bg-slate-200 rounded-lg mb-2 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-600 truncate">{evidence.caption || 'No caption'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No evidence uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🔧 STATUS ACTIONS</h3>
        <div className="border-t border-slate-200 pt-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setNewStatus('pending'); setShowStatusModal(true); }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
            >
              ⬅️ Back to Pending
            </button>
            <button
              onClick={() => { setNewStatus('diagnosing'); setShowStatusModal(true); }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium text-sm"
            >
              ➡️ Move to Diagnosing
            </button>
            <button
              onClick={() => { setNewStatus('waiting_for_parts'); setShowStatusModal(true); }}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors font-medium text-sm"
            >
              ➡️ Waiting Parts
            </button>
            <button
              onClick={() => { setNewStatus('repair_in_progress'); setShowStatusModal(true); }}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors font-medium text-sm"
            >
              ➡️ Repair
            </button>
            <button
              onClick={() => { setNewStatus('testing'); setShowStatusModal(true); }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium text-sm"
            >
              ➡️ Testing
            </button>
            <button
              onClick={() => { setNewStatus('ready_for_delivery'); setShowStatusModal(true); }}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors font-medium text-sm"
            >
              ➡️ Ready for Delivery
            </button>
            <button
              onClick={() => { setNewStatus('delivered'); setShowStatusModal(true); }}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors font-medium text-sm"
            >
              ➡️ Delivered
            </button>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">🔄 UPDATE JOB CARD STATUS</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="border-t border-slate-200 pt-4 mb-4">
              <p className="text-sm text-slate-600">Job Card: {jobCard.jobCardNumber}</p>
              <p className="text-sm text-slate-600">Customer: {getCustomerName()}</p>
              <p className="text-sm text-slate-600">Vehicle: {getVehicleReg()} - {getVehicleInfo()}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-2">Current Status: 🔍 {jobCard.status.replace(/_/g, ' ').toUpperCase()}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-2">Move To: [🔧 Repair In Progress ▼]</p>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-2">Available Statuses:</p>
                <div className="space-y-2">
                  {JOB_STAGES.map((stage) => (
                    <label key={stage.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={stage.key}
                        checked={newStatus === stage.key}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-4 h-4 text-brand-600"
                      />
                      <span className={`text-sm ${newStatus === stage.key ? 'text-brand-600 font-medium' : 'text-slate-600'}`}>
                        {stage.label}
                        {newStatus === stage.key && ' ← Selected'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Update Notes:
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Parts arrived. Started engine repair and oil change__________"
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                ❌ CANCEL
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
              >
                ✅ UPDATE STATUS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
