import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import { userApi } from '../../api/userApi';
import { vehicleApi } from '../../api/vehicleApi';
import { User, Vehicle } from '../../types';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serviceType, setServiceType] = useState('');
  const [preferredDate, setPreferredDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [preferredTime, setPreferredTime] = useState('09:00 AM');
  const [complaint, setComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customers, setCustomers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const res = await userApi.getUsers({ role: 'customer', limit: 100 });
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchCustomerVehicles = async (customerId: string) => {
    try {
      const res = await vehicleApi.getVehicles({ limit: 100 });
      if (res.success) {
        const customerVehicles = (res.data || []).filter(
          (v: Vehicle) => v.customer === customerId
        );
        setVehicles(customerVehicles);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const handleCustomerSelect = (customer: User) => {
    setSelectedCustomer(customer);
    setSelectedVehicle(null);
    fetchCustomerVehicles(customer._id || customer.id);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedVehicle || !serviceType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await appointmentApi.createAppointment({
        customer: selectedCustomer._id || selectedCustomer.id,
        vehicle: selectedVehicle._id || selectedVehicle.id,
        serviceType,
        complaint,
        preferredDate,
        preferredTime,
        estimatedDuration: 2,
        status: 'pending',
      });

      if (res.success) {
        toast.success('Appointment created successfully');
        onSuccess();
      } else {
        toast.error(res.message || 'Failed to create appointment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      {/* Customer Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Customer *
        </label>
        <select
          value={selectedCustomer?._id || selectedCustomer?.id || ''}
          onChange={(e) => {
            const customer = customers.find(c => c._id === e.target.value || c.id === e.target.value);
            if (customer) handleCustomerSelect(customer);
          }}
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Select Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer._id || customer.id}>
              {customer.firstName} {customer.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Vehicle Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Vehicle *
        </label>
        <select
          value={selectedVehicle?._id || selectedVehicle?.id || ''}
          onChange={(e) => {
            const vehicle = vehicles.find(v => v._id === e.target.value || v.id === e.target.value);
            setSelectedVehicle(vehicle || null);
          }}
          disabled={!selectedCustomer}
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
        >
          <option value="">Select Vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle._id || vehicle.id}>
              {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
            </option>
          ))}
        </select>
        {selectedCustomer && vehicles.length === 0 && (
          <Link
            to={`/manager/vehicles/new?customer=${selectedCustomer._id || selectedCustomer.id}`}
            className="text-sm text-brand-600 hover:text-brand-700 mt-1 inline-block"
          >
            + Add Vehicle
          </Link>
        )}
      </div>

      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Service Type *
        </label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Select Service</option>
          <option value="full-service">Full Service</option>
          <option value="oil-change">Oil Change</option>
          <option value="brake-service">Brake Service</option>
          <option value="inspection">General Inspection</option>
          <option value="engine-diagnostics">Engine Diagnostics</option>
        </select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            min={dayjs().format('YYYY-MM-DD')}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Time *
          </label>
          <select
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="09:00 AM">09:00 AM</option>
            <option value="10:30 AM">10:30 AM</option>
            <option value="01:00 PM">01:00 PM</option>
            <option value="02:30 PM">02:30 PM</option>
            <option value="04:00 PM">04:00 PM</option>
          </select>
        </div>
      </div>

      {/* Complaint */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Complaint / Issue
        </label>
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          rows={2}
          placeholder="Describe the issue..."
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Appointment'}
        </button>
      </div>
    </div>
  );
};
