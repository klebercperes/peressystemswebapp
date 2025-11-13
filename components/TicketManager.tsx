import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Client, TicketStatus } from '../types';

interface TicketManagerProps {
  tickets: Ticket[];
  clients: Client[];
  onAddTicket: (ticket: Omit<Ticket, 'id' | 'createdDate'>) => void;
  onUpdateTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
}

type ModalType = 'none' | 'add' | 'edit' | 'view' | 'delete';
type ViewMode = 'card' | 'list';
type SortKey = keyof Ticket | 'clientName';

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ViewListIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

const ViewGridIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const SortIcon: React.FC<{ direction?: 'asc' | 'desc' }> = ({ direction }) => {
    if (!direction) return <svg className="w-4 h-4 ml-1.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
    if (direction === 'asc') return <svg className="w-4 h-4 ml-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
    return <svg className="w-4 h-4 ml-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
};

const TicketStatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
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

const TicketCard: React.FC<{ ticket: Ticket; clientName: string; onView: () => void; onEdit: () => void; onDelete: () => void; }> = ({ ticket, clientName, onView, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col justify-between transition-shadow hover:shadow-lg">
        <div onClick={onView} className="cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-2">{ticket.title}</h3>
                <TicketStatusBadge status={ticket.status} />
            </div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{clientName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-12 overflow-hidden text-ellipsis">{ticket.description}</p>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-3 mt-3">
            <span>Opened: {new Date(ticket.createdDate).toLocaleDateString()}</span>
            <div className="flex items-center space-x-2">
                 <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`Edit ${ticket.title}`}><EditIcon /></button>
                 <button onClick={onDelete} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete ${ticket.title}`}><DeleteIcon /></button>
            </div>
        </div>
    </div>
);

export const TicketManager: React.FC<TicketManagerProps> = ({ tickets, clients, onAddTicket, onUpdateTicket, onDeleteTicket }) => {
    const [modal, setModal] = useState<{ type: ModalType; ticket: Ticket | null }>({ type: 'none', ticket: null });
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [sortKey, setSortKey] = useState<SortKey>('createdDate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    
    const initialFormState: Omit<Ticket, 'id' | 'createdDate'> = {
        title: '',
        description: '',
        clientId: clients[0]?.id || '',
        status: TicketStatus.Open,
    };
    const [formData, setFormData] = useState<Omit<Ticket, 'id' | 'createdDate'>>(initialFormState);

    const sortedTickets = useMemo(() => {
        const sorted = [...tickets].sort((a, b) => {
            let valA: string | number = '';
            let valB: string | number = '';

            if (sortKey === 'clientName') {
                valA = clientMap.get(a.clientId) || '';
                valB = clientMap.get(b.clientId) || '';
            } else if (sortKey === 'createdDate') {
                valA = new Date(a.createdDate).getTime();
                valB = new Date(b.createdDate).getTime();
            } else {
                valA = a[sortKey as keyof Ticket] || '';
                valB = b[sortKey as keyof Ticket] || '';
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return valA.localeCompare(valB);
            }
            return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
        });

        return sortDirection === 'asc' ? sorted : sorted.reverse();
    }, [tickets, sortKey, sortDirection, clientMap]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    useEffect(() => {
        if ((modal.type === 'add' || modal.type === 'edit') && !formData.clientId && clients.length > 0) {
            setFormData(prev => ({ ...prev, clientId: clients[0].id }));
        }
        if (modal.type === 'edit' && modal.ticket) {
            setFormData(modal.ticket);
        } else {
            setFormData(initialFormState);
        }
    }, [modal, clients]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.clientId) return;
        
        if (modal.type === 'edit' && modal.ticket) {
            onUpdateTicket({ ...modal.ticket, ...formData });
        } else {
            onAddTicket(formData);
        }
        closeModal();
    };

    const handleDeleteConfirm = () => {
        if (modal.type === 'delete' && modal.ticket) {
            onDeleteTicket(modal.ticket.id);
        }
        closeModal();
    };
    
    const openModal = (type: ModalType, ticket: Ticket | null = null) => setModal({ type, ticket });
    const closeModal = () => setModal({ type: 'none', ticket: null });

    const SortableHeader: React.FC<{ columnKey: SortKey; children: React.ReactNode }> = ({ columnKey, children }) => (
        <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort(columnKey)}>
            <div className="flex items-center">
                {children}
                <SortIcon direction={sortKey === columnKey ? sortDirection : undefined} />
            </div>
        </th>
    );

    return (
        <>
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Ticket Management</h1>
                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button type="button" onClick={() => setViewMode('card')} className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${viewMode === 'card' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                            <ViewGridIcon className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                           <ViewListIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <button onClick={() => openModal('add')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                        Create Ticket
                    </button>
                </div>
            </div>
            
            {viewMode === 'card' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedTickets.map(ticket => (
                        <TicketCard 
                            key={ticket.id} 
                            ticket={ticket} 
                            clientName={clientMap.get(ticket.clientId) || 'Unknown Client'} 
                            onView={() => openModal('view', ticket)}
                            onEdit={() => openModal('edit', ticket)}
                            onDelete={() => openModal('delete', ticket)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <SortableHeader columnKey="title">Title</SortableHeader>
                                    <SortableHeader columnKey="clientName">Client</SortableHeader>
                                    <SortableHeader columnKey="status">Status</SortableHeader>
                                    <SortableHeader columnKey="createdDate">Created</SortableHeader>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTickets.map(ticket => (
                                    <tr key={ticket.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td onClick={() => openModal('view', ticket)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer">{ticket.title}</td>
                                        <td onClick={() => openModal('view', ticket)} className="px-6 py-4 cursor-pointer">{clientMap.get(ticket.clientId) || 'Unknown'}</td>
                                        <td onClick={() => openModal('view', ticket)} className="px-6 py-4 cursor-pointer"><TicketStatusBadge status={ticket.status} /></td>
                                        <td onClick={() => openModal('view', ticket)} className="px-6 py-4 cursor-pointer">{new Date(ticket.createdDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 flex items-center space-x-3">
                                            <button onClick={() => openModal('edit', ticket)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`Edit ${ticket.title}`}><EditIcon /></button>
                                            <button onClick={() => openModal('delete', ticket)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete ${ticket.title}`}><DeleteIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* Add/Edit Modal */}
        {(modal.type === 'add' || modal.type === 'edit') && (
            <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={closeModal}></div>
            <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full p-4">
                <div className="relative w-full max-w-lg">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                        <div className="flex justify-between items-center p-4 rounded-t border-b dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{modal.type === 'edit' ? 'Edit Ticket' : 'Create New Ticket'}</h3>
                            <button type="button" onClick={closeModal} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Title *</label>
                                    <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} className="input-field" required />
                                </div>
                                <div>
                                    <label htmlFor="clientId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Client *</label>
                                    <select name="clientId" id="clientId" value={formData.clientId} onChange={handleInputChange} className="input-field" required>
                                        <option value="" disabled>Select a client</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Status *</label>
                                    <select name="status" id="status" value={formData.status} onChange={handleInputChange} className="input-field" required>
                                        {Object.values(TicketStatus).map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Description</label>
                                    <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={5} className="input-field"></textarea>
                                </div>
                            </div>
                            <div className="flex items-center justify-end p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            </>
        )}

        {/* View Modal */}
        {modal.type === 'view' && modal.ticket && (
             <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={closeModal}>
                <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full p-4" onClick={e => e.stopPropagation()}>
                    <div className="relative w-full max-w-2xl">
                        <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                             <div className="flex justify-between items-center p-4 rounded-t border-b dark:border-gray-600">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ticket Details</h3>
                                <button type="button" onClick={closeModal} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                </button>
                            </div>
                             <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modal.ticket.title}</h2>
                                    <TicketStatusBadge status={modal.ticket.status} />
                                </div>
                                <p className="text-md font-medium text-blue-600 dark:text-blue-400">{clientMap.get(modal.ticket.clientId)}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{modal.ticket.description}</p>
                                <div className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-3 mt-3 space-y-1">
                                    <p><strong>Created:</strong> {new Date(modal.ticket.createdDate).toLocaleString()}</p>
                                    {modal.ticket.resolvedDate && <p><strong>Resolved:</strong> {new Date(modal.ticket.resolvedDate).toLocaleString()}</p>}
                                </div>
                            </div>
                             <div className="flex items-center justify-end p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                                <button type="button" onClick={closeModal} className="btn-primary">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {modal.type === 'delete' && modal.ticket && (
             <div className="fixed inset-0 bg-black bg-opacity-60 z-40">
                <div id="delete-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-md h-auto">
                        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                            <div className="p-6 text-center">
                                <svg aria-hidden="true" className="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete this ticket?
                                    <br/>
                                    <span className="font-semibold text-gray-800 dark:text-white">"{modal.ticket.title}"</span>
                                </h3>
                                <button onClick={handleDeleteConfirm} type="button" className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2">
                                    Yes, I'm sure
                                </button>
                                <button onClick={closeModal} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">No, cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
