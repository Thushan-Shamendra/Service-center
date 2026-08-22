import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { finalInspectionApi } from '../../api/finalInspectionApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileCheck,
  Save,
  Shield,
  Wrench,
  Package,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Edit2,
} from 'lucide-react';

export const FinalInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [finalInspection, setFinalInspection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    jobCard: '',
    finalVehicleCondition: 'good',
    safetyCheck: {
      result: 'pass',
      checklist: {
        brakes: false,
        steering: false,
        tires: false,
        lights: false,
        fluidLeaks: false,
        seatBelts: false,
      },
    },
    remainingIssues: '',
    futureRecommendations: {
      recommendedNextService: '',
      additionalRecommendations: '',
    },
    mechanicRemarks: '',
    technicianSignature: {
      signatureData: '',
    },
  });

  useEffect(() => {
    fetchJobsReadyForFinalInspection();
  }, []);

  const fetchJobsReadyForFinalInspection = async () => {
    try {
      const res = await jobCardApi.getJobCards({ 
        assignedTechnician: 'current',
        status: 'ready_for_delivery'
      });
      if (res.data.success) {
        setJobs(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch jobs ready for final inspection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSelect = async (job: any) => {
    setSelectedJob(job);
    setInspectionData(prev => ({ ...prev, jobCard: job._id }));

    // Check if final inspection already exists
    try {
      const res = await finalInspectionApi.getFinalInspections({ jobCard: job._id });
      if (res.data.success && res.data.data.length > 0) {
        setFinalInspection(res.data.data[0]);
        setInspectionData(res.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch existing inspection');
    }
  };

  const handleSafetyCheckChange = (item: string, checked: boolean) => {
    setInspectionData(prev => ({
      ...prev,
      safetyCheck: {
        ...prev.safetyCheck,
        checklist: {
          ...prev.safetyCheck.checklist,
          [item]: checked,
        },
      },
    }));
  };

  const handleSubmitFinalInspection = async () => {
    if (!selectedJob) {
      toast.error('Please select a job card');
      return;
    }

    // Validation
    if (inspectionData.safetyCheck.result === 'fail' && !inspectionData.remainingIssues) {
      toast.error('Remaining issues are required when safety check fails');
      return;
    }

    if (inspectionData.finalVehicleCondition === 'needs_further_repair' && !inspectionData.remainingIssues) {
      toast.error('Remaining issues are required when vehicle needs further repair');
      return;
    }

    if (!inspectionData.technicianSignature.signatureData) {
      toast.error('Technician signature is required');
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (finalInspection) {
        res = await finalInspectionApi.updateFinalInspection(finalInspection._id, inspectionData);
      } else {
        res = await finalInspectionApi.createFinalInspection(inspectionData);
      }

      if (res.data.success) {
        // Submit the inspection
        await finalInspectionApi.submitFinalInspection(res.data.data._id);
        toast.success('Final inspection submitted successfully');
        navigate('/employee/dashboard');
      }
    } catch (error) {
      toast.error('Failed to submit final inspection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedJob) {
      toast.error('Please select a job card');
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (finalInspection) {
        res = await finalInspectionApi.updateFinalInspection(finalInspection._id, inspectionData);
      } else {
        res = await finalInspectionApi.createFinalInspection(inspectionData);
      }

      if (res.data.success) {
        toast.success('Draft saved successfully');
        setFinalInspection(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Final Vehicle Inspection</h1>
            <p className="text-sm text-gray-600">Complete the final technical inspection before delivery</p>
          </div>
        </div>
      </div>

      {/* Job Selection */}
      {!selectedJob ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Select Job Card for Final Inspection</h2>
          </div>
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No jobs ready for final inspection</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleJobSelect(job)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.jobCardNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {job.vehicle?.make} {job.vehicle?.model} • {job.vehicle?.registrationNumber}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Customer: {job.customer?.name}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Ready for Delivery
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Selected Job Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 mb-2"
                >
                  ← Back to Jobs
                </button>
                <h2 className="text-lg font-semibold">{selectedJob.jobCardNumber}</h2>
                <p className="text-sm text-gray-600">
                  {selectedJob.vehicle?.make} {selectedJob.vehicle?.model} • {selectedJob.vehicle?.registrationNumber}
                </p>
              </div>
              {finalInspection && finalInspection.status === 'submitted' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Submitted
                </span>
              )}
            </div>
          </div>

          {/* Final Inspection Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Report Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report ID</label>
                <input
                  type="text"
                  value={finalInspection?.reportId || 'Auto Generated'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Card</label>
                <input
                  type="text"
                  value={selectedJob.jobCardNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Work Performed */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Wrench className="w-5 h-5 mr-2" />
                Work Performed
              </h3>
              <div className="border border-gray-200 rounded-lg p-4">
                {selectedJob.workPerformed && selectedJob.workPerformed.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedJob.workPerformed.map((work: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                        <span className="text-sm">{work}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No work performed recorded</p>
                )}
              </div>
            </div>

            {/* Parts Replaced */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Parts Replaced
              </h3>
              <div className="border border-gray-200 rounded-lg p-4">
                {selectedJob.parts && selectedJob.parts.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Item Code</th>
                        <th className="text-left py-2">Item Name</th>
                        <th className="text-left py-2">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJob.parts.map((part: any, index: number) => (
                        <tr key={index}>
                          <td className="py-2">{part.item?.itemCode || 'N/A'}</td>
                          <td className="py-2">{part.name}</td>
                          <td className="py-2">{part.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500">No parts replaced</p>
                )}
              </div>
            </div>

            {/* Final Vehicle Condition */}
            <div>
              <h3 className="font-medium mb-3">Final Vehicle Condition</h3>
              <div className="flex space-x-4">
                {['excellent', 'good', 'fair', 'needs_further_repair'].map((condition) => (
                  <label key={condition} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="finalVehicleCondition"
                      value={condition}
                      checked={inspectionData.finalVehicleCondition === condition}
                      onChange={(e) => setInspectionData(prev => ({ ...prev, finalVehicleCondition: e.target.value }))}
                      disabled={finalInspection?.status === 'submitted'}
                      className="text-blue-600"
                    />
                    <span className="capitalize text-sm">{condition.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Safety Check */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Safety Check
              </h3>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setInspectionData(prev => ({ ...prev, safetyCheck: { ...prev.safetyCheck, result: 'pass' } }))}
                    disabled={finalInspection?.status === 'submitted'}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      inspectionData.safetyCheck.result === 'pass'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className={`w-5 h-5 ${inspectionData.safetyCheck.result === 'pass' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${inspectionData.safetyCheck.result === 'pass' ? 'text-green-800' : 'text-gray-600'}`}>
                        Pass
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionData(prev => ({ ...prev, safetyCheck: { ...prev.safetyCheck, result: 'fail' } }))}
                    disabled={finalInspection?.status === 'submitted'}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      inspectionData.safetyCheck.result === 'fail'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <AlertTriangle className={`w-5 h-5 ${inspectionData.safetyCheck.result === 'fail' ? 'text-red-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${inspectionData.safetyCheck.result === 'fail' ? 'text-red-800' : 'text-gray-600'}`}>
                        Fail
                      </span>
                    </div>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium mb-3">Safety Checklist</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'brakes', label: 'Brakes' },
                      { key: 'steering', label: 'Steering' },
                      { key: 'tires', label: 'Tires' },
                      { key: 'lights', label: 'Lights' },
                      { key: 'fluidLeaks', label: 'Fluid Leaks' },
                      { key: 'seatBelts', label: 'Seat Belts' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inspectionData.safetyCheck.checklist[item.key as keyof typeof inspectionData.safetyCheck.checklist]}
                          onChange={(e) => handleSafetyCheckChange(item.key, e.target.checked)}
                          disabled={finalInspection?.status === 'submitted'}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Road Test Result */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Road Test Result
              </h3>
              <div className="border border-gray-200 rounded-lg p-4">
                {selectedJob.roadTest ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Result:</span>
                      <span className={`font-medium ${selectedJob.roadTest.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedJob.roadTest.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mileage After Test:</span>
                      <span className="text-sm">{selectedJob.roadTest.mileageAfterTest} km</span>
                    </div>
                    {selectedJob.roadTest.remarks && (
                      <div>
                        <span className="text-sm text-gray-600">Remarks:</span>
                        <p className="text-sm mt-1">{selectedJob.roadTest.remarks}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-600">No road test recorded. Vehicle must pass road test before final inspection.</p>
                )}
              </div>
            </div>

            {/* Remaining Issues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remaining Issues {inspectionData.safetyCheck.result === 'fail' && '*'}
              </label>
              <textarea
                value={inspectionData.remainingIssues}
                onChange={(e) => setInspectionData(prev => ({ ...prev, remainingIssues: e.target.value }))}
                disabled={finalInspection?.status === 'submitted'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Document any remaining issues..."
              />
            </div>

            {/* Future Recommendations */}
            <div>
              <h3 className="font-medium mb-3">Future Recommendations</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Recommended Next Service</label>
                  <input
                    type="text"
                    value={inspectionData.futureRecommendations.recommendedNextService}
                    onChange={(e) => setInspectionData(prev => ({
                      ...prev,
                      futureRecommendations: {
                        ...prev.futureRecommendations,
                        recommendedNextService: e.target.value
                      }
                    }))}
                    disabled={finalInspection?.status === 'submitted'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g., Brake inspection after 10,000 km"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Additional Recommendations</label>
                  <textarea
                    value={inspectionData.futureRecommendations.additionalRecommendations}
                    onChange={(e) => setInspectionData(prev => ({
                      ...prev,
                      futureRecommendations: {
                        ...prev.futureRecommendations,
                        additionalRecommendations: e.target.value
                      }
                    }))}
                    disabled={finalInspection?.status === 'submitted'}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Additional recommendations for future service..."
                  />
                </div>
              </div>
            </div>

            {/* Mechanic Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mechanic Remarks</label>
              <textarea
                value={inspectionData.mechanicRemarks}
                onChange={(e) => setInspectionData(prev => ({ ...prev, mechanicRemarks: e.target.value }))}
                disabled={finalInspection?.status === 'submitted'}
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Final professional summary of the work completed..."
              />
              <p className="text-xs text-gray-500 mt-1">{inspectionData.mechanicRemarks.length}/1000 characters</p>
            </div>

            {/* Technician Signature */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Edit2 className="w-5 h-5 mr-2" />
                Technician Signature
              </h3>
              <div className="border border-gray-200 rounded-lg p-4">
                {inspectionData.technicianSignature.signatureData ? (
                  <div className="space-y-2">
                    <img 
                      src={inspectionData.technicianSignature.signatureData} 
                      alt="Signature" 
                      className="h-20"
                    />
                    <button
                      onClick={() => setInspectionData(prev => ({
                        ...prev,
                        technicianSignature: { signatureData: '' }
                      }))}
                      disabled={finalInspection?.status === 'submitted'}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear Signature
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">Click to add signature</p>
                    <button
                      onClick={() => {
                        // In a real implementation, this would open a signature pad
                        const signature = prompt('Enter signature (for demo purposes):');
                        if (signature) {
                          setInspectionData(prev => ({
                            ...prev,
                            technicianSignature: { signatureData: signature }
                          }));
                        }
                      }}
                      disabled={finalInspection?.status === 'submitted'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {finalInspection?.status !== 'submitted' && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSubmitFinalInspection}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileCheck className="w-4 h-4 mr-2" />
                {isSaving ? 'Submitting...' : 'Submit Final Report'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};