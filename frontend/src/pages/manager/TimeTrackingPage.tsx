import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { JobCard } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Search, Clock, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const TimeTrackingPage: React.FC = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'));

  const fetchTimeTracking = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });
      
      if (res.success) {
        const activeJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status !== 'delivered' && jc.status !== 'cancelled'
        );
        setJobCards(activeJobs);
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        setError(res.message || 'Failed to load time tracking data');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading time tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeTracking();
    const interval = setInterval(fetchTimeTracking, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const calculateTotalTime = (jobCard: JobCard) => {
    if (!jobCard.timeLogs) return '0h 0m';
    const totalMinutes = jobCard.timeLogs.reduce((sum, log) => sum + (log.hoursWorked || 0) * 60, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchTimeTracking} />;

  const allTimeLogs = jobCards.flatMap(jc => 
    (jc.timeLogs || []).map(log => ({
      jobCardNumber: jc.jobCardNumber,
      jobCardId: jc._id || jc.id,
      technician: getTechnicianName(jc),
      startTime: log.startTime,
      endTime: log.endTime,
      description: log.description,
      duration: log.hoursWorked ? `${log.hoursWorked}h` : 'In Progress',
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
          <p className="text-sm text-slate-500">Track time spent per job.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock className="w-4 h-4" />
          <span>Auto Updated • {lastUpdated}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Job Card / Technician"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">JOB TIME SUMMARY</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Job Card</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Technician</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Start</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">End</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Total Time</th>
              </tr>
            </thead>
            <tbody>
              {allTimeLogs.length > 0 ? (
                allTimeLogs.map((log, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-brand-600">
                      <Link to={`/manager/job-cards/${log.jobCardId}`} className="hover:underline">
                        {log.jobCardNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{log.technician}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{dayjs(log.startTime).format('HH:mm')}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{log.endTime ? dayjs(log.endTime).format('HH:mm') : 'In Progress'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{log.duration}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    No time logs recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-800">
            Source: Employee Time Tracking • Manager cannot manually modify time records
          </p>
        </div>
      </div>
    </div>
  );
};