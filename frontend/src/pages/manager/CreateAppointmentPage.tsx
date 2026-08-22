import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import { customerApi } from '../../api/customerApi';
import { vehicleApi } from '../../api/vehicleApi';
import { Customer, Vehicle } from '../../types';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Search,
  Plus,
  Car,
  User as UserIcon,
  Wrench,
  Calendar,
  Clock,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

type Step = 'customer' | 'vehicle' | 'service' | 'review';

export const CreateAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customer selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Vehicle selection
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Service details
  const [complaint, setComplaint] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [preferredDate, setPreferredDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [preferredTime, setPreferredTime] = useState('09:00 AM');
  const [estimatedDuration, setEstimatedDuration] = useState('2');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [notes, setNotes] = useState('');
  
  // Generated appointment ID
  const [appointmentId, setAppointmentId] = useState('');

  useEffect(() => {
    generateAppointmentId();
    fetchCustomers();
  }, []);

  const generateAppointmentId = () => {
    const year = dayjs().year();
    const random = Math.floor(Math.random() * 9000) + 1000;
    setAppointmentId(`APP-${year}-${random}`);
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.getCustomers({ limit: 100 });
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err: any) {
      setError('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerVehicles = async (customerId: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching vehicles for customer:', customerId);
      const res = await vehicleApi.getVehicles({ limit: 100, customer: customerId });
      console.log('Vehicles response:', res);
      if (res.success) {
        setVehicles(res.data || []);
      } else {
        toast.error(res.message || 'Failed to load vehicles');
      }
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      toast.error('Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    fetchCustomerVehicles(customer._id || customer.id);
  };

  const handleNext = () => {
    if (currentStep === 'customer' && !selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (currentStep === 'vehicle' && !selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }
    if (currentStep === 'service') {
      if (!complaint.trim()) {
        toast.error('Please enter a complaint');
        return;
      }
      if (!serviceType) {
        toast.error('Please select a service type');
        return;
      }
    }
    
    const steps: Step[] = ['customer', 'vehicle', 'service', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['customer', 'vehicle', 'service', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const mongoCustomerId = selectedCustomer?._id || selectedCustomer?.id;
      const mongoVehicleId = selectedVehicle?._id || selectedVehicle?.id;
      
      console.log('Creating appointment with:', {
        customer: mongoCustomerId,
        vehicle: mongoVehicleId,
        serviceType,
        preferredDate,
        preferredTime,
        userRole: user?.role,
      });

      // Auto-approve if created by manager or admin
      const appointmentStatus = (user?.role === 'manager' || user?.role === 'administrator') 
        ? 'approved' 
        : 'pending';

      const res = await appointmentApi.createAppointment({
        customer: mongoCustomerId,
        vehicle: mongoVehicleId,
        serviceType,
        complaint,
        preferredDate,
        preferredTime,
        estimatedDuration: parseFloat(estimatedDuration),
        assignedTechnician: assignedTechnician || undefined,
        notes,
        status: appointmentStatus,
      });

      console.log('Appointment creation response:', res);

      if (res.success) {
        toast.success('Appointment created successfully');
        const appointmentId = res.data._id || res.data.id;
        console.log('Navigating to appointment:', appointmentId);
        navigate(`/manager/appointments/${appointmentId}`);
      } else {
        console.error('Appointment creation failed:', res.message);
        setError(res.message || 'Failed to create appointment');
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.response?.data?.message || 'Error creating appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const userObj = typeof customer.user === 'object' ? customer.user : null;
    const firstName = userObj?.firstName || '';
    const lastName = userObj?.lastName || '';
    const email = userObj?.email || '';
    const customerId = customer.customerId || '';
    
    return (
      `${firstName} ${lastName}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
      email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customerId.toLowerCase().includes(customerSearch.toLowerCase())
    );
  });

  if (isLoading && customers.length === 0) return <LoadingSkeleton />;
  if (error && customers.length === 0) return <ErrorState message={error} onRetry={fetchCustomers} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/manager/appointments"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">✚ New Appointment</h1>
          <p className="text-sm text-slate-500">
            Appointment ID: {appointmentId} (Auto Generated)
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-center justify-between">
          {[
            { step: 'customer', label: 'Select Customer', icon: UserIcon },
            { step: 'vehicle', label: 'Select Vehicle', icon: Car },
            { step: 'service', label: 'Service Details', icon: Wrench },
            { step: 'review', label: 'Review', icon: Check },
          ].map((item, index) => {
            const steps: Step[] = ['customer', 'vehicle', 'service', 'review'];
            const currentIndex = steps.indexOf(currentStep);
            const itemIndex = steps.indexOf(item.step as Step);
            const isCompleted = itemIndex < currentIndex;
            const isCurrent = itemIndex === currentIndex;
            const Icon = item.icon;

            return (
              <div key={item.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      isCurrent ? 'text-brand-600 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        {/* Step 1: Select Customer */}
        {currentStep === 'customer' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Step 1: Select Customer</h2>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

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
                      NIC/Passport
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer._id || customer.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="radio"
                          checked={selectedCustomer?._id === customer._id || selectedCustomer?.id === customer.id}
                          onChange={() => handleCustomerSelect(customer)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {typeof customer.user === 'object' ? `${customer.user?.firstName || ''} ${customer.user?.lastName || ''}` : 'Customer'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {customer.customerId || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {typeof customer.user === 'object' ? customer.user?.mobile : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link
              to="/manager/customers/new"
              className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add New Customer
            </Link>
          </div>
        )}

        {/* Step 2: Select Vehicle */}
        {currentStep === 'vehicle' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Step 2: Select Vehicle</h2>
            
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                Customer: <span className="font-medium text-slate-900">
                  {typeof selectedCustomer?.user === 'object' ? `${selectedCustomer.user?.firstName || ''} ${selectedCustomer.user?.lastName || ''}` : 'Customer'}
                </span>
              </p>
            </div>

            {vehicles.length > 0 ? (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedVehicle?.id === vehicle.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={selectedVehicle?.id === vehicle.id}
                        onChange={() => setSelectedVehicle(vehicle)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-slate-600">
                          {(vehicle as any).year || vehicle.manufactureYear} • {vehicle.color}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No vehicles found for this customer</p>
                <Link
                  to={`/manager/vehicles/new?customer=${selectedCustomer?._id || selectedCustomer?.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Vehicle
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Service Details */}
        {currentStep === 'service' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Step 3: Service Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Complaint *
              </label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={3}
                placeholder="Describe the issue or service request..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

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
                <option value="ac-service">AC Service</option>
                <option value="electrical">Electrical Work</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preferred Date *
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
                  Preferred Time *
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estimated Duration (hours) *
                </label>
                <input
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  min="0.5"
                  step="0.5"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assigned Technician
                </label>
                <select
                  value={assignedTechnician}
                  onChange={(e) => setAssignedTechnician(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Auto Assign</option>
                  <option value="tech1">Kasun</option>
                  <option value="tech2">Amila</option>
                  <option value="tech3">Nuwan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional notes..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Review Appointment Details</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Customer</h3>
                <p className="font-medium text-slate-900">
                  {typeof selectedCustomer?.user === 'object' ? `${selectedCustomer.user?.firstName || ''} ${selectedCustomer.user?.lastName || ''}` : 'Customer'}
                </p>
                <p className="text-sm text-slate-600">
                  {typeof selectedCustomer?.user === 'object' ? selectedCustomer.user?.mobile : ''}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Vehicle</h3>
                <p className="font-medium text-slate-900">
                  {selectedVehicle?.registrationNumber}
                </p>
                <p className="text-sm text-slate-600">
                  {selectedVehicle?.make} {selectedVehicle?.model} ({(selectedVehicle as any)?.year || selectedVehicle?.manufactureYear})
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Service</h3>
                <p className="font-medium text-slate-900">{serviceType}</p>
                <p className="text-sm text-slate-600">{complaint}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-medium text-slate-900">{formatDate(preferredDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="font-medium text-slate-900">{preferredTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="font-medium text-slate-900">{estimatedDuration} hours</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Technician</p>
                    <p className="font-medium text-slate-900">
                      {assignedTechnician || 'Auto Assign'}
                    </p>
                  </div>
                </div>
              </div>

              {notes && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Notes</h3>
                  <p className="text-sm text-slate-600">{notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={currentStep === 'customer' ? () => navigate('/manager/appointments') : handleBack}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            {currentStep === 'customer' ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Appointment'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
