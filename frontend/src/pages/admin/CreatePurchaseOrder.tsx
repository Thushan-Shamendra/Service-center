import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '../../api/purchaseOrderApi';
import { supplierApi } from '../../api/supplierApi';
import { inventoryApi } from '../../api/inventoryApi';
import { formatLKR, formatDate } from '../../utils/formatters';
import { 
  X, Plus, Calendar, Lock, Package, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface POItem {
  item: string;
  itemName: string;
  description: string;
  availableStock: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface InventoryItem {
  _id: string;
  itemName: string;
  description: string;
  quantity: number;
  purchasePrice: number;
  unit: string;
  category: string;
}

export const CreatePurchaseOrder: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [ponumber, setPONumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [poDate, setPODate] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [items, setItems] = useState<POItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Item selection
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discount / 100), 0);
  const grandTotal = subtotal - totalDiscount;

  useEffect(() => {
    fetchData();
    // Set today's date as PO date
    const today = new Date().toISOString().split('T')[0];
    setPODate(today);
    
    // Set default expected delivery to 3 days from now
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    setExpectedDelivery(deliveryDate.toISOString().split('T')[0]);
    
    // Generate PO number preview
    setPONumber('PO-*****');
  }, []);

  const fetchData = async () => {
    try {
      const [suppliersRes, inventoryRes] = await Promise.all([
        supplierApi.getAllSuppliers(),
        inventoryApi.getInventory({ limit: 1000 })
      ]);
      
      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data);
      }
      
      if (inventoryRes.success) {
        setInventoryItems(inventoryRes.data);
      }
    } catch (error) {
      toast.error('Failed to load required data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, {
      item: '',
      itemName: '',
      description: '',
      availableStock: 0,
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0,
    }]);
    setSelectedItemIndex(items.length);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    if (selectedItemIndex === index) {
      setSelectedItemIndex(null);
    }
  };

  const handleItemSelect = (inventoryItem: InventoryItem, index: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      item: inventoryItem._id,
      itemName: inventoryItem.itemName,
      description: inventoryItem.description || '',
      availableStock: inventoryItem.quantity,
      unitPrice: inventoryItem.purchasePrice,
      total: inventoryItem.purchasePrice * newItems[index].quantity * (1 - newItems[index].discount / 100),
    };
    setItems(newItems);
    setShowItemDropdown(false);
    setItemSearch('');
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total when quantity, unit price, or discount changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice * (1 - newItems[index].discount / 100);
    }
    
    setItems(newItems);
  };

  const handleCancel = () => {
    navigate('/admin/suppliers');
  };

  const handleCreatePO = async () => {
    if (!supplier) {
      toast.error('Please select a supplier');
      return;
    }
    
    if (!expectedDelivery) {
      toast.error('Please select expected delivery date');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate all items have required fields
    const invalidItem = items.find(item => !item.item || !item.itemName);
    if (invalidItem) {
      toast.error('Please select items for all rows');
      return;
    }

    setIsSaving(true);
    try {
      // Format items for backend
      const formattedItems = items.map(item => ({
        item: item.item,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: 0,
        total: item.total,
      }));

      const res = await purchaseOrderApi.createPurchaseOrder({
        supplier,
        expectedDeliveryDate: expectedDelivery,
        items: formattedItems,
        notes,
        status: 'pending',
      });

      if (res.success) {
        toast.success('Purchase order created successfully');
        navigate('/admin/suppliers');
      } else {
        toast.error(res.message || 'Failed to create purchase order');
      }
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create purchase order';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInventoryItems = inventoryItems.filter(item =>
    item.itemName.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.description?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
        </div>
        <button
          onClick={() => navigate('/admin/suppliers')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Basic Information */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PO Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ponumber}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup._id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PO Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatDate(poDate)}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Expected Delivery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  min={poDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No items added yet. Click "Add Item" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="relative">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Select item..."
                              value={item.itemName || itemSearch}
                              onChange={(e) => {
                                setItemSearch(e.target.value);
                                setSelectedItemIndex(index);
                                setShowItemDropdown(true);
                              }}
                              onFocus={() => {
                                setSelectedItemIndex(index);
                                setShowItemDropdown(true);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          {showItemDropdown && selectedItemIndex === index && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredInventoryItems.length > 0 ? (
                                filteredInventoryItems.map((invItem) => (
                                  <div
                                    key={invItem._id}
                                    onClick={() => handleItemSelect(invItem, index)}
                                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">{invItem.itemName}</div>
                                    <div className="text-sm text-gray-500">{invItem.description}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      Stock: {invItem.quantity} | Price: {formatLKR(invItem.purchasePrice)}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-gray-500">No items found</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.description}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          placeholder="Auto-filled"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.availableStock}
                          readOnly
                          className="w-24 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                          />
                          <span className="text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-end space-y-2">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatLKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>{formatLKR(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                <span>Grand Total</span>
                <span>{formatLKR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
              Pending
            </span>
          </div>
        </div>

        {/* Notes Section */}
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes..."
          />
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePO}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
