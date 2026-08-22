import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { vehicleApi } from '../../api/vehicleApi';
import toast from 'react-hot-toast';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Wrench, 
  CheckCircle,
  Calendar,
  Shield,
  Fuel,
  Settings,
  MapPin
} from 'lucide-react';
import { CustomerVehicleRegistrationModal } from '../../components/customer/CustomerVehicleRegistrationModal';
import { CustomerVehicleEditModal } from '../../components/customer/CustomerVehicleEditModal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';

interface Vehicle {
  _id: string;
  vehicleId: string;
  registrationNumber: string;
  vin: string;
  engineNumber: string;
  chassisNumber: string;
  make: string;
  model: string;
  manufactureYear: number;
  fuelType: string;
  transmission: string;
  currentMileage: number;
  color: string;
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  warranty: {
    provider: string;
    expiryDate: string;
    details: string;
  };
  currentServiceStatus: string;
  nextRecommendedService: string;
  status: string;
}

export const CustomerVehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use profile._id for customer users to ensure proper filtering
      const customerId = user?.profile?._id || user?._id;
      const response = await vehicleApi.getVehicles({ customer: customerId });
      if (response.success) {
        setVehicles(response.data);
      } else {
        setError(response.message || 'Failed to fetch vehicles');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const handleVehicleRegistered = (newVehicle: Vehicle) => {
    setVehicles([...vehicles, newVehicle]);
    setIsRegistrationModalOpen(false);
    toast.success('Vehicle registered successfully');
  };

  const handleVehicleUpdated = (updatedVehicle: Vehicle) => {
    setVehicles(vehicles.map(v => v._id === updatedVehicle._id ? updatedVehicle : v));
    if (selectedVehicle?._id === updatedVehicle._id) {
      setSelectedVehicle(updatedVehicle);
    }
    setIsEditModalOpen(false);
    setVehicleToEdit(null);
    toast.success('Vehicle updated successfully');
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to remove this vehicle? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await vehicleApi.deleteVehicle(vehicleId);
      if (response.success) {
        setVehicles(vehicles.filter(v => v._id !== vehicleId));
        if (selectedVehicle?._id === vehicleId) {
          setSelectedVehicle(null);
        }
        toast.success('Vehicle removed successfully');
      } else {
        toast.error(response.message || 'Failed to remove vehicle');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error removing vehicle');
    }
  };

  const getServiceStatusBadge = (status: string) => {
    switch (status) {
      case 'in_service':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <Wrench className="w-3 h-3" />
            In Service
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3" />
            Ready for Pickup
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
    }
  };

  const isServiceDue = (vehicle: Vehicle) => {
    if (!vehicle.nextRecommendedService) return false;
    const serviceDate = new Date(vehicle.nextRecommendedService);
    const today = new Date();
    const daysUntilService = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilService <= 30;
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchVehicles} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Vehicles</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your registered vehicles</p>
        </div>
        <button
          onClick={() => setIsRegistrationModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Register New Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Vehicle List</h2>
              <p className="text-xs text-slate-500 mt-0.5">{vehicles.length} vehicle(s) registered</p>
            </div>
            
            {vehicles.length === 0 ? (
              <div className="p-8 text-center">
                <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No vehicles registered yet</p>
                <button
                  onClick={() => setIsRegistrationModalOpen(true)}
                  className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Register your first vehicle
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle._id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                      selectedVehicle?._id === vehicle._id ? 'bg-brand-50 border-l-4 border-l-brand-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 truncate">
                            {vehicle.registrationNumber}
                          </span>
                          {isServiceDue(vehicle) && vehicle.currentServiceStatus === 'none' && (
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {vehicle.make} {vehicle.model} • {vehicle.manufactureYear}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">
                            {vehicle.currentMileage.toLocaleString()} km
                          </span>
                          {getServiceStatusBadge(vehicle.currentServiceStatus)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="lg:col-span-2">
          {selectedVehicle ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Vehicle Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selected: {selectedVehicle.registrationNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setVehicleToEdit(selectedVehicle);
                      setIsEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(selectedVehicle._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Auto-filled fields */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Identification
                    </h3>
                    
                    <DetailField
                      label="Vehicle ID"
                      value={selectedVehicle.vehicleId}
                      autoFilled
                    />
                    <DetailField
                      label="Registration Number"
                      value={selectedVehicle.registrationNumber}
                    />
                    <DetailField
                      label="VIN Number"
                      value={selectedVehicle.vin}
                    />
                    <DetailField
                      label="Engine Number"
                      value={selectedVehicle.engineNumber}
                      autoUpdated
                    />
                    <DetailField
                      label="Chassis Number"
                      value={selectedVehicle.chassisNumber}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vehicle Information
                    </h3>
                    
                    <DetailField
                      label="Make"
                      value={selectedVehicle.make}
                    />
                    <DetailField
                      label="Model"
                      value={selectedVehicle.model}
                    />
                    <DetailField
                      label="Year"
                      value={selectedVehicle.manufactureYear.toString()}
                    />
                    <DetailField
                      label="Fuel Type"
                      value={selectedVehicle.fuelType}
                    />
                    <DetailField
                      label="Transmission"
                      value={selectedVehicle.transmission}
                    />
                    <DetailField
                      label="Color"
                      value={selectedVehicle.color}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Service Status
                    </h3>
                    
                    <DetailField
                      label="Current Mileage"
                      value={`${selectedVehicle.currentMileage.toLocaleString()} km`}
                      autoUpdated
                    />
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Current Service Status</span>
                      {getServiceStatusBadge(selectedVehicle.currentServiceStatus)}
                    </div>
                    <DetailField
                      label="Next Recommended Service"
                      value={selectedVehicle.nextRecommendedService 
                        ? new Date(selectedVehicle.nextRecommendedService).toLocaleDateString()
                        : 'Not set'
                      }
                      autoCalc
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Insurance & Warranty
                    </h3>
                    
                    <DetailField
                      label="Insurance Company"
                      value={selectedVehicle.insurance?.provider || 'Not specified'}
                    />
                    <DetailField
                      label="Insurance Number"
                      value={selectedVehicle.insurance?.policyNumber || 'Not specified'}
                    />
                    <DetailField
                      label="Insurance Expiry"
                      value={selectedVehicle.insurance?.expiryDate
                        ? new Date(selectedVehicle.insurance.expiryDate).toLocaleDateString()
                        : 'Not specified'
                      }
                    />
                    <DetailField
                      label="Warranty Provider"
                      value={selectedVehicle.warranty?.provider || 'Not specified'}
                    />
                    <DetailField
                      label="Warranty Expiry"
                      value={selectedVehicle.warranty?.expiryDate
                        ? new Date(selectedVehicle.warranty.expiryDate).toLocaleDateString()
                        : 'Not specified'
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
              <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Vehicle</h3>
              <p className="text-sm text-slate-500">
                Choose a vehicle from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      <CustomerVehicleRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onSuccess={handleVehicleRegistered}
      />

      {/* Edit Modal */}
      {vehicleToEdit && (
        <CustomerVehicleEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setVehicleToEdit(null);
          }}
          vehicle={vehicleToEdit}
          onSuccess={handleVehicleUpdated}
        />
      )}
    </div>
  );
};

const DetailField: React.FC<{
  label: string;
  value: string;
  autoFilled?: boolean;
  autoUpdated?: boolean;
  autoCalc?: boolean;
}> = ({ label, value, autoFilled, autoUpdated, autoCalc }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{label}</span>
        {(autoFilled || autoUpdated || autoCalc) && (
          <span className="text-xs text-slate-400">
            ({autoFilled ? 'Auto Filled' : autoUpdated ? 'Auto Updated' : 'Auto Calc'})
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
};
