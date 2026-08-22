import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, ChevronRight } from 'lucide-react';
import { NotificationBell } from '../components/ui/NotificationBell';
import { ProfileDropdown } from '../components/ui/ProfileDropdown';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Generate Page Title and Breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const rawTitle = pathSegments[pathSegments.length - 1] || 'Dashboard';
  const pageTitle = rawTitle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span>VSMS</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="capitalize">{user?.role}</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">{pageTitle}</span>
          </div>

          <h1 className="text-lg font-bold text-slate-900 leading-tight capitalize">{pageTitle}</h1>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Profile Dropdown */}
        {user && <ProfileDropdown />}
      </div>
    </header>
  );
};
