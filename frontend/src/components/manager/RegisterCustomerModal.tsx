import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { User } from '../../types';
import { formatPhone, formatDate } from '../../utils/formatters';
import { Lock, RefreshCw, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface RegisterCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: any) => void;
}

export const RegisterCustomerModal: React.FC<RegisterCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<any>(null);

  const [nextCustomerId, setNextCustomerId] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nic: '',
    passport: '',
    gender: 'male',
    mobile: '',
    email: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
    },
    dateOfBirth: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateCustomerId = async () => {
    setIsGeneratingId(true);
    try {
      const res = await userApi.getNextUserId('customer');
      if (res.success) {
        setNextCustomerId(res.data.nextId);
      }
    } catch (err) {
      toast.error('Failed to generate customer ID');
    } finally {
      setIsGeneratingId(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 4; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password += '-';
    for (let i = 0; i < 4; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password += '-';
    for (let i = 0; i < 4; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(password);
  };

  useEffect(() => {
    if (isOpen) {
      generateCustomerId();
      generatePassword();
      setFormData({
        firstName: '',
        lastName: '',
        nic: '',
        passport: '',
        gender: 'male',
        mobile: '',
        email: '',
        address: {
          street: '',
          city: '',
          province: '',
          postalCode: '',
        },
        dateOfBirth: '',
        status: 'active',
      });
      setErrors({});
      setError(null);
      setShowSuccess(false);
      setCreatedCustomer(null);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.nic.trim() && !formData.passport.trim()) {
      newErrors.nic = 'NIC or Passport is required';
    }
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.street.trim()) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const userData = {
        username: nextCustomerId,
        password: tempPassword,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        role: 'customer',
        profile: {
          customerId: nextCustomerId,
          nic: formData.nic || undefined,
          passport: formData.passport || undefined,
          address: formData.address,
          status: formData.status,
        },
      };

      const res = await userApi.createUser(userData);

      if (res.success) {
        const mongoId = res.data._id || res.data.id;
        const customerData = {
          customerId: nextCustomerId,
          mongoId: mongoId,
          name: `${formData.firstName} ${formData.lastName}`,
          username: nextCustomerId,
          tempPassword: tempPassword,
        };
        setCreatedCustomer(customerData);
        setShowSuccess(true);
        onSuccess?.(customerData);
      } else {
        setError(res.message || 'Failed to create customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      nic: '',
      passport: '',
      gender: 'male',
      mobile: '',
      email: '',
      address: {
        street: '',
        city: '',
        province: '',
        postalCode: '',
      },
      dateOfBirth: '',
      status: 'active',
    });
    setErrors({});
    generatePassword();
  };

  if (showSuccess && createdCustomer) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Customer Registered Successfully
        </h2>
        
        <div className="space-y-4 mt-6 text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Customer ID</p>
            <p className="text-lg font-bold text-slate-900">{createdCustomer.customerId}</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Customer</p>
            <p className="text-lg font-bold text-slate-900">{createdCustomer.name}</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Portal Username</p>
            <p className="text-lg font-bold text-slate-900">{createdCustomer.username}</p>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Temporary Password</p>
            <p className="text-lg font-bold text-slate-900">{createdCustomer.tempPassword}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
          <p className="text-sm text-amber-800">
            ⚠ Customer should change the temporary password after first portal login.
          </p>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Customer Information */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">CUSTOMER INFORMATION</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Username *
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={nextCustomerId}
                onChange={(e) => setNextCustomerId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter username"
              />
            </div>
            <button
              type="button"
              onClick={generateCustomerId}
              disabled={isGeneratingId}
              className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingId ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Click refresh to auto-generate or enter manually</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.firstName ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.lastName ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              NIC / Passport *
            </label>
            <input
              type="text"
              value={formData.nic}
              onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
              placeholder="Enter NIC or Passport number"
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.nic ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.nic && <p className="text-xs text-red-600 mt-1">{errors.nic}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.mobile ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.email ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Address *
          </label>
          <textarea
            value={formData.address.street}
            onChange={(e) => setFormData({
              ...formData,
              address: { ...formData.address, street: e.target.value }
            })}
            rows={3}
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.address ? 'border-red-300' : 'border-slate-200'
            }`}
          />
          {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, city: e.target.value }
              })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Province</label>
            <input
              type="text"
              value={formData.address.province}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, province: e.target.value }
              })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Postal Code</label>
            <input
              type="text"
              value={formData.address.postalCode}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, postalCode: e.target.value }
              })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Portal Access */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          🔐 PORTAL ACCESS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
            <input
              type="text"
              value={nextCustomerId}
              readOnly
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempPassword}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            ℹ Portal credentials will be automatically generated for the customer.
          </p>
        </div>
      </div>

      {/* Account Information */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">ACCOUNT INFORMATION</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Registration Date</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formatDate(new Date())}
                readOnly
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="active">● Active</option>
              <option value="inactive">○ Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
        >
          Cancel
        </button>
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
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Customer
            </>
          )}
        </button>
      </div>
    </form>
  );
};
