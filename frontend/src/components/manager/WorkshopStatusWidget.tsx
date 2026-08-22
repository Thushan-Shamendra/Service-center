import React from 'react';
import { Factory, Users, Calendar, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';

interface WorkshopStatusWidgetProps {
  todayAppointments?: number;
  totalSlots?: number;
  techniciansAvailable?: number;
  techniciansTotal?: number;
  baysOccupied?: number;
  baysTotal?: number;
}

export const WorkshopStatusWidget: React.FC<WorkshopStatusWidgetProps> = ({
  todayAppointments = 8,
  totalSlots = 12,
  techniciansAvailable = 3,
  techniciansTotal = 4,
  baysOccupied = 4,
  baysTotal = 6,
}) => {
  const today = dayjs().format('YYYY-MM-DD');
  const capacityPercentage = Math.round((todayAppointments / totalSlots) * 100);
  const technicianPercentage = Math.round((techniciansAvailable / techniciansTotal) * 100);
  const bayPercentage = Math.round((baysOccupied / baysTotal) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Factory className="w-5 h-5 text-brand-600" />
        <h3 className="font-bold text-slate-900">Workshop Status</h3>
      </div>

      <div className="space-y-4">
        {/* Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Today</span>
          </div>
          <span className="text-sm font-medium text-slate-900">{today}</span>
        </div>

        {/* Total Appointments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Total Appointments</span>
            <span className="text-sm font-medium text-slate-900">
              {todayAppointments} / {totalSlots} Slots
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${capacityPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">Capacity</span>
            <span className={`text-xs font-medium ${
              capacityPercentage >= 90 ? 'text-rose-600' :
              capacityPercentage >= 70 ? 'text-amber-600' :
              'text-emerald-600'
            }`}>
              {capacityPercentage}%
            </span>
          </div>
        </div>

        {/* Technicians */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Technicians</span>
            </div>
            <span className="text-sm font-medium text-slate-900">
              {techniciansAvailable} / {techniciansTotal} Available
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${technicianPercentage}%` }}
            />
          </div>
        </div>

        {/* Service Bays */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Service Bays</span>
            <span className="text-sm font-medium text-slate-900">
              {baysOccupied} / {baysTotal} Occupied
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${bayPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              capacityPercentage >= 90 ? 'bg-rose-500' :
              capacityPercentage >= 70 ? 'bg-amber-500' :
              'bg-emerald-500'
            }`} />
            <span className={`text-xs font-medium ${
              capacityPercentage >= 90 ? 'text-rose-600' :
              capacityPercentage >= 70 ? 'text-amber-600' :
              'text-emerald-600'
            }`}>
              {capacityPercentage >= 90 ? 'High Load' :
              capacityPercentage >= 70 ? 'Moderate Load' :
              'Normal Load'}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500">Efficiency</p>
              <p className="text-sm font-medium text-slate-900">87%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <div>
              <p className="text-xs text-slate-500">Avg. Time</p>
              <p className="text-sm font-medium text-slate-900">2.3h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
