import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
import { supplierApi } from '../../api/supplierApi';
import { InventoryItem } from '../../types';
import { formatLKR, parseNumberInput, formatInputValue } from '../../utils/formatters';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Package, AlertTriangle, Plus, RefreshCw, X, Search, TrendingUp, Box, DollarSign, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const CATEGORIES = ['All Items', 'Spare Part', 'Lubricant', 'Tire', 'Battery', 'Filter', 'Accessory'];

const CATEGORY_ICONS: Record<string, string> = {
  'Spare Part': '🔧',
  'Lubricant': '🛢',
  'Tire': '🛞',
  'Battery': '🔋',
  'Filter': '⚙',
  'Accessory': '🎒',
};

export const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Summary stats
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    stockValue: 0,
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMovementHistoryOpen, setIsMovementHistoryOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemHasHistory, setItemHasHistory] = useState(false);

  // Forms
  const [itemForm, setItemForm] = useState({
    itemName: '',
    category: '',
    brand: '',
    model: '',
    quantity: 10,
    unit: 'Piece',
    purchasePrice: 2500,
    sellingPrice: 3500,
    reorderLevel: 5,
    supplier: '',
    status: 'active',
    location: 'Shelf A-1',
    description: '',
  });

  const [editForm, setEditForm] = useState({
    itemName: '',
    category: '',
    brand: '',
    model: '',
    unit: 'Piece',
    purchasePrice: 0,
    sellingPrice: 0,
    reorderLevel: 0,
    supplier: '',
    status: 'active',
    location: '',
    description: '',
  });

  const [adjustForm, setAdjustForm] = useState<{
    type: 'increase' | 'decrease';
    quantity: number;
    reason: string;
    reasonDetails: string;
    itemId: string;
  }>({
    type: 'increase',
    quantity: 1,
    reason: '',
    reasonDetails: '',
    itemId: '',
  });

  // Movement History State
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementPage, setMovementPage] = useState(1);
  const [movementTotalPages, setMovementTotalPages] = useState(1);
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [movementItemFilter, setMovementItemFilter] = useState('');

  // Item Details Drawer State
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<InventoryItem | null>(null);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  const fetchInventorySummary = async () => {
    setIsSummaryLoading(true);
    try {
      const res = await inventoryApi.getInventorySummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (error) {
      console.error('Failed to load inventory summary:', error);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 15,
        search: searchQuery || undefined,
      };

      if (selectedCategory !== 'All Items') {
        params.category = selectedCategory;
      }

      if (selectedSupplier) {
        params.supplier = selectedSupplier;
      }

      if (selectedStatus === 'low') {
        params.lowStock = true;
      } else if (selectedStatus === 'out') {
        params.outOfStock = true;
      }

      const res = await inventoryApi.getInventory(params);
      if (res.success) {
        setItems(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await supplierApi.getAllSuppliers();
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const fetchMovementHistory = async () => {
    setMovementsLoading(true);
    try {
      const params: any = {
        page: movementPage,
        limit: 20,
      };

      if (movementSearch) params.search = movementSearch;
      if (movementTypeFilter) params.movementType = movementTypeFilter;
      if (movementItemFilter) params.itemId = movementItemFilter;

      const res = await inventoryApi.getMovementHistory(params);
      if (res.success) {
        setMovements(res.data);
        setMovementTotalPages(res.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to load movement history');
    } finally {
      setMovementsLoading(false);
    }
  };

  const openItemDetails = async (item: InventoryItem) => {
    setDetailsItem(item);
    setIsDetailsDrawerOpen(true);
    
    // Fetch recent movements for this item
    try {
      const params: any = {
        page: 1,
        limit: 5,
        itemId: item.id || (item as any)._id,
      };
      const res = await inventoryApi.getMovementHistory(params);
      if (res.success) {
        setRecentMovements(res.data);
      }
    } catch (error) {
      console.error('Failed to load recent movements:', error);
    }
  };

  useEffect(() => {
    fetchInventorySummary();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [page, selectedCategory, searchQuery, selectedSupplier, selectedStatus]);

  useEffect(() => {
    if (isMovementHistoryOpen) {
      fetchMovementHistory();
    }
  }, [isMovementHistoryOpen, movementPage, movementSearch, movementTypeFilter, movementItemFilter]);

  // Check for query parameter to auto-open add modal
  useEffect(() => {
    const actionParam = searchParams.get('action');
    if (actionParam === 'new') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemForm.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!itemForm.brand) {
      toast.error('Please select a brand');
      return;
    }
    
    try {
      // Remove empty supplier field to avoid MongoDB cast error
      const itemData = { ...itemForm };
      if (!itemData.supplier) {
        delete itemData.supplier;
      }
      if (!itemData.model) {
        delete itemData.model;
      }
      if (!itemData.location) {
        delete itemData.location;
      }
      if (!itemData.description) {
        delete itemData.description;
      }

      const res = await inventoryApi.createInventoryItem(itemData);
      if (res.success) {
        toast.success(res.message || 'Inventory item created');
        setIsAddModalOpen(false);
        setItemForm({
          itemName: '',
          category: '',
          brand: '',
          model: '',
          quantity: 10,
          unit: 'Piece',
          purchasePrice: 2500,
          sellingPrice: 3500,
          reorderLevel: 5,
          supplier: '',
          status: 'active',
          location: 'Shelf A-1',
          description: '',
        });
        fetchInventory();
        fetchInventorySummary();
      } else {
        toast.error(res.message || 'Failed to add inventory item');
      }
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast.error(error.response?.data?.message || error.message || 'Error adding inventory item');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustForm.itemId) {
      toast.error('Please select an inventory item');
      return;
    }
    
    if (!adjustForm.reason) {
      toast.error('Please select a reason for adjustment');
      return;
    }
    
    if (adjustForm.reason === 'Other' && !adjustForm.reasonDetails) {
      toast.error('Please provide reason details');
      return;
    }
    
    // Check for insufficient stock when decreasing
    const selectedItem = items.find(item => (item.id || (item as any)._id) === adjustForm.itemId);
    if (selectedItem && adjustForm.type === 'decrease') {
      if (adjustForm.quantity > selectedItem.quantity) {
        toast.error(`Insufficient stock. Available quantity: ${selectedItem.quantity}, Requested quantity: ${adjustForm.quantity}`);
        return;
      }
    }
    
    try {
      const remarks = adjustForm.reason === 'Other' 
        ? `${adjustForm.reason}: ${adjustForm.reasonDetails}`
        : adjustForm.reason;
        
      const apiForm = {
        type: (adjustForm.type === 'increase' ? 'in' : 'out') as 'in' | 'out',
        quantity: adjustForm.quantity,
        reason: remarks,
        remarks: remarks,
        reference: adjustForm.reason === 'Other'
          ? (adjustForm.reasonDetails ? `Other: ${adjustForm.reasonDetails}` : 'Other')
          : adjustForm.reason,
      };
      
      const res = await inventoryApi.adjustStock(adjustForm.itemId, apiForm);
      if (res.success) {
        toast.success(res.message);
        setIsAdjustModalOpen(false);
        setAdjustForm({
          type: 'increase',
          quantity: 1,
          reason: '',
          reasonDetails: '',
          itemId: '',
        });
        fetchInventory();
        fetchInventorySummary();
        fetchMovementHistory();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Stock adjustment failed');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await inventoryApi.deleteInventoryItem(id);
      if (res.success) {
        toast.success(res.message);
        fetchInventory();
        fetchInventorySummary();
        setIsDeleteModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const checkItemHistory = async (item: InventoryItem) => {
    try {
      // Check embedded movement history first
      const embeddedHistory = (item as any).movementHistory && (item as any).movementHistory.length > 0;
      
      // Also check StockMovement collection if available
      const params: any = {
        page: 1,
        limit: 1,
        itemId: item.id || (item as any)._id,
      };
      const res = await inventoryApi.getMovementHistory(params);
      const hasStockMovements = res.success && res.data.length > 0;
      
      const hasHistory = embeddedHistory || hasStockMovements;
      setItemHasHistory(hasHistory);
      setSelectedItem(item);
      setIsDeleteModalOpen(true);
    } catch (error) {
      console.error('Failed to check item history:', error);
      // Default to safe mode if check fails
      setItemHasHistory(true);
      setSelectedItem(item);
      setIsDeleteModalOpen(true);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditForm({
      itemName: item.itemName,
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      unit: item.unit,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      reorderLevel: item.reorderLevel,
      supplier: (item.supplier as any)?._id || '',
      status: item.status,
      location: item.location || '',
      description: item.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      // Remove empty supplier field to avoid MongoDB cast error
      const itemData = { ...editForm };
      if (!itemData.supplier) {
        delete itemData.supplier;
      }
      if (!itemData.model) {
        delete itemData.model;
      }
      if (!itemData.location) {
        delete itemData.location;
      }
      if (!itemData.description) {
        delete itemData.description;
      }

      const res = await inventoryApi.updateInventoryItem(selectedItem.id || (selectedItem as any)._id, itemData);
      if (res.success) {
        toast.success(res.message || 'Inventory item updated');
        setIsEditModalOpen(false);
        fetchInventory();
        fetchInventorySummary();
      } else {
        toast.error(res.message || 'Failed to update inventory item');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating inventory item');
    }
  };

  const handleSummaryCardClick = (type: string) => {
    if (type === 'low') {
      setSelectedStatus('low');
    } else if (type === 'out') {
      setSelectedStatus('out');
    } else {
      setSelectedStatus('');
      setSelectedCategory('All Items');
    }
    setPage(1);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: '🔴' };
    if (item.quantity > 0 && item.quantity <= item.reorderLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
    return { label: 'Active', color: 'bg-green-100 text-green-700', icon: '🟢' };
  };

  const columns: Column<InventoryItem>[] = [
    {
      header: 'Item Code',
      accessor: (item) => (
        <span className="font-mono text-xs font-bold text-slate-700">{item.itemCode}</span>
      ),
    },
    {
      header: 'Item Name',
      accessor: (item) => (
        <span className="font-semibold text-slate-900">
          {item.itemName}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: (item) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
          {CATEGORY_ICONS[item.category] || ''} {item.category}
        </span>
      ),
    },
    {
      header: 'Brand',
      accessor: (item) => <span className="text-sm text-slate-600">{item.brand || '-'}</span>,
    },
    {
      header: 'Model',
      accessor: (item) => <span className="text-sm text-slate-600">{item.model || '-'}</span>,
    },
    {
      header: 'Unit',
      accessor: (item) => <span className="text-xs text-slate-500">{item.unit}</span>,
    },
    {
      header: 'Qty',
      accessor: (item) => (
        <span className={`text-sm font-bold ${item.quantity <= item.reorderLevel ? 'text-red-600' : 'text-slate-800'}`}>
          {item.quantity}
        </span>
      ),
    },
    {
      header: 'Reorder',
      accessor: (item) => <span className="text-xs text-slate-500">{item.reorderLevel}</span>,
    },
    {
      header: 'Purchase Price',
      accessor: (item) => <span className="text-xs font-medium text-slate-600">{formatLKR(item.purchasePrice)}</span>,
    },
    {
      header: 'Selling Price',
      accessor: (item) => <span className="text-xs font-bold text-slate-900">{formatLKR(item.sellingPrice)}</span>,
    },
    {
      header: 'Supplier',
      accessor: (item) => (
        <span className="text-xs text-slate-600">
          {(item.supplier as any)?.name || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => {
        const status = getStockStatus(item);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>
            {status.icon} {status.label}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openItemDetails(item)}
            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            onClick={() => handleEditItem(item)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setAdjustForm({
                type: 'increase',
                quantity: 1,
                reason: '',
                reasonDetails: '',
                itemId: item.id || (item as any)._id,
              });
              setIsAdjustModalOpen(true);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Adjust
          </button>
          <button
            onClick={() => checkItemHistory(item)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory Management</h2>
          <p className="text-sm text-slate-500">
            Manage stock, pricing, suppliers and inventory movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAdjustForm({
                type: 'increase',
                quantity: 1,
                reason: '',
                reasonDetails: '',
                itemId: '',
              });
              setIsAdjustModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Stock Adjustment
          </button>
          <button
            onClick={() => setIsMovementHistoryOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shrink-0"
          >
            <Package className="w-4 h-4" />
            Movement History
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Inventory
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => handleSummaryCardClick('all')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Total Items</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isSummaryLoading ? '...' : summary.totalItems.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => handleSummaryCardClick('low')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Low Stock</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isSummaryLoading ? '...' : summary.lowStockItems}
          </div>
        </div>

        <div
          onClick={() => handleSummaryCardClick('out')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Out of Stock</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isSummaryLoading ? '...' : summary.outOfStockItems}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Stock Value</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {isSummaryLoading ? '...' : formatLKR(summary.stockValue)}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedCategory === category
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {CATEGORY_ICONS[category] && <span className="mr-1">{CATEGORY_ICONS[category]}</span>}
            {category}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search item / barcode..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <select
          value={selectedSupplier}
          onChange={(e) => {
            setSelectedSupplier(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="">All Suppliers</option>
          {suppliers.map((supplier) => (
            <option key={supplier._id} value={supplier._id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="">All Status</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          onPageChange: (p) => setPage(p),
        }}
        emptyTitle="Inventory Empty"
        emptyDescription="No items found in inventory database."
      />

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">Add Inventory Item</h3>
            <p className="text-sm text-slate-500 mb-4">Add a new stock item to VSMS.LK</p>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs font-medium">
              {/* Item Code - Auto Generated */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Item Code</label>
                <div className="flex">
                  <input
                    type="text"
                    value="ITM-00001"
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Auto Generated</p>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                  placeholder="Engine Oil 5W30"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Category and Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Category *</label>
                  <select
                    required
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Category</option>
                    <option value="Spare Part">🔧 Spare Part</option>
                    <option value="Lubricant">🛢 Lubricant</option>
                    <option value="Tire">🛞 Tire</option>
                    <option value="Battery">🔋 Battery</option>
                    <option value="Filter">⚙ Filter</option>
                    <option value="Accessory">🎒 Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Brand *</label>
                  <select
                    required
                    value={itemForm.brand}
                    onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Brand</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Honda">Honda</option>
                    <option value="Nissan">Nissan</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Mazda">Mazda</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Kia">Kia</option>
                    <option value="BMW">BMW</option>
                    <option value="Mercedes-Benz">Mercedes-Benz</option>
                    <option value="Audi">Audi</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Ford">Ford</option>
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Volvo">Volvo</option>
                    <option value="Land Rover">Land Rover</option>
                    <option value="Jaguar">Jaguar</option>
                    <option value="Peugeot">Peugeot</option>
                    <option value="Renault">Renault</option>
                    <option value="Fiat">Fiat</option>
                    <option value="Tata">Tata</option>
                    <option value="Mahindra">Mahindra</option>
                    <option value="Perodua">Perodua</option>
                    <option value="Daihatsu">Daihatsu</option>
                    <option value="Subaru">Subaru</option>
                    <option value="Isuzu">Isuzu</option>
                    <option value="Hino">Hino</option>
                    <option value="UD Trucks">UD Trucks</option>
                    <option value="Fuso">Fuso</option>
                    <option value="Scania">Scania</option>
                    <option value="Volvo Trucks">Volvo Trucks</option>
                    <option value="MAN">MAN</option>
                    <option value="Bosch">Bosch</option>
                    <option value="Denso">Denso</option>
                    <option value="NGK">NGK</option>
                    <option value="Mobil">Mobil</option>
                    <option value="Castrol">Castrol</option>
                    <option value="Shell">Shell</option>
                    <option value="Valvoline">Valvoline</option>
                    <option value="Gates">Gates</option>
                    <option value="SKF">SKF</option>
                    <option value="Brembo">Brembo</option>
                    <option value="ATE">ATE</option>
                    <option value="Valeo">Valeo</option>
                    <option value="Mann-Filter">Mann-Filter</option>
                    <option value="K&N">K&N</option>
                    <option value="3M">3M</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Model and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Model</label>
                  <input
                    type="text"
                    value={itemForm.model}
                    onChange={(e) => setItemForm({ ...itemForm, model: e.target.value })}
                    placeholder="Model number or variant"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Unit *</label>
                  <select
                    required
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Piece">Piece</option>
                    <option value="Set">Set</option>
                    <option value="Liter">Liter</option>
                    <option value="Milliliter">Milliliter</option>
                    <option value="Kilogram">Kilogram</option>
                    <option value="Gram">Gram</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Can">Can</option>
                    <option value="Tube">Tube</option>
                    <option value="Pair">Pair</option>
                    <option value="Kit">Kit</option>
                    <option value="Unit">Unit</option>
                    <option value="Each">Each</option>
                  </select>
                </div>
              </div>

              {/* Initial Quantity and Reorder Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Initial Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={formatInputValue(itemForm.quantity)}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: parseNumberInput(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Reorder Level *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={formatInputValue(itemForm.reorderLevel)}
                    onChange={(e) => setItemForm({ ...itemForm, reorderLevel: parseNumberInput(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Purchase Price and Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Purchase Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">LKR</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={formatInputValue(itemForm.purchasePrice)}
                      onChange={(e) => setItemForm({ ...itemForm, purchasePrice: parseNumberInput(e.target.value) })}
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Selling Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">LKR</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={formatInputValue(itemForm.sellingPrice)}
                      onChange={(e) => setItemForm({ ...itemForm, sellingPrice: parseNumberInput(e.target.value) })}
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Supplier</label>
                <select
                  value={itemForm.supplier}
                  onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-slate-500 mb-1">Supplier not found?</p>
                    <button
                      type="button"
                      onClick={() => window.location.href = '/admin/suppliers'}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      + Add Supplier
                    </button>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Status</label>
                <select
                  value={itemForm.status}
                  onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⚪ Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setItemForm({
                    itemName: '',
                    category: '',
                    brand: '',
                    model: '',
                    quantity: 10,
                    unit: 'Piece',
                    purchasePrice: 2500,
                    sellingPrice: 3500,
                    reorderLevel: 5,
                    supplier: '',
                    status: 'active',
                    location: 'Shelf A-1',
                    description: '',
                  })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">Edit Inventory Item</h3>
            <p className="text-sm text-slate-500 mb-4">Update inventory item details</p>

            <form onSubmit={handleUpdateItem} className="space-y-4 text-xs font-medium">
              {/* Item Code - Read Only */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Item Code</label>
                <div className="flex">
                  <input
                    type="text"
                    value={selectedItem.itemCode}
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Item Name</label>
                <input
                  type="text"
                  required
                  value={editForm.itemName}
                  onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Category and Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Category</label>
                  <select
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Spare Part">🔧 Spare Part</option>
                    <option value="Lubricant">🛢 Lubricant</option>
                    <option value="Tire">🛞 Tire</option>
                    <option value="Battery">🔋 Battery</option>
                    <option value="Filter">⚙ Filter</option>
                    <option value="Accessory">🎒 Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Brand</label>
                  <select
                    required
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Brand</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Honda">Honda</option>
                    <option value="Nissan">Nissan</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Mazda">Mazda</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Kia">Kia</option>
                    <option value="BMW">BMW</option>
                    <option value="Mercedes-Benz">Mercedes-Benz</option>
                    <option value="Audi">Audi</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Ford">Ford</option>
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Volvo">Volvo</option>
                    <option value="Land Rover">Land Rover</option>
                    <option value="Jaguar">Jaguar</option>
                    <option value="Peugeot">Peugeot</option>
                    <option value="Renault">Renault</option>
                    <option value="Fiat">Fiat</option>
                    <option value="Tata">Tata</option>
                    <option value="Mahindra">Mahindra</option>
                    <option value="Perodua">Perodua</option>
                    <option value="Daihatsu">Daihatsu</option>
                    <option value="Subaru">Subaru</option>
                    <option value="Isuzu">Isuzu</option>
                    <option value="Hino">Hino</option>
                    <option value="UD Trucks">UD Trucks</option>
                    <option value="Fuso">Fuso</option>
                    <option value="Scania">Scania</option>
                    <option value="Volvo Trucks">Volvo Trucks</option>
                    <option value="MAN">MAN</option>
                    <option value="Bosch">Bosch</option>
                    <option value="Denso">Denso</option>
                    <option value="NGK">NGK</option>
                    <option value="Mobil">Mobil</option>
                    <option value="Castrol">Castrol</option>
                    <option value="Shell">Shell</option>
                    <option value="Valvoline">Valvoline</option>
                    <option value="Gates">Gates</option>
                    <option value="SKF">SKF</option>
                    <option value="Brembo">Brembo</option>
                    <option value="ATE">ATE</option>
                    <option value="Valeo">Valeo</option>
                    <option value="Mann-Filter">Mann-Filter</option>
                    <option value="K&N">K&N</option>
                    <option value="3M">3M</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Model and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Model</label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Unit</label>
                  <select
                    required
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Piece">Piece</option>
                    <option value="Set">Set</option>
                    <option value="Liter">Liter</option>
                    <option value="Milliliter">Milliliter</option>
                    <option value="Kilogram">Kilogram</option>
                    <option value="Gram">Gram</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Can">Can</option>
                    <option value="Tube">Tube</option>
                    <option value="Pair">Pair</option>
                    <option value="Kit">Kit</option>
                    <option value="Unit">Unit</option>
                    <option value="Each">Each</option>
                  </select>
                </div>
              </div>

              {/* Current Quantity - Read Only */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Current Quantity</label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${selectedItem.quantity}`}
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-bold"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Use Stock Adjustment to modify quantity</p>
              </div>

              {/* Reorder Level */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Reorder Level</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={formatInputValue(editForm.reorderLevel)}
                  onChange={(e) => setEditForm({ ...editForm, reorderLevel: parseNumberInput(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              {/* Purchase Price and Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">LKR</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={formatInputValue(editForm.purchasePrice)}
                      onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseNumberInput(e.target.value) })}
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Selling Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">LKR</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={formatInputValue(editForm.sellingPrice)}
                      onChange={(e) => setEditForm({ ...editForm, sellingPrice: parseNumberInput(e.target.value) })}
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Supplier</label>
                <select
                  value={editForm.supplier}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⚪ Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm({
                    itemName: selectedItem.itemName,
                    category: selectedItem.category,
                    brand: selectedItem.brand || '',
                    model: selectedItem.model || '',
                    unit: selectedItem.unit,
                    purchasePrice: selectedItem.purchasePrice,
                    sellingPrice: selectedItem.sellingPrice,
                    reorderLevel: selectedItem.reorderLevel,
                    supplier: (selectedItem.supplier as any)?._id || '',
                    status: selectedItem.status,
                    location: selectedItem.location || '',
                    description: selectedItem.description || '',
                  })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAdjustModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">Stock Adjustment</h3>
            <p className="text-sm text-slate-500 mb-4">Manually increase or decrease inventory stock</p>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs font-medium">
              {/* Adjustment No - Auto Generated */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Adjustment No</label>
                <div className="flex">
                  <input
                    type="text"
                    value="ADJ-*****"
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Auto Generated</p>
              </div>

              {/* Item Selection */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Item *</label>
                <select
                  required
                  value={adjustForm.itemId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, itemId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select Inventory Item</option>
                  {items.map((item) => (
                    <option key={item.id || (item as any)._id} value={item.id || (item as any)._id}>
                      {item.itemCode} - {item.itemName} (Current: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Stock - Auto Filled */}
              {adjustForm.itemId && (() => {
                const selectedItem = items.find(item => (item.id || (item as any)._id) === adjustForm.itemId);
                return selectedItem ? (
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Current Stock</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={`${selectedItem.quantity} ${selectedItem.unit}`}
                        disabled
                        className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-bold"
                      />
                      <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                        🔒
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Auto Filled</p>
                  </div>
                ) : null;
              })()}

              {/* Adjustment Type */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Adjustment Type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="increase"
                      checked={adjustForm.type === 'increase'}
                      onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as any })}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span>Increase</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="decrease"
                      checked={adjustForm.type === 'decrease'}
                      onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as any })}
                      className="w-4 h-4 text-brand-500"
                    />
                    <span>Decrease</span>
                  </label>
                </div>
              </div>

              {/* Adjustment Quantity */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Adjustment Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Reason *</label>
                <select
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Select Reason</option>
                  <option value="Stock Received">Stock Received</option>
                  <option value="Damaged Item">Damaged Item</option>
                  <option value="Lost Item">Lost Item</option>
                  <option value="Expired Item">Expired Item</option>
                  <option value="Stock Count Correction">Stock Count Correction</option>
                  <option value="Return to Supplier">Return to Supplier</option>
                  <option value="Found Stock">Found Stock</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Reason Details - Only shown when Other is selected */}
              {adjustForm.reason === 'Other' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Reason Details *</label>
                  <input
                    type="text"
                    required
                    value={adjustForm.reasonDetails}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reasonDetails: e.target.value })}
                    placeholder="Please specify the reason..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              {/* Adjusted By - Auto Filled */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Adjusted By</label>
                <div className="flex">
                  <input
                    type="text"
                    value="Administrator"
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
              </div>

              {/* Adjustment Date - Current Date */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Adjustment Date</label>
                <div className="flex">
                  <input
                    type="text"
                    value={new Date().toLocaleDateString('en-GB')}
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Current Date</p>
              </div>

              {/* New Stock - Auto Calculated */}
              {adjustForm.itemId && (() => {
                const selectedItem = items.find(item => (item.id || (item as any)._id) === adjustForm.itemId);
                if (selectedItem) {
                  const newStock = adjustForm.type === 'increase' 
                    ? selectedItem.quantity + adjustForm.quantity
                    : selectedItem.quantity - adjustForm.quantity;
                  
                  // Show warning if stock will become negative
                  const willBeNegative = adjustForm.type === 'decrease' && newStock < 0;
                  
                  return (
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">New Stock</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={willBeNegative ? 'Insufficient Stock' : `${newStock} ${selectedItem.unit}`}
                          disabled
                          className={`flex-1 p-2.5 border border-slate-200 rounded-l-xl font-bold ${
                            willBeNegative 
                              ? 'bg-red-100 text-red-600 cursor-not-allowed' 
                              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          }`}
                        />
                        <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                          🔒
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Auto Calculated</p>
                      {willBeNegative && (
                        <p className="text-[10px] text-red-600 mt-1 font-bold">
                          ⚠️ Insufficient stock. Available: {selectedItem.quantity}, Requested: {adjustForm.quantity}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustForm({
                    type: 'increase',
                    quantity: 1,
                    reason: '',
                    reasonDetails: '',
                    itemId: '',
                  })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold mb-1">Delete Inventory Item</h3>
            <p className="text-sm text-slate-500 mb-6">
              {itemHasHistory 
                ? 'Use soft delete/deactivation when the item has historical transactions.' 
                : 'For an item with no historical transactions, permanent deletion can be allowed.'}
            </p>

            {/* Item Details */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                  {CATEGORY_ICONS[selectedItem.category] || '📦'}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono">{selectedItem.itemCode}</p>
                  <p className="text-sm font-bold text-slate-900">{selectedItem.itemName}</p>
                </div>
              </div>
              {itemHasHistory && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span>This item has historical transactions and will be deactivated instead of permanently deleted.</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(selectedItem.id || (selectedItem as any)._id)}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all"
              >
                {itemHasHistory ? 'Deactivate Item' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movement History Modal */}
      {isMovementHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsMovementHistoryOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">Stock Movement History</h3>
            <p className="text-sm text-slate-500 mb-4">Read-only view of all inventory movements</p>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search movement..."
                  value={movementSearch}
                  onChange={(e) => {
                    setMovementSearch(e.target.value);
                    setMovementPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <select
                value={movementItemFilter}
                onChange={(e) => {
                  setMovementItemFilter(e.target.value);
                  setMovementPage(1);
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Items</option>
                {items.map((item) => (
                  <option key={item.id || (item as any)._id} value={item.id || (item as any)._id}>
                    {item.itemCode} - {item.itemName}
                  </option>
                ))}
              </select>
              <select
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value);
                  setMovementPage(1);
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">All Types</option>
                <option value="in">🟢 IN</option>
                <option value="out">🔴 OUT</option>
                <option value="adjustment">🟡 ADJUST</option>
              </select>
            </div>

            {/* Movement History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-3 font-bold text-slate-700">Movement ID</th>
                    <th className="text-left p-3 font-bold text-slate-700">Item</th>
                    <th className="text-left p-3 font-bold text-slate-700">Type</th>
                    <th className="text-left p-3 font-bold text-slate-700">Qty</th>
                    <th className="text-left p-3 font-bold text-slate-700">Reference</th>
                    <th className="text-left p-3 font-bold text-slate-700">Created By</th>
                    <th className="text-left p-3 font-bold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movementsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Loading movement history...
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No movement history found
                      </td>
                    </tr>
                  ) : (
                    movements.map((movement) => (
                      <tr key={movement.movementId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{movement.movementId}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-semibold text-slate-900">{movement.itemName}</div>
                            <div className="text-[10px] text-slate-400">{movement.itemCode}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          {movement.type === 'in' && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              🟢 IN
                            </span>
                          )}
                          {movement.type === 'out' && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              🔴 OUT
                            </span>
                          )}
                          {movement.type === 'adjustment' && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                              🟡 ADJUST
                            </span>
                          )}
                        </td>
                        <td className={`p-3 font-bold ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity} {movement.unit}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="font-medium text-slate-800">{movement.reference || 'Stock Adjustment'}</div>
                          {movement.remarks && movement.remarks !== movement.reference && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{movement.remarks}</div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          <span className="font-medium text-slate-800">
                            {movement.performedBy?.fullName || movement.performedBy?.name || 'System'}
                          </span>
                          {movement.performedBy?.role && (
                            <span className="text-[10px] text-slate-400 ml-1">({movement.performedBy.role})</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {new Date(movement.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {movementTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Page {movementPage} of {movementTotalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMovementPage(Math.max(1, movementPage - 1))}
                    disabled={movementPage === 1}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg text-xs font-bold transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setMovementPage(Math.min(movementTotalPages, movementPage + 1))}
                    disabled={movementPage === movementTotalPages}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg text-xs font-bold transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Details Drawer */}
      {isDetailsDrawerOpen && detailsItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Inventory Details</h2>
              <button onClick={() => setIsDetailsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Item Header */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  {CATEGORY_ICONS[detailsItem.category] || '📦'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{detailsItem.itemName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{detailsItem.itemCode}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  detailsItem.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  🟢 {detailsItem.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Stock Information */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Current Stock</span>
                <span className={`text-sm font-bold ${detailsItem.quantity === 0 ? 'text-red-600' : detailsItem.quantity <= detailsItem.reorderLevel ? 'text-yellow-600' : 'text-slate-900'}`}>
                  {detailsItem.quantity} {detailsItem.unit}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Reorder Level</span>
                <span className="text-sm font-bold text-slate-900">{detailsItem.reorderLevel} {detailsItem.unit}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Stock Status</span>
                {detailsItem.quantity === 0 ? (
                  <span className="text-xs font-bold text-red-600">🔴 Out of Stock</span>
                ) : detailsItem.quantity > 0 && detailsItem.quantity <= detailsItem.reorderLevel ? (
                  <span className="text-xs font-bold text-yellow-600">🟡 Low Stock</span>
                ) : (
                  <span className="text-xs font-bold text-green-600">🟢 In Stock</span>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Purchase Price</span>
                <span className="text-sm font-bold text-slate-900">{formatLKR(detailsItem.purchasePrice)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Selling Price</span>
                <span className="text-sm font-bold text-slate-900">{formatLKR(detailsItem.sellingPrice)}</span>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Supplier</span>
                <span className="text-xs font-semibold text-slate-900">
                  {(detailsItem.supplier as any)?.name || 'Not assigned'}
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-200 my-6" />

            {/* Recent Stock Movements */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Recent Stock Movements</h4>
              {recentMovements.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No recent movements</p>
              ) : (
                <div className="space-y-2">
                  {recentMovements.map((movement) => (
                    <div key={movement.movementId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                        </span>
                        <span className="text-xs text-slate-600 font-mono">{movement.reference}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(movement.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setIsDetailsDrawerOpen(false);
                  setMovementItemFilter(detailsItem.id || (detailsItem as any)._id);
                  setIsMovementHistoryOpen(true);
                }}
                className="w-full mt-3 text-xs font-bold text-slate-600 hover:text-slate-900 text-center"
              >
                [ View Full History ]
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsDetailsDrawerOpen(false);
                  handleEditItem(detailsItem);
                }}
                className="flex-1 px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-bold transition-all"
              >
                [ Edit Item ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
