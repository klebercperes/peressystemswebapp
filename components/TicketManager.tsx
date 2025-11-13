
import React from 'react';
import { Ticket, Client, TicketStatus } from '../types';

interface TicketManagerProps {
  tickets: Ticket[];
  clients: Client[];
}

const TicketStatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
  const statusClasses = {
    [TicketStatus.Open]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    [TicketStatus.InProgress]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    [TicketStatus.Resolved]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    [TicketStatus.Closed]: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const TicketCard: React.FC<{ ticket: Ticket; clientName: string }> = ({ ticket, clientName }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.title}</h3>
                <TicketStatusBadge status={ticket.status} />
            </div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{clientName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-12 overflow-hidden">{ticket.description}</p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-3 mt-3">
            Opened: {new Date(ticket.createdDate).toLocaleString()}
        </div>
    </div>
);

export const TicketManager: React.FC<TicketManagerProps> = ({ tickets, clients }) => {
    const clientMap = new Map(clients.map(c => [c.id, c.name]));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Ticket Management</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                    Create New Ticket
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} clientName={clientMap.get(ticket.clientId) || 'Unknown Client'} />
                ))}
            </div>
        </div>
    );
};
