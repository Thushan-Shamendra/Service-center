import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sparePartsApi } from '../../api/sparePartsApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface SparePartsRequest {
  _id: string;
  requestId: string;
  itemName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  currentStock: number;
  reason: string;
  status: string;
  issueDate?: string;
  issuedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface JobCard {
  _id: string;
  jobCardNumber: string;
}

export const PartsIssuedPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [requests, setRequests] = useState<SparePartsRequest[]>([]);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [usageType, setUsageType] = useState<'full' | 'partial'>('full');
  const [usedQuantities, setUsedQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [requestsRes, jobRes] = await Promise.all([
        sparePartsApi.getSparePartsRequests({ jobCard: jobCardId, status: 'issued' }),
        jobCardId ? jobCardApi.getJobCardById(jobCardId) : Promise.resolve(null),
      ]);

      if (requestsRes.data.success) {
        setRequests(requestsRes.data.data);
        // Initialize used quantities with approved quantities
        const initialQuantities: Record<string, number> = {};
        requestsRes.data.data.forEach((req: SparePartsRequest) => {
          initialQuantities[req._id] = req.approvedQuantity;
        });
        setUsedQuantities(initialQuantities);
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

  const handleQuantityChange = (requestId: string, value: number) => {
    const request = requests.find(r => r._id === requestId);
    if (request && value <= request.approvedQuantity && value >= 0) {
      setUsedQuantities(prev => ({ ...prev, [requestId]: value }));
    }
  };

  const handleConfirmUsage = async () => {
    if (requests.length === 0) return;

    setIsSubmitting(true);
    try {
      // Record usage for each request
      for (const request of requests) {
        const usedQuantity = usedQuantities[request._id] || request.approvedQuantity;
        await sparePartsApi.recordPartsUsage(request._id, {
          usedQuantity,
          usageType,
        });
      }

      toast.success('Parts usage recorded successfully');
      navigate(`/employee/parts-request-status/${jobCardId}`);
    } catch (error) {
      toast.error('Failed to record parts usage');
    } finally {
      setIsSubmitting(false);
    }
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
                <h1 className="text-xl font-bold text-gray-900">📦 Parts Issued</h1>
                <p className="text-sm text-gray-600">JOB #{jobCard?.jobCardNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">📦 PARTS ISSUED - RECORD USAGE</span>
              </p>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No issued parts found</p>
          </div>
        ) : (
          <>
            {/* Issue Summary */}
            {requests[0] && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Request ID</label>
                    <p className="text-sm font-medium text-gray-900">{requests[0].requestId}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Issued By</label>
                    <p className="text-sm font-medium text-gray-900">
                      {requests[0].issuedBy?.firstName} {requests[0].issuedBy?.lastName} (Manager)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Issued On</label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(requests[0].issueDate)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">✅ Status</label>
                    <p className="text-sm font-medium text-green-600">🟢 ISSUED</p>
                  </div>
                </div>
              </div>
            )}

            {/* Parts Issued List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 PARTS ISSUED LIST - RECORD USAGE</h3>
              <div className="space-y-4">
                {requests.map((request) => {
                  const stockAfter = request.currentStock - request.approvedQuantity;
                  const usedQuantity = usedQuantities[request._id] || request.approvedQuantity;
                  return (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="font-medium text-gray-900">{request.itemName}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-2 mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Requested:</span> {request.requestedQuantity}
                        </div>
                        <div>
                          <span className="text-gray-500">Issued:</span> {request.approvedQuantity}
                        </div>
                        <div>
                          <span className="text-gray-500">Stock Before:</span> {request.currentStock}
                        </div>
                        <div>
                          <span className="text-gray-500">Stock After:</span> {stockAfter}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Used:</label>
                        <input
                          type="number"
                          min="0"
                          max={request.approvedQuantity}
                          value={usedQuantity}
                          onChange={(e) => handleQuantityChange(request._id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-sm text-gray-500">/ {request.approvedQuantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Usage Confirmation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 CONFIRM PARTS USAGE</h3>
              <p className="text-sm text-gray-600 mb-4">Are all issued parts used in the repair?</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setUsageType('full')}
                  className={`flex-1 py-4 px-6 rounded-lg border-2 transition-colors ${
                    usageType === 'full'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <CheckCircle className={`w-6 h-6 mb-2 ${usageType === 'full' ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="font-medium">✅ YES</span>
                    <span className="text-xs text-gray-500">All Used</span>
                  </div>
                </button>
                <button
                  onClick={() => setUsageType('partial')}
                  className={`flex-1 py-4 px-6 rounded-lg border-2 transition-colors ${
                    usageType === 'partial'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <AlertTriangle className={`w-6 h-6 mb-2 ${usageType === 'partial' ? 'text-yellow-500' : 'text-gray-300'}`} />
                    <span className="font-medium">⚠️ PARTIAL</span>
                    <span className="text-xs text-gray-500">Some Left</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmUsage}
                disabled={isSubmitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Recording...' : '✅ Confirm Usage'}
              </button>
              <button
                onClick={() => navigate(`/employee/parts-request-status/${jobCardId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                📦 Return Parts
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
