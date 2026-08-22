import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { vehicleApi } from '../../api/vehicleApi';
import { invoiceApi } from '../../api/invoiceApi';
import { jobCardApi } from '../../api/jobCardApi';
import { User, Customer, Vehicle, Invoice, JobCard } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { InvoiceDetailsModal } from '../../components/manager/InvoiceDetailsModal';
import { formatLKR, formatPhone, formatDate, formatNIC } from '../../utils/formatters';
import {
  ArrowLeft,
  Edit,
  Car,
  Wrench,
  FileText,
  DollarSign,
  Phone,
  Mail,
  IdCard,
  Calendar,
  MapPin,
  User as UserIcon,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'details' | 'vehicles' | 'history' | 'ledger';

export const CustomerDetailsPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Determine active tab from URL path
  const pathTab = window.location.pathname.split('/').pop() as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(
    ['details', 'vehicles', 'history', 'ledger'].includes(pathTab) ? pathTab : 'details'
  );

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/manager/customers/${customerId}/${tab}`, { replace: true });
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [customer, setCustomer] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    if (!customerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching customer data for ID:', customerId);
      
      // First, try to get users and find the one matching the customerId
      const usersRes = await userApi.getUsers({ role: 'customer', limit: 100 });
      console.log('Users API response:', usersRes);
      
      if (usersRes.success) {
        // Find the customer by customerId or _id
        const customerData = usersRes.data.find((u: any) => 
          u._id === customerId || 
          u.id === customerId || 
          (u.profile && u.profile.customerId === customerId)
        );
        
        if (customerData) {
          console.log('Customer found:', customerData);
          setCustomer(customerData);
          
          // Use the actual MongoDB _id for related queries
          const actualId = customerData._id || customerData.id;
          
          // Fetch related data using the actual database ID
          const [vehiclesRes, jobCardsRes, invoicesRes] = await Promise.all([
            vehicleApi.getVehicles({ customer: actualId }).catch((err) => {
              console.error('Vehicles API error:', err);
              return { success: false, data: [] };
            }),
            jobCardApi.getJobCards({ limit: 50 }).catch((err) => {
              console.error('Job cards API error:', err);
              return { success: false, data: [] };
            }),
            invoiceApi.getInvoices({ limit: 50 }).catch((err) => {
              console.error('Invoices API error:', err);
              return { success: false, data: [] };
            }),
          ]);

          console.log('Vehicles API response:', vehiclesRes);
          console.log('Using customer ID for vehicle query:', actualId);

          if (vehiclesRes.success) {
            setVehicles(vehiclesRes.data);
          }

          if (jobCardsRes.success) {
            // Filter job cards for this customer
            const customerJobCards = jobCardsRes.data.filter((jc: JobCard) => 
              jc.customer === actualId || (typeof jc.customer === 'object' && jc.customer._id === actualId)
            );
            setJobCards(customerJobCards);
          }

          if (invoicesRes.success) {
            // Filter invoices for this customer
            const customerInvoices = invoicesRes.data.filter((inv: Invoice) =>
              inv.customer === actualId || (typeof inv.customer === 'object' && inv.customer._id === actualId)
            );
            setInvoices(customerInvoices);
          }
        } else {
          console.error('Customer not found with ID:', customerId);
          setError('Customer not found');
        }
      } else {
        console.error('Failed to fetch users:', usersRes.message);
        setError(usersRes.message || 'Failed to fetch customer details');
      }

    } catch (err: any) {
      console.error('Error fetching customer data:', err);
      setError(err.response?.data?.message || err.message || 'Error loading customer data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const profile = customer?.profile || {};
  const customerIdDisplay = profile.customerId || customer?.id;

  // Debug: Log customer data structure
  console.log('Customer data:', customer);
  console.log('Profile data:', profile);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchCustomerData} />;
  if (!customer) return <ErrorState message="Customer not found" />;

  const stats = {
    vehicles: vehicles.length,
    services: jobCards.length,
    invoices: invoices.length,
    outstanding: profile.outstandingBalance || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/manager/customers"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
            <p className="text-sm text-slate-500">Customer details and management</p>
          </div>
        </div>
        <Link
          to={`/manager/customers/${customerId}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit Customer
        </Link>
      </div>

      {/* Customer Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-brand-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{customer.fullName}</h2>
              <StatusBadge status={profile.status || 'active'} />
            </div>
            <p className="text-sm text-slate-500 mb-4">{customerIdDisplay}</p>
            
            <div className="flex flex-wrap gap-6 text-sm">
              {customer.mobile && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  {formatPhone(customer.mobile)}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
              )}
              {profile.nic && (
                <div className="flex items-center gap-2 text-slate-600">
                  <IdCard className="w-4 h-4" />
                  {formatNIC(profile.nic)}
                </div>
              )}
              {customer.createdAt && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  Member since: {formatDate(customer.createdAt)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Vehicles"
            value={stats.vehicles}
            icon={Car}
            subtext="Registered vehicles"
            color="blue"
          />
          <StatCard
            title="Services"
            value={stats.services}
            icon={Wrench}
            subtext="Total services"
            color="purple"
          />
          <StatCard
            title="Invoices"
            value={stats.invoices}
            icon={FileText}
            subtext="Total invoices"
            color="amber"
          />
          <StatCard
            title="Outstanding"
            value={formatLKR(stats.outstanding)}
            icon={DollarSign}
            subtext="Balance due"
            color="rose"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex">
            {[
              { id: 'details' as TabType, label: 'Customer Details' },
              { id: 'vehicles' as TabType, label: 'Registered Vehicles' },
              { id: 'history' as TabType, label: 'Service History' },
              { id: 'ledger' as TabType, label: 'Customer Ledger' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">CUSTOMER DETAILS</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">First Name</label>
                  <p className="text-sm text-slate-900">{customer.firstName}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Name</label>
                  <p className="text-sm text-slate-900">{customer.lastName}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">NIC</label>
                  <p className="text-sm text-slate-900">
                    {customer?.nic || profile?.nic || customer?.profile?.nic || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gender</label>
                  <p className="text-sm text-slate-900 capitalize">
                    {profile.gender || customer.gender || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mobile</label>
                  <p className="text-sm text-slate-900">{formatPhone(customer.mobile)}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                  <p className="text-sm text-slate-900">{customer.email || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Address</label>
                  <p className="text-sm text-slate-900">
                    {(customer?.address?.street || profile?.address?.street || customer?.profile?.address?.street) ? (
                      <>
                        {customer?.address?.street || profile?.address?.street || customer?.profile?.address?.street}
                        {(customer?.address?.city || profile?.address?.city || customer?.profile?.address?.city) && `, ${customer?.address?.city || profile?.address?.city || customer?.profile?.address?.city}`}
                        {(customer?.address?.province || profile?.address?.province || customer?.profile?.address?.province) && `, ${customer?.address?.province || profile?.address?.province || customer?.profile?.address?.province}`}
                        {(customer?.address?.postalCode || profile?.address?.postalCode || customer?.profile?.address?.postalCode) && ` ${customer?.address?.postalCode || profile?.address?.postalCode || customer?.profile?.address?.postalCode}`}
                      </>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Portal Username</label>
                  <p className="text-sm text-slate-900">{customer.username}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                  <StatusBadge status={profile.status || 'active'} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">REGISTERED VEHICLES</h3>
                <Link
                  to="/manager/vehicles/new"
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium text-sm"
                >
                  <Car className="w-4 h-4" />
                  Register Vehicle
                </Link>
              </div>

              {vehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border border-slate-200 rounded-xl p-4 hover:border-brand-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</h4>
                          <p className="text-sm text-slate-500">{vehicle.registrationNumber}</p>
                        </div>
                        <Link
                          to={`/manager/vehicles/${vehicle.id}`}
                          className="text-xs text-brand-600 hover:text-brand-700"
                        >
                          View Vehicle
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Year:</span>
                          <span className="ml-1 text-slate-900">{vehicle.manufactureYear || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Fuel:</span>
                          <span className="ml-1 text-slate-900 capitalize">{vehicle.fuelType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Transmission:</span>
                          <span className="ml-1 text-slate-900 capitalize">{vehicle.transmission || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Mileage:</span>
                          <span className="ml-1 text-slate-900">{vehicle.currentMileage?.toLocaleString() || 'N/A'} km</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                        <Link
                          to={`/manager/customers/${customerId}/history?vehicle=${vehicle.id}`}
                          className="text-xs text-brand-600 hover:text-brand-700"
                        >
                          Service History
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No vehicles registered</p>
                  <Link
                    to="/manager/vehicles/new"
                    className="inline-block mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    Register first vehicle
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">SERVICE HISTORY</h3>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>

              {jobCards.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Job Card</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Vehicle</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Service</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobCards.map((jobCard) => {
                          const vehicle = vehicles.find(v => v.id === jobCard.vehicle);
                          return (
                            <tr key={jobCard.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-sm font-medium text-brand-600">
                                {jobCard.jobCardNumber}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">
                                {formatDate(jobCard.createdAt)}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">
                                {vehicle?.registrationNumber || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">
                                {jobCard.complaint}
                              </td>
                              <td className="py-3 px-4 text-sm text-right text-slate-900">
                                {formatLKR(jobCard.estimatedCost)}
                              </td>
                              <td className="py-3 px-4">
                                <StatusBadge status={jobCard.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between text-sm pt-4 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Total Services:</span>
                      <span className="ml-2 font-bold text-slate-900">{jobCards.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Spent:</span>
                      <span className="ml-2 font-bold text-slate-900">
                        {formatLKR(jobCards.reduce((sum, jc) => sum + jc.estimatedCost, 0))}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No service history found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">CUSTOMER LEDGER</h3>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm">
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Total Invoiced</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatLKR(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatLKR(invoices.reduce((sum, inv) => sum + inv.amountPaid, 0))}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Outstanding Balance</p>
                  <p className="text-lg font-bold text-rose-600">
                    {formatLKR(profile.outstandingBalance || 0)}
                  </p>
                </div>
              </div>

              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Invoice No</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Total Amount</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount Paid</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Balance</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                        >
                          <td className="py-3 px-4 text-sm font-medium text-brand-600">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatDate(invoice.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-900">
                            {formatLKR(invoice.grandTotal)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-900">
                            {formatLKR(invoice.amountPaid)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-900">
                            {formatLKR(invoice.outstandingBalance)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={invoice.paymentStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No invoice history found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoiceId && (
        <InvoiceDetailsModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
};