import React, { useEffect, useState } from 'react';
import { vehicleApi } from '../../api/vehicleApi';
import toast from 'react-hot-toast';
import { X, Car, Check } from 'lucide-react';
import dayjs from 'dayjs';

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

interface CustomerVehicleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onSuccess?: (vehicle: Vehicle) => void;
}

export const CustomerVehicleEditModal: React.FC<CustomerVehicleEditModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && vehicle) {
      setFormData({
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
          expiryDate: vehicle.insurance?.expiryDate 
            ? dayjs(vehicle.insurance.expiryDate).format('YYYY-MM-DD')
            : '',
        },
        warranty: {
          provider: vehicle.warranty?.provider || '',
          expiryDate: vehicle.warranty?.expiryDate
            ? dayjs(vehicle.warranty.expiryDate).format('YYYY-MM-DD')
            : '',
          details: vehicle.warranty?.details || '',
        },
      });
      setErrors({});
    }
  }, [isOpen, vehicle]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration number is required';
    }
    if (!formData.make.trim()) {
      newErrors.make = 'Vehicle make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Vehicle model is required';
    }
    if (formData.manufactureYear < 1900 || formData.manufactureYear > new Date().getFullYear() + 1) {
      newErrors.manufactureYear = 'Please enter a valid year';
    }
    if (formData.currentMileage < 0) {
      newErrors.currentMileage = 'Mileage cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      const response = await vehicleApi.updateVehicle(vehicle._id, formData);
      
      if (response.success) {
        toast.success('Vehicle updated successfully');
        onSuccess?.(response.data);
        onClose();
      } else {
        toast.error(response.message || 'Failed to update vehicle');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(typeof prev[parent as keyof typeof prev] === 'object' ? (prev[parent as keyof typeof prev] as Record<string, any>) : {}),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit Vehicle</h2>
              <p className="text-xs text-slate-10500">{vehicle.registrationNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Identification */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicle Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Vehicle ID <span className="text-slate-400">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    value={vehicle.vehicleId}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g., ABC-1234"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.registrationNumber ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.registrationNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.registrationNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    VIN Number
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder="Vehicle Identification Number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Engine Number <span className="text-slate-400">(Auto Updated)</span>
                  </label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleChange}
                    placeholder="Engine serial number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    placeholder="Chassis serial number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Vehicle Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="e.g., Toyota"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.make ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.make && (
                    <p className="text-xs text-red-500 mt-1">{errors.make}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g., Camry"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.model ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.model && (
                    <p className="text-xs text-red-500 mt-1">{errors.model}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    name="manufactureYear"
                    value={formData.manufactureYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.manufactureYear ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.manufactureYear && (
                    <p className="text-xs text-red-500 mt-1">{errors.manufactureYear}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Fuel Type
                  </label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Transmission
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                    <option value="cvt">CVT</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="e.g., Silver"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Current Mileage (km) <span className="text-slate-400">(Auto Updated)</span>
                  </label>
                  <input
                    type="number"
                    name="currentMileage"
                    value={formData.currentMileage}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                      errors.currentMileage ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.currentMileage && (
                    <p className="text-xs text-red-500 mt-1">{errors.currentMileage}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Insurance Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    name="insurance.provider"
                    value={formData.insurance.provider}
                    onChange={handleChange}
                    placeholder="e.g., Allstate"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    name="insurance.policyNumber"
                    value={formData.insurance.policyNumber}
                    onChange={handleChange}
                    placeholder="Insurance policy number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    name="insurance.expiryDate"
                    value={formData.insurance.expiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Warranty Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Warranty Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Warranty Provider
                  </label>
                  <input
                    type="text"
                    name="warranty.provider"
                    value={formData.warranty.provider}
                    onChange={handleChange}
                    placeholder="e.g., ToyotaCare"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    name="warranty.expiryDate"
                    value={formData.warranty.expiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Warranty Details
                  </label>
                  <input
                    type="text"
                    name="warranty.details"
                    value={formData.warranty.details}
                    onChange={handleChange}
                    placeholder="Additional warranty information"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Update Vehicle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
