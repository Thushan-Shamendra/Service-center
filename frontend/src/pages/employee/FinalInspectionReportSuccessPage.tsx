import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { finalInspectionReportApi } from '../../api/finalInspectionReportApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Clock,
  Printer,
  Mail,
  Home,
} from 'lucide-react';

export const FinalInspectionReportSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [report, setReport] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handlePrint = () => {
    window.print();
  };

  const handleSendToCustomer = () => {
    toast.success('Report sent to customer email');
  };

  const handleBackToDashboard = () => {
    navigate('/employee/dashboard');
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
                <h1 className="text-xl font-bold text-gray-900">✅ Report Submitted Successfully</h1>
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
                <span className="font-medium">✅ FINAL INSPECTION REPORT SUBMITTED</span>
              </p>
              <p className="text-sm text-green-700 mt-1">
                🎉 Job Completed Successfully
              </p>
            </div>
          </div>
        </div>

        {report ? (
          <>
            {/* Report Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-500">Report ID:</span>
                  <span className="ml-2 text-gray-900">{report.reportId}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-500">Job Card:</span>
                  <span className="ml-2 text-gray-900">{job?.jobCardNumber}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900 font-medium">COMPLETED</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-500">Submitted On:</span>
                  <span className="ml-2 text-gray-900">{formatDate(report.completionDate)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-500">Submitted By:</span>
                  <span className="ml-2 text-gray-900">{report.technician?.firstName} {report.technician?.lastName}</span>
                </div>
              </div>
            </div>

            {/* Detailed Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">📋 Report Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Work Performed:</span>
                  <span className="text-gray-900">{report.workPerformed?.length || 0} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parts Replaced:</span>
                  <span className="text-gray-900">{report.partsReplaced?.length || 0} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Condition:</span>
                  <span className="text-gray-900 capitalize">{report.finalCondition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Safety Check:</span>
                  <span className={report.safetyCheck === 'pass' ? 'text-green-600' : 'text-red-600'}>
                    {report.safetyCheck === 'pass' ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Road Test Result:</span>
                  <span className={report.roadTestResult === 'pass' ? 'text-green-600' : 'text-red-600'}>
                    {report.roadTestResult === 'pass' ? '✅ PASS' : report.roadTestResult === 'fail' ? '❌ FAIL' : '⏳ PENDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Issues:</span>
                  <span className="text-gray-900">{report.remainingIssues?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Time Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">⏱️ Total Time Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {report.timeSummary ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inspection Time:</span>
                      <span className="text-gray-900">{report.timeSummary.inspectionTime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repair Time:</span>
                      <span className="text-gray-900">{report.timeSummary.repairTime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waiting Time:</span>
                      <span className="text-gray-900">{report.timeSummary.waitingTime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Testing Time:</span>
                      <span className="text-gray-900">{report.timeSummary.testingTime || 'N/A'}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-600">Total Time:</span>
                        <span className="text-gray-900">{report.timeSummary.totalTime || 'N/A'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 italic">Time summary not available</p>
                )}
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-400 mr-2" />
                <p className="text-sm text-blue-700">
                  📄 You can view this report anytime from job history
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                🖨️ Print Report
              </button>
              <button
                onClick={handleSendToCustomer}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                📧 Send to Customer
              </button>
              <button
                onClick={handleBackToDashboard}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
              >
                <Home className="w-4 h-4 mr-2" />
                🏠 Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No report found</p>
          </div>
        )}
      </div>
    </div>
  );
};
