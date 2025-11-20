
import React from 'react';
import { View } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TicketIcon } from './icons/TicketIcon';
import { DesktopIcon } from './icons/DesktopIcon';
import { SparklesIcon } from './icons/SparklesIcon';


interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  isCustomer?: boolean;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  const activeClasses = 'bg-blue-600 text-white';
  const inactiveClasses = 'text-gray-400 hover:text-white hover:bg-gray-700';

  return (
    <li>
      <button
        onClick={onClick}
        className={`flex items-center p-2 text-base font-normal rounded-lg w-full text-left transition duration-75 ${isActive ? activeClasses : inactiveClasses}`}
      >
        {icon}
        <span className="ml-3">{label}</span>
      </button>
    </li>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, isAdmin = false, isCustomer = false }) => {
  return (
    <aside className="w-64" aria-label="Sidebar">
      <div className="overflow-y-auto py-4 px-3 h-full bg-gray-800 rounded-r-lg">
        <div className="flex items-center pl-2.5 mb-5">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">PS</span>
            </div>
            <span className="self-center text-xl font-semibold whitespace-nowrap text-white">Peres Systems</span>
        </div>
        <ul className="space-y-2">
          <NavItem
            icon={<DashboardIcon />}
            label="Dashboard"
            isActive={currentView === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          {!isCustomer && (
            <NavItem
              icon={<UsersIcon />}
              label="Clients"
              isActive={currentView === 'clients'}
              onClick={() => onNavigate('clients')}
            />
          )}
          {isCustomer && (
            <NavItem
              icon={<UsersIcon />}
              label="My Profile"
              isActive={currentView === 'my-profile'}
              onClick={() => onNavigate('my-profile')}
            />
          )}
          <NavItem
            icon={<TicketIcon />}
            label="Tickets"
            isActive={currentView === 'tickets'}
            onClick={() => onNavigate('tickets')}
          />
          <NavItem
            icon={<DesktopIcon />}
            label="Assets"
            isActive={currentView === 'assets'}
            onClick={() => onNavigate('assets')}
          />
        </ul>
        {isAdmin && (
          <div className="pt-4 mt-4 space-y-2 border-t border-gray-700">
            <NavItem
              icon={<UsersIcon />}
              label="Users"
              isActive={currentView === 'users'}
              onClick={() => onNavigate('users')}
            />
            <NavItem
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Business Settings"
              isActive={currentView === 'business-settings'}
              onClick={() => onNavigate('business-settings')}
            />
          </div>
        )}
        <div className="pt-4 mt-4 space-y-2 border-t border-gray-700">
            <NavItem
                icon={<SparklesIcon />}
                label="AI Assistant"
                isActive={currentView === 'ai-assistant'}
                onClick={() => onNavigate('ai-assistant')}
            />
        </div>
        <div className="pt-4 mt-4 space-y-2 border-t border-gray-700">
          <li>
            <button
              onClick={onLogout}
              className="flex items-center p-2 text-base font-normal rounded-lg w-full text-left text-gray-400 hover:text-white hover:bg-gray-700 transition duration-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="ml-3">Logout</span>
            </button>
          </li>
        </div>
      </div>
    </aside>
  );
};
