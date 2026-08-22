import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import { userApi } from '../../api/userApi';
import { User } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { CustomerSelectionModal } from '../../components/manager/CustomerSelectionModal';
import { ArrowLeft, Lock, Check, Car, User as UserIcon, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const RegisterVehiclePage: React.FC = () => {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredVehicle, setRegisteredVehicle] = useState<any>(null);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  const [nextVehicleId, setNextVehicleId] = useState('');

  const [formData, setFormData] = useState({
    // Vehicle Identification
    vehicleId: '',
    customer: '',
    
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
  const [validationMessages, setValidationMessages] = useState<Record<string, string>>({});

  const generateVehicleId = async () => {
    setIsGeneratingId(true);
    try {
      // Fetch existing vehicles to determine next sequential ID
      const vehiclesRes = await vehicleApi.getVehicles({ limit: 1000 });
      
      let nextNumber = 1;
      
      if (vehiclesRes.success && vehiclesRes.data.length > 0) {
        // Extract numbers from existing vehicle IDs
        const existingNumbers = vehiclesRes.data
          .map((v: any) => {
            const match = v.vehicleId?.match(/VEH-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((n: number) => n > 0);
        
        if (existingNumbers.length > 0) {
          nextNumber = Math.max(...existingNumbers) + 1;
        }
      }
      
      // Format with leading zeros (5 digits)
      const id = `VEH-${String(nextNumber).padStart(5, '0')}`;
      setNextVehicleId(id);
      setFormData({ ...formData, vehicleId: id });
    } catch (err) {
      toast.error('Failed to generate vehicle ID');
    } finally {
      setIsGeneratingId(false);
    }
  };

  useEffect(() => {
    generateVehicleId();
  }, []);

  const validateRegistrationNumber = (value: string) => {
    // Sri Lankan registration format validation
    const sriLankanPattern = /^[A-Z]{2,3}-\d{4}$/;
    if (sriLankanPattern.test(value)) {
      setValidationMessages({ ...validationMessages, registrationNumber: '✓ Valid Sri Lankan registration format' });
      return true;
    }
    setValidationMessages({ ...validationMessages, registrationNumber: '' });
    return false;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleId.trim()) {
      newErrors.vehicleId = 'Vehicle ID is required';
      // Regenerate if missing
      generateVehicleId();
    }
    if (!formData.customer) newErrors.customer = 'Customer is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.vin.trim()) newErrors.vin = 'VIN number is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.manufactureYear) newErrors.manufactureYear = 'Manufacture year is required';
    if (!formData.fuelType) newErrors.fuelType = 'Fuel type is required';
    if (!formData.currentMileage && formData.currentMileage !== 0) newErrors.currentMileage = 'Mileage is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure vehicleId is present before submission
    if (!formData.vehicleId || formData.vehicleId.trim() === '') {
      await generateVehicleId();
    }

    // Double-check vehicleId is not null/empty, generate sequential if needed
    const finalVehicleId = formData.vehicleId || nextVehicleId;
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const vehicleData = {
        ...formData,
        customer: selectedCustomer?._id || formData.customer,
        vehicleId: finalVehicleId, // Always include a valid vehicleId
      };

      console.log('Submitting vehicle data:', vehicleData);

      const res = await vehicleApi.registerVehicle(vehicleData);

      if (res.success) {
        setRegisteredVehicle({
          vehicleId: finalVehicleId,
          registrationNumber: formData.registrationNumber,
          make: formData.make,
          model: formData.model,
          manufactureYear: formData.manufactureYear,
          customerId: selectedCustomer?.profile?.customerId,
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          currentMileage: formData.currentMileage,
        });
        setShowSuccessModal(true);
      } else {
        setError(res.message || 'Failed to register vehicle');
      }
    } catch (err: any) {
      console.error('Vehicle registration error:', err);
      setError(err.response?.data?.message || 'Error registering vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      vehicleId: nextVehicleId,
      customer: '',
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
      insurance: {
        provider: '',
        policyNumber: '',
        expiryDate: '',
      },
      warranty: {
        provider: '',
        expiryDate: '',
        details: '',
      },
      registrationDate: dayjs().format('YYYY-MM-DD'),
      status: 'active',
    });
    setSelectedCustomer(null);
    setErrors({});
    setValidationMessages({});
  };

  const handleCustomerSelect = (customer: User) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customer: customer._id || customer.id,
    });
    setIsCustomerModalOpen(false);
  };

  if (showSuccessModal && registeredVehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Vehicle Registered Successfully
          </h2>
          
          <div className="space-y-3 mt-6 text-left">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Vehicle ID</p>
              <p className="text-lg font-bold text-slate-900">{registeredVehicle.vehicleId}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Registration Number</p>
              <p className="text-lg font-bold text-slate-900">{registeredVehicle.registrationNumber}</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Vehicle</p>
              <p className="text-lg font-bold text-slate-900">
                {registeredVehicle.make} {registeredVehicle.model} {registeredVehicle.manufactureYear}
              </p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Customer ID</p>
              <p className="text-lg font-bold text-slate-900">{registeredVehicle.customerId}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Fuel Type</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{registeredVehicle.fuelType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Transmission</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{registeredVehicle.transmission}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Mileage</p>
                <p className="text-sm font-medium text-slate-900">{registeredVehicle.currentMileage.toLocaleString()} km</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Link
              to={`/manager/vehicles/${registeredVehicle.vehicleId}`}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
            >
              View Vehicle
            </Link>
            <Link
              to="/manager/appointments/new"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm"
            >
              Create Appointment
            </Link>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/manager/vehicles');
              }}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/manager/vehicles"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Register Vehicle</h1>
          <p className="text-sm text-slate-500">
            Register a vehicle under an existing customer account.
          </p>
        </div>
      </div>

      {isLoading && <LoadingSkeleton />}
      
      {error && <ErrorState message={error} onRetry={() => handleSubmit(new Event('submit') as any)} />}

      {!isLoading && !error && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
          {/* Vehicle Identification */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">VEHICLE IDENTIFICATION</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vehicle ID
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={nextVehicleId}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateVehicleId}
                  disabled={isGeneratingId}
                  className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingId ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">🔒 Auto Generated</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className={`w-full px-4 py-2 border rounded-xl text-left flex items-center justify-between ${
                    selectedCustomer 
                      ? 'border-brand-300 bg-brand-50 text-brand-700' 
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {selectedCustomer ? (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>{selectedCustomer.fullName}</span>
                    </div>
                  ) : (
                    <span>🔍 Search Customer by ID / Name / Phone</span>
                  )}
                  <span className="text-slate-400">▾</span>
                </button>
              </div>
              {errors.customer && <p className="text-xs text-red-600 mt-1">{errors.customer}</p>}
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
                  onChange={(e) => {
                    setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() });
                    validateRegistrationNumber(e.target.value.toUpperCase());
                  }}
                  placeholder="CAB-1234"
                  className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase ${
                    errors.registrationNumber ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.registrationNumber && <p className="text-xs text-red-600 mt-1">{errors.registrationNumber}</p>}
                {validationMessages.registrationNumber && (
                  <p className="text-xs text-emerald-600 mt-1">{validationMessages.registrationNumber}</p>
                )}
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
            <h2 className="text-lg font-bold text-slate-900 mb-4">INSURANCE DETAILS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Insurance Company
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
                  Insurance Number
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
                Insurance Expiry
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
            <h2 className="text-lg font-bold text-slate-900 mb-4">WARRANTY DETAILS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Warranty Provider
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
                  Warranty Expiry
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

          {/* Registration */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">REGISTRATION</h2>
            
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
              to="/manager/vehicles"
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
              disabled={isLoading}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Register Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleCustomerSelect}
      />
    </div>
  );
};