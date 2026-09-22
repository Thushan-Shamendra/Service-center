import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/ui/Logo';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  Truck,
  UserCheck,
  DollarSign,
  FileBarChart,
  Settings,
  Bell,
  User,
  LogOut,
  Car,
  Calendar,
  ClipboardList,
  FileText,
  Receipt,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  Star,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const getNavLinks = () => {
    switch (user.role) {
      case 'administrator':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'User Management', path: '/admin/users', icon: Users },
          { label: 'Service Management', path: '/admin/services', icon: Wrench },
          { label: 'Inventory Management', path: '/admin/inventory', icon: Package },
          { label: 'Supplier Management', path: '/admin/suppliers', icon: Truck },
          { label: 'Human Resources', path: '/admin/hr', icon: UserCheck },
          { label: 'Financial Management', path: '/admin/financial-management', icon: DollarSign },
          { label: 'Reports', path: '/admin/reports', icon: FileBarChart },
          { label: 'Settings', path: '/admin/settings', icon: Settings },
        ];

      case 'manager':
        return [
          { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
          { label: 'Customers', path: '/manager/customers', icon: Users },
          { label: 'Vehicles', path: '/manager/vehicles', icon: Car },
          { label: 'Appointments', path: '/manager/appointments', icon: Calendar },
          { label: 'Job Cards', path: '/manager/job-cards', icon: ClipboardList },
          { label: 'Quotations', path: '/manager/quotations', icon: FileText },
          { label: 'Invoices', path: '/manager/invoices', icon: Receipt },
          { label: 'Payments', path: '/manager/payments', icon: CreditCard },
          { label: 'Inventory Usage', path: '/manager/inventory-usage', icon: Package },
          { label: 'Parts Requests', path: '/manager/parts-requests', icon: Package },
          { label: 'Leave Management', path: '/manager/leave-management', icon: Calendar },
          { label: 'Reports', path: '/manager/reports', icon: FileBarChart },
          { label: 'Notifications', path: '/manager/notifications', icon: Bell },
          { label: 'Profile', path: '/manager/profile', icon: User },
        ];

      case 'employee':
        return [
          { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
          { label: 'Assigned Jobs', path: '/employee/assigned-jobs', icon: ClipboardList },
          { label: 'Repair Progress', path: '/employee/repair-progress', icon: Wrench },
          { label: 'Parts Requests', path: '/employee/parts-requests', icon: Package },
          { label: 'Final Inspection', path: '/employee/final-inspection', icon: CheckCircle2 },
          { label: 'Attendance', path: '/employee/attendance', icon: Clock },
          { label: 'Leave Management', path: '/employee/leave-management', icon: Calendar },
          { label: 'Advances & Loans', path: '/employee/advances', icon: DollarSign },
          { label: 'Profile', path: '/employee/profile', icon: User },
        ];

      case 'customer':
        return [
          { label: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
          { label: 'My Account', path: '/customer/account', icon: User },
          { label: 'My Vehicles', path: '/customer/vehicles', icon: Car },
          { label: 'Appointments', path: '/customer/appointments', icon: Calendar },
          { label: 'Service Tracking', path: '/customer/tracking', icon: ShieldCheck },
          { label: 'Quotations', path: '/customer/quotations', icon: FileText },
          { label: 'Service History', path: '/customer/history', icon: RotateCcw },
          { label: 'Invoices & Payments', path: '/customer/invoices', icon: Receipt },
          { label: 'Notifications', path: '/customer/notifications', icon: Bell },
          { label: 'Reviews', path: '/customer/reviews', icon: Star },
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-surface-sidebar text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-slate-800 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <Logo variant="light" size="md" />
        </div>

        {/* User Role Tag */}
        <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Role: <span className="text-brand-400">{user.role}</span>
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
