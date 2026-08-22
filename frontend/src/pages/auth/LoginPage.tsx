import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/ui/Logo';
import { User, Lock, ArrowRight, ShieldCheck, Wrench, Car, Clock, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login({ email, password });
      // Redirect based on backend authenticated user role
      switch (authenticatedUser.role) {
        case 'administrator':
          navigate('/admin/dashboard');
          break;
        case 'manager':
          navigate('/manager/dashboard');
          break;
        case 'employee':
          navigate('/employee/dashboard');
          break;
        case 'customer':
          navigate('/customer/dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-slate-800/80 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 backdrop-blur-xl relative z-10">
        {/* Left Side: Brand Visual & Value Props */}
        <div className="p-8 lg:p-12 bg-gradient-to-br from-brand-600 to-brand-900 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Logo variant="light" size="lg" className="mb-8" />
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-4">
              Sri Lanka's Premier Vehicle Service Platform
            </h2>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              Complete end-to-end service management for modern automotive service centers. Real-time tracking, automated workflow, inventory, and analytics.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4 my-8 relative z-10">
            <div className="flex items-center gap-3 text-xs font-semibold text-blue-100">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4 text-sky-300" />
              </div>
              <span>Digital Job Cards & Technician Worklogs</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-blue-100">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-sky-300" />
              </div>
              <span>Real-Time Customer Service Tracker</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-blue-100">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-sky-300" />
              </div>
              <span>LKR Invoicing & Sri Lankan Compliance</span>
            </div>
          </div>

          <div className="text-[11px] text-blue-200/60 font-medium relative z-10">
            © 2026 Vehicle Service Management System. All rights reserved.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 lg:p-12 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In</h3>
            <p className="text-sm text-slate-500 mt-1">Access your role-based dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact your administrator to reset your password.');
                  }}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
