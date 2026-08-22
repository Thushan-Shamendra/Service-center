import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  Wrench,
  ArrowRight,
  Clock,
  Car,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const RepairProgressListPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'waiting' | 'testing'>('all');

  useEffect(() => {
    fetchJobsInRepairProgress();
  }, []);

  const fetchJobsInRepairProgress = async () => {
    setIsLoading(true);
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });
      if (res.success) {
        // Filter to only show jobs in repair progress
        const progressJobs = res.data.filter((job: any) => 
          ['inspection_complete', 'repair_started', 'repair_in_progress', 'waiting_for_parts', 'testing'].includes(job.status)
        );
        setJobs(progressJobs);
      } else {
        toast.error(res.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      toast.error('Error fetching jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.jobCardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'in_progress' && ['repair_started', 'repair_in_progress', 'inspection_complete'].includes(job.status)) ||
      (statusFilter === 'waiting' && job.status === 'waiting_for_parts') ||
      (statusFilter === 'testing' && job.status === 'testing');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'inspection_complete': 'bg-blue-100 text-blue-800 border-blue-200',
      'repair_started': 'bg-orange-100 text-orange-800 border-orange-200',
      'repair_in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'waiting_for_parts': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'testing': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'work_complete': 'bg-green-100 text-green-800 border-green-200',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      'inspection_complete': 'Inspection Complete',
      'repair_started': 'Repair Started',
      'repair_in_progress': 'Repair In Progress',
      'waiting_for_parts': 'Waiting for Parts',
      'testing': 'Testing',
      'work_complete': 'Work Complete',
    };
    return labelMap[status] || status;
  };

  const getProgressForStatus = (status: string) => {
    const progressMap: Record<string, number> = {
      'inspection_complete': 20,
      'repair_started': 35,
      'repair_in_progress': 70,
      'waiting_for_parts': 40,
      'testing': 90,
      'work_complete': 100,
    };
    return progressMap[status] || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">Repair Progress</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">
                {jobs.filter(j => ['inspection_complete', 'repair_started', 'repair_in_progress'].includes(j.status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Waiting for Parts</p>
              <p className="text-2xl font-bold text-slate-900">
                {jobs.filter(j => j.status === 'waiting_for_parts').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Testing</p>
              <p className="text-2xl font-bold text-slate-900">
                {jobs.filter(j => j.status === 'testing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Jobs</p>
              <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job number, vehicle, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting for Parts</option>
              <option value="testing">Testing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 mb-2">No Jobs Found</h3>
            <p className="text-sm text-slate-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'There are no jobs in repair progress'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/employee/repair-progress/${job._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center">
                      <Car className="w-6 h-6 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">
                          {job.jobCardNumber || 'N/A'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {job.vehicle?.make} {job.vehicle?.model} • {job.customer?.name}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${job.progress || getProgressForStatus(job.status)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {job.progress || getProgressForStatus(job.status)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};