import React, { useState, useEffect } from 'react';
import { Upload, X, Building2, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../../api/settingsApi';

interface CompanyInformationProps {
  onBack: () => void;
}

export const CompanyInformation: React.FC<CompanyInformationProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [company, setCompany] = useState({
    name: 'VSMS Auto Care (Pvt) Ltd',
    registrationNumber: '',
    phone: '+94 77 123 4567',
    email: 'info@company.lk',
    address: '',
    addressLine2: '',
  });

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getCompanyInfo();
      if (res.success) {
        setCompany(res.data);
        if (res.data.logo) {
          setLogoPreview(res.data.logo);
        }
      }
    } catch (error) {
      console.error('Failed to load company info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload PNG, JPG, or SVG files only');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await settingsApi.updateCompanyInfo({ ...company, logo: logoPreview });
      if (res.success) {
        toast.success('Company information saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save company information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onBack();
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center py-8 text-slate-500">Loading company information...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Company Information</h2>

      {/* Basic Company Details */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Basic Company Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Company Name *</label>
            <input
              type="text"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              placeholder="VSMS Auto Care (Pvt) Ltd"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Registration Number *</label>
            <input
              type="text"
              value={company.registrationNumber}
              onChange={(e) => setCompany({ ...company, registrationNumber: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              placeholder="PV 12345678"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="+94 77 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="info@company.lk"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Address *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                rows={2}
                placeholder="No. 45, Galle Road, Colombo 03, Sri Lanka"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Address Line 2</label>
            <input
              type="text"
              value={company.addressLine2}
              onChange={(e) => setCompany({ ...company, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              placeholder="Additional address details"
            />
          </div>
        </div>
      </div>

      {/* Company Logo */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Company Logo</h3>
        
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
          {logoPreview ? (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-slate-50 rounded-lg flex items-center justify-center">
                <img src={logoPreview} alt="Company Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
                <label className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  Upload New
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-slate-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-12 h-12 text-slate-300" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">COMPANY LOGO</p>
                <label className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-3 h-3" />
                  Upload Logo
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-slate-400">PNG, JPG, SVG • Max 5MB • Recommended: 1:1 or 3:1 ratio</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
