import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { purchaseReturnApi } from '../../api/purchaseReturnApi';
import { supplierApi } from '../../api/supplierApi';
import { formatLKR, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { Search, Plus, Calendar, ArrowLeft, Package, DollarSign, Calendar as CalendarIcon, FileText, Check, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export const PurchaseReturnsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [returns, setReturns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (id) {
      fetchReturnDetails();
    } else {
      fetchData();
    }
  }, [id, searchTerm, selectedSupplier, selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedSupplier) params.supplier = selectedSupplier;
      if (selectedDate) params.startDate = selectedDate;

      const [returnsRes, suppliersRes] = await Promise.all([
        purchaseReturnApi.getPurchaseReturns(params),
        supplierApi.getAllSuppliers()
      ]);

      if (returnsRes.success) {
        setReturns(returnsRes.data);
      }

      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data);
      }
    } catch (error) {
      toast.error('Failed to load purchase returns data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReturnDetails = async () => {
    setIsLoading(true);
    try {
      const res = await purchaseReturnApi.getPurchaseReturnById(id);
      if (res.success) {
        setSelectedReturn(res.data);
      } else {
        toast.error('Failed to load purchase return details');
        navigate('/admin/purchase-returns');
      }
    } catch (error) {
      toast.error('Failed to load purchase return details');
      navigate('/admin/purchase-returns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReturn = () => {
    navigate('/admin/purchase-returns/create');
  };

  const handleViewReturn = (id: string) => {
    navigate(`/admin/purchase-returns/${id}`);
  };

  const handleApproveReturn = async (returnId: string) => {
    try {
      const res = await purchaseReturnApi.approvePurchaseReturn(returnId);
      if (res.success) {
        toast.success('Purchase return approved successfully');
        if (id) {
          fetchReturnDetails();
        } else {
          fetchData();
        }
      } else {
        toast.error(res.message || 'Failed to approve purchase return');
      }
    } catch (error) {
      toast.error('Failed to approve purchase return');
    }
  };

  const handleRejectReturn = async (returnId: string) => {
    try {
      const res = await purchaseReturnApi.rejectPurchaseReturn(returnId);
      if (res.success) {
        toast.success('Purchase return rejected successfully');
        if (id) {
          fetchReturnDetails();
        } else {
          fetchData();
        }
      } else {
        toast.error(res.message || 'Failed to reject purchase return');
      }
    } catch (error) {
      toast.error('Failed to reject purchase return');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Detail View
  if (id && selectedReturn) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/purchase-returns')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchase Return Details</h1>
              <p className="text-sm text-gray-500">{selectedReturn.returnNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedReturn.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApproveReturn(selectedReturn._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleRejectReturn(selectedReturn._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Return Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Return Number</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedReturn.returnNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">GRN Number</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedReturn.grnNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Supplier</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedReturn.supplierName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Return Date</label>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedReturn.returnDate, 'DD MMM YYYY')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Return Reason</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedReturn.returnReason}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(selectedReturn.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
                    {selectedReturn.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || selectedReturn.status}
                  </span>
                </div>
              </div>
              {selectedReturn.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                  <p className="text-sm text-gray-900">{selectedReturn.notes}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Returned Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedReturn.items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                            {item.partNumber && (
                              <p className="text-xs text-gray-500">{item.partNumber}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.returnedQuantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatLKR(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatLKR(item.refundAmount)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-900 capitalize">{item.itemReason?.replace(/_/g, ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Total Refund */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Refund Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Refund</span>
                  <span className="text-lg font-bold text-gray-900">{formatLKR(selectedReturn.totalRefund)}</span>
                </div>
                {selectedReturn.refundMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Refund Method</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{selectedReturn.refundMethod.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Info */}
            {selectedReturn.approvedBy && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved By</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedReturn.approvedBy.firstName} {selectedReturn.approvedBy.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved At</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedReturn.approvedAt ? formatDate(selectedReturn.approvedAt, 'DD MMM YYYY HH:mm') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Created By */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Created By</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created By</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedReturn.createdBy?.firstName} {selectedReturn.createdBy?.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created At</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(selectedReturn.createdAt, 'DD MMM YYYY HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Returns</h1>
        </div>
        <button
          onClick={handleCreateReturn}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Return
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search return..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Supplier Filter */}
          <div className="min-w-[200px]">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="min-w-[180px]">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {returns.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600">No purchase returns found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first purchase return to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GRN Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returns.map((returnItem) => (
                <tr 
                  key={returnItem._id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewReturn(returnItem._id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{returnItem.returnNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {returnItem.supplierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {returnItem.grnNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {returnItem.returnReason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {formatLKR(returnItem.totalRefund)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(returnItem.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
                      {returnItem.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || returnItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewReturn(returnItem._id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      {returnItem.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveReturn(returnItem._id);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectReturn(returnItem._id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};