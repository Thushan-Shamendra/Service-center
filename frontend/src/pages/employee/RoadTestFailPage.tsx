import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roadTestApi } from '../../api/roadTestApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Camera,
  Video,
  Wrench,
  RotateCcw,
  FileText,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

export const RoadTestFailPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [roadTest, setRoadTest] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [roadTestRes, jobRes] = await Promise.all([
        roadTestApi.getRoadTests({ jobCard: jobCardId, result: 'fail' }),
        jobCardApi.getJobCardById(jobCardId),
      ]);

      if (jobRes.success) {
        setJob(jobRes.data);
      }

      if (roadTestRes.data.success && roadTestRes.data.data.length > 0) {
        setRoadTest(roadTestRes.data.data[0]);
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

  const handleReturnToRepair = () => {
    navigate(`/employee/repair-progress/${jobCardId}`);
  };

  const handleRetest = () => {
    navigate(`/employee/road-test-form/${jobCardId}`);
  };

  const handleAddRepairLog = () => {
    navigate(`/employee/repair-progress/${jobCardId}`);
  };

  const handleViewHistory = () => {
    navigate(`/employee/road-test-history/${jobCardId}`);
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
                <h1 className="text-xl font-bold text-gray-900">❌ Road Test FAILED</h1>
                <p className="text-sm text-gray-600">JOB #{job?.jobCardNumber || 'N/A'}</p>
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
                <span className="font-medium">❌ ROAD TEST FAILED</span>
              </p>
              <p className="text-sm text-red-700 mt-1">
                🔴 Issues found - Further repair required
              </p>
            </div>
          </div>
        </div>

        {roadTest ? (
          <>
            {/* Test Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">🏆 Result</label>
                  <p className="text-sm font-medium text-red-600">❌ FAIL</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">📋 Road Test ID</label>
                  <p className="text-sm font-medium text-gray-900">{roadTest.roadTestId}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">👤 Tested By</label>
                  <p className="text-sm font-medium text-gray-900">{roadTest.technician?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">📅 Test Date</label>
                  <p className="text-sm font-medium text-gray-900">{formatDate(roadTest.testDate)}</p>
                </div>
              </div>
            </div>

            {/* Failed Items */}
            {roadTest.failedItems && roadTest.failedItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">❌ Failed Items</h3>
                <div className="space-y-4">
                  {roadTest.failedItems.map((item: any, index: number) => (
                    <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start mb-2">
                        <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                        <span className="font-medium text-gray-900">{item.item}</span>
                      </div>
                      <div className="ml-7 space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Issue:</span>
                          <span className="text-gray-700 ml-2">{item.issue}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Action:</span>
                          <span className="text-gray-700 ml-2">{item.action}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">📝 Remarks</label>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{roadTest.remarks}</p>
              </div>
            </div>

            {/* Evidence */}
            {roadTest.evidence && roadTest.evidence.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📸 Evidence Uploaded</label>
                <p className="text-sm text-gray-600 mb-4">
                  {roadTest.evidence.filter((e: any) => e.type === 'image').length} Images + {roadTest.evidence.filter((e: any) => e.type === 'video').length} Video
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {roadTest.evidence.map((media: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-2">
                      <div className="flex flex-col items-center">
                        {media.type === 'image' ? (
                          <Camera className="w-6 h-6 text-gray-400 mb-1" />
                        ) : (
                          <Video className="w-6 h-6 text-gray-400 mb-1" />
                        )}
                        <span className="text-xs text-gray-600 truncate w-full text-center">{media.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Action */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-center mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-semibold text-yellow-800">⚠️ Required Action:</span>
              </div>
              <div className="space-y-3 bg-white rounded-lg p-4 border border-yellow-100">
                <div className="flex items-center text-sm text-yellow-700">
                  <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Testing phase cannot be completed</span>
                </div>
                <div className="flex items-center text-sm text-yellow-700">
                  <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Return to repair phase</span>
                </div>
                <div className="flex items-center text-sm text-yellow-700">
                  <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Fix identified issues</span>
                </div>
                <div className="flex items-center text-sm text-yellow-700">
                  <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Retest after repairs completed</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReturnToRepair}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center"
              >
                <Wrench className="w-4 h-4 mr-2" />
                🔧 RETURN TO REPAIR
              </button>
              <button
                onClick={handleAddRepairLog}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                📝 ADD REPAIR LOG
              </button>
              <button
                onClick={handleRetest}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                🔄 RETEST AFTER FIX
              </button>
            </div>

            {/* Testing Blocked Progress */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-semibold text-red-600">80% (Testing Blocked)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400" style={{ width: '80%' }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">⚠️ Testing phase cannot be completed until issues are resolved</p>
              <div className="mt-3 flex justify-center">
                <button
                  onClick={handleViewHistory}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  📊 View All Road Tests
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No failed road test found</p>
          </div>
        )}
      </div>
    </div>
  );
};
