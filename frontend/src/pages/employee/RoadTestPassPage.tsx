import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roadTestApi } from '../../api/roadTestApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Camera,
  Video,
  Car,
  Gauge,
  BarChart3,
} from 'lucide-react';

export const RoadTestPassPage: React.FC = () => {
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
        roadTestApi.getRoadTests({ jobCard: jobCardId, result: 'pass' }),
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

  const handleGoToFinalInspection = () => {
    navigate(`/employee/final-inspection-form/${jobCardId}`);
  };

  // Auto-redirect to final inspection after road test pass
  useEffect(() => {
    if (roadTest && !isLoading) {
      const timer = setTimeout(() => {
        navigate(`/employee/final-inspection-form/${jobCardId}`);
      }, 3000); // Auto-redirect after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [roadTest, isLoading, jobCardId, navigate]);

  const handleViewAllTests = () => {
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
                <h1 className="text-xl font-bold text-gray-900">✅ Road Test PASSED</h1>
                <p className="text-sm text-gray-600">JOB #{job?.jobCardNumber || 'N/A'}</p>
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
                <span className="font-medium">✅ ROAD TEST PASSED</span>
              </p>
              <p className="text-sm text-green-700 mt-1">
                🟢 Vehicle is roadworthy and ready for delivery
              </p>
              <p className="text-sm text-green-700 mt-1">
                ⏳ Auto-redirecting to Final Inspection Report in 3 seconds...
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
                  <p className="text-sm font-medium text-green-600">✅ PASS</p>
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
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">📏 Distance</label>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-gray-400" />
                      {roadTest.distanceCovered} km
                    </p>
                  </div>
                </div>
              </div>

            {/* Test Checklist Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">📋 Test Summary</h3>
              <div className="space-y-2">
                {roadTest.checklist?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle className={`w-4 h-4 mr-2 ${item.passed ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={item.passed ? 'text-gray-900' : 'text-gray-400 line-through'}>
                      ✅ {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">📝 Remarks</label>
              <div className="bg-gray-50 rounded-lg p-4">
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

            {/* Testing Phase Complete Banner */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">✅ TESTING PHASE COMPLETE</p>
                  <p className="text-sm text-green-700 mt-1">🎉 All tests passed. Vehicle ready for final inspection.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleGoToFinalInspection}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                📋 SUBMIT FINAL REPORT
              </button>
              <button
                onClick={handleViewAllTests}
                className="flex-1 px-4 py-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-bold flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                📊 View All Tests
              </button>
            </div>

            {/* Progress 100% */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                <span className="text-xs font-semibold text-green-600">100% (Testing Complete)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '100%' }} />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No passed road test found</p>
          </div>
        )}
      </div>
    </div>
  );
};
