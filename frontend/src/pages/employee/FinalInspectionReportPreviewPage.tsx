import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { finalInspectionReportApi } from '../../api/finalInspectionReportApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const FinalInspectionReportPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [reportId]);

  const fetchData = async () => {
    try {
      // Check if this is a temporary report from failed save
      if (reportId.startsWith('temp-')) {
        const failedReportData = sessionStorage.getItem('failedReportData');
        if (failedReportData) {
          const parsedData = JSON.parse(failedReportData);
          setReport(parsedData);
          
          // Fetch job card details
          if (parsedData.jobCard) {
            const jobRes = await jobCardApi.getJobCardById(parsedData.jobCard);
            if (jobRes.success) {
              setJob(jobRes.data);
            }
          }
          setIsLoading(false);
          return;
        }
      }

      const reportRes = await finalInspectionReportApi.getFinalInspectionReportById(reportId);
      
      if (reportRes.success) {
        setReport(reportRes.data);
        
        // Fetch job card details
        if (reportRes.data.jobCard) {
          const jobRes = await jobCardApi.getJobCardById(reportRes.data.jobCard._id);
          if (jobRes.success) {
            setJob(jobRes.data);
          }
        }
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

  const handleDownloadPDF = () => {
    toast.success('PDF download started');
  };

  const handleSendEmail = () => {
    toast.success('Report sent to customer email');
  };

  const handleEditReport = () => {
    // Navigate back to the form with the job card ID
    const jobCardId = report?.jobCard || (reportId.startsWith('temp-') ? reportId.replace('temp-', '') : null);
    if (jobCardId) {
      navigate(`/employee/final-inspection-form/${jobCardId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      needs_repair: 'Needs Repair',
    };
    return labels[condition] || condition;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
                <h1 className="text-xl font-bold text-gray-900">Final Vehicle Inspection Report</h1>
                <p className="text-sm text-gray-600">
                  {reportId.startsWith('temp-') ? 'Draft Preview (Save Failed)' : 'Preview Mode'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {reportId.startsWith('temp-') && (
                <button
                  onClick={handleEditReport}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Report
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-8" id="report-content">
          {/* Report Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">FINAL VEHICLE INSPECTION REPORT</h1>
            <p className="text-sm text-gray-600">MECHANIC WORKSHOP - SERVICE CENTER</p>
          </div>

          {report && job && (
            <>
              {/* Report Information */}
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Report ID:</span>
                  <span className="ml-2 text-gray-900 font-medium">{report.reportId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 text-gray-900 font-medium">{formatDate(report.completionDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Job Card:</span>
                  <span className="ml-2 text-gray-900 font-medium">{job.jobCardNumber}</span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">CUSTOMER INFORMATION</h2>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">{job.customer?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 text-gray-900">{job.customer?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="ml-2 text-gray-900">{job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.year})</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reg No.:</span>
                    <span className="ml-2 text-gray-900">{job.vehicle?.registrationNumber}</span>
                  </div>
                </div>
              </div>

              {/* Work Performed */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">WORK PERFORMED</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {report.workPerformed && report.workPerformed.length > 0 ? (
                    <ul className="space-y-1">
                      {report.workPerformed.map((item: string, index: number) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No work performed recorded</p>
                  )}
                </div>
              </div>

              {/* Parts Replaced */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">PARTS REPLACED</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {report.partsReplaced && report.partsReplaced.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 text-gray-600">Part Name</th>
                          <th className="text-center py-2 text-gray-600">Qty</th>
                          <th className="text-right py-2 text-gray-600">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.partsReplaced.map((part: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="py-2 text-gray-900">{part.itemName}</td>
                            <td className="py-2 text-center text-gray-900">{part.quantity}</td>
                            <td className="py-2 text-right text-gray-900">₹{part.cost?.toLocaleString() || '0'}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 font-medium">
                          <td className="py-2 text-gray-900">TOTAL</td>
                          <td className="py-2 text-center text-gray-900">{report.partsReplaced.length}</td>
                          <td className="py-2 text-right text-gray-900">₹{report.totalPartsCost?.toLocaleString() || '0'}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No parts replaced</p>
                  )}
                </div>
              </div>

              {/* Final Condition */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">FINAL CONDITION</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4 text-sm">
                    {[
                      { value: 'excellent', label: 'Excellent' },
                      { value: 'good', label: 'Good' },
                      { value: 'fair', label: 'Fair' },
                      { value: 'needs_repair', label: 'Needs Repair' },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-2 ${
                          report.finalCondition === option.value ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        <span className={`text-gray-900 ${report.finalCondition === option.value ? 'font-medium' : ''}`}>
                          {option.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety Check & Road Test */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">SAFETY & ROAD TEST</h2>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Safety Check:</span>
                    <span className={`ml-2 ${report.safetyCheck === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {report.safetyCheck === 'pass' ? '✅ PASS' : '❌ FAIL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Road Test:</span>
                    <span className={`ml-2 ${report.roadTestResult === 'pass' ? 'text-green-600' : report.roadTestResult === 'fail' ? 'text-red-600' : 'text-gray-600'}`}>
                      {report.roadTestResult === 'pass' ? '✅ PASS' : report.roadTestResult === 'fail' ? '❌ FAIL' : '⏳ PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remaining Issues */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">REMAINING ISSUES</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {report.remainingIssues && report.remainingIssues.length > 0 ? (
                    <ul className="space-y-1">
                      {report.remainingIssues.map((issue: string, index: number) => (
                        <li key={index} className="text-sm text-gray-900">
                          {index + 1}. {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">None</p>
                  )}
                </div>
              </div>

              {/* Future Recommendations */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">FUTURE RECOMMENDATIONS</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {report.futureRecommendations && report.futureRecommendations.length > 0 ? (
                    <ul className="space-y-1">
                      {report.futureRecommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-gray-900">
                          {index + 1}. {rec}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">None</p>
                  )}
                </div>
              </div>

              {/* Mechanic Remarks */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">MECHANIC REMARKS</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.mechanicRemarks}</p>
                </div>
              </div>

              {/* Signature Section */}
              <div className="mt-8 pt-6 border-t-2 border-gray-300">
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <div className="border-b border-gray-400 mb-2 pb-2">
                      <span className="text-gray-600">Signature:</span>
                    </div>
                    <div className="text-gray-900">
                      <div>Date: {formatDate(report.completionDate)}</div>
                      <div>Mechanic: {report.technician?.firstName} {report.technician?.lastName}</div>
                      <div>Workshop: Service Center</div>
                    </div>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 mb-2 pb-2">
                      <span className="text-gray-600">Customer Signature:</span>
                    </div>
                    <div className="text-gray-500 italic">_____________________</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
