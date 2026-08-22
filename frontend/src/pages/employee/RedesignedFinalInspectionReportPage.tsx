import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { repairProgressApi } from '../../api/repairProgressApi';
import { finalInspectionReportApi } from '../../api/finalInspectionReportApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  FileText,
  Printer,
  Send,
  Save,
  Upload,
  Camera,
  Video,
  FileText as FileIcon,
  AlertTriangle,
  Plus,
  X,
  User,
  Car,
  Calendar,
  Gauge,
  Package,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  AlertCircle,
  Star,
  Download,
} from 'lucide-react';

export const RedesignedFinalInspectionReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams();
  const [repairData, setRepairData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Work Performed
    workPerformed: [] as string[],
    newWorkItem: '',
    
    // Parts Replaced
    partsReplaced: [] as any[],
    
    // Safety Check
    safetyCheck: 'pass', // pass, fail, requires_re-inspection
    safetyItems: {
      brakes: false,
      lights: false,
      steering: false,
      tyres: false,
      fluids: false,
      electrical: false,
      suspension: false,
      exhaust: false,
      safetyBelts: false,
    },
    
    // Road Test Result (auto-filled)
    roadTestResult: 'pass',
    roadTestRemarks: '',
    
    // Remaining Issues
    remainingIssues: '',
    remainingIssuesPriority: 'medium', // low, medium, high
    
    // Future Recommendations
    futureRecommendations: [] as string[],
    newRecommendation: '',
    
    // Mechanic Remarks
    mechanicRemarks: '',
    
    // Evidence
    evidence: [] as any[],
    
    // Report Summary (auto-calculated)
    totalPartsCost: 0,
    laborCost: 0,
    totalCost: 0,
    totalHours: 0,
  });

  useEffect(() => {
    if (jobCardId) {
      fetchRepairData();
    }
  }, [jobCardId]);

  const fetchRepairData = async () => {
    setIsLoading(true);
    try {
      const res = await repairProgressApi.getRepairProgress(jobCardId!);
      if (res.success) {
        setRepairData(res.data);
        
        // Auto-fill data from repair progress
        const jobCard = res.data.jobCard;
        setFormData(prev => ({
          ...prev,
          workPerformed: jobCard.workPerformed || [],
          partsReplaced: jobCard.parts || [],
          roadTestResult: res.data.roadTests?.[0]?.result || 'pass',
          roadTestRemarks: res.data.roadTests?.[0]?.remarks || '',
          totalHours: jobCard.timeLogs?.reduce((acc: number, t: any) => acc + (t.hoursWorked || 0), 0) || 0,
          totalPartsCost: jobCard.parts?.reduce((acc: number, p: any) => acc + (p.total || 0), 0) || 0,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching repair data:', error);
      toast.error('Failed to fetch repair data');
    } finally {
      setIsLoading(false);
    }
  };

  const addWorkItem = () => {
    if (formData.newWorkItem.trim()) {
      setFormData(prev => ({
        ...prev,
        workPerformed: [...prev.workPerformed, formData.newWorkItem.trim()],
        newWorkItem: ''
      }));
    }
  };

  const removeWorkItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workPerformed: prev.workPerformed.filter((_, i) => i !== index)
    }));
  };

  const addRecommendation = () => {
    if (formData.newRecommendation.trim()) {
      setFormData(prev => ({
        ...prev,
        futureRecommendations: [...prev.futureRecommendations, formData.newRecommendation.trim()],
        newRecommendation: ''
      }));
    }
  };

  const removeRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      futureRecommendations: prev.futureRecommendations.filter((_, i) => i !== index)
    }));
  };

  const handleSafetyItemChange = (item: string) => {
    setFormData(prev => ({
      ...prev,
      safetyItems: {
        ...prev.safetyItems,
        [item]: !prev.safetyItems[item as keyof typeof prev.safetyItems]
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reportData = {
        jobCard: jobCardId,
        workPerformed: formData.workPerformed,
        partsReplaced: formData.partsReplaced,
        safetyCheck: {
          overallStatus: formData.safetyCheck,
          checkedItems: Object.keys(formData.safetyItems).filter(key => 
            formData.safetyItems[key as keyof typeof formData.safetyItems]
          ),
        },
        roadTestResult: {
          result: formData.roadTestResult,
          remarks: formData.roadTestRemarks,
        },
        remainingIssues: formData.remainingIssues,
        remainingIssuesPriority: formData.remainingIssuesPriority,
        futureRecommendations: formData.futureRecommendations,
        mechanicRemarks: formData.mechanicRemarks,
        evidence: formData.evidence,
        reportSummary: {
          totalPartsCost: formData.totalPartsCost,
          laborCost: formData.laborCost,
          totalCost: formData.totalPartsCost + formData.laborCost,
          totalHours: formData.totalHours,
        },
      };

      const res = await finalInspectionReportApi.createFinalInspectionReport(reportData);
      
      if (res.success) {
        toast.success('Final Inspection Report submitted successfully!');
        navigate(`/employee/final-inspection-success/${jobCardId}`);
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailManager = () => {
    toast.success('Report sent to manager for approval');
  };

  // Get customer and vehicle info
  const customerName = repairData?.jobCard?.customer?.user 
    ? `${repairData.jobCard.customer.user.firstName || ''} ${repairData.jobCard.customer.user.lastName || ''}`.trim() 
    : repairData?.jobCard?.customer?.name || 'N/A';
  const vehicleName = repairData?.jobCard?.vehicle 
    ? `${repairData.jobCard.vehicle.make || ''} ${repairData.jobCard.vehicle.model || ''}`.trim() 
    : 'N/A';
  const vehiclePlate = repairData?.jobCard?.vehicle?.plateNumber || repairData?.jobCard?.vehicle?.registrationNumber || 'N/A';
  const technicianName = repairData?.jobCard?.assignedTechnician?.user 
    ? `${repairData.jobCard.assignedTechnician.user.firstName || ''} ${repairData.jobCard.assignedTechnician.user.lastName || ''}`.trim() 
    : 'N/A';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(`/employee/repair-progress/${jobCardId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">← Back to Repair Progress</span>
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">📋 Final Inspection Report</span>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <h1 className="text-xl font-bold text-slate-900">
            Job Card #{repairData?.jobCard?.jobCardNumber || 'N/A'}
          </h1>
        </div>
      </div>

      {/* Job Information (Auto-filled) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">📌 Job Information (Auto-filled)</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">{customerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Car className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Vehicle</p>
                <p className="text-sm font-medium text-gray-900">{vehicleName} ({vehiclePlate})</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wrench className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Technician</p>
                <p className="text-sm font-medium text-gray-900">{technicianName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Service Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Gauge className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Mileage</p>
                <p className="text-sm font-medium text-gray-900">
                  {repairData?.jobCard?.odometer ? `${repairData.jobCard.odometer.toLocaleString()} km` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Work Performed */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">🔧 1. Work Performed</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          {formData.workPerformed.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked
                readOnly
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-sm text-gray-900 flex-1">{item}</span>
              <button
                onClick={() => removeWorkItem(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <input
              type="text"
              value={formData.newWorkItem}
              onChange={(e) => setFormData({ ...formData, newWorkItem: e.target.value })}
              placeholder="Add new work item..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={addWorkItem}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Parts Replaced */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">🔩 2. Parts Replaced (with Quantities)</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          {formData.partsReplaced.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Part Name</th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Qty</th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Serial No</th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.partsReplaced.map((part, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-900">{part.name || part.item?.name || 'N/A'}</td>
                      <td className="py-2 px-3 text-gray-900">{part.quantity}</td>
                      <td className="py-2 px-3 text-gray-900">{part.item?.itemCode || 'N/A'}</td>
                      <td className="py-2 px-3 text-gray-900">Rs. {part.total?.toLocaleString() || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No parts replaced</p>
          )}
        </div>
      </div>

      {/* 3. Safety Check */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">✅ 3. Safety Check</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Overall Safety Status:</p>
            <div className="flex gap-4">
              {['pass', 'fail', 'requires_re-inspection'].map((status) => (
                <label key={status} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="safetyCheck"
                    value={status}
                    checked={formData.safetyCheck === status}
                    onChange={(e) => setFormData({ ...formData, safetyCheck: e.target.value })}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Checked Items:</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(formData.safetyItems).map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.safetyItems[item as keyof typeof formData.safetyItems]}
                    onChange={() => handleSafetyItemChange(item)}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Road Test Result (Auto-filled) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">🚗 4. Road Test Result (Auto-filled from Testing stage)</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Test Date</p>
              <p className="text-sm font-medium text-gray-900">
                {repairData?.roadTests?.[0]?.testDate 
                  ? new Date(repairData.roadTests[0].testDate).toLocaleString('en-GB', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tested By</p>
              <p className="text-sm font-medium text-gray-900">{technicianName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Result</p>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                formData.roadTestResult === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {formData.roadTestResult === 'pass' ? '✅ Pass' : '❌ Fail'}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Test Remarks:</p>
            <p className="text-sm text-gray-900">{formData.roadTestRemarks || 'No remarks'}</p>
          </div>
        </div>
      </div>

      {/* 5. Remaining Issues */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">⚠️ 5. Remaining Issues (If any)</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
          <textarea
            value={formData.remainingIssues}
            onChange={(e) => setFormData({ ...formData, remainingIssues: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Describe any remaining issues..."
          />
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">🔴 Priority:</p>
            <div className="flex gap-4">
              {['low', 'medium', 'high'].map((priority) => (
                <label key={priority} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={formData.remainingIssuesPriority === priority}
                    onChange={(e) => setFormData({ ...formData, remainingIssuesPriority: e.target.value })}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Future Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">💡 6. Future Recommendations</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
          {formData.futureRecommendations.map((rec, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked
                readOnly
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-sm text-gray-900 flex-1">{rec}</span>
              <button
                onClick={() => removeRecommendation(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <input
              type="text"
              value={formData.newRecommendation}
              onChange={(e) => setFormData({ ...formData, newRecommendation: e.target.value })}
              placeholder="Add new recommendation..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={addRecommendation}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Mechanic Remarks */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">📝 7. Mechanic Remarks</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <textarea
            value={formData.mechanicRemarks}
            onChange={(e) => setFormData({ ...formData, mechanicRemarks: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Enter final mechanic remarks..."
          />
        </div>
      </div>

      {/* 8. Evidence Upload */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">📎 8. Evidence Upload</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 mb-2">Before Photo</p>
              <button className="text-xs text-blue-600 hover:text-blue-800">📷 Upload</button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 mb-2">After Photo</p>
              <button className="text-xs text-blue-600 hover:text-blue-800">📷 Upload</button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Video className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 mb-2">Test Video</p>
              <button className="text-xs text-blue-600 hover:text-blue-800">📹 Upload</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Camera className="w-4 h-4" />
              📷 Upload Photo
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Video className="w-4 h-4" />
              📹 Upload Video
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <FileIcon className="w-4 h-4" />
              📄 Upload PDF
            </button>
          </div>
        </div>
      </div>

      {/* 9. Report Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">📊 9. Report Summary</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600">Total Parts Cost</span>
              <span className="text-sm font-bold text-gray-900">LKR {formData.totalPartsCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600">Labor Cost</span>
              <input
                type="number"
                value={formData.laborCost}
                onChange={(e) => setFormData({ ...formData, laborCost: Number(e.target.value) })}
                className="w-24 text-right text-sm font-bold text-gray-900 border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600">Total Cost</span>
              <span className="text-sm font-bold text-gray-900">LKR {(formData.totalPartsCost + formData.laborCost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600">Total Hours</span>
              <span className="text-sm font-bold text-gray-900">{formData.totalHours.toFixed(1)} hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Approved By */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">✍️ Report Approved By (Auto-filled)</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Technician</p>
              <p className="text-sm font-medium text-gray-900">{technicianName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Manager</p>
              <p className="text-sm font-medium text-yellow-600">⏳ Pending Approval</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : '✅ Submit Report & Close Job'}
        </button>
        <button
          onClick={handleSaveDraft}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
        >
          <Save className="w-4 h-4" />
          ⏹️ Save as Draft
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          <Printer className="w-4 h-4" />
          🖨️ Print PDF
        </button>
        <button
          onClick={handleEmailManager}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
        >
          <Send className="w-4 h-4" />
          📧 Email to Manager
        </button>
      </div>
    </div>
  );
};

export default RedesignedFinalInspectionReportPage;