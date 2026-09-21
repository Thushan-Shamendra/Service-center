import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sparePartsApi } from '../../api/sparePartsApi';
import { inventoryApi } from '../../api/inventoryApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Package,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
} from 'lucide-react';

export const SparePartsRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<any>(null);
  const [jobCardParts, setJobCardParts] = useState<any[]>([]);
  const [newRequest, setNewRequest] = useState({
    jobCard: '',
    reason: '',
    priority: 'medium',
    parts: [] as any[],
  });

  const [showAddOtherPart, setShowAddOtherPart] = useState(false);
  const [selectedOtherItemId, setSelectedOtherItemId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, inventoryRes, jobsRes] = await Promise.all([
        sparePartsApi.getSparePartsRequests(),
        inventoryApi.getInventoryItems({ limit: 1000 }),
        jobCardApi.getJobCards(),
      ]);

      if (requestsRes.success) setRequests(requestsRes.data);
      if (inventoryRes.success) setInventoryItems(inventoryRes.data);
      if (jobsRes.success) {
        const activeJobs = (jobsRes.data || []).filter((jc: any) => jc.status !== 'delivered' && jc.status !== 'cancelled');
        setAssignedJobs(activeJobs);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobCardChange = async (jobCardId: string) => {
    setNewRequest({ ...newRequest, jobCard: jobCardId, parts: [] });
    setJobCardParts([]);
    setShowAddOtherPart(false);
    setSelectedOtherItemId('');
    
    if (!jobCardId) {
      setSelectedJobCard(null);
      return;
    }

    try {
      const jobRes = await jobCardApi.getJobCardById(jobCardId);
      if (jobRes.success) {
        setSelectedJobCard(jobRes.data);
        
        // Get parts from job card
        const parts = jobRes.data.parts || [];
        
        // Initialize parts with requested quantities from inspection
        const initializedParts = await Promise.all(parts.map(async (part: any) => {
          let currentStock = 0;
          let unit = 'Piece';
          let itemName = part.name || '';
          
          if (part.item && typeof part.item === 'object') {
            currentStock = part.item.quantity ?? 0;
            unit = part.item.unit || unit;
            itemName = part.item.itemName || itemName;
          }
          
          const itemId = part.item?._id || (typeof part.item === 'string' ? part.item : null);
          
          if (!itemId) {
            return null;
          }

          // If stock wasn't on part.item, look it up in inventoryItems
          if (currentStock === 0) {
            const inv = inventoryItems.find((i: any) => i._id === itemId);
            if (inv) {
              currentStock = inv.quantity;
              unit = inv.unit || unit;
              if (!itemName) itemName = inv.itemName;
            }
          }
          
          return {
            itemId,
            itemName: itemName || 'Inspection Part',
            requestedQuantity: part.quantity || 1,
            availableStock: currentStock,
            unit: unit,
            source: 'inspection',
          };
        }));
        
        const validParts = initializedParts.filter((part: any) => part !== null);
        setJobCardParts(validParts);
        setNewRequest(prev => ({ ...prev, parts: validParts }));
      }
    } catch (error) {
      toast.error('Failed to fetch job card details');
    }
  };

  const handlePartQuantityChange = (index: number, newQuantity: number) => {
    const updatedParts = [...jobCardParts];
    updatedParts[index].requestedQuantity = newQuantity;
    setJobCardParts(updatedParts);
    setNewRequest(prev => ({ ...prev, parts: updatedParts }));
  };

  const handleAddOtherPartToModal = (itemId: string) => {
    if (!itemId) return;
    const invItem = inventoryItems.find((i: any) => i._id === itemId);
    if (!invItem) return;

    const existingIdx = jobCardParts.findIndex((p: any) => p.itemId === itemId);
    if (existingIdx >= 0) {
      toast('Part is already in your request list. Quantity incremented.', { icon: 'ℹ️' });
      handlePartQuantityChange(existingIdx, jobCardParts[existingIdx].requestedQuantity + 1);
      setShowAddOtherPart(false);
      setSelectedOtherItemId('');
      return;
    }

    const newPart = {
      itemId: invItem._id,
      itemName: invItem.itemName,
      requestedQuantity: 1,
      availableStock: invItem.quantity || 0,
      unit: invItem.unit || 'Piece',
      source: 'additional',
    };

    const updated = [...jobCardParts, newPart];
    setJobCardParts(updated);
    setNewRequest(prev => ({ ...prev, parts: updated }));
    setSelectedOtherItemId('');
    setShowAddOtherPart(false);
    toast.success(`Added ${invItem.itemName}`);
  };

  const handleRemovePartFromModal = (index: number) => {
    const updated = jobCardParts.filter((_, i) => i !== index);
    setJobCardParts(updated);
    setNewRequest(prev => ({ ...prev, parts: updated }));
    toast.success('Part removed');
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.jobCard) {
      toast.error('Please select a job card');
      return;
    }

    if (newRequest.parts.length === 0) {
      toast.error('No parts available for this job card');
      return;
    }

    if (!newRequest.reason) {
      toast.error('Please provide a reason for the request');
      return;
    }

    // Check if any parts have requested quantity > 0
    const partsToRequest = newRequest.parts.filter((part: any) => part.requestedQuantity > 0);
    if (partsToRequest.length === 0) {
      toast.error('Please specify quantity for at least one part');
      return;
    }

    // Ensure all parts have a valid inventory item reference (Admin Dashboard managed items)
    const partsWithoutInventory = partsToRequest.filter((part: any) => !part.itemId);
    if (partsWithoutInventory.length > 0) {
      toast.error(`Some parts are not registered in the Admin Inventory: ${partsWithoutInventory.map((p: any) => p.itemName).join(', ')}. Only inventory items can be requested.`);
      return;
    }

    // Check stock availability
    for (const part of partsToRequest) {
      if (part.requestedQuantity > part.availableStock) {
        toast.error(`Requested quantity for ${part.itemName} exceeds available stock (${part.availableStock})`);
        return;
      }
    }

    try {
      // Create individual requests for each part
      const requests = partsToRequest.map((part: any) =>
        sparePartsApi.createSparePartsRequest({
          jobCard: newRequest.jobCard,
          item: part.itemId,
          itemName: part.itemName,
          requestedQuantity: part.requestedQuantity,
          currentStock: part.availableStock,
          reason: newRequest.reason,
          priority: newRequest.priority,
        })
      );

      await Promise.all(requests);

      toast.success('Parts requests submitted successfully');
      setShowRequestModal(false);
      setNewRequest({
        jobCard: '',
        reason: '',
        priority: 'medium',
        parts: [],
      });
      setSelectedJobCard(null);
      setJobCardParts([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to submit requests');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'issued': 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      'pending': Clock,
      'approved': CheckCircle,
      'rejected': XCircle,
      'issued': Package,
    };
    return icons[status] || Clock;
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
            <h1 className="text-2xl font-bold text-gray-900">Spare Parts Requests</h1>
            <p className="text-sm text-gray-600">Request spare parts required to complete your assigned jobs</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/employee/request-parts-form')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Parts
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Issued</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'issued').length}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">My Parts Requests</h2>
        </div>
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No parts requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Card</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => {
                  const StatusIcon = getStatusIcon(request.status);
                  return (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.requestId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.jobCard?.jobCardNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.requestedQuantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{request.priority}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Request Spare Parts</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Job Card Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Card *</label>
                <select
                  value={newRequest.jobCard}
                  onChange={(e) => handleJobCardChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Job Card</option>
                  {assignedJobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.jobCardNumber} - {job.vehicle?.make} {job.vehicle?.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parts List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Requested Parts</label>
                  {newRequest.jobCard && (
                    <button
                      type="button"
                      onClick={() => setShowAddOtherPart(!showAddOtherPart)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showAddOtherPart ? 'Hide Part Selector' : '+ Add Other Part'}
                    </button>
                  )}
                </div>

                {/* Other Part Selector */}
                {showAddOtherPart && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <label className="block text-xs font-semibold text-blue-900">
                      Select Inventory Item to Add:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedOtherItemId}
                        onChange={(e) => setSelectedOtherItemId(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Choose item in stock --</option>
                        {inventoryItems
                          .filter((i: any) => (i.quantity || 0) > 0)
                          .map((item: any) => (
                            <option key={item._id} value={item._id}>
                              {item.itemName} ({item.itemCode}) — In Stock: {item.quantity} {item.unit}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddOtherPartToModal(selectedOtherItemId)}
                        disabled={!selectedOtherItemId}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {jobCardParts.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {jobCardParts.map((part, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900 truncate">{part.itemName}</p>
                              {part.source === 'inspection' ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">Inspection</span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">Additional</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">Available Stock: {part.availableStock} {part.unit}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePartFromModal(index)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                            title="Remove part"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Quantity to Request:</label>
                          <input
                            type="number"
                            min="1"
                            max={part.availableStock}
                            value={part.requestedQuantity}
                            onChange={(e) => handlePartQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          />
                          <span className="text-xs text-gray-600">{part.unit}</span>
                        </div>
                        {part.requestedQuantity > part.availableStock && (
                          <div className="flex items-start space-x-2 mt-2 text-red-600">
                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                            <span className="text-xs">Exceeds available stock</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : newRequest.jobCard ? (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">No parts specified yet</p>
                    <button
                      type="button"
                      onClick={() => setShowAddOtherPart(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold hover:bg-blue-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Part from Inventory
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Request *</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Explain why this part is needed..."
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="flex space-x-4">
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <label key={priority} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={newRequest.priority === priority}
                        onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                        className="text-blue-600"
                      />
                      <span className="capitalize text-sm">{priority}</span>
                    </label>
                  ))}
                </div>
                {newRequest.priority === 'urgent' && (
                  <div className="flex items-start space-x-2 mt-2 text-yellow-600">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <span className="text-xs">Urgent requests are still subject to Manager approval.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedJobCard(null);
                  setJobCardParts([]);
                  setNewRequest({
                    jobCard: '',
                    reason: '',
                    priority: 'medium',
                    parts: [],
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={jobCardParts.length === 0 || !newRequest.jobCard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};