import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  CheckSquare,
  ArrowRight,
  Clock,
  Car,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';

export const InspectionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress'>('all');

  useEffect(() => {
    fetchJobsNeedingInspection();
  }, []);

  const fetchJobsNeedingInspection = async () => {
    setIsLoading(true);
    try {
      const res = await jobCardApi.getJobCards({ limit: 100 });
      if (res.success) {
        // Filter to only show jobs needing inspection
        const inspectionJobs = res.data.filter((job: any) => 
          job.status === 'pending' || job.status === 'inspection_started'
        );
        setJobs(inspectionJobs);
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
      (job.customer?.user ? `${job.customer.user.firstName} ${job.customer.user.lastName}` : '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && job.status === 'pending') ||
      (statusFilter === 'in_progress' && job.status === 'inspection_started');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-amber-100 text-amber-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'inspection_started': 'bg-purple-100 text-purple-800',
      'inspection_complete': 'bg-green-100 text-green-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      'pending': 'Pending Inspection',
      'assigned': 'Assigned',
      'inspection_started': 'Inspection In Progress',
      'inspection_complete': 'Inspection Complete',
    };
    return labelMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          <CheckSquare className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-900">Initial Inspection</h1>
        </div>
      </div>

      {/* Stats - Real data from API */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending Inspection</p>
              <p className="text-2xl font-bold text-slate-900">
                {jobs.filter(j => j.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Jobs Needing Inspection</p>
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 mb-2">No Jobs Found</h3>
            <p className="text-sm text-slate-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'There are no jobs requiring initial inspection'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/employee/inspection/${job._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center">
                      <Car className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">
                          {job.jobCardNumber || 'N/A'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {job.vehicle?.make} {job.vehicle?.model} • {job.customer?.name}
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