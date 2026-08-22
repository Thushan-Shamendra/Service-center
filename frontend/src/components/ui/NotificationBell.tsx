import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { notificationApi } from '../../api/notificationApi';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      notificationApi
        .getNotifications({ limit: 1, unread: true })
        .then((res) => {
          if (res.success) setUnreadCount(res.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-brand-500 hover:bg-blue-50 rounded-xl transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        unreadCount={unreadCount}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </div>
  );
};