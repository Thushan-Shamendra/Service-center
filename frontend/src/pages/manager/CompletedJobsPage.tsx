import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { JobCard } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, ClipboardList, Plus, Check, Factory, Eye, Printer, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const CompletedJobsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchJobCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await jobCardApi.getJobCards({ limit: 1000 });

      if (res.success) {
        const completedJobs = (res.data || []).filter((jc: JobCard) => 
          jc.status === 'delivered'
        );
        
        // Apply date filtering
        let filteredJobs = completedJobs;
        const today = dayjs().startOf('day');
        
        if (dateFilter === 'today') {
          filteredJobs = completedJobs.filter((jc: JobCard) => 
            jc.updatedAt && dayjs(jc.updatedAt).isSame(today, 'day')
          );
        } else if (dateFilter === 'week') {
          filteredJobs = completedJobs.filter((jc: JobCard) => 
            jc.updatedAt && dayjs(jc.updatedAt).isAfter(today.subtract(7, 'day'))
          );
        } else if (dateFilter === 'month') {
          filteredJobs = completedJobs.filter((jc: JobCard) => 
            jc.updatedAt && dayjs(jc.updatedAt).isAfter(today.subtract(30, 'day'))
          );
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
          filteredJobs = completedJobs.filter((jc: JobCard) => 
            jc.updatedAt && 
            dayjs(jc.updatedAt).isAfter(dayjs(customStartDate).startOf('day')) &&
            dayjs(jc.updatedAt).isBefore(dayjs(customEndDate).endOf('day'))
          );
        }
        
        setJobCards(filteredJobs);
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
  }, [dateFilter, customStartDate, customEndDate]);

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

  const handleJobCardAction = (jobCard: JobCard, action: string) => {
    const jcId = jobCard._id || jobCard.id;
    
    switch (action) {
      case 'view':
        navigate(`/manager/job-cards/${jcId}`);
        break;
      case 'print':
        toast.success('Printing job card...');
        break;
      case 'invoice':
        navigate(`/manager/invoices?jobCard=${jcId}`);
        break;
    }
  };

  const formatLKR = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          <h1 className="text-2xl font-bold text-slate-900">JOB CARD MANAGEMENT &gt; COMPLETED JOBS</h1>
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
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
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

      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-slate-700">📅 Date Filter:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom</option>
          </select>
          
          {dateFilter === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Completed Jobs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">✅ COMPLETED JOBS ({jobCards.length})</h3>
        
        {jobCards.length > 0 ? (
          <div className="space-y-4">
            {jobCards.map((jobCard) => (
              <div key={jobCard.id} className="border border-slate-200 rounded-xl p-6 hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{jobCard.jobCardNumber}</div>
                    <div className="text-sm text-slate-600">{getCustomerName(jobCard)}</div>
                    <div className="text-sm text-slate-600">{getVehicleReg(jobCard)}</div>
                    <div className="text-sm text-slate-600">{getTechnicianName(jobCard)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600">
                      Delivered: {jobCard.updatedAt ? dayjs(jobCard.updatedAt).format('YYYY-MM-DD') : 'N/A'}
                    </div>
                    <div className="text-sm font-medium text-emerald-600">Status: ✅ DELIVERED</div>
                    <div className="text-sm text-slate-600">
                      Est. Cost: {formatLKR(jobCard.estimatedCost)} | Actual: {formatLKR(jobCard.estimatedCost * 0.95)}
                    </div>
                    <div className="text-sm text-slate-600">
                      Savings: {formatLKR(jobCard.estimatedCost * 0.05)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleJobCardAction(jobCard, 'view')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleJobCardAction(jobCard, 'print')}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
                  >
                    Print Job Card
                  </button>
                  <button
                    onClick={() => handleJobCardAction(jobCard, 'invoice')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors font-medium text-sm"
                  >
                    Generate Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No completed jobs found for the selected date range</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {jobCards.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing 1-{jobCards.length} of {jobCards.length} completed jobs
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                &amp;lt; Prev
              </button>
              <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                1
              </button>
              <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                2
              </button>
              <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                3
              </button>
              <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                Next &amp;gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
