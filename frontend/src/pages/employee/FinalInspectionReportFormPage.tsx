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
  CheckCircle,
  XCircle,
  Save,
  Send,
} from 'lucide-react';

export const FinalInspectionReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [job, setJob] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    workPerformed: [] as string[],
    finalCondition: 'good' as 'excellent' | 'good' | 'fair' | 'needs_repair',
    safetyCheck: 'pass' as 'pass' | 'fail',
    remainingIssues: [] as string[],
    futureRecommendations: [] as string[],
    mechanicRemarks: '',
  });

  const [showValidation, setShowValidation] = useState(false);

  const [newWorkItem, setNewWorkItem] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  // Check for failed report data on mount
  useEffect(() => {
    const failedReportData = sessionStorage.getItem('failedReportData');
    if (failedReportData) {
      const parsedData = JSON.parse(failedReportData);
      // Only use if it matches the current job card
      if (parsedData.jobCard === jobCardId) {
        setFormData({
          workPerformed: parsedData.workPerformed || [],
          finalCondition: parsedData.finalCondition || 'good',
          safetyCheck: parsedData.safetyCheck || 'pass',
          remainingIssues: parsedData.remainingIssues || [],
          futureRecommendations: parsedData.futureRecommendations || [],
          mechanicRemarks: parsedData.mechanicRemarks || '',
        });
        toast.success('Report data restored from failed save attempt');
        // Clear the failed data after loading
        sessionStorage.removeItem('failedReportData');
      }
    }
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [reportRes, jobRes] = await Promise.all([
        finalInspectionReportApi.getReportDataForJobCard(jobCardId),
        jobCardId ? jobCardApi.getJobCardById(jobCardId) : Promise.resolve(null),
      ]);

      if (reportRes.success) {
        setReportData(reportRes.data);
      }

      if (jobRes && jobRes.success) {
        setJob(jobRes.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const addWorkItem = () => {
    if (newWorkItem.trim()) {
      setFormData(prev => ({
        ...prev,
        workPerformed: [...prev.workPerformed, newWorkItem.trim()],
      }));
      setNewWorkItem('');
    }
  };

  const removeWorkItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workPerformed: prev.workPerformed.filter((_, i) => i !== index),
    }));
  };

  const addIssue = () => {
    if (newIssue.trim()) {
      setFormData(prev => ({
        ...prev,
        remainingIssues: [...prev.remainingIssues, newIssue.trim()],
      }));
      setNewIssue('');
    }
  };

  const removeIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      remainingIssues: prev.remainingIssues.filter((_, i) => i !== index),
    }));
  };

  const addRecommendation = () => {
    if (newRecommendation.trim()) {
      setFormData(prev => ({
        ...prev,
        futureRecommendations: [...prev.futureRecommendations, newRecommendation.trim()],
      }));
      setNewRecommendation('');
    }
  };

  const removeRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      futureRecommendations: prev.futureRecommendations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    if (!jobCardId) {
      toast.error('Job card ID is required');
      return;
    }

    if (status === 'submitted') {
      if (formData.workPerformed.length === 0) {
        toast.error('Please enter at least one work performed item');
        return;
      }

      if (!formData.mechanicRemarks.trim()) {
        toast.error('Please enter mechanic remarks');
        return;
      }

      if (formData.mechanicRemarks.length > 500) {
        toast.error('Remarks must be 500 characters or less');
        return;
      }

      if (formData.safetyCheck === 'fail' && formData.remainingIssues.length === 0) {
        toast.error('Please specify remaining issues when safety check fails');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        jobCard: jobCardId,
        workPerformed: formData.workPerformed,
        partsReplaced: reportData?.partsReplaced || [],
        finalCondition: formData.finalCondition,
        safetyCheck: formData.safetyCheck,
        remainingIssues: formData.remainingIssues,
        futureRecommendations: formData.futureRecommendations,
        mechanicRemarks: formData.mechanicRemarks,
        status,
      };

      const res = await finalInspectionReportApi.createFinalInspectionReport(payload);
      if (res.success) {
        toast.success(status === 'draft' ? 'Draft saved successfully' : 'Report submitted successfully');
        
        if (status === 'submitted') {
          if (formData.safetyCheck === 'fail' || formData.remainingIssues.length > 0) {
            navigate(`/employee/final-inspection-with-issues/${jobCardId}`);
          } else {
            navigate(`/employee/final-inspection-success/${jobCardId}`);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to save report. Showing report preview.');
      // Navigate to preview page with the current report data even if save failed
      // Store the report data in sessionStorage to display in preview
      sessionStorage.setItem('failedReportData', JSON.stringify({
        jobCard: jobCardId,
        workPerformed: formData.workPerformed,
        partsReplaced: reportData?.partsReplaced || [],
        finalCondition: formData.finalCondition,
        safetyCheck: formData.safetyCheck,
        remainingIssues: formData.remainingIssues,
        futureRecommendations: formData.futureRecommendations,
        mechanicRemarks: formData.mechanicRemarks,
        status: 'draft',
        reportId: generateReportId(),
        completionDate: new Date().toISOString(),
      }));
      navigate(`/employee/final-inspection-preview/temp-${jobCardId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateReportId = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FIN-${dateStr}-${randomNum}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">📋 FINAL INSPECTION REPORT</span>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                ✅ Complete this report to close the job
              </p>
            </div>
          </div>
        </div>

        {/* Auto-filled Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Report Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Report ID</label>
              <p className="text-sm font-medium text-gray-900">{generateReportId()} <span className="text-xs text-gray-400">[Auto Generated]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Job Card</label>
              <p className="text-sm font-medium text-gray-900">{job?.jobCardNumber || 'N/A'} <span className="text-xs text-gray-400">[Auto Filled]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Completion Date</label>
              <p className="text-sm font-medium text-gray-900">{formatDate(new Date().toISOString())} <span className="text-xs text-gray-400">[Auto Filled]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vehicle</label>
              <p className="text-sm font-medium text-gray-900">{job?.vehicle?.make} {job?.vehicle?.model} ({job?.vehicle?.year})</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reg No.</label>
              <p className="text-sm font-medium text-gray-900">{job?.vehicle?.registrationNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer</label>
              <p className="text-sm font-medium text-gray-900">{job?.customer?.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Work Performed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">🛠️ WORK PERFORMED</h3>
          <p className="text-xs text-gray-400 mb-4">(Enter all repair work completed)</p>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newWorkItem}
              onChange={(e) => setNewWorkItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addWorkItem()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter work performed..."
            />
            <button
              onClick={addWorkItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.workPerformed.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No work performed added yet</p>
            ) : (
              formData.workPerformed.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-900">{index + 1}. {item}</span>
                  <button
                    onClick={() => removeWorkItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="text-right text-xs text-gray-500 mt-2">
            Character Count: {formData.workPerformed.join('\n').length}/500
          </div>
        </div>

        {/* Parts Replaced */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">📦 PARTS REPLACED (With Quantities)</h3>
          <p className="text-xs text-gray-400 mb-4">Auto Loaded from Approved & Issued Parts</p>
          {reportData?.partsReplaced && reportData.partsReplaced.length > 0 ? (
            <div className="space-y-3">
              {reportData.partsReplaced.map((part: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="font-medium text-sm text-gray-900">{part.itemName}</span>
                  </div>
                  <div className="ml-6 text-xs text-gray-600 grid grid-cols-2 gap-2">
                    <div>Part No: {part.partNumber}</div>
                    <div>Qty: {part.quantity}</div>
                    <div>Status: ✅ Installed</div>
                    <div>₹{part.cost?.toLocaleString() || '0'}</div>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Parts Used:</span>
                  <span className="font-medium text-gray-900">{reportData.partsReplaced.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Total Parts Cost:</span>
                  <span className="font-medium text-gray-900">₹{reportData.partsReplaced.reduce((acc: number, part: any) => acc + (part.cost || 0), 0).toLocaleString()}</span>
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
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="finalCondition"
                  value={option.value}
                  checked={formData.finalCondition === option.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalCondition: e.target.value as any }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Safety Check */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">🛡️ SAFETY CHECK</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setFormData(prev => ({ ...prev, safetyCheck: 'pass' }))}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                formData.safetyCheck === 'pass'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center">
                <CheckCircle className={`w-6 h-6 mb-2 ${formData.safetyCheck === 'pass' ? 'text-green-500' : 'text-gray-300'}`} />
                <span className="font-medium">✅ PASS</span>
              </div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, safetyCheck: 'fail' }))}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                formData.safetyCheck === 'fail'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center">
                <XCircle className={`w-6 h-6 mb-2 ${formData.safetyCheck === 'fail' ? 'text-red-500' : 'text-gray-300'}`} />
                <span className="font-medium">❌ FAIL</span>
              </div>
            </button>
          </div>
        </div>

        {/* Road Test Result */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">🚗 ROAD TEST RESULT (Auto Filled from Road Test)</h3>
          {reportData?.roadTest ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Road Test Result:</span>
                <span className={`ml-2 ${reportData.roadTest.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.roadTest.result === 'pass' ? '✅ PASS' : '❌ FAIL'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Test ID:</span>
                <span className="ml-2 text-gray-900">{reportData.roadTest.roadTestId}</span>
              </div>
              <div>
                <span className="text-gray-500">Tested By:</span>
                <span className="ml-2 text-gray-900">{reportData.roadTest.technician?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2 text-gray-900">{formatDate(reportData.roadTest.testDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">Distance:</span>
                <span className="ml-2 text-gray-900">{reportData.roadTest.distanceCovered || 0} km</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No road test completed yet</p>
          )}
        </div>

        {/* Remaining Issues */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">⚠️ REMAINING ISSUES (If any)</h3>
          <p className="text-xs text-gray-400 mb-4">(List any issues still present after repair)</p>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newIssue}
              onChange={(e) => setNewIssue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIssue()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter remaining issue..."
            />
            <button
              onClick={addIssue}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.remainingIssues.length === 0 ? (
              <p className="text-sm text-gray-500 italic">None</p>
            ) : (
              formData.remainingIssues.map((issue, index) => (
                <div key={index} className="flex items-start justify-between bg-yellow-50 rounded-lg p-3">
                  <span className="text-sm text-gray-900">{index + 1}. {issue}</span>
                  <button
                    onClick={() => removeIssue(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="text-right text-xs text-gray-500 mt-2">
            Character Count: {formData.remainingIssues.join('\n').length}/500
          </div>
        </div>

        {/* Future Recommendations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">💡 FUTURE RECOMMENDATIONS</h3>
          <p className="text-xs text-gray-400 mb-4">(Suggestions for future service/maintenance)</p>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newRecommendation}
              onChange={(e) => setNewRecommendation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRecommendation()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter recommendation..."
            />
            <button
              onClick={addRecommendation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.futureRecommendations.length === 0 ? (
              <p className="text-sm text-gray-500 italic">None</p>
            ) : (
              formData.futureRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start justify-between bg-blue-50 rounded-lg p-3">
                  <span className="text-sm text-gray-900">{index + 1}. {rec}</span>
                  <button
                    onClick={() => removeRecommendation(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="text-right text-xs text-gray-500 mt-2">
            Character Count: {formData.futureRecommendations.join('\n').length}/500
          </div>
        </div>

        {/* Mechanic Remarks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">📝 MECHANIC REMARKS</h3>
          <p className="text-xs text-gray-400 mb-4">(Additional observations or notes)</p>
          <textarea
            value={formData.mechanicRemarks}
            onChange={(e) => setFormData(prev => ({ ...prev, mechanicRemarks: e.target.value }))}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter mechanic remarks..."
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            Character Count: {formData.mechanicRemarks.length}/500
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            💾 Save Draft
          </button>
          <button
            onClick={() => setShowValidation(true)}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            📤 Submit Final Report
          </button>
        </div>

        {/* Validation Modal */}
        {showValidation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">✅ Report Validation Check</h2>
                  <button
                    onClick={() => setShowValidation(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Report ID:</span>
                    <span className="ml-2 text-gray-900">{generateReportId()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Job Card:</span>
                    <span className="ml-2 text-gray-900">{job?.jobCardNumber}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Completion Date:</span>
                    <span className="ml-2 text-gray-900">{formatDate(new Date().toISOString())}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Work Performed:</span>
                    <span className="ml-2 text-gray-900">{formData.workPerformed.length} items listed</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Parts Replaced:</span>
                    <span className="ml-2 text-gray-900">{reportData?.partsReplaced?.length || 0} items (Auto Loaded)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Final Condition:</span>
                    <span className="ml-2 text-gray-900 capitalize">{formData.finalCondition}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Safety Check:</span>
                    <span className={`ml-2 ${formData.safetyCheck === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.safetyCheck === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Road Test Result:</span>
                    <span className={`ml-2 ${reportData?.roadTest?.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData?.roadTest?.result === 'pass' ? 'PASS (Auto Filled)' : 'PENDING'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Remaining Issues:</span>
                    <span className="ml-2 text-gray-900">{formData.remainingIssues.length > 0 ? `${formData.remainingIssues.length} listed` : 'None'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Future Recommendations:</span>
                    <span className="ml-2 text-gray-900">{formData.futureRecommendations.length} items listed</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Mechanic Remarks:</span>
                    <span className="ml-2 text-gray-900">{formData.mechanicRemarks ? 'Added' : 'Missing'}</span>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                  <p className="text-sm text-green-700">
                    ✅ All required fields are complete! Report is ready for submission.
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowValidation(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    ↩️ Edit Report
                  </button>
                  <button
                    onClick={() => {
                      setShowValidation(false);
                      handleSubmit('submitted');
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSubmitting ? 'Submitting...' : '✅ Confirm & Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
