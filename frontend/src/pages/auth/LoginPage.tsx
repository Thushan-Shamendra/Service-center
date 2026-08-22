import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/ui/Logo';
import { 
  User, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Wrench, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both username/email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login({ email, password });
      
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
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 font-sans bg-white select-none">
      
      {/* LEFT SIDE: Full-Height Corporate Brand & Visuals (5 of 12 columns on desktop) */}
      <div className="lg:col-span-5 bg-[#0B0F19] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
        
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px'
          }}
        />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sri Lanka's #1 Auto Service Suite</span>
          </div>

          <Logo variant="light" size="lg" className="mb-8" />

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
            End-to-End Service Operations Platform
          </h1>
          
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-normal">
            Automate customer appointments, job card queues, technician time logs, inventory GRN, and compliant LKR tax invoicing in real time.
          </p>
        </div>

        {/* Center Feature Highlights */}
        <div className="space-y-4 my-10 relative z-10">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md transition-all hover:bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Live Service Bays & Job Cards</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time status workflow from vehicle check-in to quality audit.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md transition-all hover:bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Smart Stock & Requisitions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated low-stock alerts, spare parts issuance, and GRN returns.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md transition-all hover:bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">LKR Compliant Billing</h3>
              <p className="text-xs text-slate-400 mt-0.5">Integrated customer receipts, payroll tracking, and financial ledgers.</p>
            </div>
          </div>
        </div>

        {/* Bottom Trust Metrics */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <span className="flex items-center gap-2 font-medium text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            99.9% Cloud Availability
          </span>
          <span className="text-slate-500 font-mono text-[11px]">v2.0.4 Enterprise</span>
        </div>

      </div>

      {/* RIGHT SIDE: Full-Height Clean White Sign-in Form (7 of 12 columns) */}
      <div className="lg:col-span-7 bg-slate-50/60 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        
        <div className="max-w-lg w-full bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Sign In
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Render API Connected
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Enter your system credentials to access your dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Username or Email Address
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setActiveRole(null);
                  }}
                  placeholder="admin@vsms.lk or admin"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    toast('Default password is in the seed guide. Contact Administrator for resets.', {
                      icon: 'ℹ️',
                      style: { borderRadius: '10px', background: '#0F172A', color: '#fff', fontSize: '13px' },
                    });
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActiveRole(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
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
              className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Footer Note */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            <span>Vehicle Service Management System</span>
            <span className="mx-2">•</span>
            <span>All rights reserved</span>
          </div>

        </div>

      </div>

    </div>
  );
};
