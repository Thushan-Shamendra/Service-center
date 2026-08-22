import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  updateProfile: (updatedUser: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vsms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vsms_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await authApi.getCurrentUser();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('vsms_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('vsms_token', data.token);
        localStorage.setItem('vsms_user', JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.firstName}!`);
        return data.user;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Invalid credentials';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vsms_token');
    localStorage.removeItem('vsms_user');
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const updateProfile = async (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('vsms_user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        hasRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
