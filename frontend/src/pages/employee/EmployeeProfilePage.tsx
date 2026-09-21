import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Edit2,
  Camera,
  Save,
  Lock,
} from 'lucide-react';

export const EmployeeProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    mobile: '',
    email: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await userApi.getProfile();
      if (res.success) {
        setUser(res.data);
        setEditData({
          mobile: res.data.mobile || '',
          email: res.data.email || '',
        });
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await userApi.updateProfile(editData);
      if (res.success) {
        toast.success('Profile updated successfully');
        await fetchUserProfile();
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const res = await userApi.updateProfile(formData);
      if (res.success) {
        toast.success('Profile photo updated successfully');
        fetchUserProfile();
      }
    } catch (error) {
      toast.error('Failed to upload profile photo');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      const res = await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (res.success) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const employeeId = user?.employeeDetails?.employeeId || '';
  const fullName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const designation = user?.employeeDetails?.designation || '';
  const formatAddress = (address: any): string => {
    if (typeof address === 'string') return address;
    return [address?.street, address?.city, address?.province, address?.postalCode]
      .filter(Boolean).join(', ');
  };
  const address = formatAddress(user?.address) || formatAddress(user?.employeeDetails?.address);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personal Profile</h1>
            <p className="text-sm text-gray-600">View and manage your personal employee account</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="relative inline-block">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={fullName || 'Profile'}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-2 border-brand-500"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 cursor-pointer shadow-md">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <h2 className="text-xl font-bold mt-4">{fullName}</h2>
              <p className="text-sm text-gray-600">{employeeId}</p>
              <p className="text-sm text-gray-500 mt-1">{designation}</p>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium">Security</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Password</span>
                <span className="text-xs text-gray-500">Last changed: {user?.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleDateString() : 'Never'}</span>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Employee Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-6">Employee Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Employee ID</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={employeeId}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <span className="text-xs text-gray-400">🔒</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={fullName}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <span className="text-xs text-gray-400">🔒</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Department</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={user?.department || 'Workshop'}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <span className="text-xs text-gray-400">🔒</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Designation</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={designation}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <span className="text-xs text-gray-400">🔒</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Username</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <span className="text-xs text-gray-400">🔒</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={isEditing ? editData.email : user?.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    disabled={!isEditing}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${!isEditing ? 'bg-gray-50 text-gray-500' : ''}`}
                  />
                  <span className="text-xs text-gray-400">{isEditing ? '✎' : '🔒'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mobile Number</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="tel"
                    value={isEditing ? editData.mobile : user?.mobile || ''}
                    onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                    disabled={!isEditing}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${!isEditing ? 'bg-gray-50 text-gray-500' : ''}`}
                  />
                  <span className="text-xs text-gray-400">{isEditing ? '✎' : '🔒'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={address}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <span className="text-xs text-gray-400">🔒</span>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      mobile: user?.mobile || '',
                      email: user?.email || '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2 inline" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Change Password
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
