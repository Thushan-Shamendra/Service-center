import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sparePartsApi } from '../../api/sparePartsApi';
import { inventoryApi } from '../../api/inventoryApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Trash2,
  Car,
  Sparkles,
  X,
  Layers,
} from 'lucide-react';

interface InventoryItem {
  _id: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  unit: string;
  category?: string;
  brand?: string;
  sellingPrice?: number;
}

interface RequestedPartItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  requestedQuantity: number;
  availableStock: number;
  unit: string;
  source: 'inspection' | 'additional';
}

interface JobCard {
  _id: string;
  jobCardNumber: string;
  status: string;
  serviceBay?: string;
  inspectionNotes?: string;
  problemsFound?: string[];
  vehicle?: {
    make: string;
    model: string;
    plateNumber?: string;
    registrationNumber?: string;
    year?: number;
  };
  parts?: Array<{
    item?: any;
    name?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
}

export const RequestPartsFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId?: string }>();

  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>(jobCardId || '');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockedItems, setStockedItems] = useState<InventoryItem[]>([]);

  // Requested parts list
  const [requestedParts, setRequestedParts] = useState<RequestedPartItem[]>([]);

  // Add Other Part Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form Fields
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [jobCardId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [inventoryRes, jobsRes] = await Promise.all([
        inventoryApi.getInventoryItems({ limit: 1000 }),
        jobCardApi.getJobCards(),
      ]);

      let allInv: InventoryItem[] = [];
      if (inventoryRes.success && Array.isArray(inventoryRes.data)) {
        allInv = inventoryRes.data;
        setInventoryItems(allInv);
        setStockedItems(allInv.filter((item: InventoryItem) => item.quantity > 0));
      }

      if (jobsRes.success && Array.isArray(jobsRes.data)) {
        const activeJobs = jobsRes.data.filter((jc: JobCard) => jc.status !== 'delivered' && jc.status !== 'cancelled');
        setJobCards(activeJobs);
      }

      const activeJobId = jobCardId || selectedJobCardId;
      if (activeJobId) {
        await loadJobCardAndInspectionParts(activeJobId, allInv);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobCardAndInspectionParts = async (targetJobId: string, currentInventory?: InventoryItem[]) => {
    try {
      const jobRes = await jobCardApi.getJobCardById(targetJobId);
      if (jobRes.success && jobRes.data) {
        const jc: JobCard = jobRes.data;
        setJobCard(jc);
        setSelectedJobCardId(targetJobId);

        const invList = currentInventory || inventoryItems;
        populatePartsFromInspection(jc, invList);

        // Pre-fill reason if empty
        if (!reason) {
          const inspectionDetails = jc.inspectionNotes || (jc.problemsFound && jc.problemsFound.length > 0 ? jc.problemsFound.join(', ') : '');
          if (inspectionDetails) {
            setReason(`Parts required for repair based on inspection: ${inspectionDetails}`);
          } else {
            setReason('Required for vehicle repair & servicing as identified during vehicle inspection.');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch job card details:', error);
      toast.error('Failed to load job card details');
    }
  };

  const populatePartsFromInspection = (jc: JobCard, invList: InventoryItem[]) => {
    const rawParts = jc.parts || [];
    const inspectionParts: RequestedPartItem[] = [];

    for (const p of rawParts) {
      const rawItem = p.item;
      let itemId = '';
      let itemName = p.name || '';
      let itemCode = '';
      let availableStock = 0;
      let unit = 'Piece';

      if (rawItem && typeof rawItem === 'object') {
        itemId = rawItem._id || '';
        itemName = rawItem.itemName || itemName;
        itemCode = rawItem.itemCode || '';
        availableStock = rawItem.quantity ?? 0;
        unit = rawItem.unit || unit;
      } else if (typeof rawItem === 'string') {
        itemId = rawItem;
      }

      // Match in inventory list to obtain freshest stock
      const match = invList.find((i) => i._id === itemId || (itemName && i.itemName.toLowerCase() === itemName.toLowerCase()));
      if (match) {
        itemId = match._id;
        itemName = match.itemName;
        itemCode = match.itemCode;
        availableStock = match.quantity;
        unit = match.unit || unit;
      }

      if (itemId) {
        const existingIdx = inspectionParts.findIndex((item) => item.itemId === itemId);
        if (existingIdx >= 0) {
          inspectionParts[existingIdx].requestedQuantity += Number(p.quantity || 1);
        } else {
          inspectionParts.push({
            itemId,
            itemName,
            itemCode,
            requestedQuantity: Number(p.quantity || 1),
            availableStock,
            unit,
            source: 'inspection',
          });
        }
      }
    }

    setRequestedParts(inspectionParts);
    if (inspectionParts.length > 0) {
      toast.success(`Loaded ${inspectionParts.length} part(s) from vehicle inspection`, { id: 'auto-load-inspection' });
    }
  };

  const handleJobCardChange = async (newJobId: string) => {
    setSelectedJobCardId(newJobId);
    if (newJobId) {
      await loadJobCardAndInspectionParts(newJobId);
    } else {
      setJobCard(null);
      setRequestedParts([]);
    }
  };

  const handleQuantityChange = (itemId: string, newQty: number) => {
    setRequestedParts((prev) =>
      prev.map((part) => {
        if (part.itemId === itemId) {
          const validQty = Math.max(1, newQty);
          return { ...part, requestedQuantity: validQty };
        }
        return part;
      })
    );
  };

  const handleRemovePart = (itemId: string) => {
    setRequestedParts((prev) => prev.filter((p) => p.itemId !== itemId));
    toast.success('Part removed from request');
  };

  const handleAddOtherPart = (item: InventoryItem) => {
    const existingIndex = requestedParts.findIndex((p) => p.itemId === item._id);
    if (existingIndex >= 0) {
      toast('Part is already in your request list. Quantity incremented.', { icon: 'ℹ️' });
      handleQuantityChange(item._id, requestedParts[existingIndex].requestedQuantity + 1);
    } else {
      setRequestedParts((prev) => [
        ...prev,
        {
          itemId: item._id,
          itemName: item.itemName,
          itemCode: item.itemCode,
          requestedQuantity: 1,
          availableStock: item.quantity,
          unit: item.unit || 'Piece',
          source: 'additional',
        },
      ]);
      toast.success(`Added ${item.itemName}`);
    }
  };

  const handleAutoFillFromInspection = () => {
    if (!jobCard) {
      toast.error('No job card selected');
      return;
    }
    populatePartsFromInspection(jobCard, inventoryItems);
  };

  const handleSubmit = async () => {
    if (!selectedJobCardId) {
      toast.error('Please select a job card');
      return;
    }

    if (requestedParts.length === 0) {
      toast.error('Please include at least one part in the request');
      return;
    }

    // Validate quantities and stock
    for (const part of requestedParts) {
      if (!part.requestedQuantity || part.requestedQuantity <= 0) {
        toast.error(`Quantity for "${part.itemName}" must be greater than 0`);
        return;
      }
      if (part.requestedQuantity > part.availableStock) {
        toast.error(
          `Requested quantity for "${part.itemName}" (${part.requestedQuantity}) exceeds available stock (${part.availableStock} ${part.unit})`
        );
        return;
      }
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the request');
      return;
    }

    if (reason.length > 500) {
      toast.error('Reason must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);
    try {
      const mappedPriority = priority === 'normal' ? 'medium' : priority;

      const itemsPayload = requestedParts.map((p) => ({
        item: p.itemId,
        itemId: p.itemId,
        itemName: p.itemName,
        requestedQuantity: p.requestedQuantity,
        availableStock: p.availableStock,
        reason: reason.trim(),
        priority: mappedPriority,
      }));

      // Send batch request
      const response = await sparePartsApi.createSparePartsRequest({
        jobCard: selectedJobCardId,
        items: itemsPayload,
        reason: reason.trim(),
        priority: mappedPriority,
      });

      if (response.success) {
        toast.success(`${requestedParts.length} spare part(s) requested successfully! Awaiting manager approval.`);
        navigate(`/employee/repair-progress/${selectedJobCardId}`);
      } else {
        toast.error(response.message || 'Failed to submit request');
      }
    } catch (error: any) {
      console.error('Error submitting parts request:', error);
      // Fallback: If batch endpoint failed, submit individually
      try {
        const mappedPriority = priority === 'normal' ? 'medium' : priority;
        await Promise.all(
          requestedParts.map((part) =>
            sparePartsApi.createSparePartsRequest({
              jobCard: selectedJobCardId,
              item: part.itemId,
              itemName: part.itemName,
              requestedQuantity: part.requestedQuantity,
              currentStock: part.availableStock,
              reason: reason.trim(),
              priority: mappedPriority,
            })
          )
        );
        toast.success(`${requestedParts.length} spare part(s) requested successfully!`);
        navigate(`/employee/repair-progress/${selectedJobCardId}`);
      } catch (fallbackError: any) {
        toast.error(fallbackError.response?.data?.message || 'Failed to submit request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categories for modal filter
  const categories = ['All', 'Spare Part', 'Lubricant', 'Filter', 'Tire', 'Battery', 'Accessory'];

  // Filtered inventory items for Add Other Part modal
  const filteredModalItems = stockedItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      !modalSearchTerm.trim() ||
      item.itemName.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(modalSearchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => (selectedJobCardId ? navigate(`/employee/repair-progress/${selectedJobCardId}`) : navigate(-1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                title="Back to Repair Progress"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-orange-600" />
                  Spare Parts Request
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {jobCard
                    ? `Job #${jobCard.jobCardNumber} • ${jobCard.vehicle?.make || ''} ${jobCard.vehicle?.model || ''} (${
                        jobCard.vehicle?.plateNumber || jobCard.vehicle?.registrationNumber || 'N/A'
                      })`
                    : 'Select a Job Card to request spare parts'}
                </p>
              </div>
            </div>

            {jobCard && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">
                  Bay: {jobCard.serviceBay || 'Bay 1'}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200 capitalize">
                  {jobCard.status.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Warning Banner */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Manager Approval Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Requested parts will be forwarded to the service manager for review and issue from inventory.
              </p>
            </div>
          </div>
        </div>

        {/* Job Card Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              Target Job Card *
            </label>
            {jobCard && (
              <span className="text-xs text-gray-500">
                Vehicle: <strong className="text-gray-700">{jobCard.vehicle?.make} {jobCard.vehicle?.model}</strong>
              </span>
            )}
          </div>
          <select
            value={selectedJobCardId}
            onChange={(e) => handleJobCardChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white font-medium text-gray-800"
          >
            <option value="">-- Select Job Card --</option>
            {jobCards.map((job) => (
              <option key={job._id} value={job._id}>
                #{job.jobCardNumber} — {job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.plateNumber || job.vehicle?.registrationNumber || 'No Plate'}) — Status: {job.status}
              </option>
            ))}
          </select>
        </div>

        {/* Parts Selection & Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Requested Parts & Materials
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Inspection parts are loaded automatically. You can also add other required inventory parts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {jobCard && jobCard.parts && jobCard.parts.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFillFromInspection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                  title="Reload parts identified during inspection"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Auto-fill from Inspection
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                + Add Other Part
              </button>
            </div>
          </div>

          {/* Parts Table */}
          {requestedParts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Part / Item</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-center">In Stock</th>
                    <th className="py-3 px-4 text-center">Req. Qty</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requestedParts.map((part) => {
                    const isExceeded = part.requestedQuantity > part.availableStock;
                    return (
                      <tr key={part.itemId} className={`hover:bg-gray-50/70 transition-colors ${isExceeded ? 'bg-red-50/40' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{part.itemName}</div>
                          <div className="text-xs text-gray-500 font-mono">{part.itemCode || 'ITM-N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          {part.source === 'inspection' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Sparkles className="w-3 h-3" />
                              From Inspection
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              Other Added
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                              part.availableStock <= 0
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : part.availableStock < 5
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {part.availableStock} {part.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(part.itemId, part.requestedQuantity - 1)}
                              disabled={part.requestedQuantity <= 1}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={part.availableStock}
                              value={part.requestedQuantity}
                              onChange={(e) => handleQuantityChange(part.itemId, parseInt(e.target.value) || 1)}
                              className={`w-14 text-center text-sm font-bold border-none focus:ring-0 py-1 ${
                                isExceeded ? 'text-red-600 bg-red-50' : 'text-gray-900'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(part.itemId, part.requestedQuantity + 1)}
                              disabled={part.requestedQuantity >= part.availableStock}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          {isExceeded && (
                            <p className="text-[11px] text-red-600 font-medium mt-1">Exceeds available stock!</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 font-medium">{part.unit}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePart(part.itemId)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove part"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No parts currently in the request list</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Inspection parts will auto-populate when available, or you can add items directly from inventory.
              </p>
              <div className="inline-flex gap-3">
                {jobCard?.parts && jobCard.parts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoFillFromInspection}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Load from Inspection
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Other Part
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reason for Request */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            Reason for Request *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none text-gray-800"
            placeholder="Describe why these parts are required for the job..."
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Provide details to help the manager approve the request quickly.</span>
            <span>{reason.length}/500</span>
          </div>
        </div>

        {/* Priority Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <label className="block text-sm font-semibold text-gray-800 mb-3">Request Priority</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPriority('normal')}
              className={`p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                priority === 'normal'
                  ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-1 ring-blue-400'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${priority === 'normal' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className="text-left">
                <p className="text-sm font-bold">🔵 Normal Priority</p>
                <p className="text-xs text-gray-500">Standard turnaround time for scheduled maintenance</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPriority('urgent')}
              className={`p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                priority === 'urgent'
                  ? 'border-red-500 bg-red-50/50 text-red-900 ring-1 ring-red-400'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${priority === 'urgent' ? 'bg-red-600' : 'bg-gray-300'}`} />
              <div className="text-left">
                <p className="text-sm font-bold">🔴 Urgent Priority</p>
                <p className="text-xs text-gray-500">Critical parts needed immediately to prevent downtime</p>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => (selectedJobCardId ? navigate(`/employee/repair-progress/${selectedJobCardId}`) : navigate(-1))}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || requestedParts.length === 0}
            className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Submit Parts Request ({requestedParts.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Other Part Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Select Additional Part from Inventory
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pick any available inventory item to add to your spare parts request.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 border-b border-gray-200 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  placeholder="Search by part name, item code, or brand..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Items List */}
            <div className="p-4 overflow-y-auto divide-y divide-gray-100 flex-1">
              {filteredModalItems.length > 0 ? (
                filteredModalItems.map((item) => {
                  const alreadyAdded = requestedParts.some((p) => p.itemId === item._id);
                  return (
                    <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 truncate">{item.itemName}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                            {item.itemCode}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <span>Category: {item.category || 'Spare Part'}</span>
                          {item.brand && <span>• Brand: {item.brand}</span>}
                          <span>• Stock: <strong className="text-emerald-700">{item.quantity} {item.unit}</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddOtherPart(item)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          alreadyAdded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        }`}
                      >
                        {alreadyAdded ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Added (+1)
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add Part
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">No items found matching your criteria</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try searching with a different keyword or category</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                {filteredModalItems.length} available inventory items in stock
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-1.5 bg-gray-800 text-white hover:bg-gray-900 rounded-lg text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
