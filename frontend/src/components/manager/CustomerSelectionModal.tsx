import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { User } from '../../types';
import { formatPhone } from '../../utils/formatters';
import { Search, X, User as UserIcon, Car, Check } from 'lucide-react';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: User) => void;
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getUsers({ role: 'customer', limit: 1000 });
      if (res.success) {
        setCustomers(res.data);
        setFilteredCustomers(res.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter((customer) => {
        const profile = customer.profile || {};
        const customerId = profile.customerId || customer.id;
        const fullName = customer.fullName.toLowerCase();
        const mobile = customer.mobile || '';
        const nic = profile.nic || '';
        
        return (
          customerId.toLowerCase().includes(query) ||
          fullName.includes(query) ||
          mobile.includes(query) ||
          nic.includes(query)
        );
      });
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Select Customer</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name / Customer ID / Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => {
                const profile = customer.profile || {};
                const customerId = profile.customerId || customer.id;
                const vehicleCount = profile.vehicles?.length || 0;
                
                return (
                  <div
                    key={customer.id}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onSelectCustomer(customer)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{customer.fullName}</p>
                          <p className="text-xs text-slate-500 mt-1">{customerId}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatPhone(customer.mobile)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Car className="w-3 h-3" />
                            <span>{vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors">
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <UserIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No customers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};