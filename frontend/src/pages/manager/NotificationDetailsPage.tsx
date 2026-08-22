import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Check, X, AlertTriangle, Clock, Send } from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

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
  relatedId?: string;
  sentBy?: string;
}

export const NotificationDetailsPage: React.FC = () => {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      if (!notificationId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await notificationApi.getNotificationById(notificationId);
        if (res.success) {
          setNotification(res.data);
        } else {
          setError(res.message || 'Failed to load notification');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading notification');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, [notificationId]);

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

  const getTypeIcon = (type: string) => {
    const icons: any = {
      appointment_confirmation: '📅',
      appointment_cancellation: '❌',
      appointment_reminder: '⏰',
      vehicle_ready: '🚗',
      invoice_ready: '🧾',
      payment_reminder: '💰',
    };
    return icons[type] || '🔔';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      sent: { label: 'Sent', color: 'bg-amber-100 text-amber-800', icon: Clock },
      delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800', icon: Check },
      failed: { label: 'Failed', color: 'bg-rose-100 text-rose-800', icon: X },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.sent;
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getChannelStatus = (channel: 'email' | 'sms', status: string) => {
    if (status === 'delivered') {
      return { icon: Check, color: 'text-emerald-600', label: 'Delivered' };
    } else if (status === 'failed') {
      return { icon: X, color: 'text-rose-600', label: 'Failed' };
    } else {
      return { icon: Clock, color: 'text-amber-600', label: 'Sent' };
    }
  };

  const getCustomerName = (notification: Notification) => {
    const customer = notification.customer;
    if (typeof customer === 'object' && customer.fullName) {
      return customer.fullName;
    }
    return 'Unknown';
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!notification) return <ErrorState message="Notification not found" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager/notifications')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Notifications</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Notification Details</h1>
        <div className="w-32" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
        {/* Notification Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{getTypeIcon(notification.type)}</div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{getTypeLabel(notification.type)}</h2>
              <p className="text-sm text-slate-500">{notification.notificationNumber}</p>
            </div>
          </div>
          {getStatusBadge(notification.status)}
        </div>

        {/* Customer Information */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">CUSTOMER</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <p className="text-sm font-medium text-slate-900">{getCustomerName(notification)}</p>
            </div>
            {notification.relatedId && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Related ID</label>
                <p className="text-sm font-medium text-slate-900">{notification.relatedId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information (if applicable) */}
        {(notification.type === 'vehicle_ready' || notification.type === 'invoice_ready') && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">VEHICLE</h3>
            <div className="text-sm text-slate-600">
              Vehicle information would be displayed here based on the related job card or invoice.
            </div>
          </div>
        )}

        {/* Sent Information */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">SENT INFORMATION</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Sent By</label>
              <p className="text-sm font-medium text-slate-900">{notification.sentBy || 'Manager'}</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Sent At</label>
              <p className="text-sm font-medium text-slate-900">
                {notification.sentAt ? formatDate(notification.sentAt) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Status */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">DELIVERY</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notification.channels.includes('email') && (
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">Email</span>
                  </div>
                  {(() => {
                    const status = getChannelStatus('email', notification.status);
                    const Icon = status.icon;
                    return (
                      <span className={`flex items-center gap-1 text-xs font-bold ${status.color}`}>
                        <Icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
            {notification.channels.includes('sms') && (
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">SMS</span>
                  </div>
                  {(() => {
                    const status = getChannelStatus('sms', notification.status);
                    const Icon = status.icon;
                    return (
                      <span className={`flex items-center gap-1 text-xs font-bold ${status.color}`}>
                        <Icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          
          {notification.deliveredAt && (
            <div className="mt-4 text-sm text-slate-600">
              <span className="font-medium">Delivered at:</span> {formatDate(notification.deliveredAt)}
            </div>
          )}
          
          {notification.failedAt && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-800">Delivery Failed</p>
                <p className="text-sm text-rose-600">Failed at: {formatDate(notification.failedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">MESSAGE</h3>
          {notification.subject && (
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Subject</label>
              <p className="text-sm font-medium text-slate-900">{notification.subject}</p>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{notification.message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={() => navigate('/manager/notifications')}
            className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={() => {
              toast('Resend functionality would be implemented here');
            }}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 flex items-center gap-2 font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            Resend Notification
          </button>
        </div>
      </div>
    </div>
  );
};
