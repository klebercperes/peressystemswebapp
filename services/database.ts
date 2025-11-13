import { Client, Asset, Ticket, TicketStatus } from '../types';

const LS_KEYS = {
  CLIENTS: 'msp_clients',
  ASSETS: 'msp_assets',
  TICKETS: 'msp_tickets',
};

// --- Helper Functions ---
const getFromLS = <T,>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return [];
  }
};

const saveToLS = <T,>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

// --- Sample Data and Initialization ---
const getInitialClients = (): Client[] => [
  { id: 'cli-1', name: 'Innovate Corp', abn: '53 004 085 616', contactPerson: 'Alice Johnson', email: 'alice@innovate.com', phone: '123-456-7890', mobilePhone: '0412 345 678', address: '123 Innovation Dr, Tech City', joinDate: '2023-01-15', details: 'VIP client, prioritize all tickets. Server maintenance due in Q3.' },
  { id: 'cli-2', name: 'Data Systems Ltd.', abn: '63 008 433 795', contactPerson: 'Bob Williams', email: 'bob@datasystems.com', phone: '234-567-8901', mobilePhone: '0423 456 789', address: '456 Data Ave, Silicon Valley', joinDate: '2022-11-20', details: 'Uses legacy software that requires special attention.' },
  { id: 'cli-3', name: 'Quantum Solutions', abn: '11 000 014 675', contactPerson: 'Charlie Brown', email: 'charlie@quantum.com', phone: '345-678-9012', mobilePhone: '0434 567 890', address: '789 Quantum Way, Physics Town', joinDate: '2023-05-10', details: '' },
];

const getInitialAssets = (): Asset[] => [
    { id: 'ast-1', clientId: 'cli-1', name: 'Dell XPS 15', type: 'Laptop', purchaseDate: '2023-02-01', warrantyEndDate: '2026-02-01', notes: 'Primary laptop for Alice Johnson.' },
    { id: 'ast-2', clientId: 'cli-1', name: 'HP LaserJet Pro', type: 'Printer', purchaseDate: '2023-01-20', warrantyEndDate: '2025-01-20' },
    { id: 'ast-3', clientId: 'cli-2', name: 'Main File Server', type: 'Server', purchaseDate: '2022-12-01', warrantyEndDate: '2027-12-01', notes: 'RAID 5 configuration. 4x 4TB drives.' },
    { id: 'ast-4', clientId: 'cli-3', name: 'MacBook Pro 16', type: 'Laptop', purchaseDate: '2023-06-01', warrantyEndDate: '2026-06-01' },
];

