import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, CheckCircle, ArrowRight, Search, Filter } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatLKR, formatDate } from '../../utils/formatters';
import { partsRequestApi } from '../../api/partsRequestApi';
import toast from 'react-hot-toast';

interface PartsRequest {
  id: string;
  _id?: string;
  requestId?: string;
  requestNumber?: string;
  jobCard: any;
  technician: any;
  part?: string;
  itemName?: string;
  category: string;
  requestedQuantity: number;
  unit: string;
  approvedQuantity?: number;
  issuedQuantity?: number;
  usedQuantity?: number;
  availableStock?: number;
  currentStock?: number;
  status: 'pending' | 'approved' | 'issued' | 'used' | 'rejected' | 'partially_issued';
  createdAt: string;
  approvedAt?: string;
  issuedAt?: string;
  remarks?: string;
  rejectionReason?: string;
}

export const PartsRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<PartsRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    issuedToday: 0,
    itemsRequested: 0,
    lowStock: 0,
  });

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ request: PartsRequest | null; reason: string }>({ request: null, reason: '' });
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchPartsRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch requests and stats independently so one failure doesn't block the other
      const requestsRes = await partsRequestApi.getPartsRequests({ limit: 100 });
      
      if (requestsRes.success) {
        setRequests(requestsRes.data || []);
      }
    } catch (err: any) {
      console.error('Error loading parts requests:', err);
      setRequests([]);
    }
    
    // Fetch stats separately - if this fails, still show the requests table
    try {
      const statsRes = await partsRequestApi.getPartsRequestStats();
      if (statsRes.success) {
        setStats(statsRes.data || {
          pending: 0,
          approvedToday: 0,
          issuedToday: 0,
          itemsRequested: 0,
          lowStock: 0,
        });
      }
    } catch (err: any) {
      console.error('Error loading parts request stats:', err);
      // Keep default zero stats
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartsRequests();
  }, []);

  const handleApprove = async (request: PartsRequest) => {
    const id = request._id || request.id;
    if (!id) return;

    setApprovingId(id);
    try {
      await partsRequestApi.approveRequest(id, {
        approvedQuantity: request.requestedQuantity,
        managerRemarks: 'Approved by manager',
      });
      toast.success('Request approved successfully');
      fetchPartsRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    const request = rejectModal.request;
    if (!request) return;

    const id = request._id || request.id;
    if (!id) return;

    if (!rejectModal.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setRejectingId(id);
    try {
      await partsRequestApi.rejectRequest(id, { rejectionReason: rejectModal.reason });
      toast.success('Request rejected');
      setRejectModal({ request: null, reason: '' });
      fetchPartsRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setRejectingId(null);
    }
  };

  const getTechnicianName = (request: PartsRequest) => {
    const technician = request.technician;
    if (typeof technician === 'object') {
      // Handle both populated shapes: { user: { firstName } } or { firstName }
      if (technician.user) {
        return `${technician.user.firstName || ''} ${technician.user.lastName || ''}`.trim() || 'Unknown';
      }
      if (technician.firstName) {
        return `${technician.firstName} ${technician.lastName || ''}`.trim();
      }
    }
    return 'Unknown';
  };

  const getJobCardNumber = (request: PartsRequest) => {
    const jobCard = request.jobCard;
    if (typeof jobCard === 'object') {
      return jobCard.jobCardNumber || 'N/A';
    }
    return 'N/A';
  };

  const getRequestNumber = (request: PartsRequest) => {
    return request.requestId || request.requestNumber || 'N/A';
  };

  const getPartName = (request: PartsRequest) => {
    return request.itemName || request.part || 'N/A';
  };

  const getStock = (request: PartsRequest) => {
    return request.currentStock ?? request.availableStock ?? 0;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { label: 'Pending', color: 'bg-rose-100 text-rose-800' },
      approved: { label: 'Approved', color: 'bg-amber-100 text-amber-800' },
      issued: { label: 'Issued', color: 'bg-blue-100 text-blue-800' },
      used: { label: 'Used', color: 'bg-emerald-100 text-emerald-800' },
      completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: 'Rejected', color: 'bg-slate-100 text-slate-800' },
      partially_issued: { label: 'Partial', color: 'bg-orange-100 text-orange-800' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>{config.label}</span>;
  };

  const filteredRequests = requests.filter(r => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchRequest = getRequestNumber(r).toLowerCase().includes(search);
      const matchJobCard = getJobCardNumber(r).toLowerCase().includes(search);
      const matchTechnician = getTechnicianName(r).toLowerCase().includes(search);
      const matchPart = getPartName(r).toLowerCase().includes(search);
      if (!matchRequest && !matchJobCard && !matchTechnician && !matchPart) return false;
    }
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchPartsRequests} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parts Requests</h1>
          <p className="text-sm text-slate-500">
            Review technician requests and issue required parts.
          </p>
        </div>
        <Link
          to="/manager/workshop/queue"
          className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 transition-colors font-medium text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          View Workshop Queue
        </Link>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="text-xs text-slate-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
          <p className="text-xs text-slate-500">Pending Requests</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-slate-500">Approved</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.approvedToday}</p>
          <p className="text-xs text-slate-500">Approved Today</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-slate-500">Issued</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.issuedToday}</p>
          <p className="text-xs text-slate-500">Issued Today</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-slate-500">Items</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.itemsRequested}</p>
          <p className="text-xs text-slate-500">Items Requested</p>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="text-xs text-slate-500">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.lowStock}</p>
          <p className="text-xs text-slate-500">Low Stock</p>
        </div>
        
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-slate-600" />
            <span className="text-xs text-slate-500">Inventory Control</span>
          </div>
          <p className="text-sm text-slate-600">Approved requests are issued from available stock.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Request / Job Card / Technician / Part"
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="issued">Issued</option>
            <option value="used">Used</option>
            <option value="rejected">Rejected</option>
            <option value="partially_issued">Partially Issued</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="today">Date: Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          
          <select
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Technician: All</option>
            <option value="kasun">Kasun</option>
            <option value="amila">Amila</option>
            <option value="nuwan">Nuwan</option>
            <option value="sahan">Sahan</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Category: All</option>
            <option value="spare_parts">Spare Parts</option>
            <option value="lubricants">Lubricants</option>
            <option value="filters">Filters</option>
            <option value="batteries">Batteries</option>
            <option value="tires">Tires</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Parts Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">PARTS REQUESTS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Request ID</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Job Card</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Technician</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Requested</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Qty</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Stock</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request._id || request.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-brand-600">
                      <Link to={`/manager/parts-requests/${request._id || request.id}`} className="hover:underline">
                        {getRequestNumber(request)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getJobCardNumber(request)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getTechnicianName(request)}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{getPartName(request)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {request.requestedQuantity} {request.unit || 'unit(s)'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getStock(request)}</td>
                    <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                    <td className="py-3 px-4">
                      {request.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(request)}
                            disabled={approvingId === (request._id || request.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {approvingId === (request._id || request.id) ? 'Approving...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ request, reason: '' })}
                            disabled={rejectingId === (request._id || request.id)}
                            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {rejectingId === (request._id || request.id) ? 'Rejecting...' : '✕ Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    No parts requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Parts Requests</h3>
          <p className="text-sm text-slate-500 mb-4">
            No pending parts requests from technicians.
          </p>
          <Link
            to="/manager/workshop/queue"
            className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            View Workshop Queue
          </Link>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reject Parts Request</h3>
              <p className="text-sm text-gray-500 mt-1">
                {getRequestNumber(rejectModal.request)} - {getPartName(rejectModal.request)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
                  placeholder="Enter the reason for rejecting this request..."
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {rejectModal.reason.length}/500
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setRejectModal({ request: null, reason: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectModal.reason.trim() || rejectingId === (rejectModal.request._id || rejectModal.request.id)}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {rejectingId === (rejectModal.request._id || rejectModal.request.id) ? 'Rejecting...' : '✕ Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
