import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return '/login';
    return `/${user.role}/dashboard`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center">
        <div className="w-16 h-16 bg-blue-50 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-blue-50/50">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Page Not Found (404)</h2>
        <p className="text-sm text-slate-500 mb-6">
          The page or resource you are looking for does not exist or has been moved.
        </p>
        <Link
          to={getHomePath()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md hover:bg-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Safety
        </Link>
      </div>
    </div>
  );
};
