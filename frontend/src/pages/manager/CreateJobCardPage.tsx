import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { appointmentApi } from '../../api/appointmentApi';
import { userApi } from '../../api/userApi';
import { vehicleApi } from '../../api/vehicleApi';
import { serviceApi } from '../../api/serviceApi';
import { Appointment, User, Vehicle } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ArrowLeft, Lock, X, Check, Calendar, User as UserIcon, Car, Factory, Users, ClipboardList, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const CreateJobCardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [createdJobCard, setCreatedJobCard] = useState<any>(null);
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [eligibleAppointments, setEligibleAppointments] = useState<Appointment[]>([]);
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [technicians, setTechnicians] = useState<any[]>([]);

  const [nextJobCardId, setNextJobCardId] = useState('');

  const [formData, setFormData] = useState({
    jobCardNumber: '',
    appointment: '',
    customer: '',
    vehicle: '',
    complaint: '',
    inspectionNotes: '',
    inspectionNotes2: '',
    assignedTechnician: '',
    serviceBay: '',
    priority: 'medium',
    estimatedCost: 0,
    estimatedDelivery: '',
    status: 'pending',
    services: [] as Array<{ name: string }>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [workshopCapacity, setWorkshopCapacity] = useState({ baysAvailable: 1, techsAvailable: 4 });

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
    generateJobCardId();
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      // Fetch all employees and filter by designation
      const res = await userApi.getUsers({ role: 'employee', status: 'active' });
      if (res.success) {
        const allEmployees = res.data || [];
        // Filter employees who have technician designation
        const technicians = allEmployees.filter((user: any) => {
          const designation = user.employeeDetails?.designation?.toLowerCase() || '';
          return designation.includes('technician') || designation.includes('mechanic');
        }).map((user: any) => ({
          ...user,
          employeeId: user.employeeDetails?._id || user._id, // Use employee ID for job card assignment
        }));
        setTechnicians(technicians);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  const fetchEligibleAppointments = async () => {
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
          // Filter out appointments already assigned to a job card
          if (aptId && assignedAppointmentIds.has(String(aptId))) return false;

          // Filter out appointments whose date is older than today
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

      setEligibleAppointments(filtered);
      
      // If appointment ID is in URL, auto-select it
      if (appointmentId) {
        const apt = allAppointments.find((a: Appointment) => 
          a._id === appointmentId || a.id === appointmentId || a.appointmentNumber === appointmentId
        );
        if (apt) {
          handleAppointmentSelect(apt);
        }
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  useEffect(() => {
    fetchEligibleAppointments();
  }, [appointmentId]);

  const handleAppointmentSelect = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    const customerId = typeof appointment.customer === 'object' 
      ? (appointment.customer as any)._id 
      : appointment.customer;
    const vehicleId = typeof appointment.vehicle === 'object' 
      ? (appointment.vehicle as any)._id 
      : appointment.vehicle;
    
    // Fetch service details to get estimated cost
    let estimatedCost = 0;
    if (appointment.serviceType) {
      try {
        // Search for service by name
        const servicesRes = await serviceApi.getServices({ search: appointment.serviceType, status: 'active' });
        if (servicesRes.success && servicesRes.data && servicesRes.data.length > 0) {
          const service = servicesRes.data[0];
          // Use totalPrice virtual field (base + labor + tax)
          estimatedCost = service.totalPrice || (service.baseServicePrice + service.laborCharge);
        }
      } catch (err) {
        console.error('Error fetching service details:', err);
      }
    }
    
    setFormData({
      ...formData,
      appointment: appointment._id || appointment.id,
      customer: customerId,
      vehicle: vehicleId,
      complaint: appointment.complaint || '',
      services: appointment.serviceType ? [{ name: appointment.serviceType }] : [],
      estimatedCost: estimatedCost,
      estimatedDelivery: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    });
    
    setIsAppointmentModalOpen(false);
    
    // Update workshop capacity
    setWorkshopCapacity({
      baysAvailable: Math.floor(Math.random() * 4) + 1,
      techsAvailable: Math.floor(Math.random() * 6) + 1,
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.appointment) newErrors.appointment = 'Appointment is required';
    if (!formData.assignedTechnician) newErrors.assignedTechnician = 'Technician is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setShowConfirmModal(true);
  };

  const confirmJobCard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const jobCardData = {
        ...formData,
        estimatedCost: Number(formData.estimatedCost),
      };

      const res = await jobCardApi.createJobCard(jobCardData);

      if (res.success) {
        setCreatedJobCard({
          jobCardNumber: formData.jobCardNumber,
          appointmentNumber: selectedAppointment?.appointmentNumber,
          customerName: selectedAppointment ? (typeof selectedAppointment.customer === 'object' 
            ? (selectedAppointment.customer as any).user?.fullName 
            : 'Unknown') : 'Unknown',
          vehicleInfo: selectedAppointment ? (typeof selectedAppointment.vehicle === 'object'
            ? `${selectedAppointment.vehicle.make} ${selectedAppointment.vehicle.model}`
            : 'Unknown') : 'Unknown',
          technician: formData.assignedTechnician,
          serviceBay: formData.serviceBay,
          priority: formData.priority,
          estimatedCost: formData.estimatedCost,
          estimatedDelivery: formData.estimatedDelivery,
          status: 'pending',
        });
        setShowSuccessModal(true);
      } else {
        setError(res.message || 'Failed to create job card');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating job card');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      jobCardNumber: nextJobCardId,
      appointment: '',
      customer: '',
      vehicle: '',
      complaint: '',
      inspectionNotes: '',
      inspectionNotes2: '',
      assignedTechnician: '',
      serviceBay: '',
      priority: 'medium',
      estimatedCost: 0,
      estimatedDelivery: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      status: 'pending',
      services: [],
    });
    setSelectedAppointment(null);
    setErrors({});
  };

  const filteredEligibleAppointments = eligibleAppointments.filter((apt) => {
    if (!appointmentSearchTerm.trim()) return true;
    const term = appointmentSearchTerm.toLowerCase();
    const aptNum = apt.appointmentNumber?.toLowerCase() || '';
    const customer = apt.customer as any;
    const customerName = (typeof customer === 'object' && customer !== null
      ? `${customer.user?.firstName || ''} ${customer.user?.lastName || ''} ${customer.user?.fullName || ''} ${customer.firstName || ''} ${customer.lastName || ''}`
      : '').toLowerCase();
    const vehicle = apt.vehicle as any;
    const vehicleInfo = (typeof vehicle === 'object' && vehicle !== null
      ? `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.registrationNumber || ''}`
      : '').toLowerCase();
    const serviceType = apt.serviceType?.toLowerCase() || '';

    return aptNum.includes(term) || customerName.includes(term) || vehicleInfo.includes(term) || serviceType.includes(term);
  });

  if (showSuccessModal && createdJobCard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Job Card Created Successfully
          </h2>
          
          <div className="space-y-3 mt-6 text-left">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Job Card No.</p>
              <p className="text-lg font-bold text-slate-900">{createdJobCard.jobCardNumber}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Customer</p>
              <p className="text-lg font-bold text-slate-900">{createdJobCard.customerName}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Vehicle</p>
              <p className="text-lg font-bold text-slate-900">{createdJobCard.vehicleInfo}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Technician</p>
              <p className="text-lg font-bold text-slate-900">{createdJobCard.technician}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Service Bay</p>
              <p className="text-lg font-bold text-slate-900">{createdJobCard.serviceBay}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
              <p className="text-lg font-bold text-amber-600">🟠 PENDING</p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Link
              to={`/manager/job-cards/${createdJobCard.jobCardNumber}`}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
            >
              Open Job Card
            </Link>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/manager/job-cards');
              }}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900">JOB CARD MANAGEMENT &gt; CREATE NEW JOB CARD</h1>
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

      {isLoading && <LoadingSkeleton />}
      
      {error && <ErrorState message={error} onRetry={confirmJobCard} />}

      {!isLoading && !error && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
          {/* Job Card Information */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Job Card No: {nextJobCardId}</h2>
              <span className="text-sm text-slate-500">Date: {dayjs().format('YYYY-MM-DD')}</span>
            </div>
          </div>

          {/* Appointment Selection */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">� SELECT APPOINTMENT</h2>
            
            <div className="mb-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className={`w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between ${
                    selectedAppointment 
                      ? 'border-brand-300 bg-brand-50 text-brand-700' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {selectedAppointment ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedAppointment.appointmentNumber} - {typeof selectedAppointment.customer === 'object' 
                      ? (selectedAppointment.customer as any).user?.fullName 
                      : 'Unknown'} - {selectedAppointment.preferredTime}</span>
                    </div>
                  ) : (
                    <span>Appointment: [Select Appointment ▼]</span>
                  )}
                  <span className="text-slate-400">▾</span>
                </button>
              </div>
              {errors.appointment && <p className="text-xs text-red-600 mt-1">{errors.appointment}</p>}
            </div>

            {selectedAppointment && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Appointment Found - Auto Filling Details</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer & Vehicle Information (Auto-Filled) */}
          {selectedAppointment && (
            <div className="mb-8 border-t border-slate-200 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4">👤 CUSTOMER (Auto-Filled)</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {typeof selectedAppointment.customer === 'object' 
                          ? (selectedAppointment.customer as any).user?.fullName 
                          : 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {typeof selectedAppointment.customer === 'object' 
                          ? (selectedAppointment.customer as any).user?.mobile 
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {typeof selectedAppointment.customer === 'object' 
                          ? (selectedAppointment.customer as any).user?.email 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4">🚗 VEHICLE (Auto-Filled)</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500">Reg No:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {typeof selectedAppointment.vehicle === 'object'
                          ? selectedAppointment.vehicle.registrationNumber
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Model:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {typeof selectedAppointment.vehicle === 'object'
                          ? `${selectedAppointment.vehicle.make} ${selectedAppointment.vehicle.model} ${selectedAppointment.vehicle.manufactureYear || ''}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Color:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {typeof selectedAppointment.vehicle === 'object'
                          ? selectedAppointment.vehicle.color || 'N/A'
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Mileage:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {typeof selectedAppointment.vehicle === 'object'
                          ? `${selectedAppointment.vehicle.currentMileage?.toLocaleString() || 0} km`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complaint (Auto-Filled) */}
          {selectedAppointment && (
            <div className="mb-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4">📝 COMPLAINT (Auto-Filled)</h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-900">{selectedAppointment.complaint}</p>
              </div>
            </div>
          )}

          {/* Inspection Notes (Initially Blank) */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4">🔍 INSPECTION NOTES (Initially Blank)</h3>
            <div className="space-y-2">
              <textarea
                value={formData.inspectionNotes || ''}
                onChange={(e) => setFormData({ ...formData, inspectionNotes: e.target.value })}
                placeholder="Enter inspection notes..."
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <textarea
                value={formData.inspectionNotes2 || ''}
                onChange={(e) => setFormData({ ...formData, inspectionNotes2: e.target.value })}
                placeholder="Additional inspection notes..."
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Workshop Assignment */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4">🔧 ASSIGN TECHNICIAN & SERVICE BAY</h3>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Technician
                </label>
                <select
                  value={formData.assignedTechnician}
                  onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.assignedTechnician ? 'border-red-300' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Technician</option>
                  {technicians.map((tech) => (
                    <option key={tech._id || tech.id} value={tech.employeeId}>
                      {tech.firstName} {tech.lastName} ({tech.email})
                    </option>
                  ))}
                </select>
                {errors.assignedTechnician && <p className="text-xs text-red-600 mt-1">{errors.assignedTechnician}</p>}
              </div>
            </div>
          </div>

          {/* Priority & Estimates */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4">⚡ PRIORITY & ESTIMATES</h3>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority: [🔴 High ▼]
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estimated Cost: [LKR 25,000.00]
                </label>
                <input
                  type="number"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                  placeholder="LKR 25,000.00"
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.estimatedCost ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.estimatedCost && <p className="text-xs text-red-600 mt-1">{errors.estimatedCost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Est. Delivery: [2026-08-19 📅]
                </label>
                <input
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                  min={dayjs().format('YYYY-MM-DD')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4">📌 STATUS: PENDING (Customer Arrived)</h3>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-900">PENDING</span>
                <span className="text-xs text-slate-500">(Customer Arrived)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Lock className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  💾 CREATE JOB CARD
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              🔄 RESET
            </button>
            <Link
              to="/manager/job-cards"
              className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              ❌ CANCEL
            </Link>
          </div>
        </form>
      )}

      {/* Appointment Selection Modal */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Select Appointment</h3>
                <p className="text-xs text-slate-500">Showing today's and upcoming approved appointments</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAppointmentModalOpen(false);
                  setAppointmentSearchTerm('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-200">
              <input
                type="text"
                value={appointmentSearchTerm}
                onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                placeholder="Search Appointment / Customer / Registration Number"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredEligibleAppointments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredEligibleAppointments.map((apt) => (
                    <div
                      key={apt._id || apt.id}
                      onClick={() => {
                        handleAppointmentSelect(apt);
                        setAppointmentSearchTerm('');
                      }}
                      className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-brand-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{apt.appointmentNumber}</p>
                            <p className="text-xs text-slate-500">
                              {typeof apt.customer === 'object' 
                                ? (apt.customer as any).user?.fullName 
                                : 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {typeof apt.vehicle === 'object'
                                ? `${apt.vehicle.make} ${apt.vehicle.model} • ${apt.vehicle.registrationNumber}`
                                : 'Unknown vehicle'}
                            </p>
                            <p className="text-xs text-slate-500">{apt.serviceType}</p>
                            <p className="text-xs text-slate-500">
                              {dayjs(apt.preferredDate).format('DD MMM YYYY')} • {apt.preferredTime}
                            </p>
                          </div>
                        </div>
                        <div>
                          <StatusBadge status={apt.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Calendar className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">No eligible appointments found</p>
                  <p className="text-xs text-slate-400 mt-1">Older past appointments and appointments already assigned to job cards are excluded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Job Card Creation</h3>
            
            <div className="space-y-2 text-sm mb-6">
              <div>
                <span className="text-slate-500">Job Card:</span>
                <span className="ml-2 font-medium text-slate-900">{formData.jobCardNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Appointment:</span>
                <span className="ml-2 font-medium text-slate-900">{selectedAppointment?.appointmentNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Customer:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {typeof selectedAppointment?.customer === 'object' 
                    ? (selectedAppointment.customer as any).user?.fullName 
                    : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Vehicle:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {typeof selectedAppointment?.vehicle === 'object'
                    ? `${selectedAppointment.vehicle.make} ${selectedAppointment.vehicle.model} / ${selectedAppointment.vehicle.registrationNumber}`
                    : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Service:</span>
                <span className="ml-2 font-medium text-slate-900">{selectedAppointment?.serviceType}</span>
              </div>
              <div>
                <span className="text-slate-500">Technician:</span>
                <span className="ml-2 font-medium text-slate-900">{formData.assignedTechnician}</span>
              </div>
              <div>
                <span className="text-slate-500">Service Bay:</span>
                <span className="ml-2 font-medium text-slate-900">{formData.serviceBay}</span>
              </div>
              <div>
                <span className="text-slate-500">Priority:</span>
                <span className="ml-2 font-medium text-slate-900">{formData.priority}</span>
              </div>
              <div>
                <span className="text-slate-500">Estimated Cost:</span>
                <span className="ml-2 font-medium text-slate-900">LKR {formData.estimatedCost.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="ml-2 font-medium text-slate-900">{dayjs(formData.estimatedDelivery).format('DD MMM YYYY')}</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <span className="ml-2 font-medium text-amber-600">🟠 Pending</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={confirmJobCard}
                disabled={isLoading}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium disabled:opacity-50"
              >
                Create Job Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};