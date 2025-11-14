
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


export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout }) => {
  return (
    <aside className="w-64" aria-label="Sidebar">
      <div className="overflow-y-auto py-4 px-3 h-full bg-gray-800 rounded-r-lg">
        <div className="flex items-center pl-2.5 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-3 text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <span className="self-center text-xl font-semibold whitespace-nowrap text-white">MSP Nexus</span>
        </div>
        <ul className="space-y-2">
          <NavItem
            icon={<DashboardIcon />}
            label="Dashboard"
            isActive={currentView === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <NavItem
            icon={<UsersIcon />}
            label="Clients"
            isActive={currentView === 'clients'}
            onClick={() => onNavigate('clients')}
          />
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
