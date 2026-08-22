import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { User } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { CustomerDetailsModal } from '../../components/admin/CustomerDetailsModal';
import { EmployeeDetailsModal } from '../../components/admin/EmployeeDetailsModal';
import { formatPhone, formatDate, formatNIC, formatLKR } from '../../utils/formatters';
import { UserPlus, Search, Shield, Filter, UserCheck, Mail, Phone, Lock, X, Eye, EyeOff, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

export const UsersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nextUserId, setNextUserId] = useState<string>('');
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'Password@123',
    newPassword: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    mobile: '',
    role: 'employee',
    nic: '',
    dateOfBirth: '1995-01-01',
    gender: 'male',
    designation: 'Technician',
    basicSalary: 65000,
    employmentDate: new Date().toISOString().split('T')[0],
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
    },
    bankName: '',
    branch: '',
    accountNumber: '',
    profilePhoto: null,
    isActive: true,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getUsers({
        page,
        limit: 10,
        role: roleFilter || undefined,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setUsers(res.data);
        setTotalPages(res.pagination.pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, searchQuery]);

  // Check for role query parameter to auto-open add modal
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && (roleParam === 'employee' || roleParam === 'manager')) {
      setRoleFilter(roleParam);
      setFormData(prev => ({ ...prev, role: roleParam }));
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  // Fetch next user ID when modal opens
  useEffect(() => {
    const fetchNextUserId = async () => {
      if (isAddModalOpen && formData.role) {
        try {
          const res = await userApi.getNextUserId(formData.role);
          if (res.success) {
            setNextUserId(res.data.nextId);
          }
        } catch (error) {
          console.error('Failed to fetch next user ID:', error);
        }
      }
    };
    fetchNextUserId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddModalOpen, formData.role]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('username', formData.username);
    submitData.append('email', formData.email);
    submitData.append('password', formData.password);
    submitData.append('firstName', formData.firstName);
    submitData.append('lastName', formData.lastName);
    submitData.append('mobile', formData.mobile);
    submitData.append('role', formData.role);
    submitData.append('nic', formData.nic);
    submitData.append('dateOfBirth', formData.dateOfBirth);
    submitData.append('gender', formData.gender);
    submitData.append('designation', formData.designation);
    submitData.append('basicSalary', formData.basicSalary.toString());
    submitData.append('employmentDate', formData.employmentDate);
    submitData.append('address', JSON.stringify(formData.address));
    
    if (formData.profilePhoto) {
      submitData.append('profilePhoto', formData.profilePhoto);
    }
    
    // Add bank details for employees/managers
    if (formData.role !== 'customer') {
      submitData.append('bankName', formData.bankName);
      submitData.append('branch', formData.branch);
      submitData.append('accountNumber', formData.accountNumber);
    }
    
    try {
      const res = await userApi.createUser(submitData);
      if (res.success) {
        toast.success(res.message || 'User created successfully');
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: 'Password@123',
          newPassword: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          mobile: '',
          role: 'employee',
          nic: '',
          dateOfBirth: '1995-01-01',
          gender: 'male',
          designation: 'Technician',
          basicSalary: 65000,
          employmentDate: new Date().toISOString().split('T')[0],
          address: {
            street: '',
            city: '',
            province: '',
            postalCode: '',
          },
          bankName: '',
          branch: '',
          accountNumber: '',
          profilePhoto: null,
          isActive: true,
        });
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to create user');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating user');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      const res = await userApi.toggleUserStatus((selectedUser as any)._id || selectedUser.id);
      if (res.success) {
        toast.success(res.message);
        setIsDeactivateModalOpen(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await userApi.deleteUser((selectedUser as any)._id || selectedUser.id);
      if (res.success) {
        toast.success(res.message);
        setIsDeleteModalOpen(false);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    // Password validation if trying to reset password
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    
    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        email: formData.email,
        isActive: formData.isActive,
        address: formData.address,
        profile: {
          nic: formData.nic,
          designation: formData.designation,
          basicSalary: formData.basicSalary,
          address: formData.address,
        },
      };

      // Add password if provided
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      // Add bank details for employees/managers
      if (selectedUser.role === 'manager' || selectedUser.role === 'employee') {
        updateData.profile.bankName = formData.bankName;
        updateData.profile.branch = formData.branch;
        updateData.profile.accountNumber = formData.accountNumber;
      }

      console.log('Sending update data:', updateData);
      console.log('Bank details being sent:', {
        bankName: formData.bankName,
        branch: formData.branch,
        accountNumber: formData.accountNumber,
      });
      console.log('Address being sent:', formData.address);

      const res = await userApi.updateUser((selectedUser as any)._id || selectedUser.id, updateData);
      if (res.success) {
        toast.success(res.message || 'User updated successfully');
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to update user');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating user');
    }
  };

  // Populate form when opening edit modal
  useEffect(() => {
    if (isEditModalOpen && selectedUser) {
      const profileDesignation = (selectedUser as any).profile?.designation || (selectedUser as any).designation;
      const correctDesignation = selectedUser.role === 'manager' ? 'Manager' : profileDesignation || 'Technician';
      
      setFormData({
        username: selectedUser.username,
        email: selectedUser.email,
        password: 'Password@123',
        newPassword: '',
        confirmPassword: '',
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        mobile: selectedUser.mobile,
        role: selectedUser.role,
        nic: (selectedUser as any).profile?.nic || (selectedUser as any).nic || '',
        dateOfBirth: (selectedUser as any).dateOfBirth || (selectedUser as any).profile?.dateOfBirth || '1995-01-01',
        gender: (selectedUser as any).gender || (selectedUser as any).profile?.gender || 'male',
        designation: correctDesignation,
        basicSalary: (selectedUser as any).profile?.basicSalary || (selectedUser as any).basicSalary || 65000,
        employmentDate: (selectedUser as any).profile?.employmentDate || (selectedUser as any).employmentDate || new Date().toISOString().split('T')[0],
        address: (selectedUser as any).address || (selectedUser as any).profile?.address || { street: '', city: '', province: '', postalCode: '' },
        bankName: (selectedUser as any).profile?.bankName || '',
        branch: (selectedUser as any).profile?.branch || '',
        accountNumber: (selectedUser as any).profile?.accountNumber || '',
        profilePhoto: null,
        isActive: selectedUser.isActive,
      });
    }
  }, [isEditModalOpen, selectedUser]);

  const getUserID = (user: User): string => {
    if (user.role === 'manager') return (user as any).managerId || 'MGR-00001';
    if (user.role === 'employee') return (user as any).employeeId || 'EMP-00001';
    if (user.role === 'customer') return (user as any).customerId || 'CUS-00001';
    if (user.role === 'administrator') return (user as any).managerId || 'ADM-00001';
    return 'USR-00001';
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting CSV...', { id: 'export-csv' });
      
      // Fetch users in batches to avoid server overload
      let allUsers: User[] = [];
      let currentPage = 1;
      let hasMore = true;
      const batchSize = 50; // Smaller batch size to avoid 500 errors
      
      while (hasMore) {
        const res = await userApi.getUsers({
          page: currentPage,
          limit: batchSize,
          role: roleFilter || undefined,
          search: searchQuery || undefined,
          status: statusFilter || undefined,
        });
        
        if (res.success && res.data && res.data.length > 0) {
          allUsers = [...allUsers, ...res.data];
          hasMore = res.data.length === batchSize;
          currentPage++;
        } else {
          hasMore = false;
        }
        
        // Safety limit to prevent infinite loops
        if (allUsers.length >= 1000) {
          hasMore = false;
        }
      }
      
      if (!allUsers || allUsers.length === 0) {
        toast.dismiss('export-csv');
        toast.error('No data to export');
        return;
      }
      
      // Define CSV headers based on role filter
      let headers: string[] = [];
      let csvContent: string = '';
      
      if (roleFilter === 'customer') {
        headers = ['Customer ID', 'Name', 'Username', 'Phone', 'Email', 'Vehicles', 'Services', 'Balance', 'Status', 'Created Date'];
        csvContent = headers.join(',') + '\n';
        
        allUsers.forEach((user: User) => {
          const row = [
            getUserID(user),
            `"${user.fullName}"`,
            user.username,
            formatPhone(user.mobile),
            user.email,
            (user as any).profile?.vehicles?.length || (user as any).vehicles?.length || 0,
            (user as any).profile?.totalServices || (user as any).totalServices || 0,
            (user as any).profile?.outstandingBalance || (user as any).outstandingBalance || 0,
            user.isActive ? 'Active' : 'Inactive',
            formatDate(user.createdAt),
          ];
          csvContent += row.join(',') + '\n';
        });
      } else if (roleFilter === 'manager' || roleFilter === 'employee') {
        headers = ['ID', 'Name', 'Username', 'NIC', 'Mobile', 'Email', 'Designation', 'Basic Salary', 'Status', 'Created Date'];
        csvContent = headers.join(',') + '\n';
        
        allUsers.forEach((user: User) => {
          const row = [
            getUserID(user),
            `"${user.fullName}"`,
            user.username,
            formatNIC((user as any).profile?.nic || (user as any).nic) || 'N/A',
            formatPhone(user.mobile),
            user.email,
            (user as any).profile?.designation || (user as any).designation || 'N/A',
            (user as any).profile?.basicSalary || (user as any).basicSalary || 0,
            user.isActive ? 'Active' : 'Inactive',
            formatDate(user.createdAt),
          ];
          csvContent += row.join(',') + '\n';
        });
      } else {
        headers = ['User ID', 'Name', 'Username', 'Role', 'NIC', 'Mobile', 'Email', 'Status', 'Created Date'];
        csvContent = headers.join(',') + '\n';
        
        allUsers.forEach((user: User) => {
          const row = [
            getUserID(user),
            `"${user.fullName}"`,
            user.username,
            user.role,
            formatNIC((user as any).profile?.nic || (user as any).nic) || 'N/A',
            formatPhone(user.mobile),
            user.email,
            user.isActive ? 'Active' : 'Inactive',
            formatDate(user.createdAt),
          ];
          csvContent += row.join(',') + '\n';
        });
      }
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${roleFilter || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss('export-csv');
      toast.success(`CSV exported successfully (${allUsers.length} records)`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.dismiss('export-csv');
      toast.error(error.response?.data?.message || error.message || 'Failed to export CSV');
    }
  };

  // Manager-specific columns
  const managerColumns: Column<User>[] = [
    {
      header: 'ID',
      accessor: (user) => (
        <span className="text-xs font-bold text-slate-700 font-mono">{getUserID(user)}</span>
      ),
    },
    {
      header: 'Name',
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xs shrink-0">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <div className="font-bold text-slate-800">{user.fullName}</div>
            <div className="text-xs text-slate-400">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'NIC',
      accessor: (user) => (
        <span className="text-xs text-slate-600 font-mono">{formatNIC((user as any).profile?.nic || (user as any).nic) || 'N/A'}</span>
      ),
    },
    {
      header: 'Mobile',
      accessor: (user) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" />
          {formatPhone(user.mobile)}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (user) => <StatusBadge status={user.isActive ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              console.log('View button clicked for user:', user);
              setSelectedUser(user);
              setIsEmployeeDetailsOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
          >
            View
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsEditModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
          >
            Edit
          </button>
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeactivateModalOpen(true);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                user.isActive
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  // Employee-specific columns
  const employeeColumns: Column<User>[] = [
    {
      header: 'ID',
      accessor: (user) => (
        <span className="text-xs font-bold text-slate-700 font-mono">{getUserID(user)}</span>
      ),
    },
    {
      header: 'Name',
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xs shrink-0">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <div className="font-bold text-slate-800">{user.fullName}</div>
            <div className="text-xs text-slate-400">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'NIC',
      accessor: (user) => (
        <span className="text-xs text-slate-600 font-mono">{formatNIC((user as any).profile?.nic || (user as any).nic) || 'N/A'}</span>
      ),
    },
    {
      header: 'Mobile',
      accessor: (user) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" />
          {formatPhone(user.mobile)}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (user) => <StatusBadge status={user.isActive ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              console.log('View button clicked for user:', user);
              setSelectedUser(user);
              setIsEmployeeDetailsOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
          >
            View
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsEditModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
          >
            Edit
          </button>
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeactivateModalOpen(true);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                user.isActive
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  // Customer-specific columns
  const customerColumns: Column<User>[] = [
    {
      header: 'Customer ID',
      accessor: (user) => (
        <span className="text-xs font-bold text-slate-700 font-mono">{getUserID(user)}</span>
      ),
    },
    {
      header: 'Name',
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xs shrink-0">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <div className="font-bold text-slate-800">{user.fullName}</div>
            <div className="text-xs text-slate-400">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: (user) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" />
          {formatPhone(user.mobile)}
        </div>
      ),
    },
    {
      header: 'Vehicles',
      accessor: (user) => (
        <span className="text-xs text-slate-600 font-bold">{(user as any).vehicles?.length || 0}</span>
      ),
    },
    {
      header: 'Services',
      accessor: (user) => (
        <span className="text-xs text-slate-600 font-bold">{(user as any).totalServices || 0}</span>
      ),
    },
    {
      header: 'Balance',
      accessor: (user) => (
        <span className="text-xs text-slate-600 font-bold">{formatLKR((user as any).outstandingBalance || 0)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (user) => <StatusBadge status={user.isActive ? 'active' : 'inactive'} />,
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsCustomerDetailsOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsEditModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
          >
            Edit
          </button>
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeactivateModalOpen(true);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                user.isActive
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  // Default columns for all users
  const defaultColumns: Column<User>[] = [
    {
      header: 'User ID',
      accessor: (user) => (
        <span className="text-xs font-bold text-slate-700 font-mono">{getUserID(user)}</span>
      ),
    },
    {
      header: 'Name',
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center text-xs shrink-0">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <div className="font-bold text-slate-800">{user.fullName}</div>
            <div className="text-xs text-slate-400">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (user) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          {user.role}
        </span>
      ),
    },
    {
      header: 'NIC',
      accessor: (user) => (
        <span className="text-xs text-slate-600 font-mono">{formatNIC((user as any).profile?.nic || (user as any).nic) || 'N/A'}</span>
      ),
    },
    {
      header: 'Mobile',
      accessor: (user) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" />
          {formatPhone(user.mobile)}
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: (user) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Mail className="w-3 h-3 text-slate-400" />
          {user.email}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (user) => <StatusBadge status={user.isActive ? 'active' : 'inactive'} />,
    },
    {
      header: 'Created Date',
      accessor: (user) => (
        <span className="text-xs text-slate-600">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (user) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              console.log('View button clicked for user:', user);
              setSelectedUser(user);
              setIsEmployeeDetailsOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
          >
            View
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsEditModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
          >
            Edit
          </button>
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeactivateModalOpen(true);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                user.isActive
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
          {user.role !== 'administrator' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  // Select columns based on role filter
  const columns = roleFilter === 'manager' ? managerColumns : roleFilter === 'employee' ? employeeColumns : roleFilter === 'customer' ? customerColumns : defaultColumns;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-sm text-slate-500">
            Create and manage Managers, Employees, Technicians, and Customer accounts.
          </p>
        </div>


      </div>

      {/* Customer creation info message */}
      {roleFilter === 'customer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-800">Customers are registered by Managers</p>
            <p className="text-xs text-blue-600 mt-1">Use the Manager Dashboard to create new customer accounts.</p>
          </div>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            setRoleFilter('');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            roleFilter === '' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => {
            setRoleFilter('manager');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            roleFilter === 'manager' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Managers
        </button>
        <button
          onClick={() => {
            setRoleFilter('employee');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            roleFilter === 'employee' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Employees
        </button>
        <button
          onClick={() => {
            setRoleFilter('customer');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            roleFilter === 'customer' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Customers
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={roleFilter === 'manager' ? 'Search managers...' : roleFilter === 'employee' ? 'Search employees...' : 'Search users...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          {roleFilter !== 'manager' && (
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="administrator">Administrator</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="customer">Customer</option>
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          {roleFilter === 'manager' && (
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, role: 'manager' }));
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-500/20 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Create Manager
            </button>
          )}
          {roleFilter === 'employee' && (
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, role: 'employee' }));
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Create Employee
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        pagination={{
          currentPage: page,
          totalPages,
          totalRecords,
          onPageChange: (p) => setPage(p),
        }}
        emptyTitle="No Users Found"
        emptyDescription="No users match the selected filters or search query."
      />

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              {formData.role === 'manager' ? 'Create Manager' : formData.role === 'employee' ? 'Create Employee' : 'Create User Account'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {formData.role === 'manager' ? 'Register a new manager in the system.' : formData.role === 'employee' ? 'Register a new employee/technician in the system.' : 'Register a new user in the system.'}
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-medium">
              {/* ID Display */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-slate-500 mb-1">{formData.role === 'manager' ? 'Manager ID' : formData.role === 'employee' ? 'Employee ID' : 'User ID'} *</label>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-brand-600 flex-1">
                    {nextUserId || 'Loading...'}
                  </div>
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Position (Manager only, read-only) */}
              {formData.role === 'manager' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-slate-500 mb-1">Position</label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-brand-600 flex-1">Manager</div>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              )}

              {/* Role Selection (hide for manager/employee tabs) */}
              {roleFilter !== 'manager' && roleFilter !== 'employee' && (
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 capitalize font-bold"
                  >
                    <option value="manager">Manager</option>
                    <option value="employee">Employee / Technician</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
              )}

              {/* Personal Information */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Personal Information</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">NIC *</label>
                    <input
                      type="text"
                      required
                      value={formData.nic}
                      onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                      placeholder="199512345678 or 951234567V"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Gender *</label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Mobile *</label>
                    <input
                      type="text"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="0771234567"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Contact Information</span>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-slate-700 mb-1 font-bold">Address</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    placeholder="123 Main Street, Colombo, Western Province"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Employment Information */}
              {formData.role !== 'customer' && (
                <>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="block text-xs font-bold text-slate-700 mb-3">Employment Information</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Employment Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.employmentDate}
                          onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Salary *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">LKR</span>
                          <input
                            type="number"
                            required
                            value={formData.basicSalary}
                            onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                            placeholder="65000"
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="block text-xs font-bold text-slate-700 mb-3">Bank Details</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Bank Name</label>
                        <select
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                        >
                          <option value="">Select Bank</option>
                          <option value="Bank of Ceylon">Bank of Ceylon</option>
                          <option value="People's Bank">People's Bank</option>
                          <option value="Commercial Bank">Commercial Bank</option>
                          <option value="Hatton National Bank">Hatton National Bank</option>
                          <option value="Sampath Bank">Sampath Bank</option>
                          <option value="National Development Bank">National Development Bank</option>
                          <option value="Nations Trust Bank">Nations Trust Bank</option>
                          <option value="HSBC Sri Lanka">HSBC Sri Lanka</option>
                          <option value="Standard Chartered Bank">Standard Chartered Bank</option>
                          <option value="Union Bank of Colombo">Union Bank of Colombo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Branch</label>
                        <select
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                        >
                          <option value="">Select Branch</option>
                          <option value="Colombo Main">Colombo Main</option>
                          <option value="Colombo Fort">Colombo Fort</option>
                          <option value="Colombo 01">Colombo 01</option>
                          <option value="Colombo 02">Colombo 02</option>
                          <option value="Colombo 03">Colombo 03</option>
                          <option value="Colombo 04">Colombo 04</option>
                          <option value="Colombo 05">Colombo 05</option>
                          <option value="Colombo 06">Colombo 06</option>
                          <option value="Colombo 07">Colombo 07</option>
                          <option value="Colombo 08">Colombo 08</option>
                          <option value="Colombo 09">Colombo 09</option>
                          <option value="Colombo 10">Colombo 10</option>
                          <option value="Colombo 11">Colombo 11</option>
                          <option value="Colombo 12">Colombo 12</option>
                          <option value="Colombo 13">Colombo 13</option>
                          <option value="Colombo 14">Colombo 14</option>
                          <option value="Colombo 15">Colombo 15</option>
                          <option value="Kandy">Kandy</option>
                          <option value="Galle">Galle</option>
                          <option value="Matara">Matara</option>
                          <option value="Jaffna">Jaffna</option>
                          <option value="Negombo">Negombo</option>
                          <option value="Kurunegala">Kurunegala</option>
                          <option value="Anuradhapura">Anuradhapura</option>
                          <option value="Ratnapura">Ratnapura</option>
                          <option value="Badulla">Badulla</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-slate-700 mb-1 font-bold">Account Number</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="Enter account number"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Account Information */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Account Information</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="john_doe"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Temporary Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pr-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-700 mb-1 font-bold">Status</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">🔴 Inactive</option>
                </select>
              </div>

              {/* Profile Photo */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Photo</span>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.files?.[0] || null })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormData({
                      username: '',
                      email: '',
                      password: 'Password@123',
                      newPassword: '',
                      confirmPassword: '',
                      firstName: '',
                      lastName: '',
                      mobile: '',
                      role: 'employee',
                      nic: '',
                      dateOfBirth: '1995-01-01',
                      gender: 'male',
                      designation: 'Technician',
                      basicSalary: 65000,
                      employmentDate: new Date().toISOString().split('T')[0],
                      address: {
                        street: '',
                        city: '',
                        province: '',
                        postalCode: '',
                      },
                      bankName: '',
                      branch: '',
                      accountNumber: '',
                      profilePhoto: null,
                      isActive: true,
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-colors"
                >
                  {formData.role === 'manager' ? 'Save Manager' : formData.role === 'employee' ? 'Save Employee' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              Edit {selectedUser.role === 'manager' ? 'Manager' : selectedUser.role === 'employee' ? 'Employee' : 'User'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Update user information for {selectedUser.fullName}
            </p>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs font-medium">
              {/* ID Display (read-only) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-slate-500 mb-1">User ID</label>
                <div className="text-sm font-bold text-brand-600">
                  {getUserID(selectedUser)}
                </div>
              </div>

              {/* Personal Information */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Personal Information</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">NIC *</label>
                    <input
                      type="text"
                      required
                      value={formData.nic}
                      onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                      placeholder="199512345678 or 951234567V"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Mobile *</label>
                    <input
                      type="text"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-slate-700 mb-1 font-bold">Address</label>
                  <input
                    type="text"
                    value={formData.address.street || ''}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    placeholder="123 Main Street, Colombo, Western Province"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {/* Account Information */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Account Information</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      disabled
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Password Reset Section */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Password Reset (Optional)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Leave blank to keep current"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Confirm Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Employee/Manager Specific Fields */}
              {(selectedUser.role === 'manager' || selectedUser.role === 'employee') && (
                <>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="block text-xs font-bold text-slate-700 mb-3">Employment Details</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Designation</label>
                        <input
                          type="text"
                          value={formData.designation}
                          disabled
                          className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Basic Salary *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">LKR</span>
                          <input
                            type="number"
                            required
                            value={formData.basicSalary}
                            onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Section */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="block text-xs font-bold text-slate-700 mb-3">Bank Details</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Bank Name</label>
                        <select
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                        >
                          <option value="">Select Bank</option>
                          <option value="Bank of Ceylon">Bank of Ceylon</option>
                          <option value="People's Bank">People's Bank</option>
                          <option value="Commercial Bank">Commercial Bank</option>
                          <option value="Hatton National Bank">Hatton National Bank</option>
                          <option value="Sampath Bank">Sampath Bank</option>
                          <option value="National Development Bank">National Development Bank</option>
                          <option value="Nations Trust Bank">Nations Trust Bank</option>
                          <option value="HSBC Sri Lanka">HSBC Sri Lanka</option>
                          <option value="Standard Chartered Bank">Standard Chartered Bank</option>
                          <option value="Union Bank of Colombo">Union Bank of Colombo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold">Branch</label>
                        <select
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                        >
                          <option value="">Select Branch</option>
                          <option value="Colombo Main">Colombo Main</option>
                          <option value="Colombo Fort">Colombo Fort</option>
                          <option value="Colombo 01">Colombo 01</option>
                          <option value="Colombo 02">Colombo 02</option>
                          <option value="Colombo 03">Colombo 03</option>
                          <option value="Colombo 04">Colombo 04</option>
                          <option value="Colombo 05">Colombo 05</option>
                          <option value="Colombo 06">Colombo 06</option>
                          <option value="Colombo 07">Colombo 07</option>
                          <option value="Colombo 08">Colombo 08</option>
                          <option value="Colombo 09">Colombo 09</option>
                          <option value="Colombo 10">Colombo 10</option>
                          <option value="Colombo 11">Colombo 11</option>
                          <option value="Colombo 12">Colombo 12</option>
                          <option value="Colombo 13">Colombo 13</option>
                          <option value="Colombo 14">Colombo 14</option>
                          <option value="Colombo 15">Colombo 15</option>
                          <option value="Kandy">Kandy</option>
                          <option value="Galle">Galle</option>
                          <option value="Matara">Matara</option>
                          <option value="Jaffna">Jaffna</option>
                          <option value="Negombo">Negombo</option>
                          <option value="Kurunegala">Kurunegala</option>
                          <option value="Anuradhapura">Anuradhapura</option>
                          <option value="Ratnapura">Ratnapura</option>
                          <option value="Badulla">Badulla</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-slate-700 mb-1 font-bold">Account Number</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="Enter account number"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Status Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-3">Status</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-slate-700">Active Account</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 hover:bg-brand-600 transition-colors"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee/Manager Details Modal */}
      <EmployeeDetailsModal
        isOpen={isEmployeeDetailsOpen}
        onClose={() => setIsEmployeeDetailsOpen(false)}
        onEdit={() => {
          setIsEmployeeDetailsOpen(false);
          setIsEditModalOpen(true);
        }}
        user={selectedUser}
      />

      {/* Confirm Status Modal */}
      <ConfirmModal
        isOpen={isDeactivateModalOpen}
        title={selectedUser?.isActive ? 'Deactivate User Account' : 'Activate User Account'}
        message={`Are you sure you want to ${
          selectedUser?.isActive ? 'deactivate' : 'activate'
        } account for ${selectedUser?.fullName}?`}
        confirmText={selectedUser?.isActive ? 'Deactivate' : 'Activate'}
        variant={selectedUser?.isActive ? 'danger' : 'info'}
        onConfirm={handleToggleStatus}
        onCancel={() => setIsDeactivateModalOpen(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for ${selectedUser?.fullName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteUser}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={isCustomerDetailsOpen}
        onClose={() => setIsCustomerDetailsOpen(false)}
        customer={selectedUser}
      />
    </div>
  );
};
