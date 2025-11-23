import React from 'react';
import { PeresSystemsLogo } from './icons';
import { User } from '../services/auth';

interface HeaderProps {
  isAuthenticated: boolean;
  currentUser?: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onHomeClick?: () => void;
  onServicesClick?: () => void;
  onContactClick?: () => void;
  onDashboardClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, currentUser, onLoginClick, onLogoutClick, onHomeClick, onServicesClick, onContactClick, onDashboardClick }) => {
  // Always show Dashboard button when authenticated (even if onDashboardClick is not provided, it will be a no-op)
  const showDashboard = isAuthenticated;
  
  // Get user display name
  const getUserDisplayName = () => {
    if (!currentUser) return null;
    return currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'User';
  };
  
  return (
    <header className="bg-blue-900 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 py-2">
          <div className="flex flex-col items-start">
            {onHomeClick ? (
              <button onClick={onHomeClick} className="flex items-center hover:opacity-80 transition-opacity">
                <PeresSystemsLogo className="h-10 w-auto text-white" />
              </button>
            ) : (
              <PeresSystemsLogo className="h-10 w-auto text-white" />
            )}
            {isAuthenticated && currentUser && (
              <div className="text-white text-xs font-medium mt-2">
                Welcome: {getUserDisplayName()}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {showDashboard && (
              <button
                onClick={onDashboardClick || (() => {})}
                className="px-4 py-2 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Dashboard
              </button>
            )}
            {onHomeClick && (
              <button
                onClick={onHomeClick}
                className="px-4 py-2 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Home
              </button>
            )}
            {onServicesClick && (
              <button
                onClick={onServicesClick}
                className="px-4 py-2 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Services
              </button>
            )}
            {onContactClick && (
              <button
                onClick={onContactClick}
                className="px-4 py-2 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Contact
              </button>
            )}
            {isAuthenticated ? (
               <button
                onClick={onLogoutClick}
                className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;