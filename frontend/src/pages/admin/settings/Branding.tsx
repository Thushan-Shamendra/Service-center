import React, { useState, useEffect } from 'react';
import { Palette, Upload, Eye, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../../api/settingsApi';

interface BrandingProps {
  onBack: () => void;
}

export const Branding: React.FC<BrandingProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  
  const [branding, setBranding] = useState({
    logo: '',
    invoiceHeader: 'VSMS.LK - Vehicle Service Management System\nAddress | Phone | Email',
    invoiceFooter: 'Thank you for choosing VSMS.LK. Please retain this invoice.',
    primaryColor: '#0000FF',
    secondaryColor: '#EAF2FF',
  });

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getBranding();
      if (res.success) {
        setBranding(res.data);
      }
    } catch (error) {
      console.error('Failed to load branding settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload PNG, JPG, or SVG files only');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async () => {
    setIsSubmitting(true);
    try {
      const res = await settingsApi.updateBranding(branding);
      if (res.success) {
        toast.success('Branding saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save branding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreDefault = () => {
    setBranding({
      logo: '',
      invoiceHeader: 'VSMS.LK - Vehicle Service Management System\nAddress | Phone | Email',
      invoiceFooter: 'Thank you for choosing VSMS.LK. Please retain this invoice.',
      primaryColor: '#0000FF',
      secondaryColor: '#EAF2FF',
    });
    toast.success('Restored default branding');
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center py-8 text-slate-500">Loading branding settings...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Branding</h2>

      {/* Company Logo */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Company Logo
        </h3>
        
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
          {branding.logo ? (
            <div className="space-y-4">
              <div className="w-48 h-32 mx-auto bg-slate-50 rounded-lg flex items-center justify-center">
                <img src={branding.logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <label className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-3 h-3" />
                Upload New Logo
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-48 h-32 mx-auto bg-slate-50 rounded-lg flex items-center justify-center">
                <span className="text-xs text-slate-400">VSMS.LK LOGO</span>
              </div>
              <label className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-3 h-3" />
                Upload Logo
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Header */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Invoice Header</h3>
        <textarea
          value={branding.invoiceHeader}
          onChange={(e) => setBranding({ ...branding, invoiceHeader: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          rows={3}
          placeholder="VSMS.LK - Vehicle Service Management System\nAddress | Phone | Email"
        />
      </div>

      {/* Invoice Footer */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Invoice Footer</h3>
        <textarea
          value={branding.invoiceFooter}
          onChange={(e) => setBranding({ ...branding, invoiceFooter: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          rows={2}
          placeholder="Thank you for choosing VSMS.LK. Please retain this invoice."
        />
      </div>

      {/* Theme Colors */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Theme Colors</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-4 p-4 rounded-lg border border-slate-200" style={{ backgroundColor: branding.secondaryColor }}>
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-slate-500">LIVE PREVIEW</span>
          </div>
          <div className="text-center">
            <div className="inline-block px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: branding.primaryColor }}>
              VSMS.LK
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <button className="px-3 py-1 rounded text-white text-xs font-bold" style={{ backgroundColor: branding.primaryColor }}>
              Save
            </button>
            <button className="px-3 py-1 rounded border text-xs font-bold" style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Template Preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-700">Invoice Template</h3>
          <button
            onClick={() => setShowInvoicePreview(!showInvoicePreview)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            {showInvoicePreview ? 'Hide' : 'Preview'}
          </button>
        </div>

        {showInvoicePreview && (
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="text-center mb-4 pb-4 border-b border-slate-200">
              <div className="text-sm font-bold text-slate-900 whitespace-pre-line">{branding.invoiceHeader}</div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice No:</span>
                <span className="font-mono font-bold">INV-000125</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span>13/08/2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Customer:</span>
                <span>CUS-00025</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2">Service</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">Full Service</td>
                    <td className="text-right">1</td>
                    <td className="text-right">8,500</td>
                    <td className="text-right font-bold">8,500</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">Engine Oil</td>
                    <td className="text-right">1</td>
                    <td className="text-right">6,500</td>
                    <td className="text-right font-bold">6,500</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Sub Total</span>
                <span className="font-bold">LKR 16,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax</span>
                <span className="font-bold">LKR 2,970</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>GRAND TOTAL</span>
                <span>LKR 19,470</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
              {branding.invoiceFooter}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button
          onClick={handleRestoreDefault}
          className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Restore Default
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveBranding}
          disabled={isSubmitting}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
};
