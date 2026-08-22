import React, { useEffect, useState } from 'react';
import { serviceApi } from '../../api/serviceApi';
import { formatLKR, parseNumberInput, formatInputValue } from '../../utils/formatters';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Clock, Search, Plus, Eye, Edit, Power, Trash2, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'all' | 'active' | 'inactive';

interface Service {
  _id: string;
  serviceCode: string;
  name: string;
  category?: { _id: string; name: string };
  description: string;
  estimatedDurationMinutes: number;
  laborCharge: number;
  baseServicePrice: number;
  taxRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Tabs and filters
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals and drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    estimatedDurationMinutes: 60,
    durationUnit: 'minutes' as 'minutes' | 'hours',
    laborCharge: 0,
    baseServicePrice: 0,
    taxRate: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const status = activeTab === 'all' ? '' : activeTab;
      const svcRes = await serviceApi.getServices({
        page,
        limit: 10,
        status,
        search: searchQuery || undefined,
        sortBy,
        sortOrder,
      });
      if (svcRes.success) {
        setServices(svcRes.data);
        setTotalPages(svcRes.pagination.pages);
        setTotalRecords(svcRes.pagination.total);
      }
    } catch (error) {
      console.error('Failed to load services data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, activeTab, searchQuery, sortBy, sortOrder]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const durationInMinutes = serviceForm.durationUnit === 'hours' 
        ? serviceForm.estimatedDurationMinutes * 60 
        : serviceForm.estimatedDurationMinutes;

      const res = await serviceApi.createService({
        ...serviceForm,
        estimatedDurationMinutes: durationInMinutes,
      });
      if (res.success) {
        toast.success('Service created successfully');
        setIsAddModalOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating service');
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    try {
      const durationInMinutes = serviceForm.durationUnit === 'hours' 
        ? serviceForm.estimatedDurationMinutes * 60 
        : serviceForm.estimatedDurationMinutes;

      const res = await serviceApi.updateService(selectedService._id, {
        ...serviceForm,
        estimatedDurationMinutes: durationInMinutes,
      });
      if (res.success) {
        toast.success('Service updated successfully');
        setIsEditModalOpen(false);
        setSelectedService(null);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating service');
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      const res = await serviceApi.deleteService(selectedService._id);
      if (res.success) {
        toast.success('Service deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedService(null);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting service');
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const res = await serviceApi.toggleServiceStatus(service._id);
      if (res.success) {
        toast.success(`Service ${res.data.status} successfully`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error toggling service status');
    }
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      durationUnit: service.estimatedDurationMinutes >= 60 ? 'hours' : 'minutes',
      laborCharge: service.laborCharge,
      baseServicePrice: service.baseServicePrice,
      taxRate: service.taxRate,
      status: service.status,
    });
    setIsEditModalOpen(true);
  };

  const openViewDrawer = (service: Service) => {
    setSelectedService(service);
    setIsViewDrawerOpen(true);
  };

  const openDeleteModal = (service: Service) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setServiceForm({
      name: '',
      description: '',
      estimatedDurationMinutes: 60,
      durationUnit: 'minutes',
      laborCharge: 0,
      baseServicePrice: 0,
      taxRate: 0,
      status: 'active',
    });
  };

  const calculateTotalPrice = () => {
    const subtotal = serviceForm.baseServicePrice + serviceForm.laborCharge;
    const tax = (subtotal * serviceForm.taxRate) / 100;
    return subtotal + tax;
  };

  const getDurationDisplay = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const getPaginationPages = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    // Show ellipsis if gap between page 1 and current page area
    if (page > 3) {
      pages.push('...');
    }

    // Show pages around current page
    const startPage = Math.max(2, page - 1);
    const endPage = Math.min(totalPages - 1, page + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Show ellipsis if gap between current page area and last page
    if (page < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Service Management</h2>
          <p className="text-sm text-slate-500">
            Manage service categories, pricing and service duration
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {(['all', 'active', 'inactive'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Services
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
        >
          <option value="createdAt">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="serviceCode">Sort by ID</option>
          <option value="baseServicePrice">Sort by Price</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Service ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Labor Charge
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tax
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No services found
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-slate-900">
                        {service.serviceCode}
                      </div>
                      <div className="text-xs text-slate-500">{service.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {getDurationDisplay(service.estimatedDurationMinutes)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {formatLKR(service.laborCharge)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {formatLKR(service.baseServicePrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {service.taxRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={service.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openViewDrawer(service)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => openEditModal(service)}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors group"
                          title="Edit Service"
                        >
                          <Edit className="w-4 h-4 text-slate-500 group-hover:text-amber-600" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(service)}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                          title={service.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4 text-slate-500 group-hover:text-green-600" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(service)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-slate-500 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages >= 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalRecords)} of {totalRecords} services
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Previous
              </button>
              {getPaginationPages().map((p, index) => (
                typeof p === 'number' ? (
                  <button
                    key={`${p}-${index}`}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      page === p
                        ? 'bg-brand-500 text-white'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ) : (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-1.5 text-sm font-medium text-slate-400"
                  >
                    {p}
                  </span>
                )
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add Service Category</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="space-y-6">
              {/* Service ID */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Category ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="Auto Generated"
                    disabled
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">System will generate ID in format SVC-00001</p>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="Full Service"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                  <textarea
                    required
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Complete vehicle inspection, oil change and general maintenance service."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Duration *</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    required
                    min="1"
                    value={serviceForm.estimatedDurationMinutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, estimatedDurationMinutes: Number(e.target.value) })}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <select
                    value={serviceForm.durationUnit}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationUnit: e.target.value as 'minutes' | 'hours' })}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-brand-700 mb-4 flex items-center gap-2">
                  💰 Pricing
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Labor Charge *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">LKR</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={formatInputValue(serviceForm.laborCharge)}
                        onChange={(e) => setServiceForm({ ...serviceForm, laborCharge: parseNumberInput(e.target.value) })}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Base Service Price *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">LKR</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={formatInputValue(serviceForm.baseServicePrice)}
                        onChange={(e) => setServiceForm({ ...serviceForm, baseServicePrice: parseNumberInput(e.target.value) })}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={formatInputValue(serviceForm.taxRate)}
                      onChange={(e) => setServiceForm({ ...serviceForm, taxRate: parseNumberInput(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Pricing Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Service Price</span>
                    <span className="font-medium">{formatLKR(serviceForm.baseServicePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Labor Charge</span>
                    <span className="font-medium">{formatLKR(serviceForm.laborCharge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax ({serviceForm.taxRate}%)</span>
                    <span className="font-medium">{formatLKR(((serviceForm.baseServicePrice + serviceForm.laborCharge) * serviceForm.taxRate) / 100)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                    <span>Estimated Customer Price</span>
                    <span className="text-brand-600">{formatLKR(calculateTotalPrice())}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={serviceForm.status}
                  onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">🔴 Inactive</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {isEditModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Edit Service Category — {selectedService.serviceCode}</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedService(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleEditService} className="space-y-6">
              {/* Service ID */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Category ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedService.serviceCode}
                    disabled
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                  <textarea
                    required
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Duration *</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    required
                    min="1"
                    value={serviceForm.estimatedDurationMinutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, estimatedDurationMinutes: Number(e.target.value) })}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <select
                    value={serviceForm.durationUnit}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationUnit: e.target.value as 'minutes' | 'hours' })}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-brand-700 mb-4 flex items-center gap-2">
                  💰 Pricing
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Labor Charge *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">LKR</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={formatInputValue(serviceForm.laborCharge)}
                        onChange={(e) => setServiceForm({ ...serviceForm, laborCharge: parseNumberInput(e.target.value) })}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Base Service Price *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">LKR</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={formatInputValue(serviceForm.baseServicePrice)}
                        onChange={(e) => setServiceForm({ ...serviceForm, baseServicePrice: parseNumberInput(e.target.value) })}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={formatInputValue(serviceForm.taxRate)}
                      onChange={(e) => setServiceForm({ ...serviceForm, taxRate: parseNumberInput(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Pricing Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Service Price</span>
                    <span className="font-medium">{formatLKR(serviceForm.baseServicePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Labor Charge</span>
                    <span className="font-medium">{formatLKR(serviceForm.laborCharge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax ({serviceForm.taxRate}%)</span>
                    <span className="font-medium">{formatLKR(((serviceForm.baseServicePrice + serviceForm.laborCharge) * serviceForm.taxRate) / 100)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                    <span>Estimated Customer Price</span>
                    <span className="text-brand-600">{formatLKR(calculateTotalPrice())}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={serviceForm.status}
                  onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">🔴 Inactive</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedService(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedService) openEditModal(selectedService);
                  }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20"
                >
                  Update Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Drawer */}
      {isViewDrawerOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Service Details</h3>
              <button
                onClick={() => {
                  setIsViewDrawerOpen(false);
                  setSelectedService(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-brand-100 rounded-xl">
                  <Clock className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedService.name}</h4>
                  <p className="text-sm font-mono text-slate-500">{selectedService.serviceCode}</p>
                  <StatusBadge status={selectedService.status} />
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-700 mb-1">Description</h5>
                <p className="text-sm text-slate-600">{selectedService.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Estimated Duration</h5>
                  <p className="text-sm font-medium text-slate-900">{getDurationDisplay(selectedService.estimatedDurationMinutes)}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Labor Charge</h5>
                  <p className="text-sm font-medium text-slate-900">{formatLKR(selectedService.laborCharge)}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Base Price</h5>
                  <p className="text-sm font-medium text-slate-900">{formatLKR(selectedService.baseServicePrice)}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Tax Rate</h5>
                  <p className="text-sm font-medium text-slate-900">{selectedService.taxRate}%</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Customer Price</span>
                  <span className="text-lg font-bold text-brand-600">
                    {formatLKR(selectedService.baseServicePrice + selectedService.laborCharge + ((selectedService.baseServicePrice + selectedService.laborCharge) * selectedService.taxRate) / 100)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Created</h5>
                  <p className="text-sm text-slate-600">{new Date(selectedService.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Last Updated</h5>
                  <p className="text-sm text-slate-600">{new Date(selectedService.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsViewDrawerOpen(false);
                  openEditModal(selectedService);
                }}
                className="w-full px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20"
              >
                Edit Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Delete Service Category?</h3>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedService(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Are you sure you want to delete:</p>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Clock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-900">{selectedService.serviceCode}</p>
                    <p className="text-sm text-slate-600">{selectedService.name}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">This action cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedService(null);
                  }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
                >
                  Delete Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};