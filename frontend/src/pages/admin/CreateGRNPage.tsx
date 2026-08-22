import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { grnApi } from '../../api/grnApi';
import { purchaseOrderApi } from '../../api/purchaseOrderApi';
import { formatDate } from '../../utils/formatters';
import { X, Lock, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface GRNItem {
  item: string;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export const CreateGRNPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [grnNumber, setGRNNumber] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [items, setItems] = useState<GRNItem[]>([]);
  
  // Data
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate status
  const isComplete = items.length > 0 && items.every(item => item.remainingQuantity === 0);
  const status = isComplete ? 'complete' : 'partial';

  useEffect(() => {
    fetchData();
    // Set today's date as received date
    const today = new Date().toISOString().split('T')[0];
    setReceivedDate(today);
    
    // Generate GRN number preview
    setGRNNumber('GRN-*****');
  }, []);

  const fetchData = async () => {
    try {
      const poRes = await purchaseOrderApi.getPurchaseOrders({ 
        limit: 100 
      });
      
      if (poRes.success) {
        setPurchaseOrders(poRes.data);
        console.log('Loaded purchase orders:', poRes.data);
      } else {
        toast.error('Failed to load purchase orders');
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePOSelect = async (poId: string) => {
    setPurchaseOrder(poId);
    const po = purchaseOrders.find(p => p._id === poId);
    setSelectedPO(po);
    
    if (po) {
      // Pre-populate items from the purchase order
      const grnItems = po.items.map((poItem: any) => ({
        item: poItem.item?._id || poItem.item,
        itemName: poItem.itemName,
        orderedQuantity: poItem.quantity,
        receivedQuantity: 0, // Default to 0
        remainingQuantity: poItem.quantity, // Initially remaining = ordered
      }));
      setItems(grnItems);
    }
  };

  const handleItemChange = (index: number, value: number) => {
    const newItems = [...items];
    const orderedQty = newItems[index].orderedQuantity;
    const receivedQty = Math.min(value, orderedQty); // Can't receive more than ordered
    const remainingQty = orderedQty - receivedQty;
    
    newItems[index] = { 
      ...newItems[index], 
      receivedQuantity: receivedQty,
      remainingQuantity: remainingQty
    };
    
    setItems(newItems);
  };

  const handleCancel = () => {
    navigate('/admin/suppliers');
  };

  const handleSaveGRN = async () => {
    if (!purchaseOrder) {
      toast.error('Please select a purchase order');
      return;
    }
    
    if (items.length === 0) {
      toast.error('No items to receive');
      return;
    }

    // Validate that at least one item has received quantity > 0
    const hasReceivedItems = items.some(item => item.receivedQuantity > 0);
    if (!hasReceivedItems) {
      toast.error('Please enter received quantity for at least one item');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare items for API - need to include pricing info from PO
      const apiItems = items.map((item, index) => {
        const poItem = selectedPO?.items[index];
        return {
          item: item.item,
          itemName: item.itemName,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          unitPrice: poItem?.unitPrice || 0,
          discount: poItem?.discount || 0,
          tax: poItem?.tax || 0,
          total: item.receivedQuantity * (poItem?.unitPrice || 0),
          condition: 'good',
        };
      });

      console.log('Sending GRN data:', {
        purchaseOrder,
        items: apiItems,
        notes: '',
        warehouseLocation: '',
      });

      const res = await grnApi.createGRN({
        purchaseOrder,
        items: apiItems,
        notes: '',
        warehouseLocation: '',
      });

      console.log('GRN response:', res);

      if (res.success) {
        toast.success('GRN saved successfully');
        navigate('/admin/suppliers');
      } else {
        toast.error(res.message || 'Failed to save GRN');
      }
    } catch (error: any) {
      console.error('Error saving GRN:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save GRN';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReceiving = async () => {
    await handleSaveGRN();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Goods Receiving Note</h1>
        </div>
        <button
          onClick={() => navigate('/admin/suppliers')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Basic Information */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* GRN Number */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              GRN Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={grnNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 text-sm"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* PO Number */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              PO Number <span className="text-red-500">*</span>
            </label>
            <select
              value={purchaseOrder}
              onChange={(e) => handlePOSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Select Purchase Order</option>
              {purchaseOrders.map((po) => (
                <option key={po._id} value={po._id}>
                  {po.poNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Supplier
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedPO?.supplierName || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 text-sm"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Auto Filled from PO</p>
          </div>

          {/* Received Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Received Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatDate(receivedDate)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600 text-sm"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Items</h2>

          {items.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed border-gray-300">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No items to receive. Select a purchase order to load items.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordered Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.itemName}
                          readOnly
                          className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-gray-600 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.orderedQuantity}
                          readOnly
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded bg-gray-50 text-gray-600 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQuantity}
                          value={item.receivedQuantity}
                          onChange={(e) => handleItemChange(index, parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.remainingQuantity}
                          readOnly
                          className={`w-20 px-3 py-1.5 border border-gray-300 rounded text-center text-sm ${
                            item.remainingQuantity === 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold">
              {status === 'complete' ? '🟢 COMPLETE' : '🔵 PARTIAL'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveGRN}
            disabled={isSaving}
            className="px-4 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 text-sm"
          >
            Save GRN
          </button>
          <button
            onClick={handleConfirmReceiving}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isSaving ? 'Confirming...' : 'Confirm Receiving'}
          </button>
        </div>
      </div>
    </div>
  );
};
