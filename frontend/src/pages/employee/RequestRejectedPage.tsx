import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sparePartsApi } from '../../api/sparePartsApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  XCircle,
  RefreshCw,
  Edit,
} from 'lucide-react';

interface SparePartsRequest {
  _id: string;
  requestId: string;
  itemName: string;
  requestedQuantity: number;
  reason: string;
  priority: string;
  status: string;
  rejectionReason: string;
  rejectedBy?: {
    firstName: string;
    lastName: string;
  };
  rejectedAt?: string;
}

interface JobCard {
  _id: string;
  jobCardNumber: string;
}

export const RequestRejectedPage: React.FC = () => {
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
        sparePartsApi.getSparePartsRequests({ jobCard: jobCardId, status: 'rejected' }),
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
                <h1 className="text-xl font-bold text-gray-900">❌ Request Rejected</h1>
                <p className="text-sm text-gray-600">JOB #{jobCard?.jobCardNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">❌ REQUEST REJECTED</span>
              </p>
              <p className="text-sm text-red-700 mt-1">
                ⚠️ Parts CANNOT be used
              </p>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No rejected requests found</p>
          </div>
        ) : (
          <>
            {/* Rejection Summary */}
            {requests[0] && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">❌ Request ID</label>
                    <p className="text-sm font-medium text-gray-900">{requests[0].requestId}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">❌ Rejected By</label>
                    <p className="text-sm font-medium text-gray-900">
                      {requests[0].rejectedBy?.firstName} {requests[0].rejectedBy?.lastName} (Manager)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">❌ Rejected On</label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(requests[0].rejectedAt)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">❌ Status</label>
                    <p className="text-sm font-medium text-red-600">🔴 REJECTED</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rejected Parts List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 REJECTED PARTS LIST</h3>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="font-medium text-gray-900">{request.itemName}</span>
                      </div>
                      <span className="text-sm text-gray-600">Qty: {request.requestedQuantity}</span>
                    </div>
                    <div className="mt-2 flex items-center text-red-600">
                      <XCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Status: ❌ Rejected</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manager Remarks */}
            {requests[0]?.rejectionReason && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager Remarks</label>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{requests[0].rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate(`/employee/request-parts-form/${jobCardId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                🔄 Resubmit Request
              </button>
              <button
                onClick={() => navigate(`/employee/request-parts-form/${jobCardId}`)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                ✏️ Modify & Try Again
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
