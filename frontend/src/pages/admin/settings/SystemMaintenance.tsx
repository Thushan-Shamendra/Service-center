import React, { useState, useEffect } from 'react';
import { Database, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../../api/settingsApi';

interface SystemMaintenanceProps {
  onBack: () => void;
}

export const SystemMaintenance: React.FC<SystemMaintenanceProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: '',
    backupStatus: 'successful' as 'successful' | 'failed' | 'pending',
  });

  const [autoBackup, setAutoBackup] = useState({
    enabled: true,
    frequency: 'daily',
    backupTime: '02:00',
  });

  useEffect(() => {
    fetchBackupStatus();
  }, []);

  const fetchBackupStatus = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getBackupStatus();
      if (res.success) {
        setBackupStatus(res.data.backupStatus);
        setAutoBackup(res.data.autoBackup);
      }
    } catch (error) {
      console.error('Failed to load backup status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const res = await settingsApi.createBackup();
      if (res.success) {
        toast.success('Backup completed successfully');
        fetchBackupStatus();
      }
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSaveAutoBackupConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await settingsApi.updateSystemConfiguration({ autoBackup });
      if (res.success) {
        toast.success('Auto backup configuration saved');
      }
    } catch (error) {
      toast.error('Failed to save auto backup configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center py-8 text-slate-500">Loading backup status...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-6">System Maintenance</h2>

      {/* Database Backup */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Database Backup
        </h3>
        
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-600">Last Backup</span>
              <div className="text-sm font-bold text-slate-900">{backupStatus.lastBackup || 'No backup performed yet'}</div>
            </div>
            <div className="flex items-center gap-2">
              {backupStatus.backupStatus === 'successful' && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">Successful</span>
                </div>
              )}
              {backupStatus.backupStatus === 'failed' && (
                <div className="flex items-center gap-1 text-rose-600">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">Failed</span>
                </div>
              )}
              {backupStatus.backupStatus === 'pending' && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold">Pending</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="w-full px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isBackingUp ? 'Backing up...' : 'Backup Now'}
          </button>
        </div>
      </div>

      {/* Automatic Backup */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Automatic Backup</h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoBackup.enabled}
              onChange={(e) => setAutoBackup({ ...autoBackup, enabled: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs font-bold text-slate-700">Enable Automatic Backup</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Frequency</label>
              <select
                value={autoBackup.frequency}
                onChange={(e) => setAutoBackup({ ...autoBackup, frequency: e.target.value })}
                disabled={!autoBackup.enabled}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Backup Time</label>
              <input
                type="time"
                value={autoBackup.backupTime}
                onChange={(e) => setAutoBackup({ ...autoBackup, backupTime: e.target.value })}
                disabled={!autoBackup.enabled}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          <button
            onClick={handleSaveAutoBackupConfig}
            disabled={isSavingConfig || !autoBackup.enabled}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isSavingConfig ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Back to Settings
        </button>
      </div>
    </div>
  );
};
