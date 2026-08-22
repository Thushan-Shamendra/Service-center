import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sparePartsApi } from '../../api/sparePartsApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  CheckCircle,
} from 'lucide-react';

interface SparePartsRequest {
  _id: string;
  requestId: string;
  itemName: string;
  requestedQuantity: number;
  currentStock: number;
  reason: string;
  priority: string;
  status: string;
  createdAt: string;
  technician: {
    firstName: string;
    lastName: string;
  };
}

interface JobCard {
  _id: string;
  jobCardNumber: string;
}

export const RequestPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [requests, setRequests] = useState<SparePartsRequest[]>([]);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [requestsRes, jobRes] = await Promise.all([
        sparePartsApi.getSparePartsRequests({ jobCard: jobCardId, status: 'pending' }),
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

  const formatDate = (dateString: string) => {
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
                <h1 className="text-xl font-bold text-gray-900">⏳ Request Pending</h1>
                <p className="text-sm text-gray-600">JOB #{jobCard?.jobCardNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">⏳ REQUEST SUBMITTED - AWAITING MANAGER APPROVAL</span>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                ⚠️ Parts CANNOT be used until approved
              </p>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending requests found</p>
          </div>
        ) : (
          <>
            {/* Request Summary */}
            {requests[0] && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Request ID</label>
                    <p className="text-sm font-medium text-gray-900">{requests[0].requestId}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">📅 Submitted</label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(requests[0].createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">👤 Requested</label>
                    <p className="text-sm font-medium text-gray-900">
                      {requests[0].technician?.firstName} {requests[0].technician?.lastName} (Mechanic)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">📋 Job Card</label>
                    <p className="text-sm font-medium text-gray-900">{jobCard?.jobCardNumber}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">🔴 Priority</label>
                    <p className="text-sm font-medium text-gray-900 uppercase">{requests[0].priority}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">⏳ Status</label>
                    <p className="text-sm font-medium text-yellow-600">🟡 PENDING APPROVAL</p>
                  </div>
                </div>
              </div>
            )}

            {/* Requested Parts List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 REQUESTED PARTS LIST</h3>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="font-medium text-gray-900">{request.itemName}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        Qty: {request.requestedQuantity} | Stock: {request.currentStock}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-yellow-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">Status: ⏳ Pending Approval</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">⚠️ IMPORTANT:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 mt-1 space-y-1">
                    <li>Parts are LOCKED until Manager approves</li>
                    <li>You CANNOT start repair work using these parts</li>
                    <li>Wait for approval notification</li>
                    <li>Estimated wait time: 15-30 minutes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                🔄 Check Status
              </button>
              <button
                onClick={() => navigate(`/employee/request-parts-form/${jobCardId}`)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                📝 Add More Parts
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
