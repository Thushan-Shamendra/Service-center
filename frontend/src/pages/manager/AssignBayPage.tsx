import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { serviceBayApi } from '../../api/serviceBayApi';
import { JobCard } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, Factory, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceBay {
  _id: string;
  bayNumber: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export const AssignBayPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [serviceBays, setServiceBays] = useState<ServiceBay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [selectedBay, setSelectedBay] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchJobCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [jobCardsRes, serviceBaysRes] = await Promise.all([
        jobCardApi.getJobCards({ limit: 100 }),
        serviceBayApi.getServiceBays(),
      ]);
      
      if (jobCardsRes.success) {
        const activeJobs = (jobCardsRes.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        setJobCards(activeJobs);
      } else {
        setError(jobCardsRes.message || 'Failed to load job cards');
      }

      if (serviceBaysRes.success) {
        setServiceBays(serviceBaysRes.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, []);

  const handleAssign = async () => {
    if (!selectedJobCard || !selectedBay) return;
    
    try {
      const mongoId = selectedJobCard._id || selectedJobCard.id;
      const res = await jobCardApi.update(mongoId, {
        serviceBay: selectedBay,
        estimatedDelivery: estimatedCompletion,
      });
      
      if (res.success) {
        toast.success('Service bay assigned successfully');
        setShowConfirmModal(false);
        navigate('/manager/workshop');
      } else {
        setError(res.message || 'Failed to assign service bay');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error assigning service bay');
    }
  };

  const getVehicleInfo = (jobCard: JobCard) => {
    const vehicle = jobCard.vehicle;
    if (typeof vehicle === 'object') {
      return `${vehicle.make} ${vehicle.model} • ${vehicle.registrationNumber}`;
    }
    return 'Unknown';
  };

  const getCustomerName = (jobCard: JobCard) => {
    const customer = jobCard.customer;
    if (typeof customer === 'object' && customer.user) {
      return `${customer.user.firstName} ${customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getTechnicianName = (jobCard: JobCard) => {
    const tech = jobCard.assignedTechnician;
    if (typeof tech === 'object' && tech.user) {
      return `${tech.user.firstName}`;
    }
    return 'Unassigned';
  };

  const getBayStatus = (bayNumber: string) => {
    const bay = serviceBays.find(sb => sb.bayNumber === bayNumber);
    return bay?.status || 'available';
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCards} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/manager/workshop" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign Service Bay</h1>
          <p className="text-sm text-slate-500">Assign a service bay to an active job card.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Job Card *</label>
          <select
            value={selectedJobCard?.id || ''}
            onChange={(e) => {
              const jc = jobCards.find(j => j.id === e.target.value);
              setSelectedJobCard(jc || null);
            }}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl"
          >
            <option value="">Select Job Card</option>
            {jobCards.map((jc) => (
              <option key={jc.id} value={jc.id}>{jc.jobCardNumber} - {getVehicleInfo(jc)}</option>
            ))}
          </select>
        </div>

        {selectedJobCard && (
          <div className="mb-6 bg-slate-50 rounded-xl p-4">
            <div className="space-y-2 text-sm">
              <p className="font-bold text-slate-900">{selectedJobCard.jobCardNumber}</p>
              <p className="text-slate-600">{getVehicleInfo(selectedJobCard)}</p>
              <p className="text-slate-600">{getCustomerName(selectedJobCard)}</p>
              <p className="text-slate-600">Technician: {getTechnicianName(selectedJobCard)}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">SERVICE BAY *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serviceBays.map((bay) => {
              const status = bay.status;
              return (
                <div
                  key={bay._id}
                  onClick={() => status === 'available' && setSelectedBay(bay.bayNumber)}
                  className={`rounded-xl p-4 border-2 cursor-pointer transition-colors ${
                    selectedBay === bay.bayNumber ? 'border-brand-500 bg-brand-50' :
                    status === 'occupied' ? 'border-rose-200 bg-rose-50 cursor-not-allowed' :
                    status === 'maintenance' ? 'border-amber-200 bg-amber-50 cursor-not-allowed' :
                    'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">{bay.bayNumber}</p>
                    <p className={`text-xs font-bold mt-2 ${
                      status === 'occupied' ? 'text-rose-700' : 
                      status === 'maintenance' ? 'text-amber-700' :
                      'text-emerald-700'
                    }`}>
                      {status === 'occupied' ? '🔴 OCCUPIED' : 
                       status === 'maintenance' ? '🟡 MAINTENANCE' :
                       '🟢 AVAILABLE'}
                    </p>
                    {selectedBay === bay.bayNumber && status === 'available' && (
                      <p className="text-xs text-brand-600 font-medium mt-2">[Select Bay]</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Expected Completion *</label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={estimatedCompletion}
              onChange={(e) => setEstimatedCompletion(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl"
            />
            <input
              type="time"
              value={estimatedCompletion?.split('T')[1] || ''}
              onChange={(e) => setEstimatedCompletion(`${estimatedCompletion?.split('T')[0] || ''}T${e.target.value}`)}
              className="px-4 py-2 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <Link to="/manager/workshop" className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50">Cancel</Link>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!selectedJobCard || !selectedBay}
            className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Factory className="w-4 h-4" />
            Assign Bay
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Bay Assignment</h3>
            <div className="space-y-2 text-sm mb-6">
              <p><span className="text-slate-500">Job Card:</span> <span className="ml-2 font-medium">{selectedJobCard?.jobCardNumber}</span></p>
              <p><span className="text-slate-500">Bay:</span> <span className="ml-2 font-medium">{selectedBay}</span></p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl">Cancel</button>
              <button onClick={handleAssign} className="px-4 py-2 bg-brand-600 text-white rounded-xl"><Check className="w-4 h-4 inline mr-2" />Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};