import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roadTestApi } from '../../api/roadTestApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Video,
  Car,
  FileText,
  Gauge,
} from 'lucide-react';

export const RoadTestHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [roadTests, setRoadTests] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [roadTestRes, jobRes] = await Promise.all([
        roadTestApi.getRoadTests({ jobCard: jobCardId }),
        jobCardApi.getJobCardById(jobCardId),
      ]);

      if (jobRes.success) {
        setJob(jobRes.data);
      }

      if (roadTestRes.data.success) {
        setRoadTests(roadTestRes.data.data);
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

  const getStatusIcon = (result: string) => {
    return result === 'pass' ? CheckCircle : XCircle;
  };

  const getStatusColor = (result: string) => {
    return result === 'pass' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (result: string) => {
    return result === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const handleNewRoadTest = () => {
    navigate(`/employee/road-test-form/${jobCardId}`);
  };

  const handleBackToTesting = () => {
    navigate(`/employee/repair-progress/${jobCardId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const passedCount = roadTests.filter(r => r.result === 'pass').length;
  const failedCount = roadTests.filter(r => r.result === 'fail').length;
  const currentStatus = roadTests.length > 0 ? roadTests[0].result : null;

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
                <h1 className="text-xl font-bold text-gray-900">📊 Road Test History</h1>
                <p className="text-sm text-gray-600">JOB #{job?.jobCardNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">📊 ROAD TEST HISTORY</span>
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Total Road Tests</label>
              <p className="text-2xl font-bold text-gray-900">{roadTests.length}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Passed</label>
              <p className="text-2xl font-bold text-green-600">{passedCount}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Failed</label>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-xs text-gray-500 mb-1">Current Status</label>
            <p className={`text-lg font-semibold ${getStatusColor(currentStatus || 'pending')}`}>
              {currentStatus === 'pass' && '🟢 Passed'}
              {currentStatus === 'fail' && '🔴 Failed'}
              {!currentStatus && '⏳ No Tests'}
            </p>
          </div>
        </div>

        {/* Road Tests List */}
        {roadTests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No road tests found for this job card</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roadTests.map((test, index) => {
              const StatusIcon = getStatusIcon(test.result);
              return (
                <div key={test._id} className={`border rounded-lg p-4 ${getStatusBg(test.result)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <StatusIcon className={`w-5 h-5 mr-2 ${getStatusColor(test.result)}`} />
                      <span className="font-medium text-gray-900">
                        {test.result === 'pass' ? '✅' : '❌'} Test #{test.roadTestId} - {test.result.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {index === 0 && '(Current)'}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 mt-2 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-900 ml-2">{formatDate(test.testDate)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tested:</span>
                        <span className="text-gray-900 ml-2">{test.technician?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Distance:</span>
                        <span className="text-gray-900 ml-2">{test.distanceCovered} km</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 ${getStatusColor(test.result)}`}>
                          {test.result === 'pass' ? '🟢 Passed' : '🔴 Failed'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Remarks:</span>
                      <span className="text-gray-900 ml-2">{test.remarks}</span>
                    </div>

                    {/* Failed Items */}
                    {test.result === 'fail' && test.failedItems && test.failedItems.length > 0 && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-700 mb-2">❌ Failed Items:</p>
                        <div className="space-y-1">
                          {test.failedItems.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-red-700">
                              <span className="font-medium">• {item.item}</span>
                              {item.issue && <span className="text-red-600"> - {item.issue}</span>}
                              {item.action && <span className="text-red-600"> (Requires: {item.action})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {test.evidence && test.evidence.length > 0 && (
                      <div>
                        <span className="text-gray-500">Evidence:</span>
                        <span className="text-gray-900 ml-2">
                          {test.evidence.filter((e: any) => e.type === 'image').length} Images, {test.evidence.filter((e: any) => e.type === 'video').length} Video
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={handleNewRoadTest}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
          >
            <Car className="w-4 h-4 mr-2" />
            🚗 PERFORM NEW ROAD TEST
          </button>
          <button
            onClick={handleBackToTesting}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ↩️ Back to Testing
          </button>
        </div>
      </div>
    </div>
  );
};
