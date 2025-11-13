
import React, { useState, useEffect } from 'react';
import { Client } from '../types';

interface ClientManagerProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'joinDate'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

type ModalType = 'none' | 'add' | 'edit' | 'view' | 'delete';

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


const FormInput: React.FC<{
    label: string;
    name: keyof Omit<Client, 'id' | 'joinDate'>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}> = ({ label, name, value, onChange, type = 'text', placeholder, required = false }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}{required && ' *'}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            required={required}
        />
    </div>
);

const FormTextarea: React.FC<{
    label: string;
    name: 'details';
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}> = ({ label, name, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            rows={4}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        />
    </div>
);


export const ClientManager: React.FC<ClientManagerProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient }) => {
    const [modal, setModal] = useState<{ type: ModalType; client: Client | null }>({ type: 'none', client: null });

    const initialFormState: Omit<Client, 'id' | 'joinDate'> = {
        name: '', abn: '', contactPerson: '', email: '',
        address: '', phone: '', mobilePhone: '', details: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (modal.type === 'edit' && modal.client) {
            setFormData(modal.client);
        } else {
            setFormData(initialFormState);
        }
    }, [modal]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.contactPerson || !formData.email) {
            return;
        }
        if (modal.type === 'edit' && modal.client) {
            onUpdateClient({ ...modal.client, ...formData });
        } else {
            onAddClient(formData);
        }
        closeModal();
    };

    const handleDeleteConfirm = () => {
        if (modal.type === 'delete' && modal.client) {
            onDeleteClient(modal.client.id);
        }
        closeModal();
    };
    
    const openModal = (type: ModalType, client: Client | null = null) => {
        setModal({ type, client });
    };

    const closeModal = () => {
        setModal({ type: 'none', client: null });
    };

  return (
    <>
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Client Management</h1>
            <button 
                onClick={() => openModal('add')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
            >
                Add New Client
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Company Name</th>
                            <th scope="col" className="px-6 py-3">Contact Person</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Phone</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => (
                            <tr 
                                key={client.id} 
                                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                <td onClick={() => openModal('view', client)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer">
                                    {client.name}
                                </td>
                                <td onClick={() => openModal('view', client)} className="px-6 py-4 cursor-pointer">
                                    {client.contactPerson}
                                </td>
                                <td onClick={() => openModal('view', client)} className="px-6 py-4 cursor-pointer">
                                    {client.email}
                                </td>
                                <td onClick={() => openModal('view', client)} className="px-6 py-4 cursor-pointer">
                                    {client.phone}
                                </td>
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    <button onClick={() => openModal('edit', client)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`Edit ${client.name}`}>
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => openModal('delete', client)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete ${client.name}`}>
                                        <DeleteIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {/* Add/Edit Client Modal */}
    {(modal.type === 'add' || modal.type === 'edit') && (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity" 
                aria-hidden="true"
                onClick={closeModal}
            ></div>
            <div
                id="add-edit-client-modal"
                tabIndex={-1}
                aria-hidden="true"
                className="fixed inset-0 z-50 flex justify-center items-center w-full h-full"
            >
                <div className="relative p-4 w-full max-w-2xl h-auto">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                        <div className="flex justify-between items-center p-4 rounded-t border-b dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {modal.type === 'edit' ? 'Edit Client' : 'Add New Client'}
                            </h3>
                            <button type="button" onClick={closeModal} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput label="Business Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Innovate Corp" required />
                                    <FormInput label="ABN" name="abn" value={formData.abn} onChange={handleInputChange} placeholder="e.g. 53 004 085 616" />
                                    <FormInput label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="e.g. Alice Johnson" required />
                                    <FormInput label="Email" name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="e.g. contact@innovate.com" required />
                                    <div className="md:col-span-2">
                                        <FormInput label="Business Address" name="address" value={formData.address} onChange={handleInputChange} placeholder="e.g. 123 Innovation Dr, Tech City" />
                                    </div>
                                    <FormInput label="Business Phone" name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="e.g. (02) 1234 5678" />
                                    <FormInput label="Mobile Phone" name="mobilePhone" value={formData.mobilePhone} onChange={handleInputChange} type="tel" placeholder="e.g. 0412 345 678" />
                                    <div className="md:col-span-2">
                                        <FormTextarea label="Internal Notes" name="details" value={formData.details || ''} onChange={handleInputChange} placeholder="Add any internal notes about this client..." />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                                <button type="button" onClick={closeModal} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Cancel</button>
                                <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )}
    {/* Client Details Modal */}
    {modal.type === 'view' && modal.client && (
         <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity" 
                aria-hidden="true"
                onClick={closeModal}
            ></div>
            <div
                id="view-client-modal"
                tabIndex={-1}
                aria-hidden="true"
                className="fixed inset-0 z-50 flex justify-center items-center w-full h-full"
            >
                <div className="relative p-4 w-full max-w-2xl h-auto">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                        <div className="flex justify-between items-center p-4 rounded-t border-b dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Client Details
                            </h3>
                            <button type="button" onClick={closeModal} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                                <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{modal.client.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Contact Person</p><p className="text-gray-900 dark:text-white">{modal.client.contactPerson}</p></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">ABN</p><p className="text-gray-900 dark:text-white">{modal.client.abn || 'N/A'}</p></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Email Address</p><a href={`mailto:${modal.client.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{modal.client.email}</a></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Business Phone</p><p className="text-gray-900 dark:text-white">{modal.client.phone || 'N/A'}</p></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Mobile Phone</p><p className="text-gray-900 dark:text-white">{modal.client.mobilePhone || 'N/A'}</p></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Member Since</p><p className="text-gray-900 dark:text-white">{new Date(modal.client.joinDate).toLocaleDateString()}</p></div>
                                <div className="md:col-span-2"><p className="font-semibold text-gray-500 dark:text-gray-400">Business Address</p><p className="text-gray-900 dark:text-white">{modal.client.address || 'N/A'}</p></div>
                                {modal.client.details && <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><p className="font-semibold text-gray-500 dark:text-gray-400">Internal Notes</p><p className="text-gray-900 dark:text-white whitespace-pre-wrap">{modal.client.details}</p></div>}
                            </div>
                        </div>
                         <div className="flex items-center justify-end p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                            <button type="button" onClick={closeModal} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )}
    {/* Delete Confirmation Modal */}
    {modal.type === 'delete' && modal.client && (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={closeModal}></div>
        <div id="delete-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto h-full">
            <div className="relative w-full max-w-md h-auto">
                <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                    <button type="button" onClick={closeModal} className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white">
                        <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    <div className="p-6 text-center">
                        <svg aria-hidden="true" className="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this client?
                            <br/>
                            <span className="font-semibold text-gray-800 dark:text-white">{modal.client.name}</span>
                        </h3>
                        <button onClick={handleDeleteConfirm} type="button" className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2">
                            Yes, I'm sure
                        </button>
                        <button onClick={closeModal} type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">No, cancel</button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )}

    </>
  );
};