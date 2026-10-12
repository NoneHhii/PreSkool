import React from 'react';
import { Search, Bell, Globe } from 'lucide-react';

interface HeaderProps {
  title: string;
  user: any;
}

const Header: React.FC<HeaderProps> = ({ title, user }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0 sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-gray-800 capitalize">
        {title}
      </h1>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-64"
          />
        </div>
        
        <div className="flex items-center gap-4 border-l pl-6 border-gray-200">
          <button className="text-gray-400 hover:text-gray-600 transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <button className="text-gray-400 hover:text-gray-600 transition">
            <Globe className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
