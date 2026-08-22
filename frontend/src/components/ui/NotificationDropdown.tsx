import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react';
import { NotificationItem, NotificationType } from '../../types';
import { notificationApi } from '../../api/notificationApi';
import { formatRelativeTime } from '../../utils/formatters';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    low_stock: '🔴',
    purchase_order_pending: '🟡',
    payment_due: '💰',
    user_added: '👤',
    leave_request: '📅',
    payroll: '💵',
    service_update: '🔧',
    system_alert: '⚠️',
    appointment_confirmed: '✅',
    appointment_rejected: '❌',
    appointment_reminder: '📅',
    vehicle_received: '🚗',
    repair_started: '🔧',
    waiting_for_parts: '⏳',
    vehicle_ready: '✅',
    invoice_generated: '📄',
    payment_received: '💰',
    service_reminder: '🔧',
    warranty_expiry: '⚠️',
    insurance_expiry: '⚠️',
    system: '⚙️',
    general: '🔔',
  };
  return icons[type] || '🔔';
};

const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    low_stock: 'bg-red-50 border-red-100 hover:bg-red-100',
    purchase_order_pending: 'bg-amber-50 border-amber-100 hover:bg-amber-100',
    payment_due: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100',
    user_added: 'bg-blue-50 border-blue-100 hover:bg-blue-100',
    leave_request: 'bg-purple-50 border-purple-100 hover:bg-purple-100',
    payroll: 'bg-green-50 border-green-100 hover:bg-green-100',
    service_update: 'bg-orange-50 border-orange-100 hover:bg-orange-100',
    system_alert: 'bg-slate-50 border-slate-100 hover:bg-slate-100',
    appointment_confirmed: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100',
    appointment_rejected: 'bg-red-50 border-red-100 hover:bg-red-100',
    appointment_reminder: 'bg-blue-50 border-blue-100 hover:bg-blue-100',
    vehicle_received: 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100',
    repair_started: 'bg-orange-50 border-orange-100 hover:bg-orange-100',
    waiting_for_parts: 'bg-amber-50 border-amber-100 hover:bg-amber-100',
    vehicle_ready: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100',
    invoice_generated: 'bg-blue-50 border-blue-100 hover:bg-blue-100',
    payment_received: 'bg-green-50 border-green-100 hover:bg-green-100',
    service_reminder: 'bg-purple-50 border-purple-100 hover:bg-purple-100',
    warranty_expiry: 'bg-red-50 border-red-100 hover:bg-red-100',
    insurance_expiry: 'bg-red-50 border-red-100 hover:bg-red-100',
    system: 'bg-slate-50 border-slate-100 hover:bg-slate-100',
    general: 'bg-slate-50 border-slate-100 hover:bg-slate-100',
  };
  return colors[type] || 'bg-slate-50 border-slate-100 hover:bg-slate-100';
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications({ limit: 10 });
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      onUnreadCountChange(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-all ${getNotificationColor(
                notification.type
              )} ${!notification.isRead ? 'border-l-4 border-l-brand-500' : ''}`}
              onClick={() => {
                if (!notification.isRead) {
                  handleMarkAsRead(notification.id);
                }
                if (notification.link) {
                  window.location.href = notification.link;
                }
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 mb-0.5">{notification.title}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                    {notification.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <button
          onClick={() => {
            window.location.href = '/admin/notifications';
          }}
          className="w-full text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1 transition-colors"
        >
          View All Notifications
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};