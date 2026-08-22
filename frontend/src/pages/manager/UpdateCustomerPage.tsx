import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { User } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatPhone, formatDate } from '../../utils/formatters';
import { ArrowLeft, Lock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const UpdateCustomerPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);

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

  const fetchCustomer = async () => {
    if (!customerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to get users and find the one matching the customerId
      const usersRes = await userApi.getUsers({ role: 'customer', limit: 100 });
      
      if (usersRes.success) {
        // Find the customer by customerId or _id
        const customerData = usersRes.data.find((u: any) => 
          u._id === customerId || 
          u.id === customerId || 
          (u.profile && u.profile.customerId === customerId)
        );
        
        if (customerData) {
          setCustomer(customerData);
          const profile = customerData.profile || {};
          
          setFormData({
            firstName: customerData.firstName || '',
            lastName: customerData.lastName || '',
            nic: profile.nic || '',
            passport: profile.passport || '',
            gender: profile.gender || 'male',
            mobile: customerData.mobile || '',
            email: customerData.email || '',
            address: {
              street: profile.address?.street || '',
              city: profile.address?.city || '',
              province: profile.address?.province || '',
              postalCode: profile.address?.postalCode || '',
            },
            dateOfBirth: profile.dateOfBirth || '',
            status: profile.status || 'active',
          });
        } else {
          setError('Customer not found');
        }
      } else {
        setError(usersRes.message || 'Failed to fetch customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading customer');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

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

    setIsSaving(true);
    setError(null);

    try {
      // Get the actual MongoDB _id from the customer object
      const mongoId = customer?._id || customer?.id || customerId;
      
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        email: formData.email,
        profile: {
          nic: formData.nic || undefined,
          passport: formData.passport || undefined,
          gender: formData.gender,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth || undefined,
          status: formData.status,
        },
      };

      const res = await userApi.updateUser(mongoId, updateData);

      if (res.success) {
        toast.success('Customer details updated successfully');
        navigate(`/manager/customers/${mongoId}`);
      } else {
        setError(res.message || 'Failed to update customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (customer) {
      const profile = customer.profile || {};
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        nic: profile.nic || '',
        passport: profile.passport || '',
        gender: profile.gender || 'male',
        mobile: customer.mobile || '',
        email: customer.email || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          province: profile.address?.province || '',
          postalCode: profile.address?.postalCode || '',
        },
        dateOfBirth: profile.dateOfBirth || '',
        status: profile.status || 'active',
      });
    }
    setErrors({});
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchCustomer} />;
  if (!customer) return <ErrorState message="Customer not found" />;

  const profile = customer.profile || {};
  const customerIdDisplay = profile.customerId || customer.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/manager/customers/${customerId}`}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Update Customer</h1>
          <p className="text-sm text-slate-500">Customer: {customerIdDisplay}</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => handleSubmit(new Event('submit') as any)} />}

      {!error && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
          {/* Customer Information */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">CUSTOMER INFORMATION</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer ID
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerIdDisplay}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>
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

          {/* Account Information */}
          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">ACCOUNT INFORMATION</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={customer.username}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Registration Date</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formatDate(customer.createdAt)}
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
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⚪ Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Link
              to={`/manager/customers/${customerId}`}
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