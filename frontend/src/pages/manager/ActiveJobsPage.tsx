import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { JobCard } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, ClipboardList, Plus, Check, Factory, Car, User as UserIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const ActiveJobsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });

      if (res.success) {
        const activeJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        setJobCards(activeJobs);
      } else {
        setError(res.message || 'Failed to load job cards');
      }
    } catch (err: any) {
      console.error('Error loading job cards:', err);
      setError(err.response?.data?.message || 'Error loading job cards');
      setJobCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
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
      return `${tech.user.firstName} ${tech.user.lastName}`;
    }
    return 'Unassigned';
  };

  const getBayStatus = (bayNumber: number) => {
    const jobInBay = jobCards.find(jc => jc.serviceBay === `Bay #${bayNumber}`);
    if (jobInBay) {
      return {
        status: 'occupied',
        jobCard: jobInBay,
        color: '🔴'
      };
    }
    return {
      status: 'free',
      jobCard: null,
      color: '🟢'
    };
  };

  const getTechnicianInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCards} />;

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
          <h1 className="text-2xl font-bold text-slate-900">JOB CARD MANAGEMENT &gt; ACTIVE JOBS (WORKSHOP VIEW)</h1>
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

      {/* Workshop Layout View */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🏭 WORKSHOP LAYOUT VIEW</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7].map((bayNumber) => {
            const bayStatus = getBayStatus(bayNumber);
            return (
              <div
                key={bayNumber}
                className={`border-2 rounded-lg p-4 ${
                  bayStatus.status === 'occupied' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-900 mb-2">BAY #{bayNumber}</div>
                  <div className="text-2xl mb-2">{bayStatus.color}</div>
                  {bayStatus.status === 'occupied' && bayStatus.jobCard ? (
                    <>
                      <div className="text-xs text-slate-600 mb-1">{getVehicleInfo(bayStatus.jobCard)}</div>
                      <div className="text-xs text-slate-600 mb-1">{getTechnicianName(bayStatus.jobCard)}</div>
                      <div className="text-xs text-slate-500">
                        {bayStatus.jobCard.timeLogs?.reduce((sum, log) => sum + (log.hoursWorked || 0), 0).toFixed(1)} hrs
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400">FREE</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Jobs List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">📋 ACTIVE JOBS LIST</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">#</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Job Card</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Vehicle</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Tech</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Time</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Bay</th>
              </tr>
            </thead>
            <tbody>
              {jobCards.length > 0 ? (
                jobCards.map((jobCard, index) => (
                  <tr key={jobCard.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/manager/job-cards/${jobCard._id || jobCard.id}`)}>
                    <td className="py-3 px-4 text-sm font-medium text-slate-600">{index + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-brand-600">{jobCard.jobCardNumber}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getCustomerName(jobCard)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getVehicleInfo(jobCard)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getTechnicianName(jobCard)}</td>
                    <td className="py-3 px-4"><StatusBadge status={jobCard.status} /></td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {jobCard.timeLogs?.reduce((sum, log) => sum + (log.hoursWorked || 0), 0).toFixed(1)}h
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{jobCard.serviceBay || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    No active jobs in workshop
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workshop Statistics */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">📊 WORKSHOP STATISTICS</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-500">Total Bays</div>
            <div className="text-2xl font-bold text-slate-900">7</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-500">Occupied</div>
            <div className="text-2xl font-bold text-red-600">{jobCards.length}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-500">Available</div>
            <div className="text-2xl font-bold text-emerald-600">{7 - jobCards.length}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-500">Avg. Time</div>
            <div className="text-2xl font-bold text-slate-900">
              {jobCards.length > 0 
                ? (jobCards.reduce((sum, jc) => sum + (jc.timeLogs?.reduce((s, l) => s + (l.hoursWorked || 0), 0) || 0), 0) / jobCards.length).toFixed(1)
                : '0.0'}h
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
