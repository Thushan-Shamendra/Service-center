import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-bg flex">
      {/* Sidebar Navigation */}
      <div className="print:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 print:pl-0">
        <div className="print:hidden">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in print:p-0 print:max-w-none">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
