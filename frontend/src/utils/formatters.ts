import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Format currency to Sri Lankan Rupees (LKR) - function version
 * Example: 125000 -> "Rs. 125,000.00"
 */
export const formatLKR = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rs. 0.00';
  }
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Alias for formatLKR for compatibility
 */
export const formatCurrency = formatLKR;

/**
 * Format date to Sri Lankan standard (DD/MM/YYYY)
 */
export const formatDate = (dateString: string | Date | undefined | null, format = 'DD/MM/YYYY'): string => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format(format);
};

/**
 * Format date with time (DD/MM/YYYY hh:mm A)
 */
export const formatDateTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format('DD/MM/YYYY hh:mm A');
};

/**
 * Format Sri Lankan Phone Number
 * Example: "0771234567" -> "+94 77 123 4567"
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return 'N/A';
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('94') && clean.length === 11) {
    return `+94 ${clean.slice(2, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  if (clean.startsWith('0') && clean.length === 10) {
    return `+94 ${clean.slice(1, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
};

/**
 * Format Sri Lankan NIC (Old 9 digits + V/X or New 12 digits)
 */
export const formatNIC = (nic: string | undefined | null): string => {
  if (!nic) return 'N/A';
  return nic.toUpperCase().trim();
};

/**
 * Get semantic CSS badge classes based on status
 */
export const getStatusBadgeClass = (status: string | undefined | null): string => {
  if (!status) return 'bg-slate-100 text-slate-700 border-slate-200';
  
  const lower = status.toLowerCase().replace(/_/g, ' ');

  // Success (Green)
  if (['paid', 'approved', 'completed', 'delivered', 'active', 'pass', 'excellent', 'gold', 'platinum', 'confirmed'].includes(lower)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
  }

  // Warning (Orange/Amber)
  if (['pending', 'waiting for parts', 'partially paid', 'rescheduled', 'on leave', 'fair', 'high', 'silver', 'draft', 'repair'].includes(lower)) {
    return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
  }

  // Partially Received (Blue)
  if (['partially_received', 'partially received', 'partial'].includes(lower)) {
    return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  }

  // Purchase Return Status
  if (['pending'].includes(lower)) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200 font-medium';
  }
  if (['approved'].includes(lower)) {
    return 'bg-green-50 text-green-700 border-green-200 font-medium';
  }
  if (['rejected'].includes(lower)) {
    return 'bg-red-50 text-red-700 border-red-200 font-medium';
  }
  if (['processed'].includes(lower)) {
    return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  }

  // Error/Danger (Red)
  if (['rejected', 'failed', 'unpaid', 'low stock', 'terminated', 'cancelled', 'urgent', 'poor', 'needs further repair'].includes(lower)) {
    return 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
  }

  // Info/Progress (Blue)
  if (['diagnosing', 'repair in progress', 'testing', 'ready for delivery', 'in service', 'standard', 'partial', 'parts'].includes(lower)) {
    return 'bg-blue-50 text-brand-600 border-blue-200 font-medium';
  }

  return 'bg-slate-100 text-slate-700 border-slate-200';
};

/**
 * Format relative time (e.g., "5 minutes ago", "2 hours ago")
 */
export const formatRelativeTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).fromNow();
};

/**
 * Helper to clean numeric input values (stripping leading zeros e.g. "01000" -> 1000)
 */
export const parseNumberInput = (val: string): number => {
  if (!val || val.trim() === '') return 0;
  const cleaned = val.replace(/^0+(?=\d)/, '');
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Format numeric value for controlled input (shows empty string when 0 to prevent "01000" leading zeros)
 */
export const formatInputValue = (val: number | undefined | null): string | number => {
  if (val === 0 || val === undefined || val === null) return '';
  return val;
};
