import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import { Vehicle } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatPhone, formatDate } from '../../utils/formatters';
import {
  Car,
  Users,
  Wrench,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  X,
  Eye,
  Edit,
  FileText,
  Shield,
  Printer,
  Gauge,
  Fuel,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const VehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalVehicles: 0,
    vehicleOwners: 0,
    inService: 0,
    expiringDocuments: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchVehicles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 10,
      };

      if (searchQuery) params.search = searchQuery;
      if (fuelTypeFilter !== 'all') params.fuelType = fuelTypeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const vRes = await vehicleApi.getVehicles(params);

      if (vRes.success) {
        setVehicles(vRes.data);
        setTotalPages(vRes.pagination?.pages || 1);
        setTotalRecords(vRes.pagination?.total || 0);
        
        // Calculate stats
        const uniqueOwners = new Set(
          vRes.data.map((v: Vehicle) => v.customer).filter(Boolean)
        );
        
        const inService = vRes.data.filter((v: Vehicle) => 
          v.currentServiceStatus === 'in_service'
        ).length;
        
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiringDocs = vRes.data.filter((v: Vehicle) => {
          const insuranceExpiry = (v.insurance && v.insurance.expiryDate) ? new Date(v.insurance.expiryDate) : null;
          const warrantyExpiry = (v.warranty && v.warranty.expiryDate) ? new Date(v.warranty.expiryDate) : null;
          
          return (
            (insuranceExpiry && insuranceExpiry <= thirtyDaysFromNow) ||
            (warrantyExpiry && warrantyExpiry <= thirtyDaysFromNow)
          );
        }).length;

        setStats({
          totalVehicles: vRes.pagination?.total || 0,
          vehicleOwners: uniqueOwners.size,
          inService,
          expiringDocuments: expiringDocs,
        });
      } else {
        setError(vRes.message || 'Failed to fetch vehicles');
      }
    } catch (err: any) {
      // Handle 304 Not Modified responses - they're not real errors
      if (err.response?.status === 304) {
        // Try to use cached data or set empty state
        setVehicles([]);
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Error loading vehicles');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, searchQuery, fuelTypeFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVehicles();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFuelTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const getCustomerName = (vehicle: Vehicle) => {
    // If customer is populated, use the user's name from the populated data
    if (vehicle.customer && typeof vehicle.customer === 'object') {
      const customer = vehicle.customer as any;
      if (customer.user) {
        // Construct fullName from firstName and lastName
        const firstName = customer.user.firstName || '';
        const lastName = customer.user.lastName || '';
        if (firstName || lastName) {
          return `${firstName} ${lastName}`.trim();
        }
      }
      // Fallback to customer ID if no user data
      return customer.customerId || 'Unknown';
    }
    // If customer is null or undefined, indicate data issue
    if (!vehicle.customer) {
      return 'No Customer (Data Issue)';
    }
    // Fallback if customer is just an ID (shouldn't happen with proper population)
    return 'Unknown';
  };

  const handleVehicleAction = (vehicleId: string, action: string) => {
    const mongoId = vehicleId; // This should be the MongoDB _id
    switch (action) {
      case 'view':
        navigate(`/manager/vehicles/${mongoId}`);
        break;
      case 'update':
        navigate(`/manager/vehicles/${mongoId}/edit`);
        break;
      case 'history':
        navigate(`/manager/vehicles/${mongoId}?tab=history`);
        break;
      case 'insurance':
        navigate(`/manager/vehicles/${mongoId}?tab=insurance`);
        break;
      case 'print':
        toast.success('Printing vehicle report...');
        break;
      case 'delete':
        handleDeleteVehicle(mongoId);
        break;
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        const response = await vehicleApi.deleteVehicle(vehicleId);
        if (response.success) {
          toast.success('Vehicle deleted successfully');
          fetchVehicles(); // Refresh the vehicle list
        } else {
          toast.error(response.message || 'Failed to delete vehicle');
        }
      } catch (error: any) {
        console.error('Delete vehicle error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete vehicle';
        toast.error(errorMessage);
      }
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchVehicles} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Management</h1>
          <p className="text-sm text-slate-500">
            Manage customer vehicles, service history, insurance and warranty information.
          </p>
        </div>
        <Link
          to="/manager/vehicles/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Register Vehicle
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          icon={Car}
          subtext="Registered vehicles"
          color="blue"
        />
        <StatCard
          title="Vehicle Owners"
          value={stats.vehicleOwners}
          icon={Users}
          subtext="Unique customers"
          color="purple"
        />
        <StatCard
          title="In Service"
          value={stats.inService}
          icon={Wrench}
          subtext="Currently in workshop"
          color="amber"
        />
        <StatCard
          title="Expiring Documents"
          value={stats.expiringDocuments}
          icon={AlertTriangle}
          subtext="Insurance/Warranty"
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
              placeholder="Search Registration / VIN / Make / Model / Customer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            
            <select
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Fuel Type: All</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Status: All</option>
              <option value="in_service">In Service</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="none">No Service</option>
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

      {/* Vehicle List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            REGISTERED VEHICLES
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vehicle ID
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Registration
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mileage
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
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => {
                  const vehicleId = vehicle.vehicleId || vehicle.id;
                  const customerName = getCustomerName(vehicle);
                  
                  const mongoId = vehicle._id || vehicle.id;
                  
                  return (
                    <tr key={mongoId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm font-medium text-brand-600">
                        {vehicleId}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">
                        {vehicle.registrationNumber}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {customerName}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {vehicle.make} {vehicle.model}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {vehicle.currentMileage?.toLocaleString()} km
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={vehicle.currentServiceStatus || 'active'} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVehicleAction(mongoId, 'view')}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View Vehicle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVehicleAction(mongoId, 'update')}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Update Vehicle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVehicleAction(mongoId, 'history')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Service History"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVehicleAction(mongoId, 'insurance')}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Insurance & Warranty"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVehicleAction(mongoId, 'print')}
                            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Print Vehicle Report"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVehicleAction(mongoId, 'delete')}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete Vehicle"
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
                    No vehicles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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