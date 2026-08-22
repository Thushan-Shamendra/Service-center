import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sparePartsApi } from '../../api/sparePartsApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  Wrench,
  ClipboardList,
  FileText,
} from 'lucide-react';

interface SparePartsRequest {
  _id: string;
  requestId: string;
  itemName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  reason: string;
  priority: string;
  status: string;
  managerRemarks: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
}

interface JobCard {
  _id: string;
  jobCardNumber: string;
}

export const RequestApprovedPage: React.FC = () => {
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
        sparePartsApi.getSparePartsRequests({ jobCard: jobCardId, status: 'approved' }),
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
                <h1 className="text-xl font-bold text-gray-900">✅ Request Approved</h1>
                <p className="text-sm text-gray-600">JOB #{jobCard?.jobCardNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-medium">✅ REQUEST APPROVED - PARTS READY FOR USE</span>
              </p>
              <p className="text-sm text-green-700 mt-1">
                🟢 You can now start repair work
              </p>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No approved requests found</p>
          </div>
        ) : (
          <>
            {/* Approval Summary */}
            {requests[0] && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Request ID</label>
                    <p className="text-sm font-medium text-gray-900">{requests[0].requestId}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Approved By</label>
                    <p className="text-sm font-medium text-gray-900">
                      {requests[0].approvedBy?.firstName} {requests[0].approvedBy?.lastName} (Manager)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Approved On</label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(requests[0].approvedAt)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Status</label>
                    <p className="text-sm font-medium text-green-600">🟢 APPROVED</p>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Parts List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ APPROVED PARTS LIST</h3>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="font-medium text-gray-900">{request.itemName}</span>
                      </div>
                      <span className="text-sm text-gray-600">Qty: {request.approvedQuantity}</span>
                    </div>
                    <div className="mt-2 flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Status: ✅ Approved & Available</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manager Remarks */}
            {requests[0]?.managerRemarks && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager Remarks</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{requests[0].managerRemarks}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate(`/employee/repair-progress/${jobCardId}`)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
              >
                <Wrench className="w-4 h-4 mr-2" />
                🔧 Start Repair Now
              </button>
              <button
                onClick={() => navigate(`/employee/parts-request-status/${jobCardId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                📋 View Parts
              </button>
              <button
                onClick={() => navigate(`/employee/parts-issued/${jobCardId}`)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                📝 Record Parts Used
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
