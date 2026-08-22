import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Check, AlertTriangle, DollarSign, RotateCcw, X, Search, Plus } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatLKR, formatDate } from '../../utils/formatters';
import { quotationApi } from '../../api/quotationApi';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface Quotation {
  id: string;
  _id?: string;
  quotationNumber: string;
  customer: any;
  vehicle: any;
  jobCard: any;
  amount: number;
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'converted' | 'awaiting_customer';
  createdAt: string;
  validUntil?: string;
}

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');

  const fetchQuotations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await quotationApi.getQuotations({ limit: 100 });
      
      if (res.success) {
        setQuotations(res.data || []);
      } else {
        setError(res.message || 'Failed to load quotations');
      }
    } catch (err: any) {
      console.error('Error loading quotations:', err);
      setError(err.response?.data?.message || 'Error loading quotations');
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const getCustomerName = (quotation: Quotation) => {
    const customer = quotation.customer;
    if (typeof customer === 'object' && customer.user) {
      return `${customer.user.firstName} ${customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getVehicleInfo = (quotation: Quotation) => {
    const vehicle = quotation.vehicle;
    if (typeof vehicle === 'object') {
      return `${vehicle.make} ${vehicle.model}`;
    }
    return 'Unknown';
  };

  const getVehicleReg = (quotation: Quotation) => {
    const vehicle = quotation.vehicle;
    if (typeof vehicle === 'object') {
      return vehicle.registrationNumber;
    }
    return 'N/A';
  };

  const getJobCardNumber = (quotation: Quotation) => {
    const jobCard = quotation.jobCard;
    if (typeof jobCard === 'object') {
      return jobCard.jobCardNumber;
    }
    return 'N/A';
  };

  const filteredQuotations = quotations.filter(q => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchQuote = q.quotationNumber.toLowerCase().includes(search);
      const matchCustomer = getCustomerName(q).toLowerCase().includes(search);
      const matchVehicle = getVehicleReg(q).toLowerCase().includes(search);
      const matchJobCard = getJobCardNumber(q).toLowerCase().includes(search);
      if (!matchQuote && !matchCustomer && !matchVehicle && !matchJobCard) return false;
    }
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: quotations.length,
    pendingApproval: quotations.filter(q => q.status === 'review').length,
    approved: quotations.filter(q => q.status === 'approved').length,
    varianceAlerts: 0, // Would be calculated from variance tracking
    quotedValue: quotations.reduce((sum, q) => sum + q.amount, 0),
    converted: quotations.filter(q => q.status === 'converted').length,
    awaitingCustomer: quotations.filter(q => q.status === 'awaiting_customer').length,
    rejected: quotations.filter(q => q.status === 'rejected').length,
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchQuotations} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotation Management</h1>
          <p className="text-sm text-slate-500">
            Create, review, approve and convert service quotations.
          </p>
        </div>
        <Link
          to="/manager/quotations/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Generate Quotation
        </Link>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <span className="text-xs text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total Quotations</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-slate-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingApproval}</p>
          <p className="text-xs text-slate-500">Pending Approval</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-slate-500">Approved</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
          <p className="text-xs text-slate-500">Approved</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="text-xs text-slate-500">Alerts</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.varianceAlerts}</p>
          <p className="text-xs text-slate-500">Variance Alerts</p>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-slate-500">Value</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatLKR(stats.quotedValue)}</p>
          <p className="text-xs text-slate-500">Quoted Value</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <RotateCcw className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-slate-500">Converted</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.converted}</p>
          <p className="text-xs text-slate-500">Converted</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-slate-500">Awaiting</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.awaitingCustomer}</p>
          <p className="text-xs text-slate-500">Awaiting Customer</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <X className="w-5 h-5 text-rose-600" />
            <span className="text-xs text-slate-500">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
          <p className="text-xs text-slate-500">Rejected</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Quotation / Customer / Vehicle / Job Card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Status: All</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Date: All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <select
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Technician: All</option>
            <option value="kasun">Kasun</option>
            <option value="amila">Amila</option>
          </select>
          
          <select
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Amount: All</option>
            <option value="low">Under 50K</option>
            <option value="medium">50K - 100K</option>
            <option value="high">Over 100K</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">QUOTATIONS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Quote No.</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Vehicle</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Job Card</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map((quotation) => (
                  <tr key={quotation.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-brand-600">
                      <Link to={`/manager/quotations/${quotation._id || quotation.id}`} className="hover:underline">
                        {quotation.quotationNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getCustomerName(quotation)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getVehicleReg(quotation)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getJobCardNumber(quotation)}</td>
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">{formatLKR(quotation.amount)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={quotation.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No quotations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {quotations.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Quotations Found</h3>
          <p className="text-sm text-slate-500 mb-4">
            Create a quotation from an active Job Card.
          </p>
          <Link
            to="/manager/quotations/new"
            className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            + Generate Quotation
          </Link>
        </div>
      )}
    </div>
  );
};