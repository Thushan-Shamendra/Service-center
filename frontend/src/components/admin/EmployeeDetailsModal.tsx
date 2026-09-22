import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, User as UserIcon, Briefcase, DollarSign, Clock, Shield, Building2 } from 'lucide-react';
import { formatPhone, formatDate, formatLKR, formatNIC } from '../../utils/formatters';
import { User } from '../../types';

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  user: User | null;
}

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  user,
}) => {
  console.log('EmployeeDetailsModal rendered with:', { isOpen, user });
  if (!isOpen || !user) return null;

  const isManager = user.role === 'manager';
  const u = user as any;
  const userId = isManager
    ? u.managerId || u.profile?.managerId || u.employeeDetails?.managerId || u.employeeId || u.profile?.employeeId || (u._id ? `MGR-${u._id.slice(-4).toUpperCase()}` : 'MGR')
    : u.employeeId || u.profile?.employeeId || u.employeeDetails?.employeeId || (u._id ? `EMP-${u._id.slice(-4).toUpperCase()}` : 'EMP');
  const profile = (user as any).profile || (user as any).employeeDetails || {};

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-xs text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isManager ? 'Manager Details' : 'Employee Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-2xl shrink-0 border-2 border-brand-100">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">{user.fullName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono text-brand-600 font-semibold">{userId}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-slate-500">{user.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                {isManager ? 'Manager' : 'Employee'}
              </span>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Personal Information
            </h4>
            <div className="space-y-1">
              <InfoRow icon={Shield} label="Employee ID" value="Loading" />
              <InfoRow icon={UserIcon} label="First Name" value={user.firstName} />
              <InfoRow icon={UserIcon} label="Last Name" value={user.lastName} />
              <InfoRow icon={Shield} label="NIC" value={formatNIC(profile.nic) || 'N/A'} />
              <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(profile.dateOfBirth || (user as any).dateOfBirth)} />
              <InfoRow icon={UserIcon} label="Gender" value={profile.gender || (user as any).gender || 'N/A'} />
              <InfoRow icon={Phone} label="Mobile" value={formatPhone(user.mobile)} />
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow 
                icon={MapPin} 
                label="Address" 
                value={
                  user.address?.street || user.address?.city || user.address?.province
                    ? `${user.address?.street || ''}${user.address?.street && (user.address?.city || user.address?.province) ? ', ' : ''}${user.address?.city || ''}${user.address?.city && user.address?.province ? ', ' : ''}${user.address?.province || ''}`
                    : 'N/A'
                } 
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employment Information
            </h4>
            <div className="space-y-1">
              {isManager && (
                <InfoRow icon={Building2} label="Position" value="Manager" />
              )}
              <InfoRow 
                icon={Calendar} 
                label="Employment Date" 
                value={formatDate(profile.employmentDate)} 
              />
              <InfoRow 
                icon={DollarSign} 
                label="Basic Salary" 
                value={formatLKR(profile.basicSalary || 0)} 
              />
              <InfoRow 
                icon={Shield} 
                label="Status" 
                value={user.isActive ? 'Active' : 'Inactive'} 
              />
            </div>
          </div>

          {/* Bank Details (for employees/managers) */}
          {(isManager || user.role === 'employee') && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Bank Details
              </h4>
              <div className="space-y-1">
                <InfoRow icon={Building2} label="Bank Name" value={profile.bankName || 'N/A'} />
                <InfoRow icon={MapPin} label="Branch" value={profile.branch || 'N/A'} />
                <InfoRow icon={Shield} label="Account Number" value={profile.accountNumber || 'N/A'} />
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Account Information
            </h4>
            <div className="space-y-1">
              <InfoRow icon={UserIcon} label="Username" value={user.username} />
              <InfoRow icon={Calendar} label="Account Created" value={formatDate(user.createdAt)} />
              <InfoRow icon={Clock} label="Last Login" value={(user as any).lastLogin ? formatDate((user as any).lastLogin) : 'N/A'} />
            </div>
          </div>

          {/* Quick Summary (Managers) */}
          {isManager && (
            <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
              <h4 className="text-sm font-bold text-brand-700 mb-3">Quick Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{(user as any).leaveBalance || '24'}</div>
                  <div className="text-xs text-brand-600">Leave Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{(user as any).attendanceRate ? `${(user as any).attendanceRate}%` : '0%'}</div>
                  <div className="text-xs text-brand-600">Attendance Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{(user as any).pendingApprovals || '0'}</div>
                  <div className="text-xs text-brand-600">Pending Approvals</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Summary (Employees) */}
          {!isManager && user.role === 'employee' && (
            <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
              <h4 className="text-sm font-bold text-brand-700 mb-3">Quick Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{(user as any).leaveBalance || '40'}</div>
                  <div className="text-xs text-brand-600">Leave Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{(user as any).attendanceRate ? `${(user as any).attendanceRate}%` : '0%'}</div>
                  <div className="text-xs text-brand-600">Attendance Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{(user as any).pendingApprovals || '0'}</div>
                  <div className="text-xs text-brand-600">Pending Approvals</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-colors"
          >
            Edit User
          </button>
        </div>
      </div>
    </div>
  );
};
