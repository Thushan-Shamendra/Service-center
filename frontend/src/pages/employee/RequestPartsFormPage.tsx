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
} from 'lucide-react';

interface InventoryItem {
  _id: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  unit: string;
}

interface JobCard {
  _id: string;
  jobCardNumber: string;
  vehicle: {
    make: string;
    model: string;
  };
}

export const RequestPartsFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams<{ jobCardId?: string }>();
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string>(jobCardId || '');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockedItems, setStockedItems] = useState<InventoryItem[]>([]);
  const [requiredQuantity, setRequiredQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [jobCardId]);

  const fetchData = async () => {
    try {
      const [inventoryRes, jobsRes] = await Promise.all([
        // Fetch ALL inventory items (not just the first page of 15)
        inventoryApi.getInventoryItems({ limit: 1000 }),
        jobCardApi.getJobCards(),
      ]);

      if (inventoryRes.success) {
        setInventoryItems(inventoryRes.data);
        // Only show items that are in stock (quantity > 0)
        setStockedItems(inventoryRes.data.filter((item: InventoryItem) => item.quantity > 0));
      }

      if (jobsRes.success) {
        setJobCards(jobsRes.data);
      }

      if (jobCardId) {
        const jobRes = await jobCardApi.getJobCardById(jobCardId);
        if (jobRes.success) {
          setJobCard(jobRes.data);
          setSelectedJobCardId(jobCardId);
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
        setJobCard(jobRes.data);
      }
    } else {
      setJobCard(null);
    }
  };

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setRequiredQuantity(1);
  };

  const handleSubmit = async () => {
    if (!selectedJobCardId) {
      toast.error('Please select a job card');
      return;
    }

    if (!selectedItem) {
      toast.error('Please select a part from the inventory list');
      return;
    }

    // Verify the selected item is present in the current inventory snapshot
    const inventoryItem = inventoryItems.find(item => item._id === selectedItem._id);
    if (!inventoryItem) {
      toast.error('Selected item is no longer available in the inventory. Please select another item.');
      return;
    }

    if (requiredQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (requiredQuantity > selectedItem.quantity) {
      toast.error('Requested quantity exceeds available stock');
      return;
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
      // Map 'normal' to 'medium' since the backend model only accepts: low, medium, high, urgent
      const mappedPriority = priority === 'normal' ? 'medium' : priority;
      
      await sparePartsApi.createSparePartsRequest({
        jobCard: selectedJobCardId,
        item: selectedItem._id,
        itemName: selectedItem.itemName,
        requestedQuantity: requiredQuantity,
        currentStock: selectedItem.quantity,
        reason,
        priority: mappedPriority,
      });

      toast.success('Parts request submitted successfully');
      navigate(`/employee/parts-request-pending/${selectedJobCardId}`);
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRequestId = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REQ-${dateStr}-${randomNum}`;
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
                <h1 className="text-xl font-bold text-gray-900">📦 Spare Parts Request</h1>
                <p className="text-sm text-gray-600">
                  {jobCard ? `JOB #${jobCard.jobCardNumber} - ${jobCard.vehicle?.make} ${jobCard.vehicle?.model}` : 'Select Job Card'}
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
                <span className="font-medium">Approval Required Before Use</span> - Parts cannot be used until approved by manager.
              </p>
            </div>
          </div>
        </div>

        {/* Job Card Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Select Job Card</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Card *</label>
            <select
              value={selectedJobCardId}
              onChange={(e) => handleJobCardChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Auto-filled Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Request Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Request ID</label>
              <p className="text-sm font-medium text-gray-900">{generateRequestId()} <span className="text-xs text-gray-400">[Auto Generated]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Job Card</label>
              <p className="text-sm font-medium text-gray-900">{jobCard?.jobCardNumber || 'N/A'} <span className="text-xs text-gray-400">[Auto Filled]</span></p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Request Date</label>
              <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} <span className="text-xs text-gray-400">[Auto Filled]</span></p>
            </div>
          </div>
        </div>

        {/* Part Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            🔍 Select Part to Request
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Item <span className="text-xs text-blue-600 font-semibold">(Inventory Only)</span>
            </label>
            <select
              value={selectedItem?._id || ''}
              onChange={(e) => {
                const item = inventoryItems.find(i => i._id === e.target.value);
                if (item) handleSelectItem(item);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- Select an item from inventory --</option>
              {stockedItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.itemName} ({item.itemCode}) - In Stock: {item.quantity}
                </option>
              ))}
            </select>
            {stockedItems.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                No items with available stock found in the inventory. Please contact the Admin to restock.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Only items already registered in the Admin Inventory can be requested. Select an item from the dropdown list.
            </p>
          </div>
        </div>

        {/* Quantity and Stock */}
        {selectedItem && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Available Stock</label>
                <p className="text-2xl font-bold text-gray-900">{selectedItem.quantity} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Stock available: {selectedItem.quantity} units
              </div>
              {requiredQuantity <= selectedItem.quantity ? (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sufficient stock available
                </div>
              ) : (
                <div className="flex items-center text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Insufficient stock
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Request</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Explain why this part is needed..."
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            Character Count: {reason.length}/500
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">Priority</label>
          <div className="flex space-x-4">
            <button
              onClick={() => setPriority('normal')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                priority === 'normal'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${priority === 'normal' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="font-medium">🔵 NORMAL</span>
              </div>
            </button>
            <button
              onClick={() => setPriority('urgent')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                priority === 'urgent'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${priority === 'urgent' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <span className="font-medium">🔴 URGENT</span>
              </div>
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">📋 Current Request Status</p>
              <p className="text-lg font-semibold text-gray-900">Pending</p>
            </div>
            <div className="flex items-center text-yellow-600">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm">⏳ Awaiting Manager Approval</span>
            </div>
          </div>
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
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedItem}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Submitting...' : '📤 Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
