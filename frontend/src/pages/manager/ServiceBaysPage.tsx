import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceBayApi } from '../../api/serviceBayApi';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface ServiceBay {
  _id: string;
  bayNumber: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentAssignment?: any;
}

export const ServiceBaysPage: React.FC = () => {
  const [serviceBays, setServiceBays] = useState<ServiceBay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchServiceBays = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await serviceBayApi.getServiceBays();
      
      if (res.success) {
        setServiceBays(res.data || []);
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        setError(res.message || 'Failed to load service bays');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading service bays');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceBays();
    const interval = setInterval(fetchServiceBays, 30000);
    return () => clearInterval(interval);
  }, []);

  const getVehicleInfo = (assignment: any) => {
    const vehicle = assignment?.vehicle;
    if (typeof vehicle === 'object') {
      return `${vehicle.make} ${vehicle.model}`;
    }
    return 'Unknown';
  };

  const getVehicleReg = (assignment: any) => {
    const vehicle = assignment?.vehicle;
    if (typeof vehicle === 'object') {
      return vehicle.registrationNumber;
    }
    return 'N/A';
  };

  const getTechnicianName = (assignment: any) => {
    const tech = assignment?.assignedTechnician;
    if (typeof tech === 'object' && tech.user) {
      return `${tech.user.firstName}`;
    }
    return 'Unassigned';
  };

  const getEstimatedFinish = (assignment: any) => {
    if (assignment?.estimatedDelivery) {
      return dayjs(assignment.estimatedDelivery).format('hh:mm A');
    }
    return 'TBD';
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchServiceBays} />;

  const occupiedBays = serviceBays.filter(bay => bay.status === 'occupied').length;
  const availableBays = serviceBays.filter(bay => bay.status === 'available').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Bays</h1>
          <p className="text-sm text-slate-500">Live view of workshop service bay utilization.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchServiceBays} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-emerald-600 font-bold">🟢 Available: {availableBays}</span>
          <span className="text-rose-600 font-bold">🔴 Occupied: {occupiedBays}</span>
          <span className="text-slate-600 font-bold">Total Bays: {serviceBays.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceBays.map((bay) => {
            const assignment = bay.currentAssignment;
            return (
              <div
                key={bay._id}
                className={`rounded-xl p-4 border-2 ${
                  bay.status === 'occupied' ? 'border-rose-200 bg-rose-50' : 
                  bay.status === 'maintenance' ? 'border-amber-200 bg-amber-50' :
                  'border-emerald-200 bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-900">{bay.bayNumber}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    bay.status === 'occupied' ? 'bg-rose-200 text-rose-800' : 
                    bay.status === 'maintenance' ? 'bg-amber-200 text-amber-800' :
                    'bg-emerald-200 text-emerald-800'
                  }`}>
                    {bay.status === 'occupied' ? '🔴 OCCUPIED' : 
                     bay.status === 'maintenance' ? '� MAINTENANCE' :
                     '�🟢 AVAILABLE'}
                  </span>
                </div>

                {assignment ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900">{assignment.jobCardNumber}</p>
                    <p className="text-xs text-slate-600">{getVehicleInfo(assignment)}</p>
                    <p className="text-xs text-slate-600">{getVehicleReg(assignment)}</p>
                    <p className="text-xs text-slate-600">👨‍🔧 {getTechnicianName(assignment)}</p>
                    <p className="text-xs text-slate-500">Expected Finish: {getEstimatedFinish(assignment)}</p>
                    <Link
                      to={`/manager/job-cards/${assignment._id || assignment.id}`}
                      className="inline-block mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      [View Job]
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">
                      {bay.status === 'maintenance' ? 'Under maintenance' : 'Ready for assignment'}
                    </p>
                    {bay.status === 'available' && (
                      <Link
                        to="/manager/workshop/assign-bay"
                        className="inline-block text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        [Assign Job]
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};