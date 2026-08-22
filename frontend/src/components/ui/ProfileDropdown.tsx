import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Settings, LogOut, ChevronDown } from 'lucide-react';

export const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'manager':
        return 'Workshop Manager';
      case 'administrator':
        return 'Administrator';
      case 'employee':
        return 'Technician';
      case 'customer':
        return 'Customer';
      default:
        return user?.role || 'User';
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 pl-2 border-l border-slate-100 hover:bg-slate-50 rounded-xl pr-3 py-1.5 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 border border-blue-100 flex items-center justify-center font-bold text-xs">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.fullName}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span>{getInitials()}</span>
            )}
          </div>

          <div className="hidden md:block leading-tight text-left">
            <p className="text-xs font-bold text-slate-800">{user?.fullName || 'User'}</p>
            <p className="text-[10px] font-medium text-slate-400 capitalize">{user?.role || 'User'}</p>
          </div>

          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-blue-100 flex items-center justify-center font-bold text-sm">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.fullName}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-lg">{getInitials()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || 'User'}</p>
                  <p className="text-xs font-medium text-slate-500 truncate">{getRoleLabel()}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/manager/profile');
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                My Profile
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to profile with password tab
                  navigate('/manager/profile?tab=security');
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                Change Password
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to profile with settings tab
                  navigate('/manager/profile?tab=settings');
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Account Settings
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-2" />

            {/* Logout */}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sign out?</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to sign out of your VSMS.LK {user?.role || 'account'} account?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
