
import React, { useState, useEffect } from 'react';
import { Client, Ticket, Asset, TicketStatus } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { TicketIcon } from './icons/TicketIcon';
import { DesktopIcon } from './icons/DesktopIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface DashboardProps {
  clients: Client[];
  tickets: Ticket[];
  assets: Asset[];
  onAddTicket?: (ticket: Omit<Ticket, 'id' | 'createdDate'>) => void;
  onUpdateTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  currentUser?: { username?: string; email?: string; full_name?: string } | null;
}

type ModalType = 'none' | 'add' | 'edit' | 'delete';

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

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const Dashboard: React.FC<DashboardProps> = ({ 
  clients, 
  tickets, 
  assets, 
  onAddTicket, 
  onUpdateTicket, 
  onDeleteTicket,
  currentUser
}) => {
  const [modal, setModal] = useState<{ type: ModalType; ticket: Ticket | null }>({ type: 'none', ticket: null });
  const [formData, setFormData] = useState<Omit<Ticket, 'id' | 'createdDate'>>({
    title: '',
    description: '',
    clientId: clients[0]?.id || '',
    status: TicketStatus.Open,
  });

  const openTickets = tickets.filter(t => t.status === TicketStatus.Open || t.status === TicketStatus.InProgress);
  const recentTickets = [...tickets].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 5);
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  const hasTicketHandlers = !!(onAddTicket && onUpdateTicket && onDeleteTicket);

  useEffect(() => {
    if ((modal.type === 'add' || modal.type === 'edit') && !formData.clientId && clients.length > 0) {
      setFormData(prev => ({ ...prev, clientId: clients[0].id }));
    }
    if (modal.type === 'edit' && modal.ticket) {
      setFormData(modal.ticket);
    } else if (modal.type === 'add') {
      setFormData({
        title: '',
        description: '',
        clientId: clients[0]?.id || '',
        status: TicketStatus.Open,
      });
    }
  }, [modal, clients]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clientId || !hasTicketHandlers) return;
    
    if (modal.type === 'edit' && modal.ticket && onUpdateTicket) {
      onUpdateTicket({ ...modal.ticket, ...formData });
    } else if (modal.type === 'add' && onAddTicket) {
      onAddTicket(formData);
    }
    closeModal();
  };

  const handleDeleteConfirm = () => {
    if (modal.type === 'delete' && modal.ticket && onDeleteTicket) {
      onDeleteTicket(modal.ticket.id);
    }
    closeModal();
  };

  const openModal = (type: ModalType, ticket: Ticket | null = null) => setModal({ type, ticket });
  const closeModal = () => setModal({ type: 'none', ticket: null });

  // Get user display name - use useMemo to ensure it updates when currentUser changes
  const userDisplayName = React.useMemo(() => {
    if (!currentUser) return 'User';
    return currentUser.full_name || currentUser.username || currentUser.email || 'User';
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Welcome, {userDisplayName}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Clients" value={clients.length} icon={<UsersIcon className="w-8 h-8"/>} />
        <StatCard title="Open Tickets" value={openTickets.length} icon={<TicketIcon className="w-8 h-8"/>} />
        <StatCard title="Managed Assets" value={assets.length} icon={<DesktopIcon className="w-8 h-8"/>} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Tickets</h2>
            {hasTicketHandlers && (
              <button 
                onClick={() => openModal('add')} 
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                + Create
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Title</th>
                  <th scope="col" className="px-4 py-3">Client</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  {hasTicketHandlers && <th scope="col" className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={hasTicketHandlers ? 4 : 3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No tickets yet. {hasTicketHandlers && 'Create your first ticket!'}
                    </td>
                  </tr>
                ) : (
                  recentTickets.map(ticket => (
                    <tr key={ticket.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{ticket.title}</td>
                      <td className="px-4 py-3">{clientMap.get(ticket.clientId) || 'Unknown'}</td>
                      <td className="px-4 py-3"><TicketStatusBadge status={ticket.status} /></td>
                      {hasTicketHandlers && (
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => openModal('edit', ticket)} 
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" 
                              aria-label={`Edit ${ticket.title}`}
                            >
                              <EditIcon />
                            </button>
                            <button 
                              onClick={() => openModal('delete', ticket)} 
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" 
                              aria-label={`Delete ${ticket.title}`}
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {hasTicketHandlers && (modal.type === 'add' || modal.type === 'edit') && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={closeModal}></div>
          <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full p-4">
            <div className="relative w-full max-w-lg">
              <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex justify-between items-center p-4 rounded-t border-b dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {modal.type === 'edit' ? 'Edit Ticket' : 'Create New Ticket'}
                  </h3>
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Title *</label>
                      <input 
                        type="text" 
                        name="title" 
                        id="title" 
                        value={formData.title} 
                        onChange={handleInputChange} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                        required 
                      />
                    </div>
                    <div>
                      <label htmlFor="clientId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Client *</label>
                      <select 
                        name="clientId" 
                        id="clientId" 
                        value={formData.clientId} 
                        onChange={handleInputChange} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        required
                      >
                        <option value="" disabled>Select a client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Status *</label>
                      <select 
                        name="status" 
                        id="status" 
                        value={formData.status} 
                        onChange={handleInputChange} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        required
                      >
                        {Object.values(TicketStatus).map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Description</label>
                      <textarea 
                        name="description" 
                        id="description" 
                        value={formData.description} 
                        onChange={handleInputChange} 
                        rows={5} 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex items-center justify-end p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                    <button 
                      type="button" 
                      onClick={closeModal} 
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Save Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {hasTicketHandlers && modal.type === 'delete' && modal.ticket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40">
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md h-auto">
              <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <div className="p-6 text-center">
                  <svg aria-hidden="true" className="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this ticket?
                    <br/>
                    <span className="font-semibold text-gray-800 dark:text-white">"{modal.ticket.title}"</span>
                  </h3>
                  <button 
                    onClick={handleDeleteConfirm} 
                    type="button" 
                    className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2"
                  >
                    Yes, I'm sure
                  </button>
                  <button 
                    onClick={closeModal} 
                    type="button" 
                    className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    No, cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
