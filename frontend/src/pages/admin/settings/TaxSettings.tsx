import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../../api/settingsApi';

interface TaxSettingsProps {
  onBack: () => void;
}

interface TaxRate {
  _id?: string;
  name: string;
  rate: number;
  status: 'active' | 'inactive';
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTaxRateModal, setShowTaxRateModal] = useState(false);
  
  const [taxSettings, setTaxSettings] = useState({
    enableTax: true,
    defaultTaxRate: 18.00,
    taxRegistrationNumber: '',
    taxInclusivePricing: false,
  });

  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [taxRateForm, setTaxRateForm] = useState({
    name: '',
    rate: 0,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchTaxSettings();
  }, []);

  const fetchTaxSettings = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getTaxSettings();
      if (res.success) {
        setTaxSettings(res.data.settings);
        setTaxRates(res.data.taxRates || []);
      }
    } catch (error) {
      console.error('Failed to load tax settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTaxSettings = async () => {
    setIsSubmitting(true);
    try {
      const res = await settingsApi.updateTaxSettings({ settings: taxSettings, taxRates });
      if (res.success) {
        toast.success('Tax settings saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save tax settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTaxRate = async () => {
    if (!taxRateForm.name || taxRateForm.rate === 0) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await settingsApi.updateTaxSettings({ 
        settings: taxSettings, 
        taxRates: [...taxRates, taxRateForm] 
      });
      if (res.success) {
        toast.success('Tax rate added successfully');
        setShowTaxRateModal(false);
        setTaxRateForm({ name: '', rate: 0, status: 'active' });
        fetchTaxSettings();
      }
    } catch (error) {
      toast.error('Failed to add tax rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTaxRate = (index: number) => {
    const newTaxRates = taxRates.filter((_, i) => i !== index);
    setTaxRates(newTaxRates);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center py-8 text-slate-500">Loading tax settings...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Tax Settings</h2>

      {/* Default Tax Configuration */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Default Tax Configuration
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={taxSettings.enableTax}
              onChange={(e) => setTaxSettings({ ...taxSettings, enableTax: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs font-bold text-slate-700">Enable Tax</span>
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Default Tax Rate</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={taxSettings.defaultTaxRate}
                onChange={(e) => setTaxSettings({ ...taxSettings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                min="0"
                max="100"
                step="0.01"
              />
              <span className="text-xs text-slate-600">%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tax Registration Number</label>
            <input
              type="text"
              value={taxSettings.taxRegistrationNumber}
              onChange={(e) => setTaxSettings({ ...taxSettings, taxRegistrationNumber: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              placeholder="Enter tax registration number"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-3">Tax-Inclusive Pricing</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!taxSettings.taxInclusivePricing}
                  onChange={() => setTaxSettings({ ...taxSettings, taxInclusivePricing: false })}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-xs text-slate-600">Tax added to prices</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={taxSettings.taxInclusivePricing}
                  onChange={() => setTaxSettings({ ...taxSettings, taxInclusivePricing: true })}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-xs text-slate-600">Prices include tax</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Rates */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-700">Tax Rates</h3>
          <button
            onClick={() => setShowTaxRateModal(true)}
            className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Tax Rate
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Name</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Rate</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Status</th>
                <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxRates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-xs text-slate-500">
                    No tax rates configured
                  </td>
                </tr>
              ) : (
                taxRates.map((rate, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-xs font-medium text-slate-900">{rate.name}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{rate.rate}%</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rate.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rate.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleDeleteTaxRate(index)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          onClick={handleSaveTaxSettings}
          disabled={isSubmitting}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Add Tax Rate Modal */}
      {showTaxRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Tax Rate</h3>
              <button
                onClick={() => setShowTaxRateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Receipt className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={taxRateForm.name}
                  onChange={(e) => setTaxRateForm({ ...taxRateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Standard"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Rate (%) *</label>
                <input
                  type="number"
                  value={taxRateForm.rate}
                  onChange={(e) => setTaxRateForm({ ...taxRateForm, rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
                <select
                  value={taxRateForm.status}
                  onChange={(e) => setTaxRateForm({ ...taxRateForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowTaxRateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTaxRate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Tax Rate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
