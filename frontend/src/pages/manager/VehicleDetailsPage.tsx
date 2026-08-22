import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import { userApi } from '../../api/userApi';
import { jobCardApi } from '../../api/jobCardApi';
import { Vehicle, User, JobCard } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatPhone, formatDate, formatLKR } from '../../utils/formatters';
import {
  ArrowLeft,
  Edit,
  Car,
  User as UserIcon,
  Gauge,
  Wrench,
  Calendar,
  Shield,
  AlertTriangle,
  FileText,
  Download,
} from 'lucide-react';
import dayjs from 'dayjs';

type TabType = 'overview' | 'details' | 'history' | 'insurance' | 'warranty';

export const VehicleDetailsPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Determine active tab from URL search param
  const pathTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(
    ['overview', 'details', 'history', 'insurance', 'warranty'].includes(pathTab) ? pathTab : 'overview'
  );
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);

  const fetchVehicleData = async () => {
    if (!vehicleId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to get vehicles and find the matching one
      const vRes = await vehicleApi.getVehicles({ limit: 1000 });
      
      if (vRes.success) {
        const vehicleData = vRes.data.find((v: Vehicle) => 
          v._id === vehicleId || v.id === vehicleId || v.vehicleId === vehicleId
        );
        
        if (vehicleData) {
          setVehicle(vehicleData);
          
          // Fetch customer and job cards
          const customerId = typeof vehicleData.customer === 'object' 
            ? vehicleData.customer._id 
            : vehicleData.customer;
          
          if (customerId) {
            const [cRes, jcRes] = await Promise.all([
              userApi.getUsers({ role: 'customer', limit: 1000 }).catch(() => ({ success: false, data: [] })),
              jobCardApi.getJobCards({ limit: 50 }).catch(() => ({ success: false, data: [] })),
            ]);
            
            if (cRes.success) {
              const customerData = cRes.data.find((u: User) => 
                u._id === customerId || u.id === customerId
              );
              setCustomer(customerData || null);
            }
            
            if (jcRes.success) {
              const vehicleJobCards = jcRes.data.filter((jc: JobCard) => 
                jc.vehicle === vehicleId || 
                (typeof jc.vehicle === 'object' && jc.vehicle._id === vehicleId)
              );
              setJobCards(vehicleJobCards);
            }
          }
        } else {
          setError('Vehicle not found');
        }
      } else {
        setError('Failed to fetch vehicle');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading vehicle data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [vehicleId]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/manager/vehicles/${vehicleId}?tab=${tab}`, { replace: true });
  };

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = dayjs();
    const expiry = dayjs(expiryDate);
    const days = expiry.diff(today, 'days');
    return days;
  };

  const getInsuranceStatus = () => {
    if (!vehicle?.insurance?.expiryDate) return 'not-set';
    const days = getDaysRemaining(vehicle.insurance.expiryDate);
    if (days === null) return 'not-set';
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring';
    return 'valid';
  };

  const getWarrantyStatus = () => {
    if (!vehicle?.warranty?.expiryDate) return 'not-set';
    const days = getDaysRemaining(vehicle.warranty.expiryDate);
    if (days === null) return 'not-set';
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring';
    return 'valid';
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchVehicleData} />;
  if (!vehicle) return <ErrorState message="Vehicle not found" />;

  const insuranceStatus = getInsuranceStatus();
  const warrantyStatus = getWarrantyStatus();
  const insuranceDays = getDaysRemaining(vehicle.insurance?.expiryDate || null);
  const warrantyDays = getDaysRemaining(vehicle.warranty?.expiryDate || null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/manager/vehicles"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vehicle Management</h1>
            <p className="text-sm text-slate-500">Vehicle details and management</p>
          </div>
        </div>
        <Link
          to={`/manager/vehicles/${vehicleId}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
        >
          <Edit className="w-4 h-4" />
          Update Vehicle
        </Link>
      </div>

      {/* Vehicle Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center">
            <Car className="w-10 h-10 text-brand-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {vehicle.make} {vehicle.model}
              </h2>
              <StatusBadge status={vehicle.currentServiceStatus || 'active'} />
            </div>
            <p className="text-sm text-slate-500 mb-2">
              {vehicle.registrationNumber} • {vehicle.vehicleId || vehicle.id}
            </p>
            
            {customer && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <UserIcon className="w-4 h-4" />
                <span>Owner: {customer.fullName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Mileage"
            value={`${vehicle.currentMileage?.toLocaleString() || 0} km`}
            icon={Gauge}
            subtext="Current"
            color="blue"
          />
          <StatCard
            title="Services"
            value={jobCards.length}
            icon={Wrench}
            subtext="Total services"
            color="purple"
          />
          <StatCard
            title="Last Service"
            value={jobCards.length > 0 ? formatDate(jobCards[0].createdAt) : 'N/A'}
            icon={Calendar}
            subtext="Date"
            color="amber"
          />
          <StatCard
            title="Warranty"
            value={warrantyStatus === 'valid' ? 'Valid' : warrantyStatus === 'expired' ? 'Expired' : 'N/A'}
            icon={Shield}
            subtext="Status"
            color={warrantyStatus === 'valid' ? 'emerald' : warrantyStatus === 'expired' ? 'rose' : 'purple'}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex">
            {[
              { id: 'overview' as TabType, label: 'Overview' },
              { id: 'details' as TabType, label: 'Vehicle Details' },
              { id: 'history' as TabType, label: 'Service History' },
              { id: 'insurance' as TabType, label: 'Insurance' },
              { id: 'warranty' as TabType, label: 'Warranty' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Mileage Card */}
              <div className="bg-gradient-to-br from-blue-50 to-brand-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  CURRENT MILEAGE
                </h3>
                <div className="text-center py-8">
                  <p className="text-4xl font-bold text-brand-600">
                    {vehicle.currentMileage?.toLocaleString() || 0}
                  </p>
                  <p className="text-slate-600 mt-2">km</p>
                </div>
                {jobCards.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-slate-600">
                      Last recorded: {formatDate(jobCards[0].createdAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Service Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Total Services</p>
                  <p className="text-2xl font-bold text-slate-900">{jobCards.length}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Total Spent</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatLKR(jobCards.reduce((sum, jc) => sum + jc.estimatedCost, 0))}
                  </p>
                </div>
              </div>

              {/* Insurance Status */}
              <div className={`rounded-xl p-6 border ${
                insuranceStatus === 'valid' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : insuranceStatus === 'expired'
                  ? 'bg-rose-50 border-rose-200'
                  : insuranceStatus === 'expiring'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6" />
                  <h3 className="text-lg font-bold text-slate-900">INSURANCE STATUS</h3>
                  {insuranceStatus === 'valid' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      🟢 VALID
                    </span>
                  )}
                  {insuranceStatus === 'expired' && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                      🔴 EXPIRED
                    </span>
                  )}
                  {insuranceStatus === 'expiring' && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      🟠 EXPIRING SOON
                    </span>
                  )}
                </div>
                
                {vehicle.insurance?.provider && (
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Company:</span> {vehicle.insurance.provider}</p>
                    <p className="text-sm"><span className="font-medium">Policy:</span> {vehicle.insurance.policyNumber || 'N/A'}</p>
                    <p className="text-sm"><span className="font-medium">Expiry:</span> {vehicle.insurance.expiryDate ? formatDate(vehicle.insurance.expiryDate) : 'N/A'}</p>
                    {insuranceDays !== null && (
                      <p className="text-sm"><span className="font-medium">Days Remaining:</span> {insuranceDays}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Warranty Status */}
              <div className={`rounded-xl p-6 border ${
                warrantyStatus === 'valid' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : warrantyStatus === 'expired'
                  ? 'bg-rose-50 border-rose-200'
                  : warrantyStatus === 'expiring'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6" />
                  <h3 className="text-lg font-bold text-slate-900">WARRANTY STATUS</h3>
                  {warrantyStatus === 'valid' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      🟢 ACTIVE
                    </span>
                  )}
                  {warrantyStatus === 'expired' && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                      🔴 EXPIRED
                    </span>
                  )}
                  {warrantyStatus === 'expiring' && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      🟠 EXPIRING SOON
                    </span>
                  )}
                </div>
                
                {vehicle.warranty?.provider && (
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Provider:</span> {vehicle.warranty.provider}</p>
                    <p className="text-sm"><span className="font-medium">Expiry:</span> {vehicle.warranty.expiryDate ? formatDate(vehicle.warranty.expiryDate) : 'N/A'}</p>
                    {warrantyDays !== null && (
                      <p className="text-sm"><span className="font-medium">Days Remaining:</span> {warrantyDays}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">VEHICLE INFORMATION</h3>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Registration Number</label>
                    <p className="text-sm text-slate-900 font-mono">{vehicle.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">VIN Number</label>
                    <p className="text-sm text-slate-900 font-mono">{vehicle.vin || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Engine Number</label>
                    <p className="text-sm text-slate-900 font-mono">{vehicle.engineNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Chassis Number</label>
                    <p className="text-sm text-slate-900 font-mono">{vehicle.chassisNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Make</label>
                    <p className="text-sm text-slate-900">{vehicle.make}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Model</label>
                    <p className="text-sm text-slate-900">{vehicle.model}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Manufacture Year</label>
                    <p className="text-sm text-slate-900">{vehicle.manufactureYear}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fuel Type</label>
                    <p className="text-sm text-slate-900 capitalize">{vehicle.fuelType}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Transmission</label>
                    <p className="text-sm text-slate-900 capitalize">{vehicle.transmission}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mileage</label>
                    <p className="text-sm text-slate-900">{vehicle.currentMileage?.toLocaleString()} km</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Color</label>
                    <p className="text-sm text-slate-900">{vehicle.color || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Owner */}
              {customer && (
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    VEHICLE OWNER
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900">{customer.fullName}</p>
                    <p className="text-xs text-slate-500">Customer ID: {customer.profile?.customerId || customer.id}</p>
                    <p className="text-xs text-slate-500">Mobile: {formatPhone(customer.mobile)}</p>
                    <p className="text-xs text-slate-500">Email: {customer.email || 'N/A'}</p>
                    <Link
                      to={`/manager/customers/${customer._id || customer.id}`}
                      className="inline-block mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
                    >
                      View Customer Profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">SERVICE HISTORY</h3>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm"><span className="font-medium">Current Mileage:</span> {vehicle.currentMileage?.toLocaleString()} km</p>
              </div>

              {jobCards.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Job Card</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Service</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Technician</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobCards.map((jobCard) => (
                          <tr key={jobCard.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                            <td className="py-3 px-4 text-sm font-medium text-brand-600">
                              {jobCard.jobCardNumber}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {formatDate(jobCard.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {jobCard.complaint}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {jobCard.assignedTechnician || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-900">
                              {formatLKR(jobCard.estimatedCost)}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={jobCard.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between text-sm pt-4 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Total Services:</span>
                      <span className="ml-2 font-bold text-slate-900">{jobCards.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Service Cost:</span>
                      <span className="ml-2 font-bold text-slate-900">
                        {formatLKR(jobCards.reduce((sum, jc) => sum + jc.estimatedCost, 0))}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No service history found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insurance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">🛡 INSURANCE DETAILS</h3>
              
              <div className={`rounded-xl p-6 border ${
                insuranceStatus === 'valid' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : insuranceStatus === 'expired'
                  ? 'bg-rose-50 border-rose-200'
                  : insuranceStatus === 'expiring'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6" />
                  <h4 className="text-lg font-bold text-slate-900">STATUS</h4>
                  {insuranceStatus === 'valid' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      🟢 VALID
                    </span>
                  )}
                  {insuranceStatus === 'expired' && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                      🔴 EXPIRED
                    </span>
                  )}
                  {insuranceStatus === 'expiring' && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      🟠 EXPIRING SOON
                    </span>
                  )}
                </div>
                
                {insuranceStatus === 'expired' && vehicle.insurance?.expiryDate && (
                  <p className="text-sm text-rose-700 mt-2">
                    Expired: {formatDate(vehicle.insurance.expiryDate)}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Insurance Company</label>
                  <p className="text-sm text-slate-900">{vehicle.insurance?.provider || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Insurance Number</label>
                  <p className="text-sm text-slate-900 font-mono">{vehicle.insurance?.policyNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Expiry Date</label>
                  <p className="text-sm text-slate-900">{vehicle.insurance?.expiryDate ? formatDate(vehicle.insurance.expiryDate) : 'N/A'}</p>
                </div>
                {insuranceDays !== null && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Days Remaining</label>
                    <p className="text-sm text-slate-900">{insuranceDays} days</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  ⚠ System automatically alerts the Manager when insurance is approaching expiry.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">🛠 WARRANTY DETAILS</h3>
              
              <div className={`rounded-xl p-6 border ${
                warrantyStatus === 'valid' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : warrantyStatus === 'expired'
                  ? 'bg-rose-50 border-rose-200'
                  : warrantyStatus === 'expiring'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6" />
                  <h4 className="text-lg font-bold text-slate-900">STATUS</h4>
                  {warrantyStatus === 'valid' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      🟢 ACTIVE
                    </span>
                  )}
                  {warrantyStatus === 'expired' && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                      🔴 EXPIRED
                    </span>
                  )}
                  {warrantyStatus === 'expiring' && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      🟠 EXPIRING SOON
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Warranty Provider</label>
                  <p className="text-sm text-slate-900">{vehicle.warranty?.provider || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Warranty Expiry</label>
                  <p className="text-sm text-slate-900">{vehicle.warranty?.expiryDate ? formatDate(vehicle.warranty.expiryDate) : 'N/A'}</p>
                </div>
                {vehicle.warranty?.details && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Warranty Details</label>
                    <p className="text-sm text-slate-900">{vehicle.warranty.details}</p>
                  </div>
                )}
                {warrantyDays !== null && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Days Remaining</label>
                    <p className="text-sm text-slate-900">{warrantyDays} days</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};