import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Calendar,
  ChevronDown,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  Maximize2,
  Minimize2,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../ui/Avatar';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAcademicYearOpen, setIsAcademicYearOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024 / 2025');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const academicMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (academicMenuRef.current && !academicMenuRef.current.contains(event.target as Node)) {
        setIsAcademicYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const userName = user?.profile?.fullName || user?.username || 'Administrator';
  const userRole = user?.role || 'ADMIN';
  const userAvatar = user?.profile?.avatarUrl;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-4 md:px-6 shadow-xs transition-colors">
      {/* Left: Sidebar Toggle + Global Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search bar matching Figma */}
        <div className="relative flex-1 hidden sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50/60 py-2 pl-9 pr-8 text-xs text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Academic Year + Actions + Profile */}
      <div className="flex items-center gap-1.5 md:gap-2.5">
        {/* Academic Year Dropdown */}
        <div className="relative hidden lg:block" ref={academicMenuRef}>
          <button
            onClick={() => setIsAcademicYearOpen(!isAcademicYearOpen)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>Academic Year : {selectedYear}</span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {isAcademicYearOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-lg border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50">
              {['2023 / 2024', '2024 / 2025', '2025 / 2026', '2026 / 2027'].map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setIsAcademicYearOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs transition ${
                    selectedYear === year ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle (Sun/Moon) */}
        <button
          onClick={() => toggleTheme(theme === 'light' ? 'dark' : 'light')}
          title="Toggle light/dark mode"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification Bell */}
        <button
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        </button>

        {/* Messages */}
        <button
          title="Messages"
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 transition cursor-pointer"
          >
            <Avatar
              src={userAvatar}
              name={userName}
              size="sm"
              status="online"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-gray-800 leading-tight">{userName}</span>
              <span className="text-[10px] text-gray-400 capitalize">{userRole.toLowerCase()}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-3 p-2 border-b border-gray-100">
                <Avatar
                  src={userAvatar}
                  name={userName}
                  size="md"
                />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold text-gray-900 truncate">{userName}</span>
                  <span className="text-xs text-gray-500 truncate">{user?.email || 'user@preskool.com'}</span>
                  <span className="mt-1 inline-flex w-fit items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {userRole}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition cursor-pointer"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>My Profile</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
