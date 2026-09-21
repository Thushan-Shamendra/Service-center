import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierApi } from '../../api/supplierApi';
import { purchaseOrderApi } from '../../api/purchaseOrderApi';
import { grnApi } from '../../api/grnApi';
import { purchaseReturnApi } from '../../api/purchaseReturnApi';
import { supplierPaymentApi } from '../../api/supplierPaymentApi';
import { inventoryApi } from '../../api/inventoryApi';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatPhone, formatLKR, formatDate } from '../../utils/formatters';
import { Truck, Plus, X, Download, Eye, Edit, Power, PowerOff, ShoppingCart, Package, RotateCcw, CreditCard, DollarSign, Calendar, Trash2, PackageCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

type TabType = 'suppliers' | 'purchase-orders' | 'grn' | 'purchase-returns' | 'payments';

interface POItem {
  item: string;
  itemName: string;
  availableStock: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface GRNItem {
  item: string;
  itemName: string;
  orderedQuantity: number;
  alreadyReceivedQuantity: number;
  remainingQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  total: number;
}

interface ReturnItem {
  item: string;
  itemName: string;
  receivedQuantity: number;
  returnedQuantity: number;
  unitPrice: number;
  refundAmount: number;
  itemReason: string;
}

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('suppliers');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [grns, setGRNs] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    pendingPO: 0,
    pendingGRN: 0,
    outstandingPayments: 0,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPaymentEditMode, setIsPaymentEditMode] = useState(false);
  const [isReturnEditMode, setIsReturnEditMode] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isPODetailsDrawerOpen, setIsPODetailsDrawerOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isGRNDetailsDrawerOpen, setIsGRNDetailsDrawerOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [selectedGRN, setSelectedGRN] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
    },
    category: 'Auto Spare Parts',
    isActive: true,
    bankDetails: {
      bankName: '',
      branch: '',
      accountNumber: '',
    },
  });

  // Purchase Order Form
  const [poForm, setPOForm] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    items: [] as POItem[],
    discount: 0,
    notes: '',
    terms: '',
    status: 'pending',
  });

  // GRN Form
  const [grnForm, setGRNForm] = useState({
    purchaseOrder: '',
    items: [] as GRNItem[],
    notes: '',
  });

  // Purchase Return Form
  const [returnForm, setReturnForm] = useState({
    supplier: '',
    grn: '',
    items: [] as ReturnItem[],
    returnReason: '',
    notes: '',
  });

  // Supplier Payment Form
  const [paymentForm, setPaymentForm] = useState({
    supplier: '',
    purchaseOrder: '',
    grn: '',
    outstandingBalance: 0,
    invoiceNumber: '',
    amount: 0,
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        search: searchQuery || undefined,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await supplierApi.getSuppliers(params);
      if (res.success) {
        setSuppliers(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load supplier directory');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        search: searchQuery || undefined,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (supplierFilter) {
        params.supplier = supplierFilter;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const res = await purchaseOrderApi.getPurchaseOrders(params);
      if (res.success) {
        setPurchaseOrders(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const res = await inventoryApi.getInventory({ limit: 1000 });
      if (res.success) {
        setInventoryItems(res.data);
      }
    } catch (error) {
      console.error('Failed to load inventory items:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await supplierApi.getSupplierSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const fetchSupplierDetails = async (supplier: any) => {
    try {
      setSelectedSupplier(supplier);
      setSupplierDetails(supplier);
      setIsDetailsDrawerOpen(true);
    } catch (error) {
      console.error('Failed to load supplier details:', error);
      toast.error('Failed to load supplier details');
    }
  };

  useEffect(() => {
    if (activeTab === 'suppliers') {
      fetchSuppliers();
      fetchSummary();
    } else if (activeTab === 'purchase-orders') {
      fetchPurchaseOrders();
      fetchInventoryItems();
    } else if (activeTab === 'grn') {
      fetchGRNs();
      fetchPurchaseOrders();
    } else if (activeTab === 'purchase-returns') {
      fetchPurchaseReturns();
      fetchGRNs();
    } else if (activeTab === 'payments') {
      fetchSupplierPayments();
      fetchSuppliers();
    }
  }, [page, searchQuery, statusFilter, supplierFilter, startDate, endDate, activeTab]);

  // Check for query parameter to auto-open add modal or select tab
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['suppliers', 'purchase-orders', 'grn', 'purchase-returns', 'payments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const actionParam = searchParams.get('action');
    if (actionParam === 'new') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await supplierApi.createSupplier(supplierForm);
      if (res.success) {
        toast.success(res.message || 'Supplier added successfully');
        setIsAddModalOpen(false);
        setIsEditMode(false);
        // Reset form
        setSupplierForm({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: {
            street: '',
            city: '',
          },
          category: 'Auto Spare Parts',
          isActive: true,
          bankDetails: {
            bankName: '',
            branch: '',
            accountNumber: '',
          },
        });
        fetchSuppliers();
        fetchSummary();
      } else {
        toast.error(res.message || 'Failed to add supplier');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating supplier');
    }
  };

  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address || { street: '', city: '' },
      category: supplier.category || 'Auto Spare Parts',
      isActive: supplier.isActive,
      bankDetails: supplier.bankDetails || { bankName: '', branch: '', accountNumber: '' },
    });
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) return;

    try {
      const res = await supplierApi.updateSupplier(selectedSupplier._id, supplierForm);
      if (res.success) {
        toast.success(res.message || 'Supplier updated successfully');
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setSelectedSupplier(null);
        // Reset form
        setSupplierForm({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: {
            street: '',
            city: '',
          },
          category: 'Auto Spare Parts',
          isActive: true,
          bankDetails: {
            bankName: '',
            branch: '',
            accountNumber: '',
          },
        });
        fetchSuppliers();
        fetchSummary();
      } else {
        toast.error(res.message || 'Failed to update supplier');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating supplier');
    }
  };

  const handleActivateSupplier = async (id: string) => {
    try {
      const res = await supplierApi.activateSupplier(id);
      if (res.success) {
        toast.success('Supplier activated successfully');
        fetchSuppliers();
        fetchSummary();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to activate supplier');
    }
  };

  const handleDeactivateSupplier = async (id: string) => {
    try {
      const res = await supplierApi.deactivateSupplier(id);
      if (res.success) {
        toast.success('Supplier deactivated successfully');
        fetchSuppliers();
        fetchSummary();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deactivate supplier');
    }
  };

  // Purchase Order functions
  const handleAddPOItem = () => {
    const newItem: POItem = {
      item: '',
      itemName: '',
      availableStock: 0,
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setPOForm({ ...poForm, items: [...poForm.items, newItem] });
  };

  const handleRemovePOItem = (index: number) => {
    const newItems = poForm.items.filter((_, i) => i !== index);
    setPOForm({ ...poForm, items: newItems });
  };

  const handlePOItemChange = (index: number, field: keyof POItem, value: string | number) => {
    setPOForm(prevPOForm => {
      const newItems = [...prevPOForm.items];
      (newItems[index] as any)[field] = value;
      
      // Auto-fill item details when item is selected
      if (field === 'item' && value) {
        const selectedItem = inventoryItems.find(item => item._id === value);
        
        if (selectedItem) {
          newItems[index].itemName = selectedItem.itemName || '';
          newItems[index].availableStock = selectedItem.quantity || 0;
          newItems[index].unitPrice = selectedItem.purchasePrice || 0;
          
          // Recalculate total after auto-fill
          newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
        }
      }
      
      // Calculate line total for quantity or unit price changes
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
      }
      
      return { ...prevPOForm, items: newItems };
    });
  };

  const calculatePOTotals = () => {
    const subtotal = poForm.items.reduce((sum, item) => sum + item.total, 0);
    const discount = poForm.discount;
    const grandTotal = subtotal - discount;
    return { subtotal, discount, grandTotal };
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (poForm.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const { subtotal, discount, grandTotal } = calculatePOTotals();
      
      const poData = {
        supplier: poForm.supplier,
        items: poForm.items.map(item => ({
          item: item.item,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        expectedDeliveryDate: poForm.expectedDeliveryDate,
        subtotal,
        discount,
        tax: 0,
        totalAmount: grandTotal,
        notes: poForm.notes,
        terms: poForm.terms,
        status: poForm.status,
      };

      const res = await purchaseOrderApi.createPurchaseOrder(poData);
      if (res.success) {
        toast.success('Purchase order created successfully');
        setIsPOModalOpen(false);
        setPOForm({
          supplier: '',
          expectedDeliveryDate: '',
          items: [],
          discount: 0,
          notes: '',
          terms: '',
          status: 'pending',
        });
        fetchPurchaseOrders();
      } else {
        toast.error(res.message || 'Failed to create purchase order');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating purchase order');
    }
  };

  const handleCancelPO = async (id: string) => {
    try {
      const res = await purchaseOrderApi.cancelPurchaseOrder(id, 'Cancelled by administrator');
      if (res.success) {
        toast.success('Purchase order cancelled successfully');
        fetchPurchaseOrders();
      } else {
        toast.error(res.message || 'Failed to cancel purchase order');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel purchase order');
    }
  };

  const handleApprovePO = async (id: string) => {
    try {
      const res = await purchaseOrderApi.approvePurchaseOrder(id);
      if (res.success) {
        toast.success('Purchase order approved successfully');
        fetchPurchaseOrders();
        if (selectedPO && selectedPO._id === id) {
          setSelectedPO(res.data);
        }
      } else {
        toast.error(res.message || 'Failed to approve purchase order');
      }
    } catch (error: any) {
      console.error('Approve PO error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve purchase order');
    }
  };

  const handleViewPO = async (po: any) => {
    try {
      const poId = po._id || po.id;
      if (!poId) {
        toast.error('Purchase Order ID not found');
        return;
      }
      const res = await purchaseOrderApi.getPurchaseOrderById(poId);
      if (res.success) {
        setSelectedPO(res.data);
        setIsPODetailsDrawerOpen(true);
      } else {
        toast.error('Failed to load PO details');
      }
    } catch (error: any) {
      console.error('Error loading PO details:', error);
      toast.error(error.response?.data?.message || 'Error loading PO details');
    }
  };

  const handleViewGRN = async (grnItem: any) => {
    try {
      const res = await grnApi.getGRNById(grnItem._id);
      if (res.success) {
        setSelectedGRN(res.data);
        setIsGRNDetailsDrawerOpen(true);
      } else {
        toast.error('Failed to load GRN details');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error loading GRN details');
    }
  };

  const handleEditGRN = (grnItem: any) => {
    setSelectedGRN(grnItem);
    // Populate GRN form with existing data
    const grnItems: GRNItem[] = grnItem.items.map((grnItemData: any) => {
      const alreadyReceived = grnItemData.receivedQuantity || 0;
      const orderedQuantity = grnItemData.orderedQuantity || 0;
      const remainingQuantity = orderedQuantity - alreadyReceived;
      
      return {
        item: grnItemData.item,
        itemName: grnItemData.itemName,
        orderedQuantity: orderedQuantity,
        alreadyReceivedQuantity: alreadyReceived,
        remainingQuantity: remainingQuantity,
        receivedQuantity: 0,
        unitPrice: grnItemData.unitPrice,
        total: 0,
      };
    });
    
    setGRNForm({
      purchaseOrder: grnItem.purchaseOrder,
      items: grnItems,
      notes: grnItem.notes || '',
    });
    setIsGRNModalOpen(true);
  };

  const handleDeleteGRN = async (grnItem: any) => {
    if (!confirm('Are you sure you want to delete this GRN? This will revert the inventory stock changes.')) {
      return;
    }
    
    try {
      const res = await grnApi.deleteGRN(grnItem._id);
      if (res.success) {
        toast.success('GRN deleted successfully');
        fetchGRNs();
        fetchPurchaseOrders();
      } else {
        toast.error(res.message || 'Failed to delete GRN');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting GRN');
    }
  };

  const handleViewReturn = async (returnItem: any) => {
    try {
      const res = await purchaseReturnApi.getPurchaseReturnById(returnItem._id);
      if (res.success) {
        setSelectedReturn(res.data);
        setIsReturnEditMode(false);
        setIsReturnModalOpen(true);
      } else {
        toast.error('Failed to load return details');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error loading return details');
    }
  };

  const handleEditReturn = (returnItem: any) => {
    setSelectedReturn(returnItem);
    setReturnForm({
      supplier: returnItem.supplier._id || returnItem.supplier,
      grn: returnItem.grn._id || returnItem.grn,
      items: returnItem.items.map((item: any) => ({
        item: item.item,
        itemName: item.itemName,
        receivedQuantity: item.receivedQuantity,
        returnedQuantity: item.returnedQuantity,
        unitPrice: item.unitPrice,
        refundAmount: item.refundAmount,
        itemReason: item.itemReason || 'damaged',
      })),
      returnReason: returnItem.returnReason || '',
      notes: returnItem.notes || '',
    });
    setIsReturnEditMode(true);
    setIsReturnModalOpen(true);
  };

  const handleViewPayment = async (payment: any) => {
    try {
      const res = await supplierPaymentApi.getSupplierPaymentById(payment._id);
      if (res.success) {
        setSelectedPayment(res.data);
        setIsPaymentEditMode(false);
        setIsPaymentModalOpen(true);
      } else {
        toast.error('Failed to load payment details');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error loading payment details');
    }
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentForm({
      supplier: payment.supplier._id || payment.supplier,
      purchaseOrder: payment.purchaseOrder?._id || payment.purchaseOrder || '',
      grn: payment.grn?._id || payment.grn || '',
      outstandingBalance: payment.outstandingBalance || 0,
      invoiceNumber: payment.invoiceNumber || '',
      amount: payment.amount || 0,
      paymentMethod: payment.paymentMethod || 'cash',
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || '',
    });
    setIsPaymentEditMode(true);
    setIsPaymentModalOpen(true);
  };

  const getPOStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partially_received': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportSuppliers = () => {
    // Prepare CSV data
    const csvData = suppliers.map(supplier => ({
      'Supplier ID': supplier.supplierId || '',
      'Name': supplier.name || '',
      'Contact Person': supplier.contactPerson || '',
      'Phone': supplier.phone || '',
      'Email': supplier.email || '',
      'Address': `${supplier.address?.street || ''}, ${supplier.address?.city || ''}`.trim(),
      'Category': supplier.category || '',
      'Status': supplier.isActive ? 'Active' : 'Inactive',
      'Bank Name': supplier.bankDetails?.bankName || '',
      'Branch': supplier.bankDetails?.branch || '',
      'Account Number': supplier.bankDetails?.accountNumber || '',
    }));

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => 
      Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `suppliers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Suppliers exported successfully');
  };

  // GRN functions
  const fetchGRNs = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        search: searchQuery || undefined,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (supplierFilter) {
        params.supplier = supplierFilter;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const res = await grnApi.getGRNs(params);
      if (res.success) {
        setGRNs(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load GRNs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPurchaseOrder = (poId: string) => {
    const selectedPO = purchaseOrders.find(po => po._id === poId);
    if (selectedPO) {
      const grnItems: GRNItem[] = selectedPO.items.map((poItem: any) => {
        const alreadyReceived = poItem.receivedQuantity || 0;
        const remainingQuantity = poItem.quantity - alreadyReceived;
        
        return {
          item: poItem.item,
          itemName: poItem.itemName,
          orderedQuantity: poItem.quantity,
          alreadyReceivedQuantity: alreadyReceived,
          remainingQuantity: remainingQuantity,
          receivedQuantity: 0,
          unitPrice: poItem.unitPrice,
          total: 0,
        };
      });
      
      setGRNForm({
        ...grnForm,
        purchaseOrder: poId,
        items: grnItems,
      });
    }
  };

  const handleGRNItemChange = (index: number, field: keyof GRNItem, value: string | number) => {
    setGRNForm(prevGRNForm => {
      const newItems = [...prevGRNForm.items];
      (newItems[index] as any)[field] = value;
      
      // Validate received quantity doesn't exceed remaining
      if (field === 'receivedQuantity') {
        const item = newItems[index];
        if (item.receivedQuantity > item.remainingQuantity) {
          item.receivedQuantity = item.remainingQuantity;
          toast.error(`Cannot exceed remaining quantity of ${item.remainingQuantity}`);
        }
      }
      
      // Calculate line total
      if (field === 'receivedQuantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].receivedQuantity * newItems[index].unitPrice;
      }
      
      return { ...prevGRNForm, items: newItems };
    });
  };

  const calculateGRNStatus = () => {
    if (grnForm.items.length === 0) return 'pending';
    
    const allComplete = grnForm.items.every(item => item.receivedQuantity >= item.orderedQuantity);
    const anyReceived = grnForm.items.some(item => item.receivedQuantity > 0);
    
    if (allComplete) return 'complete';
    if (anyReceived) return 'partial';
    return 'pending';
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (grnForm.items.length === 0) {
      toast.error('Please select a purchase order first');
      return;
    }

    const hasReceivedItems = grnForm.items.some(item => item.receivedQuantity > 0);
    if (!hasReceivedItems) {
      toast.error('Please enter received quantities for at least one item');
      return;
    }

    try {
      const status = calculateGRNStatus();
      
      const grnData = {
        purchaseOrder: grnForm.purchaseOrder,
        items: grnForm.items.filter(item => item.receivedQuantity > 0).map(item => ({
          item: item.item,
          itemName: item.itemName,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        notes: grnForm.notes,
      };

      const res = await grnApi.createGRN(grnData);
      if (res.success) {
        toast.success('GRN created successfully');
        setIsGRNModalOpen(false);
        setGRNForm({
          purchaseOrder: '',
          items: [],
          notes: '',
        });
        fetchGRNs();
        fetchPurchaseOrders();
      } else {
        toast.error(res.message || 'Failed to create GRN');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating GRN');
    }
  };

  const getGRNStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Purchase Returns functions
  const fetchPurchaseReturns = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        search: searchQuery || undefined,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (supplierFilter) {
        params.supplier = supplierFilter;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const res = await purchaseReturnApi.getPurchaseReturns(params);
      if (res.success) {
        setPurchaseReturns(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load purchase returns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGRN = (grnId: string) => {
    const selectedGRN = grns.find(item => item._id === grnId);
    if (selectedGRN) {
      const returnItems: ReturnItem[] = selectedGRN.items.map((grnItem: any) => ({
        item: grnItem.item,
        itemName: grnItem.itemName,
        receivedQuantity: grnItem.receivedQuantity,
        returnedQuantity: 0,
        unitPrice: grnItem.unitPrice,
        refundAmount: 0,
        itemReason: 'damaged',
      }));

      setReturnForm({
        ...returnForm,
        grn: grnId,
        supplier: selectedGRN.supplier,
        items: returnItems,
      });
    }
  };

  const handleReturnItemChange = (index: number, field: keyof ReturnItem, value: string | number) => {
    setReturnForm(prevReturnForm => {
      const newItems = [...prevReturnForm.items];
      (newItems[index] as any)[field] = value;
      
      // Calculate refund amount
      if (field === 'returnedQuantity' || field === 'unitPrice') {
        newItems[index].refundAmount = newItems[index].returnedQuantity * newItems[index].unitPrice;
      }
      
      return { ...prevReturnForm, items: newItems };
    });
  };

  const calculateTotalRefund = () => {
    return returnForm.items.reduce((sum, item) => sum + item.refundAmount, 0);
  };

  const handleCreatePurchaseReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!returnForm.grn) {
      toast.error('Please select a GRN first');
      return;
    }

    const hasReturnedItems = returnForm.items.some(item => item.returnedQuantity > 0);
    if (!hasReturnedItems) {
      toast.error('Please enter return quantities for at least one item');
      return;
    }

    try {
      const returnData = {
        grn: returnForm.grn,
        items: returnForm.items.filter(item => item.returnedQuantity > 0).map(item => ({
          item: item.item,
          itemName: item.itemName,
          returnedQuantity: item.returnedQuantity,
          unitPrice: item.unitPrice,
          refundAmount: item.refundAmount,
          itemReason: item.itemReason,
        })),
        returnReason: returnForm.returnReason,
        notes: returnForm.notes,
      };

      const res = await purchaseReturnApi.createPurchaseReturn(returnData);
      if (res.success) {
        toast.success('Purchase return created successfully');
        setIsReturnModalOpen(false);
        setReturnForm({
          supplier: '',
          grn: '',
          items: [],
          returnReason: '',
          notes: '',
        });
        fetchPurchaseReturns();
        fetchGRNs();
      } else {
        toast.error(res.message || 'Failed to create purchase return');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating purchase return');
    }
  };

  const handleUpdateReturn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReturn) return;

    if (!returnForm.grn) {
      toast.error('Please select a GRN first');
      return;
    }

    const hasReturnedItems = returnForm.items.some(item => item.returnedQuantity > 0);
    if (!hasReturnedItems) {
      toast.error('Please enter return quantities for at least one item');
      return;
    }

    try {
      const returnData = {
        grn: returnForm.grn,
        items: returnForm.items.filter(item => item.returnedQuantity > 0).map(item => ({
          item: item.item,
          itemName: item.itemName,
          returnedQuantity: item.returnedQuantity,
          unitPrice: item.unitPrice,
          refundAmount: item.refundAmount,
          itemReason: item.itemReason,
        })),
        returnReason: returnForm.returnReason,
        notes: returnForm.notes,
      };

      const res = await purchaseReturnApi.updatePurchaseReturn(selectedReturn._id, returnData);
      if (res.success) {
        toast.success('Purchase return updated successfully');
        setIsReturnModalOpen(false);
        setIsReturnEditMode(false);
        setSelectedReturn(null);
        setReturnForm({
          supplier: '',
          grn: '',
          items: [],
          returnReason: '',
          notes: '',
        });
        fetchPurchaseReturns();
        fetchGRNs();
      } else {
        toast.error(res.message || 'Failed to update purchase return');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating purchase return');
    }
  };

  const handleDeleteReturn = async (returnItem: any) => {
    if (!confirm('Are you sure you want to delete this purchase return? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await purchaseReturnApi.deletePurchaseReturn(returnItem._id);
      if (res.success) {
        toast.success('Purchase return deleted successfully');
        fetchPurchaseReturns();
        fetchGRNs();
      } else {
        toast.error(res.message || 'Failed to delete purchase return');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting purchase return');
    }
  };

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Supplier Payments functions
  const fetchSupplierPayments = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        search: searchQuery || undefined,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (supplierFilter) {
        params.supplier = supplierFilter;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const res = await supplierPaymentApi.getSupplierPayments(params);
      if (res.success) {
        setSupplierPayments(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load supplier payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSupplier = (supplierId: string) => {
    const selectedSupplier = suppliers.find(s => s._id === supplierId);
    if (selectedSupplier) {
      setPaymentForm({
        ...paymentForm,
        supplier: supplierId,
        outstandingBalance: 450000, // This would normally come from backend calculation
      });
    }
  };

  const calculateRemainingBalance = () => {
    return paymentForm.outstandingBalance - paymentForm.amount;
  };

  const handleCreateSupplierPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentForm.supplier) {
      toast.error('Please select a supplier');
      return;
    }

    if (paymentForm.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const paymentData = {
        supplier: paymentForm.supplier,
        purchaseOrder: paymentForm.purchaseOrder || undefined,
        grn: paymentForm.grn || undefined,
        amount: paymentForm.amount,
        outstandingBalance: paymentForm.outstandingBalance,
        invoiceNumber: paymentForm.invoiceNumber,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
      };

      const res = await supplierPaymentApi.createSupplierPayment(paymentData);
      if (res.success) {
        toast.success('Supplier payment recorded successfully');
        setIsPaymentModalOpen(false);
        setPaymentForm({
          supplier: '',
          purchaseOrder: '',
          grn: '',
          outstandingBalance: 0,
          invoiceNumber: '',
          amount: 0,
          paymentMethod: 'cash',
          referenceNumber: '',
          notes: '',
        });
        fetchSupplierPayments();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error recording payment');
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment) return;

    if (!paymentForm.supplier) {
      toast.error('Please select a supplier');
      return;
    }

    if (paymentForm.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const paymentData = {
        supplier: paymentForm.supplier,
        purchaseOrder: paymentForm.purchaseOrder || undefined,
        grn: paymentForm.grn || undefined,
        amount: paymentForm.amount,
        outstandingBalance: paymentForm.outstandingBalance,
        invoiceNumber: paymentForm.invoiceNumber,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
      };

      const res = await supplierPaymentApi.updateSupplierPayment(selectedPayment._id, paymentData);
      if (res.success) {
        toast.success('Supplier payment updated successfully');
        setIsPaymentModalOpen(false);
        setIsPaymentEditMode(false);
        setSelectedPayment(null);
        setPaymentForm({
          supplier: '',
          purchaseOrder: '',
          grn: '',
          outstandingBalance: 0,
          invoiceNumber: '',
          amount: 0,
          paymentMethod: 'cash',
          referenceNumber: '',
          notes: '',
        });
        fetchSupplierPayments();
      } else {
        toast.error(res.message || 'Failed to update payment');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating payment');
    }
  };

  const handleDeletePayment = async (payment: any) => {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await supplierPaymentApi.deleteSupplierPayment(payment._id);
      if (res.success) {
        toast.success('Supplier payment deleted successfully');
        fetchSupplierPayments();
      } else {
        toast.error(res.message || 'Failed to delete payment');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting payment');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Supplier ID',
      accessor: (item) => (
        <span className="font-mono text-xs font-bold text-slate-700">{item.supplierId}</span>
      ),
    },
    {
      header: 'Company',
      accessor: (item) => (
        <span className="font-semibold text-slate-900">{item.name}</span>
      ),
    },
    {
      header: 'Contact',
      accessor: (item) => (
        <span className="text-xs text-slate-600">{item.contactPerson || 'N/A'}</span>
      ),
    },
    {
      header: 'Phone',
      accessor: (item) => (
        <span className="text-xs text-slate-600">{formatPhone(item.phone)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.isActive ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchSupplierDetails(item)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="View Supplier"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditSupplier(item)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Supplier"
          >
            <Edit className="w-4 h-4" />
          </button>
          {item.isActive ? (
            <button
              onClick={() => handleDeactivateSupplier(item._id)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Deactivate"
            >
              <PowerOff className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleActivateSupplier(item._id)}
              className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Activate"
            >
              <Power className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Supplier Management</h2>
          <p className="text-sm text-slate-500">
            Manage suppliers, purchasing, receiving, returns and payments
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'suppliers' as TabType, label: 'Suppliers', icon: Truck },
          { id: 'purchase-orders' as TabType, label: 'Purchase Orders', icon: ShoppingCart },
          { id: 'grn' as TabType, label: 'GRN', icon: Package },
          { id: 'purchase-returns' as TabType, label: 'Purchase Returns', icon: RotateCcw },
          { id: 'payments' as TabType, label: 'Payments', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Suppliers</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.totalSuppliers}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Pending PO</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.pendingPO}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Pending GRN</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.pendingGRN}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Payable</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{formatLKR(summary.outstandingPayments)}</div>
        </div>
      </div>

      {/* Suppliers Tab Content */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search supplier..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedSupplier(null);
                  setSupplierForm({
                    name: '',
                    contactPerson: '',
                    phone: '',
                    email: '',
                    address: {
                      street: '',
                      city: '',
                    },
                    category: 'Auto Spare Parts',
                    isActive: true,
                    bankDetails: {
                      bankName: '',
                      branch: '',
                      accountNumber: '',
                    },
                  });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </button>
              <button 
                onClick={handleExportSuppliers}
                className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-green-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Supplier Table */}
          <DataTable
            columns={columns}
            data={suppliers}
            isLoading={isLoading}
            pagination={{
              currentPage: page,
              totalPages,
              totalRecords,
              onPageChange: (p) => setPage(p),
            }}
            emptyTitle="No Suppliers Found"
            emptyDescription="No suppliers match your current filters."
          />
        </div>
      )}

      {/* Purchase Orders Tab Content */}
      {activeTab === 'purchase-orders' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search PO..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="partially_received">Partially Received</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <button
                onClick={() => setIsPOModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create PO
              </button>
            </div>
          </div>

          {/* Purchase Orders Table */}
          <DataTable
            columns={[
              {
                header: 'PO Number',
                accessor: (item: any) => (
                  <span className="font-mono text-xs font-bold text-slate-700">{item.poNumber}</span>
                ),
              },
              {
                header: 'Supplier',
                accessor: (item: any) => (
                  <span className="font-semibold text-slate-900">{item.supplierName}</span>
                ),
              },
              {
                header: 'PO Date',
                accessor: (item: any) => (
                  <span className="text-xs text-slate-600">{formatDate(item.orderDate, 'DD/MM/YYYY')}</span>
                ),
              },
              {
                header: 'Delivery',
                accessor: (item: any) => (
                  <span className="text-xs text-slate-600">{formatDate(item.expectedDeliveryDate, 'DD/MM/YYYY')}</span>
                ),
              },
              {
                header: 'Total',
                accessor: (item: any) => {
                  const amount = item.totalAmount;
                  if (amount >= 1000000) {
                    return `LKR ${(amount / 1000000).toFixed(1)}M`;
                  } else if (amount >= 1000) {
                    return `LKR ${(amount / 1000).toFixed(0)}K`;
                  }
                  return `LKR ${amount.toFixed(0)}`;
                },
              },
              {
                header: 'Status',
                accessor: (item: any) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPOStatusColor(item.status)}`}>
                    {item.status === 'partially_received' ? 'Partial' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                ),
              },
              {
                header: 'Actions',
                accessor: (item: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewPO(item)}
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={purchaseOrders}
            isLoading={isLoading}
            pagination={{
              currentPage: page,
              totalPages,
              totalRecords,
              onPageChange: (p) => setPage(p),
            }}
            emptyTitle="No Purchase Orders Found"
            emptyDescription="No purchase orders match your current filters."
          />
        </div>
      )}

      {/* GRN Tab Content */}
      {activeTab === 'grn' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search GRN..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Status</option>
                <option value="complete">Complete</option>
                <option value="partial">Partial</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <button
                onClick={async () => {
                  await fetchPurchaseOrders();
                  setIsGRNModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create GRN
              </button>
            </div>
          </div>

          {/* GRN Table */}
          <DataTable
            columns={[
              {
                header: 'GRN No.',
                accessor: (item: any) => (
                  <span className="font-mono text-xs font-bold text-slate-700">{item.grnNumber}</span>
                ),
              },
              {
                header: 'PO Number',
                accessor: (item: any) => (
                  <span className="font-mono text-xs text-slate-600">{item.poNumber}</span>
                ),
              },
              {
                header: 'Supplier',
                accessor: (item: any) => (
                  <span className="font-semibold text-slate-900">{item.supplierName}</span>
                ),
              },
              {
                header: 'Date',
                accessor: (item: any) => (
                  <span className="text-xs text-slate-600">{formatDate(item.receivedDate, 'DD/MM/YYYY')}</span>
                ),
              },
              {
                header: 'Status',
                accessor: (item: any) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGRNStatusColor(item.status)}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                ),
              },
              {
                header: 'Actions',
                accessor: (item: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewGRN(item)}
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditGRN(item)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit GRN"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGRN(item)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete GRN"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={grns}
            isLoading={isLoading}
            pagination={{
              currentPage: page,
              totalPages,
              totalRecords,
              onPageChange: (p) => setPage(p),
            }}
            emptyTitle="No GRNs Found"
            emptyDescription="No goods receiving notes match your current filters."
          />
        </div>
      )}

      {/* Purchase Returns Tab Content */}
      {activeTab === 'purchase-returns' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search return..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processed">Processed</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create Return
              </button>
            </div>
          </div>

          {/* Purchase Returns Table */}
          <DataTable
            columns={[
              {
                header: 'Return No.',
                accessor: (item: any) => (
                  <span className="font-mono text-xs font-bold text-slate-700">{item.returnNumber}</span>
                ),
              },
              {
                header: 'Supplier',
                accessor: (item: any) => (
                  <span className="font-semibold text-slate-900">{item.supplierName}</span>
                ),
              },
              {
                header: 'GRN',
                accessor: (item: any) => (
                  <span className="font-mono text-xs text-slate-600">{item.grnNumber}</span>
                ),
              },
              {
                header: 'Date',
                accessor: (item: any) => (
                  <span className="text-xs text-slate-600">{formatDate(item.returnDate, 'DD/MM/YYYY')}</span>
                ),
              },
              {
                header: 'Refund',
                accessor: (item: any) => {
                  const amount = item.totalRefund;
                  if (amount >= 1000000) {
                    return `LKR ${(amount / 1000000).toFixed(1)}M`;
                  } else if (amount >= 1000) {
                    return `LKR ${(amount / 1000).toFixed(0)}K`;
                  }
                  return `LKR ${amount.toFixed(0)}`;
                },
              },
              {
                header: 'Status',
                accessor: (item: any) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getReturnStatusColor(item.status)}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                ),
              },
              {
                header: 'Actions',
                accessor: (item: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewReturn(item)}
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditReturn(item)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Return"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReturn(item)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Return"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={purchaseReturns}
            isLoading={isLoading}
            pagination={{
              currentPage: page,
              totalPages,
              totalRecords,
              onPageChange: (p) => setPage(p),
            }}
            emptyTitle="No Purchase Returns Found"
            emptyDescription="No purchase returns match your current filters."
          />
        </div>
      )}

      {/* Payments Tab Content */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search payment..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </button>
            </div>
          </div>

          {/* Supplier Payments Table */}
          <DataTable
            columns={[
              {
                header: 'Payment ID',
                accessor: (item: any) => (
                  <span className="font-mono text-xs font-bold text-slate-700">{item.paymentId}</span>
                ),
              },
              {
                header: 'Supplier',
                accessor: (item: any) => (
                  <span className="font-semibold text-slate-900">{item.supplierName}</span>
                ),
              },
              {
                header: 'Invoice',
                accessor: (item: any) => (
                  <span className="font-mono text-xs text-slate-600">{item.invoiceNumber || item.poNumber || item.grnNumber || '-'}</span>
                ),
              },
              {
                header: 'Amount',
                accessor: (item: any) => {
                  const amount = item.amount;
                  if (amount >= 1000000) {
                    return `LKR ${(amount / 1000000).toFixed(1)}M`;
                  } else if (amount >= 1000) {
                    return `LKR ${(amount / 1000).toFixed(0)}K`;
                  }
                  return `LKR ${amount.toFixed(0)}`;
                },
              },
              {
                header: 'Date',
                accessor: (item: any) => (
                  <span className="text-xs text-slate-600">{formatDate(item.paymentDate, 'DD/MM')}</span>
                ),
              },
              {
                header: 'Status',
                accessor: (item: any) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(item.status)}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                ),
              },
              {
                header: 'Actions',
                accessor: (item: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewPayment(item)}
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditPayment(item)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Payment"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePayment(item)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={supplierPayments}
            isLoading={isLoading}
            pagination={{
              currentPage: page,
              totalPages,
              totalRecords,
              onPageChange: (p) => setPage(p),
            }}
            emptyTitle="No Supplier Payments Found"
            emptyDescription="No supplier payments match your current filters."
          />
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => {
              setIsAddModalOpen(false);
              setIsEditMode(false);
              setSelectedSupplier(null);
              setSupplierForm({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: {
                  street: '',
                  city: '',
                },
                category: 'Auto Spare Parts',
                isActive: true,
                bankDetails: {
                  bankName: '',
                  branch: '',
                  accountNumber: '',
                },
              });
            }} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-1">{isEditMode ? 'Edit Supplier' : 'Add Supplier'}</h3>
            <p className="text-sm text-slate-500 mb-4">{isEditMode ? 'Update supplier information' : 'Register a new supplier for VSMS.LK'}</p>

            <form onSubmit={isEditMode ? handleUpdateSupplier : handleCreateSupplier} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Supplier ID</label>
                <div className="flex">
                  <input
                    type="text"
                    value={isEditMode ? selectedSupplier?.supplierId || '' : 'SUP-*****'}
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-mono"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{isEditMode ? 'Read Only' : 'Auto Generated'}</p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Company Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Enter company name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Phone *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Email *</label>
                  <input
                    type="email"
                    required
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Address *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.address.street}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: { ...supplierForm.address, street: e.target.value } })}
                  placeholder="Street address"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-2"
                />
                <input
                  type="text"
                  required
                  value={supplierForm.address.city}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: { ...supplierForm.address, city: e.target.value } })}
                  placeholder="City"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Bank Name *</label>
                  <select
                    required
                    value={supplierForm.bankDetails.bankName}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        bankDetails: { ...supplierForm.bankDetails, bankName: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Bank</option>
                    <option value="Bank of Ceylon">Bank of Ceylon</option>
                    <option value="Commercial Bank of Ceylon">Commercial Bank of Ceylon</option>
                    <option value="People's Bank">People's Bank</option>
                    <option value="Hatton National Bank">Hatton National Bank</option>
                    <option value="Sampath Bank">Sampath Bank</option>
                    <option value="National Development Bank">National Development Bank</option>
                    <option value="Nations Trust Bank">Nations Trust Bank</option>
                    <option value="Standard Chartered Bank">Standard Chartered Bank</option>
                    <option value="HSBC Sri Lanka">HSBC Sri Lanka</option>
                    <option value="Union Bank of Colombo">Union Bank of Colombo</option>
                    <option value="Pan Asia Bank">Pan Asia Bank</option>
                    <option value="Amana Bank">Amana Bank</option>
                    <option value="Seylan Bank">Seylan Bank</option>
                    <option value="DFCC Bank">DFCC Bank</option>
                    <option value="Citizens Development Bank">Citizens Development Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Branch</label>
                  <select
                    value={supplierForm.bankDetails.branch}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        bankDetails: { ...supplierForm.bankDetails, branch: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Branch</option>
                    <option value="Colombo Main">Colombo Main</option>
                    <option value="Colombo 02">Colombo 02</option>
                    <option value="Colombo 03">Colombo 03</option>
                    <option value="Colombo 04">Colombo 04</option>
                    <option value="Colombo 05">Colombo 05</option>
                    <option value="Colombo 07">Colombo 07</option>
                    <option value="Colombo 10">Colombo 10</option>
                    <option value="Colombo 12">Colombo 12</option>
                    <option value="Colombo 15">Colombo 15</option>
                    <option value="Kandy Main">Kandy Main</option>
                    <option value="Galle Main">Galle Main</option>
                    <option value="Jaffna Main">Jaffna Main</option>
                    <option value="Matara Main">Matara Main</option>
                    <option value="Negombo Main">Negombo Main</option>
                    <option value="Kurunegala Main">Kurunegala Main</option>
                    <option value="Anuradhapura Main">Anuradhapura Main</option>
                    <option value="Ratnapura Main">Ratnapura Main</option>
                    <option value="Batticaloa Main">Batticaloa Main</option>
                    <option value="Trincomalee Main">Trincomalee Main</option>
                    <option value="Badulla Main">Badulla Main</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.bankDetails.accountNumber}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      bankDetails: { ...supplierForm.bankDetails, accountNumber: e.target.value },
                    })
                  }
                  placeholder="Enter account number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Status</label>
                <select
                  value={supplierForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.value === 'active' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">🔴 Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditMode(false);
                    setSelectedSupplier(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isEditMode && selectedSupplier) {
                      // Reset to selected supplier values
                      setSupplierForm({
                        name: selectedSupplier.name,
                        contactPerson: selectedSupplier.contactPerson,
                        phone: selectedSupplier.phone,
                        email: selectedSupplier.email,
                        address: selectedSupplier.address || { street: '', city: '' },
                        category: selectedSupplier.category || 'Auto Spare Parts',
                        isActive: selectedSupplier.isActive,
                        bankDetails: selectedSupplier.bankDetails || { bankName: '', branch: '', accountNumber: '' },
                      });
                    } else {
                      // Reset to empty form
                      setSupplierForm({
                        name: '',
                        contactPerson: '',
                        phone: '',
                        email: '',
                        address: {
                          street: '',
                          city: '',
                        },
                        category: 'Auto Spare Parts',
                        isActive: true,
                        bankDetails: {
                          bankName: '',
                          branch: '',
                          accountNumber: '',
                        },
                      });
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  {isEditMode ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Details Drawer */}
      {isDetailsDrawerOpen && supplierDetails && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsDetailsDrawerOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Supplier Details</h2>
            </div>

            {/* Supplier Header */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
                  🚚
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{supplierDetails.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{supplierDetails.supplierId}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  supplierDetails.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  🟢 {supplierDetails.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Contact Person</span>
                <span className="text-xs font-semibold text-slate-900">{supplierDetails.contactPerson || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Phone</span>
                <span className="text-xs font-semibold text-slate-900">{formatPhone(supplierDetails.phone)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Email</span>
                <span className="text-xs font-semibold text-slate-900">{supplierDetails.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">Address</span>
                <span className="text-xs font-semibold text-slate-900">
                  {supplierDetails.address?.street || ''}, {supplierDetails.address?.city || ''}
                </span>
              </div>
            </div>

            {/* Bank Details */}
            {supplierDetails.bankDetails?.bankName && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Banking Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-600">Bank</span>
                    <span className="text-xs font-semibold text-slate-900">{supplierDetails.bankDetails.bankName}</span>
                  </div>
                  {supplierDetails.bankDetails.branch && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-slate-600">Branch</span>
                      <span className="text-xs font-semibold text-slate-900">{supplierDetails.bankDetails.branch}</span>
                    </div>
                  )}
                  {supplierDetails.bankDetails.accountNumber && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-slate-600">Account Number</span>
                      <span className="text-xs font-semibold text-slate-900 font-mono">{supplierDetails.bankDetails.accountNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Procurement Summary */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Procurement Summary</h4>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500">No purchase data available</p>
                <p className="text-[10px] text-slate-400 mt-1">Purchase order system not yet implemented</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsDetailsDrawerOpen(false);
                  handleEditSupplier(supplierDetails);
                }}
                className="flex-1 px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-bold transition-all"
              >
                [ Edit Supplier ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Details Drawer */}
      {isPODetailsDrawerOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsPODetailsDrawerOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Purchase Order Details</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPOStatusColor(selectedPO.status)}`}>
                {selectedPO.status === 'partially_received' ? 'Partial' : selectedPO.status.charAt(0).toUpperCase() + selectedPO.status.slice(1)}
              </span>
            </div>

            {/* PO Header */}
            <div className="mb-6 bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">PO Number</p>
                  <p className="text-sm font-bold text-slate-900 font-mono">{selectedPO.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">PO Date</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedPO.orderDate, 'DD/MM/YYYY')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Supplier</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedPO.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Expected Delivery</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedPO.expectedDeliveryDate, 'DD/MM/YYYY')}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Items</h4>
              <div className="space-y-2">
                {selectedPO.items && selectedPO.items.map((item: any, index: number) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{item.itemName}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatLKR(item.unitPrice)}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{formatLKR(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mb-6 bg-slate-50 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Subtotal</span>
                  <span className="text-sm font-semibold text-slate-900">{formatLKR(selectedPO.subtotal)}</span>
                </div>
                {selectedPO.discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Discount</span>
                    <span className="text-sm font-semibold text-slate-900">-{formatLKR(selectedPO.discount)}</span>
                  </div>
                )}
                {selectedPO.tax > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Tax</span>
                    <span className="text-sm font-semibold text-slate-900">{formatLKR(selectedPO.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-300">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-brand-600">{formatLKR(selectedPO.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedPO.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Notes</h4>
                <p className="text-xs text-slate-600">{selectedPO.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsPODetailsDrawerOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRN Details Drawer */}
      {isGRNDetailsDrawerOpen && selectedGRN && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsGRNDetailsDrawerOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Goods Receiving Note Details</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getGRNStatusColor(selectedGRN.status)}`}>
                {selectedGRN.status.charAt(0).toUpperCase() + selectedGRN.status.slice(1)}
              </span>
            </div>

            {/* GRN Header */}
            <div className="mb-6 bg-slate-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">GRN Number</p>
                  <p className="text-sm font-bold text-slate-900 font-mono">{selectedGRN.grnNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">PO Number</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono">{selectedGRN.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Supplier</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedGRN.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Received Date</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedGRN.receivedDate, 'DD/MM/YYYY')}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Items</h4>
              <div className="space-y-2">
                {selectedGRN.items && selectedGRN.items.map((item: any, index: number) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{item.itemName}</p>
                        <p className="text-xs text-slate-500">Received: {item.receivedQuantity} × {formatLKR(item.unitPrice)}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{formatLKR(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mb-6 bg-slate-50 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Subtotal</span>
                  <span className="text-sm font-semibold text-slate-900">{formatLKR(selectedGRN.subtotal)}</span>
                </div>
                {selectedGRN.discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Discount</span>
                    <span className="text-sm font-semibold text-slate-900">-{formatLKR(selectedGRN.discount)}</span>
                  </div>
                )}
                {selectedGRN.tax > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Tax</span>
                    <span className="text-sm font-semibold text-slate-900">{formatLKR(selectedGRN.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-300">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-brand-600">{formatLKR(selectedGRN.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedGRN.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Notes</h4>
                <p className="text-xs text-slate-600">{selectedGRN.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsGRNDetailsDrawerOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Purchase Order</h3>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePurchaseOrder} className="p-6 space-y-6">
              {/* PO Number */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">PO Number</label>
                <div className="flex">
                  <input
                    type="text"
                    value="PO-*****"
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-mono"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Supplier *</label>
                <select
                  required
                  value={poForm.supplier}
                  onChange={(e) => setPOForm({ ...poForm, supplier: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} ({supplier.supplierId})
                    </option>
                  ))}
                </select>
              </div>

              {/* PO Date */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">PO Date</label>
                <div className="flex">
                  <input
                    type="text"
                    value={formatDate(new Date(), 'DD/MM/YYYY')}
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">Today</p>
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Expected Delivery *</label>
                <input
                  type="date"
                  required
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) => setPOForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900">Items</h4>
                  <button
                    type="button"
                    onClick={handleAddPOItem}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    Add Item
                  </button>
                </div>

                {poForm.items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No items added. Click "Add Item" to add items to the purchase order.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {poForm.items.map((item, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-500">Item {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePOItem(index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-slate-600 mb-1 text-xs">Item *</label>
                            <select
                              required
                              value={item.item}
                              onChange={(e) => handlePOItemChange(index, 'item', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            >
                              <option value="">Select Item</option>
                              {inventoryItems.map((invItem) => (
                                <option key={invItem._id} value={invItem._id}>
                                  {invItem.itemName} - {invItem.itemCode}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Available Stock</label>
                            <input
                              type="text"
                              value={item.availableStock}
                              disabled
                              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Required Qty *</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handlePOItemChange(index, 'quantity', parseInt(e.target.value))}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Unit Price</label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handlePOItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-slate-600 mb-1 text-xs">Line Total</label>
                            <input
                              type="text"
                              value={formatLKR(item.total)}
                              disabled
                              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-not-allowed font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              {poForm.items.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Sub Total</span>
                      <span className="text-sm font-semibold text-slate-900">{formatLKR(calculatePOTotals().subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Discount</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={poForm.discount}
                          onChange={(e) => setPOForm({ ...poForm, discount: parseFloat(e.target.value) })}
                          className="w-24 p-1 bg-white border border-slate-200 rounded text-xs text-right"
                        />
                        <span className="text-sm font-semibold text-slate-900">{formatLKR(poForm.discount)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-sm font-bold text-slate-900">Grand Total</span>
                      <span className="text-lg font-bold text-brand-600">{formatLKR(calculatePOTotals().grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Status</label>
                <select
                  value={poForm.status}
                  onChange={(e) => setPOForm({ ...poForm, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="pending">🟡 Pending</option>
                  <option value="partially_received">🔵 Partial</option>
                  <option value="completed">🟢 Completed</option>
                  <option value="cancelled">🔴 Cancelled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Notes</label>
                <textarea
                  value={poForm.notes}
                  onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                  placeholder="Additional notes for this purchase order"
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Terms */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Terms</label>
                <textarea
                  value={poForm.terms}
                  onChange={(e) => setPOForm({ ...poForm, terms: e.target.value })}
                  placeholder="Payment terms and conditions"
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPOForm({
                      supplier: '',
                      expectedDeliveryDate: '',
                      items: [],
                      discount: 0,
                      notes: '',
                      terms: '',
                      status: 'pending',
                    });
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create GRN Modal */}
      {isGRNModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Goods Receiving Note</h3>
              <button
                onClick={() => setIsGRNModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGRN} className="p-6 space-y-6">
              {/* GRN Number */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">GRN Number</label>
                <div className="flex">
                  <input
                    type="text"
                    value="GRN-*****"
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-mono"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
              </div>

              {/* PO Number */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">PO Number *</label>
                <select
                  required
                  value={grnForm.purchaseOrder}
                  onChange={(e) => handleSelectPurchaseOrder(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Purchase Order</option>
                  {purchaseOrders.filter(po => po.status === 'pending' || po.status === 'partially_received').map((po) => (
                    <option key={po._id} value={po._id}>
                      {po.poNumber} - {po.supplierName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier (Auto-filled) */}
              {grnForm.purchaseOrder && (
                <div>
                  <label className="block text-slate-700 mb-1 font-bold text-sm">Supplier</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={purchaseOrders.find(po => po._id === grnForm.purchaseOrder)?.supplierName || ''}
                      disabled
                      className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed"
                    />
                    <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                      🔒
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
                </div>
              )}

              {/* Received Date */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Received Date</label>
                <input
                  type="date"
                  value={formatDate(new Date(), 'YYYY-MM-DD')}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm cursor-not-allowed"
                />
              </div>

              {/* Items Section */}
              {grnForm.items.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-4">Items</h4>

                  <div className="space-y-3">
                    {grnForm.items.map((item, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="grid grid-cols-6 gap-3">
                          <div className="col-span-2">
                            <label className="block text-slate-600 mb-1 text-xs">Item</label>
                            <input
                              type="text"
                              value={item.itemName}
                              disabled
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Ordered Qty</label>
                            <input
                              type="text"
                              value={item.orderedQuantity}
                              disabled
                              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Already Received</label>
                            <input
                              type="text"
                              value={item.alreadyReceivedQuantity}
                              disabled
                              className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs cursor-not-allowed text-blue-700 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Remaining to Receive</label>
                            <input
                              type="text"
                              value={item.remainingQuantity}
                              disabled
                              className="w-full p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs cursor-not-allowed text-amber-700 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Receiving Now *</label>
                            <input
                              type="number"
                              min="0"
                              max={item.remainingQuantity}
                              value={item.receivedQuantity}
                              onChange={(e) => handleGRNItemChange(index, 'receivedQuantity', parseInt(e.target.value))}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-slate-600 mb-1 text-xs">Status</label>
                            <input
                              type="text"
                              value={
                                item.receivedQuantity === 0 ? 'Pending' :
                                item.receivedQuantity >= item.remainingQuantity ? 'Complete' : 'Partial'
                              }
                              disabled
                              className={`w-full p-2 border border-slate-200 rounded-lg text-xs cursor-not-allowed ${
                                item.receivedQuantity === 0 ? 'bg-gray-100 text-gray-600' :
                                item.receivedQuantity >= item.remainingQuantity ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}
                            />
                          </div>

                          <div className="col-span-4">
                            <label className="block text-slate-600 mb-1 text-xs">Unit Price</label>
                            <input
                              type="text"
                              value={formatLKR(item.unitPrice)}
                              disabled
                              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-not-allowed font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Status */}
              {grnForm.items.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Overall Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGRNStatusColor(calculateGRNStatus())}`}>
                      {calculateGRNStatus().charAt(0).toUpperCase() + calculateGRNStatus().slice(1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Notes</label>
                <textarea
                  value={grnForm.notes}
                  onChange={(e) => setGRNForm({ ...grnForm, notes: e.target.value })}
                  placeholder="Additional notes for this GRN"
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  Save GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Purchase Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{isReturnEditMode ? 'Edit Purchase Return' : 'Create Purchase Return'}</h3>
              <button
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setIsReturnEditMode(false);
                  setSelectedReturn(null);
                  setReturnForm({
                    supplier: '',
                    grn: '',
                    items: [],
                    returnReason: '',
                    notes: '',
                  });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={isReturnEditMode ? handleUpdateReturn : handleCreatePurchaseReturn} className="p-6 space-y-6">
              {/* Only show form fields if in edit mode or creating new */}
              {!selectedReturn || isReturnEditMode ? (
                <>
              {/* Return Number */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Return Number</label>
                <div className="flex">
                  <input
                    type="text"
                    value={isReturnEditMode ? selectedReturn?.returnNumber || '' : 'RET-*****'}
                    disabled
                    className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-mono"
                  />
                  <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                    🔒
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{isReturnEditMode ? 'Read Only' : 'Auto Generated'}</p>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Supplier *</label>
                <select
                  required
                  value={returnForm.supplier}
                  onChange={(e) => setReturnForm({ ...returnForm, supplier: e.target.value })}
                  disabled={selectedReturn && !isReturnEditMode}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* GRN Number */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">GRN Number *</label>
                <select
                  required
                  value={returnForm.grn}
                  onChange={(e) => handleSelectGRN(e.target.value)}
                  disabled={selectedReturn && !isReturnEditMode}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select GRN</option>
                  {grns.map((grn) => (
                    <option key={grn._id} value={grn._id}>
                      {grn.grnNumber} - {grn.supplierName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Return Reason */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Return Reason *</label>
                <select
                  required
                  value={returnForm.returnReason}
                  onChange={(e) => setReturnForm({ ...returnForm, returnReason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Reason</option>
                  <option value="damaged">Damaged Items</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="defective">Defective Item</option>
                  <option value="excess_quantity">Excess Quantity</option>
                  <option value="expired">Expired Item</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Items Section */}
              {returnForm.items.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-4">Items</h4>

                  <div className="space-y-3">
                    {returnForm.items.map((item, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="col-span-2">
                            <label className="block text-slate-600 mb-1 text-xs">Item</label>
                            <input
                              type="text"
                              value={item.itemName}
                              disabled
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Received Qty</label>
                            <input
                              type="text"
                              value={item.receivedQuantity}
                              disabled
                              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-600 mb-1 text-xs">Return Qty *</label>
                            <input
                              type="number"
                              min="0"
                              max={item.receivedQuantity}
                              value={item.returnedQuantity}
                              onChange={(e) => handleReturnItemChange(index, 'returnedQuantity', parseInt(e.target.value))}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-slate-600 mb-1 text-xs">Unit Price</label>
                            <input
                              type="text"
                              value={formatLKR(item.unitPrice)}
                              disabled
                              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-not-allowed font-mono"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-slate-600 mb-1 text-xs">Refund Amount</label>
                            <input
                              type="text"
                              value={formatLKR(item.refundAmount)}
                              disabled
                              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs cursor-not-allowed font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Refund */}
              {returnForm.items.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Refund Amount</span>
                    <span className="text-lg font-bold text-brand-600">{formatLKR(calculateTotalRefund())}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Auto Calculated</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-sm">Notes</label>
                <textarea
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                  placeholder="Additional notes for this return"
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsReturnModalOpen(false);
                    setIsReturnEditMode(false);
                    setSelectedReturn(null);
                    setReturnForm({
                      supplier: '',
                      grn: '',
                      items: [],
                      returnReason: '',
                      notes: '',
                    });
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  {isReturnEditMode ? 'Update Return' : 'Save Return'}
                </button>
              </div>
                </>
              ) : (
                /* View Mode - Display Return Details */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Return Number</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700">
                        {selectedReturn?.returnNumber}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Return Date</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {formatDate(selectedReturn?.returnDate, 'DD/MM/YYYY')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Supplier</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {selectedReturn?.supplierName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">GRN Number</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {selectedReturn?.grnNumber}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Total Refund</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
                        {formatLKR(selectedReturn?.totalRefund)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Status</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getReturnStatusColor(selectedReturn?.status)}`}>
                          {selectedReturn?.status?.charAt(0).toUpperCase() + selectedReturn?.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedReturn?.items && selectedReturn.items.length > 0 && (
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Returned Items</label>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-slate-700">Item</th>
                              <th className="px-4 py-2 text-right font-semibold text-slate-700">Qty</th>
                              <th className="px-4 py-2 text-right font-semibold text-slate-700">Unit Price</th>
                              <th className="px-4 py-2 text-right font-semibold text-slate-700">Refund</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedReturn.items.map((item: any, idx: number) => (
                              <tr key={idx} className="border-t border-slate-200">
                                <td className="px-4 py-2 text-slate-700">{item.itemName}</td>
                                <td className="px-4 py-2 text-right text-slate-700">{item.returnedQuantity}</td>
                                <td className="px-4 py-2 text-right text-slate-700">{formatLKR(item.unitPrice)}</td>
                                <td className="px-4 py-2 text-right text-slate-700">{formatLKR(item.refundAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {selectedReturn?.returnReason && (
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Return Reason</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 capitalize">
                        {selectedReturn.returnReason.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  
                  {selectedReturn?.notes && (
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Notes</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {selectedReturn.notes}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleEditReturn(selectedReturn)}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Edit Return
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReturnModalOpen(false);
                        setSelectedReturn(null);
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Record Supplier Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{isPaymentEditMode ? 'Edit Supplier Payment' : 'Record Supplier Payment'}</h3>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setIsPaymentEditMode(false);
                  setSelectedPayment(null);
                  setPaymentForm({
                    supplier: '',
                    purchaseOrder: '',
                    grn: '',
                    outstandingBalance: 0,
                    invoiceNumber: '',
                    amount: 0,
                    paymentMethod: 'cash',
                    referenceNumber: '',
                    notes: '',
                  });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={isPaymentEditMode ? handleUpdatePayment : handleCreateSupplierPayment} className="p-6 space-y-6">
              {/* Only show form fields if in edit mode or creating new */}
              {!selectedPayment || isPaymentEditMode ? (
                <>
                  {/* Payment ID */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Payment ID</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={isPaymentEditMode ? selectedPayment?.paymentId || '' : 'PAY-*****'}
                        disabled
                        className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-mono"
                      />
                      <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                        🔒
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{isPaymentEditMode ? 'Read Only' : 'Auto Generated'}</p>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Supplier *</label>
                    <select
                      required
                      value={paymentForm.supplier}
                      onChange={(e) => handleSelectSupplier(e.target.value)}
                      disabled={selectedPayment && !isPaymentEditMode}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Outstanding Balance */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Outstanding Balance</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={formatLKR(paymentForm.outstandingBalance)}
                        disabled
                        className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-l-xl text-slate-500 cursor-not-allowed font-mono"
                      />
                      <div className="px-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl flex items-center text-slate-400">
                        🔒
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Auto Filled</p>
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Invoice Number *</label>
                    <input
                      type="text"
                      required
                      value={paymentForm.invoiceNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, invoiceNumber: e.target.value })}
                      placeholder="Enter invoice number"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Payment Amount *</label>
                    <div className="flex">
                      <div className="px-3 bg-slate-100 border border-slate-200 rounded-l-xl flex items-center text-slate-600 font-bold text-sm">
                        LKR
                      </div>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="flex-1 p-2.5 bg-slate-50 border border-l-0 border-slate-200 rounded-r-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Payment Method *</label>
                    <select
                      required
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">Card</option>
                    </select>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Reference Number</label>
                    <input
                      type="text"
                      value={paymentForm.referenceNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                      placeholder="Enter reference number (optional)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  {/* Payment Status */}
                  {paymentForm.amount > 0 && calculateRemainingBalance() <= 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <span className="text-sm font-semibold text-green-900">Status:</span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">🟢 Paid</span>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold text-sm">Notes</label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="Additional notes for this payment"
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        setIsPaymentEditMode(false);
                        setSelectedPayment(null);
                        setPaymentForm({
                          supplier: '',
                          purchaseOrder: '',
                          grn: '',
                          outstandingBalance: 0,
                          invoiceNumber: '',
                          amount: 0,
                          paymentMethod: 'cash',
                          referenceNumber: '',
                          notes: '',
                        });
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentForm({
                        supplier: '',
                        purchaseOrder: '',
                        grn: '',
                        outstandingBalance: 0,
                        invoiceNumber: '',
                        amount: 0,
                        paymentMethod: 'cash',
                        referenceNumber: '',
                        notes: '',
                      })}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                    >
                      {isPaymentEditMode ? 'Update Payment' : 'Record Payment'}
                    </button>
                  </div>
                </>
              ) : (
                /* View Mode - Display Payment Details */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Payment ID</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700">
                        {selectedPayment?.paymentId}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Payment Date</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {formatDate(selectedPayment?.paymentDate, 'DD/MM/YYYY')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Supplier</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {selectedPayment?.supplierName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Invoice Number</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {selectedPayment?.invoiceNumber || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Amount</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
                        {formatLKR(selectedPayment?.amount)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Payment Method</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 capitalize">
                        {selectedPayment?.paymentMethod}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Reference Number</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {selectedPayment?.referenceNumber || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Status</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedPayment?.status)}`}>
                          {selectedPayment?.status?.charAt(0).toUpperCase() + selectedPayment?.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedPayment?.notes && (
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold text-sm">Notes</label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {selectedPayment?.notes}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleEditPayment(selectedPayment)}
                      className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Edit Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        setSelectedPayment(null);
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
