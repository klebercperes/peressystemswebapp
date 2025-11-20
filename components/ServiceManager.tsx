import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { authService } from '../services/auth';

interface Service {
  id: string;
  title: string;
  description: string;
  image_url: string;
  icon_name?: string;
  order: string;
  is_active: boolean;
  updated_at: string;
  created_at: string;
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

const EyeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const ServiceManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: ModalType; service: Service | null }>({ type: 'none', service: null });

  const initialFormState: Omit<Service, 'id' | 'updated_at' | 'created_at'> = {
    title: '',
    description: '',
    image_url: '',
    icon_name: '',
    order: '0',
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        headers: authService.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (modal.type === 'edit' && modal.service) {
      setFormData({
        title: modal.service.title,
        description: modal.service.description,
        image_url: modal.service.image_url,
        icon_name: modal.service.icon_name || '',
        order: modal.service.order,
        is_active: modal.service.is_active,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [modal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.image_url) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      };

      if (modal.type === 'edit' && modal.service) {
        const response = await fetch(`${API_BASE_URL}/api/services/${modal.service.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to update service');
      } else {
        const response = await fetch(`${API_BASE_URL}/api/services`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to create service');
      }

      await fetchServices();
      setModal({ type: 'none', service: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    }
  };

  const handleDelete = async () => {
    if (!modal.service) return;

    if (!window.confirm(`Are you sure you want to delete "${modal.service.title}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/services/${modal.service.id}`, {
        method: 'DELETE',
        headers: authService.getAuthHeader(),
      });
      if (!response.ok) throw new Error('Failed to delete service');
      await fetchServices();
      setModal({ type: 'none', service: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const openModal = (type: ModalType, service: Service | null = null) => {
    setModal({ type, service });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Services Management</h1>
        <button
          onClick={() => openModal('add')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Service
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
              <img
                src={service.image_url}
                alt={service.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                }}
              />
              {!service.is_active && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                  Inactive
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{service.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{service.description}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => openModal('view', service)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded"
                  title="View"
                >
                  <EyeIcon />
                </button>
                <button
                  onClick={() => openModal('edit', service)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded"
                  title="Edit"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => openModal('delete', service)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded"
                  title="Delete"
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal.type !== 'none' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {modal.type === 'add' && 'Add Service'}
                  {modal.type === 'edit' && 'Edit Service'}
                  {modal.type === 'view' && 'View Service'}
                  {modal.type === 'delete' && 'Delete Service'}
                </h2>
                <button
                  onClick={() => setModal({ type: 'none', service: null })}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modal.type === 'delete' && modal.service ? (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Are you sure you want to delete "{modal.service.title}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setModal({ type: 'none', service: null })}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : modal.type === 'view' && modal.service ? (
                <div className="space-y-4">
                  <div className="relative h-64 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={modal.service.image_url}
                      alt={modal.service.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <p className="text-gray-900 dark:text-white">{modal.service.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <p className="text-gray-900 dark:text-white">{modal.service.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                    <p className="text-gray-900 dark:text-white break-all">{modal.service.image_url}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
                    <p className="text-gray-900 dark:text-white">{modal.service.order}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <p className="text-gray-900 dark:text-white">{modal.service.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setModal({ type: 'none', service: null })}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      required
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {formData.image_url && (
                      <div className="mt-2 relative h-32 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="icon_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Icon Name
                    </label>
                    <input
                      type="text"
                      id="icon_name"
                      name="icon_name"
                      value={formData.icon_name}
                      onChange={handleInputChange}
                      placeholder="cloud, shield, database, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Display Order
                      </label>
                      <input
                        type="text"
                        id="order"
                        name="order"
                        value={formData.order}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'none', service: null })}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {modal.type === 'edit' ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

