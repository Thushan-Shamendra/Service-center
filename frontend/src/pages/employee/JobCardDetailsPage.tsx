import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  Phone,
  User,
  MapPin,
  Mail,
  Car,
  Gauge,
  Settings,
  Calendar,
  Clock,
  Wrench,
  Search,
  FileText,
  Upload,
  CheckCircle2,
  Camera,
  Video,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

export const JobCardDetailsPage: React.FC = () => {
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobDetails = async () => {
    if (!jobCardId) return;
    setIsLoading(true);
    try {
      const res = await jobCardApi.getJobCardById(jobCardId);
      if (res.success) {
        setJob(res.data);
      } else {
        toast.error('Failed to load job card details');
      }
    } catch (err) {
      toast.error('Error loading job card details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobCardId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-48" />
        <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse h-96" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-card">
        <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">Job Card Not Found</h3>
        <p className="text-sm text-slate-400 mb-4">The requested job card could not be loaded.</p>
        <Link
          to="/employee/assigned-jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const priorityCfg = PRIORITY_CONFIG[job.priority?.toLowerCase()] || PRIORITY_CONFIG.low;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/employee/assigned-jobs"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold">Back to Jobs</span>
        </Link>
      </div>

      {/* Job Card Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="font-extrabold text-slate-900 font-mono text-xl">
              JOB #{job.jobCardNumber || 'N/A'}
            </div>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${priorityCfg.bg} ${priorityCfg.color} border ${priorityCfg.border}`}
              style={{ borderColor: priorityCfg.hex }}
            >
              {priorityCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.dotColor}`} />
            <span className={`text-sm font-bold ${statusCfg.color}`}>Status: ● {statusCfg.label}</span>
          </div>
        </div>
      </div>

      {/* Service Name Banner */}
      {(job.services && job.services.length > 0) || job.appointment?.serviceType ? (
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-white" />
            <div>
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Service Type</span>
              <div className="text-2xl font-extrabold text-white">
                {job.services && job.services.length > 0 
                  ? (job.services[0].name || job.services[0]) 
                  : job.appointment?.serviceType || 'General Service'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Customer Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">CUSTOMER INFORMATION</h3>
          {job.customer?.user?.mobile && (
            <div className="ml-auto flex items-center gap-1 text-sm text-slate-600">
              <Phone className="w-4 h-4" />
              <span className="font-mono">{job.customer.user.mobile}</span>
            </div>
          )}
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-16 shrink-0">Name:</span>
              <span className="text-sm text-slate-700 font-medium">
                {job.customer?.user ? `${job.customer.user.firstName} ${job.customer.user.lastName}` : job.customer?.customerId || 'N/A'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-16 shrink-0">Address:</span>
              <span className="text-sm text-slate-700 font-medium">
                {job.customer?.address ? `${job.customer.address.street}, ${job.customer.address.city}, ${job.customer.address.province}` : 'N/A'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-16 shrink-0">Email:</span>
              <span className="text-sm text-slate-700 font-medium">{job.customer?.user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-16 shrink-0">Phone:</span>
              <span className="text-sm text-slate-700 font-medium">{job.customer?.user?.mobile || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">VEHICLE DETAILS</h3>
          {job.vehicle?.registrationNumber && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm font-bold font-mono">
              🏷️ {job.vehicle.registrationNumber}
            </div>
          )}
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Make & Model:</span>
              <span className="text-sm text-slate-700 font-medium">
                {job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.manufactureYear || 'N/A'})
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">VIN/Chassis:</span>
              <span className="text-sm text-slate-700 font-mono">{job.vehicle?.chassisNumber || job.vehicle?.vin || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Engine No.:</span>
              <span className="text-sm text-slate-700 font-mono">{job.vehicle?.engineNumber || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Odometer:</span>
              <span className="text-sm text-slate-700 font-medium">{job.vehicle?.currentMileage || job.odometer ? `${(job.vehicle?.currentMileage || job.odometer).toLocaleString()} km` : 'N/A'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Fuel Type:</span>
              <span className="text-sm text-slate-700 font-medium">{job.vehicle?.fuelType || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-24 shrink-0">Transmission:</span>
              <span className="text-sm text-slate-700 font-medium">{job.vehicle?.transmission || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint & Services */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">COMPLAINT & SERVICES</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Complaint:</span>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.complaint || 'N/A'}</p>
          </div>
          
          {job.services && job.services.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Assigned Services:</span>
              <ul className="space-y-1">
                {job.services.map((service: any, idx: number) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-brand-600 mt-0.5">•</span>
                    <span>{service.name || service}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.estimatedCost > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase">Estimated Cost:</span>
              <span className="text-sm font-bold text-brand-600 ml-2">
                LKR {job.estimatedCost.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Work Assignment */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">WORK ASSIGNMENT</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-28 shrink-0">Service Bay:</span>
              <span className="text-sm text-slate-700 font-medium">{job.serviceBay || 'Not Assigned'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-28 shrink-0">Assigned By:</span>
              <span className="text-sm text-slate-700 font-medium">
                {job.assignedBy?.user ? `${job.assignedBy.user.firstName} ${job.assignedBy.user.lastName}` : job.assignedTechnician?.user ? `${job.assignedTechnician.user.firstName} ${job.assignedTechnician.user.lastName}` : 'N/A'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-28 shrink-0">Assigned On:</span>
              <span className="text-sm text-slate-700 font-medium">
                {job.assignedDate ? `${formatDate(job.assignedDate)} ${job.assignedTime || ''}` : job.createdAt ? formatDate(job.createdAt) : 'N/A'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase w-28 shrink-0">Estimated Time:</span>
              <span className="text-sm text-slate-700 font-medium">{job.estimatedTime || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Details */}
      {(job.inspectionNotes || job.vehicleCondition || job.problemsFound || job.recommendedRepairs) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">INSPECTION DETAILS</h3>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
            {/* Inspection Header */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Inspection Date:</span>
                <span className="text-sm text-slate-700 font-medium">{job.inspectionDate ? formatDate(job.inspectionDate) : 'N/A'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Odometer Reading:</span>
                <span className="text-sm text-slate-700 font-medium">{job.odometer || job.vehicle?.currentMileage ? `${(job.odometer || job.vehicle?.currentMileage).toLocaleString()} km` : 'N/A'}</span>
              </div>
            </div>

            {/* Vehicle Condition */}
            {job.vehicleCondition && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Vehicle Condition:</span>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    job.vehicleCondition === 'good' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    job.vehicleCondition === 'fair' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {job.vehicleCondition}
                  </span>
                </div>
              </div>
            )}

            {/* Problems Found */}
            {job.problemsFound && job.problemsFound.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Problems Found:
                </span>
                <ul className="space-y-1">
                  {job.problemsFound.map((problem: string, index: number) => (
                    <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Inspection Notes */}
            {job.inspectionNotes && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Inspection Notes:
                </span>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.inspectionNotes}</p>
              </div>
            )}

            {/* Recommended Repairs */}
            {job.recommendedRepairs && job.recommendedRepairs.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Recommended Repairs:
                </span>
                <ul className="space-y-1">
                  {job.recommendedRepairs.map((repair: string, index: number) => (
                    <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-brand-600 mt-0.5">•</span>
                      <span>{repair}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cost Breakdown */}
            {job.parts && job.parts.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cost Breakdown:
                </span>
                <div className="space-y-2">
                  {job.parts.map((part: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {part.name}
                        {part.quantity > 1 && (
                          <span className="text-slate-400 text-xs ml-1">× {part.quantity}</span>
                        )}
                      </span>
                      <span className="font-medium text-brand-600">
                        LKR {(part.total || (part.unitPrice * part.quantity)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Estimated Cost:</span>
                  <span className="text-base font-extrabold text-brand-600">
                    LKR {job.parts.reduce((sum: number, part: any) => sum + (part.total || (part.unitPrice * part.quantity) || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Inspection Media */}
            {job.inspectionMedia && job.inspectionMedia.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Inspection Media:
                </span>
                <div className="grid grid-cols-4 gap-3">
                  {job.inspectionMedia.map((media: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg border border-slate-200 p-2">
                      <div className="flex flex-col items-center">
                        {media.type === 'image' ? (
                          <Camera className="w-8 h-8 text-slate-400 mb-1" />
                        ) : (
                          <Video className="w-8 h-8 text-slate-400 mb-1" />
                        )}
                        <span className="text-xs text-slate-600 truncate w-full text-center">{media.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {(job.status === 'pending' || job.status === 'inspection_started') && (
          <Link
            to={`/employee/inspection/${job._id}`}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-all shadow-md"
          >
            <Search className="w-4 h-4" />
            Start Inspection
          </Link>
        )}
        
        <Link
          to={`/employee/repair-progress/${job._id}`}
          className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 transition-all"
        >
          <Upload className="w-4 h-4" />
          Update Progress
        </Link>

        {(job.status === 'work_complete' || job.status === 'inspection_complete' || job.status === 'repair_started') && (
          <Link
            to={`/employee/final-inspection/${job._id}`}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all shadow-md"
          >
            <FileText className="w-4 h-4" />
            Final Inspection
          </Link>
        )}
      </div>
    </div>
  );
};
