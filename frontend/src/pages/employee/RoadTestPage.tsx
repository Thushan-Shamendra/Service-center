import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roadTestApi } from '../../api/roadTestApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Navigation,
  CheckCircle,
  XCircle,
  Camera,
  Upload,
  Save,
  AlertTriangle,
  Clock,
  CheckSquare,
  Play,
  Square,
  FileText,
  Wrench,
  Plus,
  Trash2,
} from 'lucide-react';

type Step = 'initial' | 'performing' | 'record' | 'pass' | 'fail';

export const RoadTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [currentStep, setCurrentStep] = useState<Step>('initial');
  const [job, setJob] = useState<any>(null);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>(jobCardId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  
  const [preTestChecklist, setPreTestChecklist] = useState([
    { id: 1, text: 'All repairs completed', checked: false },
    { id: 2, text: 'All fluids topped up', checked: false },
    { id: 3, text: 'Tire pressure checked', checked: false },
    { id: 4, text: 'Brakes checked', checked: false },
    { id: 5, text: 'Lights working', checked: false },
    { id: 6, text: 'Test route planned', checked: false },
  ]);

  const [observationChecklist, setObservationChecklist] = useState([
    { id: 1, text: 'Engine temperature normal', checked: false },
    { id: 2, text: 'No abnormal sounds/vibrations', checked: false },
    { id: 3, text: 'Smooth acceleration', checked: false },
    { id: 4, text: 'Brakes working properly', checked: false },
    { id: 5, text: 'Steering responsive', checked: false },
    { id: 6, text: 'AC cooling effective', checked: false },
    { id: 7, text: 'No leaks observed', checked: false },
    { id: 8, text: 'Warning lights off', checked: false },
  ]);

  const [roadTestData, setRoadTestData] = useState({
    result: '',
    remarks: '',
    mileageAfterTest: 0,
    evidence: [] as Array<{ type: 'image' | 'video'; url: string; description: string }>,
  });

  const [failIssues, setFailIssues] = useState<string[]>(['']);

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [jobsRes] = await Promise.all([
        jobCardApi.getJobCards(),
      ]);

      if (jobsRes.success) {
        const activeJobs = (jobsRes.data || []).filter((jc: any) => jc.status !== 'delivered' && jc.status !== 'cancelled');
        setJobCards(activeJobs);
      }

      if (jobCardId) {
        const jobRes = await jobCardApi.getJobCardById(jobCardId);
        if (jobRes.success) {
          setJob(jobRes.data);
          setSelectedJobCardId(jobCardId);
          setRoadTestData(prev => ({
            ...prev,
            mileageAfterTest: jobRes.data.odometer || 0,
          }));
        }
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobCardChange = async (jobCardId: string) => {
    setSelectedJobCardId(jobCardId);
    if (jobCardId) {
      const jobRes = await jobCardApi.getJobCardById(jobCardId);
      if (jobRes.success) {
        setJob(jobRes.data);
        setRoadTestData(prev => ({
          ...prev,
          mileageAfterTest: jobRes.data.odometer || 0,
        }));
      }
    } else {
      setJob(null);
    }
  };

  const handleStartRoadTest = () => {
    const allChecked = preTestChecklist.every(item => item.checked);
    if (!allChecked) {
      toast.error('Please complete all pre-test checklist items');
      return;
    }
    setTestStartTime(new Date());
    setCurrentStep('performing');
  };

  const handleCompleteTest = () => {
    setCurrentStep('record');
  };

  const handleResultSelect = (result: 'pass' | 'fail') => {
    setRoadTestData(prev => ({ ...prev, result }));
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRoadTestData(prev => ({
      ...prev,
      evidence: [
        ...prev.evidence,
        ...files.map(file => ({
          type: (file.type.startsWith('video/') ? 'video' : 'image') as 'video' | 'image',
          url: URL.createObjectURL(file),
          description: file.name,
        })),
      ],
    }));
  };

  const handleRemoveEvidence = (index: number) => {
    setRoadTestData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index),
    }));
  };

  const handleFailIssueChange = (index: number, value: string) => {
    setFailIssues(prev => {
      const newIssues = [...prev];
      newIssues[index] = value;
      return newIssues;
    });
  };

  const addFailIssue = () => {
    setFailIssues(prev => [...prev, '']);
  };

  const removeFailIssue = (index: number) => {
    setFailIssues(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitResult = async () => {
    if (!selectedJobCardId) {
      toast.error('Please select a job card');
      return;
    }

    if (!roadTestData.result) {
      toast.error('Please select road test result');
      return;
    }

    if (roadTestData.mileageAfterTest <= (job?.odometer || 0)) {
      toast.error('Mileage after test must be greater than mileage before test');
      return;
    }

    if (!roadTestData.remarks) {
      toast.error('Please enter remarks');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        jobCard: selectedJobCardId,
        result: roadTestData.result,
        remarks: roadTestData.result === 'fail' 
          ? `${roadTestData.remarks}\n\nIssues: ${failIssues.filter(i => i.trim()).join(', ')}`
          : roadTestData.remarks,
        mileageBeforeTest: job?.odometer || 0,
        mileageAfterTest: roadTestData.mileageAfterTest,
        evidence: roadTestData.evidence,
      };

      const res = await roadTestApi.createRoadTest(payload);
      if (res.data.success) {
        toast.success('Road test submitted successfully');
        setCurrentStep(roadTestData.result === 'pass' ? 'pass' : 'fail');
      }
    } catch (error) {
      toast.error('Failed to submit road test');
    } finally {
      setIsSaving(false);
    }
  };

  const getDistanceCovered = () => {
    return roadTestData.mileageAfterTest - (job?.odometer || 0);
  };

  const handleBackToRepair = () => {
    navigate(`/employee/repair-progress/${jobCardId}`);
  };

  const handleGoToFinalInspection = () => {
    navigate(`/employee/final-inspection/${jobCardId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-100 shadow-card">
        <Navigation className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">Job Card Not Found</h3>
        <p className="text-sm text-slate-400 mb-4">The requested job card could not be loaded.</p>
        <button
          onClick={() => navigate('/employee/assigned-jobs')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assigned Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {job && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/employee/assigned-jobs')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">🚗 Road Test</h1>
              <p className="text-sm text-slate-600">JOB #{job.jobCardNumber} - {job.vehicle?.make} {job.vehicle?.model}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {job && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
            <span className="text-xs font-semibold text-brand-600">
              {currentStep === 'initial' && '17%'}
              {currentStep === 'performing' && '50%'}
              {currentStep === 'record' && '75%'}
              {(currentStep === 'pass' || currentStep === 'fail') && '100%'}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                currentStep === 'initial' ? 'w-[17%] bg-brand-500' :
                currentStep === 'performing' ? 'w-[50%] bg-brand-500' :
                currentStep === 'record' ? 'w-[75%] bg-brand-500' :
                currentStep === 'pass' ? 'w-full bg-emerald-500' :
                'w-full bg-rose-500'
              }`}
            />
          </div>
        </div>
      )}

      {/* STEP 1: INITIAL VIEW */}
      {currentStep === 'initial' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Navigation className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">STEP 5 OF 6: ROAD TEST</h2>
            </div>

            {/* Job Card Selection */}
            {!jobCardId && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Select Job Card
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Job Card *</label>
                  <select
                    value={selectedJobCardId}
                    onChange={(e) => handleJobCardChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Select Job Card</option>
                    {jobCards.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.jobCardNumber} - {job.vehicle?.make} {job.vehicle?.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {job && (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-800">Testing Phase Completed</p>
                      <p className="text-sm text-emerald-700">Ready for Road Test</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Vehicle:</span>
                      <span className="ml-2 font-medium text-slate-900">{job.vehicle?.make} {job.vehicle?.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Reg No.:</span>
                      <span className="ml-2 font-medium text-slate-900">{job.vehicle?.registrationNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Odometer:</span>
                      <span className="ml-2 font-medium text-slate-900">{job.odometer?.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Fuel Level:</span>
                      <span className="ml-2 font-medium text-slate-900">3/4 Tank</span>
                    </div>
                  </div>
                </div>

                {/* Pre-Test Checklist */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pre-Test Checklist
                  </h3>
                  <div className="space-y-2">
                    {preTestChecklist.map((item) => (
                      <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => {
                            setPreTestChecklist(prev =>
                              prev.map(i => i.id === item.id ? { ...i, checked: e.target.checked } : i)
                            );
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-slate-700">{item.text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartRoadTest}
                  className="w-full py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  START ROAD TEST
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: PERFORMING TEST */}
      {currentStep === 'performing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Navigation className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">ROAD TEST IN PROGRESS...</h2>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="font-semibold text-amber-800">Please complete the test drive</p>
              </div>
            </div>

            {/* Test Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Test Started:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {testStartTime?.toLocaleTimeString()} - {testStartTime?.toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Mileage Before:</span>
                  <span className="ml-2 font-medium text-slate-900">{job.odometer?.toLocaleString()} km</span>
                </div>
              </div>
            </div>

            {/* Test Route */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Test Route & Conditions
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-500">Route:</span>
                  <span className="ml-2 text-slate-900">City roads + Highway stretch (5 km)</span>
                </div>
                <div>
                  <span className="text-slate-500">Traffic:</span>
                  <span className="ml-2 text-slate-900">Moderate</span>
                </div>
                <div>
                  <span className="text-slate-500">Weather:</span>
                  <span className="ml-2 text-slate-900">Clear, 28°C</span>
                </div>
              </div>
            </div>

            {/* Observation Checklist */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Observation Checklist
              </h3>
              <div className="space-y-2">
                {observationChecklist.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        setObservationChecklist(prev =>
                          prev.map(i => i.id === item.id ? { ...i, checked: e.target.checked } : i)
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-700">{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCompleteTest}
            className="w-full py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5" />
            COMPLETE ROAD TEST
          </button>
        </div>
      )}

      {/* STEP 3: RECORD RESULT */}
      {currentStep === 'record' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">RECORD ROAD TEST RESULT</h2>
            </div>

            {/* Auto-filled fields */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Road Test ID</label>
                <input
                  type="text"
                  value="Auto Generated"
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Job Card</label>
                <input
                  type="text"
                  value={job.jobCardNumber}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Road Test Date</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Road Test Time</label>
                <input
                  type="text"
                  value={new Date().toLocaleTimeString()}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm"
                />
              </div>
            </div>

            {/* Result Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                ROAD TEST RESULT
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleResultSelect('pass')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    roadTestData.result === 'pass'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className={`w-8 h-8 ${roadTestData.result === 'pass' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`font-bold ${roadTestData.result === 'pass' ? 'text-emerald-800' : 'text-slate-600'}`}>
                      🟢 PASS
                    </span>
                    <span className="text-xs text-slate-500">Click to Select</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleResultSelect('fail')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    roadTestData.result === 'fail'
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <XCircle className={`w-8 h-8 ${roadTestData.result === 'fail' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span className={`font-bold ${roadTestData.result === 'fail' ? 'text-rose-800' : 'text-slate-600'}`}>
                      🔴 FAIL
                    </span>
                    <span className="text-xs text-slate-500">Click to Select</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Mileage */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mileage After Test</label>
                <input
                  type="number"
                  value={roadTestData.mileageAfterTest}
                  onChange={(e) => setRoadTestData(prev => ({ ...prev, mileageAfterTest: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Enter mileage"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Distance Driven</label>
                <input
                  type="text"
                  value={`${getDistanceCovered()} km`}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                REMARKS
              </h3>
              <textarea
                value={roadTestData.remarks}
                onChange={(e) => setRoadTestData(prev => ({ ...prev, remarks: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Enter observations from the road test..."
                maxLength={500}
              />
              <p className="text-xs text-slate-400 mt-1">{roadTestData.remarks.length}/500 characters</p>
            </div>

            {/* Fail Issues */}
            {roadTestData.result === 'fail' && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  ISSUES FOUND
                </h3>
                <div className="space-y-2">
                  {failIssues.map((issue, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={issue}
                        onChange={(e) => handleFailIssueChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Describe the issue..."
                      />
                      {failIssues.length > 1 && (
                        <button
                          onClick={() => removeFailIssue(index)}
                          className="p-2 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFailIssue}
                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Issue
                  </button>
                </div>
              </div>
            )}

            {/* Upload Evidence */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                UPLOAD EVIDENCE
              </h3>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <Camera className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-600 mb-4">Upload supporting photos or videos from the test</p>
                <div className="flex justify-center gap-4">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-bold">
                      <Camera className="w-4 h-4" />
                      Upload Images
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-bold">
                      <Camera className="w-4 h-4" />
                      Upload Videos
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {roadTestData.evidence.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Uploaded Files: ({roadTestData.evidence.length})</p>
                  <div className="grid grid-cols-4 gap-3">
                    {roadTestData.evidence.map((media, index) => (
                      <div key={index} className="relative bg-white rounded-lg border border-slate-200 p-2">
                        <button
                          onClick={() => handleRemoveEvidence(index)}
                          className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="flex flex-col items-center">
                          {media.type === 'image' ? (
                            <Camera className="w-8 h-8 text-slate-400 mb-1" />
                          ) : (
                            <Camera className="w-8 h-8 text-slate-400 mb-1" />
                          )}
                          <span className="text-xs text-slate-600 truncate w-full text-center">{media.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep('initial')}
              className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitResult}
              disabled={isSaving}
              className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Submitting...' : 'Submit Result'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PASS RESULT */}
      {currentStep === 'pass' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-800 mb-2">✅ ROAD TEST PASSED!</h2>
              <p className="text-slate-600">Vehicle passed all road test parameters</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-4 h-4" />
                <span>No issues found during test drive</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-4 h-4" />
                <span>Vehicle ready for final delivery</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Result:</span>
                  <span className="ml-2 font-medium text-emerald-600">🟢 PASS</span>
                </div>
                <div>
                  <span className="text-slate-500">Test Date:</span>
                  <span className="ml-2 font-medium text-slate-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Mileage:</span>
                  <span className="ml-2 font-medium text-slate-900">{roadTestData.mileageAfterTest.toLocaleString()} km ({getDistanceCovered()} km driven)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <h3 className="font-semibold text-slate-700 mb-2">Remarks:</h3>
              <p className="text-sm text-slate-600">{roadTestData.remarks}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800">NEXT STEP</span>
              </div>
              <p className="text-sm text-amber-700 mb-3">Submit Final Inspection Report</p>
              <button
                onClick={handleGoToFinalInspection}
                className="w-full py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                SUBMIT FINAL REPORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: FAIL RESULT */}
      {currentStep === 'fail' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-rose-800 mb-2">❌ ROAD TEST FAILED</h2>
              <p className="text-slate-600">Issues detected during test drive</p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-4 h-4" />
                <span>Vehicle requires additional attention</span>
              </div>
              <div className="flex items-center gap-2 text-rose-800">
                <Wrench className="w-4 h-4" />
                <span>Return to repair phase</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Result:</span>
                  <span className="ml-2 font-medium text-rose-600">🔴 FAIL</span>
                </div>
                <div>
                  <span className="text-slate-500">Test Date:</span>
                  <span className="ml-2 font-medium text-slate-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Mileage:</span>
                  <span className="ml-2 font-medium text-slate-900">{roadTestData.mileageAfterTest.toLocaleString()} km ({getDistanceCovered()} km driven)</span>
                </div>
              </div>
            </div>

            {failIssues.filter(i => i.trim()).length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-rose-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  ISSUES FOUND
                </h3>
                <div className="space-y-2">
                  {failIssues.filter(i => i.trim()).map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 text-rose-700">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <h3 className="font-semibold text-slate-700 mb-2">Remarks:</h3>
              <p className="text-sm text-slate-600">{roadTestData.remarks}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800">ACTION REQUIRED</span>
              </div>
              <p className="text-sm text-amber-700 mb-3">Return to Repair Phase</p>
              <button
                onClick={handleBackToRepair}
                className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
              >
                <Wrench className="w-5 h-5" />
                BACK TO REPAIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};