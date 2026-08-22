import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { finalInspectionReportApi } from '../../api/finalInspectionReportApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Wrench,
  Package,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Send,
} from 'lucide-react';

export const FinalInspectionReportWithIssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [report, setReport] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [reportRes, jobRes] = await Promise.all([
        finalInspectionReportApi.getFinalInspectionReports({ jobCard: jobCardId }),
        jobCardId ? jobCardApi.getJobCardById(jobCardId) : Promise.resolve(null),
      ]);

      if (reportRes.success && reportRes.data.length > 0) {
        setReport(reportRes.data[0]);
      }

      if (jobRes && jobRes.success) {
        setJob(jobRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToRepair = () => {
    navigate(`/employee/repair-progress/${jobCardId}`);
  };

  const handleSubmitAnyway = async () => {
    setIsSubmitting(true);
    try {
      toast.success('Report submitted with issues');
      navigate(`/employee/final-inspection-success/${jobCardId}`);
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
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
                <h1 className="text-xl font-bold text-gray-900">📋 Final Vehicle Inspection Report</h1>
                <p className="text-sm text-gray-600">
                  JOB #{job?.jobCardNumber || 'N/A'} - {job?.vehicle?.make} {job?.vehicle?.model}
                </p>
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
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">📋 FINAL INSPECTION REPORT</span>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                ⚠️ Vehicle has remaining issues
              </p>
            </div>
          </div>
        </div>

        {report ? (
          <>
            {/* Report Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Report Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Report ID</label>
                  <p className="text-sm font-medium text-gray-900">{report.reportId}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Job Card</label>
                  <p className="text-sm font-medium text-gray-900">{job?.jobCardNumber}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Completion Date</label>
                  <p className="text-sm font-medium text-gray-900">{formatDate(report.completionDate)}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vehicle</label>
                  <p className="text-sm font-medium text-gray-900">{job?.vehicle?.make} {job?.vehicle?.model}</p>
                </div>
              </div>
            </div>

            {/* Work Performed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">🛠️ WORK PERFORMED</h3>
              <div className="space-y-2">
                {report.workPerformed && report.workPerformed.length > 0 ? (
                  report.workPerformed.map((item: string, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <XCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-900">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No work performed recorded</p>
                )}
              </div>
            </div>

            {/* Parts Replaced */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">📦 PARTS REPLACED</h3>
              {report.partsReplaced && report.partsReplaced.length > 0 ? (
                <div className="space-y-2">
                  {report.partsReplaced.map((part: any, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <XCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-900">{part.itemName} Qty: {part.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-medium text-gray-900">₹{report.totalPartsCost?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No parts replaced</p>
              )}
            </div>

            {/* Final Vehicle Condition */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">🔍 FINAL VEHICLE CONDITION</h3>
              <div className="space-y-2">
                {[
                  { value: 'excellent', label: 'Excellent - Like new condition' },
                  { value: 'good', label: 'Good - Minor wear, overall good' },
                  { value: 'fair', label: 'Fair - Some issues, needs attention' },
                  { value: 'needs_repair', label: 'Needs Further Repair - Major issues found' },
                ].map((option) => (
                  <div key={option.value} className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${
                      report.finalCondition === option.value ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                    <span className={`text-sm ${
                      report.finalCondition === option.value ? 'font-medium text-gray-900' : 'text-gray-600'
                    }`}>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Check */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">🛡️ SAFETY CHECK</h3>
              <div className="flex space-x-4">
                <button
                  disabled
                  className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                    report.safetyCheck === 'pass'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <XCircle className={`w-6 h-6 mb-2 ${report.safetyCheck === 'pass' ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="font-medium">✅ PASS</span>
                  </div>
                </button>
                <button
                  disabled
                  className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                    report.safetyCheck === 'fail'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <XCircle className={`w-6 h-6 mb-2 ${report.safetyCheck === 'fail' ? 'text-red-500' : 'text-gray-300'}`} />
                    <span className="font-medium">❌ FAIL</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Road Test Result */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">🚗 ROAD TEST RESULT</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Road Test Result:</span>
                  <span className={`ml-2 ${report.roadTestResult === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                    {report.roadTestResult === 'pass' ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                {report.roadTestId && (
                  <div>
                    <span className="text-gray-500">Test ID:</span>
                    <span className="ml-2 text-gray-900">{report.roadTestId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Remaining Issues */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">⚠️ REMAINING ISSUES</h3>
              {report.remainingIssues && report.remainingIssues.length > 0 ? (
                <div className="space-y-2">
                  {report.remainingIssues.map((issue: string, index: number) => (
                    <div key={index} className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{index + 1}. {issue}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">None</p>
              )}
            </div>

            {/* Future Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">💡 FUTURE RECOMMENDATIONS</h3>
              {report.futureRecommendations && report.futureRecommendations.length > 0 ? (
                <div className="space-y-2">
                  {report.futureRecommendations.map((rec: string, index: number) => (
                    <div key={index} className="text-sm text-gray-900">
                      {index + 1}. {rec}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">None</p>
              )}
            </div>

            {/* Mechanic Remarks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">📝 MECHANIC REMARKS</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{report.mechanicRemarks}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReturnToRepair}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center"
              >
                <Wrench className="w-4 h-4 mr-2" />
                🔧 Return to Repair
              </button>
              <button
                onClick={handleSubmitAnyway}
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Submitting...' : '📤 Submit Report Anyway'}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No report found</p>
          </div>
        )}
      </div>
    </div>
  );
};
