import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';

interface BusinessSettingsData {
  id?: string;
  trading_name?: string;
  business_name?: string;
  abn?: string;
  company_logo_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone_number?: string;
  mobile_number?: string;
  email_contact?: string;
  linkedin_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

interface BusinessSettingsProps {
  onClose?: () => void;
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<BusinessSettingsData>({
    country: 'Australia',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.1.122:8000';
      const authHeaders = authService.getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/business-settings`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.1.122:8000';
      const authHeaders = authService.getAuthHeader();
      
      if (!authHeaders['Authorization']) {
        throw new Error('Not authenticated. Please login again.');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/business-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save settings';
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setFormData(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      let errorMessage = 'Failed to save settings';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check for network errors
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network error: Cannot connect to server. Please check your connection and try again.';
        }
      }
      setError(errorMessage);
      console.error('Error saving business settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Business Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trading Name
              </label>
              <input
                type="text"
                name="trading_name"
                value={formData.trading_name || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Trading Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Business Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ABN
              </label>
              <input
                type="text"
                name="abn"
                value={formData.abn || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="ABN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo URL
              </label>
              <input
                type="url"
                name="company_logo_url"
                value={formData.company_logo_url || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Address</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                name="address_line1"
                value={formData.address_line1 || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Street Address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                name="address_line2"
                value={formData.address_line2 || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Unit, Suite, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Postcode"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country || 'Australia'}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="+61 2 1234 5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile_number"
                value={formData.mobile_number || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="+61 493 929 511"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Contact
              </label>
              <input
                type="email"
                name="email_contact"
                value={formData.email_contact || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="info@peres.systems"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://linkedin.com/company/peres-systems"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                name="instagram_url"
                value={formData.instagram_url || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://instagram.com/peres_systems"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook URL
              </label>
              <input
                type="url"
                name="facebook_url"
                value={formData.facebook_url || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://facebook.com/peres.systems"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X (Twitter) URL
              </label>
              <input
                type="url"
                name="twitter_url"
                value={formData.twitter_url || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://twitter.com/peres_systems"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;

