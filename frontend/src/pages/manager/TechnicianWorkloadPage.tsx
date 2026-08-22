import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { JobCard } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Search, UserCheck, Wrench, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const TechnicianWorkloadPage: React.FC = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('workload');

  const technicians = [
    { id: 'tech1', name: 'Kasun Perera', assigned: 2, completed: 3, hoursWorked: '5h 30m', efficiency: 92, workload: 69 },
    { id: 'tech2', name: 'Amila Fernando', assigned: 1, completed: 4, hoursWorked: '4h 10m', efficiency: 96, workload: 52 },
    { id: 'tech3', name: 'Nuwan Silva', assigned: 5, completed: 2, hoursWorked: '8h 00m', efficiency: 81, workload: 100 },
    { id: 'tech4', name: 'Sahan Perera', assigned: 0, completed: 2, hoursWorked: '3h 20m', efficiency: 94, workload: 25 },
  ];

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
      setError(err.response?.data?.message || 'Error loading job cards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, []);

  const getTechnicianJobs = (technicianId: string) => {
    return jobCards.filter(jc => {
      const techId = typeof jc.assignedTechnician === 'object' 
        ? (jc.assignedTechnician as any)._id 
        : jc.assignedTechnician;
      return techId === technicianId;
    });
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCards} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Technician Workload</h1>
          <p className="text-sm text-slate-500">Today • {dayjs().format('DD MMM YYYY')}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Technician"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">Status: All</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="workload">Sort: Workload</option>
            <option value="efficiency">Sort: Efficiency</option>
            <option value="assigned">Sort: Assigned</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Technician</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Assigned</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Completed</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Hours Worked</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Efficiency</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Workload</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => {
                const jobs = getTechnicianJobs(tech.id);
                return (
                  <tr key={tech.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{tech.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{tech.assigned}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{tech.completed}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{tech.hoursWorked}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{tech.efficiency}%</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${tech.workload >= 100 ? 'bg-rose-500' : tech.workload >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${tech.workload}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{tech.workload}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};