
import React from 'react';
import { Client, Ticket, Asset, TicketStatus } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { TicketIcon } from './icons/TicketIcon';
import { DesktopIcon } from './icons/DesktopIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface DashboardProps {
  clients: Client[];
  tickets: Ticket[];
  assets: Asset[];
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
    <div className="text-blue-500 bg-blue-100 dark:bg-gray-700 p-3 rounded-full">
      {icon}
    </div>
  </div>
);


const TicketStatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
  // FIX: Replaced incorrect TicketStatus.Resolved with TicketStatus.Completed and added other missing statuses.
  const statusClasses: Record<TicketStatus, string> = {
    [TicketStatus.Open]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    [TicketStatus.InProgress]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    [TicketStatus.Paused]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    [TicketStatus.Completed]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    [TicketStatus.Canceled]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    [TicketStatus.Closed]: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

export const Dashboard: React.FC<DashboardProps> = ({ clients, tickets, assets }) => {
  const openTickets = tickets.filter(t => t.status === TicketStatus.Open || t.status === TicketStatus.InProgress);
  const recentTickets = [...tickets].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 5);
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Clients" value={clients.length} icon={<UsersIcon className="w-8 h-8"/>} />
        <StatCard title="Open Tickets" value={openTickets.length} icon={<TicketIcon className="w-8 h-8"/>} />
        <StatCard title="Managed Assets" value={assets.length} icon={<DesktopIcon className="w-8 h-8"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Tickets</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Title</th>
                  <th scope="col" className="px-4 py-3">Client</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map(ticket => (
                  <tr key={ticket.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{ticket.title}</td>
                    <td className="px-4 py-3">{clientMap.get(ticket.clientId) || 'Unknown'}</td>
                    <td className="px-4 py-3"><TicketStatusBadge status={ticket.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">New Clients</h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...clients].sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()).slice(0, 5).map(client => (
                <li key={client.id} className="py-3 sm:py-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                             <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                                {client.name.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                {client.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                {client.email}
                            </p>
                        </div>
                        <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                            {new Date(client.joinDate).toLocaleDateString()}
                        </div>
                    </div>
                </li>
            ))}
            </ul>
        </div>
      </div>
    </div>
  );
};
