import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sparePartsApi } from '../../api/sparePartsApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Plus,
} from 'lucide-react';

interface SparePartsRequest {
  _id: string;
  requestId: string;
  itemName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  usedQuantity?: number;
  currentStock: number;
  reason: string;
  priority: string;
  status: string;
  managerRemarks?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  issuedAt?: string;
  technician: {
    firstName: string;
    lastName: string;
  };
}

interface JobCard {
  _id: string;
  jobCardNumber: string;
}

export const PartsRequestStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [requests, setRequests] = useState<SparePartsRequest[]>([]);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [requestsRes, jobRes] = await Promise.all([
        sparePartsApi.getSparePartsRequests({ jobCard: jobCardId }),
        jobCardId ? jobCardApi.getJobCardById(jobCardId) : Promise.resolve(null),
      ]);

      if (requestsRes.data.success) {
        setRequests(requestsRes.data.data);
      }

      if (jobRes && jobRes.success) {
        setJobCard(jobRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'text-yellow-600',
      'approved': 'text-green-600',
      'rejected': 'text-red-600',
      'issued': 'text-blue-600',
      'completed': 'text-green-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      'pending': Clock,
      'approved': CheckCircle,
      'rejected': XCircle,
      'issued': Package,
      'completed': CheckCircle,
    };
    return icons[status] || Clock;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📊 Parts Request Status</h1>
                <p className="text-sm text-gray-600">JOB #{jobCard?.jobCardNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Summary Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">📊 REQUEST STATUS SUMMARY</span>
              </p>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No parts requests found for this job card</p>
          </div>
        ) : (
          <>
            {/* Request Summary */}
            {requests[0] && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Request ID</label>
                    <p className="text-sm font-medium text-gray-900">{requests[0].requestId}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Job Card</label>
                    <p className="text-sm font-medium text-gray-900">{jobCard?.jobCardNumber}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Requested By</label>
                    <p className="text-sm font-medium text-gray-900">
                      {requests[0].technician?.firstName} {requests[0].technician?.lastName} (Mechanic)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Request Date</label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(requests[0].createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Priority</label>
                    <p className="text-sm font-medium text-gray-900 uppercase">{requests[0].priority}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Current Status</label>
                    <p className={`text-sm font-medium ${getStatusColor(requests[0].status)}`}>
                      {(() => {
                        const StatusIcon = getStatusIcon(requests[0].status);
                        return (
                          <span className="flex items-center">
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {requests[0].status === 'pending' && '🟡 PENDING APPROVAL'}
                            {requests[0].status === 'approved' && '🟢 APPROVED'}
                            {requests[0].status === 'rejected' && '🔴 REJECTED'}
                            {requests[0].status === 'issued' && '🟢 ISSUED'}
                            {requests[0].status === 'completed' && '✅ COMPLETED'}
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                  {requests[0].issuedAt && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Issued Date</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(requests[0].issuedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requested Items List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 REQUESTED ITEMS</h3>
              <div className="space-y-4">
                {requests.map((request) => {
                  const StatusIcon = getStatusIcon(request.status);
                  return (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <StatusIcon className={`w-5 h-5 mr-2 ${getStatusColor(request.status)}`} />
                          <span className="font-medium text-gray-900">{request.itemName}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-2 mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Requested Qty:</span> {request.requestedQuantity}
                        </div>
                        <div>
                          <span className="text-gray-500">Approved Qty:</span> {request.approvedQuantity || 'N/A'}
                        </div>
                        <div>
                          <span className="text-gray-500">Issued Qty:</span> {request.status === 'issued' || request.status === 'completed' ? request.approvedQuantity : 'N/A'}
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className={`ml-1 ${getStatusColor(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      {request.usedQuantity !== undefined && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Used Qty:</span> {request.usedQuantity}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Manager Remarks */}
            {requests.some(r => r.managerRemarks) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager Remarks</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    {requests.find(r => r.managerRemarks)?.managerRemarks}
                  </p>
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {requests.some(r => r.rejectionReason) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    {requests.find(r => r.rejectionReason)?.rejectionReason}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate(`/employee/request-parts-form/${jobCardId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                📝 Add Another Request
              </button>
              <button
                onClick={() => navigate('/employee/dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ↩️ Back to Jobs
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
