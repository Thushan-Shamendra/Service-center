import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { userApi } from '../../api/userApi';

interface EmployeeFormSampleProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export const EmployeeFormSample: React.FC<EmployeeFormSampleProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    username: 'kamal_perera',
    email: 'kamal.perera@raxwo.com',
    password: 'Employee@123',
    firstName: 'Kamal',
    lastName: 'Perera',
    mobile: '0719876543',
    role: 'employee',
    nic: '199012345678',
    dateOfBirth: '1990-03-22',
    gender: 'male',
    designation: 'Senior Technician',
    basicSalary: 75000,
    employmentDate: '2021-03-10',
    address: {
      street: '123 Temple Road, Kandy',
      city: 'Kandy',
      province: 'Central',
      postalCode: '20000',
    },
    bankName: 'People\'s Bank',
    branch: 'Kandy Main',
    accountNumber: '9876543210',
    profilePhoto: null,
    isActive: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [nextUserId, setNextUserId] = useState<string>('');

  useEffect(() => {
    const fetchNextUserId = async () => {
      try {
        const res = await userApi.getNextUserId('employee');
        if (res.success) {
          setNextUserId(res.data.nextId);
        }
      } catch (error) {
        console.error('Failed to fetch next user ID:', error);
      }
    };
    fetchNextUserId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('username', formData.username);
    submitData.append('email', formData.email);
    submitData.append('password', formData.password);
    submitData.append('firstName', formData.firstName);
    submitData.append('lastName', formData.lastName);
    submitData.append('mobile', formData.mobile);
    submitData.append('role', formData.role);
    submitData.append('nic', formData.nic);
    submitData.append('dateOfBirth', formData.dateOfBirth);
    submitData.append('gender', formData.gender);
    submitData.append('designation', formData.designation);
    submitData.append('basicSalary', formData.basicSalary.toString());
    submitData.append('employmentDate', formData.employmentDate);
    submitData.append('address', JSON.stringify(formData.address));
    
    if (formData.profilePhoto) {
      submitData.append('profilePhoto', formData.profilePhoto);
    }
    
    submitData.append('bankName', formData.bankName);
    submitData.append('branch', formData.branch);
    submitData.append('accountNumber', formData.accountNumber);
    
    await onSubmit(submitData);
  };

  const handleReset = () => {
    setFormData({
      username: 'kamal_perera',
      email: 'kamal.perera@raxwo.com',
      password: 'Employee@123',
      firstName: 'Kamal',
      lastName: 'Perera',
      mobile: '0719876543',
      role: 'employee',
      nic: '199012345678',
      dateOfBirth: '1990-03-22',
      gender: 'male',
      designation: 'Senior Technician',
      basicSalary: 75000,
      employmentDate: '2021-03-10',
      address: {
        street: '123 Temple Road, Kandy',
        city: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      bankName: 'People\'s Bank',
      branch: 'Kandy Main',
      accountNumber: '9876543210',
      profilePhoto: null,
      isActive: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
      {/* ID Display */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="block text-slate-500 mb-1">Employee ID *</label>
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-brand-600 flex-1">
            {nextUserId || 'Loading...'}
          </div>
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Personal Information */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-bold text-slate-700 mb-3">Personal Information</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Last Name *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">NIC *</label>
            <input
              type="text"
              required
              value={formData.nic}
              onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
              placeholder="199512345678 or 951234567V"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Date of Birth *</label>
            <input
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Gender *</label>
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Mobile *</label>
            <input
              type="text"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="0771234567"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-bold text-slate-700 mb-3">Contact Information</span>
        <div>
          <label className="block text-slate-700 mb-1 font-bold">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="mt-3">
          <label className="block text-slate-700 mb-1 font-bold">Address</label>
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
            placeholder="123 Main Street, Colombo, Western Province"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Employment Information */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-bold text-slate-700 mb-3">Employment Information</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Designation *</label>
            <select
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="Technician">Technician</option>
              <option value="Senior Technician">Senior Technician</option>
              <option value="Master Technician">Master Technician</option>
              <option value="Service Advisor">Service Advisor</option>
              <option value="Service Manager">Service Manager</option>
              <option value="Parts Specialist">Parts Specialist</option>
              <option value="Quality Controller">Quality Controller</option>
              <option value="Mechanic">Mechanic</option>
              <option value="Electrician">Electrician</option>
              <option value="Assistant">Assistant</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Employment Date *</label>
            <input
              type="date"
              required
              value={formData.employmentDate}
              onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-slate-700 mb-1 font-bold">Basic Salary (LKR) *</label>
          <input
            type="number"
            required
            value={formData.basicSalary}
            onChange={(e) => setFormData({ ...formData, basicSalary: parseInt(e.target.value) })}
            placeholder="65000"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-bold text-slate-700 mb-3">Bank Details</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Bank Name</label>
            <select
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Select Bank</option>
              <option value="Bank of Ceylon">Bank of Ceylon</option>
              <option value="People's Bank">People's Bank</option>
              <option value="Commercial Bank">Commercial Bank</option>
              <option value="Sampath Bank">Sampath Bank</option>
              <option value="Hatton National Bank">Hatton National Bank</option>
              <option value="National Development Bank">National Development Bank</option>
              <option value="Nations Trust Bank">Nations Trust Bank</option>
              <option value="HSBC Sri Lanka">HSBC Sri Lanka</option>
              <option value="Standard Chartered Bank">Standard Chartered Bank</option>
              <option value="Union Bank of Colombo">Union Bank of Colombo</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Branch</label>
            <select
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Select Branch</option>
              <option value="Colombo Main">Colombo Main</option>
              <option value="Colombo Fort">Colombo Fort</option>
              <option value="Colombo 01">Colombo 01</option>
              <option value="Colombo 02">Colombo 02</option>
              <option value="Colombo 03">Colombo 03</option>
              <option value="Colombo 04">Colombo 04</option>
              <option value="Colombo 05">Colombo 05</option>
              <option value="Colombo 06">Colombo 06</option>
              <option value="Colombo 07">Colombo 07</option>
              <option value="Colombo 08">Colombo 08</option>
              <option value="Colombo 09">Colombo 09</option>
              <option value="Colombo 10">Colombo 10</option>
              <option value="Colombo 11">Colombo 11</option>
              <option value="Colombo 12">Colombo 12</option>
              <option value="Colombo 13">Colombo 13</option>
              <option value="Colombo 14">Colombo 14</option>
              <option value="Colombo 15">Colombo 15</option>
              <option value="Kandy">Kandy</option>
              <option value="Galle">Galle</option>
              <option value="Matara">Matara</option>
              <option value="Jaffna">Jaffna</option>
              <option value="Negombo">Negombo</option>
              <option value="Kurunegala">Kurunegala</option>
              <option value="Anuradhapura">Anuradhapura</option>
              <option value="Ratnapura">Ratnapura</option>
              <option value="Badulla">Badulla</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-slate-700 mb-1 font-bold">Account Number</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="Enter account number"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Account Information */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-bold text-slate-700 mb-3">Account Information</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Username *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="john_doe"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Temporary Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pr-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-slate-700 mb-1 font-bold">Status</label>
        <select
          value={formData.isActive ? 'active' : 'inactive'}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="active">🟢 Active</option>
          <option value="inactive">🔴 Inactive</option>
        </select>
      </div>

      {/* Profile Photo */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-xs font-bold text-slate-700 mb-3">Photo</span>
        <div>
          <label className="block text-slate-700 mb-1 font-bold">Upload Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.files?.[0] || null })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20 transition-all"
        >
          Create Employee
        </button>
      </div>
    </form>
  );
};