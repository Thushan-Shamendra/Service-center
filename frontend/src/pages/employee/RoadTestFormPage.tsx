import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roadTestApi } from '../../api/roadTestApi';
import { jobCardApi } from '../../api/jobCardApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Car,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  Video,
  Plus,
  Trash2,
  Save,
  User,
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  text: string;
  checked: boolean;
}

interface FailedItem {
  item: string;
  issue: string;
  action: string;
}

export const RoadTestFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, text: 'Engine Performance - Smooth acceleration', checked: false },
    { id: 2, text: 'Brake Function - Effective stopping', checked: false },
    { id: 3, text: 'Steering Response - Accurate & smooth', checked: false },
    { id: 4, text: 'Suspension - No unusual sounds or bouncing', checked: false },
    { id: 5, text: 'Gear Shift - Smooth transitions', checked: false },
    { id: 6, text: 'AC / HVAC - Proper cooling & heating', checked: false },
    { id: 7, text: 'Warning Lights - No dashboard warnings', checked: false },
    { id: 8, text: 'Vibrations - No abnormal vibrations', checked: false },
    { id: 9, text: 'Noises - No unusual sounds during drive', checked: false },
  ]);

  const [failedItems, setFailedItems] = useState<FailedItem[]>([
    { item: '', issue: '', action: '' }
  ]);

  const [roadTestData, setRoadTestData] = useState({
    result: '' as 'pass' | 'fail',
    remarks: '',
    mileageAfterTest: 0,
    evidence: [] as Array<{ type: 'image' | 'video'; url: string; description: string; file?: File }>,
  });

  useEffect(() => {
    if (jobCardId) {
      fetchJobDetails();
    }
  }, [jobCardId]);

  const fetchJobDetails = async () => {
    try {
      const res = await jobCardApi.getJobCardById(jobCardId);
      if (res.success) {
        setJob(res.data);
        setRoadTestData(prev => ({
          ...prev,
          mileageAfterTest: res.data.odometer || 0,
        }));
      } else {
        toast.error(res.message || 'Failed to fetch job details');
      }
    } catch (error) {
      toast.error('Failed to fetch job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChecklistChange = (id: number, checked: boolean) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked } : item
    ));
  };

  const handleResultSelect = (result: 'pass' | 'fail') => {
    setRoadTestData(prev => ({ ...prev, result }));
    if (result === 'pass') {
      // Mark all checklist items as passed
      setChecklist(prev => prev.map(item => ({ ...item, checked: true })));
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    setRoadTestData(prev => ({
      ...prev,
      evidence: [
        ...prev.evidence,
        ...files.map(file => ({
          type,
          url: URL.createObjectURL(file),
          description: file.name,
          file: file,
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

  const handleFailedItemChange = (index: number, field: keyof FailedItem, value: string) => {
    setFailedItems(prev => {
      const newItems = [...prev];
      newItems[index][field] = value;
      return newItems;
    });
  };

  const addFailedItem = () => {
    setFailedItems(prev => [...prev, { item: '', issue: '', action: '' }]);
  };

  const removeFailedItem = (index: number) => {
    setFailedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!roadTestData.result) {
      toast.error('Please select road test result');
      return;
    }

    if (roadTestData.mileageAfterTest <= (job?.odometer || 0)) {
      toast.error('Mileage after test must be greater than mileage before test');
      return;
    }

    if (!roadTestData.remarks.trim()) {
      toast.error('Please provide remarks');
      return;
    }

    if (roadTestData.remarks.length > 500) {
      toast.error('Remarks must be 500 characters or less');
      return;
    }

    if (roadTestData.result === 'fail') {
      const hasFailedItems = failedItems.some(item => item.item.trim());
      if (!hasFailedItems) {
        toast.error('Please specify at least one failed item');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Upload evidence files first if any
      let uploadedEvidence = [];
      if (roadTestData.evidence.length > 0) {
        const formData = new FormData();
        roadTestData.evidence.forEach((item) => {
          if (item.file) {
            formData.append('files', item.file);
          }
        });

        if (formData.has('files')) {
          const uploadRes = await roadTestApi.uploadEvidence(formData);
          if (uploadRes.data.success && uploadRes.data.data) {
            uploadedEvidence = uploadRes.data.data.map((upload: any) => ({
              type: upload.resource_type === 'video' ? 'video' : 'image',
              url: upload.secure_url,
              description: upload.original_filename || upload.public_id,
            }));
          }
        }
      }

      const payload = {
        jobCard: jobCardId,
        result: roadTestData.result,
        remarks: roadTestData.remarks,
        mileageBeforeTest: job?.odometer || 0,
        mileageAfterTest: roadTestData.mileageAfterTest,
        checklist: checklist.map(item => ({ item: item.text, passed: item.checked })),
        failedItems: roadTestData.result === 'fail' ? failedItems.filter(item => item.item.trim()) : [],
        evidence: uploadedEvidence,
      };

      const res = await roadTestApi.createRoadTest(payload);
      if (res.data.success) {
        toast.success('Road test submitted successfully');
        if (roadTestData.result === 'pass') {
          navigate(`/employee/road-test-pass/${jobCardId}`);
        } else {
          navigate(`/employee/road-test-fail/${jobCardId}`);
        }
      }
    } catch (error: any) {
      console.error('Road test submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit road test';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDistanceCovered = () => {
    return roadTestData.mileageAfterTest - (job?.odometer || 0);
  };

  const generateRoadTestId = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RT-${dateStr}-${randomNum}`;
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
                <h1 className="text-xl font-bold text-gray-900">🚗 Road Test</h1>
                <p className="text-sm text-gray-600">
                  JOB #{job?.jobCardNumber} - {job?.vehicle?.make} {job?.vehicle?.model}
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
                <span className="font-medium">🚗 ROAD TEST - PRE-DELIVERY CHECK</span>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                ⚠️ Must be completed before Work Complete
              </p>
            </div>
          </div>
        </div>

        {/* Auto-filled Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Request Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Road Test ID</label>
              <p className="text-sm font-medium text-gray-900">{generateRoadTestId()} <span className="text-xs text-gray-400">[Auto Generated]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Job Card</label>
              <p className="text-sm font-medium text-gray-900">{job?.jobCardNumber || 'N/A'} <span className="text-xs text-gray-400">[Auto Filled]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Road Test Date</label>
              <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} <span className="text-xs text-gray-400">[Auto Filled]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Road Test Time</label>
              <p className="text-sm font-medium text-gray-900">{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} <span className="text-xs text-gray-400">[Auto Filled]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Test Performed By</label>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <User className="w-3 h-3 text-gray-400" />
                {user?.firstName} {user?.lastName} <span className="text-xs text-gray-400">[Auto Filled]</span>
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">📋 VEHICLE INFORMATION</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vehicle</label>
              <p className="text-sm font-medium text-gray-900">{job?.vehicle?.make} {job?.vehicle?.model} ({job?.vehicle?.year})</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reg No.</label>
              <p className="text-sm font-medium text-gray-900">{job?.vehicle?.registrationNumber}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Odometer</label>
              <p className="text-sm font-medium text-gray-900">{job?.odometer?.toLocaleString()} km (Before Repair)</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mileage After Test</label>
              <input
                type="number"
                value={roadTestData.mileageAfterTest}
                onChange={(e) => setRoadTestData(prev => ({ ...prev, mileageAfterTest: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Distance Traveled</label>
              <p className="text-sm font-medium text-gray-900">{getDistanceCovered()} km</p>
            </div>
          </div>
        </div>

        {/* Test Checklist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">🔍 TEST CHECKLIST</h3>
          <p className="text-xs text-gray-400 mb-4">(To be evaluated during road test)</p>
          <div className="space-y-2">
            {checklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{item.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Road Test Result */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">📝 ROAD TEST RESULT</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => handleResultSelect('pass')}
              className={`flex-1 py-4 px-6 rounded-lg border-2 transition-colors ${
                roadTestData.result === 'pass'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center">
                <CheckCircle className={`w-6 h-6 mb-2 ${roadTestData.result === 'pass' ? 'text-green-500' : 'text-gray-300'}`} />
                <span className="font-medium">✅ PASS</span>
              </div>
            </button>
            <button
              onClick={() => handleResultSelect('fail')}
              className={`flex-1 py-4 px-6 rounded-lg border-2 transition-colors ${
                roadTestData.result === 'fail'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center">
                <XCircle className={`w-6 h-6 mb-2 ${roadTestData.result === 'fail' ? 'text-red-500' : 'text-gray-300'}`} />
                <span className="font-medium">❌ FAIL</span>
              </div>
            </button>
          </div>
        </div>

        {/* Failed Items (shown only when FAIL is selected) */}
        {roadTestData.result === 'fail' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">❌ Failed Items</h3>
            <div className="space-y-4">
              {failedItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Item</label>
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => handleFailedItemChange(index, 'item', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., Brake Function"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Issue</label>
                      <input
                        type="text"
                        value={item.issue}
                        onChange={(e) => handleFailedItemChange(index, 'issue', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., Brake pedal goes too deep"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Action</label>
                      <input
                        type="text"
                        value={item.action}
                        onChange={(e) => handleFailedItemChange(index, 'action', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., Brake bleeding required"
                      />
                    </div>
                  </div>
                  {failedItems.length > 1 && (
                    <button
                      onClick={() => removeFailedItem(index)}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addFailedItem}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Failed Item
              </button>
            </div>
          </div>
        )}

        {/* Remarks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <textarea
            value={roadTestData.remarks}
            onChange={(e) => setRoadTestData(prev => ({ ...prev, remarks: e.target.value }))}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter road test observations..."
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            Character Count: {roadTestData.remarks.length}/500
          </div>
        </div>

        {/* Upload Evidence */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">📸 UPLOAD EVIDENCE</h3>
          <div className="flex space-x-4 mb-4">
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <Camera className="w-4 h-4" />
                Upload Images
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleMediaUpload(e, 'image')}
                className="hidden"
              />
            </label>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                <Video className="w-4 h-4" />
                Upload Videos
              </span>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={(e) => handleMediaUpload(e, 'video')}
                className="hidden"
              />
            </label>
          </div>
          
          {roadTestData.evidence.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Uploaded Files:</p>
              <div className="grid grid-cols-4 gap-3">
                {roadTestData.evidence.map((media, index) => (
                  <div key={index} className="relative bg-gray-50 rounded-lg border border-gray-200 p-2">
                    <button
                      onClick={() => handleRemoveEvidence(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ↩️ Cancel
          </button>
          <button
            onClick={() => {/* Save draft functionality */}}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            💾 Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Submitting...' : '✅ Submit Result'}
          </button>
        </div>
      </div>
    </div>
  );
};
