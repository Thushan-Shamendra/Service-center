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
  Car, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DemoAccount {
  role: string;
  label: string;
  email: string;
  pass: string;
  badge: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'administrator', label: 'Admin', email: 'admin@vsms.lk', pass: 'Admin@123', badge: 'Full Control' },
  { role: 'manager', label: 'Manager', email: 'manager@vsms.lk', pass: 'Manager@123', badge: 'Operations' },
  { role: 'employee', label: 'Technician', email: 'employee@vsms.lk', pass: 'Employee@123', badge: 'Workshop' },
  { role: 'customer', label: 'Customer', email: 'customer@vsms.lk', pass: 'Customer@123', badge: 'Client Portal' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.pass);
    setActiveRole(account.role);
    toast.success(`Loaded ${account.label} credentials`, {
      icon: '🔑',
      style: { borderRadius: '10px', background: '#1E293B', color: '#fff', fontSize: '13px' },
    });
  };

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
      // Handled by AuthContext toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-5xl w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-2xl relative z-10 transition-all duration-300">
        
        {/* Left Side: Brand Visuals & Platform Highlights (5 Cols on large) */}
        <div className="lg:col-span-5 p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/80 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          
          {/* Subtle ambient light inside left panel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Enterprise Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold tracking-wide mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Service Management</span>
            </div>

            <Logo variant="light" size="lg" className="mb-6" />

            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight mb-3">
              Intelligent Automotive Service Platform
            </h2>
            <p className="text-xs lg:text-sm text-slate-400 leading-relaxed font-normal">
              Next-generation workshop automation with live job workflows, real-time analytics, technician logs, and Sri Lankan compliance.
            </p>
          </div>

          {/* Feature Highlights Cards */}
          <div className="space-y-3 my-8 relative z-10">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm transition-all hover:bg-slate-800/60">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Smart Job Cards & Worklogs</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated technician tracking & parts requisition</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm transition-all hover:bg-slate-800/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Live Customer Tracker</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time status updates from bay to delivery</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm transition-all hover:bg-slate-800/60">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">LKR Billing & Taxation</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated invoices, GRN, & supplier settlements</p>
              </div>
            </div>
          </div>

          {/* Bottom Security / Trust Metrics */}
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              99.9% Cloud Uptime
            </span>
            <span className="text-slate-500">© 2026 VSMS.LK</span>
          </div>
        </div>

        {/* Right Side: Login Form & Role Switcher (7 Cols on large) */}
        <div className="lg:col-span-7 p-8 lg:p-12 bg-white flex flex-col justify-center">
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Sign In
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cloud API Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select a demo role or enter your system credentials to access your dashboard.
            </p>
          </div>

          {/* Quick Demo Role Selector Pills */}
          <div className="mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-600" />
                Quick Role Autofill
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = activeRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`px-3 py-2 rounded-xl text-left transition-all duration-150 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {acc.label}
                    </div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {acc.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setActiveRole(null);
                  }}
                  placeholder="admin@vsms.lk or admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    toast('Default password is in the seed guide. Contact Administrator for resets.', {
                      icon: 'ℹ️',
                      style: { borderRadius: '10px', background: '#1E293B', color: '#fff', fontSize: '13px' },
                    });
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActiveRole(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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

          {/* Bottom Help / Documentation Link */}
          <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <span>Powered by VSMS Cloud Engine</span>
            <span>•</span>
            <span className="text-slate-500">v2.0.4</span>
          </div>

        </div>

      </div>
    </div>
  );
};
