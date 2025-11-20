import React, { useState, useEffect } from 'react';
import { User } from '../services/auth';
import { api } from '../services/api';
import { authService } from '../services/auth';

interface MyProfileProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    username: currentUser.username || '',
    email: currentUser.email || '',
    full_name: currentUser.full_name || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData({
      username: currentUser.username || '',
      email: currentUser.email || '',
      full_name: currentUser.full_name || '',
    });
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaveMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updatedUser = await api.updateCurrentUser(formData);
      // Update the cached user
      authService.setUser(updatedUser);
      onUpdateUser(updatedUser);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setSaveMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show any permission errors - this page is for users to edit their own profile
  // All authenticated users should be able to access this page
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {saveMessage && (
            <div className={`p-4 rounded-lg ${
              saveMessage.type === 'success' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
            }`}>
              {saveMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter email"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="full_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="submit"
              disabled={isSaving}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">User ID</p>
            <p className="text-gray-900 dark:text-white">{currentUser.id}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">Role</p>
            <p className="text-gray-900 dark:text-white capitalize">{currentUser.role || 'customer'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">Email Verified</p>
            <p className="text-gray-900 dark:text-white">{currentUser.email_verified ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">Account Created</p>
            <p className="text-gray-900 dark:text-white">{new Date(currentUser.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

