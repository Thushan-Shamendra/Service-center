import React, { useState, useEffect } from 'react';
import { Clock, Plus, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../../api/settingsApi';
import { formatDate } from '../../../utils/formatters';

interface WorkingHoursProps {
  onBack: () => void;
}

interface Holiday {
  _id?: string;
  date: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

export const WorkingHours: React.FC<WorkingHoursProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  
  const [workingHours, setWorkingHours] = useState({
    openingTime: '08:00',
    closingTime: '17:30',
    enableValidation: true,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
  });

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchWorkingHours();
    fetchHolidays();
  }, []);

  const fetchWorkingHours = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getWorkingHours();
      if (res.success) {
        setWorkingHours(res.data);
      }
    } catch (error) {
      console.error('Failed to load working hours');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await settingsApi.getHolidays();
      if (res.success) {
        setHolidays(res.data);
      }
    } catch (error) {
      console.error('Failed to load holidays');
    }
  };

  const handleSaveWorkingHours = async () => {
    setIsSubmitting(true);
    try {
      const res = await settingsApi.updateWorkingHours(workingHours);
      if (res.success) {
        toast.success('Working hours saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save working hours');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.date || !holidayForm.name) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await settingsApi.addHoliday(holidayForm);
      if (res.success) {
        toast.success('Holiday added successfully');
        setShowHolidayModal(false);
        setHolidayForm({ date: '', name: '', description: '', status: 'active' });
        fetchHolidays();
      }
    } catch (error) {
      toast.error('Failed to add holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await settingsApi.deleteHoliday(id);
      if (res.success) {
        toast.success('Holiday deleted successfully');
        fetchHolidays();
      }
    } catch (error) {
      toast.error('Failed to delete holiday');
    }
  };

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center py-8 text-slate-500">Loading working hours...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Working Hours & Holidays</h2>

      {/* Working Hours */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Working Hours
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Opening Time</label>
              <input
                type="time"
                value={workingHours.openingTime}
                onChange={(e) => setWorkingHours({ ...workingHours, openingTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Closing Time</label>
              <input
                type="time"
                value={workingHours.closingTime}
                onChange={(e) => setWorkingHours({ ...workingHours, closingTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={workingHours.enableValidation}
              onChange={(e) => setWorkingHours({ ...workingHours, enableValidation: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-xs font-bold text-slate-700">Enable working-hour validation</span>
          </label>
        </div>
      </div>

      {/* Working Days */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-4">Working Days</h3>
        
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <label key={day} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={workingHours.workingDays[day as keyof typeof workingHours.workingDays]}
                onChange={(e) => setWorkingHours({
                  ...workingHours,
                  workingDays: { ...workingHours.workingDays, [day]: e.target.checked }
                })}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-xs font-bold text-slate-700 capitalize">{day.slice(0, 3)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Holiday List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Holiday List
          </h3>
          <button
            onClick={() => setShowHolidayModal(true)}
            className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Holiday
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Date</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Holiday Name</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-600">Status</th>
                <th className="text-right py-2 px-3 text-xs font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-xs text-slate-500">
                    No holidays added yet
                  </td>
                </tr>
              ) : (
                holidays.map((holiday) => (
                  <tr key={holiday._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-xs text-slate-600">{formatDate(holiday.date)}</td>
                    <td className="py-2 px-3 text-xs font-medium text-slate-900">{holiday.name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        holiday.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {holiday.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => holiday._id && handleDeleteHoliday(holiday._id)}
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
          onClick={handleSaveWorkingHours}
          disabled={isSubmitting}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Holiday</h3>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Holiday Date *</label>
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Holiday Name *</label>
                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Independence Day"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
                <input
                  type="text"
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
                <select
                  value={holidayForm.status}
                  onChange={(e) => setHolidayForm({ ...holidayForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowHolidayModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHoliday}
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Holiday'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
