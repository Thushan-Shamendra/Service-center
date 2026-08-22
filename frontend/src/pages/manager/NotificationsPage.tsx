import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Send, Check, Calendar, X, Clock, Car, Receipt, DollarSign, Search, Mail, MessageSquare, Filter, ArrowLeft, AlertTriangle, Lock } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatters';
import { notificationApi } from '../../api/notificationApi';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface Notification {
  id: string;
  _id?: string;
  notificationNumber: string;
  customer: any;
  type: 'appointment_confirmation' | 'appointment_cancellation' | 'appointment_reminder' | 'vehicle_ready' | 'invoice_ready' | 'payment_reminder';
  channels: ('email' | 'sms')[];
  status: 'sent' | 'delivered' | 'failed';
  subject?: string;
  message: string;
  sentAt: string;
  deliveredAt?: string;
  failedAt?: string;
  relatedId?: string; // appointmentId, jobCardId, invoiceId
}

interface Customer {
  id: string;
  _id?: string;
  customerId: string;
  fullName: string;
  mobile: string;
  email: string;
  vehicles?: any[];
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [stats, setStats] = useState({
    sentToday: 0,
    delivered: 0,
    scheduled: 0,
    paymentReminders: 0,
  });

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [notificationsRes, statsRes] = await Promise.all([
        notificationApi.getNotifications({ limit: 100 }),
        notificationApi.getNotificationStats(),
      ]);
      
      if (notificationsRes.success) {
        setNotifications(notificationsRes.data || []);
      }
      
      if (statsRes.success) {
        setStats(statsRes.data || {
          sentToday: 0,
          delivered: 0,
          scheduled: 0,
          paymentReminders: 0,
        });
      }
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
      setStats({
        sentToday: 0,
        delivered: 0,
        scheduled: 0,
        paymentReminders: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getCustomerName = (notification: Notification) => {
    const customer = notification.customer;
    if (typeof customer === 'object' && customer.fullName) {
      return customer.fullName;
    }
    return 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      sent: { label: 'Sent', color: 'bg-amber-100 text-amber-800' },
      delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
      failed: { label: 'Failed', color: 'bg-rose-100 text-rose-800' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.sent;
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>{config.label}</span>;
  };

  const getTypeLabel = (type: string) => {
    const labels: any = {
      appointment_confirmation: 'Appointment Confirmation',
      appointment_cancellation: 'Appointment Cancellation',
      appointment_reminder: 'Appointment Reminder',
      vehicle_ready: 'Vehicle Ready',
      invoice_ready: 'Invoice Ready',
      payment_reminder: 'Payment Reminder',
    };
    return labels[type] || type;
  };

  const getChannelLabel = (channels: ('email' | 'sms')[]) => {
    if (channels.includes('email') && channels.includes('sms')) return 'Email + SMS';
    if (channels.includes('email')) return 'Email';
    if (channels.includes('sms')) return 'SMS';
    return '';
  };

  const handleViewNotification = (notificationId: string) => {
    navigate(`/manager/notifications/${notificationId}`);
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchId = n.notificationNumber.toLowerCase().includes(search);
      const matchCustomer = getCustomerName(n).toLowerCase().includes(search);
      if (!matchId && !matchCustomer) return false;
    }
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (channelFilter !== 'all') {
      if (channelFilter === 'email' && !n.channels.includes('email')) return false;
      if (channelFilter === 'sms' && !n.channels.includes('sms')) return false;
    }
    if (statusFilter !== 'all' && n.status !== statusFilter) return false;
    return true;
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchNotifications} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            Send appointment, vehicle, invoice and payment notifications to customers.
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/notifications/send')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
        >
          <Send className="w-4 h-4" />
          Send Notification
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Bell className="w-5 h-5 text-brand-600" />
            <span className="text-xs text-slate-500">Sent</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.sentToday}</p>
          <p className="text-xs text-slate-500">Sent Today</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-slate-500">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.delivered}</p>
          <p className="text-xs text-slate-500">Delivered</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-slate-500">Scheduled</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.scheduled}</p>
          <p className="text-xs text-slate-500">Scheduled</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-slate-500">Reminders</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.paymentReminders}</p>
          <p className="text-xs text-slate-500">Payment Reminders</p>
        </div>
      </div>

      {/* Quick Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">QUICK NOTIFICATIONS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/manager/notifications/send/appointment-confirmation')}
            className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium text-slate-900">Appointment Confirmation</span>
            </div>
            <span className="text-xs text-slate-500">Confirm customer's appointment</span>
          </button>
          
          <button
            onClick={() => navigate('/manager/notifications/send/appointment-cancellation')}
            className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <X className="w-5 h-5 text-rose-600" />
              <span className="text-sm font-medium text-slate-900">Appointment Cancellation</span>
            </div>
            <span className="text-xs text-slate-500">Notify customer of cancellation</span>
          </button>
          
          <button
            onClick={() => navigate('/manager/notifications/send/appointment-reminder')}
            className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-slate-900">Appointment Reminder</span>
            </div>
            <span className="text-xs text-slate-500">Remind before appointment</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <button
            onClick={() => navigate('/manager/notifications/send/vehicle-ready')}
            className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-900">Vehicle Ready</span>
            </div>
            <span className="text-xs text-slate-500">Notify vehicle is ready</span>
          </button>
          
          <button
            onClick={() => navigate('/manager/notifications/send/invoice-ready')}
            className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-900">Invoice Ready</span>
            </div>
            <span className="text-xs text-slate-500">Notify invoice is ready</span>
          </button>
          
          <button
            onClick={() => navigate('/manager/notifications/send/payment-reminder')}
            className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-slate-900">Payment Reminder</span>
            </div>
            <span className="text-xs text-slate-500">Remind about outstanding balance</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Customer / Notification ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Type: All</option>
            <option value="appointment_confirmation">Appointment Confirmation</option>
            <option value="appointment_cancellation">Appointment Cancellation</option>
            <option value="appointment_reminder">Appointment Reminder</option>
            <option value="vehicle_ready">Vehicle Ready</option>
            <option value="invoice_ready">Invoice Ready</option>
            <option value="payment_reminder">Payment Reminder</option>
          </select>
          
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Channel: All</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Status: All</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">Date: All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Notification History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase">NOTIFICATION HISTORY</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Notification</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Channel</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <tr 
                    key={notification.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleViewNotification(notification._id || notification.id)}
                  >
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {notification.sentAt ? formatDate(notification.sentAt) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">{getCustomerName(notification)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getTypeLabel(notification.type)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{getChannelLabel(notification.channels)}</td>
                    <td className="py-3 px-4">{getStatusBadge(notification.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                    No notifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};