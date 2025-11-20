import React, { useState, useEffect } from 'react';
import { authService, User } from '../services/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UserManagerProps {
  currentUser: User | null;
}

type ModalType = 'none' | 'create' | 'edit' | 'delete' | 'resetPassword';

interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  role: 'customer' | 'team';
  password: string;
  is_active: boolean;
  is_superuser: boolean;
  is_approved: boolean;
  email_verified: boolean;
}

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

const PlusIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{ type: ModalType; user: User | null }>({ type: 'none', user: null });
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    full_name: '',
    role: 'customer',
    password: '',
    is_active: true,
    is_superuser: false,
    is_approved: true,
    email_verified: true,
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username?.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.full_name?.toLowerCase().includes(term) ||
            user.role?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: 'customer',
      password: '',
      is_active: true,
      is_superuser: false,
      is_approved: true,
      email_verified: true,
    });
    setFormError('');
  };

  const openModal = (type: ModalType, user: User | null = null) => {
    setModal({ type, user });
    if (type === 'create') {
      resetForm();
    } else if (type === 'edit' && user) {
      setFormData({
        username: user.username || '',
        email: user.email,
        full_name: user.full_name || '',
        role: (user.role as 'customer' | 'team') || 'customer',
        password: '', // Don't pre-fill password
        is_active: user.is_active,
        is_superuser: user.is_superuser,
        is_approved: user.is_approved || false,
        email_verified: (user as any).email_verified || false,
      });
    }
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
    setFormError('');
  };

  const closeModal = () => {
    setModal({ type: 'none', user: null });
    resetForm();
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const userData: any = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name || undefined,
        role: formData.role,
        password: formData.password || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.user) return;

    setFormError('');
    setSaving(true);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const updateData: any = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name || undefined,
        role: formData.role,
        is_active: formData.is_active,
        is_superuser: formData.is_superuser,
        is_approved: formData.is_approved,
        email_verified: formData.email_verified,
      };

      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${modal.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update user');
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!modal.user) return;

    setFormError('');
    setDeleting(true);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${modal.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete user');
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!modal.user) return;

    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setResetting(true);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: modal.user.id,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setResetSuccess(data.message || 'Password reset successfully');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to approve user');
      }

      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    }
  };

  // Check if current user is admin
  if (!currentUser || !currentUser.is_superuser) {
    return (
      <div className="space-y-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Access Denied</p>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
          <div className="flex gap-2">
            <button
              onClick={() => openModal('create')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create User
            </button>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <input
            type="text"
            placeholder="Search users by username, email, name, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {filteredUsers.length === 0 && !loading && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>{searchTerm ? 'No users found matching your search.' : 'No users found.'}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Username</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Full Name</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Admin</th>
                  <th scope="col" className="px-6 py-3">Active</th>
                  <th scope="col" className="px-6 py-3">Approved</th>
                  <th scope="col" className="px-6 py-3">Email Verified</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {user.username || 'N/A'}
                      </td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.full_name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'team' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_superuser ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_approved ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(user as any).email_verified ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!user.is_approved && (
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                              title="Approve user"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => openModal('edit', user)}
                            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Edit user"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('delete', user)}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Delete user"
                            disabled={user.id === currentUser?.id}
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('resetPassword', user)}
                            className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            title="Reset password"
                          >
                            🔑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {(modal.type === 'create' || modal.type === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {modal.type === 'create' ? 'Create New User' : `Edit User: ${modal.user?.email}`}
            </h3>
            {formError && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {formError}
              </div>
            )}
            <form onSubmit={modal.type === 'create' ? handleCreateUser : handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    id="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'customer' | 'team' })}
                  >
                    <option value="customer">Customer</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password {modal.type === 'create' ? '*' : '(leave blank to keep current)'}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required={modal.type === 'create'}
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={modal.type === 'edit' ? 'Leave blank to keep current password' : ''}
                  />
                </div>
              </div>

              {modal.type === 'edit' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.is_superuser}
                      onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Admin</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.is_approved}
                      onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Approved</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.email_verified}
                      onChange={(e) => setFormData({ ...formData, email_verified: e.target.checked })}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email Verified</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : modal.type === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modal.type === 'delete' && modal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete User
            </h3>
            {formError && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {formError}
              </div>
            )}
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete user <strong>{modal.user.email}</strong>? This action cannot be undone.
            </p>
            {modal.user.id === currentUser?.id && (
              <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                You cannot delete your own account.
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting || modal.user.id === currentUser?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {modal.type === 'resetPassword' && modal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reset Password for {modal.user.email}
            </h3>
            {resetSuccess && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {resetSuccess}
              </div>
            )}
            {resetError && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {resetError}
              </div>
            )}
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password (min 8 characters)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
