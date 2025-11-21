import React from 'react';
import { Client, Ticket, Asset } from '../types';
import { User } from '../services/auth';

interface DashboardProps {
    clients: Client[];
    tickets: Ticket[];
    assets: Asset[];
    onAddTicket?: (ticket: Omit<Ticket, 'id' | 'createdDate' | 'updatedDate'>) => void;
    onUpdateTicket?: (ticket: Ticket) => void;
    onDeleteTicket?: (ticketId: string) => void;
    currentUser?: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, tickets, assets, currentUser }) => {
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
    
    // Hide "Total Clients" card for customers
    const isCustomer = currentUser?.role === 'customer';
    const gridCols = isCustomer ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

    return (
        <div className="w-full">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-6 mb-8`}>
                {!isCustomer && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Clients</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Open Tickets</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{openTickets}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">In Progress</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{inProgressTickets}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Assets</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{assets.length}</p>
                </div>
            </div>
        </div>
    );
};
