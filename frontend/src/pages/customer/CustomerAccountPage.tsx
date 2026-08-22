import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import toast from 'react-hot-toast';
import { User, Lock, Save, MapPin, Calendar, ShieldCheck } from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    nic: '',
    mobile: '',
    email: '',
    address: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      // Handle address from user object or customer profile
      const addressObj = user.address || user.profile?.address || {};
      const addressString = [
        addressObj.street,
        addressObj.city,
        addressObj.province,
        addressObj.postalCode
      ].filter(Boolean).join(', ');

      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nic: user.nic || user.profile?.nic || '',
        mobile: user.mobile || '',
        email: user.email || '',
        address: addressString,
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Parse address string into object
      const addressParts = profileData.address.split(',').map(part => part.trim());
      const addressObj = {
        street: addressParts[0] || '',
        city: addressParts[1] || '',
        province: addressParts[2] || '',
        postalCode: addressParts[3] || '',
      };

      const dataToSend = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        nic: profileData.nic,
        mobile: profileData.mobile,
        email: profileData.email,
        address: addressObj,
      };

      const response = await userApi.updateProfile(dataToSend);
      if (response.success) {
        toast.success('Profile updated successfully');
        await refreshUser();
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
          <p className="text-sm text-slate-500">View and manage your profile information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* View Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">View Profile</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Customer ID - Read Only */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Customer ID
                </label>
                <input
                  type="text"
                  value={user?.profile?.customerId || 'N/A'}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">(Auto Filled, Read Only)</p>
              </div>

              {/* Username - Auto Filled */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">(Auto Filled)</p>
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">(Text)</p>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">(Text)</p>
            </div>

            {/* NIC / Passport */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                NIC / Passport
              </label>
              <input
                type="text"
                value={profileData.nic}
                onChange={(e) => setProfileData({ ...profileData, nic: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">(Text)</p>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <input
                type="text"
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">(Text)</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">(Email)</p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Address
              </label>
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">(Textarea)</p>
            </div>

            {/* Registration Date - Auto Filled */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Registration Date
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit' 
                    }).replace(/\//g, '/') : 'N/A'}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">(Auto)</p>
              </div>

              {/* Account Status - Auto Filled */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Account Status
                </label>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user?.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="text-sm text-slate-600">
                      {user?.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">(Auto Filled)</p>
              </div>
            </div>

            {/* Update Profile Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                required
                minLength={6}
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isChangingPassword ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
