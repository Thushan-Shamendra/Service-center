import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobCardApi } from '../../api/jobCardApi';
import { inventoryApi } from '../../api/inventoryApi';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Camera,
  Video,
  Upload,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Wrench,
  FileText,
  DollarSign,
  Search,
  Package,
} from 'lucide-react';

export const InitialInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inspectionStatus, setInspectionStatus] = useState<'draft' | 'in_progress' | 'completed'>('draft');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);

  const [inspectionData, setInspectionData] = useState({
    inspectionId: '',
    odometerReading: '',
    vehicleCondition: 'fair',
    problemsFound: '',
    inspectionNotes: '',
    recommendedRepairs: '',
    estimatedAdditionalWork: '',
    costBreakdown: [
      { item: '', itemId: '', cost: '', quantity: 1 },
      { item: '', itemId: '', cost: '', quantity: 1 },
      { item: '', itemId: '', cost: '', quantity: 1 },
      { item: '', itemId: '', cost: '', quantity: 1 },
      { item: '', itemId: '', cost: '', quantity: 1 },
    ],
    uploadedFiles: [] as Array<{ id: string; name: string; type: 'image' | 'video'; size: string; url: string }>,
  });

  useEffect(() => {
    if (jobCardId) {
      fetchJobDetails();
    }
    generateInspectionId();
    fetchInventoryItems();
  }, [jobCardId]);

  const fetchJobDetails = async () => {
    if (!jobCardId) return;
    setIsLoading(true);
    try {
      const res = await jobCardApi.getJobCardById(jobCardId);
      if (res.success) {
        setJob(res.data);
        setInspectionData(prev => ({
          ...prev,
          odometerReading: res.data.vehicle?.currentMileage?.toString() || '',
        }));
      } else {
        toast.error('Failed to load job card details');
      }
    } catch (err) {
      toast.error('Error loading job card details');
    } finally {
      setIsLoading(false);
    }
  };

  const generateInspectionId = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '-');
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    setInspectionData(prev => ({
      ...prev,
      inspectionId: `INS-${dateStr}-${timeStr}`,
    }));
  };

  const fetchInventoryItems = async () => {
    try {
      const res = await inventoryApi.getInventoryItems({ limit: 100 });
      if (res.success) {
        setInventoryItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
    }
  };

  const filteredInventoryItems = inventoryItems.filter(item =>
    item.itemName?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.itemCode?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.category?.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const handleAddInventoryItem = (inventoryItem: any) => {
    if (!inventoryItem.itemName || inventoryItem.itemName.trim() === '') {
      toast.error('Item name is required');
      return;
    }
    const newItem = {
      item: inventoryItem.itemName,
      itemId: inventoryItem._id, // CRITICAL: Store the InventoryItem reference ID
      cost: inventoryItem.sellingPrice?.toString() || inventoryItem.purchasePrice?.toString() || '0',
      quantity: 1,
    };
    setInspectionData(prev => ({
      ...prev,
      costBreakdown: [...prev.costBreakdown, newItem],
    }));
    setShowInventoryDropdown(false);
    setInventorySearch('');
    toast.success(`Added ${inventoryItem.itemName} to breakdown`);
  };

  const handleCostBreakdownChange = (index: number, field: 'item' | 'itemId' | 'cost' | 'quantity', value: string | number) => {
    setInspectionData(prev => ({
      ...prev,
      costBreakdown: prev.costBreakdown.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Calculate total estimated cost from cost breakdown items
  const totalEstimatedCost = inspectionData.costBreakdown.reduce((sum, item) => {
    const cost = parseFloat(item.cost) || 0;
    const qty = item.quantity || 1;
    return sum + (cost * qty);
  }, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    }));
    setInspectionData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...newFiles],
    }));
  };

  const handleRemoveFile = (id: string) => {
    setInspectionData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter(f => f.id !== id),
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSaveInspection = async () => {
    setInspectionStatus('in_progress');
    setLastSaved(new Date().toLocaleTimeString());
    setIsSaving(true);
    try {
      // Update job card with inspection data
      if (jobCardId) {
        // Map costBreakdown to parts format with quantities and InventoryItem references
        const parts = inspectionData.costBreakdown
          .filter(item => item.item.trim() !== '')
          .map(item => ({
            item: item.itemId || null, // CRITICAL: Include InventoryItem reference
            name: item.item,
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.cost) || 0,
            total: (parseFloat(item.cost) || 0) * (item.quantity || 1),
          }));

        console.log('Saving parts to job card:', parts);

        await jobCardApi.updateJobCard(jobCardId, {
          inspectionNotes: inspectionData.inspectionNotes,
          odometer: parseInt(inspectionData.odometerReading) || 0,
          vehicleCondition: inspectionData.vehicleCondition,
          problemsFound: inspectionData.problemsFound.split('\n').filter(p => p.trim()),
          recommendedRepairs: inspectionData.recommendedRepairs.split('\n').filter(r => r.trim()),
          parts: parts,
          estimatedCost: totalEstimatedCost,
        });
      }
      toast.success('Inspection saved successfully');
    } catch (error) {
      toast.error('Failed to save inspection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteInspection = async () => {
    if (!inspectionData.inspectionNotes.trim()) {
      toast.error('Please add inspection notes');
      return;
    }

    setInspectionStatus('completed');
    setIsSaving(true);
    try {
      if (jobCardId) {
        // Map costBreakdown to parts format with quantities and InventoryItem references
        const parts = inspectionData.costBreakdown
          .filter(item => item.item.trim() !== '')
          .map(item => ({
            item: item.itemId || null, // CRITICAL: Include InventoryItem reference
            name: item.item,
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.cost) || 0,
            total: (parseFloat(item.cost) || 0) * (item.quantity || 1),
          }));

        console.log('Completing inspection with parts:', parts);

        const updateData = {
          inspectionNotes: inspectionData.inspectionNotes,
          odometer: parseInt(inspectionData.odometerReading) || 0,
          vehicleCondition: inspectionData.vehicleCondition,
          problemsFound: inspectionData.problemsFound.split('\n').filter(p => p.trim()),
          recommendedRepairs: inspectionData.recommendedRepairs.split('\n').filter(r => r.trim()),
          status: 'inspection_complete',
          parts: parts,
          estimatedCost: totalEstimatedCost,
        };
        
        // Use the updateJobCard endpoint (now has employee authorization)
        const response = await jobCardApi.updateJobCard(jobCardId, updateData);
        
        if (response.success) {
          toast.success('Inspection completed successfully');
          navigate(`/employee/assigned-jobs/${jobCardId}`);
        } else {
          toast.error(response.message || 'Failed to complete inspection');
        }
      }
    } catch (error: any) {
      console.error('Inspection completion error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to complete inspection');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-48" />
        <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse h-96" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-card">
        <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700">Job Card Not Found</h3>
        <p className="text-sm text-slate-400 mb-4">The requested job card could not be loaded.</p>
        <button
          onClick={() => navigate('/employee/assigned-jobs')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>
      </div>
    );
  }

  const now = new Date();
  const inspectionDate = dayjs(now).format('DD-MMM-YYYY');
  const inspectionTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/employee/assigned-jobs/${jobCardId}`)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold">Back to Job</span>
        </button>
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-brand-600" />
          <span className="text-lg font-bold text-slate-900">Initial Inspection</span>
        </div>
      </div>

      {/* Job Info */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-card p-4">
        <div className="text-sm font-bold text-slate-900">
          JOB #{job.jobCardNumber || 'N/A'} - {job.vehicle?.make} {job.vehicle?.model}
        </div>
      </div>

      {/* Inspection Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">INSPECTION HEADER</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Inspection ID:</span>
            <span className="text-sm text-slate-700 font-medium">{inspectionData.inspectionId}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Job Card Number:</span>
            <span className="text-sm text-slate-700 font-medium">{job.jobCardNumber || 'N/A'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Inspection Date:</span>
            <span className="text-sm text-slate-700 font-medium">{inspectionDate}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Inspection Start:</span>
            <span className="text-sm text-slate-700 font-medium">{inspectionTime}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Odometer Reading:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inspectionData.odometerReading}
                onChange={(e) => setInspectionData(prev => ({ ...prev, odometerReading: e.target.value }))}
                className="w-32 px-3 py-1 border border-slate-300 rounded-lg text-sm"
                placeholder="34,892"
              />
              <span className="text-sm text-slate-600">km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Condition */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">VEHICLE CONDITION</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase w-36 shrink-0">Overall Condition:</span>
            <select
              value={inspectionData.vehicleCondition}
              onChange={(e) => setInspectionData(prev => ({ ...prev, vehicleCondition: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div className="flex items-center gap-4 ml-38">
            <span className={`text-xs font-bold uppercase ${inspectionData.vehicleCondition === 'good' ? 'text-emerald-600' : inspectionData.vehicleCondition === 'fair' ? 'text-amber-600' : 'text-red-600'}`}>
              ○ Good
            </span>
            <span className={`text-xs font-bold uppercase ${inspectionData.vehicleCondition === 'fair' ? 'text-amber-600' : 'text-slate-400'}`}>
              ● Fair
            </span>
            <span className={`text-xs font-bold uppercase ${inspectionData.vehicleCondition === 'poor' ? 'text-red-600' : 'text-slate-400'}`}>
              ○ Poor
            </span>
          </div>
        </div>
      </div>

      {/* Problems Found */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">PROBLEMS FOUND</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Problems Found:</span>
            <textarea
              value={inspectionData.problemsFound}
              onChange={(e) => setInspectionData(prev => ({ ...prev, problemsFound: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Enter problems found (one per line)..."
            />
          </div>
        </div>
      </div>

      {/* Inspection Notes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">INSPECTION NOTES</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Inspection Notes:</span>
            <textarea
              value={inspectionData.inspectionNotes}
              onChange={(e) => setInspectionData(prev => ({ ...prev, inspectionNotes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Enter detailed inspection notes..."
            />
          </div>
        </div>
      </div>

      {/* Recommended Repairs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">RECOMMENDED REPAIRS</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Recommended Repairs:</span>
            <textarea
              value={inspectionData.recommendedRepairs}
              onChange={(e) => setInspectionData(prev => ({ ...prev, recommendedRepairs: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Enter recommended repairs (one per line)..."
            />
          </div>
        </div>
      </div>

      {/* Estimated Additional Work */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">ESTIMATED ADDITIONAL WORK</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Estimated Additional Work:</span>
            <input
              type="text"
              value={inspectionData.estimatedAdditionalWork}
              onChange={(e) => setInspectionData(prev => ({ ...prev, estimatedAdditionalWork: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="₹8,500 - ₹10,200"
            />
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Breakdown:</span>
              <div className="relative">
                <button
                  onClick={() => setShowInventoryDropdown(!showInventoryDropdown)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-lg hover:bg-brand-600 transition-colors"
                >
                  <Package className="w-3 h-3" />
                  Add from Inventory
                </button>
                {showInventoryDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-10">
                    <div className="p-3 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="Search inventory items..."
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredInventoryItems.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No items found
                        </div>
                      ) : (
                        filteredInventoryItems.map((item) => (
                          <button
                            key={item._id}
                            onClick={() => handleAddInventoryItem(item)}
                            className="w-full px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0 transition-colors"
                          >
                            <div className="text-sm font-medium text-slate-900">{item.itemName}</div>
                            <div className="text-sm font-bold text-brand-600 mt-1">
                              LKR {item.sellingPrice || item.purchasePrice || 0}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              {item.itemCode && <div className="text-xs text-slate-500">Code: {item.itemCode}</div>}
                              <div className="text-xs text-slate-500">Stock: {item.quantity || 0}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {inspectionData.costBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 w-2">{index + 1}.</span>
                <input
                  type="text"
                  value={item.item}
                  onChange={(e) => handleCostBreakdownChange(index, 'item', e.target.value)}
                  className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                  placeholder="Item name"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleCostBreakdownChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-slate-200 rounded text-xs"
                  placeholder="Qty"
                />
                <span className="text-xs text-slate-500">:</span>
                <span className="text-xs text-slate-500">LKR</span>
                <input
                  type="text"
                  value={item.cost}
                  onChange={(e) => handleCostBreakdownChange(index, 'cost', e.target.value)}
                  className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                  placeholder="0"
                />
                <span className="text-xs font-bold text-slate-700 w-24 text-right">
                  = LKR {((parseFloat(item.cost) || 0) * (item.quantity || 1)).toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    setInspectionData(prev => ({
                      ...prev,
                      costBreakdown: prev.costBreakdown.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setInspectionData(prev => ({
                ...prev,
                costBreakdown: [...prev.costBreakdown, { item: '', itemId: '', cost: '', quantity: 1 }]
              }))}
              className="mt-2 flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
            >
              <Plus className="w-3 h-3" />
              Add Custom Item
            </button>

            {/* Total Estimated Cost */}
            <div className="mt-4 pt-3 border-t-2 border-slate-200">
              <div className="flex items-center justify-between bg-brand-50 rounded-lg px-4 py-3 border border-brand-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-brand-600" />
                  <span className="text-sm font-bold text-slate-700 uppercase">Total Estimated Cost:</span>
                </div>
                <span className="text-xl font-extrabold text-brand-600">
                  LKR {totalEstimatedCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Before Condition - Images & Videos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">BEFORE CONDITION - IMAGES & VIDEOS</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex gap-3 mb-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors cursor-pointer text-sm font-bold">
              <Camera className="w-4 h-4" />
              Upload Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors cursor-pointer text-sm font-bold">
              <Video className="w-4 h-4" />
              Upload Videos
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="text-xs text-slate-500 mb-4">
            Supported Formats: Images: JPG, PNG, WEBP (Max 10MB each) | Videos: MP4, AVI, MOV (Max 50MB each)
          </div>

          {inspectionData.uploadedFiles.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Uploaded Files:</span>
              <div className="grid grid-cols-4 gap-3">
                {inspectionData.uploadedFiles.map((file) => (
                  <div key={file.id} className="relative bg-white rounded-lg border border-slate-200 p-2">
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="flex flex-col items-center">
                      {file.type === 'image' ? (
                        <Camera className="w-8 h-8 text-slate-400 mb-1" />
                      ) : (
                        <Video className="w-8 h-8 text-slate-400 mb-1" />
                      )}
                      <span className="text-xs text-slate-600 truncate w-full text-center">{file.name}</span>
                      <span className="text-xs text-slate-400">{file.size}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-3 flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
                <Plus className="w-4 h-4" />
                Add More Media
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Flow - Uses real job card status from API */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">INSPECTION STATUS INDICATOR</h3>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-6 mb-3">
            <span className={`text-xs font-bold uppercase ${job.status === 'pending' ? 'text-amber-600' : job.status !== 'inspection_complete' ? 'text-brand-600' : 'text-slate-400'}`}>
              ○ Draft
            </span>
            <span className={`text-xs font-bold uppercase ${job.status === 'inspection_complete' || job.status === 'inspection_started' || job.status === 'repair_started' || job.status === 'repair_in_progress' || job.status === 'testing' || job.status === 'work_complete' || job.status === 'ready_for_delivery' || job.status === 'delivered' ? 'text-emerald-600' : 'text-slate-400'}`}>
              ○ Completed
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              Current Job Status: 
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                job.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                job.status === 'inspection_started' ? 'bg-purple-100 text-purple-700' :
                job.status === 'inspection_complete' ? 'bg-emerald-100 text-emerald-700' :
                job.status === 'repair_started' ? 'bg-blue-100 text-blue-700' :
                job.status === 'repair_in_progress' ? 'bg-red-100 text-red-700' :
                job.status === 'testing' ? 'bg-cyan-100 text-cyan-700' :
                job.status === 'work_complete' ? 'bg-emerald-100 text-emerald-700' :
                job.status === 'ready_for_delivery' ? 'bg-green-100 text-green-700' :
                job.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {job.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </span>
            {job.updatedAt && (
              <span>Last Updated: {new Date(job.updatedAt).toLocaleString()}</span>
            )}
            {lastSaved && <span>Last Saved: {lastSaved}</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <button
          onClick={handleSaveInspection}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 transition-all"
        >
          <Save className="w-4 h-4" />
          Save Inspection
        </button>
        <button
          onClick={handleCompleteInspection}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-all shadow-md"
        >
          <CheckCircle className="w-4 h-4" />
          Complete Inspection
        </button>
      </div>
    </div>
  );
};