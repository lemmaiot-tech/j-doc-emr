import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Users } from '../icons/Icons';
import { Link, useNavigate } from 'react-router-dom';
import SyncStatus from './SyncStatus'; // Import the new component

const Header: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <SyncStatus /> {/* Add the SyncStatus component here */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)} 
            className="flex items-center text-left focus:outline-none"
          >
            <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center mr-3">
              <span className="font-bold text-primary-700">{userProfile?.displayName.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{userProfile?.displayName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile?.role}</p>
            </div>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
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