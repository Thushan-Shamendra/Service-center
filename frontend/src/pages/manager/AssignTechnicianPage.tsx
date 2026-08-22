import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { appointmentApi } from '../../api/appointmentApi';
import { JobCard } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, UserCheck, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AssignTechnicianPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [jobsRes, techRes] = await Promise.all([
        jobCardApi.getJobCards({ limit: 100 }),
        appointmentApi.getAvailableTechnicians(),
      ]);
      
      if (jobsRes.success) {
        const activeJobs = (jobsRes.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        setJobCards(activeJobs);
      } else {
        setError(jobsRes.message || 'Failed to load job cards');
      }

      if (techRes.success) {
        setTechnicians(techRes.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedJobCard || !selectedTechnician) return;
    
    try {
      const mongoId = selectedJobCard._id || selectedJobCard.id;
      const res = await jobCardApi.update(mongoId, {
        assignedTechnician: selectedTechnician,
      });
      
      if (res.success) {
        toast.success('Technician assigned successfully');
        setShowConfirmModal(false);
        navigate('/manager/workshop');
      } else {
        setError(res.message || 'Failed to assign technician');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error assigning technician');
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
      return `${vehicle.make} ${vehicle.model} • ${vehicle.registrationNumber}`;
    }
    return 'Unknown';
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCards} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/manager/workshop"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign Technician</h1>
          <p className="text-sm text-slate-500">
            Assign a technician to an active job card.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6">JOB ASSIGNMENT</h2>
        
        {/* Job Card Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Job Card *
          </label>
          <select
            value={selectedJobCard?.id || ''}
            onChange={(e) => {
              const jc = jobCards.find(j => j.id === e.target.value);
              setSelectedJobCard(jc || null);
            }}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select Job Card</option>
            {jobCards.map((jc) => (
              <option key={jc.id} value={jc.id}>
                {jc.jobCardNumber} - {getVehicleInfo(jc)}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Job Card */}
        {selectedJobCard && (
          <div className="mb-6 bg-slate-50 rounded-xl p-4">
            <div className="space-y-2 text-sm">
              <p className="font-bold text-slate-900">{selectedJobCard.jobCardNumber}</p>
              <p className="text-slate-600">👤 {getCustomerName(selectedJobCard)}</p>
              <p className="text-slate-600">🚗 {getVehicleInfo(selectedJobCard)}</p>
              <p className="text-slate-600">🔧 {selectedJobCard.complaint}</p>
              <p className="text-slate-600">Status: {selectedJobCard.status}</p>
            </div>
          </div>
        )}

        {/* Technician Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Technician *
          </label>
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select Technician</option>
            {technicians.map((tech) => (
              <option key={tech._id} value={tech._id}>
                👨‍🔧 {tech.name} - {tech.designation || 'Technician'} ({tech.isAvailable ? '🟢 Available' : '🔴 Busy / Unavailable'})
              </option>
            ))}
            {technicians.length === 0 && (
              <>
                <option value="tech1">👨‍🔧 Kasun Perera - 🟢 Available</option>
                <option value="tech2">👨‍🔧 Amila Fernando - 🟢 Available</option>
              </>
            )}
          </select>
        </div>

        {/* Current Workload */}
        {selectedTechnician && (
          <div className="mb-6 bg-slate-50 rounded-xl p-4">
            <div className="space-y-2 text-sm">
              <p className="font-bold text-slate-900">Current Workload</p>
              <p className="text-slate-600">Assigned Jobs: 2</p>
              <p className="text-slate-600">Active Jobs: 2</p>
              <p className="text-slate-600">Hours Worked: 5h 30m</p>
              <p className="text-slate-600">Today's Capacity: 8h</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Workload</span>
                  <span>69%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '69%' }} />
                </div>
              </div>
              <p className="text-emerald-600 font-medium mt-2">Status: 🟢 Available</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <Link
            to="/manager/workshop"
            className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </Link>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!selectedJobCard || !selectedTechnician}
            className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            Assign Technician
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Technician Assignment</h3>
            
            <div className="space-y-2 text-sm mb-6">
              <div>
                <span className="text-slate-500">Job Card:</span>
                <span className="ml-2 font-medium text-slate-900">{selectedJobCard?.jobCardNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Customer:</span>
                <span className="ml-2 font-medium text-slate-900">{selectedJobCard ? getCustomerName(selectedJobCard) : ''}</span>
              </div>
              <div>
                <span className="text-slate-500">Vehicle:</span>
                <span className="ml-2 font-medium text-slate-900">{selectedJobCard ? getVehicleInfo(selectedJobCard) : ''}</span>
              </div>
              <div>
                <span className="text-slate-500">Technician:</span>
                <span className="ml-2 font-medium text-slate-900">👨‍🔧 {selectedTechnician}</span>
              </div>
              <div>
                <span className="text-slate-500">Current Workload:</span>
                <span className="ml-2 font-medium text-slate-900">2 Active Jobs • 69%</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
              >
                <Check className="w-4 h-4 inline mr-2" />
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};