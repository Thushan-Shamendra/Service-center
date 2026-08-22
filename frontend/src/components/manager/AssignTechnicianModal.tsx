import React, { useState } from 'react';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Wrench,
  User as UserIcon,
  Car,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  X,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Technician {
  id: string;
  name: string;
  currentJobs: number;
  status: 'available' | 'busy' | 'on-break';
}

interface AssignTechnicianModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (technicianId: string) => void;
}

export const AssignTechnicianModal: React.FC<AssignTechnicianModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onAssign,
}) => {
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [notifyTechnician, setNotifyTechnician] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock technicians data - in real app, fetch from API
  const technicians: Technician[] = [
    { id: 'tech1', name: 'Kasun', currentJobs: 3, status: 'busy' },
    { id: 'tech2', name: 'Amila', currentJobs: 2, status: 'busy' },
    { id: 'tech3', name: 'Nuwan', currentJobs: 1, status: 'available' },
    { id: 'tech4', name: 'Priya', currentJobs: 0, status: 'available' },
  ];

  const handleSubmit = async () => {
    if (!selectedTechnician) {
      toast.error('Please select a technician');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(selectedTechnician);
      
      if (notifyTechnician) {
        toast.success('Notification sent to technician');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to assign technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCustomerName = () => {
    if (typeof appointment.customer === 'object' && appointment.customer.user) {
      return `${appointment.customer.user.firstName} ${appointment.customer.user.lastName}`;
    }
    return 'Unknown';
  };

  const getVehicleInfo = () => {
    if (typeof appointment.vehicle === 'object') {
      return `${appointment.vehicle.registrationNumber} - ${appointment.vehicle.make} ${appointment.vehicle.model}`;
    }
    return 'Unknown';
  };

  const getEstimatedCompletion = () => {
    const duration = appointment.estimatedDuration || 2;
    const [hours, minutes] = appointment.preferredTime.split(' ');
    const [hour, period] = hours.split(':');
    let hourNum = parseInt(hour);
    if (period === 'PM' && hourNum !== 12) hourNum += 12;
    if (period === 'AM' && hourNum === 12) hourNum = 0;
    
    const completionHour = hourNum + Math.floor(duration);
    const completionMin = parseInt(minutes) + ((duration % 1) * 60);
    const completionPeriod = completionHour >= 12 ? 'PM' : 'AM';
    const displayHour = completionHour > 12 ? completionHour - 12 : (completionHour === 0 ? 12 : completionHour);
    
    return `${String(displayHour).padStart(2, '0')}:${String(Math.floor(completionMin)).padStart(2, '0')} ${completionPeriod}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <Wrench className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Assign Technician</h3>
              <p className="text-sm text-slate-500">{appointment.appointmentNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Details */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Appointment Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{getCustomerName()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{getVehicleInfo()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {formatDate(appointment.preferredDate)} • {appointment.preferredTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{appointment.serviceType}</span>
              </div>
            </div>
          </div>

          {/* Available Technicians */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Available Technicians</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                      Select
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                      Current Work
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((tech) => (
                    <tr
                      key={tech.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedTechnician(tech.id)}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="radio"
                          checked={selectedTechnician === tech.id}
                          onChange={() => setSelectedTechnician(tech.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{tech.name}</td>
                      <td className="py-3 px-4 text-slate-600">{tech.currentJobs} jobs</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {tech.status === 'available' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-emerald-600">Available</span>
                            </>
                          ) : tech.status === 'busy' ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span className="text-sm text-amber-600">In Workshop</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">On Break</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estimated Completion */}
          {selectedTechnician && (
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Estimated Duration</p>
                  <p className="font-medium text-slate-900">{appointment.estimatedDuration || 2} hours</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Est. Completion</p>
                  <p className="font-medium text-slate-900">{getEstimatedCompletion()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Option */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyTechnician}
                onChange={(e) => setNotifyTechnician(e.target.checked)}
                className="rounded"
              />
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Notify technician about assignment</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedTechnician}
            className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Technician'}
          </button>
        </div>
      </div>
    </div>
  );
};
