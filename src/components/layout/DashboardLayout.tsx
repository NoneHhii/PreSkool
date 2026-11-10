import React, { useState } from 'react';
import Header from './Headers';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex text-gray-800">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          onSelectTab(tab);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-white py-3 px-6 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Copyright &copy; 2026 PreSkool.</p>
          <p className="text-gray-400">Designed with PreSkool ERP UI Kit</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
