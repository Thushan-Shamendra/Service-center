import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { activityApi } from '../../api/activityApi';
import { 
  User, 
  Lock, 
  Bell, 
  Activity, 
  ArrowLeft, 
  Camera, 
  Save, 
  X,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'personal' | 'security' | 'notifications' | 'activity';

export const ManagerProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Activity Data State
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Personal Information Form State
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    nic: '',
    gender: 'male',
    mobile: '',
    email: '',
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Initialize tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['personal', 'security', 'notifications', 'activity'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setPersonalForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        nic: user.nic || '',
        gender: user.gender || 'male',
        mobile: user.mobile || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Fetch activities when activity tab is active
  useEffect(() => {
    const fetchActivities = async () => {
      if (activeTab === 'activity') {
        setIsLoadingActivities(true);
        try {
          const res = await activityApi.getActivities({ limit: 20 });
          if (res.success) {
            setActivities(res.data || []);
          }
        } catch (error) {
          console.error('Error fetching activities:', error);
          toast.error('Failed to load activities');
        } finally {
          setIsLoadingActivities(false);
        }
      }
    };

    fetchActivities();
  }, [activeTab]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handlePersonalInfoSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user context
      await updateProfile({
        ...user,
        ...personalForm,
        fullName: `${personalForm.firstName} ${personalForm.lastName}`,
        gender: personalForm.gender as 'male' | 'female' | 'other',
      });
      
      // Log activity
      await activityApi.logActivity({
        action: 'Updated profile',
        details: 'Personal information updated',
        type: 'update',
        module: 'profile',
      });
      
      toast.success('Personal information updated successfully');
    } catch (error) {
      toast.error('Failed to update personal information');
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
        if (res.data) {
          updateProfile(res.data);
        }
      }
    } catch (error) {
      toast.error('Failed to upload profile photo');
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrength < 80) {
      toast.error('Password is not strong enough');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowChangePasswordModal(false);
      setShowSuccessModal(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordStrength(0);
      
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'personal' as TabType, label: 'Personal Information', icon: User },
    { id: 'security' as TabType, label: 'Security', icon: Lock },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'activity' as TabType, label: 'Activity', icon: Activity },
  ];

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>;
      case 'logout':
        return <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-slate-600" /></div>;
      case 'create':
        return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div>;
      case 'update':
        return <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-indigo-600" /></div>;
      case 'delete':
        return <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-red-600" /></div>;
      case 'approve':
        return <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-amber-600" /></div>;
      case 'reject':
        return <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-red-600" /></div>;
      case 'notification':
        return <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"><Bell className="w-4 h-4 text-purple-600" /></div>;
      case 'payment':
        return <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>;
      default:
        return <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Activity className="w-4 h-4 text-slate-600" /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">My Profile</h1>
                <p className="text-xs text-slate-500">Manage your personal information and account settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 mb-6 inline-flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {activeTab === 'personal' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Photo Section */}
                <div className="lg:col-span-1">
                  <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-100">
                    <div className="w-32 h-32 mx-auto rounded-2xl bg-brand-50 text-brand-600 border-2 border-blue-100 flex items-center justify-center font-bold text-3xl mb-4 relative">
                      {user?.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.fullName}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        <span>
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </span>
                      )}
                      <label className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                        <Camera className="w-4 h-4 text-slate-600" />
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-1">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">MANAGER</p>
                    <label className="text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer">
                      Change Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-xs font-medium text-slate-600">Active</span>
                    </div>
                  </div>
                </div>

                {/* Personal Information Form */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">PERSONAL INFORMATION</h3>
                  
                  <div className="space-y-4">
                    {/* Manager ID (Read-only) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Manager ID</label>
                      <input
                        type="text"
                        value="MGR-00012"
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={personalForm.firstName}
                          onChange={(e) => setPersonalForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          value={personalForm.lastName}
                          onChange={(e) => setPersonalForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">NIC / Passport</label>
                      <input
                        type="text"
                        value={personalForm.nic}
                        onChange={(e) => setPersonalForm(prev => ({ ...prev, nic: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Gender</label>
                      <select
                        value={personalForm.gender}
                        onChange={(e) => setPersonalForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Mobile Number</label>
                      <input
                        type="tel"
                        value={personalForm.mobile}
                        onChange={(e) => setPersonalForm(prev => ({ ...prev, mobile: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={personalForm.email}
                        onChange={(e) => setPersonalForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Work Information */}
                  <h3 className="text-sm font-bold text-slate-500 uppercase mt-8 mb-4">WORK INFORMATION</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
                      <input
                        type="text"
                        value="Manager"
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Employee/Manager ID</label>
                      <input
                        type="text"
                        value="MGR-00012"
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Joined Date</label>
                      <input
                        type="text"
                        value="15 January 2025"
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-8">
                    <button
                      onClick={() => navigate(-1)}
                      className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePersonalInfoSave}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6">
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Security Settings</h3>
                <p className="text-sm text-slate-600 mb-6">Manage your password and security preferences</p>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Password</h4>
                      <p className="text-xs text-slate-500">Last changed 30 days ago</p>
                    </div>
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="mt-6 bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-700">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6">
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Notification Preferences</h3>
                <p className="text-sm text-slate-600 mb-6">Choose how you want to be notified</p>

                <div className="space-y-4">
                  {['Email notifications', 'SMS notifications', 'Push notifications', 'Appointment reminders', 'Payment alerts'].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                      <button className={`w-12 h-6 rounded-full transition-colors ${index < 3 ? 'bg-brand-600' : 'bg-slate-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${index < 3 ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Account Activity</h3>
              <p className="text-sm text-slate-600 mb-6">Recent actions and login history</p>

              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity._id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                        <p className="text-xs text-slate-500">{activity.details || 'No details'}</p>
                      </div>
                      <span className="text-xs text-slate-400">{formatTime(new Date(activity.createdAt))}</span>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingActivities && activities.length > 0 && (
                <button className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">
                  View Full Activity
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength */}
              {passwordForm.newPassword && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength >= 80 ? 'text-emerald-600' : 
                      passwordStrength >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {passwordStrength >= 80 ? 'Strong' : passwordStrength >= 60 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength >= 80 ? 'bg-emerald-500' : 
                        passwordStrength >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center gap-2 ${passwordForm.newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${passwordForm.newPassword.length >= 8 ? 'fill-current' : ''}`} />
                      At least 8 characters
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(passwordForm.newPassword) ? 'fill-current' : ''}`} />
                      Uppercase letter
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[a-z]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${/[a-z]/.test(passwordForm.newPassword) ? 'fill-current' : ''}`} />
                      Lowercase letter
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(passwordForm.newPassword) ? 'fill-current' : ''}`} />
                      Number
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle className={`w-3 h-3 ${/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'fill-current' : ''}`} />
                      Special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordUpdate}
                disabled={isSaving || passwordStrength < 80}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Password Updated</h3>
            <p className="text-sm text-slate-600 mb-6">
              Your password has been changed successfully.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
