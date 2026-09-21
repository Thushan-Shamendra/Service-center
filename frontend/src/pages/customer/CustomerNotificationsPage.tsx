import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCheck, 
  Calendar, 
  Wrench, 
  Receipt, 
  Car, 
  Tag, 
  ChevronRight,
  Clock,
  FileText
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  title: string;
  description: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    appointmentId?: string;
    jobCardId?: string;
    invoiceId?: string;
    vehicleId?: string;
    preferredDate?: string;
  };
}

export const CustomerNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications({ page, limit: 10 });
      if (res.success) {
        setNotifications(res.data);
        setTotalPages(res.pagination?.pages || 1);
        setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
      } else {
        setError(res.message || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      appointment_confirmation: Calendar,
      appointment_cancellation: Calendar,
      appointment_reminder: Calendar,
      vehicle_ready: Car,
      invoice_ready: Receipt,
      payment_reminder: Receipt,
      repair_started: Wrench,
      repair_completed: Wrench,
      promotional: Tag,
      quotation_submitted: FileText,
      quotation_approved: FileText,
      quotation_rejected: FileText,
    };
    return iconMap[type] || Bell;
  };

  const getActionLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      appointment_confirmation: 'View Details',
      appointment_cancellation: 'View Details',
      appointment_reminder: 'View Appointment',
      vehicle_ready: 'Track Service',
      invoice_ready: 'View Invoice',
      payment_reminder: 'View Invoice',
      repair_started: 'Track Service',
      repair_completed: 'View Report',
      promotional: 'View Offer',
      quotation_submitted: 'Review Quotation',
      quotation_approved: 'View Quotation',
      quotation_rejected: 'View Quotation',
    };
    return labelMap[type] || 'View Details';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate based on notification type
    const type = notification.type;
    if (type.includes('quotation')) {
      navigate('/customer/quotations');
    } else if (type.includes('appointment')) {
      navigate('/customer/appointments');
    } else if (type.includes('vehicle') || type.includes('repair')) {
      navigate('/customer/tracking');
    } else if (type.includes('invoice') || type.includes('payment')) {
      navigate('/customer/invoices');
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => fetchNotifications(currentPage)} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </button>
          <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 mb-1">No Notifications</h3>
            <p className="text-sm text-slate-400">You're all caught up! No new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const actionLabel = getActionLabel(notification.type);
              
              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      !notification.isRead 
                        ? 'bg-brand-100 text-brand-600' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {!notification.isRead ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <BellOff className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase ${
                            !notification.isRead ? 'text-brand-600' : 'text-slate-400'
                          }`}>
                            {!notification.isRead ? '🔔 NEW' : '🔕 READ'}
                          </span>
                          <h3 className="font-bold text-slate-900">{notification.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {notification.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(notification.createdAt)}
                        </div>
                        {notification.metadata?.preferredDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notification.metadata.preferredDate}
                          </div>
                        )}
                      </div>

                      <button className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                        {actionLabel}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            Next
          </button>
          
          <span className="text-sm text-slate-500 ml-2">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};
