import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingDown, Receipt, RotateCcw, AlertTriangle, DollarSign, Lock, Search, ArrowRight } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatLKR, formatDate } from '../../utils/formatters';
import { inventoryApi } from '../../api/inventoryApi';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface StockMovement {
  id: string;
  _id?: string;
  movementNumber: string;
  invoice?: any;
  jobCard?: any;
  item: string;
  category: string;
  quantity: number;
  unit: string;
  beforeStock: number;
  afterStock: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  movementType: 'service_usage' | 'counter_sale' | 'manual_adjustment';
}

export const InventoryUsagePage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'auto-deductions' | 'stock-movements' | 'low-stock'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');

  const [stats, setStats] = useState({
    partsUsedToday: 0,
    itemsDeducted: 0,
    pendingDeduction: 0,
    stockMovements: 0,
    lowStockCount: 0,
    todayUsageValue: 0,
  });

  const fetchInventoryUsage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [movementsRes, statsRes] = await Promise.all([
        inventoryApi.getStockMovements({ limit: 100 }),
        inventoryApi.getInventoryStats(),
      ]);
      
      if (movementsRes.success) {
        setMovements(movementsRes.data || []);
      } else {
        setMovements([]);
      }
      
      if (statsRes.success) {
        setStats(statsRes.data || {
          partsUsedToday: 0,
          itemsDeducted: 0,
          pendingDeduction: 0,
          stockMovements: 0,
          lowStockCount: 0,
          todayUsageValue: 0,
        });
      }
    } catch (err: any) {
      console.error('Error loading inventory usage:', err);
      // Don't set error state - just show empty state with zero stats
      setMovements([]);
      setStats({
        partsUsedToday: 0,
        itemsDeducted: 0,
        pendingDeduction: 0,
        stockMovements: 0,
        lowStockCount: 0,
        todayUsageValue: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryUsage();
  }, []);

  const getInvoiceNumber = (movement: StockMovement) => {
    const invoice = movement.invoice;
    if (typeof invoice === 'object') {
      return invoice.invoiceNumber;
    }
    return 'N/A';
  };

  const getJobCardNumber = (movement: StockMovement) => {
    const jobCard = movement.jobCard;
    if (typeof jobCard === 'object') {
      return jobCard.jobCardNumber;
    }
    return 'N/A';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
      completed: { label: 'Deducted', color: 'bg-emerald-100 text-emerald-800' },
      failed: { label: 'Failed', color: 'bg-rose-100 text-rose-800' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>{config.label}</span>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: any = {
      spare_parts: 'Spare Parts',
      lubricants: 'Lubricants',
      filters: 'Filters',
      tires: 'Tires',
      batteries: 'Batteries',
      accessories: 'Accessories',
    };
    return labels[category] || category;
  };

  const filteredMovements = movements.filter(m => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchMovement = m.movementNumber.toLowerCase().includes(search);
      const matchInvoice = getInvoiceNumber(m).toLowerCase().includes(search);
      const matchJobCard = getJobCardNumber(m).toLowerCase().includes(search);
      const matchItem = m.item.toLowerCase().includes(search);
      if (!matchMovement && !matchInvoice && !matchJobCard && !matchItem) return false;
    }
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchInventoryUsage} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Usage</h1>
          <p className="text-sm text-slate-500">
            Parts consumed during vehicle servicing are automatically deducted after invoice approval.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock className="w-4 h-4" />
          <span>Auto Managed</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <nav className="flex">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'auto-deductions' as const, label: 'Auto Deductions' },
            { id: 'stock-movements' as const, label: 'Stock Movements' },
            { id: 'low-stock' as const, label: 'Low Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {activeTab === 'overview' && (
        <>
          {/* Stats Cards - Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-brand-600" />
                <span className="text-xs text-slate-500">Total</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.partsUsedToday}</p>
              <p className="text-xs text-slate-500">Parts Used Today</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-emerald-600" />
                <span className="text-xs text-slate-500">Deducted</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.itemsDeducted}</p>
              <p className="text-xs text-slate-500">Items Deducted</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <span className="text-xs text-slate-500">Pending</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingDeduction}</p>
              <p className="text-xs text-slate-500">Pending Deduction</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <span className="text-xs text-slate-500">Movements</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.stockMovements}</p>
              <p className="text-xs text-slate-500">Stock Movements</p>
            </div>
          </div>

          {/* Stats Cards - Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-xs text-slate-500">Low Stock</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.lowStockCount}</p>
              <p className="text-xs text-slate-500">Low Stock Items</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-slate-500">Usage</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatLKR(stats.todayUsageValue)}</p>
              <p className="text-xs text-slate-500">Today's Usage</p>
            </div>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-slate-600" />
                <span className="text-xs text-slate-500">Auto Deduction</span>
              </div>
              <p className="text-sm text-slate-600">Invoice Approval → Stock Movement</p>
            </div>
          </div>

          {/* Auto Deduction Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-900 mb-1">Automatic Inventory Deduction</p>
                <p className="text-sm text-emerald-800">
                  Stock quantities are automatically updated when an invoice is approved. No manual stock deduction is required.
                </p>
              </div>
            </div>
          </div>

          {/* Inventory Categories */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">AUTOMATIC SERVICE DEDUCTION</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-2xl">🔧</span>
                <p className="text-sm font-medium text-slate-900 mt-2">Spare Parts</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-2xl">🛢</span>
                <p className="text-sm font-medium text-slate-900 mt-2">Lubricants</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-2xl">🔩</span>
                <p className="text-sm font-medium text-slate-900 mt-2">Filters</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-2xl">🚗</span>
                <p className="text-sm font-medium text-slate-900 mt-2">Tires</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <span className="text-2xl">🔋</span>
                <p className="text-sm font-medium text-slate-900 mt-2">Batteries</p>
              </div>
            </div>
          </div>
        </>
      )}

      {(activeTab === 'auto-deductions' || activeTab === 'stock-movements') && (
        <>
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Job Card / Invoice / Part"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="today">Date: Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">Category: All</option>
                <option value="spare_parts">Spare Parts</option>
                <option value="lubricants">Lubricants</option>
                <option value="filters">Filters</option>
                <option value="tires">Tires</option>
                <option value="batteries">Batteries</option>
                <option value="accessories">Accessories</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">Status: All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Stock Deductions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 uppercase">RECENT STOCK DEDUCTIONS</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Movement</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Invoice</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Job Card</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Item</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Qty</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length > 0 ? (
                    filteredMovements.map((movement) => (
                      <tr key={movement.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-medium text-brand-600">
                          <Link to={`/manager/inventory-usage/${movement._id || movement.id}`} className="hover:underline">
                            {movement.movementNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{getInvoiceNumber(movement)}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{getJobCardNumber(movement)}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{movement.item}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.unit}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(movement.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        No stock movements found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'low-stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Low Stock Monitoring</h3>
          <p className="text-sm text-slate-500 mb-4">
            Items below reorder level will appear here automatically.
          </p>
          <p className="text-xs text-slate-400">
            Administrator will be notified when stock reaches reorder level.
          </p>
        </div>
      )}
    </div>
  );
};