import React, { useState, useEffect } from 'react';
import { Asset, Client } from '../types';

interface AssetManagerProps {
  assets: Asset[];
  clients: Client[];
  onAddAsset: (asset: Omit<Asset, 'id'>) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (assetId: string) => void;
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

export const AssetManager: React.FC<AssetManagerProps> = ({ assets, clients, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
  const [modal, setModal] = useState<{ type: ModalType; asset: Asset | null }>({ type: 'none', asset: null });
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  const today = new Date().toISOString().split('T')[0];
  const initialFormState: Omit<Asset, 'id'> = {
      name: '',
      clientId: clients[0]?.id || '',
      type: 'Laptop',
      purchaseDate: today,
      warrantyEndDate: today,
      notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if ((modal.type === 'add' || modal.type === 'edit') && !formData.clientId && clients.length > 0) {
        setFormData(prev => ({ ...prev, clientId: clients[0].id }));
    }
    if (modal.type === 'edit' && modal.asset) {
        setFormData(modal.asset);
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
    if (!formData.name || !formData.clientId) return;

    if (modal.type === 'edit' && modal.asset) {
        onUpdateAsset({ ...modal.asset, ...formData });
    } else {
        onAddAsset(formData);
    }
    closeModal();
  };

  const handleDeleteConfirm = () => {
    if (modal.type === 'delete' && modal.asset) {
        onDeleteAsset(modal.asset.id);
    }
    closeModal();
  };

  const openModal = (type: ModalType, asset: Asset | null = null) => setModal({ type, asset });
  const closeModal = () => setModal({ type: 'none', asset: null });

  return (
    <>
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Asset Management</h1>
            <button onClick={() => openModal('add')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                Add New Asset
            </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Asset Name</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Client</th>
                            <th scope="col" className="px-6 py-3">Purchase Date</th>
                            <th scope="col" className="px-6 py-3">Warranty End</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => (
                            <tr key={asset.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td onClick={() => openModal('view', asset)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white cursor-pointer">{asset.name}</td>
                                <td onClick={() => openModal('view', asset)} className="px-6 py-4 cursor-pointer">{asset.type}</td>
                                <td onClick={() => openModal('view', asset)} className="px-6 py-4 cursor-pointer">{clientMap.get(asset.clientId) || 'Unknown'}</td>
                                <td onClick={() => openModal('view', asset)} className="px-6 py-4 cursor-pointer">{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                                <td onClick={() => openModal('view', asset)} className="px-6 py-4 cursor-pointer">{new Date(asset.warrantyEndDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    <button onClick={() => openModal('edit', asset)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`Edit ${asset.name}`}><EditIcon /></button>
                                    <button onClick={() => openModal('delete', asset)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete ${asset.name}`}><DeleteIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {/* Add/Edit Asset Modal */}
    {(modal.type === 'add' || modal.type === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40">
            <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full p-4">
                <div className="relative w-full max-w-lg">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                        <div className="flex justify-between items-center p-4 rounded-t border-b dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{modal.type === 'edit' ? 'Edit Asset' : 'Add New Asset'}</h3>
                            <button onClick={closeModal} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">X</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="name" className="label-field">Asset Name *</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" required />
                                    </div>
                                    <div>
                                        <label htmlFor="clientId" className="label-field">Client *</label>
                                        <select name="clientId" value={formData.clientId} onChange={handleInputChange} className="input-field" required>
                                            <option value="" disabled>Select a client</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label htmlFor="type" className="label-field">Asset Type *</label>
                                        <select name="type" value={formData.type} onChange={handleInputChange} className="input-field" required>
                                            {['Laptop', 'Desktop', 'Server', 'Printer', 'Router', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="purchaseDate" className="label-field">Purchase Date</label>
                                        <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label htmlFor="warrantyEndDate" className="label-field">Warranty End Date</label>
                                        <input type="date" name="warrantyEndDate" value={formData.warrantyEndDate} onChange={handleInputChange} className="input-field" />
                                    </div>
                                     <div className="md:col-span-2">
                                        <label htmlFor="notes" className="label-field">Notes</label>
                                        <textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="input-field"></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save Asset</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )}
    {/* View Asset Modal */}
    {modal.type === 'view' && modal.asset && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={closeModal}>
            <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full p-4" onClick={e => e.stopPropagation()}>
                <div className="relative w-full max-w-lg">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                        <div className="flex justify-between items-center p-4 rounded-t border-b dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Asset Details</h3>
                            <button onClick={closeModal} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">X</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modal.asset.name}</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Client</p><p className="text-gray-900 dark:text-white">{clientMap.get(modal.asset.clientId)}</p></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Asset Type</p><p className="text-gray-900 dark:text-white">{modal.asset.type}</p></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Purchase Date</p><p className="text-gray-900 dark:text-white">{new Date(modal.asset.purchaseDate).toLocaleDateString()}</p></div>
                                <div><p className="font-semibold text-gray-500 dark:text-gray-400">Warranty End</p><p className="text-gray-900 dark:text-white">{new Date(modal.asset.warrantyEndDate).toLocaleDateString()}</p></div>
                                {modal.asset.notes && <div className="col-span-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"><p className="font-semibold text-gray-500 dark:text-gray-400">Notes</p><p className="text-gray-900 dark:text-white whitespace-pre-wrap">{modal.asset.notes}</p></div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-end p-6 rounded-b border-t border-gray-200 dark:border-gray-600">
                            <button onClick={closeModal} type="button" className="btn-primary">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )}
     {/* Delete Confirmation Modal */}
    {modal.type === 'delete' && modal.asset && (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-40">
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="relative w-full max-w-md">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        <div className="p-6 text-center">
                             <svg aria-hidden="true" className="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete this asset?
                                <br/>
                                <span className="font-semibold text-gray-800 dark:text-white">"{modal.asset.name}"</span>
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