const getInitialTickets = (): Ticket[] => [
    { id: 'tkt-1', clientId: 'cli-1', title: 'Cannot connect to WiFi', description: 'Users in the main office cannot connect to the "Innovate-Guest" WiFi network.', status: TicketStatus.Open, createdDate: new Date().toISOString() },
    { id: 'tkt-2', clientId: 'cli-2', title: 'Printer is offline', description: 'The main office printer is not responding to print jobs.', status: TicketStatus.InProgress, createdDate: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tkt-3', clientId: 'cli-3', title: 'Software installation request', description: 'Need to install Adobe Creative Suite on a new MacBook Pro.', status: TicketStatus.Completed, createdDate: new Date(Date.now() - 172800000).toISOString(), resolvedDate: new Date().toISOString() },
    { id: 'tkt-4', clientId: 'cli-1', title: 'Server backup failed', description: 'The nightly backup job for the main file server failed with an authentication error.', status: TicketStatus.Paused, createdDate: new Date(Date.now() - 259200000).toISOString() },
];

const initializeData = () => {
  if (!localStorage.getItem(LS_KEYS.CLIENTS)) saveToLS(LS_KEYS.CLIENTS, getInitialClients());
  if (!localStorage.getItem(LS_KEYS.ASSETS)) saveToLS(LS_KEYS.ASSETS, getInitialAssets());
  if (!localStorage.getItem(LS_KEYS.TICKETS)) saveToLS(LS_KEYS.TICKETS, getInitialTickets());
};

initializeData();

// --- API ---
export const db = {
  // Clients
  getClients: (): Client[] => getFromLS<Client>(LS_KEYS.CLIENTS),
  addClient: (client: Omit<Client, 'id' | 'joinDate'>): Client => {
    const clients = getFromLS<Client>(LS_KEYS.CLIENTS);
    const newClient: Client = {
      ...client,
      id: `cli-${Date.now()}`,
      joinDate: new Date().toISOString().split('T')[0],
    };
    saveToLS(LS_KEYS.CLIENTS, [...clients, newClient]);
    return newClient;
  },
  updateClient: (updatedClient: Client): Client | undefined => {
    const clients = getFromLS<Client>(LS_KEYS.CLIENTS);
    const clientIndex = clients.findIndex(c => c.id === updatedClient.id);
    if (clientIndex > -1) {
      clients[clientIndex] = updatedClient;
      saveToLS(LS_KEYS.CLIENTS, clients);
      return clients[clientIndex];
    }
    return undefined;
  },
  deleteClient: (clientId: string): void => {
    let clients = getFromLS<Client>(LS_KEYS.CLIENTS);
    clients = clients.filter(c => c.id !== clientId);
    saveToLS(LS_KEYS.CLIENTS, clients);
  },

  // Assets
  getAssets: (): Asset[] => getFromLS<Asset>(LS_KEYS.ASSETS),
  getAssetsByClientId: (clientId: string): Asset[] => getFromLS<Asset>(LS_KEYS.ASSETS).filter(a => a.clientId === clientId),
  addAsset: (asset: Omit<Asset, 'id'>): Asset => {
    const assets = getFromLS<Asset>(LS_KEYS.ASSETS);
    const newAsset: Asset = { ...asset, id: `ast-${Date.now()}` };
    saveToLS(LS_KEYS.ASSETS, [...assets, newAsset]);
    return newAsset;
  },
  updateAsset: (updatedAsset: Asset): Asset | undefined => {
    const assets = getFromLS<Asset>(LS_KEYS.ASSETS);
    const assetIndex = assets.findIndex(a => a.id === updatedAsset.id);
    if (assetIndex > -1) {
      assets[assetIndex] = updatedAsset;
      saveToLS(LS_KEYS.ASSETS, assets);
      return assets[assetIndex];
    }
    return undefined;
  },
  deleteAsset: (assetId: string): void => {
    let assets = getFromLS<Asset>(LS_KEYS.ASSETS);
    assets = assets.filter(a => a.id !== assetId);
    saveToLS(LS_KEYS.ASSETS, assets);
  },

  // Tickets
  getTickets: (): Ticket[] => getFromLS<Ticket>(LS_KEYS.TICKETS),
  getTicketsByClientId: (clientId: string): Ticket[] => getFromLS<Ticket>(LS_KEYS.TICKETS).filter(t => t.clientId === clientId),
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdDate'>): Ticket => {
    const tickets = getFromLS<Ticket>(LS_KEYS.TICKETS);
    const newTicket: Ticket = {
      ...ticket,
      id: `tkt-${Date.now()}`,
      createdDate: new Date().toISOString(),
    };
    saveToLS(LS_KEYS.TICKETS, [...tickets, newTicket]);
    return newTicket;
  },
  updateTicket: (updatedTicket: Ticket): Ticket | undefined => {
    const tickets = getFromLS<Ticket>(LS_KEYS.TICKETS);
    const ticketIndex = tickets.findIndex(t => t.id === updatedTicket.id);
    if (ticketIndex > -1) {
      const isNowResolved = updatedTicket.status === TicketStatus.Completed || updatedTicket.status === TicketStatus.Closed;
      // If the ticket wasn't resolved before but is now, set the resolvedDate
      if (!tickets[ticketIndex].resolvedDate && isNowResolved) {
        updatedTicket.resolvedDate = new Date().toISOString();
      }
      // If the ticket was resolved but is now being re-opened, clear the resolvedDate
      if (tickets[ticketIndex].resolvedDate && !isNowResolved) {
        delete updatedTicket.resolvedDate;
      }
      tickets[ticketIndex] = updatedTicket;
      saveToLS(LS_KEYS.TICKETS, tickets);
      return tickets[ticketIndex];
    }
    return undefined;
  },
  deleteTicket: (ticketId: string): void => {
    let tickets = getFromLS<Ticket>(LS_KEYS.TICKETS);
    tickets = tickets.filter(t => t.id !== ticketId);
    saveToLS(LS_KEYS.TICKETS, tickets);
  },
};