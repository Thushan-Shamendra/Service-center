import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseReturnApi } from '../../api/purchaseReturnApi';
import { grnApi } from '../../api/grnApi';
import { formatLKR } from '../../utils/formatters';
import { X, Lock, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReturnItem {
  item: string;
  itemName: string;
  partNumber?: string;
  receivedQuantity: number;
  returnedQuantity: number;
  unitPrice: number;
  refundAmount: number;
}

export const CreatePurchaseReturnPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [returnNumber, setReturnNumber] = useState('');
  const [grn, setGRN] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [items, setItems] = useState<ReturnItem[]>([]);
  
  // Data
  const [grns, setGRNs] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedGRNData, setSelectedGRNData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    setReturnNumber('RET-*****');
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching suppliers and GRNs...');
      
      const grnsRes = await grnApi.getGRNs({ limit: 100 });
      
      console.log('GRNs response:', grnsRes);
      
      if (grnsRes.success) {
        setGRNs(grnsRes.data);
        console.log('Loaded GRNs:', grnsRes.data.length);
        if (grnsRes.data.length === 0) {
          setError('No GRNs found in the system. Please create a GRN first.');
        }
      } else {
        console.error('Failed to load GRNs:', grnsRes.message);
        setError('Failed to load GRNs: ' + (grnsRes.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGRNChange = async (grnId: string) => {
    setGRN(grnId);
    const grnData = grns.find(g => g._id === grnId);
    setSelectedGRNData(grnData);
    
    if (grnData) {
      // Load available items from GRN
      setAvailableItems(grnData.items || []);
      setItems([]);
    }
  };

  const handleAddItem = () => {
    if (availableItems.length === 0) {
      toast.error('No items available. Please select a GRN first.');
      return;
    }
    
    // Add first available item to return list
    const firstAvailable = availableItems[0];
    const newItem: ReturnItem = {
      item: firstAvailable.item?._id || firstAvailable.item,
      itemName: firstAvailable.itemName,
      partNumber: firstAvailable.partNumber,
      receivedQuantity: firstAvailable.receivedQuantity,
      returnedQuantity: 0,
      unitPrice: firstAvailable.unitPrice,
      refundAmount: 0,
    };
    
    setItems([...items, newItem]);
    // Remove from available items
    setAvailableItems(availableItems.slice(1));
  };

  const handleRemoveItem = (index: number) => {
    const removedItem = items[index];
    setItems(items.filter((_, i) => i !== index));
    // Add back to available items
    setAvailableItems([...availableItems, {
      item: removedItem.item,
      itemName: removedItem.itemName,
      partNumber: removedItem.partNumber,
      receivedQuantity: removedItem.receivedQuantity,
      unitPrice: removedItem.unitPrice,
    }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    if (field === 'returnedQuantity') {
      const returnedQty = Math.min(Math.max(0, value), newItems[index].receivedQuantity);
      newItems[index].returnedQuantity = returnedQty;
      newItems[index].refundAmount = returnedQty * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const calculateTotalRefund = () => {
    return items.reduce((sum, item) => sum + item.refundAmount, 0);
  };

  const handleReset = () => {
    setGRN('');
    setReturnReason('');
    setItems([]);
    setAvailableItems([]);
    setSelectedGRNData(null);
    fetchData();
  };

  const handleCancel = () => {
    navigate('/admin/purchase-returns');
  };

  const handleSaveReturn = async () => {
    if (!grn) {
      toast.error('Please select a GRN');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Please add at least one item to return');
      return;
    }

    const hasReturnedItems = items.some(item => item.returnedQuantity > 0);
    if (!hasReturnedItems) {
      toast.error('Please enter return quantity for at least one item');
      return;
    }

    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }

    setIsSaving(true);
    try {
      const apiItems = items.filter(item => item.returnedQuantity > 0).map(item => ({
        item: item.item,
        itemName: item.itemName,
        partNumber: item.partNumber,
        returnedQuantity: item.returnedQuantity,
        unitPrice: item.unitPrice,
        itemReason: returnReason,
        condition: 'damaged',
      }));

      const res = await purchaseReturnApi.createPurchaseReturn({
        grn,
        items: apiItems,
        returnReason,
        refundMethod: 'credit_note',
      });

      if (res.success) {
        toast.success('Purchase return created successfully');
        navigate('/admin/purchase-returns');
      } else {
        toast.error(res.message || 'Failed to create purchase return');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create purchase return';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">Purchase Return</h1>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Return Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Number</label>
            <div className="relative">
              <input
                type="text"
                value={returnNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* GRN Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GRN Number *</label>
            <div className="flex gap-2">
              <select
                value={grn}
                onChange={(e) => handleGRNChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select GRN</option>
                {grns.map((grnItem) => (
                  <option key={grnItem._id} value={grnItem._id}>
                    {grnItem.grnNumber}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchData}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            {grns.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No GRNs found in the system. Please create a GRN first.</p>
            )}
            {grns.length > 0 && (
              <p className="text-xs text-green-600 mt-1">{grns.length} GRN(s) available</p>
            )}
          </div>

          {/* Return Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason *</label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Reason</option>
              <option value="damaged">Damaged Items</option>
              <option value="wrong_item">Wrong Items</option>
              <option value="defective">Defective Items</option>
              <option value="expired">Expired Items</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Items Section */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Items</h3>
            
            {items.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No items added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                      <p className="text-xs text-gray-500">Received: {item.receivedQuantity}</p>
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-gray-500">Return Qty</label>
                      <input
                        type="number"
                        min="0"
                        max={item.receivedQuantity}
                        value={item.returnedQuantity}
                        onChange={(e) => handleItemChange(index, 'returnedQuantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-gray-500">Unit Price</label>
                      <input
                        type="text"
                        value={formatLKR(item.unitPrice)}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 text-sm text-gray-600"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {availableItems.length > 0 && (
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-3 w-full py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>

          {/* Refund Amount */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
            <div className="relative">
              <input
                type="text"
                value={formatLKR(calculateTotalRefund())}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 pr-10 font-semibold"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto Calculated</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSaveReturn}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Return'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};