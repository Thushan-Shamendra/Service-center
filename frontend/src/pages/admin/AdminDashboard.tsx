import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { inventoryApi } from '../../api/inventoryApi';
import { AdminSummaryData } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton, CardSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatLKR, formatDateTime } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  CreditCard,
  UserPlus,
  FileText,
  Bell,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getAdminSummary();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch summary data');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStockAlerts = async () => {
    try {
      // Fetch low stock items
      const lowRes = await inventoryApi.getInventory({ lowStock: true, limit: 10 });
      if (lowRes.success) {
        setLowStockItems(lowRes.data);
      }

      // Fetch out of stock items
      const outRes = await inventoryApi.getInventory({ outOfStock: true, limit: 10 });
      if (outRes.success) {
        setOutOfStockItems(outRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchStockAlerts();
  }, []);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block backdrop-blur-xs">
            System Administration
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Administrator Command Center
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Real-time database analytics, workforce performance, financial performance, and system activity logs.
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Managers"
          value={data?.totalManagers || 0}
          icon={Users}
          subtext="Active management personnel"
          color="purple"
        />
        <StatCard
          title="Total Employees"
          value={data?.totalEmployees || 0}
          icon={UserCheck}
          subtext="Staff & technicians"
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={data?.totalCustomers || 0}
          icon={UserCheck}
          subtext="Registered vehicle owners"
          color="emerald"
        />
        <StatCard
          title="Total Suppliers"
          value={data?.totalSuppliers || 0}
          icon={Truck}
          subtext="Active parts vendors"
          color="amber"
        />
        <StatCard
          title="Pending POs"
          value={data?.pendingPurchaseOrders || 0}
          icon={FileText}
          subtext="Awaiting processing"
          color="amber"
        />
        <StatCard
          title="Pending GRNs"
          value={data?.pendingGRNs || 0}
          icon={Package}
          subtext="Partial receipts"
          color="blue"
        />
      </div>

      {/* Second Row of Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          title="Pending Payables"
          value={data?.pendingPayables || 0}
          icon={CreditCard}
          subtext="Outstanding payments"
          color="rose"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatLKR(data?.monthlyRevenue || 0)}
          icon={DollarSign}
          subtext="Invoiced revenue this month"
          color="emerald"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatLKR(data?.monthlyExpenses || 0)}
          icon={CreditCard}
          subtext="Operational expenses"
          color="amber"
        />
        <StatCard
          title="Low Stock Items"
          value={data?.lowStockItems || 0}
          icon={AlertTriangle}
          subtext="Below reorder level"
          color="amber"
        />
      </div>

      {/* Stock Alert Notifications */}
      {showNotifications && (lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">Stock Alerts</h3>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-bold">
                {lowStockItems.length + outOfStockItems.length}
              </span>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-amber-600 hover:text-amber-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Low Stock Alerts */}
            {lowStockItems.slice(0, 3).map((item) => (
              <div key={item.id || item._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.itemName}</p>
                    <p className="text-[10px] text-slate-500">
                      Current: {item.quantity} {item.unit} | Reorder Level: {item.reorderLevel} {item.unit}
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/inventory"
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-bold transition-all"
                >
                  View Item
                </Link>
              </div>
            ))}

            {/* Out of Stock Alerts */}
            {outOfStockItems.slice(0, 2).map((item) => (
              <div key={item.id || item._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.itemName}</p>
                    <p className="text-[10px] text-red-600 font-bold">🔴 OUT OF STOCK</p>
                  </div>
                </div>
                <Link
                  to="/admin/inventory"
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-all"
                >
                  View Item
                </Link>
              </div>
            ))}
          </div>

          {(lowStockItems.length > 3 || outOfStockItems.length > 2) && (
            <Link
              to="/admin/inventory"
              className="block mt-3 text-center text-xs font-bold text-amber-700 hover:text-amber-900"
            >
              View all alerts →
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/admin/users?role=employee"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 text-brand-600 border border-blue-100 transition-all text-center group"
          >
            <UserPlus className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Add Employee</span>
          </Link>
          <Link
            to="/admin/users?role=manager"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 text-purple-600 border border-purple-100 transition-all text-center group"
          >
            <UserPlus className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Add Manager</span>
          </Link>
          <Link
            to="/admin/suppliers?action=new"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 border border-emerald-100 transition-all text-center group"
          >
            <Truck className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Add Supplier</span>
          </Link>
          <Link
            to="/admin/inventory?action=new"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 text-amber-600 border border-amber-100 transition-all text-center group"
          >
            <Package className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Add Inventory</span>
          </Link>
          <Link
            to="/admin/reports"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100 transition-all text-center group"
          >
            <FileText className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">View Reports</span>
          </Link>
        </div>
      </div>

      {/* Financial & Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Profit Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white border border-slate-700 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Monthly Net Profit
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              {formatLKR(data?.netProfit || 0)}
            </h3>
            <p className="text-xs text-slate-400">
              Calculated dynamically from backend aggregation APIs (Revenue − Expenses).
            </p>
          </div>

          <div className="pt-6 border-t border-slate-700/60 mt-6 flex items-center justify-between text-xs">
            <span className="text-slate-400">Employees Present Today:</span>
            <span className="font-bold text-emerald-400">{data?.employeesPresentToday || 0}</span>
          </div>
        </div>

        {/* Recent System Activity Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              <h3 className="text-base font-bold text-slate-800">Recent System Activity</h3>
            </div>
            <span className="text-xs text-slate-400">Live API stream</span>
          </div>

          {!data?.recentActivities || data.recentActivities.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No recent activity logs found in database.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {data.recentActivities.map((act) => (
                <div
                  key={act.id || act._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                    <div>
                      <p className="font-bold text-slate-800">{act.title}</p>
                      <p className="text-slate-500">{act.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(act.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
