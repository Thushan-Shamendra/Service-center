import React, { useState, useEffect } from 'react';
import { Shield, Globe, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../../api/settingsApi';

interface SystemConfigurationProps {
  onBack: () => void;
}

export const SystemConfiguration: React.FC<SystemConfigurationProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [systemConfig, setSystemConfig] = useState({
    // Security
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
    
    // Regional Settings
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 Hour',
    
    // Notifications
    lowStockAlerts: true,
    purchaseOrderAlerts: true,
    leaveApprovalNotifications: true,
    paymentNotifications: true,
    systemAlerts: true,
  });

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getSystemConfiguration();
      if (res.success) {
        setSystemConfig(res.data);
      }
    } catch (error) {
      console.error('Failed to load system configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await settingsApi.updateSystemConfiguration(systemConfig);
      if (res.success) {
        toast.success('System configuration saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save system configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center py-8 text-slate-500">Loading system configuration...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-6">System Configuration</h2>

      {/* Security */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Password Policy</label>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Minimum Password Length</label>
            <input
              type="number"
              value={systemConfig.passwordMinLength}
              onChange={(e) => setSystemConfig({ ...systemConfig, passwordMinLength: parseInt(e.target.value) || 8 })}
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              min="6"
              max="20"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={systemConfig.requireUppercase}
                onChange={(e) => setSystemConfig({ ...systemConfig, requireUppercase: e.target.checked })}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-xs text-slate-600">Require uppercase letter</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={systemConfig.requireLowercase}
                onChange={(e) => setSystemConfig({ ...systemConfig, requireLowercase: e.target.checked })}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-xs text-slate-600">Require lowercase letter</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={systemConfig.requireNumber}
                onChange={(e) => setSystemConfig({ ...systemConfig, requireNumber: e.target.checked })}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-xs text-slate-600">Require number</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={systemConfig.requireSpecialChar}
                onChange={(e) => setSystemConfig({ ...systemConfig, requireSpecialChar: e.target.checked })}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-xs text-slate-600">Require special character</span>
            </label>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Regional Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Currency</label>
            <select
              value={systemConfig.currency}
              onChange={(e) => setSystemConfig({ ...systemConfig, currency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="LKR">LKR - Sri Lankan Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Time Zone</label>
            <select
              value={systemConfig.timezone}
              onChange={(e) => setSystemConfig({ ...systemConfig, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="Asia/Colombo">Asia/Colombo (UTC+5:30)</option>
              <option value="UTC">UTC (UTC+0)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Date Format</label>
            <select
              value={systemConfig.dateFormat}
              onChange={(e) => setSystemConfig({ ...systemConfig, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Time Format</label>
            <select
              value={systemConfig.timeFormat}
              onChange={(e) => setSystemConfig({ ...systemConfig, timeFormat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="12 Hour">12 Hour</option>
              <option value="24 Hour">24 Hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </h3>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.lowStockAlerts}
              onChange={(e) => setSystemConfig({ ...systemConfig, lowStockAlerts: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs text-slate-600">Low Stock Alerts</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.purchaseOrderAlerts}
              onChange={(e) => setSystemConfig({ ...systemConfig, purchaseOrderAlerts: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs text-slate-600">Purchase Order Alerts</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.leaveApprovalNotifications}
              onChange={(e) => setSystemConfig({ ...systemConfig, leaveApprovalNotifications: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs text-slate-600">Leave Approval Notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.paymentNotifications}
              onChange={(e) => setSystemConfig({ ...systemConfig, paymentNotifications: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs text-slate-600">Payment Notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={systemConfig.systemAlerts}
              onChange={(e) => setSystemConfig({ ...systemConfig, systemAlerts: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs text-slate-600">System Alerts</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};
