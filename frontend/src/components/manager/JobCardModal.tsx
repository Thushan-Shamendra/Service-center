import React, { useEffect, useState } from 'react';
import { jobCardApi } from '../../api/jobCardApi';
import { appointmentApi } from '../../api/appointmentApi';
import { userApi } from '../../api/userApi';
import { User, Appointment } from '../../types';
import { Lock, Check, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jobCard: any) => void;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createdJobCard, setCreatedJobCard] = useState<any>(null);
  
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const [nextJobCardId, setNextJobCardId] = useState('');

  const [formData, setFormData] = useState({
    jobCardNumber: '',
    appointment: '',
    customer: '',
    vehicle: '',
    complaint: '',
    diagnosis: '',
    estimatedCost: 0,
    status: 'pending',
    priority: 'normal',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateJobCardId = async () => {
    setIsGeneratingId(true);
    try {
      const id = `JC-${String(Date.now()).slice(-6)}`;
      setNextJobCardId(id);
      setFormData({ ...formData, jobCardNumber: id });
    } catch (err) {
      toast.error('Failed to generate job card ID');
    } finally {
      setIsGeneratingId(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateJobCardId();
      setFormData({
        jobCardNumber: nextJobCardId,
        appointment: '',
        customer: '',
        vehicle: '',
        complaint: '',
        diagnosis: '',
        estimatedCost: 0,
        status: 'pending',
        priority: 'normal',
      });
      setSelectedAppointment(null);
      setAppointments([]);
      setTechnicians([]);
      setErrors({});
      setError(null);
      setShowSuccess(false);
      setShowConfirm(false);
      setCreatedJobCard(null);
      
      fetchPendingAppointments();
      fetchTechnicians();
    }
  }, [isOpen]);

  const fetchPendingAppointments = async () => {
    try {
      // Fetch approved appointments
      const approvedRes = await appointmentApi.getAppointments({ limit: 100, status: 'approved' });
      
      // Fetch rescheduled appointments
      const rescheduledRes = await appointmentApi.getAppointments({ limit: 100, status: 'rescheduled' });
      
      // Fetch existing job cards to exclude appointments that already have a job card
      let assignedAppointmentIds = new Set<string>();
      try {
        const jobCardsRes = await jobCardApi.getJobCards({ limit: 500 });
        if (jobCardsRes.success && Array.isArray(jobCardsRes.data)) {
          jobCardsRes.data.forEach((jc: any) => {
            const aptId = typeof jc.appointment === 'object' && jc.appointment !== null
              ? (jc.appointment._id || jc.appointment.id)
              : jc.appointment;
            if (aptId) assignedAppointmentIds.add(String(aptId));
          });
        }
      } catch (jcErr) {
        console.error('Error fetching job cards for deduplication:', jcErr);
      }

      let allAppointments: Appointment[] = [];
      
      if (approvedRes.success) {
        allAppointments = [...allAppointments, ...(approvedRes.data || [])];
      }
      
      if (rescheduledRes.success) {
        allAppointments = [...allAppointments, ...(rescheduledRes.data || [])];
      }
      
      // Filter out older appointments (past dates before today) and already assigned appointments
      const today = dayjs().startOf('day');
      const filtered = allAppointments
        .filter((apt: Appointment) => {
          const aptId = apt._id || apt.id;
          if (aptId && assignedAppointmentIds.has(String(aptId))) return false;

          if (apt.preferredDate) {
            const isOlderThanToday = dayjs(apt.preferredDate).isBefore(today, 'day');
            if (isOlderThanToday) return false;
          }

          return true;
        })
        .sort((a, b) => {
          const dateA = dayjs(a.preferredDate).valueOf();
          const dateB = dayjs(b.preferredDate).valueOf();
          if (dateA !== dateB) return dateA - dateB;
          return (a.preferredTime || '').localeCompare(b.preferredTime || '');
        });

      setAppointments(filtered);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await userApi.getUsers({ role: 'technician', status: 'active' });
      if (res.success) {
        setTechnicians(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      ...formData,
      appointment: appointment._id || appointment.id,
      customer: appointment.customer,
      vehicle: appointment.vehicle,
      complaint: appointment.complaint,
    });
    setShowAppointmentModal(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.appointment) newErrors.appointment = 'Appointment is required';
    if (!formData.complaint.trim()) newErrors.complaint = 'Complaint is required';
    if (!formData.estimatedCost || formData.estimatedCost <= 0) newErrors.estimatedCost = 'Estimated cost is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setShowConfirm(true);
  };

  const confirmJobCard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const jobCardData = {
        ...formData,
        appointment: selectedAppointment?._id || formData.appointment,
      };

      const res = await jobCardApi.createJobCard(jobCardData);

      if (res.success) {
        const jobCardData = {
          jobCardNumber: formData.jobCardNumber,
          appointmentNumber: selectedAppointment?.appointmentNumber,
          complaint: formData.complaint,
          estimatedCost: formData.estimatedCost,
          status: 'pending',
        };
        setCreatedJobCard(jobCardData);
        setShowSuccess(true);
        onSuccess?.(jobCardData);
      } else {
        setError(res.message || 'Failed to create job card');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating job card');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess && createdJobCard) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Job Card Created Successfully
        </h2>
        
        <div className="space-y-3 mt-6 text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Job Card ID</p>
            <p className="text-lg font-bold text-slate-900">{createdJobCard.jobCardNumber}</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Appointment</p>
            <p className="text-lg font-bold text-slate-900">{createdJobCard.appointmentNumber}</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Complaint</p>
            <p className="text-lg font-bold text-slate-900">{createdJobCard.complaint}</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Estimated Cost</p>
            <p className="text-lg font-bold text-slate-900">{createdJobCard.estimatedCost.toLocaleString()}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Job Card</h3>
        
        <div className="space-y-2 text-sm mb-6">
          <div>
            <span className="text-slate-500">Job Card ID:</span>
            <span className="ml-2 font-medium text-slate-900">{formData.jobCardNumber}</span>
          </div>
          <div>
            <span className="text-slate-500">Appointment:</span>
            <span className="ml-2 font-medium text-slate-900">{selectedAppointment?.appointmentNumber}</span>
          </div>
          <div>
            <span className="text-slate-500">Complaint:</span>
            <span className="ml-2 font-medium text-slate-900">{formData.complaint}</span>
          </div>
          <div>
            <span className="text-slate-500">Estimated Cost:</span>
            <span className="ml-2 font-medium text-slate-900">{formData.estimatedCost.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500">Status:</span>
            <span className="ml-2 font-medium text-amber-600">🟠 Pending</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
          >
            Back
          </button>
          <button
            onClick={confirmJobCard}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Job Card'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Job Card Information */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">JOB CARD INFORMATION</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Job Card ID
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={nextJobCardId}
                readOnly
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">🔒 Auto Generated</p>
        </div>
      </div>

      {/* Appointment Selection */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">APPOINTMENT *</h2>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAppointmentModal(true)}
            className={`w-full px-4 py-2 border rounded-xl text-left flex items-center justify-between ${
              selectedAppointment 
                ? 'border-brand-300 bg-brand-50 text-brand-700' 
                : 'border-slate-200 text-slate-600'
            }`}
          >
            {selectedAppointment ? (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{selectedAppointment.appointmentNumber}</span>
              </div>
            ) : (
              <span>🔍 Select Appointment</span>
            )}
            <span className="text-slate-400">▾</span>
          </button>
          {errors.appointment && <p className="text-xs text-red-600 mt-1">{errors.appointment}</p>}
        </div>

        {selectedAppointment && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Appointment:</span>
              <span className="ml-2 font-medium text-slate-900">{selectedAppointment.appointmentNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">Date:</span>
              <span className="ml-2 font-medium text-slate-900">
                {dayjs(selectedAppointment.preferredDate).format('DD MMM YYYY')}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Time:</span>
              <span className="ml-2 font-medium text-slate-900">{selectedAppointment.preferredTime}</span>
            </div>
          </div>
        )}
      </div>

      {/* Job Details */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">JOB DETAILS</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Complaint *
          </label>
          <textarea
            value={formData.complaint}
            onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
            placeholder="Describe the customer's complaint..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.complaint ? 'border-red-300' : 'border-slate-200'
            }`}
          />
          {errors.complaint && <p className="text-xs text-red-600 mt-1">{errors.complaint}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Diagnosis
          </label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="Initial diagnosis..."
            rows={3}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estimated Cost (LKR) *
          </label>
          <input
            type="number"
            value={formData.estimatedCost}
            onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
            min="0"
            step="100"
            placeholder="0.00"
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.estimatedCost ? 'border-red-300' : 'border-slate-200'
            }`}
          />
          {errors.estimatedCost && <p className="text-xs text-red-600 mt-1">{errors.estimatedCost}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="pending">🟠 Pending</option>
              <option value="in-progress">🔵 In Progress</option>
              <option value="completed">🟢 Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Job Card'}
        </button>
      </div>

      {/* Appointment Selection Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Select Appointment</h3>
              <button onClick={() => setShowAppointmentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => handleAppointmentSelect(apt)}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  <p className="font-bold text-slate-900">{apt.appointmentNumber}</p>
                  <p className="text-sm text-slate-600">📅 {dayjs(apt.preferredDate).format('DD MMM YYYY')} • {apt.preferredTime}</p>
                  <p className="text-sm text-slate-600">🔧 {apt.complaint}</p>
                  <p className="text-sm text-slate-600">Status: {apt.status}</p>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">No pending appointments found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
