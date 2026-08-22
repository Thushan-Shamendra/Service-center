import React, { useState } from 'react';
import { Building2, Clock, Receipt, Palette, Settings, Database } from 'lucide-react';
import { CompanyInformation } from './settings/CompanyInformation';
import { WorkingHours } from './settings/WorkingHours';
import { TaxSettings } from './settings/TaxSettings';
import { Branding } from './settings/Branding';
import { SystemConfiguration } from './settings/SystemConfiguration';
import { SystemMaintenance } from './settings/SystemMaintenance';

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');

  const SETTINGS_CARDS = [
    { key: 'company', label: 'Company Information', icon: Building2, description: 'Manage company details and logo' },
    { key: 'hours', label: 'Working Hours & Holidays', icon: Clock, description: 'Configure operating hours and holidays' },
    { key: 'tax', label: 'Tax Settings', icon: Receipt, description: 'Configure tax rates and settings' },
    { key: 'branding', label: 'Branding', icon: Palette, description: 'Customize appearance and invoice template' },
    { key: 'system', label: 'System Configuration', icon: Settings, description: 'Security, regional settings, notifications' },
    { key: 'maintenance', label: 'System Maintenance', icon: Database, description: 'Backup and system maintenance' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">⚙ Settings</h2>
        <p className="text-sm text-slate-500">Configure company, working hours, tax, branding and system preferences</p>
      </div>

      {!activeSection ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTINGS_CARDS.map(({ key, label, icon: Icon, description }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                <Icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{label}</h3>
              <p className="text-xs text-slate-500">{description}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button
            onClick={() => setActiveSection('')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 mb-4"
          >
            ← Back to Settings
          </button>
          {activeSection === 'company' && <CompanyInformation onBack={() => setActiveSection('')} />}
          {activeSection === 'hours' && <WorkingHours onBack={() => setActiveSection('')} />}
          {activeSection === 'tax' && <TaxSettings onBack={() => setActiveSection('')} />}
          {activeSection === 'branding' && <Branding onBack={() => setActiveSection('')} />}
          {activeSection === 'system' && <SystemConfiguration onBack={() => setActiveSection('')} />}
          {activeSection === 'maintenance' && <SystemMaintenance onBack={() => setActiveSection('')} />}
        </>
      )}
    </div>
  );
};
