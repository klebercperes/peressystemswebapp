import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClientManager } from './components/ClientManager';
import { TicketManager } from './components/TicketManager';
import { AssetManager } from './components/AssetManager';
import { AiAssistant } from './components/AiAssistant';
import { api } from './services/api';
import { View, Client, Ticket, Asset } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting to fetch data from API...');
      const [clientsData, ticketsData, assetsData] = await Promise.all([
        api.getClients(),
        api.getTickets(),
        api.getAssets(),
      ]);
      console.log('Data fetched successfully:', { clients: clientsData.length, tickets: ticketsData.length, assets: assetsData.length });
      setClients(clientsData);
      setTickets(ticketsData);
      setAssets(assetsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      console.error('Error refreshing data:', err);
      setError(errorMessage);
      // Make sure loading is set to false even on error
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('App component mounted, starting data refresh...');
    refreshData();
  }, []);

  // --- Client Handlers ---
  const handleAddClient = async (clientData: Omit<Client, 'id' | 'joinDate'>) => {
    try {
      await api.addClient(clientData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add client';
      setError(errorMessage);
      console.error('Error adding client:', err);
      throw err;
    }
  };

  const handleUpdateClient = async (clientData: Client) => {
    try {
      await api.updateClient(clientData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      console.error('Error updating client:', err);
      throw err;
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await api.deleteClient(clientId);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      console.error('Error deleting client:', err);
      throw err;
    }
  };

  // --- Ticket Handlers ---
  const handleAddTicket = async (ticketData: Omit<Ticket, 'id' | 'createdDate'>) => {
    try {
      await api.addTicket(ticketData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add ticket';
      setError(errorMessage);
      console.error('Error adding ticket:', err);
      throw err;
    }
  };

  const handleUpdateTicket = async (ticketData: Ticket) => {
    try {
      await api.updateTicket(ticketData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ticket';
      setError(errorMessage);
      console.error('Error updating ticket:', err);
      throw err;
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await api.deleteTicket(ticketId);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ticket';
      setError(errorMessage);
      console.error('Error deleting ticket:', err);
      throw err;
    }
  };

  // --- Asset Handlers ---
  const handleAddAsset = async (assetData: Omit<Asset, 'id'>) => {
    try {
      await api.addAsset(assetData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add asset';
      setError(errorMessage);
      console.error('Error adding asset:', err);
      throw err;
    }
  };

  const handleUpdateAsset = async (assetData: Asset) => {
    try {
      await api.updateAsset(assetData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      setError(errorMessage);
      console.error('Error updating asset:', err);
      throw err;
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await api.deleteAsset(assetId);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset';
      setError(errorMessage);
      console.error('Error deleting asset:', err);
      throw err;
    }
  };


  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard clients={clients} tickets={tickets} assets={assets} />;
      case 'clients':
        return (
          <ClientManager 
            clients={clients} 
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
          />
        );
      case 'tickets':
        return (
            <TicketManager 
                tickets={tickets} 
                clients={clients}
                onAddTicket={handleAddTicket}
                onUpdateTicket={handleUpdateTicket}
                onDeleteTicket={handleDeleteTicket}
            />
        );
      case 'assets':
        return (
            <AssetManager 
                assets={assets} 
                clients={clients} 
                onAddAsset={handleAddAsset}
                onUpdateAsset={handleUpdateAsset}
                onDeleteAsset={handleDeleteAsset}
            />
        );
      case 'ai-assistant':
        return <AiAssistant />;
      default:
        return <Dashboard clients={clients} tickets={tickets} assets={assets} />;
    }
  };

  // Show loading state only on initial load
  if (loading && clients.length === 0 && tickets.length === 0 && assets.length === 0 && !error) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading application data...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Connecting to API at {import.meta.env.VITE_API_URL || 'http://10.0.1.122:8000'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">If this takes too long, check the browser console (F12)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <div className="mt-3 space-x-2">
              <button
                onClick={() => {
                  setError(null);
                  refreshData();
                }}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;