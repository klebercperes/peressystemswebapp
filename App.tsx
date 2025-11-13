import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClientManager } from './components/ClientManager';
import { TicketManager } from './components/TicketManager';
import { AssetManager } from './components/AssetManager';
import { AiAssistant } from './components/AiAssistant';
import { db } from './services/database';
import { View, Client, Ticket, Asset } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const refreshData = () => {
    setClients(db.getClients());
    setTickets(db.getTickets());
    setAssets(db.getAssets());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- Client Handlers ---
  const handleAddClient = (clientData: Omit<Client, 'id' | 'joinDate'>) => {
    db.addClient(clientData);
    refreshData();
  };
  const handleUpdateClient = (clientData: Client) => {
    db.updateClient(clientData);
    refreshData();
  };
  const handleDeleteClient = (clientId: string) => {
    db.deleteClient(clientId);
    refreshData();
  };

  // --- Ticket Handlers ---
  const handleAddTicket = (ticketData: Omit<Ticket, 'id' | 'createdDate'>) => {
    db.addTicket(ticketData);
    refreshData();
  };
  const handleUpdateTicket = (ticketData: Ticket) => {
    db.updateTicket(ticketData);
    refreshData();
  };
  const handleDeleteTicket = (ticketId: string) => {
    db.deleteTicket(ticketId);
    refreshData();
  };

  // --- Asset Handlers ---
  const handleAddAsset = (assetData: Omit<Asset, 'id'>) => {
    db.addAsset(assetData);
    refreshData();
  };
  const handleUpdateAsset = (assetData: Asset) => {
    db.updateAsset(assetData);
    refreshData();
  };
  const handleDeleteAsset = (assetId: string) => {
    db.deleteAsset(assetId);
    refreshData();
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

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;