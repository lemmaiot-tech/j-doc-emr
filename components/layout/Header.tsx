import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Users, Menu } from '../icons/Icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SyncStatus from './SyncStatus'; // Import the new component

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { userProfile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(Boolean);
    const mainPath = pathSegments[0] || 'dashboard';

    // More specific titles
    if (mainPath === 'admin' && pathSegments[1]) {
        switch(pathSegments[1]) {
            case 'users': return 'User Management';
            case 'departments': return 'Departments';
            case 'audit-log': return 'Audit Log';
            default: return 'Admin';
        }
    }
     if (mainPath === 'patients' && pathSegments.length > 1) {
       return 'Patient Details';
     }

    return mainPath.charAt(0).toUpperCase() + mainPath.slice(1);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex-shrink-0">
       <div className="flex items-center">
         {/* Hamburger Menu for mobile */}
        <button onClick={onMenuClick} className="md:hidden mr-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <SyncStatus /> {/* Add the SyncStatus component here */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)} 
            className="flex items-center text-left focus:outline-none"
          >
            <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center mr-3">
              <span className="font-bold text-primary-700">{userProfile?.displayName.charAt(0)}</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-800 dark:text-white">{userProfile?.displayName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile?.role}</p>
            </div>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 sm:hidden">
                <p className="font-semibold text-gray-800 dark:text-white">{userProfile?.displayName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile?.role}</p>
              </div>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-900 dark:text-white">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userProfile?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Users className="w-4 h-4 mr-3" />
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
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
