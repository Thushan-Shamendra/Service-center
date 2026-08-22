import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Filter, Download } from 'lucide-react';

export const AppointmentReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/manager/reports"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Reports</h1>
          <p className="text-sm text-slate-500">View and analyze appointment data</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Appointment Statistics</h2>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-sm text-emerald-600">Total Appointments</p>
            <p className="text-2xl font-bold text-emerald-700">1,234</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-600">Confirmed</p>
            <p className="text-2xl font-bold text-blue-700">856</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <p className="text-sm text-amber-600">Pending</p>
            <p className="text-2xl font-bold text-amber-700">234</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl">
            <p className="text-sm text-rose-600">Cancelled</p>
            <p className="text-2xl font-bold text-rose-700">144</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Confirmed</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Pending</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Cancelled</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-sm text-slate-900">2026-08-16</td>
                <td className="py-3 px-4 text-sm text-slate-600">24</td>
                <td className="py-3 px-4 text-sm text-emerald-600">18</td>
                <td className="py-3 px-4 text-sm text-amber-600">4</td>
                <td className="py-3 px-4 text-sm text-rose-600">2</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-sm text-slate-900">2026-08-15</td>
                <td className="py-3 px-4 text-sm text-slate-600">28</td>
                <td className="py-3 px-4 text-sm text-emerald-600">22</td>
                <td className="py-3 px-4 text-sm text-amber-600">4</td>
                <td className="py-3 px-4 text-sm text-rose-600">2</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-sm text-slate-900">2026-08-14</td>
                <td className="py-3 px-4 text-sm text-slate-600">32</td>
                <td className="py-3 px-4 text-sm text-emerald-600">26</td>
                <td className="py-3 px-4 text-sm text-amber-600">4</td>
                <td className="py-3 px-4 text-sm text-rose-600">2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
