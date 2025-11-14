import { Client, Asset, Ticket, TicketStatus } from '../types';
import { authService } from './auth';

// API URL from environment variable (no hardcoded IPs)
// Default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get auth token and add to headers
    const authHeaders = authService.getAuthHeader();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
      // Add timeout to prevent hanging (using AbortController for better compatibility)
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 second timeout
        return controller.signal;
      })()
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        authService.logout();
        throw new Error('Session expired. Please login again.');
      }
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error(`Request timeout: Unable to reach API at ${API_BASE_URL}`);
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Network error: Cannot connect to API at ${API_BASE_URL}. Please check if the backend is running.`);
      }
    }
    throw error;
  }
}

// Convert backend date format to frontend format
function formatDate(dateString: string | Date): string {
  if (typeof dateString === 'string') {
    return dateString.split('T')[0];
  }
  return dateString.toISOString().split('T')[0];
}

// Convert frontend date format to backend format
function parseDate(dateString: string): string {
  return dateString;
}

export const api = {
  // ========== CLIENT METHODS ==========
  getClients: async (): Promise<Client[]> => {
    const clients = await apiCall<Client[]>(`/api/clients`);
    return clients.map(client => ({
      ...client,
      joinDate: formatDate(client.joinDate),
    }));
  },

  getClient: async (clientId: string): Promise<Client> => {
    const client = await apiCall<Client>(`/api/clients/${clientId}`);
    return {
      ...client,
      joinDate: formatDate(client.joinDate),
    };
  },

  addClient: async (client: Omit<Client, 'id' | 'joinDate'>): Promise<Client> => {
    const newClient = await apiCall<Client>(`/api/clients`, {
      method: 'POST',
      body: JSON.stringify(client),
    });
    return {
      ...newClient,
      joinDate: formatDate(newClient.joinDate),
    };
  },

  updateClient: async (client: Client): Promise<Client> => {
    const updatedClient = await apiCall<Client>(`/api/clients/${client.id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
    return {
      ...updatedClient,
      joinDate: formatDate(updatedClient.joinDate),
    };
  },

  deleteClient: async (clientId: string): Promise<void> => {
    await apiCall<void>(`/api/clients/${clientId}`, {
      method: 'DELETE',
    });
  },

  // ========== TICKET METHODS ==========
  getTickets: async (): Promise<Ticket[]> => {
    const tickets = await apiCall<Ticket[]>(`/api/tickets`);
    return tickets.map(ticket => ({
      ...ticket,
      createdDate: ticket.createdDate,
      resolvedDate: ticket.resolvedDate || undefined,
    }));
  },

  getTicket: async (ticketId: string): Promise<Ticket> => {
    return await apiCall<Ticket>(`/api/tickets/${ticketId}`);
  },

  getTicketsByClientId: async (clientId: string): Promise<Ticket[]> => {
    const tickets = await apiCall<Ticket[]>(`/api/clients/${clientId}/tickets`);
    return tickets.map(ticket => ({
      ...ticket,
      createdDate: ticket.createdDate,
      resolvedDate: ticket.resolvedDate || undefined,
    }));
  },

  addTicket: async (ticket: Omit<Ticket, 'id' | 'createdDate'>): Promise<Ticket> => {
    return await apiCall<Ticket>(`/api/tickets`, {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  },

  updateTicket: async (ticket: Ticket): Promise<Ticket> => {
    return await apiCall<Ticket>(`/api/tickets/${ticket.id}`, {
      method: 'PUT',
      body: JSON.stringify(ticket),
    });
  },

  deleteTicket: async (ticketId: string): Promise<void> => {
    await apiCall<void>(`/api/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },

  // ========== ASSET METHODS ==========
  getAssets: async (): Promise<Asset[]> => {
    const assets = await apiCall<Asset[]>(`/api/assets`);
    return assets.map(asset => ({
      ...asset,
      purchaseDate: formatDate(asset.purchaseDate),
      warrantyEndDate: formatDate(asset.warrantyEndDate),
    }));
  },

  getAsset: async (assetId: string): Promise<Asset> => {
    const asset = await apiCall<Asset>(`/api/assets/${assetId}`);
    return {
      ...asset,
      purchaseDate: formatDate(asset.purchaseDate),
      warrantyEndDate: formatDate(asset.warrantyEndDate),
    };
  },

  getAssetsByClientId: async (clientId: string): Promise<Asset[]> => {
    const assets = await apiCall<Asset[]>(`/api/clients/${clientId}/assets`);
    return assets.map(asset => ({
      ...asset,
      purchaseDate: formatDate(asset.purchaseDate),
      warrantyEndDate: formatDate(asset.warrantyEndDate),
    }));
  },

  addAsset: async (asset: Omit<Asset, 'id'>): Promise<Asset> => {
    const newAsset = await apiCall<Asset>(`/api/assets`, {
      method: 'POST',
      body: JSON.stringify(asset),
    });
    return {
      ...newAsset,
      purchaseDate: formatDate(newAsset.purchaseDate),
      warrantyEndDate: formatDate(newAsset.warrantyEndDate),
    };
  },

  updateAsset: async (asset: Asset): Promise<Asset> => {
    const updatedAsset = await apiCall<Asset>(`/api/assets/${asset.id}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    });
    return {
      ...updatedAsset,
      purchaseDate: formatDate(updatedAsset.purchaseDate),
      warrantyEndDate: formatDate(updatedAsset.warrantyEndDate),
    };
  },

  deleteAsset: async (assetId: string): Promise<void> => {
    await apiCall<void>(`/api/assets/${assetId}`, {
      method: 'DELETE',
    });
  },
};

