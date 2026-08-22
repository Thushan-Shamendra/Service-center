import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import { userApi } from '../../api/userApi';
import { User } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { ArrowLeft, Lock, Check, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const UpdateVehiclePage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [customer, setCustomer] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    // Vehicle Identification
    vehicleId: '',
    customer: '',
    ownerName: '',
    
    // Vehicle Details
    registrationNumber: '',
    vin: '',
    engineNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    manufactureYear: new Date().getFullYear(),
    fuelType: 'petrol',
    transmission: 'automatic',
    currentMileage: 0,
    color: '',
    
    // Insurance Details
    insurance: {
      provider: '',
      policyNumber: '',
      expiryDate: '',
    },
    
    // Warranty Details
    warranty: {
      provider: '',
      expiryDate: '',
      details: '',
    },
    
    // Registration
    registrationDate: dayjs().format('YYYY-MM-DD'),
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchVehicle = async () => {
    if (!vehicleId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to get vehicles and find the matching one
      const vRes = await vehicleApi.getVehicles({ limit: 1000 });
      
      if (vRes.success) {
        const vehicleData = vRes.data.find((v: any) => 
          v._id === vehicleId || v.id === vehicleId || v.vehicleId === vehicleId
        );
        
        if (vehicleData) {
          setVehicle(vehicleData);
          
          // Fetch customer
          const customerId = typeof vehicleData.customer === 'object' 
            ? vehicleData.customer._id 
            : vehicleData.customer;
          
          if (customerId) {
            const cRes = await userApi.getUsers({ role: 'customer', limit: 1000 });
            if (cRes.success) {
              const customerObj = cRes.data.find((u: User) => 
                u._id === customerId || u.id === customerId
              );
              setCustomer(customerObj || null);
            }
          }
          
          // Populate form
          setFormData({
            vehicleId: vehicleData.vehicleId || vehicleData.id,
            customer: customerId,
            ownerName: customer?.fullName || '',
            registrationNumber: vehicleData.registrationNumber || '',
            vin: vehicleData.vin || '',
            engineNumber: vehicleData.engineNumber || '',
            chassisNumber: vehicleData.chassisNumber || '',
            make: vehicleData.make || '',
            model: vehicleData.model || '',
            manufactureYear: vehicleData.manufactureYear || new Date().getFullYear(),
            fuelType: vehicleData.fuelType || 'petrol',
            transmission: vehicleData.transmission || 'automatic',
            currentMileage: vehicleData.currentMileage || 0,
            color: vehicleData.color || '',
            insurance: {
              provider: vehicleData.insurance?.provider || '',
              policyNumber: vehicleData.insurance?.policyNumber || '',
              expiryDate: vehicleData.insurance?.expiryDate ? dayjs(vehicleData.insurance.expiryDate).format('YYYY-MM-DD') : '',
            },
            warranty: {
              provider: vehicleData.warranty?.provider || '',
              expiryDate: vehicleData.warranty?.expiryDate ? dayjs(vehicleData.warranty.expiryDate).format('YYYY-MM-DD') : '',
              details: vehicleData.warranty?.details || '',
            },
            registrationDate: vehicleData.createdAt ? dayjs(vehicleData.createdAt).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            status: vehicleData.status || 'active',
          });
        } else {
          setError('Vehicle not found');
        }
      } else {
        setError('Failed to fetch vehicle');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.vin.trim()) newErrors.vin = 'VIN number is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.manufactureYear) newErrors.manufactureYear = 'Manufacture year is required';
    if (!formData.fuelType) newErrors.fuelType = 'Fuel type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      const mongoId = vehicle?._id || vehicle?.id || vehicleId;
      
      const updateData = {
        registrationNumber: formData.registrationNumber,
        vin: formData.vin,
        engineNumber: formData.engineNumber,
        chassisNumber: formData.chassisNumber,
        make: formData.make,
        model: formData.model,
        manufactureYear: formData.manufactureYear,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        currentMileage: formData.currentMileage,
        color: formData.color,
        insurance: formData.insurance,
        warranty: formData.warranty,
        status: formData.status,
      };

      const res = await vehicleApi.updateVehicle(mongoId, updateData);

      if (res.success) {
        toast.success('Vehicle details updated successfully');
        navigate(`/manager/vehicles/${mongoId}`);
      } else {
        setError(res.message || 'Failed to update vehicle');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating vehicle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (vehicle) {
      setFormData({
        vehicleId: vehicle.vehicleId || vehicle.id,
        customer: formData.customer,
        ownerName: customer?.fullName || '',
        registrationNumber: vehicle.registrationNumber || '',
        vin: vehicle.vin || '',
        engineNumber: vehicle.engineNumber || '',
        chassisNumber: vehicle.chassisNumber || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        manufactureYear: vehicle.manufactureYear || new Date().getFullYear(),
        fuelType: vehicle.fuelType || 'petrol',
        transmission: vehicle.transmission || 'automatic',
        currentMileage: vehicle.currentMileage || 0,
        color: vehicle.color || '',
        insurance: {
          provider: vehicle.insurance?.provider || '',
          policyNumber: vehicle.insurance?.policyNumber || '',
          expiryDate: vehicle.insurance?.expiryDate ? dayjs(vehicle.insurance.expiryDate).format('YYYY-MM-DD') : '',
        },
        warranty: {
          provider: vehicle.warranty?.provider || '',
          expiryDate: vehicle.warranty?.expiryDate ? dayjs(vehicle.warranty.expiryDate).format('YYYY-MM-DD') : '',
          details: vehicle.warranty?.details || '',
        },
        registrationDate: vehicle.createdAt ? dayjs(vehicle.createdAt).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        status: vehicle.status || 'active',
      });
    }
    setErrors({});
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchVehicle} />;
  if (!vehicle) return <ErrorState message="Vehicle not found" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/manager/vehicles/${vehicleId}`}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Update Vehicle</h1>
          <p className="text-sm text-slate-500">Vehicle: {vehicle.registrationNumber}</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => handleSubmit(new Event('submit') as any)} />}

      {!error && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
          {/* Vehicle Identification */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">VEHICLE IDENTIFICATION</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vehicle ID
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.vehicleId}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customer?.fullName || 'N/A'}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner Name
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.ownerName}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">VEHICLE DETAILS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                  placeholder="CAB-1234"
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase ${
                    errors.registrationNumber ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.registrationNumber && <p className="text-xs text-red-600 mt-1">{errors.registrationNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  VIN Number *
                </label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  placeholder="JTDXXXXXXXXXXXX"
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase ${
                    errors.vin ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.vin && <p className="text-xs text-red-600 mt-1">{errors.vin}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Engine Number
                </label>
                <input
                  type="text"
                  value={formData.engineNumber}
                  onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value.toUpperCase() })}
                  placeholder="ENG-778899"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chassis Number
                </label>
                <input
                  type="text"
                  value={formData.chassisNumber}
                  onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value.toUpperCase() })}
                  placeholder="CHS-445566"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Make *
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Toyota"
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.make ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.make && <p className="text-xs text-red-600 mt-1">{errors.make}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Prius"
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.model ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.model && <p className="text-xs text-red-600 mt-1">{errors.model}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Manufacture Year *
                </label>
                <input
                  type="number"
                  value={formData.manufactureYear}
                  onChange={(e) => setFormData({ ...formData, manufactureYear: Number(e.target.value) })}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.manufactureYear ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.manufactureYear && <p className="text-xs text-red-600 mt-1">{errors.manufactureYear}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fuel Type *
                </label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Transmission
                </label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="cvt">CVT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mileage (km)
                </label>
                <input
                  type="number"
                  value={formData.currentMileage}
                  onChange={(e) => setFormData({ ...formData, currentMileage: Number(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Silver"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Insurance Details */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">INSURANCE</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.insurance?.provider || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    insurance: { ...formData.insurance, provider: e.target.value }
                  })}
                  placeholder="Ceylinco Insurance"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={formData.insurance?.policyNumber || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    insurance: { ...formData.insurance, policyNumber: e.target.value }
                  })}
                  placeholder="POL-2026-789456"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expiry
              </label>
              <input
                type="date"
                value={formData.insurance?.expiryDate || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  insurance: { ...formData.insurance, expiryDate: e.target.value }
                })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Warranty Details */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">WARRANTY</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Provider
                </label>
                <input
                  type="text"
                  value={formData.warranty?.provider || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    warranty: { ...formData.warranty, provider: e.target.value }
                  })}
                  placeholder="Toyota Lanka"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expiry
                </label>
                <input
                  type="date"
                  value={formData.warranty?.expiryDate || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    warranty: { ...formData.warranty, expiryDate: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Warranty Details
              </label>
              <textarea
                value={formData.warranty?.details || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  warranty: { ...formData.warranty, details: e.target.value }
                })}
                placeholder="Additional warranty information..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Status */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">STATUS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Registration Date
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.registrationDate}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⚪ Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Link
              to={`/manager/vehicles/${vehicleId}`}
              className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Lock className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};