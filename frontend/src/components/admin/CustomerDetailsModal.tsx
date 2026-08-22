import React from 'react';
import { X, User, Phone, Mail, Calendar, Car, Wrench, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { User as UserType } from '../../types';
import { formatPhone, formatDate, formatLKR } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: UserType | null;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  if (!isOpen || !customer) return null;

  const customerData = customer as any;
  const vehicles = customerData.vehicles || [];
  const totalServices = customerData.totalServices || 0;
  const completedServices = customerData.completedServices || 0;
  const pendingServices = customerData.pendingServices || 0;
  const outstandingBalance = customerData.outstandingBalance || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-extrabold text-slate-900 mb-6">Customer Details</h3>

        {/* Customer Header */}
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl font-bold">
              {customer.firstName[0]}
              {customer.lastName[0]}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900">{customer.fullName}</h4>
              <p className="text-sm text-slate-600 font-mono">{customerData.customerId || 'CUS-00001'}</p>
              <div className="mt-1">
                <StatusBadge status={customer.isActive ? 'active' : 'inactive'} />
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-6">
          <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Personal Information
          </h5>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Customer ID</span>
              <span className="font-semibold text-slate-800 font-mono">{customerData.customerId || 'CUS-00001'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Name</span>
              <span className="font-semibold text-slate-800">{customer.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Phone</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {formatPhone(customer.mobile)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Email</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {customer.email}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block mb-1">Registration Date</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Registered Vehicles */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-6">
          <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Registered Vehicles
          </h5>
          {vehicles.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No vehicles registered</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Vehicle No.</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Vehicle</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Model</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Services</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 px-3 font-mono text-slate-800">{vehicle.registrationNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{vehicle.make}</td>
                      <td className="py-2 px-3 text-slate-600">{vehicle.model}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800">{vehicle.serviceCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Service Summary */}
        <div className="bg-slate-50 rounded-2xl p-6">
          <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Service Summary
          </h5>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-brand-600">{totalServices}</div>
              <div className="text-xs text-slate-500 mt-1">Total Services</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 flex items-center justify-center gap-1">
                <CheckCircle className="w-5 h-5" />
                {completedServices}
              </div>
              <div className="text-xs text-slate-500 mt-1">Completed</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1">
                <Clock className="w-5 h-5" />
                {pendingServices}
              </div>
              <div className="text-xs text-slate-500 mt-1">Pending</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Outstanding Balance</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{formatLKR(outstandingBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};