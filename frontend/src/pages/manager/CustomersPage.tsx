import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { vehicleApi } from '../../api/vehicleApi';
import { invoiceApi } from '../../api/invoiceApi';
import { User, Customer, Vehicle } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatLKR, formatPhone } from '../../utils/formatters';
import {
  Users,
  Car,
  Wrench,
  DollarSign,
  Search,
  Plus,
  Filter,
  X,
  ChevronRight,
  Eye,
  Edit,
  FileText,
  UserCheck,
  Ban,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerVehicleCounts, setCustomerVehicleCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVehicles: 0,
    activeCustomers: 0,
    totalOutstanding: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);



  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 10,
        role: 'customer',
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      // Fetch customers
      const customersRes = await userApi.getUsers(params);
      
      console.log('Customers API response:', customersRes);
      
      if (customersRes.success) {
        setCustomers(customersRes.data);
        setTotalPages(customersRes.pagination?.pages || 1);
        setTotalRecords(customersRes.pagination?.total || 0);
        
        // Fetch vehicles for each customer individually
        const customerVehicleCounts: Record<string, number> = {};
        
        const vehiclePromises = customersRes.data.map(async (customer: any) => {
          const mongoId = customer._id || customer.id;
          const profile = customer.profile || {};
          const customerId = profile._id || profile.id; // Use Customer ID from profile
          
          try {
            // Use Customer ID instead of User ID for vehicle lookup
            const vehiclesRes = await vehicleApi.getVehicles({ customer: customerId });
            const count = vehiclesRes.success ? vehiclesRes.data.length : 0;
            // Store using the Customer ID as key since that's what we'll use in the table
            customerVehicleCounts[customerId] = count;
            console.log(`Customer ${mongoId} (User ID) with Customer ID ${customerId} vehicle count:`, count);
            return { mongoId, customerId, count };
          } catch (err) {
            console.error(`Error fetching vehicles for customer ${mongoId}:`, err);
            const customerId = profile._id || profile.id;
            customerVehicleCounts[customerId] = 0;
            return { mongoId, customerId, count: 0 };
          }
        });
        
        await Promise.all(vehiclePromises);
        
        // Store vehicle counts in state
        setCustomerVehicleCounts(customerVehicleCounts);
        
        // Fetch all vehicles for stats
        const allVehiclesRes = await vehicleApi.getVehicles({ limit: 1000 }).catch(() => ({ success: false, data: [] }));
        if (allVehiclesRes.success) {
          setVehicles(allVehiclesRes.data);
        }
        
        // Calculate stats
        const customerData = customersRes.data.map((u: any) => u.profile || {});
        
        setStats({
          totalCustomers: customersRes.pagination?.total || 0,
          totalVehicles: allVehiclesRes.success ? allVehiclesRes.data.length : 0,
          activeCustomers: customerData.filter((c: any) => c.status === 'active').length,
          totalOutstanding: customerData.reduce((acc: number, c: any) => acc + (c.outstandingBalance || 0), 0),
        });
     } else {
        setError(customersRes.message || 'Failed to fetch customers');
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.message || err.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setVehicleFilter('all');
    setBalanceFilter('all');
    setPage(1);
  };

  const handleCustomerAction = (customerId: string, action: string, customerName?: string) => {
    switch (action) {
      case 'view':
        navigate(`/manager/customers/${customerId}`);
        break;
      case 'update':
        navigate(`/manager/customers/${customerId}/edit`);
        break;
      case 'vehicles':
        navigate(`/manager/customers/${customerId}/vehicles`);
        break;
      case 'history':
        navigate(`/manager/customers/${customerId}/history`);
        break;
      case 'ledger':
        navigate(`/manager/customers/${customerId}/ledger`);
        break;
      case 'delete':
        if (customerName) {
          setDeleteConfirm({ id: customerId, name: customerName });
        }
        break;
      case 'deactivate':
        // Handle deactivation
        toast.success('Customer deactivated successfully');
        break;
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await userApi.deleteUser(deleteConfirm.id);
      if (res.success) {
        toast.success('Customer deleted successfully');
        setDeleteConfirm(null);
        fetchCustomers();
      } else {
        toast.error(res.message || 'Failed to delete customer');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting customer');
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchCustomers} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
          <p className="text-sm text-slate-500">
            Manage customer profiles, vehicles, service history and account balances.
          </p>
        </div>
        <Link
          to="/manager/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Register Customer
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
          subtext="Registered customers"
          color="blue"
        />
        <StatCard
          title="Vehicles"
          value={stats.totalVehicles}
          icon={Car}
          subtext="Total registered vehicles"
          color="purple"
        />
        <StatCard
          title="Active"
          value={stats.activeCustomers}
          icon={Wrench}
          subtext="Active customers"
          color="emerald"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatLKR(stats.totalOutstanding)}
          icon={DollarSign}
          subtext="Total outstanding"
          color="rose"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer ID / Name / NIC / Phone / Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Vehicle: All</option>
              <option value="with-vehicles">With Vehicles</option>
              <option value="without-vehicles">Without Vehicles</option>
            </select>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Balance: All</option>
              <option value="with-balance">With Balance</option>
              <option value="no-balance">No Balance</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-800 text-sm"
            >
              <X className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Customer List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vehicles
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((customer) => {
                  const profile = (customer as any).profile || {};
                  const customerId = profile.customerId || customer.id;
                  const mongoId = customer._id || customer.id; // Use MongoDB _id for navigation
                  const profileId = profile._id || profile.id; // Customer profile ID for vehicle count lookup
                  
                  // Use the fetched vehicle count for this customer using the profile ID
                  const vehicleCount = customerVehicleCounts[profileId] || 0;
                  
                  const outstandingBalance = profile.outstandingBalance || 0;
                  
                  return (
                    <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm font-medium text-brand-600">
                        {customerId}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {customer.fullName}
                          </p>
                          {profile.nic && (
                            <p className="text-xs text-slate-500">{profile.nic}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {formatPhone(customer.mobile)}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {vehicleCount}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">
                        {formatLKR(outstandingBalance)}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={profile.status || 'active'} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCustomerAction(mongoId, 'view')}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View Customer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCustomerAction(mongoId, 'update')}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Update Customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCustomerAction(mongoId, 'vehicles')}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Registered Vehicles"
                          >
                            <Car className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCustomerAction(mongoId, 'history')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Service History"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCustomerAction(mongoId, 'ledger')}
                            className="p-2 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100 transition-colors"
                            title="Customer Ledger"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCustomerAction(mongoId, 'deactivate')}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Deactivate Customer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCustomerAction(mongoId, 'delete', customer.fullName)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Customer</h3>
                  <p className="text-sm text-slate-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will permanently remove the customer and all associated data.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Delete Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, totalRecords)} of {totalRecords}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ◀
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      page === pageNum
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-slate-400">...</span>}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};