import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { JobCard } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatters';
import {
  Wrench,
  UserCheck,
  Factory,
  Clock,
  User as UserIcon,
  Car,
  ArrowRight,
  RefreshCw,
  UserCheck as UserCheckIcon,
  BarChart3,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const WorkshopPage: React.FC = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    activeJobs: 0,
    availableTechs: 0,
    occupiedBays: 0,
    totalBays: 4,
    waitingJobs: 0,
    totalTechnicians: 8,
    vehiclesInside: 0,
    avgJobTime: '0h 0m',
  });

  // Service bay assignments
  const [bayAssignments, setBayAssignments] = useState<any[]>([
    { bay: 'B01', status: 'occupied', jobCard: null },
    { bay: 'B02', status: 'occupied', jobCard: null },
    { bay: 'B03', status: 'available', jobCard: null },
    { bay: 'B04', status: 'occupied', jobCard: null },
  ]);

  const fetchWorkshopData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });

      if (res.success) {
        const activeJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        
        setJobCards(activeJobs);
        
        // Calculate stats
        const occupiedBays = activeJobs.filter((jc: JobCard) => jc.serviceBay).length;
        const availableTechs = 4; // Simplified - would come from employee API
        const waitingJobs = activeJobs.filter((jc: JobCard) => !jc.assignedTechnician).length;
        const vehiclesInside = activeJobs.length;
        
        // Calculate average job time (simplified)
        const avgJobTime = '3h 25m';
        
        setStats({
          activeJobs: activeJobs.length,
          availableTechs,
          occupiedBays,
          totalBays: 4,
          waitingJobs,
          totalTechnicians: 8,
          vehiclesInside,
          avgJobTime,
        });

        // Update bay assignments
        const assignments = [
          { bay: 'B01', status: 'occupied', jobCard: activeJobs[0] || null },
          { bay: 'B02', status: 'occupied', jobCard: activeJobs[1] || null },
          { bay: 'B03', status: 'available', jobCard: null },
          { bay: 'B04', status: 'occupied', jobCard: activeJobs[2] || null },
        ];
        setBayAssignments(assignments);
        
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        setError(res.message || 'Failed to load workshop data');
      }
    } catch (err: any) {
      console.error('Error loading workshop data:', err);
      setError(err.response?.data?.message || 'Error loading workshop data');
      setJobCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshopData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWorkshopData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      return `${vehicle.make} ${vehicle.model}`;
    }
    return 'Unknown';
  };

  const getVehicleReg = (jobCard: JobCard) => {
    const vehicle = jobCard.vehicle;
    if (typeof vehicle === 'object') {
      return vehicle.registrationNumber;
    }
    return 'N/A';
  };

  const getTechnicianName = (jobCard: JobCard) => {
    const tech = jobCard.assignedTechnician;
    if (typeof tech === 'object' && tech.user) {
      return `${tech.user.firstName}`;
    }
    return 'Unassigned';
  };

  const getEstimatedFinish = (jobCard: JobCard) => {
    if (jobCard.estimatedDelivery) {
      return dayjs(jobCard.estimatedDelivery).format('hh:mm A');
    }
    return 'TBD';
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchWorkshopData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshop Management</h1>
          <p className="text-sm text-slate-500">
            Manage technicians, service bays and active workshop jobs.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-4 h-4" />
          <span>Live Updated • {lastUpdated}</span>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={Wrench}
          subtext="Currently in workshop"
          color="blue"
        />
        <StatCard
          title="Available Techs"
          value={stats.availableTechs}
          icon={UserCheck}
          subtext="Ready for assignment"
          color="emerald"
        />
        <StatCard
          title="Occupied Bays"
          value={`${stats.occupiedBays} / ${stats.totalBays}`}
          icon={Factory}
          subtext={`${Math.round((stats.occupiedBays / stats.totalBays) * 100)}%`}
          color="rose"
        />
        <StatCard
          title="Waiting Jobs"
          value={stats.waitingJobs}
          icon={Clock}
          subtext="Awaiting assignment"
          color="amber"
        />
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Technicians"
          value={stats.totalTechnicians}
          icon={UserIcon}
          subtext="Total staff"
          color="purple"
        />
        <StatCard
          title="Service Bays"
          value={stats.totalBays}
          icon={Factory}
          subtext="Total capacity"
          color="slate"
        />
        <StatCard
          title="Vehicles Inside"
          value={stats.vehiclesInside}
          icon={Car}
          subtext="In workshop"
          color="blue"
        />
        <StatCard
          title="Avg. Job Time"
          value={stats.avgJobTime}
          icon={Clock}
          subtext="Per job"
          color="slate"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">QUICK ACTIONS</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/manager/workshop/assign-technician"
            className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 transition-colors font-medium text-sm"
          >
            <UserCheckIcon className="w-4 h-4" />
            Assign Technician
          </Link>
          <Link
            to="/manager/workshop/assign-bay"
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            <Factory className="w-4 h-4" />
            Assign Service Bay
          </Link>
          <Link
            to="/manager/workshop/queue"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium text-sm"
          >
            <Layers className="w-4 h-4" />
            Workshop Queue
          </Link>
          <Link
            to="/manager/workshop/technician-workload"
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors font-medium text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Technician Workload
          </Link>
          <button
            onClick={fetchWorkshopData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Service Bay Status */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">SERVICE BAY STATUS</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bayAssignments.map((bay) => (
            <div
              key={bay.bay}
              className={`rounded-xl p-4 border-2 ${
                bay.status === 'occupied' 
                  ? 'border-rose-200 bg-rose-50' 
                  : 'border-emerald-200 bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900">{bay.bay}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  bay.status === 'occupied' 
                    ? 'bg-rose-200 text-rose-800' 
                    : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {bay.status === 'occupied' ? '🔴 OCCUPIED' : '🟢 AVAILABLE'}
                </span>
              </div>
              
              {bay.jobCard ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">{bay.jobCard.jobCardNumber}</p>
                  <p className="text-xs text-slate-600">{getVehicleInfo(bay.jobCard)}</p>
                  <p className="text-xs text-slate-600">{getVehicleReg(bay.jobCard)}</p>
                  <p className="text-xs text-slate-600">{getTechnicianName(bay.jobCard)}</p>
                  <p className="text-xs text-slate-500">Finish: {getEstimatedFinish(bay.jobCard)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Ready for assignment</p>
                  <Link
                    to="/manager/workshop/assign-bay"
                    className="inline-block text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    [Assign Job]
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {jobCards.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-12 text-center">
          <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Workshop is Clear</h3>
          <p className="text-sm text-slate-500 mb-4">
            No active vehicles are currently in the workshop.
          </p>
          <Link
            to="/manager/appointments"
            className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            View Today's Appointments
          </Link>
        </div>
      )}
    </div>
  );
};