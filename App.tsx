
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

  useEffect(() => {
    // Load initial data from our localStorage database
    setClients(db.getClients());
    setTickets(db.getTickets());
    setAssets(db.getAssets());
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard clients={clients} tickets={tickets} assets={assets} />;
      case 'clients':
        return <ClientManager clients={clients} />;
      case 'tickets':
        return <TicketManager tickets={tickets} clients={clients} />;
      case 'assets':
        return <AssetManager assets={assets} clients={clients} />;
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
