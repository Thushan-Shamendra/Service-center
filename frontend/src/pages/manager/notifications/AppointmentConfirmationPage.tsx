import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft, Mail, Phone } from 'lucide-react';

export const AppointmentConfirmationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/manager/notifications"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Confirmation</h1>
          <p className="text-sm text-slate-500">Send appointment confirmation notifications</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Confirmation Notification</h2>
            <p className="text-sm text-slate-500">Send confirmation to customers for approved appointments</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <h3 className="font-medium text-slate-900 mb-2">Email Template</h3>
            <p className="text-sm text-slate-600">
              Dear [Customer Name], Your appointment [Appointment ID] for [Vehicle] has been confirmed for [Date] at [Time].
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <h3 className="font-medium text-slate-900 mb-2">SMS Template</h3>
            <p className="text-sm text-slate-600">
              Your appointment is confirmed. Date: [Date], Time: [Time]. Thank you for choosing VSMS.LK!
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors">
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              <Phone className="w-4 h-4" />
              Send SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
